import type { AIProvider, ChatMessage, ProviderOptions } from './aiProvider.js';

const DEFAULT_PROXY_URL =
  'https://prism-ai-browser-api-hcb9hra7e8eecjca.centralindia-01.azurewebsites.net/api/prism_groq_devspace';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_MAX_TOKENS = 2500;
const DEFAULT_TEMPERATURE = 0.55;

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string };
    delta?: { content?: string };
  }>;
  error?: string | { message?: string };
};

function extractProxyError(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as ChatCompletionResponse).error;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
  }

  return fallback;
}

function parseSseResponse(text: string) {
  let output = '';

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) continue;

    const data = trimmed.slice(6).trim();
    if (!data || data === '[DONE]') continue;

    try {
      const parsed = JSON.parse(data) as ChatCompletionResponse;
      output += parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || '';
    } catch {
      // Ignore malformed stream fragments; the proxy can flush partial lines.
    }
  }

  return output.trim();
}

export class GroqProxyProvider implements AIProvider {
  readonly name = 'groq-proxy';

  private readonly proxyUrl: string;
  private readonly model: string;

  constructor() {
    this.proxyUrl = process.env.GROQ_PROXY_URL || DEFAULT_PROXY_URL;
    this.model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;
  }

  async chat(messages: ChatMessage[], options: ProviderOptions = {}): Promise<string> {
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE;

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        max_completion_tokens: maxTokens,
        temperature,
        top_p: 1,
        reasoning_effort: 'medium'
      })
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = undefined;
      }

      throw new Error(extractProxyError(payload, `Groq proxy request failed with status ${response.status}`));
    }

    let content = '';
    if (contentType.includes('application/json')) {
      const payload = JSON.parse(text) as ChatCompletionResponse;
      content = payload.choices?.[0]?.message?.content || '';
    } else {
      content = text.includes('data: ') ? parseSseResponse(text) : text;
    }

    if (!content.trim()) {
      throw new Error('Groq proxy returned an empty response');
    }

    return content.trim();
  }
}
