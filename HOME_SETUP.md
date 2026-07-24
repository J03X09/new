# Run Vinted Monitor at home — free, with real items

Vinted blocks datacentre servers (Vercel, etc.), but it trusts normal home
internet connections. So the simplest way to get **real uploads for free** is to
run the monitor on a machine at home (any laptop, desktop, or Raspberry Pi) and
open it on your phone.

No accounts, no API keys, no scraping credits.

---

## 1. One-time setup

Install [Node.js](https://nodejs.org) (v18 or newer), then in the project folder:

```bash
npm install
```

## 2. Start the monitor

```bash
npm run home
```

This builds the dashboard and starts the server. You'll see something like:

```
  Vinted Monitor — home server

  Local:    http://localhost:3000
  Network:  http://192.168.1.24:3000   (open this on your phone over Wi-Fi)

  Egress:   direct  (real items, straight from your home IP)
```

> Already built once? Use `npm run serve` to skip the rebuild and start instantly.

## 3. Open it on your phone

**Option A — same Wi-Fi (easiest).**
Make sure your phone is on the *same Wi-Fi* as this machine, then open the
`Network:` address it printed (e.g. `http://192.168.1.24:3000`) in your phone's
browser. Tap **Share → Add to Home Screen** for an app-like icon.

**Option B — from anywhere (free tunnel).**
To reach it on mobile data / away from home, expose it with a free
**Cloudflare Tunnel** — no account needed for a quick tunnel:

```bash
# macOS
brew install cloudflared
# Windows: winget install --id Cloudflare.cloudflared
# Linux: see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# with `npm run home` already running in another terminal:
cloudflared tunnel --url http://localhost:3000
```

Cloudflared prints a public `https://<random>.trycloudflare.com` URL — open that
on your phone from anywhere. (Quick tunnels are ephemeral; the URL changes each
run. For a permanent URL, create a free Cloudflare account and a named tunnel —
see their docs. [ngrok](https://ngrok.com) is an equivalent alternative.)

---

## Keeping it running

- **Leave the machine on** (and awake) for the monitor to keep checking. On a
  laptop, disable sleep, or use a Raspberry Pi / always-on desktop.
- To run it in the background and restart on crash, use
  [pm2](https://pm2.keymetrics.io):

  ```bash
  npm install -g pm2
  npm run build
  pm2 start server/index.js --name vinted-monitor
  pm2 save
  ```

## Troubleshooting

- **Still seeing the "demo items" banner** with `egress: direct`? Your ISP or
  network may be flagged. Try again later, or fall back to a scraping API key
  (`SCRAPER_API_KEY`) or residential proxy (`VINTED_PROXY_URL`) — see the README.
- **Phone can't load the Network address?** Your home Wi-Fi may block
  device-to-device traffic ("AP isolation"), or a firewall is blocking the port.
  Use the Cloudflare Tunnel option instead.
- **Change the port:** `PORT=8080 npm run serve`.
