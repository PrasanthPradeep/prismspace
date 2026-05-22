
        const GROQ_API_URL = 'https://prism-ai-browser-api-hcb9hra7e8eecjca.centralindia-01.azurewebsites.net/api/prism_groq_devspace';
        const GROQ_MODEL = 'openai/gpt-oss-120b';
        let depth = 0;
        let busy = false;
        let lastExplanation = '';

        const depths = [
            { label: 'Brief Overview', prompt: 'Give a brief paragraph overview of what this code does. Then list the key concepts used as: [CONCEPTS]: concept1|url1, concept2|url2. Keep it concise.' },
            { label: 'Line by Line', prompt: 'Explain this code line by line. For each line or block, explain what it does in simple terms. Then list key concepts: [CONCEPTS]: concept1|url1, concept2|url2.' },
            { label: 'Teach Like I\'m New', prompt: 'Explain this code as if teaching a complete beginner. Use simple analogies, avoid jargon, explain every concept from scratch. Sections: OVERVIEW, HOW IT WORKS (step by step), WHY each part exists. Then: [CONCEPTS]: concept1|url1.' }
        ];

        const docLinks = {
            'JavaScript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference',
            'Python': 'https://docs.python.org/3/',
            'TypeScript': 'https://www.typescriptlang.org/docs/',
            'Java': 'https://docs.oracle.com/en/java/',
            'C++': 'https://cppreference.com/',
            'C#': 'https://learn.microsoft.com/en-us/dotnet/csharp/',
            'Go': 'https://pkg.go.dev/',
            'Rust': 'https://doc.rust-lang.org/',
            'PHP': 'https://www.php.net/docs.php',
            'Ruby': 'https://ruby-doc.org/',
            'Swift': 'https://developer.apple.com/documentation/swift',
            'Kotlin': 'https://kotlinlang.org/docs/',
            'HTML/CSS': 'https://developer.mozilla.org/en-US/docs/Web',
            'SQL': 'https://www.w3schools.com/sql/'
        };

        function setDepth(d, btn) {
            depth = d;
            document.querySelectorAll('.depth-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
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
                    const newText = raw.slice(pos); pos = raw.length;
                    newText.split('\
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

        function runExplain() {
            if (busy) return;
            const code = document.getElementById('codeInput').value.trim();
            if (!code) { alert('Please paste some code first!'); return; }
            const lang = document.getElementById('langSel').value;
            const scroll = document.getElementById('outputScroll');
            scroll.innerHTML = ''; busy = true;
            document.getElementById('explainBtn').disabled = true;

            const sys = `You are an expert ${lang} teacher helping learners and junior devs understand code. ${depths[depth].prompt}`;
            let full = '';

            const liveBlock = document.createElement('div'); liveBlock.className = 'section-block';
            const liveBody = document.createElement('div'); liveBody.className = 'section-body';
            liveBody.innerHTML = '<span class="streaming-cursor"></span>';
            liveBlock.appendChild(liveBody); scroll.appendChild(liveBlock);

            xhrStream(
                [{ role: 'system', content: sys }, { role: 'user', content: `${lang} code:\
\`\`\`${lang.toLowerCase()}\
${code}\
\`\`\`` }],
                { max_tokens: 3000, temperature: 0.6 },
                (tok) => {
                    full += tok;
                    liveBody.innerHTML = escHTML(full).replace(/
/g, '<br>')pan class="streaming-cursor"></span>';
                    scroll.scrollTop = scroll.scrollHeight;
                },
                () => {
                    const cur = liveBody.querySelector('.streaming-cursor'); if (cur) cur.remove();
                    lastExplanation = full;
                    renderExplanation(full, lang, scroll, liveBlock);
                    busy = false; document.getElementById('explainBtn').disabled = false;
                },
                (e) => {
                    scroll.innerHTML = `<div style="color:#f87171;padding:16px">⚠️ Error: ${e}</div>`;
                    busy = false; document.getElementById('explainBtn').disabled = false;
                }
            );
        }

        function renderExplanation(full, lang, scroll, liveBlock) {
            scroll.removeChild(liveBlock);
            scroll.innerHTML = '';
            const conceptMatch = full.match(/\[CONCEPTS\]:(.*?)(?:\
|$)/i);
            const mainText = full.replace(/\[CONCEPTS\]:.*?(?:\
|$)/gi, '').trim();

            const mainBlock = document.createElement('div'); mainBlock.className = 'section-block';
            const hdr = document.createElement('div'); hdr.className = 'section-hdr'; hdr.innerHTML = '📖 Explanation';
            const body = document.createElement('div'); body.className = 'section-body';
            body.innerHTML = escHTML(mainText).replace(/\
/g, '<br>');
            mainBlock.appendChild(hdr); mainBlock.appendChild(body); scroll.appendChild(mainBlock);

            if (conceptMatch) {
                const concepts = conceptMatch[1].trim().split(',').map(s => s.trim()).filter(Boolean);
                const cBlock = document.createElement('div'); cBlock.className = 'section-block';
                const cHdr = document.createElement('div'); cHdr.className = 'section-hdr'; cHdr.innerHTML = '🔑 Key Concepts';
                const cBody = document.createElement('div'); cBody.className = 'section-body';
                const baseUrl = docLinks[lang] || 'https://developer.mozilla.org/';
                concepts.forEach(c => {
                    const parts = c.split('|'); const name = parts[0].trim(); const url = parts[1]?.trim() || baseUrl;
                    const link = document.createElement('a'); link.className = 'concept-link'; link.href = url; link.target = '_blank'; link.textContent = name;
                    cBody.appendChild(link); cBody.appendChild(document.createTextNode(' · '));
                });
                cBlock.appendChild(cHdr); cBlock.appendChild(cBody); scroll.appendChild(cBlock);
            }
        }

        function runQuiz() {
            if (busy) return;
            const code = document.getElementById('codeInput').value.trim();
            if (!lastExplanation || !code) { alert('Explain the code first!'); return; }
            const lang = document.getElementById('langSel').value;
            const scroll = document.getElementById('outputScroll');
            const existing = scroll.querySelector('.quiz-section');
            if (existing) existing.remove();
            busy = true; document.getElementById('quizBtn').disabled = true;
            let full = '';
            xhrStream(
                [{ role: 'system', content: 'Generate exactly 3 comprehension questions about the code with answers. Format as JSON: [{"q":"question","a":"answer"}]. Return ONLY JSON.' },
                { role: 'user', content: `${lang} code:\
${code}` }],
                { max_tokens: 1000, temperature: 0.7 },
                (tok) => { full += tok; },
                () => {
                    try {
                        const qs = JSON.parse(full.match(/\[[\s\S]*\]/)?.[0]);
                        const qSection = document.createElement('div'); qSection.className = 'section-block quiz-section';
                        const qHdr = document.createElement('div'); qHdr.className = 'section-hdr'; qHdr.innerHTML = '🧠 Quiz Questions';
                        qSection.appendChild(qHdr);
                        qs.forEach((item, i) => {
                            const card = document.createElement('div'); card.className = 'quiz-card';
                            const q = document.createElement('div'); q.className = 'quiz-q'; q.textContent = (i + 1) + '. ' + item.q;
                            const tog = document.createElement('span'); tog.className = 'quiz-toggle'; tog.textContent = 'Show Answer';
                            const ans = document.createElement('div'); ans.className = 'quiz-ans'; ans.textContent = item.a;
                            let on = false; tog.onclick = () => { on = !on; ans.style.display = on ? 'block' : 'none'; tog.textContent = on ? 'Hide Answer' : 'Show Answer'; };
                            card.appendChild(q); card.appendChild(tog); card.appendChild(ans); qSection.appendChild(card);
                        });
                        scroll.appendChild(qSection); scroll.scrollTop = scroll.scrollHeight;
                    } catch (e) { alert('Quiz parse error: ' + e.message); }
                    busy = false; document.getElementById('quizBtn').disabled = false;
                },
                (e) => { alert('Quiz error: ' + e); busy = false; document.getElementById('quizBtn').disabled = false; }
            );
        }

        function saveExplanation() {
            if (!lastExplanation) { alert('Nothing to save!'); return; }
            const code = document.getElementById('codeInput').value;
            const lang = document.getElementById('langSel').value;
            const saved = JSON.parse(localStorage.getItem('ce_saved') || '[]');
            saved.unshift({ code, lang, explanation: lastExplanation, date: new Date().toLocaleString() });
            if (saved.length > 10) saved.pop();
            localStorage.setItem('ce_saved', JSON.stringify(saved));
            showToast('💾 Saved!');
        }

        function showToast(msg) { const t = document.createElement('div'); t.style.cssText = 'position:fixed;top:16px;right:16px;background:rgba(16,185,129,0.9);color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:9999'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }
        function escHTML(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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
