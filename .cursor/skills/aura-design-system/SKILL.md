---
name: aura-design-system
description: Enforces Aura Design System v3 CSS tokens, motion, typography, components, and Prism/Next.js architecture (auth, paywall, API routes, Stripe). Use when building, editing, or extending Aura or Prism UI, styles, or backend features.
---
# AURA — Design System & Architecture SKILL

> **MANDATORY READ** for any coding model or agent building, editing, or extending any part of the Aura / Prism project.  
> Treat every rule here as a hard constraint. Do not approximate. Do not substitute. Do not invent.

---

## 0. GOLDEN RULES — READ FIRST

1. **CSS variables only.** Never hardcode a color hex, font name, or easing value. Every visual property must reference a `--token`.
2. **Both themes always.** Every component must work in light mode (`[data-theme="light"]` / `:root`) and dark mode (`[data-theme="dark"]`). If a token exists for both, both themes are covered automatically.
3. **Motion is not optional.** Every interactive element must carry the correct easing curve and duration from the token sheet. Static hover states are a bug.
4. **Font loading.** Always import all three typefaces before any CSS. Missing a font import breaks the entire typographic system.
5. **Architecture is server-enforced.** Rate limits and plan checks happen in Next.js API routes, never in the browser. Frontend plan UI is a hint, not a gate.

---

## PART 1 — AURA DESIGN SYSTEM v3

### 1.1 Font Imports (required, in this order)

```html
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,200;1,9..144,300&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

### 1.2 CSS Token Sheet — Light Mode (`:root`)

Paste these verbatim. Never modify the raw values.

```css
:root {
  /* FOREST PRIMARY */
  --p:           #2D5016;
  --p-mid:       #3D6B20;
  --p-bright:    #4F8A2A;
  --p-soft:      #EDF4E6;
  --p-container: #C8E6B0;

  /* CITRUS ACCENT */
  --a:           #8FAF00;
  --a-dark:      #6D8600;
  --a-soft:      #F5FAE0;
  --a-container: #DDF0A0;

  /* EARTH TERTIARY */
  --t:           #A0724A;
  --t-dark:      #7A5235;
  --t-soft:      #F5EDE4;
  --t-container: #E8D0BC;

  /* SAND FOURTH */
  --s:           #C8A96A;
  --s-dark:      #9A7A3E;
  --s-soft:      #FAF5EB;

  /* WARNING */
  --w:           #D97706;
  --w-soft:      #FEF3C7;

  /* SURFACES */
  --bg:          #F8F9F4;
  --surface:     #FFFFFF;
  --surface-2:   #F1F4EC;
  --surface-3:   #E6ECDB;

  /* TEXT */
  --ink:         #141A0E;
  --ink-2:       #3A4830;
  --ink-3:       #7A8F6A;

  /* BORDER */
  --border:      #D8E2C8;
  --border-2:    #BECE9E;

  /* ERROR */
  --error:       #C0392B;
  --error-soft:  #FDECEA;

  /* NAV */
  --nav-bg:      rgba(248,249,244,.92);
  --nav-border:  rgba(216,226,200,.8);

  /* TYPOGRAPHY */
  --fd: 'Cabinet Grotesk', sans-serif;   /* display / UI */
  --fs: 'Fraunces', Georgia, serif;      /* editorial / italic */
  --fm: 'Fira Code', monospace;          /* labels / code / mono */
}
```

### 1.3 CSS Token Sheet — Dark Mode (`[data-theme="dark"]`)

```css
[data-theme="dark"] {
  --p:           #8DC85A;
  --p-mid:       #A0D970;
  --p-bright:    #B4EA84;
  --p-soft:      #152808;
  --p-container: #2A4D14;

  --a:           #C8E040;
  --a-dark:      #DEFA50;
  --a-soft:      #1A2200;
  --a-container: #2E3A00;

  --t:           #D4A070;
  --t-dark:      #E8B880;
  --t-soft:      #1E1008;
  --t-container: #3C2018;

  --s:           #E8CC8A;
  --s-dark:      #F0DC9E;
  --s-soft:      #1A1200;

  --w:           #FBD34D;
  --w-soft:      #1C1400;

  --bg:          #0C1208;
  --surface:     #141C0E;
  --surface-2:   #1C2816;
  --surface-3:   #263420;

  --ink:         #DDEEC8;
  --ink-2:       #A8C890;
  --ink-3:       #608040;

  --border:      #2A3C1E;
  --border-2:    #3C5428;

  --error:       #FF6B6B;
  --error-soft:  #2C0E0E;

  --nav-bg:      rgba(12,18,8,.92);
  --nav-border:  rgba(42,60,30,.8);
}
```

The font tokens (`--fd`, `--fs`, `--fm`) and motion tokens (below) are theme-neutral; they live in `:root` only.

---

### 1.4 Motion System — MD3 Expressive Curves

Two families: **Spatial** (elements that move through space) and **Effects** (colour/opacity/property changes).

```css
/* Easing curves */
--ease-spatial-fast:    cubic-bezier(0.42, 1.67, 0.21, 0.90);
--ease-spatial-default: cubic-bezier(0.38, 1.21, 0.22, 1.00);
--ease-spatial-slow:    cubic-bezier(0.39, 1.29, 0.35, 0.98);

