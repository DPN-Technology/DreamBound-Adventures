(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX)return;

const definitions=[
  {id:'meteor-shower',title:'☄️ Meteor Shower',subtitle:'Fresh science samples are landing on the Moon.',duration:42,color:'#ffb56b',reward:{stars:6,gems:3,crystals:3}},
  {id:'crystal-bloom',title:'💎 Crystal Bloom',subtitle:'Dream crystals are glowing across the lunar basin.',duration:46,color:'#8ff8ff',reward:{stars:5,gems:2,crystals:5}},
  {id:'aurora-wave',title:'🌌 Aurora Wave',subtitle:'A rare ribbon of light is sweeping over the ridge.',duration:38,color:'#a98cff',reward:{stars:7,gems:3,crystals:2}},
  {id:'luma-parade',title:'🐇 Luma Star Parade',subtitle:'Follow Luma’s sparkling trail before it fades.',duration:40,color:'#ff9bd1',reward:{stars:6,gems:4,crystals:2}}
];
const runtime={active:null,time:0,nextIn:12,nodes:[],serial:0};

function available(){
  if(!DBX.state.launched)return [];
  return definitions.filter(d=>d.id!=='luma-parade'||DBX.state.lumaRescued);
}
function begin(){
  const pool=available();if(!pool.length){runtime.nextIn=15;return}
  const def=pool[runtime.serial++%pool.length];
  runtime.active=def;runtime.time=def.duration;runtime.nodes=makeNodes(def.id);
  DBX.audio?.magic();DBX.fx?.flash(.28);DBX.fx?.burst(DBX.state.player.x,DBX.state.player.y,def.title.split(' ')[0]);
  DBX.events.emit('worldevent:start',def);updateBanner();
}
function makeNodes(id){
  const sets={
    'meteor-shower':[[1350,940,'☄️'],[1475,1040,'🪨'],[1650,930,'☄️'],[1730,760,'🪨']],
    'crystal-bloom':[[1320,1030,'💎'],[1410,900,'🔷'],[1510,1005,'💎'],[1620,875,'🔷'],[1730,1030,'💎']],
    'aurora-wave':[[1380,720,'🌌'],[1530,690,'✨'],[1680,720,'🌌']],
    'luma-parade':[[1325,835,'⭐'],[1435,865,'✨'],[1545,825,'⭐'],[1655,865,'✨'],[1740,820,'⭐']]
  };
  return (sets[id]||[]).map((n,i)=>({id:id+'-'+i,x:n[0],y:n[1],icon:n[2],taken:false}));
}
function update(dt){
  if(runtime.active){
    runtime.time-=dt;
    if(runtime.time<=0)finish(false);
  }else{
    runtime.nextIn-=dt;
    if(runtime.nextIn<=0)begin();
  }
  updateBanner();
}
function finish(success){
  const def=runtime.active;if(!def)return;
  if(success){
    const r=def.reward;
    DBX.state.stars+=r.stars;DBX.state.gems+=r.gems;DBX.state.moonCrystals+=r.crystals;DBX.state.eventWins+=1;
    if(!DBX.state.completedWorldEvents.includes(def.id))DBX.state.completedWorldEvents.push(def.id);
    if(def.id==='meteor-shower'){DBX.state.meteorSamples=Math.min(99,(DBX.state.meteorSamples||0)+1);addCodex('Meteor shard')}
    if(def.id==='crystal-bloom')addCodex('Moon crystal');
    if(def.id==='aurora-wave'){DBX.state.auroraSeen=true;addCodex('Aurora ribbon')}
    DBX.storage.save();DBX.events.emit('hud:update');DBX.audio?.success();DBX.fx?.flash(.5);
    DBX.ui?.toast(def.title+' complete','+'+r.stars+' ⭐  +'+r.gems+' 💎  +'+r.crystals+' crystal');
  }else{
    DBX.ui?.toast(def.title+' ended','Another living-world event will appear soon.');
  }
  DBX.events.emit('worldevent:end',{id:def.id,success});
  runtime.active=null;runtime.nodes=[];runtime.time=0;runtime.nextIn=55;
}
function addCodex(entry){
  if(!DBX.state.codexEntries.includes(entry))DBX.state.codexEntries.push(entry);
}
function collect(node){
  if(!runtime.active||node.taken)return;
  node.taken=true;
  DBX.fx?.burst(node.x,node.y,node.icon);DBX.audio?.collect();
  DBX.state.moonCrystals=Math.min(999,(DBX.state.moonCrystals||0)+1);
  DBX.storage.save();DBX.events.emit('hud:update');
  const remaining=runtime.nodes.filter(n=>!n.taken).length;
  DBX.ui?.toast('Event find! '+node.icon,remaining?remaining+' event targets remain.':'All event targets collected!');
  if(!remaining)finish(true);
}
function nearest(){
  if(!runtime.active||DBX.scene?.id==='station')return null;
  const p=DBX.state.player;
  return runtime.nodes.filter(n=>!n.taken).map(n=>({
    ...n,name:runtime.active.title.replace(/^\S+\s/,'')+' Target',action:'world-event-node',
    hint:'Collect this before the event timer ends.',d:Math.hypot(p.x-n.x,p.y-n.y)
  })).sort((a,b)=>a.d-b.d)[0]||null;
}
function draw(ctx,t){
  if(!runtime.active||DBX.scene?.id==='station')return;
  ctx.save();
  if(runtime.active.id==='aurora-wave'){
    const grad=ctx.createLinearGradient(1260,500,1780,780);
    grad.addColorStop(0,'rgba(97,255,215,.06)');grad.addColorStop(.5,'rgba(168,121,255,.22)');grad.addColorStop(1,'rgba(255,111,196,.06)');
    ctx.fillStyle=grad;ctx.fillRect(1250,500,550,390);
  }
  for(const n of runtime.nodes){
    if(n.taken)continue;
    const pulse=1+Math.sin(t/240+n.x)*.08;
    ctx.save();ctx.translate(n.x,n.y);ctx.scale(pulse,pulse);
    ctx.shadowColor=runtime.active.color;ctx.shadowBlur=24;ctx.font='34px serif';ctx.textAlign='center';ctx.fillText(n.icon,0,0);
    ctx.restore();
  }
  ctx.restore();
}
function updateBanner(){
  const box=document.querySelector('#vnextWorldEvent');if(!box)return;
  if(!runtime.active){box.classList.remove('active');box.querySelector('strong').textContent='LIVING WORLD';box.querySelector('span').textContent='Next event in '+Math.max(0,Math.ceil(runtime.nextIn))+'s';return}
  box.classList.add('active');box.querySelector('strong').textContent=runtime.active.title;
  box.querySelector('span').textContent=runtime.active.subtitle+' · '+Math.max(0,Math.ceil(runtime.time))+'s';
}

const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),event=nearest();
  if(!event)return base;if(!base)return event;
  return event.d<base.d?event:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='world-event-node'){const node=runtime.nodes.find(n=>n.id===o.id);if(node)collect(node);return}
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
DBX.worldEvents={runtime,definitions,update,begin,finish};
})();