// Extracted Color Generator JS (converted from inline)
// Original functions preserved; listeners attached by __attach_color_gen_listeners

let currentColor = { h: 240, s: 70, v: 70, a: 1 };
let currentFormat = 'hex';
let colorHistory = [];
const MAX_HISTORY = 20;

function loadColorHistory() {
    const saved = localStorage.getItem('colorGenHistory');
    if (saved) {
        try { colorHistory = JSON.parse(saved); renderColorHistory(); } catch (e) { colorHistory = []; }
    }
}

function saveColorHistory() { localStorage.setItem('colorGenHistory', JSON.stringify(colorHistory)); }
function addToHistory(color) { colorHistory = colorHistory.filter(c => c.toLowerCase() !== color.toLowerCase()); colorHistory.unshift(color); if (colorHistory.length > MAX_HISTORY) colorHistory = colorHistory.slice(0, MAX_HISTORY); saveColorHistory(); renderColorHistory(); }

function renderColorHistory() {
    const container = document.getElementById('colorHistory'); if (!container) return;
    if (colorHistory.length === 0) { container.innerHTML = '<div class="empty-history">Generate or pick colors to see them here</div>'; return; }
    container.innerHTML = colorHistory.map(color => `\n                <div class="history-color-item" \n                     style="background-color: ${color}" \n                     data-color="${color.toUpperCase()}"\n                     data-hex="${color}"\n                     title="Click to use this color">\n                </div>\n            `).join('');
    // Attach click listeners for history items
    container.querySelectorAll('.history-color-item').forEach(el => el.addEventListener('click', () => setColorFromHex(el.dataset.hex)));
}

function clearColorHistory() { if (confirm('Clear all color history?')) { colorHistory = []; saveColorHistory(); renderColorHistory(); showToast('🗑️ Color history cleared!'); } }
function copyCurrentColor() { const display = document.getElementById('colorValueDisplay'); if (display) { const color = display.value; navigator.clipboard.writeText(color).then(() => { showToast(`📋 ${color} copied to clipboard!`); }); } }

function generateRandomColors() {
    const colors = []; const colorPalette = document.getElementById('colorPalette'); if (colorPalette) { colorPalette.innerHTML = ''; colorPalette.className = 'color-palette-modern'; }
    for (let i = 0; i < 6; i++) {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 40) + 60;
        const lightness = Math.floor(Math.random() * 30) + 35;
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        const hex = hslToHex(hue, saturation, lightness);
        const colorName = getColorName(hex);
        colors.push({ hsl: color, hex: hex, name: colorName });
        if (colorPalette) {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item-modern';
            colorItem.addEventListener('click', () => copyColorToClipboard(hex));
            colorItem.innerHTML = `\n                        <div class="color-preview-modern" style="background-color: ${color}"></div>\n                        <div class="color-info-modern">\n                            <div class="color-code-modern">${hex.toUpperCase()}</div>\n                            <div class="color-name-modern">${colorName}</div>\n                        </div>\n                    `;
            colorPalette.appendChild(colorItem);
        }
    }
    return colors;
}

// ... helper functions (hslToHex, rgbToHsl, hsvToRgb, etc.) copied verbatim ...

