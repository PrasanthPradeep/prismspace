// src/index.ts
import express from "express";
import { createRequire } from "module";

// src/middleware/cors.ts
import cors from "cors";
var allowedOriginsEnv = process.env.ALLOWED_ORIGINS ?? "";
var allowedOrigins = allowedOriginsEnv ? allowedOriginsEnv.split(",").map((o) => o.trim()).filter(Boolean) : [];
var isDev = process.env.NODE_ENV !== "production";
var corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (isDev) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin "${origin}" is not allowed`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Prism-Secret", "Authorization"],
  maxAge: 600
});

// src/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
var windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 6e4);
var max = Number(process.env.RATE_LIMIT_MAX ?? 30);
var rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many requests. Please slow down and try again in a moment."
  },
  // Trust Cloud Run's proxy headers for correct IP detection
  skip: (req) => req.path === "/health"
});

// src/middleware/errorHandler.ts
var isDev2 = process.env.NODE_ENV !== "production";
function errorHandler(err, _req, res, _next) {
  const message = isDev2 ? err.message : "An internal error occurred. Please try again.";
  res.status(500).json({ ok: false, error: message });
}

// src/middleware/auth.ts
import admin from "firebase-admin";
var EXTENSION_SECRET = process.env.EXTENSION_SECRET;
var isDev3 = process.env.NODE_ENV !== "production";
var UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function authMiddleware(req, res, next) {
  if (req.path === "/health") {
    next();
    return;
  }
  if (EXTENSION_SECRET) {
    const provided = req.headers["x-prism-secret"];
    if (provided !== EXTENSION_SECRET) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
  } else if (!isDev3) {
    res.status(500).json({
      ok: false,
      error: "Server configuration error: EXTENSION_SECRET is not set."
    });
    return;
  }
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (req.body) {
        req.body.userId = decodedToken.uid;
      }
      req.user = decodedToken;
    } catch (err) {
      const logger = req.log || console;
      logger.error({ err }, "Firebase token verification failed");
      res.status(401).json({
        ok: false,
        error: `Unauthorized: Invalid Firebase ID token. ${err.message || ""}`
      });
      return;
    }
  } else {
    if (req.body && req.body.userId) {
      const userId = req.body.userId;
      if (!UUID_V4_REGEX.test(userId)) {
        res.status(401).json({
          ok: false,
          error: "Unauthorized: Anonymous userId must be in UUID v4 format."
        });
        return;
      }
    }
  }
  next();
}

// src/providers/geminiProvider.ts
import { GoogleGenAI } from "@google/genai";
var DEFAULT_MODEL = "gemini-2.0-flash";
var DEFAULT_MAX_TOKENS = 2500;
var DEFAULT_TEMPERATURE = 0.55;
var GeminiProvider = class {
  name = "gemini";
  client;
  model;
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }
  async chat(messages, options = {}) {
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");
    const lastUserMessage = conversationMessages.at(-1);
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      throw new Error("Last message must be a user message");
    }
    const history = conversationMessages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const chat = this.client.chats.create({
      model: this.model,
      config: {
        systemInstruction: systemMessage?.content,
        maxOutputTokens: maxTokens,
        temperature
      },
      history
    });
    const response = await chat.sendMessage({
      message: lastUserMessage.content
    });
    const text = response.text;
    if (!text || !text.trim()) {
      throw new Error("Gemini returned an empty response");
    }
    return text.trim();
  }
};

// src/providers/groqProvider.ts
import Groq from "groq-sdk";
var DEFAULT_MODEL2 = "openai/gpt-oss-120b";
var DEFAULT_MAX_TOKENS2 = 2500;
var DEFAULT_TEMPERATURE2 = 0.55;
var GroqProvider = class {
  name = "groq";
  client;
  model;
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    this.client = new Groq({ apiKey });
    this.model = process.env.GROQ_MODEL ?? DEFAULT_MODEL2;
  }
  async chat(messages, options = {}) {
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS2;
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE2;
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
      max_completion_tokens: maxTokens,
      temperature,
      top_p: 1
    });
    const content = completion.choices[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error("Groq returned an empty response");
    }
    return content.trim();
  }
};

// src/providers/groqProxyProvider.ts
var DEFAULT_PROXY_URL = "https://prism-ai-browser-api-hcb9hra7e8eecjca.centralindia-01.azurewebsites.net/api/prism_groq_devspace";
var DEFAULT_MODEL3 = "openai/gpt-oss-120b";
var DEFAULT_MAX_TOKENS3 = 2500;
var DEFAULT_TEMPERATURE3 = 0.55;
function extractProxyError(payload, fallback) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = payload.error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return fallback;
}
function parseSseResponse(text) {
  let output = "";
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) continue;
    const data = trimmed.slice(6).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      output += parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || "";
    } catch {
    }
  }
  return output.trim();
}
var GroqProxyProvider = class {
  name = "groq-proxy";
  proxyUrl;
  model;
  constructor() {
    this.proxyUrl = process.env.GROQ_PROXY_URL || DEFAULT_PROXY_URL;
    this.model = process.env.GROQ_MODEL ?? DEFAULT_MODEL3;
  }
  async chat(messages, options = {}) {
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS3;
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE3;
    const response = await fetch(this.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        max_completion_tokens: maxTokens,
        temperature,
        top_p: 1,
        reasoning_effort: "medium"
      })
    });
    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = void 0;
      }
      throw new Error(extractProxyError(payload, `Groq proxy request failed with status ${response.status}`));
    }
    let content = "";
    if (contentType.includes("application/json")) {
      const payload = JSON.parse(text);
      content = payload.choices?.[0]?.message?.content || "";
    } else {
      content = text.includes("data: ") ? parseSseResponse(text) : text;
    }
    if (!content.trim()) {
      throw new Error("Groq proxy returned an empty response");
    }
    return content.trim();
  }
};

// src/providers/providerFactory.ts
var SUPPORTED_PROVIDERS = ["gemini", "groq", "groq-proxy"];
var _providers = /* @__PURE__ */ new Map();
function normalizeProviderName(value, fallback) {
  const name = (value || fallback).toLowerCase();
  if (name === "gemini" || name === "groq" || name === "groq-proxy" || name === "groq_proxy") {
    if (name === "groq_proxy") return "groq-proxy";
    return name;
  }
  throw new Error(
    `Unknown AI provider "${name}". Valid options: gemini, groq, groq-proxy. Set AI_PROVIDER or AI_FALLBACK_PROVIDERS to supported provider names.`
  );
}
function hasProviderKey(name) {
  if (name === "gemini") {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here";
  }
  if (name === "groq") {
    return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your-groq-api-key-here";
  }
  return !!(process.env.GROQ_PROXY_URL || true);
}
function createProvider(name) {
  switch (name) {
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    case "groq-proxy":
      return new GroqProxyProvider();
  }
}
function getProvider(name = getPrimaryProviderName()) {
  if (_providers.has(name)) {
    return _providers.get(name);
  }
  const provider = createProvider(name);
  _providers.set(name, provider);
  return provider;
}
function getPrimaryProviderName() {
  return normalizeProviderName(process.env.AI_PROVIDER, "gemini");
}
function getProviderOrder() {
  const primary = getPrimaryProviderName();
  const explicitFallbacks = (process.env.AI_FALLBACK_PROVIDERS || "groq,groq-proxy").split(",").map((name) => name.trim()).filter(Boolean).map((name) => normalizeProviderName(name, primary));
  const implicitFallbacks = SUPPORTED_PROVIDERS.filter((name) => name !== primary && hasProviderKey(name));
  return [.../* @__PURE__ */ new Set([primary, ...explicitFallbacks, ...implicitFallbacks])];
}
function getConfiguredProviders() {
  const primary = getPrimaryProviderName();
  const order = getProviderOrder();
  return SUPPORTED_PROVIDERS.map((name) => ({
    name,
    configured: hasProviderKey(name),
    primary: name === primary,
    fallback: order.includes(name) && name !== primary,
    model: name === "gemini" ? process.env.GEMINI_MODEL || "gemini-2.0-flash" : process.env.GROQ_MODEL || "openai/gpt-oss-120b"
  }));
}

// src/routes/assistant.ts
import { Router } from "express";
import { ZodError } from "zod";

// src/providers/providerErrors.ts
function rawMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown provider error";
  }
}
function parseProviderPayload(message) {
  const trimmed = message.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}
function classifyProviderError(error, providerName = "AI provider") {
  const message = rawMessage(error);
  const payload = parseProviderPayload(message);
  const providerMessage = payload?.error?.message || message;
  const providerStatus = payload?.error?.status || "";
  const providerCode = Number(payload?.error?.code || 0);
  const searchable = `${providerStatus} ${providerCode} ${providerMessage}`.toLowerCase();
  if (providerCode === 429 || searchable.includes("resource_exhausted") || searchable.includes("quota") || searchable.includes("billing") || searchable.includes("prepayment credits")) {
    return {
      status: 402,
      kind: "quota",
      message: `The configured ${providerName} account is out of quota or billing credits. Add credits or switch to another configured provider.`
    };
  }
  if (searchable.includes("api key") || searchable.includes("environment variable") || searchable.includes("not set")) {
    return {
      status: 503,
      kind: "configuration",
      message: "The AI provider is not configured on the backend. Check the provider API key environment variable."
    };
  }
  if (providerMessage && providerMessage !== "Unknown provider error") {
    return {
      status: 502,
      kind: "provider",
      message: `The AI provider returned an error: ${providerMessage}`
    };
  }
  return {
    status: 502,
    kind: "unknown",
    message: "The AI provider is unavailable. Please try again later."
  };
}

// src/prompts/systemPrompts.ts
var BASE_ASSISTANT = "You are Prism, a concise page-aware AI assistant inside a browser extension. Use only the page context supplied in the user message unless the user asks for general reasoning. Do not invent facts that are not present in the page context. Format answers with clear headings and short bullets when useful.";
var SYSTEM_PROMPTS = {
  chat: BASE_ASSISTANT,
  summarize: `${BASE_ASSISTANT} Return exactly three sections in your response: **TL;DR** (one short paragraph), **Key Insights** (3\u20137 bullet points), and **Action Items** (what the reader should do next, if any).`,
  notes: `${BASE_ASSISTANT} Create structured study notes from the page content. Include: a brief overview, key definitions, important concepts with explanations, notable examples, and revision prompts (questions the reader should be able to answer).`,
  "explain-selection": `${BASE_ASSISTANT} The user has selected specific text from the page. Explain the selected text in plain, simple terms. Then, if helpful, connect it to the broader context of the page.`,
  save: `${BASE_ASSISTANT} Create a compact saved-page record with exactly two clearly labelled sections: **Summary** (a 2\u20134 sentence overview of the page) and **Notes** (5\u201310 bullet points of the most useful information).`,
  interview: `${BASE_ASSISTANT} Generate a set of interview questions based on the content of this page. Include a mix of: conceptual understanding questions, practical application questions, and one or two deeper "why / how" questions. Group them by difficulty: Basic, Intermediate, Advanced. Do not include answers \u2014 only the questions.`
};
var DEV_TOOL_PROMPTS = {
  "code-explain-brief": "You are an expert code educator. Briefly explain what the provided code does. Give a short 2\u20134 sentence overview. Output only the explanation, no preamble.",
  "code-explain-lineby": "You are an expert code educator. Explain the provided code line by line. For each meaningful line or block, explain what it does. Use numbered steps. Output only the explanation.",
  "code-explain-teach": "You are a patient programming teacher explaining code to a complete beginner. Explain the concept, what each part does, and why it matters. Use simple analogies. Output only the explanation.",
  "code-translate": (ctx) => `You are an expert polyglot programmer. Convert the code from ${ctx.fromLang} to idiomatic ${ctx.toLang}. Preserve the logic exactly. Output only the converted code, no explanation.`,
  "code-translate-diff": (ctx) => `You are an expert polyglot programmer. Convert the code from ${ctx.fromLang} to idiomatic ${ctx.toLang}. After the converted code, add a section titled "Key Differences" explaining the important idiom and pattern differences between the two languages.`,
  "writing-improve": "You are an expert writing coach. Improve the given text: make it clearer, more engaging, and polished. Maintain the original meaning. Output only the improved text.",
  "writing-simplify": "You are a writing simplification expert. Rewrite the text in simpler language for everyone. Use shorter sentences and common words. Output only the simplified text.",
  "writing-formal": "You are a professional writer. Transform the text into a formal, professional tone suitable for business or academic contexts. Output only the formal version.",
  "writing-casual": "You are a friendly conversational writer. Transform the text into a casual, warm, approachable tone. Output only the casual version.",
  "writing-grammar": "You are a grammar expert and proofreader. Fix all grammar, spelling, punctuation, and style errors. Preserve the original meaning and tone. Output only the corrected text.",
  "writing-summarize": "You are an expert summarizer. Create a concise summary capturing key points in 1\u20133 paragraphs. Output only the summary.",
  "writing-translate": (ctx) => `You are a professional translator. Translate the given text to ${ctx.targetLang}. Output only the translation.`,
  "language-conversation": (ctx) => `You are a friendly ${ctx.targetLang} language tutor having a conversation with a learner. Always reply in ${ctx.targetLang}. Keep responses natural and appropriately paced for a learner. After each reply, optionally add a brief vocabulary note in parentheses if a word might be unfamiliar.`,
  "language-translate": (ctx) => `You are a professional translator. Translate the given text to ${ctx.targetLang}. After the translation, briefly explain any idiomatic expressions, cultural nuances, or grammar points.`,
  "language-grammar": (ctx) => `You are a ${ctx.targetLang} grammar expert. Check the given sentence for grammar errors. List corrections with explanations. If the sentence is correct, say so.`,
  "language-vocab": (ctx) => `You are a ${ctx.targetLang} language teacher. Generate exactly 10 useful vocabulary words about the given topic. Format each word as: **word** \u2014 pronunciation \u2014 English meaning \u2014 example sentence.`,
  "decision-analyze": "You are an expert decision analyst using structured reasoning. Analyze the decision provided by comparing each option against the criteria. Think step by step. Provide: a scored comparison matrix, key trade-offs, risks for each option, and a clear recommendation with rationale. Use markdown formatting.",
  "prompt-synthesize": "You are an expert prompt engineer. Improve the given prompt to make it clearer, more specific, and more effective. Return the improved prompt followed by a brief explanation of what you changed and why."
};
function getSystemPrompt(key, context = {}) {
  const assistantPrompt = SYSTEM_PROMPTS[key];
  if (assistantPrompt) return assistantPrompt;
  const devPrompt = DEV_TOOL_PROMPTS[key];
  if (!devPrompt) {
    throw new Error(`Unknown prompt key: "${key}". No system prompt found.`);
  }
  return typeof devPrompt === "function" ? devPrompt(context) : devPrompt;
}

// src/services/localAssistantFallback.ts
var MAX_SENTENCES = 8;
var STOPWORDS = /* @__PURE__ */ new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "being",
  "between",
  "built",
  "could",
  "every",
  "from",
  "have",
  "helps",
  "into",
  "more",
  "page",
  "that",
  "their",
  "there",
  "this",
  "through",
  "with",
  "without",
  "your"
]);
function cleanText(value) {
  return value.replace(/\[Content truncated to fit the assistant context window\.\]/gi, "").replace(/\s+/g, " ").trim();
}
function getSourceText(request) {
  if (request.action === "explain-selection" && request.selectedText) {
    return cleanText(request.selectedText);
  }
  return cleanText(request.extractedPageContent || request.selectedText || request.userQuery || "");
}
function splitSentences(text) {
  const seen = /* @__PURE__ */ new Set();
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter((part) => part.length >= 24 && part.length <= 320).filter((part) => {
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (sentences.length > 0) {
    return sentences.slice(0, MAX_SENTENCES);
  }
  return text ? [text.slice(0, 320)] : [];
}
function keywords(text) {
  const counts = /* @__PURE__ */ new Map();
  const words = text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [];
  for (const word of words) {
    if (STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([word]) => word);
}
function bullets(items, fallback) {
  const selected = items.length > 0 ? items : [fallback];
  return selected.map((item) => `- ${item}`).join("\n");
}
function notice(reason) {
  return [
    "AI provider unavailable. Prism used a local page-text fallback instead.",
    reason ? `Reason: ${reason}` : ""
  ].filter(Boolean).join("\n");
}
function buildPageAssistantFallback(request, reason) {
  const sourceText = getSourceText(request);
  const sentences = splitSentences(sourceText);
  const terms = keywords(sourceText);
  const title = request.pageTitle ? ` for "${request.pageTitle}"` : "";
  if (!sourceText) {
    return `${notice(reason)}

