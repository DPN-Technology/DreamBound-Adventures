(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const interactables=[
  {id:'mission',name:'Mission Control',x:360,y:370,icon:'🛰️',action:'signal',hint:'Decode the star signal.'},
  {id:'solar',name:'Solar Array',x:680,y:360,icon:'☀️',action:'solar',hint:'Restore power to the launch campus.'},
  {id:'workshop',name:'Rocket Workshop',x:930,y:650,icon:'🛠️',action:'rocket',hint:'Assemble the rocket systems.'},
  {id:'launch',name:'Launch Pad',x:1190,y:395,icon:'🚀',action:'launch',hint:'Launch when the campus is ready.'},
  {id:'moon-console',name:'Moon Rover Console',x:1495,y:790,icon:'🌕',action:'moon',hint:'Map a safe rover path.',moon:true}
];
const rocks=[
  {id:'rock-a',x:1360,y:930,icon:'🪨'},
  {id:'rock-b',x:1585,y:1010,icon:'🌑'},
  {id:'rock-c',x:1690,y:845,icon:'☄️'}
];
DBX.world={
  interactables,
  rocks,
  currentInteractable(){
    const p=DBX.state.player;
    return interactables.filter(o=>!o.moon||DBX.state.launched).map(o=>({...o,d:Math.hypot(p.x-o.x,p.y-o.y)})).sort((a,b)=>a.d-b.d)[0]||null;
  },
  draw(ctx,t){
    const s=DBX.state;
    ctx.save();

    const sky=ctx.createLinearGradient(0,0,0,760);
    sky.addColorStop(0,'#071127');sky.addColorStop(.55,'#102f4b');sky.addColorStop(1,'#174d54');
    ctx.fillStyle=sky;ctx.fillRect(0,0,1250,1200);

    const ground=ctx.createLinearGradient(0,690,0,1200);
    ground.addColorStop(0,'#123b39');ground.addColorStop(1,'#0d282b');
    ctx.fillStyle=ground;ctx.fillRect(0,690,1250,510);

    const moonSky=ctx.createLinearGradient(1250,0,1800,1200);
    moonSky.addColorStop(0,'#050919');moonSky.addColorStop(.5,'#11162c');moonSky.addColorStop(1,'#202640');
    ctx.fillStyle=moonSky;ctx.fillRect(1250,0,550,1200);
    ctx.fillStyle='#2a3047';ctx.fillRect(1250,720,550,480);

    ctx.save();ctx.globalAlpha=.2;ctx.strokeStyle='#62e6d9';ctx.lineWidth=1;
    for(let x=0;x<1250;x+=100){ctx.beginPath();ctx.moveTo(x,690);ctx.lineTo(x,1200);ctx.stroke();}
    for(let y=690;y<1200;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1250,y);ctx.stroke();}
    ctx.restore();

    drawStars(ctx,t);
    drawCampusRoutes(ctx);

    drawFacility(ctx,250,245,220,170,'MISSION CONTROL','#15274c','#6fe8dc');
    drawScreen(ctx,360,320,126,56,'#081222',s.signalSolved?'SIGNAL LOCKED':'STAR SIGNAL',s.signalSolved?'#70f0b7':'#77c8ff');

    drawSolar(ctx,s.solarFixed);
    drawFacility(ctx,815,545,230,170,'ROCKET WORKSHOP','#322640','#ff9c72');
    drawWorkshopMark(ctx,930,625);

    drawLaunchPad(ctx,t,s.launched);
    drawDreamGate(ctx,t);
    drawMoonSector(ctx,t,s);

    if(s.launched){
      for(const r of rocks){
        if(s.moonRocks.includes(r.id))continue;
        const pulse=1+(DBX.accessibility?.shouldAnimate?.()??true?Math.sin(t/350+r.x)*.08:0);
        ctx.save();ctx.translate(r.x,r.y);ctx.scale(pulse,pulse);
        ctx.fillStyle='rgba(118,230,222,.10)';ctx.beginPath();ctx.arc(0,0,31,0,Math.PI*2);ctx.fill();
        ctx.font='29px serif';ctx.textAlign='center';ctx.fillText(r.icon,0,8);ctx.restore();
      }
    }
    ctx.restore();
  }
};

