(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.simulation||!DBX.events)return;

const KEY='dreambound-v2-autonomous-world-v1';
const ACTORS=['nova','gear','moss','puff','pebble','orbit','glimmer'];
const GOALS=['explore','help','observe','rest','socialize','study','protect'];
const ZONES=['space-center','tranquility-basin','crystal-ridge','luma-hollow','moon-base','lunar-station'];

const defaults=()=>({
  actorGoals:{nova:'observe',gear:'help',moss:'study',puff:'socialize',pebble:'explore',orbit:'observe',glimmer:'explore'},
  actorZones:{nova:'space-center',gear:'space-center',moss:'tranquility-basin',puff:'space-center',pebble:'moon-base',orbit:'crystal-ridge',glimmer:'luma-hollow'},
  zoneStage:{'space-center':0,'tranquility-basin':0,'crystal-ridge':0,'luma-hollow':0,'moon-base':0,'lunar-station':0},
  decisions:0,
  transitions:0
});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const actorGoals={},actorZones={},zoneStage={};
  for(const a of ACTORS){
    actorGoals[a]=GOALS.includes(r.actorGoals?.[a])?r.actorGoals[a]:defaults().actorGoals[a];
    actorZones[a]=ZONES.includes(r.actorZones?.[a])?r.actorZones[a]:defaults().actorZones[a];
  }
  for(const z of ZONES)zoneStage[z]=DBX.util.int(r.zoneStage?.[z],0,3,0);
  return {
    actorGoals,actorZones,zoneStage,
    decisions:DBX.util.int(r.decisions,0,99999999,0),
    transitions:DBX.util.int(r.transitions,0,99999999,0)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={lastDecisionTick:-999,accum:0};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

function goalScores(actor){
  const sim=DBX.simulation.status(),mood=sim.actorMood[actor]||'calm',heat=sim.zoneHeat[sim.zone]||0;
  const scores={
    explore:20+Math.max(0,55-heat)+(mood==='curious'?25:0),
    help:18+(sim.event?32:0)+(sim.baseLevel<4?10:0)+(actor==='gear'?18:0),
    observe:22+(sim.weather!=='clear'?20:0)+(actor==='nova'?20:0),
    rest:10+(mood==='resting'?50:0)+(heat>75?16:0),
    socialize:16+(sim.npcHelped<3?10:0)+(['puff','glimmer'].includes(actor)?18:0),
    study:18+(sim.weather==='crystal-glow'?34:0)+(actor==='moss'?24:0),
    protect:12+(sim.event?28:0)+(sim.story==='active'?16:0)
  };
  return scores;
}
function chooseGoal(actor){
  const scores=goalScores(actor);
  return Object.entries(scores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
}
function zoneFor(actor,goal){
  const sim=DBX.simulation.status();
  if(goal==='study')return sim.weather==='crystal-glow'?'crystal-ridge':'tranquility-basin';
  if(goal==='help')return sim.baseLevel<4?'moon-base':sim.zone;
  if(goal==='observe')return actor==='nova'?'crystal-ridge':sim.zone;
  if(goal==='socialize')return DBX.state.lumaRescued?'luma-hollow':'space-center';
  if(goal==='rest')return actor==='puff'?'space-center':'luma-hollow';
  if(goal==='protect')return sim.event?sim.zone:'tranquility-basin';
  const ordered=['tranquility-basin','crystal-ridge','luma-hollow','moon-base'];
  return DBX.state.launched?ordered[(DBX.simulation.state.tick+actor.length)%ordered.length]:'space-center';
}
function decide(){
  const tick=DBX.simulation.state.tick;
  if(tick-runtime.lastDecisionTick<8)return;
  runtime.lastDecisionTick=tick;
  for(const actor of ACTORS){
    const goal=chooseGoal(actor),zone=zoneFor(actor,goal);
    if(state.actorGoals[actor]!==goal||state.actorZones[actor]!==zone){
      state.actorGoals[actor]=goal;state.actorZones[actor]=zone;state.transitions++;
      DBX.simulation.emit('actor-intent',zone,25);
    }
    state.decisions++;
  }
  evolveZones();
  save();
}
function evolveZones(){
  const sim=DBX.simulation.status();
  for(const z of ZONES){
    const heat=sim.zoneHeat[z]||0;
    let stage=0;
    if(heat>=75)stage=3;
    else if(heat>=50)stage=2;
    else if(heat>=25)stage=1;
    if(z==='moon-base')stage=Math.max(stage,Math.min(3,Math.floor((DBX.state.baseModules?.length||0)/1.4)));
    if(z==='crystal-ridge'&&sim.weather==='crystal-glow')stage=Math.max(stage,2);
    if(z==='luma-hollow'&&DBX.state.lumaRescued)stage=Math.max(stage,1);
    state.zoneStage[z]=stage;
  }
}
function actorIntent(actor){
  return {actor,goal:state.actorGoals[actor],zone:state.actorZones[actor],mood:DBX.simulation.state.actorMood[actor]||'calm'};
}
function tick(dt){
  runtime.accum+=dt;
  if(runtime.accum<.5)return;
  runtime.accum=0;decide();
}
function drawZones(ctx,t){
  if(DBX.scene?.id==='station')return;
  const zones=[
    ['space-center',300,340,560,420],
    ['tranquility-basin',1250,580,260,300],
    ['crystal-ridge',1490,520,300,330],
    ['luma-hollow',1600,430,180,220],
    ['moon-base',1460,930,320,240]
  ];
  ctx.save();
  for(const [id,x,y,w,h] of zones){
    const stage=state.zoneStage[id]||0;if(stage<=0)continue;
    const alpha=.025+stage*.018;
    ctx.fillStyle='rgba(170,155,255,'+alpha+')';ctx.beginPath();ctx.roundRect(x,y,w,h,28);ctx.fill();
    if(stage>=2){
      ctx.strokeStyle='rgba(145,244,235,'+(.16+stage*.05)+')';ctx.lineWidth=2;
      ctx.setLineDash(stage===3?[8,6]:[4,8]);ctx.stroke();ctx.setLineDash([]);
    }
  }
  ctx.restore();
}
function open(){
  const cards=ACTORS.map(a=>{
    const i=actorIntent(a);
    return '<article class="director-level active"><span>🧠</span><strong>'+a.toUpperCase()+'</strong><small>'+i.goal.toUpperCase()+' · '+i.zone.replace(/-/g,' ')+' · '+i.mood+'</small></article>';
  }).join('');
  const zones=ZONES.map(z=>'<span>'+z.replace(/-/g,' ').toUpperCase()+' · STAGE '+state.zoneStage[z]+'</span>').join('');
  DBX.ui.openModal(
    '<h2>🌐 Autonomous World</h2>'+
    '<p>Actors now choose goals from simulation pressure, mood, weather, events, story state, and progression.</p>'+
    '<div class="director-grid">'+cards+'</div>'+
    '<div class="friend-roster"><strong>ZONE EVOLUTION</strong>'+zones+'</div>'+
    '<small>'+state.decisions+' decisions · '+state.transitions+' intent transitions</small>'+
    '<button id="autonomyClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#autonomyClose').onclick=DBX.ui.closeModal;
}
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextAutonomyBtn')){
  const b=document.createElement('button');b.id='vnextAutonomyBtn';b.className='deck-chip';b.textContent='🌐 WORLD AI';b.onclick=open;hud.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.autonomousWorld={state,runtime,tick,goalScores,chooseGoal,zoneFor,actorIntent,drawZones,open};
})();