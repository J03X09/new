import type { FeedResponse } from "./types";

export async function fetchFeed(query: string, domain: string): Promise<FeedResponse> {
	const params = new URLSearchParams({ query, domain });
	const res = await fetch(`/api/vinted?${params.toString()}`, {
		headers: { Accept: "application/json" },
	});
	if (!res.ok) throw new Error(`Request failed (${res.status})`);
	return (await res.json()) as FeedResponse;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
	GBP: "£",
	EUR: "€",
	USD: "$",
	PLN: "zł",
};

export function formatPrice(amount: number | null, currency: string): string {
	if (amount == null) return "—";
	const symbol = CURRENCY_SYMBOLS[currency] || "";
	const value = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
	return symbol === "zł" ? `${value} zł` : `${symbol}${value}`;
}

export function timeAgo(unixSeconds: number | null): string {
	if (!unixSeconds) return "";
	const diff = Math.floor(Date.now() / 1000 - unixSeconds);
	if (diff < 60) return "just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
}
