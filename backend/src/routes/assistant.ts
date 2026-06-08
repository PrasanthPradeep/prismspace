import { Router, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { getProvider, getProviderOrder, type ProviderName } from '../providers/providerFactory.js';
import { classifyProviderError, type ProviderErrorInfo } from '../providers/providerErrors.js';
import type { ChatMessage } from '../providers/aiProvider.js';
import { getSystemPrompt } from '../prompts/systemPrompts.js';
import { buildPageAssistantFallback } from '../services/localAssistantFallback.js';
import {
  buildPageAssistantUserPrompt,
  buildDevToolUserPrompt
} from '../prompts/userPromptBuilder.js';
import {
  savePage,
  saveSummary,
  saveNote,
  saveChat
} from '../repositories/firestoreRepository.js';
import {
  PageAssistantRequestSchema,
  DevToolRequestSchema,
  SavePageRequestSchema,
  type PageAssistantAction,
  type SuccessResponse,
  type ErrorResponse
} from '../validation/schemas.js';

const router = Router();

// Map action names to prompt keys.
// 'save' reuses the save prompt (returns structured content the extension parses).
const ACTION_TO_PROMPT_KEY: Record<PageAssistantAction, string> = {
  chat: 'chat',
  summarize: 'summarize',
  notes: 'notes',
  'explain-selection': 'explain-selection',
  save: 'save',
  interview: 'interview'
};

async function chatWithFallback(messages: ChatMessage[], logger: any): Promise<{
  content: string;
  providerName: string;
}> {
  const attempts: Array<{ provider: ProviderName; error: ProviderErrorInfo }> = [];

  for (const providerName of getProviderOrder()) {
    try {
      const provider = getProvider(providerName);
      const content = await provider.chat(messages);
      if (attempts.length > 0) {
        logger.warn({ provider: providerName, attempts }, 'AI provider fallback succeeded');
      }
      return { content, providerName: provider.name };
    } catch (err) {
      const providerError = classifyProviderError(err, providerName);
      attempts.push({ provider: providerName, error: providerError });
      logger.error({ err, provider: providerName, providerError }, 'AI provider attempt failed');
    }
  }

  const lastAttempt = attempts.at(-1);
  const fallbackError = lastAttempt?.error || {
    status: 503,
    kind: 'configuration',
    message: 'No configured AI provider is available.'
  };

  throw Object.assign(new Error(fallbackError.message), {
    providerError: fallbackError,
    attempts
  });
}

// ─── Page Assistant endpoints ────────────────────────────────────────────────

/**
 * Generic page-assistant handler.
 * All 5 semantic endpoints + /chat share this implementation.
 */
async function handlePageAssistant(
  req: Request,
  res: Response<SuccessResponse | ErrorResponse>,
  actionOverride?: PageAssistantAction
): Promise<void> {
  try {
    // Merge body action with route-level override
    const parsed = PageAssistantRequestSchema.parse({
      ...req.body,
      ...(actionOverride ? { action: actionOverride } : {})
    });

    const promptKey = ACTION_TO_PROMPT_KEY[parsed.action];
    const systemPrompt = getSystemPrompt(promptKey);
    const userPrompt = buildPageAssistantUserPrompt(parsed);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let content: string;
    let providerName: string;
    try {
      const result = await chatWithFallback(messages, (req as any).log || console);
      content = result.content;
      providerName = result.providerName;
    } catch (aiErr: any) {
      const providerError = aiErr.providerError || classifyProviderError(aiErr);
      const logger = (req as any).log || console;
      logger.error({ err: aiErr, providerError }, 'AI provider error');

      content = buildPageAssistantFallback(parsed, providerError.message);
      providerName = 'local-fallback';
    }

    // Asynchronously persist AI output to Firestore if userId is present
    if (parsed.userId) {
      const userId = parsed.userId;
      const pageUrl = parsed.pageUrl || '';
      const pageTitle = parsed.pageTitle || '';
      const userQuery = parsed.userQuery || '';

      (async () => {
        try {
          if (parsed.action === 'summarize') {
            await saveSummary(userId, { url: pageUrl, title: pageTitle, summary: content });
          } else if (parsed.action === 'notes') {
            await saveNote(userId, { pageUrl, pageTitle, content });
          } else if (parsed.action === 'chat') {
            await saveChat(userId, { pageUrl, query: userQuery, response: content });
          }
        } catch (dbErr) {
          const logger = (req as any).log || console;
          logger.error({ err: dbErr, userId, action: parsed.action }, 'Failed to persist AI response to Firestore');
        }
      })();
    }

    res.json({ ok: true, content, provider: providerName });
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      res.status(400).json({ ok: false, error: `Invalid request: ${message}` });
      return;
    }
    throw err; // Let global error handler deal with AI provider errors
  }
}

// General-purpose chat endpoint (action comes from request body)
router.post('/chat', (req, res) => handlePageAssistant(req, res));

// Semantic shorthand endpoints (action fixed by route)
router.post('/summary', (req, res) => handlePageAssistant(req, res, 'summarize'));
router.post('/notes', (req, res) => handlePageAssistant(req, res, 'notes'));
router.post('/explain', (req, res) => handlePageAssistant(req, res, 'explain-selection'));
router.post('/interview', (req, res) => handlePageAssistant(req, res, 'interview'));

// Endpoint to manually save a page to the space
router.post('/save-page', async (req: Request, res: Response<SuccessResponse | ErrorResponse>) => {
  try {
    const parsed = SavePageRequestSchema.parse(req.body);
    await savePage(parsed.userId, {
      url: parsed.url,
      title: parsed.title,
      summary: parsed.summary,
      notes: parsed.notes
    });
    res.json({ ok: true, content: 'Saved successfully', provider: 'firestore' });
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      res.status(400).json({ ok: false, error: `Invalid request: ${message}` });
      return;
    }
    const logger = (req as any).log || console;
    logger.error({ err }, 'Failed to save page to Firestore');
    res.status(500).json({ ok: false, error: 'Failed to save page to Space' });
  }
});

// ─── Dev Space tool endpoint ─────────────────────────────────────────────────

/**
 * POST /devtool
 *
 * Used by the legacy iframe-based Dev Space tools (Writing Assistant,
 * Code Explainer, Code Translator, Language Learning, Decision Analyzer).
 *
 * Body: { promptKey: string, input: string, context?: Record<string,string> }
 */
router.post('/devtool', async (req, res: Response<SuccessResponse | ErrorResponse>) => {
  try {
    const parsed = DevToolRequestSchema.parse(req.body);
    const systemPrompt = getSystemPrompt(parsed.promptKey, parsed.context);
    const userPrompt = buildDevToolUserPrompt(parsed.input);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let content: string;
    let providerName: string;
    try {
      const result = await chatWithFallback(messages, (req as any).log || console);
      content = result.content;
      providerName = result.providerName;
    } catch (aiErr: any) {
      const providerError = aiErr.providerError || classifyProviderError(aiErr);
      const logger = (req as any).log || console;
      logger.error({ err: aiErr, providerError }, 'AI provider error in /devtool');
      res.status(providerError.status).json({ ok: false, error: providerError.message });
      return;
    }

    res.json({ ok: true, content, provider: providerName });
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      res.status(400).json({ ok: false, error: `Invalid request: ${message}` });
      return;
    }
    const logger = (req as any).log || console;
    logger.error({ err }, 'Unexpected error in /devtool');
    res.status(500).json({ ok: false, error: 'An internal error occurred.' });
  }
});

export default router;
