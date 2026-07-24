import { useState } from "react";
import { X } from "lucide-react";
import type { Monitor } from "@/lib/types";

interface Props {
	open: boolean;
	onClose: () => void;
	onAdd: (monitor: Monitor) => void;
}

const EMOJIS = ["🛍️", "👕", "👟", "📱", "👜", "⌚", "🧥", "🐴", "🐻", "🔥", "💎", "🎽"];

export function AddMonitorDialog({ open, onClose, onAdd }: Props) {
	const [name, setName] = useState("");
	const [query, setQuery] = useState("");
	const [emoji, setEmoji] = useState("🛍️");

	if (!open) return null;

	const canSave = name.trim().length > 0 && query.trim().length > 0;

	function save() {
		if (!canSave) return;
		onAdd({
			id: `custom-${Date.now()}`,
			name: name.trim(),
			emoji,
			query: query.trim(),
			custom: true,
		});
		setName("");
		setQuery("");
		setEmoji("🛍️");
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
			<div className="w-full max-w-md rounded-t-3xl bg-[#121821] p-5 ring-1 ring-white/10 sm:rounded-3xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold">Add a monitor</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-1.5 text-slate-400 hover:bg-white/10"
						aria-label="Close"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<label className="mb-1 block text-xs font-medium text-slate-400">Name</label>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Nike Trainers UK 9"
					className="mb-4 w-full rounded-xl bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-[#09B1BA]/50"
				/>

				<label className="mb-1 block text-xs font-medium text-slate-400">Icon</label>
				<div className="mb-4 flex flex-wrap gap-1.5">
					{EMOJIS.map((e) => (
						<button
							type="button"
							key={e}
							onClick={() => setEmoji(e)}
							className={`h-9 w-9 rounded-lg text-lg transition ${
								emoji === e ? "bg-[#09B1BA]/20 ring-1 ring-[#09B1BA]/50" : "bg-white/5 hover:bg-white/10"
							}`}
						>
							{e}
						</button>
					))}
				</div>

				<label className="mb-1 block text-xs font-medium text-slate-400">
					Vinted search URL or query
				</label>
				<textarea
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					rows={3}
					placeholder="Paste a Vinted URL, e.g. https://www.vinted.co.uk/catalog?search_text=ralph+lauren&brand_ids[]=88"
					className="mb-2 w-full resize-none rounded-xl bg-black/30 px-3 py-2.5 text-xs text-slate-100 outline-none ring-1 ring-white/10 focus:ring-[#09B1BA]/50"
				/>
				<p className="mb-4 text-[11px] leading-relaxed text-slate-500">
					Tip: on Vinted, apply the filters you want (category, brand, size, condition),
					then copy the page URL and paste it here. The monitor watches exactly that search.
				</p>

				<button
					type="button"
					onClick={save}
					disabled={!canSave}
					className="w-full rounded-xl bg-[#09B1BA] py-3 text-sm font-semibold text-black transition disabled:opacity-40"
				>
					Add monitor
				</button>
			</div>
		</div>
	);
}
