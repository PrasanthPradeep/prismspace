const STORAGE_KEY = "prism.randomPicker.v2";
const modes = ["Name Picker", "Number Generator", "Coin Flip", "Dice Roller", "List Randomizer", "Yes / No"];

let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
if (!state.mode) state.mode = "Name Picker";
if (!state.history) state.history = [];
if (!state.inputs) state.inputs = {
  "Name Picker": { text: "Alice\nBob\nCharlie", removePicked: true },
  "Number Generator": { min: 1, max: 100, qty: 1, dupes: true },
  "Dice Roller": { type: "d6", count: 2 },
  "List Randomizer": { text: "Option A\nOption B\nOption C" }
};

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function rand(max) { return Math.floor(Math.random() * max); }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function clearHistory() {
  state.history = [];
  document.getElementById("resultBox").textContent = "Ready";
  save();
  renderHistory();
}

function pushHistory(mode, result) {
  state.history.unshift({ mode, result, at: Date.now() });
  state.history = state.history.slice(0, 30);
  save();
  renderHistory();
}

async function animateSelection(finalValue, generatorFunc, duration = 600) {
  const box = document.getElementById("resultBox");
  box.className = "result-value spin-anim";
  const start = Date.now();
  while (Date.now() - start < duration) {
    box.textContent = generatorFunc();
    await wait(50);
  }
  box.textContent = finalValue;
  box.className = "result-value pop-anim";
  void box.offsetWidth;
}

function renderModes() {
  const root = document.getElementById("modeButtons");
  root.innerHTML = "";
  modes.forEach((mode) => {
    const btn = document.createElement("button");
    btn.className = "mode-btn" + (state.mode === mode ? " active" : "");
    btn.textContent = mode;
    btn.addEventListener("click", () => {
      saveInputs();
      state.mode = mode;
      save();
      renderModes();
      renderControls();
      const box = document.getElementById("resultBox");
      box.textContent = "Ready";
      box.className = "result-value pop-anim";
    });
    root.appendChild(btn);
  });
}

function saveInputs() {
  if (state.mode === "Name Picker") {
    const el = document.getElementById("nameList");
    const rem = document.getElementById("removePicked");
    if (el && rem) state.inputs["Name Picker"] = { text: el.value, removePicked: rem.checked };
  } else if (state.mode === "Number Generator") {
    const min = document.getElementById("minNum");
    if (min) {
      state.inputs["Number Generator"] = {
        min: Number(min.value),
        max: Number(document.getElementById("maxNum").value),
        qty: Number(document.getElementById("qtyNum").value),
        dupes: document.getElementById("dupNum").checked
      };
    }
  } else if (state.mode === "Dice Roller") {
    const dt = document.getElementById("diceType");
    if (dt) {
      state.inputs["Dice Roller"] = {
        type: dt.value,
        count: Number(document.getElementById("diceCount").value)
      };
    }
  } else if (state.mode === "List Randomizer") {
    const sl = document.getElementById("shuffleList");
    if (sl) state.inputs["List Randomizer"] = { text: sl.value };
  }
  save();
}

