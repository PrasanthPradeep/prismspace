
        const formatInput = document.getElementById('formatInput');
        const formatOutput = document.getElementById('formatOutput');
        const formatError = document.getElementById('formatError');
        const treeInput = document.getElementById('treeInput');
        const treeOutput = document.getElementById('treeOutput');
        const queryInput = document.getElementById('queryInput');
        const queryPath = document.getElementById('queryPath');
        const queryOutput = document.getElementById('queryOutput');
        const transformInput = document.getElementById('transformInput');
        const transformOutput = document.getElementById('transformOutput');

        function switchTab(e, tabName) {
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            e.target.classList.add('active');
        }

        function formatJSON(json) {
            try {
                const parsed = JSON.parse(json);
                return JSON.stringify(parsed, null, 2);
            } catch (e) {
                throw new Error(`Line ${e.message.match(/\d+/) || 'unknown'}: ${e.message}`);
            }
        }

        formatInput.addEventListener('input', () => {
            formatError.innerHTML = '';
            if (!formatInput.value.trim()) {
                formatOutput.value = '';
                return;
            }
            try {
                formatOutput.value = formatJSON(formatInput.value);
            } catch (e) {
                formatError.innerHTML = `<div class="error">❌ ${e.message}</div>`;
            }
        });

        // Handle paste event for auto-format
        formatInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                try {
                    formatOutput.value = formatJSON(formatInput.value);
                } catch (err) {
                    formatError.innerHTML = `<div class="error">❌ ${err.message}</div>`;
                }
            }, 10);
        });

        treeInput.addEventListener('input', () => {
            if (!treeInput.value.trim()) {
                treeOutput.innerHTML = 'Tree will appear here';
                return;
            }
            try {
                const obj = JSON.parse(treeInput.value);
                treeOutput.innerHTML = renderTree(obj);
            } catch (e) {
                treeOutput.innerHTML = `<div class="error">❌ Invalid JSON</div>`;
            }
        });

        function renderTree(obj, depth = 0) {
            let html = '';
            if (typeof obj === 'object' && obj !== null) {
                if (Array.isArray(obj)) {
                    html += `<div class="tree-item">[ ${obj.length} items ]</div>`;
                    obj.forEach((item, i) => {
                        html += `<div class="tree-item" style="margin-left: ${(depth + 1) * 1.5}rem;">
                            <span class="tree-key">[${i}]:</span> ${renderTreeValue(item, depth + 1)}
                        </div>`;
                    });
                } else {
                    html += `<div class="tree-item">{ ${Object.keys(obj).length} keys }</div>`;
                    Object.entries(obj).forEach(([key, val]) => {
                        html += `<div class="tree-item" style="margin-left: ${(depth + 1) * 1.5}rem;">
                            <span class="tree-key">"${key}":</span> ${renderTreeValue(val, depth + 1)}
                        </div>`;
                    });
                }
            }
            return html;
        }

        function renderTreeValue(val, depth) {
            if (val === null) return '<span class="tree-value">null</span>';
            if (typeof val === 'boolean') return `<span class="tree-value">${val}</span>`;
            if (typeof val === 'number') return `<span class="tree-value">${val}</span>`;
            if (typeof val === 'string') return `<span class="tree-value">"${val.substring(0, 50)}${val.length > 50 ? '...' : ''}"</span>`;
            if (Array.isArray(val)) return `<span class="tree-value">[${val.length}]</span>`;
            if (typeof val === 'object') return `<span class="tree-value">{...}</span>`;
        }

        queryInput.addEventListener('input', () => executeQuery());
        queryPath.addEventListener('input', () => executeQuery());

        function executeQuery() {
            if (!queryInput.value.trim() || !queryPath.value.trim()) {
                queryOutput.innerHTML = 'Ready for query';
                return;
            }
            try {
                const obj = JSON.parse(queryInput.value);
                const results = queryJSONPath(obj, queryPath.value);
                queryOutput.innerHTML = `<pre>${JSON.stringify(results, null, 2)}</pre>`;
            } catch (e) {
                queryOutput.innerHTML = `<div class="error">❌ ${e.message}</div>`;
            }
        }

        function queryJSONPath(obj, path) {
            if (path === '$') return obj;
            if (path === '$[*]') return Array.isArray(obj) ? obj : Object.values(obj);
            
            const parts = path.replace('$', '').split(/[\.\[\]]/).filter(p => p);
            let current = obj;
            
            for (let part of parts) {
                if (current === null || current === undefined) return undefined;
                if (part === '*') return Array.isArray(current) ? current : Object.values(current);
                current = current[part];
            }
            return current;
        }

        function performDiff() {
            const diff1 = document.getElementById('diffInput1').value;
            const diff2 = document.getElementById('diffInput2').value;
            const diffOutput = document.getElementById('diffOutput');
            
            if (!diff1.trim() || !diff2.trim()) {
                diffOutput.innerHTML = '<div class="error">❌ Please provide both JSON inputs</div>';
                return;
            }
            
            try {
                const obj1 = JSON.parse(diff1);
                const obj2 = JSON.parse(diff2);
                
                const changes = diffObjects(obj1, obj2);
                let html = '';
                
                if (changes.added.length === 0 && changes.removed.length === 0 && changes.changed.length === 0) {
                    html = '<div class="success">✓ No differences</div>';
                } else {
                    if (changes.added.length > 0) {
                        html += `<div class="success">+ Added: ${changes.added.join(', ')}</div>`;
                    }
                    if (changes.removed.length > 0) {
                        html += `<div class="error">- Removed: ${changes.removed.join(', ')}</div>`;
                    }
                    if (changes.changed.length > 0) {
                        html += `<div style="color: #ffaa00;">~ Changed: ${changes.changed.join(', ')}</div>`;
                    }
                }
                
                diffOutput.innerHTML = html;
            } catch (e) {
                diffOutput.innerHTML = `<div class="error">❌ ${e.message}</div>`;
            }
        }

        function diffObjects(obj1, obj2) {
            const changes = { added: [], removed: [], changed: [] };
            const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
            
            for (let key of allKeys) {
                if (!(key in obj1)) {
                    changes.added.push(key);
                } else if (!(key in obj2)) {
                    changes.removed.push(key);
                } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                    changes.changed.push(key);
                }
            }
            
            return changes;
        }

        function transformFormat(format) {
            const input = transformInput.value;
            if (!input.trim()) return;
            
            try {
                const obj = JSON.parse(input);
                let output = '';
                
                switch (format) {
                    case 'minify':
                        output = JSON.stringify(obj);
                        break;
                    case 'pretty':
                        output = JSON.stringify(obj, null, 2);
                        break;
                    case 'sort':
                        output = JSON.stringify(sortKeys(obj), null, 2);
                        break;
                    case 'csv':
                        output = jsonToCSV(obj);
                        break;
                    case 'yaml':
                        output = jsonToYAML(obj);
                        break;
                }
                
                transformOutput.value = output;
            } catch (e) {
                transformOutput.value = `Error: ${e.message}`;
            }
        }

        function sortKeys(obj) {
            if (Array.isArray(obj)) {
                return obj.map(sortKeys);
            } else if (obj !== null && typeof obj === 'object') {
                return Object.keys(obj)
                    .sort()
                    .reduce((sorted, key) => {
                        sorted[key] = sortKeys(obj[key]);
                        return sorted;
                    }, {});
            }
            return obj;
        }

        function jsonToCSV(obj) {
            if (!Array.isArray(obj)) return 'Error: Input must be an array';
            if (obj.length === 0) return '';
            
            const headers = Object.keys(obj[0]);
            const csv = [headers.join(',')];
            
            for (let row of obj) {
                csv.push(headers.map(h => {
                    const val = row[h];
                    const str = typeof val === 'string' ? val : JSON.stringify(val);
                    return `"${str.replace(/"/g, '""')}"`;
                }).join(','));
            }
            
            return csv.join('\
');
        }

        function jsonToYAML(obj, indent = 0) {
            let yaml = '';
            const spaces = ' '.repeat(indent);
            
            if (Array.isArray(obj)) {
                for (let item of obj) {
                    if (typeof item === 'object' && item !== null) {
                        yaml += spaces + '- ' + jsonToYAML(item, indent + 2).substring(indent + 2) + '\
';
                    } else {
                        yaml += spaces + `- ${item}\
`;
                    }
                }
            } else if (obj !== null && typeof obj === 'object') {
                for (let [key, val] of Object.entries(obj)) {
                    if (typeof val === 'object' && val !== null) {
                        yaml += spaces + `${key}:\
${jsonToYAML(val, indent + 2)}`;
                    } else {
                        yaml += spaces + `${key}: ${val}\
`;
                    }
                }
            }
            
            return yaml;
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