function drawStars(ctx,t){
  const animate=DBX.accessibility?.shouldAnimate?.()??true;
  for(let i=0;i<58;i++){
    const x=30+(i*157)%1740,y=25+(i*83)%630;
    const a=animate ? .35+.35*(.5+.5*Math.sin(t/580+i)) : .52;
    ctx.fillStyle='rgba(220,241,255,'+a+')';
    ctx.beginPath();ctx.arc(x,y,1+(i%3)*.38,0,Math.PI*2);ctx.fill();
  }
}
function drawCampusRoutes(ctx){
  ctx.lineCap='round';
  const route=ctx.createLinearGradient(100,0,1180,0);route.addColorStop(0,'rgba(115,238,223,.18)');route.addColorStop(.5,'#6fe8dc');route.addColorStop(1,'rgba(155,132,255,.34)');
  ctx.strokeStyle='rgba(4,11,24,.9)';ctx.lineWidth=80;ctx.beginPath();ctx.moveTo(110,615);ctx.bezierCurveTo(430,575,780,630,1180,575);ctx.stroke();
  ctx.strokeStyle=route;ctx.lineWidth=3;ctx.setLineDash([18,16]);ctx.stroke();ctx.setLineDash([]);
}
function drawFacility(ctx,x,y,w,h,title,base,accent){
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.roundRect(x+12,y+14,w,h,22);ctx.fill();
  const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,base);g.addColorStop(1,'#0b1327');
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,22);ctx.fill();
  ctx.strokeStyle='rgba(146,169,221,.28)';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=accent;ctx.fillRect(x+18,y+18,w-36,4);
  ctx.font='800 11px system-ui';ctx.fillStyle='#eaf3ff';ctx.textAlign='center';ctx.fillText(title,x+w/2,y+h-22);
}
function drawScreen(ctx,x,y,w,h,base,text,accent){
  ctx.fillStyle=base;ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,11);ctx.fill();
  ctx.strokeStyle=accent;ctx.lineWidth=1.5;ctx.stroke();
  ctx.font='700 9px ui-monospace,monospace';ctx.fillStyle=accent;ctx.textAlign='center';ctx.fillText(text,x,y+3);
}
function drawSolar(ctx,online){
  drawFacility(ctx,560,250,240,210,'SOLAR ARRAY','#132b47',online?'#6ff0bd':'#5e86db');
  for(let row=0;row<2;row++){
    for(let col=0;col<3;col++){
      const x=585+col*66,y=295+row*64;
      const g=ctx.createLinearGradient(x,y,x+54,y+50);g.addColorStop(0,online?'#214d68':'#172c57');g.addColorStop(1,online?'#317e8b':'#253a72');
      ctx.fillStyle=g;ctx.fillRect(x,y,54,50);ctx.strokeStyle=online?'#67efca':'#6286cf';ctx.lineWidth=1.5;ctx.strokeRect(x,y,54,50);
      ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(x+27,y);ctx.lineTo(x+27,y+50);ctx.moveTo(x,y+25);ctx.lineTo(x+54,y+25);ctx.stroke();
    }
  }
}
function drawWorkshopMark(ctx,x,y){
  ctx.save();ctx.translate(x,y);ctx.strokeStyle='#ff9c72';ctx.lineWidth=5;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*34,Math.sin(a)*34);ctx.lineTo(Math.cos(a)*43,Math.sin(a)*43);ctx.stroke();}
  ctx.fillStyle='#ffb58f';ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawLaunchPad(ctx,t,launched){
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(1190,520,118,58,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#78839f';ctx.lineWidth=20;ctx.beginPath();ctx.arc(1190,500,90,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#6fe8dc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(1190,500,82,0,Math.PI*2);ctx.stroke();

  const y=385-(launched?Math.min(330,(t%3200)/8):0);
  ctx.save();ctx.translate(1190,y);
  ctx.fillStyle='#eef4ff';ctx.beginPath();ctx.moveTo(0,-62);ctx.quadraticCurveTo(30,-30,30,26);ctx.lineTo(-30,26);ctx.quadraticCurveTo(-30,-30,0,-62);ctx.fill();
  ctx.fillStyle='#744ee7';ctx.beginPath();ctx.arc(0,-15,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff8777';ctx.beginPath();ctx.moveTo(-30,12);ctx.lineTo(-49,39);ctx.lineTo(-18,31);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(30,12);ctx.lineTo(49,39);ctx.lineTo(18,31);ctx.closePath();ctx.fill();
  if(launched){
    const flame=40+Math.sin(t/50)*8;ctx.fillStyle='#ffd36e';ctx.beginPath();ctx.moveTo(-12,26);ctx.lineTo(0,26+flame);ctx.lineTo(12,26);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  label(ctx,launched?'LAUNCH ACTIVE':'LAUNCH PAD',1190,624,launched?'#ffd36e':'#9ab0d8');
}
function drawDreamGate(ctx,t){
  const pulse=(DBX.accessibility?.shouldAnimate?.()??true)?1+Math.sin(t/450)*.035:1;
  ctx.save();ctx.translate(1090,760);ctx.scale(pulse,pulse);
  ctx.strokeStyle='rgba(111,232,220,.26)';ctx.lineWidth=18;ctx.beginPath();ctx.arc(0,0,62,0,Math.PI*2);ctx.stroke();
  const g=ctx.createLinearGradient(-45,-45,45,45);g.addColorStop(0,'#6fe8dc');g.addColorStop(.5,'#8d75ff');g.addColorStop(1,'#ff86cb');
  ctx.strokeStyle=g;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,48,0,Math.PI*2);ctx.stroke();
  ctx.rotate(t/2600);ctx.setLineDash([10,12]);ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();label(ctx,'DREAMGATE NEXUS',1090,850,'#6fe8dc');
}
function drawMoonSector(ctx,t,s){
  ctx.save();
  ctx.fillStyle='#c8ccda';ctx.beginPath();ctx.arc(1490,340,142,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8c93aa';ctx.beginPath();ctx.arc(1445,305,29,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(1535,380,22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(12,17,35,.8)';ctx.beginPath();ctx.roundRect(1425,710,145,112,18);ctx.fill();
  ctx.strokeStyle='#6fe8dc';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#6fe8dc';ctx.fillRect(1443,728,109,4);
  ctx.font='700 10px system-ui';ctx.fillStyle='#edf5ff';ctx.textAlign='center';ctx.fillText('ROVER CONTROL',1497,776);
  ctx.fillStyle=s.launched?'#67efbf':'#63708f';ctx.beginPath();ctx.arc(1497,796,8,0,Math.PI*2);ctx.fill();
  label(ctx,'MOON OPERATIONS',1497,850,s.launched?'#6fe8dc':'#8090b0');

  ctx.strokeStyle='rgba(124,140,184,.18)';ctx.lineWidth=1;
  for(let x=1290;x<1780;x+=70){ctx.beginPath();ctx.moveTo(x,760);ctx.lineTo(x,1200);ctx.stroke();}
  for(let y=760;y<1200;y+=70){ctx.beginPath();ctx.moveTo(1250,y);ctx.lineTo(1800,y);ctx.stroke();}
  ctx.restore();
}
function label(ctx,text,x,y,color){
  ctx.save();ctx.textAlign='center';ctx.font='800 11px system-ui';ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.fillText(text,x,y);ctx.restore();
}
})();