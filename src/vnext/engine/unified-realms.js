(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX?.scene?.register||!DBX.ui)return;

const KEY='dreambound-unified-realms-v1';
const REALM_IDS=['home-valley','magic-grove','racing-ridge','dino-valley','builder-bay','ocean-cove'];
const defaults=()=>({visited:[],completed:[],attempts:{},lastRealm:null});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const attempts={};
  for(const id of REALM_IDS)attempts[id]=DBX.util.int(r.attempts?.[id],0,9999,0);
  return {
    visited:DBX.util.list(r.visited,REALM_IDS,REALM_IDS.length),
    completed:DBX.util.list(r.completed,REALM_IDS,REALM_IDS.length),
    attempts,
    lastRealm:REALM_IDS.includes(r.lastRealm)?r.lastRealm:null
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const realms=[
  {
    id:'home-valley',name:'Home Valley',icon:'🏡',tag:'Dream Home & Lantern',accent:'#69f0c0',
    sky:['#111b38','#1d3152'],ground:['#173f3c','#1f5a48'],
    landmark:{x:930,y:420,label:'DREAM HOME',icon:'🏡'},
    activity:{name:'Dream Lantern',icon:'🏮',x:1060,y:620,steps:['🏡','⭐','💜'],help:'Wake the Dream Lantern by matching its calm light pattern.'}
  },
  {
    id:'magic-grove',name:'Magic Grove',icon:'🪄',tag:'Moonflower Tower',accent:'#c38cff',
    sky:['#151632','#29204e'],ground:['#203a3d','#315644'],
    landmark:{x:930,y:400,label:'MOONFLOWER TOWER',icon:'🗼'},
    activity:{name:'Moonflower Resonance',icon:'✨',x:1080,y:650,steps:['✨','🌙','🪄'],help:'Tune the Moonflower lights in the same gentle sequence.'}
  },
  {
    id:'racing-ridge',name:'Racing Ridge',icon:'🏎️',tag:'Rainbow Speedway',accent:'#ffce73',
    sky:['#171c31','#29314c'],ground:['#54462e','#6b5834'],
    landmark:{x:920,y:390,label:'RAINBOW SPEEDWAY',icon:'🏁'},
    activity:{name:'Route Calibration',icon:'🏎️',x:1080,y:650,steps:['⬅️','⬆️','➡️'],help:'Calibrate a safe racing route. There is no timer and no crash penalty.'}
  },
  {
    id:'dino-valley',name:'Dino Valley',icon:'🦕',tag:'Fossil Hall',accent:'#9be27d',
    sky:['#121b31','#24344b'],ground:['#344c31','#4c693c'],
    landmark:{x:930,y:410,label:'FOSSIL HALL',icon:'🦴'},
    activity:{name:'Fossil Scanner',icon:'🔬',x:1080,y:650,steps:['🦴','🦕','🔬'],help:'Scan a fossil sample in the correct research order.'}
  },
  {
    id:'builder-bay',name:'Builder Bay',icon:'🧱',tag:'Maker Workshop',accent:'#73e5d8',
    sky:['#101b2e','#203b4b'],ground:['#264a49','#326464'],
    landmark:{x:930,y:400,label:'MAKER WORKSHOP',icon:'⚙️'},
    activity:{name:'Blueprint Build',icon:'📐',x:1080,y:650,steps:['📐','⚙️','🧱'],help:'Follow the blueprint from plan to mechanism to build.'}
  },
  {
    id:'ocean-cove',name:'Ocean Cove',icon:'🌊',tag:'Discovery Center',accent:'#65d8ff',
    sky:['#0c1830','#123c5b'],ground:['#0f4965','#126984'],
    landmark:{x:930,y:400,label:'OCEAN DISCOVERY',icon:'🔭'},
    activity:{name:'Sonar Trail',icon:'🐚',x:1080,y:650,steps:['🌊','🐚','🔵'],help:'Follow the safe sonar trail beneath Ocean Cove.'}
  }
];

function panel(ctx,x,y,w,h,fill,stroke){
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.roundRect(x+10,y+14,w,h,22);ctx.fill();
  ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,22);ctx.fill();
  ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();
}
function label(ctx,text,x,y,accent){
  ctx.save();ctx.textAlign='center';ctx.font='800 12px system-ui';ctx.fillStyle='#eaf5ff';ctx.shadowColor=accent;ctx.shadowBlur=12;ctx.fillText(text,x,y);ctx.restore();
}
function drawRealm(realm,ctx,t){
  ctx.save();
  const sky=ctx.createLinearGradient(0,0,0,540);sky.addColorStop(0,realm.sky[0]);sky.addColorStop(1,realm.sky[1]);
  ctx.fillStyle=sky;ctx.fillRect(0,0,1800,540);
  const ground=ctx.createLinearGradient(0,540,0,1200);ground.addColorStop(0,realm.ground[0]);ground.addColorStop(1,realm.ground[1]);
  ctx.fillStyle=ground;ctx.fillRect(0,540,1800,660);

  ctx.globalAlpha=.22;ctx.strokeStyle=realm.accent;ctx.lineWidth=1;
  for(let x=0;x<=1800;x+=90){ctx.beginPath();ctx.moveTo(x,540);ctx.lineTo(x,1200);ctx.stroke();}
  for(let y=540;y<=1200;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1800,y);ctx.stroke();}
  ctx.globalAlpha=1;

  const path=ctx.createLinearGradient(180,0,1500,0);path.addColorStop(0,'rgba(255,255,255,.12)');path.addColorStop(.5,realm.accent);path.addColorStop(1,'rgba(255,255,255,.12)');
  ctx.strokeStyle=path;ctx.lineWidth=56;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(160,820);ctx.bezierCurveTo(500,700,760,770,1120,650);ctx.bezierCurveTo(1360,570,1510,650,1660,760);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.setLineDash([16,18]);ctx.stroke();ctx.setLineDash([]);

  for(let i=0;i<34;i++){
    const x=45+(i*137)%1710,y=70+(i*83)%390;
    ctx.fillStyle=i%5===0?realm.accent:'rgba(255,255,255,.68)';
    const pulse=(DBX.accessibility?.shouldAnimate?.()??true)?1+Math.sin(t/500+i)*.35:1;
    ctx.beginPath();ctx.arc(x,y,1.3*pulse,0,Math.PI*2);ctx.fill();
  }

  panel(ctx,realm.landmark.x-150,realm.landmark.y-90,300,180,'rgba(9,14,30,.76)',realm.accent);
  ctx.font='64px serif';ctx.textAlign='center';ctx.fillText(realm.landmark.icon,realm.landmark.x,realm.landmark.y+5);
  label(ctx,realm.landmark.label,realm.landmark.x,realm.landmark.y+58,realm.accent);

  panel(ctx,realm.activity.x-95,realm.activity.y-70,190,140,'rgba(10,16,32,.72)',realm.accent);
  ctx.font='44px serif';ctx.fillText(realm.activity.icon,realm.activity.x,realm.activity.y);
  label(ctx,realm.activity.name.toUpperCase(),realm.activity.x,realm.activity.y+42,realm.accent);

  panel(ctx,90,650,180,140,'rgba(10,16,32,.72)',realm.accent);
  ctx.font='43px serif';ctx.fillText('🌀',180,716);label(ctx,'DREAMGATE',180,758,realm.accent);

  ctx.font='900 30px system-ui';ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.fillText(realm.name.toUpperCase(),70,100);
  ctx.font='700 13px system-ui';ctx.fillStyle=realm.accent;ctx.fillText(realm.tag.toUpperCase(),72,128);
  ctx.restore();
}
function sceneObjects(realm){
  return [
    {id:realm.id+'-exit',name:'DreamGate Nexus',x:180,y:715,icon:'🌀',action:'scene-exit',hint:'Return to the Space Center.'},
    {id:realm.id+'-landmark',name:realm.landmark.label,x:realm.landmark.x,y:realm.landmark.y,icon:realm.landmark.icon,action:'realm-landmark',hint:'Inspect this landmark.'},
    {id:realm.id+'-activity',name:realm.activity.name,x:realm.activity.x,y:realm.activity.y,icon:realm.activity.icon,action:'realm-activity',hint:realm.activity.help}
  ];
}
function markVisit(id){
  if(!state.visited.includes(id))state.visited.push(id);
  state.lastRealm=id;save();
}
function completeRealm(realm){
  if(state.completed.includes(realm.id)){
    DBX.ui.toast(realm.name,'This realm activity is already complete. Keep exploring.');
    return;
  }
  state.completed.push(realm.id);save();
  DBX.state.stars=(DBX.state.stars||0)+6;DBX.state.gems=(DBX.state.gems||0)+3;
  DBX.storage.save();DBX.odyssey?.addXP?.(55,realm.name+' realm activity');
  DBX.simulation?.emit?.('realm-complete','space-center',60);
  DBX.events.emit('story:beat',{label:'REALM COMPLETE',title:realm.name});
  DBX.ui.toast(realm.name+' complete','+6 ⭐  +3 💎 · New unified-world milestone');
  DBX.events.emit('hud:update');
}
function openActivity(realm){
  state.attempts[realm.id]=(state.attempts[realm.id]||0)+1;save();
  const sequence=realm.activity.steps;
  let pos=0,locked=true;
  DBX.ui.openModal(
    '<section class="realm-activity">'+
    '<div class="realm-kicker">'+realm.icon+' '+realm.name.toUpperCase()+'</div>'+
    '<h2>'+realm.activity.icon+' '+realm.activity.name+'</h2>'+
    '<p>'+realm.activity.help+'</p>'+
    '<div id="realmSequence" class="realm-sequence">'+sequence.join(' ')+'</div>'+
    '<div id="realmChoices" class="realm-choices">'+[...sequence].reverse().map(x=>'<button disabled>'+x+'</button>').join('')+'</div>'+
    '<div id="realmProgress" class="realm-progress">○ '.repeat(sequence.length)+'</div>'+
    '<button id="realmActivityClose" class="small-btn">BACK</button></section>'
  );
  setTimeout(()=>{
    const el=document.querySelector('#realmSequence');if(!el)return;
    locked=false;el.textContent='◆ '.repeat(sequence.length);
    document.querySelectorAll('#realmChoices button').forEach(b=>b.disabled=false);
  },900);
  document.querySelectorAll('#realmChoices button').forEach(btn=>btn.onclick=()=>{
    if(locked)return;
    if(btn.textContent===sequence[pos]){
      pos++;DBX.audio?.click();
      document.querySelector('#realmProgress').textContent='● '.repeat(pos)+'○ '.repeat(sequence.length-pos);
      if(pos===sequence.length)setTimeout(()=>{DBX.ui.closeModal();DBX.audio?.success();completeRealm(realm);},180);
    }else{
      pos=0;DBX.audio?.error?.();document.querySelector('#realmProgress').textContent='○ '.repeat(sequence.length);
      DBX.ui.toast('Try the pattern again','No penalty. Start from the first symbol.');
    }
  });
  document.querySelector('#realmActivityClose').onclick=DBX.ui.closeModal;
}
function inspectLandmark(realm){
  DBX.ui.openModal(
    '<section class="realm-landmark"><div class="realm-kicker">'+realm.icon+' '+realm.name.toUpperCase()+'</div>'+
    '<div class="realm-landmark-icon">'+realm.landmark.icon+'</div><h2>'+realm.landmark.label+'</h2>'+
    '<p>'+realm.tag+' is now part of the same DreamBound Living World—not a separate game.</p>'+
    '<div class="realm-status-row"><span>VISITS <b>'+((state.attempts[realm.id]||0)+1)+'</b></span><span>STATUS <b>'+(state.completed.includes(realm.id)?'COMPLETE':'ACTIVE')+'</b></span></div>'+
    '<button id="realmLandmarkClose" class="primary-btn">KEEP EXPLORING</button></section>'
  );
  document.querySelector('#realmLandmarkClose').onclick=DBX.ui.closeModal;
}
function realmInteraction(realm,object){
  if(object?.action==='realm-activity'){openActivity(realm);return true}
  if(object?.action==='realm-landmark'){inspectLandmark(realm);return true}
  return false;
}

