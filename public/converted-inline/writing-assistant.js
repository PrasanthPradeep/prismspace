
        // AI calls now routed through Prism Cloud Run backend via prism-backend-adapter.js
        // No API keys or AI SDK needed in the extension.

        let currentAction = 'improve';
        let isStreaming = false;
        let tokenCount = 0;

        const systemPrompts = {
            improve: "You are an expert writing coach. Improve the given text to make it clearer, more engaging, and more polished. Maintain the original meaning but enhance the language, flow, and impact. Only output the improved text without any explanation.",
            simplify: "You are a writing simplification expert. Rewrite the given text in simpler language that's easy to understand for everyone. Use shorter sentences, common words, and clear structure. Only output the simplified text without any explanation.",
            formal: "You are a professional writer. Transform the given text into a formal, professional tone suitable for business or academic contexts. Use proper vocabulary and formal language conventions. Only output the formal version without any explanation.",
            casual: "You are a friendly conversational writer. Transform the given text into a casual, friendly, and natural-sounding tone. Make it feel warm and approachable. Only output the casual version without any explanation.",
            translate: (lang) => `You are a professional translator. Translate the given text to ${lang}. Provide only the translation with no additional commentary.`,
            summarize: "You are an expert summarizer. Create a concise summary of the given text, capturing the key points and main ideas in 1-3 paragraphs. Only output the summary without any explanation.",
            grammar: "You are a grammar expert and proofreader. Fix all grammar, spelling, punctuation, and style errors in the given text. Preserve the original meaning and tone as much as possible. Only output the corrected text without explanations."
        };

        function setAction(action, btn) {
            currentAction = action;
            document.querySelectorAll('.action-btn[data-action]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('langSelect').classList.toggle('hidden', action !== 'translate');
        }


        // XHR-based streaming — now proxied through Prism Cloud Run backend
        function xhrStream(messages, opts, onChunk, onDone, onErr) {
            // Extract the user message content (last message in the array)
            var userMsg = messages[messages.length - 1];
            var input = userMsg ? userMsg.content : '';

            // Map writing assistant actions to backend prompt keys
            var promptKey = 'writing-' + currentAction;
            var context = {};
            if (currentAction === 'translate') {
                context.targetLang = document.getElementById('langSelect') ? document.getElementById('langSelect').value : 'Spanish';
                promptKey = 'writing-translate';
            }

            window.PrismBackend.stream(promptKey, input, context, onChunk, onDone, onErr);
        }


        function processText() {
            if (isStreaming) return;
            const inputText = document.getElementById('inputText').value.trim();
            if (!inputText) { showError('Please enter some text first!'); return; }

            const resultArea = document.getElementById('resultArea');
            const tokenDot = document.getElementById('tokenDot');
            const tokenCountEl = document.getElementById('tokenCount');

            isStreaming = true;
            tokenCount = 0;
            resultArea.innerHTML = '<span id="streamContent"></span><span class="streaming-cursor"></span>';
            tokenDot.classList.remove('idle');
            tokenCountEl.textContent = '0 tokens';

            let systemPrompt = systemPrompts[currentAction];
            if (currentAction === 'translate') systemPrompt = systemPrompts.translate(document.getElementById('langSelect').value);

            let fullText = '';
            xhrStream(
                [{ role: 'system', content: systemPrompt }, { role: 'user', content: inputText }],
                null,
                (tok) => {
                    fullText += tok; tokenCount++;
                    const sc = document.getElementById('streamContent');
                    if (sc) { sc.textContent = fullText; tokenCountEl.textContent = `~${tokenCount} tokens`; resultArea.scrollTop = resultArea.scrollHeight; }
                },
                () => {
                    const cursor = resultArea.querySelector('.streaming-cursor');
                    if (cursor) cursor.remove();
                    tokenDot.classList.add('idle');
                    isStreaming = false;
                },
                (err) => { showError('Error: ' + err); tokenDot.classList.add('idle'); isStreaming = false; }
            );
        }

        function showError(msg) { document.getElementById('resultArea').innerHTML = `<div class="error-msg">⚠️ ${msg}</div>`; }

        function copyResult() {
            const content = document.getElementById('streamContent');
            const text = content ? content.textContent : document.getElementById('resultArea').textContent;
            if (!text || text.includes('Select an action')) { showToast('Nothing to copy!', 'warn'); return; }
            navigator.clipboard.writeText(text).then(() => showToast('✅ Copied!')).catch(() => showToast('❌ Copy failed', 'err'));
        }

        function showToast(msg, type) {
            const t = document.createElement('div');
            const bg = type === 'err' ? 'rgba(239,68,68,0.9)' : type === 'warn' ? 'rgba(245,158,11,0.9)' : 'rgba(16,185,129,0.9)';
            t.style.cssText = `position:fixed;top:16px;right:16px;background:${bg};color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.4)`;
            t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000);
        }

        window.closePanel = function () {
            if (window.parent && window.parent !== window) {
                try { window.parent.postMessage({ action: 'closeWritingAssistant' }, '*'); } catch (e) { }
                try { if (typeof window.parent.closeWritingAssistant === 'function') window.parent.closeWritingAssistant(); } catch (e) { }
            } else { window.close(); }
        };

        document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

