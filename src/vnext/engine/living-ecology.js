(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world||!DBX.ui)return;

const KEY='dreambound-vnext-ecology-v1';
const creatureIds=['puff','pebble','orbit','glimmer'];
const defs=[
  {id:'puff',name:'Puff',icon:'🦊',kind:'Cloud Fox',color:'#ffd9ef',moon:false,home:[760,860],
   lines:['Puff circles your boots and makes a tiny happy chirp.','Puff watches the clouds like they are secret maps.','Puff bounces twice, then waits for you to lead.']},
  {id:'pebble',name:'Pebble',icon:'🐾',kind:'Moon Rockhopper',color:'#c9c5ff',moon:true,home:[1390,980],
   lines:['Pebble taps the ground and listens for crystal echoes.','Pebble hops between tiny craters with careful little jumps.','Pebble found a shiny pebble and seems very proud.']},
  {id:'orbit',name:'Orbit',icon:'🦋',kind:'Lunar Moth',color:'#8eefff',moon:true,home:[1590,760],
   lines:['Orbit draws a glowing circle in the air.','Orbit rests near the softest moonlight.','Orbit flutters close, then traces a path toward the stars.']},
  {id:'glimmer',name:'Glimmer',icon:'✨',kind:'Star Sprite',color:'#ffe988',moon:true,home:[1710,610],unlock:s=>(s.eventWins||0)>=2,
   lines:['Glimmer sparkles brighter when the world is calm.','Glimmer hides behind a crystal, then peeks back out.','Glimmer leaves a tiny constellation trail behind you.']}
];

const defaults=()=>({bonds:{puff:0,pebble:0,orbit:0,glimmer:0},discovered:[],visits:0});
function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const bonds={};
  for(const id of creatureIds)bonds[id]=DBX.util.int(r.bonds?.[id],0,10,0);
  return {
    bonds,
    discovered:DBX.util.list(r.discovered,creatureIds,creatureIds.length),
    visits:DBX.util.int(r.visits,0,9999,0)
  };
}
function load(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={lastTouch:new Map(),follow:null,followUntil:0};

function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function unlocked(c){return !c.unlock||c.unlock(DBX.state)}
function visible(c){
  if(!unlocked(c))return false;
  if(c.moon&&!DBX.state.launched)return false;
  if(DBX.scene?.id==='station')return false;
  return true;
}
function behavior(c,t){
  const phase=Math.floor((t/7000+c.id.length)%4);
  return ['wander','rest','play','explore'][phase];
}
function position(c,t){
  if(runtime.follow===c.id&&t<runtime.followUntil){
    const p=DBX.state.player;
    return {x:p.x-48+Math.sin(t/350)*12,y:p.y+30+Math.cos(t/420)*8};
  }
  const mode=behavior(c,t),radius=mode==='rest'?18:mode==='play'?55:mode==='explore'?95:70;
  const speed=mode==='rest'?16000:mode==='play'?3200:9000;
  return {
    x:c.home[0]+Math.cos(t/speed+c.id.length)*radius,
    y:c.home[1]+Math.sin(t/(speed*.8)+c.id.charCodeAt(0))*radius*.55
  };
}
function nearest(){
  const p=DBX.state.player,t=performance.now();
  return defs.filter(visible).map(c=>{
    const q=position(c,t);
    return {...c,...q,d:Math.hypot(p.x-q.x,p.y-q.y),action:'creature-bond',
      hint:(state.bonds[c.id]||0)>=7?'Best buddy · Say hello':'Gentle hello · Build a bond'};
  }).sort((a,b)=>a.d-b.d)[0]||null;
}
function addCodex(c){
  const entry=c.kind;
  DBX.state.codexEntries=DBX.state.codexEntries||[];
  if(!DBX.state.codexEntries.includes(entry))DBX.state.codexEntries.push(entry);
}
function interact(c){
  const now=Date.now(),last=runtime.lastTouch.get(c.id)||0;
  let gained=false;
  if(now-last>30000){
    const before=state.bonds[c.id]||0;
    state.bonds[c.id]=Math.min(10,before+1);
    runtime.lastTouch.set(c.id,now);state.visits++;
    if(!state.discovered.includes(c.id))state.discovered.push(c.id);
    if(state.bonds[c.id]>=3)addCodex(c);
    if(state.bonds[c.id]>=5){runtime.follow=c.id;runtime.followUntil=performance.now()+20000}
    save();DBX.storage.save();DBX.events.emit('hud:update');gained=true;
    if(state.bonds[c.id]===5||state.bonds[c.id]===10){
      DBX.state.stars=(DBX.state.stars||0)+3;DBX.storage.save();
      DBX.odyssey?.addXP?.(20,'DreamCreature bond milestone');
    }
  }
  const bond=state.bonds[c.id]||0,line=c.lines[(bond+Math.floor(now/45000))%c.lines.length];
  DBX.ui.openModal(
    '<h2>'+c.icon+' '+c.name+'</h2><div class="npc-role">'+c.kind+' · '+behavior(c,performance.now()).toUpperCase()+'</div>'+
    '<div class="npc-dialogue">“'+line+'”</div>'+
    '<div class="friendship-meter"><span>CREATURE BOND</span><i><b style="width:'+(bond*10)+'%"></b></i><strong>'+bond+'/10</strong></div>'+
    (gained?'<div class="friendship-gain">+1 gentle bond 💜</div>':'<small>This friend remembers you. Come back later for another gentle interaction.</small>')+
    (bond>=5?'<p>🌟 '+c.name+' may follow you for a little while after visits.</p>':'')+
    '<button id="creatureClose" class="primary-btn">KEEP EXPLORING</button>'
  );
  document.querySelector('#creatureClose').onclick=DBX.ui.closeModal;
  DBX.audio?.click?.();DBX.fx?.burst?.(c.x,c.y,c.icon,10);
}
function draw(ctx,t){
  if(DBX.scene?.id==='station')return;
  ctx.save();
  for(const c of defs){
    if(!visible(c))continue;
    const p=position(c,t),mode=behavior(c,t),bob=mode==='rest'?1:Math.sin(t/280+c.id.length)*4;
    ctx.fillStyle='rgba(18,22,55,.16)';ctx.beginPath();ctx.ellipse(p.x,p.y+23,22,7,0,0,Math.PI*2);ctx.fill();
    ctx.shadowColor=c.color;ctx.shadowBlur=state.bonds[c.id]>=5?22:10;
    ctx.font=(mode==='play'?'38':'34')+'px serif';ctx.textAlign='center';ctx.fillText(c.icon,p.x,p.y+bob);
    ctx.shadowBlur=0;ctx.font='900 9px system-ui';ctx.lineWidth=4;ctx.strokeStyle='#292c61';ctx.fillStyle='#fff';
    ctx.strokeText(c.name,p.x,p.y-31);ctx.fillText(c.name,p.x,p.y-31);
    const bond=state.bonds[c.id]||0;
    if(bond>=3){ctx.font='12px serif';ctx.fillText(bond>=7?'💜':'⭐',p.x+21,p.y-17)}
    if(runtime.follow===c.id&&t<runtime.followUntil){ctx.font='10px system-ui';ctx.fillStyle='#fff2a8';ctx.fillText('FOLLOWING',p.x,p.y+43)}
  }
  ctx.restore();
}
const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),creature=nearest();
  if(!creature)return base;if(!base)return creature;
  return creature.d<base.d?creature:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{if(o?.action==='creature-bond'){interact(o);return}oldInteract(o)};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());runtime.follow=null;runtime.lastTouch.clear();save()});
DBX.ecology={defs,state,runtime,nearest,interact,draw,behavior};
})();