function hslToHex(h, s, l) { l /= 100; const a = s * Math.min(l, 1 - l) / 100; const f = n => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); }; return `#${f(0)}${f(8)}${f(4)}`; }
function getColorName(hex) { const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16); const hsl = rgbToHsl(r, g, b); const hue = hsl.h; const sat = hsl.s; const light = hsl.l; let baseName = ''; if (hue >= 0 && hue < 15) baseName = 'red'; else if (hue >= 15 && hue < 45) baseName = 'orange'; else if (hue >= 45 && hue < 75) baseName = 'yellow'; else if (hue >= 75 && hue < 105) baseName = 'lime'; else if (hue >= 105 && hue < 135) baseName = 'green'; else if (hue >= 135 && hue < 165) baseName = 'teal'; else if (hue >= 165 && hue < 195) baseName = 'cyan'; else if (hue >= 195 && hue < 225) baseName = 'blue'; else if (hue >= 225 && hue < 255) baseName = 'indigo'; else if (hue >= 255 && hue < 285) baseName = 'purple'; else if (hue >= 285 && hue < 315) baseName = 'magenta'; else if (hue >= 315 && hue < 345) baseName = 'pink'; else baseName = 'red'; let descriptor = ''; if (light < 20) descriptor = 'dark '; else if (light > 80) descriptor = 'light '; else if (sat < 30) descriptor = 'muted '; else if (sat > 80) descriptor = 'vivid '; return (descriptor + baseName).trim(); }
function rgbToHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b); const min = Math.min(r, g, b); let h, s, l; l = (max + min) / 2; if (max === min) { h = s = 0; } else { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }; }
function hsvToRgb(h, s, v) { s /= 100; v /= 100; const c = v * s; const x = c * (1 - Math.abs((h / 60) % 2 - 1)); const m = v - c; let r, g, b; if (h >= 0 && h < 60) { r = c; g = x; b = 0; } else if (h >= 60 && h < 120) { r = x; g = c; b = 0; } else if (h >= 120 && h < 180) { r = 0; g = c; b = x; } else if (h >= 180 && h < 240) { r = 0; g = x; b = c; } else if (h >= 240 && h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; } return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }; }
function rgbToHex(r, g, b) { return "#" + [r, g, b].map(x => { const hex = x.toString(16); return hex.length === 1 ? "0" + hex : hex; }).join(""); }
function hexToRgb(hex) { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null; }

function initColorPicker() {
    const canvas = document.getElementById('colorPickerCanvas');
    const hueSlider = document.getElementById('colorPickerHue');
    const alphaSlider = document.getElementById('colorPickerAlpha');
    const formatTabs = document.querySelectorAll('.format-tab');
    const colorInput = document.getElementById('colorValueDisplay');
    if (!canvas || !hueSlider || !alphaSlider) return; initPresetColors(); canvas.addEventListener('mousedown', startColorPicking); hueSlider.addEventListener('mousedown', startHuePicking); alphaSlider.addEventListener('mousedown', startAlphaPicking); formatTabs.forEach(tab => { tab.addEventListener('click', () => switchFormat(tab.dataset.format)); }); if (colorInput) { colorInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') { const value = this.value.trim(); if (value.match(/^#?[0-9A-Fa-f]{6}$/)) { const hex = value.startsWith('#') ? value : '#' + value; setColorFromHex(hex); showToast(`✅ Color updated to ${hex}`); } else { showToast('❌ Invalid hex color format. Use #RRGGBB'); } } }); colorInput.addEventListener('blur', function() { const value = this.value.trim(); if (value.match(/^#?[0-9A-Fa-f]{6}$/)) { const hex = value.startsWith('#') ? value : '#' + value; setColorFromHex(hex); } else { updateColorDisplay(); } }); } updateColorDisplay(); }

function initPresetColors() { const presetContainer = document.getElementById('presetColors'); if (!presetContainer) return; const presetColors = ['#FF0000','#FF8000','#FFFF00','#80FF00','#00FF00','#00FF80','#00FFFF','#0080FF','#0000FF','#8000FF','#FF00FF','#FF0080','#800000','#804000','#808000','#408000','#008000','#008040','#008080','#004080','#000080','#400080','#800080','#800040','#000000','#404040','#808080','#C0C0C0','#FFFFFF']; presetContainer.innerHTML = ''; presetColors.forEach(color => { const preset = document.createElement('div'); preset.className = 'preset-color'; preset.style.backgroundColor = color; preset.addEventListener('click', () => setColorFromHex(color)); presetContainer.appendChild(preset); }); }

function startColorPicking(e) { const canvas = e.target; const rect = canvas.getBoundingClientRect(); function updateColor(event) { const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)); const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)); currentColor.s = x * 100; currentColor.v = (1 - y) * 100; updateColorDisplay(); updateColorPickerCursor(x, y); } updateColor(e); function mouseMoveHandler(event) { updateColor(event); } function mouseUpHandler() { const rgb = hsvToRgb(currentColor.h, currentColor.s, currentColor.v); const hex = rgbToHex(rgb.r, rgb.g, rgb.b); addToHistory(hex); document.removeEventListener('mousemove', mouseMoveHandler); document.removeEventListener('mouseup', mouseUpHandler); } document.addEventListener('mousemove', mouseMoveHandler); document.addEventListener('mouseup', mouseUpHandler); }

