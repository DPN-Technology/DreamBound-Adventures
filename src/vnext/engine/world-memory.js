(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.simulation||!DBX.events||!DBX.ui)return;

const KEY='dreambound-v2-world-memory-v1';
const MEMORY_TYPES=['story','chain','ecology','environment','traversal','social','discovery'];
const defaults=()=>({memories:[],echoes:[],callbacks:0,lastEchoTick:-999});
function cleanText(v,max=96){return String(v||'').replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,max)}
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const memories=Array.isArray(r.memories)?r.memories.slice(-36).map(m=>({
    id:cleanText(m?.id,48),
    type:MEMORY_TYPES.includes(m?.type)?m.type:'discovery',
    title:cleanText(m?.title,72),
    zone:cleanText(m?.zone,32),
    strength:DBX.util.int(m?.strength,1,100,20),
    tick:DBX.util.int(m?.tick,0,999999999,0)
  })).filter(m=>m.id&&m.title):[];
  return {
    memories,
    echoes:DBX.util.list(r.echoes,['ridge-remembers','hollow-remembers','base-remembers','story-remembers','journey-remembers'],12),
    callbacks:DBX.util.int(r.callbacks,0,999999,0),
    lastEchoTick:DBX.util.int(r.lastEchoTick,-999,999999999,-999)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={seenSignalCount:0,lastNarrative:null};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function remember(id,type,title,zone,strength=40){
  if(!MEMORY_TYPES.includes(type))type='discovery';
  const existing=state.memories.find(m=>m.id===id);
  if(existing){
    existing.strength=Math.min(100,existing.strength+8);
    existing.tick=DBX.simulation.state.tick;save();return existing;
  }
  const m={id:cleanText(id,48),type,title:cleanText(title,72),zone:cleanText(zone,32),strength:DBX.util.int(strength,1,100,40),tick:DBX.simulation.state.tick};
  if(!m.id||!m.title)return null;
  state.memories.push(m);state.memories=state.memories.slice(-36);save();
  return m;
}
function scan(){
  const sim=DBX.simulation.status();
  for(const sig of sim.recentSignals||[]){
    const id=sig.type+'-'+sig.zone;
    const title=sig.type.replace(/-/g,' ')+' · '+sig.zone.replace(/-/g,' ');
    const type=sig.type.includes('story')?'story':sig.type.includes('chain')?'chain':sig.type.includes('ecology')?'ecology':sig.type.includes('environment')?'environment':sig.type.includes('traversal')?'traversal':sig.type.includes('actor')?'social':'discovery';
    remember(id,type,title,sig.zone,sig.strength||30);
  }
  if(DBX.storyArcs?.state.complete)remember('startrail-complete','story','The Startrail Mystery was solved','crystal-ridge',90);
  for(const c of DBX.systemicChains?.state.completed||[])remember('chain-'+c,'chain',c.replace(/-/g,' '),'moon-base',75);
  for(const e of DBX.emergentEcology?.state.recentEvents||[])remember('ecology-'+e,'ecology',e.replace(/-/g,' '),DBX.simulation.zoneOf(),55);
  for(const d of DBX.environmentNetwork?.state.discoveries||[])remember('env-'+d.toLowerCase().replace(/\s+/g,'-'),'environment',d,DBX.simulation.zoneOf(),60);
  for(const d of DBX.traversal?.state.discoveries||[])remember('travel-'+d,'traversal',d.replace(/-/g,' '),DBX.simulation.zoneOf(),50);
}
function strongest(zone=null){
  return [...state.memories]
    .filter(m=>!zone||m.zone===zone)
    .sort((a,b)=>(b.strength+(b.tick/1000000))-(a.strength+(a.tick/1000000)))[0]||null;
}
function narrativeContext(){
  const zone=DBX.simulation.zoneOf(),local=strongest(zone),global=strongest();
  const m=local||global;
  if(!m)return null;
  const lines={
    story:'This place feels connected to '+m.title+'.',
    chain:'Your earlier work on '+m.title+' still shapes the world here.',
    ecology:'The world remembers '+m.title+' and the friendships around it.',
    environment:'Your discovery of '+m.title+' still influences local exploration.',
    traversal:'That journey through '+m.title+' changed how this route feels.',
    social:'The relationships built here are still affecting what happens next.',
    discovery:'Something you discovered before is echoing into this part of the adventure.'
  };
  return {memory:m,text:lines[m.type]||lines.discovery};
}
function maybeEcho(){
  const tick=DBX.simulation.state.tick;
  if(tick-state.lastEchoTick<36)return;
  const ctx=narrativeContext();if(!ctx||ctx.memory.strength<50)return;
  state.lastEchoTick=tick;state.callbacks++;save();
  runtime.lastNarrative=ctx;
  DBX.events.emit('story:beat',{label:'WORLD MEMORY',title:ctx.text});
  DBX.simulation.emit('memory-echo',DBX.simulation.zoneOf(),Math.min(80,ctx.memory.strength));
}
function adaptiveHint(){
  const ctx=narrativeContext();if(!ctx)return null;
  return '💭 '+ctx.text;
}
function open(){
  scan();
  const memories=[...state.memories].sort((a,b)=>b.tick-a.tick).slice(0,12);
  DBX.ui.openModal(
    '<h2>💭 World Memory</h2>'+
    '<p>DreamBound now remembers important local events and uses those memories to shape future narrative callbacks.</p>'+
    '<div class="director-score">MEMORIES <b>'+state.memories.length+'</b></div>'+
    '<div class="friend-roster"><strong>RECENT WORLD MEMORIES</strong>'+
      (memories.length?memories.map(m=>'<span>'+m.type.toUpperCase()+' · '+m.title+' · '+m.strength+'</span>').join(''):'<span>The world is still building its history.</span>')+
    '</div>'+
    '<small>'+state.callbacks+' adaptive narrative callbacks have been generated.</small>'+
    '<button id="memoryClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#memoryClose').onclick=DBX.ui.closeModal;
}
DBX.events.on('simulation:snapshot',()=>{scan();maybeEcho()});
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());runtime.lastNarrative=null;save()});
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextMemoryBtn')){
  const b=document.createElement('button');b.id='vnextMemoryBtn';b.className='deck-chip';b.textContent='💭 MEMORY';b.onclick=open;hud.appendChild(b);
}
DBX.worldMemory={state,runtime,remember,scan,strongest,narrativeContext,adaptiveHint,maybeEcho,open};
})();