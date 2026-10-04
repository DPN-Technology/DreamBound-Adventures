(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.events)return;

const KEY='dreambound-v2-simulation-kernel-v1';
const ZONES=['space-center','tranquility-basin','crystal-ridge','luma-hollow','moon-base','lunar-station'];
const ACTORS=['nova','gear','moss','luma','puff','pebble','orbit','glimmer'];

const defaults=()=>({
  tick:0,
  epoch:0,
  zoneHeat:{'space-center':0,'tranquility-basin':0,'crystal-ridge':0,'luma-hollow':0,'moon-base':0,'lunar-station':0},
  actorMood:{nova:'curious',gear:'focused',moss:'calm',luma:'bright',puff:'playful',pebble:'curious',orbit:'calm',glimmer:'bright'},
  signals:[],
  discoveries:[],
  lastZone:'space-center'
});

function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const heat={};
  for(const z of ZONES)heat[z]=DBX.util.int(r.zoneHeat?.[z],0,100,0);
  const moods=['curious','focused','calm','bright','playful','resting'];
  const actorMood={};
  for(const a of ACTORS)actorMood[a]=moods.includes(r.actorMood?.[a])?r.actorMood[a]:defaults().actorMood[a];
  return {
    tick:DBX.util.int(r.tick,0,999999999,0),
    epoch:DBX.util.int(r.epoch,0,999999999,0),
    zoneHeat:heat,
    actorMood,
    signals:Array.isArray(r.signals)?r.signals.filter(x=>x&&typeof x==='object').slice(-24).map(x=>({
      type:String(x.type||'world').replace(/[^a-z0-9-]/gi,'').slice(0,32),
      zone:ZONES.includes(x.zone)?x.zone:'space-center',
      strength:DBX.util.int(x.strength,0,100,0)
    })):[],
    discoveries:DBX.util.list(r.discoveries,['first-moon-activity','crystal-surge','social-wave','story-resonance','base-awakening'],12),
    lastZone:ZONES.includes(r.lastZone)?r.lastZone:'space-center'
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={accum:0,lastSnapshot:null,subscribers:new Set(),lastMoodTick:0};

function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function zoneOf(){
  if(DBX.scene?.id==='station')return 'lunar-station';
  const p=DBX.state.player;
  if(!DBX.state.launched||p.x<1250)return 'space-center';
  if(p.y>960)return 'moon-base';
  if(p.x>1630&&p.y<800)return 'luma-hollow';
  if(p.x>1500)return 'crystal-ridge';
  return 'tranquility-basin';
}
function emit(type,zone,strength){
  const sig={type,zone:ZONES.includes(zone)?zone:zoneOf(),strength:DBX.util.int(strength,0,100,10)};
  state.signals.push(sig);state.signals=state.signals.slice(-24);
  for(const fn of runtime.subscribers)try{fn(sig)}catch{}
}
function subscribe(fn){if(typeof fn!=='function')return()=>{};runtime.subscribers.add(fn);return()=>runtime.subscribers.delete(fn)}

function worldPressure(){
  const s=DBX.state;
  return Math.min(100,
    (s.eventWins||0)*6+
    (s.baseModules?.length||0)*8+
    (s.codexEntries?.length||0)*2+
    (DBX.storyArcs?.state?.started?8:0)+
    (DBX.storyArcs?.state?.complete?12:0)
  );
}
function updateZoneHeat(zone){
  for(const z of ZONES){
    const target=z===zone?Math.min(100,25+worldPressure()):0;
    const current=state.zoneHeat[z]||0;
    state.zoneHeat[z]=Math.round(current+(target-current)*.12);
  }
}
function moodFor(actor){
  const activeEvent=DBX.worldEvents?.runtime?.active;
  const weather=DBX.worldSystems?.state?.weather;
  const story=DBX.storyArcs?.state;
  if(activeEvent)return actor==='gear'?'focused':actor==='moss'?'curious':'bright';
  if(story?.started&&!story.complete)return actor==='luma'?'bright':'curious';
  if(weather==='crystal-glow')return actor==='moss'?'focused':'curious';
  if(weather==='stardust')return ['luma','orbit','glimmer'].includes(actor)?'bright':'calm';
  if((state.tick+actor.length)%5===0)return 'resting';
  return defaults().actorMood[actor]||'calm';
}
function updateMoods(){
  for(const a of ACTORS)state.actorMood[a]=moodFor(a);
}
function snapshot(){
  const zone=zoneOf();
  return {
    tick:state.tick,
    epoch:state.epoch,
    zone,
    zoneHeat:{...state.zoneHeat},
    actorMood:{...state.actorMood},
    weather:DBX.worldSystems?.state?.weather||'clear',
    event:DBX.worldEvents?.runtime?.active?.id||null,
    story:DBX.storyArcs?.state?.started?(DBX.storyArcs.state.complete?'complete':'active'):'idle',
    baseLevel:DBX.state.baseModules?.length||0,
    ecologyVisits:DBX.ecology?.state?.visits||0,
    npcHelped:DBX.livingNpcs?.state?.helped?.length||0
  };
}
function discover(){
  const s=DBX.state;
  const pairs=[
    ['first-moon-activity',()=>s.launched&&state.tick>20],
    ['crystal-surge',()=>DBX.worldSystems?.state?.weather==='crystal-glow'],
    ['social-wave',()=>((s.npcFriendship?.nova||0)+(s.npcFriendship?.gear||0)+(s.npcFriendship?.moss||0))>=9],
    ['story-resonance',()=>DBX.storyArcs?.state?.complete],
    ['base-awakening',()=>s.baseModules?.length>=4]
  ];
  for(const [id,test] of pairs){
    if(state.discoveries.includes(id))continue;
    let yes=false;try{yes=!!test()}catch{}
    if(!yes)continue;
    state.discoveries.push(id);
    emit('discovery',zoneOf(),40);
    DBX.odyssey?.addXP?.(18,'World simulation discovery');
  }
}
function step(dt){
  runtime.accum+=dt;
  if(runtime.accum<.25)return;
  runtime.accum=0;
  state.tick++;
  if(state.tick%240===0)state.epoch++;
  const zone=zoneOf();
  if(zone!==state.lastZone){
    emit('zone-shift',zone,30);
    state.lastZone=zone;
  }
  updateZoneHeat(zone);
  if(state.tick-runtime.lastMoodTick>=4){
    runtime.lastMoodTick=state.tick;
    updateMoods();
  }
  discover();
  if(state.tick%8===0){
    runtime.lastSnapshot=snapshot();
    DBX.events.emit('simulation:snapshot',runtime.lastSnapshot);
    save();
  }
}
function status(){
  const snap=runtime.lastSnapshot||snapshot();
  return {
    ...snap,
    pressure:worldPressure(),
    recentSignals:[...state.signals].slice(-6),
    discoveries:[...state.discoveries]
  };
}
function open(){
  const s=status();
  const zoneRows=ZONES.map(z=>'<div class="resource-strip"><span>'+z.replace(/-/g,' ').toUpperCase()+'</span><b>'+s.zoneHeat[z]+'%</b></div>').join('');
  const moods=ACTORS.map(a=>'<span>'+a.toUpperCase()+' · '+s.actorMood[a]+'</span>').join('');
  DBX.ui.openModal(
    '<h2>🧠 DreamBound World Simulation</h2>'+
    '<p>A deterministic local simulation now coordinates zones, actors, environment, progression, and story state.</p>'+
    '<div class="director-score">WORLD PRESSURE <b>'+s.pressure+'</b></div>'+
    '<div>'+zoneRows+'</div>'+
    '<div class="friend-roster"><strong>ACTOR STATE</strong>'+moods+'</div>'+
    '<small>Kernel tick '+s.tick+' · epoch '+s.epoch+' · '+s.discoveries.length+' systemic discoveries</small>'+
    '<button id="simClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#simClose').onclick=DBX.ui.closeModal;
}
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextSimulationBtn')){
  const b=document.createElement('button');b.id='vnextSimulationBtn';b.className='deck-chip';b.textContent='🧠 SIM';b.onclick=open;hud.appendChild(b);
}
DBX.events.on('worldevent:start',()=>emit('world-event',zoneOf(),50));
DBX.events.on('story:beat',()=>emit('story-beat',zoneOf(),45));
DBX.events.on('quest:complete',()=>emit('quest-complete',zoneOf(),35));
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());runtime.lastSnapshot=null;save()});
DBX.simulation={state,runtime,step,status,subscribe,emit,zoneOf,worldPressure,open};
})();