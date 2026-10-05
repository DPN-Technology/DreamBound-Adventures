(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.ui||!DBX.world)return;

const KEY='dreambound-guardian-encounters-v1';
const IDS=['moon-whale','clockwork-giant'];
const defaults=()=>({completed:[],attempts:{},teamWins:0});
function clean(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},attempts={};
  for(const id of IDS)attempts[id]=DBX.util.int(r.attempts?.[id],0,999,0);
  return {completed:DBX.util.list(r.completed,IDS,2),attempts,teamWins:DBX.util.int(r.teamWins,0,99,0)};
}
function load(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}

const guardians=[
  {
    id:'moon-whale',scene:'ocean-cove',x:1180,y:610,icon:'🐋',name:'Moonlight Whale',
    requires:()=>DBX.dreamTrials?.state?.abilities?.includes('star-sense'),
    helper:'moss',helperName:'Moss',
    phases:[
      {title:'Read the Tide',text:'The Moonlight Whale is lost in a swirl of sonar lights. Find the calm signal.',choices:['🌊','⚡','🔥'],answer:'🌊'},
      {title:'Follow the Song',text:'Moss hears a friendly pattern. Which symbol matches the whale’s song?',choices:['🐚','🪨','🚫'],answer:'🐚'},
      {title:'Open the Safe Passage',text:'Use Star Sense to guide the whale through the glowing arch.',choices:['🌟','💥','🌪️'],answer:'🌟'}
    ]
  },
  {
    id:'clockwork-giant',scene:'builder-bay',x:1185,y:610,icon:'🤖',name:'Clockwork Giant',
    requires:()=>DBX.dreamTrials?.state?.abilities?.includes('maker-spark'),
    helper:'gear',helperName:'Gear',
    phases:[
      {title:'Slow the Gears',text:'The Clockwork Giant is spinning too fast. Pick the safe control.',choices:['🛑','⚡','🚀'],answer:'🛑'},
      {title:'Match the Blueprint',text:'Gear needs the correct repair symbol.',choices:['📐','🌧️','🐚'],answer:'📐'},
      {title:'Restart Together',text:'Use Maker Spark to bring the giant back online gently.',choices:['⚙️','💥','🔥'],answer:'⚙️'}
    ]
  }
];

