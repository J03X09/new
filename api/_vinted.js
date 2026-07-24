// Core Vinted catalog client.
//
// Vinted has no public API. Working monitors call the site's *internal* catalog
// endpoint (`/api/v2/catalog/items`). That endpoint requires a valid anonymous
// session cookie, which we obtain by first loading the Vinted homepage.
//
// The hard part is that Vinted's DataDome bot protection blocks datacentre IPs
// (Vercel's defaults, CI, most clouds). To fetch REAL items the request must
// leave from an egress Vinted trusts. This module supports three egress modes,
// selected by environment variables at deploy time:
//
//   1. Scraping API   — set SCRAPER_API_KEY (ScraperAPI-compatible). The service
//                        fetches from residential IPs and solves DataDome. Easiest
//                        "just works after signup" path. Optional SCRAPER_API_URL
//                        overrides the endpoint for other providers.
//   2. Residential proxy — set VINTED_PROXY_URL (http://user:pass@host:port). All
//                        outbound requests are routed through it via undici.
//   3. Direct         — no config. Only returns real data when the server itself
//                        runs on a residential IP; otherwise Vinted 403s and the
//                        API layer falls back to demo data.

import { ProxyAgent } from "undici";

const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
	"Accept-Language": "en-GB,en;q=0.9",
	"sec-ch-ua": '"Chromium";v="126", "Not.A/Brand";v="24", "Google Chrome";v="126"',
	"sec-ch-ua-mobile": "?0",
	"sec-ch-ua-platform": '"Windows"',
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"Sec-Fetch-Site": "same-origin",
};

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "";
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "https://api.scraperapi.com/";
const VINTED_PROXY_URL = process.env.VINTED_PROXY_URL || "";

// Reuse a single dispatcher for the residential-proxy path.
let proxyDispatcher = null;
if (VINTED_PROXY_URL) {
	try {
		proxyDispatcher = new ProxyAgent(VINTED_PROXY_URL);
	} catch {
		proxyDispatcher = null;
	}
}

export function egressMode() {
	if (SCRAPER_API_KEY) return "scraper-api";
	if (proxyDispatcher) return "proxy";
	return "direct";
}

// Single choke point for all outbound requests to Vinted. Applies whichever
// trusted-egress strategy is configured. `wantJson` marks catalog API calls that
// the scraping service can render directly.
async function egressFetch(targetUrl, { headers = {}, wantJson = false } = {}) {
	if (SCRAPER_API_KEY) {
		const params = new URLSearchParams({
			api_key: SCRAPER_API_KEY,
			url: targetUrl,
			// Ask for a UK residential IP so results match the .co.uk catalogue.
			country_code: "gb",
			keep_headers: "true",
		});
		return fetch(`${SCRAPER_API_URL}?${params.toString()}`, {
			headers: { ...headers, "X-Return-Format": wantJson ? "json" : "raw" },
		});
	}
	if (proxyDispatcher) {
		return fetch(targetUrl, { headers, dispatcher: proxyDispatcher });
	}
	return fetch(targetUrl, { headers });
}

// Vinted operates one site per country. We only allow known hosts so a pasted
// URL can never redirect our server-side fetch to an arbitrary origin.
const ALLOWED_DOMAINS = new Set([
	"vinted.co.uk",
	"vinted.com",
	"vinted.fr",
	"vinted.de",
	"vinted.it",
	"vinted.es",
	"vinted.nl",
	"vinted.be",
	"vinted.pl",
	"vinted.lt",
	"vinted.cz",
	"vinted.pt",
	"vinted.at",
	"vinted.lu",
	"vinted.se",
	"vinted.ie",
]);

// Params we are willing to forward to the catalog endpoint. Everything else in a
// pasted URL is dropped.
const FORWARD_PARAMS = [
	"search_text",
	"catalog_ids",
	"brand_ids",
	"size_ids",
	"status_ids",
	"color_ids",
	"material_ids",
	"price_from",
	"price_to",
	"currency",
	"order",
	"country_ids",
];

// The Vinted website uses array-style query keys (e.g. `brand_ids[]`,
// `catalog[]`, `status[]`) while the API expects flat comma-joined keys. This
// maps a browser URL's params onto the API's params.
const WEB_TO_API_KEY = {
	"catalog[]": "catalog_ids",
	catalog_ids: "catalog_ids",
	"catalog_ids[]": "catalog_ids",
	"brand_ids[]": "brand_ids",
	brand_ids: "brand_ids",
	"brand[]": "brand_ids",
	"size_ids[]": "size_ids",
	size_ids: "size_ids",
	"size_id[]": "size_ids",
	"status_ids[]": "status_ids",
	status_ids: "status_ids",
	"status[]": "status_ids",
	"color_ids[]": "color_ids",
	color_ids: "color_ids",
	"color_id[]": "color_ids",
	"material_ids[]": "material_ids",
	material_ids: "material_ids",
	search_text: "search_text",
	price_from: "price_from",
	price_to: "price_to",
	currency: "currency",
	order: "order",
	"country_ids[]": "country_ids",
	country_ids: "country_ids",
};

