
        const STORAGE_KEY = "prism.checklists.v1";
        const templates = {
            "Travel Packing": ["Passport", "Wallet", "Phone charger", "Clothes", "Toiletries", "Medications", "Tickets", "Headphones"],
            "House Cleaning": ["Make the bed", "Vacuum floors", "Clean kitchen counters", "Take out trash", "Wipe bathroom mirror", "Laundry", "Dust shelves"],
            "Weekly Review": ["Review calendar", "Capture loose notes", "Close open loops", "Plan next week", "Review goals", "Clean desktop"],
            "Grocery Basics": ["Milk", "Eggs", "Bread", "Rice", "Vegetables", "Fruit", "Coffee", "Soap"]
        };

        let state = loadState();
        let activeChecklistId = state.activeChecklistId || state.checklists[0]?.id || null;
        let draggedItemId = null;

        const checklistList = document.getElementById("checklistList");
        const itemsList = document.getElementById("itemsList");
        const checklistTitle = document.getElementById("checklistTitle");
        const checklistMeta = document.getElementById("checklistMeta");
        const progressText = document.getElementById("progressText");
        const progressBar = document.getElementById("progressBar");
        const emptyState = document.getElementById("emptyState");
        const templateSelect = document.getElementById("templateSelect");
        const templateGrid = document.getElementById("templateGrid");

        function uid() {
            return Math.random().toString(36).slice(2, 10);
        }

        function loadState() {
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
                if (saved && Array.isArray(saved.checklists)) return saved;
            } catch {}
            return { checklists: [], activeChecklistId: null };
        }

        function saveState() {
            state.activeChecklistId = activeChecklistId;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }

        function getActiveChecklist() {
            return state.checklists.find((list) => list.id === activeChecklistId) || null;
        }

        function createChecklist(name, items = []) {
            const checklist = {
                id: uid(),
                name,
                createdAt: Date.now(),
                items: items.map((text, index) => ({ id: uid() + index, text, checked: false }))
            };
            state.checklists.unshift(checklist);
            activeChecklistId = checklist.id;
            saveState();
            render();
        }

        function renderChecklistList() {
            checklistList.innerHTML = "";
            state.checklists.forEach((list) => {
                const done = list.items.filter((item) => item.checked).length;
                const card = document.createElement("button");
                card.type = "button";
                card.className = "checklist-pill" + (list.id === activeChecklistId ? " active" : "");
                card.innerHTML = "<strong>" + escapeHtml(list.name) + "</strong><div class='small muted' style='margin-top:4px;'>" + done + "/" + list.items.length + " complete</div>";
                card.addEventListener("click", () => {
                    activeChecklistId = list.id;
                    saveState();
                    render();
                });
                checklistList.appendChild(card);
            });
        }

        function renderItems() {
            const checklist = getActiveChecklist();
            itemsList.innerHTML = "";

            if (!checklist) {
                checklistTitle.textContent = "No checklist selected";
                checklistMeta.textContent = "Create a list or load a template.";
                progressText.textContent = "0 of 0 done";
                progressBar.style.width = "0%";
                emptyState.style.display = "block";
                return;
            }

            checklistTitle.textContent = checklist.name;
            const total = checklist.items.length;
            const completed = checklist.items.filter((item) => item.checked).length;
            const percent = total ? (completed / total) * 100 : 0;
            checklistMeta.textContent = "Drag to reorder. Checked items automatically move to the bottom.";
            progressText.textContent = completed + " of " + total + " done";
            progressBar.style.width = percent + "%";

            if (!total) {
                emptyState.style.display = "block";
                return;
            }

            emptyState.style.display = "none";

            checklist.items.forEach((item) => {
                const li = document.createElement("li");
                li.className = "item" + (item.checked ? " checked" : "");
                li.draggable = true;
                li.dataset.id = item.id;
                li.innerHTML = `
                    <span class="drag-handle">::</span>
                    <input class="item-text" value="${escapeAttr(item.text)}" />
                    <input type="checkbox" ${item.checked ? "checked" : ""} />
                    <button type="button">Remove</button>
                `;

                const textInput = li.querySelector(".item-text");
                const checkbox = li.querySelector('input[type="checkbox"]');
                const removeBtn = li.querySelector("button");

                textInput.addEventListener("input", () => {
                    item.text = textInput.value;
                    saveState();
                    renderChecklistList();
                });

                checkbox.addEventListener("change", () => {
                    item.checked = checkbox.checked;
                    reorderCheckedItems(checklist);
                    saveState();
                    render();
                });

                removeBtn.addEventListener("click", () => {
                    checklist.items = checklist.items.filter((entry) => entry.id !== item.id);
                    saveState();
                    render();
                });

                li.addEventListener("dragstart", () => {
                    draggedItemId = item.id;
                    li.classList.add("dragging");
                });

                li.addEventListener("dragend", () => {
                    draggedItemId = null;
                    li.classList.remove("dragging");
                });

                li.addEventListener("dragover", (event) => {
                    event.preventDefault();
                });

                li.addEventListener("drop", (event) => {
                    event.preventDefault();
                    if (!draggedItemId || draggedItemId === item.id) return;
                    const fromIndex = checklist.items.findIndex((entry) => entry.id === draggedItemId);
                    const toIndex = checklist.items.findIndex((entry) => entry.id === item.id);
                    const [moved] = checklist.items.splice(fromIndex, 1);
                    checklist.items.splice(toIndex, 0, moved);
                    saveState();
                    render();
                });

                itemsList.appendChild(li);
            });
        }

        function reorderCheckedItems(checklist) {
            checklist.items.sort((a, b) => Number(a.checked) - Number(b.checked));
        }

        function renderTemplates() {
            templateSelect.innerHTML = Object.keys(templates).map((name) => "<option>" + name + "</option>").join("");
            templateGrid.innerHTML = "";
            Object.entries(templates).forEach(([name, items]) => {
                const card = document.createElement("div");
                card.className = "template-card";
                card.innerHTML = `
                    <strong>${escapeHtml(name)}</strong>
                    <div class="small muted">${items.length} items</div>
                    <button type="button">Create checklist</button>
                `;
                card.querySelector("button").addEventListener("click", () => createChecklist(name, items));
                templateGrid.appendChild(card);
            });
        }

        function addItem() {
            const checklist = getActiveChecklist();
            const input = document.getElementById("newItemInput");
            const text = input.value.trim();
            if (!checklist || !text) return;
            checklist.items.push({ id: uid(), text, checked: false });
            input.value = "";
            saveState();
            render();
        }

        function deleteActiveChecklist() {
            if (!activeChecklistId) return;
            state.checklists = state.checklists.filter((list) => list.id !== activeChecklistId);
            activeChecklistId = state.checklists[0]?.id || null;
            saveState();
            render();
        }

        function escapeHtml(value) {
            return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
        }

        function escapeAttr(value) {
            return escapeHtml(value);
        }

        function render() {
            renderChecklistList();
            renderItems();
        }

        document.getElementById("createChecklistBtn").addEventListener("click", () => {
            const input = document.getElementById("newChecklistName");
            const name = input.value.trim();
            if (!name) return;
            createChecklist(name);
            input.value = "";
        });
        document.getElementById("newChecklistName").addEventListener("keydown", (event) => {
            if (event.key === "Enter") document.getElementById("createChecklistBtn").click();
        });
        document.getElementById("addItemBtn").addEventListener("click", addItem);
        document.getElementById("newItemInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") addItem();
        });
        document.getElementById("deleteChecklistBtn").addEventListener("click", deleteActiveChecklist);
        document.getElementById("useTemplateBtn").addEventListener("click", () => {
            const selected = templateSelect.value;
            if (selected) createChecklist(selected, templates[selected]);
        });
        document.getElementById("printBtn").addEventListener("click", () => window.print());

        renderTemplates();
        render();
    