I could not find enough readable page text to build a local response.`;
  }
  switch (request.action) {
    case "notes":
      return `${notice(reason)}

Structured Notes${title}

Main Points
${bullets(sentences.slice(0, 6), "No clear main points were found in the captured page text.")}

Key Terms
${bullets(terms, "No repeated key terms were found.")}`;
    case "save":
      return `${notice(reason)}

Summary:
${sentences[0] || sourceText.slice(0, 240)}

Notes:
${bullets(sentences.slice(1, 6), "No additional notes were found in the captured page text.")}`;
    case "explain-selection":
      return `${notice(reason)}

Simple Explanation
${sentences[0] || sourceText.slice(0, 240)}

Important Details
${bullets(sentences.slice(1, 5), "No additional selected-text details were found.")}`;
    case "interview":
      return `${notice(reason)}

Interview Questions${title}

${bullets(
        [
          ...terms.slice(0, 5).map((term) => `How would you explain the role of ${term} in this page?`),
          "What is the main problem or promise described by this page?",
          "Which detail from the page would you verify before making a decision?"
        ].slice(0, 7),
        "What is the main idea of this page?"
      )}`;
    case "chat":
      return `${notice(reason)}

Best Available Answer${title}

${sentences[0] || sourceText.slice(0, 240)}

