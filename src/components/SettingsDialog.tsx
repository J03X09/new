import { X } from "lucide-react";
import { VINTED_DOMAINS } from "@/lib/presets";
import type { Settings } from "@/lib/storage";

interface Props {
	open: boolean;
	onClose: () => void;
	settings: Settings;
	onChange: (settings: Settings) => void;
	domain: string;
	onDomainChange: (domain: string) => void;
	live: boolean;
	onToggleLive: (live: boolean) => void;
}

const INTERVALS = [15, 30, 60, 120];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`relative h-6 w-11 rounded-full transition ${on ? "bg-[#09B1BA]" : "bg-white/15"}`}
			aria-pressed={on}
		>
			<span
				className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
					on ? "left-[22px]" : "left-0.5"
				}`}
			/>
		</button>
	);
}

export function SettingsDialog({
	open,
	onClose,
	settings,
	onChange,
	domain,
	onDomainChange,
	live,
	onToggleLive,
}: Props) {
	if (!open) return null;

	function requestNotify(next: boolean) {
		if (next && "Notification" in window && Notification.permission !== "granted") {
			Notification.requestPermission().then((perm) => {
				onChange({ ...settings, notify: perm === "granted" });
			});
		} else {
			onChange({ ...settings, notify: next });
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
			<div className="w-full max-w-md rounded-t-3xl bg-[#121821] p-5 ring-1 ring-white/10 sm:rounded-3xl">
				<div className="mb-5 flex items-center justify-between">
					<h2 className="text-lg font-semibold">Settings</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-1.5 text-slate-400 hover:bg-white/10"
						aria-label="Close"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="mb-5 flex items-center justify-between">
					<div>
						<div className="text-sm font-medium">Live monitoring</div>
						<div className="text-[11px] text-slate-500">Auto-check for new uploads</div>
					</div>
					<Toggle on={live} onClick={() => onToggleLive(!live)} />
				</div>

				<label className="mb-1.5 block text-xs font-medium text-slate-400">Check every</label>
				<div className="mb-5 grid grid-cols-4 gap-2">
					{INTERVALS.map((sec) => (
						<button
							type="button"
							key={sec}
							onClick={() => onChange({ ...settings, intervalSec: sec })}
							className={`rounded-xl py-2 text-sm font-medium transition ${
								settings.intervalSec === sec
									? "bg-[#09B1BA] text-black"
									: "bg-white/5 text-slate-300 ring-1 ring-white/10"
							}`}
						>
							{sec < 60 ? `${sec}s` : `${sec / 60}m`}
						</button>
					))}
				</div>

				<label className="mb-1.5 block text-xs font-medium text-slate-400">Vinted region</label>
				<select
					value={domain}
					onChange={(e) => onDomainChange(e.target.value)}
					className="mb-5 w-full rounded-xl bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-[#09B1BA]/50"
				>
					{VINTED_DOMAINS.map((d) => (
						<option key={d} value={d}>
							{d}
						</option>
					))}
				</select>

				<div className="mb-4 flex items-center justify-between">
					<div>
						<div className="text-sm font-medium">Browser notifications</div>
						<div className="text-[11px] text-slate-500">Alert me when new items land</div>
					</div>
					<Toggle on={settings.notify} onClick={() => requestNotify(!settings.notify)} />
				</div>

				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm font-medium">Sound</div>
						<div className="text-[11px] text-slate-500">Play a chime on new items</div>
					</div>
					<Toggle on={settings.sound} onClick={() => onChange({ ...settings, sound: !settings.sound })} />
				</div>
			</div>
		</div>
	);
}