function activeGuardian(){
  const scene=DBX.scene?.id||'surface';
  return guardians.find(g=>g.scene===scene&&g.requires()&&!state.completed.includes(g.id))||null;
}
function nearest(){
  const g=activeGuardian();if(!g)return null;
  const p=DBX.state.player,d=Math.hypot(p.x-g.x,p.y-g.y);
  return {...g,d,action:'guardian-encounter',hint:'Team up for a cinematic guardian challenge.'};
}
function start(g){
  state.attempts[g.id]=(state.attempts[g.id]||0)+1;save();
  DBX.events.emit('story:beat',{label:'GUARDIAN ENCOUNTER',title:g.name});
  phase(g,0);
}
function phase(g,index){
  const p=g.phases[index],npc=DBX.npcs?.definitions?.find(n=>n.id===g.helper);
  DBX.ui.openModal(
    '<section class="guardian-panel"><div class="guardian-kicker">CINEMATIC GUARDIAN '+(index+1)+' / '+g.phases.length+'</div>'+
    '<div class="guardian-hero"><span>'+g.icon+'</span><div><h2>'+g.name+'</h2><small>WITH '+(npc?.icon||'🤝')+' '+g.helperName.toUpperCase()+'</small></div></div>'+
    '<div class="guardian-dialogue">“'+p.text+'”</div>'+
    '<div class="guardian-choices">'+p.choices.map(x=>'<button data-guardian-choice="'+x+'">'+x+'</button>').join('')+'</div>'+
    '<div class="guardian-phasebar"><i style="width:'+((index)/g.phases.length*100)+'%"></i></div>'+
    '<div class="guardian-safe">No health bars · no defeat · wrong choices simply retry</div>'+
    '<button id="guardianLeave" class="small-btn">EXPLORE MORE FIRST</button></section>'
  );
  document.querySelectorAll('[data-guardian-choice]').forEach(btn=>btn.onclick=()=>{
    if(btn.dataset.guardianChoice!==p.answer){
      DBX.audio?.click?.();DBX.companion?.emote?.('💜');
      DBX.ui.toast('Team reset','Your team is safe. Try a different idea.');
      return;
    }
    DBX.audio?.success?.();DBX.fx?.flash?.(.2);DBX.companion?.emote?.('✨');
    if(index+1<g.phases.length){phase(g,index+1);return;}
    finish(g);
  });
  document.querySelector('#guardianLeave').onclick=DBX.ui.closeModal;
}
function finish(g){
  if(state.completed.includes(g.id))return;
  state.completed.push(g.id);state.teamWins++;save();
  DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+15);
  DBX.state.gems=Math.min(9999,(DBX.state.gems||0)+6);
  DBX.state.npcFriendship[g.helper]=Math.min(10,(DBX.state.npcFriendship?.[g.helper]||0)+2);
  DBX.storage.save();DBX.odyssey?.addXP?.(120,'Guardian: '+g.name);
  DBX.ui.closeModal();DBX.fx?.flash?.(.7);DBX.audio?.success?.();
  DBX.events.emit('story:beat',{label:'GUARDIAN CALMED',title:g.name});
  DBX.ui.toast(g.name+' is safe','+15 ⭐  +6 💎  +2 '+g.helperName+' friendship');
  DBX.events.emit('guardian:complete',{id:g.id});
  DBX.events.emit('hud:update');
}
function draw(ctx,t){
  const g=activeGuardian();if(!g)return;
  const animate=DBX.accessibility?.shouldAnimate?.()??true;
  const pulse=animate?1+Math.sin(t/360)*.06:1;
  ctx.save();ctx.translate(g.x,g.y);ctx.scale(pulse,pulse);
  const aura=ctx.createRadialGradient(0,0,20,0,0,100);aura.addColorStop(0,'rgba(155,132,255,.28)');aura.addColorStop(1,'rgba(155,132,255,0)');
  ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,100,0,Math.PI*2);ctx.fill();
  ctx.shadowColor='#9b84ff';ctx.shadowBlur=30;ctx.font='64px serif';ctx.textAlign='center';ctx.fillText(g.icon,0,10);
  ctx.shadowBlur=0;ctx.font='900 10px system-ui';ctx.fillStyle='#f3f7ff';ctx.fillText('GUARDIAN ENCOUNTER',0,62);
  ctx.restore();
}
function open(){
  const cards=guardians.map(g=>{
    const done=state.completed.includes(g.id),ready=g.requires();
    return '<article class="guardian-row '+(done?'complete':'')+'"><span>'+g.icon+'</span><div><strong>'+g.name+'</strong><small>'+(done?'CALMED':ready?'ACTIVE IN '+g.scene.toUpperCase():'LOCKED BY WORLD PROGRESS')+'</small></div><b>'+(done?'✓':ready?'READY':'🔒')+'</b></article>';
  }).join('');
  DBX.ui.openModal(
    '<section class="guardian-journal"><div class="guardian-kicker">ONE WORLD · TEAM ENCOUNTERS</div><h2>🛡️ Guardian Encounters</h2>'+
    '<p>Large cinematic challenges where exploration skills, companions, and NPC friends work together. These feel like boss encounters without combat or losing.</p>'+
    '<div class="guardian-list">'+cards+'</div>'+
    '<div class="guardian-stats"><span>GUARDIANS CALMED <b>'+state.completed.length+'/2</b></span><span>TEAM WINS <b>'+state.teamWins+'</b></span></div>'+
    '<button id="guardianJournalClose" class="primary-btn">BACK TO WORLD</button></section>'
  );
  document.querySelector('#guardianJournalClose').onclick=DBX.ui.closeModal;
}
const oldNearest=DBX.world.currentInteractable.bind(DBX.world);
DBX.world.currentInteractable=()=>{const base=oldNearest(),g=nearest();if(!g)return base;if(!base)return g;return g.d<base.d?g:base;};
const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=o=>{if(o?.action==='guardian-encounter'){const g=guardians.find(x=>x.id===o.id);if(g)start(g);return;}oldInteract(o);};
const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{oldDraw(ctx,t);draw(ctx,t)};
const actions=document.querySelector('.mission-actions');
if(actions&&!document.querySelector('#vnextGuardians')){const b=document.createElement('button');b.id='vnextGuardians';b.textContent='🛡️ GUARDIANS';b.onclick=open;actions.appendChild(b);}
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.guardians={state,guardians,activeGuardian,open};
})();