/**
 * Prism Space — Dev Tool Backend Adapter
 *
 * This script replaces the direct Groq/Azure XHR calls with calls to the
 * Prism Space Cloud Run backend. It is loaded before each dev tool's script.
 *
 * The Cloud Run backend handles all prompt construction and AI provider routing.
 * No API keys or prompt logic exists in the extension.
 */

(function () {
  'use strict';

  // Replace with your actual Cloud Run service URL after deployment.
  // Format: https://SERVICE_NAME-HASH-REGION.a.run.app/*
  var BACKEND_URL = 'https://prismspace-backend-vk4s7gl22q-el.a.run.app';

  // Shared secret — must match EXTENSION_SECRET env var on Cloud Run.
  // Set via the extension's build environment.
  var EXTENSION_SECRET = '';

  /**
   * Helper to retrieve the backend base URL dynamically from chrome.storage.local
   */
  function getBackendUrl() {
    return new Promise(function (resolve) {
      var api = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
      if (api && api.storage && api.storage.local) {
        api.storage.local.get('PRISM_BACKEND_URL', function (data) {
          resolve(data && data.PRISM_BACKEND_URL ? data.PRISM_BACKEND_URL : BACKEND_URL);
        });
      } else {
        resolve(BACKEND_URL);
      }
    });
  }

  // ─── Backend fetch helper ───────────────────────────────────────────────────
  /**
   * Calls the Cloud Run /devtool endpoint.
   * Returns a Promise that resolves to the AI response text.
   *
   * @param {string} promptKey - Key into the backend's system prompt registry
   * @param {string} input - The user's input text
   * @param {Record<string,string>} context - Optional context variables (e.g. { targetLang: 'Spanish' })
   * @returns {Promise<string>}
   */
  function callBackend(promptKey, input, context) {
    return callBackground(promptKey, input, context).catch(function () {
      var err = arguments[0];
      var message = err && err.message ? err.message : String(err || '');
      if (
        message.indexOf('background bridge is unavailable') !== -1 ||
        message.indexOf('Receiving end does not exist') !== -1 ||
        message.indexOf('Could not establish connection') !== -1
      ) {
        return callBackendDirect(promptKey, input, context);
      }

      throw err;
    });
  }

  function callBackground(promptKey, input, context) {
    var api = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
    if (!api || !api.runtime || !api.runtime.sendMessage) {
      return Promise.reject(new Error('Extension background bridge is unavailable'));
    }

    var message = {
      type: 'PRISM_DEVTOOL_REQUEST',
      payload: {
        promptKey: promptKey,
        input: input,
        context: context || {}
      }
    };

    if (typeof browser !== 'undefined' && api === browser) {
      return api.runtime.sendMessage(message).then(function (res) {
        if (!res || !res.ok) {
          throw new Error((res && res.error) || 'Dev tool request failed');
        }
        return res.content;
      });
    }

    return new Promise(function (resolve, reject) {
      api.runtime.sendMessage(message, function (res) {
        var lastError = api.runtime && api.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message || 'Dev tool request failed'));
          return;
        }

        if (!res || !res.ok) {
          reject(new Error((res && res.error) || 'Dev tool request failed'));
          return;
        }

        resolve(res.content);
      });
    });
  }

  function readErrorMessage(res) {
    var contentType = res.headers.get('content-type') || '';
    if (contentType.indexOf('application/json') !== -1) {
      return res.json().then(function (data) {
        return data && data.error ? data.error : 'Server request failed with status ' + res.status;
      }).catch(function () {
        return 'Server request failed with status ' + res.status;
      });
    }

    return res.text().then(function (text) {
      return text
        ? 'Server request failed with status ' + res.status + ': ' + text.slice(0, 240)
        : 'Server request failed with status ' + res.status;
    });
  }

  function callBackendDirect(promptKey, input, context) {
    var getAuthTokenPromise = new Promise(function (resolve) {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'PRISM_AUTH_GET_TOKEN' }, function (res) {
          resolve(res && res.token ? res.token : null);
        });
      } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage({ type: 'PRISM_AUTH_GET_TOKEN' }).then(function (res) {
          resolve(res && res.token ? res.token : null);
        }).catch(function () {
          resolve(null);
        });
      } else {
        resolve(null);
      }
    });

    var getBackendUrlPromise = getBackendUrl();

    return Promise.all([getAuthTokenPromise, getBackendUrlPromise]).then(function (results) {
      var idToken = results[0];
      var baseUrl = results[1];
      var url = baseUrl + '/devtool';

      var headers = { 'Content-Type': 'application/json' };
      if (EXTENSION_SECRET) headers['X-Prism-Secret'] = EXTENSION_SECRET;
      if (idToken) headers['Authorization'] = 'Bearer ' + idToken;

      return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ promptKey: promptKey, input: input, context: context || {} }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(120000) : undefined
      });
    }).then(function (res) {
      if (!res.ok) {
        return readErrorMessage(res).then(function (message) {
          throw new Error(message);
        });
      }
      var contentType = res.headers.get('content-type') || '';
      if (contentType.indexOf('application/json') === -1) {
        throw new Error('Server returned invalid format: ' + contentType);
      }
      return res.json();
    }).then(function (data) {
      if (!data.ok || !data.content) {
        throw new Error(data.error || 'AI returned an empty response');
      }
      return data.content;
    });
  }


  /**
   * Calls the backend and simulates streaming by progressively rendering
   * the response word by word. This preserves the existing streaming UX
   * without requiring SSE support on the backend.
   *
   * @param {string} promptKey
   * @param {string} input
   * @param {Record<string,string>} context
   * @param {function(string):void} onChunk - Called with each incremental text chunk
   * @param {function():void} onDone - Called when complete
   * @param {function(string):void} onErr - Called with error message
   */
  function callBackendStreaming(promptKey, input, context, onChunk, onDone, onErr) {
    callBackend(promptKey, input, context).then(function (fullText) {
      // Simulate streaming by sending the response in small chunks
      var words = fullText.split(' ');
      var i = 0;
      var CHUNK_SIZE = 3;

      function sendNextChunk() {
        if (i >= words.length) {
          onDone && onDone();
          return;
        }
        var chunk = words.slice(i, i + CHUNK_SIZE).join(' ') + (i + CHUNK_SIZE < words.length ? ' ' : '');
        onChunk && onChunk(chunk);
        i += CHUNK_SIZE;
        setTimeout(sendNextChunk, 20);
      }

      sendNextChunk();
    }).catch(function (err) {
      onErr && onErr(err && err.message ? err.message : String(err));
    });
  }

  // ─── Expose API globally ────────────────────────────────────────────────────
  // Dev tools access these functions through window.PrismBackend
  window.PrismBackend = {
    call: callBackend,
    stream: callBackendStreaming,
    backendUrl: BACKEND_URL
  };

})();