function normaliseDomain(domain) {
	if (!domain) return "vinted.co.uk";
	let d = String(domain).trim().toLowerCase();
	d = d.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
	return ALLOWED_DOMAINS.has(d) ? d : "vinted.co.uk";
}

// Accepts either a full Vinted URL or a raw query string and returns
// { domain, params } where params only contains whitelisted API keys.
export function parseVintedQuery(input, fallbackDomain = "vinted.co.uk") {
	const params = {};
	let domain = normaliseDomain(fallbackDomain);
	if (!input) return { domain, params };

	let search = "";
	const raw = String(input).trim();
	if (raw.startsWith("http")) {
		try {
			const u = new URL(raw);
			domain = normaliseDomain(u.hostname);
			search = u.search;
		} catch {
			search = raw;
		}
	} else if (raw.includes("=")) {
		search = raw.startsWith("?") ? raw : `?${raw}`;
	}

	const sp = new URLSearchParams(search);
	const collected = {};
	for (const [key, value] of sp.entries()) {
		if (!value) continue;
		const apiKey = WEB_TO_API_KEY[key];
		if (!apiKey) continue;
		(collected[apiKey] ||= []).push(...value.split(",").filter(Boolean));
	}
	for (const [key, values] of Object.entries(collected)) {
		if (!FORWARD_PARAMS.includes(key)) continue;
		// single-value params keep the last one; id lists are comma joined
		params[key] = ["search_text", "price_from", "price_to", "currency", "order"].includes(key)
			? values[values.length - 1]
			: [...new Set(values)].join(",");
	}
	return { domain, params };
}

// Fetch anonymous session cookies from the homepage.
async function getSessionCookies(domain) {
	const res = await egressFetch(`https://www.${domain}/`, {
		headers: {
			...BROWSER_HEADERS,
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Sec-Fetch-Dest": "document",
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "none",
		},
	});
	const jar = [];
	// Node 18.14+/20 exposes getSetCookie(); fall back to the combined header.
	const setCookies =
		typeof res.headers.getSetCookie === "function"
			? res.headers.getSetCookie()
			: (res.headers.get("set-cookie") || "").split(/,(?=[^;]+?=)/);
	for (const c of setCookies) {
		const pair = String(c).split(";")[0].trim();
		if (pair.includes("=")) jar.push(pair);
	}
	return jar.join("; ");
}

function toNumber(v) {
	if (v == null) return null;
	const n = typeof v === "object" ? Number(v.amount ?? v) : Number(v);
	return Number.isFinite(n) ? n : null;
}

// Map a raw catalog item onto the dashboard's item shape.
function normaliseItem(item, domain) {
	const photo = item.photo || {};
	const priceObj = item.price || {};
	const totalObj = item.total_item_price || {};
	let url = item.url || "";
	if (url && !url.startsWith("http")) url = `https://www.${domain}${url}`;

	return {
		id: String(item.id),
		title: item.title || "Untitled",
		url,
		price: toNumber(priceObj.amount ?? priceObj),
		totalPrice: toNumber(totalObj.amount ?? totalObj),
		currency: priceObj.currency_code || totalObj.currency_code || "GBP",
		size: item.size_title || null,
		condition: item.status || null,
		brand: item.brand_title || null,
		photo: photo.url || photo.full_size_url || null,
		favourites: toNumber(item.favourite_count) ?? 0,
		// Upload recency proxy used by every Vinted monitor.
		uploadedAt:
			(photo.high_resolution && photo.high_resolution.timestamp
				? Number(photo.high_resolution.timestamp)
				: null) || null,
	};
}

export async function fetchVintedItems({ query, domain, perPage = 48 } = {}) {
	const parsed = parseVintedQuery(query, domain);
	const host = parsed.domain;

	const apiParams = new URLSearchParams();
	for (const [k, v] of Object.entries(parsed.params)) apiParams.set(k, v);
	if (!apiParams.has("order")) apiParams.set("order", "newest_first");
	apiParams.set("per_page", String(Math.min(Math.max(perPage, 1), 96)));
	apiParams.set("page", "1");

	// The scraping-API path handles cookies/DataDome itself, so only fetch a
	// session cookie when we're talking to Vinted directly or via a raw proxy.
	const cookie = SCRAPER_API_KEY ? "" : await getSessionCookies(host);
	const apiUrl = `https://www.${host}/api/v2/catalog/items?${apiParams.toString()}`;

	const res = await egressFetch(apiUrl, {
		wantJson: true,
		headers: {
			...BROWSER_HEADERS,
			Accept: "application/json, text/plain, */*",
			Referer: `https://www.${host}/catalog?${apiParams.toString()}`,
			"X-Requested-With": "XMLHttpRequest",
			...(cookie ? { Cookie: cookie } : {}),
		},
	});

	if (!res.ok) {
		const err = new Error(`Vinted responded ${res.status} (egress: ${egressMode()})`);
		err.status = res.status;
		throw err;
	}
	const data = await res.json();
	const items = Array.isArray(data.items) ? data.items : [];
	return {
		domain: host,
		egress: egressMode(),
		params: parsed.params,
		items: items.map((i) => normaliseItem(i, host)),
	};
}