for(const realm of realms){
  DBX.scene.register(realm.id,{
    name:realm.name,
    bounds:{w:1800,h:1200},
    spawn:{x:320,y:780},
    interactables:sceneObjects(realm),
    draw:(ctx,t)=>drawRealm(realm,ctx,t),
    interact:o=>realmInteraction(realm,o),
    onEnter(){markVisit(realm.id)}
  });
}

const gate={id:'dreamgate-nexus',name:'DreamGate Nexus',x:1090,y:760,icon:'🌀',action:'realm-atlas',hint:'Explore DreamBound’s connected realms.'};
if(!DBX.world.interactables.some(x=>x.id===gate.id))DBX.world.interactables.push(gate);

function openAtlas(){
  const cards=realms.map(realm=>{
    const visited=state.visited.includes(realm.id),done=state.completed.includes(realm.id);
    return '<button class="realm-card '+(done?'complete':'')+'" data-realm="'+realm.id+'">'+
      '<span class="realm-card-icon">'+realm.icon+'</span><strong>'+realm.name+'</strong><small>'+realm.tag+'</small>'+
      '<b>'+(done?'COMPLETE':visited?'DISCOVERED':'NEW REALM')+'</b></button>';
  }).join('');
  DBX.ui.openModal(
    '<section class="realm-atlas"><div class="realm-kicker">DREAMBOUND // UNIFIED WORLD</div>'+
    '<h2>🌀 DreamGate Atlas</h2><p>Every realm now lives inside one continuous DreamBound game and one progression system.</p>'+
    '<div class="realm-grid">'+cards+'</div>'+
    '<div class="realm-status-row"><span>DISCOVERED <b>'+state.visited.length+'/6</b></span><span>COMPLETED <b>'+state.completed.length+'/6</b></span></div>'+
    '<button id="realmAtlasClose" class="small-btn">CLOSE ATLAS</button></section>'
  );
  document.querySelectorAll('[data-realm]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.realm;DBX.ui.closeModal();DBX.scene.enter(id);
  });
  document.querySelector('#realmAtlasClose').onclick=DBX.ui.closeModal;
}
const previousInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=object=>{
  if(object?.action==='realm-atlas'){openAtlas();return}
  previousInteract(object);
};

const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextRealms')){
  const b=document.createElement('button');b.id='vnextRealms';b.textContent='🌀 REALMS';b.onclick=openAtlas;actions.prepend(b);
}

DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.realms={state,realms,openAtlas,completeRealm};
})();