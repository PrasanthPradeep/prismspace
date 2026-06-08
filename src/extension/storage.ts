import { extensionApi } from '@/src/extension/browserApi';

const STORAGE_KEY = 'aura-theme';
const USER_ID_KEY = 'prism.userId';

function canUseExtensionStorage() {
  return !!extensionApi.runtime?.id && !!extensionApi.storage?.local;
}

export async function getOrCreateUserId(): Promise<string> {
  if (canUseExtensionStorage()) {
    const result = await extensionApi.storage.local.get(USER_ID_KEY);
    let userId = result[USER_ID_KEY];
    if (typeof userId !== 'string' || !userId) {
      userId = crypto.randomUUID();
      await extensionApi.storage.local.set({ [USER_ID_KEY]: userId });
    }
    return userId;
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export async function getStoredTheme() {
  if (!canUseExtensionStorage()) {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  const result = await extensionApi.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || localStorage.getItem(STORAGE_KEY) || 'light';
}

export async function setStoredTheme(theme: string) {
  if (canUseExtensionStorage()) {
    await extensionApi.storage.local.set({ [STORAGE_KEY]: theme });
  }

  localStorage.setItem(STORAGE_KEY, theme);
}
