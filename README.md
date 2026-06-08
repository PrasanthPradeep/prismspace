<h1 align="center">Prism Space</h1>
<p align="center">Your Space on the Internet</p>

<p align="center">
  <img width="500" height="500" alt="prismSpaceRebranded" src="https://github.com/user-attachments/assets/0033aefe-8105-44b4-8b9a-c056d00666da" />
</p>

## What is Prism Space?

Prism Space is a customizable browser workspace built for the modern web.
This repository now ships Prism Space as a **WXT browser extension (Manifest V3)** powered by React.

---

# Extension Development

## Run Locally

```bash
pnpm install
pnpm run dev
```

For Firefox-based browsers, run:

```bash
pnpm run dev:firefox
```

Then load the generated development extension from the WXT output path shown in the terminal.

## Build

```bash
pnpm run build
pnpm run zip
```

`build` and `zip` create both Chrome MV3 and Firefox MV3 targets. Use `build:chrome`, `build:firefox`, `zip:chrome`, or `zip:firefox` when you only need one browser.

## Structure

- `entrypoints/` - extension entry points (new tab, popup, options, sidepanel, background, tool pages).
- `components/home/` - homepage JSX wrapper.
- `components/dev-tools/` - Dev Space tool pages.
- `components/clock-previews/` - clock preview pages.
- `components/config/` - config/status helper page.
- `components/legacy/` - runtime bridge for preserved vanilla HTML behavior.
- `src/extension/` - shared extension runtime helpers (rendering, storage bridge).
- `public/` - extension assets, fonts, JSON data, and legacy scripts.
- `styles/` - global and Aura CSS.
- `legacy-static/` - archived original HTML/CSS/JS source files.

## Extension Pages

The extension preserves existing static page paths as extension pages:

- `/index.html` -> `/`
- `/config-loader.html` -> `/config-loader`
- `/dev-space/*.html` -> `/dev-space/*`
- `/clock-previews/*.html` -> `/clock-previews/*`

---

<p align="center">Build by <a href="prismbrowser.tech">Prism AI Labs</a></p>
