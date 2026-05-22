import AuraLegacyToolPage from '@/components/dev-tools/AuraLegacyToolPage';

const page = {
  "documentClassName": "legacy-tool-document",
  "bodyClassName": "legacy-tool-route",
  "title": "Shortcut Reference",
  "headMarkup": "<style>\n        :root { --bg:#0b0f14; --panel:#121923; --border:#273240; --text:#f8fafc; --muted:#94a3b8; --accent:#22c55e; }\n        *{box-sizing:border-box} body{margin:0;font-family:\"Segoe UI\",sans-serif;background:radial-gradient(circle at top,#16273a 0%,var(--bg) 42%);color:var(--text)}\n        .app{padding:24px;display:grid;gap:18px}\n        .panel{background:rgba(18,25,35,.94);border:1px solid var(--border);border-radius:18px;padding:18px}\n        .apps{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}\n        .app-btn{padding:12px;border-radius:14px;border:1px solid var(--border);background:#0f151d;color:var(--text);cursor:pointer}\n        .app-btn.active{border-color:rgba(34,197,94,.45);background:rgba(34,197,94,.08)}\n        .toolbar{display:grid;grid-template-columns:1fr 220px 180px;gap:12px}\n        input,select,button{font:inherit;color:inherit;background:#0f151d;border:1px solid var(--border);border-radius:12px;padding:10px 12px}\n        button{cursor:pointer}\n        table{width:100%;border-collapse:collapse;margin-top:14px}\n        th,td{padding:12px 8px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left;vertical-align:top}\n        .keys{display:flex;flex-wrap:wrap;gap:6px}\n        .key{padding:4px 8px;border-radius:8px;background:#0d1218;border:1px solid var(--border);font-size:12px}\n        .small{font-size:13px;color:var(--muted)}\n        .star{background:none;border:0;color:#fbbf24;padding:0 6px}\n        @media print {.apps,.toolbar,.small,.pin-cell{display:none} body{background:#fff;color:#111}.panel{border:0;background:#fff;padding:0}.key{border-color:#ccc;background:#f8f8f8;color:#111}}\n        @media (max-width:900px){.toolbar{grid-template-columns:1fr}}\n    </style>",
  "bodyMarkup": "<div class=\"app\">\n        <div>\n            <h1 style=\"margin:0 0 8px;\">Shortcut Reference</h1>\n            <p class=\"small\">Pinned shortcuts persist in localStorage. Print the current app as a clean cheat sheet.</p>\n        </div>\n        <section class=\"panel\">\n            <div class=\"apps\" id=\"appGrid\"></div>\n        </section>\n        <section class=\"panel\">\n            <div class=\"toolbar\">\n                <input id=\"searchInput\" placeholder=\"Search action or key combo\">\n                <select id=\"categoryFilter\"><option value=\"\">All categories</option></select>\n                <select id=\"tabSelect\"><option value=\"all\">Current app</option><option value=\"pinned\">My shortcuts</option></select>\n            </div>\n            <table>\n                <thead><tr><th>Action</th><th>Keys</th><th class=\"pin-cell\">Pin</th></tr></thead>\n                <tbody id=\"tableBody\"></tbody>\n            </table>\n        </section>\n    </div>",
  "scripts": [],
  "externalScripts": ["/converted-inline/shortcut-reference.js"]
};

export const title = page.title;

export default function ShortcutReference() {
  return <AuraLegacyToolPage {...page} />;
}