--ease-effects-fast:    cubic-bezier(0.31, 0.94, 0.34, 1.00);
--ease-effects-default: cubic-bezier(0.34, 0.80, 0.34, 1.00);
--ease-effects-slow:    cubic-bezier(0.34, 0.88, 0.34, 1.00);

/* Durations */
--dur-spatial-fast:    350ms;
--dur-spatial-default: 500ms;
--dur-spatial-slow:    650ms;

--dur-effects-fast:    150ms;
--dur-effects-default: 200ms;
--dur-effects-slow:    300ms;

/* Aliases (use when precise semantic doesn't matter) */
--ease:   var(--ease-effects-default);
--spring: var(--ease-spatial-fast);
--tf:     var(--dur-effects-fast);
--tn:     var(--dur-effects-default);
--ts:     var(--dur-spatial-default);
```

**When to use which curve:**

| Situation | Curve token | Duration token |
|---|---|---|
| Card entering, modal appearing | `--ease-spatial-fast` | `--dur-spatial-fast` (350ms) |
| Page transition, layout shift | `--ease-spatial-default` | `--dur-spatial-default` (500ms) |
| Hero animation, reveal | `--ease-spatial-slow` | `--dur-spatial-slow` (650ms) |
| Hover state, focus ring | `--ease-effects-fast` | `--dur-effects-fast` (150ms) |
| Colour change, opacity | `--ease-effects-default` | `--dur-effects-default` (200ms) |
| Background, theme switch | `--ease-effects-slow` | `--dur-effects-slow` (300ms) |
| Button press / like spring | `--ease-spatial-fast` | `--dur-spatial-fast` |

**Keyframes to include in every stylesheet:**

```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1);   opacity: 1;  }
  50%       { transform: scale(1.6); opacity: .5; }
}
@keyframes breathe {
  0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0   rgba(143,175,0,.4); }
  50%       { transform: scale(1.2); box-shadow: 0 0 0 12px rgba(143,175,0,0); }
}
@keyframes morphBlob {
  0%,  100% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 60%; }
  33%        { border-radius: 30% 70% 40% 60% / 60% 30% 70% 40%; }
  66%        { border-radius: 50% 50% 30% 70% / 40% 70% 30% 60%; }
}
@keyframes morphShape {
  0%,  100% { border-radius: 40% 60% 60% 40% / 40% 60% 40% 60%; }
  50%        { border-radius: 60% 40% 40% 60% / 60% 40% 60% 40%; }
}
@keyframes spinBounce {
  0%   { transform: rotate(0deg)   scale(1);   }
  60%  { transform: rotate(200deg) scale(1.2); }
  100% { transform: rotate(180deg) scale(1);   }
}
```

---

### 1.5 Typography Rules

**Three typefaces, three purposes — never mix roles:**

| Token | Typeface | Weights | Use |
|---|---|---|---|
| `--fd` | Cabinet Grotesk | 400, 500, 700, 800, 900 | All UI text, headings, buttons, labels |
| `--fs` | Fraunces (italic) | 200i, 300i, 300 | Editorial accents, hero italic lines only |
| `--fm` | Fira Code | 400, 500 | Labels, tags, badges, code, monospaced metadata |

**Type scale:**

```css
/* Display */
.ts-d1   { font: 900 80px/0.95 var(--fd); letter-spacing: -.06em; }
.ts-d2   { font: 800 48px/1.0  var(--fd); letter-spacing: -.05em; }

