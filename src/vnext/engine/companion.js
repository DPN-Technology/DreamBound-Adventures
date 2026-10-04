(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const runtime={x:0,y:0,vx:0,vy:0,mood:'curious',emote:'',emoteUntil:0,lastBondAt:0};
function ensure(){
  if(!Number.isFinite(Number(DBX.state.lumaBond)))DBX.state.lumaBond=0;
}
function update(dt,t){
  if(!DBX.state.lumaRescued)return;
  ensure();
  const p=DBX.state.player,targetX=p.x+55*Math.cos(p.dir+Math.PI),targetY=p.y+55*Math.sin(p.dir+Math.PI)+18;
  if(!runtime.x&&!runtime.y){runtime.x=targetX;runtime.y=targetY};
  const dx=targetX-runtime.x,dy=targetY-runtime.y;
  runtime.vx+=dx*dt*7;runtime.vy+=dy*dt*7;
  runtime.vx*=Math.pow(.08,dt);runtime.vy*=Math.pow(.08,dt);
  runtime.x+=runtime.vx*dt;runtime.y+=runtime.vy*dt;
  const d=Math.hypot(dx,dy);
  runtime.mood=d<70?'happy':d>220?'zooming':'curious';
  if(t-runtime.lastBondAt>45000&&d<100){
    runtime.lastBondAt=t;
    DBX.state.lumaBond=Math.min(10,(DBX.state.lumaBond||0)+1);
    DBX.storage.save();DBX.events.emit('hud:update');
    emote('💜');DBX.audio?.collect();
  }
}
function emote(symbol='✨',duration=1800){runtime.emote=symbol;runtime.emoteUntil=performance.now()+duration}
function draw(ctx,t){
  if(!DBX.state.lumaRescued)return;
  const bob=Math.sin(t/260)*4;
  ctx.save();ctx.translate(runtime.x,runtime.y+bob);
  ctx.fillStyle='rgba(19,22,48,.18)';ctx.beginPath();ctx.ellipse(0,20,22,7,0,0,Math.PI*2);ctx.fill();
  ctx.font='34px serif';ctx.textAlign='center';ctx.fillText('🐇',0,8);
  ctx.font='13px serif';ctx.fillText(runtime.mood==='happy'?'✨':'🌙',19,-14);
  if(runtime.emote&&performance.now()<runtime.emoteUntil){
    ctx.globalAlpha=Math.max(.2,(runtime.emoteUntil-performance.now())/1800);
    ctx.font='24px serif';ctx.fillText(runtime.emote,0,-37);
  }
  ctx.restore();
}
function interact(){
  if(!DBX.state.lumaRescued)return;
  ensure();
  emote(['💜','✨','🌙','⭐'][Math.floor(Math.random()*4)]);
  if((DBX.state.lumaBond||0)<10){
    DBX.state.lumaBond=Math.min(10,DBX.state.lumaBond+.25);
    DBX.storage.save();DBX.events.emit('hud:update');
  }
  DBX.ui.toast('Luma Bond '+Math.floor(DBX.state.lumaBond)+'/10',runtime.mood==='happy'?'Luma is having a great adventure!':'Luma is exploring with you.');
  DBX.audio?.collect();
}
DBX.companion={runtime,update,draw,interact,emote};
})();