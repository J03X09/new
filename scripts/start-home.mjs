// One-command home launcher: builds (unless SKIP_BUILD=1), starts the server,
// and — if cloudflared is installed — opens a free Cloudflare Tunnel and prints
// the public https URL to open on your phone from anywhere.
//
//   npm run home:tunnel
//
// Ctrl+C stops everything.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(cmd, args, opts = {}) {
	return spawn(cmd, args, { stdio: "inherit", cwd: ROOT, ...opts });
}

function hasCloudflared() {
	const probe = spawnSync(process.platform === "win32" ? "where" : "which", ["cloudflared"]);
	return probe.status === 0;
}

function lanUrl() {
	for (const iface of Object.values(networkInterfaces())) {
		for (const net of iface || []) {
			if (net.family === "IPv4" && !net.internal) return `http://${net.address}:${PORT}`;
		}
	}
	return `http://localhost:${PORT}`;
}

// 1. Build unless a fresh build already exists / is skipped.
if (process.env.SKIP_BUILD !== "1" || !existsSync(join(ROOT, "dist"))) {
	console.log("\n▸ Building dashboard…");
	const build = spawnSync(npmCmd, ["run", "build"], { stdio: "inherit", cwd: ROOT });
	if (build.status !== 0) process.exit(build.status || 1);
}

// 2. Start the server.
console.log("▸ Starting home server…");
const server = run("node", [join("server", "index.js")], {
	env: { ...process.env, PORT: String(PORT) },
});

const children = [server];
let cloudflared = null;

// 3. Optionally open a tunnel.
if (process.env.NO_TUNNEL === "1") {
	console.log("\n▸ Tunnel disabled (NO_TUNNEL=1). Open on your phone at:", lanUrl(), "\n");
} else if (hasCloudflared()) {
	console.log("▸ Opening Cloudflare Tunnel…\n");
	cloudflared = spawn("cloudflared", ["tunnel", "--url", `http://localhost:${PORT}`], {
		cwd: ROOT,
	});
	children.push(cloudflared);
	const surface = (buf) => {
		const text = buf.toString();
		const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
		if (m) {
			console.log("\n────────────────────────────────────────────────");
			console.log("  📱  Open on your phone (from anywhere):");
			console.log(`      ${m[0]}`);
			console.log("────────────────────────────────────────────────\n");
		}
	};
	cloudflared.stdout.on("data", surface);
	cloudflared.stderr.on("data", surface); // cloudflared logs the URL to stderr
} else {
	console.log("\n▸ cloudflared not found — skipping the public tunnel.");
	console.log("  On the same Wi-Fi you can already open:", lanUrl());
	console.log("  For access from anywhere, install cloudflared then rerun:");
	console.log("    macOS:   brew install cloudflared");
	console.log("    Windows: winget install --id Cloudflare.cloudflared");
	console.log("    Linux:   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/\n");
}

// 4. Clean shutdown.
function shutdown() {
	for (const child of children) {
		if (child && !child.killed) child.kill("SIGINT");
	}
	process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
server.on("exit", (code) => {
	if (cloudflared && !cloudflared.killed) cloudflared.kill("SIGINT");
	process.exit(code || 0);
});
