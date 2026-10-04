(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const surfaceDraw=DBX.world.draw.bind(DBX.world);
const surfaceNearest=DBX.world.currentInteractable.bind(DBX.world);
const positions={surface:null,station:null};
const registry=new Map();

const stationObjects=[
  {id:'station-exit',name:'Airlock',x:150,y:560,icon:'🚪',action:'scene-exit',hint:'Return to the Moon surface.'},
  {id:'station-hydro',name:'Hydroponics Lab',x:430,y:390,icon:'🌱',action:'scene-garden',hint:'Tune the Moon Garden.'},
  {id:'station-observe',name:'Observation Dome',x:730,y:235,icon:'🔭',action:'scene-observe',hint:'Scan the Moon horizon.'},
  {id:'station-lab',name:'Discovery Lab',x:735,y:520,icon:'🔬',action:'scene-lab',hint:'Analyze your Moon samples.'},
  {id:'station-core',name:'Power Core',x:410,y:600,icon:'🔋',action:'scene-core',hint:'Inspect station power.'}
];

function nearestFrom(objects){
  const p=DBX.state.player;
  return (objects||[]).map(o=>({...o,d:Math.hypot(p.x-o.x,p.y-o.y)})).sort((a,b)=>a.d-b.d)[0]||null;
}

function currentConfig(){return registry.get(scene.id)||registry.get('surface')}

const scene={
  id:'surface',
  bounds:{w:DBX.WORLD.w,h:DBX.WORLD.h},
  register(id,config){
    if(typeof id!=='string'||!id||!config||typeof config!=='object')return false;
    const safe={
      id,
      name:String(config.name||id).slice(0,48),
      bounds:{
        w:DBX.util.int(config.bounds?.w,600,5000,DBX.WORLD.w),
        h:DBX.util.int(config.bounds?.h,500,4000,DBX.WORLD.h)
      },
      spawn:config.spawn&&typeof config.spawn==='object'?{
        x:DBX.util.int(config.spawn.x,45,5000,120),
        y:DBX.util.int(config.spawn.y,90,4000,160)
      }:null,
      interactables:Array.isArray(config.interactables)?config.interactables:[],
      draw:typeof config.draw==='function'?config.draw:null,
      nearest:typeof config.nearest==='function'?config.nearest:null,
      interact:typeof config.interact==='function'?config.interact:null,
      onEnter:typeof config.onEnter==='function'?config.onEnter:null,
      onExit:typeof config.onExit==='function'?config.onExit:null
    };
    registry.set(id,safe);
    if(!positions[id])positions[id]=null;
    return true;
  },
  config(id=scene.id){return registry.get(id)||null},
  enter(id,spawn){
    const targetConfig=registry.get(id);
    if(!targetConfig||id===scene.id)return false;
    const previous=currentConfig();
    positions[scene.id]={x:DBX.state.player.x,y:DBX.state.player.y};
    previous?.onExit?.(id);
    scene.id=id;
    scene.bounds={...targetConfig.bounds};
    const saved=positions[id];
    const target=spawn||saved||targetConfig.spawn||{x:120,y:160};
    DBX.state.player.x=DBX.util.clamp(target.x,45,scene.bounds.w-45);
    DBX.state.player.y=DBX.util.clamp(target.y,90,scene.bounds.h-45);
    DBX.state.player.dir=0;
    targetConfig.onEnter?.();
    DBX.storage.save();
    DBX.fx?.transition();DBX.audio?.station();
    DBX.events.emit('scene:changed',{id,name:targetConfig.name});
    DBX.ui.updateHUD();
    return true;
  },
  exit(){return scene.enter('surface',positions.surface||{x:1090,y:760})},
  clamp(p){
    p.x=DBX.util.clamp(p.x,45,scene.bounds.w-45);
    p.y=DBX.util.clamp(p.y,90,scene.bounds.h-45);
  },
  nearest(){
    const config=currentConfig();
    if(config?.nearest)return config.nearest();
    return nearestFrom(config?.interactables||[]);
  },
  draw(ctx,t){
    const config=currentConfig();
    if(config?.draw){config.draw(ctx,t);return}
    surfaceDraw(ctx,t);
  },
  handleInteraction(object){
    const config=currentConfig();
    return config?.interact?.(object)===true;
  }
};

registry.set('surface',{
  id:'surface',name:'Space Center & Moon Surface',
  bounds:{w:DBX.WORLD.w,h:DBX.WORLD.h},spawn:{x:220,y:650},
  interactables:[],
  draw:surfaceDraw,
  nearest:surfaceNearest,
  interact:null,onEnter:null,onExit:null
});

registry.set('station',{
  id:'station',name:'Lunar Space Station',
  bounds:{w:950,h:700},spawn:{x:170,y:535},
  interactables:stationObjects,
  draw:drawStation,
  nearest:()=>nearestFrom(stationObjects),
  onEnter(){DBX.state.stationVisited=true}
});

function drawStation(ctx,t){
  const s=DBX.state;
  ctx.save();
  const bg=ctx.createLinearGradient(0,0,0,700);bg.addColorStop(0,'#10162f');bg.addColorStop(1,'#26365f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,950,700);

  ctx.fillStyle='#060b1b';ctx.beginPath();ctx.roundRect(205,45,540,175,28);ctx.fill();
  ctx.strokeStyle='#57d8ff';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle='#dff9ff';
  for(let i=0;i<45;i++){const x=220+(i*101)%510,y=58+(i*59)%145;ctx.fillRect(x,y,1+(i%2),1+(i%2));}
  ctx.fillStyle='#bec6da';ctx.beginPath();ctx.arc(650,133,60,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#666f8b';ctx.beginPath();ctx.arc(630,120,14,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(672,150,11,0,Math.PI*2);ctx.fill();

  ctx.fillStyle='#354462';ctx.beginPath();ctx.roundRect(65,260,820,385,34);ctx.fill();
  ctx.strokeStyle='rgba(114,217,255,.24)';ctx.lineWidth=2;
  for(let x=180;x<860;x+=170){ctx.beginPath();ctx.moveTo(x,280);ctx.lineTo(x,625);ctx.stroke();}

  stationPanel(ctx,315,315,230,145,'#173e42','#56f1b2');
  ctx.font='31px serif';ctx.textAlign='center';ctx.fillText(s.stationGarden?'🌿 🌱 🌿':'🥀 🌱 🥀',430,382);
  stationLabel(ctx,'HYDROPONICS',430,435);

  stationPanel(ctx,650,275,165,105,'#1d3152','#61ddff');
  ctx.font='34px serif';ctx.fillText('🔭',732,332);stationLabel(ctx,'OBSERVATORY',732,365);

  stationPanel(ctx,650,455,165,120,'#332857','#9d84ff');
  ctx.font='33px serif';ctx.fillText('🔬 🧪',732,520);stationLabel(ctx,'DISCOVERY LAB',732,560);

  stationPanel(ctx,330,525,160,100,'#302b49',s.stationGarden?'#5df29d':'#ffcf72');
  ctx.font='34px serif';ctx.fillText('🔋',410,583);stationLabel(ctx,s.stationGarden?'CORE STABLE':'CORE LOW',410,612);

  ctx.fillStyle='#d6e0f4';ctx.beginPath();ctx.roundRect(95,470,110,150,22);ctx.fill();
  ctx.fillStyle='#25314b';ctx.beginPath();ctx.roundRect(112,492,76,108,16);ctx.fill();
  ctx.font='35px serif';ctx.fillText('🚪',150,560);stationLabel(ctx,'AIRLOCK',150,620);

  const pulse=.55+Math.sin(t/380)*.18;
  ctx.save();ctx.globalAlpha=pulse;ctx.fillStyle='#71f4ef';ctx.beginPath();ctx.arc(570,535,45,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;ctx.font='35px serif';ctx.fillText('🌕',570,548);ctx.restore();
  ctx.restore();
}
function stationPanel(ctx,x,y,w,h,base,accent){
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.roundRect(x+7,y+9,w,h,18);ctx.fill();
  ctx.fillStyle=base;ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.fill();
  ctx.fillStyle=accent;ctx.beginPath();ctx.roundRect(x+12,y+12,w-24,8,4);ctx.fill();
}
function stationLabel(ctx,text,x,y){
  ctx.save();ctx.textAlign='center';ctx.font='700 10px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText(text,x,y);ctx.restore();
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
  if(object?.action==='scene-enter'&&object.scene){scene.enter(object.scene,object.spawn);return}
  if(object?.action==='scene-exit'){scene.exit();return}
  if(scene.id==='station'){
    if(object?.action==='scene-garden'){gardenTune();return}
    if(object?.action==='scene-observe'){
      DBX.state.stationDiscoveries=Array.isArray(DBX.state.stationDiscoveries)?DBX.state.stationDiscoveries:[];
      if(!DBX.state.stationDiscoveries.includes('Earthrise'))DBX.state.stationDiscoveries.push('Earthrise');
      DBX.storage.save();DBX.audio?.magic();DBX.ui.toast('Observation logged','Earthrise added to your Discovery Journal.');DBX.events.emit('milestone','station-observe');return;
    }
    if(object?.action==='scene-lab'){labScan();return}
    if(object?.action==='scene-core'){DBX.ui.toast('Station Power',DBX.state.stationGarden?'Core stable • oxygen loop green':'Core reserve mode • restore Hydroponics');return}
  }
  if(scene.handleInteraction(object))return;
  wrappedInteract(object);
};
DBX.world.draw=(ctx,t)=>scene.draw(ctx,t);
DBX.world.currentInteractable=()=>scene.nearest();
DBX.scene=scene;
})();
