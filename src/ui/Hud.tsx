import { store, useStore } from '../state/store.ts';
import { sendTrafficInput, clearTrafficContext, restartTraffic } from '../game/trafficScene.ts';
import { RESET_COST, type Lane } from '../game/trafficModel.ts';
import { story } from '../content/story.ts';
const directions: Lane[] = ['north','east','south','west'];
const symbols = {north:'↑', east:'→', south:'↓', west:'←'};
const keys = {north:'W',east:'D',south:'S',west:'A'};
export default function Hud() {
    const s = useStore();
    const seconds = Math.max(0,s.remaining);
    return <div className="shift-ui">
        <header className="shift-header">
            <div className="shift-title"><span className="eyebrow">{story.shift}</span><button className="quiet-button" onClick={()=>store.patch({paused:!s.paused})} aria-label={s.paused?'Resume':'Pause'}>{s.paused?'Resume':'Pause'}</button></div>
            <div className="stats"><div><small>WORK DONE</small><b>{s.score}</b></div><div><small>TOKENS</small><b>{s.tokens}</b></div><div><small>SHIFT LEFT</small><b>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</b></div></div>
            <div className="report-strip"><span>{s.combo > 1 ? `${s.combo}× streak` : 'Keep it moving'}</span><span>{s.crashes} incidents</span></div>
            <p className={"memo"+(s.emergency?" emergency-memo":"")} role={s.emergency?"status":undefined} aria-live="polite">{s.emergency ? `${s.emergency.kind==='firetruck'?'FIRE TRUCK':'AMBULANCE'} FROM ${s.emergency.lane.toUpperCase()} · ${s.emergency.seconds>0 ? `AUTO IN ${s.emergency.seconds}s` : 'AUTOMATIC · KEEP PATH CLEAR'}` : s.message || story.opening}</p>
        </header>
        <section className="controls" aria-label="Traffic controls">
            <div className={'rule-strip '+(s.rule==='rotate'?'mutated':'')}><span>{s.rule==='rotate'?'CONTEXT UPDATE: controls rotated clockwise':'Release one car per press'}</span></div>
            <div className="lane-buttons">{directions.map((input,i)=>{
                const lane = s.rule==='rotate' ? directions[(i+1)%4] : input;
                return <button key={input} className={'lane-button lane-'+lane} disabled={s.paused || s.finished || s.closedLane===lane} onClick={()=>sendTrafficInput(input)} aria-label={`Release ${lane} lane`}>
                    <strong>{symbols[input]} <span>{keys[input]}</span></strong><span>{lane.toUpperCase()}</span><small>{s.closedLane===lane?'CLOSED':`${s.queues[lane]} waiting`}</small>
                </button>;
            })}</div>
            <div className="bottom-actions"><button className="reset-button" disabled={s.rule==='normal'||s.tokens<RESET_COST||s.paused||s.finished} onClick={clearTrafficContext}>Reset context · {RESET_COST} tokens</button><button className="quiet-button" onClick={()=>store.patch({phase:'menu',paused:false})}>Exit</button></div>
        </section>
        {s.paused && !s.finished && <div className="modal-shade"><div className="result-card"><p className="eyebrow">ON BREAK</p><h2>Take your time.</h2><p>Traffic and the shift clock are paused.</p><button className="primary-button" onClick={()=>store.patch({paused:false})}>Back to work</button></div></div>}
        {s.finished && <div className="modal-shade"><div className="result-card"><p className="eyebrow">SHIFT REPORT / 0.1</p><h2>{s.crashes<4?story.successTitle:story.messyTitle}</h2><p>{s.crashes<4?story.successBody:story.messyBody}</p><div className="result-stats"><b>{s.cleared}<small>vehicles cleared</small></b><b>{s.crashes}<small>incidents</small></b><b>{s.score}<small>score</small></b></div><p>{story.future}</p><button className="primary-button" onClick={restartTraffic}>One more shift →</button><button className="quiet-button" onClick={()=>store.patch({phase:'menu',paused:false})}>Clock out</button></div></div>}
    </div>;
}
