import { RefreshCw, Settings2 } from "lucide-react";

interface Props {
	live: boolean;
	source: "live" | "demo" | null;
	refreshing: boolean;
	lastUpdated: number | null;
	onRefresh: () => void;
	onOpenSettings: () => void;
}

export function Header({ live, source, refreshing, lastUpdated, onRefresh, onOpenSettings }: Props) {
	const updatedText = lastUpdated
		? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
		: "—";

	return (
		<header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0f14]/85 backdrop-blur">
			<div className="flex items-center justify-between px-4 py-3">
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#09B1BA] text-black font-black">
						V
					</div>
					<div className="leading-tight">
						<h1 className="text-[15px] font-semibold">Vinted Monitor</h1>
						<div className="flex items-center gap-1.5 text-[11px] text-slate-400">
							<span
								className={`h-1.5 w-1.5 rounded-full ${
									live ? "bg-emerald-400" : "bg-slate-500"
								}`}
							/>
							{source === "demo" ? "Demo data" : live ? `Live · ${updatedText}` : "Paused"}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={onRefresh}
						className="rounded-full p-2 text-slate-300 hover:bg-white/10"
						aria-label="Refresh now"
					>
						<RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
					</button>
					<button
						type="button"
						onClick={onOpenSettings}
						className="rounded-full p-2 text-slate-300 hover:bg-white/10"
						aria-label="Settings"
					>
						<Settings2 className="h-5 w-5" />
					</button>
				</div>
			</div>
		</header>
	);
}
