(() => {
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const setMarkup=(el,html)=>window.DreamBoundDOM.setHTML(el,html);
const appendMarkup=(el,html)=>window.DreamBoundDOM.appendHTML(el,html);
const insertMarkup=(el,pos,html)=>window.DreamBoundDOM.insertHTML(el,pos,html);
const clearMarkup=el=>window.DreamBoundDOM.clear(el);
const screens = $$('.screen');
const canvas = $('#gameCanvas');
const ctx = canvas.getContext('2d');
const WORLD = { w: 3200, h: 2200 };
const COLORS = ['#735cff','#ff5fae','#35bdf1','#4fd57a','#ffb83f','#ff6b52'];
const BUDDIES = ['🐉','🤖','🦄','🐶','🐱','🦖','👽','🐼'];
const CREATURES=[
{id:'puff',icon:'🐲',name:'Pufflet',zone:'Magic Grove',x:1900,y:300},{id:'sprout',icon:'🐛',name:'Sprout',zone:'Home Valley',x:920,y:920},{id:'tango',icon:'🦜',name:'Tango',zone:'Builder Bay',x:1880,y:1880},{id:'pebble',icon:'🐢',name:'Pebble',zone:'Ocean Cove',x:2920,y:1880},{id:'nibbles',icon:'🐹',name:'Nibbles',zone:'Racing Ridge',x:2760,y:860},{id:'tiny',icon:'🦎',name:'Tiny',zone:'Dino Valley',x:950,y:1360}
];
const STICKERS=[['🌈','Rainbow Finder'],['🤖','Robot Friend'],['🦕','Dino Detective'],['🏎️','Racing Rookie'],['🦴','Fossil Finder'],['🪄','Magic Maker'],['🐾','Creature Helper'],['🏰','Master Builder'],['🐚','Ocean Explorer'],['💖','Best Buddies'],['📸','Photo Safari'],['🗺️','World Explorer'],['🌠','Wish Maker'],['☄️','Star Chaser'],['🏛️','Landmark Legend']];
const BUILD_ITEMS = [
  {id:'flower',icon:'🌼',cost:1,label:'Flower'}, {id:'tree',icon:'🌳',cost:2,label:'Tree'},
  {id:'blocks',icon:'🧱',cost:2,label:'Blocks'}, {id:'trampoline',icon:'🟣',cost:3,label:'Trampoline'},
  {id:'tent',icon:'⛺',cost:4,label:'Tent'}, {id:'castle',icon:'🏰',cost:8,label:'Castle'}
];
const ZONES = [
  {name:'Home Valley',x:0,y:0,w:1150,h:1100,color:'#7ee28c',emoji:'🏡'},
  {name:'Magic Grove',x:1150,y:0,w:1050,h:1050,color:'#75d7a2',emoji:'🪄'},
  {name:'Racing Ridge',x:2200,y:0,w:1000,h:1000,color:'#e7ca76',emoji:'🏎️'},
  {name:'Dino Valley',x:0,y:1100,w:1100,h:1100,color:'#91c870',emoji:'🦕'},
  {name:'Builder Bay',x:1100,y:1050,w:1100,h:1150,color:'#6fd7c9',emoji:'🧱'},
  {name:'Ocean Cove',x:2200,y:1000,w:1000,h:1200,color:'#73ccec',emoji:'🐠'}
];

const state = {
  currentSlot: null, profile: null, running: false, keys: {},
  ambient:[], vehicle:false, questCursor:0, worldEventTimer:35, worldEvent:null, buddyEmote:'', buddyEmoteTimer:0, movementDistance:0,
  player: {x:530,y:520,r:24,speed:260,dir:0}, buddy: {x:475,y:560},
  cam: {x:0,y:0}, last:0, near:null, talking:false, buildMode:false, buildItem:'flower',
  collectibles:[], npcs:[], objects:[], particles:[], weather:'sunny', dayClock:.17,
  quests:[], sessionSeconds:0, minigameScore:0, creatures:[], interactables:[], lastZone:'Home Valley', combo:0, race:null
};

function showScreen(id){ screens.forEach(s=>s.classList.toggle('active',s.id===id)); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function rand(min,max){ return Math.random()*(max-min)+min; }
function haptic(ms=30){ if(navigator.vibrate) navigator.vibrate(ms); }
function speak(text){ if(!state.profile?.settings?.narration || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.rate=state.profile.age<=5?.82:.95; u.pitch=1.16; speechSynthesis.speak(u); }

const Audio = {
  ctx:null,
  ensure(){ if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); if(this.ctx.state==='suspended') this.ctx.resume(); },
  tone(freq=440,dur=.08,type='sine',vol=.05){ try{ this.ensure(); const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(this.ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);o.stop(this.ctx.currentTime+dur);}catch{} },
  collect(){this.tone(700,.05);setTimeout(()=>this.tone(930,.08),55)}, success(){[523,659,784,1046].forEach((n,i)=>setTimeout(()=>this.tone(n,.16,'triangle',.045),i*85))}, click(){this.tone(320,.04,'square',.025)}
};

function defaultQuests(){ return [
  {id:'hello',title:'Meet Pip',text:'Find Pip the robot near the rainbow path.',done:false,reward:2,xp:8,icon:'🤖'},
  {id:'stars',title:'Star Collector',text:'Collect 5 Dream Stars.',done:false,reward:3,xp:10,progress:0,target:5,icon:'⭐'},
  {id:'rescue',title:'Tiny Rescue',text:'Find Button the fox in Magic Grove.',done:false,reward:4,xp:12,icon:'🦊'},
  {id:'creatures',title:'Creature Helper',text:'Rescue 3 tiny DreamCreatures.',done:false,reward:5,xp:16,progress:0,target:3,icon:'🐾'},
  {id:'build',title:'Build Something!',text:'Place your first creation in Builder Bay.',done:false,reward:3,xp:10,icon:'🧱'},
  {id:'brain',title:'Brain Power',text:'Complete one learning challenge.',done:false,reward:4,xp:12,icon:'🧠'},
  {id:'race',title:'Racing Rookie',text:'Finish a race at Racing Ridge.',done:false,reward:5,xp:18,icon:'🏎️'},
  {id:'fossil',title:'Fossil Finder',text:'Uncover a complete fossil in Dino Valley.',done:false,reward:5,xp:18,icon:'🦴'},
  {id:'magic',title:'Magic Maker',text:'Learn your first spell in Magic Grove.',done:false,reward:6,xp:20,icon:'🪄'},
  {id:'buddy',title:'Best Buddies',text:'Play with your DreamBuddy 3 times.',done:false,reward:4,xp:14,progress:0,target:3,icon:'💖'},
  {id:'photos',title:'Photo Safari',text:'Take photos in 3 different lands.',done:false,reward:5,xp:16,progress:0,target:3,icon:'📸'},
  {id:'discover',title:'World Explorer',text:'Discover all 6 DreamBound lands.',done:false,reward:8,xp:24,progress:1,target:6,icon:'🗺️'},
  {id:'wish',title:'Make a Wish',text:'Visit the Wishing Well in Home Valley.',done:false,reward:3,xp:10,icon:'🌠'}
]; }

function profileKey(slot){return `dreambound-profile-${slot}`}
function legacyProfileKey(slot){return `wonderworld-profile-${slot}`}
function profileSecurityContext(){
  return {
    colors:COLORS,buddies:BUDDIES,zoneNames:ZONES.map(z=>z.name),creatureIds:CREATURES.map(c=>c.id),
    stickerNames:STICKERS.map(s=>s[1]),
    landmarkIds:(typeof LANDMARKS_V4!=='undefined'?LANDMARKS_V4.map(x=>x.id):['homebase','moontower','speedway','museum','workshop','lighttower']),
    buildItemIds:BUILD_ITEMS.map(x=>x.id),world:WORLD,questTemplates:defaultQuests()
  };
}
function sanitizeStoredProfile(raw){
  if(!window.DreamBoundSanitizer)throw new Error('DreamBound profile sanitizer failed to load');
  return window.DreamBoundSanitizer.sanitizeProfile(raw,profileSecurityContext());
}
function quarantineCorruptProfile(slot,raw,reason){
  try{
    const key=`dreambound-recovery-${slot}`;
    const snapshot=String(raw||'').slice(0,250000);
    localStorage.setItem(key,JSON.stringify({capturedAt:Date.now(),reason:String(reason||'invalid save').slice(0,120),snapshot}));
  }catch{}
  try{localStorage.removeItem(profileKey(slot))}catch{}
}
function parseStoredProfile(slot,raw){
  if(!raw)return null;
  if(raw.length>1000000){quarantineCorruptProfile(slot,raw,'save exceeded 1 MB safety limit');return null}
  try{
    const parsed=JSON.parse(raw),clean=sanitizeStoredProfile(parsed);
    if(!clean){quarantineCorruptProfile(slot,raw,'save was not a profile object');return null}
    return clean;
  }catch(err){
    quarantineCorruptProfile(slot,raw,err?.message||'malformed JSON');
    return null;
  }
}
function readStoredProfile(slot){
  const current=localStorage.getItem(profileKey(slot));
  if(current){
    const clean=parseStoredProfile(slot,current);
    if(clean){try{localStorage.setItem(profileKey(slot),JSON.stringify(clean))}catch{}}
    return clean;
  }
  const legacy=localStorage.getItem(legacyProfileKey(slot));
  if(!legacy)return null;
  const migrated=parseStoredProfile(slot,legacy);
  if(!migrated)return null;
  migrated.brandMigratedFrom='WonderWorld Adventures';
  migrated.brandMigratedAt=Date.now();
  try{localStorage.setItem(profileKey(slot),JSON.stringify(migrated))}catch{}
  return migrated;
}
function loadProfiles(){
  const wrap=$('#profileSlots'); clearMarkup(wrap);
  for(let i=0;i<3;i++){
    const p=readStoredProfile(i);
    const card=document.createElement('button'); card.className='profile-slot'; card.dataset.slot=i;
    if(p){ setMarkup(card,`<div class="profile-avatar" style="background:${p.color}">${p.buddy}</div><strong>${escapeHTML(p.name)}</strong><small>Age ${p.age} • ⭐ ${p.stars||0}</small>`); }
    else setMarkup(card,'<div class="empty-plus">＋</div><strong>New Explorer</strong><small>Create a player</small>');
    card.onclick=()=>selectSlot(i,p); wrap.appendChild(card);
  }
}
function escapeHTML(s=''){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function selectSlot(slot,p){ Audio.click(); state.currentSlot=slot; if(p){ state.profile=p; startGame(); } else { setupCreator(); showScreen('creatorScreen'); } }
function setupCreator(){
  $('#nameInput').value=''; $('#ageSelect').value='6';
  const cc=$('#colorChoices');clearMarkup(cc); COLORS.forEach((c,i)=>{const b=document.createElement('button');b.className='choice'+(i===0?' selected':'');b.style.background=c;b.dataset.color=c;b.onclick=()=>{$$('.choice','#colorChoices'); [...cc.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');drawAvatarPreview();};cc.appendChild(b)});
  const bc=$('#buddyChoices');clearMarkup(bc); BUDDIES.forEach((e,i)=>{const b=document.createElement('button');b.className='choice'+(i===0?' selected':'');b.textContent=e;b.dataset.buddy=e;b.onclick=()=>{[...bc.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$('#buddyPreview').textContent=e;};bc.appendChild(b)});
  drawAvatarPreview();
}
function drawAvatarPreview(){ const c=$('#avatarPreview'),x=c.getContext('2d'); x.clearRect(0,0,c.width,c.height); const color=$('#colorChoices .selected')?.dataset.color||COLORS[0]; x.fillStyle='#ffffff55';x.beginPath();x.arc(160,180,125,0,Math.PI*2);x.fill(); drawCharacter(x,160,170,2.25,color,0,true); }

function createProfile(){
  const name=($('#nameInput').value.trim()||'Explorer').slice(0,12), age=+$('#ageSelect').value;
  const color=$('#colorChoices .selected')?.dataset.color||COLORS[0], buddy=$('#buddyChoices .selected')?.dataset.buddy||BUDDIES[0];
  state.profile={name,age,color,buddy,stars:0,gems:0,buddyLevel:1,explorerLevel:1,xp:0,achievements:[],stickers:[],creatures:[],spells:[],fossils:0,quests:defaultQuests(),buildings:[],homeUpgrades:[],settings:{narration:age<=6,reducedMotion:false,difficulty:'adaptive',weather:true,sessionLimit:0},created:Date.now(),lastPlayed:Date.now()};
  saveProfile(); startGame(true);
}
function saveProfile(){ if(state.profile&&state.currentSlot!==null){state.profile.lastPlayed=Date.now();localStorage.setItem(profileKey(state.currentSlot),JSON.stringify(state.profile));} }

function startGame(first=false){
  state.profile.quests=state.profile.quests?.length?state.profile.quests:defaultQuests();
  state.profile.settings=Object.assign({narration:true,reducedMotion:false,difficulty:'adaptive',weather:true,sessionLimit:0},state.profile.settings||{});
  state.profile.explorerLevel=state.profile.explorerLevel||1; state.profile.xp=state.profile.xp||0; state.profile.creatures=state.profile.creatures||[]; state.profile.stickers=state.profile.stickers||[]; state.profile.spells=state.profile.spells||[]; state.profile.fossils=state.profile.fossils||0; state.profile.homeUpgrades=state.profile.homeUpgrades||[]; state.profile.buildings=state.profile.buildings||[]; state.profile.achievements=state.profile.achievements||[]; state.profile.photos=state.profile.photos||[]; state.profile.discoveredZones=state.profile.discoveredZones||['Home Valley']; state.profile.buddyPlays=state.profile.buddyPlays||0; state.profile.wishes=state.profile.wishes||0; state.profile.totalDistance=state.profile.totalDistance||0; state.profile.worldEvents=state.profile.worldEvents||0;
  const oldQ=new Map((state.profile.quests||[]).map(q=>[q.id,q])); state.profile.quests=defaultQuests().map(q=>Object.assign(q,oldQ.get(q.id)||{}));
  state.player.x=state.profile.position?.x||530; state.player.y=state.profile.position?.y||520; state.buddy.x=state.player.x-55;state.buddy.y=state.player.y+38;
  const startingZone=zoneAt(state.player.x,state.player.y).name;if(!state.profile.discoveredZones.includes(startingZone))state.profile.discoveredZones.push(startingZone);const dq=state.profile.quests.find(q=>q.id==='discover');if(dq&&!dq.done)dq.progress=Math.max(dq.progress||0,state.profile.discoveredZones.length);
  state.objects=(state.profile.buildings||[]).map(o=>({...o,type:'building'})); state.vehicle=false; state.worldEventTimer=rand(28,45); state.worldEvent=null;
  initWorld(); state.lastZone=zoneAt(state.player.x,state.player.y).name; updateHUD(); updateQuestTracker(); showScreen('gameScreen'); resize(); state.running=true; state.last=performance.now(); requestAnimationFrame(loop);
  if(first){ achievement('Welcome to DreamBound Adventures!'); toastQuest('Adventure Started!','Follow the rainbow path and meet Pip.'); setTimeout(()=>speak(`Welcome ${state.profile.name}! Follow the rainbow path to meet Pip the robot.`),700); }
}

function initWorld(){
  state.collectibles=[]; const points=[];
  for(let i=0;i<52;i++){ let x=rand(180,WORLD.w-180),y=rand(160,WORLD.h-160); points.push({id:'star-'+i,type:'star',x,y,taken:false}); }
  for(let i=0;i<24;i++){ let x=rand(200,WORLD.w-200),y=rand(180,WORLD.h-180); points.push({id:'gem-'+i,type:'gem',x,y,taken:false}); }
  const taken=state.profile.taken||[]; state.collectibles=points.map(p=>({...p,taken:taken.includes(p.id)}));
  state.creatures=CREATURES.filter(c=>!state.profile.creatures.includes(c.id)).map(c=>({...c,type:'creature'}));
  state.npcs=[
    {id:'pip',name:'Pip',face:'🤖',x:775,y:485,text:'Welcome back, Explorer! DreamBound is bigger now. The Adventure Board can always show you what to try next.',action:'pip'},
    {id:'mira',name:'Mira',face:'🧚',x:1510,y:530,text:'The Magic Grove is awake! I can teach you a spell if you can copy a sparkle pattern.',action:'magic'},
    {id:'fox',name:'Button',face:'🦊',x:1820,y:760,text:'Yip! You found me! I knew a great explorer would come.',action:'fox'},
    {id:'prof',name:'Professor Byte',face:'🧠',x:1340,y:860,text:'My Dream Machine has an upgraded Brain Sparks chamber. Want to power it?',action:'math'},
    {id:'dino',name:'Dottie',face:'🦕',x:650,y:1530,text:'ROAR! My valley has memory eggs AND a fossil dig site now!',action:'dinohub'},
    {id:'builder',name:'Brix',face:'🦺',x:1575,y:1460,text:'Builder Bay is yours! Build here, then visit your Home Base to see your trophies.',action:'builder'},
    {id:'racer',name:'Zoom',face:'🏎️',x:2650,y:510,text:'The Ridge Raceway is OPEN! Dodge obstacles and race for a trophy sticker!',action:'racer'},
    {id:'ocean',name:'Bubbles',face:'🐬',x:2670,y:1590,text:'I found a shell-code treasure game under the waves. Want to try it?',action:'ocean'},
    {id:'home',name:'Tinker',face:'🧸',x:355,y:430,text:'Your Home Base keeps your favorite discoveries. Want to decorate it?',action:'home'}
  ];
  state.interactables=[
    {id:'portal',name:'Rainbow Portal',face:'🌈',x:440,y:760,text:'A shortcut portal! Choose a discovered land to zoom there.',action:'portal'},
    {id:'digsite',name:'Fossil Dig Site',face:'⛏️',x:350,y:1370,text:'There are bones under these rocks!',action:'fossil'},
    {id:'well',name:'Wishing Well',face:'⛲',x:720,y:850,text:'Drop in a little imagination and make a DreamWish!',action:'wish'},
    {id:'sanctuary',name:'Creature Sanctuary',face:'🏕️',x:1760,y:330,text:'Your rescued DreamCreatures can relax and play here.',action:'sanctuary'},
    {id:'garage',name:'Ridge Garage',face:'🛴',x:2480,y:735,text:'Pick a speedy ride for exploring the big world!',action:'garage'},
    {id:'lighthouse',name:'Rainbow Lighthouse',face:'🗼',x:2910,y:1340,text:'The lighthouse beam uses colors to guide friendly boats home.',action:'lighthouse'}
  ];
  state.ambient=[];
  for(let i=0;i<90;i++){const z=ZONES[i%ZONES.length];state.ambient.push({kind:i%7===0?'butterfly':i%5===0?'flower':i%4===0?'grass':'spark',x:rand(z.x+60,z.x+z.w-60),y:rand(z.y+60,z.y+z.h-60),phase:rand(0,6.28),speed:rand(.3,1.2)});}
}
function resize(){ const dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize',resize);

function loop(t){ if(!state.running)return; const dt=Math.min((t-state.last)/1000,.034);state.last=t;update(dt);draw();requestAnimationFrame(loop); }
function update(dt){
  if(!state.talking && !state.buildMode && !$('#modalLayer').classList.contains('hidden')) return;
  if(!state.talking){
    let dx=(state.keys.ArrowRight||state.keys.d?1:0)-(state.keys.ArrowLeft||state.keys.a?1:0),dy=(state.keys.ArrowDown||state.keys.s?1:0)-(state.keys.ArrowUp||state.keys.w?1:0);
    if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;const sp=state.vehicle?420:state.player.speed;state.player.x=clamp(state.player.x+dx*sp*dt,45,WORLD.w-45);state.player.y=clamp(state.player.y+dy*sp*dt,60,WORLD.h-45);state.player.dir=Math.atan2(dy,dx);state.movementDistance+=sp*dt;state.profile.totalDistance=(state.profile.totalDistance||0)+sp*dt}
  }
  const targetX=state.player.x-Math.cos(state.player.dir)*56, targetY=state.player.y-Math.sin(state.player.dir)*56+16;
  state.buddy.x+=(targetX-state.buddy.x)*Math.min(1,dt*5);state.buddy.y+=(targetY-state.buddy.y)*Math.min(1,dt*5);
  state.cam.x+=(clamp(state.player.x-innerWidth/2,0,Math.max(0,WORLD.w-innerWidth))-state.cam.x)*Math.min(1,dt*5);state.cam.y+=(clamp(state.player.y-innerHeight/2,0,Math.max(0,WORLD.h-innerHeight))-state.cam.y)*Math.min(1,dt*5);
  state.dayClock=(state.dayClock+dt/300)%1; state.sessionSeconds+=dt;
  checkCollectibles();checkNearby();updateLivingWorld(dt);
  const z=zoneAt(state.player.x,state.player.y); if(z.name!==state.lastZone){state.lastZone=z.name;showZoneBanner(z);addXP(2,'New place');if(!state.profile.discoveredZones.includes(z.name)){state.profile.discoveredZones.push(z.name);const q=state.profile.quests.find(q=>q.id==='discover');if(q&&!q.done){q.progress=state.profile.discoveredZones.length;if(q.progress>=q.target)completeQuest('discover');else toastQuest('New Land Discovered!',`${z.emoji} ${z.name} • ${q.progress}/${q.target} lands`)}saveProfile();updateQuestTracker();}}
  if(state.profile.settings.sessionLimit>0 && state.sessionSeconds>state.profile.settings.sessionLimit*60){ state.sessionSeconds=-999999; openBreakModal(); }
}
function checkCollectibles(){
  state.collectibles.forEach(c=>{if(!c.taken&&dist(c,state.player)<43){c.taken=true;state.profile.taken=state.profile.taken||[];state.profile.taken.push(c.id); if(c.type==='super'){state.profile.stars+=3;state.profile.gems+=5;state.profile.worldEvents=(state.profile.worldEvents||0)+1;addXP(12,'Falling Star');Audio.success();spawnBurst(c.x,c.y,'#fff36b');spawnBurst(c.x,c.y,'#ff7ad9');showCombo('FALLING STAR! 🌠');achievement('Star Chaser');unlockSticker('Star Chaser');state.worldEvent=null;$('#worldEvent').classList.add('hidden');}else if(c.type==='star'){state.profile.stars++;questProgress('stars',1);addXP(1);Audio.collect();spawnBurst(c.x,c.y,'#ffd84f');showCombo('STAR! ⭐');}else{state.profile.gems++;addXP(1);Audio.tone(1100,.12,'triangle');spawnBurst(c.x,c.y,'#48e6ff');showCombo('GEM! 💎')} updateHUD();saveProfile();}})
}
function checkNearby(){
  let nearest=null,nd=95;
  [...state.npcs,...state.interactables,...state.creatures].forEach(n=>{const d=dist(n,state.player);if(d<nd){nearest=n;nd=d}}); state.near=nearest;
  $('#interactBtn').classList.toggle('hidden',!nearest||state.talking||state.buildMode); if(nearest)$('#interactBtn').textContent=nearest.type==='creature'?`💖 RESCUE ${nearest.name.toUpperCase()}`:`✨ ${nearest.action==='fossil'?'DIG AT':'TALK TO'} ${nearest.name.toUpperCase()}`;
}
function interact(){ if(state.talking){closeTalk();return} if(state.near){ if(state.near.type==='creature')rescueCreature(state.near); else talkTo(state.near);} }
function talkTo(n){state.talking=true;$('#speakerFace').textContent=n.face;$('#speakerName').textContent=n.name;$('#speakerText').textContent=n.text;$('#talkBubble').classList.remove('hidden');$('#interactBtn').classList.add('hidden');speak(`${n.name} says, ${n.text}`);Audio.tone(560,.05); if(n.action==='pip')completeQuest('hello'); if(n.action==='fox')completeQuest('rescue'); setTimeout(()=>{
  if(n.action==='math')addTalkAction('🧠 PLAY BRAIN SPARKS',()=>{closeTalk();openMathGame()});
  if(n.action==='dinohub'){addTalkAction('🥚 DINO MEMORY',()=>{closeTalk();openMemoryGame()});addTalkAction('🦴 FOSSIL DIG',()=>{closeTalk();openFossilGame()})}
  if(n.action==='builder')addTalkAction('🧱 OPEN BUILDER',()=>{closeTalk();toggleBuild(true)});
  if(n.action==='racer')addTalkAction('🏎️ START RIDGE RACE',()=>{closeTalk();openRaceGame()});
  if(n.action==='magic')addTalkAction('🪄 LEARN SPARKLE MAGIC',()=>{closeTalk();openMagicLesson()});
  if(n.action==='ocean')addTalkAction('🐚 PLAY SHELL SEQUENCE',()=>{closeTalk();openShellGame()});
  if(n.action==='home')addTalkAction('🏡 OPEN MY HOME BASE',()=>{closeTalk();openHomeBase()});
  if(n.action==='portal')addTalkAction('🌈 USE RAINBOW PORTAL',()=>{closeTalk();openPortal()});
  if(n.action==='fossil')addTalkAction('⛏️ START DIGGING',()=>{closeTalk();openFossilGame()});
  if(n.action==='wish')addTalkAction('🌠 MAKE A WISH',()=>{closeTalk();openWishingWell()});
  if(n.action==='sanctuary')addTalkAction('🐾 VISIT SANCTUARY',()=>{closeTalk();openSanctuary()});
  if(n.action==='garage')addTalkAction('🛴 PICK A RIDE',()=>{closeTalk();openGarage()});
  if(n.action==='lighthouse')addTalkAction('🌈 LIGHTHOUSE PUZZLE',()=>{closeTalk();openLighthouseGame()});
},50);}
function addTalkAction(label,fn){const b=document.createElement('button');b.className='big-btn primary';b.style.margin='10px 0 0';b.style.padding='10px';b.textContent=label;b.onclick=fn;$('#talkBubble').appendChild(b)}
function closeTalk(){state.talking=false;$('#talkBubble').classList.add('hidden');[...$('#talkBubble').querySelectorAll('button')].forEach(b=>b.remove());}

function draw(){
  ctx.clearRect(0,0,innerWidth,innerHeight);ctx.save();ctx.translate(-state.cam.x,-state.cam.y);drawWorld();drawAmbient();drawObjects();drawCollectibles();drawCreatures();drawInteractables();drawNPCs();drawBuddy();drawPlayer();drawParticles();ctx.restore();drawDayOverlay();drawQuestCompass(); }
function drawWorld(){
  ZONES.forEach(z=>{ctx.fillStyle=z.color;ctx.fillRect(z.x,z.y,z.w,z.h);ctx.globalAlpha=.08;ctx.font='bold 180px sans-serif';ctx.fillText(z.emoji,z.x+z.w*.35,z.y+z.h*.55);ctx.globalAlpha=1});
  // paths
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=92;ctx.strokeStyle='#f5e6a7';ctx.beginPath();ctx.moveTo(520,520);ctx.bezierCurveTo(760,520,930,530,1130,680);ctx.bezierCurveTo(1330,830,1500,930,1690,940);ctx.stroke();
  ctx.lineWidth=9;ctx.setLineDash([22,20]);ctx.strokeStyle='#fff9c6';ctx.stroke();ctx.setLineDash([]);
  // river/ocean edge
  ctx.fillStyle='#4abbe5';ctx.beginPath();ctx.moveTo(2180,980);for(let y=980;y<=2200;y+=85){ctx.lineTo(2180+Math.sin(y*.019)*45,y)}ctx.lineTo(3200,2200);ctx.lineTo(3200,980);ctx.closePath();ctx.fill();
  // home
  drawEmoji(340,360,'🏠',95);drawEmoji(440,760,'🌈',90);drawEmoji(880,310,'🌳',74);drawEmoji(980,800,'🛝',70);
  // landmark decorations
  [['🍄',1260,260,55],['✨',1660,230,44],['🪄',1900,520,70],['🏁',2470,270,70],['🏎️',2880,710,75],['🦴',330,1320,70],['🦕',850,1880,110],['🏗️',1330,1750,80],['🐠',2450,1820,60],['🐚',2880,1380,55]].forEach(a=>drawEmoji(a[1],a[2],a[0],a[3]));
  // zone labels
  ctx.font='900 34px ui-rounded, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ZONES.forEach(z=>{ctx.fillStyle='#ffffffc9';roundRect(ctx,z.x+z.w/2-140,z.y+45,280,52,20,true);ctx.fillStyle='#3f4770';ctx.fillText(z.name,z.x+z.w/2,z.y+72)});ctx.textAlign='start';
}
function roundRect(c,x,y,w,h,r,fill=false){c.beginPath();c.roundRect(x,y,w,h,r);if(fill)c.fill();}
function drawEmoji(x,y,e,size){ctx.font=`${size}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e,x,y);ctx.textAlign='start'}
function drawCharacter(c,x,y,s,color,dir=0,preview=false){
  c.save();c.translate(x,y);if(!preview)c.rotate(0);c.fillStyle='#0002';c.beginPath();c.ellipse(0,30*s,20*s,8*s,0,0,Math.PI*2);c.fill();
  c.fillStyle=color;c.beginPath();c.roundRect(-18*s,-5*s,36*s,39*s,11*s);c.fill();c.fillStyle='#ffd6ba';c.beginPath();c.arc(0,-20*s,20*s,0,Math.PI*2);c.fill();
  c.fillStyle='#423347';c.beginPath();c.arc(-7*s,-22*s,2.2*s,0,7);c.arc(7*s,-22*s,2.2*s,0,7);c.fill();c.strokeStyle='#ae5b68';c.lineWidth=1.3*s;c.beginPath();c.arc(0,-17*s,6*s,.15,Math.PI-.15);c.stroke();
  c.fillStyle='#55354a';c.beginPath();c.arc(0,-33*s,16*s,Math.PI,Math.PI*2);c.fill();c.fillRect(-17*s,-34*s,34*s,8*s);c.restore();
}
function drawPlayer(){if(state.vehicle){ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(state.player.x,state.player.y+30,30,10,0,0,7);ctx.fill();drawEmoji(state.player.x,state.player.y+17,'🛴',50);drawCharacter(ctx,state.player.x,state.player.y-9,.9,state.profile.color,state.player.dir)}else drawCharacter(ctx,state.player.x,state.player.y,1,state.profile.color,state.player.dir)}
function drawBuddy(){const bob=Math.sin(performance.now()/250)*5;ctx.fillStyle='#0002';ctx.beginPath();ctx.ellipse(state.buddy.x,state.buddy.y+23,20,7,0,0,7);ctx.fill();drawEmoji(state.buddy.x,state.buddy.y+bob,state.profile.buddy,43);if(state.buddyEmoteTimer>0){ctx.font='26px serif';ctx.textAlign='center';ctx.fillText(state.buddyEmote||'💖',state.buddy.x,state.buddy.y-42+bob);ctx.textAlign='start'}}
function drawCreatures(){state.creatures.forEach((c,i)=>{const bob=Math.sin(performance.now()/240+i)*7;ctx.fillStyle='#fff8';ctx.beginPath();ctx.arc(c.x,c.y,31,0,7);ctx.fill();drawEmoji(c.x,c.y+bob,c.icon,43);ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x,c.y,37+Math.sin(performance.now()/300+i)*3,0,7);ctx.stroke()})}
function drawInteractables(){state.interactables.forEach((n,i)=>{const pulse=1+Math.sin(performance.now()/300+i)*.08;ctx.save();ctx.translate(n.x,n.y);ctx.scale(pulse,pulse);drawEmoji(0,0,n.face,n.action==='portal'?82:58);ctx.restore()})}
function drawNPCs(){state.npcs.forEach(n=>{ctx.fillStyle='#fff9';ctx.beginPath();ctx.arc(n.x,n.y,36,0,7);ctx.fill();drawEmoji(n.x,n.y,n.face,48); if(dist(n,state.player)<180){ctx.font='900 17px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';roundRect(ctx,n.x-62,n.y-67,124,29,14,true);ctx.fillStyle='#3f466e';ctx.fillText(n.name,n.x,n.y-52);ctx.textAlign='start'}})}
function drawCollectibles(){state.collectibles.forEach(c=>{if(c.taken)return;const bob=Math.sin(performance.now()/280+c.x)*6;drawEmoji(c.x,c.y+bob,c.type==='super'?'🌠':c.type==='star'?'⭐':'💎',c.type==='super'?48:c.type==='star'?31:27)})}
function drawObjects(){state.objects.forEach(o=>drawEmoji(o.x,o.y,BUILD_ITEMS.find(i=>i.id===o.item)?.icon||'✨',o.item==='castle'?90:62))}
function drawParticles(){state.particles=state.particles.filter(p=>p.life>0);state.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.life-=.02;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,7,7);ctx.globalAlpha=1})}
function spawnBurst(x,y,color){for(let i=0;i<15;i++)state.particles.push({x,y,vx:rand(-3,3),vy:rand(-4,-.5),life:1,color})}
function drawDayOverlay(){ const t=state.dayClock, night=Math.max(0,Math.cos((t-.5)*Math.PI*2))*.42; if(night>.02){ctx.fillStyle=`rgba(36,39,91,${night})`;ctx.fillRect(0,0,innerWidth,innerHeight)} }

function zoneAt(x,y){return ZONES.find(z=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)||ZONES[0]}
function updateHUD(){ if(!state.profile)return;updateQuestTracker();$('#hudName').textContent=state.profile.name;$('#hudAvatar').textContent=state.profile.buddy;$('#hudAvatar').style.background=state.profile.color;$('#explorerLevel').textContent=state.profile.explorerLevel||1;$('#starCount').textContent=state.profile.stars||0;$('#gemCount').textContent=state.profile.gems||0;$('#buddyLevel').textContent=state.profile.buddyLevel||1;const need=xpNeeded(state.profile.explorerLevel||1);$('#levelNum').textContent=state.profile.explorerLevel||1;$('#levelFill').style.width=Math.min(100,((state.profile.xp||0)/need)*100)+'%';$('#xpText').textContent=`${state.profile.xp||0} / ${need} XP`;$('#magicBtn').classList.toggle('locked',!(state.profile.spells||[]).length);$('#magicBtn').classList.toggle('unlocked',(state.profile.spells||[]).length>0); }
setInterval(()=>{if(state.running){$('#zoneLabel').textContent=zoneAt(state.player.x,state.player.y).name; state.profile.position={x:Math.round(state.player.x),y:Math.round(state.player.y)};saveProfile()}},2500);

function questProgress(id,n){const q=state.profile.quests.find(q=>q.id===id);if(!q||q.done)return;q.progress=(q.progress||0)+n;if(q.progress>=q.target)completeQuest(id);else toastQuest(q.title,`${q.progress}/${q.target} — ${q.text}`)}
function completeQuest(id){const q=state.profile.quests.find(q=>q.id===id);if(!q||q.done)return;q.done=true;state.profile.stars+=q.reward||0;addXP(q.xp||10,q.title);unlockStickerForQuest(id);updateHUD();saveProfile();Audio.success();confetti();toastQuest('Quest Complete!',`${q.title} +${q.reward} ⭐ • +${q.xp||10} XP`);achievement(q.title);}
function toastQuest(title,text){$('#questTitle').textContent=title;$('#questText').textContent=text;$('#questToast').classList.remove('hidden');setTimeout(()=>$('#questToast').classList.add('hidden'),3600)}
function achievement(text){if(!state.profile.achievements.includes(text)){state.profile.achievements.push(text);saveProfile()}$('#achievementText').textContent=text;$('#achievement').classList.remove('hidden');setTimeout(()=>$('#achievement').classList.add('hidden'),3500)}
function confetti(){const layer=$('#confettiLayer');for(let i=0;i<55;i++){const e=document.createElement('i');e.className='confetti';e.style.left=rand(5,95)+'vw';e.style.top=rand(-20,5)+'vh';e.style.background=COLORS[i%COLORS.length];e.style.setProperty('--dx',rand(-100,100)+'px');e.style.animationDelay=rand(0,.4)+'s';layer.appendChild(e);setTimeout(()=>e.remove(),2600)}}

function toggleBuild(force){state.buildMode=force??!state.buildMode; const bar=$('#buildToolbar');bar.classList.toggle('hidden',!state.buildMode);if(state.buildMode){clearMarkup(bar);BUILD_ITEMS.forEach(i=>{const b=document.createElement('button');b.className='build-tool'+(state.buildItem===i.id?' selected':'');b.title=`${i.label} • ${i.cost} gems`;setMarkup(b,`${i.icon}<small style="display:block;font-size:10px">💎${i.cost}</small>`);b.onclick=()=>{state.buildItem=i.id;[...bar.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected')};bar.appendChild(b)});const done=document.createElement('button');done.className='build-tool';done.textContent='✅';done.onclick=()=>toggleBuild(false);bar.appendChild(done);toastQuest('Builder Mode','Click/tap the ground to place your creation.');} }
canvas.addEventListener('pointerdown',e=>{if(!state.buildMode)return; const r=canvas.getBoundingClientRect(),x=e.clientX-r.left+state.cam.x,y=e.clientY-r.top+state.cam.y;const item=BUILD_ITEMS.find(i=>i.id===state.buildItem), gems=state.profile.gems||0;if(gems<item.cost){toastQuest('Need More Gems!',`Explore the world and collect 💎 gems. ${item.label} costs ${item.cost}.`);Audio.tone(180,.15,'sawtooth');return}state.profile.gems-=item.cost;const o={id:'b'+Date.now(),item:item.id,x:Math.round(x),y:Math.round(y)};state.profile.buildings=state.profile.buildings||[];state.profile.buildings.push(o);state.objects.push({...o,type:'building'});spawnBurst(x,y,'#fff36b');Audio.success();updateHUD();saveProfile();completeQuest('build')});

function openModal(html){setMarkup($('#modalCard'),`<button class="close-modal" aria-label="Close">×</button>${html}`);$('#modalLayer').classList.remove('hidden');$('#modalCard .close-modal').onclick=closeModal;}
function closeModal(){if(state.raceStop){const stop=state.raceStop;state.raceStop=null;stop()}$('#modalLayer').classList.add('hidden');clearMarkup($('#modalCard'))}
function openJournal(){const qs=state.profile.quests.map(q=>`<div class="journal-item ${q.done?'done':''}"><strong>${q.done?'✅':'⭐'} ${q.title}</strong><div>${q.text}</div>${q.target&&!q.done?`<small>${q.progress||0}/${q.target}</small>`:''}</div>`).join('');openModal(`<h2>📖 Adventure Journal</h2><p style="text-align:center;font-weight:800">Every adventure helps DreamBound grow!</p>${qs}<h3>🏆 Stickers & Achievements</h3><div style="text-align:center;font-size:30px">${state.profile.achievements.length?state.profile.achievements.map(()=> '🌟').join(' '):'Go explore to earn your first one!'}</div>`)}
function openMap(){const current=zoneAt(state.player.x,state.player.y).name;openModal(`<h2>🗺️ DreamBound Explorer Map</h2><p style="text-align:center;font-weight:900">Tap any discovered land to fast-travel there.</p><div class="world-map-grid">${ZONES.map((z,i)=>{const seen=state.profile.discoveredZones.includes(z.name),photo=state.profile.photos.includes(z.name);return `<button class="map-zone ${seen?'seen':'locked'} ${z.name===current?'current':''}" data-i="${i}" ${seen?'':'disabled'}><span>${seen?z.emoji:'❔'}</span><strong>${seen?z.name:'Undiscovered Land'}</strong><small>${z.name===current?'📍 You are here':seen?(photo?'📸 Photo collected':'✨ Discovered'):'Keep exploring!'}</small></button>`}).join('')}</div><div class="map-stats"><span>🗺️ ${state.profile.discoveredZones.length}/6 lands</span><span>📸 ${state.profile.photos.length}/6 photos</span><span>🌠 ${state.profile.worldEvents||0} falling stars</span></div>`);$$('.map-zone.seen').forEach(b=>b.onclick=()=>{const z=ZONES[+b.dataset.i];state.player.x=z.x+z.w/2;state.player.y=z.y+z.h/2;state.buddy.x=state.player.x-50;state.buddy.y=state.player.y+35;closeModal();showZoneBanner(z);Audio.success()})}
function openSettings(){const s=state.profile.settings;openModal(`<h2>⚙️ Explorer Settings</h2><div class="settings-row"><strong>🗣️ Spoken instructions</strong><button id="narrToggle" class="toggle ${s.narration?'on':''}"></button></div><div class="settings-row"><strong>🌦️ Weather effects</strong><button id="weatherToggle" class="toggle ${s.weather?'on':''}"></button></div><div class="settings-row"><strong>🎯 Challenge level</strong><select id="diffSelect"><option value="adaptive" ${s.difficulty==='adaptive'?'selected':''}>Adaptive</option><option value="easy" ${s.difficulty==='easy'?'selected':''}>Gentle</option><option value="hard" ${s.difficulty==='hard'?'selected':''}>Big Brain</option></select></div><div class="settings-row"><strong>☀️ Change weather</strong><button id="changeWeather">Change</button></div><div class="settings-row"><strong>⏱️ Break reminder</strong><select id="breakSelect"><option value="0">Off</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></div><button id="saveExit" class="big-btn secondary">💾 Save & Choose Player</button>`);$('#narrToggle').onclick=e=>{s.narration=!s.narration;e.currentTarget.classList.toggle('on',s.narration);saveProfile()};$('#weatherToggle').onclick=e=>{s.weather=!s.weather;e.currentTarget.classList.toggle('on',s.weather);setWeather(s.weather?state.weather:'sunny');saveProfile()};$('#diffSelect').onchange=e=>{s.difficulty=e.target.value;saveProfile()};$('#changeWeather').onclick=()=>{const arr=['sunny','rain','sparkles'];setWeather(arr[(arr.indexOf(state.weather)+1)%arr.length])};$('#breakSelect').value=String(s.sessionLimit||0);$('#breakSelect').onchange=e=>{s.sessionLimit=+e.target.value;saveProfile()};$('#saveExit').onclick=()=>{saveProfile();state.running=false;closeModal();loadProfiles();showScreen('profileScreen')};}
function setWeather(w){state.weather=w;const l=$('#weatherLayer');clearMarkup(l);if(!state.profile?.settings?.weather)return;if(w==='rain'){for(let i=0;i<70;i++){const d=document.createElement('i');d.className='rain-drop';d.style.left=rand(0,100)+'%';d.style.top=rand(-100,30)+'%';d.style.animationDelay=rand(-1,0)+'s';d.style.animationDuration=rand(.6,1.1)+'s';l.appendChild(d)}}else if(w==='sparkles'){for(let i=0;i<22;i++){const d=document.createElement('span');d.textContent='✨';d.style.position='absolute';d.style.left=rand(0,100)+'%';d.style.top=rand(0,100)+'%';d.style.fontSize=rand(12,28)+'px';d.style.animation='twinkle '+rand(1,2.5)+'s infinite';l.appendChild(d)}}}

function difficulty(){const d=state.profile.settings.difficulty;if(d==='easy')return 0;if(d==='hard')return 2;return state.profile.age<=5?0:state.profile.age<=7?1:2}
function openMathGame(){let round=0,score=0;function next(){round++;if(round>5){state.profile.stars+=score;state.profile.buddyLevel=Math.min(9,(state.profile.buddyLevel||1)+(score>=4?1:0));updateHUD();saveProfile();completeQuest('brain');confetti();openModal(`<h2>⚡ Dream Machine Powered!</h2><div style="font-size:76px;text-align:center">🤖✨</div><p style="text-align:center;font-size:22px;font-weight:900">You earned ${score} bonus Dream Stars!</p><button id="mgDone" class="big-btn primary">BACK TO ADVENTURE</button>`);$('#mgDone').onclick=closeModal;return}const dif=difficulty(),a=Math.floor(rand(1,dif===0?6:dif===1?11:21)),b=Math.floor(rand(1,dif===0?5:dif===1?10:15)),op=(dif===2&&Math.random()>.55)?'-':'+',aa=op==='-'?Math.max(a,b):a,bb=op==='-'?Math.min(a,b):b,ans=op==='-'?aa-bb:aa+bb;let opts=[ans];while(opts.length<3){const v=Math.max(0,ans+Math.floor(rand(-4,5)));if(!opts.includes(v))opts.push(v)}opts.sort(()=>Math.random()-.5);openModal(`<div class="minigame"><h2>🧠 Brain Sparks</h2><div class="question-card"><small style="font-weight:900">POWER CELL ${round}/5</small><div class="question">${aa} ${op} ${bb} = ?</div><div class="answers">${opts.map(v=>`<button class="answer-btn" data-v="${v}">${v}</button>`).join('')}</div><p>Score: ⭐ ${score}</p></div></div>`);$$('.answer-btn').forEach(btn=>btn.onclick=()=>{if(+btn.dataset.v===ans){score++;Audio.success();btn.textContent='✅';speak('Great job!')}else{Audio.tone(180,.13,'sawtooth');btn.textContent='Try again!';speak('Almost! Let’s try another one.')}setTimeout(next,650)})}next()}
function openMemoryGame(){const dif=difficulty(),pairs=dif===0?3:dif===1?6:8,icons=['🥚','🦕','🦖','🌋','🦴','🌿','☄️','🐾'].slice(0,pairs),cards=[...icons,...icons].sort(()=>Math.random()-.5);let first=null,lock=false,matched=0;openModal(`<div class="minigame"><h2>🥚 Dino Egg Memory</h2><p style="text-align:center;font-weight:900">Find all the matching pairs!</p><div class="memory-grid" style="grid-template-columns:repeat(${pairs<=3?3:4},1fr)">${cards.map((v,i)=>`<button class="memory-card" data-i="${i}" data-v="${v}">?</button>`).join('')}</div></div>`);const btns=$$('.memory-card');btns.forEach(b=>b.onclick=()=>{if(lock||b.classList.contains('matched')||b===first)return;b.classList.add('flipped');b.textContent=b.dataset.v;if(!first){first=b;Audio.tone(500,.04);return}if(first.dataset.v===b.dataset.v){first.classList.add('matched');b.classList.add('matched');first=null;matched+=2;Audio.collect();if(matched===cards.length){setTimeout(()=>{state.profile.gems=(state.profile.gems||0)+3;updateHUD();saveProfile();completeQuest('brain');confetti();openModal(`<h2>🦕 Dino Detective!</h2><div style="font-size:80px;text-align:center">🥚✨🦕</div><p style="text-align:center;font-size:21px;font-weight:900">All eggs found! You earned 3 💎 gems.</p><button id="memDone" class="big-btn primary">KEEP EXPLORING</button>`);$('#memDone').onclick=closeModal},500)}}else{lock=true;setTimeout(()=>{first.classList.remove('flipped');b.classList.remove('flipped');first.textContent='?';b.textContent='?';first=null;lock=false},650)}})}
function openBreakModal(){openModal(`<h2>🌈 Adventure Break</h2><div style="font-size:70px;text-align:center">💧🧘🌳</div><p style="text-align:center;font-size:21px;font-weight:900">Great exploring! How about a stretch, a drink, or showing someone what you built?</p><button id="continueBtn" class="big-btn primary">I'M READY TO KEEP PLAYING</button>`);$('#continueBtn').onclick=()=>{state.sessionSeconds=0;closeModal()}}

function openHow(){openModal(`<h2>✨ Welcome to DreamBound!</h2><div class="modal-grid"><div class="menu-tile"><strong>🕹️ Explore</strong><small>Use arrow keys, WASD, touch controls, or a gamepad.</small></div><div class="menu-tile"><strong>✨ Talk & Discover</strong><small>Walk near friends and press Space/E or the sparkle button.</small></div><div class="menu-tile"><strong>⭐ Collect</strong><small>Find stars and gems hidden all over the world.</small></div><div class="menu-tile"><strong>🧱 Build</strong><small>Use gems to add your own creations to DreamBound.</small></div><div class="menu-tile"><strong>🧠 Play</strong><small>Mini-games quietly adjust to each explorer's age.</small></div><div class="menu-tile"><strong>💖 Grow</strong><small>Complete quests and become best friends with your DreamBuddy.</small></div><div class="menu-tile"><strong>🏎️ Race & Dig</strong><small>Race at the Ridge, dig fossils in Dino Valley, and unlock stickers.</small></div><div class="menu-tile"><strong>🪄 Learn Magic</strong><small>Visit Mira in Magic Grove and unlock playful spells.</small></div><div class="menu-tile"><strong>💖 DreamBuddy</strong><small>Pet, play and grow your friendship.</small></div><div class="menu-tile"><strong>📸 Photo Safari</strong><small>Photograph every land for your adventure book.</small></div><div class="menu-tile"><strong>🛴 Ride</strong><small>Unlock a safe scooter for faster exploring.</small></div><div class="menu-tile"><strong>🌠 World Events</strong><small>Chase surprise falling stars for special rewards.</small></div></div>`)}
function openParentGate(){let hold=0,timer=null;openModal(`<h2>🔒 Parent Corner</h2><p style="text-align:center;font-weight:800">Grown-up check: hold the button for 3 seconds.</p><button id="holdParent" class="big-btn secondary">HOLD FOR GROWN-UPS</button><div id="holdProgress" style="height:12px;background:#e8e4f7;border-radius:9px;overflow:hidden"><div style="height:100%;width:0;background:#6754e8"></div></div>`);const b=$('#holdParent'),bar=$('#holdProgress div');const start=()=>{hold=0;timer=setInterval(()=>{hold+=100;bar.style.width=Math.min(100,hold/30)+'%';if(hold>=3000){clearInterval(timer);openParentPanel()}},100)};const stop=()=>{clearInterval(timer);hold=0;bar.style.width='0%'};['pointerdown'].forEach(ev=>b.addEventListener(ev,start));['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop))}
function openParentPanel(){const profiles=[0,1,2].map(i=>readStoredProfile(i)).filter(Boolean);openModal(`<h2>👨‍👩‍👧 Parent Corner</h2><p style="text-align:center;font-weight:800">DreamBound stores progress only in this browser on this device.</p>${profiles.map(p=>`<div class="parent-profile-card"><div class="parent-avatar" style="background:${p.color}">${p.buddy}</div><div><strong>${escapeHTML(p.name)} • Age ${p.age}</strong><small>Explorer Level ${p.explorerLevel||1} • 💖 Buddy ${p.buddyLevel||1}</small><div class="parent-stat-row"><span>⭐ ${p.stars||0}</span><span>💎 ${p.gems||0}</span><span>✅ ${(p.quests||[]).filter(q=>q.done).length}/${(p.quests||[]).length||0}</span><span>📸 ${(p.photos||[]).length}/6</span><span>🐾 ${(p.creatures||[]).length}/${CREATURES.length}</span></div></div></div>`).join('')||'<p>No explorers yet.</p>'}<div class="settings-row"><strong>⏱️ Play-break reminders</strong><span>Each explorer can use 20, 30, or 45 minute reminders in ⚙️ Settings.</span></div><div class="settings-row"><strong>🧠 Adaptive challenge</strong><span>Activities automatically simplify for younger explorers and add challenge for older ones.</span></div><p style="font-size:13px;font-weight:800;color:#73799b">Safety: No ads, external links, purchases, analytics, public chat, online accounts, or strangers are included in this build.</p>`)}

// ===== DreamBound v0.2.0 ADVANCED ADVENTURE SYSTEMS =====
function xpNeeded(level){return 25+(level-1)*15}
function addXP(amount=1,reason=''){if(!state.profile)return;state.profile.xp=(state.profile.xp||0)+amount;let leveled=false;while(state.profile.xp>=xpNeeded(state.profile.explorerLevel||1)){state.profile.xp-=xpNeeded(state.profile.explorerLevel||1);state.profile.explorerLevel=(state.profile.explorerLevel||1)+1;state.profile.gems=(state.profile.gems||0)+2;leveled=true}if(leveled){Audio.success();confetti();achievement(`Explorer Level ${state.profile.explorerLevel}!`);toastQuest('LEVEL UP! 🧭',`You reached Explorer Level ${state.profile.explorerLevel} and earned 2 💎!`)}updateHUD();saveProfile()}
function showCombo(text){const e=document.createElement('div');e.className='combo-pop';e.textContent=text;$('#gameScreen').appendChild(e);setTimeout(()=>e.remove(),1000)}
function showZoneBanner(z){$('#zoneBannerEmoji').textContent=z.emoji;$('#zoneBannerName').textContent=z.name;$('#zoneBanner').classList.remove('hidden');setTimeout(()=>$('#zoneBanner').classList.add('hidden'),2300)}
function unlockSticker(name){if(!state.profile.stickers.includes(name)){state.profile.stickers.push(name);saveProfile();toastQuest('New Sticker! 🎟️',name)}}
function unlockStickerForQuest(id){const map={hello:'Robot Friend',rescue:'Rainbow Finder',creatures:'Creature Helper',build:'Master Builder',race:'Racing Rookie',fossil:'Fossil Finder',magic:'Magic Maker',brain:'Dino Detective',buddy:'Best Buddies',photos:'Photo Safari',discover:'World Explorer',wish:'Wish Maker'};if(map[id])unlockSticker(map[id])}
function rescueCreature(c){openModal(`<h2>💖 Creature Rescue!</h2><div class="creature-pop">${c.icon}</div><p style="text-align:center;font-size:22px;font-weight:1000">You found <b>${c.name}</b>!</p><p style="text-align:center;font-weight:800;color:#6d7395">Give ${c.name} a friendly high-five to invite them to your Dream Collection.</p><button id="rescueYes" class="big-btn primary">🖐️ HIGH-FIVE ${c.name.toUpperCase()}</button>`);$('#rescueYes').onclick=()=>{if(!state.profile.creatures.includes(c.id)){state.profile.creatures.push(c.id);state.creatures=state.creatures.filter(x=>x.id!==c.id);state.profile.gems=(state.profile.gems||0)+2;state.profile.buddyLevel=Math.min(20,(state.profile.buddyLevel||1)+1);questProgress('creatures',1);addXP(7,'Creature rescue');Audio.success();confetti();unlockSticker('Creature Helper');updateHUD();saveProfile()}closeModal();toastQuest('New Friend!',`${c.icon} ${c.name} joined your collection! +2 💎`);speak(`${c.name} is your new DreamBound friend!`)}}
function openCollection(){const creatures=CREATURES.map(c=>{const got=state.profile.creatures.includes(c.id);return `<div class="collect-card ${got?'':'locked'}"><div class="big-icon">${got?c.icon:'❔'}</div><strong>${got?c.name:'Mystery Friend'}</strong><small>${got?c.zone:'Keep exploring!'}</small></div>`}).join('');const stickers=STICKERS.map(([icon,name])=>{const got=state.profile.stickers.includes(name);return `<div class="collect-card ${got?'':'locked'}"><div class="big-icon">${got?icon:'🔒'}</div><strong>${got?name:'Locked Sticker'}</strong><small>${got?'Collected!':'Complete adventures'}</small></div>`}).join('');const photos=ZONES.map(z=>{const got=state.profile.photos.includes(z.name);return `<div class="collect-card photo-card ${got?'':'locked'}"><div class="photo-snapshot">${got?z.emoji:'📷'}</div><strong>${got?z.name:'Mystery Land'}</strong><small>${got?'Safari photo':'Take a photo here'}</small></div>`}).join('');const treasures=`<div class="collection-grid"><div class="collect-card"><div class="big-icon">🦴</div><strong>Fossils</strong><small>${state.profile.fossils||0} complete</small></div><div class="collect-card"><div class="big-icon">⭐</div><strong>Dream Stars</strong><small>${state.profile.stars||0} collected</small></div><div class="collect-card"><div class="big-icon">💎</div><strong>Gems</strong><small>${state.profile.gems||0} ready to spend</small></div><div class="collect-card"><div class="big-icon">🏗️</div><strong>Creations</strong><small>${(state.profile.buildings||[]).length} built</small></div><div class="collect-card"><div class="big-icon">🌠</div><strong>Falling Stars</strong><small>${state.profile.worldEvents||0} chased</small></div><div class="collect-card"><div class="big-icon">💖</div><strong>Buddy Play</strong><small>${state.profile.buddyPlays||0} play-times</small></div></div>`;openModal(`<h2>🎒 Dream Collection</h2><div class="game-pill-row"><button class="game-pill active" data-tab="creatures">🐾 Creatures</button><button class="game-pill" data-tab="stickers">🎟️ Stickers</button><button class="game-pill" data-tab="photos">📸 Photos</button><button class="game-pill" data-tab="treasures">🦴 Treasures</button></div><div id="collectionBody"><div class="collection-grid">${creatures}</div></div>`);$$('.game-pill').forEach(b=>b.onclick=()=>{$$('.game-pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(b.dataset.tab==='creatures')setMarkup($('#collectionBody'),`<div class="collection-grid">${creatures}</div>`);if(b.dataset.tab==='stickers')setMarkup($('#collectionBody'),`<div class="collection-grid">${stickers}</div>`);if(b.dataset.tab==='photos')setMarkup($('#collectionBody'),`<div class="collection-grid">${photos}</div>`);if(b.dataset.tab==='treasures')setMarkup($('#collectionBody'),treasures)})}
function openAdventureBoard(){const qs=state.profile.quests,done=qs.filter(q=>q.done).length,pct=Math.round(done/qs.length*100),next=qs.find(q=>!q.done);openModal(`<h2>🧭 Adventure Board</h2><div class="adventure-hero"><h3>${next?'Next Adventure: '+next.title:'DreamBound Hero!'}</h3><p>${next?next.text:'You completed every main adventure in this build. Keep collecting, building, racing and playing!'}</p><div class="adventure-progress"><i style="width:${pct}%"></i></div><small>${done}/${qs.length} main adventures complete • ${pct}%</small></div><div class="mission-list">${qs.map(q=>`<div class="mission ${q.done?'done':''}"><div class="icon">${q.icon||'⭐'}</div><div><strong>${q.done?'✅ ':''}${q.title}</strong><small>${q.text}${q.target&&!q.done?` • ${q.progress||0}/${q.target}`:''}</small></div><div class="reward-pill">⭐${q.reward}</div></div>`).join('')}</div>`) }
function openPortal(){openModal(`<h2>🌈 Rainbow Portal</h2><p style="text-align:center;font-weight:900">Choose a land and WHOOSH there instantly!</p><div class="collection-grid">${ZONES.map((z,i)=>`<button class="collect-card portal-choice" data-i="${i}" style="cursor:pointer"><div class="big-icon">${z.emoji}</div><strong>${z.name}</strong><small>Teleport</small></button>`).join('')}</div>`);$$('.portal-choice').forEach(b=>b.onclick=()=>{const z=ZONES[+b.dataset.i];state.player.x=z.x+z.w/2;state.player.y=z.y+z.h/2;state.buddy.x=state.player.x-50;state.buddy.y=state.player.y+35;closeModal();showZoneBanner(z);Audio.success();spawnBurst(state.player.x,state.player.y,'#ffffff')})}
function openHomeBase(){const upgrades=state.profile.homeUpgrades||[],items=[['bed','🛏️','Dream Bed',4],['plant','🪴','Jungle Plant',3],['arcade','🕹️','Mini Arcade',8],['rocket','🚀','Rocket Model',6]],furn={bed:['🛏️','f1'],plant:['🪴','f2'],arcade:['🕹️','f3'],rocket:['🚀','f4']};openModal(`<h2>🏡 My Home Base</h2><div class="home-room"><div class="trophy-shelf">${(state.profile.stickers||[]).slice(0,4).map(()=> '🏆').join(' ')||'✨ Trophy Shelf ✨'}</div>${upgrades.map(id=>`<span class="furniture ${furn[id][1]}">${furn[id][0]}</span>`).join('')}<span class="furniture" style="left:43%;bottom:78px;font-size:48px">${state.profile.buddy}</span></div><p style="text-align:center;font-weight:900">Decorate with gems you discover while exploring.</p><div class="collection-grid">${items.map(([id,icon,label,cost])=>`<button class="collect-card home-buy ${upgrades.includes(id)?'locked':''}" data-id="${id}" ${upgrades.includes(id)?'disabled':''}><div class="big-icon">${icon}</div><strong>${label}</strong><small>${upgrades.includes(id)?'Owned':`💎 ${cost}`}</small></button>`).join('')}</div>`);$$('.home-buy:not([disabled])').forEach(b=>b.onclick=()=>{const it=items.find(x=>x[0]===b.dataset.id);if((state.profile.gems||0)<it[3]){toastQuest('Need More Gems!',`${it[2]} costs ${it[3]} 💎.`);Audio.tone(180,.12,'sawtooth');return}state.profile.gems-=it[3];state.profile.homeUpgrades.push(it[0]);addXP(5,'Home upgrade');saveProfile();updateHUD();Audio.success();openHomeBase()})}
function openMagicMenu(){if(!(state.profile.spells||[]).length){toastQuest('Magic is still sleeping...','Visit Mira 🧚 in Magic Grove to learn your first spell.');return}openModal(`<h2>🪄 Magic Wand</h2><p style="text-align:center;font-weight:900">Choose a spell. Magic is playful—nothing can hurt your world.</p><div class="spell-grid"><button class="spell-btn" data-spell="sparkle">✨<strong>Sparkle Burst</strong></button><button class="spell-btn ${state.profile.spells.includes('grow')?'':'locked'}" data-spell="grow">🌱<strong>Grow Garden</strong></button><button class="spell-btn ${state.profile.spells.includes('rainbow')?'':'locked'}" data-spell="rainbow">🌈<strong>Rainbow Pop</strong></button></div>`);$$('.spell-btn:not(.locked)').forEach(b=>b.onclick=()=>{closeModal();castSpell(b.dataset.spell)})}
function castSpell(spell){const icons={sparkle:'✨',grow:'🌱',rainbow:'🌈'};for(let i=0;i<40;i++)spawnBurst(state.player.x+rand(-35,35),state.player.y+rand(-35,35),['#fff36b','#ff77cc','#6ee7ff'][i%3]);showCombo(`${icons[spell]||'✨'} MAGIC!`);Audio.success();addXP(2,'Magic');if(spell==='grow'){const o={id:'magic'+Date.now(),item:'flower',x:Math.round(state.player.x+60),y:Math.round(state.player.y+40)};state.profile.buildings.push(o);state.objects.push({...o,type:'building'});saveProfile()}if(spell==='rainbow')setWeather('sparkles')}
function openMagicLesson(){const symbols=['✨','🌟','💜','🔮'];let len=difficulty()===0?3:difficulty()===1?4:5,seq=Array.from({length:len},()=>symbols[Math.floor(Math.random()*symbols.length)]),pos=0;openModal(`<h2>🪄 Mira's Magic Lesson</h2><p style="text-align:center;font-weight:900">Watch the sparkle pattern, then copy it!</p><div id="spellSeq" class="spell-sequence">${seq.join(' ')}</div><div id="spellChoices" class="spell-choice-row" style="display:none">${symbols.map(x=>`<button class="spell-choice">${x}</button>`).join('')}</div>`);setTimeout(()=>{if(!$('#spellSeq'))return;$('#spellSeq').textContent='❔ '.repeat(len);$('#spellChoices').style.display='flex';$$('.spell-choice').forEach(b=>b.onclick=()=>{if(b.textContent===seq[pos]){pos++;Audio.tone(520+pos*100,.08,'triangle');$('#spellSeq').textContent='✅ '.repeat(pos)+'❔ '.repeat(len-pos);if(pos===len){setTimeout(()=>{if(!state.profile.spells.includes('sparkle'))state.profile.spells.push('sparkle');if((state.profile.explorerLevel||1)>=3&&!state.profile.spells.includes('grow'))state.profile.spells.push('grow');if((state.profile.explorerLevel||1)>=5&&!state.profile.spells.includes('rainbow'))state.profile.spells.push('rainbow');completeQuest('magic');addXP(10,'Magic lesson');updateHUD();saveProfile();confetti();openModal(`<h2>✨ YOU LEARNED MAGIC!</h2><div class="creature-pop">🪄✨</div><p style="text-align:center;font-weight:1000">Your Magic Wand is now awake. Use the 🪄 button while exploring!</p><button id="magicDone" class="big-btn primary">CAST SOME MAGIC</button>`);$('#magicDone').onclick=()=>{closeModal();castSpell('sparkle')}},450)}}else{Audio.tone(170,.12,'sawtooth');pos=0;$('#spellSeq').textContent='❔ '.repeat(len);speak('Good try! Start the pattern again.')}})},1800)}
function openFossilGame(){let fossilTiles=new Set();while(fossilTiles.size<5)fossilTiles.add(Math.floor(Math.random()*20));let found=0,dug=0,limit=difficulty()===0?20:difficulty()===1?15:12;openModal(`<h2>🦴 Dino Valley Fossil Dig</h2><p class="fossil-progress">Find 5 bones • Digs left: <b id="digsLeft">${limit}</b></p><div class="dig-grid">${Array.from({length:20},(_,i)=>`<button class="dig-tile" data-i="${i}">🪨</button>`).join('')}</div>`);$$('.dig-tile').forEach(b=>b.onclick=()=>{if(b.classList.contains('dug')||dug>=limit)return;dug++;const i=+b.dataset.i;b.classList.add('dug');if(fossilTiles.has(i)){found++;b.textContent='🦴';Audio.collect()}else{b.textContent=['🪱','🪨','🌱'][Math.floor(Math.random()*3)];Audio.tone(260,.05)}$('#digsLeft').textContent=limit-dug;if(found===5){state.profile.fossils++;completeQuest('fossil');addXP(12,'Fossil');unlockSticker('Fossil Finder');confetti();setTimeout(()=>{openModal(`<h2>🦕 FOSSIL COMPLETE!</h2><div class="creature-pop">🦴🦖</div><p style="text-align:center;font-weight:1000">You rebuilt a dinosaur fossil and earned 4 💎 gems!</p><button id="fossilDone" class="big-btn primary">ROAR!</button>`);state.profile.gems+=4;updateHUD();saveProfile();$('#fossilDone').onclick=closeModal},400)}else if(dug>=limit){setTimeout(()=>{openModal(`<h2>⛏️ Great Digging!</h2><p style="text-align:center;font-weight:900">You found ${found}/5 bones. Try another dig—the bones move every time!</p><button id="digAgain" class="big-btn primary">TRY AGAIN</button>`);$('#digAgain').onclick=openFossilGame},350)}})}
function openRaceGame(){openModal(`<h2>🏎️ Ridge Raceway</h2><div id="raceStage" class="race-stage"><div class="race-road"></div><div class="race-hud"><span>⭐ <b id="raceScore">0</b></span><span>TIME <b id="raceTime">20</b></span></div><div id="raceKart" class="race-kart">🏎️</div></div><p class="race-help">Move with ← → or A D. Dodge the rocks and grab stars!</p><div style="display:flex;justify-content:center;gap:10px"><button id="raceLeft" class="icon-btn">◀</button><button id="raceStart" class="big-btn primary" style="margin:0;max-width:260px">🏁 START RACE</button><button id="raceRight" class="icon-btn">▶</button></div>`);let running=false,lane=1,score=0,time=20,obs=[],lastSpawn=0,raf=0;const stage=$('#raceStage'),kart=$('#raceKart');function setLane(n){lane=clamp(n,0,2);kart.style.left=[29,50,71][lane]+'%';Audio.click()}$('#raceLeft').onclick=()=>setLane(lane-1);$('#raceRight').onclick=()=>setLane(lane+1);const key=e=>{if(!running)return;if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')setLane(lane-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')setLane(lane+1)};addEventListener('keydown',key);state.raceStop=()=>{running=false;cancelAnimationFrame(raf);removeEventListener('keydown',key);obs.forEach(o=>o.el.remove())};function spawn(){const good=Math.random()<.27,o=document.createElement('div'),ln=Math.floor(Math.random()*3);o.className='race-obstacle';o.textContent=good?'⭐':['🪨','🛞','🌵'][Math.floor(Math.random()*3)];o.dataset.good=good?'1':'0';o.dataset.lane=ln;o.style.left=[29,50,71][ln]+'%';o.style.top='44%';stage.appendChild(o);obs.push({el:o,y:44,lane:ln,good})}function endRace(){running=false;cancelAnimationFrame(raf);removeEventListener('keydown',key);obs.forEach(o=>o.el.remove());state.raceStop=null;state.profile.gems+=Math.max(1,Math.floor(score/3));completeQuest('race');addXP(10+score,'Race');unlockSticker('Racing Rookie');updateHUD();saveProfile();confetti();openModal(`<h2>🏁 FINISH LINE!</h2><div class="creature-pop">🏆🏎️</div><p style="text-align:center;font-size:22px;font-weight:1000">Race score: ${score} ⭐<br>You earned ${Math.max(1,Math.floor(score/3))} 💎!</p><button id="raceDone" class="big-btn primary">BACK TO DREAMBOUND</button>`);$('#raceDone').onclick=closeModal}function frame(ts){if(!running)return;if(ts-lastSpawn>650){spawn();lastSpawn=ts}for(const o of obs){o.y+=.45;o.el.style.top=o.y+'%';if(o.y>82&&!o.hit&&o.y<96&&o.lane===lane){o.hit=true;if(o.good){score++;Audio.collect();showCombo('+1 ⭐')}else{score=Math.max(0,score-1);Audio.tone(150,.09,'sawtooth');haptic(60)}$('#raceScore').textContent=score;o.el.remove()}if(o.y>103)o.el.remove()}obs=obs.filter(o=>o.y<103&&!o.hit);raf=requestAnimationFrame(frame)}$('#raceStart').onclick=()=>{if(running)return;running=true;$('#raceStart').disabled=true;Audio.success();let tick=setInterval(()=>{if(!running){clearInterval(tick);return}time--;if($('#raceTime'))$('#raceTime').textContent=time;if(time<=0){clearInterval(tick);endRace()}},1000);raf=requestAnimationFrame(frame)}}
function openShellGame(){const shells=['🐚','⭐','🐠','💎'],len=difficulty()===0?3:difficulty()===1?4:5,seq=Array.from({length:len},()=>shells[Math.floor(Math.random()*shells.length)]);let pos=0;openModal(`<h2>🐬 Bubbles' Shell Sequence</h2><p style="text-align:center;font-weight:900">Remember the treasure code!</p><div id="shellSeq" class="spell-sequence">${seq.join(' ')}</div><div id="shellChoices" class="spell-choice-row" style="display:none">${shells.map(x=>`<button class="spell-choice">${x}</button>`).join('')}</div>`);setTimeout(()=>{if(!$('#shellSeq'))return;$('#shellSeq').textContent='🌊 '.repeat(len);$('#shellChoices').style.display='flex';$$('.spell-choice').forEach(b=>b.onclick=()=>{if(b.textContent===seq[pos]){pos++;Audio.tone(600+pos*90,.06);$('#shellSeq').textContent='✅ '.repeat(pos)+'🌊 '.repeat(len-pos);if(pos===len){state.profile.gems+=3;addXP(8,'Ocean code');unlockSticker('Ocean Explorer');updateHUD();saveProfile();confetti();setTimeout(()=>{openModal(`<h2>🐚 TREASURE FOUND!</h2><div class="creature-pop">🧰✨</div><p style="text-align:center;font-weight:1000">Bubbles found 3 💎 for you!</p><button id="shellDone" class="big-btn primary">SPLASH!</button>`);$('#shellDone').onclick=closeModal},350)}}else{Audio.tone(180,.12,'sawtooth');pos=0;$('#shellSeq').textContent='🌊 '.repeat(len)}})},1600)}


// v0.3.0 Living World systems
const QUEST_TARGETS={hello:[775,485],rescue:[1820,760],build:[1575,1460],brain:[1340,860],race:[2650,510],fossil:[350,1370],magic:[1510,530],wish:[720,850],creatures:[1760,330],photos:[440,760],discover:[440,760],buddy:null,stars:null};
function currentQuest(){const qs=state.profile?.quests||[];const open=qs.filter(q=>!q.done);if(!open.length)return null;state.questCursor=((state.questCursor%open.length)+open.length)%open.length;return open[state.questCursor]}
function updateQuestTracker(){if(!state.profile||!$('#questTracker'))return;const q=currentQuest();if(!q){$('#trackerIcon').textContent='🏆';$('#trackerTitle').textContent='DreamBound Hero!';$('#trackerText').textContent='All main adventures complete!';return}$('#trackerIcon').textContent=q.icon||'⭐';$('#trackerTitle').textContent=q.title;$('#trackerText').textContent=q.target?`${q.text} • ${q.progress||0}/${q.target}`:q.text}
function cycleQuestTracker(){const open=(state.profile?.quests||[]).filter(q=>!q.done);if(!open.length)return;state.questCursor=(state.questCursor+1)%open.length;updateQuestTracker();Audio.click()}
function drawQuestCompass(){if(state.talking||!$('#modalLayer').classList.contains('hidden'))return;const q=currentQuest();let target=state.worldEvent?[state.worldEvent.x,state.worldEvent.y]:null,label=state.worldEvent?'Falling Star!':q?.title;if(!target&&!q)return;if(!target)target=QUEST_TARGETS[q.id];if(q&&q.id==='stars'){const c=state.collectibles.find(c=>!c.taken&&c.type==='star');target=c?[c.x,c.y]:null}if(q&&q.id==='creatures'){const c=state.creatures[0];target=c?[c.x,c.y]:null}if(q&&q.id==='discover'){const unseen=ZONES.find(z=>!state.profile.discoveredZones.includes(z.name));target=unseen?[unseen.x+unseen.w/2,unseen.y+unseen.h/2]:null}if(!target)return;const sx=target[0]-state.cam.x,sy=target[1]-state.cam.y;if(sx>80&&sx<innerWidth-80&&sy>100&&sy<innerHeight-80)return;const cx=innerWidth/2,cy=innerHeight/2,ang=Math.atan2(sy-cy,sx-cx),r=Math.min(innerWidth,innerHeight)*.35,x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r;ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle='#fff';ctx.strokeStyle='#5c49d7';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-15,-14);ctx.lineTo(-9,0);ctx.lineTo(-15,14);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.save();ctx.font='900 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#44388b';ctx.lineWidth=5;ctx.strokeText(label,x,y+34);ctx.fillText(label,x,y+34);ctx.restore()}
function drawAmbient(){const now=performance.now()/1000;for(const a of state.ambient){const z=zoneAt(a.x,a.y);if(a.kind==='grass'){ctx.strokeStyle='#318e4b88';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x-3,a.y+6);ctx.quadraticCurveTo(a.x+Math.sin(now+a.phase)*5,a.y-5,a.x+2,a.y-12);ctx.stroke()}else if(a.kind==='flower'){drawEmoji(a.x,a.y,'🌼',18)}else if(a.kind==='butterfly'){const x=a.x+Math.sin(now*a.speed+a.phase)*24,y=a.y+Math.cos(now*a.speed*.7+a.phase)*12;drawEmoji(x,y,'🦋',22)}else{const night=Math.max(0,Math.cos((state.dayClock-.5)*Math.PI*2));if(night>.4){ctx.globalAlpha=.25+.55*Math.abs(Math.sin(now*2+a.phase));ctx.fillStyle=z.name==='Ocean Cove'?'#bdf7ff':'#fff58a';ctx.beginPath();ctx.arc(a.x,a.y,3,0,7);ctx.fill();ctx.globalAlpha=1}}}if(zoneAt(state.player.x,state.player.y).name==='Ocean Cove'){for(let i=0;i<12;i++){const x=2300+(i*177)%800,y=1100+(i*113)%900+Math.sin(now+i)*14;ctx.globalAlpha=.25;ctx.strokeStyle='#e9fcff';ctx.beginPath();ctx.arc(x,y,7+(i%3)*3,0,7);ctx.stroke();ctx.globalAlpha=1}}}
function updateLivingWorld(dt){if(state.buddyEmoteTimer>0)state.buddyEmoteTimer-=dt;state.worldEventTimer-=dt;if(state.worldEventTimer<=0&&!state.worldEvent){spawnWorldEvent();state.worldEventTimer=rand(55,85)}if(state.worldEvent){state.worldEvent.life-=dt;if(state.worldEvent.life<=0){const c=state.collectibles.find(x=>x.id===state.worldEvent.id);if(c)c.taken=true;state.worldEvent=null;$('#worldEvent').classList.add('hidden');toastQuest('The star zipped away!','Another falling star will visit later.')}}}
function spawnWorldEvent(){let x=clamp(state.player.x+rand(-500,500),150,WORLD.w-150),y=clamp(state.player.y+rand(-420,420),150,WORLD.h-150),id='super-'+Date.now();state.collectibles.push({id,type:'super',x,y,taken:false});state.worldEvent={id,x,y,life:35};$('#worldEventTitle').textContent='A Falling Star landed nearby!';$('#worldEvent').classList.remove('hidden');Audio.success();speak('A falling star landed nearby! Follow the glowing compass and find it!');showCombo('WORLD EVENT! 🌠')}
function openBuddyCenter(){const b=state.profile.buddy,plays=state.profile.buddyPlays||0;openModal(`<h2>💖 ${escapeHTML(state.profile.name)} & ${b}</h2><div class="buddy-stage"><div class="buddy-big">${b}</div><div class="buddy-hearts">${'💖'.repeat(Math.min(8,state.profile.buddyLevel||1))}</div><strong>Friendship Level ${state.profile.buddyLevel||1}</strong><p>Your DreamBuddy explores every land with you.</p></div><div class="buddy-actions"><button class="menu-tile buddy-action" data-act="pet"><strong>🫶 Pet</strong><small>Give your buddy some love.</small></button><button class="menu-tile buddy-action" data-act="play"><strong>🎾 Play</strong><small>Play a silly game together.</small></button><button class="menu-tile buddy-action" data-act="trick"><strong>✨ Trick</strong><small>See a friendship trick.</small></button></div><p style="text-align:center;font-weight:900">Buddy play-times: ${plays}</p>`);$$('.buddy-action').forEach(btn=>btn.onclick=()=>{state.profile.buddyPlays=(state.profile.buddyPlays||0)+1;if(state.profile.buddyPlays%3===0)state.profile.buddyLevel=Math.min(20,(state.profile.buddyLevel||1)+1);state.buddyEmote={pet:'💖',play:'🎾',trick:'✨'}[btn.dataset.act];state.buddyEmoteTimer=4;questProgress('buddy',1);addXP(3,'Buddy time');Audio.success();saveProfile();updateHUD();closeModal();showCombo(`${b} ${state.buddyEmote}`);speak('Your DreamBuddy is happy!')})}
function takePhoto(){const zone=zoneAt(state.player.x,state.player.y).name;if(!state.profile.photos.includes(zone)){state.profile.photos.push(zone);questProgress('photos',1);state.profile.gems+=1;addXP(4,'Photo Safari');saveProfile();updateHUD();confetti();toastQuest('Photo Safari! 📸',`${zone} added to your photo book! +1 💎`)}else toastQuest('Great Photo! 📸',`You already have a ${zone} photo. Try another land!`);const flash=document.createElement('div');flash.className='camera-flash';$('#gameScreen').appendChild(flash);setTimeout(()=>flash.remove(),420);Audio.tone(980,.06,'square');state.buddyEmote='📸';state.buddyEmoteTimer=2}
function toggleRide(){if((state.profile.explorerLevel||1)<2&&!state.profile.quests.find(q=>q.id==='race')?.done){toastQuest('Ride Locked 🛴','Reach Explorer Level 2 or finish the Ridge Raceway to unlock your explorer scooter!');return}state.vehicle=!state.vehicle;$('#rideBtn').classList.toggle('active',state.vehicle);$('#rideBtn').textContent=state.vehicle?'🛴':'🛴';showCombo(state.vehicle?'RIDE ON! 🛴':'HOP OFF! 👟');Audio.success()}
function openGarage(){openModal(`<h2>🛴 Ridge Garage</h2><div class="garage-showcase">🛴✨</div><p style="text-align:center;font-weight:900">Your Explorer Scooter is built for safe DreamBound zooming.</p><button id="garageRide" class="big-btn primary">${state.vehicle?'👟 HOP OFF':'🛴 RIDE NOW'}</button><p class="safe-note">The ride only changes movement speed—no crashes or damage.</p>`);$('#garageRide').onclick=()=>{closeModal();toggleRide()}}
function openWishingWell(){state.profile.wishes=(state.profile.wishes||0)+1;const rewards=[['⭐',2,'Dream Stars'],['💎',3,'Gems'],['💖',1,'Buddy Friendship']],pick=rewards[Math.floor(Math.random()*rewards.length)];if(pick[0]==='⭐')state.profile.stars+=pick[1];else if(pick[0]==='💎')state.profile.gems+=pick[1];else state.profile.buddyLevel=Math.min(20,(state.profile.buddyLevel||1)+1);completeQuest('wish');addXP(5,'DreamWish');saveProfile();updateHUD();confetti();openModal(`<h2>🌠 Your DreamWish Sparkled!</h2><div class="creature-pop">⛲✨${pick[0]}</div><p style="text-align:center;font-size:21px;font-weight:1000">The well gave you ${pick[1]} ${pick[2]}!</p><button id="wishDone" class="big-btn primary">MAKE THE WORLD WONDERFUL</button>`);$('#wishDone').onclick=closeModal}
function openSanctuary(){const rescued=CREATURES.filter(c=>state.profile.creatures.includes(c.id));openModal(`<h2>🐾 DreamCreature Sanctuary</h2><div class="sanctuary-scene">${rescued.length?rescued.map(c=>`<span title="${c.name}">${c.icon}</span>`).join(''):'<strong>Rescue creatures around the world and they will play here!</strong>'}</div><p style="text-align:center;font-weight:900">${rescued.length}/${CREATURES.length} creatures rescued</p>${rescued.length?`<button id="sanctuaryPlay" class="big-btn primary">🎉 PLAY WITH EVERYONE</button>`:''}`);if($('#sanctuaryPlay'))$('#sanctuaryPlay').onclick=()=>{state.profile.buddyLevel=Math.min(20,(state.profile.buddyLevel||1)+1);addXP(5,'Sanctuary play');saveProfile();updateHUD();confetti();closeModal();showCombo('CREATURE PARTY! 🎉')}}
function openLighthouseGame(){const colors=[['🔴','red'],['🟡','yellow'],['🔵','blue'],['🟢','green']],len=difficulty()===0?3:difficulty()===1?4:5,seq=Array.from({length:len},()=>colors[Math.floor(Math.random()*colors.length)]),pos=0;openModal(`<h2>🌈 Rainbow Lighthouse</h2><p style="text-align:center;font-weight:900">Watch the lighthouse colors, then guide the boats home!</p><div id="lightSeq" class="spell-sequence">${seq.map(x=>x[0]).join(' ')}</div><div id="lightChoices" class="spell-choice-row" style="display:none">${colors.map(x=>`<button class="spell-choice" data-c="${x[1]}">${x[0]}</button>`).join('')}</div>`);setTimeout(()=>{if(!$('#lightSeq'))return;$('#lightSeq').textContent='⚪ '.repeat(len);$('#lightChoices').style.display='flex';$$('#lightChoices .spell-choice').forEach(b=>b.onclick=()=>{if(b.dataset.c===seq[pos][1]){pos++;Audio.tone(500+pos*120,.08,'triangle');$('#lightSeq').textContent='✅ '.repeat(pos)+'⚪ '.repeat(len-pos);if(pos===len){state.profile.gems+=4;addXP(10,'Lighthouse');unlockSticker('Rainbow Finder');saveProfile();updateHUD();confetti();setTimeout(()=>{openModal(`<h2>🚢 Boats Guided Home!</h2><div class="creature-pop">🗼🌈⛵</div><p style="text-align:center;font-weight:1000">Perfect color code! You earned 4 💎.</p><button id="lightDone" class="big-btn primary">SHINE ON!</button>`);$('#lightDone').onclick=closeModal},300)}}else{pos=0;Audio.tone(170,.12,'sawtooth');$('#lightSeq').textContent='⚪ '.repeat(len)}})},1700)}


// ===== DreamBound v0.4.1 STORYBOOK WORLD ENGINE =====
const LANDMARKS_V4=[
  {id:'homebase',name:'Dream Home',zone:'Home Valley',x:355,y:430,icon:'🏡'},
  {id:'moontower',name:'Moonflower Tower',zone:'Magic Grove',x:1710,y:390,icon:'🪄'},
  {id:'speedway',name:'Rainbow Speedway',zone:'Racing Ridge',x:2680,y:420,icon:'🏁'},
  {id:'museum',name:'Fossil Hall',zone:'Dino Valley',x:560,y:1630,icon:'🦴'},
  {id:'workshop',name:'Maker Workshop',zone:'Builder Bay',x:1545,y:1670,icon:'🧱'},
  {id:'lighttower',name:'Rainbow Lighthouse',zone:'Ocean Cove',x:2910,y:1340,icon:'🗼'}
];
const V4_SCENERY=(()=>{const out=[];let seed=8173;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};for(const z of ZONES){const count=z.name==='Ocean Cove'?28:42;for(let i=0;i<count;i++){const x=z.x+55+rnd()*(z.w-110),y=z.y+80+rnd()*(z.h-140);let kind='tree';if(z.name==='Magic Grove')kind=i%4===0?'crystal':i%3===0?'mushroom':'tree';else if(z.name==='Racing Ridge')kind=i%3===0?'rock':'shrub';else if(z.name==='Dino Valley')kind=i%4===0?'fern':i%5===0?'rock':'tree';else if(z.name==='Builder Bay')kind=i%4===0?'crate':i%3===0?'shrub':'tree';else if(z.name==='Ocean Cove')kind=i%3===0?'coral':i%4===0?'shell':'wave';else kind=i%4===0?'flowerPatch':'tree';out.push({zone:z.name,x,y,kind,s:.7+rnd()*.65,p:rnd()*6.28})}}return out})();

function defaultQuests(){ return [
  {id:'hello',title:'Meet Pip',text:'Find Pip the robot near the rainbow path.',done:false,reward:2,xp:8,icon:'🤖'},
  {id:'stars',title:'Star Collector',text:'Collect 5 Dream Stars.',done:false,reward:3,xp:10,progress:0,target:5,icon:'⭐'},
  {id:'rescue',title:'Tiny Rescue',text:'Find Button the fox in Magic Grove.',done:false,reward:4,xp:12,icon:'🦊'},
  {id:'creatures',title:'Creature Helper',text:'Rescue 3 tiny DreamCreatures.',done:false,reward:5,xp:16,progress:0,target:3,icon:'🐾'},
  {id:'build',title:'Build Something!',text:'Place your first creation in Builder Bay.',done:false,reward:3,xp:10,icon:'🧱'},
  {id:'brain',title:'Brain Power',text:'Complete one learning challenge.',done:false,reward:4,xp:12,icon:'🧠'},
  {id:'race',title:'Racing Rookie',text:'Finish a race at Racing Ridge.',done:false,reward:5,xp:18,icon:'🏎️'},
  {id:'fossil',title:'Fossil Finder',text:'Uncover a complete fossil in Dino Valley.',done:false,reward:5,xp:18,icon:'🦴'},
  {id:'magic',title:'Magic Maker',text:'Learn your first spell in Magic Grove.',done:false,reward:6,xp:20,icon:'🪄'},
  {id:'buddy',title:'Best Buddies',text:'Play with your DreamBuddy 3 times.',done:false,reward:4,xp:14,progress:0,target:3,icon:'💖'},
  {id:'photos',title:'Photo Safari',text:'Take photos in 3 different lands.',done:false,reward:5,xp:16,progress:0,target:3,icon:'📸'},
  {id:'discover',title:'World Explorer',text:'Discover all 6 DreamBound lands.',done:false,reward:8,xp:24,progress:1,target:6,icon:'🗺️'},
  {id:'landmarks',title:'Landmark Legend',text:'Discover the special landmark in every land.',done:false,reward:8,xp:24,progress:0,target:6,icon:'🏛️'},
  {id:'wish',title:'Make a Wish',text:'Visit the Wishing Well in Home Valley.',done:false,reward:3,xp:10,icon:'🌠'}
]; }

function unlockStickerForQuest(id){const map={hello:'Robot Friend',rescue:'Rainbow Finder',creatures:'Creature Helper',build:'Master Builder',race:'Racing Rookie',fossil:'Fossil Finder',magic:'Magic Maker',brain:'Dino Detective',buddy:'Best Buddies',photos:'Photo Safari',discover:'World Explorer',landmarks:'Landmark Legend',wish:'Wish Maker'};if(map[id])unlockSticker(map[id])}

function v4EnsureProfile(){
  if(!state.profile)return;
  state.profile.landmarks=state.profile.landmarks||[];
  state.profile.homeStyle=state.profile.homeStyle||'sky';
  state.profile.homeThemes=state.profile.homeThemes||['sky'];
  state.profile.visualBadges=state.profile.visualBadges||[];
}

function v4Color(hex,amount){let c=hex.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');let n=parseInt(c,16),r=(n>>16)+amount,g=((n>>8)&255)+amount,b=(n&255)+amount;return '#'+[r,g,b].map(v=>clamp(v,0,255).toString(16).padStart(2,'0')).join('')}
function v4Ellipse(x,y,rx,ry,fill,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function v4Shadow(x,y,rx,ry,a=.16){v4Ellipse(x,y,rx,ry,'#25344a',a)}
function v4Line(points,color,width=4,dash=[]){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=width;ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.restore()}
function v4Panel(x,y,w,h,fill,stroke='#fff',radius=18){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(x,y,w,h,radius);ctx.fill();ctx.stroke()}
function v4Tree(x,y,s=1,magic=false){v4Shadow(x,y+29*s,28*s,10*s,.13);ctx.fillStyle=magic?'#6e4d8f':'#7e553d';ctx.fillRect(x-7*s,y-4*s,14*s,38*s);const col=magic?['#6fd7c0','#7d7bea','#b272df']:['#41a95f','#55bd69','#79d57e'];[[0,-28,30],[ -20,-11,22],[20,-10,23],[0,-4,27]].forEach((a,i)=>{v4Ellipse(x+a[0]*s,y+a[1]*s,a[2]*s,a[2]*.82*s,col[i%col.length])});if(magic){ctx.fillStyle='#fff7a8';for(let i=0;i<4;i++)v4Ellipse(x+Math.cos(i*1.7)*24*s,y-17*s+Math.sin(i*2)*19*s,2.5*s,2.5*s,'#fff7a8',.9)}}
function v4Rock(x,y,s=1){v4Shadow(x,y+10*s,22*s,8*s,.12);ctx.fillStyle='#8d8c9e';ctx.strokeStyle='#fff5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-22*s,y+12*s);ctx.lineTo(x-15*s,y-10*s);ctx.lineTo(x+1*s,y-18*s);ctx.lineTo(x+20*s,y-3*s);ctx.lineTo(x+18*s,y+13*s);ctx.closePath();ctx.fill();ctx.stroke()}
function v4Shrub(x,y,s=1){v4Shadow(x,y+10*s,19*s,7*s,.1);['#54b76a','#6acb79','#43a55b'].forEach((c,i)=>v4Ellipse(x+(i-1)*12*s,y-(i%2)*7*s,16*s,13*s,c))}
function v4Mushroom(x,y,s=1){ctx.fillStyle='#f7e6cf';ctx.fillRect(x-4*s,y,8*s,16*s);v4Ellipse(x,y,20*s,12*s,'#e967ac');for(let i=-1;i<=1;i++)v4Ellipse(x+i*8*s,y-2*s,2*s,2*s,'#fff')}
function v4Crystal(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.fillStyle='#8df4ff';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-28*s);ctx.lineTo(13*s,-2*s);ctx.lineTo(7*s,19*s);ctx.lineTo(-8*s,19*s);ctx.lineTo(-14*s,-1*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
function v4Fern(x,y,s=1){ctx.strokeStyle='#3e9f58';ctx.lineWidth=3*s;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x,y+12*s);ctx.quadraticCurveTo(x+i*9*s,y-1*s,x+i*13*s,y-23*s);ctx.stroke()}}
function v4FlowerPatch(x,y,s=1){for(let i=0;i<5;i++){const a=i*1.256;v4Ellipse(x+Math.cos(a)*10*s,y+Math.sin(a)*7*s,4*s,4*s,['#ff7db8','#ffd85f','#fff'][i%3]);}v4Ellipse(x,y,4*s,4*s,'#ffae2f')}
function v4Wave(x,y,s=1){ctx.save();ctx.strokeStyle='#dffaffaa';ctx.lineWidth=3*s;ctx.beginPath();ctx.arc(x,y,18*s,0.2,2.8);ctx.stroke();ctx.restore()}
function v4Coral(x,y,s=1){ctx.strokeStyle='#ff7f9f';ctx.lineCap='round';ctx.lineWidth=5*s;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x,y+12*s);ctx.quadraticCurveTo(x+i*7*s,y-3*s,x+i*11*s,y-19*s);ctx.stroke()}}
function v4Crate(x,y,s=1){v4Shadow(x,y+13*s,20*s,7*s,.12);ctx.fillStyle='#c38a4b';ctx.strokeStyle='#7a5431';ctx.lineWidth=3;ctx.fillRect(x-18*s,y-15*s,36*s,30*s);ctx.strokeRect(x-18*s,y-15*s,36*s,30*s);v4Line([[x-16*s,y-13*s],[x+16*s,y+13*s]],'#8c6137',3);v4Line([[x+16*s,y-13*s],[x-16*s,y+13*s]],'#8c6137',3)}

function v4DrawZoneGround(z){const g=ctx.createLinearGradient(z.x,z.y,z.x+z.w,z.y+z.h);const ocean=z.name==='Ocean Cove';if(ocean){g.addColorStop(0,'#74d8ee');g.addColorStop(.55,'#49bfe0');g.addColorStop(1,'#2ba8d6')}else{g.addColorStop(0,v4Color(z.color,22));g.addColorStop(.6,z.color);g.addColorStop(1,v4Color(z.color,-15))}ctx.fillStyle=g;ctx.fillRect(z.x,z.y,z.w,z.h);ctx.save();ctx.globalAlpha=ocean?.11:.08;ctx.fillStyle='#fff';const step=ocean?85:70;for(let yy=z.y+35;yy<z.y+z.h;yy+=step){for(let xx=z.x+35;xx<z.x+z.w;xx+=step){const jitter=((xx+yy)%97)-48;ctx.beginPath();ctx.arc(xx+jitter*.15,yy,2+(xx%3),0,7);ctx.fill()}}ctx.restore()}
function v4DrawPaths(){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle='#b28d58';ctx.lineWidth=106;ctx.beginPath();ctx.moveTo(330,500);ctx.bezierCurveTo(650,460,875,560,1130,690);ctx.bezierCurveTo(1370,815,1550,930,1870,860);ctx.stroke();
  ctx.strokeStyle='#f7dda0';ctx.lineWidth=90;ctx.stroke();ctx.strokeStyle='#fff4c2';ctx.lineWidth=5;ctx.setLineDash([18,24]);ctx.stroke();ctx.setLineDash([]);
  // dino stepping-stone trail
  ctx.strokeStyle='#6d9d59';ctx.lineWidth=60;ctx.beginPath();ctx.moveTo(360,1270);ctx.quadraticCurveTo(600,1500,900,1810);ctx.stroke();ctx.strokeStyle='#a9d77f';ctx.lineWidth=43;ctx.stroke();
  // Builder boardwalk
  ctx.strokeStyle='#9a6a43';ctx.lineWidth=82;ctx.beginPath();ctx.moveTo(1210,1320);ctx.lineTo(1900,1790);ctx.stroke();ctx.strokeStyle='#d8a865';ctx.lineWidth=66;ctx.stroke();
  for(let i=0;i<9;i++){const x=1250+i*75,y=1348+i*51;v4Line([[x-23,y+13],[x+22,y-13]],'#8d653e',4)}
  ctx.restore();
}
function v4DrawRaceway(){ctx.save();ctx.lineCap='round';ctx.lineWidth=118;ctx.strokeStyle='#45485b';ctx.beginPath();ctx.moveTo(2380,300);ctx.bezierCurveTo(3010,180,3090,650,2710,820);ctx.bezierCurveTo(2360,970,2240,520,2380,300);ctx.stroke();ctx.lineWidth=5;ctx.strokeStyle='#fff';ctx.setLineDash([24,20]);ctx.stroke();ctx.setLineDash([]);ctx.restore();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=2700+Math.cos(a)*300,y=535+Math.sin(a)*255;v4Panel(x-8,y-8,16,16,i%2?'#fff':'#ff5e70','#fff',3)}}
function v4DrawOcean(){const t=performance.now()/800;ctx.save();ctx.strokeStyle='#dffbff99';ctx.lineWidth=4;for(let y=1080;y<2150;y+=85){ctx.beginPath();for(let x=2240;x<3180;x+=30){const yy=y+Math.sin(x*.025+t+y*.001)*8;ctx.lineTo(x,yy)}ctx.stroke()}ctx.restore();ctx.fillStyle='#efd79a';ctx.beginPath();ctx.ellipse(2420,1540,135,72,-.25,0,7);ctx.fill();ctx.fillStyle='#7cd27d';ctx.beginPath();ctx.ellipse(2415,1512,105,38,-.25,0,7);ctx.fill()}
function v4House(x,y,s=1){v4Shadow(x,y+45*s,58*s,15*s,.18);ctx.fillStyle='#fff2cf';ctx.strokeStyle='#70475f';ctx.lineWidth=5*s;ctx.beginPath();ctx.roundRect(x-47*s,y-20*s,94*s,72*s,10*s);ctx.fill();ctx.stroke();ctx.fillStyle='#ff6d8d';ctx.beginPath();ctx.moveTo(x-59*s,y-18*s);ctx.lineTo(x,y-72*s);ctx.lineTo(x+59*s,y-18*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#75529f';ctx.beginPath();ctx.roundRect(x-12*s,y+12*s,24*s,40*s,8*s);ctx.fill();['#72d8ff','#72d8ff'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(x+(-34+i*54)*s,y-6*s,19*s,21*s)});v4FlowerPatch(x-52*s,y+43*s,.8*s);v4FlowerPatch(x+52*s,y+43*s,.8*s)}
function v4MagicTower(x,y,s=1){v4Shadow(x,y+52*s,52*s,14*s,.18);ctx.fillStyle='#7a64d9';ctx.strokeStyle='#503a9c';ctx.lineWidth=5*s;ctx.beginPath();ctx.roundRect(x-34*s,y-48*s,68*s,100*s,16*s);ctx.fill();ctx.stroke();ctx.fillStyle='#ff73bd';ctx.beginPath();ctx.moveTo(x-48*s,y-45*s);ctx.lineTo(x,y-105*s);ctx.lineTo(x+48*s,y-45*s);ctx.closePath();ctx.fill();ctx.stroke();v4Ellipse(x,y-5*s,12*s,16*s,'#9ef5ff');ctx.fillStyle='#fff5a8';ctx.font=`${28*s}px serif`;ctx.textAlign='center';ctx.fillText('★',x,y-65*s);ctx.textAlign='start'}
function v4Garage(x,y,s=1){v4Shadow(x,y+44*s,74*s,17*s,.18);ctx.fillStyle='#f8d973';ctx.strokeStyle='#6d5b49';ctx.lineWidth=5*s;ctx.beginPath();ctx.roundRect(x-72*s,y-28*s,144*s,75*s,12*s);ctx.fill();ctx.stroke();ctx.fillStyle='#45495d';ctx.fillRect(x-47*s,y+2*s,94*s,45*s);for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#fff':'#202332';ctx.fillRect(x-72*s+i*24*s,y-43*s,24*s,15*s)}ctx.fillStyle='#fff';ctx.font=`900 ${14*s}px sans-serif`;ctx.textAlign='center';ctx.fillText('RIDE LAB',x,y-5*s);ctx.textAlign='start'}
function v4Museum(x,y,s=1){v4Shadow(x,y+45*s,78*s,16*s,.18);ctx.fillStyle='#e7d19c';ctx.strokeStyle='#6e6652';ctx.lineWidth=5*s;ctx.fillRect(x-70*s,y-28*s,140*s,78*s);ctx.strokeRect(x-70*s,y-28*s,140*s,78*s);ctx.fillStyle='#8d7456';for(let i=-2;i<=2;i++)ctx.fillRect(x+i*25*s-5*s,y-25*s,10*s,75*s);ctx.beginPath();ctx.moveTo(x-82*s,y-28*s);ctx.lineTo(x,y-75*s);ctx.lineTo(x+82*s,y-28*s);ctx.closePath();ctx.fill();ctx.font=`${34*s}px serif`;ctx.textAlign='center';ctx.fillText('🦴',x,y+8*s);ctx.textAlign='start'}
function v4Workshop(x,y,s=1){v4Shadow(x,y+46*s,78*s,16*s,.18);ctx.fillStyle='#f08f5d';ctx.strokeStyle='#724957';ctx.lineWidth=5*s;ctx.beginPath();ctx.roundRect(x-72*s,y-30*s,144*s,82*s,12*s);ctx.fill();ctx.stroke();ctx.fillStyle='#7a5d9b';ctx.beginPath();ctx.moveTo(x-82*s,y-30*s);ctx.lineTo(x-25*s,y-75*s);ctx.lineTo(x+82*s,y-30*s);ctx.closePath();ctx.fill();ctx.fillStyle='#5c446f';ctx.fillRect(x+28*s,y+4*s,30*s,48*s);ctx.fillStyle='#b7edff';ctx.fillRect(x-49*s,y-4*s,35*s,30*s);ctx.font=`${30*s}px serif`;ctx.fillText('⚙️',x-8*s,y-34*s)}
function v4Lighthouse(x,y,s=1){v4Shadow(x,y+52*s,42*s,13*s,.18);ctx.fillStyle='#fff9e6';ctx.strokeStyle='#6b5c69';ctx.lineWidth=5*s;ctx.beginPath();ctx.moveTo(x-28*s,y+52*s);ctx.lineTo(x-18*s,y-58*s);ctx.lineTo(x+18*s,y-58*s);ctx.lineTo(x+28*s,y+52*s);ctx.closePath();ctx.fill();ctx.stroke();for(let yy=-36;yy<35;yy+=34){ctx.fillStyle='#ff647f';ctx.fillRect(x-22*s,y+yy*s,44*s,15*s)}ctx.fillStyle='#ffdf5f';ctx.beginPath();ctx.arc(x,y-71*s,20*s,0,7);ctx.fill();ctx.stroke();ctx.save();ctx.globalAlpha=.16;ctx.fillStyle='#fff9a7';ctx.beginPath();ctx.moveTo(x,y-71*s);ctx.lineTo(x-180*s,y-125*s);ctx.lineTo(x-180*s,y-20*s);ctx.closePath();ctx.fill();ctx.restore()}
function v4Sanctuary(x,y,s=1){v4Shadow(x,y+25*s,70*s,14*s,.14);ctx.fillStyle='#f7efd0';ctx.strokeStyle='#766f58';ctx.lineWidth=4*s;ctx.beginPath();ctx.roundRect(x-62*s,y-15*s,124*s,53*s,18*s);ctx.fill();ctx.stroke();v4Tree(x-62*s,y-18*s,.6*s);v4Tree(x+62*s,y-18*s,.6*s);ctx.font=`${26*s}px serif`;ctx.textAlign='center';ctx.fillText('🐾  💖  🐾',x,y+10*s);ctx.textAlign='start'}
function v4DrawLandmarks(){v4House(355,365,1);v4MagicTower(1710,350,1);v4Garage(2680,350,1);v4Museum(560,1590,1);v4Workshop(1545,1630,1);v4Lighthouse(2910,1300,1);v4Sanctuary(1760,300,.9);}
function v4DrawZoneLabels(){ctx.save();ctx.font='1000 28px ui-rounded, Trebuchet MS, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';for(const z of ZONES){v4Panel(z.x+z.w/2-124,z.y+32,248,48,'rgba(255,255,255,.78)','rgba(255,255,255,.94)',18);ctx.fillStyle='#3e466b';ctx.fillText(z.name,z.x+z.w/2,z.y+57)}ctx.restore()}
function drawWorld(){ZONES.forEach(v4DrawZoneGround);v4DrawPaths();v4DrawRaceway();v4DrawOcean();for(const a of V4_SCENERY){if(a.kind==='tree')v4Tree(a.x,a.y,a.s,a.zone==='Magic Grove');else if(a.kind==='rock')v4Rock(a.x,a.y,a.s);else if(a.kind==='shrub')v4Shrub(a.x,a.y,a.s);else if(a.kind==='mushroom')v4Mushroom(a.x,a.y,a.s);else if(a.kind==='crystal')v4Crystal(a.x,a.y,a.s);else if(a.kind==='fern')v4Fern(a.x,a.y,a.s);else if(a.kind==='flowerPatch')v4FlowerPatch(a.x,a.y,a.s);else if(a.kind==='coral')v4Coral(a.x,a.y,a.s);else if(a.kind==='wave')v4Wave(a.x,a.y,a.s);else if(a.kind==='crate')v4Crate(a.x,a.y,a.s);else if(a.kind==='shell')drawEmoji(a.x,a.y,'🐚',22*a.s)}v4DrawLandmarks();drawEmoji(440,760,'🌈',66);drawEmoji(720,850,'⛲',54);drawEmoji(350,1370,'⛏️',42);v4DrawZoneLabels()}

function drawCharacter(c,x,y,s,color,dir=0,preview=false){
  const moving=!preview&&(state.keys.ArrowRight||state.keys.ArrowLeft||state.keys.ArrowUp||state.keys.ArrowDown||state.keys.w||state.keys.a||state.keys.s||state.keys.d),walk=moving?Math.sin(performance.now()/90)*5*s:0;
  c.save();c.translate(x,y);v4ShadowLocal(c,0,31*s,21*s,7*s,.18);const side=Math.cos(dir)>=0?1:-1;
  c.strokeStyle='#53405d';c.lineWidth=6*s;c.lineCap='round';c.beginPath();c.moveTo(-8*s,23*s);c.lineTo((-8+walk)*s,38*s);c.moveTo(8*s,23*s);c.lineTo((8-walk)*s,38*s);c.stroke();
  c.fillStyle=color;c.strokeStyle='#fff';c.lineWidth=2*s;c.beginPath();c.roundRect(-20*s,-6*s,40*s,42*s,13*s);c.fill();c.stroke();
  c.strokeStyle=v4Color(color,-35);c.lineWidth=5*s;c.beginPath();c.moveTo(-18*s,3*s);c.lineTo((-28-walk*.4)*s,16*s);c.moveTo(18*s,3*s);c.lineTo((28+walk*.4)*s,16*s);c.stroke();
  c.fillStyle='#ffd6ba';c.strokeStyle='#c77f6b55';c.lineWidth=2*s;c.beginPath();c.arc(0,-23*s,21*s,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle='#46364d';c.beginPath();c.arc((-6+side*1.8)*s,-24*s,2.5*s,0,7);c.arc((6+side*1.8)*s,-24*s,2.5*s,0,7);c.fill();
  c.strokeStyle='#ae5b68';c.lineWidth=1.5*s;c.beginPath();c.arc(side*1.5*s,-17*s,6*s,.15,Math.PI-.15);c.stroke();
  c.fillStyle='#55354a';c.beginPath();c.arc(0,-35*s,17*s,Math.PI,Math.PI*2);c.fill();c.fillRect(-18*s,-36*s,36*s,9*s);
  c.fillStyle='#fff';c.beginPath();c.arc(-13*s,-2*s,3*s,0,7);c.fill();c.restore();
}
function v4ShadowLocal(c,x,y,rx,ry,a=.16){c.save();c.globalAlpha=a;c.fillStyle='#24344e';c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();c.restore()}
function drawScooter(x,y,dir){ctx.save();ctx.translate(x,y);ctx.rotate(dir);v4ShadowLocal(ctx,0,25,35,8,.18);ctx.strokeStyle='#4e4771';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-22,20);ctx.lineTo(18,20);ctx.lineTo(28,-13);ctx.lineTo(28,-31);ctx.stroke();ctx.fillStyle='#7a62ec';ctx.beginPath();ctx.roundRect(-27,12,52,10,5);ctx.fill();ctx.fillStyle='#2f3145';ctx.beginPath();ctx.arc(-20,24,7,0,7);ctx.arc(20,24,7,0,7);ctx.fill();ctx.fillStyle='#ffde5f';ctx.beginPath();ctx.arc(28,-31,5,0,7);ctx.fill();ctx.restore()}
function drawPlayer(){if(state.vehicle){drawScooter(state.player.x,state.player.y+9,state.player.dir);drawCharacter(ctx,state.player.x,state.player.y-13,.92,state.profile.color,state.player.dir)}else drawCharacter(ctx,state.player.x,state.player.y,1,state.profile.color,state.player.dir)}
function drawBuddy(){const bob=Math.sin(performance.now()/260)*5,level=state.profile?.buddyLevel||1;ctx.save();ctx.globalAlpha=.18+.04*Math.sin(performance.now()/220);ctx.fillStyle=level>=5?'#ffd95d':'#ffffff';ctx.beginPath();ctx.arc(state.buddy.x,state.buddy.y+bob,28+Math.min(14,level),0,7);ctx.fill();ctx.restore();v4Shadow(state.buddy.x,state.buddy.y+23,20,7,.14);drawEmoji(state.buddy.x,state.buddy.y+bob,state.profile.buddy,43);if(state.buddyEmoteTimer>0){v4Panel(state.buddy.x-20,state.buddy.y-66+bob,40,31,'rgba(255,255,255,.95)','#fff',14);ctx.font='22px serif';ctx.textAlign='center';ctx.fillText(state.buddyEmote||'💖',state.buddy.x,state.buddy.y-50+bob);ctx.textAlign='start'}}
function drawNPCs(){state.npcs.forEach((n,i)=>{const bob=Math.sin(performance.now()/340+i)*3;v4Shadow(n.x,n.y+27,27,8,.14);ctx.fillStyle='rgba(255,255,255,.85)';ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(n.x,n.y+bob,31,0,7);ctx.fill();ctx.stroke();drawEmoji(n.x,n.y+bob,n.face,42);if(dist(n,state.player)<190){v4Panel(n.x-68,n.y-74,136,31,'rgba(255,255,255,.92)','#fff',14);ctx.font='1000 15px sans-serif';ctx.textAlign='center';ctx.fillStyle='#3e466b';ctx.fillText(n.name,n.x,n.y-58);ctx.textAlign='start'}})}
function drawInteractables(){state.interactables.forEach((n,i)=>{const pulse=1+Math.sin(performance.now()/320+i)*.045;if(['lighthouse','garage','sanctuary'].includes(n.action))return;ctx.save();ctx.translate(n.x,n.y);ctx.scale(pulse,pulse);v4Ellipse(0,16,34,13,'#ffffff',.25);drawEmoji(0,0,n.face,n.action==='portal'?70:49);ctx.restore()})}
function drawCreatures(){state.creatures.forEach((c,i)=>{const bob=Math.sin(performance.now()/260+i)*7;ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(c.x,c.y,36+Math.sin(performance.now()/400+i)*3,0,7);ctx.fill();ctx.restore();v4Shadow(c.x,c.y+25,21,7,.12);drawEmoji(c.x,c.y+bob,c.icon,41);ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(c.x,c.y,39,0,7);ctx.stroke()})}
function drawObjects(){state.objects.forEach(o=>{const item=BUILD_ITEMS.find(i=>i.id===o.item);if(o.item==='tree')v4Tree(o.x,o.y,.85);else if(o.item==='flower')v4FlowerPatch(o.x,o.y,1.3);else if(o.item==='blocks'){v4Panel(o.x-28,o.y-24,56,45,'#ff9a5f','#fff',8);v4Panel(o.x-10,o.y-44,39,22,'#6f7ce8','#fff',6)}else if(o.item==='trampoline'){v4Shadow(o.x,o.y+17,35,9,.18);v4Ellipse(o.x,o.y,33,15,'#785fe6');ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke()}else if(o.item==='tent'){ctx.fillStyle='#ff8a6e';ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(o.x,o.y-40);ctx.lineTo(o.x-39,o.y+28);ctx.lineTo(o.x+39,o.y+28);ctx.closePath();ctx.fill();ctx.stroke()}else if(o.item==='castle'){ctx.fillStyle='#b69cf4';ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.fillRect(o.x-43,o.y-28,86,64);ctx.strokeRect(o.x-43,o.y-28,86,64);for(let i=-1;i<=1;i++){ctx.fillRect(o.x+i*34-12,o.y-54,24,28);ctx.strokeRect(o.x+i*34-12,o.y-54,24,28)}}else drawEmoji(o.x,o.y,item?.icon||'✨',58)})}
function drawAmbient(){const now=performance.now()/1000;state.trails=state.trails||[];state.trails=state.trails.filter(t=>t.life>0);for(const t of state.trails){t.life-=.025;ctx.globalAlpha=Math.max(0,t.life)*.4;v4Ellipse(t.x,t.y,7,4,t.color||'#fff');ctx.globalAlpha=1}for(const a of state.ambient){if(a.kind==='butterfly'){const x=a.x+Math.sin(now*a.speed+a.phase)*24,y=a.y+Math.cos(now*a.speed*.7+a.phase)*12;drawEmoji(x,y,'🦋',19)}else if(a.kind==='spark'){const night=Math.max(0,Math.cos((state.dayClock-.5)*Math.PI*2));if(night>.25){ctx.globalAlpha=.2+.55*Math.abs(Math.sin(now*2+a.phase));v4Ellipse(a.x,a.y,2.5,2.5,'#fff6a8');ctx.globalAlpha=1}}else if(a.kind==='grass'){ctx.strokeStyle='#2f954c77';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x-3,a.y+6);ctx.quadraticCurveTo(a.x+Math.sin(now+a.phase)*4,a.y-5,a.x+2,a.y-12);ctx.stroke()}}}
function drawDayOverlay(){const t=state.dayClock,night=Math.max(0,Math.cos((t-.5)*Math.PI*2))*.36;if(night>.02){ctx.fillStyle=`rgba(34,37,86,${night})`;ctx.fillRect(0,0,innerWidth,innerHeight);const moonX=innerWidth*.82,moonY=90;ctx.save();ctx.globalAlpha=Math.min(.85,night*2);v4Ellipse(moonX,moonY,26,26,'#fff7c4');ctx.restore()}else{const g=ctx.createRadialGradient(innerWidth*.8,70,0,innerWidth*.8,70,260);g.addColorStop(0,'rgba(255,244,170,.16)');g.addColorStop(1,'rgba(255,244,170,0)');ctx.fillStyle=g;ctx.fillRect(0,0,innerWidth,340)}ctx.save();const vign=ctx.createRadialGradient(innerWidth/2,innerHeight/2,Math.min(innerWidth,innerHeight)*.25,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.7);vign.addColorStop(0,'rgba(255,255,255,0)');vign.addColorStop(1,'rgba(40,38,88,.1)');ctx.fillStyle=vign;ctx.fillRect(0,0,innerWidth,innerHeight);ctx.restore()}

function checkLandmarkDiscoveries(){v4EnsureProfile();for(const lm of LANDMARKS_V4){if(!state.profile.landmarks.includes(lm.id)&&Math.hypot(state.player.x-lm.x,state.player.y-lm.y)<145){state.profile.landmarks.push(lm.id);const q=state.profile.quests.find(q=>q.id==='landmarks');if(q&&!q.done){q.progress=state.profile.landmarks.length;if(q.progress>=q.target)completeQuest('landmarks');else toastQuest('Landmark Discovered! 🏛️',`${lm.icon} ${lm.name} • ${q.progress}/${q.target}`)}addXP(5,'Landmark discovery');saveProfile();showCombo(`${lm.icon} ${lm.name.toUpperCase()}!`);speak(`Landmark discovered! ${lm.name}.`);if(state.profile.landmarks.length===LANDMARKS_V4.length){unlockSticker('Landmark Legend');achievement('Landmark Legend')}}}}
function updateLivingWorld(dt){v4EnsureProfile();if(state.buddyEmoteTimer>0)state.buddyEmoteTimer-=dt;state.worldEventTimer-=dt;if(state.worldEventTimer<=0&&!state.worldEvent){spawnWorldEvent();state.worldEventTimer=rand(55,85)}if(state.worldEvent){state.worldEvent.life-=dt;if(state.worldEvent.life<=0){const c=state.collectibles.find(x=>x.id===state.worldEvent.id);if(c)c.taken=true;state.worldEvent=null;$('#worldEvent').classList.add('hidden');toastQuest('The star zipped away!','Another falling star will visit later.')}}checkLandmarkDiscoveries();state.trailClock=(state.trailClock||0)-dt;if(state.vehicle&&state.trailClock<=0){state.trails=state.trails||[];state.trails.push({x:state.player.x-Math.cos(state.player.dir)*28,y:state.player.y-Math.sin(state.player.dir)*28+20,life:1,color:state.profile.color});state.trailClock=.07}}
function drawQuestCompass(){if(state.talking||!$('#modalLayer').classList.contains('hidden'))return;const q=currentQuest();let target=state.worldEvent?[state.worldEvent.x,state.worldEvent.y]:null,label=state.worldEvent?'Falling Star!':q?.title;if(!target&&!q)return;if(q?.id==='landmarks'){const lm=LANDMARKS_V4.find(l=>!state.profile.landmarks?.includes(l.id));target=lm?[lm.x,lm.y]:null}if(!target&&q)target=QUEST_TARGETS[q.id];if(q&&q.id==='stars'){const c=state.collectibles.find(c=>!c.taken&&c.type==='star');target=c?[c.x,c.y]:null}if(q&&q.id==='creatures'){const c=state.creatures[0];target=c?[c.x,c.y]:null}if(q&&q.id==='discover'){const unseen=ZONES.find(z=>!state.profile.discoveredZones.includes(z.name));target=unseen?[unseen.x+unseen.w/2,unseen.y+unseen.h/2]:null}if(!target)return;const sx=target[0]-state.cam.x,sy=target[1]-state.cam.y;if(sx>80&&sx<innerWidth-80&&sy>100&&sy<innerHeight-80)return;const cx=innerWidth/2,cy=innerHeight/2,ang=Math.atan2(sy-cy,sx-cx),r=Math.min(innerWidth,innerHeight)*.34,x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r;ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.shadowBlur=16;ctx.shadowColor='#6f5be8';ctx.fillStyle='#fff';ctx.strokeStyle='#5c49d7';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-15,-15);ctx.lineTo(-9,0);ctx.lineTo(-15,15);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.save();ctx.font='1000 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#44388b';ctx.lineWidth=6;ctx.strokeText(label,x,y+36);ctx.fillText(label,x,y+36);ctx.restore()}

function openHomeBase(){v4EnsureProfile();const upgrades=state.profile.homeUpgrades||[],themes=[['sky','☀️','Sunny Sky',0],['forest','🌿','Forest Hideout',5],['space','🚀','Star Cabin',7],['ocean','🐠','Ocean Room',7]],items=[['bed','🛏️','Dream Bed',4],['plant','🪴','Jungle Plant',3],['arcade','🕹️','Mini Arcade',8],['rocket','🚀','Rocket Model',6]],furn={bed:['🛏️','fv-bed'],plant:['🪴','fv-plant'],arcade:['🕹️','fv-arcade'],rocket:['🚀','fv-rocket']};const room=()=>`<div class="home-room-v4 theme-${state.profile.homeStyle}" style="--room-color:${state.profile.color}"><span class="window"></span><span class="rug"></span><div class="shelf">${(state.profile.stickers||[]).slice(0,5).map(()=> '🏆').join(' ')||'✨'}</div><span class="room-player"></span><span class="room-buddy">${state.profile.buddy}</span>${upgrades.map(id=>`<span class="furn-v4 ${furn[id][1]}">${furn[id][0]}</span>`).join('')}</div>`;openModal(`<h2>🏡 My Dream Home</h2><div id="homeRoomWrap">${room()}</div><div class="room-theme-row">${themes.map(([id,icon,label,cost])=>{const own=state.profile.homeThemes.includes(id);return `<button class="room-theme ${state.profile.homeStyle===id?'active':''}" data-theme="${id}" data-cost="${cost}">${icon} ${label}${own?'':` • 💎${cost}`}</button>`}).join('')}</div><div class="room-actions"><button id="roomDance">🎵 Dance Party</button><button id="roomNap">🌙 Dream Time</button><button id="roomBuddy">💖 Buddy Play</button></div><p style="text-align:center;font-weight:900">Decorate your room with gems you discover while exploring.</p><div class="collection-grid">${items.map(([id,icon,label,cost])=>`<button class="collect-card home-buy ${upgrades.includes(id)?'locked':''}" data-id="${id}" ${upgrades.includes(id)?'disabled':''}><div class="big-icon">${icon}</div><strong>${label}</strong><small>${upgrades.includes(id)?'Owned':`💎 ${cost}`}</small></button>`).join('')}</div>`);$$('.room-theme').forEach(b=>b.onclick=()=>{const id=b.dataset.theme,cost=+b.dataset.cost;if(!state.profile.homeThemes.includes(id)){if((state.profile.gems||0)<cost){toastQuest('Need More Gems!',`This room theme costs ${cost} 💎.`);Audio.tone(180,.12,'sawtooth');return}state.profile.gems-=cost;state.profile.homeThemes.push(id);addXP(5,'Home theme')}state.profile.homeStyle=id;saveProfile();updateHUD();openHomeBase()});$$('.home-buy:not([disabled])').forEach(b=>b.onclick=()=>{const it=items.find(x=>x[0]===b.dataset.id);if((state.profile.gems||0)<it[3]){toastQuest('Need More Gems!',`${it[2]} costs ${it[3]} 💎.`);Audio.tone(180,.12,'sawtooth');return}state.profile.gems-=it[3];state.profile.homeUpgrades.push(it[0]);addXP(5,'Home upgrade');saveProfile();updateHUD();Audio.success();openHomeBase()});$('#roomDance').onclick=()=>{state.profile.buddyLevel=Math.min(20,(state.profile.buddyLevel||1)+1);addXP(3,'Dance party');saveProfile();Audio.success();confetti();showCombo('DANCE PARTY! 🎵');openHomeBase()};$('#roomNap').onclick=()=>{state.dayClock=.76;Audio.tone(440,.2,'sine',.03);toastQuest('Dream Time 🌙','The sky outside your Dream Home turned to a cozy evening.');saveProfile()};$('#roomBuddy').onclick=()=>{closeModal();openBuddyCenter()}}
function openCollection(){v4EnsureProfile();const creatures=CREATURES.map(c=>{const got=state.profile.creatures.includes(c.id);return `<div class="collect-card ${got?'':'locked'}"><div class="big-icon">${got?c.icon:'❔'}</div><strong>${got?c.name:'Mystery Friend'}</strong><small>${got?c.zone:'Keep exploring!'}</small></div>`}).join('');const stickers=STICKERS.map(([icon,name])=>{const got=state.profile.stickers.includes(name);return `<div class="collect-card ${got?'':'locked'}"><div class="big-icon">${got?icon:'🔒'}</div><strong>${got?name:'Locked Sticker'}</strong><small>${got?'Collected!':'Complete adventures'}</small></div>`}).join('');const photos=ZONES.map(z=>{const got=state.profile.photos.includes(z.name);return `<div class="collect-card photo-card ${got?'':'locked'}"><div class="photo-snapshot">${got?z.emoji:'📷'}</div><strong>${got?z.name:'Mystery Land'}</strong><small>${got?'Safari photo':'Take a photo here'}</small></div>`}).join('');const landmarks=LANDMARKS_V4.map(l=>{const got=state.profile.landmarks.includes(l.id);return `<div class="collect-card ${got?'':'locked'}"><div class="big-icon">${got?l.icon:'❔'}</div><strong>${got?l.name:'Hidden Landmark'}</strong><small>${got?l.zone:'Explore every land'}</small></div>`}).join('');const treasures=`<div class="collection-grid"><div class="collect-card"><div class="big-icon">🦴</div><strong>Fossils</strong><small>${state.profile.fossils||0} complete</small></div><div class="collect-card"><div class="big-icon">⭐</div><strong>Dream Stars</strong><small>${state.profile.stars||0} collected</small></div><div class="collect-card"><div class="big-icon">💎</div><strong>Gems</strong><small>${state.profile.gems||0} ready to spend</small></div><div class="collect-card"><div class="big-icon">🏗️</div><strong>Creations</strong><small>${(state.profile.buildings||[]).length} built</small></div><div class="collect-card"><div class="big-icon">🌠</div><strong>Falling Stars</strong><small>${state.profile.worldEvents||0} chased</small></div><div class="collect-card"><div class="big-icon">💖</div><strong>Buddy Play</strong><small>${state.profile.buddyPlays||0} play-times</small></div></div>`;openModal(`<h2>🎒 Dream Collection</h2><div class="game-pill-row"><button class="game-pill active" data-tab="creatures">🐾 Creatures</button><button class="game-pill" data-tab="stickers">🎟️ Stickers</button><button class="game-pill" data-tab="photos">📸 Photos</button><button class="game-pill" data-tab="landmarks">🏛️ Landmarks</button><button class="game-pill" data-tab="treasures">🦴 Treasures</button></div><div id="collectionBody"><div class="collection-grid">${creatures}</div></div>`);$$('.game-pill').forEach(b=>b.onclick=()=>{$$('.game-pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(b.dataset.tab==='creatures')setMarkup($('#collectionBody'),`<div class="collection-grid">${creatures}</div>`);if(b.dataset.tab==='stickers')setMarkup($('#collectionBody'),`<div class="collection-grid">${stickers}</div>`);if(b.dataset.tab==='photos')setMarkup($('#collectionBody'),`<div class="collection-grid">${photos}</div>`);if(b.dataset.tab==='landmarks')setMarkup($('#collectionBody'),`<div class="collection-grid">${landmarks}</div>`);if(b.dataset.tab==='treasures')setMarkup($('#collectionBody'),treasures)})}
function openMap(){v4EnsureProfile();const current=zoneAt(state.player.x,state.player.y).name;openModal(`<h2>🗺️ DreamBound Story Map</h2><p style="text-align:center;font-weight:900">Every land now has its own special landmark to discover.</p><div class="world-map-grid">${ZONES.map((z,i)=>{const seen=state.profile.discoveredZones.includes(z.name),photo=state.profile.photos.includes(z.name),lm=LANDMARKS_V4.find(l=>l.zone===z.name),found=lm&&state.profile.landmarks.includes(lm.id);return `<button class="map-zone ${seen?'seen':'locked'} ${z.name===current?'current':''}" data-i="${i}" ${seen?'':'disabled'}><span>${seen?z.emoji:'❔'}</span><strong>${seen?z.name:'Undiscovered Land'}</strong><small>${z.name===current?'📍 You are here':seen?`${photo?'📸':'📷'} ${found?'🏛️':'🔎'} ${found?'Landmark found':'Landmark hidden'}`:'Keep exploring!'}</small></button>`}).join('')}</div><div class="map-stats"><span>🗺️ ${state.profile.discoveredZones.length}/6 lands</span><span>📸 ${state.profile.photos.length}/6 photos</span><span>🏛️ ${state.profile.landmarks.length}/6 landmarks</span><span>🌠 ${state.profile.worldEvents||0} falling stars</span></div>`);$$('.map-zone.seen').forEach(b=>b.onclick=()=>{const z=ZONES[+b.dataset.i];state.player.x=z.x+z.w/2;state.player.y=z.y+z.h/2;state.buddy.x=state.player.x-50;state.buddy.y=state.player.y+35;closeModal();showZoneBanner(z);Audio.success()})}
function openHow(){openModal(`<h2>✨ Welcome to DreamBound Adventures v0.5.0-dev!</h2><div class="modal-grid"><div class="menu-tile"><strong>🎨 Storybook World</strong><small>Every land now has richer scenery, animated water, roads, buildings and landmarks.</small></div><div class="menu-tile"><strong>🏛️ Landmark Hunt</strong><small>Walk close to each land's special landmark to add it to your collection.</small></div><div class="menu-tile"><strong>🏡 Dream Home</strong><small>Unlock room themes, decorate, dance and spend time with your buddy.</small></div><div class="menu-tile"><strong>🕹️ Explore</strong><small>Use arrow keys, WASD, touch controls, or a gamepad.</small></div><div class="menu-tile"><strong>✨ Talk & Discover</strong><small>Walk near friends and press Space/E or the sparkle button.</small></div><div class="menu-tile"><strong>⭐ Collect</strong><small>Find stars and gems hidden all over the world.</small></div><div class="menu-tile"><strong>🧱 Build</strong><small>Use gems to add your own creations to DreamBound.</small></div><div class="menu-tile"><strong>🧠 Play</strong><small>Mini-games quietly adjust to each explorer's age.</small></div><div class="menu-tile"><strong>💖 DreamBuddy</strong><small>Pet, play and grow your friendship.</small></div><div class="menu-tile"><strong>📸 Photo Safari</strong><small>Photograph every land for your adventure book.</small></div><div class="menu-tile"><strong>🛴 Ride</strong><small>Unlock a scooter with an animated sparkle trail.</small></div><div class="menu-tile"><strong>🌠 World Events</strong><small>Chase surprise falling stars for special rewards.</small></div></div>`)}

// controls
addEventListener('keydown',e=>{state.keys[e.key]=true;state.keys[e.key.toLowerCase()]=true;if([' ','e','E','Enter'].includes(e.key)&&state.running){e.preventDefault();interact()}if(e.key==='Escape'&&state.running){if(state.talking)closeTalk();else if(state.buildMode)toggleBuild(false);else openSettings()}});addEventListener('keyup',e=>{state.keys[e.key]=false;state.keys[e.key.toLowerCase()]=false});
$$('[data-dir]').forEach(b=>{const key={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[b.dataset.dir];b.addEventListener('pointerdown',e=>{e.preventDefault();state.keys[key]=true});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>state.keys[key]=false))});
$('#mobileAction').onclick=interact;$('#interactBtn').onclick=interact;$('#adventureBtn').onclick=openAdventureBoard;$('#buddyBtn').onclick=openBuddyCenter;$('#photoBtn').onclick=takePhoto;$('#rideBtn').onclick=toggleRide;$('#trackerBtn').onclick=cycleQuestTracker;$('#collectionBtn').onclick=openCollection;$('#journalBtn').onclick=openJournal;$('#magicBtn').onclick=openMagicMenu;$('#mapBtn').onclick=openMap;$('#settingsBtn').onclick=openSettings;$('#buildBtn').onclick=()=>toggleBuild();
$('#playBtn').onclick=()=>{Audio.click();loadProfiles();showScreen('profileScreen')};$('#howBtn').onclick=openHow;$('#parentBtn').onclick=openParentGate;$('#createProfileBtn').onclick=createProfile;$$('[data-back]').forEach(b=>b.onclick=()=>showScreen(b.dataset.back));
$('#ageSelect').onchange=drawAvatarPreview;

// basic gamepad support
function pollGamepad(){const gp=navigator.getGamepads?.()[0];if(gp&&state.running){state.keys.ArrowLeft=gp.axes[0]<-.35;state.keys.ArrowRight=gp.axes[0]>.35;state.keys.ArrowUp=gp.axes[1]<-.35;state.keys.ArrowDown=gp.axes[1]>.35;if(gp.buttons[0]?.pressed&&!pollGamepad.pressed){pollGamepad.pressed=true;interact()}if(!gp.buttons[0]?.pressed)pollGamepad.pressed=false}requestAnimationFrame(pollGamepad)}requestAnimationFrame(pollGamepad);


// DreamBound v0.5.0-dev — Local Sibling Co-op
const DREAMLINK_GATES=[
  {id:'home-link',zone:'Home Valley',name:'Rainbow Team Gate',a:{x:930,y:690},b:{x:1035,y:690},color:'#ff72bd'},
  {id:'builder-link',zone:'Builder Bay',name:'Builder Team Gate',a:{x:1450,y:1320},b:{x:1560,y:1320},color:'#7f72ff'},
  {id:'ocean-link',zone:'Ocean Cove',name:'Ocean Team Gate',a:{x:2500,y:1540},b:{x:2610,y:1540},color:'#58dfdf'}
];

STICKERS.push(['🤝','Dream Team']);
QUEST_TARGETS.teamwork=[982,690];

const defaultQuestsV5=defaultQuests;
defaultQuests=function(){
  const qs=defaultQuestsV5();
  if(!qs.some(q=>q.id==='teamwork'))qs.push({id:'teamwork',title:'Dream Team',text:'Activate all 3 DreamLink Gates with a sibling.',done:false,reward:10,xp:30,progress:0,target:3,icon:'🤝'});
  return qs;
};

const unlockStickerForQuestV5=unlockStickerForQuest;
unlockStickerForQuest=function(id){
  unlockStickerForQuestV5(id);
  if(id==='teamwork')unlockSticker('Dream Team');
};

function v5PrepareProfile(p){
  if(!p)return null;
  p.explorerLevel=p.explorerLevel||1;
  p.xp=p.xp||0;
  p.stars=p.stars||0;
  p.gems=p.gems||0;
  p.buddyLevel=p.buddyLevel||1;
  p.achievements=p.achievements||[];
  p.stickers=p.stickers||[];
  p.creatures=p.creatures||[];
  p.discoveredZones=p.discoveredZones||['Home Valley'];
  p.coopGates=p.coopGates||[];
  p.coopSessions=p.coopSessions||0;
  p.teamworkPoints=p.teamworkPoints||0;
  const oldQ=new Map((p.quests||[]).map(q=>[q.id,q]));
  p.quests=defaultQuests().map(q=>Object.assign(q,oldQ.get(q.id)||{}));
  return p;
}

state.coop={
  enabled:false,slot:null,profile:null,
  player:{x:600,y:545,r:24,speed:250,dir:0},
  buddy:{x:655,y:580},
  near:null,lastZone:'Home Valley',gp:{x:0,y:0,interact:false},
  tetherNotice:0
};

function saveGuestProfile(){
  if(!state.coop.enabled||state.coop.slot===null||!state.coop.profile)return;
  state.coop.profile.lastPlayed=Date.now();
  localStorage.setItem(profileKey(state.coop.slot),JSON.stringify(state.coop.profile));
}

function v5AddXPToProfile(p,amount){
  if(!p)return;
  p.xp=(p.xp||0)+amount;
  while(p.xp>=xpNeeded(p.explorerLevel||1)){
    p.xp-=xpNeeded(p.explorerLevel||1);
    p.explorerLevel=(p.explorerLevel||1)+1;
    p.gems=(p.gems||0)+2;
  }
}

function v5GuestAchievement(name){
  const p=state.coop.profile;
  if(!p)return;
  if(!p.achievements.includes(name))p.achievements.push(name);
}

function updateCoopStatus(){
  const el=$('#coopStatus');
  if(!el)return;
  if(!state.coop.enabled){
    el.classList.add('hidden');
    return;
  }
  const p=state.coop.profile;
  el.classList.remove('hidden');
  $('#coopP1Name').textContent=state.profile.name;
  $('#coopP1Avatar').textContent=state.profile.buddy;
  $('#coopP1Avatar').style.background=state.profile.color;
  $('#coopP2Name').textContent=p.name;
  $('#coopP2Avatar').textContent=p.buddy;
  $('#coopP2Avatar').style.background=p.color;
  $('#coopGateCount').textContent=(state.profile.coopGates||[]).length+'/3';
}

function openCoopCenter(){
  const candidates=[];
  for(let i=0;i<3;i++){
    if(i===state.currentSlot)continue;
    const p=readStoredProfile(i);
    if(p)candidates.push([i,v5PrepareProfile(p)]);
  }
  if(state.coop.enabled){
    const p=state.coop.profile;
    openModal('<h2>👥 Sibling Co-op</h2>'+
      '<div class="coop-joined-card"><div class="coop-big-avatar" style="background:'+p.color+'">'+p.buddy+'</div>'+
      '<div><strong>'+escapeHTML(p.name)+' joined the adventure!</strong><small>Player 2 • I/J/K/L + O • second gamepad supported</small></div></div>'+
      '<div class="coop-guide-grid"><div>🤝<strong>DreamLink Gates</strong><small>Stand on both glowing pads together.</small></div>'+
      '<div>⭐<strong>Shared Rewards</strong><small>Stars, gems and co-op rewards help both explorers.</small></div>'+
      '<div>🧲<strong>DreamLink Tether</strong><small>Keeps both players together on one screen.</small></div>'+
      '<div>🎮<strong>Two Controllers</strong><small>Gamepad 1 controls P1, gamepad 2 controls P2.</small></div></div>'+
      '<button id="leaveCoopBtn" class="big-btn secondary">👋 END CO-OP SESSION</button>');
    $('#leaveCoopBtn').onclick=leaveCoop;
    return;
  }
  const cards=candidates.map(([slot,p])=>'<button class="coop-profile-card" data-slot="'+slot+'">'+
    '<span class="coop-big-avatar" style="background:'+p.color+'">'+p.buddy+'</span>'+
    '<span><strong>'+escapeHTML(p.name)+'</strong><small>Age '+p.age+' • Level '+(p.explorerLevel||1)+'</small></span><b>JOIN →</b></button>').join('');
  openModal('<h2>👥 Sibling Co-op</h2>'+
    '<p class="coop-intro">Pick another saved explorer. Both kids will play together in the same DreamBound world.</p>'+
    (cards||'<div class="empty-coop">🌟 Create another child profile first, then come back here to start co-op.</div>')+
    '<div class="coop-controls-card"><strong>Player 1</strong><span>WASD / Arrows + E/Space</span><strong>Player 2</strong><span>I/J/K/L + O</span></div>');
  $$('.coop-profile-card').forEach(b=>b.onclick=()=>joinCoop(+b.dataset.slot));
}

function joinCoop(slot){
  const p=v5PrepareProfile(readStoredProfile(slot));
  if(!p||slot===state.currentSlot)return;
  state.coop.enabled=true;
  state.coop.slot=slot;
  state.coop.profile=p;
  state.coop.player.x=clamp(state.player.x+85,45,WORLD.w-45);
  state.coop.player.y=clamp(state.player.y+35,60,WORLD.h-45);
  state.coop.player.dir=state.player.dir;
  state.coop.buddy.x=state.coop.player.x+55;
  state.coop.buddy.y=state.coop.player.y+35;
  state.coop.lastZone=zoneAt(state.coop.player.x,state.coop.player.y).name;
  p.coopSessions=(p.coopSessions||0)+1;
  state.profile.coopSessions=(state.profile.coopSessions||0)+1;
  state.profile.coopGates=state.profile.coopGates||[];
  state.profile.teamworkPoints=state.profile.teamworkPoints||0;
  saveProfile();
  saveGuestProfile();
  updateCoopStatus();
  closeModal();
  Audio.success();
  confetti();
  toastQuest('Sibling Co-op Ready! 👥',state.profile.name+' + '+p.name+' are DreamLinked!');
  speak('Sibling co-op ready! Work together to find the DreamLink Gates.');
}

function leaveCoop(){
  if(!state.coop.enabled)return;
  saveGuestProfile();
  state.coop.enabled=false;
  state.coop.slot=null;
  state.coop.profile=null;
  updateCoopStatus();
  closeModal();
  toastQuest('Co-op Session Saved','Player 2 progress and teamwork rewards were saved.');
}

function coopNearest(){
  if(!state.coop.enabled)return null;
  let nearest=null,nd=95;
  [...state.npcs,...state.interactables,...state.creatures].forEach(n=>{
    const d=dist(n,state.coop.player);
    if(d<nd){nearest=n;nd=d}
  });
  return nearest;
}

function coopInteract(){
  if(!state.coop.enabled||state.talking)return;
  const n=coopNearest();
  if(!n){
    toastQuest('Player 2','Move closer to a friend, creature, or activity.');
    return;
  }
  if(n.type==='creature'){
    v5AddXPToProfile(state.coop.profile,2);
    state.coop.profile.teamworkPoints=(state.coop.profile.teamworkPoints||0)+1;
    saveGuestProfile();
    rescueCreature(n);
    return;
  }
  talkTo(n);
}

function v5AwardCollectible(c){
  c.taken=true;
  state.profile.taken=state.profile.taken||[];
  state.profile.taken.push(c.id);
  const guest=state.coop.enabled?state.coop.profile:null;
  if(c.type==='super'){
    state.profile.stars+=3;state.profile.gems+=5;state.profile.worldEvents=(state.profile.worldEvents||0)+1;addXP(12,'Falling Star');
    if(guest){guest.stars+=3;guest.gems+=5;guest.worldEvents=(guest.worldEvents||0)+1;v5AddXPToProfile(guest,12);guest.teamworkPoints=(guest.teamworkPoints||0)+3}
    Audio.success();spawnBurst(c.x,c.y,'#fff36b');spawnBurst(c.x,c.y,'#ff7ad9');showCombo(state.coop.enabled?'TEAM FALLING STAR! 🌠':'FALLING STAR! 🌠');achievement('Star Chaser');unlockSticker('Star Chaser');state.worldEvent=null;$('#worldEvent').classList.add('hidden');
  }else if(c.type==='star'){
    state.profile.stars++;questProgress('stars',1);addXP(1);
    if(guest){guest.stars++;v5AddXPToProfile(guest,1);guest.teamworkPoints=(guest.teamworkPoints||0)+1}
    Audio.collect();spawnBurst(c.x,c.y,'#ffd84f');showCombo(state.coop.enabled?'TEAM STAR! ⭐':'STAR! ⭐');
  }else{
    state.profile.gems++;addXP(1);
    if(guest){guest.gems++;v5AddXPToProfile(guest,1);guest.teamworkPoints=(guest.teamworkPoints||0)+1}
    Audio.tone(1100,.12,'triangle');spawnBurst(c.x,c.y,'#48e6ff');showCombo(state.coop.enabled?'TEAM GEM! 💎':'GEM! 💎');
  }
  if(guest)saveGuestProfile();
  updateHUD();saveProfile();
}

checkCollectibles=function(){
  state.collectibles.forEach(c=>{
    if(c.taken)return;
    const p1=dist(c,state.player)<43;
    const p2=state.coop.enabled&&dist(c,state.coop.player)<43;
    if(p1||p2)v5AwardCollectible(c);
  });
};

function v5GateActive(g){
  if(!state.coop.enabled)return false;
  const p1a=Math.hypot(state.player.x-g.a.x,state.player.y-g.a.y)<58;
  const p1b=Math.hypot(state.player.x-g.b.x,state.player.y-g.b.y)<58;
  const p2a=Math.hypot(state.coop.player.x-g.a.x,state.coop.player.y-g.a.y)<58;
  const p2b=Math.hypot(state.coop.player.x-g.b.x,state.coop.player.y-g.b.y)<58;
  return (p1a&&p2b)||(p1b&&p2a);
}

function checkDreamLinkGates(){
  if(!state.coop.enabled)return;
  state.profile.coopGates=state.profile.coopGates||[];
  for(const g of DREAMLINK_GATES){
    if(state.profile.coopGates.includes(g.id)||!v5GateActive(g))continue;
    state.profile.coopGates.push(g.id);
    const gp=state.coop.profile;
    gp.coopGates=gp.coopGates||[];
    if(!gp.coopGates.includes(g.id))gp.coopGates.push(g.id);
    state.profile.gems+=3;
    gp.gems+=3;
    state.profile.teamworkPoints=(state.profile.teamworkPoints||0)+10;
    gp.teamworkPoints=(gp.teamworkPoints||0)+10;
    addXP(10,'DreamLink Gate');
    v5AddXPToProfile(gp,10);
    questProgress('teamwork',1);
    if(state.profile.coopGates.length===1){
      unlockSticker('Dream Team');
      if(!gp.stickers.includes('Dream Team'))gp.stickers.push('Dream Team');
      v5GuestAchievement('Dream Team');
    }
    saveProfile();saveGuestProfile();updateCoopStatus();
    Audio.success();confetti();spawnBurst(g.a.x,g.a.y,g.color);spawnBurst(g.b.x,g.b.y,'#65f1e8');
    toastQuest('DreamLink Gate Activated! 🤝',g.name+' • Both explorers earned 3 💎 and 10 XP!');
  }
}

function updateCoop(dt){
  if(!state.coop.enabled||!state.coop.profile)return;
  const p=state.coop.player;
  if(!state.talking&&!state.buildMode&&$('#modalLayer').classList.contains('hidden')){
    let dx=(state.keys.l?1:0)-(state.keys.j?1:0)+state.coop.gp.x;
    let dy=(state.keys.k?1:0)-(state.keys.i?1:0)+state.coop.gp.y;
    if(dx||dy){
      const len=Math.hypot(dx,dy);dx/=len;dy/=len;
      p.x=clamp(p.x+dx*p.speed*dt,45,WORLD.w-45);
      p.y=clamp(p.y+dy*p.speed*dt,60,WORLD.h-45);
      p.dir=Math.atan2(dy,dx);
    }
  }
  const buddyTargetX=p.x-Math.cos(p.dir)*56,buddyTargetY=p.y-Math.sin(p.dir)*56+16;
  state.coop.buddy.x+=(buddyTargetX-state.coop.buddy.x)*Math.min(1,dt*5);
  state.coop.buddy.y+=(buddyTargetY-state.coop.buddy.y)*Math.min(1,dt*5);

  const dx=p.x-state.player.x,dy=p.y-state.player.y,d=Math.hypot(dx,dy);
  if(d>1100){
    p.x=clamp(state.player.x+90,45,WORLD.w-45);p.y=clamp(state.player.y+45,60,WORLD.h-45);
    state.coop.buddy.x=p.x+45;state.coop.buddy.y=p.y+35;
    toastQuest('DreamLink! 🧲','Player 2 zoomed back to the team.');
  }else if(d>720){
    const pull=(d-720)/d;
    p.x-=dx*pull;p.y-=dy*pull;
    if(state.coop.tetherNotice<=0){showCombo('STAY DREAMLINKED! 🤝');state.coop.tetherNotice=4}
  }
  state.coop.tetherNotice=Math.max(0,state.coop.tetherNotice-dt);

  const z=zoneAt(p.x,p.y);
  if(z.name!==state.coop.lastZone){
    state.coop.lastZone=z.name;
    if(!state.coop.profile.discoveredZones.includes(z.name)){
      state.coop.profile.discoveredZones.push(z.name);
      v5AddXPToProfile(state.coop.profile,2);
      saveGuestProfile();
    }
  }

  checkDreamLinkGates();

  const midX=(state.player.x+p.x)/2,midY=(state.player.y+p.y)/2;
  const targetCamX=clamp(midX-innerWidth/2,0,Math.max(0,WORLD.w-innerWidth));
  const targetCamY=clamp(midY-innerHeight/2,0,Math.max(0,WORLD.h-innerHeight));
  state.cam.x+=(targetCamX-state.cam.x)*Math.min(1,dt*7);
  state.cam.y+=(targetCamY-state.cam.y)*Math.min(1,dt*7);
}

function drawDreamLinkGates(){
  const done=state.profile.coopGates||[];
  for(const g of DREAMLINK_GATES){
    const completed=done.includes(g.id);
    const active=v5GateActive(g);
    [g.a,g.b].forEach((p,idx)=>{
      ctx.save();
      ctx.globalAlpha=completed ? .3 : 1;
      ctx.shadowBlur=active?24:10;
      ctx.shadowColor=idx?'#60f1e6':g.color;
      ctx.lineWidth=6;
      ctx.strokeStyle=idx?'#60f1e6':g.color;
      ctx.fillStyle=active?'#fffbd8':'#25245288';
      ctx.beginPath();ctx.arc(p.x,p.y,38,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.font='900 22px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(idx?'P2':'P1',p.x,p.y+8);
      ctx.restore();
    });
    if(!completed){
      ctx.save();ctx.strokeStyle=active?'#fff48d':'#ffffff55';ctx.lineWidth=active?7:3;ctx.setLineDash([12,10]);ctx.beginPath();ctx.moveTo(g.a.x,g.a.y);ctx.lineTo(g.b.x,g.b.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
  }
}

function drawCoopExplorer(){
  if(!state.coop.enabled||!state.coop.profile)return;
  const p=state.coop.player,b=state.coop.buddy,profile=state.coop.profile;
  const d=Math.hypot(p.x-state.player.x,p.y-state.player.y);
  if(d>430){
    ctx.save();ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=4;ctx.setLineDash([10,12]);ctx.beginPath();ctx.moveTo(state.player.x,state.player.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();
  }
  drawCharacter(ctx,p.x,p.y,1,profile.color,p.dir);
  const bob=Math.sin(performance.now()/260+1.2)*5;
  v4Shadow(b.x,b.y+23,20,7,.12);
  drawEmoji(b.x,b.y+bob,profile.buddy,43);
  ctx.save();ctx.font='1000 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#4b3a80';ctx.lineWidth=5;ctx.strokeText(profile.name+' • P2',p.x,p.y-55);ctx.fillText(profile.name+' • P2',p.x,p.y-55);ctx.restore();
}

const drawInteractablesV5=drawInteractables;
drawInteractables=function(){drawInteractablesV5();drawDreamLinkGates()};

const drawPlayerV5=drawPlayer;
drawPlayer=function(){drawPlayerV5();drawCoopExplorer()};

const updateV5=update;
update=function(dt){updateV5(dt);if(state.running)updateCoop(dt)};

const openHowV5=openHow;
openHow=function(){
  openHowV5();
  const grid=$('#modalCard .modal-grid');
  if(grid)insertMarkup(grid,'beforeend','<div class="menu-tile"><strong>👥 Sibling Co-op</strong><small>Player 2 joins from another saved profile. Use I/J/K/L + O or a second gamepad, then activate DreamLink Gates together.</small></div>');
};

function pollCoopGamepad(){
  const gp=navigator.getGamepads?.()[1];
  if(state.coop.enabled&&gp){
    state.coop.gp.x=Math.abs(gp.axes[0]||0)>.35?(gp.axes[0]||0):0;
    state.coop.gp.y=Math.abs(gp.axes[1]||0)>.35?(gp.axes[1]||0):0;
    const pressed=!!gp.buttons[0]?.pressed;
    if(pressed&&!state.coop.gp.interact)coopInteract();
    state.coop.gp.interact=pressed;
  }else{
    state.coop.gp.x=0;state.coop.gp.y=0;state.coop.gp.interact=false;
  }
  requestAnimationFrame(pollCoopGamepad);
}
requestAnimationFrame(pollCoopGamepad);

addEventListener('keydown',e=>{
  if(e.key.toLowerCase()==='o'&&state.running&&state.coop.enabled&&!e.repeat){
    e.preventDefault();coopInteract();
  }
});

$('#coopBtn').onclick=openCoopCenter;
updateCoopStatus();


// ===== DreamBound v0.5.1-dev CO-OP GAMEPLAY SYSTEMS =====
STICKERS.push(['🌟','Sibling Stars']);

const defaultQuestsV51=defaultQuests;
defaultQuests=function(){
  const qs=defaultQuestsV51();
  if(!qs.some(q=>q.id==='teamplay'))qs.push({
    id:'teamplay',
    title:'Sibling Stars',
    text:'Complete 3 different co-op activities together.',
    done:false,reward:12,xp:36,progress:0,target:3,icon:'🌟'
  });
  return qs;
};
QUEST_TARGETS.teamplay=[1545,1670];

const v5PrepareProfileV51=v5PrepareProfile;
v5PrepareProfile=function(p){
  p=v5PrepareProfileV51(p);
  if(!p)return null;
  p.coopActivities=p.coopActivities||[];
  p.coopWins=p.coopWins||0;
  p.teamRescues=p.teamRescues||0;
  p.teamMagic=p.teamMagic||0;
  p.teamRepairs=p.teamRepairs||0;
  const oldQ=new Map((p.quests||[]).map(q=>[q.id,q]));
  p.quests=defaultQuests().map(q=>Object.assign(q,oldQ.get(q.id)||{}));
  return p;
};

function v51GuestQuestProgress(id,n=1){
  const p=state.coop.profile;
  if(!p)return;
  const q=(p.quests||[]).find(q=>q.id===id);
  if(!q||q.done)return;
  q.progress=(q.progress||0)+n;
  if(q.target&&q.progress>=q.target)v51CompleteQuestForProfile(p,id);
}

function v51CompleteQuestForProfile(p,id){
  if(!p)return;
  const q=(p.quests||[]).find(q=>q.id===id);
  if(!q||q.done)return;
  q.done=true;
  p.stars=(p.stars||0)+(q.reward||0);
  v5AddXPToProfile(p,q.xp||10);
}

function v51AwardTeamActivity(id,label){
  if(!state.coop.enabled||!state.coop.profile)return;
  const both=[state.profile,state.coop.profile];
  let newlyAdded=false;
  for(const p of both){
    p.coopActivities=p.coopActivities||[];
    if(!p.coopActivities.includes(id)){p.coopActivities.push(id);newlyAdded=true}
    p.teamworkPoints=(p.teamworkPoints||0)+5;
  }
  if(newlyAdded){
    questProgress('teamplay',1);
    v51GuestQuestProgress('teamplay',1);
  }
  if((state.profile.coopActivities||[]).length>=3)unlockSticker('Sibling Stars');
  if((state.coop.profile.coopActivities||[]).length>=3&&!state.coop.profile.stickers.includes('Sibling Stars'))state.coop.profile.stickers.push('Sibling Stars');
  saveProfile();saveGuestProfile();updateCoopStatus();
  toastQuest('Team Activity Complete! 🌟',label+' • '+(state.profile.coopActivities||[]).length+'/3 Sibling Stars activities');
}

const updateCoopStatusV51=updateCoopStatus;
updateCoopStatus=function(){
  updateCoopStatusV51();
  if(!state.coop.enabled)return;
  const activity=$('#coopActivityCount');
  if(activity)activity.textContent=(state.profile.coopActivities||[]).length+'/3';
};

const closeModalV51=closeModal;
closeModal=function(){
  if(state.coop?.cleanup){
    const cleanup=state.coop.cleanup;
    state.coop.cleanup=null;
    try{cleanup()}catch{}
  }
  closeModalV51();
};

const initWorldV51=initWorld;
initWorld=function(){
  initWorldV51();
  if(!state.interactables.some(x=>x.action==='teamrepair')){
    state.interactables.push({
      id:'dreamlink-workshop',
      name:'DreamLink Workshop',
      face:'⚙️',
      x:1710,y:1580,
      text:'This machine needs two explorers! One powers the spark core while the other lines up the gears.',
      action:'teamrepair'
    });
  }
};

const talkToV51=talkTo;
talkTo=function(n){
  talkToV51(n);
  if(n.action==='teamrepair'){
    setTimeout(()=>{
      if(!state.talking)return;
      if(state.coop.enabled)addTalkAction('🤝 START TEAM REPAIR',()=>{closeTalk();openTeamRepair()});
      else addTalkAction('👥 NEED A SIBLING',()=>{closeTalk();openCoopCenter()});
    },80);
  }
};

function openTeamRepair(){
  if(!state.coop.enabled){openCoopCenter();return}
  let power=0,gears=0,done=false;
  openModal(
    '<h2>⚙️ DreamLink Workshop</h2>'+
    '<p class="coop-intro">Two jobs. One machine. Work together!</p>'+
    '<div class="team-role-grid">'+
      '<div class="team-role p1"><span>⚡</span><strong>Player 1 — Spark Engineer</strong><small>Charge the power core 4 times.</small><div class="team-meter"><i id="repairPower"></i></div><button id="repairP1" class="big-btn primary">Q • POWER SPARK</button></div>'+
      '<div class="team-role p2"><span>⚙️</span><strong>Player 2 — Gear Engineer</strong><small>Align the rainbow gears 4 times.</small><div class="team-meter"><i id="repairGears"></i></div><button id="repairP2" class="big-btn primary">P • ALIGN GEAR</button></div>'+
    '</div>'+
    '<div id="repairMachine" class="repair-machine">🔧 ⚙️ ✨ ⚙️ 🔧</div>'
  );
  function refresh(){
    if($('#repairPower'))$('#repairPower').style.width=(power/4*100)+'%';
    if($('#repairGears'))$('#repairGears').style.width=(gears/4*100)+'%';
    if(power>=4&&gears>=4&&!done)finish();
  }
  function p1(){if(done||power>=4)return;power++;Audio.tone(520+power*80,.08,'triangle');refresh()}
  function p2(){if(done||gears>=4)return;gears++;Audio.tone(640+gears*70,.08,'sine');refresh()}
  function finish(){
    done=true;
    state.profile.gems+=4;state.coop.profile.gems+=4;
    addXP(12,'Team repair');v5AddXPToProfile(state.coop.profile,12);
    state.profile.teamRepairs=(state.profile.teamRepairs||0)+1;
    state.coop.profile.teamRepairs=(state.coop.profile.teamRepairs||0)+1;
    v51AwardTeamActivity('repair','DreamLink Workshop repaired');
    Audio.success();confetti();
    setTimeout(()=>{
      openModal('<h2>✨ MACHINE ONLINE!</h2><div class="creature-pop">⚙️🌈⚡</div><p style="text-align:center;font-weight:1000">Perfect teamwork! Both explorers earned 4 💎 and 12 XP.</p><button id="repairDone" class="big-btn primary">TEAM HIGH-FIVE!</button>');
      $('#repairDone').onclick=closeModal;
    },260);
  }
  $('#repairP1').onclick=p1;$('#repairP2').onclick=p2;
  const key=e=>{
    if($('#modalLayer').classList.contains('hidden'))return;
    if(e.key.toLowerCase()==='q'){e.preventDefault();p1()}
    if(e.key.toLowerCase()==='p'){e.preventDefault();p2()}
  };
  addEventListener('keydown',key,true);
  state.coop.cleanup=()=>removeEventListener('keydown',key,true);
  refresh();
}

const rescueCreatureSingleV51=rescueCreature;
rescueCreature=function(c){
  if(!state.coop.enabled){rescueCreatureSingleV51(c);return}
  let p1=false,p2=false,finished=false;
  openModal(
    '<h2>💖 Team Creature Rescue!</h2>'+
    '<div class="creature-pop">'+c.icon+'</div>'+
    '<p style="text-align:center;font-size:21px;font-weight:1000">'+escapeHTML(c.name)+' needs <b>two friendly high-fives!</b></p>'+
    '<div class="team-rescue-row">'+
      '<button id="rescueP1" class="team-highfive p1">🖐️<strong>'+escapeHTML(state.profile.name)+'</strong><small>PLAYER 1</small></button>'+
      '<button id="rescueP2" class="team-highfive p2">🖐️<strong>'+escapeHTML(state.coop.profile.name)+'</strong><small>PLAYER 2</small></button>'+
    '</div>'+
    '<p id="rescueTeamStatus" class="coop-intro">Both explorers high-five to complete the rescue.</p>'
  );
  function tap(which){
    if(finished)return;
    if(which===1){p1=true;$('#rescueP1').classList.add('ready')}
    else{p2=true;$('#rescueP2').classList.add('ready')}
    Audio.collect();
    $('#rescueTeamStatus').textContent=(p1?'✅':'⬜')+' P1  •  '+(p2?'✅':'⬜')+' P2';
    if(p1&&p2)finish();
  }
  function finish(){
    finished=true;
    const gp=state.coop.profile;
    for(const p of [state.profile,gp]){
      if(!p.creatures.includes(c.id))p.creatures.push(c.id);
      p.gems=(p.gems||0)+2;
      p.buddyLevel=Math.min(20,(p.buddyLevel||1)+1);
      p.teamRescues=(p.teamRescues||0)+1;
    }
    state.creatures=state.creatures.filter(x=>x.id!==c.id);
    questProgress('creatures',1);v51GuestQuestProgress('creatures',1);
    addXP(8,'Team creature rescue');v5AddXPToProfile(gp,8);
    v51AwardTeamActivity('rescue','Team creature rescue');
    unlockSticker('Creature Helper');
    if(!gp.stickers.includes('Creature Helper'))gp.stickers.push('Creature Helper');
    saveProfile();saveGuestProfile();updateHUD();
    Audio.success();confetti();
    setTimeout(()=>{
      openModal('<h2>🐾 NEW TEAM FRIEND!</h2><div class="creature-pop">'+c.icon+'💖</div><p style="text-align:center;font-weight:1000">'+escapeHTML(c.name)+' joined both explorers’ Dream Collections! Both earned 2 💎.</p><button id="teamRescueDone" class="big-btn primary">WELCOME, '+escapeHTML(c.name.toUpperCase())+'!</button>');
      $('#teamRescueDone').onclick=closeModal;
    },260);
  }
  $('#rescueP1').onclick=()=>tap(1);$('#rescueP2').onclick=()=>tap(2);
}

const openRaceGameSingleV51=openRaceGame;
openRaceGame=function(){
  if(state.coop.enabled)openCoopRaceGame();
  else openRaceGameSingleV51();
};

function openCoopRaceGame(){
  let running=false,time=24,score=0,lane1=0,lane2=2,obs=[],lastSpawn=0,raf=0,finished=false;
  openModal(
    '<h2>🏎️ DreamLink Team Raceway</h2>'+
    '<div id="raceStage" class="race-stage coop-race-stage"><div class="race-road"></div>'+
      '<div class="race-hud"><span>TEAM ⭐ <b id="raceScore">0</b></span><span>TIME <b id="raceTime">24</b></span></div>'+
      '<div id="raceKart1" class="race-kart coop-kart p1">🏎️<small>P1</small></div>'+
      '<div id="raceKart2" class="race-kart coop-kart p2">🚙<small>P2</small></div>'+
    '</div>'+
    '<div class="coop-race-help"><span><b>P1</b> A/D or ←/→</span><span><b>P2</b> J/L</span></div>'+
    '<button id="raceStart" class="big-btn primary">🏁 START TEAM RACE</button>'
  );
  const stage=$('#raceStage'),k1=$('#raceKart1'),k2=$('#raceKart2'),lanes=[29,50,71];
  function setLane(player,delta){
    if(player===1){lane1=clamp(lane1+delta,0,2);k1.style.left=lanes[lane1]+'%'}
    else{lane2=clamp(lane2+delta,0,2);k2.style.left=lanes[lane2]+'%'}
    Audio.click();
  }
  function spawn(){
    const good=Math.random()<.33,el=document.createElement('div'),ln=Math.floor(Math.random()*3);
    el.className='race-obstacle';el.textContent=good?'⭐':['🪨','🛞','🌵'][Math.floor(Math.random()*3)];
    el.style.left=lanes[ln]+'%';el.style.top='44%';stage.appendChild(el);
    obs.push({el,y:44,lane:ln,good,hit1:false,hit2:false});
  }
  function hit(o,player){
    if(o.good){score++;Audio.collect();showCombo('TEAM +1 ⭐')}
    else{score=Math.max(0,score-1);Audio.tone(150,.09,'sawtooth');haptic(50)}
    $('#raceScore').textContent=score;
    o.el.remove();o.removed=true;
  }
  function frame(ts){
    if(!running)return;
    if(ts-lastSpawn>570){spawn();lastSpawn=ts}
    for(const o of obs){
      o.y+=.5;o.el.style.top=o.y+'%';
      if(o.y>82&&o.y<96&&!o.removed){
        if(o.lane===lane1&&!o.hit1){o.hit1=true;hit(o,1)}
        else if(o.lane===lane2&&!o.hit2){o.hit2=true;hit(o,2)}
      }
      if(o.y>103&&!o.removed){o.el.remove();o.removed=true}
    }
    obs=obs.filter(o=>!o.removed);
    raf=requestAnimationFrame(frame);
  }
  function end(){
    if(finished)return;finished=true;running=false;cancelAnimationFrame(raf);removeEventListener('keydown',key,true);
    obs.forEach(o=>o.el.remove());state.raceStop=null;
    const gems=Math.max(2,Math.floor(score/3));
    state.profile.gems+=gems;state.coop.profile.gems+=gems;
    state.profile.coopWins=(state.profile.coopWins||0)+1;state.coop.profile.coopWins=(state.coop.profile.coopWins||0)+1;
    completeQuest('race');v51CompleteQuestForProfile(state.coop.profile,'race');
    addXP(12+score,'Team race');v5AddXPToProfile(state.coop.profile,12+score);
    unlockSticker('Racing Rookie');if(!state.coop.profile.stickers.includes('Racing Rookie'))state.coop.profile.stickers.push('Racing Rookie');
    v51AwardTeamActivity('race','DreamLink Team Raceway');
    saveProfile();saveGuestProfile();updateHUD();Audio.success();confetti();
    openModal('<h2>🏁 TEAM FINISH!</h2><div class="creature-pop">🏆🏎️🚙</div><p style="text-align:center;font-size:21px;font-weight:1000">Team score: '+score+' ⭐<br>Both explorers earned '+gems+' 💎!</p><button id="raceDone" class="big-btn primary">TEAM VICTORY!</button>');
    $('#raceDone').onclick=closeModal;
  }
  const key=e=>{
    if(!running)return;
    const k=e.key.toLowerCase();
    if(e.key==='ArrowLeft'||k==='a'){e.preventDefault();setLane(1,-1)}
    if(e.key==='ArrowRight'||k==='d'){e.preventDefault();setLane(1,1)}
    if(k==='j'){e.preventDefault();setLane(2,-1)}
    if(k==='l'){e.preventDefault();setLane(2,1)}
  };
  addEventListener('keydown',key,true);
  state.raceStop=()=>{running=false;cancelAnimationFrame(raf);removeEventListener('keydown',key,true);obs.forEach(o=>o.el.remove())};
  $('#raceStart').onclick=()=>{
    if(running)return;running=true;$('#raceStart').disabled=true;Audio.success();
    let tick=setInterval(()=>{
      if(!running){clearInterval(tick);return}
      time--;if($('#raceTime'))$('#raceTime').textContent=time;
      if(time<=0){clearInterval(tick);end()}
    },1000);
    raf=requestAnimationFrame(frame);
  };
}

const openMagicLessonSingleV51=openMagicLesson;
openMagicLesson=function(){
  if(state.coop.enabled)openCoopMagicLesson();
  else openMagicLessonSingleV51();
};

function openCoopMagicLesson(){
  const symbols=['✨','🌟','💜','🔮'];
  const len=6;
  const seq=Array.from({length:len},(_,i)=>({symbol:symbols[Math.floor(Math.random()*symbols.length)],player:i%2+1}));
  let pos=0,showing=true;
  openModal(
    '<h2>🪄 DreamLink Magic Lesson</h2>'+
    '<p class="coop-intro">Take turns! Pink steps belong to Player 1. Aqua steps belong to Player 2.</p>'+
    '<div id="teamSpellSeq" class="team-spell-seq">'+seq.map(x=>'<span class="p'+x.player+'">'+x.symbol+'</span>').join('')+'</div>'+
    '<div class="team-magic-grid">'+
      '<div class="team-role p1"><strong>Player 1</strong><div id="teamMagicP1" class="spell-choice-row">'+symbols.map(x=>'<button class="spell-choice" data-symbol="'+x+'" data-player="1">'+x+'</button>').join('')+'</div></div>'+
      '<div class="team-role p2"><strong>Player 2</strong><div id="teamMagicP2" class="spell-choice-row">'+symbols.map(x=>'<button class="spell-choice" data-symbol="'+x+'" data-player="2">'+x+'</button>').join('')+'</div></div>'+
    '</div>'
  );
  $('.team-magic-grid button').forEach(b=>b.disabled=true);
  setTimeout(()=>{
    if(!$('#teamSpellSeq'))return;
    showing=false;setMarkup($('#teamSpellSeq'),seq.map((x,i)=>'<span class="p'+x.player+'">'+(i===0?'❔':'○')+'</span>').join(''));
    $('.team-magic-grid button').forEach(b=>b.disabled=false);
  },1900);
  function render(){
    if(!$('#teamSpellSeq'))return;
    setMarkup($('#teamSpellSeq'),seq.map((x,i)=>{
      const mark=i<pos?'✅':i===pos?'❔':'○';
      return '<span class="p'+x.player+'">'+mark+'</span>';
    }).join(''));
  }
  function choose(player,symbol){
    if(showing||pos>=seq.length)return;
    const need=seq[pos];
    if(player!==need.player){
      Audio.tone(180,.1,'sawtooth');toastQuest('Take Turns!','It is Player '+need.player+'’s magic step.');return;
    }
    if(symbol===need.symbol){
      pos++;Audio.tone(560+pos*70,.08,'triangle');render();
      if(pos===seq.length)finish();
    }else{
      pos=0;Audio.tone(160,.14,'sawtooth');render();toastQuest('Magic Reset ✨','Good try! Start the team pattern again.');
    }
  }
  function finish(){
    const gp=state.coop.profile;
    for(const p of [state.profile,gp]){
      if(!p.spells.includes('sparkle'))p.spells.push('sparkle');
      p.teamMagic=(p.teamMagic||0)+1;
    }
    completeQuest('magic');v51CompleteQuestForProfile(gp,'magic');
    addXP(12,'Team magic');v5AddXPToProfile(gp,12);
    v51AwardTeamActivity('magic','DreamLink Magic Lesson');
    saveProfile();saveGuestProfile();updateHUD();Audio.success();confetti();
    setTimeout(()=>{
      openModal('<h2>✨ DREAMLINK MAGIC!</h2><div class="creature-pop">🪄🤝🌈</div><p style="text-align:center;font-weight:1000">You completed the pattern together! Both explorers awakened Sparkle Magic.</p><button id="teamMagicDone" class="big-btn primary">CAST TOGETHER!</button>');
      $('#teamMagicDone').onclick=()=>{closeModal();for(let i=0;i<50;i++)spawnBurst((state.player.x+state.coop.player.x)/2+rand(-60,60),(state.player.y+state.coop.player.y)/2+rand(-40,40),['#fff36b','#ff77cc','#6ee7ff'][i%3]);showCombo('DREAMLINK MAGIC! ✨')};
    },250);
  }
  $('.team-magic-grid button').forEach(b=>b.onclick=()=>choose(+b.dataset.player,b.dataset.symbol));
}

const openSanctuarySingleV51=openSanctuary;
openSanctuary=function(){
  if(!state.coop.enabled){openSanctuarySingleV51();return}
  const rescued=CREATURES.filter(c=>state.profile.creatures.includes(c.id)||state.coop.profile.creatures.includes(c.id));
  openModal(
    '<h2>🐾 Team DreamCreature Sanctuary</h2>'+
    '<div class="sanctuary-scene">'+(rescued.length?rescued.map(c=>'<span title="'+c.name+'">'+c.icon+'</span>').join(''):'<strong>Rescue DreamCreatures together and they will play here!</strong>')+'</div>'+
    '<p style="text-align:center;font-weight:900">'+rescued.length+'/'+CREATURES.length+' team friends discovered</p>'+
    (rescued.length?'<button id="sanctuaryTeamPlay" class="big-btn primary">🎉 TEAM CREATURE PARTY</button>':'')
  );
  if($('#sanctuaryTeamPlay'))$('#sanctuaryTeamPlay').onclick=()=>{
    state.profile.buddyLevel=Math.min(20,(state.profile.buddyLevel||1)+1);
    state.coop.profile.buddyLevel=Math.min(20,(state.coop.profile.buddyLevel||1)+1);
    addXP(5,'Team sanctuary');v5AddXPToProfile(state.coop.profile,5);
    saveProfile();saveGuestProfile();updateHUD();confetti();closeModal();showCombo('TEAM CREATURE PARTY! 🎉');
  };
}

const openCoopCenterV51=openCoopCenter;
openCoopCenter=function(){
  openCoopCenterV51();
  if(state.coop.enabled&&$('#modalCard')){
    const guide=$('#modalCard .coop-guide-grid');
    if(guide)insertMarkup(guide,'beforeend',
      '<div>🏎️<strong>Team Raceway</strong><small>Two karts, one team score.</small></div>'+
      '<div>🪄<strong>Team Magic</strong><small>Take turns completing patterns.</small></div>'+
      '<div>🐾<strong>Team Rescue</strong><small>Both kids high-five new creatures.</small></div>'+
      '<div>⚙️<strong>Team Repair</strong><small>Two roles power the workshop.</small></div>'
    );
  }
};


// ===== DreamBound v0.6.0-dev — HOME & MAGIC STORY CHAPTER =====
const V6_DREAM_PETALS=[
  {id:'petal-home-1',x:610,y:650},
  {id:'petal-home-2',x:950,y:365},
  {id:'petal-home-3',x:515,y:895}
];

STICKERS.push(['🌟','Star Keeper']);
QUEST_TARGETS['home-magic']=[775,485];

const defaultQuestsV6=defaultQuests;
defaultQuests=function(){
  const qs=defaultQuestsV6();
  if(!qs.some(q=>q.id==='home-magic'))qs.push({
    id:'home-magic',
    title:'The Sleeping Star',
    text:'Help Pip and Mira wake the Dream Lantern between Home Valley and Magic Grove.',
    done:false,reward:15,xp:50,progress:0,target:5,icon:'🌟'
  });
  return qs;
};

function v6EnsureProfile(){
  if(!state.profile)return;
  state.profile.avatarV6=state.profile.avatarV6||{hair:'classic',accessory:'none'};
  state.profile.storyV6=state.profile.storyV6||{step:0,petals:[],restored:false,chapterComplete:false};
  state.profile.storyV6.petals=state.profile.storyV6.petals||[];
  state.profile.homeUpgrades=state.profile.homeUpgrades||[];
  if(!state.profile.quests.some(q=>q.id==='home-magic')){
    state.profile.quests.push({
      id:'home-magic',
      title:'The Sleeping Star',
      text:'Help Pip and Mira wake the Dream Lantern between Home Valley and Magic Grove.',
      done:false,reward:15,xp:50,progress:state.profile.storyV6.step||0,target:5,icon:'🌟'
    });
  }
  const q=state.profile.quests.find(q=>q.id==='home-magic');
  if(q&&!q.done)q.progress=Math.min(5,state.profile.storyV6.step||0);
}

function v6StoryStep(step,message){
  v6EnsureProfile();
  const story=state.profile.storyV6;
  if(step<=story.step)return;
  story.step=step;
  const q=state.profile.quests.find(q=>q.id==='home-magic');
  if(q&&!q.done)q.progress=Math.min(5,step);
  const open=(state.profile.quests||[]).filter(x=>!x.done);
  const storyIndex=open.findIndex(x=>x.id==='home-magic');
  if(storyIndex>=0)state.questCursor=storyIndex;
  saveProfile();updateQuestTracker();
  if(message)toastQuest('The Sleeping Star 🌟',message);
}

function v6StoryTarget(){
  if(!state.profile)return null;
  v6EnsureProfile();
  const story=state.profile.storyV6;
  if(story.chapterComplete)return null;
  if(story.step===0)return [775,485];
  if(story.step===1){
    const p=V6_DREAM_PETALS.find(x=>!story.petals.includes(x.id));
    return p?[p.x,p.y]:[355,430];
  }
  if(story.step===2)return [355,430];
  if(story.step===3)return [1510,530];
  return [1710,390];
}

function v6UpdateStoryTarget(){
  const target=v6StoryTarget();
  if(target)QUEST_TARGETS['home-magic']=target;
}

const initWorldV6=initWorld;
initWorld=function(){
  v6EnsureProfile();
  initWorldV6();
  if(!state.interactables.some(x=>x.action==='tower')){
    state.interactables.push({
      id:'moonflower-door',
      name:'Moonflower Tower',
      face:'🚪',
      x:1710,y:438,
      text:'The Moonflower Tower hums with sleeping starlight.',
      action:'tower'
    });
  }
  state.storyPetals=V6_DREAM_PETALS.map(p=>({...p,taken:state.profile.storyV6.petals.includes(p.id)}));
  v6UpdateStoryTarget();
};

function v6DrawDreamPetals(){
  if(!state.profile||!state.storyPetals||state.profile.storyV6.step!==1)return;
  const now=performance.now()/500;
  for(const p of state.storyPetals){
    if(p.taken)continue;
    ctx.save();
    ctx.translate(p.x,p.y+Math.sin(now+p.x*.01)*7);
    ctx.shadowBlur=22;ctx.shadowColor='#ff8ddd';
    v4Ellipse(0,0,29,29,'rgba(255,255,255,.72)');
    ctx.font='36px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🌸',0,0);
    ctx.strokeStyle='#fff7a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,37+Math.sin(now*1.7)*4,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
}

function v6CheckDreamPetals(){
  if(!state.profile||state.profile.storyV6.step!==1||!state.storyPetals)return;
  const story=state.profile.storyV6;
  for(const p of state.storyPetals){
    if(p.taken)continue;
    const p1=Math.hypot(state.player.x-p.x,state.player.y-p.y)<48;
    const p2=state.coop?.enabled&&Math.hypot(state.coop.player.x-p.x,state.coop.player.y-p.y)<48;
    if(!p1&&!p2)continue;
    p.taken=true;
    if(!story.petals.includes(p.id))story.petals.push(p.id);
    Audio.collect();spawnBurst(p.x,p.y,'#ff8ddd');spawnBurst(p.x,p.y,'#fff6a8');
    showCombo('DREAMPETAL! 🌸');
    addXP(3,'DreamPetal');
    saveProfile();
    const left=3-story.petals.length;
    if(left>0){
      toastQuest('DreamPetal Found! 🌸',left+' more glowing petal'+(left===1?'':'s')+' to find.');
      v6UpdateStoryTarget();
    }else{
      v6StoryStep(2,'All three DreamPetals are glowing. Take them home and find the Star Compass.');
      confetti();speak('All three DreamPetals found! Visit your Dream Home.');
    }
  }
}

const drawCollectiblesV6=drawCollectibles;
drawCollectibles=function(){drawCollectiblesV6();v6DrawDreamPetals()};

const updateLivingWorldV6=updateLivingWorld;
updateLivingWorld=function(dt){
  updateLivingWorldV6(dt);
  v6EnsureProfile();v6CheckDreamPetals();v6UpdateStoryTarget();
};

function v6DrawStoryWorld(){
  if(!state.profile)return;
  v6EnsureProfile();
  if(state.profile.storyV6.restored){
    ctx.save();
    ctx.translate(570,455);
    ctx.shadowBlur=28;ctx.shadowColor='#fff36b';
    v4Ellipse(0,0,25,25,'rgba(255,245,130,.7)');
    ctx.font='43px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🏮',0,0);
    for(let i=0;i<5;i++){
      const a=performance.now()/900+i*1.256;
      v4Ellipse(Math.cos(a)*38,Math.sin(a)*22,3,3,'#fff7b0');
    }
    ctx.restore();
  }
}

const drawWorldV6=drawWorld;
drawWorld=function(){drawWorldV6();v6DrawStoryWorld()};

function v6DrawAvatarStyle(c,x,y,s,profile){
  if(!profile)return;
  const av=profile.avatarV6||{hair:'classic',accessory:'none'};
  c.save();c.translate(x,y);
  if(av.hair==='spikes'){
    c.fillStyle='#513347';c.beginPath();
    for(let i=-2;i<=2;i++){const px=i*8*s;c.moveTo(px-5*s,-37*s);c.lineTo(px,-55*s-(Math.abs(i)%2)*4*s);c.lineTo(px+6*s,-37*s)}
    c.fill();
  }else if(av.hair==='puffs'){
    c.fillStyle='#5b3b50';c.beginPath();c.arc(-19*s,-39*s,10*s,0,7);c.arc(19*s,-39*s,10*s,0,7);c.fill();
  }else if(av.hair==='swoop'){
    c.fillStyle='#52354a';c.beginPath();c.ellipse(-6*s,-41*s,24*s,9*s,-.18,0,7);c.fill();
  }
  if(av.accessory==='star-glasses'){
    c.strokeStyle='#7358e6';c.lineWidth=3*s;c.beginPath();c.arc(-8*s,-24*s,6*s,0,7);c.arc(8*s,-24*s,6*s,0,7);c.moveTo(-2*s,-24*s);c.lineTo(2*s,-24*s);c.stroke();
  }else if(av.accessory==='explorer-cap'){
    c.font=(27*s)+'px serif';c.textAlign='center';c.fillText('🧢',0,-50*s);
  }else if(av.accessory==='magic-bow'){
    c.font=(24*s)+'px serif';c.textAlign='center';c.fillText('🎀',18*s,-43*s);
  }else if(av.accessory==='dino-hood'){
    c.font=(33*s)+'px serif';c.textAlign='center';c.fillText('🦖',0,-51*s);
  }else if(av.accessory==='star-crown'){
    c.font=(27*s)+'px serif';c.textAlign='center';c.fillText('👑',0,-51*s);
  }
  c.restore();
}

const drawPlayerV6=drawPlayer;
drawPlayer=function(){
  drawPlayerV6();
  if(!state.profile)return;
  v6DrawAvatarStyle(ctx,state.player.x,state.player.y-(state.vehicle?13:0),1,state.profile);
  if(state.coop?.enabled&&state.coop.profile){
    v6DrawAvatarStyle(ctx,state.coop.player.x,state.coop.player.y,1,state.coop.profile);
  }
};

function openAvatarStudio(){
  v6EnsureProfile();
  const av=state.profile.avatarV6;
  const hairs=[
    ['classic','Classic'],['spikes','Star Spikes'],['puffs','Cloud Puffs'],['swoop','Adventure Swoop']
  ];
  const accessories=[
    ['none','✨','None'],['star-glasses','🤓','Star Glasses'],['explorer-cap','🧢','Explorer Cap'],
    ['magic-bow','🎀','Magic Bow'],['dino-hood','🦖','Dino Hood'],['star-crown','👑','Star Crown']
  ];
  openModal(
    '<h2>🎨 DreamBound Avatar Studio</h2>'+
    '<div class="avatar-studio-preview" style="--avatar-color:'+state.profile.color+'">'+
      '<div class="avatar-preview-head"><span class="avatar-hair-label">'+escapeHTML(av.hair)+'</span><span class="avatar-accessory-preview">'+(accessories.find(x=>x[0]===av.accessory)?.[1]||'✨')+'</span></div>'+
      '<strong>'+escapeHTML(state.profile.name)+'</strong><small>Changes appear instantly in the world.</small>'+
    '</div>'+
    '<h3 class="studio-label">Hair</h3><div class="studio-options">'+hairs.map(x=>'<button class="studio-choice '+(av.hair===x[0]?'active':'')+'" data-hair="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
    '<h3 class="studio-label">Accessories</h3><div class="studio-options">'+accessories.map(x=>'<button class="studio-choice '+(av.accessory===x[0]?'active':'')+'" data-accessory="'+x[0]+'">'+x[1]+' '+x[2]+'</button>').join('')+'</div>'+
    '<button id="studioDone" class="big-btn primary">✨ SAVE MY LOOK</button>'
  );
  $$('.studio-choice[data-hair]').forEach(b=>b.onclick=()=>{av.hair=b.dataset.hair;saveProfile();openAvatarStudio()});
  $$('.studio-choice[data-accessory]').forEach(b=>b.onclick=()=>{av.accessory=b.dataset.accessory;saveProfile();openAvatarStudio()});
  $('#studioDone').onclick=()=>{saveProfile();closeModal();showCombo('NEW LOOK! ✨');Audio.success()};
}

function v6AddHomeExtras(){
  if(!$('#modalCard')||!state.profile)return;
  v6EnsureProfile();
  const actions=$('#modalCard .room-actions');
  if(actions&&!$('#avatarStudioBtn')){
    insertMarkup(actions,'beforeend','<button id="avatarStudioBtn">🎨 Avatar Studio</button>');
    $('#avatarStudioBtn').onclick=openAvatarStudio;
  }
  const room=$('#homeRoomWrap');
  if(room&&state.profile.storyV6.restored&&!$('#dreamLanternHome')){
    insertMarkup(room,'beforeend','<div id="dreamLanternHome" class="dream-lantern-home">🏮<span>Dream Lantern</span></div>');
  }
  if(state.profile.storyV6.step===2&&!$('#findCompassBtn')){
    const anchor=room||$('#modalCard h2');
    insertMarkup(anchor,'afterend',
      '<div class="story-card home-story-card"><span>🌸🧭</span><div><strong>The DreamPetals are humming!</strong><small>Search your room for the old Star Compass.</small></div><button id="findCompassBtn">FIND STAR COMPASS</button></div>'
    );
    $('#findCompassBtn').onclick=()=>{
      v6StoryStep(3,'You found the Star Compass! Bring it to Mira in Magic Grove.');
      Audio.success();confetti();closeModal();showCombo('STAR COMPASS! 🧭');speak('You found the Star Compass. Take it to Mira in Magic Grove.');
    };
  }
}

const openHomeBaseV6=openHomeBase;
openHomeBase=function(){openHomeBaseV6();v6AddHomeExtras()};

function openMoonflowerTower(){
  v6EnsureProfile();
  const story=state.profile.storyV6;
  let mission='';
  if(story.step<3)mission='<div class="tower-note">🔒 The highest chamber is sleeping. Pip may know what happened to the missing starlight.</div>';
  else if(story.step===3)mission='<div class="tower-note">🧭 The Star Compass points upward. Talk to Mira outside before entering the Star Chamber.</div>';
  else if(story.step===4)mission='<button id="openStarChamber" class="big-btn primary">🌟 ENTER THE STAR CHAMBER</button>';
  else mission='<div class="tower-note restored">🌟 The Dream Lantern is awake. Magic Grove sparkles because of you!</div>';
  openModal(
    '<h2>🪄 Moonflower Tower</h2>'+
    '<div class="tower-interior">'+
      '<div class="tower-window">🌙</div><div class="tower-shelf">📚 🔮 🧪</div>'+
      '<div class="tower-crystals"><span>💎</span><span>🔷</span><span>💜</span></div>'+
      '<div class="tower-rug">✦</div><div class="tower-mira">🧚</div>'+
    '</div>'+
    '<p class="coop-intro">An enterable magical interior filled with crystals, books, moonlight and the sleeping Star Chamber.</p>'+
    mission+
    '<div class="room-actions"><button id="towerLesson">🪄 Magic Lesson</button><button id="towerLeave">🚪 Leave Tower</button></div>'
  );
  $('#towerLesson').onclick=()=>{closeModal();openMagicLesson()};
  $('#towerLeave').onclick=closeModal;
  if($('#openStarChamber'))$('#openStarChamber').onclick=v6OpenStarChamber;
}

function v6OpenStarChamber(){
  const symbols=['🌙','⭐','💜','✨'];
  const len=difficulty()===0?3:difficulty()===1?4:5;
  const seq=Array.from({length:len},()=>symbols[Math.floor(Math.random()*symbols.length)]);
  let pos=0;
  openModal(
    '<h2>🌟 The Sleeping Star Chamber</h2>'+
    '<p class="coop-intro">Remember the starlight pattern to wake the Dream Lantern.</p>'+
    '<div id="v6StarSeq" class="star-chamber-sequence">'+seq.join(' ')+'</div>'+
    '<div id="v6StarChoices" class="spell-choice-row hidden">'+symbols.map(x=>'<button class="spell-choice">'+x+'</button>').join('')+'</div>'+
    '<div class="star-lantern-sleeping">🏮<span>sleeping...</span></div>'
  );
  setTimeout(()=>{
    if(!$('#v6StarSeq'))return;
    $('#v6StarSeq').textContent='✦ '.repeat(len);
    $('#v6StarChoices').classList.remove('hidden');
  },1600);
  $('#v6StarChoices .spell-choice').forEach(b=>b.onclick=()=>{
    if(b.textContent===seq[pos]){
      pos++;Audio.tone(520+pos*95,.08,'triangle');
      $('#v6StarSeq').textContent='✅ '.repeat(pos)+'✦ '.repeat(len-pos);
      if(pos===len)setTimeout(v6RestoreDreamLantern,320);
    }else{
      pos=0;Audio.tone(170,.13,'sawtooth');
      $('#v6StarSeq').textContent='✦ '.repeat(len);
      toastQuest('The star is still dreaming...','Good try! Start the starlight pattern again.');
    }
  });
}

function v6RestoreDreamLantern(){
  v6EnsureProfile();
  const story=state.profile.storyV6;
  if(story.chapterComplete)return;
  story.restored=true;story.chapterComplete=true;story.step=5;
  const q=state.profile.quests.find(q=>q.id==='home-magic');
  if(q&&!q.done){q.progress=5;completeQuest('home-magic')}
  unlockSticker('Star Keeper');
  state.profile.gems=(state.profile.gems||0)+8;
  saveProfile();updateHUD();Audio.success();confetti();
  openModal(
    '<h2>🌟 THE DREAM LANTERN IS AWAKE!</h2>'+
    '<div class="chapter-finale">🏡 ✨ 🏮 ✨ 🪄</div>'+
    '<p style="text-align:center;font-size:21px;font-weight:1000">Home Valley and Magic Grove are DreamLinked again!</p>'+
    '<div class="chapter-rewards"><span>⭐ 15 quest stars</span><span>💎 +8 gems</span><span>🎟️ Star Keeper</span><span>🏮 Dream Home Lantern</span></div>'+
    '<button id="v6FinaleDone" class="big-btn primary">CONTINUE THE ADVENTURE</button>'
  );
  $('#v6FinaleDone').onclick=()=>{closeModal();showCombo('STAR KEEPER! 🌟');speak('The Dream Lantern is awake! Home Valley and Magic Grove are shining together.')};
}

const talkToV6=talkTo;
talkTo=function(n){
  talkToV6(n);
  setTimeout(()=>{
    if(!state.talking||!state.profile)return;
    v6EnsureProfile();
    const story=state.profile.storyV6;
    if(n.action==='pip'){
      if(story.step===0)addTalkAction('🌟 THE SLEEPING STAR',()=>{
        closeTalk();v6StoryStep(1,'Pip says three DreamPetals fell across Home Valley. Find all three!');
        state.storyPetals=V6_DREAM_PETALS.map(p=>({...p,taken:story.petals.includes(p.id)}));
        v6UpdateStoryTarget();showCombo('STORY STARTED! 🌟');speak('Find three glowing DreamPetals around Home Valley.');
      });
      else if(story.step===1)addTalkAction('🌸 WHERE ARE THE PETALS?',()=>{closeTalk();toastQuest('Pip’s Hint','Look near the playground, the eastern hill, and the Wishing Well path.')});
    }
    if(n.action==='magic'&&story.step===3)addTalkAction('🧭 SHOW MIRA THE STAR COMPASS',()=>{
      closeTalk();v6StoryStep(4,'Mira opened the Moonflower Tower. Enter the Star Chamber and wake the Dream Lantern.');
      openMoonflowerTower();
    });
    if(n.action==='tower')addTalkAction('🚪 ENTER MOONFLOWER TOWER',()=>{closeTalk();openMoonflowerTower()});
  },100);
};

function v6DrawCreatureAnimated(c,i){
  const t=performance.now()/1000;
  const bob=Math.sin(t*3+i)*6;
  const sway=Math.sin(t*1.7+i*.8)*.08;
  const near=Math.hypot(state.player.x-c.x,state.player.y-c.y)<155;
  ctx.save();ctx.translate(c.x,c.y+bob);ctx.rotate(sway);
  ctx.shadowBlur=near?20:10;ctx.shadowColor=near?'#ff9cdc':'#ffffff';
  v4Ellipse(0,4,33,30,near?'rgba(255,244,252,.88)':'rgba(255,255,255,.66)');
  ctx.font='42px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.icon,0,0);
  ctx.font='16px serif';ctx.globalAlpha=.75+.25*Math.sin(t*2+i);ctx.fillText(i%2?'✨':'💖',24,-28);ctx.globalAlpha=1;
  ctx.restore();
  v4Shadow(c.x,c.y+29,22,7,.13);
  if(near){
    ctx.save();ctx.font='1000 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#5c4c91';ctx.lineWidth=5;ctx.strokeText(c.name,c.x,c.y-52+bob);ctx.fillText(c.name,c.x,c.y-52+bob);ctx.restore();
  }
}

drawCreatures=function(){state.creatures.forEach(v6DrawCreatureAnimated)};

const openHowV6=openHow;
openHow=function(){
  openHowV6();
  const grid=$('#modalCard .modal-grid');
  if(grid)insertMarkup(grid,'afterbegin',
    '<div class="menu-tile featured"><strong>🌟 The Sleeping Star</strong><small>A real story chapter now connects Home Valley, your Dream Home and Moonflower Tower.</small></div>'+
    '<div class="menu-tile featured"><strong>🎨 Avatar Studio</strong><small>Customize hair and playful accessories from your Dream Home.</small></div>'+
    '<div class="menu-tile featured"><strong>🚪 Enterable Tower</strong><small>Step inside Moonflower Tower for lessons and the Star Chamber.</small></div>'
  );
};


// ===== DreamBound v0.7.0-dev — THREE WORLDS EXPANSION =====
STICKERS.push(['🚪','Interior Explorer'],['🧭','Pathfinder']);
QUEST_TARGETS['deep-worlds']=[650,1530];

const defaultQuestsV7=defaultQuests;
defaultQuests=function(){
  const qs=defaultQuestsV7();
  if(!qs.some(q=>q.id==='deep-worlds'))qs.push({
    id:'deep-worlds',
    title:'The Lost Explorer Map',
    text:'Follow a mystery from Dino Valley to Builder Bay and beneath Ocean Cove.',
    done:false,reward:18,xp:60,progress:0,target:6,icon:'🧭'
  });
  return qs;
};

function v7EnsureProfile(){
  if(!state.profile)return;
  state.profile.storyV7=state.profile.storyV7||{
    step:0,fossilFragment:false,compassGear:false,pearlLens:false,mapRestored:false,chapterComplete:false,sonarWins:0
  };
  state.profile.interiorVisits=state.profile.interiorVisits||[];
  state.profile.submarineUnlocked=!!state.profile.submarineUnlocked;
  if(!state.profile.quests.some(q=>q.id==='deep-worlds')){
    state.profile.quests.push({
      id:'deep-worlds',title:'The Lost Explorer Map',
      text:'Follow a mystery from Dino Valley to Builder Bay and beneath Ocean Cove.',
      done:false,reward:18,xp:60,progress:state.profile.storyV7.step||0,target:6,icon:'🧭'
    });
  }
  const q=state.profile.quests.find(q=>q.id==='deep-worlds');
  if(q&&!q.done)q.progress=Math.min(6,state.profile.storyV7.step||0);
}

function v7VisitInterior(id){
  v7EnsureProfile();
  if(!state.profile.interiorVisits.includes(id)){
    state.profile.interiorVisits.push(id);
    addXP(3,'New interior');
    if(state.profile.interiorVisits.length>=3){
      unlockSticker('Interior Explorer');
      achievement('Interior Explorer');
      toastQuest('Interior Explorer! 🚪','You visited Fossil Hall, Maker Workshop, and the Ocean Discovery Center.');
    }
    saveProfile();
  }
}

function v7StoryStep(step,message){
  v7EnsureProfile();
  const story=state.profile.storyV7;
  if(step<=story.step)return;
  story.step=step;
  const q=state.profile.quests.find(q=>q.id==='deep-worlds');
  if(q&&!q.done)q.progress=Math.min(6,step);
  const open=(state.profile.quests||[]).filter(x=>!x.done);
  const idx=open.findIndex(x=>x.id==='deep-worlds');
  if(idx>=0)state.questCursor=idx;
  saveProfile();updateQuestTracker();v7UpdateStoryTarget();
  if(message)toastQuest('The Lost Explorer Map 🧭',message);
}

function v7StoryTarget(){
  if(!state.profile)return null;
  v7EnsureProfile();
  const s=state.profile.storyV7;
  if(s.chapterComplete)return null;
  if(s.step===0)return [650,1530];
  if(s.step===1)return [560,1630];
  if(s.step===2)return [1575,1460];
  if(s.step===3)return [1545,1670];
  if(s.step===4)return [2670,1590];
  return [2450,1740];
}
function v7UpdateStoryTarget(){const t=v7StoryTarget();if(t)QUEST_TARGETS['deep-worlds']=t}

const initWorldV7=initWorld;
initWorld=function(){
  v7EnsureProfile();
  initWorldV7();
  const extra=[
    {id:'fossil-hall-door',name:'Fossil Hall',face:'🏛️',x:560,y:1630,text:'A real museum built around the valley’s oldest discoveries.',action:'v7fossilhall'},
    {id:'maker-workshop-door',name:'Maker Workshop',face:'🏭',x:1545,y:1670,text:'Gears, blueprints and imagination power this workshop.',action:'v7maker'},
    {id:'ocean-center-door',name:'Ocean Discovery Center',face:'🐠',x:2450,y:1740,text:'Aquariums upstairs. A tiny explorer submarine waits below.',action:'v7ocean'}
  ];
  for(const e of extra)if(!state.interactables.some(x=>x.id===e.id))state.interactables.push(e);
  v7UpdateStoryTarget();
};

function v7DrawStructures(){
  // Fossil Hall
  ctx.save();
  v4Shadow(560,1668,86,22,.16);
  v4Panel(485,1548,150,108,'#e9d8ad','#fff7df',18);
  ctx.fillStyle='#8d7353';ctx.fillRect(505,1583,110,12);
  ctx.font='35px serif';ctx.textAlign='center';ctx.fillText('🦴',560,1592);
  ctx.font='900 12px sans-serif';ctx.fillStyle='#5c4d42';ctx.fillText('FOSSIL HALL',560,1634);
  // Maker Workshop
  v4Shadow(1545,1710,92,23,.16);
  v4Panel(1465,1582,160,118,'#735fe0','#fff',20);
  ctx.fillStyle='#ffcf5c';ctx.fillRect(1490,1610,110,14);
  ctx.font='36px serif';ctx.fillText('⚙️',1545,1645);
  ctx.font='900 12px sans-serif';ctx.fillStyle='#fff';ctx.fillText('MAKER WORKSHOP',1545,1682);
  // Ocean center
  v4Shadow(2450,1785,96,24,.14);
  ctx.fillStyle='rgba(220,251,255,.92)';ctx.strokeStyle='#fff';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(2450,1712,74,Math.PI,0);ctx.lineTo(2524,1770);ctx.lineTo(2376,1770);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.font='37px serif';ctx.fillText('🐠',2450,1728);
  ctx.font='900 11px sans-serif';ctx.fillStyle='#35617c';ctx.fillText('OCEAN DISCOVERY',2450,1760);
  ctx.restore();
}

const drawWorldV7=drawWorld;
drawWorld=function(){drawWorldV7();v7DrawStructures()};

const updateLivingWorldV7=updateLivingWorld;
updateLivingWorld=function(dt){updateLivingWorldV7(dt);v7EnsureProfile();v7UpdateStoryTarget()};

function openFossilHall(){
  v7EnsureProfile();v7VisitInterior('fossil');
  const s=state.profile.storyV7;
  let story='';
  if(s.step===1)story='<button id="v7ScanTablet" class="big-btn primary">🔎 SCAN THE MYSTERY FOSSIL TABLET</button>';
  else if(s.step===0)story='<div class="v7-story-note">🧭 Dottie keeps glancing at a strange stone tablet. Ask her about it.</div>';
  else story='<button id="v7MuseumScan" class="big-btn secondary">🦴 PRACTICE FOSSIL SCANNER</button>';
  openModal(
    '<h2>🦴 Fossil Hall</h2>'+
    '<div class="v7-interior fossil-hall">'+
      '<div class="museum-skeleton">🦖</div><div class="museum-cases"><span>🦴</span><span>🥚</span><span>🐾</span></div>'+
      '<div class="museum-desk">🔬 📜</div><div class="museum-banner">DINO VALLEY DISCOVERY LAB</div>'+
    '</div>'+
    '<p class="coop-intro">Walk through a real museum interior, inspect discoveries, and use the fossil scanner.</p>'+story+
    '<div class="room-actions"><button id="v7FossilDig">⛏️ Fossil Dig</button><button id="v7HallLeave">🚪 Leave Hall</button></div>'
  );
  if($('#v7ScanTablet'))$('#v7ScanTablet').onclick=()=>v7OpenFossilScanner(true);
  if($('#v7MuseumScan'))$('#v7MuseumScan').onclick=()=>v7OpenFossilScanner(false);
  $('#v7FossilDig').onclick=()=>{closeModal();openFossilGame()};
  $('#v7HallLeave').onclick=closeModal;
}

function v7OpenFossilScanner(storyRun){
  const symbols=['🦴','🐾','🥚','🌿'];
  const len=difficulty()===0?3:difficulty()===1?4:5;
  const seq=Array.from({length:len},()=>symbols[Math.floor(Math.random()*symbols.length)]);
  let pos=0,showing=true;
  openModal(
    '<h2>🔎 Fossil Scanner</h2>'+
    '<p class="coop-intro">Remember the fossil signal, then copy it into the scanner.</p>'+
    '<div id="v7FossilSeq" class="v7-sequence">'+seq.join(' ')+'</div>'+
    '<div id="v7FossilChoices" class="spell-choice-row hidden">'+symbols.map(x=>'<button class="spell-choice">'+x+'</button>').join('')+'</div>'+
    '<div class="v7-scanner-beam">▱ ▱ ▱ <span>SCANNING</span> ▱ ▱ ▱</div>'
  );
  setTimeout(()=>{
    if(!$('#v7FossilSeq'))return;
    showing=false;$('#v7FossilSeq').textContent='❔ '.repeat(len);$('#v7FossilChoices').classList.remove('hidden');
  },1500);
  $('#v7FossilChoices .spell-choice').forEach(b=>b.onclick=()=>{
    if(showing)return;
    if(b.textContent===seq[pos]){
      pos++;Audio.tone(480+pos*95,.07,'triangle');
      $('#v7FossilSeq').textContent='✅ '.repeat(pos)+'❔ '.repeat(len-pos);
      if(pos===len)setTimeout(()=>{
        if(storyRun&&state.profile.storyV7.step===1){
          state.profile.storyV7.fossilFragment=true;
          state.profile.fossils=(state.profile.fossils||0)+1;
          state.profile.gems+=3;addXP(10,'Mystery fossil tablet');
          v7StoryStep(2,'The tablet is part of an ancient Explorer Map. Take the fragment to Brix in Builder Bay.');
          saveProfile();updateHUD();Audio.success();confetti();
          openModal('<h2>🦴 MAP FRAGMENT FOUND!</h2><div class="v7-big-relic">📜🦴🧭</div><p class="coop-intro">The fossil lines are actually an ancient map! Brix may know how to rebuild its compass.</p><button id="v7FragmentDone" class="big-btn primary">TO BUILDER BAY!</button>');
          $('#v7FragmentDone').onclick=closeModal;
        }else{
          addXP(4,'Fossil scanner');state.profile.gems+=1;saveProfile();updateHUD();Audio.success();confetti();
          openModal('<h2>🔎 SCAN COMPLETE!</h2><div class="v7-big-relic">🦴✨</div><p class="coop-intro">Great scanning! You earned 1 💎.</p><button id="v7ScanDone" class="big-btn primary">DONE</button>');
          $('#v7ScanDone').onclick=closeModal;
        }
      },260);
    }else{
      pos=0;Audio.tone(170,.12,'sawtooth');$('#v7FossilSeq').textContent='❔ '.repeat(len);
    }
  });
}

function openMakerWorkshopV7(){
  v7EnsureProfile();v7VisitInterior('maker');
  const s=state.profile.storyV7;
  let story='';
  if(s.step===3)story='<button id="v7BuildCompass" class="big-btn primary">⚙️ BUILD THE DIVE COMPASS</button>';
  else if(s.step<3)story='<div class="v7-story-note">📐 Brix has a special project planned when the mystery map reaches Builder Bay.</div>';
  else story='<button id="v7GearPractice" class="big-btn secondary">⚙️ PRACTICE GEAR BUILDER</button>';
  openModal(
    '<h2>⚙️ Maker Workshop</h2>'+
    '<div class="v7-interior maker-lab">'+
      '<div class="maker-wall">📐 🗺️ 🔧</div><div class="maker-bench">⚙️ 🔩 🧭 ✨</div>'+
      '<div class="maker-crane">🪝</div><div class="maker-screen">DREAMLINK // BUILD READY</div>'+
    '</div>'+
    '<p class="coop-intro">Build gadgets on the workbench, study blueprints, and turn discoveries into useful explorer gear.</p>'+story+
    '<div class="room-actions"><button id="v7MakerBuild">🧱 Builder Mode</button><button id="v7MakerLeave">🚪 Leave Workshop</button></div>'
  );
  if($('#v7BuildCompass'))$('#v7BuildCompass').onclick=()=>v7OpenGearBuilder(true);
  if($('#v7GearPractice'))$('#v7GearPractice').onclick=()=>v7OpenGearBuilder(false);
  $('#v7MakerBuild').onclick=()=>{closeModal();toggleBuild(true)};
  $('#v7MakerLeave').onclick=closeModal;
}

function v7OpenGearBuilder(storyRun){
  const parts=['⚙️','🔩','🧭','✨'],labels=['GEAR','BOLT','COMPASS','STAR CORE'];
  let pos=0;
  openModal(
    '<h2>🛠️ Gear Builder</h2><p class="coop-intro">Build from the inside out. Choose each part in blueprint order.</p>'+
    '<div id="v7Blueprint" class="v7-blueprint">'+parts.map((x,i)=>'<span>'+x+'<small>'+labels[i]+'</small></span>').join('<b>→</b>')+'</div>'+
    '<div id="v7GearProgress" class="v7-gear-progress">○ ○ ○ ○</div>'+
    '<div class="spell-choice-row">'+parts.map(x=>'<button class="spell-choice v7-part">'+x+'</button>').join('')+'</div>'
  );
  $('.v7-part').forEach(b=>b.onclick=()=>{
    if(b.textContent===parts[pos]){
      pos++;Audio.tone(500+pos*100,.07,'square');
      $('#v7GearProgress').textContent='● '.repeat(pos)+'○ '.repeat(parts.length-pos);
      if(pos===parts.length)setTimeout(()=>{
        if(storyRun&&state.profile.storyV7.step===3){
          state.profile.storyV7.compassGear=true;state.profile.gems+=4;addXP(12,'Dive Compass');
          v7StoryStep(4,'The Dive Compass works! Take it to Bubbles at Ocean Cove.');
          saveProfile();updateHUD();Audio.success();confetti();
          openModal('<h2>⚙️ DIVE COMPASS BUILT!</h2><div class="v7-big-relic">⚙️🧭🌊</div><p class="coop-intro">Its needle points beneath Ocean Cove. Bubbles knows those waters best.</p><button id="v7GearDone" class="big-btn primary">TO OCEAN COVE!</button>');
          $('#v7GearDone').onclick=closeModal;
        }else{
          addXP(4,'Gear builder');state.profile.gems+=1;saveProfile();updateHUD();Audio.success();
          openModal('<h2>🛠️ GADGET COMPLETE!</h2><div class="v7-big-relic">⚙️✨</div><p class="coop-intro">Nice build! You earned 1 💎.</p><button id="v7PracticeDone" class="big-btn primary">DONE</button>');
          $('#v7PracticeDone').onclick=closeModal;
        }
      },220);
    }else{
      pos=0;Audio.tone(160,.11,'sawtooth');$('#v7GearProgress').textContent='○ ○ ○ ○';toastQuest('Blueprint Reset','Start with the gear and build outward.');
    }
  });
}

function openOceanDiscoveryCenter(){
  v7EnsureProfile();v7VisitInterior('ocean');
  const s=state.profile.storyV7;
  let story='';
  if(s.step===5)story='<button id="v7LaunchSub" class="big-btn primary">🚤 LAUNCH THE EXPLORER SUBMARINE</button>';
  else if(s.step<5)story='<div class="v7-story-note">🌊 The submarine dock is ready, but its navigation slot is empty.</div>';
  else story='<button id="v7RepeatSub" class="big-btn secondary">🌊 NEW SONAR EXPEDITION</button>';
  openModal(
    '<h2>🐠 Ocean Discovery Center</h2>'+
    '<div class="v7-interior ocean-center">'+
      '<div class="ocean-tank"><span>🐠</span><span>🐢</span><span>🪼</span></div>'+
      '<div class="ocean-console">SONAR<br><b>◉ ◌ ◉</b></div><div class="sub-dock">🚤</div><div class="ocean-porthole">🌊</div>'+
    '</div>'+
    '<p class="coop-intro">Explore the aquarium lab upstairs, then launch from the protected submarine dock below.</p>'+story+
    '<div class="room-actions"><button id="v7ShellGame">🐚 Shell Code</button><button id="v7OceanLeave">🚪 Leave Center</button></div>'
  );
  if($('#v7LaunchSub'))$('#v7LaunchSub').onclick=()=>v7OpenSubmarineExpedition(true);
  if($('#v7RepeatSub'))$('#v7RepeatSub').onclick=()=>v7OpenSubmarineExpedition(false);
  $('#v7ShellGame').onclick=()=>{closeModal();openShellGame()};
  $('#v7OceanLeave').onclick=closeModal;
}

function v7OpenSubmarineExpedition(storyRun){
  const dirs=['⬅️','⬆️','➡️','⬇️'];
  const len=difficulty()===0?3:difficulty()===1?4:5;
  const seq=Array.from({length:len},()=>dirs[Math.floor(Math.random()*dirs.length)]);
  let pos=0,showing=true;
  const coop=!!state.coop?.enabled;
  const controls=coop?
    '<div class="team-role-grid">'+
      '<div class="team-role p1"><strong>Player 1 Sonar</strong><div class="spell-choice-row">'+dirs.map(x=>'<button class="spell-choice v7-sonar" data-player="1">'+x+'</button>').join('')+'</div></div>'+
      '<div class="team-role p2"><strong>Player 2 Sonar</strong><div class="spell-choice-row">'+dirs.map(x=>'<button class="spell-choice v7-sonar" data-player="2">'+x+'</button>').join('')+'</div></div>'+
    '</div>':
    '<div class="spell-choice-row">'+dirs.map(x=>'<button class="spell-choice v7-sonar" data-player="1">'+x+'</button>').join('')+'</div>';
  openModal(
    '<h2>🌊 Explorer Submarine</h2>'+
    '<div class="v7-sub-window"><div class="v7-submarine">🚤</div><span>🐠</span><span>🫧</span><span>🪸</span><div class="v7-sonar-ring"></div></div>'+
    '<p class="coop-intro">'+(coop?'Take turns following the sonar trail together.':'Memorize the sonar trail and guide the submarine.')+'</p>'+
    '<div id="v7SonarSeq" class="v7-sequence">'+seq.join(' ')+'</div>'+controls
  );
  $('.v7-sonar').forEach(b=>b.disabled=true);
  setTimeout(()=>{
    if(!$('#v7SonarSeq'))return;
    showing=false;$('#v7SonarSeq').textContent='◌ '.repeat(len);$('.v7-sonar').forEach(b=>b.disabled=false);
  },1700);
  $('.v7-sonar').forEach(b=>b.onclick=()=>{
    if(showing)return;
    const player=+b.dataset.player;
    const expectedPlayer=coop?(pos%2)+1:1;
    if(player!==expectedPlayer){Audio.tone(175,.09,'sawtooth');toastQuest('Sonar Turn','Player '+expectedPlayer+' follows the next ping.');return}
    if(b.textContent===seq[pos]){
      pos++;Audio.tone(540+pos*85,.07,'sine');
      $('#v7SonarSeq').textContent='✅ '.repeat(pos)+'◌ '.repeat(len-pos);
      if(pos===len)setTimeout(()=>v7FinishSubmarineExpedition(storyRun),280);
    }else{
      pos=0;Audio.tone(150,.12,'sawtooth');$('#v7SonarSeq').textContent='◌ '.repeat(len);
      toastQuest('Sonar Trail Lost','No crash—just try the safe sonar trail again.');
    }
  });
}

function v7FinishSubmarineExpedition(storyRun){
  v7EnsureProfile();
  const s=state.profile.storyV7;
  if(storyRun&&s.step===5&&!s.chapterComplete){
    s.pearlLens=true;s.mapRestored=true;s.chapterComplete=true;s.step=6;s.sonarWins=(s.sonarWins||0)+1;
    state.profile.submarineUnlocked=true;
    state.profile.gems+=10;
    const q=state.profile.quests.find(q=>q.id==='deep-worlds');
    if(q&&!q.done){q.progress=6;completeQuest('deep-worlds')}
    unlockSticker('Pathfinder');achievement('Pathfinder');
    addXP(20,'Deep Sea Pathfinder');
    saveProfile();updateHUD();Audio.success();confetti();
    openModal(
      '<h2>🧭 THE LOST EXPLORER MAP IS RESTORED!</h2>'+
      '<div class="v7-finale">🦴 ➜ ⚙️ ➜ 🚤 ➜ 🧭✨</div>'+
      '<p class="coop-intro">The fossil fragment, Dive Compass, and Pearl Lens fit together. A whole new explorer route now glows across DreamBound.</p>'+
      '<div class="chapter-rewards"><span>⭐ 18 quest stars</span><span>💎 +10 gems</span><span>🎟️ Pathfinder</span><span>🚤 Submarine unlocked</span></div>'+
      '<button id="v7FinalDone" class="big-btn primary">KEEP EXPLORING!</button>'
    );
    $('#v7FinalDone').onclick=()=>{closeModal();showCombo('PATHFINDER! 🧭');speak('The Lost Explorer Map is restored. Your submarine is ready for future expeditions.')};
  }else{
    s.sonarWins=(s.sonarWins||0)+1;state.profile.gems+=2;addXP(6,'Sonar expedition');
    if(state.coop?.enabled&&state.coop.profile){state.coop.profile.gems+=2;v5AddXPToProfile(state.coop.profile,6);saveGuestProfile()}
    saveProfile();updateHUD();Audio.success();confetti();
    openModal('<h2>🌊 SONAR EXPEDITION COMPLETE!</h2><div class="v7-big-relic">🚤🐚✨</div><p class="coop-intro">You mapped another safe underwater route and earned 2 💎.</p><button id="v7SubDone" class="big-btn primary">SURFACE!</button>');
    $('#v7SubDone').onclick=closeModal;
  }
}

const talkToV7=talkTo;
talkTo=function(n){
  talkToV7(n);
  setTimeout(()=>{
    if(!state.talking||!state.profile)return;
    v7EnsureProfile();
    const s=state.profile.storyV7;
    const v6done=!!state.profile.storyV6?.chapterComplete;
    if(n.action==='dino'){
      if(!v6done)addTalkAction('🌟 FINISH THE SLEEPING STAR',()=>{closeTalk();toastQuest('Another mystery is waiting...','Wake the Dream Lantern first, then come back to Dottie.')});
      else if(s.step===0)addTalkAction('🧭 THE MYSTERY FOSSIL MAP',()=>{closeTalk();v7StoryStep(1,'Dottie found a fossil tablet covered in map lines. Scan it inside Fossil Hall.');showCombo('NEW CHAPTER! 🧭');speak('A new mystery begins in Fossil Hall.')});
      else if(s.step===1)addTalkAction('🦴 WHERE IS THE TABLET?',()=>{closeTalk();toastQuest('Dottie’s Hint','The Fossil Hall scanner can reveal lines hidden inside the stone.')});
    }
    if(n.action==='builder'&&s.step===2)addTalkAction('📜 SHOW BRIX THE MAP FRAGMENT',()=>{closeTalk();v7StoryStep(3,'Brix drew a blueprint for a Dive Compass. Build it inside the Maker Workshop.');openMakerWorkshopV7()});
    if(n.action==='ocean'&&s.step===4)addTalkAction('🧭 SHOW BUBBLES THE DIVE COMPASS',()=>{closeTalk();v7StoryStep(5,'The Dive Compass points under Ocean Cove. Launch the Explorer Submarine from the Discovery Center.');openOceanDiscoveryCenter()});
    if(n.action==='v7fossilhall')addTalkAction('🚪 ENTER FOSSIL HALL',()=>{closeTalk();openFossilHall()});
    if(n.action==='v7maker')addTalkAction('🚪 ENTER MAKER WORKSHOP',()=>{closeTalk();openMakerWorkshopV7()});
    if(n.action==='v7ocean')addTalkAction('🚪 ENTER DISCOVERY CENTER',()=>{closeTalk();openOceanDiscoveryCenter()});
  },120);
};

const openHowV7=openHow;
openHow=function(){
  openHowV7();
  const grid=$('#modalCard .modal-grid');
  if(grid)insertMarkup(grid,'afterbegin',
    '<div class="menu-tile featured"><strong>🧭 The Lost Explorer Map</strong><small>A connected chapter crosses Dino Valley, Builder Bay, and Ocean Cove.</small></div>'+
    '<div class="menu-tile featured"><strong>🚪 Three New Interiors</strong><small>Explore Fossil Hall, Maker Workshop, and the Ocean Discovery Center.</small></div>'+
    '<div class="menu-tile featured"><strong>🚤 Submarine Expeditions</strong><small>Unlock a repeatable safe sonar adventure beneath Ocean Cove.</small></div>'
  );
};

showScreen('titleScreen');
})();
