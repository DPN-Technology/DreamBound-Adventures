(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX)return;
const consoleObj={id:'moon-base-console',name:'Moon Base Console',x:1620,y:1075,icon:'🏗️',action:'base-console',hint:'Design and expand your Moon Base.',moon:true};
if(!DBX.world.interactables.some(x=>x.id===consoleObj.id))DBX.world.interactables.push(consoleObj);

const modules=[
  {id:'habitat',icon:'🏠',name:'Explorer Habitat',costC:6,costG:3,desc:'A cozy safe room for explorers and Luma.'},
  {id:'observatory',icon:'🔭',name:'Sky Observatory',costC:8,costG:4,desc:'Tracks auroras, stars, and meteor events.'},
  {id:'garage',icon:'🛻',name:'Rover Garage',costC:10,costG:5,desc:'A proper rover service bay and energy station.'},
  {id:'greenhouse',icon:'🌿',name:'Moon Greenhouse',costC:12,costG:6,desc:'Extends the station garden onto the lunar surface.'}
];
function open(){
  if(!DBX.state.launched){DBX.ui.toast('Moon Base unavailable','Reach the Moon first.');return}
  const cards=modules.map(m=>{
    const built=DBX.state.baseModules.includes(m.id);
    const afford=(DBX.state.moonCrystals||0)>=m.costC&&DBX.state.gems>=m.costG;
    return '<article class="base-module '+(built?'built':'')+'"><div>'+m.icon+'</div><strong>'+m.name+'</strong><small>'+m.desc+'</small>'+
      '<span>'+m.costC+' 💎crystal · '+m.costG+' gem</span>'+
      '<button data-build="'+m.id+'" '+(built||!afford?'disabled':'')+'>'+(built?'BUILT ✓':afford?'BUILD MODULE':'NEED RESOURCES')+'</button></article>';
  }).join('');
  DBX.ui.openModal(
    '<h2>🏗️ Moon Base Architect</h2><p>Build permanent modules that make the lunar world feel like yours.</p>'+
    '<div class="resource-strip"><span>💠 Moon Crystals <b>'+DBX.state.moonCrystals+'</b></span><span>💎 Gems <b>'+DBX.state.gems+'</b></span></div>'+
    '<div class="base-grid">'+cards+'</div><button id="baseClose" class="primary-btn">CLOSE BLUEPRINTS</button>'
  );
  document.querySelectorAll('[data-build]').forEach(btn=>btn.onclick=()=>build(btn.dataset.build));
  document.querySelector('#baseClose').onclick=DBX.ui.closeModal;
}
function build(id){
  const m=modules.find(x=>x.id===id);if(!m||DBX.state.baseModules.includes(id))return;
  if(DBX.state.moonCrystals<m.costC||DBX.state.gems<m.costG)return;
  DBX.state.moonCrystals-=m.costC;DBX.state.gems-=m.costG;DBX.state.baseModules.push(id);
  if(!DBX.state.codexEntries.includes('Moon crystal'))DBX.state.codexEntries.push('Moon crystal');
  DBX.storage.save();DBX.events.emit('hud:update');DBX.audio?.success();DBX.fx?.flash(.45);DBX.fx?.burst(1620,1010,m.icon);
  DBX.ui.toast(m.name+' built!','Your Moon Base permanently changed.');
  open();
}
function draw(ctx,t){
  if(!DBX.state.launched||DBX.scene?.id==='station')return;
  ctx.save();
  ctx.strokeStyle='rgba(137,246,240,.35)';ctx.lineWidth=2;ctx.setLineDash([7,8]);
  ctx.beginPath();ctx.roundRect(1510,970,250,170,30);ctx.stroke();ctx.setLineDash([]);
  ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#b8fff5';ctx.fillText('DREAMBOUND MOON BASE',1635,960);
  const positions={habitat:[1560,1025],observatory:[1660,1010],garage:[1550,1110],greenhouse:[1690,1100]};
  for(const m of modules){
    const p=positions[m.id];
    if(DBX.state.baseModules.includes(m.id)){
      ctx.fillStyle='rgba(236,244,255,.92)';ctx.strokeStyle='#92a4d4';ctx.lineWidth=4;
      ctx.beginPath();ctx.roundRect(p[0]-42,p[1]-32,84,64,18);ctx.fill();ctx.stroke();
      ctx.font='35px serif';ctx.fillText(m.icon,p[0],p[1]+12);
      ctx.font='900 8px system-ui';ctx.fillStyle='#424a75';ctx.fillText(m.name.toUpperCase(),p[0],p[1]+49);
      const glow=.25+.2*Math.sin(t/420+p[0]);ctx.fillStyle='rgba(108,244,225,'+glow+')';ctx.beginPath();ctx.arc(p[0]+34,p[1]-25,5,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle='rgba(126,138,180,.18)';ctx.beginPath();ctx.roundRect(p[0]-36,p[1]-26,72,52,15);ctx.fill();
      ctx.font='23px serif';ctx.globalAlpha=.5;ctx.fillText('＋',p[0],p[1]+8);ctx.globalAlpha=1;
    }
  }
  ctx.restore();
}
const oldDraw=DBX.world.draw.bind(DBX.world);DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
const oldInteract=DBX.ui.interact.bind(DBX.ui);DBX.ui.interact=o=>{if(o?.action==='base-console'){open();return}oldInteract(o)};
DBX.baseBuilder={modules,open,build,draw};
})();