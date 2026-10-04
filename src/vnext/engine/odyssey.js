(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.ui||!DBX.world)return;

const KEY='dreambound-vnext-odyssey-v1';
const defaults=()=>({
  xp:0,rank:1,sparkPoints:0,
  skills:[],
  completedExpeditions:[],
  expeditionWins:0,
  dreamCore:0,
  stationsVisited:[],
  streak:0,
  lastMilestone:0
});
const allowedSkills=['pathfinder-1','pathfinder-2','creator-1','creator-2','guardian-1','guardian-2'];
const allowedExpeditions=['signal-sprint','lunar-cartographer','luma-guardian','dream-architect','world-scholar','event-ranger'];
const sanitize=raw=>{
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},d=defaults();
  return {
    xp:DBX.util.int(r.xp,0,999999,d.xp),
    rank:DBX.util.int(r.rank,1,50,d.rank),
    sparkPoints:DBX.util.int(r.sparkPoints,0,999,d.sparkPoints),
    skills:DBX.util.list(r.skills,allowedSkills,allowedSkills.length),
    completedExpeditions:DBX.util.list(r.completedExpeditions,allowedExpeditions,allowedExpeditions.length),
    expeditionWins:DBX.util.int(r.expeditionWins,0,999,d.expeditionWins),
    dreamCore:DBX.util.int(r.dreamCore,0,100,d.dreamCore),
    stationsVisited:DBX.util.list(r.stationsVisited,['dream-core','expedition-gate','constellation-observatory'],3),
    streak:DBX.util.int(r.streak,0,99,d.streak),
    lastMilestone:DBX.util.int(r.lastMilestone,0,100,d.lastMilestone)
  };
};
function load(){
  try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}
  catch{return defaults()}
}
const meta=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(meta))}catch{}}
function reset(){Object.assign(meta,defaults());save()}
function rankForXp(xp){return Math.min(50,1+Math.floor(Math.sqrt(xp/45)))}
function nextRankXp(rank){return Math.max(45,45*rank*rank)}
function mastery(){
  const s=DBX.state;
  const checks=[
    s.signalSolved,s.solarFixed,s.rocketFixed,s.launched,s.moonRoute,s.moonRocks.length===3,
    s.stationGarden,s.roverUnlocked,s.lumaRescued,(s.eventWins||0)>=1,(s.baseModules||[]).length>=2,
    (s.codexEntries||[]).length>=5,meta.completedExpeditions.length>=3,meta.skills.length>=4
  ];
  return Math.round(checks.filter(Boolean).length/checks.length*100);
}
function constellation(){
  const segments=[
    ['Launch Systems',DBX.state.launched?100:[DBX.state.signalSolved,DBX.state.solarFixed,DBX.state.rocketFixed].filter(Boolean).length*25],
    ['Lunar Guardian',Math.round([DBX.state.moonRoute,DBX.state.moonRocks.length===3,DBX.state.stationGarden,DBX.state.lumaRescued].filter(Boolean).length/4*100)],
    ['Living World',Math.min(100,(DBX.state.eventWins||0)*25)],
    ['Creation',Math.min(100,(DBX.state.baseModules||[]).length*25)],
    ['Discovery',Math.min(100,(DBX.state.codexEntries||[]).length*12.5)],
    ['Odyssey',Math.round(meta.completedExpeditions.length/allowedExpeditions.length*100)]
  ];
  return segments;
}
function addXP(amount,label){
  const before=meta.rank;
  meta.xp=Math.min(999999,meta.xp+Math.max(0,amount|0));
  meta.rank=rankForXp(meta.xp);
  meta.dreamCore=Math.min(100,meta.dreamCore+Math.max(1,Math.round(amount/2)));
  if(meta.rank>before){
    meta.sparkPoints+=meta.rank-before;
    DBX.ui.toast('Explorer Rank '+meta.rank,'New Spark Point earned! ✨');
    DBX.fx?.burst?.(DBX.state.player.x,DBX.state.player.y,'#fff0a8',18);
  }else if(label)DBX.ui.toast(label,'+'+amount+' Odyssey XP');
  save();refresh();
}
function expeditionDefs(){
  const s=DBX.state;
  return [
    {id:'signal-sprint',icon:'🛰️',name:'Signal Sprint',desc:'Bring the Space Center online.',ready:s.signalSolved&&s.solarFixed&&s.rocketFixed,reward:80},
    {id:'lunar-cartographer',icon:'🌕',name:'Lunar Cartographer',desc:'Map the route and recover all Moon rocks.',ready:s.moonRoute&&s.moonRocks.length===3,reward:110},
    {id:'luma-guardian',icon:'🐇',name:'Luma Guardian',desc:'Restore the station and rescue Luma.',ready:s.stationGarden&&s.lumaRescued,reward:140},
    {id:'dream-architect',icon:'🏗️',name:'Dream Architect',desc:'Construct at least three Moon Base modules.',ready:(s.baseModules||[]).length>=3,reward:130},
    {id:'world-scholar',icon:'📚',name:'World Scholar',desc:'Discover at least six Codex entries.',ready:(s.codexEntries||[]).length>=6,reward:120},
    {id:'event-ranger',icon:'🌌',name:'Event Ranger',desc:'Complete three Living World events.',ready:(s.eventWins||0)>=3,reward:150}
  ];
}
function claimExpedition(id){
  const def=expeditionDefs().find(x=>x.id===id);
  if(!def||!def.ready||meta.completedExpeditions.includes(id))return;
  meta.completedExpeditions.push(id);meta.expeditionWins++;meta.sparkPoints++;save();
  DBX.state.stars=(DBX.state.stars||0)+8;DBX.state.gems=(DBX.state.gems||0)+4;DBX.storage.save();
  addXP(def.reward,'Expedition complete: '+def.name);
  openOdyssey();
}
const skills=[
  {id:'pathfinder-1',path:'PATHFINDER',icon:'🧭',name:'Trail Reader',cost:1,requires:null,desc:'Explorer movement +10%.'},
  {id:'pathfinder-2',path:'PATHFINDER',icon:'🚀',name:'Hyper Route',cost:2,requires:'pathfinder-1',desc:'Rover movement +12%.'},
  {id:'creator-1',path:'CREATOR',icon:'🏗️',name:'Maker Mind',cost:1,requires:null,desc:'Creation rewards gain bonus Odyssey XP.'},
  {id:'creator-2',path:'CREATOR',icon:'✨',name:'Dream Forge',cost:2,requires:'creator-1',desc:'Base milestones charge DreamCore faster.'},
  {id:'guardian-1',path:'GUARDIAN',icon:'💜',name:'Buddy Bond',cost:1,requires:null,desc:'Luma bond milestones gain bonus XP.'},
  {id:'guardian-2',path:'GUARDIAN',icon:'🛡️',name:'World Keeper',cost:2,requires:'guardian-1',desc:'World events award bonus gems.'}
];
function buySkill(id){
  const sk=skills.find(x=>x.id===id);if(!sk||meta.skills.includes(id))return;
  if(sk.requires&&!meta.skills.includes(sk.requires)){DBX.ui.toast('Skill locked','Unlock the first skill in this path.');return}
  if(meta.sparkPoints<sk.cost){DBX.ui.toast('Need more Spark Points','Complete expeditions or rank up.');return}
  meta.sparkPoints-=sk.cost;meta.skills.push(id);save();applyPassives();DBX.ui.toast(sk.name,'Skill unlocked!');openOdyssey();
}
function applyPassives(){
  const s=DBX.state;
  const foot=meta.skills.includes('pathfinder-1')?275:250;
  if(!s.roverActive)s.player.speed=foot;
  if(s.roverActive&&meta.skills.includes('pathfinder-2'))s.player.speed=482;
}
function evaluateMilestones(){
  const score=mastery();
  const milestone=Math.floor(score/10)*10;
  if(milestone>meta.lastMilestone){
    const jumps=(milestone-meta.lastMilestone)/10;
    meta.lastMilestone=milestone;save();addXP(15*jumps,'Constellation milestone '+milestone+'%');
  }
}
function adaptiveHint(){
  const s=DBX.state;
  if(!s.signalSolved)return 'Start at 🛰️ Mission Control. Copy the star signal with no-fail retries.';
  if(!s.launched)return 'Finish campus systems, then use 🚀 Launch Pad.';
  if(!s.lumaRescued)return 'The Moon chapter continues through route mapping → station garden → rover → Luma.';
  if((s.baseModules||[]).length<3)return 'Try 🏗️ Base and build three modules to unlock Dream Architect.';
  if((s.eventWins||0)<3)return 'Stay in the Living World for dynamic events and earn Event Ranger.';
  if(meta.completedExpeditions.length<allowedExpeditions.length)return 'Open ODYSSEY and claim any expedition showing READY.';
  return 'All Odyssey contracts cleared. Build mastery, collect Codex lore, and perfect the constellation.';
}
function stationInteract(action){
  if(action==='odyssey-core'){markVisit('dream-core');openOdyssey();return true}
  if(action==='odyssey-gate'){markVisit('expedition-gate');openExpeditions();return true}
  if(action==='odyssey-observatory'){markVisit('constellation-observatory');openConstellation();return true}
  return false;
}
function markVisit(id){
  if(!meta.stationsVisited.includes(id)){meta.stationsVisited.push(id);addXP(12,'New Odyssey station discovered')}
}
function openOdyssey(){
  const rankProgress=Math.min(100,Math.round(meta.xp/nextRankXp(meta.rank)*100));
  DBX.ui.openModal(
    '<div class="odyssey-head"><div><small>DREAMBOUND ODYSSEY NETWORK</small><h2>🌌 Explorer Command</h2></div><b>RANK '+meta.rank+'</b></div>'+
    '<div class="odyssey-grid">'+
      '<section><span>ODYSSEY XP</span><strong>'+meta.xp+'</strong><i><b style="width:'+rankProgress+'%"></b></i></section>'+
      '<section><span>SPARK POINTS</span><strong>✨ '+meta.sparkPoints+'</strong><small>Spend in skill paths</small></section>'+
      '<section><span>DREAMCORE</span><strong>💠 '+meta.dreamCore+'%</strong><small>World synchronization</small></section>'+
      '<section><span>MASTERY</span><strong>🏆 '+mastery()+'%</strong><small>'+meta.completedExpeditions.length+'/6 contracts</small></section>'+
    '</div>'+
    '<div class="odyssey-actions"><button id="odExp" class="primary-btn">🧭 EXPEDITIONS</button><button id="odSkills" class="primary-btn">✨ SKILL MATRIX</button><button id="odConst" class="primary-btn">🌠 CONSTELLATION</button></div>'+
    '<div class="director-readout"><small>ADVENTURE DIRECTOR</small><strong>'+adaptiveHint()+'</strong></div>'+
    '<button id="odClose" class="small-btn">Return to world</button>'
  );
  document.querySelector('#odExp').onclick=openExpeditions;
  document.querySelector('#odSkills').onclick=openSkills;
  document.querySelector('#odConst').onclick=openConstellation;
  document.querySelector('#odClose').onclick=DBX.ui.closeModal;
}
function openExpeditions(){
  const cards=expeditionDefs().map(x=>{
    const done=meta.completedExpeditions.includes(x.id);
    return '<article class="exp-card '+(done?'done':x.ready?'ready':'')+'"><span>'+x.icon+'</span><div><strong>'+x.name+'</strong><p>'+x.desc+'</p><small>'+(done?'COMPLETE':x.ready?'READY TO CLAIM':'IN PROGRESS')+' · '+x.reward+' XP</small></div><button data-exp="'+x.id+'" '+(!x.ready||done?'disabled':'')+'>'+(done?'✓':'CLAIM')+'</button></article>';
  }).join('');
  DBX.ui.openModal('<h2>🧭 Expedition Matrix</h2><p>Long-form contracts turn everything you do into connected progression.</p><div class="exp-list">'+cards+'</div><button id="odBack" class="small-btn">← Command</button>');
  document.querySelectorAll('[data-exp]').forEach(b=>b.onclick=()=>claimExpedition(b.dataset.exp));
  document.querySelector('#odBack').onclick=openOdyssey;
}
function openSkills(){
  const cards=skills.map(x=>{
    const owned=meta.skills.includes(x.id),locked=x.requires&&!meta.skills.includes(x.requires);
    return '<article class="skill-card '+(owned?'owned':locked?'locked':'')+'"><span>'+x.icon+'</span><div><small>'+x.path+'</small><strong>'+x.name+'</strong><p>'+x.desc+'</p></div><button data-skill="'+x.id+'" '+(owned||locked?'disabled':'')+'>'+(owned?'OWNED':'✨ '+x.cost)+'</button></article>';
  }).join('');
  DBX.ui.openModal('<h2>✨ Explorer Skill Matrix</h2><p>Choose paths that change how your explorer grows. Spark Points: <b>'+meta.sparkPoints+'</b></p><div class="skill-grid">'+cards+'</div><button id="odBack" class="small-btn">← Command</button>');
  document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>buySkill(b.dataset.skill));
  document.querySelector('#odBack').onclick=openOdyssey;
}
function openConstellation(){
  const rows=constellation().map(([name,pct])=>'<div class="const-row"><span>'+name+'</span><i><b style="width:'+pct+'%"></b></i><strong>'+pct+'%</strong></div>').join('');
  DBX.ui.openModal('<h2>🌠 Dream Constellation</h2><p>Every system contributes to one visible mastery map.</p><div class="constellation-core"><b>'+mastery()+'%</b><span>WORLD MASTERY</span></div><div class="const-list">'+rows+'</div><button id="odBack" class="small-btn">← Command</button>');
  document.querySelector('#odBack').onclick=openOdyssey;
}
function refresh(){
  const r=document.querySelector('#vnextOdysseyRank');if(r)r.textContent=meta.rank;
  const x=document.querySelector('#vnextOdysseyXP');if(x)x.textContent=meta.xp;
  const sp=document.querySelector('#vnextSparkPoints');if(sp)sp.textContent=meta.sparkPoints;
  evaluateMilestones();
}
const newStations=[
  {id:'odyssey-core',name:'DreamCore Nexus',x:1080,y:940,icon:'💠',action:'odyssey-core',hint:'Open Explorer Command.'},
  {id:'odyssey-gate',name:'Expedition Gate',x:1260,y:1020,icon:'🧭',action:'odyssey-gate',hint:'Review long-form expeditions.',moon:true},
  {id:'odyssey-observatory',name:'Constellation Observatory',x:1640,y:475,icon:'🌠',action:'odyssey-observatory',hint:'View world mastery.',moon:true}
];
for(const item of newStations)if(!DBX.world.interactables.some(x=>x.id===item.id))DBX.world.interactables.push(item);