/* Hero serif (Fraunces italic accent) */
.ts-serif    { font: 200italic 88px/0.95 var(--fs); letter-spacing: -.02em; color: var(--p); }
.ts-serif-sm { font: 300italic 32px/1.1  var(--fs); color: var(--p); }

/* Section heading */
h2.sh { font: 800 clamp(34px,5vw,52px)/1.02 var(--fd); letter-spacing: -.04em; color: var(--ink); }

/* Body */
.ts-body { font: 400 16px/1.75 var(--fd); color: var(--ink-2); max-width: 520px; }

/* Mono label */
.ts-mono { font: 400 13px/1.6 var(--fm); color: var(--t-dark); background: var(--t-soft); }
```

**Pairing pattern (hero / editorial card):**

```
[Cabinet Grotesk 800 — short punchy headline]
[Fraunces italic 300 — one-line serif counterpoint in --p]
[Cabinet Grotesk 400 — body paragraph in --ink-2]
```

---

### 1.6 Component Recipes

All components use CSS variables and the motion system above. Copy exactly.

#### Navigation

```css
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 99;
  background: var(--nav-bg);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--nav-border);
  height: 60px; display: flex; align-items: center;
  padding: 0 52px; gap: 32px;
  transition: background var(--ts) var(--ease-spatial-default),
              border-color var(--ts) var(--ease-spatial-default);
}
```

#### Buttons

```css
.btn {
  font: 700 14px var(--fd); padding: 13px 28px; border-radius: 9999px;
  cursor: pointer; border: none; letter-spacing: -.01em;
  transition: transform var(--dur-spatial-fast) var(--ease-spatial-fast),
              box-shadow var(--tf) var(--ease-effects-fast),
              background var(--tf) var(--ease-effects-fast);
}
/* Primary */
.btn-p { background: var(--p); color: #fff;
  box-shadow: 0 4px 18px rgba(45,80,22,.22), 0 1px 4px rgba(45,80,22,.14); }
.btn-p:hover { background: var(--p-mid); transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 28px rgba(45,80,22,.28), 0 2px 8px rgba(45,80,22,.16); }
.btn-p:active { transform: scale(.97); }

/* Accent */
.btn-a { background: var(--a); color: var(--ink);
  box-shadow: 0 4px 18px rgba(143,175,0,.28), 0 1px 4px rgba(143,175,0,.18); }
.btn-a:hover { background: var(--a-dark); transform: translateY(-3px) scale(1.02); }
.btn-a:active { transform: scale(.97); }

/* Outline */
.btn-out { background: transparent; color: var(--ink); border: 1.5px solid var(--border-2); }
.btn-out:hover { border-color: var(--p); color: var(--p); background: var(--p-soft);
  transform: translateY(-2px); }

/* Ghost */
.btn-ghost { background: transparent; color: var(--p-bright); border: none; padding: 13px 22px; }
.btn-ghost:hover { background: var(--p-soft); }
```

#### Tags / Chips / Badges

```css
/* Pill badge (nav, hero tag) */
.nav-badge, .hero-tag {
  font: 400 10px var(--fm); letter-spacing: .1em; text-transform: uppercase;
  background: var(--p-soft); color: var(--p-bright);
  padding: 4px 10px; border-radius: 9999px; border: 1px solid var(--p-container);
}