function renderControls() {
  const panel = document.getElementById("controlsPanel");

  if (state.mode === "Name Picker") {
    const data = state.inputs["Name Picker"];
    panel.innerHTML = `<h2>Name Picker</h2>
      <div class="stack" style="margin-top:12px;">
        <textarea id="nameList" placeholder="One name per line">${data.text}</textarea>
        <label class="small"><input id="removePicked" type="checkbox" ${data.removePicked ? 'checked' : ''} style="width:auto; margin-right:8px;">Remove picked name</label>
        <button class="primary" id="pickNameBtn">Pick a name</button>
      </div>`;

    document.getElementById("pickNameBtn").onclick = async () => {
      const el = document.getElementById("nameList");
      let names = el.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      if (!names.length) return;

      const btn = document.getElementById("pickNameBtn");
      btn.disabled = true;

      const resultIdx = rand(names.length);
      const result = names[resultIdx];

      await animateSelection(result, () => names[rand(names.length)], 800);

      if (document.getElementById("removePicked").checked) {
        names.splice(resultIdx, 1);
        el.value = names.join("\n");
      }
      saveInputs();
      pushHistory(state.mode, result);
      btn.disabled = false;
    };
  }
  else if (state.mode === "Number Generator") {
    const data = state.inputs["Number Generator"];
    panel.innerHTML = `<h2>Number Generator</h2>
      <div class="grid2" style="margin-top:12px;">
        <div><label class="small">Min</label><input id="minNum" type="number" value="${data.min}"></div>
        <div><label class="small">Max</label><input id="maxNum" type="number" value="${data.max}"></div>
        <div><label class="small">Quantity</label><input id="qtyNum" type="number" value="${data.qty}" min="1" max="1000"></div>
        <div style="display:flex; align-items:center;"><label class="small"><input id="dupNum" type="checkbox" ${data.dupes ? 'checked' : ''} style="width:auto; margin-right:8px;">Allow duplicates</label></div>
      </div>
      <button class="primary" id="genNumBtn" style="margin-top:12px; width:100%;">Generate</button>`;

    document.getElementById("genNumBtn").onclick = async () => {
      const min = Number(document.getElementById("minNum").value);
      const max = Number(document.getElementById("maxNum").value);
      const qty = Number(document.getElementById("qtyNum").value);
      const allowDupes = document.getElementById("dupNum").checked;

      if (min >= max) return alert("Max must be greater than Min");
      if (!allowDupes && qty > (max - min + 1)) return alert("Quantity exceeds available options without duplicates");

      const btn = document.getElementById("genNumBtn");
      btn.disabled = true;

      const pickNumberFunc = () => {
        const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        const res = [];
        let q = qty;
        while (q-- > 0 && pool.length) {
          res.push(allowDupes ? min + rand(max - min + 1) : pool.splice(rand(pool.length), 1)[0]);
        }
        return res.join(", ");
      };

      const result = pickNumberFunc();
      await animateSelection(result, pickNumberFunc, 600);

      saveInputs();
      pushHistory(state.mode, result);
      btn.disabled = false;
    };
  }
  else if (state.mode === "Coin Flip") {
    panel.innerHTML = `<h2>Coin Flip</h2><p class="small" style="margin-top:8px;">Flip a virtual coin.</p><button class="primary" id="coinBtn" style="margin-top:12px;">Flip coin</button>`;
    document.getElementById("coinBtn").onclick = async () => {
      const btn = document.getElementById("coinBtn");
      btn.disabled = true;
      const sides = ["Heads", "Tails"];
      const result = sides[rand(2)];

      await animateSelection(result, () => sides[rand(2)], 800);

      pushHistory(state.mode, result);
      btn.disabled = false;
    };
  }
  else if (state.mode === "Dice Roller") {
    const data = state.inputs["Dice Roller"];
    const opts = ["d4", "d6", "d8", "d10", "d12", "d20"].map(d => `<option ${data.type === d ? 'selected' : ''}>${d}</option>`).join("");

    panel.innerHTML = `<h2>Dice Roller</h2>
      <div class="grid2" style="margin-top:12px;">
        <div><label class="small">Dice Type</label><select id="diceType">${opts}</select></div>
        <div><label class="small">Number of Dice</label><input id="diceCount" type="number" min="1" max="100" value="${data.count}"></div>
      </div>
      <button class="primary" id="diceBtn" style="margin-top:12px; width:100%;">Roll dice</button>`;

    document.getElementById("diceBtn").onclick = async () => {
      const dt = document.getElementById("diceType").value;
      const sides = Number(dt.slice(1));
      const count = Number(document.getElementById("diceCount").value);

      const btn = document.getElementById("diceBtn");
      btn.disabled = true;

      const rollFunc = () => Array.from({ length: count }, () => 1 + rand(sides)).join(", ");
      const result = rollFunc();

      await animateSelection(result, rollFunc, 600);

      saveInputs();
      pushHistory(state.mode, result);
      btn.disabled = false;
    };
  }
  else if (state.mode === "List Randomizer") {
    const data = state.inputs["List Randomizer"];
    panel.innerHTML = `<h2>List Randomizer</h2>
      <div class="stack" style="margin-top:12px;">
        <textarea id="shuffleList" placeholder="One item per line">${data.text}</textarea>
        <button class="primary" id="shuffleBtn">Shuffle list</button>
      </div>`;

    document.getElementById("shuffleBtn").onclick = async () => {
      const list = document.getElementById("shuffleList").value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      if (!list.length) return;

      const btn = document.getElementById("shuffleBtn");
      btn.disabled = true;

      const shuffleFunc = () => {
        const temp = [...list];
        for (let i = temp.length - 1; i > 0; i--) {
          const j = rand(i + 1);
          [temp[i], temp[j]] = [temp[j], temp[i]];
        }
        return temp.join(", ");
      };

      const result = shuffleFunc();
      await animateSelection(result, shuffleFunc, 800);

      saveInputs();
      pushHistory(state.mode, result);
      btn.disabled = false;
    };
  }
  else {
    panel.innerHTML = `<h2>Yes / No</h2><p class="small" style="margin-top:8px;">Get a definitive answer.</p><button class="primary" id="yesNoBtn" style="margin-top:12px;">Reveal answer</button>`;
    document.getElementById("yesNoBtn").onclick = async () => {
      const btn = document.getElementById("yesNoBtn");
      btn.disabled = true;

      const sides = ["Yes", "No"];
      const result = sides[rand(2)];

      await animateSelection(result, () => sides[rand(2)], 600);

      pushHistory(state.mode, result);
      btn.disabled = false;
    };
  }
}

function renderHistory() {
  const root = document.getElementById("history");
  root.innerHTML = state.history.length ? "" : '<div class="small">No history yet.</div>';
  state.history.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "history-item";
    const d = new Date(entry.at);
    const timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    div.innerHTML = `<div style="display:flex; justify-content:space-between;"><strong>${entry.mode}</strong><span class="small">${timeStr}</span></div><div class="small" style="margin-top:2px;">${entry.result}</div>`;
    root.appendChild(div);
  });
}

document.getElementById("clearHistoryBtn").onclick = clearHistory;

renderModes();
renderControls();
renderHistory();
