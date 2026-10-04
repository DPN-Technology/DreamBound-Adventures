(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.simulation||!DBX.autonomousWorld||!DBX.events)return;

const KEY='dreambound-v2-emergent-ecology-v1';
const ACTORS=['nova','gear','moss','puff','pebble','orbit','glimmer'];
const ZONES=['space-center','tranquility-basin','crystal-ridge','luma-hollow','moon-base'];
const EVENT_IDS=['crystal-gathering','hollow-playdate','base-workshop','stardust-watch'];

const defaults=()=>({
  affinity:{},
  zoneEcology:{'space-center':20,'tranquility-basin':25,'crystal-ridge':30,'luma-hollow':35,'moon-base':20},
  recentEvents:[],
  eventCount:0,
  lastSynthesisTick:-999
});
function pairKey(a,b){return [a,b].sort().join(':')}
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const affinity={};
  if(r.affinity&&typeof r.affinity==='object'){
    for(const [k,v] of Object.entries(r.affinity)){
      const parts=k.split(':');if(parts.length!==2||!ACTORS.includes(parts[0])||!ACTORS.includes(parts[1]))continue;
      affinity[pairKey(parts[0],parts[1])]=DBX.util.int(v,0,100,0);
    }
  }
  const zoneEcology={};
  for(const z of ZONES)zoneEcology[z]=DBX.util.int(r.zoneEcology?.[z],0,100,defaults().zoneEcology[z]);
  return {
    affinity,
    zoneEcology,
    recentEvents:DBX.util.list(r.recentEvents,EVENT_IDS,12),
    eventCount:DBX.util.int(r.eventCount,0,999999,0),
    lastSynthesisTick:DBX.util.int(r.lastSynthesisTick,-999,999999999,-999)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={accum:0,lastEvent:null};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

function actorsInZone(zone){
  return ACTORS.filter(a=>DBX.autonomousWorld.state.actorZones?.[a]===zone);
}
function affinity(a,b){return state.affinity[pairKey(a,b)]||0}
function bumpAffinity(a,b,amount){
  const key=pairKey(a,b);state.affinity[key]=DBX.util.int((state.affinity[key]||0)+amount,0,100,0);
}
function ecologyTarget(zone){
  const weather=DBX.worldSystems?.state.weather;
  const stage=DBX.autonomousWorld.state.zoneStage?.[zone]||0;
  const count=actorsInZone(zone).length;
  let target=20+stage*12+count*7;
  if(zone==='crystal-ridge'&&weather==='crystal-glow')target+=18;
  if(zone==='luma-hollow'&&DBX.state.lumaRescued)target+=14;
  if(zone==='moon-base'&&(DBX.state.baseModules?.length||0)>=3)target+=15;
  if(DBX.environmentNetwork?.state.resonanceSolved&&zone==='crystal-ridge')target+=10;
  return Math.min(100,target);
}
function updateEcology(){
  for(const z of ZONES){
    const target=ecologyTarget(z),current=state.zoneEcology[z]||0;
    state.zoneEcology[z]=Math.round(current+(target-current)*.18);
  }
}
function socializePairs(){
  for(const z of ZONES){
    const actors=actorsInZone(z);
    for(let i=0;i<actors.length;i++){
      for(let j=i+1;j<actors.length;j++){
        const a=actors[i],b=actors[j];
        const ag=DBX.autonomousWorld.state.actorGoals?.[a],bg=DBX.autonomousWorld.state.actorGoals?.[b];
        if(ag==='socialize'||bg==='socialize'||(ag===bg&&['observe','study','help'].includes(ag)))bumpAffinity(a,b,1);
      }
    }
  }
}
function eventDefinition(id){
  const defs={
    'crystal-gathering':{title:'💠 Crystal Gathering',zone:'crystal-ridge',text:'Moss, Orbit, and curious explorers gather around the glowing ridge to compare gentle observations.',reward:28},
    'hollow-playdate':{title:'💜 Hollow Playdate',zone:'luma-hollow',text:'DreamCreatures meet in Luma Hollow for a calm, playful social moment.',reward:24},
    'base-workshop':{title:'🛠️ Moon Base Workshop',zone:'moon-base',text:'Gear coordinates a friendly workshop while nearby explorers inspect the outpost together.',reward:30},
    'stardust-watch':{title:'✨ Stardust Watch',zone:'tranquility-basin',text:'Nova and the DreamCreatures pause to watch a drifting stardust pattern cross the basin.',reward:26}
  };
  return defs[id];
}
function eligibleEvents(){
  const w=DBX.worldSystems?.state.weather,goals=DBX.autonomousWorld.state.actorGoals||{};
  const out=[];
  if(state.zoneEcology['crystal-ridge']>=55&&(w==='crystal-glow'||goals.moss==='study'))out.push('crystal-gathering');
  if(state.zoneEcology['luma-hollow']>=50&&['socialize','play'].some(g=>Object.values(goals).includes(g)))out.push('hollow-playdate');
  if(state.zoneEcology['moon-base']>=50&&(DBX.state.baseModules?.length||0)>=2)out.push('base-workshop');
  if(state.zoneEcology['tranquility-basin']>=45&&w==='stardust')out.push('stardust-watch');
  return out;
}
function synthesizeEvent(){
  const tick=DBX.simulation.state.tick;
  if(tick-state.lastSynthesisTick<28)return;
  const pool=eligibleEvents();if(!pool.length)return;
  const id=pool[(tick+state.eventCount*3)%pool.length],def=eventDefinition(id);
  state.lastSynthesisTick=tick;state.eventCount++;state.recentEvents.push(id);state.recentEvents=state.recentEvents.slice(-12);save();
  runtime.lastEvent={id,...def,tick};
  DBX.simulation.emit('emergent-ecology-event',def.zone,65);
  DBX.odyssey?.addXP?.(def.reward,'Emergent ecology event');
  DBX.events.emit('story:beat',{label:'EMERGENT WORLD',title:def.title});
  DBX.ui?.toast(def.title,def.text);
}
function tick(dt){
  runtime.accum+=dt;if(runtime.accum<1)return;
  runtime.accum=0;updateEcology();socializePairs();synthesizeEvent();
  if(DBX.simulation.state.tick%12===0)save();
}
function strongestRelationships(){
  return Object.entries(state.affinity)
    .sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([pair,value])=>({pair,value}));
}
function open(){
  const zones=ZONES.map(z=>'<div class="resource-strip"><span>'+z.replace(/-/g,' ').toUpperCase()+'</span><b>'+state.zoneEcology[z]+'%</b></div>').join('');
  const rel=strongestRelationships();
  DBX.ui.openModal(
    '<h2>🌱 Emergent Ecology</h2>'+
    '<p>Actors and DreamCreatures now build relationship memory, influence zone ecology, and create local world moments together.</p>'+
    '<div>'+zones+'</div>'+
    '<div class="friend-roster"><strong>RELATIONSHIP MEMORY</strong>'+
      (rel.length?rel.map(x=>'<span>'+x.pair.replace(':',' ↔ ').toUpperCase()+' · '+x.value+'</span>').join(''):'<span>Relationships are still forming.</span>')+
    '</div>'+
    '<div class="friend-roster"><strong>RECENT EMERGENT EVENTS</strong>'+
      (state.recentEvents.length?state.recentEvents.slice(-6).map(x=>'<span>'+x.replace(/-/g,' ').toUpperCase()+'</span>').join(''):'<span>No emergent events yet.</span>')+
    '</div><button id="ecologyV2Close" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#ecologyV2Close').onclick=DBX.ui.closeModal;
}
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextEcologyV2Btn')){
  const b=document.createElement('button');b.id='vnextEcologyV2Btn';b.className='deck-chip';b.textContent='🌱 ECOLOGY';b.onclick=open;hud.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());runtime.lastEvent=null;save()});
DBX.emergentEcology={state,runtime,tick,actorsInZone,affinity,bumpAffinity,ecologyTarget,eligibleEvents,synthesizeEvent,open};
})();