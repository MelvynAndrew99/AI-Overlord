import { store, useStore } from '../state/store.ts';
import { story } from '../content/story.ts';
export default function MainMenu() {
    const best = useStore(s => s.best);
    return <main className="menu-screen">
        <div className="menu-cover"><img src="thumbnail.jpg" alt="AI Overlord, a confident robot overlooking a chaotic city" /></div>
        <div className="menu-copy">
            <p className="eyebrow">VERSION 0.1 · FIRST DAY ON THE JOB</p>
            <h1>You’re the upgrade.</h1>
            <p>{story.intro}</p>
            <div className="how-to"><span>01</span> Release cars. Keep crossing paths apart.<br/><span>02</span> Adapt when your instructions change.<br/><span>03</span> Mistakes happen. Recover and keep working.</div>
            <button className="primary-button" onClick={() => store.patch({phase:'playing',paused:false,finished:false})}>Clock in <span>→</span></button>
            <p className="menu-foot">Two-minute shift · WASD / arrows or touch {best > 0 ? `· Best ${best}` : ''}</p>
        </div>
    </main>;
}
