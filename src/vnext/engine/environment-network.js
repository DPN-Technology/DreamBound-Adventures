(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world||!DBX.ui||!DBX.simulation)return;

const KEY='dreambound-v2-environment-network-v1';
const NODE_IDS=['observatory','sample-analyzer','greenhouse','weather-array','resonance-a','resonance-b','resonance-c'];
const DISCOVERIES=['Lunar Resonance','Stardust Pattern','Crystal Spectrum','Moon Garden Cycle'];
const defaults=()=>({
  activated:[],
  analyzed:[],
  resonanceSolved:false,
  greenhouseLevel:0,
  weatherReads:0,
  networkPower:0,
  discoveries:[]
});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  return {
    activated:DBX.util.list(r.activated,NODE_IDS,NODE_IDS.length),
    analyzed:DBX.util.list(r.analyzed,['meteor','crystal','moss','stardust'],4),
    resonanceSolved:DBX.util.bool(r.resonanceSolved,false),
    greenhouseLevel:DBX.util.int(r.greenhouseLevel,0,3,0),
    weatherReads:DBX.util.int(r.weatherReads,0,9999,0),
    networkPower:DBX.util.int(r.networkPower,0,100,0),
    discoveries:DBX.util.list(r.discoveries,DISCOVERIES,DISCOVERIES.length)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const nodes=[
  {id:'observatory',name:'Dream Observatory Array',icon:'🔭',x:1660,y:1010,action:'env-observatory',hint:'Study sky patterns and simulation signals.'},
  {id:'sample-analyzer',name:'Meteor Sample Analyzer',icon:'🧪',x:1515,y:1080,action:'env-analyzer',hint:'Analyze safe lunar samples.'},
  {id:'greenhouse',name:'Moon Greenhouse Lab',icon:'🌿',x:1720,y:1095,action:'env-greenhouse',hint:'Run a gentle lunar plant experiment.'},
  {id:'weather-array',name:'Weather Sensor Array',icon:'🌦️',x:1470,y:690,action:'env-weather',hint:'Read the current local environment.'},
  {id:'resonance-a',name:'Resonance Node Alpha',icon:'🔷',x:1390,y:620,action:'env-resonance',hint:'Tune this node into the lunar network.'},
  {id:'resonance-b',name:'Resonance Node Beta',icon:'🔶',x:1570,y:700,action:'env-resonance',hint:'Tune this node into the lunar network.'},
  {id:'resonance-c',name:'Resonance Node Gamma',icon:'💠',x:1730,y:590,action:'env-resonance',hint:'Tune this node into the lunar network.'}
];
for(const n of nodes)if(!DBX.world.interactables.some(x=>x.id===n.id))DBX.world.interactables.push(n);

function activate(id){
  if(!state.activated.includes(id)){
    state.activated.push(id);
    state.networkPower=Math.min(100,state.networkPower+12);
    save();
    DBX.simulation.emit('environment-node',DBX.simulation.zoneOf(),35);
    DBX.odyssey?.addXP?.(8,'Environmental node activated');
  }
}
function addDiscovery(name){
  if(state.discoveries.includes(name))return;
  state.discoveries.push(name);save();
  DBX.state.codexEntries=DBX.state.codexEntries||[];
  if(!DBX.state.codexEntries.includes(name))DBX.state.codexEntries.push(name);
  DBX.storage.save();DBX.odyssey?.addXP?.(18,'Environmental discovery');
  DBX.ui.toast('📚 Discovery added',name);
}
function openObservatory(){
  activate('observatory');
  const sim=DBX.simulation.status(),weather=DBX.worldSystems?.currentWeather?.();
  if(weather?.id==='stardust')addDiscovery('Stardust Pattern');
  DBX.ui.openModal(
    '<h2>🔭 Dream Observatory Array</h2>'+
    '<p>This telescope combines local sky observations with DreamBound’s simulation state.</p>'+
    '<div class="director-score">ZONE SIGNAL <b>'+Math.round(sim.zoneHeat[sim.zone]||0)+'%</b></div>'+
    '<div class="resource-strip"><span>🌦️ '+(weather?.name||'Clear Skies')+'</span><span>🌐 '+sim.zone.replace(/-/g,' ')+'</span></div>'+
    '<div class="npc-dialogue">A constellation can look different depending on where you stand and what the environment is doing. Scientists compare many observations before drawing conclusions.</div>'+
    '<button id="envClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#envClose').onclick=DBX.ui.closeModal;
}
function openAnalyzer(){
  activate('sample-analyzer');
  const options=[
    ['meteor','☄️ Meteor fragment',(DBX.state.eventWins||0)>=1],
    ['crystal','💠 Moon crystal',(DBX.state.moonCrystals||0)>=1],
    ['moss','🌿 Lunar moss',(DBX.state.codexEntries||[]).includes('Lunar moss')],
    ['stardust','✨ Stardust reading',DBX.worldSystems?.state.weatherDiscoveries?.includes('stardust')]
  ];
  const cards=options.map(([id,label,ready])=>
    '<button class="setting-card '+(state.analyzed.includes(id)?'on':'')+'" data-sample="'+id+'" '+(!ready?'disabled':'')+'><span>'+label.split(' ')[0]+'</span><strong>'+label.slice(label.indexOf(' ')+1)+'</strong><small>'+(state.analyzed.includes(id)?'ANALYZED':ready?'READY TO ANALYZE':'DISCOVER SAMPLE FIRST')+'</small></button>'
  ).join('');
  DBX.ui.openModal('<h2>🧪 Meteor Sample Analyzer</h2><p>Choose a discovered sample. Every result uses a fixed child-safe science note.</p><div class="settings-grid">'+cards+'</div><button id="envClose" class="primary-btn">BACK</button>');
  document.querySelectorAll('[data-sample]').forEach(b=>b.onclick=()=>analyzeSample(b.dataset.sample));
  document.querySelector('#envClose').onclick=DBX.ui.closeModal;
}
function analyzeSample(id){
  if(state.analyzed.includes(id)){DBX.ui.toast('Already analyzed','This sample is already in your lab notes.');return}
  const notes={
    meteor:'Meteorites can help scientists learn about the early Solar System.',
    crystal:'Crystals have repeating structures that can bend and reflect light in interesting ways.',
    moss:'Plants and mosses respond to light, water, and their environment.',
    stardust:'Tiny particles can scatter light and make glowing patterns easier to see.'
  };
  if(!(id in notes))return;
  state.analyzed.push(id);state.networkPower=Math.min(100,state.networkPower+8);save();
  if(id==='crystal')addDiscovery('Crystal Spectrum');
  DBX.ui.openModal('<h2>🧪 Analysis Complete</h2><div class="npc-dialogue">'+notes[id]+'</div><button id="envClose" class="primary-btn">KEEP EXPLORING</button>');
  document.querySelector('#envClose').onclick=DBX.ui.closeModal;
  DBX.simulation.emit('sample-analysis','moon-base',30);DBX.odyssey?.addXP?.(12,'Sample analysis');
}
function openGreenhouse(){
  activate('greenhouse');
  const built=(DBX.state.baseModules||[]).includes('greenhouse');
  if(!built){DBX.ui.toast('Greenhouse module needed','Build the Moon Greenhouse first to run experiments.');return}
  DBX.ui.openModal(
    '<h2>🌿 Moon Greenhouse Lab</h2>'+
    '<p>Run a slow, no-fail observation cycle. Each stage represents another careful check of the plant environment.</p>'+
    '<div class="director-score">GROWTH STUDY <b>'+state.greenhouseLevel+'/3</b></div>'+
    '<button id="greenhouseObserve" class="primary-btn">'+(state.greenhouseLevel>=3?'STUDY COMPLETE':'OBSERVE NEXT STAGE')+'</button>'+
    '<button id="envClose" class="small-btn">BACK</button>'
  );
  document.querySelector('#greenhouseObserve').onclick=()=>{
    if(state.greenhouseLevel>=3){DBX.ui.toast('Study complete','The greenhouse cycle is fully documented.');return}
    state.greenhouseLevel++;state.networkPower=Math.min(100,state.networkPower+10);save();
    DBX.simulation.emit('greenhouse-observation','moon-base',25);
    if(state.greenhouseLevel===3)addDiscovery('Moon Garden Cycle');
    DBX.odyssey?.addXP?.(10,'Greenhouse observation');openGreenhouse();
  };
  document.querySelector('#envClose').onclick=DBX.ui.closeModal;
}
function openWeather(){
  activate('weather-array');state.weatherReads++;state.networkPower=Math.min(100,state.networkPower+4);save();
  const w=DBX.worldSystems?.currentWeather?.(),sim=DBX.simulation.status();
  DBX.ui.openModal(
    '<h2>🌦️ Weather Sensor Array</h2>'+
    '<div class="resource-strip"><span>'+w.icon+' <b>'+w.name+'</b></span><span>ZONE ACTIVITY <b>'+Math.round(sim.zoneHeat[sim.zone]||0)+'%</b></span></div>'+
    '<p>Weather changes how vehicles, creatures, and discoveries behave. Compare readings from different zones.</p>'+
    '<small>'+state.weatherReads+' local readings recorded.</small>'+
    '<button id="envClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#envClose').onclick=DBX.ui.closeModal;
}
function tuneResonance(id){
  activate(id);
  const tuned=['resonance-a','resonance-b','resonance-c'].filter(x=>state.activated.includes(x));
  if(tuned.length===3&&!state.resonanceSolved){
    state.resonanceSolved=true;state.networkPower=100;save();
    addDiscovery('Lunar Resonance');
    DBX.simulation.emit('environment-network-complete','crystal-ridge',90);
    if(DBX.autonomousWorld?.state?.zoneStage)DBX.autonomousWorld.state.zoneStage['crystal-ridge']=Math.max(3,DBX.autonomousWorld.state.zoneStage['crystal-ridge']||0);
    DBX.odyssey?.addXP?.(100,'Environmental network synchronized');
    DBX.events.emit('story:beat',{label:'WORLD NETWORK',title:'LUNAR RESONANCE SYNCHRONIZED'});
    DBX.ui.toast('Network synchronized','All three resonance nodes are harmonized.');
    return;
  }
  DBX.ui.toast('Resonance node tuned',tuned.length+'/3 lunar nodes synchronized.');
}
function statusOpen(){
  const tuned=['resonance-a','resonance-b','resonance-c'].filter(x=>state.activated.includes(x)).length;
  DBX.ui.openModal(
    '<h2>🧬 Environmental Network</h2>'+
    '<p>Science stations and lunar nodes now share a persistent local network.</p>'+
    '<div class="director-score">NETWORK POWER <b>'+state.networkPower+'%</b></div>'+
    '<div class="resource-strip"><span>🔷 Resonance '+tuned+'/3</span><span>🧪 Samples '+state.analyzed.length+'/4</span><span>🌿 Greenhouse '+state.greenhouseLevel+'/3</span></div>'+
    '<div class="friend-roster"><strong>DISCOVERIES</strong>'+(state.discoveries.length?state.discoveries.map(x=>'<span>'+x.toUpperCase()+'</span>').join(''):'<span>Keep investigating the network.</span>')+'</div>'+
    '<button id="envClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#envClose').onclick=DBX.ui.closeModal;
}
function draw(ctx,t){
  if(DBX.scene?.id==='station')return;
  ctx.save();
  for(const n of nodes){
    if(!DBX.state.launched&&n.x>1240)continue;
    const on=state.activated.includes(n.id),pulse=(DBX.accessibility?.shouldAnimate?.()??true)?Math.sin(t/300+n.x)*3:0;
    ctx.shadowColor=on?'#8ff8ef':'#9b91d8';ctx.shadowBlur=on?18:7;
    ctx.font=(on?'31':'27')+'px serif';ctx.textAlign='center';ctx.fillText(n.icon,n.x,n.y+pulse);
    if(on){ctx.font='800 8px system-ui';ctx.fillStyle='#d8fff8';ctx.fillText('ONLINE',n.x,n.y+34)}
  }
  if(state.resonanceSolved){
    ctx.strokeStyle='rgba(133,244,233,.40)';ctx.lineWidth=3;ctx.setLineDash([8,8]);
    ctx.beginPath();ctx.moveTo(1390,620);ctx.lineTo(1570,700);ctx.lineTo(1730,590);ctx.closePath();ctx.stroke();ctx.setLineDash([]);
  }
  ctx.restore();
}
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='env-observatory'){openObservatory();return}
  if(o?.action==='env-analyzer'){openAnalyzer();return}
  if(o?.action==='env-greenhouse'){openGreenhouse();return}
  if(o?.action==='env-weather'){openWeather();return}
  if(o?.action==='env-resonance'){tuneResonance(o.id);return}
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
const hud=document.querySelector('.advanced-hud');
if(hud&&!document.querySelector('#vnextEnvironmentBtn')){
  const b=document.createElement('button');b.id='vnextEnvironmentBtn';b.className='deck-chip';b.textContent='🧬 NETWORK';b.onclick=statusOpen;hud.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.environmentNetwork={state,nodes,activate,addDiscovery,open:statusOpen,draw};
})();