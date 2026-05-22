import AuraLegacyToolPage from '@/components/dev-tools/AuraLegacyToolPage';

const page = {
  documentClassName: 'legacy-tool-document',
  bodyClassName: 'legacy-tool-route',
  title: 'Random Picker',

  headMarkup: `
  <style>
  :root {
    --bg: #0b0d12;
    --panel: #131821;
    --border: #27303d;
    --text: #f8fafc;
    --muted: #94a3b8;
    --accent: #22c55e;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: "Segoe UI", sans-serif;
    background: radial-gradient(circle at top, #18283c 0%, var(--bg) 40%);
    color: var(--text);
    min-height: 100vh;
  }

  .app {
    padding: 24px;
    display: grid;
    gap: 18px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 18px;
  }

  .panel {
    background: rgba(19, 24, 33, .95);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 18px;
  }

  .modes {
    display: grid;
    gap: 8px;
  }

  .mode-btn {
    width: 100%;
    text-align: left;
    padding: 12px;
    border-radius: 12px;
    background: #0f141b;
    border: 1px solid var(--border);
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn.active {
    border-color: rgba(34, 197, 94, .45);
    background: rgba(34, 197, 94, .08);
    color: var(--accent);
  }

  .mode-btn:hover:not(.active) {
    border-color: var(--muted);
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  .small {
    font-size: 13px;
    color: var(--muted);
  }

  .stack {
    display: grid;
    gap: 12px;
  }

  input,
  textarea,
  button,
  select {
    font: inherit;
    color: inherit;
    background: #0f141b;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;
    transition: all 0.2s;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--accent);
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  button {
    cursor: pointer;
    font-weight: 500;
  }

  .primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #000;
  }

  .primary:hover {
    opacity: 0.9;
  }

  .primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .result {
    min-height: 240px;
    display: grid;
    place-items: center;
    text-align: center;
    border: 1px dashed var(--border);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
  }

  .result-value {
    font-size: clamp(32px, 7vw, 72px);
    font-weight: 700;
    letter-spacing: -.02em;
    padding: 20px;
  }

  .pop-anim {
    animation: pop .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .spin-anim {
    animation: pulse 0.1s infinite alternate;
    opacity: 0.7;
  }

  .history {
    display: grid;
    gap: 8px;
    max-height: 400px;
    overflow-y: auto;
  }

  .history-item {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #0f141b;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  @keyframes pop {
    0% {
      transform: scale(.8);
      opacity: 0;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(0.98);
    }

    100% {
      transform: scale(1.02);
    }
  }

  @media(max-width:900px) {
    .layout,
    .grid2 {
      grid-template-columns: 1fr;
    }
  }
  </style>
  `,

  bodyMarkup: `
  <div class="app">
  <div>
  <h1>Random Picker</h1>
  <p class="small" style="margin-top:8px;">
  Names, numbers, coin flips, dice, shuffled lists, and yes/no with saved history.
  </p>
  </div>

  <div class="layout">
  <aside class="panel">
  <div class="modes" id="modeButtons"></div>
  </aside>

  <main class="stack">
  <section class="panel" id="controlsPanel"></section>

  <section class="panel result">
  <div id="resultBox" class="result-value">Ready</div>
  </section>

  <section class="panel">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
  <h2>History</h2>

          <button
  class="small"
  id="clearHistoryBtn"
  style="padding:4px 8px; background:transparent; border:1px solid var(--border);"
  >
  Clear
  </button>
  </div>

  <div id="history" class="history"></div>
  </section>
  </main>
  </div>
  </div>
  `,

  scripts: [],
  externalScripts: ["/converted-inline/random-picker.js"]
};

export const title = page.title;

export default function RandomPicker() {
  return <AuraLegacyToolPage {...page} />;
}
