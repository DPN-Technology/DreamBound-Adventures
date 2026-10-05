(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world||!DBX.ui)return;

const KEY='dreambound-kinetic-traversal-v1';
const NODE_IDS=['ridge-boost','grove-bridge','ocean-current','builder-launch','moon-ring'];
const defaults=()=>({used:[],mastery:0,totalActivations:0});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  return {
    used:DBX.util.list(r.used,NODE_IDS,NODE_IDS.length),
    mastery:DBX.util.int(r.mastery,0,100,0),
    totalActivations:DBX.util.int(r.totalActivations,0,9999,0)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const nodes=[
  {
    id:'ridge-boost',scene:'racing-ridge',x:930,y:720,icon:'⚡',name:'DreamBoost Pad',
    hint:'Launch along the Rainbow Speedway.',
    ready:()=>true,
    target:{x:1325,y:645},reward:'Speed Route'
  },
  {
    id:'grove-bridge',scene:'magic-grove',x:880,y:760,icon:'🌙',name:'Moonflower Bridge',
    hint:'Use Luma Link to cross the glowing gap.',
    ready:()=>DBX.dreamTrials?.state?.abilities?.includes('luma-link'),
    target:{x:1320,y:565},reward:'Moonflower Route'
  },
  {
    id:'ocean-current',scene:'ocean-cove',x:900,y:760,icon:'🌊',name:'Star Current',
    hint:'Ride the safe current through Ocean Cove.',
    ready:()=>DBX.guardians?.state?.completed?.includes('moon-whale'),
    target:{x:1375,y:560},reward:'Whale Current'
  },
  {
    id:'builder-launch',scene:'builder-bay',x:900,y:755,icon:'🚀',name:'Maker Launch Pad',
    hint:'Use Maker Spark to power the launch rail.',
    ready:()=>DBX.dreamTrials?.state?.abilities?.includes('maker-spark'),
    target:{x:1390,y:575},reward:'Maker Rail'
  },
  {
    id:'moon-ring',scene:'surface',x:1540,y:1030,icon:'🌀',name:'Starlight Ring',
    hint:'Use Star Sense to ride the Moon ring.',
    ready:()=>DBX.dreamTrials?.state?.abilities?.includes('star-sense'),
    target:{x:1660,y:690},reward:'Starlight Route'
  }
];

function currentNodes(){
  const scene=DBX.scene?.id||'surface';
  return nodes.filter(n=>n.scene===scene);
}
function nearest(){
  const p=DBX.state.player;
  return currentNodes().map(n=>({
    ...n,d:Math.hypot(p.x-n.x,p.y-n.y),action:'kinetic-node',
    hint:n.ready()?n.hint:'This route unlocks with more DreamTrial progress.'
  })).sort((a,b)=>a.d-b.d)[0]||null;
}
function activate(node){
  if(!node.ready()){
    DBX.audio?.click?.();
    DBX.ui.toast('Route sleeping','Keep exploring DreamTrials to awaken this traversal route.');
    return;
  }
  const first=!state.used.includes(node.id);
  if(first)state.used.push(node.id);
  state.totalActivations++;
  state.mastery=Math.min(100,state.used.length*20);
  save();

  DBX.state.player.x=node.target.x;
  DBX.state.player.y=node.target.y;
  DBX.state.player.dir=0;
  DBX.storage.save();
  DBX.fx?.flash?.(.32);
  DBX.fx?.burst?.(node.target.x,node.target.y,node.icon);
  DBX.audio?.success?.();
  if(first){
    DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+4);
    DBX.storage.save();
    DBX.odyssey?.addXP?.(32,'Traversal route discovered');
    DBX.ui.toast(node.reward+' discovered','+4 ⭐ · New kinetic route mapped.');
  }else{
    DBX.ui.toast(node.name,'Traversal route activated.');
  }
  DBX.events.emit('hud:update');
}
function draw(ctx,t){
  const animate=DBX.accessibility?.shouldAnimate?.()??true;
  for(const node of currentNodes()){
    const ready=node.ready(),pulse=animate?1+Math.sin(t/280+node.x)*.08:1;
    ctx.save();ctx.translate(node.x,node.y);ctx.scale(pulse,pulse);
    ctx.globalAlpha=ready?1:.35;
    const aura=ctx.createRadialGradient(0,0,5,0,0,52);
    aura.addColorStop(0,ready?'rgba(111,232,220,.25)':'rgba(130,140,165,.18)');
    aura.addColorStop(1,'rgba(111,232,220,0)');
    ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,52,0,Math.PI*2);ctx.fill();
    ctx.font='36px serif';ctx.textAlign='center';ctx.fillText(node.icon,0,8);
    ctx.font='900 8px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText(ready?'KINETIC ROUTE':'LOCKED ROUTE',0,34);
    ctx.restore();
  }
}
function open(){
  const rows=nodes.map(n=>{
    const used=state.used.includes(n.id),ready=n.ready();
    return '<article class="kinetic-row '+(used?'complete':'')+'"><span>'+n.icon+'</span><div><strong>'+n.name+'</strong><small>'+n.scene.toUpperCase()+' · '+(used?'DISCOVERED':ready?'READY':'LOCKED')+'</small></div><b>'+(used?'✓':ready?'GO':'🔒')+'</b></article>';
  }).join('');
  DBX.ui.openModal(
    '<section class="kinetic-journal"><div class="kinetic-kicker">ACTIVE WORLD TRAVERSAL</div><h2>⚡ Kinetic Routes</h2>'+
    '<p>Traversal now changes the way you physically move through DreamBound. Discover pads, currents, rings, and bridges across the same Living World.</p>'+
    '<div class="kinetic-meter"><span>ROUTE MASTERY</span><b>'+state.mastery+'%</b><i><em style="width:'+state.mastery+'%"></em></i></div>'+
    '<div class="kinetic-list">'+rows+'</div>'+
    '<div class="guardian-stats"><span>ROUTES FOUND <b>'+state.used.length+'/'+NODE_IDS.length+'</b></span><span>ACTIVATIONS <b>'+state.totalActivations+'</b></span></div>'+
    '<button id="kineticClose" class="primary-btn">BACK TO WORLD</button></section>'
  );
  document.querySelector('#kineticClose').onclick=DBX.ui.closeModal;
}
const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),node=nearest();
  if(!node)return base;
  if(!base)return node;
  return node.d<base.d?node:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='kinetic-node'){const node=nodes.find(x=>x.id===o.id);if(node)activate(node);return;}
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t);};
const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextKinetic')){
  const b=document.createElement('button');b.id='vnextKinetic';b.textContent='⚡ ROUTES';b.onclick=open;actions.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();});
DBX.kineticTraversal={state,nodes,open,activate};
})();