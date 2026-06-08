const STORAGE_KEY = "prism.bookmarks.v1";
let bookmarks = loadBookmarks();

function loadBookmarks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function saveBookmarks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks)); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function normalizeUrl(url) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : "https://" + url);
    parsed.hash = "";
    return parsed.toString();
  } catch { return null; }
}

function titleFromUrl(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.hostname.replace(/^www\./, "");
  } catch { return ""; }
}

function addBookmark(raw) {
  const normalized = normalizeUrl(raw.url);
  if (!normalized) return { ok: false, message: "Invalid URL" };
  if (bookmarks.some(function(e) { return e.url === normalized; })) return { ok: false, message: "Duplicate bookmark" };
  var title = raw.title.trim() || titleFromUrl(normalized);
  var tags = raw.tags.split(",").map(function(t) { return t.trim(); }).filter(Boolean);
  bookmarks.unshift({ id: uid(), url: normalized, title: title, tags: tags, notes: raw.notes.trim(), createdAt: Date.now(), lastVisited: null });
  saveBookmarks();
  render();
  return { ok: true, message: "Bookmark added" };
}

function allTags() {
  var set = {};
  bookmarks.forEach(function(b) { b.tags.forEach(function(t) { set[t] = true; }); });
  return Object.keys(set).sort(function(a, b) { return a.localeCompare(b); });
}

function renderTagFilter() {
  var select = document.getElementById("tagFilter");
  var value = select.value;
  var tags = allTags();
  var html = '<option value="">All tags</option>';
  for (var i = 0; i < tags.length; i++) {
    html += '<option value="' + escapeHtml(tags[i]) + '">' + escapeHtml(tags[i]) + '</option>';
  }
  select.innerHTML = html;
  select.value = value;
}

function faviconHtml(url, title) {
  try {
    var domain = new URL(url).hostname;
    return '<div class="favicon"><img src="https://www.google.com/s2/favicons?domain=' + domain + '&sz=64" alt="" style="width:100%;height:100%;object-fit:cover;"></div>';
  } catch {
    return '<div class="initial">' + escapeHtml((title || "?")[0].toUpperCase()) + "</div>";
  }
}

function openBookmark(id) {
  var entry = null;
  for (var i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].id === id) { entry = bookmarks[i]; break; }
  }
  if (!entry) return;
  entry.lastVisited = Date.now();
  saveBookmarks();
  window.open(entry.url, "_blank", "noopener");
  render();
}

function render() {
  renderTagFilter();
  var term = document.getElementById("searchInput").value.trim().toLowerCase();
  var tag = document.getElementById("tagFilter").value;
  var list = [];
  for (var i = 0; i < bookmarks.length; i++) {
    var entry = bookmarks[i];
    var haystack = [entry.title, entry.url, entry.notes, entry.tags.join(" ")].join(" ").toLowerCase();
    var match = (!term || haystack.indexOf(term) !== -1) && (!tag || entry.tags.indexOf(tag) !== -1);
    if (match) list.push(entry);
  }
  var container = document.getElementById("bookmarks");
  container.innerHTML = "";
  document.getElementById("emptyState").style.display = list.length ? "none" : "block";
  for (var i = 0; i < list.length; i++) {
    var entry = list[i];
    var domain = "";
    try { domain = new URL(entry.url).hostname.replace(/^www\./, ""); } catch(e) {}
    var card = document.createElement("article");
    card.className = "card";
    var tagsHtml = "";
    for (var j = 0; j < entry.tags.length; j++) {
      tagsHtml += '<span class="tag">' + escapeHtml(entry.tags[j]) + '</span>';
    }
    var visited = entry.lastVisited ? new Date(entry.lastVisited).toLocaleString() : "Never";
    card.innerHTML =
      '<div class="head">' + faviconHtml(entry.url, entry.title) +
        '<div><strong>' + escapeHtml(entry.title) + '</strong><div class="small">' + escapeHtml(domain) + '</div></div>' +
        '<button type="button">Open</button></div>' +
      '<div class="small">' + escapeHtml(entry.url) + '</div>' +
      '<div class="tags">' + tagsHtml + '</div>' +
      '<div class="small">' + escapeHtml(entry.notes || "No notes") + '</div>' +
      '<div class="small">Last visited: ' + visited + '</div>' +
      '<div class="row"><button type="button" data-remove="' + entry.id + '">Delete</button></div>';
    (function(id) {
      card.querySelector(".head button").addEventListener("click", function() { openBookmark(id); });
    })(entry.id);
    (function(id) {
      card.querySelector("[data-remove]").addEventListener("click", function() {
        var idx = -1;
        for (var k = 0; k < bookmarks.length; k++) {
          if (bookmarks[k].id === id) { idx = k; break; }
        }
        if (idx !== -1) bookmarks.splice(idx, 1);
        saveBookmarks();
        render();
      });
    })(entry.id);
    container.appendChild(card);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, function(char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
  });
}

