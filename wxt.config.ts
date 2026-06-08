import { fileURLToPath, URL as NodeURL } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'wxt';
import type { Plugin } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

// Load .env manually so VITE_ vars are available at config time
function loadEnv(): Record<string, string> {
  try {
    const raw = readFileSync(new URL('.env', import.meta.url), 'utf-8');
    const env: Record<string, string> = {};
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

const dotenv = loadEnv();
const BACKEND_URL = process.env.VITE_BACKEND_URL ?? dotenv.VITE_BACKEND_URL ?? 'https://prismspace-backend-vk4s7gl22q-el.a.run.app';
const EXTENSION_SECRET = process.env.VITE_EXTENSION_SECRET ?? dotenv.VITE_EXTENSION_SECRET ?? '';

// Replace with your actual Cloud Run service URL after first deployment.
// Format: https://SERVICE_NAME-HASH-REGION.a.run.app/*
// You can also set VITE_BACKEND_URL at build time to override this.
const backendOrigin = `${BACKEND_URL}/*`;

/**
 * Vite plugin that injects BACKEND_URL and EXTENSION_SECRET into
 * public/converted-inline/prism-backend-adapter.js at build time.
 * The file is a plain JS IIFE (not an ES module), so import.meta.env doesn't work.
 * WXT copies public/ files as raw assets, so we patch them on disk in closeBundle.
 */
function injectBackendSecrets(): Plugin {
  return {
    name: 'prism-inject-backend-secrets',
    apply: 'build',
    closeBundle() {
      const outputs = [
        join(rootDir, '.output', 'chrome-mv3', 'converted-inline', 'prism-backend-adapter.js'),
        join(rootDir, '.output', 'firefox-mv3', 'converted-inline', 'prism-backend-adapter.js')
      ];
      for (const outPath of outputs) {
        if (!existsSync(outPath)) continue;
        let content = readFileSync(outPath, 'utf-8');
        content = content
          .replace(
            /var BACKEND_URL = '[^']*';/,
            `var BACKEND_URL = '${BACKEND_URL}';`
          )
          .replace(
            /var EXTENSION_SECRET = '[^']*';/,
            `var EXTENSION_SECRET = '${EXTENSION_SECRET}';`
          );
        writeFileSync(outPath, content, 'utf-8');
        console.log(`[prism] Injected secrets into ${outPath.split('/').slice(-3).join('/')}`);
      }
    }
  };
}

const sharedManifest = {
  name: 'Prism Space',
  short_name: 'PrismSpace',
  description: 'Prism Space browser extension workspace.',
  permissions: ['storage', 'bookmarks', 'identity'],
  action: {
    default_title: 'Prism Space'
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  },
  options_ui: {
    page: 'options.html',
    open_in_tab: true
  },
  chrome_url_overrides: {
    newtab: 'index.html'
  }
};

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifestVersion: 3,
  targetBrowsers: ['chrome', 'firefox'],
  srcDir: '.',
  webExt: {
    disabled: true
  },
  manifest: ({ browser }) => ({
    ...sharedManifest,
    ...(browser === 'chrome'
      ? {
          host_permissions: [backendOrigin],
          oauth2: {
            client_id: process.env.VITE_CHROME_CLIENT_ID || dotenv.VITE_CHROME_CLIENT_ID || '403796056253-o67h7486onhh2mrag0vonj8nggn6f3he.apps.googleusercontent.com',
            scopes: [
              'https://www.googleapis.com/auth/userinfo.email',
              'https://www.googleapis.com/auth/userinfo.profile'
            ]
          }
        }
      : {
          permissions: [...sharedManifest.permissions, backendOrigin]
        }),
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'prism-space@prismbrowser.tech'
            }
          }
        }
      : {})
  }),
  vite: (config) => ({
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      injectBackendSecrets()
    ],
    resolve: {
      ...config.resolve,
      alias: {
        '@': rootDir
      }
    }
  })
});