/* Interactive tag variants */
.tag-p { background: var(--p-soft);  color: var(--p);      border-color: var(--p-container); }
.tag-a { background: var(--a-soft);  color: var(--a-dark); border-color: var(--a-container); }
.tag-t { background: var(--t-soft);  color: var(--t-dark); border-color: var(--t-container); }
.tag-s { background: var(--s-soft);  color: var(--s-dark); }

/* Filter chip */
.chip {
  font: 500 13px var(--fd); padding: 7px 17px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--surface); color: var(--ink);
  cursor: pointer;
  transition: all var(--tn) var(--ease-effects-default);
}
.chip:hover { border-color: var(--p); background: var(--p-soft); color: var(--p); }
.chip.on    { border-color: var(--p); background: var(--p);       color: #fff; }

/* Static badge */
.badge { font: 700 12px var(--fd); padding: 5px 13px; border-radius: 9999px; letter-spacing: .01em; }
.b-p { background: var(--p-soft); color: var(--p); }
.b-a { background: var(--a-soft); color: var(--a-dark); }
.b-t { background: var(--t-soft); color: var(--t-dark); }
.b-s { background: var(--s-soft); color: var(--s-dark); }
.b-out { background: transparent; color: var(--ink-3); border: 1px solid var(--border); }
```

#### Cards

```css
/* Standard surface card */
.comp-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 24px; padding: 28px;
  transition: background var(--tn) var(--ease), border-color var(--tn) var(--ease);
}

/* Hoverable card with lift */
.big-swatch {
  border-radius: 24px; overflow: hidden; border: 1px solid var(--border);
  transition: transform var(--dur-spatial-fast) var(--ease-spatial-fast),
              border-color var(--tn) var(--ease);
}
.big-swatch:hover { transform: translateY(-6px) scale(1.01); }
```

#### Form Inputs

```css
.demo-inp {
  width: 100%; font: 400 14px var(--fd);
  padding: 11px 16px; border: 1.5px solid var(--border);
  border-radius: 12px; background: var(--bg); color: var(--ink); outline: none;
  transition: border-color var(--tf) var(--ease-effects-fast),
              box-shadow var(--tf) var(--ease-effects-fast),
              background var(--tn) var(--ease);
}
.demo-inp:focus {
  border-color: var(--p);
  box-shadow: 0 0 0 3px var(--p-soft);
}
```

#### Icons (SVG)

```css
.icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; }
.icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* Icon grid item */
.icon-item {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 20px 12px; border-radius: 16px;
  background: var(--surface); border: 1px solid var(--border); cursor: pointer;
  transition: transform var(--dur-spatial-fast) var(--ease-spatial-fast),
              background var(--tn) var(--ease),
              border-color var(--tn) var(--ease),
              box-shadow var(--tn) var(--ease);
}
.icon-item:hover {
  transform: translateY(-4px) scale(1.06);
  background: var(--p-soft); border-color: var(--p-container);
  box-shadow: 0 8px 24px rgba(45,80,22,.12);
}
.icon-item svg { width: 28px; height: 28px; stroke: var(--ink-2); fill: none;
  stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  transition: stroke var(--tn) var(--ease); }
