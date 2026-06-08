import { browser } from 'wxt/browser';

const DEFAULT_AUTH_REDIRECT_PATH = 'provider_cb';

export const extensionApi = browser;

export function getExtensionRedirectUrl(path = DEFAULT_AUTH_REDIRECT_PATH) {
  if (browser.identity?.getRedirectURL) {
    return browser.identity.getRedirectURL(path);
  }

  const extensionId = browser.runtime?.id;
  return extensionId ? `https://${extensionId}.chromiumapp.org/${path}` : '';
}

export async function openExtensionOptionsPage(fallbackPath = 'options.html') {
  try {
    if (browser.runtime?.openOptionsPage) {
      await browser.runtime.openOptionsPage();
      return;
    }
  } catch {
    // Fall back to opening the bundled options page directly.
  }

  window.open(fallbackPath, '_blank');
}
