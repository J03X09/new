import { useState } from "react";
import { formatPrice, timeAgo } from "@/lib/api";
import type { VintedItem } from "@/lib/types";

interface Props {
	item: VintedItem;
	isNew: boolean;
}

// Colour-codes the condition badge so state is scannable at a glance.
function conditionTone(condition: string | null): string {
	const c = (condition || "").toLowerCase();
	if (c.includes("new with tag")) return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
	if (c.includes("new without")) return "bg-teal-500/15 text-teal-300 ring-teal-500/30";
	if (c.includes("very good")) return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
	if (c.includes("good")) return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
	if (c.includes("satisfactory")) return "bg-orange-500/15 text-orange-300 ring-orange-500/30";
	return "bg-white/10 text-slate-300 ring-white/15";
}

export function ItemCard({ item, isNew }: Props) {
	const [loaded, setLoaded] = useState(false);
	const ago = timeAgo(item.uploadedAt);

	return (
		<a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			className={`group relative flex flex-col overflow-hidden rounded-2xl bg-[#121821] ring-1 ring-white/5 transition active:scale-[0.98] ${
				isNew ? "pulse-new ring-[#09B1BA]/40" : ""
			}`}
		>
			<div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0e131a]">
				{item.photo ? (
					<img
						src={item.photo}
						alt={item.title}
						loading="lazy"
						onLoad={() => setLoaded(true)}
						className={`h-full w-full object-cover transition-opacity duration-300 ${
							loaded ? "opacity-100" : "opacity-0"
						}`}
					/>
				) : (
					<div className="flex h-full items-center justify-center text-slate-600 text-sm">
						No photo
					</div>
				)}

				{isNew && (
					<span className="absolute left-2 top-2 rounded-full bg-[#09B1BA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black shadow">
						New
					</span>
				)}

				{/* Price sits on the image, always visible. */}
				<span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-sm font-bold text-white backdrop-blur">
					{formatPrice(item.price, item.currency)}
				</span>
			</div>

			<div className="flex flex-1 flex-col gap-1.5 p-2.5">
				<div className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-100">
					{item.title}
				</div>

				<div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
					{item.condition && (
						<span
							className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${conditionTone(
								item.condition,
							)}`}
						>
							{item.condition}
						</span>
					)}
					{item.size && (
						<span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200 ring-1 ring-white/10">
							{item.size}
						</span>
					)}
				</div>

				<div className="flex items-center justify-between text-[10px] text-slate-500">
					<span className="truncate">{item.brand || ""}</span>
					{ago && <span className="shrink-0">{ago}</span>}
				</div>
			</div>
		</a>
	);
}
