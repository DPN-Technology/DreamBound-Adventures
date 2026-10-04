(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.simulation||!DBX.autonomousWorld||!DBX.ui)return;

const KEY='dreambound-v2-systemic-chains-v1';
const CHAIN_IDS=['crystal-resonance','moon-base-rally','creature-crossroads','startrail-afterglow'];
const CONSEQUENCES=['ridge-harmony','base-community','creature-trust','story-echo'];
const defaults=()=>({active:null,completed:[],consequences:[],serial:0});

function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const active=r.active&&CHAIN_IDS.includes(r.active.id)?{
    id:r.active.id,
    step:DBX.util.int(r.active.step,0,4,0),
    startEventWins:DBX.util.int(r.active.startEventWins,0,999,0),
    startVisits:DBX.util.int(r.active.startVisits,0,999999,0),
    startHelped:DBX.util.int(r.active.startHelped,0,99,0),
    startCrystals:DBX.util.int(r.active.startCrystals,0,999,0),
    zone:['crystal-ridge','moon-base','luma-hollow','tranquility-basin'].includes(r.active.zone)?r.active.zone:'tranquility-basin'
  }:null;
  return {
    active,
    completed:DBX.util.list(r.completed,CHAIN_IDS,CHAIN_IDS.length),
    consequences:DBX.util.list(r.consequences,CONSEQUENCES,CONSEQUENCES.length),
    serial:DBX.util.int(r.serial,0,999999,0)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const chains={
  'crystal-resonance':{
    title:'💠 Crystal Resonance',
    consequence:'ridge-harmony',
    zone:'crystal-ridge',
    steps:[
      ['Witness Crystal Glow',()=>DBX.worldSystems?.state.weather==='crystal-glow'||DBX.worldSystems?.state.weatherDiscoveries?.includes('crystal-glow')],
      ['Help Moss study the ridge',a=>(DBX.livingNpcs?.state.helped?.length||0)>a.startHelped],
      ['Complete a world event',a=>(DBX.state.eventWins||0)>a.startEventWins],
      ['Return to Crystal Ridge',()=>DBX.simulation.zoneOf()==='crystal-ridge']
    ],
    reward:110,
    effect:'Crystal Ridge now remembers your help and stabilizes at a higher activity stage.'
  },
  'moon-base-rally':{
    title:'🏗️ Moon Base Rally',
    consequence:'base-community',
    zone:'moon-base',
    steps:[
      ['Reach the Moon Base',()=>DBX.simulation.zoneOf()==='moon-base'],
      ['Help an explorer routine',a=>(DBX.livingNpcs?.state.helped?.length||0)>a.startHelped],
      ['Build or improve the outpost',a=>(DBX.state.baseModules?.length||0)>0],
      ['Collect 3 more Moon crystals',a=>(DBX.state.moonCrystals||0)>=a.startCrystals+3]
    ],
    reward:120,
    effect:'Moon Base gains a persistent community boost in future world evolution.'
  },
  'creature-crossroads':{
    title:'💜 Creature Crossroads',
    consequence:'creature-trust',
    zone:'luma-hollow',
    steps:[
      ['Visit Luma Hollow',()=>DBX.simulation.zoneOf()==='luma-hollow'],
      ['Spend time with DreamCreatures',a=>(DBX.ecology?.state.visits||0)>=a.startVisits+2],
      ['See an actor choose SOCIALIZE',()=>Object.values(DBX.autonomousWorld.state.actorGoals||{}).includes('socialize')],
      ['Return with Luma rescued',()=>!!DBX.state.lumaRescued]
    ],
    reward:105,
    effect:'DreamCreature social goals become easier to trigger across the living world.'
  },
  'startrail-afterglow':{
    title:'✨ Startrail Afterglow',
    consequence:'story-echo',
    zone:'tranquility-basin',
    steps:[
      ['Complete the Startrail Mystery',()=>!!DBX.storyArcs?.state.complete],
      ['Enter Tranquility Basin',()=>DBX.simulation.zoneOf()==='tranquility-basin'],
      ['Trigger a new simulation discovery',()=>DBX.simulation.state.discoveries.length>=2],
      ['Complete a fresh Living Quest',()=>DBX.proceduralAdventures?.state.completed>0]
    ],
    reward:130,
    effect:'Story resonance permanently raises the world’s narrative activity signal.'
  }
};

function eligible(){
  const list=[];
  if(!state.completed.includes('crystal-resonance')&&DBX.state.launched)list.push('crystal-resonance');
  if(!state.completed.includes('moon-base-rally')&&DBX.state.launched)list.push('moon-base-rally');
  if(!state.completed.includes('creature-crossroads')&&DBX.state.lumaRescued)list.push('creature-crossroads');
  if(!state.completed.includes('startrail-afterglow')&&DBX.storyArcs?.state.complete)list.push('startrail-afterglow');
  return list;
}
function start(id){
  const def=chains[id];if(!def)return false;
  state.active={
    id,step:0,zone:def.zone,
    startEventWins:DBX.state.eventWins||0,
    startVisits:DBX.ecology?.state.visits||0,
    startHelped:DBX.livingNpcs?.state.helped?.length||0,
    startCrystals:DBX.state.moonCrystals||0
  };
  state.serial++;save();
  DBX.simulation.emit('systemic-chain-start',def.zone,55);
  DBX.events.emit('story:beat',{label:'SYSTEMIC QUEST',title:def.title});
  DBX.ui.toast(def.title,'A new multi-step world chain has begun.');
  return true;
}
function ensure(){
  if(state.active)return;
  const pool=eligible();if(!pool.length)return;
  const pick=pool[Math.abs((DBX.simulation.state.tick+state.serial*7)%pool.length)];
  start(pick);
}
function progress(){
  ensure();
  const a=state.active;if(!a)return null;
  const def=chains[a.id];
  let done=0;
  for(const [,test] of def.steps){let ok=false;try{ok=!!test(a)}catch{}if(ok)done++}
  a.step=done;save();
  return {def,done,total:def.steps.length,complete:done===def.steps.length};
}
function applyConsequence(id){
  if(state.consequences.includes(id))return;
  state.consequences.push(id);
  if(id==='ridge-harmony')DBX.autonomousWorld.state.zoneStage['crystal-ridge']=Math.max(2,DBX.autonomousWorld.state.zoneStage['crystal-ridge']||0);
  if(id==='base-community')DBX.autonomousWorld.state.zoneStage['moon-base']=Math.max(2,DBX.autonomousWorld.state.zoneStage['moon-base']||0);
  if(id==='creature-trust')DBX.simulation.emit('creature-trust','luma-hollow',65);
  if(id==='story-echo')DBX.simulation.emit('story-resonance','tranquility-basin',70);
  save();
}
function complete(){
  const p=progress();if(!p||!p.complete)return false;
  const id=state.active.id,def=p.def;
  state.completed.push(id);applyConsequence(def.consequence);
  state.active=null;save();
  DBX.state.stars=(DBX.state.stars||0)+10;DBX.state.gems=(DBX.state.gems||0)+4;
  DBX.storage.save();DBX.odyssey?.addXP?.(def.reward,'Systemic Chain: '+def.title);
  DBX.simulation.emit('systemic-chain-complete',def.zone,80);
  DBX.events.emit('story:beat',{label:'WORLD CONSEQUENCE',title:def.title+' COMPLETE'});
  DBX.ui.toast(def.title+' complete','Persistent world consequence unlocked.');
  setTimeout(ensure,500);
  return true;
}
function tick(){ensure();complete();renderChip()}
function renderChip(){
  const btn=document.querySelector('#vnextChainBtn');if(!btn)return;
  const p=progress();
  btn.innerHTML=p?'🔗 CHAIN <b>'+p.done+'/'+p.total+'</b>':'🔗 CHAIN';
  btn.classList.toggle('ready',!!p?.complete);
}
function open(){
  ensure();const p=progress();
  if(!p){
    DBX.ui.openModal('<h2>🔗 Systemic Quest Chains</h2><p>No chain is available yet. Keep progressing the living world.</p><button id="chainClose" class="primary-btn">BACK</button>');
    document.querySelector('#chainClose').onclick=DBX.ui.closeModal;return;
  }
  const steps=p.def.steps.map(([label,test])=>{
    let ok=false;try{ok=!!test(state.active)}catch{}
    return '<li class="'+(ok?'done':'')+'"><span>'+(ok?'✅':'○')+'</span>'+label+'</li>';
  }).join('');
  DBX.ui.openModal(
    '<h2>🔗 '+p.def.title+'</h2>'+
    '<p>Simulation-driven multi-step adventure. No timer, no failure penalty.</p>'+
    '<article class="quest-card"><header><strong>'+p.def.title+'</strong><b>'+p.done+'/'+p.total+'</b></header><ul>'+steps+'</ul>'+
    '<small>World effect: '+p.def.effect+'</small></article>'+
    '<div class="friend-roster"><strong>PERSISTENT CONSEQUENCES</strong>'+
      (state.consequences.length?state.consequences.map(x=>'<span>'+x.replace(/-/g,' ').toUpperCase()+'</span>').join(''):'<span>None yet</span>')+
    '</div><button id="chainClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#chainClose').onclick=DBX.ui.closeModal;
}
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextChainBtn')){
  const b=document.createElement('button');b.id='vnextChainBtn';b.className='deck-chip';b.onclick=open;hud.appendChild(b);
}
for(const evt of ['simulation:snapshot','worldevent:end','quest:complete','story:complete','hud:update'])DBX.events.on(evt,tick);
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();renderChip()});
DBX.systemicChains={state,chains,eligible,start,progress,complete,applyConsequence,tick,open};
ensure();renderChip();setInterval(tick,2400);
})();