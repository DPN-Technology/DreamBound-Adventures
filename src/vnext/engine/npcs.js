(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX)return;
const runtime={lastTalk:new Map(),clock:0};
const definitions=[
  {id:'nova',name:'Nova',icon:'👩‍🚀',color:'#ff86c5',role:'Star Navigator',
   path:[[310,520],[500,460],[690,520],[420,620]],
   lines:['I chart safe routes by watching how the stars move.','Every explorer needs curiosity and a good map.','The Moon changes when you really pay attention.']},
  {id:'gear',name:'Gear',icon:'🧑‍🔧',color:'#ffb66b',role:'Rover Engineer',
   path:[[900,720],[1040,650],[1120,760],[970,820]],
   lines:['A smooth rover is a happy rover.','Build smart, test twice, then explore farther.','That Moon Base could become something amazing.']},
  {id:'moss',name:'Moss',icon:'🧑‍🔬',color:'#7fe7a9',role:'Lunar Biologist',
   path:[[1360,720],[1450,790],[1550,700],[1420,650]],
   lines:['Even the Moon can teach us about living systems.','Luma seems to trust explorers who move gently.','The crystal glow changes during world events.']}
];
function pos(npc,t){
  const idx=Math.floor((t/9000+npc.id.length)%npc.path.length),next=(idx+1)%npc.path.length;
  const f=((t%9000)/9000);
  const a=npc.path[idx],b=npc.path[next];
  return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f};
}
function nearest(){
  if(DBX.scene?.id==='station')return null;
  const p=DBX.state.player,t=performance.now();
  return definitions.map(n=>{const q=pos(n,t);return {...n,...q,d:Math.hypot(p.x-q.x,p.y-q.y),action:'npc-talk',hint:n.role+' · Say hello'}}).sort((a,b)=>a.d-b.d)[0]||null;
}
function draw(ctx,t){
  if(DBX.scene?.id==='station')return;
  ctx.save();
  for(const n of definitions){
    const p=pos(n,t),bob=Math.sin(t/350+n.id.length)*3;
    ctx.fillStyle='rgba(18,22,55,.18)';ctx.beginPath();ctx.ellipse(p.x,p.y+25,24,8,0,0,Math.PI*2);ctx.fill();
    ctx.font='34px serif';ctx.textAlign='center';ctx.fillText(n.icon,p.x,p.y+bob);
    ctx.font='900 10px system-ui';ctx.lineWidth=4;ctx.strokeStyle='#292c61';ctx.fillStyle='#fff';
    ctx.strokeText(n.name,p.x,p.y-31);ctx.fillText(n.name,p.x,p.y-31);
    const friendship=DBX.state.npcFriendship?.[n.id]||0;
    if(friendship>=5){ctx.font='14px serif';ctx.fillText('⭐',p.x+22,p.y-19)}
  }
  ctx.restore();
}
function talk(npc){
  const now=Date.now(),last=runtime.lastTalk.get(npc.id)||0;
  DBX.state.npcFriendship=DBX.state.npcFriendship||{nova:0,gear:0,moss:0};
  let gained=false;
  if(now-last>45000){
    DBX.state.npcFriendship[npc.id]=Math.min(10,(DBX.state.npcFriendship[npc.id]||0)+1);
    runtime.lastTalk.set(npc.id,now);gained=true;
    if((DBX.state.npcFriendship[npc.id]||0)>=3)addCodex(npc.id==='nova'?'Dream signal':npc.id==='gear'?'Rover blueprint':'Lunar moss');
    DBX.storage.save();DBX.events.emit('hud:update');
  }
  const level=DBX.state.npcFriendship[npc.id]||0;
  const line=npc.lines[(level+Math.floor(now/60000))%npc.lines.length];
  DBX.ui.openModal(
    '<h2>'+npc.icon+' '+npc.name+'</h2><div class="npc-role">'+npc.role+'</div>'+
    '<div class="npc-dialogue">“'+line+'”</div>'+
    '<div class="friendship-meter"><span>FRIENDSHIP</span><i><b style="width:'+(level*10)+'%"></b></i><strong>'+level+'/10</strong></div>'+
    (gained?'<div class="friendship-gain">+1 friendship ⭐</div>':'')+
    '<button id="npcClose" class="primary-btn">KEEP EXPLORING</button>'
  );
  document.querySelector('#npcClose').onclick=DBX.ui.closeModal;
  DBX.audio?.click();DBX.companion?.emote('👋');
}
function addCodex(entry){if(!DBX.state.codexEntries.includes(entry))DBX.state.codexEntries.push(entry)}

const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),npc=nearest();
  if(!npc)return base;if(!base)return npc;
  return npc.d<base.d?npc:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{if(o?.action==='npc-talk'){talk(o);return}oldInteract(o)};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
DBX.npcs={definitions,runtime,nearest,draw,talk};
})();