function download(filename, content, type) {
  var blob = new Blob([content], { type: type });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function getExtensionApi() {
  return globalThis.browser || globalThis.chrome || null;
}

function isPromiseExtensionApi(api) {
  return !!globalThis.browser && api === globalThis.browser;
}

function getBrowserBookmarksTree() {
  var api = getExtensionApi();
  if (!api || !api.bookmarks || !api.bookmarks.getTree) {
    return Promise.reject(new Error("Browser bookmark API not available"));
  }

  if (isPromiseExtensionApi(api)) {
    return api.bookmarks.getTree();
  }

  return new Promise(function(resolve, reject) {
    api.bookmarks.getTree(function(results) {
      var lastError = api.runtime && api.runtime.lastError;
      if (lastError) reject(new Error(lastError.message || "Browser bookmark import failed"));
      else resolve(results);
    });
  });
}

function importFromBrowser() {
  var progress = document.getElementById("importProgress");
  if (!getExtensionApi() || !getExtensionApi().bookmarks) {
    progress.textContent = "Browser bookmark API not available (requires extension context with bookmarks permission)";
    return;
  }
  progress.textContent = "Fetching browser bookmarks...";
  getBrowserBookmarksTree()
    .then(function(results) {
      var imported = 0;
      var skipped = 0;
      function traverse(nodes) {
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (node.url) {
            var result = addBookmark({ url: node.url, title: node.title || "", tags: "browser", notes: "" });
            if (result.ok) imported++;
            else skipped++;
          }
          if (node.children) traverse(node.children);
        }
      }
      traverse(results);
      progress.textContent = "Imported " + imported + " bookmark(s) from browser" + (skipped ? " (" + skipped + " duplicates skipped)" : "");
      document.getElementById("addMessage").textContent = "";
    })
    .catch(function(e) {
      progress.textContent = "Error: " + e.message;
    });
}

document.getElementById("autofillBtn").addEventListener("click", function() {
  document.getElementById("titleInput").value = titleFromUrl(document.getElementById("urlInput").value);
});
document.getElementById("addBtn").addEventListener("click", function() {
  var result = addBookmark({
    url: document.getElementById("urlInput").value,
    title: document.getElementById("titleInput").value,
    tags: document.getElementById("tagsInput").value,
    notes: document.getElementById("notesInput").value
  });
  document.getElementById("addMessage").textContent = result.message;
  if (result.ok) {
    ["urlInput", "titleInput", "tagsInput", "notesInput"].forEach(function(id) {
      document.getElementById(id).value = "";
    });
  }
});
document.getElementById("importBrowserBtn").addEventListener("click", importFromBrowser);
document.getElementById("bulkAddBtn").addEventListener("click", function() {
  var lines = document.getElementById("bulkInput").value.split(/\r?\n/).map(function(line) { return line.trim(); }).filter(Boolean);
  var added = 0;
  lines.forEach(function(url) {
    var result = addBookmark({ url: url, title: "", tags: "", notes: "" });
    if (result.ok) added++;
  });
  document.getElementById("addMessage").textContent = "Added " + added + " bookmark(s)";
  document.getElementById("bulkInput").value = "";
});
document.getElementById("exportJsonBtn").addEventListener("click", function() {
  download("prism-bookmarks.json", JSON.stringify(bookmarks, null, 2), "application/json");
});
document.getElementById("exportHtmlBtn").addEventListener("click", function() {
  var items = "";
  for (var i = 0; i < bookmarks.length; i++) {
    items += '<DT><A HREF="' + bookmarks[i].url + '">' + escapeHtml(bookmarks[i].title) + '</A>';
  }
  var html = '<!DOCTYPE NETSCAPE-Bookmark-file-1><META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8"><TITLE>Bookmarks</TITLE><H1>Bookmarks</H1><DL><p>' + items + '</DL><p>';
  download("prism-bookmarks.html", html, "text/html");
});
document.getElementById("searchInput").addEventListener("input", render);
document.getElementById("tagFilter").addEventListener("change", render);

render();
