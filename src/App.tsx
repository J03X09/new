import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, SearchX } from "lucide-react";
import { AddMonitorDialog } from "@/components/AddMonitorDialog";
import { CategoryBar } from "@/components/CategoryBar";
import { Header } from "@/components/Header";
import { ItemCard } from "@/components/ItemCard";
import { SettingsDialog } from "@/components/SettingsDialog";
import { fetchFeed } from "@/lib/api";
import {
	type Settings,
	loadDomain,
	loadMonitors,
	loadSettings,
	saveDomain,
	saveMonitors,
	saveSettings,
} from "@/lib/storage";
import type { Monitor, VintedItem } from "@/lib/types";

interface FeedState {
	items: VintedItem[];
	source: "live" | "demo" | null;
	error?: string;
	loading: boolean;
	lastUpdated: number | null;
}

const EMPTY_FEED: FeedState = {
	items: [],
	source: null,
	loading: true,
	lastUpdated: null,
};

// A short chime synthesised with the Web Audio API — no asset needed.
function playChime() {
	try {
		const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.type = "sine";
		osc.frequency.setValueAtTime(880, ctx.currentTime);
		osc.frequency.setValueAtTime(1180, ctx.currentTime + 0.1);
		gain.gain.setValueAtTime(0.001, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
		osc.start();
		osc.stop(ctx.currentTime + 0.32);
	} catch {
		/* ignore autoplay restrictions */
	}
}

export default function App() {
	const [monitors, setMonitors] = useState<Monitor[]>(() => loadMonitors());
	const [activeId, setActiveId] = useState<string>(() => loadMonitors()[0]?.id ?? "");
	const [domain, setDomain] = useState<string>(() => loadDomain());
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const [live, setLive] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	// Per-monitor feed cache and the set of item IDs we've already seen (so we can
	// flag genuinely new uploads and count them per category).
	const [feeds, setFeeds] = useState<Record<string, FeedState>>({});
	const seenRef = useRef<Record<string, Set<string>>>({});
	const [newCounts, setNewCounts] = useState<Record<string, number>>({});
	const [newIds, setNewIds] = useState<Record<string, Set<string>>>({});
	const firstLoadRef = useRef<Record<string, boolean>>({});

	const activeMonitor = useMemo(
		() => monitors.find((m) => m.id === activeId) ?? monitors[0],
		[monitors, activeId],
	);
	const activeFeed = feeds[activeId] ?? EMPTY_FEED;

	const runFetch = useCallback(
		async (monitor: Monitor) => {
			if (!monitor) return;
			setFeeds((prev) => ({
				...prev,
				[monitor.id]: { ...(prev[monitor.id] ?? EMPTY_FEED), loading: true },
			}));
			try {
				const res = await fetchFeed(monitor.query, domain);
				const seen = (seenRef.current[monitor.id] ||= new Set());
				const isFirst = firstLoadRef.current[monitor.id] !== true;

				const freshIds = new Set<string>();
				for (const item of res.items) {
					if (!seen.has(item.id)) {
						if (!isFirst) freshIds.add(item.id);
						seen.add(item.id);
					}
				}
				firstLoadRef.current[monitor.id] = true;

				setFeeds((prev) => ({
					...prev,
					[monitor.id]: {
						items: res.items,
						source: res.source,
						error: res.error,
						loading: false,
						lastUpdated: res.fetchedAt,
					},
				}));

				if (freshIds.size > 0) {
					setNewIds((prev) => ({ ...prev, [monitor.id]: freshIds }));
					setNewCounts((prev) => ({
						...prev,
						[monitor.id]: (prev[monitor.id] || 0) + freshIds.size,
					}));
					// Notify only for the category the user isn't actively looking at,
					// or regardless if enabled — keep it simple and useful.
					if (settings.sound) playChime();
					if (settings.notify && "Notification" in window && Notification.permission === "granted") {
						const first = res.items.find((i) => freshIds.has(i.id));
						new Notification(`${freshIds.size} new on ${monitor.name}`, {
							body: first ? `${first.title} · ${first.condition ?? ""}` : "New uploads",
							icon: first?.photo ?? undefined,
						});
					}
				}
			} catch (err) {
				setFeeds((prev) => ({
					...prev,
					[monitor.id]: {
						...(prev[monitor.id] ?? EMPTY_FEED),
						loading: false,
						source: prev[monitor.id]?.source ?? null,
						error: err instanceof Error ? err.message : "Failed to load",
					},
				}));
			}
		},
		[domain, settings.sound, settings.notify],
	);

	// Fetch the active monitor whenever it changes or the region changes.
	useEffect(() => {
		if (activeMonitor) runFetch(activeMonitor);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeId, domain]);

	// Polling loop for the active monitor.
	useEffect(() => {
		if (!live || !activeMonitor) return;
		const id = window.setInterval(
			() => runFetch(activeMonitor),
			Math.max(10, settings.intervalSec) * 1000,
		);
		return () => window.clearInterval(id);
	}, [live, activeMonitor, settings.intervalSec, runFetch]);

	// Persist config changes.
	useEffect(() => saveMonitors(monitors), [monitors]);
	useEffect(() => saveDomain(domain), [domain]);
	useEffect(() => saveSettings(settings), [settings]);

	const handleSelect = (id: string) => {
		setActiveId(id);
		// Clear the "new" badge/count for the category once viewed.
		setNewCounts((prev) => ({ ...prev, [id]: 0 }));
	};

	const handleAdd = (m: Monitor) => {
		setMonitors((prev) => [...prev, m]);
		setActiveId(m.id);
	};

	const handleRemove = (id: string) => {
		setMonitors((prev) => {
			const next = prev.filter((m) => m.id !== id);
			if (activeId === id && next[0]) setActiveId(next[0].id);
			return next;
		});
	};

	const manualRefresh = async () => {
		if (!activeMonitor) return;
		setRefreshing(true);
		await runFetch(activeMonitor);
		setRefreshing(false);
	};

	const activeNewIds = newIds[activeId] ?? new Set<string>();

	return (
		<div className="mx-auto flex min-h-full max-w-3xl flex-col">
			<Header
				live={live}
				source={activeFeed.source}
				refreshing={refreshing || activeFeed.loading}
				lastUpdated={activeFeed.lastUpdated}
				onRefresh={manualRefresh}
				onOpenSettings={() => setShowSettings(true)}
			/>

			<CategoryBar
				monitors={monitors}
				activeId={activeId}
				counts={newCounts}
				onSelect={handleSelect}
				onAdd={() => setShowAdd(true)}
				onRemove={handleRemove}
			/>

			{activeFeed.source === "demo" && (
				<div className="mx-3 mb-1 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-200 ring-1 ring-amber-500/20">
					<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
					<span>
						Showing demo items — Vinted blocked the live request
						{activeFeed.error ? ` (${activeFeed.error})` : ""}. Live data works from a residential
						network / proxy. The dashboard itself is fully functional.
					</span>
				</div>
			)}

			<main className="flex-1 px-3 pb-10">
				{activeFeed.loading && activeFeed.items.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
						<Loader2 className="h-7 w-7 animate-spin" />
						<span className="text-sm">Loading {activeMonitor?.name}…</span>
					</div>
				) : activeFeed.items.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
						<SearchX className="h-8 w-8" />
						<span className="text-sm">No items found for this search.</span>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
						{activeFeed.items.map((item) => (
							<div key={item.id} className={activeNewIds.has(item.id) ? "animate-pop-in" : ""}>
								<ItemCard item={item} isNew={activeNewIds.has(item.id)} />
							</div>
						))}
					</div>
				)}
			</main>

			<AddMonitorDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
			<SettingsDialog
				open={showSettings}
				onClose={() => setShowSettings(false)}
				settings={settings}
				onChange={setSettings}
				domain={domain}
				onDomainChange={setDomain}
				live={live}
				onToggleLive={setLive}
			/>
		</div>
	);
}
