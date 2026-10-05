(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world||!DBX.ui||!DBX.expeditions)return;

const KEY='dreambound-expedition-motion-v1';
const ROOM_IDS=['moonflower-vault','maker-core','ocean-observatory'];
const defaults=()=>({checkpoints:{},chains:[],resets:0});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},checkpoints={};
  for(const id of ROOM_IDS)checkpoints[id]=DBX.util.int(r.checkpoints?.[id],0,3,0);
  return {
    checkpoints,
    chains:DBX.util.list(r.chains,ROOM_IDS,ROOM_IDS.length),
    resets:DBX.util.int(r.resets,0,9999,0)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const defs={
  'moonflower-vault':{
    accent:'#c38cff',icon:'🌙',
    platforms:[{baseX:330,baseY:500,ampX:90,ampY:0,speed:.8},{baseX:560,baseY:350,ampX:0,ampY:95,speed:1.05},{baseX:760,baseY:500,ampX:80,ampY:35,speed:.72}],
    hazard:{x:500,y:600,r:72,icon:'💫'},
    checkpoints:[{x:315,y:480},{x:555,y:330},{x:755,y:470}]
  },
  'maker-core':{
    accent:'#73e5d8',icon:'⚙️',
    platforms:[{baseX:320,baseY:485,ampX:110,ampY:0,speed:.9},{baseX:540,baseY:365,ampX:70,ampY:30,speed:.8},{baseX:765,baseY:480,ampX:0,ampY:95,speed:1.1}],
    hazard:{x:520,y:585,r:75,icon:'⚡'},
    checkpoints:[{x:320,y:460},{x:545,y:345},{x:765,y:455}]
  },
  'ocean-observatory':{
    accent:'#65d8ff',icon:'🌊',
    platforms:[{baseX:330,baseY:500,ampX:70,ampY:25,speed:.72},{baseX:545,baseY:360,ampX:95,ampY:0,speed:.86},{baseX:760,baseY:500,ampX:60,ampY:50,speed:.76}],
    hazard:{x:520,y:600,r:78,icon:'🫧'},
    checkpoints:[{x:325,y:475},{x:545,y:340},{x:760,y:470}]
  }
};

function roomId(){
  const id=DBX.scene?.id||'surface';
  return ROOM_IDS.includes(id)?id:null;
}
function platformPos(def,p,t,index){
  const phase=t/1000*p.speed+index*1.3;
  return {
    x:p.baseX+Math.cos(phase)*p.ampX,
    y:p.baseY+Math.sin(phase)*p.ampY
  };
}
function nearCheckpoint(id){
  const def=defs[id],idx=state.checkpoints[id]||0;
  if(idx>=3)return null;
  const cp=def.checkpoints[idx],p=DBX.state.player;
  return {
    id:'motion-check-'+id,
    name:'Motion Checkpoint '+(idx+1),
    icon:def.icon,x:cp.x,y:cp.y,
    d:Math.hypot(p.x-cp.x,p.y-cp.y),
    action:'motion-checkpoint',
    hint:'Reach and activate this safe traversal checkpoint.'
  };
}
function resetPlayer(id){
  state.resets++;save();
  const idx=Math.max(0,(state.checkpoints[id]||0)-1);
  const cp=defs[id].checkpoints[idx]||{x:210,y:560};
  DBX.state.player.x=cp.x;DBX.state.player.y=cp.y;
  DBX.companion?.emote?.('💜');
  DBX.fx?.flash?.(.1);DBX.audio?.click?.();
  DBX.ui.toast('Safe reset','No progress lost. You returned to the last checkpoint.');
}
function update(dt,t){
  const id=roomId();if(!id)return;
  const def=defs[id],p=DBX.state.player,h=def.hazard;
  const dangerPulse=18+Math.sin(t/260)*8;
  if(Math.hypot(p.x-h.x,p.y-h.y)<h.r-dangerPulse*.3){
    resetPlayer(id);
  }
}
function activateCheckpoint(id){
  const idx=state.checkpoints[id]||0;
  if(idx>=3)return;
  state.checkpoints[id]=idx+1;
  if(state.checkpoints[id]>=3&&!state.chains.includes(id))state.chains.push(id);
  save();
  DBX.audio?.success?.();DBX.fx?.flash?.(.15);DBX.companion?.emote?.('✨');
  if(state.checkpoints[id]>=3){
    DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+5);
    DBX.storage.save();DBX.odyssey?.addXP?.(40,'Motion chain complete');
    DBX.ui.toast('Motion chain complete','+5 ⭐ · This room’s traversal path is mastered.');
  }else{
    DBX.ui.toast('Checkpoint reached',state.checkpoints[id]+'/3 in this room.');
  }
  DBX.events.emit('hud:update');
}
function draw(ctx,t){
  const id=roomId();if(!id)return;
  const def=defs[id],animate=DBX.accessibility?.shouldAnimate?.()??true;
  ctx.save();
  def.platforms.forEach((p,i)=>{
    const pos=platformPos(def,p,t,i);
    ctx.fillStyle='rgba(255,255,255,.07)';ctx.beginPath();ctx.roundRect(pos.x-58,pos.y-18,116,36,14);ctx.fill();
    ctx.strokeStyle=def.accent;ctx.lineWidth=2;ctx.stroke();
    ctx.font='18px serif';ctx.textAlign='center';ctx.fillText('⬢',pos.x,pos.y+6);
  });
  const h=def.hazard,pulse=animate?1+Math.sin(t/250)*.08:1;
  ctx.save();ctx.translate(h.x,h.y);ctx.scale(pulse,pulse);
  const aura=ctx.createRadialGradient(0,0,8,0,0,h.r);
  aura.addColorStop(0,def.accent+'44');aura.addColorStop(1,def.accent+'00');
  ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,h.r,0,Math.PI*2);ctx.fill();
  ctx.font='38px serif';ctx.fillText(h.icon,0,8);
  ctx.restore();
  const idx=state.checkpoints[id]||0;
  def.checkpoints.forEach((cp,i)=>{
    ctx.globalAlpha=i<=idx?1:.35;
    ctx.strokeStyle=def.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cp.x,cp.y,18,0,Math.PI*2);ctx.stroke();
    ctx.font='18px serif';ctx.fillText(i<idx?'✓':'◇',cp.x,cp.y+6);
  });
  ctx.restore();
}
function open(){
  const rows=ROOM_IDS.map(id=>{
    const count=state.checkpoints[id]||0,done=state.chains.includes(id);
    return '<article class="motion-row '+(done?'complete':'')+'"><span>'+defs[id].icon+'</span><div><strong>'+id.replace(/-/g,' ').toUpperCase()+'</strong><small>'+count+'/3 CHECKPOINTS · '+(done?'MASTERED':'ACTIVE')+'</small></div><b>'+(done?'✓':count+'/3')+'</b></article>';
  }).join('');
  DBX.ui.openModal(
    '<section class="motion-panel"><div class="motion-kicker">KINETIC EXPEDITION LAYER</div><h2>🧩 Motion Chains</h2>'+
    '<p>Rooms now include moving platforms and safe-reset hazard zones. Reach three checkpoints in each room; mistakes never remove progress.</p>'+
    '<div class="motion-list">'+rows+'</div>'+
    '<div class="guardian-stats"><span>ROOM CHAINS <b>'+state.chains.length+'/3</b></span><span>SAFE RESETS <b>'+state.resets+'</b></span></div>'+
    '<button id="motionClose" class="primary-btn">BACK TO WORLD</button></section>'
  );
  document.querySelector('#motionClose').onclick=DBX.ui.closeModal;
}
const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),id=roomId(),cp=id?nearCheckpoint(id):null;
  if(!cp)return base;if(!base)return cp;
  return cp.d<base.d?cp:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='motion-checkpoint'){
    const id=String(o.id||'').replace('motion-check-','');
    if(ROOM_IDS.includes(id))activateCheckpoint(id);
    return;
  }
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t);};
const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextMotion')){
  const b=document.createElement('button');b.id='vnextMotion';b.textContent='🧩 MOTION';b.onclick=open;actions.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();});
DBX.expeditionMotion={state,defs,update,open};
})();