
        const STORAGE_KEY = "prism.shortcuts.pins.v1";
        const pinned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
        const apps = buildData();
        let activeApp = Object.keys(apps)[0];

        function buildData() {
            const common = [
                ["Navigation", "Go to start", ["Home"]],
                ["Navigation", "Go to end", ["End"]],
                ["Editing", "Copy selection", ["Ctrl", "C"]],
                ["Editing", "Cut selection", ["Ctrl", "X"]],
                ["Editing", "Paste clipboard", ["Ctrl", "V"]],
                ["Editing", "Undo", ["Ctrl", "Z"]],
                ["Editing", "Redo", ["Ctrl", "Shift", "Z"]],
                ["Selection", "Select all", ["Ctrl", "A"]],
                ["Files", "New file/window", ["Ctrl", "N"]],
                ["Files", "Open", ["Ctrl", "O"]],
                ["Files", "Save", ["Ctrl", "S"]],
                ["Files", "Save as", ["Ctrl", "Shift", "S"]],
                ["Windows", "Close window/tab", ["Ctrl", "W"]],
                ["Windows", "Switch next", ["Ctrl", "Tab"]],
                ["Search", "Find", ["Ctrl", "F"]],
                ["Search", "Find next", ["F3"]],
                ["Search", "Replace", ["Ctrl", "H"]],
                ["System", "Command palette / launcher", ["Ctrl", "Shift", "P"]]
            ];
            const byApp = {
                "VS Code": common.concat([
                    ["Editing", "Duplicate line", ["Shift", "Alt", "Down"]],
                    ["Editing", "Move line up", ["Alt", "Up"]],
                    ["Editing", "Move line down", ["Alt", "Down"]],
                    ["Files", "Quick open", ["Ctrl", "P"]],
                    ["Search", "Search project", ["Ctrl", "Shift", "F"]],
                    ["Navigation", "Go to definition", ["F12"]],
                    ["Navigation", "Toggle terminal", ["Ctrl", "`"]]
                ]),
                "Vim": [
                    ["Navigation", "Move left", ["h"]], ["Navigation", "Move down", ["j"]], ["Navigation", "Move up", ["k"]], ["Navigation", "Move right", ["l"]],
                    ["Editing", "Insert mode", ["i"]], ["Editing", "Append", ["a"]], ["Editing", "Delete line", ["d", "d"]], ["Editing", "Yank line", ["y", "y"]],
                    ["Editing", "Paste", ["p"]], ["Editing", "Undo", ["u"]], ["Editing", "Redo", ["Ctrl", "r"]], ["Search", "Search forward", ["/"]],
                    ["Navigation", "Start of line", ["0"]], ["Navigation", "End of line", ["$"]], ["Files", "Write file", [":", "w"]], ["Files", "Quit", [":", "q"]],
                    ["Files", "Write and quit", [":", "wq"]], ["Windows", "Split vertical", [":", "vsplit"]], ["Windows", "Split horizontal", [":", "split"]]
                ],
                "Mac OS": common.concat([
                    ["Windows", "Spotlight", ["Cmd", "Space"]], ["Windows", "App switcher", ["Cmd", "Tab"]], ["Files", "New Finder window", ["Cmd", "N"]],
                    ["System", "Screenshot", ["Cmd", "Shift", "4"]], ["System", "Lock screen", ["Ctrl", "Cmd", "Q"]], ["Navigation", "Mission Control", ["Ctrl", "Up"]]
                ]),
                "Windows": common.concat([
                    ["Windows", "Run dialog", ["Win", "R"]], ["Windows", "Settings", ["Win", "I"]], ["Windows", "Lock PC", ["Win", "L"]],
                    ["System", "Screenshot", ["Win", "Shift", "S"]], ["Windows", "File Explorer", ["Win", "E"]], ["Windows", "Task view", ["Win", "Tab"]]
                ]),
                "Ubuntu": common.concat([
                    ["Windows", "Overview", ["Super"]], ["Windows", "Terminal", ["Ctrl", "Alt", "T"]], ["System", "Lock screen", ["Super", "L"]],
                    ["Windows", "Switch workspace", ["Ctrl", "Alt", "Up"]], ["Files", "Home folder", ["Super", "E"]], ["System", "Screenshot area", ["Shift", "PrtSc"]]
                ]),
                "Chrome": common.concat([
                    ["Windows", "New tab", ["Ctrl", "T"]], ["Windows", "Reopen tab", ["Ctrl", "Shift", "T"]], ["Navigation", "Address bar", ["Ctrl", "L"]],
                    ["Navigation", "Next tab", ["Ctrl", "Tab"]], ["Navigation", "Prev tab", ["Ctrl", "Shift", "Tab"]], ["System", "Developer tools", ["F12"]]
                ]),
                "Terminal": [
                    ["Navigation", "Move to line start", ["Ctrl", "A"]], ["Navigation", "Move to line end", ["Ctrl", "E"]], ["Editing", "Delete word backward", ["Ctrl", "W"]],
                    ["Editing", "Clear line", ["Ctrl", "U"]], ["Editing", "Delete to end", ["Ctrl", "K"]], ["Editing", "Clear screen", ["Ctrl", "L"]],
                    ["Process", "Interrupt", ["Ctrl", "C"]], ["Process", "Suspend", ["Ctrl", "Z"]], ["History", "Previous command", ["Up"]],
                    ["History", "Search history", ["Ctrl", "R"]], ["Tabs", "New tab", ["Ctrl", "Shift", "T"]], ["Windows", "New pane", ["Alt", "Shift", "+"]]
                ],
                "Figma": common.concat([
                    ["Tools", "Move tool", ["V"]], ["Tools", "Frame tool", ["F"]], ["Tools", "Rectangle tool", ["R"]],
                    ["Editing", "Flatten selection", ["Ctrl", "E"]], ["View", "Pixel preview", ["Ctrl", "'"]], ["Search", "Quick actions", ["Ctrl", "/"]]
                ]),
                "Excel / Sheets": common.concat([
                    ["Navigation", "Edit active cell", ["F2"]], ["Selection", "Fill down", ["Ctrl", "D"]], ["Selection", "Fill right", ["Ctrl", "R"]],
                    ["Data", "Filter", ["Ctrl", "Shift", "L"]], ["Editing", "Insert date", ["Ctrl", ";"]], ["Editing", "Insert time", ["Ctrl", "Shift", ";"]]
                ])
            };
            Object.keys(byApp).forEach((name) => {
                byApp[name] = byApp[name].map((entry, index) => ({ id: name + "-" + index, category: entry[0], action: entry[1], keys: entry[2] }));
            });
            return byApp;
        }
        function savePins() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...pinned])); }
        function renderApps() {
            const root = document.getElementById("appGrid");
            root.innerHTML = "";
            Object.keys(apps).forEach((app) => {
                const btn = document.createElement("button");
                btn.className = "app-btn" + (app === activeApp ? " active" : "");
                btn.textContent = app;
                btn.onclick = () => { activeApp = app; renderApps(); renderCategories(); renderRows(); };
                root.appendChild(btn);
            });
        }
        function renderCategories() {
            const categories = [...new Set(apps[activeApp].map((row) => row.category))];
            document.getElementById("categoryFilter").innerHTML = '<option value="">All categories</option>' + categories.map((c) => '<option value="' + c + '">' + c + '</option>').join("");
        }
        function keyPills(keys) {
            return '<div class="keys">' + keys.map((key) => '<span class="key">' + key + "</span>").join("") + "</div>";
        }
        function rowsForView() {
            const tab = document.getElementById("tabSelect").value;
            const query = document.getElementById("searchInput").value.trim().toLowerCase();
            const category = document.getElementById("categoryFilter").value;
            let rows = tab === "pinned" ? Object.values(apps).flat().filter((row) => pinned.has(row.id)) : apps[activeApp];
            return rows.filter((row) => {
                const haystack = (row.action + " " + row.keys.join(" ")).toLowerCase();
                return (!query || haystack.includes(query)) && (!category || row.category === category);
            });
        }
        function renderRows() {
            const body = document.getElementById("tableBody");
            const rows = rowsForView();
            body.innerHTML = rows.map((row) => `
                <tr>
                    <td><div>${row.action}</div><div class="small">${row.category}</div></td>
                    <td>${keyPills(row.keys)}</td>
                    <td class="pin-cell"><button class="star" data-id="${row.id}">${pinned.has(row.id) ? "★" : "☆"}</button></td>
                </tr>`).join("") || '<tr><td colspan="3" class="small">No shortcuts match.</td></tr>';
            body.querySelectorAll("[data-id]").forEach((button) => {
                button.onclick = () => {
                    const id = button.getAttribute("data-id");
                    if (pinned.has(id)) pinned.delete(id); else pinned.add(id);
                    savePins();
                    renderRows();
                };
            });
        }
        document.getElementById("searchInput").addEventListener("input", renderRows);
        document.getElementById("categoryFilter").addEventListener("change", renderRows);
        document.getElementById("tabSelect").addEventListener("change", renderRows);
        renderApps(); renderCategories(); renderRows();
    