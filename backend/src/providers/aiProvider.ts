/**
 * Common interface all AI providers must implement.
 * Adding a new provider requires only implementing this interface
 * and registering it in providerFactory.ts.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderOptions {
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Sampling temperature (0–1). Lower = more deterministic */
  temperature?: number;
}

export interface AIProvider {
  /**
   * Send a list of messages and return the assistant's text response.
   * Implementations must throw an Error on failure.
   */
  chat(messages: ChatMessage[], options?: ProviderOptions): Promise<string>;

  /** Human-readable name for logging */
  readonly name: string;
}
