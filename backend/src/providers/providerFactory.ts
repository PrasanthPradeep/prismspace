import type { AIProvider } from './aiProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { GroqProvider } from './groqProvider.js';
import { GroqProxyProvider } from './groqProxyProvider.js';

export type ProviderName = 'gemini' | 'groq' | 'groq-proxy';

const SUPPORTED_PROVIDERS: ProviderName[] = ['gemini', 'groq', 'groq-proxy'];
const _providers = new Map<ProviderName, AIProvider>();

function normalizeProviderName(value: string | undefined, fallback: ProviderName): ProviderName {
  const name = (value || fallback).toLowerCase();
  if (name === 'gemini' || name === 'groq' || name === 'groq-proxy' || name === 'groq_proxy') {
    if (name === 'groq_proxy') return 'groq-proxy';
    return name;
  }

  throw new Error(
    `Unknown AI provider "${name}". Valid options: gemini, groq, groq-proxy. ` +
      'Set AI_PROVIDER or AI_FALLBACK_PROVIDERS to supported provider names.'
  );
}

function hasProviderKey(name: ProviderName): boolean {
  if (name === 'gemini') {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
  }

  if (name === 'groq') {
    return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key-here';
  }

  return !!(process.env.GROQ_PROXY_URL || true);
}

function createProvider(name: ProviderName): AIProvider {
  switch (name) {
    case 'gemini':
      return new GeminiProvider();
    case 'groq':
      return new GroqProvider();
    case 'groq-proxy':
      return new GroqProxyProvider();
  }
}

/**
 * Returns the singleton AI provider instance.
 * Provider is selected by the AI_PROVIDER environment variable.
 * Defaults to Gemini if not set.
 *
 * To add a new provider:
 *   1. Implement AIProvider in a new file
 *   2. Add it to the ProviderName union type
 *   3. Add a case in the switch below
 */
export function getProvider(name = getPrimaryProviderName()): AIProvider {
  if (_providers.has(name)) {
    return _providers.get(name)!;
  }

  const provider = createProvider(name);
  _providers.set(name, provider);
  return provider;
}

export function getPrimaryProviderName(): ProviderName {
  return normalizeProviderName(process.env.AI_PROVIDER, 'gemini');
}

export function getProviderOrder(): ProviderName[] {
  const primary = getPrimaryProviderName();
  const explicitFallbacks = (process.env.AI_FALLBACK_PROVIDERS || 'groq,groq-proxy')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => normalizeProviderName(name, primary));

  const implicitFallbacks = SUPPORTED_PROVIDERS.filter((name) => name !== primary && hasProviderKey(name));
  return [...new Set([primary, ...explicitFallbacks, ...implicitFallbacks])];
}

export function getConfiguredProviders() {
  const primary = getPrimaryProviderName();
  const order = getProviderOrder();

  return SUPPORTED_PROVIDERS.map((name) => ({
    name,
    configured: hasProviderKey(name),
    primary: name === primary,
    fallback: order.includes(name) && name !== primary,
    model:
      name === 'gemini'
        ? process.env.GEMINI_MODEL || 'gemini-2.0-flash'
        : process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
  }));
}

/** Reset the cached provider (useful for testing) */
export function resetProvider() {
  _providers.clear();
}
