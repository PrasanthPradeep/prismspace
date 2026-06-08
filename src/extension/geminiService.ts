import type { AssistantAiRequest, AssistantSavedPage } from '@/src/assistant/types';
import { getOrCreateUserId } from '@/src/extension/storage';
import { getAuthToken } from '@/src/extension/firebase';


/**
 * The URL of the Prism Space Cloud Run backend.
 *
 * IMPORTANT: After deploying to Cloud Run, replace this with your actual
 * service URL and update wxt.config.ts host_permissions accordingly.
 *
 * Example: https://prismspace-backend-<hash>-uc.a.run.app
 */
export const DEFAULT_BACKEND_BASE_URL = 'https://prismspace-backend-vk4s7gl22q-el.a.run.app';

const BACKEND_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_BACKEND_URL) ||
  DEFAULT_BACKEND_BASE_URL;

/**
 * Shared secret sent in every request to the backend.
 * Must match the EXTENSION_SECRET environment variable on the Cloud Run service.
 * Store this in .env as VITE_EXTENSION_SECRET.
 */
const EXTENSION_SECRET =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_EXTENSION_SECRET) ||
  '';

const REQUEST_TIMEOUT_MS = 120_000;

async function readErrorMessage(response: Response, label: string): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const data = await response.json() as { error?: string };
      if (data.error) return data.error;
    } catch {
      // Fall through to the generic status message.
    }
  } else {
    const text = (await response.text()).trim();
    if (text) {
      return `${label} failed with status ${response.status}: ${text.slice(0, 240)}`;
    }
  }

  return `${label} failed with status ${response.status}`;
}

/** Maps assistant actions to Cloud Run endpoint paths */
const ACTION_TO_PATH: Record<string, string> = {
  chat: '/chat',
  summarize: '/summary',
  notes: '/notes',
  'explain-selection': '/explain',
  save: '/chat', // save uses the chat endpoint with the 'save' action in the body
  interview: '/interview'
};

/**
 * Sends a page-assistant request to the Cloud Run backend.
 * All prompt construction happens on the backend — this function
 * only forwards the page context and action type.
 */
export async function runAiRequest(request: AssistantAiRequest): Promise<string> {
  const action = request.action ?? 'chat';
  const path = ACTION_TO_PATH[action] ?? '/chat';
  const url = `${BACKEND_BASE_URL}${path}`;

  const userId = await getOrCreateUserId();
  const idToken = await getAuthToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(EXTENSION_SECRET ? { 'X-Prism-Secret': EXTENSION_SECRET } : {}),
        ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify({
        action,
        pageTitle: request.pageTitle,
        pageUrl: request.pageUrl,
        extractedPageContent: request.extractedPageContent,
        selectedText: request.selectedText,
        userQuery: request.userQuery,
        userId
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'AI request'));
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Invalid response format from server (expected JSON, got ${contentType})`);
    }

    const data = await response.json() as { ok: boolean; content?: string; error?: string };

    if (!data.ok) {
      throw new Error(data.error ?? 'AI request failed');
    }

    if (!data.content) {
      throw new Error('AI returned an empty response');
    }

    return data.content;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runDevToolRequest(request: {
  promptKey: string;
  input: string;
  context?: Record<string, string>;
}): Promise<string> {
  const url = `${BACKEND_BASE_URL}/devtool`;
  const idToken = await getAuthToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(EXTENSION_SECRET ? { 'X-Prism-Secret': EXTENSION_SECRET } : {}),
        ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify({
        promptKey: request.promptKey,
        input: request.input,
        context: request.context || {}
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Dev tool request'));
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Invalid response format from server (expected JSON, got ${contentType})`);
    }

    const data = await response.json() as { ok: boolean; content?: string; error?: string };
    if (!data.ok) {
      throw new Error(data.error ?? 'Dev tool request failed');
    }

    if (!data.content) {
      throw new Error('AI returned an empty response');
    }

    return data.content;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Saves a page to the space on the Cloud Run backend.
 */
export async function savePageToBackend(userId: string, item: Omit<AssistantSavedPage, 'id'>): Promise<void> {
  const url = `${BACKEND_BASE_URL}/save-page`;
  const idToken = await getAuthToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(EXTENSION_SECRET ? { 'X-Prism-Secret': EXTENSION_SECRET } : {}),
      ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
    },
    body: JSON.stringify({
      userId,
      url: item.url,
      title: item.title,
      summary: item.summary,
      notes: item.notes
    })
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Save page'));
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Invalid response format from server (expected JSON, got ${contentType})`);
  }

  const data = await response.json() as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(data.error ?? 'Save page failed');
  }
}

// Re-export under the old name for backward compatibility
// (background.ts will be updated to use runAiRequest, but this alias
// ensures no breakage if any other code references the old name)
export { runAiRequest as runGeminiPageRequest };
