import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  manifest: {
    name: 'Prism Space',
    short_name: 'PrismSpace',
    description: 'Prism Space browser extension workspace.',
    permissions: ['storage', 'sidePanel', 'bookmarks', 'identity'],
    action: {
      default_title: 'Prism Space',
      default_popup: 'popup.html'
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'"
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true
    },
    side_panel: {
      default_path: 'sidepanel.html'
    },
    chrome_url_overrides: {
      newtab: 'index.html'
    }
  },
  vite: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        '@': rootDir
      }
    }
  })
});
