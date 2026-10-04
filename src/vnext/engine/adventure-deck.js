(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.ui||!DBX.odyssey)return;

const KEY='dreambound-vnext-adventure-deck-v1';
const safeIds=['collect-stars','collect-gems','walk-world','world-event','friendship','luma-bond','build-base','codex-find','moon-crystals'];
const catalog=[
  {id:'collect-stars',icon:'⭐',title:'Star Scout',desc:'Earn 12 stars during this adventure.',target:12,reward:28,read:s=>s.stars||0},
  {id:'collect-gems',icon:'💎',title:'Gem Finder',desc:'Earn 6 gems during this adventure.',target:6,reward:30,read:s=>s.gems||0},
  {id:'walk-world',icon:'👣',title:'Trail Blazer',desc:'Explore 900 steps of the world.',target:900,reward:34,read:s=>Math.floor(s.totalDistance||0)},
  {id:'world-event',icon:'🌌',title:'World Helper',desc:'Complete a Living World event.',target:1,reward:45,read:s=>s.eventWins||0},
  {id:'friendship',icon:'🤝',title:'Friendly Explorer',desc:'Grow any explorer friendship by 2.',target:2,reward:40,read:s=>Math.max(s.npcFriendship?.nova||0,s.npcFriendship?.gear||0,s.npcFriendship?.moss||0)},
  {id:'luma-bond',icon:'💜',title:'Buddy Time',desc:'Grow Luma Bond by 2.',target:2,reward:38,read:s=>s.lumaBond||0,requires:s=>s.lumaRescued},
  {id:'build-base',icon:'🏗️',title:'Moon Maker',desc:'Build a Moon Base module.',target:1,reward:50,read:s=>(s.baseModules||[]).length,requires:s=>s.launched},
  {id:'codex-find',icon:'📚',title:'Discovery Hunt',desc:'Add a new Codex discovery.',target:1,reward:42,read:s=>(s.codexEntries||[]).length,requires:s=>s.launched},
  {id:'moon-crystals',icon:'💠',title:'Crystal Collector',desc:'Find 6 Moon crystals.',target:6,reward:36,read:s=>s.moonCrystals||0,requires:s=>s.launched}
];
const defaults=()=>({serial:0,completed:0,active:[],history:[]});
function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},d=defaults();
  const active=Array.isArray(r.active)?r.active.filter(x=>x&&safeIds.includes(x.id)).slice(0,3).map(x=>({
    id:x.id,start:DBX.util.int(x.start,0,999999999,0),done:DBX.util.bool(x.done,false)
  })):[];
  return {
    serial:DBX.util.int(r.serial,0,999999,0),
    completed:DBX.util.int(r.completed,0,9999,0),
    active,
    history:DBX.util.list(r.history,safeIds,24)
  };
}
function load(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function eligible(){
  return catalog.filter(c=>!c.requires||c.requires(DBX.state));
}
function seedValue(){
  const s=DBX.state;
  return (s.eventWins||0)*17+(s.baseModules?.length||0)*23+(s.codexEntries?.length||0)*31+(DBX.odyssey.meta.rank||1)*11+state.serial*7;
}
function pickDeck(){
  const pool=eligible(),chosen=[],used=new Set();
  let seed=seedValue();
  for(let i=0;i<3&&used.size<pool.length;i++){
    let idx=Math.abs((seed+i*13)%pool.length),guard=0;
    while(used.has(pool[idx].id)&&guard++<pool.length)idx=(idx+1)%pool.length;
    const c=pool[idx];used.add(c.id);
    chosen.push({id:c.id,start:c.read(DBX.state),done:false});
  }
  state.active=chosen;state.serial++;save();
}
function def(id){return catalog.find(c=>c.id===id)}
function progress(card){
  const c=def(card.id);if(!c)return {value:0,target:1,pct:0,complete:false};
  const delta=Math.max(0,c.read(DBX.state)-card.start),value=Math.min(c.target,delta);
  return {value,target:c.target,pct:Math.round(value/c.target*100),complete:value>=c.target};
}
function ensure(){
  state.active=state.active.filter(x=>def(x.id)&&(!def(x.id).requires||def(x.id).requires(DBX.state)));
  if(state.active.length<3)pickDeck();
}
function complete(card){
  if(card.done)return;
  const c=def(card.id),p=progress(card);if(!c||!p.complete)return;
  card.done=true;state.completed++;state.history.push(card.id);state.history=state.history.slice(-24);save();
  DBX.state.stars=(DBX.state.stars||0)+3;DBX.state.gems=(DBX.state.gems||0)+1;DBX.storage.save();
  DBX.odyssey.addXP(c.reward,'Adventure Deck: '+c.title);
  DBX.fx?.flash?.(.3);DBX.audio?.success?.();
  DBX.ui.toast(c.icon+' '+c.title+' complete','+3 ⭐  +1 💎  +'+c.reward+' Odyssey XP');
  setTimeout(()=>replaceCompleted(),350);
}
function replaceCompleted(){
  const remaining=state.active.filter(x=>!x.done),pool=eligible().filter(c=>!remaining.some(x=>x.id===c.id));
  while(remaining.length<3&&pool.length){
    const idx=Math.abs((seedValue()+remaining.length*19)%pool.length);
    const c=pool.splice(idx,1)[0];remaining.push({id:c.id,start:c.read(DBX.state),done:false});
    state.serial++;
  }
  state.active=remaining;save();renderChip();
}
function tick(){
  ensure();
  for(const card of state.active)complete(card);
  renderChip();
}
function open(){
  ensure();
  const cards=state.active.map(card=>{
    const c=def(card.id),p=progress(card);
    return '<article class="deck-card '+(p.complete?'ready':'')+'"><span>'+c.icon+'</span><div><strong>'+c.title+'</strong><p>'+c.desc+'</p><i><b style="width:'+p.pct+'%"></b></i><small>'+p.value+' / '+p.target+' · '+c.reward+' Odyssey XP</small></div></article>';
  }).join('');
  DBX.ui.openModal(
    '<div class="deck-head"><div><small>DREAMBOUND LIVING ADVENTURES</small><h2>🎴 Adventure Deck</h2></div><b>'+state.completed+' COMPLETE</b></div>'+
    '<p>The Adventure Director continuously deals goals from the systems you have unlocked. No timer, no failure, no pressure.</p>'+
    '<div class="deck-list">'+cards+'</div>'+
    '<div class="deck-footer"><span>🌱 Goals adapt to unlocked systems</span><span>🔒 Local-only progress</span><span>💜 Mistakes never remove rewards</span></div>'+
    '<button id="deckClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#deckClose').onclick=DBX.ui.closeModal;
}
function renderChip(){
  const btn=document.querySelector('#vnextDeckBtn');if(!btn)return;
  const done=state.active.filter(x=>progress(x).complete).length;
  btn.innerHTML='🎴 DECK <b>'+done+'/3</b>';
  btn.classList.toggle('ready',done>0);
}
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextDeckBtn')){
  const b=document.createElement('button');b.id='vnextDeckBtn';b.className='deck-chip';b.onclick=open;hud.appendChild(b);
}
DBX.events.on('hud:update',tick);
DBX.events.on('worldevent:end',tick);
DBX.events.on('quest:complete',tick);
DBX.events.on('scene:changed',tick);
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();pickDeck();renderChip()});
DBX.adventureDeck={state,catalog,open,tick,progress};
ensure();tick();
setInterval(tick,1800);
})();