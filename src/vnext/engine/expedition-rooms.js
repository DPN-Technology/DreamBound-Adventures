(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX?.scene?.register||!DBX.world||!DBX.ui)return;

const KEY='dreambound-expedition-rooms-v1';
const ROOM_IDS=['moonflower-vault','maker-core','ocean-observatory'];
const defaults=()=>({completed:[],roomsVisited:[],steps:{},rewards:0});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},steps={};
  for(const id of ROOM_IDS)steps[id]=DBX.util.int(r.steps?.[id],0,3,0);
  return {
    completed:DBX.util.list(r.completed,ROOM_IDS,ROOM_IDS.length),
    roomsVisited:DBX.util.list(r.roomsVisited,ROOM_IDS,ROOM_IDS.length),
    steps,
    rewards:DBX.util.int(r.rewards,0,99,0)
  };
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const rooms=[
  {
    id:'moonflower-vault',parent:'magic-grove',name:'Moonflower Vault',icon:'🌙',accent:'#c38cff',
    entrance:{x:1510,y:590},
    puzzle:[
      {label:'Wake the floor sigils',symbol:'✨',choices:['✨','⚡','🪨']},
      {label:'Align the moon mirrors',symbol:'🌙',choices:['☀️','🌙','🌧️']},
      {label:'Open the flower chamber',symbol:'🪄',choices:['🪄','🔥','🚫']}
    ]
  },
  {
    id:'maker-core',parent:'builder-bay',name:'Maker Core',icon:'⚙️',accent:'#73e5d8',
    entrance:{x:1510,y:590},
    puzzle:[
      {label:'Read the blueprint rail',symbol:'📐',choices:['📐','🐚','⭐']},
      {label:'Set the drive gear',symbol:'⚙️',choices:['🌙','⚙️','🌱']},
      {label:'Power the assembly heart',symbol:'🔋',choices:['🔋','💨','🪨']}
    ]
  },
  {
    id:'ocean-observatory',parent:'ocean-cove',name:'Ocean Observatory',icon:'🔭',accent:'#65d8ff',
    entrance:{x:1510,y:590},
    puzzle:[
      {label:'Tune the sonar wall',symbol:'🐚',choices:['🐚','🔥','📐']},
      {label:'Follow the current map',symbol:'🌊',choices:['⚡','🌊','🧱']},
      {label:'Light the deep window',symbol:'🔵',choices:['🔵','🛑','🌪️']}
    ]
  }
];

