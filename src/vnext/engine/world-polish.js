(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const stars=Array.from({length:70},(_,i)=>({x:1280+(i*97)%500,y:25+(i*67)%620,r:1+(i%3)*.45,p:i*.7}));
const clouds=Array.from({length:6},(_,i)=>({x:120+i*300,y:90+(i%3)*95,s:.75+(i%3)*.18,v:7+i*1.7}));
function drawAfterWorld(ctx,t){
  if(DBX.scene?.id==='station'){
    interactionGlow(ctx,t);
    return;
  }
  // Soft moving clouds on Earth side.
  ctx.save();
  for(const c of clouds){
    const x=(c.x+(t/1000)*c.v)%1320-80;
    ctx.globalAlpha=.24;
    ctx.fillStyle='#fff';
    ctx.beginPath();
    ctx.ellipse(x,c.y,70*c.s,22*c.s,0,0,Math.PI*2);
    ctx.ellipse(x+52*c.s,c.y+4,45*c.s,18*c.s,0,0,Math.PI*2);
    ctx.ellipse(x-48*c.s,c.y+7,38*c.s,15*c.s,0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;

  // Moon star field shimmer.
  for(const star of stars){
    const a=.35+.5*(.5+.5*Math.sin(t/480+star.p));
    ctx.globalAlpha=a;ctx.fillStyle='#fff8c8';
    ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // Launch-pad guidance lights.
  for(let i=0;i<7;i++){
    const a=.35+.45*(.5+.5*Math.sin(t/260+i));
    ctx.fillStyle=`rgba(113,244,239,${a})`;
    ctx.beginPath();ctx.arc(1030+i*45,690,4+(i%2),0,Math.PI*2);ctx.fill();
  }

  // Moon rover trail markers once route is mapped.
  if(DBX.state.moonRoute){
    const points=[[1320,850],[1420,900],[1540,940],[1670,860]];
    points.forEach(([x,y],i)=>{
      const pulse=6+Math.sin(t/300+i)*2;
      ctx.strokeStyle='rgba(106,255,237,.65)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,pulse,0,Math.PI*2);ctx.stroke();
    });
  }
  interactionGlow(ctx,t);
  ctx.restore();
}
function interactionGlow(ctx,t){
  const o=DBX.world.currentInteractable?.();
  if(!o||o.d>145)return;
  const pulse=30+Math.sin(t/220)*5;
  ctx.save();ctx.strokeStyle='rgba(255,245,140,.76)';ctx.lineWidth=3;
  ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(o.x,o.y,pulse,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();
}
function drawMinimap(canvas){
  if(!canvas)return;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,s=DBX.state;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#272b5b';ctx.beginPath();ctx.roundRect(0,0,w,h,18);ctx.fill();
  if(DBX.scene?.id==='station'){
    ctx.fillStyle='#68759e';ctx.beginPath();ctx.roundRect(12,12,w-24,h-24,16);ctx.fill();
    ctx.fillStyle='#9ef3b7';ctx.fillRect(w*.42,h*.46,18,12);
    ctx.fillStyle='#7fdfff';ctx.fillRect(w*.72,h*.26,15,10);
  }else{
    ctx.fillStyle='#7cd99a';ctx.fillRect(8,8,w*.68,h-16);
    ctx.fillStyle='#343863';ctx.fillRect(w*.7,8,w*.3-8,h-16);
    ctx.fillStyle='#d6d0c8';ctx.fillRect(20,h*.47,w*.58,13);
    const points=[
      [360,370,'#8e7bff'],[680,360,'#ffd862'],[930,650,'#ff9a68'],
      [1190,395,'#efefff'],[1375,610,'#8df4ff'],[1570,735,'#ffc767'],[1715,610,'#ff9fd2']
    ];
    for(const [x,y,color] of points){
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(x/DBX.WORLD.w*w,y/DBX.WORLD.h*h,3.5,0,Math.PI*2);ctx.fill();
    }
  }
  const bounds=DBX.scene?.bounds||DBX.WORLD;
  ctx.fillStyle='#fff';ctx.strokeStyle='#5b4ce5';ctx.lineWidth=3;
  const px=DBX.util.clamp(s.player.x/bounds.w*w,7,w-7),py=DBX.util.clamp(s.player.y/bounds.h*h,7,h-7);
  ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();ctx.stroke();
}
function compassText(){
  const a=DBX.state.player.dir||0;
  const deg=(a*180/Math.PI+360)%360;
  if(deg<45||deg>=315)return 'E';
  if(deg<135)return 'S';
  if(deg<225)return 'W';
  return 'N';
}
DBX.polish={drawAfterWorld,drawMinimap,compassText};
})();