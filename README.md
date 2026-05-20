<h1 align="center">Prism Space</h1>
<p align="center">Your Space on the Internet</p>

<p align="center">
  <img width="500" height="500" alt="prismSpaceRebranded" src="https://github.com/user-attachments/assets/0033aefe-8105-44b4-8b9a-c056d00666da" />
</p>

## What is Prism Space?

Prism Space is a customizable browser workspace built for the modern web.

Access useful tools, AI utilities, productivity features, developer resources, and curated experiences — all from one beautiful start page.

---

# Contribution Development

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Structure

- `app/` - Next.js App Router pages.
- `components/home/` - homepage JSX wrapper.
- `components/dev-tools/` - Dev Space tools converted to `.jsx` route components.
- `components/clock-previews/` - clock preview iframe pages converted to `.jsx`.
- `components/config/` - config/status helper page.
- `components/legacy/` - runtime bridge for preserved vanilla HTML behavior.
- `public/` - served assets, fonts, JSON, and legacy browser scripts.
- `styles/` - global homepage CSS.
- `legacy-static/` - archived original HTML/CSS/JS source files.
- `scripts/migrate-static-to-next.mjs` - regenerates JSX wrappers from `legacy-static/`.

## Compatibility Routes

Existing static paths are preserved through Next rewrites:

- `/index.html` -> `/`
- `/config-loader.html` -> `/config-loader`
- `/dev-space/*.html` -> `/dev-space/*`
- `/clock-previews/*.html` -> `/clock-previews/*`

## AI Tools

The AI tools keep their original browser behavior and proxy/API wiring from the static version. The config/status helper is available at `/config-loader`.

---

<p align="center">Build by <a href="prismbrowser.tech">Prism AI Labs</a></p>
