const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const statusDot = document.getElementById('statusDot');
const statsDiv = document.getElementById('stats');
let autoSaveTimer;
let unsavedChanges = false;

const saved = localStorage.getItem('markdown-editor');
if (saved) {
    editor.value = saved;
    renderPreview();
    updateStats();
}

editor.addEventListener('input', () => {
    renderPreview();
    updateStats();
    markUnsaved();
});

editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        insertText('\t');
    }
});

function renderPreview() {
    preview.innerHTML = markdownToHtml(editor.value);
}

function markdownToHtml(md) {
    let html = md;
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```([^`]+)```/gm, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>');
    html = html.replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c);
        return '<tr><td>' + cells.join('</td><td>') + '</td></tr>';
    });
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6])/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    return html;
}

function updateStats() {
    const text = editor.value;
    const words = text.trim().split(/\s+/).filter(w => w).length;
    const chars = text.length;
    const readingTime = Math.ceil(words / 200);
    statsDiv.textContent = 'Words: ' + words + ' | Chars: ' + chars + ' | Reading time: ' + readingTime + ' min';
}

function markUnsaved() {
    unsavedChanges = true;
    statusDot.classList.remove('saved');
    document.getElementById('statusText').textContent = 'Unsaved';
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        localStorage.setItem('markdown-editor', editor.value);
        statusDot.classList.add('saved');
        document.getElementById('statusText').textContent = 'Saved';
        unsavedChanges = false;
    }, 2000);
}

function insertMarkdown(text, before, after) {
    insertText(before + text + after);
}

function insertText(text) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end);
    editor.value = editor.value.substring(0, start) + text + selected + editor.value.substring(end);
    editor.selectionStart = start + text.length;
    editor.selectionEnd = start + text.length;
    editor.focus();
    renderPreview();
    updateStats();
    markUnsaved();
}

function insertTable() {
    insertText('| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |');
}

function copyAsHTML() {
    navigator.clipboard.writeText(preview.innerHTML);
}

function downloadMD() {
    const a = document.createElement('a');
    a.href = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(editor.value);
    a.download = 'document.md';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadHTML() {
    const style = 'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6}code{background:#f0f0f0;padding:2px 6px;border-radius:3px}pre{background:#f0f0f0;padding:1rem;border-radius:4px;overflow-x:auto}blockquote{border-left:4px solid #ddd;padding-left:1rem;margin:1rem 0;color:#666}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:0.75rem;text-align:left}th{background:#f0f0f0}';
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title><style>' + style + '</style></head><body>' + preview.innerHTML + '</body></html>';
    const a = document.createElement('a');
    a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    a.download = 'document.html';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function toggleDistractionMode() {
    document.getElementById('container').classList.toggle('distraction-free');
}

(function() {
  var ready = function() {
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
    document.querySelectorAll('[data-input]').forEach(function(el) {
      el.addEventListener('input', function() {
        var fn = el.getAttribute('data-input');
        if (window[fn]) window[fn]();
      });
    });
    document.querySelectorAll('[data-keyup]').forEach(function(el) {
      el.addEventListener('keyup', function() {
        var fn = el.getAttribute('data-keyup');
        if (window[fn]) window[fn]();
      });
    });
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
