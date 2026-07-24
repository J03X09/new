// Vercel serverless function: GET /api/vinted?query=<vinted url or query>&domain=<host>
//
// Returns { source: 'live' | 'demo', items, error?, domain }.
// When Vinted blocks the request (anti-bot on datacentre IPs) we degrade to a
// small demo dataset so the dashboard remains reviewable rather than empty.

import { fetchVintedItems } from "./_vinted.js";
import { demoItems } from "./_demo.js";

export default async function handler(req, res) {
	res.setHeader("Cache-Control", "no-store");
	const url = new URL(req.url, `http://${req.headers.host}`);
	const query = url.searchParams.get("query") || "";
	const domain = url.searchParams.get("domain") || "vinted.co.uk";
	const perPage = Number(url.searchParams.get("per_page") || 48);

	try {
		const result = await fetchVintedItems({ query, domain, perPage });
		res.status(200).json({ source: "live", ...result, fetchedAt: Date.now() });
	} catch (err) {
		// Fall back to demo data, tagged so the UI can show a clear banner.
		res.status(200).json({
			source: "demo",
			domain,
			error: err && err.message ? err.message : "fetch failed",
			items: demoItems(query, domain),
			fetchedAt: Date.now(),
		});
	}
}
