
        const patterns = {
            'Email': '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
            'URL': 'https?://[^\\s]+',
            'IPv4': '\\b(\\d{1,3}\\.){3}\\d{1,3}\\b',
            'Phone US': '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
            'Date (MM/DD/YYYY)': '\\d{2}/\\d{2}/\\d{4}',
            'Date (YYYY-MM-DD)': '\\d{4}-\\d{2}-\\d{2}',
            'Time (HH:MM)': '\\d{2}:\\d{2}',
            'Hex Color': '#[0-9a-fA-F]{6}',
            'Hex Color Short': '#[0-9a-fA-F]{3}',
            'Credit Card': '\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}',
            'Username': '^[a-zA-Z0-9_]{3,16}$',
            'ISBN': '(?:ISBN(?:-1[03])?:?\\s?)?(?=[0-9X]{10}$|(?=(?:[0-9]+[^0-9]){3})[0-9X]{13}$)',
            'Slug': '^[a-z0-9]+(?:-[a-z0-9]+)*$',
            'UUID': '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            'HTML Tag': '<[^>]+>',
            'HTML Entity': '&[a-zA-Z0-9]+;',
            'Markdown Bold': '\\*\\*.*?\\*\\*',
            'Markdown Italic': '\\*.*?\\*',
            'Markdown Link': '\\[[^\\]]+\\]\\([^\\)]+\\)',
            'Word Boundary': '\\b\\w+\\b'
        };

        function switchTab(e, tabName) {
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            e.target.classList.add('active');
            if (tabName === 'library') populateLibrary();
        }

        document.getElementById('pattern').addEventListener('input', updateMatches);

        function updateMatches() {
            const pattern = document.getElementById('pattern').value;
            const text = document.getElementById('testString').value;
            const flags = getFlags();

            if (!pattern) {
                document.getElementById('status').innerHTML = '';
                document.getElementById('highlighted').innerHTML = text;
                document.getElementById('matchesTable').innerHTML = '';
                return;
            }

            try {
                const regex = new RegExp(pattern, flags);
                const matches = [...text.matchAll(regex)];
                const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#44ffff', '#ff44ff'];

                let highlighted = text;
                let offset = 0;

                matches.forEach((match, idx) => {
                    const start = match.index + offset;
                    const end = start + match[0].length;
                    const color = colors[idx % colors.length];
                    highlighted = highlighted.substring(0, start) + 
                        `<span style="background: ${color}; color: #000; padding: 2px; border-radius: 2px;">${highlighted.substring(start, end)}</span>` + 
                        highlighted.substring(end);
                    offset += `<span style="background: ${color}; color: #000; padding: 2px; border-radius: 2px;">`.length;
                });

                document.getElementById('highlighted').innerHTML = highlighted;
                document.getElementById('status').innerHTML = `<span class="success">✓ ${matches.length} match${matches.length !== 1 ? 'es' : ''} found</span>`;

                // Build table
                let tableHTML = '';
                if (matches.length > 0) {
                    const headers = ['Index', 'Match', 'Length'];
                    for (let i = 1; i < matches[0].length; i++) {
                        headers.push(`Group ${i}`);
                    }
                    tableHTML = '<table class="match-table"><tr><th>' + headers.join('</th><th>') + '</th></tr>';
                    matches.forEach((match, idx) => {
                        const cells = [idx, match[0], match[0].length];
                        for (let i = 1; i < match.length; i++) {
                            cells.push(match[i] || '-');
                        }
                        tableHTML += '<tr><td>' + cells.join('</td><td>') + '</td></tr>';
                    });
                    tableHTML += '</table>';
                }
                document.getElementById('matchesTable').innerHTML = tableHTML;
            } catch (e) {
                document.getElementById('status').innerHTML = `<span class="error">❌ ${e.message}</span>`;
                document.getElementById('matchesTable').innerHTML = '';
            }
        }

        function getFlags() {
            let flags = '';
            if (document.getElementById('flagG').checked) flags += 'g';
            if (document.getElementById('flagI').checked) flags += 'i';
            if (document.getElementById('flagM').checked) flags += 'm';
            if (document.getElementById('flagS').checked) flags += 's';
            if (document.getElementById('flagU').checked) flags += 'u';
            return flags;
        }

        function updateReplace() {
            const pattern = document.getElementById('replacePattern').value;
            const replacement = document.getElementById('replacement').value;
            const text = document.getElementById('replaceText').value;

            if (!pattern || !text) {
                document.getElementById('replaceOutput').innerHTML = 'Ready for replacement';
                return;
            }

            try {
                const regex = new RegExp(pattern, 'g');
                const result = text.replace(regex, replacement);
                document.getElementById('replaceOutput').innerHTML = result;
            } catch (e) {
                document.getElementById('replaceOutput').innerHTML = `<span class="error">❌ ${e.message}</span>`;
            }
        }

        function copyReplace() {
            const text = document.getElementById('replaceOutput').innerText;
            navigator.clipboard.writeText(text);
            alert('Copied!');
        }

        function populateLibrary() {
            const grid = document.getElementById('libraryGrid');
            grid.innerHTML = '';
            for (const [name, pattern] of Object.entries(patterns)) {
                const item = document.createElement('div');
                item.className = 'lib-item';
                item.innerHTML = `<strong>${name}</strong><br><code style="font-size: 0.75rem; color: #888;">${pattern}</code>`;
                item.onclick = () => {
                    document.getElementById('pattern').value = pattern;
                    switchTab({ target: document.querySelector('[onclick*="test"]') }, 'test');
                    updateMatches();
                };
                grid.appendChild(item);
            }
        }

        function explainRegex() {
            const pattern = document.getElementById('explainPattern').value;
            if (!pattern) {
                document.getElementById('explanation').innerHTML = '';
                return;
            }

            const explanation = parseRegex(pattern);
            document.getElementById('explanation').innerHTML = `<div class="explanation">${explanation}</div>`;
        }

        function parseRegex(pattern) {
            let explanation = '<strong>Pattern breakdown:</strong><br><br>';
            let i = 0;
            let depth = 0;

            for (; i < pattern.length; i++) {
                const char = pattern[i];
                const next = pattern[i + 1];

                if (char === '[') {
                    let closing = pattern.indexOf(']', i);
                    const charClass = pattern.substring(i, closing + 1);
                    explanation += `<strong>${charClass}:</strong> Character class<br>`;
                    i = closing;
                } else if (char === '(') {
                    explanation += `<strong>(...):</strong> Capturing group<br>`;
                    depth++;
                } else if (char === ')') {
                    depth--;
                } else if (char === '\\') {
                    const escape = pattern.substring(i, i + 2);
                    const escapeMap = {
                        '\\d': 'Any digit',
                        '\\D': 'Any non-digit',
                        '\\w': 'Any word character',
                        '\\W': 'Any non-word character',
                        '\\s': 'Any whitespace',
                        '\\S': 'Any non-whitespace',
                        '\\b': 'Word boundary'
                    };
                    explanation += `<strong>${escape}:</strong> ${escapeMap[escape] || 'Escaped character'}<br>`;
                    i++;
                } else if (char === '*') {
                    explanation += `<strong>*:</strong> 0 or more occurrences<br>`;
                } else if (char === '+') {
                    explanation += `<strong>+:</strong> 1 or more occurrences<br>`;
                } else if (char === '?') {
                    explanation += `<strong>?:</strong> 0 or 1 occurrence<br>`;
                } else if (char === '^') {
                    explanation += `<strong>^:</strong> Start of string/line<br>`;
                } else if (char === '$') {
                    explanation += `<strong>$:</strong> End of string/line<br>`;
                } else if (char === '.') {
                    explanation += `<strong>.:</strong> Any character except newline<br>`;
                } else if (char === '|') {
                    explanation += `<strong>|:</strong> Alternation (OR)<br>`;
                }
            }

            return explanation || 'No breakdown available';
        }

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
