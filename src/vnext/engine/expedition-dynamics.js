(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world||!DBX.ui||!DBX.expeditions)return;

const KEY='dreambound-expedition-dynamics-v1';
const ROOM_IDS=['moonflower-vault','maker-core','ocean-observatory'];
const defaults=()=>({relays:{'moonflower-vault':0,'maker-core':0,'ocean-observatory':0},teamAssists:0,completed:[]});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},relays={};
  for(const id of ROOM_IDS)relays[id]=DBX.util.int(r.relays?.[id],0,3,0);
  return {
    relays,
    teamAssists:DBX.util.int(r.teamAssists,0,999,0),
    completed:DBX.util.list(r.completed,ROOM_IDS,ROOM_IDS.length)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const defs={
  'moonflower-vault':{icon:'✨',name:'Moonlight Relay',helper:'nova',helperName:'Nova',accent:'#c38cff'},
  'maker-core':{icon:'⚙️',name:'Gear Relay',helper:'gear',helperName:'Gear',accent:'#73e5d8'},
  'ocean-observatory':{icon:'🌊',name:'Sonar Relay',helper:'moss',helperName:'Moss',accent:'#65d8ff'}
};

function activeRoom(){
  const id=DBX.scene?.id||'surface';
  return ROOM_IDS.includes(id)?id:null;
}
function relayPosition(id,t=performance.now()){
  const index=state.relays[id]||0;
  const phase=t/900+(index*1.7);
  return {
    x:520+Math.cos(phase)*210,
    y:380+Math.sin(phase*.83)*145
  };
}
function relayCandidate(){
  const id=activeRoom();if(!id||state.completed.includes(id))return null;
  const pos=relayPosition(id),p=DBX.state.player,def=defs[id];
  return {
    id:'relay-'+id,name:def.name,icon:def.icon,x:pos.x,y:pos.y,
    d:Math.hypot(p.x-pos.x,p.y-pos.y),action:'expedition-relay',
    hint:'Catch the moving relay and sync with your team.'
  };
}
function completeDynamic(id){
  if(state.completed.includes(id))return;
  state.completed.push(id);state.teamAssists++;save();
  DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+6);
  DBX.state.gems=Math.min(9999,(DBX.state.gems||0)+2);
  const def=defs[id];
  DBX.state.npcFriendship=DBX.state.npcFriendship||{nova:0,gear:0,moss:0};
  DBX.state.npcFriendship[def.helper]=Math.min(10,(DBX.state.npcFriendship[def.helper]||0)+1);
  DBX.state.lumaBond=Math.min(10,(DBX.state.lumaBond||0)+.5);
  DBX.storage.save();DBX.odyssey?.addXP?.(55,'Expedition teamwork relay');
  DBX.companion?.emote?.('💜');DBX.audio?.success?.();DBX.fx?.flash?.(.35);
  DBX.events.emit('story:beat',{label:'TEAM RELAY COMPLETE',title:def.name});
  DBX.ui.toast(def.name+' stabilized','+6 ⭐  +2 💎 · '+def.helperName+' and Luma helped.');
  DBX.events.emit('hud:update');
}
function activateRelay(id){
  if(!ROOM_IDS.includes(id)||state.completed.includes(id))return;
  const next=Math.min(3,(state.relays[id]||0)+1);
  state.relays[id]=next;save();
  DBX.companion?.emote?.(next===3?'💜':'✨');
  DBX.audio?.collect?.();DBX.fx?.flash?.(.12);
  if(next>=3){completeDynamic(id);return;}
  DBX.ui.toast('Relay synchronized '+next+'/3','It moved again—follow the glow with Luma.');
}
function draw(ctx,t){
  const id=activeRoom();if(!id||state.completed.includes(id))return;
  const pos=relayPosition(id,t),def=defs[id],step=state.relays[id]||0;
  ctx.save();
  const pulse=(DBX.accessibility?.shouldAnimate?.()??true)?1+Math.sin(t/220)*.12:1;
  ctx.translate(pos.x,pos.y);ctx.scale(pulse,pulse);
  const aura=ctx.createRadialGradient(0,0,8,0,0,58);
  aura.addColorStop(0,def.accent+'66');aura.addColorStop(1,def.accent+'00');
  ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,58,0,Math.PI*2);ctx.fill();
  ctx.shadowColor=def.accent;ctx.shadowBlur=26;ctx.font='40px serif';ctx.textAlign='center';ctx.fillText(def.icon,0,8);
  ctx.shadowBlur=0;ctx.font='900 8px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText('TEAM RELAY '+step+'/3',0,36);
  ctx.restore();

  const room=DBX.expeditions.rooms.find(r=>r.id===id);
  if(room){
    ctx.save();ctx.globalAlpha=.7;ctx.strokeStyle=room.accent;ctx.setLineDash([8,10]);ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(520,420);ctx.lineTo(pos.x,pos.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
}
function helperGhost(ctx,t){
  const id=activeRoom();if(!id)return;
  const def=defs[id],npc=DBX.npcs?.definitions?.find(n=>n.id===def.helper);
  if(!npc)return;
  const x=730+Math.sin(t/700)*18,y=500+Math.cos(t/760)*10;
  ctx.save();ctx.globalAlpha=.8;ctx.font='31px serif';ctx.textAlign='center';ctx.fillText(npc.icon,x,y);
  ctx.font='800 8px system-ui';ctx.fillStyle='#dce7ff';ctx.fillText(def.helperName.toUpperCase()+' // TEAM SUPPORT',x,y+32);ctx.restore();
}
function openStatus(){
  const rows=ROOM_IDS.map(id=>{
    const def=defs[id],done=state.completed.includes(id),count=state.relays[id]||0;
    return '<article class="dynamic-row '+(done?'complete':'')+'"><span>'+def.icon+'</span><div><strong>'+def.name+'</strong><small>'+count+'/3 RELAYS · '+(done?'TEAM COMPLETE':'ACTIVE INSIDE '+id.toUpperCase())+'</small></div><b>'+(done?'✓':count+'/3')+'</b></article>';
  }).join('');
  DBX.ui.openModal(
    '<section class="dynamic-panel"><div class="dynamic-kicker">LIVE EXPEDITION OBJECTIVES</div><h2>🤝 Team Relay Network</h2>'+
    '<p>Moving relay objectives now make expedition rooms active spaces. Follow the relay, catch it three times, and complete the room with Luma plus an NPC partner.</p>'+
    '<div class="dynamic-list">'+rows+'</div>'+
    '<div class="guardian-stats"><span>TEAM RELAYS <b>'+state.completed.length+'/3</b></span><span>TEAM ASSISTS <b>'+state.teamAssists+'</b></span></div>'+
    '<button id="dynamicClose" class="primary-btn">BACK TO WORLD</button></section>'
  );
  document.querySelector('#dynamicClose').onclick=DBX.ui.closeModal;
}

const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),relay=relayCandidate();
  if(!relay)return base;if(!base)return relay;
  return relay.d<base.d?relay:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='expedition-relay'){
    const id=String(o.id||'').replace('relay-','');
    activateRelay(id);return;
  }
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t);helperGhost(ctx,t);};

const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextTeamRelays')){
  const b=document.createElement('button');b.id='vnextTeamRelays';b.textContent='🤝 RELAYS';b.onclick=openStatus;actions.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();});
DBX.expeditionDynamics={state,defs,relayPosition,openStatus};
})();