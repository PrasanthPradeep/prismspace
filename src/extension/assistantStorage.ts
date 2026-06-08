import { browser } from 'wxt/browser';
import type { AssistantSavedPage } from '@/src/assistant/types';
import { savePageToBackend } from '@/src/extension/geminiService';
import { getOrCreateUserId } from '@/src/extension/storage';

const SAVED_PAGES_KEY = 'prism.space.savedPages.v1';
const MAX_SAVED_PAGES = 200;

export async function listSavedPages(): Promise<AssistantSavedPage[]> {
  const result = await browser.storage.local.get(SAVED_PAGES_KEY);
  const saved = result[SAVED_PAGES_KEY];
  return Array.isArray(saved) ? saved : [];
}

export async function savePageToSpace(
  item: Omit<AssistantSavedPage, 'id'>,
  userId?: string
): Promise<AssistantSavedPage> {
  const savedItem: AssistantSavedPage = {
    ...item,
    id: crypto.randomUUID()
  };

  // Try to save to Firestore backend first
  try {
    const effectiveUserId = userId || (await getOrCreateUserId());
    await savePageToBackend(effectiveUserId, item);
  } catch (error) {
    console.warn('Failed to save page to Firestore backend. Falling back to local storage:', error);
  }

  // Always keep a local copy as fallback/cache
  const savedPages = await listSavedPages();
  const nextSavedPages = [
    savedItem,
    ...savedPages.filter((savedPage) => savedPage.url !== savedItem.url)
  ].slice(0, MAX_SAVED_PAGES);

  await browser.storage.local.set({ [SAVED_PAGES_KEY]: nextSavedPages });
  return savedItem;
}

