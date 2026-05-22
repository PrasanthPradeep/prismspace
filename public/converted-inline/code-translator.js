
        const GROQ_API_URL = 'https://prism-ai-browser-api-hcb9hra7e8eecjca.centralindia-01.azurewebsites.net/api/prism_groq_devspace';
        const GROQ_MODEL = 'openai/gpt-oss-120b';
        let busy = false;
        let explainDiff = false;
        let history = JSON.parse(localStorage.getItem('ct_history') || '[]');
        renderHistory();

        function swapLangs() {
            const f = document.getElementById('fromLang');
            const t = document.getElementById('toLang');
            const tmp = f.value; f.value = t.value; t.value = tmp;
        }

        function toggleExplain() {
            explainDiff = !explainDiff;
            const btn = document.getElementById('explainToggle');
            btn.textContent = `💡 Explain Differences: ${explainDiff ? 'ON' : 'OFF'}`;
            btn.classList.toggle('on', explainDiff);
            if (!explainDiff) document.getElementById('diffSection').style.display = 'none';
        }



        function getGroqError(xhr) {
            try {
                const payload = JSON.parse(xhr.responseText);
                if (payload && payload.error) {
                    return typeof payload.error === 'string' ? payload.error : (payload.error.message || 'Groq request failed');
                }
            } catch (_) { }
            return xhr.status === 0 ? 'Network error or blocked request' : `Groq request failed (${xhr.status})`;
        }

        function buildGroqPayload(messages, opts) {
            const payload = Object.assign({ model: GROQ_MODEL, messages, stream: true }, opts || {});
            if (payload.max_tokens != null && payload.max_completion_tokens == null) {
                payload.max_completion_tokens = payload.max_tokens;
            }
            delete payload.max_tokens;
            if (payload.reasoning_effort == null) {
                payload.reasoning_effort = 'medium';
            }
            return payload;
        }

        // XHR streaming helper — calls Azure proxy (no API key needed client-side)
        function xhrStream(messages, opts, onChunk, onDone, onErr) {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', GROQ_API_URL, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                let pos = 0;
                function parse() {
                    const raw = xhr.responseText;
                    if (raw.length <= pos) return;
                    const nt = raw.slice(pos); pos = raw.length;
                    nt.split('\
').forEach(line => {
                        if (!line.startsWith('data: ')) return;
                        const d = line.slice(6).trim(); if (d === '[DONE]') return;
                        try { const tok = JSON.parse(d)?.choices?.[0]?.delta?.content || ''; if (tok) onChunk(tok); } catch (_) { }
                    });
                }
                xhr.onprogress = parse;
                xhr.onload = () => {
                    parse();
                    if (xhr.status >= 200 && xhr.status < 300) {
                        onDone && onDone();
                        return;
                    }
                    onErr && onErr(getGroqError(xhr));
                };
                xhr.onerror = () => onErr && onErr('Network error');
                xhr.ontimeout = () => onErr && onErr('Timeout');
                xhr.timeout = 120000;
                xhr.send(JSON.stringify(buildGroqPayload(messages, opts)));
            } catch (e) { onErr && onErr(e.message); }
        }

        function convertCode() {
            if (busy) return;
            const code = document.getElementById('sourceCode').value.trim();
            if (!code) { alert('Please paste some code first!'); return; }
            const from = document.getElementById('fromLang').value;
            const to = document.getElementById('toLang').value;
            const outArea = document.getElementById('outputArea');
            busy = true; document.getElementById('convBtn').disabled = true;
            outArea.innerHTML = '<span class="streaming-cursor"></span>';
            document.getElementById('diffSection').style.display = 'none';
            document.getElementById('outputLabel').textContent = to + ' Code';

            const sysPrompt = `Convert the following ${from} code to idiomatic ${to}. Preserve logic exactly. Use ${to} conventions and idioms, not a literal translation. Return ONLY the converted code without explanation, no markdown code fences.`;
            let full = '';
            xhrStream(
                [{ role: 'system', content: sysPrompt }, { role: 'user', content: code }],
                { max_tokens: 3000, temperature: 0.3 },
                (tok) => {
                    full += tok;
                    outArea.textContent = full;
                    outArea.innerHTML += '<span class="streaming-cursor"></span>';
                    outArea.scrollTop = outArea.scrollHeight;
                },
                () => {
                    const cur = outArea.querySelector('.streaming-cursor'); if (cur) cur.remove();
                    outArea.textContent = full;
                    addHistory(from, to);
                    if (explainDiff) runDiffExplain(from, to, code, full);
                    else { busy = false; document.getElementById('convBtn').disabled = false; }
                },
                (e) => {
                    outArea.innerHTML = `<span style="color:#f87171">⚠️ Error: ${e}</span>`;
                    busy = false; document.getElementById('convBtn').disabled = false;
                }
            );
        }

        function runDiffExplain(from, to, src, dst) {
            const diffSection = document.getElementById('diffSection');
            const diffContent = document.getElementById('diffContent');
            diffSection.style.display = 'block';
            diffContent.innerHTML = '<span class="streaming-cursor"></span>';
            let full = '';
            xhrStream(
                [{ role: 'system', content: `You are an expert in ${from} and ${to}. Explain the key idiom and pattern differences between the original ${from} code and the converted ${to} code. Keep it concise — 3-5 bullet points.` },
                { role: 'user', content: `${from} source:\
${src}\
\
${to} translation:\
${dst}` }],
                { max_tokens: 800, temperature: 0.5 },
                (tok) => { full += tok; diffContent.innerHTML = full.replace(/\
/g, '<br>') + '<span class="streaming-cursor"></span>'; },
                () => {
                    const cur = diffContent.querySelector('.streaming-cursor'); if (cur) cur.remove();
                    diffContent.innerHTML = full.replace(/\
/g, '<br>');
                    busy = false; document.getElementById('convBtn').disabled = false;
                },
                (e) => {
                    diffContent.innerHTML = `<span style="color:#f87171">⚠️ ${e}</span>`;
                    busy = false; document.getElementById('convBtn').disabled = false;
                }
            );
        }

        function addHistory(from, to) {
            history.unshift({ from, to, date: new Date().toLocaleTimeString() });
            if (history.length > 5) history.pop();
            localStorage.setItem('ct_history', JSON.stringify(history));
            renderHistory();
        }

        function renderHistory() {
            const bar = document.getElementById('historyBar');
            if (!history.length) { bar.innerHTML = '<span class="hist-empty">No recent conversions</span>'; return; }
            bar.innerHTML = history.map((h, i) => `<div class="hist-chip" title="${h.date}">${h.from} → ${h.to}</div>`).join('');
        }

        function copyOutput() {
            const text = document.getElementById('outputArea').textContent;
            if (!text || text.includes('Converted code will appear')) { showToast('Nothing to copy!', 'warn'); return; }
            navigator.clipboard.writeText(text).then(() => showToast('✅ Copied!')).catch(() => showToast('❌ Failed', 'err'));
        }

        function showToast(msg, t = 'ok') { const el = document.createElement('div'); const bg = t === 'err' ? 'rgba(239,68,68,0.9)' : t === 'warn' ? 'rgba(245,158,11,0.9)' : 'rgba(16,185,129,0.9)'; el.style.cssText = `position:fixed;top:16px;right:16px;background:${bg};color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:9999`; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2500); }

        window.closePanel = function () {
            history.back();
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
        if (fn === 'close') { history.back(); return; }
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
