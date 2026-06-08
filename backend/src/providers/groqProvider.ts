import Groq from 'groq-sdk';
import type { AIProvider, ChatMessage, ProviderOptions } from './aiProvider.js';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_MAX_TOKENS = 2500;
const DEFAULT_TEMPERATURE = 0.55;

export class GroqProvider implements AIProvider {
  readonly name = 'groq';

  private readonly client: Groq;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    this.client = new Groq({ apiKey });
    this.model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;
  }

  async chat(messages: ChatMessage[], options: ProviderOptions = {}): Promise<string> {
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE;

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
      throw new Error('Groq returned an empty response');
    }

    return content.trim();
  }
}
