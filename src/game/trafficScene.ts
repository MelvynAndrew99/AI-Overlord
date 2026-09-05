import { Container, Graphics, Text, type Application, type Ticker } from 'pixi.js';
import { createTrafficModel, type Lane } from './trafficModel.ts';
import { drawTrafficBoard, drawVehicle } from './trafficArt.ts';
import type { Stage } from './stage.ts';
import { store } from '../state/store.ts';
import { recordBest, getSave } from '../state/save.ts';
export interface Scene { destroy(): void }
const lanes: Lane[] = ['north','east','south','west'];
const colors = {north:0xf18d79,east:0xf4cc79,south:0x79c9b8,west:0xb5a5df};
let active: {input:(lane:Lane)=>void;reset:()=>void;restart:()=>void}|null=null;
export function sendTrafficInput(lane:Lane) { if(!store.get().paused) active?.input(lane); }
export function clearTrafficContext() { if(!store.get().paused) active?.reset(); }
export function restartTraffic() { active?.restart(); }
export function createTrafficScene(app:Application, stage:Stage):Scene {
    let model=createTrafficModel();
    const root=new Container(); stage.root.addChild(root);
    root.addChild(drawTrafficBoard());
    const cars=new Container();root.addChild(cars);
    const signals=new Graphics();root.addChild(signals);
    const caption=new Text({text:'THE CITY IS COUNTING ON YOU.',style:{fontFamily:'sans-serif',fontSize:16,fontWeight:'bold',fill:0xf7e7c1,letterSpacing:2}});
    caption.anchor.set(0.5);caption.position.set(360,710);root.addChild(caption);
    const sprites=new Map<number|string,Container>();
    let signature='';let recorded=false;
    const sync=()=>{
        const s=model.state;
        const queues={north:0,east:0,south:0,west:0};
        for(const v of s.vehicles) if(v.waiting) queues[v.lane]++;
        const view={score:s.score,tokens:s.tokens,combo:s.combo,crashes:s.crashes,cleared:s.cleared,remaining:Math.ceil(s.remaining),rule:s.rule,message:s.message,closedLane:s.closedLane,finished:s.finished,queues};
        const next=JSON.stringify(view);if(next!==signature){signature=next;store.patch(view);}
        if(s.finished&&!recorded){recorded=true;recordBest(s.score);store.patch({best:getSave().best});}
    };
    const session={input:(physical:Lane)=>{const index=lanes.indexOf(physical);model.release(model.state.rule==='rotate'?lanes[(index+1)%4]:physical);sync();},reset:()=>{model.resetContext();sync();},restart:()=>{for(const sprite of sprites.values())sprite.destroy({children:true});sprites.clear();model=createTrafficModel();recorded=false;signature='';store.patch({paused:false});sync();}};
    active=session;
    const keydown=(event:KeyboardEvent)=>{
        if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
        const map:Record<string,Lane>={w:'north',ArrowUp:'north',d:'east',ArrowRight:'east',s:'south',ArrowDown:'south',a:'west',ArrowLeft:'west'};
        const key=event.key.length===1?event.key.toLowerCase():event.key;
        if(map[key]){event.preventDefault();sendTrafficInput(map[key]);}
        if(key==='r'){event.preventDefault();clearTrafficContext();}
    };
    window.addEventListener('keydown',keydown);
    const layout=()=>{root.position.set(0,Math.max(265,(stage.designHeight()-720)/2-10));};
    layout();const offResize=stage.onResize(layout);sync();
    const tick=(ticker:Ticker)=>{
        model.update(ticker.deltaMS/1000);sync();
        const ids=new Set<number|string>();
        for(const vehicle of model.state.vehicles){
            ids.add(vehicle.id);let sprite=sprites.get(vehicle.id);
            if(!sprite){sprite=drawVehicle(vehicle.kind,colors[vehicle.lane]);sprites.set(vehicle.id,sprite);cars.addChild(sprite);}
            sprite.position.set(vehicle.x,vehicle.y);
            sprite.rotation={north:Math.PI,east:-Math.PI/2,south:0,west:Math.PI/2}[vehicle.lane]+(vehicle.crashed?0.35:0);
            sprite.alpha=vehicle.crashed?0.5:1;
        }
        for(const [id,sprite] of sprites)if(!ids.has(id)){sprite.destroy({children:true});sprites.delete(id);}
        signals.clear();
        const points={north:[285,248],east:[472,285],south:[435,472],west:[248,435]};
        for(const lane of lanes){const [x,y]=points[lane];signals.circle(x,y,10).fill(model.state.closedLane===lane?0xff5757:colors[lane]).stroke({width:3,color:0x222234});}
        caption.text=model.state.closedLane?'NORTH CLOSED · HOLD THAT APPROACH':model.state.rule==='rotate'?'CHECK YOUR MAPPING. YOU KNOW THIS.':'THE CITY IS COUNTING ON YOU.';
    };
    app.ticker.add(tick);
    return {destroy(){if(active===session)active=null;window.removeEventListener('keydown',keydown);app.ticker.remove(tick);offResize();root.destroy({children:true});sprites.clear();}};
}
