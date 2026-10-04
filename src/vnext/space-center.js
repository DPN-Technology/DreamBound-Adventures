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
    ctx.fillStyle='#8de3ff';ctx.fillRect(0,0,DBX.WORLD.w,760);
    ctx.fillStyle='#79d68a';ctx.fillRect(0,760,1250,440);
    ctx.fillStyle='#24284d';ctx.fillRect(1250,0,550,1200);

    // Roads and campus.
    ctx.fillStyle='#d8d3c8';ctx.fillRect(90,545,1110,155);
    ctx.fillStyle='#f7f5e8';ctx.fillRect(120,570,1050,12);
    ctx.fillRect(120,655,1050,10);
    for(let x=160;x<1160;x+=90){ctx.fillStyle='#fff7a6';ctx.fillRect(x,615,48,8);}

    // Mission control.
    panel(ctx,250,245,220,170,'#5d55b8','#f8f5ff');
    ctx.font='58px serif';ctx.textAlign='center';ctx.fillText('🛰️',360,335);
    label(ctx,'MISSION CONTROL',360,395);

    // Solar array.
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      const x=590+col*67,y=285+row*70;
      ctx.fillStyle=s.solarFixed?'#55caff':'#3d579a';ctx.strokeStyle='#dff8ff';ctx.lineWidth=4;
      ctx.fillRect(x,y,55,55);ctx.strokeRect(x,y,55,55);
    }
    label(ctx,s.solarFixed?'SOLAR ONLINE':'SOLAR ARRAY',680,445);

    // Workshop.
    panel(ctx,815,545,230,170,'#ff9b62','#fff5e8');
    ctx.font='56px serif';ctx.fillText('🛠️',930,640);label(ctx,'ROCKET WORKSHOP',930,695);

    // Launch pad and rocket.
    ctx.fillStyle='#697087';ctx.beginPath();ctx.arc(1190,490,105,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c8ced8';ctx.beginPath();ctx.arc(1190,490,80,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(1190,385-(s.launched?Math.min(300,(t%3000)/10):0));
    ctx.font='82px serif';ctx.fillText('🚀',0,0);ctx.restore();
    label(ctx,s.launched?'LAUNCHED':'LAUNCH PAD',1190,610);

    // Moon sector.
    ctx.fillStyle='#3d416a';ctx.beginPath();ctx.arc(1490,360,160,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#74799d';ctx.beginPath();ctx.arc(1440,320,32,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(1530,390,23,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#bfc4df';ctx.fillRect(1430,710,135,100);
    ctx.font='50px serif';ctx.fillText('🛰️',1498,770);
    label(ctx,'MOON TRAINING',1510,830);

    if(s.launched){
      for(const r of rocks){
        if(s.moonRocks.includes(r.id))continue;
        ctx.font='35px serif';ctx.fillText(r.icon,r.x,r.y+Math.sin(t/350+r.x)*5);
      }
    }

    // Decorative stars in dark sector.
    ctx.fillStyle='#fff6b0';
    for(let i=0;i<35;i++){const x=1270+(i*137)%500,y=40+(i*83)%620;ctx.fillRect(x,y,3+(i%2),3+(i%2));}
    ctx.restore();
  }
};
function panel(ctx,x,y,w,h,color,light){
  ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(x+10,y+12,w,h);
  ctx.fillStyle=color;round(ctx,x,y,w,h,22);ctx.fill();
  ctx.fillStyle=light;round(ctx,x+12,y+12,w-24,38,12);ctx.fill();
}
function round(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function label(ctx,text,x,y){
  ctx.save();ctx.textAlign='center';ctx.font='900 13px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#2f3158';ctx.fillStyle='#fff';
  ctx.strokeText(text,x,y);ctx.fillText(text,x,y);ctx.restore();
}
})();