.icon-item:hover svg { stroke: var(--p); }
```

#### Toast / Notification

```css
.toast {
  background: var(--ink); color: var(--bg);
  border-radius: 14px; padding: 14px 18px;
  display: flex; align-items: center; gap: 12px;
  font: 500 14px var(--fd);
}
.toast-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--a);
  flex-shrink: 0; animation: pulse 2s ease-in-out infinite;
}
```

#### Section Labels

```css
.lbl {
  font: 400 11px var(--fm); letter-spacing: .14em; text-transform: uppercase;
  color: var(--p-bright); margin-bottom: 14px;
  display: flex; align-items: center; gap: 12px;
  transition: color var(--tn) var(--ease);
}
.lbl::after { content: ''; height: 1px; flex: 1; background: var(--border); max-width: 180px; }
```

#### Hero Blob Backgrounds

```css
/* Use on hero section ::before and ::after */
.hero::before {
  content: ''; position: absolute; top: -80px; right: -120px;
  width: 480px; height: 480px;
  background: radial-gradient(ellipse, var(--p-container) 0%, transparent 70%);
  border-radius: 60% 40% 70% 30% / 50% 60% 40% 60%;
  opacity: .5; z-index: 0;
  animation: morphBlob 12s ease-in-out infinite;
}
.hero::after {
  content: ''; position: absolute; bottom: 40px; left: -80px;
  width: 300px; height: 300px;
  background: radial-gradient(ellipse, var(--a-container) 0%, transparent 70%);
  border-radius: 40% 60% 30% 70% / 60% 40% 70% 30%;
  opacity: .4; z-index: 0;
  animation: morphBlob 15s ease-in-out infinite reverse;
}
```

#### Dark Mode Toggle

```css
.theme-toggle {
  width: 48px; height: 26px; border-radius: 9999px;
  background: var(--surface-3); border: 1.5px solid var(--border-2);
  cursor: pointer; position: relative;
  transition: background var(--tn) var(--ease-effects-default),
              border-color var(--tn) var(--ease-effects-default);
}
.theme-toggle::before {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%; background: var(--p);
  transition: transform var(--dur-spatial-fast) var(--ease-spatial-fast),
              background var(--tn) var(--ease-effects-default);
}
[data-theme="dark"] .theme-toggle::before { transform: translateX(22px); }
```

Toggle JS:
```js
document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
});
```

#### Scroll Reveal

```css
.reveal { opacity: 0; transform: translateY(24px);
  transition: opacity .6s ease, transform .6s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
```
```js
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) setTimeout(() => e.target.classList.add('in'), i * 60);
  });
}, { threshold: .06 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```

#### Shadows

| Name | CSS |
|---|---|
| Flush | no shadow — use border only |
| Raised | `box-shadow: 0 4px 18px rgba(45,80,22,.14)` |
| Float | `box-shadow: 0 8px 24px rgba(45,80,22,.12)` |
| Lifted (hover) | `box-shadow: 0 10px 28px rgba(45,80,22,.22)` |

Shadow colour is always Forest Green tinted — never neutral grey.

#### Spacing Scale

| Token | px | Use |
|---|---|---|
| `4px` | 4 | gap within component |
| `8px` | 8 | compact internal padding |
| `12px` | 12 | small gap between elements |
| `16px` | 16 | standard internal padding |
| `24px` | 24 | card internal padding |
| `28px` | 28 | card padding (large) |
| `32px` | 32 | between related sections |
| `48px` | 48 | section sub-gap |
| `52px` | 52 | horizontal page margin |
| `60px` | 60 | section vertical padding start |
| `80px` | 80 | section padding standard |

#### Border Radius Scale

| Value | Use |
|---|---|
| `6px` | code snippets, tiny UI chrome |
| `10px` | chips |
| `12px` | inputs, small cards |
| `14px` | toasts |
| `16px` | icon items, small cards |
| `18px` | plan cards |
| `20px` | animation cards, token sheet |
| `24px` | standard comp-card |
| `28px` | pairing demo |
| `9999px` | pills, buttons, all fully-rounded elements |

---

### 1.7 Plan Cards (Free / Pro)

```css
.plan { border-radius: 18px; padding: 20px; border: 1.5px solid var(--border); }
.plan.free { background: var(--surface-2); }
.plan.pro  { background: var(--p-soft); border-color: var(--p-container); }
.plan-tier { font: 400 10px var(--fm); letter-spacing: .1em; text-transform: uppercase; }
.plan.free .plan-tier { color: var(--ink-3); }
.plan.pro  .plan-tier { color: var(--p-bright); }
.plan-name { font: 800 20px var(--fd); letter-spacing: -.03em; color: var(--ink); }
.plan-feat { font-size: 12px; color: var(--ink-2); display: flex; align-items: center; gap: 7px; }
.plan-feat::before { content: '✓'; color: var(--p); font-weight: 700; flex-shrink: 0; }
.plan-feat.no { color: var(--border-2); }
.plan-feat.no::before { content: '—'; color: var(--border-2); }
```

---

## PART 2 — PRISM / AURA ARCHITECTURE

### 2.1 Tech Stack

| Layer | Tool | Role |
|---|---|---|
| Framework | **Next.js** (App Router) | Pages, routing, API routes, middleware |
| Database | **Neon DB** | Serverless PostgreSQL, free tier |
| ORM | **Drizzle ORM** | Type-safe DB queries, TypeScript-first |
| Auth | **Auth.js** (v5, formerly NextAuth) | Sessions, credentials, Google OAuth |
| Payments | **Stripe** | Checkout, webhooks, subscription management |
| Email | **Brevo** via Nodemailer (SMTP) | Transactional email, 300/day free |
| AI | **Groq API** | llama-3.1-8b (free) / llama-3.3-70b (pro) |
| UI | **shadcn/ui** + Tailwind | Pre-built React components |
| Deploy | **Vercel** | Hosting, CDN, environment variables |

### 2.2 Database Schema

Three tables — implement exactly as described.

#### `users`

```sql
CREATE TABLE users (
  id                    SERIAL PRIMARY KEY,
  name                  TEXT,
  email                 TEXT UNIQUE NOT NULL,
  password_hash         TEXT,                        -- bcrypt, never plain text
  plan                  TEXT DEFAULT 'free',         -- 'free' | 'pro'
  stripe_customer_id    TEXT,                        -- links to Stripe customer
  stripe_subscription_id TEXT,                       -- for cancellation
  created_at            TIMESTAMP DEFAULT NOW()
);
```

`plan` is the single source of truth for the paywall. Everything downstream reads this column.

#### `rate_limits`

```sql
CREATE TABLE rate_limits (
  id       SERIAL PRIMARY KEY,
  user_id  INTEGER REFERENCES users(id),
  tool     TEXT NOT NULL,  -- 'writing' | 'code' | 'translator' | 'language' | 'decision'
  count    INTEGER DEFAULT 0,
  reset_at TIMESTAMP NOT NULL  -- set to next 00:00 UTC on insert/update
);
```

Free-tier enforcement: check `count >= limit` before any AI call. No Redis needed.

#### `reset_tokens`

```sql
CREATE TABLE reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  token      TEXT NOT NULL,        -- random secure string
  expires_at TIMESTAMP NOT NULL,   -- typically NOW() + 1 hour
  used       BOOLEAN DEFAULT FALSE -- set true after use, prevents replay
);
```

### 2.3 Request Flow (7 steps, must enforce in this order)

```
1. User visits  →  Vercel CDN serves Next.js
                   middleware.ts checks Auth.js session cookie
                   → not logged in + protected page → redirect /login

