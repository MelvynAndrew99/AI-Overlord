/**
 * Persistence: a minimal per-player save, written to RUN's appStorage when
 * the host is present and mirrored to localStorage always (so plain-browser
 * dev keeps progress too, and reads never wait on the host).
 *
 * Posture: loads happen once at boot (main.tsx step 2) into memory; writes
 * are write-through and fire-and-forget. Nothing here ever throws.
 *
 * ADAPT: extend SaveData (and parse()) with your game's fields — wallet,
 * unlocks, settings, stats. The genre templates in this repo show fuller
 * shapes (cosmetics/upgrades, audio settings, an ads-cap slice).
 */
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { sdkReady } from '../sdk/runSdk.ts';

// ADAPT: your game's save key — bump the suffix if the shape ever changes.
const SAVE_KEY = 'ai-overlord:save:v1';

export interface SaveData {
    /** ADAPT: demo field — best bounce count. Replace with your game's fields. */
    best: number;
}

const DEFAULTS: SaveData = { best: 0 };

let data: SaveData = structuredClone(DEFAULTS);

/** Validate a raw stored blob. Unknown/corrupt input falls back to defaults. */
function parse(raw: string | null): SaveData | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<SaveData>;
        return { best: Math.max(0, Math.floor(Number(parsed.best) || 0)) };
    } catch {
        return null;
    }
}

/** Load the save into memory. Call once at boot, after initSdk(). */
export async function loadSave(): Promise<SaveData> {
    let loaded: SaveData | null = null;
    if (sdkReady()) {
        try {
            loaded = parse(await RundotGameAPI.appStorage.getItem(SAVE_KEY));
        } catch {
            /* host storage unavailable — fall through to localStorage */
        }
    }
    if (!loaded) {
        try { loaded = parse(localStorage.getItem(SAVE_KEY)); } catch { /* blocked storage */ }
    }
    data = loaded ?? structuredClone(DEFAULTS);
    return data;
}

export function getSave(): SaveData {
    return data;
}

/** Write-through persist of the in-memory save. Fire-and-forget, never throws. */
export function flushSave(): void {
    const raw = JSON.stringify(data);
    try { localStorage.setItem(SAVE_KEY, raw); } catch { /* blocked storage */ }
    if (sdkReady()) {
        try {
            RundotGameAPI.appStorage.setItem(SAVE_KEY, raw).catch(() => { /* offline */ });
        } catch { /* non-fatal */ }
    }
}

/**
 * ADAPT: demo mutation — fold a finished session's score into the save.
 * Follow this shape for your own mutations: update `data`, call flushSave(),
 * return what the caller needs for store patching.
 */
export function recordBest(score: number): boolean {
    if (score <= data.best) return false;
    data = { ...data, best: score };
    flushSave();
    return true;
}
