(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world)return;

const KEY='dreambound-vnext-world-systems-v1';
const weatherDefs=[
  {id:'clear',name:'Clear Skies',icon:'☀️',earth:true,moon:true,duration:55},
  {id:'breeze',name:'Cloud Breeze',icon:'🌤️',earth:true,moon:false,duration:42},
  {id:'stardust',name:'Stardust Drift',icon:'✨',earth:false,moon:true,duration:38},
  {id:'crystal-glow',name:'Crystal Glow',icon:'💠',earth:false,moon:true,duration:36}
];
const defaults=()=>({weather:'clear',weatherSerial:0,skimmerUnlocked:false,skimmerActive:false,weatherDiscoveries:[]});
function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const ids=weatherDefs.map(x=>x.id);
  return {
    weather:ids.includes(r.weather)?r.weather:'clear',
    weatherSerial:DBX.util.int(r.weatherSerial,0,99999,0),
    skimmerUnlocked:DBX.util.bool(r.skimmerUnlocked,false),
    skimmerActive:DBX.util.bool(r.skimmerActive,false),
    weatherDiscoveries:DBX.util.list(r.weatherDiscoveries,ids,ids.length)
  };
}
function load(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={timeLeft:30,particles:[],lastParticle:0};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function isMoon(){return !!DBX.state.launched&&DBX.state.player.x>1240&&DBX.scene?.id!=='station'}
function available(){return weatherDefs.filter(w=>isMoon()?w.moon:w.earth)}
function rotateWeather(){
  const pool=available();if(!pool.length)return;
  state.weatherSerial++;
  const next=pool[state.weatherSerial%pool.length];
  state.weather=next.id;runtime.timeLeft=next.duration;
  if(!state.weatherDiscoveries.includes(next.id)){
    state.weatherDiscoveries.push(next.id);
    DBX.odyssey?.addXP?.(10,'New environment discovered');
  }
  save();
  DBX.ui?.toast(next.icon+' '+next.name,'The world around you has changed.');
}
function unlockSkimmer(){
  if(state.skimmerUnlocked)return;
  const s=DBX.state;
  if(s.lumaRescued&&(s.eventWins||0)>=2&&(s.moonCrystals||0)>=10){
    state.skimmerUnlocked=true;save();
    DBX.ui?.toast('🛸 Moon Skimmer unlocked','A faster exploration vehicle is now available.');
    DBX.odyssey?.addXP?.(80,'Moon Skimmer unlocked');
  }
}
function toggleSkimmer(){
  unlockSkimmer();
  if(!state.skimmerUnlocked){
    DBX.ui?.toast('Moon Skimmer locked','Rescue Luma, complete 2 world events, and collect 10 Moon crystals.');
    return;
  }
  state.skimmerActive=!state.skimmerActive;
  if(state.skimmerActive){DBX.state.roverActive=false;DBX.state.player.speed=430}
  else DBX.state.player.speed=250;
  save();DBX.events.emit('hud:update');
  DBX.ui?.toast(state.skimmerActive?'🛸 Skimmer online':'Skimmer parked',state.skimmerActive?'Fast exploration mode enabled.':'Back on foot.');
}
function movement(dt,input){
  if(!state.skimmerActive)return false;
  const p=DBX.state.player;
  const speed=520;
  if(input.x||input.y){
    p.x=DBX.util.clamp(p.x+input.x*speed*dt,40,DBX.WORLD.w-40);
    p.y=DBX.util.clamp(p.y+input.y*speed*dt,60,DBX.WORLD.h-40);
    p.dir=Math.atan2(input.y,input.x);
    if(DBX.fx&&performance.now()-runtime.lastParticle>70){
      runtime.lastParticle=performance.now();
      DBX.fx.trail?.(p.x-input.x*28,p.y-input.y*28,'#b89cff');
    }
  }
  return true;
}
function update(dt,t){
  runtime.timeLeft-=dt;
  if(runtime.timeLeft<=0)rotateWeather();
  unlockSkimmer();
  if(state.skimmerActive&&DBX.scene?.id==='station'){state.skimmerActive=false;save()}
  if((state.weather==='stardust'||state.weather==='crystal-glow')&&performance.now()-runtime.lastParticle>120){
    runtime.lastParticle=performance.now();
    runtime.particles.push({x:1260+((t/7+runtime.particles.length*83)%500),y:120+((t/11+runtime.particles.length*47)%650),life:1});
    if(runtime.particles.length>45)runtime.particles.shift();
  }
  for(const p of runtime.particles)p.life=Math.max(0,p.life-dt*.32);
  runtime.particles=runtime.particles.filter(p=>p.life>0);
}
function draw(ctx,t){
  if(DBX.scene?.id==='station')return;
  ctx.save();
  if(state.weather==='breeze'&&!isMoon()){
    ctx.globalAlpha=.12;
    for(let i=0;i<5;i++){ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(150+((t/35+i*310)%1200),160+i*75,90,24,0,0,Math.PI*2);ctx.fill()}
  }
  if(state.weather==='stardust'&&isMoon()){
    for(const p of runtime.particles){ctx.globalAlpha=p.life*.8;ctx.fillStyle='#d8c9ff';ctx.beginPath();ctx.arc(p.x,p.y,2+p.life*2,0,Math.PI*2);ctx.fill()}
  }
  if(state.weather==='crystal-glow'&&isMoon()){
    const a=.08+.06*Math.sin(t/420);ctx.fillStyle='rgba(105,244,255,'+a+')';ctx.fillRect(1240,0,560,1200);
  }
  ctx.restore();
}
function drawVehicle(ctx){
  if(!state.skimmerActive)return;
  const p=DBX.state.player;ctx.save();ctx.translate(p.x,p.y+14);
  ctx.fillStyle='rgba(40,35,91,.22)';ctx.beginPath();ctx.ellipse(0,24,52,12,0,0,Math.PI*2);ctx.fill();
  ctx.shadowColor='#bba6ff';ctx.shadowBlur=20;ctx.font='62px serif';ctx.textAlign='center';ctx.fillText('🛸',0,14);ctx.restore();
}
function currentWeather(){return weatherDefs.find(w=>w.id===state.weather)||weatherDefs[0]}
function open(){
  const w=currentWeather(),locked=!state.skimmerUnlocked;
  DBX.ui.openModal(
    '<h2>🌦️ World Systems</h2>'+
    '<p>The environment now changes as you explore.</p>'+
    '<div class="resource-strip"><span>'+w.icon+' <b>'+w.name+'</b></span><span>Next shift <b>'+Math.max(1,Math.ceil(runtime.timeLeft))+'s</b></span></div>'+
    '<article class="base-module"><div>🛸</div><strong>Moon Skimmer</strong><small>Fast exploration vehicle for the Moon surface.</small>'+
    '<span>'+(locked?'Unlock: rescue Luma · 2 world events · 10 crystals':'UNLOCKED')+'</span>'+
    '<button id="skimmerToggle" '+(locked?'disabled':'')+'>'+(state.skimmerActive?'PARK SKIMMER':'USE SKIMMER')+'</button></article>'+
    '<button id="worldSystemsClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#skimmerToggle')?.addEventListener('click',()=>{toggleSkimmer();open()});
  document.querySelector('#worldSystemsClose').onclick=DBX.ui.closeModal;
}
DBX.events.on('hud:update',unlockSkimmer);
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());runtime.timeLeft=30;runtime.particles=[];save()});
DBX.worldSystems={state,runtime,update,draw,drawVehicle,movement,open,currentWeather,toggleSkimmer};
})();