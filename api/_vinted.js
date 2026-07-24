// Core Vinted catalog client (no external dependencies — Node 18+ global fetch).
//
// Vinted has no public API. Working monitors call the site's *internal* catalog
// endpoint (`/api/v2/catalog/items`). That endpoint requires a valid anonymous
// session cookie, which we obtain by first loading the Vinted homepage. This
// module encapsulates that flow and normalises the response into a stable shape
// the dashboard can render.

const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
	"Accept-Language": "en-GB,en;q=0.9",
};

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
	const res = await fetch(`https://www.${domain}/`, {
		headers: { ...BROWSER_HEADERS, Accept: "text/html" },
		redirect: "follow",
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

	const cookie = await getSessionCookies(host);
	const apiUrl = `https://www.${host}/api/v2/catalog/items?${apiParams.toString()}`;

	const res = await fetch(apiUrl, {
		headers: {
			...BROWSER_HEADERS,
			Accept: "application/json, text/plain, */*",
			Referer: `https://www.${host}/catalog?${apiParams.toString()}`,
			"X-Requested-With": "XMLHttpRequest",
			...(cookie ? { Cookie: cookie } : {}),
		},
	});

	if (!res.ok) {
		const err = new Error(`Vinted responded ${res.status}`);
		err.status = res.status;
		throw err;
	}
	const data = await res.json();
	const items = Array.isArray(data.items) ? data.items : [];
	return {
		domain: host,
		params: parsed.params,
		items: items.map((i) => normaliseItem(i, host)),
	};
}
