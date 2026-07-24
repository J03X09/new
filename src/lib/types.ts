export interface VintedItem {
	id: string;
	title: string;
	url: string;
	price: number | null;
	totalPrice: number | null;
	currency: string;
	size: string | null;
	condition: string | null;
	brand: string | null;
	photo: string | null;
	favourites: number;
	uploadedAt: number | null;
}

export interface FeedResponse {
	source: "live" | "demo";
	domain: string;
	egress?: "scraper-api" | "proxy" | "direct";
	items: VintedItem[];
	error?: string;
	fetchedAt: number;
}

export interface Monitor {
	id: string;
	name: string;
	emoji: string;
	/** A Vinted search URL or query string that defines exactly what to watch. */
	query: string;
	/** Preset monitors ship with the app; custom ones are user-created. */
	custom?: boolean;
}
