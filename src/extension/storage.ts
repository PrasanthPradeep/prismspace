const STORAGE_KEY = 'aura-theme';

function canUseChromeStorage() {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

export async function getStoredTheme() {
  if (!canUseChromeStorage()) {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || localStorage.getItem(STORAGE_KEY) || 'light';
}

export async function setStoredTheme(theme: string) {
  if (canUseChromeStorage()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: theme });
  }

  localStorage.setItem(STORAGE_KEY, theme);
}
