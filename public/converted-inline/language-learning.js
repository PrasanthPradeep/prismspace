
        // AI calls now routed through Prism Cloud Run backend via prism-backend-adapter.js
        // No API keys or AI SDK needed in the extension.

        let busy = false;
        let stats = JSON.parse(localStorage.getItem('ll_stats') || '{"w":0,"s":0,"m":0,"t":0}');

        function getLang() {
            const v = document.getElementById('targetLang').value;
            return v === 'Custom' ? (document.getElementById('customLang').value || 'Spanish') : v;
        }

        function onLangChange(sel) {
            document.getElementById('customLang').style.display = sel.value === 'Custom' ? 'block' : 'none';
            document.getElementById('welcomeLang').textContent = getLang();
        }

        function switchMode(m, tab) {
            document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('panel-' + m).classList.add('active');
            if (m === 'progress') refreshStats();
        }



        // Streaming helper — now proxied through Prism Cloud Run backend
        // The system message content is used to detect which mode is active:
        //   tutor/conversation, translate, grammar check, or vocab generation.
        function stream(messages, onChunk, onDone, onErr) {
            var lang = typeof getLang === 'function' ? getLang() : 'Spanish';
            var sys = messages[0] && messages[0].content ? messages[0].content.toLowerCase() : '';
            var userMsg = messages[messages.length - 1];
            var input = userMsg ? userMsg.content : '';
            var promptKey;
            if (sys.indexOf('vocab') !== -1 || sys.indexOf('json array') !== -1) {
                promptKey = 'language-vocab';
                // For vocab, the user input is the topic
                input = input.replace('Topic: ', '');
            } else if (sys.indexOf('grammar') !== -1 || sys.indexOf('check for errors') !== -1) {
                promptKey = 'language-grammar';
            } else if (sys.indexOf('translat') !== -1 && sys.indexOf('tutor') === -1) {
                promptKey = 'language-translate';
            } else {
                promptKey = 'language-conversation';
            }
            window.PrismBackend.stream(promptKey, input, { targetLang: lang }, onChunk, onDone, onErr);
        }


        async function sendMsg() {
            if (busy) return;
            const inp = document.getElementById('chatInput');
            const txt = inp.value.trim(); if (!txt) return;
            const lang = getLang(); const msgs = document.getElementById('chatMsgs');
            busy = true; document.getElementById('sendBtn').disabled = true; inp.value = '';
            const ub = document.createElement('div'); ub.className = 'bubble user'; ub.textContent = txt; msgs.appendChild(ub);
            const ab = document.createElement('div'); ab.className = 'bubble ai';
            const atxt = document.createElement('div');
            atxt.innerHTML = '<span class="streaming-cursor"></span>';
            ab.appendChild(atxt); msgs.appendChild(ab); msgs.scrollTop = msgs.scrollHeight;
            let full = '';
            await stream([
                { role: 'system', content: `You are a ${lang} tutor. Reply in ${lang} only. After your reply add "---EN---" then provide English translation. If user made errors add "---FIX---" then gentle explanation in English.` },
                { role: 'user', content: txt }
            ], (chunk) => {
                full += chunk;
                const main = full.split('---EN---')[0];
                atxt.innerHTML = main.trim().replace(/\n/g, '<br>') + '<span class="streaming-cursor"></span>';
                msgs.scrollTop = msgs.scrollHeight;
            }, () => {
                const cur = atxt.querySelector('.streaming-cursor'); if (cur) cur.remove();
                const parts = full.split('---EN---');
                atxt.innerHTML = (parts[0] || '').trim().replace(/\n/g, '<br>');
                if (parts[1]) {
                    const sub = parts[1].split('---FIX---');
                    const enText = (sub[0] || '').trim();
                    const fix = (sub[1] || '').trim();
                    if (enText) {
                        const tog = document.createElement('div'); tog.className = 'trans-toggle'; tog.textContent = '🔤 Show English';
                        const tDiv = document.createElement('div'); tDiv.className = 'trans-text'; tDiv.innerHTML = enText.replace(/\n/g, '<br>');
                        let on = false; tog.onclick = () => { on = !on; tDiv.style.display = on ? 'block' : 'none'; tog.textContent = on ? '🔤 Hide English' : '🔤 Show English'; };
                        ab.appendChild(tog); ab.appendChild(tDiv);
                    }
                    if (fix) {
                        const fd = document.createElement('div');
                        fd.style.cssText = 'margin-top:8px;padding:8px;background:rgba(245,158,11,0.1);border-radius:8px;font-size:12px;color:#fbbf24;border-left:2px solid #f59e0b';
                        fd.innerHTML = '✏️ ' + fix.replace(/\n/g, '<br>'); ab.appendChild(fd);
                    }
                }
                stats.m++; save();
                busy = false; document.getElementById('sendBtn').disabled = false;
            }, (err) => {
                atxt.innerHTML = `<span style="color:#f87171">⚠️ ${err}</span>`;
                busy = false; document.getElementById('sendBtn').disabled = false;
            });
        }

        async function runTranslate() {
            const inp = document.getElementById('transInput').value.trim(); if (!inp) return;
            const lang = getLang(); const el = document.getElementById('transResult');
            el.className = 'result-box loaded'; el.innerHTML = '<span class="streaming-cursor"></span>';
            document.getElementById('transBtn').disabled = true;
            let txt = '';
            await stream([
                { role: 'system', content: `You are a ${lang} language expert. Translate the text to ${lang}, then explain grammar and key vocabulary. Format: Translation: [text]\
\
Grammar Notes: [explanation]` },
                { role: 'user', content: inp }
            ], (c) => { txt += c; el.innerHTML = txt.replace(/\n/g, '<br>') + '<span class="streaming-cursor"></span>'; },
                () => { const cur = el.querySelector('.streaming-cursor'); if (cur) cur.remove(); stats.t++; save(); document.getElementById('transBtn').disabled = false; },
                (e) => { el.innerHTML = `<span style="color:#f87171">⚠️ ${e}</span>`; document.getElementById('transBtn').disabled = false; });
        }

        async function runGrammar() {
            const inp = document.getElementById('grammarInput').value.trim(); if (!inp) return;
            const lang = getLang(); const el = document.getElementById('grammarResult');
            el.className = 'result-box loaded'; el.innerHTML = '<span class="streaming-cursor"></span>';
            document.getElementById('grammarBtn').disabled = true;
            let txt = '';
            await stream([
                { role: 'system', content: `You are a ${lang} grammar expert. Check for errors. List each error with the original, correction, and a gentle explanation. End encouragingly.` },
                { role: 'user', content: `Check this ${lang} text:\
"${inp}"` }
            ], (c) => { txt += c; el.innerHTML = txt.replace(/\n/g, '<br>') + '<span class="streaming-cursor"></span>'; },
                () => { const cur = el.querySelector('.streaming-cursor'); if (cur) cur.remove(); stats.s++; save(); document.getElementById('grammarBtn').disabled = false; },
                (e) => { el.innerHTML = `<span style="color:#f87171">⚠️ ${e}</span>`; document.getElementById('grammarBtn').disabled = false; });
        }

        async function runVocab() {
            const topic = document.getElementById('vocabInput').value.trim(); if (!topic) return;
            const lang = getLang(); const el = document.getElementById('vocabResult');
            el.className = 'result-box loaded'; el.innerHTML = '<span class="streaming-cursor"></span>';
            document.getElementById('vocabBtn').disabled = true;
            let full = '';
            await stream([
                { role: 'system', content: `You are a ${lang} tutor. Return ONLY a JSON array of 10 objects: [{"word":"${lang} word","pronunciation":"phonetic","definition":"English meaning","example":"${lang} example sentence"}]. No extra text.` },
                { role: 'user', content: `Topic: ${topic}` }
            ], (c) => { full += c; },
                () => {
                    try {
                        const js = full.match(/\[[\s\S]*\]/)?.[0];
                        const words = JSON.parse(js);
                        el.innerHTML = '';
                        const grid = document.createElement('div'); grid.className = 'vocab-grid';
                        words.forEach(w => {
                            const card = document.createElement('div'); card.className = 'vocab-card';
                            card.innerHTML = `<div class="v-word">${w.word}</div><div class="v-pron">/${w.pronunciation}/</div><div class="v-def">${w.definition}</div><div class="v-ex">${w.example}</div>`;
                            grid.appendChild(card);
                        });
                        el.appendChild(grid);
                        stats.w += 10; save();
                    } catch (e) { el.innerHTML = '<pre style="white-space:pre-wrap;font-size:12px">' + full + '</pre>'; }
                    document.getElementById('vocabBtn').disabled = false;
                }, (e) => { el.innerHTML = `<span style="color:#f87171">⚠️ ${e}</span>`; document.getElementById('vocabBtn').disabled = false; });
        }

        function save() { localStorage.setItem('ll_stats', JSON.stringify(stats)); }
        function refreshStats() { document.getElementById('sWords').textContent = stats.w; document.getElementById('sSent').textContent = stats.s; document.getElementById('sMsgs').textContent = stats.m; document.getElementById('sTrans').textContent = stats.t; }
        function resetStats() { stats = { w: 0, s: 0, m: 0, t: 0 }; save(); refreshStats(); }

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
