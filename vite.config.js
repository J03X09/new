import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
	base: "/",
	plugins: [
		TanStackRouterVite({
			autoCodeSplitting: false,
		}),
		viteReact({
			jsxRuntime: "automatic",
		}),
		svgr(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			// Redirect the ORM client to use localStorage-based implementation for standalone deployment
			"./client": resolve(__dirname, "./src/lib/data-client.ts"),
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
