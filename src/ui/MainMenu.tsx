/**
 * ADAPT: placeholder main menu — replace with the game's real menu (and wire
 * daily rewards / shop / stats entry points here if those systems are added).
 */
import { store, useStore } from '../state/store.ts';

export default function MainMenu() {
    const best = useStore((s) => s.best);
    return (
        <div className="flex h-full flex-col items-center justify-center gap-10 px-10">
            <h1 className="text-4xl font-bold tracking-wide text-primary">AI Overlord</h1>
            <p className="text-center text-lg text-white/70">Early prototype. Traffic training is coming next.</p>
            {/* ADAPT: demo save readout — shows persistence working end to end */}
            {best > 0 && (
                <p className="text-xl font-semibold text-white/80">Best: {best} bounces</p>
            )}
            <button
                type="button"
                className="rounded-2xl bg-primary px-12 py-4 text-xl font-bold text-black shadow-lg transition-transform active:scale-95"
                onClick={() => store.patch({ phase: 'playing', score: 0 })}
            >
                Play starter demo
            </button>
        </div>
    );
}
