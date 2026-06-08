import { browser } from 'wxt/browser';
import type { AssistantAiRequest, AssistantSavedPage } from '@/src/assistant/types';
import { savePageToSpace } from '@/src/extension/assistantStorage';
import { DEFAULT_BACKEND_BASE_URL, runAiRequest, runDevToolRequest } from '@/src/extension/geminiService';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, getAuthToken } from '@/src/extension/firebase';

export default defineBackground(() => {
  const BACKEND_BASE_URL =
    import.meta.env.VITE_BACKEND_URL ||
    DEFAULT_BACKEND_BASE_URL;
  browser.storage.local.set({ PRISM_BACKEND_URL: BACKEND_BASE_URL });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'PRISM_PING') {
      sendResponse({ ok: true, source: 'background' });
      return;
    }

    if (message?.type === 'PRISM_STORAGE_GET' && typeof message.key === 'string') {
      browser.storage.local.get(message.key).then((result) => {
        sendResponse({ ok: true, value: result[message.key] });
      });
      return true;
    }

    if (message?.type === 'PRISM_STORAGE_SET' && typeof message.key === 'string') {
      browser.storage.local.set({ [message.key]: message.value }).then(() => {
        sendResponse({ ok: true });
      });
      return true;
    }

    if (message?.type === 'PRISM_AI_ASSISTANT_CHAT') {
      runAiRequest(message.payload as AssistantAiRequest)
        .then((content) => {
          sendResponse({ ok: true, content });
        })
        .catch((error: unknown) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : 'AI request failed'
          });
        });
      return true;
    }

    if (message?.type === 'PRISM_SPACE_SAVE') {
      savePageToSpace(message.payload as Omit<AssistantSavedPage, 'id'>)
        .then((item) => {
          sendResponse({ ok: true, item });
        })
        .catch((error: unknown) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : 'Unable to save page'
          });
        });
      return true;
    }

    if (message?.type === 'PRISM_DEVTOOL_REQUEST') {
      runDevToolRequest(message.payload as { promptKey: string; input: string; context?: Record<string, string> })
        .then((content) => {
          sendResponse({ ok: true, content });
        })
        .catch((error: unknown) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : 'Dev tool request failed'
          });
        });
      return true;
    }

    // ─── Firebase Auth Handlers ───────────────────────────────────────────────

    if (message?.type?.startsWith('PRISM_AUTH_')) {
      if (!auth) {
        if (message.type === 'PRISM_AUTH_GET_STATE' || message.type === 'PRISM_AUTH_GET_TOKEN') {
          sendResponse({ ok: true, user: null, token: null });
        } else if (message.type === 'PRISM_AUTH_SIGN_OUT') {
          sendResponse({ ok: true });
        } else {
          sendResponse({ ok: false, error: 'Firebase Authentication is not configured.' });
        }
        return true;
      }
    }

    if (message?.type === 'PRISM_AUTH_SIGN_IN_GOOGLE') {
      (async () => {
        try {
          // 1. Get Google OAuth access token using Chrome identity API
          const result = await new Promise<{ token: string }>((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (!token) {
                reject(new Error('Google sign-in returned no token.'));
              } else {
                resolve({ token });
              }
            });
          });

          // 2. Exchange token for Firebase credential and sign in
          const credential = GoogleAuthProvider.credential(null, result.token);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          sendResponse({
            ok: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            }
          });
        } catch (error: any) {
          sendResponse({ ok: false, error: error.message || 'Google sign-in failed' });
        }
      })();
      return true;
    }

    if (message?.type === 'PRISM_AUTH_SIGN_IN_EMAIL') {
      const { email, password } = message.payload || {};
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          sendResponse({
            ok: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            }
          });
        })
        .catch((error) => {
          sendResponse({ ok: false, error: error.message || 'Login failed' });
        });
      return true;
    }

    if (message?.type === 'PRISM_AUTH_REGISTER_EMAIL') {
      const { email, password } = message.payload || {};
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          sendResponse({
            ok: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            }
          });
        })
        .catch((error) => {
          sendResponse({ ok: false, error: error.message || 'Registration failed' });
        });
      return true;
    }

    if (message?.type === 'PRISM_AUTH_SIGN_OUT') {
      signOut(auth)
        .then(() => {
          // Also remove cached identity token if using Google Sign-in
          chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (token) {
              chrome.identity.removeCachedAuthToken({ token }, () => {});
            }
          });
          sendResponse({ ok: true });
        })
        .catch((error) => {
          sendResponse({ ok: false, error: error.message || 'Logout failed' });
        });
      return true;
    }

    if (message?.type === 'PRISM_AUTH_GET_STATE') {
      const user = auth.currentUser;
      if (user) {
        sendResponse({
          ok: true,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isGoogle: user.providerData.some((p) => p.providerId === 'google.com')
          }
        });
      } else {
        sendResponse({ ok: true, user: null });
      }
      return true;
    }

    if (message?.type === 'PRISM_AUTH_GET_TOKEN') {
      getAuthToken()
        .then((token) => {
          sendResponse({ ok: true, token });
        })
        .catch((error: any) => {
          sendResponse({ ok: false, error: error.message || 'Failed to get token' });
        });
      return true;
    }
  });
});
