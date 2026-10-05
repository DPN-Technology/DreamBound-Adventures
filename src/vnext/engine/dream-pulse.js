(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.ui)return;

const KEY='dreambound-dreampulse-v1';
const IDS=['mission-progress','explore-distance','realm-discovery','realm-complete','quest-complete','world-event','friendship','luma-bond','codex-find','base-build','crystal-find'];
const defaults=()=>({serial:0,chains:0,streak:0,momentum:0,active:[],history:[],lastMilestone:0});

function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  return {
    serial:DBX.util.int(r.serial,0,999999,0),
    chains:DBX.util.int(r.chains,0,99999,0),
    streak:DBX.util.int(r.streak,0,999,0),
    momentum:DBX.util.int(r.momentum,0,100,0),
    active:Array.isArray(r.active)?r.active.filter(x=>x&&IDS.includes(x.id)).slice(0,3).map(x=>({
      id:x.id,start:DBX.util.num(x.start,0,999999999,0),done:DBX.util.bool(x.done,false)
    })):[],
    history:DBX.util.list(r.history,IDS,30),
    lastMilestone:DBX.util.int(r.lastMilestone,0,100,0)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={timer:0};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const metrics={
  mission:()=>[DBX.state.signalSolved,DBX.state.solarFixed,DBX.state.rocketFixed,DBX.state.launched,DBX.state.moonRoute].filter(Boolean).length,
  distance:()=>Math.floor(DBX.state.totalDistance||0),
  scenes:()=>DBX.state.sceneVisits?.length||0,
  realms:()=>DBX.realms?.state?.completed?.length||0,
  quests:()=>DBX.state.completedQuests?.length||0,
  events:()=>DBX.state.eventWins||0,
  friendship:()=>Object.values(DBX.state.npcFriendship||{}).reduce((a,b)=>a+(Number(b)||0),0),
  bond:()=>Math.floor(DBX.state.lumaBond||0),
  codex:()=>DBX.state.codexEntries?.length||0,
  base:()=>DBX.state.baseModules?.length||0,
  crystals:()=>DBX.state.moonCrystals||0
};

const catalog=[
  {id:'mission-progress',icon:'🚀',title:'Mission Momentum',desc:'Advance the main DreamBound journey.',target:1,read:metrics.mission,eligible:()=>metrics.mission()<5},
  {id:'explore-distance',icon:'👣',title:'Trail Spark',desc:'Explore 700 world units anywhere in DreamBound.',target:700,read:metrics.distance},
  {id:'realm-discovery',icon:'🌀',title:'DreamGate Explorer',desc:'Visit a new connected area of the one Living World.',target:1,read:metrics.scenes,eligible:()=>metrics.scenes()<8},
  {id:'realm-complete',icon:'🏰',title:'Realm Hero',desc:'Complete an activity in a DreamGate realm.',target:1,read:metrics.realms},
  {id:'quest-complete',icon:'📖',title:'Adventure Chapter',desc:'Complete an advanced DreamBound quest.',target:1,read:metrics.quests},
  {id:'world-event',icon:'🌌',title:'Living World Hero',desc:'Complete a dynamic world event.',target:1,read:metrics.events,eligible:()=>!!DBX.state.launched},
  {id:'friendship',icon:'🤝',title:'Team Spark',desc:'Grow any explorer friendship.',target:1,read:metrics.friendship},
  {id:'luma-bond',icon:'💜',title:'Buddy Boost',desc:'Grow your bond with Luma.',target:1,read:metrics.bond,eligible:()=>!!DBX.state.lumaRescued},
  {id:'codex-find',icon:'📚',title:'Discovery Spark',desc:'Add a new discovery to the Codex.',target:1,read:metrics.codex,eligible:()=>!!DBX.state.launched},
  {id:'base-build',icon:'🏗️',title:'Moon Builder',desc:'Build a new Moon Base module.',target:1,read:metrics.base,eligible:()=>!!DBX.state.launched&&metrics.base()<4},
  {id:'crystal-find',icon:'💠',title:'Crystal Trail',desc:'Collect 4 Moon crystals.',target:4,read:metrics.crystals,eligible:()=>!!DBX.state.launched}
];
const def=id=>catalog.find(x=>x.id===id);
function eligible(){return catalog.filter(x=>!x.eligible||x.eligible())}

function seed(){return state.serial*17+state.chains*31+(DBX.state.eventWins||0)*13+(DBX.state.completedQuests?.length||0)*19+(DBX.realms?.state?.completed?.length||0)*23}
function refill(){
  const pool=eligible(),chosen=[],used=new Set();let n=seed();
  for(let i=0;i<3&&used.size<pool.length;i++){
    let idx=Math.abs((n+i*29)%pool.length),guard=0;
    while(used.has(pool[idx].id)&&guard++<pool.length)idx=(idx+1)%pool.length;
    const c=pool[idx];used.add(c.id);chosen.push({id:c.id,start:c.read(),done:false});
  }
  state.active=chosen;state.serial++;save();renderChip();
}
function ensure(){
  state.active=state.active.filter(x=>{
    const c=def(x.id);return c&&(!c.eligible||c.eligible());
  });
  if(state.active.length!==3)refill();
}
function progress(card){
  const c=def(card.id);if(!c)return {value:0,target:1,pct:0,complete:false};
  const value=Math.min(c.target,Math.max(0,c.read()-card.start));
  return {value,target:c.target,pct:Math.round(value/c.target*100),complete:value>=c.target};
}
function completedCount(){return state.active.filter(x=>x.done||progress(x).complete).length}
function mark(card){
  if(card.done)return false;
  const p=progress(card);if(!p.complete)return false;
  card.done=true;
  state.momentum=Math.min(100,state.momentum+25);
  const c=def(card.id);
  DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+1);
  DBX.storage.save();
  DBX.audio?.success?.();DBX.fx?.burst?.(DBX.state.player.x,DBX.state.player.y,c.icon);
  DBX.ui.toast(c.icon+' '+c.title,'Pulse objective complete · +1 ⭐');
  DBX.events.emit('hud:update');save();
  return true;
}
function claimBurst(){
  ensure();if(completedCount()<3)return;
  const bonusStars=4+Math.min(6,state.streak);
  const bonusGems=1+Math.floor(Math.min(9,state.streak)/3);
  state.chains++;state.streak=Math.min(99,state.streak+1);state.momentum=100;
  for(const c of state.active)state.history.push(c.id);
  state.history=state.history.slice(-30);
  DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+bonusStars);
  DBX.state.gems=Math.min(9999,(DBX.state.gems||0)+bonusGems);
  DBX.storage.save();DBX.odyssey?.addXP?.(55+state.streak*3,'DreamPulse chain');
  DBX.fx?.flash?.(.45);DBX.audio?.success?.();
  DBX.ui.toast('⚡ DREAM PULSE BURST!','+'+bonusStars+' ⭐  +'+bonusGems+' 💎 · chain '+state.streak);
  state.active=[];save();refill();DBX.events.emit('hud:update');
}
function tick(){
  ensure();
  let changed=false;
  for(const card of state.active)changed=mark(card)||changed;
  const done=completedCount();
  if(done===3&&state.momentum<100){state.momentum=100;changed=true}
  if(changed)save();
  renderChip();
}
function update(dt){
  runtime.timer-=dt;
  if(runtime.timer>0)return;
  runtime.timer=.75;
  tick();
}
function renderChip(){
  const btn=document.querySelector('#vnextPulseBtn');if(!btn)return;
  const done=completedCount();
  btn.textContent=done===3?'⚡ PULSE READY':'⚡ PULSE '+done+'/3';
  btn.classList.toggle('ready',done===3);
  btn.dataset.momentum=String(state.momentum);
}
function open(){
  ensure();
  const done=completedCount();
  const cards=state.active.map(card=>{
    const c=def(card.id),p=progress(card),complete=card.done||p.complete;
    return '<article class="pulse-card '+(complete?'complete':'')+'"><span>'+c.icon+'</span><div><strong>'+c.title+'</strong><p>'+c.desc+'</p><i><b style="width:'+p.pct+'%"></b></i><small>'+(complete?'COMPLETE':p.value+' / '+p.target)+'</small></div><em>'+(complete?'✓':'')+'</em></article>';
  }).join('');
  DBX.ui.openModal(
    '<section class="pulse-panel"><div class="pulse-head"><div><small>ONE WORLD · ONE JOURNEY</small><h2>⚡ DreamPulse</h2></div><div class="pulse-chain"><b>'+state.streak+'</b><span>CHAIN</span></div></div>'+
    '<p>Three live objectives connect exploration, quests, friends, realms, discoveries, and world events into one continuous adventure loop.</p>'+
    '<div class="pulse-meter"><span><b style="width:'+state.momentum+'%"></b></span><strong>'+state.momentum+'% MOMENTUM</strong></div>'+
    '<div class="pulse-list">'+cards+'</div>'+
    (done===3?'<button id="pulseClaim" class="pulse-claim">⚡ CLAIM DREAM PULSE BURST</button>':'<div class="pulse-tip">Complete all three objectives to trigger a Dream Pulse Burst.</div>')+
    '<div class="pulse-stats"><span>CHAINS <b>'+state.chains+'</b></span><span>OBJECTIVES <b>'+state.history.length+'</b></span><span>NO FAILURE <b>ON</b></span></div>'+
    '<button id="pulseClose" class="small-btn">BACK TO ADVENTURE</button></section>'
  );
  const claim=document.querySelector('#pulseClaim');if(claim)claim.onclick=()=>{claimBurst();DBX.ui.closeModal()};
  document.querySelector('#pulseClose').onclick=DBX.ui.closeModal;
}
function mount(){
  const hud=document.querySelector('.advanced-hud');
  if(hud&&!document.querySelector('#vnextPulseBtn')){
    const b=document.createElement('button');b.id='vnextPulseBtn';b.className='pulse-chip';b.onclick=open;hud.appendChild(b);
  }
  renderChip();
}
DBX.events.on('hud:update',tick);
DBX.events.on('scene:changed',tick);
DBX.events.on('quest:complete',tick);
DBX.events.on('worldevent:end',tick);
DBX.events.on('story:beat',tick);
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();refill()});
DBX.dreamPulse={state,runtime,catalog,tick,update,open,claimBurst,progress};
mount();ensure();tick();
})();