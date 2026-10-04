(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.npcs||!DBX.world||!DBX.ui)return;

const KEY='dreambound-vnext-npc-routines-v1';
const routineIds=['nova-nav','nova-observe','gear-rover','gear-base','moss-biology','moss-crystals'];
const defaults=()=>({seen:[],helped:[],routineTicks:0});
function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  return {
    seen:DBX.util.list(r.seen,routineIds,routineIds.length),
    helped:DBX.util.list(r.helped,routineIds,routineIds.length),
    routineTicks:DBX.util.int(r.routineTicks,0,999999,0)
  };
}
function load(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const routines={
  nova:[
    {id:'nova-nav',label:'NAVIGATION SHIFT',place:'Mission Control',x:520,y:470,when:()=>!DBX.state.launched,
      line:'I am checking the launch corridor. Every safe journey starts with a careful route.'},
    {id:'nova-observe',label:'CONSTELLATION WATCH',place:'Crystal Ridge',x:1600,y:650,when:()=>DBX.state.launched,
      line:'The constellations look different after each world event. I am logging the changes.'}
  ],
  gear:[
    {id:'gear-rover',label:'ROVER SERVICE',place:'Rover Bay',x:1080,y:760,when:()=>!DBX.state.roverUnlocked,
      line:'I am tuning the rover controls so they stay smooth and easy to use.'},
    {id:'gear-base',label:'BASE INSPECTION',place:'Moon Base Plateau',x:1370,y:1010,when:()=>DBX.state.roverUnlocked,
      line:'I am checking the base modules. A good outpost should feel safe, bright, and ready.'}
  ],
  moss:[
    {id:'moss-biology',label:'LUNAR BIOLOGY',place:'Moon Garden',x:1450,y:700,when:()=>!DBX.worldSystems?.state.weatherDiscoveries?.includes('crystal-glow'),
      line:'I am watching how the lunar garden responds to changing light.'},
    {id:'moss-crystals',label:'CRYSTAL STUDY',place:'Crystal Ridge',x:1660,y:760,when:()=>DBX.worldSystems?.state.weatherDiscoveries?.includes('crystal-glow'),
      line:'Crystal Glow is active. This is the perfect time to study the ridge.'}
  ]
};

function currentRoutine(id){
  const list=routines[id]||[];
  return list.find(r=>r.when())||list[0];
}
function contextualLine(npc,routine){
  const s=DBX.state;
  if(DBX.worldEvents?.runtime?.active)return npc.name+' is helping monitor '+DBX.worldEvents.runtime.active.title.replace(/^\S+\s/,'')+'.';
  if(DBX.storyArcs?.state?.started&&!DBX.storyArcs.state.complete)return 'I heard about the Startrail Mystery. '+npc.name+' thinks you should keep following the clues.';
  if(DBX.worldSystems?.state?.weather==='crystal-glow')return 'The Crystal Glow is strong right now. '+npc.name+' is watching how the world reacts.';
  if((s.baseModules||[]).length>=4)return 'Your Moon Base is fully built. '+npc.name+' is impressed by how much the outpost has grown.';
  return routine.line;
}
function routinePos(npc,t){
  const r=currentRoutine(npc.id),pulse=Math.sin(t/6000+npc.id.length);
  return {x:r.x+pulse*34,y:r.y+Math.cos(t/5200+npc.id.length)*24,routine:r};
}
function openRoutine(npc){
  const r=currentRoutine(npc.id),friendship=DBX.state.npcFriendship?.[npc.id]||0;
  if(!state.seen.includes(r.id)){state.seen.push(r.id);save();DBX.odyssey?.addXP?.(8,'NPC routine discovered')}
  DBX.ui.openModal(
    '<h2>'+npc.icon+' '+npc.name+'</h2>'+
    '<div class="npc-role">'+npc.role+' · '+r.label+'</div>'+
    '<div class="npc-dialogue">“'+contextualLine(npc,r)+'”</div>'+
    '<p><b>Current location:</b> '+r.place+'</p>'+
    '<p><b>Friendship:</b> '+friendship+'/10</p>'+
    '<button id="npcRoutineHelp" class="primary-btn">'+(state.helped.includes(r.id)?'HELPED TODAY':'LEND A HAND')+'</button>'+
    '<button id="npcRoutineClose" class="small-btn">KEEP EXPLORING</button>'
  );
  const help=document.querySelector('#npcRoutineHelp');
  help.onclick=()=>{
    if(state.helped.includes(r.id)){DBX.ui.toast('Already helped','You already helped with this routine.');return};
    state.helped.push(r.id);save();
    DBX.state.stars=(DBX.state.stars||0)+2;
    DBX.state.npcFriendship[npc.id]=Math.min(10,(DBX.state.npcFriendship[npc.id]||0)+1);
    DBX.storage.save();DBX.odyssey?.addXP?.(14,'Helped '+npc.name);
    DBX.ui.toast('Teamwork complete','+2 ⭐  +1 friendship  +14 Odyssey XP');
    DBX.ui.closeModal();
  };
  document.querySelector('#npcRoutineClose').onclick=DBX.ui.closeModal;
}
function nearest(){
  if(DBX.scene?.id==='station')return null;
  const p=DBX.state.player,t=performance.now();
  return DBX.npcs.definitions.map(n=>{
    const q=routinePos(n,t);
    return {...n,x:q.x,y:q.y,routine:q.routine,d:Math.hypot(p.x-q.x,p.y-q.y),action:'npc-routine',hint:q.routine.label+' · Check in'};
  }).sort((a,b)=>a.d-b.d)[0]||null;
}
function draw(ctx,t){
  if(DBX.scene?.id==='station')return;
  ctx.save();
  for(const n of DBX.npcs.definitions){
    const q=routinePos(n,t),r=q.routine;
    ctx.fillStyle='rgba(18,22,55,.18)';ctx.beginPath();ctx.ellipse(q.x,q.y+25,24,8,0,0,Math.PI*2);ctx.fill();
    ctx.font='34px serif';ctx.textAlign='center';ctx.fillText(n.icon,q.x,q.y+Math.sin(t/350+n.id.length)*3);
    ctx.font='900 10px system-ui';ctx.lineWidth=4;ctx.strokeStyle='#292c61';ctx.fillStyle='#fff';
    ctx.strokeText(n.name,q.x,q.y-31);ctx.fillText(n.name,q.x,q.y-31);
    ctx.font='800 8px system-ui';ctx.fillStyle='#d7d0ff';ctx.fillText(r.label,q.x,q.y+44);
  }
  ctx.restore();
}
function tick(){
  state.routineTicks=Math.min(999999,state.routineTicks+1);
  if(state.routineTicks%40===0)save();
}

const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),npc=nearest();
  if(!npc)return base;if(!base)return npc;
  return npc.d<base.d?npc:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{if(o?.action==='npc-routine'){openRoutine(o);return}oldInteract(o)};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.livingNpcs={state,routines,currentRoutine,contextualLine,nearest,draw,tick,openRoutine};
})();