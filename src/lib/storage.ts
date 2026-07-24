import { PRESET_MONITORS, DEFAULT_DOMAIN } from "./presets";
import type { Monitor } from "./types";

const MONITORS_KEY = "vm.monitors.v1";
const DOMAIN_KEY = "vm.domain.v1";
const SETTINGS_KEY = "vm.settings.v1";

export interface Settings {
	intervalSec: number;
	notify: boolean;
	sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	intervalSec: 30,
	notify: false,
	sound: false,
};

function read<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* ignore quota / private mode */
	}
}

export function loadMonitors(): Monitor[] {
	const stored = read<Monitor[] | null>(MONITORS_KEY, null);
	if (!stored || stored.length === 0) return [...PRESET_MONITORS];
	return stored;
}

export function saveMonitors(monitors: Monitor[]) {
	write(MONITORS_KEY, monitors);
}

export function loadDomain(): string {
	return read<string>(DOMAIN_KEY, DEFAULT_DOMAIN);
}

export function saveDomain(domain: string) {
	write(DOMAIN_KEY, domain);
}

export function loadSettings(): Settings {
	return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: Settings) {
	write(SETTINGS_KEY, settings);
}