// Event listeners for data-click/data-change/data-input/data-keyup/data-keydown attributes
(function() {
  var ready = function() {
    // Click handlers
    document.querySelectorAll('[data-click]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        var fn = el.getAttribute('data-click');
        var tab = el.getAttribute('data-tab');
        var arg = el.getAttribute('data-arg');
        var params = el.getAttribute('data-params');
        if (fn === 'closePanel') { if (window.closePanel) window.closePanel(); return; }
        if (fn === 'close') { try { parent.postMessage({action: 'close'}, '*'); } catch(e) { window.close(); } return; }
        if (fn === 'switchTab' && tab) { if (window.switchTab) window.switchTab(e, tab); return; }
        if (fn === 'toggleCrit') { if (window.toggleCrit) window.toggleCrit(el); return; }
        if (fn === 'setDepth' && arg) { if (window.setDepth) window.setDepth(parseInt(arg), el); return; }
        if (fn === 'switchMode' && arg) { if (window.switchMode) window.switchMode(arg, el); return; }
        if (fn === 'setAction' && arg) { if (window.setAction) window.setAction(arg, el); return; }
        if (fn === 'insertMarkdown' && params) {
          var parts = params.split('|');
          if (window.insertMarkdown) window.insertMarkdown(parts[0]||'', parts[1]||'', parts[2]||'');
          return;
        }
        if (arg !== null && arg !== undefined) {
          if (window[fn]) window[fn](arg);
        } else if (params) {
          var p = params.split('|');
          if (window[fn]) window[fn](p[0]||'', p[1]||'', p[2]||'');
        } else {
          if (window[fn]) window[fn](el);
        }
      });
    });

    // Change handlers
    document.querySelectorAll('[data-change]').forEach(function(el) {
      el.addEventListener('change', function() {
        var fn = el.getAttribute('data-change');
        if (fn === 'applyHeading') { if (window.applyHeading) { window.applyHeading(el.value); el.value = ''; } return; }
        if (fn === 'applyFont') { if (window.applyFont) window.applyFont(el.value); return; }
        if (fn === 'applyFontWeight') { if (window.applyFontWeight) window.applyFontWeight(el.value); return; }
        if (fn === 'onLangChange') { if (window.onLangChange) window.onLangChange(el); return; }
        if (window[fn]) window[fn]();
      });
    });

    // Input handlers
    document.querySelectorAll('[data-input]').forEach(function(el) {
      el.addEventListener('input', function() {
        var fn = el.getAttribute('data-input');
        if (window[fn]) window[fn]();
      });
    });

    // Keyup handlers
    document.querySelectorAll('[data-keyup]').forEach(function(el) {
      el.addEventListener('keyup', function() {
        var fn = el.getAttribute('data-keyup');
        if (window[fn]) window[fn]();
      });
    });

    // Keydown handlers
    document.querySelectorAll('[data-keydown]').forEach(function(el) {
      el.addEventListener('keydown', function(e) {
        var fn = el.getAttribute('data-keydown');
        if (fn === 'sendOnEnter' && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (window.sendMsg) window.sendMsg();
        }
      });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