function startHuePicking(e) { const slider = e.target.closest('#colorPickerHue'); const rect = slider.getBoundingClientRect(); function updateHue(event) { const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)); currentColor.h = x * 360; updateColorDisplay(); updateHueCursor(x); updateCanvasBackground(); updateHuePreview(); } updateHue(e); function mouseMoveHandler(event) { updateHue(event); } function mouseUpHandler() { const rgb = hsvToRgb(currentColor.h, currentColor.s, currentColor.v); const hex = rgbToHex(rgb.r, rgb.g, rgb.b); addToHistory(hex); document.removeEventListener('mousemove', mouseMoveHandler); document.removeEventListener('mouseup', mouseUpHandler); } document.addEventListener('mousemove', mouseMoveHandler); document.addEventListener('mouseup', mouseUpHandler); }

function startAlphaPicking(e) { const slider = e.target.closest('#colorPickerAlpha'); const rect = slider.getBoundingClientRect(); function updateAlpha(event) { const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)); currentColor.a = x; updateColorDisplay(); updateAlphaCursor(x); updateAlphaPreview(); } updateAlpha(e); function mouseMoveHandler(event) { updateAlpha(event); } function mouseUpHandler() { const rgb = hsvToRgb(currentColor.h, currentColor.s, currentColor.v); const hex = rgbToHex(rgb.r, rgb.g, rgb.b); addToHistory(hex); document.removeEventListener('mousemove', mouseMoveHandler); document.removeEventListener('mouseup', mouseUpHandler); } document.addEventListener('mousemove', mouseMoveHandler); document.addEventListener('mouseup', mouseUpHandler); }

