import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// Serves /api/vinted during `vite dev` using the same core the Vercel function
// uses, so the dashboard behaves identically in development and production.
function vintedDevApi() {
	return {
		name: "vinted-dev-api",
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				if (!req.url || !req.url.startsWith("/api/vinted")) return next();
				try {
					const [{ fetchVintedItems }, { demoItems }] = await Promise.all([
						server.ssrLoadModule("/api/_vinted.js"),
						server.ssrLoadModule("/api/_demo.js"),
					]);
					const url = new URL(req.url, "http://localhost");
					const query = url.searchParams.get("query") || "";
					const domain = url.searchParams.get("domain") || "vinted.co.uk";
					res.setHeader("Content-Type", "application/json");
					res.setHeader("Cache-Control", "no-store");
					try {
						const result = await fetchVintedItems({ query, domain });
						res.end(JSON.stringify({ source: "live", ...result, fetchedAt: Date.now() }));
					} catch (err) {
						res.end(
							JSON.stringify({
								source: "demo",
								domain,
								error: err && err.message ? err.message : "fetch failed",
								items: demoItems(query, domain),
								fetchedAt: Date.now(),
							}),
						);
					}
				} catch (e) {
					res.statusCode = 500;
					res.end(JSON.stringify({ error: String(e) }));
				}
			});
		},
	};
}

// https://vitejs.dev/config/
export default defineConfig({
	base: "/",
	plugins: [
		viteReact({ jsxRuntime: "automatic" }),
		svgr(),
		tailwindcss(),
		vintedDevApi(),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	server: {
		host: "0.0.0.0",
		port: 3000,
	},
	build: {
		chunkSizeWarningLimit: 1500,
	},
});
