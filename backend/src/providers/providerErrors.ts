export type ProviderErrorInfo = {
  status: number;
  message: string;
  kind: 'quota' | 'configuration' | 'provider' | 'unknown';
};

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown provider error';
  }
}

function parseProviderPayload(message: string): any {
  const trimmed = message.trim();
  if (!trimmed.startsWith('{')) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export function classifyProviderError(error: unknown, providerName = 'AI provider'): ProviderErrorInfo {
  const message = rawMessage(error);
  const payload = parseProviderPayload(message);
  const providerMessage = payload?.error?.message || message;
  const providerStatus = payload?.error?.status || '';
  const providerCode = Number(payload?.error?.code || 0);
  const searchable = `${providerStatus} ${providerCode} ${providerMessage}`.toLowerCase();

  if (
    providerCode === 429 ||
    searchable.includes('resource_exhausted') ||
    searchable.includes('quota') ||
    searchable.includes('billing') ||
    searchable.includes('prepayment credits')
  ) {
    return {
      status: 402,
      kind: 'quota',
      message:
        `The configured ${providerName} account is out of quota or billing credits. Add credits or switch to another configured provider.`
    };
  }

  if (
    searchable.includes('api key') ||
    searchable.includes('environment variable') ||
    searchable.includes('not set')
  ) {
    return {
      status: 503,
      kind: 'configuration',
      message: 'The AI provider is not configured on the backend. Check the provider API key environment variable.'
    };
  }

  if (providerMessage && providerMessage !== 'Unknown provider error') {
    return {
      status: 502,
      kind: 'provider',
      message: `The AI provider returned an error: ${providerMessage}`
    };
  }

  return {
    status: 502,
    kind: 'unknown',
    message: 'The AI provider is unavailable. Please try again later.'
  };
}