function updateColorDisplay() { const display = document.getElementById('colorValueDisplay'); if (!display) return; const rgb = hsvToRgb(currentColor.h, currentColor.s, currentColor.v); let colorValue; switch(currentFormat) { case 'hex': colorValue = rgbToHex(rgb.r, rgb.g, rgb.b); break; case 'rgb': colorValue = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentColor.a.toFixed(2)})`; break; case 'hsv': colorValue = `hsva(${Math.round(currentColor.h)}, ${Math.round(currentColor.s)}%, ${Math.round(currentColor.v)}%, ${currentColor.a.toFixed(2)})`; break; } display.value = colorValue; updateHuePreview(); updateAlphaPreview(); }

function updateCanvasBackground() { const canvas = document.getElementById('colorPickerCanvas'); if (!canvas) return; const hueColor = hsvToRgb(currentColor.h, 100, 100); canvas.style.background = `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, transparent), rgb(${hueColor.r}, ${hueColor.g}, ${hueColor.b})`; }
function updateColorPickerCursor(x, y) { const cursor = document.getElementById('colorPickerCursor'); if (cursor) { cursor.style.left = `${x * 100}%`; cursor.style.top = `${y * 100}%`; } }
function updateHueCursor(x) { const cursor = document.getElementById('hueCursor'); if (cursor) { cursor.style.left = `${x * 100}%`; } }
function updateAlphaCursor(x) { const cursor = document.getElementById('alphaCursor'); if (cursor) { cursor.style.left = `${x * 100}%`; } }
function updateHuePreview() { const preview = document.getElementById('huePreview'); if (!preview) return; const hueColor = hsvToRgb(currentColor.h, 100, 100); preview.style.backgroundColor = `rgb(${hueColor.r}, ${hueColor.g}, ${hueColor.b})`; }
function updateAlphaPreview() { const preview = document.getElementById('alphaPreview'); if (!preview) return; const rgb = hsvToRgb(currentColor.h, currentColor.s, currentColor.v); preview.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentColor.a})`; preview.style.backgroundImage = 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%)'; preview.style.backgroundSize = '8px 8px'; }
function switchFormat(format) { currentFormat = format; document.querySelectorAll('.format-tab').forEach(tab => { tab.classList.toggle('active', tab.dataset.format === format); }); updateColorDisplay(); }
function setColorFromHex(hex) { const rgb = hexToRgb(hex); const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b); currentColor = { ...hsv, a: 1 }; updateColorDisplay(); updateCanvasBackground(); updateColorPickerCursor(currentColor.s / 100, 1 - currentColor.v / 100); updateHueCursor(currentColor.h / 360); updateAlphaCursor(currentColor.a); }
function saveColorToPalette() { const rgb = hsvToRgb(currentColor.h, currentColor.s, currentColor.v); const hex = rgbToHex(rgb.r, rgb.g, rgb.b); const colorName = getColorName(hex); addToHistory(hex); const colorPalette = document.getElementById('colorPalette'); if (colorPalette) { const colorItem = document.createElement('div'); colorItem.className = 'color-item-modern'; colorItem.addEventListener('click', () => copyColorToClipboard(hex)); colorItem.innerHTML = `\n                    <div class="color-preview-modern" style="background-color: ${hex}\"></div>\n                    <div class="color-info-modern">\n                        <div class="color-code-modern">${hex.toUpperCase()}</div>\n                        <div class="color-name-modern">${colorName}</div>\n                    </div>\n                `; colorPalette.appendChild(colorItem); showToast(`🎨 Color ${hex} added to palette!`); } }
function clearColorPicker() { const colorPalette = document.getElementById('colorPalette'); if (colorPalette) { colorPalette.innerHTML = ''; showToast('🗑️ Palette cleared!'); } }
function copyColorToClipboard(color) { navigator.clipboard.writeText(color).then(() => { showToast(`Color ${color} copied to clipboard!`); }); }
function copyColorPalette() { const colorItems = document.querySelectorAll('#colorPalette .color-code-modern'); const colors = Array.from(colorItems).map(item => item.textContent).join(', '); navigator.clipboard.writeText(colors).then(() => { showToast('🎨 Color palette copied to clipboard!'); }); }
function exportColorPalette() { const colorItems = document.querySelectorAll('#colorPalette .color-code-modern'); const colors = Array.from(colorItems).map((item, index) => { return `  --color-${index + 1}: ${item.textContent};`; }).join('\n'); const css = `:root {\n${colors}\n}`; navigator.clipboard.writeText(css).then(() => { showToast('💾 CSS variables copied to clipboard!'); }); }
function showToast(message) { const toast = document.createElement('div'); toast.style.cssText = `position: fixed;top: 20px;right: 20px;background: rgba(0, 0, 0, 0.8);color: white;padding: 1rem 1.5rem;border-radius: 8px;z-index: 10000;animation: fadeIn 0.3s ease-in-out;`; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => { toast.remove(); }, 3000); }

// DOM init helpers
function __attach_color_gen_listeners() {
    const closeBtn = document.getElementById('closeColorGenBtn'); if (closeBtn) closeBtn.addEventListener('click', closeColorGenPanel);
    const copyBtn = document.getElementById('copyCurrentColorBtn'); if (copyBtn) copyBtn.addEventListener('click', copyCurrentColor);
    const saveBtn = document.getElementById('saveColorBtn'); if (saveBtn) saveBtn.addEventListener('click', saveColorToPalette);
    const clearBtn = document.getElementById('clearColorBtn'); if (clearBtn) clearBtn.addEventListener('click', clearColorPicker);
    const clearHistoryBtn = document.getElementById('clearHistoryBtn'); if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearColorHistory);
    const genBtn = document.getElementById('genRandomBtn'); if (genBtn) genBtn.addEventListener('click', generateRandomColors);
    const copyPaletteBtn = document.getElementById('copyPaletteBtn'); if (copyPaletteBtn) copyPaletteBtn.addEventListener('click', copyColorPalette);
    const exportPaletteBtn = document.getElementById('exportPaletteBtn'); if (exportPaletteBtn) exportPaletteBtn.addEventListener('click', exportColorPalette);
}

function closeColorGenPanel() { history.back(); }

loadColorHistory();
generateRandomColors();
setTimeout(initColorPicker, 50);
__attach_color_gen_listeners();
