(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const runtime={vx:0,vy:0,energy:100,distance:0,lastDust:0};
function step(dt,input){
  const s=DBX.state;
  if(!s.roverActive)return false;
  const boosting=!!DBX.input?.boosting?.()&&runtime.energy>8;
  const accel=boosting?720:520,friction=Math.pow(.18,dt),max=boosting?525:390;
  runtime.vx+=input.x*accel*dt;runtime.vy+=input.y*accel*dt;
  runtime.vx*=friction;runtime.vy*=friction;
  const speed=Math.hypot(runtime.vx,runtime.vy);
  if(speed>max){runtime.vx=runtime.vx/speed*max;runtime.vy=runtime.vy/speed*max}
  const moving=Math.hypot(runtime.vx,runtime.vy)>8;
  if(moving){
    s.player.x=DBX.util.clamp(s.player.x+runtime.vx*dt,40,DBX.WORLD.w-40);
    s.player.y=DBX.util.clamp(s.player.y+runtime.vy*dt,60,DBX.WORLD.h-40);
    s.player.dir=Math.atan2(runtime.vy,runtime.vx);
    const traveled=Math.hypot(runtime.vx*dt,runtime.vy*dt);
    runtime.distance+=traveled;
    runtime.energy=Math.max(0,runtime.energy-traveled*(boosting?.016:.008));
    if(boosting&&DBX.fx&&Math.random()<.35)DBX.fx.trail(s.player.x-runtime.vx*.05,s.player.y+18,'#8ff7ff');
    if(DBX.fx&&performance.now()-runtime.lastDust>75){
      runtime.lastDust=performance.now();
      DBX.fx.spawn(s.player.x-runtime.vx*.04,s.player.y+30,{count:2,minSpeed:8,maxSpeed:28,minLife:.3,maxLife:.7,minSize:3,maxSize:8,color:'#d6d0bc',gravity:-6});
    }
  }else{
    runtime.energy=Math.min(100,runtime.energy+dt*7);
  }
  if(runtime.energy<=0){
    s.roverActive=false;s.player.speed=250;runtime.vx=runtime.vy=0;
    DBX.storage.save();DBX.input?.rumble?.(180,.5);DBX.audio?.error();DBX.ui?.toast('Rover recharge','Battery empty. Parked safely while it recharges.');
  }
  return true;
}
function draw(ctx){
  if(!DBX.state.roverActive)return;
  const p=DBX.state.player;
  ctx.save();ctx.translate(p.x,p.y+18);ctx.rotate(Math.atan2(runtime.vy||0,runtime.vx||1)*.08);
  ctx.fillStyle='rgba(17,21,48,.24)';ctx.beginPath();ctx.ellipse(0,22,47,13,0,0,Math.PI*2);ctx.fill();
  ctx.font='58px serif';ctx.textAlign='center';ctx.fillText('🛻',0,13);
  ctx.restore();
}
DBX.vehicle={runtime,step,draw,reset(){runtime.vx=runtime.vy=0;runtime.energy=100;runtime.distance=0}};
})();