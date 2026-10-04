(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const canvas=document.querySelector('#vnextCanvas');
const ctx=canvas.getContext('2d');
let last=performance.now(),near=null,cam={x:0,y:0};
function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;
  canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function update(dt){
  if(!document.querySelector('#vnextModal').classList.contains('hidden'))return;
  const s=DBX.state,v=DBX.input.vector();
  if(v.x||v.y){
    s.player.x=DBX.util.clamp(s.player.x+v.x*s.player.speed*dt,40,DBX.WORLD.w-40);
    s.player.y=DBX.util.clamp(s.player.y+v.y*s.player.speed*dt,60,DBX.WORLD.h-40);
    if(!s.launched&&s.player.x>1230)s.player.x=1230;
    s.player.dir=Math.atan2(v.y,v.x);
  }
  cam.x+=(DBX.util.clamp(s.player.x-innerWidth/2,0,Math.max(0,DBX.WORLD.w-innerWidth))-cam.x)*Math.min(1,dt*5);
  cam.y+=(DBX.util.clamp(s.player.y-innerHeight/2,0,Math.max(0,DBX.WORLD.h-innerHeight))-cam.y)*Math.min(1,dt*5);
  const closest=DBX.world.currentInteractable();
  near=closest&&closest.d<105?closest:null;
  const prompt=document.querySelector('#vnextPrompt');
  if(near){
    prompt.classList.remove('hidden');prompt.querySelector('strong').textContent=near.icon+' '+near.name;
    prompt.querySelector('span').textContent=near.hint;
  }else prompt.classList.add('hidden');
  if(DBX.input.consumeAction()&&near)DBX.ui.interact(near);

  if(s.launched){
    for(const rock of DBX.world.rocks){
      if(s.moonRocks.includes(rock.id))continue;
      if(Math.hypot(s.player.x-rock.x,s.player.y-rock.y)<52)DBX.ui.moonRock(rock.id);
    }
  }
  if((v.x||v.y)&&performance.now()%1000<34)DBX.storage.save();
}
function draw(t){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  ctx.save();ctx.translate(-cam.x,-cam.y);
  DBX.world.draw(ctx,t);
  drawPlayer(t);
  ctx.restore();
}
function drawPlayer(t){
  const s=DBX.state,p=s.player;
  ctx.save();ctx.translate(p.x,p.y);
  ctx.fillStyle='rgba(33,37,77,.22)';ctx.beginPath();ctx.ellipse(0,29,25,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#745cff';ctx.beginPath();ctx.roundRect(-20,-10,40,52,16);ctx.fill();
  ctx.fillStyle='#ffd8bd';ctx.beginPath();ctx.arc(0,-22,19,0,Math.PI*2);ctx.fill();
  ctx.font='25px serif';ctx.textAlign='center';ctx.fillText('🪖',0,-29);
  ctx.restore();
  const bx=p.x-46+Math.sin(t/500)*5,by=p.y+25+Math.cos(t/600)*4;
  ctx.font='30px serif';ctx.textAlign='center';ctx.fillText('🤖',bx,by);
}
function loop(t){
  const dt=Math.min(.034,(t-last)/1000);last=t;update(dt);draw(t);requestAnimationFrame(loop);
}
document.querySelector('#vnextInteract').onclick=()=>DBX.input.requestAction();
document.querySelector('#vnextReset').onclick=()=>{
  DBX.storage.reset();DBX.ui.closeModal();DBX.ui.updateHUD();
  DBX.ui.toast('Preview reset','Space Center progress cleared on this device.');
};
DBX.events.on('state:reset',()=>{cam={x:0,y:0}});
DBX.input.bindTouch();
DBX.ui.updateHUD();
resize();addEventListener('resize',resize);requestAnimationFrame(loop);
})();