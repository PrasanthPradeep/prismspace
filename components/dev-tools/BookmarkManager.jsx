import AuraLegacyToolPage from '@/components/dev-tools/AuraLegacyToolPage';

const page = {
  documentClassName: 'legacy-tool-document',
  bodyClassName: 'legacy-tool-route',
  title: 'Bookmark Manager',
  headMarkup: `<style>
:root { --bg:#0b0e13; --panel:#121821; --border:#283241; --text:#f8fafc; --muted:#94a3b8; --accent:#22c55e; }
* { box-sizing:border-box; }
body { margin:0; font-family:"Segoe UI",sans-serif; color:var(--text); background:radial-gradient(circle at top,#173145 0%,var(--bg) 40%); }
.app { padding:24px; display:grid; gap:20px; }
.grid { display:grid; grid-template-columns:360px 1fr; gap:20px; align-items:start; }
.panel { background:rgba(18,24,33,.94); border:1px solid var(--border); border-radius:18px; padding:18px; }
h1,h2,h3,p { margin:0; }
.row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.stack { display:grid; gap:12px; }
input, textarea, button, select { width:100%; font:inherit; color:inherit; background:#0f141b; border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
textarea { min-height:90px; resize:vertical; }
button { cursor:pointer; width:auto; }
.primary { background:rgba(34,197,94,.14); border-color:rgba(34,197,94,.42); }
.small { font-size:13px; color:var(--muted); }
.filters { display:grid; grid-template-columns:1fr 180px; gap:12px; }
.bookmarks { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; margin-top:16px; }
.card { background:#0f141b; border:1px solid var(--border); border-radius:16px; padding:14px; display:grid; gap:10px; }
.card:hover { border-color:#3a4658; }
.head { display:grid; grid-template-columns:40px 1fr auto; gap:12px; align-items:center; }
.favicon, .initial { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background:#1a2330; overflow:hidden; font-weight:700; }
.favicon img { width:100%; height:100%; object-fit:cover; }
.tags { display:flex; flex-wrap:wrap; gap:8px; }
.tag { padding:4px 8px; border-radius:999px; background:rgba(255,255,255,.06); font-size:12px; color:var(--muted); }
.empty { text-align:center; padding:40px 18px; color:var(--muted); border:1px dashed var(--border); border-radius:16px; }
.browser-import { border-color:rgba(96,165,250,.4); background:rgba(96,165,250,.08); color:#93c5fd; }
.browser-import:hover { border-color:rgba(96,165,250,.6); }
.import-progress { font-size:12px; color:var(--muted); margin-top:4px; }
@media (max-width: 940px) { .grid, .filters { grid-template-columns:1fr; } }
</style>`,
  bodyMarkup: `<div class="app">
<div>
  <h1>Bookmark Manager</h1>
  <p class="small" style="margin-top:8px;">Save, tag, search, import, and export local bookmarks.</p>
</div>
<div class="grid">
  <section class="panel stack">
    <h2>Add Bookmark</h2>
    <input id="urlInput" placeholder="https://example.com">
    <input id="titleInput" placeholder="Title">
    <input id="tagsInput" placeholder="tags, separated, by commas">
    <textarea id="notesInput" placeholder="Notes"></textarea>
    <div class="row">
      <button id="autofillBtn">Autofill title</button>
      <button id="addBtn" class="primary">Add bookmark</button>
    </div>
    <p id="addMessage" class="small"></p>
    <hr style="border-color:var(--border); width:100%;">
    <h3>Import</h3>
    <div class="stack">
      <button id="importBrowserBtn" class="browser-import">Import from Browser</button>
      <p id="importProgress" class="import-progress"></p>
    </div>
    <hr style="border-color:var(--border); width:100%;">
    <h3>Bulk Import</h3>
    <textarea id="bulkInput" placeholder="Paste one URL per line"></textarea>
    <div class="row">
      <button id="bulkAddBtn">Bulk add</button>
      <button id="exportJsonBtn">Export JSON</button>
      <button id="exportHtmlBtn">Export HTML</button>
    </div>
  </section>

  <section class="panel">
    <div class="filters">
      <input id="searchInput" placeholder="Search title, URL, or notes">
      <select id="tagFilter"><option value="">All tags</option></select>
    </div>
    <div class="bookmarks" id="bookmarks"></div>
    <div id="emptyState" class="empty">No bookmarks yet.</div>
  </section>
</div>
</div>`,
  scripts: [],
  externalScripts: ["/converted-inline/bookmark-manager.js"]
};

export const title = page.title;

export default function BookmarkManager() {
  return <AuraLegacyToolPage {...page} />;
}
