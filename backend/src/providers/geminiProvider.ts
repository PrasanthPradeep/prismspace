import { GoogleGenAI } from '@google/genai';
import type { AIProvider, ChatMessage, ProviderOptions } from './aiProvider.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_MAX_TOKENS = 2500;
const DEFAULT_TEMPERATURE = 0.55;

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async chat(messages: ChatMessage[], options: ProviderOptions = {}): Promise<string> {
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE;

    // Separate the system instruction (first message if role === 'system')
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    // Build Gemini-format history (all messages except the last user message)
    const lastUserMessage = conversationMessages.at(-1);
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      throw new Error('Last message must be a user message');
    }

    const history = conversationMessages
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
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
      throw new Error('Gemini returned an empty response');
    }

    return text.trim();
  }
}
