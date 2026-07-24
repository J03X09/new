# Vinted Monitor

A clean, mobile-first dashboard for spotting **new Vinted uploads** the moment they land —
organised into categories and brands (Phones, Shoes, Ralph Lauren, Pull & Bear, and any
custom search you add).

Each item shows its **photo, price, condition and size** at a glance, newly-detected uploads
are highlighted with a pulsing **NEW** badge, and the feed auto-refreshes on an interval you
choose.

![dashboard](https://img.shields.io/badge/mobile-first-09B1BA) ![vite](https://img.shields.io/badge/vite-react19-646cff)

## Features

- **Category & brand tabs** — Phones, Shoes, Ralph Lauren, Pull & Bear ship as presets.
- **Add your own monitors** — paste any Vinted search URL (with category / brand / size /
  condition filters applied) and the app watches exactly that search. This is the most
  accurate way to filter, because Vinted itself builds the query.
- **New-upload detection** — items not seen on the previous poll are flagged `NEW`, counted
  per category, and can trigger a browser notification and/or a chime.
- **Live polling** — pick a 15s / 30s / 1m / 2m interval, or pause it.
- **Region aware** — switch between `vinted.co.uk`, `.com`, `.ie`, `.fr`, `.de`, and more.
- **Installable** — add to your phone's home screen (PWA manifest + iOS meta tags) for a
  full-screen, app-like experience.
- **Item detail** — photo, price, condition (colour-coded), size, brand and upload age; tap a
  card to open the real listing on Vinted.

## How it works (and the one important caveat)

Vinted has **no public API**. Every working monitor talks to Vinted's *internal* catalog
endpoint (`/api/v2/catalog/items`), which:

1. can't be called from a browser (CORS + anti-bot), so this app ships a tiny **serverless
   proxy** at [`api/vinted.js`](api/vinted.js), and
2. is guarded by DataDome bot protection that **blocks datacentre IPs**.

The proxy fetches an anonymous session cookie from the Vinted homepage, then calls the catalog
API with proper browser headers and normalises the result. From cloud hosts (Vercel's default
IPs, CI, sandboxes) Vinted returns `403` — when that happens the app **degrades gracefully to a
labelled demo dataset** so the dashboard is always usable, and a banner explains how to switch
on real data.

## Turn on real items

Real uploads require the request to leave from an IP Vinted trusts (practically, a residential
IP).

### Free, no accounts: run it at home 🏠

The simplest free option is to run the monitor on a machine at home — your home internet is a
residential IP Vinted trusts, so it returns real items with **no API keys or scraping credits**:

```bash
npm run home        # builds + serves the whole app on your home IP
```

Then open it on your phone over Wi-Fi at the printed `Network:` address, or from anywhere via a
free Cloudflare Tunnel. Full step-by-step in **[HOME_SETUP.md](HOME_SETUP.md)**.

### Deploying to a cloud host instead

If you host on the cloud (Vercel etc.), the request comes from a datacentre IP, so you need a
trusted egress. The proxy supports three modes, chosen by environment variables at deploy time —
set **one** and redeploy (copy `.env.example` for reference):

| Mode | Env var | When to use |
| --- | --- | --- |
| **Scraping API** | `SCRAPER_API_KEY` | Sign up at [ScraperAPI](https://www.scraperapi.com), paste the key, redeploy. It fetches from residential IPs and handles DataDome. Vinted needs its `ultra_premium` tier (~25-30 credits/request), so the free 1,000-credit trial covers ~30-40 test fetches, not continuous polling. Tuning vars: `SCRAPER_API_COUNTRY`, `SCRAPER_API_ULTRA`, `SCRAPER_API_RENDER`. |
| **Residential proxy** | `VINTED_PROXY_URL` | You already have a residential/rotating proxy. Format: `http://user:pass@host:port`. |
| **Direct** _(default)_ | — | Only returns real data when the server itself runs on a residential IP (e.g. self-hosting the proxy on your home machine). |

On **Vercel**: Project → Settings → Environment Variables → add `SCRAPER_API_KEY` (or
`VINTED_PROXY_URL`) → redeploy. The banner disappears and live items flow. The in-app banner
also tells you which egress mode is currently active.

> **Note:** you cannot bypass DataDome from a datacentre IP with headers alone — that's an
> infrastructure constraint every Vinted monitor faces, not a bug in this app.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000  (the /api/vinted proxy runs in Vite dev too)
```

## Build & deploy

```bash
npm run build    # outputs dist/
```

Deploys to **Vercel** as-is: the SPA is served statically and `api/vinted.js` runs as a Node
serverless function ([`vercel.json`](vercel.json) keeps `/api/*` off the SPA rewrite). Open the
deployed URL on your phone and add it to your home screen.

## Adding a precise monitor

1. On Vinted, search and apply the filters you want (category, brand, size, condition, price).
2. Copy the page URL from your browser.
3. In the app tap **Add**, give it a name + icon, and paste the URL.

The app parses the catalog / brand / size / condition IDs straight from that URL, so the feed
matches Vinted's own results.

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4 · a dependency-free Node proxy.