Relevant Page Details
${bullets(sentences.slice(1, 6), "No additional page details were found.")}`;
    case "summarize":
    default:
      return `${notice(reason)}

TL;DR${title}
${sentences[0] || sourceText.slice(0, 240)}

Key Insights
${bullets(sentences.slice(1, 6), "No additional insights were found in the captured page text.")}

Action Items
- Review the page details above.
- Retry the AI request after backend quota or billing is restored.`;
  }
}

// src/prompts/userPromptBuilder.ts
function buildPageAssistantUserPrompt(context) {
  return JSON.stringify(
    {
      pageTitle: context.pageTitle || "",
      pageUrl: context.pageUrl || "",
      extractedPageContent: context.extractedPageContent || "",
      selectedText: context.selectedText || "",
      userQuery: context.userQuery || ""
    },
    null,
    2
  );
}
function buildDevToolUserPrompt(input) {
  return input.trim();
}

// src/repositories/firestoreRepository.ts
import admin3 from "firebase-admin";

// src/services/firestore.ts
import admin2 from "firebase-admin";
if (admin2.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (projectId) {
    console.log(`Initializing Firebase Admin for project: ${projectId}`);
  } else {
    console.log("Initializing Firebase Admin using Application Default Credentials (ADC)");
  }
  admin2.initializeApp({
    projectId
  });
}
var db = admin2.firestore();

// src/repositories/firestoreRepository.ts
async function ensureUserExists(userId) {
  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      id: userId,
      createdAt: admin3.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin3.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await userRef.update({
      lastActiveAt: admin3.firestore.FieldValue.serverTimestamp()
    });
  }
}
async function savePage(userId, data) {
  await ensureUserExists(userId);
  const docId = `${userId}_${Buffer.from(data.url).toString("base64url")}`;
  const pageRef = db.collection("saved_pages").doc(docId);
  await pageRef.set(
    {
      userId,
      url: data.url,
      title: data.title,
      summary: data.summary,
      notes: data.notes,
      createdAt: admin3.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}
async function saveSummary(userId, data) {
  await ensureUserExists(userId);
  const docId = `${userId}_${Buffer.from(data.url).toString("base64url")}`;
  const pageRef = db.collection("saved_pages").doc(docId);
  await pageRef.set(
    {
      userId,
      url: data.url,
      title: data.title,
      summary: data.summary,
      createdAt: admin3.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}
async function saveNote(userId, data) {
  await ensureUserExists(userId);
  await db.collection("notes").add({
    userId,
    pageUrl: data.pageUrl,
    pageTitle: data.pageTitle,
    content: data.content,
    createdAt: admin3.firestore.FieldValue.serverTimestamp()
  });
}
async function saveChat(userId, data) {
  await ensureUserExists(userId);
  await db.collection("chat_history").add({
    userId,
    pageUrl: data.pageUrl,
    query: data.query,
    response: data.response,
    timestamp: admin3.firestore.FieldValue.serverTimestamp()
  });
}

// src/validation/schemas.ts
import { z } from "zod";
var MAX_CONTENT_CHARS = 24e3;
var MAX_QUERY_CHARS = 2e3;
var MAX_TEXT_CHARS = 5e4;
var pageAssistantActions = [
  "chat",
  "summarize",
  "notes",
  "explain-selection",
  "save",
  "interview"
];
var PageAssistantRequestSchema = z.object({
  action: z.enum(pageAssistantActions).optional().default("chat"),
  pageTitle: z.string().max(512).optional().default(""),
  pageUrl: z.string().max(2048).optional().default(""),
  extractedPageContent: z.string().max(MAX_CONTENT_CHARS, `Page content must not exceed ${MAX_CONTENT_CHARS} characters`).optional().default(""),
  selectedText: z.string().max(MAX_QUERY_CHARS, `Selected text must not exceed ${MAX_QUERY_CHARS} characters`).optional().default(""),
  userQuery: z.string().max(MAX_QUERY_CHARS, `User query must not exceed ${MAX_QUERY_CHARS} characters`).optional().default(""),
  userId: z.string().max(128).optional()
});
var SavePageRequestSchema = z.object({
  userId: z.string().min(1).max(128),
  url: z.string().max(2048),
  title: z.string().max(512),
  summary: z.string().max(1e5),
  notes: z.string().max(1e5).optional().default("")
});
var DevToolRequestSchema = z.object({
  /** The prompt key to look up in systemPrompts.ts */
  promptKey: z.string().min(1).max(64),
  /** The user's input text for the tool */
  input: z.string().min(1, "Input text is required").max(MAX_TEXT_CHARS, `Input must not exceed ${MAX_TEXT_CHARS} characters`),
  /** Optional context variables for dynamic prompts (e.g., targetLang) */
  context: z.record(z.string(), z.string()).optional().default({})
});

// src/routes/assistant.ts
var router = Router();
var ACTION_TO_PROMPT_KEY = {
  chat: "chat",
  summarize: "summarize",
  notes: "notes",
  "explain-selection": "explain-selection",
  save: "save",
  interview: "interview"
};
async function chatWithFallback(messages, logger) {
  const attempts = [];
  for (const providerName of getProviderOrder()) {
    try {
      const provider = getProvider(providerName);
      const content = await provider.chat(messages);
      if (attempts.length > 0) {
        logger.warn({ provider: providerName, attempts }, "AI provider fallback succeeded");
      }
      return { content, providerName: provider.name };
    } catch (err) {
      const providerError = classifyProviderError(err, providerName);
      attempts.push({ provider: providerName, error: providerError });
      logger.error({ err, provider: providerName, providerError }, "AI provider attempt failed");
    }
  }
  const lastAttempt = attempts.at(-1);
  const fallbackError = lastAttempt?.error || {
    status: 503,
    kind: "configuration",
    message: "No configured AI provider is available."
  };
  throw Object.assign(new Error(fallbackError.message), {
    providerError: fallbackError,
    attempts
  });
}
async function handlePageAssistant(req, res, actionOverride) {
  try {
    const parsed = PageAssistantRequestSchema.parse({
      ...req.body,
      ...actionOverride ? { action: actionOverride } : {}
    });
    const promptKey = ACTION_TO_PROMPT_KEY[parsed.action];
    const systemPrompt = getSystemPrompt(promptKey);
    const userPrompt = buildPageAssistantUserPrompt(parsed);
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
    let content;
    let providerName;
    try {
      const result = await chatWithFallback(messages, req.log || console);
      content = result.content;
      providerName = result.providerName;
    } catch (aiErr) {
      const providerError = aiErr.providerError || classifyProviderError(aiErr);
      const logger = req.log || console;
      logger.error({ err: aiErr, providerError }, "AI provider error");
      content = buildPageAssistantFallback(parsed, providerError.message);
      providerName = "local-fallback";
    }
    if (parsed.userId) {
      const userId = parsed.userId;
      const pageUrl = parsed.pageUrl || "";
      const pageTitle = parsed.pageTitle || "";
      const userQuery = parsed.userQuery || "";
      (async () => {
        try {
          if (parsed.action === "summarize") {
            await saveSummary(userId, { url: pageUrl, title: pageTitle, summary: content });
          } else if (parsed.action === "notes") {
            await saveNote(userId, { pageUrl, pageTitle, content });
          } else if (parsed.action === "chat") {
            await saveChat(userId, { pageUrl, query: userQuery, response: content });
          }
        } catch (dbErr) {
          const logger = req.log || console;
          logger.error({ err: dbErr, userId, action: parsed.action }, "Failed to persist AI response to Firestore");
        }
      })();
    }
    res.json({ ok: true, content, provider: providerName });
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      res.status(400).json({ ok: false, error: `Invalid request: ${message}` });
      return;
    }
    throw err;
  }
}
router.post("/chat", (req, res) => handlePageAssistant(req, res));
router.post("/summary", (req, res) => handlePageAssistant(req, res, "summarize"));
router.post("/notes", (req, res) => handlePageAssistant(req, res, "notes"));
router.post("/explain", (req, res) => handlePageAssistant(req, res, "explain-selection"));
router.post("/interview", (req, res) => handlePageAssistant(req, res, "interview"));
router.post("/save-page", async (req, res) => {
  try {
    const parsed = SavePageRequestSchema.parse(req.body);
    await savePage(parsed.userId, {
      url: parsed.url,
      title: parsed.title,
      summary: parsed.summary,
      notes: parsed.notes
    });
    res.json({ ok: true, content: "Saved successfully", provider: "firestore" });
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      res.status(400).json({ ok: false, error: `Invalid request: ${message}` });
      return;
    }
    const logger = req.log || console;
    logger.error({ err }, "Failed to save page to Firestore");
    res.status(500).json({ ok: false, error: "Failed to save page to Space" });
  }
});
router.post("/devtool", async (req, res) => {
  try {
    const parsed = DevToolRequestSchema.parse(req.body);
    const systemPrompt = getSystemPrompt(parsed.promptKey, parsed.context);
    const userPrompt = buildDevToolUserPrompt(parsed.input);
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
    let content;
    let providerName;
    try {
      const result = await chatWithFallback(messages, req.log || console);
      content = result.content;
      providerName = result.providerName;
    } catch (aiErr) {
      const providerError = aiErr.providerError || classifyProviderError(aiErr);
      const logger = req.log || console;
      logger.error({ err: aiErr, providerError }, "AI provider error in /devtool");
      res.status(providerError.status).json({ ok: false, error: providerError.message });
      return;
    }
    res.json({ ok: true, content, provider: providerName });
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      res.status(400).json({ ok: false, error: `Invalid request: ${message}` });
      return;
    }
    const logger = req.log || console;
    logger.error({ err }, "Unexpected error in /devtool");
    res.status(500).json({ ok: false, error: "An internal error occurred." });
  }
});
var assistant_default = router;

// src/routes/migration.ts
import { Router as Router2 } from "express";
import { z as z2 } from "zod";
var router2 = Router2();
var MigrationRequestSchema = z2.object({
  anonymousId: z2.string().min(1).max(128)
});
router2.post("/migrate-anonymous-data", async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.uid) {
      res.status(401).json({ ok: false, error: "Unauthorized: Authentication required for migration." });
      return;
    }
    const authenticatedUid = user.uid;
    const parsed = MigrationRequestSchema.parse(req.body);
    const anonymousId = parsed.anonymousId;
    if (anonymousId === authenticatedUid) {
      res.status(400).json({ ok: false, error: "Cannot migrate to the same user ID." });
      return;
    }
    const logger = req.log || console;
    logger.info({ anonymousId, authenticatedUid }, "Starting anonymous data migration");
    const batch = db.batch();
    let operationCount = 0;
    const savedPagesSnapshot = await db.collection("saved_pages").where("userId", "==", anonymousId).get();
    for (const doc of savedPagesSnapshot.docs) {
      const data = doc.data();
      const url = data.url;
      if (url) {
        const newDocId = `${authenticatedUid}_${Buffer.from(url).toString("base64url")}`;
        const newDocRef = db.collection("saved_pages").doc(newDocId);
        batch.set(newDocRef, {
          ...data,
          userId: authenticatedUid
        }, { merge: true });
        batch.delete(doc.ref);
        operationCount += 2;
      }
    }
    const notesSnapshot = await db.collection("notes").where("userId", "==", anonymousId).get();
    for (const doc of notesSnapshot.docs) {
      batch.update(doc.ref, { userId: authenticatedUid });
      operationCount++;
    }
    const chatHistorySnapshot = await db.collection("chat_history").where("userId", "==", anonymousId).get();
    for (const doc of chatHistorySnapshot.docs) {
      batch.update(doc.ref, { userId: authenticatedUid });
      operationCount++;
    }
    if (operationCount > 0) {
      logger.info({ operationCount }, "Committing Firestore migration batch");
      await batch.commit();
    }
    res.json({
      ok: true,
      migratedCount: savedPagesSnapshot.size + notesSnapshot.size + chatHistorySnapshot.size
    });
  } catch (err) {
    const logger = req.log || console;
    logger.error({ err }, "Migration failed");
    res.status(500).json({ ok: false, error: err.message || "Internal server error during migration" });
  }
});
var migration_default = router2;

// src/index.ts
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION (process kept alive):", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION (process kept alive):", reason);
});
var require2 = createRequire(import.meta.url);
var pinoHttp = require2("pino-http");
var app = express();
app.set("trust proxy", 1);
app.use(corsMiddleware);
app.use(express.json({ limit: "512kb" }));
app.use(pinoHttp());
app.use(rateLimiter);
app.use(authMiddleware);
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "prismspace-backend",
    provider: process.env.AI_PROVIDER ?? "gemini",
    providerOrder: getProviderOrder(),
    providers: getConfiguredProviders(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/", assistant_default);
app.use("/", migration_default);
app.use(errorHandler);
var PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  const providerName = process.env.AI_PROVIDER ?? "gemini";
  const env = process.env.NODE_ENV ?? "development";
  console.log(`\u{1F680} Prism Space backend running on :${PORT} [${env}] [provider: ${providerName}]`);
  console.log(`\u{1F501} AI provider order: ${getProviderOrder().join(" -> ")}`);
  for (const name of getProviderOrder()) {
    try {
      getProvider(name);
      console.log(`\u2705 AI provider "${name}" initialized successfully.`);
    } catch (err) {
      console.error(`\u274C AI provider "${name}" failed to initialize: ${err.message}`);
      console.error("   This provider will be skipped unless its configuration is fixed.");
    }
  }
});
var index_default = app;
export {
  index_default as default
};
