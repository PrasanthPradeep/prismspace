import AuraLegacyToolPage from '@/components/dev-tools/AuraLegacyToolPage';

const page = {
  "documentClassName": "legacy-tool-document",
  "bodyClassName": "legacy-tool-route",
  "title": "Markdown Editor",
  "headMarkup": `<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'JetBrains Mono', monospace;
  background: #0a0e27;
  color: #e0e0e0;
  height: 100vh;
  overflow: hidden;
}
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.header {
  padding: 0.75rem 1rem;
  background: #1a1f3a;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header h1 {
  font-size: 1.1rem;
  color: #00ff88;
}
.header-buttons {
  display: flex;
  gap: 0.5rem;
}
.header button {
  background: #00ff88;
  color: #000;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  font-size: 0.8rem;
  transition: opacity 0.3s;
}
.header button:hover { opacity: 0.8; }
.header button.close { background: #ff4444; color: white; }
.toolbar {
  background: #1a1f3a;
  border-bottom: 1px solid #333;
  padding: 0.5rem 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.toolbar button {
  background: #1a1f3a;
  color: #00ff88;
  border: 1px solid #333;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  transition: all 0.3s;
}
.toolbar button:hover { background: #2a2f4a; border-color: #00ff88; }
.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
}
.pane:last-child { border-right: none; }
.pane-header {
  background: #1a1f3a;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  color: #888;
  border-bottom: 1px solid #333;
}
.pane-content {
  flex: 1;
  display: flex;
}
.pane-content textarea,
.pane-content #preview {
  width: 100%;
  height: 100%;
  background: #0a0e27;
  color: #e0e0e0;
  border: none;
  padding: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  resize: none;
  outline: none;
}
.pane-content #preview {
  overflow-y: auto;
  line-height: 1.6;
}
.pane-content #preview h1 { color: #00ff88; font-size: 1.5rem; margin: 0.5rem 0; }
.pane-content #preview h2 { color: #00ff88; font-size: 1.3rem; margin: 0.5rem 0; }
.pane-content #preview h3 { color: #00ff88; font-size: 1.1rem; margin: 0.5rem 0; }
.pane-content #preview code {
  background: #1a1f3a;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85rem;
}
.pane-content #preview pre {
  background: #1a1f3a;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5rem 0;
}
.pane-content #preview blockquote {
  border-left: 4px solid #00ff88;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #888;
}
.pane-content #preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
}
.pane-content #preview th,
.pane-content #preview td {
  border: 1px solid #333;
  padding: 0.5rem;
  text-align: left;
}
.pane-content #preview th { background: #1a1f3a; }
.status-bar {
  background: #1a1f3a;
  border-top: 1px solid #333;
  padding: 0.4rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #888;
}
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ff4444; margin-right: 6px; }
.status-dot.saved { background: #00ff88; }
</style>`,
  "bodyMarkup": `<div class="container" id="container">
<div class="header">
  <h1>📝 Markdown Editor</h1>
  <div class="header-buttons">
    <button data-click="toggleDistractionMode">Focus Mode</button>
    <button class="close" data-click="close">Close</button>
  </div>
</div>
<div class="toolbar">
  <button data-click="insertMarkdown" data-params="**bold**|**|**">Bold</button>
  <button data-click="insertMarkdown" data-params="*italic*|*|*">Italic</button>
  <button data-click="insertMarkdown" data-params="\`code\`|\`|\`">Code</button>
  <button data-click="insertMarkdown" data-params="[link](url)|[|](url)">Link</button>
  <button data-click="insertMarkdown" data-params="![alt](image.jpg)|![|](image.jpg)">Image</button>
  <button data-click="insertMarkdown" data-params="# Heading||">H1</button>
  <button data-click="insertMarkdown" data-params="## Heading||">H2</button>
  <button data-click="insertMarkdown" data-params="> Quote||">Quote</button>
  <button data-click="insertTable">Table</button>
  |
  <button data-click="copyAsHTML">Copy HTML</button>
  <button data-click="downloadMD">Download .md</button>
  <button data-click="downloadHTML">Download .html</button>
</div>
<div class="editor-container">
  <div class="pane">
    <div class="pane-header">Raw Markdown</div>
    <div class="pane-content">
      <textarea id="editor" placeholder="# Write your markdown here..."></textarea>
    </div>
  </div>
  <div class="pane">
    <div class="pane-header">Preview</div>
    <div class="pane-content">
      <div id="preview">Start typing to see the preview...</div>
    </div>
  </div>
</div>
<div class="status-bar">
  <div><span class="status-dot" id="statusDot"></span><span id="statusText">Ready</span></div>
  <div id="stats">Words: 0 | Chars: 0 | Reading time: 0 min</div>
</div>
</div>`,
  "scripts": [],
  "externalScripts": ["/converted-inline/markdown-editor.js"]
};

export const title = page.title;

export default function MarkdownEditor() {
  return <AuraLegacyToolPage {...page} />;
}
