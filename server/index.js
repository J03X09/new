// Standalone home server for Vinted Monitor.
//
// Runs the whole app — the built dashboard AND the /api/vinted proxy — from a
// single Node process on your own machine. Because it runs on your home
// (residential) IP, Vinted trusts it and returns REAL items for free, with no
// scraping service or proxy credentials.
//
//   npm run home        # build the dashboard, then start this server
//   npm run serve       # start this server against an existing build
//
// Then open it on your phone: over home Wi-Fi at the printed LAN address, or
// from anywhere via a free Cloudflare Tunnel (see HOME_SETUP.md).

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { demoItems } from "../api/_demo.js";
import { egressMode, fetchVintedItems } from "../api/_vinted.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".woff2": "font/woff2",
};

function sendJson(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
	});
	res.end(payload);
}

// GET /api/vinted?query=<vinted url/query>&domain=<host>
async function handleApi(url, res) {
	const query = url.searchParams.get("query") || "";
	const domain = url.searchParams.get("domain") || "vinted.co.uk";
	const perPage = Number(url.searchParams.get("per_page") || 48);
	try {
		const result = await fetchVintedItems({ query, domain, perPage });
		sendJson(res, 200, { source: "live", ...result, fetchedAt: Date.now() });
	} catch (err) {
		sendJson(res, 200, {
			source: "demo",
			domain,
			egress: egressMode(),
			error: err && err.message ? err.message : "fetch failed",
			items: demoItems(query, domain),
			fetchedAt: Date.now(),
		});
	}
}

// Serve a file from dist/, guarding against path traversal.
function serveStatic(pathname, res) {
	const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
	let filePath = join(DIST, safe);
	if (!filePath.startsWith(DIST)) {
		res.writeHead(403).end("Forbidden");
		return;
	}
	// SPA fallback: unknown, extensionless routes get index.html.
	if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
		if (extname(filePath)) {
			res.writeHead(404).end("Not found");
			return;
		}
		filePath = join(DIST, "index.html");
	}
	res.writeHead(200, {
		"Content-Type": MIME[extname(filePath)] || "application/octet-stream",
		"Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=3600",
	});
	createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
	const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
	if (url.pathname === "/api/vinted") {
		await handleApi(url, res);
		return;
	}
	serveStatic(url.pathname === "/" ? "/index.html" : url.pathname, res);
});

function lanAddresses() {
	const out = [];
	for (const iface of Object.values(networkInterfaces())) {
		for (const net of iface || []) {
			if (net.family === "IPv4" && !net.internal) out.push(net.address);
		}
	}
	return out;
}

if (!existsSync(DIST)) {
	console.error("\n  dist/ not found — build the dashboard first:\n    npm run build\n");
	process.exit(1);
}

server.listen(PORT, HOST, () => {
	const egress = egressMode();
	console.log("\n  Vinted Monitor — home server\n");
	console.log(`  Local:    http://localhost:${PORT}`);
	for (const ip of lanAddresses()) console.log(`  Network:  http://${ip}:${PORT}   (open this on your phone over Wi-Fi)`);
	console.log(`\n  Egress:   ${egress}${egress === "direct" ? "  (real items, straight from your home IP)" : ""}`);
	console.log("  Phone access from anywhere: see HOME_SETUP.md (free Cloudflare Tunnel).\n");
});
