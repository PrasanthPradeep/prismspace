
        // Local prompt synthesis - no external API needed
        window.synthesizePrompt = async function() {
            const inputPrompt = document.getElementById('inputPrompt').value.trim();
            const formatSelect = document.getElementById('formatSelect').value;
            const outputArea = document.getElementById('outputArea');
            const synthesizeBtn = document.getElementById('synthesizeBtn');

            if (!inputPrompt) {
                showError("Please enter a prompt first!");
                return;
            }

            // Show loading state
            synthesizeBtn.disabled = true;
            outputArea.innerHTML = '<div class="loading"><div class="spinner"></div><span>Synthesizing prompt...</span></div>';

            try {
                // Simulate async processing
                await new Promise(resolve => setTimeout(resolve, 500));
                
                let output = "";
                
                switch(formatSelect) {
                    case 'improved':
                        output = improvePrompt(inputPrompt);
                        break;
                    case 'xml':
                        output = convertToXML(inputPrompt);
                        break;
                    case 'json':
                        output = convertToJSON(inputPrompt);
                        break;
                    case 'markdown':
                        output = convertToMarkdown(inputPrompt);
                        break;
                }

                // Display output
                outputArea.textContent = output || "No output generated";

            } catch (error) {
                console.error("Error:", error);
                showError("Failed to synthesize prompt: " + error.message);
            } finally {
                synthesizeBtn.disabled = false;
            }
        };

        // Local prompt improvement function
        function improvePrompt(prompt) {
            const lines = prompt.split('\
').map(l => l.trim()).filter(l => l);
            
            let improved = "# Enhanced Prompt\
\
";
            improved += "## Context\
";
            improved += "You are working on the following task:\
\
";
            
            // Add the original prompt with improvements
            improved += lines.map(line => {
                // Add specificity
                if (!line.endsWith('.') && !line.endsWith('?') && !line.endsWith(':')) {
                    line += '.';
                }
                return line;
            }).join('\
');
            
            improved += "\
\
## Requirements\
";
            improved += "- Provide a detailed and comprehensive response\
";
            improved += "- Use clear, concise language\
";
            improved += "- Include examples where relevant\
";
            improved += "- Structure your response logically\
";
            
            improved += "\
\
## Output Format\
";
            improved += "Please organize your response with:\
";
            improved += "1. A brief summary\
";
            improved += "2. Detailed explanation\
";
            improved += "3. Practical examples\
";
            improved += "4. Next steps or recommendations\
";
            
            return improved;
        }

        // Convert prompt to XML format
        function convertToXML(prompt) {
            const lines = prompt.split('\
').map(l => l.trim()).filter(l => l);
            
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\
';
            xml += '<prompt>\
';
            xml += '  <metadata>\
';
            xml += `    <timestamp>${new Date().toISOString()}</timestamp>\
`;
            xml += '    <version>1.0</version>\
';
            xml += '  </metadata>\
';
            xml += '  <content>\
';
            
            lines.forEach((line, idx) => {
                xml += `    <instruction id="${idx + 1}">${escapeXml(line)}</instruction>\
`;
            });
            
            xml += '  </content>\
';
            xml += '  <requirements>\
';
            xml += '    <requirement>Provide detailed response</requirement>\
';
            xml += '    <requirement>Include relevant examples</requirement>\
';
            xml += '    <requirement>Maintain logical structure</requirement>\
';
            xml += '  </requirements>\
';
            xml += '</prompt>';
            
            return xml;
        }

        // Convert prompt to JSON format
        function convertToJSON(prompt) {
            const lines = prompt.split('\
').map(l => l.trim()).filter(l => l);
            
            const json = {
                prompt: {
                    metadata: {
                        timestamp: new Date().toISOString(),
                        version: "1.0",
                        type: "instruction"
                    },
                    content: {
                        instructions: lines,
                        mainTask: lines[0] || prompt
                    },
                    requirements: [
                        "Provide detailed and comprehensive response",
                        "Use clear and concise language",
                        "Include practical examples",
                        "Maintain logical structure"
                    ],
                    outputFormat: {
                        structure: [
                            "Summary",
                            "Detailed explanation",
                            "Examples",
                            "Recommendations"
                        ]
                    }
                }
            };
            
            return JSON.stringify(json, null, 2);
        }

        // Convert prompt to Markdown format
        function convertToMarkdown(prompt) {
            const lines = prompt.split('\
').map(l => l.trim()).filter(l => l);
            
            let md = '# Prompt\
\
';
            md += '## Task Description\
\
';
            
            lines.forEach((line, idx) => {
                md += `${idx + 1}. ${line}\
`;
            });
            
            md += '\
## Guidelines\
\
';
            md += '- **Clarity**: Use clear and unambiguous language\
';
            md += '- **Detail**: Provide comprehensive information\
';
            md += '- **Examples**: Include relevant examples where applicable\
';
            md += '- **Structure**: Organize content logically\
\
';
            
            md += '## Expected Output\
\
';
            md += '```\
';
            md += '1. Executive Summary\
';
            md += '2. Detailed Analysis\
';
            md += '3. Practical Examples\
';
            md += '4. Recommendations\
';
            md += '```\
\
';
            
            md += '## Notes\
\
';
            md += `> Generated on ${new Date().toLocaleString()}\
`;
            
            return md;
        }

        // Helper function to escape XML special characters
        function escapeXml(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        window.copyOutput = function() {
            const outputArea = document.getElementById('outputArea');
            const text = outputArea.textContent;

            if (!text || text.includes('Enter a prompt')) {
                showToast('No output to copy!', 'error');
                return;
            }

            navigator.clipboard.writeText(text).then(() => {
                showToast('✅ Output copied to clipboard!');
            }).catch(err => {
                showToast('❌ Failed to copy', 'error');
            });
        };

        window.clearAll = function() {
            document.getElementById('inputPrompt').value = '';
            document.getElementById('outputArea').innerHTML = '<div style="color: rgba(255, 255, 255, 0.4); text-align: center; padding: 40px;">Enter a prompt and click "Synthesize" to get started</div>';
            updateCharCount();
        };

        window.updateCharCount = function() {
            const input = document.getElementById('inputPrompt').value;
            document.getElementById('charCount').textContent = `${input.length} characters`;
        };

        function showError(message) {
            const outputArea = document.getElementById('outputArea');
            outputArea.innerHTML = `<div class="error">⚠️ ${message}</div>`;
        }

        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? 'rgba(255, 77, 77, 0.9)' : 'rgba(16, 185, 129, 0.9)'};
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                font-weight: 500;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            `;
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        window.closePanel = function() {
            if (window.parent && window.parent !== window) {
                try {
                    try { window.parent.postMessage({ action: 'closePromptSynthesizer' }, '*'); } catch(e) { window.close(); }
                    if (typeof window.parent.closePromptSynthesizer === 'function') {
                        window.parent.closePromptSynthesizer();
                    }
                } catch (e) {
                    window.close();
                }
            } else {
                window.close();
            }
        };

        // Handle Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closePanel();
            }
        });

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

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
