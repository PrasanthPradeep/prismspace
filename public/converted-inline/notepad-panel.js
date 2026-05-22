
        let notes = [];
        let currentTabIndex = 0;

        // Initialize
        function init() {
            loadNotes();
            updateStats();
            updateSavedNotesList();
            loadFontPreferences();
            
            const editor = document.getElementById('noteEditor');
            editor.addEventListener('input', function() {
                updateStats();
                autoSaveNote();
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'b') {
                        e.preventDefault();
                        formatText('bold');
                    } else if (e.key === 'i') {
                        e.preventDefault();
                        formatText('italic');
                    } else if (e.key === 'u') {
                        e.preventDefault();
                        formatText('underline');
                    } else if (e.key === 's') {
                        e.preventDefault();
                        saveNote();
                    }
                }
            });

            // Auto-continue bullets and checkboxes on Enter
            editor.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    const cursorPos = editor.selectionStart;
                    const text = editor.value;
                    const lines = text.substring(0, cursorPos).split('\
');
                    const currentLine = lines[lines.length - 1];
                    
                    // Check for bullet points
                    const bulletMatch = currentLine.match(/^(\s*)(•|\*|-|\+)\s/);
                    if (bulletMatch) {
                        e.preventDefault();
                        const indent = bulletMatch[1];
                        const bullet = bulletMatch[2];
                        
                        // If line only has bullet (empty), remove it
                        if (currentLine.trim() === bullet) {
                            const newText = text.substring(0, cursorPos - currentLine.length) + 
                                          text.substring(cursorPos);
                            editor.value = newText;
                            editor.selectionStart = editor.selectionEnd = cursorPos - currentLine.length;
                        } else {
                            const newLine = `\
${indent}${bullet} `;
                            const newText = text.substring(0, cursorPos) + newLine + text.substring(cursorPos);
                            editor.value = newText;
                            editor.selectionStart = editor.selectionEnd = cursorPos + newLine.length;
                        }
                        updateStats();
                        autoSaveNote();
                        return;
                    }
                    
                    // Check for checkboxes
                    const checkboxMatch = currentLine.match(/^(\s*)(☐|☑|☒)\s/);
                    if (checkboxMatch) {
                        e.preventDefault();
                        const indent = checkboxMatch[1];
                        
                        // If line only has checkbox (empty), remove it
                        if (currentLine.trim() === '☐' || currentLine.trim() === '☑' || currentLine.trim() === '☒') {
                            const newText = text.substring(0, cursorPos - currentLine.length) + 
                                          text.substring(cursorPos);
                            editor.value = newText;
                            editor.selectionStart = editor.selectionEnd = cursorPos - currentLine.length;
                        } else {
                            const newLine = `\
${indent}☐ `;
                            const newText = text.substring(0, cursorPos) + newLine + text.substring(cursorPos);
                            editor.value = newText;
                            editor.selectionStart = editor.selectionEnd = cursorPos + newLine.length;
                        }
                        updateStats();
                        autoSaveNote();
                        return;
                    }
                    
                    // Check for numbered lists
                    const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
                    if (numberMatch) {
                        e.preventDefault();
                        const indent = numberMatch[1];
                        const number = parseInt(numberMatch[2]);
                        
                        // If line only has number (empty), remove it
                        if (currentLine.trim() === `${number}.`) {
                            const newText = text.substring(0, cursorPos - currentLine.length) + 
                                          text.substring(cursorPos);
                            editor.value = newText;
                            editor.selectionStart = editor.selectionEnd = cursorPos - currentLine.length;
                        } else {
                            const newLine = `\
${indent}${number + 1}. `;
                            const newText = text.substring(0, cursorPos) + newLine + text.substring(cursorPos);
                            editor.value = newText;
                            editor.selectionStart = editor.selectionEnd = cursorPos + newLine.length;
                        }
                        updateStats();
                        autoSaveNote();
                        return;
                    }
                }
            });
        }

        function toggleSavedNotes() {
            const list = document.getElementById('savedNotesList');
            const toggle = document.getElementById('savedNotesToggle');
            list.classList.toggle('expanded');
            toggle.classList.toggle('expanded');
        }

        function updateSavedNotesList() {
            const listContainer = document.getElementById('savedNotesList');
            listContainer.innerHTML = '';

            if (notes.length === 0) {
                listContainer.innerHTML = '<div style="color: rgba(255,255,255,0.4); font-size: 13px; padding: 12px;">No saved notes yet</div>';
                return;
            }

            notes.forEach((note, index) => {
                const preview = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
                const noteItem = document.createElement('div');
                noteItem.className = 'saved-note-item';
                noteItem.onclick = () => {
                    switchTab(index);
                    // Collapse the saved notes section after selecting
                    const list = document.getElementById('savedNotesList');
                    const toggle = document.getElementById('savedNotesToggle');
                    list.classList.remove('expanded');
                    toggle.classList.remove('expanded');
                };
                
                noteItem.innerHTML = `
                    <div class="saved-note-info">
                        <div class="saved-note-name">${note.title}</div>
                        <div class="saved-note-preview">${preview || 'Empty note'}</div>
                    </div>
                `;
                
                listContainer.appendChild(noteItem);
            });
        }

        function loadNotes() {
            const saved = localStorage.getItem('notepadTabs');
            if (saved) {
                notes = JSON.parse(saved);
            } else {
                notes = [{
                    id: Date.now(),
                    title: 'Your ideas here',
                    content: ''
                }];
            }
            renderTabs();
            loadCurrentNote();
        }

        function renderTabs() {
            const tabsContainer = document.querySelector('.notepad-tabs');
            tabsContainer.innerHTML = '';

            notes.forEach((note, index) => {
                const tab = document.createElement('div');
                tab.className = 'notepad-tab' + (index === currentTabIndex ? ' active' : '');
                tab.setAttribute('data-tab', index);
                tab.innerHTML = `
                    <span class="tab-name" onclick="switchTab(${index})" ondblclick="editTabName(${index}, event)">${note.title}</span>
                    <span class="tab-edit" onclick="editTabName(${index}, event)" title="Rename">✎</span>
                    ${notes.length > 1 ? `<span class="tab-close" onclick="deleteTab(${index}, event)">×</span>` : ''}
                `;
                tabsContainer.appendChild(tab);
            });

            const addBtn = document.createElement('div');
            addBtn.className = 'tab-add';
            addBtn.onclick = addNewTab;
            addBtn.textContent = '+';
            addBtn.title = 'New Note';
            tabsContainer.appendChild(addBtn);
            
            // Update saved notes list
            updateSavedNotesList();
        }

        function switchTab(index) {
            saveCurrentNote();
            currentTabIndex = index;
            loadCurrentNote();
            renderTabs();
        }

        function loadCurrentNote() {
            const editor = document.getElementById('noteEditor');
            editor.value = notes[currentTabIndex].content;
            updateStats();
        }

        function saveCurrentNote() {
            const editor = document.getElementById('noteEditor');
            notes[currentTabIndex].content = editor.value;
            saveNotes();
        }

        function saveNotes() {
            localStorage.setItem('notepadTabs', JSON.stringify(notes));
        }

        function autoSaveNote() {
            clearTimeout(window.notepadAutoSave);
            window.notepadAutoSave = setTimeout(() => {
                saveCurrentNote();
                updateSavedNotesList();
            }, 1000);
        }

        function addNewTab() {
            const newNote = {
                id: Date.now(),
                title: `Note ${notes.length + 1}`,
                content: ''
            };
            notes.push(newNote);
            currentTabIndex = notes.length - 1;
            renderTabs();
            loadCurrentNote();
            saveNotes();
        }

        function deleteTab(index, event) {
            event.stopPropagation();
            if (notes.length === 1) return;
            
            if (confirm('Delete this note?')) {
                notes.splice(index, 1);
                if (currentTabIndex >= notes.length) {
                    currentTabIndex = notes.length - 1;
                }
                renderTabs();
                loadCurrentNote();
                saveNotes();
            }
        }

        function editTabName(index, event) {
            event.stopPropagation();
            const newName = prompt('Enter new note name:', notes[index].title);
            if (newName && newName.trim()) {
                notes[index].title = newName.trim();
                renderTabs();
                saveNotes();
                updateSavedNotesList();
            }
        }

        function updateStats() {
            const editor = document.getElementById('noteEditor');
            const text = editor.value;
            const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
            const chars = text.length;
            
            document.getElementById('wordCount').textContent = words;
            document.getElementById('charCount').textContent = chars;
        }

        function formatText(format, value) {
            const editor = document.getElementById('noteEditor');
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const selectedText = editor.value.substring(start, end);
            let formattedText = '';
            
            // Get the text before cursor to check if we're at line start
            const textBeforeCursor = editor.value.substring(0, start);
            const lastNewlineIndex = textBeforeCursor.lastIndexOf('\
');
            const currentLineStart = lastNewlineIndex + 1;
            const isAtLineStart = start === currentLineStart || textBeforeCursor.substring(currentLineStart).trim() === '';

            switch(format) {
                case 'bold':
                    formattedText = `**${selectedText}**`;
                    break;
                case 'italic':
                    formattedText = `*${selectedText}*`;
                    break;
                case 'underline':
                    formattedText = `<u>${selectedText}</u>`;
                    break;
                case 'strikethrough':
                    formattedText = `~~${selectedText}~~`;
                    break;
                case 'quote':
                    // If at line start or whole line selected, format the line(s)
                    if (start === end) {
                        // No selection, format current line
                        const lineStart = currentLineStart;
                        const lineEnd = editor.value.indexOf('\
', start);
                        const currentLine = editor.value.substring(lineStart, lineEnd === -1 ? editor.value.length : lineEnd);
                        
                        if (currentLine.startsWith('> ')) {
                            // Remove quote
                            formattedText = currentLine.substring(2);
                        } else {
                            // Add quote
                            formattedText = '> ' + currentLine;
                        }
                        
                        editor.value = editor.value.substring(0, lineStart) + formattedText + editor.value.substring(lineEnd === -1 ? editor.value.length : lineEnd);
                        editor.focus();
                        editor.setSelectionRange(lineStart + formattedText.length, lineStart + formattedText.length);
                        updateStats();
                        autoSaveNote();
                        return;
                    } else {
                        // Format each selected line
                        const lines = selectedText.split('\
');
                        formattedText = lines.map(line => line.startsWith('> ') ? line : '> ' + line).join('\
');
                    }
                    break;
                case 'bulletList':
                    formattedText = `• ${selectedText}`;
                    break;
                case 'numberList':
                    formattedText = `1. ${selectedText}`;
                    break;
                case 'checklist':
                    formattedText = `☐ ${selectedText}`;
                    break;
                case 'indent':
                    formattedText = `    ${selectedText}`;
                    break;
                case 'outdent':
                    formattedText = selectedText.replace(/^\s{1,4}/, '');
                    break;
            }

            if (formattedText) {
                editor.value = editor.value.substring(0, start) + formattedText + editor.value.substring(end);
                editor.focus();
                editor.setSelectionRange(start, start + formattedText.length);
                updateStats();
                autoSaveNote();
            }
        }

        function applyHeading(level) {
            const editor = document.getElementById('noteEditor');
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const selectedText = editor.value.substring(start, end);
            
            let prefix = '';
            switch(level) {
                case 'h1': prefix = '# '; break;
                case 'h2': prefix = '## '; break;
                case 'h3': prefix = '### '; break;
                default: return;
            }
            
            // If no selection, apply to current line
            if (start === end) {
                const textBeforeCursor = editor.value.substring(0, start);
                const lastNewlineIndex = textBeforeCursor.lastIndexOf('\
');
                const lineStart = lastNewlineIndex + 1;
                const lineEnd = editor.value.indexOf('\
', start);
                const currentLine = editor.value.substring(lineStart, lineEnd === -1 ? editor.value.length : lineEnd);
                
                // Remove existing heading if present
                const cleanLine = currentLine.replace(/^#{1,6}\s/, '');
                const formattedText = prefix + cleanLine;
                
                editor.value = editor.value.substring(0, lineStart) + formattedText + editor.value.substring(lineEnd === -1 ? editor.value.length : lineEnd);
                editor.focus();
                editor.setSelectionRange(lineStart + formattedText.length, lineStart + formattedText.length);
            } else {
                const formattedText = prefix + selectedText;
                editor.value = editor.value.substring(0, start) + formattedText + editor.value.substring(end);
                editor.focus();
                editor.setSelectionRange(start, start + formattedText.length);
            }
            
            updateStats();
            autoSaveNote();
        }

        function applyFont(fontFamily) {
            const editor = document.getElementById('noteEditor');
            editor.style.fontFamily = fontFamily;
            
            // Save font preference
            localStorage.setItem('notepadFont', fontFamily);
        }

        function applyFontWeight(weight) {
            const editor = document.getElementById('noteEditor');
            editor.style.fontWeight = weight;
            
            // Save font weight preference
            localStorage.setItem('notepadFontWeight', weight);
        }

        function loadFontPreferences() {
            const editor = document.getElementById('noteEditor');
            const savedFont = localStorage.getItem('notepadFont');
            const savedWeight = localStorage.getItem('notepadFontWeight');
            
            if (savedFont) {
                editor.style.fontFamily = savedFont;
                const fontSelect = document.getElementById('fontSelect');
                if (fontSelect) fontSelect.value = savedFont;
            }
            
            if (savedWeight) {
                editor.style.fontWeight = savedWeight;
                const weightSelect = document.getElementById('fontWeightSelect');
                if (weightSelect) weightSelect.value = savedWeight;
            }
        }

        function insertFormula() {
            const editor = document.getElementById('noteEditor');
            const formula = prompt('Enter formula:');
            if (formula) {
                const start = editor.selectionStart;
                editor.value = editor.value.substring(0, start) + `$${formula}$` + editor.value.substring(start);
                editor.focus();
                updateStats();
                autoSaveNote();
            }
        }

        function downloadCurrentNote() {
            const currentNote = notes[currentTabIndex];
            const text = currentNote.content;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentNote.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            try { window.parent.postMessage({ type: 'notepadAction', action: 'download' }, '*'); } catch(e) { }
        }

        function resetCurrentNote() {
            if (confirm('Are you sure you want to reset this note? This will clear all content.')) {
                const editor = document.getElementById('noteEditor');
                editor.value = '';
                notes[currentTabIndex].content = '';
                saveNotes();
                updateStats();
                try { window.parent.postMessage({ type: 'notepadAction', action: 'reset' }, '*'); } catch(e) { }
            }
        }

        function saveNote() {
            saveCurrentNote();
            // Send message to parent window
            try { window.parent.postMessage({ type: 'notepadSave', success: true }, '*'); } catch(e) { }
        }

        function closePanel() {
            // Send message to parent window to close the panel
            try { window.parent.postMessage({ type: 'closeNotepad' }, '*'); } catch(e) { }
        }

        // Handle checkbox functionality
        document.addEventListener('DOMContentLoaded', function() {
            const editor = document.getElementById('noteEditor');
            
            // Enhanced checkbox clicking
            editor.addEventListener('click', function(e) {
                const lines = editor.value.split('\
');
                const cursorPos = editor.selectionStart;
                let currentPos = 0;
                let clickedLine = -1;

                for (let i = 0; i < lines.length; i++) {
                    const lineLength = lines[i].length + 1; // +1 for newline
                    if (cursorPos >= currentPos && cursorPos < currentPos + lineLength) {
                        clickedLine = i;
                        break;
                    }
                    currentPos += lineLength;
                }

                if (clickedLine !== -1) {
                    const line = lines[clickedLine];
                    const checkboxPos = line.search(/[☐☑☒]/);
                    
                    // Only toggle if clicked near the checkbox (within first 10 characters)
                    const clickPosInLine = cursorPos - currentPos + clickedLine;
                    if (checkboxPos !== -1 && clickPosInLine <= checkboxPos + 5) {
                        // Cycle through checkbox states: ☐ → ☑ → ☐
                        if (line.includes('☐')) {
                            lines[clickedLine] = line.replace('☐', '☑');
                        } else if (line.includes('☑')) {
                            lines[clickedLine] = line.replace('☑', '☐');
                        } else if (line.includes('☒')) {
                            lines[clickedLine] = line.replace('☒', '☐');
                        }
                        
                        const newText = lines.join('\
');
                        const cursorOffset = newText.length - editor.value.length;
                        editor.value = newText;
                        editor.selectionStart = editor.selectionEnd = cursorPos + cursorOffset;
                        updateStats();
                        autoSaveNote();
                    }
                }
            });

            // Keyboard shortcut to toggle checkbox on current line (Alt + X)
            editor.addEventListener('keydown', function(e) {
                if (e.altKey && e.key === 'x') {
                    e.preventDefault();
                    const cursorPos = editor.selectionStart;
                    const lines = editor.value.split('\
');
                    let currentPos = 0;
                    let currentLineIndex = -1;

                    for (let i = 0; i < lines.length; i++) {
                        const lineLength = lines[i].length + 1;
                        if (cursorPos >= currentPos && cursorPos < currentPos + lineLength) {
                            currentLineIndex = i;
                            break;
                        }
                        currentPos += lineLength;
                    }

                    if (currentLineIndex !== -1) {
                        const line = lines[currentLineIndex];
                        if (line.includes('☐')) {
                            lines[currentLineIndex] = line.replace('☐', '☑');
                        } else if (line.includes('☑')) {
                            lines[currentLineIndex] = line.replace('☑', '☐');
                        } else if (line.includes('☒')) {
                            lines[currentLineIndex] = line.replace('☒', '☐');
                        } else {
                            // Add checkbox if line doesn't have one
                            lines[currentLineIndex] = '☐ ' + line;
                        }
                        
                        editor.value = lines.join('\
');
                        editor.selectionStart = editor.selectionEnd = cursorPos;
                        updateStats();
                        autoSaveNote();
                    }
                }
            });
        });

        // Initialize on load
        init();

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
