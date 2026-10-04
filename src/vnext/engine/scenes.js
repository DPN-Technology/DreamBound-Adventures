(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const surfaceDraw=DBX.world.draw.bind(DBX.world);
const surfaceNearest=DBX.world.currentInteractable.bind(DBX.world);
const positions={surface:null,station:null};

const stationObjects=[
  {id:'station-exit',name:'Airlock',x:150,y:560,icon:'🚪',action:'scene-exit',hint:'Return to the Moon surface.'},
  {id:'station-hydro',name:'Hydroponics Lab',x:430,y:390,icon:'🌱',action:'scene-garden',hint:'Tune the Moon Garden.'},
  {id:'station-observe',name:'Observation Dome',x:730,y:235,icon:'🔭',action:'scene-observe',hint:'Scan the Moon horizon.'},
  {id:'station-lab',name:'Discovery Lab',x:735,y:520,icon:'🔬',action:'scene-lab',hint:'Analyze your Moon samples.'},
  {id:'station-core',name:'Power Core',x:410,y:600,icon:'🔋',action:'scene-core',hint:'Inspect station power.'}
];

const scene={
  id:'surface',
  bounds:{w:DBX.WORLD.w,h:DBX.WORLD.h},
  enter(id,spawn){
    if(id===scene.id)return;
    positions[scene.id]={x:DBX.state.player.x,y:DBX.state.player.y};
    scene.id=id;
    scene.bounds=id==='station'?{w:950,h:700}:{w:DBX.WORLD.w,h:DBX.WORLD.h};
    const saved=positions[id];
    const target=spawn||saved||(id==='station'?{x:170,y:535}:{x:1375,y:630});
    DBX.state.player.x=target.x;DBX.state.player.y=target.y;
    DBX.state.player.dir=0;
    if(id==='station')DBX.state.stationVisited=true;
    DBX.storage.save();
    DBX.fx?.transition();DBX.audio?.station();
    DBX.events.emit('scene:changed',{id});
    DBX.ui.updateHUD();
  },
  exit(){scene.enter('surface',{x:1375,y:640})},
  clamp(p){
    p.x=DBX.util.clamp(p.x,45,scene.bounds.w-45);
    p.y=DBX.util.clamp(p.y,90,scene.bounds.h-45);
  },
  nearest(){
    if(scene.id==='surface')return surfaceNearest();
    const p=DBX.state.player;
    return stationObjects.map(o=>({...o,d:Math.hypot(p.x-o.x,p.y-o.y)})).sort((a,b)=>a.d-b.d)[0]||null;
  },
  draw(ctx,t){
    if(scene.id==='surface'){surfaceDraw(ctx,t);return}
    drawStation(ctx,t);
  }
};
function drawStation(ctx,t){
  const s=DBX.state;
  ctx.save();
  const bg=ctx.createLinearGradient(0,0,0,700);bg.addColorStop(0,'#171c43');bg.addColorStop(1,'#303a70');
  ctx.fillStyle=bg;ctx.fillRect(0,0,950,700);

  // Panoramic window.
  ctx.fillStyle='#080c28';ctx.beginPath();ctx.roundRect(205,45,540,175,34);ctx.fill();
  ctx.strokeStyle='#879ee1';ctx.lineWidth=10;ctx.stroke();
  ctx.fillStyle='#fff6b4';
  for(let i=0;i<45;i++){const x=220+(i*101)%510,y=58+(i*59)%145;ctx.fillRect(x,y,2+(i%2),2+(i%2));}
  ctx.fillStyle='#bcc5e7';ctx.beginPath();ctx.arc(650,133,60,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#777fa6';ctx.beginPath();ctx.arc(630,120,14,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(672,150,11,0,Math.PI*2);ctx.fill();

  // Floor lanes.
  ctx.fillStyle='#68759e';ctx.beginPath();ctx.roundRect(65,260,820,385,42);ctx.fill();
  ctx.strokeStyle='#92a4d2';ctx.lineWidth=4;
  for(let x=180;x<860;x+=170){ctx.beginPath();ctx.moveTo(x,280);ctx.lineTo(x,625);ctx.stroke();}

  // Hydroponics.
  stationPanel(ctx,315,315,230,145,'#335c5a','#9ef3b7');
  ctx.font='31px serif';ctx.textAlign='center';ctx.fillText(s.stationGarden?'🌿 🌱 🌿':'🥀 🌱 🥀',430,382);
  stationLabel(ctx,'HYDROPONICS',430,435);

  // Observatory console.
  stationPanel(ctx,650,275,165,105,'#34375e','#7fdfff');
  ctx.font='34px serif';ctx.fillText('🔭',732,332);stationLabel(ctx,'OBSERVATORY',732,365);

  // Lab.
  stationPanel(ctx,650,455,165,120,'#473b66','#c7a6ff');
  ctx.font='33px serif';ctx.fillText('🔬 🧪',732,520);stationLabel(ctx,'DISCOVERY LAB',732,560);

  // Core.
  stationPanel(ctx,330,525,160,100,'#4d4560',s.stationGarden?'#8dffba':'#ffcf72');
  ctx.font='34px serif';ctx.fillText('🔋',410,583);stationLabel(ctx,s.stationGarden?'CORE STABLE':'CORE LOW',410,612);

  // Airlock.
  ctx.fillStyle='#cbd5f0';ctx.beginPath();ctx.roundRect(95,470,110,150,28);ctx.fill();
  ctx.fillStyle='#34405f';ctx.beginPath();ctx.roundRect(112,492,76,108,22);ctx.fill();
  ctx.font='35px serif';ctx.fillText('🚪',150,560);stationLabel(ctx,'AIRLOCK',150,620);

  // Hologram.
  const pulse=.55+Math.sin(t/380)*.18;
  ctx.save();ctx.globalAlpha=pulse;ctx.fillStyle='#71f4ef';ctx.beginPath();ctx.arc(570,535,45,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;ctx.font='35px serif';ctx.fillText('🌕',570,548);ctx.restore();
  ctx.restore();
}
function stationPanel(ctx,x,y,w,h,base,accent){
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.roundRect(x+7,y+9,w,h,20);ctx.fill();
  ctx.fillStyle=base;ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.fill();
  ctx.fillStyle=accent;ctx.beginPath();ctx.roundRect(x+12,y+12,w-24,18,9);ctx.fill();
}
function stationLabel(ctx,text,x,y){
  ctx.save();ctx.textAlign='center';ctx.font='900 10px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText(text,x,y);ctx.restore();
}
function gardenTune(){
  const order=['💧','🌱','☀️','🫧'];let pos=0;
  DBX.ui.openModal(
    '<h2>🌱 Hydroponics Control</h2><p>Balance the closed-loop garden system.</p>'+
    '<div class="vnext-order">'+order.map((x,i)=>'<span>'+x+'<small>'+(i+1)+'</small></span>').join('<b>→</b>')+'</div>'+
    '<div class="vnext-choices">'+['☀️','🫧','💧','🌱'].map(x=>'<button>'+x+'</button>').join('')+'</div>'+
    '<div id="sceneGardenProgress" class="vnext-progress">○ ○ ○ ○</div><button id="sceneGardenClose" class="small-btn">Close</button>'
  );
  document.querySelectorAll('.vnext-choices button').forEach(btn=>btn.onclick=()=>{
    if(btn.textContent===order[pos]){
      pos++;DBX.audio?.click();document.querySelector('#sceneGardenProgress').textContent='● '.repeat(pos)+'○ '.repeat(4-pos);
      if(pos===4)setTimeout(()=>{
        DBX.state.stationGarden=true;DBX.storage.save();DBX.ui.closeModal();
        DBX.fx?.burst(DBX.state.player.x,DBX.state.player.y,'🌱');DBX.audio?.success();
        DBX.ui.toast('Hydroponics restored','The station is producing clean air and fresh Moon plants.');
        DBX.events.emit('milestone','station-garden');
      },220);
    }else{
      pos=0;DBX.audio?.error();document.querySelector('#sceneGardenProgress').textContent='○ ○ ○ ○';
    }
  });
  document.querySelector('#sceneGardenClose').onclick=DBX.ui.closeModal;
}
function labScan(){
  const rocks=DBX.state.moonRocks?.length||0;
  DBX.state.stationDiscoveries=Array.isArray(DBX.state.stationDiscoveries)?DBX.state.stationDiscoveries:[];
  const item=rocks>=3?'Moon crystal pattern':'Lunar dust sample';
  if(!DBX.state.stationDiscoveries.includes(item))DBX.state.stationDiscoveries.push(item);
  DBX.storage.save();DBX.audio?.magic();
  DBX.ui.openModal('<h2>🔬 Discovery Lab</h2><div class="lab-readout">SAMPLE // '+item.toUpperCase()+'</div><p>Your scanner found a safe science clue from the Moon surface.</p><button id="labDone" class="primary-btn">LOG DISCOVERY</button>');
  document.querySelector('#labDone').onclick=DBX.ui.closeModal;
  DBX.events.emit('milestone','station-lab');
}
const wrappedInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=object=>{
  if(object?.action==='station'){scene.enter('station');return}
  if(scene.id==='station'){
    if(object?.action==='scene-exit'){scene.exit();return}
    if(object?.action==='scene-garden'){gardenTune();return}
    if(object?.action==='scene-observe'){
      DBX.state.stationDiscoveries=Array.isArray(DBX.state.stationDiscoveries)?DBX.state.stationDiscoveries:[];
      if(!DBX.state.stationDiscoveries.includes('Earthrise'))DBX.state.stationDiscoveries.push('Earthrise');
      DBX.storage.save();DBX.audio?.magic();DBX.ui.toast('Observation logged','Earthrise added to your Discovery Journal.');DBX.events.emit('milestone','station-observe');return;
    }
    if(object?.action==='scene-lab'){labScan();return}
    if(object?.action==='scene-core'){DBX.ui.toast('Station Power',DBX.state.stationGarden?'Core stable • oxygen loop green':'Core reserve mode • restore Hydroponics');return}
  }
  wrappedInteract(object);
};
DBX.world.draw=(ctx,t)=>scene.draw(ctx,t);
DBX.world.currentInteractable=()=>scene.nearest();
DBX.scene=scene;
})();