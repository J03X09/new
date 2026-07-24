// Deterministic demo dataset used only when the live Vinted fetch is blocked.
// Items are tailored loosely to the query so each category still looks distinct.

const CATALOG = {
	phone: [
		["Apple iPhone 13 128GB Midnight", 210, "Very good", "128 GB", "Apple"],
		["Samsung Galaxy S22 Unlocked", 165, "Good", "128 GB", "Samsung"],
		["Google Pixel 7 - boxed", 190, "New without tags", "128 GB", "Google"],
		["iPhone 12 Pro 256GB Graphite", 285, "Very good", "256 GB", "Apple"],
	],
	shoe: [
		["Nike Air Force 1 '07 White", 48, "Very good", "UK 9", "Nike"],
		["adidas Samba OG Black", 62, "New with tags", "UK 8", "adidas"],
		["New Balance 550 Grey", 55, "Good", "UK 10", "New Balance"],
		["Nike Dunk Low Panda", 78, "Very good", "UK 7", "Nike"],
	],
	"ralph lauren": [
		["Ralph Lauren Polo Shirt Navy", 22, "Very good", "M", "Ralph Lauren"],
		["Polo Ralph Lauren Oxford Shirt", 28, "Good", "L", "Ralph Lauren"],
		["Ralph Lauren Quarter Zip Knit", 35, "New without tags", "M", "Ralph Lauren"],
		["RL Bear Sweatshirt", 45, "Very good", "S", "Ralph Lauren"],
	],
	"pull": [
		["Pull & Bear Cargo Trousers", 15, "Very good", "W30", "Pull & Bear"],
		["Pull&Bear Oversized Hoodie", 18, "Good", "M", "Pull & Bear"],
		["Pull & Bear Denim Jacket", 24, "New with tags", "L", "Pull & Bear"],
		["Pull&Bear Graphic Tee", 9, "Very good", "S", "Pull & Bear"],
	],
	default: [
		["Vintage Carhartt Beanie", 12, "Good", "One size", "Carhartt"],
		["The North Face Puffer Jacket", 55, "Very good", "M", "The North Face"],
		["Levi's 501 Straight Jeans", 30, "Good", "W32 L32", "Levi's"],
		["Stone Island Overshirt", 120, "Very good", "L", "Stone Island"],
	],
};

const SVG_BG = ["1f2430", "2a2340", "223027", "302326", "26303a"];

function placeholder(label, i) {
	const bg = SVG_BG[i % SVG_BG.length];
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'>
<rect width='100%' height='100%' fill='#${bg}'/>
<text x='50%' y='50%' fill='#7c8aa5' font-family='sans-serif' font-size='22' text-anchor='middle'>${label}</text>
</svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Maps a demo catalog key to the search tokens that should select it.
const KEY_ALIASES = {
	phone: ["phone", "iphone", "samsung", "pixel", "galaxy"],
	shoe: ["shoe", "trainer", "sneaker", "nike", "adidas", "air force", "samba"],
	"ralph lauren": ["ralph", "polo"],
	pull: ["pull", "bear"],
};

export function demoItems(query = "", domain = "vinted.co.uk") {
	let q = String(query);
	try {
		q = decodeURIComponent(q);
	} catch {
		/* leave as-is if malformed */
	}
	q = q.replace(/\+/g, " ").toLowerCase();

	let key = "default";
	for (const [k, aliases] of Object.entries(KEY_ALIASES)) {
		if (aliases.some((a) => q.includes(a))) {
			key = k;
			break;
		}
	}
	const rows = CATALOG[key];
	const now = Math.floor(Date.now() / 1000);
	return rows.map(([title, price, condition, size, brand], i) => ({
		id: `demo-${key}-${i}`,
		title,
		url: `https://www.${domain}/`,
		price,
		totalPrice: price,
		currency: "GBP",
		size,
		condition,
		brand,
		photo: placeholder(brand, i),
		favourites: (i * 7) % 30,
		uploadedAt: now - i * 90,
	}));
}
