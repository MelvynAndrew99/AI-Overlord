import { useSyncExternalStore } from 'react';
import type { Lane } from '../game/trafficModel.ts';
export interface AppState {
    phase: 'loading' | 'menu' | 'playing';
    loadProgress: number;
    paused: boolean;
    score: number;
    best: number;
    tokens: number;
    combo: number;
    crashes: number;
    cleared: number;
    remaining: number;
    rule: 'normal' | 'rotate';
    message: string;
    closedLane: Lane | null;
    finished: boolean;
    queues: Record<Lane, number>;
}
const listeners = new Set<() => void>();
let state: AppState = {
    phase: 'loading', loadProgress: 0, paused: false, score: 0, best: 0,
    tokens: 0, combo: 0, crashes: 0, cleared: 0, remaining: 120,
    rule: 'normal', message: '', closedLane: null, finished: false,
    queues: {north: 0, east: 0, south: 0, west: 0},
};
export const store = {
    get: (): AppState => state,
    patch(partial: Partial<AppState>): void {
        state = { ...state, ...partial };
        for (const l of listeners) l();
    },
    subscribe(l: () => void): () => void { listeners.add(l); return () => listeners.delete(l); },
};
export function useStore<T = AppState>(selector: (s: AppState) => T = (s) => s as unknown as T): T {
    return useSyncExternalStore(store.subscribe, () => selector(state));
}