2. Login        →  POST /api/auth/[...nextauth]
                   Auth.js + bcrypt check against Neon users table
                   → success: session cookie set; plan attached to session

3. Opens tool   →  React reads session.user.plan
                   UI hint shown (e.g. "5 requests remaining")
                   ← visual hint only, NOT the real gate

4. Submits prompt →  POST /api/ai/[tool]  (Next.js API Route)
                     Server checks:
                       (a) Is user authenticated?  →  401 if not
                       (b) What is users.plan?
                       (c) count >= daily limit?   →  429 if free + over limit
                     All three checks are server-side — cannot be bypassed from browser

5. Groq called  →  Server calls Groq with correct model
                   Free: llama-3.1-8b  |  Pro: llama-3.3-70b
                   GROQ_API_KEY stays in .env, never exposed to client

6. User upgrades →  Stripe Checkout (hosted by Stripe, not you)
                    Payment succeeds → Stripe fires webhook to /api/webhooks/stripe

7. Plan updated  →  Webhook handler:
                    (a) Verify Stripe signature
                    (b) UPDATE users SET plan = 'pro' WHERE stripe_customer_id = ...
                    (c) Send confirmation email via Brevo + Nodemailer
                    Next session refresh reflects new plan
```

### 2.4 Environment Variables

Never commit `.env` to git. Add all of these to Vercel dashboard and local `.env`.

```env
# APP
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000   # Vercel URL in production

# OAUTH (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# DATABASE
DATABASE_URL=postgresql://user:pass@host/db   # from Neon dashboard

