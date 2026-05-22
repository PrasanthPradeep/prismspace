const GROQ_API_URL = 'https://prism-ai-browser-api-hcb9hra7e8eecjca.centralindia-01.azurewebsites.net/api/prism_groq_devspace';
const GROQ_MODEL = 'openai/gpt-oss-120b';
let busy = false;
let lastResult = '';

function toggleCrit(el) { el.classList.toggle('checked'); }

function addCustomCrit() {
    const inp = document.getElementById('customCritInput');
    const val = inp.value.trim(); if (!val) return;
    const grid = document.getElementById('criteriaGrid');
    const item = document.createElement('div'); item.className = 'crit-item checked';
    item.addEventListener('click', () => item.classList.toggle('checked'));
    item.innerHTML = `<div class="crit-check"></div><span>✏️ ${val}</span>`;
    grid.appendChild(item); inp.value = '';
}

function getCheckedCriteria() {
    return [...document.querySelectorAll('.crit-item.checked')].map(el => el.querySelector('span').textContent.replace(/^[^ ]+ /, ''));
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
            nt.split('\n').forEach(line => {
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
        xhr.timeout = 180000;
        xhr.send(JSON.stringify(buildGroqPayload(messages, opts)));
    } catch (e) { onErr && onErr(e.message); }
}

function runAnalysis() {
    if (busy) return;
    const title = document.getElementById('decisionTitle').value.trim();
    const optRaw = document.getElementById('optionsInput').value.trim();
    if (!title || !optRaw) { alert('Please fill in the decision title and options!'); return; }

    const options = optRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const criteria = getCheckedCriteria();
    const context = document.getElementById('contextInput').value.trim();

    const scroll = document.getElementById('outputScroll');
    scroll.innerHTML = '<div style="color:rgba(255,255,255,0.4);padding:30px;text-align:center;font-size:13px">🔮 Thinking deeply... please wait 15–40 seconds...<br><br><div style="width:40px;height:40px;border:3px solid rgba(129,140,248,0.2);border-top-color:#818cf8;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto"></div></div>';

    const style = document.createElement('style');
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);

    busy = true; const analyzeBtn = document.getElementById('analyzeBtn'); if (analyzeBtn) analyzeBtn.disabled = true;

    const sysPrompt = `Analyze this decision thoroughly. Consider each criterion carefully before concluding.\n\nDecision: ${title}\nOptions: ${options.join(', ')}\nCriteria: ${criteria.join(', ')}\n${context ? 'Context: ' + context : ''}\n\nProvide your analysis in this EXACT format (use these exact section markers):\n\n[THINKING]\nYour internal reasoning process here\n[/THINKING]\n\n[PROS_CONS]\nFor each option, list pros and cons in this format:\nOPTION: <option name>\nPROS: <pro1> | <pro2> | <pro3>\nCONS: <con1> | <con2> | <con3>\n[/PROS_CONS]\n\n[SCORES]\nScore each option on each criterion from 1-10:\nOPTION: <name> | ${criteria.map(c => `${c}: <score>`).join(' | ')}\n[/SCORES]\n\n[RECOMMENDATION]\nYour final recommendation with clear explanation\n[/RECOMMENDATION]`;

    let full = '';
    xhrStream(
        [{ role: 'system', content: sysPrompt }, { role: 'user', content: 'Please analyze this decision.' }],
        { max_tokens: 4000, temperature: 0.7 },
        (tok) => { full += tok; },
        () => {
            lastResult = full;
            renderResult(full, options, criteria, scroll);
            busy = false; const analyzeBtn2 = document.getElementById('analyzeBtn'); if (analyzeBtn2) analyzeBtn2.disabled = false;
        },
        (e) => {
            scroll.innerHTML = `<div style="color:#f87171;padding:16px">⚠️ Error: ${e}</div>`;
            busy = false; const analyzeBtn3 = document.getElementById('analyzeBtn'); if (analyzeBtn3) analyzeBtn3.disabled = false;
        }
    );
}