const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=obj=>{if(obj&&stationInteract(obj.action))return;oldInteract(obj)};

const oldReward=DBX.ui.moonRock?.bind(DBX.ui);
if(oldReward)DBX.ui.moonRock=id=>{const before=DBX.state.moonRocks.length;oldReward(id);if(DBX.state.moonRocks.length>before)addXP(14,'Lunar discovery')};

DBX.events.on('launch',()=>addXP(60,'First launch'));
DBX.events.on('scene:changed',()=>{addXP(8,'World transition');applyPassives()});
DBX.events.on('hud:update',()=>{refresh();applyPassives()});
DBX.events.on('state:reset',()=>{reset();applyPassives();refresh()});

const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextOdysseyBtn')){
  const button=document.createElement('button');button.id='vnextOdysseyBtn';button.className='odyssey-chip';button.textContent='🌌 ODYSSEY R'+meta.rank;button.onclick=openOdyssey;hud.appendChild(button);
}
const telemetry=document.querySelector('.telemetry-stack');
if(telemetry&&!document.querySelector('#vnextOdysseyXP')){
  window.DreamBoundDOM.appendHTML(telemetry,'<label>ODYSSEY XP <strong>🌌 <b id="vnextOdysseyXP">'+meta.xp+'</b></strong></label><label>SPARK POINTS <strong>✨ <b id="vnextSparkPoints">'+meta.sparkPoints+'</b></strong></label>');
}
DBX.odyssey={meta,open:openOdyssey,addXP,mastery,reset};
applyPassives();refresh();
})();