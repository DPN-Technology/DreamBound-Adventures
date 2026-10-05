(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.ui||!DBX.world)return;

const KEY='dreambound-world-encounters-v1';
const ENCOUNTER_IDS=['star-garden','echo-cavern','maker-heart'];
const DISCOVERY_IDS=['secret-a','secret-b','secret-c','secret-d','secret-e','secret-f'];
const defaults=()=>({completed:[],discoveries:[],abilities:[],attempts:{},worldLevel:0});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const attempts={};for(const id of ENCOUNTER_IDS)attempts[id]=DBX.util.int(r.attempts?.[id],0,999,0);
  return {
    completed:DBX.util.list(r.completed,ENCOUNTER_IDS,ENCOUNTER_IDS.length),
    discoveries:DBX.util.list(r.discoveries,DISCOVERY_IDS,DISCOVERY_IDS.length),
    abilities:DBX.util.list(r.abilities,['star-sense','luma-link','maker-spark'],3),
    attempts,
    worldLevel:DBX.util.int(r.worldLevel,0,3,0)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const encounters=[
  {
    id:'star-garden',scene:'surface',x:1465,y:610,icon:'🌠',name:'Star Garden',
    ability:'star-sense',abilityName:'Star Sense',
    unlock:()=>!!DBX.state.launched,
    stages:[
      {title:'Wake the Star Garden',text:'Three sleepy star-flowers are waiting for a gentle signal.',choices:['🌙','⭐','☀️'],answer:'⭐'},
      {title:'Guide the Light',text:'Choose the path that carries the glow safely across the garden.',choices:['⬅️','⬆️','➡️'],answer:'⬆️'},
      {title:'Make a Constellation',text:'Pick the symbol that connects the whole garden together.',choices:['✨','🌧️','🪨'],answer:'✨'}
    ]
  },
  {
    id:'echo-cavern',scene:'magic-grove',x:1360,y:760,icon:'🔮',name:'Echo Cavern',
    ability:'luma-link',abilityName:'Luma Link',
    unlock:()=>state.completed.includes('star-garden')&&!!DBX.state.lumaRescued,
    stages:[
      {title:'Find the Friendly Echo',text:'One sound belongs to Luma. Which one feels warm and familiar?',choices:['💜','⚡','🌪️'],answer:'💜'},
      {title:'Cross the Crystal Bridge',text:'Choose the calm path across the glowing crystals.',choices:['🌙','🔥','💥'],answer:'🌙'},
      {title:'Answer the Cavern',text:'Send a friendly signal back through the cavern.',choices:['🤝','🚫','❓'],answer:'🤝'}
    ]
  },
  {
    id:'maker-heart',scene:'builder-bay',x:1380,y:700,icon:'⚙️',name:'Maker Heart',
    ability:'maker-spark',abilityName:'Maker Spark',
    unlock:()=>state.completed.includes('echo-cavern'),
    stages:[
      {title:'Restore the Blueprint',text:'What should come first when building something new?',choices:['📐','🚀','🎨'],answer:'📐'},
      {title:'Power the Workshop',text:'Choose the part that brings the machine safely to life.',choices:['⚡','🧊','🌙'],answer:'⚡'},
      {title:'Finish the Creation',text:'Choose the final piece that makes the invention complete.',choices:['⚙️','🌧️','🐚'],answer:'⚙️'}
    ]
  }
];

const discoveries=[
  {id:'secret-a',scene:'surface',x:1360,y:850,icon:'🌟',label:'Hidden Star Cache'},
  {id:'secret-b',scene:'surface',x:1695,y:875,icon:'💠',label:'Crystal Memory'},
  {id:'secret-c',scene:'home-valley',x:1420,y:820,icon:'🏮',label:'Lantern Secret'},
  {id:'secret-d',scene:'magic-grove',x:1540,y:880,icon:'✨',label:'Moonflower Secret'},
  {id:'secret-e',scene:'builder-bay',x:1540,y:830,icon:'🧩',label:'Maker Secret'},
  {id:'secret-f',scene:'ocean-cove',x:1460,y:860,icon:'🐚',label:'Sonar Secret'}
];

function currentEncounter(){
  return encounters.find(e=>e.scene===(DBX.scene?.id||'surface')&&e.unlock()&&!state.completed.includes(e.id))||null;
}
function nearestSpecial(){
  const scene=DBX.scene?.id||'surface',p=DBX.state.player,candidates=[];
  const e=currentEncounter();
  if(e)candidates.push({...e,action:'dream-encounter',hint:'Begin a gentle multi-stage world encounter.',d:Math.hypot(p.x-e.x,p.y-e.y)});
  if(state.abilities.includes('star-sense')){
    for(const s of discoveries){
      if(s.scene!==scene||state.discoveries.includes(s.id))continue;
      const d=Math.hypot(p.x-s.x,p.y-s.y);
      if(d<210)candidates.push({...s,name:s.label,action:'dream-secret',hint:'Star Sense has revealed something nearby.',d});
    }
  }
  return candidates.sort((a,b)=>a.d-b.d)[0]||null;
}

function openEncounter(enc){
  state.attempts[enc.id]=(state.attempts[enc.id]||0)+1;save();
  runStage(enc,0);
}
function runStage(enc,index){
  const stage=enc.stages[index];
  DBX.ui.openModal(
    '<section class="encounter-panel"><div class="encounter-kicker">DREAMTRIAL '+(index+1)+' / '+enc.stages.length+'</div>'+
    '<div class="encounter-icon">'+enc.icon+'</div><h2>'+stage.title+'</h2><p>'+stage.text+'</p>'+
    '<div class="encounter-choices">'+stage.choices.map(x=>'<button data-enc-choice="'+x+'">'+x+'</button>').join('')+'</div>'+
    '<div class="encounter-progress">'+'● '.repeat(index)+'○ '.repeat(enc.stages.length-index)+'</div>'+
    '<small>No timer · no lives · no lost progress</small>'+
    '<button id="encounterClose" class="small-btn">KEEP EXPLORING</button></section>'
  );
  document.querySelectorAll('[data-enc-choice]').forEach(btn=>btn.onclick=()=>{
    if(btn.dataset.encChoice!==stage.answer){
      DBX.audio?.click?.();DBX.ui.toast('Try another idea','Nothing is lost. The encounter waits for you.');
      return;
    }
    DBX.audio?.success?.();DBX.fx?.flash?.(.16);
    if(index+1<enc.stages.length){runStage(enc,index+1);return}
    completeEncounter(enc);
  });
  document.querySelector('#encounterClose').onclick=DBX.ui.closeModal;
}
function completeEncounter(enc){
  if(state.completed.includes(enc.id))return;
  state.completed.push(enc.id);
  if(!state.abilities.includes(enc.ability))state.abilities.push(enc.ability);
  state.worldLevel=Math.min(3,state.completed.length);save();
  DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+10);
  DBX.state.gems=Math.min(9999,(DBX.state.gems||0)+4);
  DBX.storage.save();DBX.odyssey?.addXP?.(85,enc.name+' complete');
  DBX.ui.closeModal();DBX.fx?.flash?.(.55);DBX.audio?.success?.();
  DBX.events.emit('story:beat',{label:'ABILITY UNLOCKED',title:enc.abilityName});
  DBX.ui.toast(enc.abilityName+' unlocked','+10 ⭐  +4 💎 · The world has changed.');
  DBX.events.emit('hud:update');
}
function collectSecret(secret){
  if(state.discoveries.includes(secret.id))return;
  state.discoveries.push(secret.id);save();
  DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+3);
  DBX.state.moonCrystals=Math.min(999,(DBX.state.moonCrystals||0)+2);
  DBX.storage.save();DBX.odyssey?.addXP?.(24,'Secret discovered');
  DBX.fx?.burst?.(secret.x,secret.y,secret.icon);DBX.audio?.collect?.();
  DBX.ui.toast(secret.label,'Secret found · +3 ⭐  +2 💠');
  DBX.events.emit('hud:update');
}
function abilitySummary(){
  const names={ 'star-sense':'🌟 Star Sense','luma-link':'💜 Luma Link','maker-spark':'⚙️ Maker Spark' };
  return state.abilities.map(x=>names[x]).join(' · ')||'No abilities unlocked yet';
}
function openJournal(){
  const rows=encounters.map(e=>{
    const done=state.completed.includes(e.id),available=e.unlock();
    return '<article class="encounter-row '+(done?'complete':'')+'"><span>'+e.icon+'</span><div><strong>'+e.name+'</strong><small>'+(done?e.abilityName+' unlocked':available?'READY TO DISCOVER':'Keep exploring to unlock')+'</small></div><b>'+(done?'✓':available?'ACTIVE':'🔒')+'</b></article>';
  }).join('');
  DBX.ui.openModal(
    '<section class="encounter-journal"><div class="encounter-kicker">ONE LIVING WORLD</div><h2>🌠 DreamTrials</h2>'+
    '<p>Special multi-stage encounters appear naturally inside the same DreamBound journey and permanently change what you can discover.</p>'+
    '<div class="encounter-worldlevel"><span>WORLD EVOLUTION</span><b>'+state.worldLevel+'/3</b><i><em style="width:'+(state.worldLevel/3*100)+'%"></em></i></div>'+
    '<div class="encounter-list">'+rows+'</div>'+
    '<div class="ability-strip"><strong>ABILITIES</strong><span>'+abilitySummary()+'</span></div>'+
    '<div class="ability-strip"><strong>SECRETS</strong><span>'+state.discoveries.length+' / '+DISCOVERY_IDS.length+' discovered</span></div>'+
    '<button id="encounterJournalClose" class="primary-btn">BACK TO WORLD</button></section>'
  );
  document.querySelector('#encounterJournalClose').onclick=DBX.ui.closeModal;
}
function draw(ctx,t){
  const scene=DBX.scene?.id||'surface',animate=DBX.accessibility?.shouldAnimate?.()??true;
  ctx.save();
  const enc=currentEncounter();
  if(enc){
    const pulse=animate?1+Math.sin(t/300)*.08:1;
    ctx.save();ctx.translate(enc.x,enc.y);ctx.scale(pulse,pulse);
    ctx.shadowColor='#9b84ff';ctx.shadowBlur=30;ctx.font='44px serif';ctx.textAlign='center';ctx.fillText(enc.icon,0,0);
    ctx.font='900 9px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText('DREAMTRIAL',0,38);ctx.restore();
  }
  if(state.abilities.includes('star-sense')){
    for(const s of discoveries){
      if(s.scene!==scene||state.discoveries.includes(s.id))continue;
      const d=Math.hypot(DBX.state.player.x-s.x,DBX.state.player.y-s.y);
      if(d>210)continue;
      const alpha=Math.max(.18,1-d/260);
      ctx.globalAlpha=alpha;ctx.strokeStyle='rgba(111,232,220,.75)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(s.x,s.y,26+(animate?Math.sin(t/250)*5:0),0,Math.PI*2);ctx.stroke();
      ctx.font='28px serif';ctx.textAlign='center';ctx.fillText(s.icon,s.x,s.y+9);
    }
  }
  if(state.worldLevel>0){
    ctx.globalAlpha=.12+.04*state.worldLevel;
    ctx.fillStyle=state.worldLevel>=3?'#ffd27a':'#9b84ff';
    for(let i=0;i<12+state.worldLevel*8;i++){
      const x=(i*157+state.worldLevel*43)%1750+20,y=(i*83+state.worldLevel*97)%1050+80;
      ctx.beginPath();ctx.arc(x,y,1+(i%3),0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}
const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),special=nearestSpecial();
  if(!special)return base;if(!base)return special;
  return special.d<base.d?special:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='dream-encounter'){const enc=encounters.find(x=>x.id===o.id);if(enc)openEncounter(enc);return}
  if(o?.action==='dream-secret'){const sec=discoveries.find(x=>x.id===o.id);if(sec)collectSecret(sec);return}
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};

const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextTrials')){
  const b=document.createElement('button');b.id='vnextTrials';b.textContent='🌠 TRIALS';b.onclick=openJournal;actions.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.dreamTrials={state,encounters,discoveries,openJournal,currentEncounter};
})();