function renderResult(full, options, criteria, scroll) {
    scroll.innerHTML = '';

    const thinking = extract(full, 'THINKING');
    const prosCons = extract(full, 'PROS_CONS');
    const scores = extract(full, 'SCORES');
    const rec = extract(full, 'RECOMMENDATION');

    if (thinking) {
        const card = makeCard('🧪 Reasoning Process (Thinking Mode)', true);
        const body = card.querySelector('.section-body');
        const tb = document.createElement('div'); tb.className = 'thinking-body'; tb.textContent = thinking;
        body.appendChild(tb);
        scroll.appendChild(card);
    }

    if (prosCons) {
        const card = makeCard('⚖️ Pros & Cons Analysis', false);
        const body = card.querySelector('.section-body');
        const grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-direction:column;gap:16px';
        options.forEach(opt => {
            const block = parseOptionPC(opt, prosCons); if (!block) return;
            const optTitle = document.createElement('div'); optTitle.style.cssText = 'font-size:13px;font-weight:700;color:#a5b4fc;margin-bottom:8px';
            optTitle.textContent = '🔹 ' + opt;
            const pcGrid = document.createElement('div'); pcGrid.className = 'pros-cons-grid';
            const pros = document.createElement('div'); pros.className = 'pros-list';
            const cons = document.createElement('div'); cons.className = 'cons-list';
            const prosItems = block.pros.length ? block.pros.map(p => `<div class="pc-item">• ${p}</div>`).join('') : '<div class="pc-item" style="color:rgba(255,255,255,0.5);">• No significant pros found</div>';
            const consItems = block.cons.length ? block.cons.map(c => `<div class="pc-item">• ${c}</div>`).join('') : '<div class="pc-item" style="color:rgba(255,255,255,0.5);">• No significant cons found</div>';
            pros.innerHTML = `<div class="pc-title">✅ Pros</div>${prosItems}`;
            cons.innerHTML = `<div class="pc-title">❌ Cons</div>${consItems}`;
            pcGrid.appendChild(pros); pcGrid.appendChild(cons);
            const wrapper = document.createElement('div'); wrapper.appendChild(optTitle); wrapper.appendChild(pcGrid);
            grid.appendChild(wrapper);
        });
        body.appendChild(grid); scroll.appendChild(card);
    }

    if (scores) {
        const card = makeCard('📊 Weighted Score Matrix', false);
        const body = card.querySelector('.section-body');
        const table = document.createElement('table'); table.className = 'score-table';
        const thead = document.createElement('tr'); thead.innerHTML = '<th>Option</th>' + criteria.map(c => `<th>${c}</th>`).join('') + '<th>Total</th>';
        table.appendChild(thead);
        options.forEach(opt => {
            const row = document.createElement('tr');
            const cell = document.createElement('td'); cell.textContent = opt; cell.style.fontWeight = '600'; row.appendChild(cell);
            let total = 0; let count = 0;
            criteria.forEach(cr => {
                const sc = extractScore(scores, opt, cr); total += sc; count++;
                const td = document.createElement('td');
                td.innerHTML = `<div>${sc}/10</div><div class="score-bar"><div class="score-fill" style="width:${sc * 10}%"></div></div>`;
                row.appendChild(td);
            });
            const avgTd = document.createElement('td');
            const avg = count > 0 ? (total / count).toFixed(1) : '-';
            avgTd.innerHTML = `<strong>${avg}</strong>`; row.appendChild(avgTd);
            table.appendChild(row);
        });
        body.appendChild(table); scroll.appendChild(card);
    }

    const recCard = document.createElement('div'); recCard.className = 'section-card';
    const recBody = document.createElement('div'); recBody.style.padding = '16px';
    const recBox = document.createElement('div'); recBox.className = 'recommendation-box';
    const recTitle = document.createElement('div'); recTitle.className = 'rec-title'; recTitle.textContent = '🏆 Final Recommendation';
    const recText = document.createElement('div'); recText.style.cssText = 'font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85)';
    recText.innerHTML = (rec || full.replace(/\[.*?\][\s\S]*?\[\/.*?\]/g, '')).trim().replace(/\n/g, '<br>');
    recBox.appendChild(recTitle); recBox.appendChild(recText); recBody.appendChild(recBox); recCard.appendChild(recBody);
    scroll.appendChild(recCard);
}

