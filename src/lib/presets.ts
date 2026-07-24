import type { Monitor } from "./types";

// Preset monitors. Each `query` is a Vinted search — using `search_text` keeps
// them valid on every Vinted domain without hardcoding brittle catalog IDs.
// Users can refine any of these, or add their own by pasting a Vinted URL with
// real category / brand / size / condition filters applied.
export const PRESET_MONITORS: Monitor[] = [
	{
		id: "phones",
		name: "Phones",
		emoji: "📱",
		query: "?search_text=iphone&order=newest_first",
	},
	{
		id: "shoes",
		name: "Shoes",
		emoji: "👟",
		query: "?search_text=trainers&order=newest_first",
	},
	{
		id: "ralph-lauren",
		name: "Ralph Lauren",
		emoji: "🐴",
		query: "?search_text=ralph%20lauren&order=newest_first",
	},
	{
		id: "pull-and-bear",
		name: "Pull & Bear",
		emoji: "🐻",
		query: "?search_text=pull%20and%20bear&order=newest_first",
	},
];

export const DEFAULT_DOMAIN = "vinted.co.uk";

export const VINTED_DOMAINS = [
	"vinted.co.uk",
	"vinted.com",
	"vinted.ie",
	"vinted.fr",
	"vinted.de",
	"vinted.it",
	"vinted.es",
	"vinted.nl",
	"vinted.be",
	"vinted.pl",
];
