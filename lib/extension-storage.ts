import type browser from 'webextension-polyfill';

type BrowserApi = typeof browser;

const STORAGE_PREFIX = 'prism:';

function hasExtensionRuntime() {
  const extensionGlobal = globalThis as typeof globalThis & {
    chrome?: { runtime?: { id?: string } };
  };

  return Boolean(
    typeof globalThis !== 'undefined'
      && extensionGlobal.chrome?.runtime?.id,
  );
}

async function getBrowserApi(): Promise<BrowserApi | null> {
  if (!hasExtensionRuntime()) {
    return null;
  }

  const mod = await import('webextension-polyfill');
  return mod.default;
}

function getFallbackValue<T>(key: string): T | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  return rawValue ? (JSON.parse(rawValue) as T) : undefined;
}

function setFallbackValue<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}

export async function setExtensionValue<T>(key: string, value: T) {
  const extensionBrowser = await getBrowserApi();

  if (extensionBrowser?.storage?.local) {
    await extensionBrowser.storage.local.set({ [key]: value });
    return;
  }

  setFallbackValue(key, value);
}

export async function getExtensionValue<T>(key: string) {
  const extensionBrowser = await getBrowserApi();

  if (extensionBrowser?.storage?.local) {
    const values = await extensionBrowser.storage.local.get(key);
    return values[key] as T | undefined;
  }

  return getFallbackValue<T>(key);
}

export async function runStorageExample() {
  await setExtensionValue('theme', 'dark');
  const theme = await getExtensionValue<string>('theme');

  return theme;
}