function makeCard(title, collapsed) {
    const card = document.createElement('div'); card.className = 'section-card';
    const hdr = document.createElement('div'); hdr.className = 'section-hdr';
    const t = document.createElement('div'); t.className = 'section-hdr-title'; t.innerHTML = title;
    const arr = document.createElement('div'); arr.className = 'section-collapse'; arr.textContent = collapsed ? '▶' : '▼';
    hdr.appendChild(t); hdr.appendChild(arr);
    const body = document.createElement('div'); body.className = 'section-body';
    body.style.display = collapsed ? 'none' : 'block';
    hdr.onclick = () => { const show = body.style.display === 'none'; body.style.display = show ? 'block' : 'none'; arr.textContent = show ? '▼' : '▶'; };
    card.appendChild(hdr); card.appendChild(body);
    return card;
}

function extract(text, tag) {
    const m = text.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'i'));
    return m ? m[1].trim() : null;
}

function parseOptionPC(option, text) {
    const optEsc = escRe(option.trim());
    const sectionRe = new RegExp(`OPTION:\s*${optEsc}([\s\S]*?)(?=OPTION:|$)`, 'i');
    const sectionMatch = text.match(sectionRe);
    if (!sectionMatch) return { pros: [], cons: [] };
    const section = sectionMatch[1];
    const prosRe = /PROS:\s*(.+?)(?=\nCONS:|\n\n|$)/is;
    const prosMatch = section.match(prosRe);
    let pros = [];
    if (prosMatch) {
        const prosText = prosMatch[1].trim();
        pros = prosText.split(/[\|,]/).map(s => s.trim()).filter(s => s && s !== 'See detailed analysis');
    }
    const consRe = /CONS:\s*(.+?)(?=\n\n|$)/is;
    const consMatch = section.match(consRe);
    let cons = [];
    if (consMatch) {
        const consText = consMatch[1].trim();
        cons = consText.split(/[\|,]/).map(s => s.trim()).filter(s => s && s !== 'See detailed analysis');
    }
    return { pros: pros.length ? pros : [], cons: cons.length ? cons : [] };
}

function extractScore(text, option, criterion) {
    const re = new RegExp(`OPTION:\\s*${escRe(option)}[^\\n]*${escRe(criterion)}:\\s*(\\d+)`, 'i');
    const m = text.match(re);
    return m ? Math.min(10, Math.max(1, parseInt(m[1]))) : 5;
}

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function exportMarkdown() {
    if (!lastResult) { alert('Run an analysis first!'); return; }
    const title = document.getElementById('decisionTitle').value;
    const md = `# Decision Analysis: ${title}\n\n${lastResult}`;
    navigator.clipboard.writeText(md).then(() => showToast('📋 Markdown copied!')).catch(() => showToast('❌ Copy failed', 'err'));
}

function exportPDF() { window.print(); }

function showToast(msg, t = 'ok') { const el = document.createElement('div'); const bg = t === 'err' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)'; el.style.cssText = `position:fixed;top:16px;right:16px;background:${bg};color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:9999`; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2500); }

window.closePanel = function () {
    if (window.parent && window.parent !== window) {
        try {
            if (typeof window.parent.closeDecisionAnalyzer === 'function') window.parent.closeDecisionAnalyzer();
        } catch (e) { }
        try { window.parent.postMessage({ action: 'closeDecisionAnalyzer' }, window.location.origin || '*'); } catch (e) { }
    }
    try { window.close(); } catch (e) { }
};

function __init_decision_analyzer() {
    document.querySelectorAll('.crit-item').forEach(el => el.addEventListener('click', () => toggleCrit(el)));
    const addBtn = document.querySelector('.add-crit-btn'); if (addBtn) addBtn.addEventListener('click', addCustomCrit);
    const analyzeBtn = document.getElementById('analyzeBtn'); if (analyzeBtn) analyzeBtn.addEventListener('click', runAnalysis);
    document.querySelectorAll('.export-btn').forEach(b => {
        b.addEventListener('click', () => {
            if (b.textContent.includes('Copy')) exportMarkdown(); else exportPDF();
        });
    });
    const close = document.querySelector('.close-btn'); if (close) close.addEventListener('click', closePanel);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
}

__init_decision_analyzer();