function roomObjects(room){
  return [
    {id:room.id+'-exit',name:'Return Gate',x:135,y:585,icon:'🚪',action:'expedition-exit',hint:'Return to '+room.parent.replace(/-/g,' ')+'.'},
    {id:room.id+'-console',name:'Expedition Console',x:520,y:420,icon:room.icon,action:'expedition-puzzle',hint:'Continue this room’s environmental puzzle.'},
    {id:room.id+'-window',name:'Observation Window',x:820,y:255,icon:'🔭',action:'expedition-window',hint:'Look deeper into DreamBound.'}
  ];
}
function drawRoom(room,ctx,t){
  const done=state.completed.includes(room.id),step=state.steps[room.id]||0;
  ctx.save();
  const bg=ctx.createLinearGradient(0,0,0,720);bg.addColorStop(0,'#090f22');bg.addColorStop(1,'#1f2947');
  ctx.fillStyle=bg;ctx.fillRect(0,0,980,720);
  ctx.strokeStyle=room.accent;ctx.globalAlpha=.16;
  for(let x=40;x<960;x+=80){ctx.beginPath();ctx.moveTo(x,120);ctx.lineTo(x,680);ctx.stroke();}
  for(let y=120;y<700;y+=70){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(940,y);ctx.stroke();}
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(255,255,255,.045)';ctx.beginPath();ctx.roundRect(70,120,840,520,28);ctx.fill();
  ctx.strokeStyle=room.accent;ctx.lineWidth=2;ctx.stroke();
  ctx.font='900 24px system-ui';ctx.fillStyle='#eef4ff';ctx.textAlign='left';ctx.fillText(room.name.toUpperCase(),78,88);
  ctx.font='700 11px system-ui';ctx.fillStyle=room.accent;ctx.fillText('CONNECTED EXPEDITION ROOM',80,108);

  ctx.textAlign='center';ctx.font='72px serif';ctx.fillText(room.icon,520,370);
  ctx.font='900 12px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText(done?'ROOM RESTORED':'PUZZLE '+step+'/3',520,465);

  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.roundRect(725,145,150,170,18);ctx.fill();
  ctx.strokeStyle=room.accent;ctx.stroke();
  ctx.font='40px serif';ctx.fillText('🔭',800,220);
  ctx.font='800 9px system-ui';ctx.fillStyle='#dbe7ff';ctx.fillText('OBSERVATION',800,272);

  ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.roundRect(82,490,105,130,16);ctx.fill();
  ctx.font='38px serif';ctx.fillText('🚪',135,555);
  ctx.font='800 8px system-ui';ctx.fillText('RETURN',135,595);

  if(done){
    const pulse=(DBX.accessibility?.shouldAnimate?.()??true)?0.55+Math.sin(t/350)*.15:.6;
    ctx.globalAlpha=pulse;ctx.strokeStyle=room.accent;ctx.lineWidth=5;
    ctx.beginPath();ctx.arc(520,350,110,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function enterRoom(room){
  if(!state.roomsVisited.includes(room.id)){state.roomsVisited.push(room.id);save();}
  DBX.scene.enter(room.id,{x:210,y:560});
}
function doPuzzle(room){
  if(state.completed.includes(room.id)){DBX.ui.toast(room.name,'This expedition room is fully restored.');return;}
  const step=state.steps[room.id]||0,item=room.puzzle[step];
  DBX.ui.openModal(
    '<section class="expedition-panel"><div class="expedition-kicker">'+room.icon+' '+room.name.toUpperCase()+'</div>'+
    '<h2>'+item.label+'</h2><p>Interact with the room itself to progress. Wrong choices simply let you try again.</p>'+
    '<div class="expedition-choices">'+item.choices.map(x=>'<button data-exp-choice="'+x+'">'+x+'</button>').join('')+'</div>'+
    '<div class="expedition-progress">'+'● '.repeat(step)+'○ '.repeat(3-step)+'</div>'+
    '<button id="expeditionBack" class="small-btn">LOOK AROUND</button></section>'
  );
  document.querySelectorAll('[data-exp-choice]').forEach(btn=>btn.onclick=()=>{
    if(btn.dataset.expChoice!==item.symbol){
      DBX.audio?.click?.();DBX.ui.toast('Room still listening','Try another symbol.');
      return;
    }
    state.steps[room.id]=step+1;save();DBX.audio?.success?.();DBX.fx?.flash?.(.18);
    if(state.steps[room.id]>=3){finishRoom(room);return;}
    DBX.ui.closeModal();DBX.ui.toast('Room changed','A new part of the expedition room is active.');
  });
  document.querySelector('#expeditionBack').onclick=DBX.ui.closeModal;
}
function finishRoom(room){
  if(state.completed.includes(room.id))return;
  state.completed.push(room.id);state.rewards++;save();
  DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+8);
  DBX.state.gems=Math.min(9999,(DBX.state.gems||0)+3);
  DBX.storage.save();DBX.odyssey?.addXP?.(70,room.name+' expedition');
  DBX.ui.closeModal();DBX.fx?.flash?.(.5);DBX.audio?.success?.();
  DBX.events.emit('story:beat',{label:'EXPEDITION RESTORED',title:room.name});
  DBX.ui.toast(room.name+' restored','+8 ⭐  +3 💎 · Room state permanently changed.');
  DBX.events.emit('hud:update');
}
function inspect(room){
  const done=state.completed.includes(room.id);
  DBX.ui.openModal(
    '<section class="expedition-panel"><div class="expedition-kicker">'+room.icon+' '+room.name.toUpperCase()+'</div>'+
    '<h2>🔭 Observation Window</h2><p>'+(done?'The restored room reveals a brighter connected world beyond the glass.':'The window shows parts of DreamBound still waiting to wake up.')+'</p>'+
    '<div class="realm-status-row"><span>ROOM STEP <b>'+state.steps[room.id]+'/3</b></span><span>STATUS <b>'+(done?'RESTORED':'ACTIVE')+'</b></span></div>'+
    '<button id="expeditionWindowClose" class="primary-btn">BACK TO ROOM</button></section>'
  );
  document.querySelector('#expeditionWindowClose').onclick=DBX.ui.closeModal;
}
for(const room of rooms){
  DBX.scene.register(room.id,{
    name:room.name,bounds:{w:980,h:720},spawn:{x:210,y:560},
    interactables:roomObjects(room),
    draw:(ctx,t)=>drawRoom(room,ctx,t),
    interact:o=>{
      if(o?.action==='expedition-exit'){DBX.scene.enter(room.parent,{x:1450,y:650});return true;}
      if(o?.action==='expedition-puzzle'){doPuzzle(room);return true;}
      if(o?.action==='expedition-window'){inspect(room);return true;}
      return false;
    }
  });
}
function entranceCandidate(){
  const scene=DBX.scene?.id||'surface',room=rooms.find(r=>r.parent===scene);
  if(!room)return null;
  const p=DBX.state.player,d=Math.hypot(p.x-room.entrance.x,p.y-room.entrance.y);
  return {...room,id:'entrance-'+room.id,name:room.name,x:room.entrance.x,y:room.entrance.y,d,action:'expedition-enter',hint:'Enter this connected expedition room.'};
}
const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),door=entranceCandidate();
  if(!door)return base;if(!base)return door;
  return door.d<base.d?door:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='expedition-enter'){const room=rooms.find(r=>'entrance-'+r.id===o.id);if(room)enterRoom(room);return;}
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{
  oldDraw(ctx,t);
  const door=entranceCandidate();if(!door||DBX.scene?.id===door.id)return;
  const room=rooms.find(r=>'entrance-'+r.id===door.id);if(!room)return;
  ctx.save();ctx.translate(room.entrance.x,room.entrance.y);
  ctx.shadowColor=room.accent;ctx.shadowBlur=24;ctx.font='44px serif';ctx.textAlign='center';ctx.fillText('🚪',0,0);
  ctx.shadowBlur=0;ctx.font='900 8px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText('EXPEDITION ROOM',0,34);ctx.restore();
};
const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextExpeditions')){
  const b=document.createElement('button');b.id='vnextExpeditions';b.textContent='🧭 ROOMS';b.onclick=()=>{
    const rows=rooms.map(r=>'<article class="kinetic-row '+(state.completed.includes(r.id)?'complete':'')+'"><span>'+r.icon+'</span><div><strong>'+r.name+'</strong><small>'+r.parent.toUpperCase()+' · '+(state.completed.includes(r.id)?'RESTORED':state.roomsVisited.includes(r.id)?'DISCOVERED':'UNEXPLORED')+'</small></div><b>'+(state.completed.includes(r.id)?'✓':'→')+'</b></article>').join('');
    DBX.ui.openModal('<section class="expedition-panel"><div class="expedition-kicker">CONNECTED WORLD INTERIORS</div><h2>🧭 Expedition Rooms</h2><p>These are physical interior spaces connected to the existing realms—not separate games.</p><div class="kinetic-list">'+rows+'</div><div class="guardian-stats"><span>ROOMS FOUND <b>'+state.roomsVisited.length+'/3</b></span><span>RESTORED <b>'+state.completed.length+'/3</b></span></div><button id="expeditionJournalClose" class="primary-btn">BACK TO WORLD</button></section>');
    document.querySelector('#expeditionJournalClose').onclick=DBX.ui.closeModal;
  };actions.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save();});
DBX.expeditions={state,rooms};
})();