(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world||!DBX.ui)return;

const KEY='dreambound-vnext-story-arcs-v1';
const SHARDS=['echo-a','echo-b','echo-c'];
const defaults=()=>({stage:0,shards:[],starwellSteps:0,complete:false,started:false});
function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  return {
    stage:DBX.util.int(r.stage,0,5,0),
    shards:DBX.util.list(r.shards,SHARDS,3),
    starwellSteps:DBX.util.int(r.starwellSteps,0,3,0),
    complete:DBX.util.bool(r.complete,false),
    started:DBX.util.bool(r.started,false)
  };
}
function load(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function unlocked(){return !!DBX.state.lumaRescued}
function emitBeat(label,title){
  DBX.events.emit('story:beat',{label,title});
  DBX.audio?.magic?.();DBX.fx?.flash?.(.25);
}
function start(){
  if(!unlocked()){DBX.ui.toast('Story arc locked','Help Luma first to reveal the Startrail Mystery.');return}
  if(!state.started){
    state.started=true;state.stage=Math.max(1,state.stage);save();
    emitBeat('NEW STORY ARC','THE STARTRAIL MYSTERY');
    DBX.odyssey?.addXP?.(20,'Story arc discovered');
  }
  openJournal();
}
function objective(){
  if(state.complete)return 'Startrail Mystery complete — the Moon remembers your song.';
  if(!unlocked())return 'Rescue Luma to unlock the next cinematic story arc.';
  if(!state.started)return 'A strange signal is waiting near the Moon. Open STORY to begin.';
  if(state.stage===1)return 'Visit the Starlight Beacon in Tranquility Basin.';
  if(state.stage===2)return 'Recover all 3 Echo Shards scattered across the Moon.';
  if(state.stage===3)return 'Bring the Echo Shards to the Dream Observatory.';
  if(state.stage===4)return 'Calm the Starwell with the three-symbol harmony.';
  return 'Return to the Dream Observatory for the finale.';
}
const beacon={id:'story-starlight-beacon',name:'Starlight Beacon',x:1440,y:665,icon:'📡',action:'story-beacon',hint:'Listen to the strange Startrail signal.',moon:true};
const observatory={id:'story-dream-observatory',name:'Dream Observatory',x:1690,y:535,icon:'🔭',action:'story-observatory',hint:'Study the Echo Shards and the Starwell.',moon:true};
const shardDefs=[
  {id:'echo-a',x:1335,y:905,icon:'🔹',name:'Echo Shard'},
  {id:'echo-b',x:1540,y:820,icon:'🔸',name:'Echo Shard'},
  {id:'echo-c',x:1740,y:950,icon:'🔷',name:'Echo Shard'}
];
for(const item of [beacon,observatory])if(!DBX.world.interactables.some(x=>x.id===item.id))DBX.world.interactables.push(item);

function nearestShard(){
  if(!state.started||state.stage!==2||DBX.scene?.id==='station')return null;
  const p=DBX.state.player;
  return shardDefs.filter(s=>!state.shards.includes(s.id)).map(s=>({...s,action:'story-shard',hint:'Collect this gentle Startrail echo.',d:Math.hypot(p.x-s.x,p.y-s.y)})).sort((a,b)=>a.d-b.d)[0]||null;
}
function openBeacon(){
  if(!unlocked()){DBX.ui.toast('Beacon quiet','Help Luma first.');return}
  if(!state.started){start();return}
  if(state.stage!==1){
    DBX.ui.toast('Starlight Beacon',state.complete?'The beacon hums your completed Startrail melody.':objective());return;
  }
  DBX.ui.openModal(
    '<h2>📡 Starlight Beacon</h2>'+
    '<div class="npc-dialogue">A soft signal repeats from three places on the Moon. Luma recognizes it as a friendly call, not a warning.</div>'+
    '<p>Find the three Echo Shards. There is no timer and nothing can be lost.</p>'+
    '<button id="storyAccept" class="primary-btn">FOLLOW THE STARTRAIL</button>'
  );
  document.querySelector('#storyAccept').onclick=()=>{
    state.stage=2;save();DBX.ui.closeModal();emitBeat('STORY BEAT','THE THREE ECHOES');DBX.ui.toast('Startrail updated','Three Echo Shards are now glowing across the Moon.');
  };
}
function collectShard(id){
  if(state.stage!==2||state.shards.includes(id))return;
  const shard=shardDefs.find(s=>s.id===id);if(!shard)return;
  state.shards.push(id);save();DBX.fx?.burst?.(shard.x,shard.y,shard.icon,14);DBX.audio?.collect?.();
  DBX.odyssey?.addXP?.(12,'Echo Shard recovered');
  if(state.shards.length===3){
    state.stage=3;save();emitBeat('STORY BEAT','ECHOES UNITED');
    DBX.ui.toast('All Echo Shards found','Bring them to the Dream Observatory.');
  }else DBX.ui.toast('Echo Shard '+state.shards.length+'/3','The Startrail melody is becoming clearer.');
}
function openObservatory(){
  if(!state.started){start();return}
  if(state.stage<3){DBX.ui.toast('Dream Observatory',objective());return}
  if(state.stage===3){
    DBX.ui.openModal(
      '<h2>🔭 Dream Observatory</h2>'+
      '<div class="npc-dialogue">The three Echo Shards project a tiny constellation. At its center is a sleepy Starwell that needs a gentle harmony.</div>'+
      '<p>The Starwell uses three symbols. Try them in order. A wrong choice simply lets you try again.</p>'+
      '<button id="storyToWell" class="primary-btn">OPEN THE STARWELL</button>'
    );
    document.querySelector('#storyToWell').onclick=()=>{state.stage=4;state.starwellSteps=0;save();openStarwell()};
    return;
  }
  if(state.stage===4){openStarwell();return}
  if(state.stage===5&&!state.complete){finale();return}
  DBX.ui.toast('Dream Observatory','The Startrail constellation shines peacefully.');
}
const harmony=['🌙','⭐','💜'];
function openStarwell(){
  const expected=harmony[state.starwellSteps]||harmony[0];
  DBX.ui.openModal(
    '<h2>🌌 Calm the Starwell</h2>'+
    '<p>Listen to the pattern and choose the next symbol.</p>'+
    '<div class="director-score">HARMONY <b>'+(state.starwellSteps)+'/3</b></div>'+
    '<div class="odyssey-actions">'+harmony.map(x=>'<button data-harmony="'+x+'" class="primary-btn">'+x+'</button>').join('')+'</div>'+
    '<small>Hint: '+expected+' is glowing a little brighter. No mistakes are punished.</small>'
  );
  document.querySelectorAll('[data-harmony]').forEach(btn=>btn.onclick=()=>{
    if(btn.dataset.harmony===expected){
      state.starwellSteps++;save();DBX.audio?.success?.();DBX.fx?.flash?.(.18);
      if(state.starwellSteps>=3){state.stage=5;save();emitBeat('STORY BEAT','STARWELL AWAKENED');finale()};
      else openStarwell();
    }else{
      DBX.audio?.click?.();DBX.ui.toast('Almost!','The Starwell waits patiently. Try the glowing symbol.');
    }
  });
}
function finale(){
  if(state.complete)return;
  DBX.ui.openModal(
    '<h2>✨ The Startrail Song</h2>'+
    '<div class="npc-dialogue">The Starwell wakes without a crash or battle. It sends a warm constellation across the Moon, and every DreamCreature pauses to watch.</div>'+
    '<p>You solved the mystery by exploring, listening, and helping.</p>'+
    '<button id="storyFinish" class="primary-btn">COMPLETE THE STORY</button>'
  );
  document.querySelector('#storyFinish').onclick=complete;
}
function complete(){
  if(state.complete)return;
  state.complete=true;state.stage=5;save();
  DBX.state.stars=(DBX.state.stars||0)+20;DBX.state.gems=(DBX.state.gems||0)+10;
  if(!DBX.state.codexEntries.includes('Starwell Song'))DBX.state.codexEntries.push('Starwell Song');
  DBX.storage.save();DBX.odyssey?.addXP?.(120,'Startrail Mystery complete');
  DBX.ui.closeModal();emitBeat('STORY COMPLETE','THE STARTRAIL MYSTERY');
  DBX.ui.toast('Story Arc Complete','+20 ⭐  +10 💎  +120 Odyssey XP');
  DBX.events.emit('story:complete',{id:'startrail-mystery'});
}
function openJournal(){
  const steps=[
    ['Hear the Starlight Beacon',state.stage>1||state.complete],
    ['Recover 3 Echo Shards',state.shards.length===3],
    ['Reach the Dream Observatory',state.stage>3||state.complete],
    ['Calm the Starwell',state.stage>4||state.complete],
    ['Complete the Startrail Mystery',state.complete]
  ];
  DBX.ui.openModal(
    '<h2>🎬 Cinematic Story Arcs</h2>'+
    '<article class="quest-card '+(state.complete?'complete':'')+'"><header><strong>✨ The Startrail Mystery</strong><b>'+steps.filter(x=>x[1]).length+'/5</b></header>'+
    '<ul>'+steps.map(([label,done])=>'<li class="'+(done?'done':'')+'"><span>'+(done?'✅':'○')+'</span>'+label+'</li>').join('')+'</ul>'+
    '<small>'+objective()+'</small></article>'+
    '<button id="storyStart" class="primary-btn">'+(!state.started?'BEGIN STORY':state.complete?'STORY COMPLETE':'CONTINUE STORY')+'</button>'+
    '<button id="storyClose" class="small-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#storyStart').onclick=()=>{
    if(!state.started){DBX.ui.closeModal();start()}
    else if(state.complete)DBX.ui.closeModal();
    else{DBX.ui.closeModal();DBX.ui.toast('Active Story',objective())}
  };
  document.querySelector('#storyClose').onclick=DBX.ui.closeModal;
}
function draw(ctx,t){
  if(!state.started||DBX.scene?.id==='station')return;
  ctx.save();
  if(state.stage===2){
    for(const s of shardDefs){
      if(state.shards.includes(s.id))continue;
      const pulse=1+Math.sin(t/260+s.x)*.12;ctx.save();ctx.translate(s.x,s.y);ctx.scale(pulse,pulse);
      ctx.shadowColor='#b7a1ff';ctx.shadowBlur=28;ctx.font='34px serif';ctx.textAlign='center';ctx.fillText(s.icon,0,0);ctx.restore();
    }
  }
  if(state.stage>=3&&!state.complete){
    const a=.18+.12*Math.sin(t/400);ctx.strokeStyle='rgba(199,184,255,'+a+')';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(observatory.x,observatory.y,50+Math.sin(t/300)*8,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{
  const base=oldNearest(),shard=nearestShard();
  if(!shard)return base;if(!base)return shard;
  return shard.d<base.d?shard:base;
};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{
  if(o?.action==='story-beacon'){openBeacon();return}
  if(o?.action==='story-observatory'){openObservatory();return}
  if(o?.action==='story-shard'){collectShard(o.id);return}
  oldInteract(o);
};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextStories')){
  const b=document.createElement('button');b.id='vnextStories';b.textContent='🎬 STORY';b.onclick=openJournal;actions.appendChild(b);
}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.storyArcs={state,start,openJournal,objective,complete};
})();