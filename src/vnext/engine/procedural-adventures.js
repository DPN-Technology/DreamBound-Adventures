(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.ui||!DBX.odyssey)return;

const KEY='dreambound-vnext-procedural-adventures-v1';
const safeTypes=['weather-scout','npc-helper','creature-friend','base-patrol','discovery-walk','crystal-route'];
const defaults=()=>({serial:0,completed:0,active:null,history:[]});
function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const a=r.active&&safeTypes.includes(r.active.type)?{
    type:r.active.type,
    title:String(r.active.title||'').replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,64),
    desc:String(r.active.desc||'').replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,140),
    target:DBX.util.int(r.active.target,1,5000,1),
    start:DBX.util.int(r.active.start,0,999999999,0),
    reward:DBX.util.int(r.active.reward,5,200,20),
    icon:String(r.active.icon||'🧭').slice(0,4)
  }:null;
  return {
    serial:DBX.util.int(r.serial,0,999999,0),
    completed:DBX.util.int(r.completed,0,99999,0),
    active:a,
    history:DBX.util.list(r.history,safeTypes,30)
  };
}
function load(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

function seed(){
  const s=DBX.state,w=DBX.worldSystems?.state,n=DBX.livingNpcs?.state,e=DBX.ecology?.state;
  return (s.eventWins||0)*17+(s.codexEntries?.length||0)*23+(s.baseModules?.length||0)*29+
    (w?.weatherSerial||0)*31+(n?.routineTicks||0)*3+(e?.visits||0)*7+state.serial*11;
}
function metric(type){
  const s=DBX.state;
  if(type==='weather-scout')return DBX.worldSystems?.state.weatherDiscoveries?.length||0;
  if(type==='npc-helper')return DBX.livingNpcs?.state.helped?.length||0;
  if(type==='creature-friend')return DBX.ecology?.state.visits||0;
  if(type==='base-patrol')return (s.baseModules||[]).length;
  if(type==='discovery-walk')return Math.floor(s.totalDistance||0);
  if(type==='crystal-route')return s.moonCrystals||0;
  return 0;
}
function pool(){
  const s=DBX.state,w=DBX.worldSystems?.currentWeather?.(),weatherName=w?.name||'Clear Skies';
  const items=[
    {type:'weather-scout',icon:'🌦️',title:'Weather Watch',desc:'Explore while '+weatherName+' is active and discover another world condition.',target:1,reward:34,requires:()=>!!s.launched},
    {type:'npc-helper',icon:'🤝',title:'Explorer Assist',desc:'Check in with Nova, Gear, or Moss and help with one living-world routine.',target:1,reward:38,requires:()=>!!DBX.livingNpcs},
    {type:'creature-friend',icon:'💜',title:'DreamCreature Day',desc:'Spend gentle time with two DreamCreatures during your adventure.',target:2,reward:36,requires:()=>!!DBX.ecology},
    {type:'base-patrol',icon:'🏗️',title:'Outpost Patrol',desc:'Grow the Moon Base by completing one more permanent module.',target:1,reward:44,requires:()=>!!s.launched&&(s.baseModules||[]).length<4},
    {type:'discovery-walk',icon:'👣',title:'Trail of Wonders',desc:'Explore 700 steps and see what the living world reveals.',target:700,reward:32,requires:()=>true},
    {type:'crystal-route',icon:'💠',title:'Crystal Route',desc:'Collect 5 more Moon crystals while exploring the lunar surface.',target:5,reward:40,requires:()=>!!s.launched}
  ];
  return items.filter(x=>x.requires());
}
function generate(){
  const items=pool();if(!items.length)return null;
  const item=items[Math.abs(seed())%items.length];
  state.serial++;
  state.active={
    type:item.type,title:item.title,desc:item.desc,target:item.target,
    start:metric(item.type),reward:item.reward,icon:item.icon
  };
  save();renderChip();return state.active;
}
function ensure(){if(!state.active)generate()}
function progress(){
  ensure();const a=state.active;if(!a)return {value:0,target:1,pct:0,complete:false};
  const value=Math.min(a.target,Math.max(0,metric(a.type)-a.start));
  return {value,target:a.target,pct:Math.round(value/a.target*100),complete:value>=a.target};
}
function complete(){
  const a=state.active,p=progress();if(!a||!p.complete)return false;
  state.completed++;state.history.push(a.type);state.history=state.history.slice(-30);
  DBX.state.stars=(DBX.state.stars||0)+4;DBX.state.gems=(DBX.state.gems||0)+1;
  DBX.storage.save();DBX.odyssey.addXP(a.reward,'Procedural Adventure: '+a.title);
  DBX.fx?.flash?.(.25);DBX.audio?.success?.();
  DBX.ui.toast(a.icon+' '+a.title+' complete','+4 ⭐  +1 💎  +'+a.reward+' Odyssey XP');
  state.active=null;save();setTimeout(()=>{generate();renderChip()},400);return true;
}
function tick(){ensure();complete();renderChip()}
function open(){
  ensure();const a=state.active,p=progress();if(!a)return;
  DBX.ui.openModal(
    '<h2>🧭 Living Adventure Generator</h2>'+
    '<p>DreamBound builds fresh local adventures from the world systems you have unlocked. No timer, no failure, no pressure.</p>'+
    '<article class="deck-card '+(p.complete?'ready':'')+'"><span>'+a.icon+'</span><div><strong>'+a.title+'</strong><p>'+a.desc+'</p>'+
    '<i><b style="width:'+p.pct+'%"></b></i><small>'+p.value+' / '+p.target+' · '+a.reward+' Odyssey XP</small></div></article>'+
    '<div class="deck-footer"><span>🔒 Local-only</span><span>🌱 Progress-aware</span><span>💜 No punishment</span></div>'+
    '<button id="procAdventureClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#procAdventureClose').onclick=DBX.ui.closeModal;
}
function renderChip(){
  const btn=document.querySelector('#vnextProceduralBtn');if(!btn)return;
  const p=progress();
  btn.innerHTML='🧭 LIVING QUEST <b>'+p.pct+'%</b>';
  btn.classList.toggle('ready',p.complete);
}
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextProceduralBtn')){
  const b=document.createElement('button');b.id='vnextProceduralBtn';b.className='deck-chip';b.onclick=open;hud.appendChild(b);
}
for(const evt of ['hud:update','worldevent:end','quest:complete','story:complete','scene:changed'])DBX.events.on(evt,tick);
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();generate();renderChip()});
DBX.proceduralAdventures={state,pool,generate,progress,tick,open,metric};
ensure();tick();setInterval(tick,2200);
})();