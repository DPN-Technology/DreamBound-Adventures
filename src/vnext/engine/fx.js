(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const particles=[];
const bursts=[];
let shake=0;
let flash=0;
let transition=0;
let transitionDir=0;

function rand(a,b){return a+Math.random()*(b-a)}
function spawn(x,y,opts={}){
  const count=Math.max(1,Math.min(80,opts.count||1));
  for(let i=0;i<count;i++){
    const angle=opts.angle??rand(0,Math.PI*2);
    const spread=opts.spread??Math.PI*2;
    const a=angle+rand(-spread/2,spread/2);
    const speed=rand(opts.minSpeed??30,opts.maxSpeed??120);
    particles.push({
      x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
      life:rand(opts.minLife??.45,opts.maxLife??1.1),
      maxLife:1,
      size:rand(opts.minSize??2,opts.maxSize??7),
      gravity:opts.gravity??0,
      drag:opts.drag??.96,
      color:opts.color||['#fff3a7','#76e9ff','#ff8ac8','#8c7bff'][Math.floor(Math.random()*4)],
      shape:opts.shape||'circle'
    });
  }
}
function burst(x,y,label='✨'){
  bursts.push({x,y,label,life:1});
  spawn(x,y,{count:18,minSpeed:45,maxSpeed:180,minLife:.5,maxLife:1.2,gravity:35});
}
function update(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.life-=dt;
    p.vx*=Math.pow(p.drag,dt*60);p.vy*=Math.pow(p.drag,dt*60);
    p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.life<=0)particles.splice(i,1);
  }
  for(let i=bursts.length-1;i>=0;i--){
    bursts[i].life-=dt;
    if(bursts[i].life<=0)bursts.splice(i,1);
  }
  shake=Math.max(0,shake-dt*16);
  flash=Math.max(0,flash-dt*3.2);
  if(transitionDir){
    transition+=transitionDir*dt*2.8;
    if(transition>=1){transition=1;transitionDir=-1;DBX.events.emit('transition:midpoint')}
    else if(transition<=0){transition=0;transitionDir=0;DBX.events.emit('transition:done')}
  }
}
function cameraOffset(){
  if(shake<=0)return {x:0,y:0};
  return {x:rand(-shake,shake),y:rand(-shake,shake)};
}
function drawWorld(ctx,t){
  for(const p of particles){
    const alpha=Math.max(0,Math.min(1,p.life/(p.maxLife||1)));
    ctx.globalAlpha=alpha;
    ctx.fillStyle=p.color;
    if(p.shape==='spark'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t/250);
      ctx.fillRect(-p.size/2,-1,p.size,2);ctx.fillRect(-1,-p.size/2,2,p.size);ctx.restore();
    }else{
      ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.globalAlpha=1;
  for(const b of bursts){
    ctx.save();ctx.globalAlpha=b.life;ctx.font='28px serif';ctx.textAlign='center';
    ctx.fillText(b.label,b.x,b.y-(1-b.life)*45);ctx.restore();
  }
}
function drawScreen(ctx,width,height,t){
  const s=DBX.state;
  const hour=((Date.now()/1000/60)%12)/12;
  const dusk=Math.max(0,Math.sin((hour-.55)*Math.PI*2))*.16;
  if(dusk>0){
    ctx.fillStyle=`rgba(31,35,89,${dusk})`;ctx.fillRect(0,0,width,height);
  }
  if(s.launched){
    const grad=ctx.createRadialGradient(width*.84,height*.18,0,width*.84,height*.18,180);
    grad.addColorStop(0,'rgba(255,248,185,.16)');grad.addColorStop(1,'rgba(255,248,185,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
  }
  if(flash>0){
    ctx.fillStyle=`rgba(255,255,255,${Math.min(.65,flash)})`;ctx.fillRect(0,0,width,height);
  }
  if(transition>0){
    const a=Math.sin(transition*Math.PI);
    ctx.fillStyle=`rgba(26,24,66,${a*.88})`;ctx.fillRect(0,0,width,height);
    ctx.save();ctx.globalAlpha=a;ctx.font='900 14px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff';
    ctx.fillText('DREAMBOUND // EXPLORING…',width/2,height/2);ctx.restore();
  }
}
DBX.fx={
  particles,spawn,burst,update,drawWorld,drawScreen,cameraOffset,
  shake(amount=6){shake=Math.max(shake,Math.min(18,amount))},
  flash(amount=.5){flash=Math.max(flash,Math.min(1,amount))},
  transition(){if(!transitionDir)transitionDir=1},
  trail(x,y,color='#c3f7ff'){spawn(x,y,{count:1,minSpeed:3,maxSpeed:18,minLife:.25,maxLife:.5,minSize:2,maxSize:5,color,gravity:-4,drag:.9})}
};
})();