# AI  (server-side only — never NEXT_PUBLIC_)
GROQ_API_KEY=

# PAYMENTS
STRIPE_SECRET_KEY=             # sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=         # from Stripe → Webhooks → signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # safe to expose, needed by Stripe.js

# EMAIL
BREVO_SMTP_USER=               # your Brevo account email
BREVO_SMTP_KEY=                # from Brevo → SMTP & API → SMTP tab
```

**Critical rules:**
- `GROQ_API_KEY` must NEVER be prefixed `NEXT_PUBLIC_`. Server only.
- Move any client-side Groq calls to API routes immediately.

### 2.5 Paywall Rules

| Feature | Free | Pro |
|---|---|---|
| Writing Assistant | 5 req/day, 8B model | Unlimited, 70B model |
| Code Explainer | 5 req/day, 8B model | Unlimited, 70B model |
| Code Translator | 3 req/day | Unlimited |
| Language Learning | 2 languages only | All languages |
| Decision Analyzer | Locked | Unlocked |
| AI model | llama-3.1-8b | llama-3.3-70b |

Rate limits are per-tool, per-user, per-day. Reset at 00:00. Stored in `rate_limits` table.

### 2.6 API Route Pattern

Every AI route must follow this exact pattern:

```ts
// /app/api/ai/[tool]/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimits } from '@/lib/schema';

export async function POST(req: Request) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  // 2. Plan check + rate limit
  if (session.user.plan === 'free') {
    const limit = await checkRateLimit(session.user.id, 'writing'); // tool name
    if (limit.count >= 5) return new Response('Rate limit exceeded', { status: 429 });
    await incrementRateLimit(session.user.id, 'writing');
  }

  // 3. Groq call — server side, key in env
  const model = session.user.plan === 'pro' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
  const { prompt } = await req.json();
  const result = await groq.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }] });

  return Response.json({ result: result.choices[0].message.content });
}
```

### 2.7 Stripe Webhook Pattern

```ts
// /app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    // Update users.plan = 'pro' where stripe_customer_id = session.customer
    // Send confirmation email via Brevo
  }

  return new Response('ok', { status: 200 });
}
```

### 2.8 Cost Summary

| Service | Free tier | Pay when |
|---|---|---|
| Next.js | Free, open source | Never |
| Neon DB | 0.5 GB, 1 compute unit | > $19/mo at scale |
| Drizzle ORM | Free, open source | Never |
| Auth.js | Free, open source | Never |
| Stripe | No monthly fee | 2.9% + $0.30 per transaction |
| Brevo | 300 emails/day | > $25/mo at scale |
| Groq | Generous free tier | Pay per token beyond free tier |
| shadcn/ui | Free, open source | Never |
| Vercel | 100 GB bandwidth | > $20/mo for teams |

**Total launch cost: $0.00.** You only pay Stripe when you make money.

---

## PART 3 — DECISION RULES FOR AGENTS

When building any UI component for this project, check these in order:

1. **Is there a CSS token for this value?** If yes, use it. If no, request a new token — never hardcode.
2. **Does this element animate?** If it moves spatially → spatial curve. If it changes a property → effects curve.
3. **Is this a button?** Must have hover lift (`translateY(-3px)`), hover shadow escalation, and active compress (`scale(.97)`).
4. **Is this a card?** Must carry `transition: background var(--tn) var(--ease), border-color var(--tn) var(--ease)` at minimum for theme switching.
5. **Is this an AI call?** It lives in a Next.js API route, never in a React component. Auth check → plan check → rate limit check → Groq call, in that order.
6. **Is this a plan-gated feature?** The React component shows a UI hint. The API route does the real enforcement. Both are required.
7. **Does the user enter data?** Use the `demo-inp` pattern with focus ring `box-shadow: 0 0 0 3px var(--p-soft)`.
8. **Is this dark-mode tested?** Every surface, border, text, and shadow must look intentional in `[data-theme="dark"]`.

---

*End of SKILL.md — Aura Design System v3 + Prism Architecture v1.0*