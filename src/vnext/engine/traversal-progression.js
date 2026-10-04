(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.vehicle||!DBX.worldSystems||!DBX.simulation)return;

const KEY='dreambound-v2-traversal-progression-v1';
const VEHICLES=['rover','skimmer','glider'];
const UPGRADES=['rover-torque','rover-battery','skimmer-stability','skimmer-drive','glider-lift','glider-nav'];
const defaults=()=>({selected:'rover',unlocked:['rover'],upgrades:[],traversalXP:0,discoveries:[],distanceByVehicle:{rover:0,skimmer:0,glider:0}});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const unlocked=DBX.util.list(r.unlocked,VEHICLES,VEHICLES.length);
  if(!unlocked.includes('rover'))unlocked.unshift('rover');
  const selected=unlocked.includes(r.selected)?r.selected:'rover';
  const distanceByVehicle={};
  for(const v of VEHICLES)distanceByVehicle[v]=DBX.util.int(r.distanceByVehicle?.[v],0,999999999,0);
  return {
    selected,
    unlocked,
    upgrades:DBX.util.list(r.upgrades,UPGRADES,UPGRADES.length),
    traversalXP:DBX.util.int(r.traversalXP,0,999999,0),
    discoveries:DBX.util.list(r.discoveries,['ridge-slipstream','stardust-lift','base-route','hollow-drift'],12),
    distanceByVehicle
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={lastX:DBX.state.player.x,lastY:DBX.state.player.y,lastRewardXP:0};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

function has(id){return state.upgrades.includes(id)}
function weather(){return DBX.worldSystems?.state.weather||'clear'}
function zone(){return DBX.simulation.zoneOf()}
function vehicleStats(id){
  const base={
    rover:{speed:390,boost:525,efficiency:1,traction:1,icon:'🛻',name:'Moon Rover'},
    skimmer:{speed:520,boost:600,efficiency:.8,traction:.9,icon:'🛸',name:'Moon Skimmer'},
    glider:{speed:565,boost:650,efficiency:.7,traction:.75,icon:'🪽',name:'Star Glider'}
  }[id];
  if(!base)return null;
  const out={...base};
  if(id==='rover'&&has('rover-torque')){out.speed+=55;out.traction+=.2}
  if(id==='rover'&&has('rover-battery'))out.efficiency*=.72;
  if(id==='skimmer'&&has('skimmer-stability'))out.traction+=.22;
  if(id==='skimmer'&&has('skimmer-drive'))out.boost+=85;
  if(id==='glider'&&has('glider-lift'))out.speed+=70;
  if(id==='glider'&&has('glider-nav'))out.traction+=.25;

  const w=weather(),z=zone();
  if(id==='rover'&&w==='crystal-glow')out.traction*=.88;
  if(id==='skimmer'&&w==='stardust')out.speed*=1.12;
  if(id==='glider'&&w==='stardust')out.boost*=1.15;
  if(z==='moon-base'&&id==='rover')out.traction*=1.12;
  if(z==='luma-hollow'&&id==='glider')out.speed*=1.08;
  return out;
}
function rank(){return 1+Math.floor(Math.sqrt(state.traversalXP/90))}
function unlocks(){
  if(!state.unlocked.includes('skimmer')&&DBX.worldSystems.state.skimmerUnlocked){
    state.unlocked.push('skimmer');DBX.ui?.toast('Traversal class unlocked','🛸 Moon Skimmer added to your hangar.');
  }
  const gliderReady=(DBX.systemicChains?.state.completed?.length||0)>=2&&rank()>=3;
  if(!state.unlocked.includes('glider')&&gliderReady){
    state.unlocked.push('glider');DBX.ui?.toast('Traversal class unlocked','🪽 Star Glider added to your hangar.');
    DBX.odyssey?.addXP?.(90,'Star Glider unlocked');
  }
  save();
}
function select(id){
  unlocks();
  if(!state.unlocked.includes(id)){DBX.ui?.toast('Vehicle locked','Keep progressing traversal mastery.');return false}
  state.selected=id;
  if(id==='rover'){DBX.worldSystems.state.skimmerActive=false;DBX.state.roverActive=true}
  else if(id==='skimmer'){DBX.state.roverActive=false;DBX.worldSystems.state.skimmerActive=true}
  else {DBX.state.roverActive=false;DBX.worldSystems.state.skimmerActive=false}
  save();DBX.events.emit('hud:update');
  DBX.ui?.toast(vehicleStats(id).icon+' '+vehicleStats(id).name,'Traversal class selected.');
  return true;
}
function upgradeCost(id){
  const index=UPGRADES.indexOf(id);return 4+Math.max(0,index)*2;
}
function canUpgrade(id){
  if(state.upgrades.includes(id))return false;
  const vehicle=id.split('-')[0];
  return state.unlocked.includes(vehicle)&&(DBX.state.gems||0)>=upgradeCost(id);
}
function buy(id){
  if(!UPGRADES.includes(id)||!canUpgrade(id))return false;
  const cost=upgradeCost(id);
  DBX.state.gems-=cost;state.upgrades.push(id);
  DBX.storage.save();save();
  DBX.odyssey?.addXP?.(35,'Traversal upgrade');
  DBX.ui?.toast('Upgrade installed','-'+cost+' 💎 · '+id.replace(/-/g,' '));
  return true;
}
function updateProgress(){
  unlocks();
  const p=DBX.state.player,dist=Math.hypot(p.x-runtime.lastX,p.y-runtime.lastY);
  runtime.lastX=p.x;runtime.lastY=p.y;
  const active=state.selected;
  if(dist>0&&dist<120){
    state.distanceByVehicle[active]=Math.min(999999999,(state.distanceByVehicle[active]||0)+Math.floor(dist));
    state.traversalXP=Math.min(999999,state.traversalXP+Math.floor(dist/80));
  }
  const z=zone(),w=weather();
  const discovers=[
    ['ridge-slipstream',()=>z==='crystal-ridge'&&active==='skimmer'],
    ['stardust-lift',()=>w==='stardust'&&(active==='skimmer'||active==='glider')],
    ['base-route',()=>z==='moon-base'&&active==='rover'],
    ['hollow-drift',()=>z==='luma-hollow'&&active==='glider']
  ];
  for(const [id,test] of discovers){
    if(state.discoveries.includes(id))continue;
    let yes=false;try{yes=!!test()}catch{}
    if(!yes)continue;
    state.discoveries.push(id);state.traversalXP+=30;
    DBX.simulation.emit('traversal-discovery',z,40);
    DBX.ui?.toast('Traversal discovery',id.replace(/-/g,' '));
  }
  if(state.traversalXP-runtime.lastRewardXP>=120){
    runtime.lastRewardXP=state.traversalXP;
    DBX.odyssey?.addXP?.(20,'Traversal mastery');
  }
  save();
}
function handleMovement(dt,input){
  if(state.selected!=='glider'||!state.unlocked.includes('glider'))return false;
  const s=vehicleStats('glider'),p=DBX.state.player;
  const boosting=!!DBX.input?.boosting?.();
  const speed=boosting?s.boost:s.speed;
  if(input.x||input.y){
    p.x=DBX.util.clamp(p.x+input.x*speed*dt,40,DBX.WORLD.w-40);
    p.y=DBX.util.clamp(p.y+input.y*speed*dt,60,DBX.WORLD.h-40);
    p.dir=Math.atan2(input.y,input.x);
    if(DBX.fx&&DBX.accessibility?.shouldAnimate?.())DBX.fx.trail?.(p.x-input.x*34,p.y-input.y*34,'#ffe19a');
  }
  return true;
}
function draw(ctx,t){
  if(state.selected!=='glider'||!state.unlocked.includes('glider'))return;
  const p=DBX.state.player,hover=(DBX.accessibility?.shouldAnimate?.()??true)?Math.sin(t/260)*5:0;
  ctx.save();ctx.translate(p.x,p.y+hover);
  ctx.fillStyle='rgba(27,25,68,.20)';ctx.beginPath();ctx.ellipse(0,30,55,13,0,0,Math.PI*2);ctx.fill();
  ctx.shadowColor='#ffe7a1';ctx.shadowBlur=18;ctx.font='62px serif';ctx.textAlign='center';ctx.fillText('🪽',0,12);ctx.restore();
}
function open(){
  unlocks();
  const vehicles=VEHICLES.map(id=>{
    const st=vehicleStats(id),unlocked=state.unlocked.includes(id);
    return '<article class="base-module '+(state.selected===id?'built':'')+'"><div>'+st.icon+'</div><strong>'+st.name+'</strong>'+
      '<small>Speed '+Math.round(st.speed)+' · Boost '+Math.round(st.boost)+' · Traction '+st.traction.toFixed(2)+'</small>'+
      '<span>'+(unlocked?'UNLOCKED':'LOCKED')+'</span>'+
      '<button data-vehicle="'+id+'" '+(!unlocked?'disabled':'')+'>'+(state.selected===id?'ACTIVE':'SELECT')+'</button></article>';
  }).join('');
  const upgrades=UPGRADES.map(id=>{
    const cost=upgradeCost(id),owned=state.upgrades.includes(id);
    return '<article class="director-level '+(owned?'active':'')+'"><span>⚙️</span><strong>'+id.replace(/-/g,' ').toUpperCase()+'</strong>'+
      '<small>'+(owned?'INSTALLED':cost+' 💎 gems')+'</small><button data-upgrade="'+id+'" '+(owned||!canUpgrade(id)?'disabled':'')+'>'+(owned?'INSTALLED':'INSTALL')+'</button></article>';
  }).join('');
  DBX.ui.openModal(
    '<h2>🚀 Traversal Command</h2>'+
    '<p>Vehicle classes now have real progression, environmental strengths, and simulation-aware traversal behavior.</p>'+
    '<div class="director-score">TRAVERSAL RANK <b>'+rank()+'</b></div>'+
    '<div class="base-grid">'+vehicles+'</div>'+
    '<div class="director-grid">'+upgrades+'</div>'+
    '<div class="friend-roster"><strong>DISCOVERIES</strong>'+
      (state.discoveries.length?state.discoveries.map(x=>'<span>'+x.replace(/-/g,' ').toUpperCase()+'</span>').join(''):'<span>Explore with different vehicles to discover traversal synergies.</span>')+
    '</div><button id="traversalClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelectorAll('[data-vehicle]').forEach(b=>b.onclick=()=>{select(b.dataset.vehicle);open()});
  document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{buy(b.dataset.upgrade);open()});
  document.querySelector('#traversalClose').onclick=DBX.ui.closeModal;
}
function telemetry(){
  const st=vehicleStats(state.selected);
  return st?st.icon+' '+st.name.toUpperCase():'🥾 ON FOOT';
}
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextTraversalBtn')){
  const b=document.createElement('button');b.id='vnextTraversalBtn';b.className='deck-chip';b.textContent='🚀 TRAVERSAL';b.onclick=open;hud.appendChild(b);
}
DBX.events.on('simulation:snapshot',updateProgress);
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());runtime.lastX=DBX.state.player.x;runtime.lastY=DBX.state.player.y;save()});
DBX.traversal={state,runtime,vehicleStats,rank,unlocks,select,buy,updateProgress,handleMovement,draw,open,telemetry};
unlocks();
})();