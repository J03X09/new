import { Plus, X } from "lucide-react";
import type { Monitor } from "@/lib/types";

interface Props {
	monitors: Monitor[];
	activeId: string;
	counts: Record<string, number>;
	onSelect: (id: string) => void;
	onAdd: () => void;
	onRemove: (id: string) => void;
}

export function CategoryBar({ monitors, activeId, counts, onSelect, onAdd, onRemove }: Props) {
	return (
		<div className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3">
			{monitors.map((m) => {
				const active = m.id === activeId;
				const count = counts[m.id] || 0;
				return (
					<button
						type="button"
						key={m.id}
						onClick={() => onSelect(m.id)}
						className={`group relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
							active
								? "bg-[#09B1BA] text-black"
								: "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
						}`}
					>
						<span>{m.emoji}</span>
						<span>{m.name}</span>
						{count > 0 && (
							<span
								className={`rounded-full px-1.5 text-[10px] font-bold ${
									active ? "bg-black/20 text-black" : "bg-[#09B1BA]/20 text-[#4fd8df]"
								}`}
							>
								{count}
							</span>
						)}
						{m.custom && active && (
							<span
								role="button"
								tabIndex={0}
								onClick={(e) => {
									e.stopPropagation();
									onRemove(m.id);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.stopPropagation();
										onRemove(m.id);
									}
								}}
								className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/20"
								aria-label={`Remove ${m.name}`}
							>
								<X className="h-3 w-3" />
							</span>
						)}
					</button>
				);
			})}

			<button
				type="button"
				onClick={onAdd}
				className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
			>
				<Plus className="h-4 w-4" />
				Add
			</button>
		</div>
	);
}
