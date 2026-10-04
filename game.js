(() => {
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
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
function readStoredProfile(slot){
  const current=localStorage.getItem(profileKey(slot));
  if(current) return JSON.parse(current);
  const legacy=localStorage.getItem(legacyProfileKey(slot));
  if(!legacy) return null;
  const migrated=JSON.parse(legacy);
  migrated.brandMigratedFrom='WonderWorld Adventures';
  migrated.brandMigratedAt=Date.now();
  localStorage.setItem(profileKey(slot),JSON.stringify(migrated));
  return migrated;
}
function loadProfiles(){
  const wrap=$('#profileSlots'); wrap.innerHTML='';
  for(let i=0;i<3;i++){
    const p=readStoredProfile(i);
    const card=document.createElement('button'); card.className='profile-slot'; card.dataset.slot=i;
    if(p){ card.innerHTML=`<div class="profile-avatar" style="background:${p.color}">${p.buddy}</div><strong>${escapeHTML(p.name)}</strong><small>Age ${p.age} • ⭐ ${p.stars||0}</small>`; }
    else card.innerHTML='<div class="empty-plus">＋</div><strong>New Explorer</strong><small>Create a player</small>';
    card.onclick=()=>selectSlot(i,p); wrap.appendChild(card);
  }
}
function escapeHTML(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function selectSlot(slot,p){ Audio.click(); state.currentSlot=slot; if(p){ state.profile=p; startGame(); } else { setupCreator(); showScreen('creatorScreen'); } }
function setupCreator(){
  $('#nameInput').value=''; $('#ageSelect').value='6';
  const cc=$('#colorChoices');cc.innerHTML=''; COLORS.forEach((c,i)=>{const b=document.createElement('button');b.className='choice'+(i===0?' selected':'');b.style.background=c;b.dataset.color=c;b.onclick=()=>{$$('.choice','#colorChoices'); [...cc.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');drawAvatarPreview();};cc.appendChild(b)});
  const bc=$('#buddyChoices');bc.innerHTML=''; BUDDIES.forEach((e,i)=>{const b=document.createElement('button');b.className='choice'+(i===0?' selected':'');b.textContent=e;b.dataset.buddy=e;b.onclick=()=>{[...bc.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$('#buddyPreview').textContent=e;};bc.appendChild(b)});
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

function toggleBuild(force){state.buildMode=force??!state.buildMode; const bar=$('#buildToolbar');bar.classList.toggle('hidden',!state.buildMode);if(state.buildMode){bar.innerHTML='';BUILD_ITEMS.forEach(i=>{const b=document.createElement('button');b.className='build-tool'+(state.buildItem===i.id?' selected':'');b.title=`${i.label} • ${i.cost} gems`;b.innerHTML=`${i.icon}<small style="display:block;font-size:10px">💎${i.cost}</small>`;b.onclick=()=>{state.buildItem=i.id;[...bar.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');drawAvatarPreview();};bar.appendChild(b)});const done=document.createElement('button');done.className='build-tool';done.textContent='✅';done.onclick=()=>toggleBuild(false);bar.appendChild(done);toastQuest('Builder Mode','Click/tap the ground to place your creation.');} }
canvas.addEventListener('pointerdown',e=>{if(!state.buildMode)return; const r=canvas.getBoundingClientRect(),x=e.clientX-r.left+state.cam.x,y=e.clientY-r.top+state.cam.y;const item=BUILD_ITEMS.find(i=>i.id===state.buildItem), gems=state.profile.gems||0;if(gems<item.cost){toastQuest('Need More Gems!',`Explore the world and collect 💎 gems. ${item.label} costs ${item.cost}.`);Audio.tone(180,.15,'sawtooth');return}state.profile.gems-=item.cost;const o={id:'b'+Date.now(),item:item.id,x:Math.round(x),y:Math.round(y)};state.profile.buildings=state.profile.buildings||[];state.profile.buildings.push(o);state.objects.push({...o,type:'building'});spawnBurst(x,y,'#fff36b');Audio.success();updateHUD();saveProfile();completeQuest('build')});

function openModal(html){$('#modalCard').innerHTML=`<button class="close-modal" aria-label="Close">×</button>${html}`;$('#modalLayer').classList.remove('hidden');$('#modalCard .close-modal').onclick=closeModal;}
function closeModal(){if(state.raceStop){const stop=state.raceStop;state.raceStop=null;stop()}$('#modalLayer').classList.add('hidden');$('#modalCard').innerHTML=''}
function openJournal(){const qs=state.profile.quests.map(q=>`<div class="journal-item ${q.done?'done':''}"><strong>${q.done?'✅':'⭐'} ${q.title}</strong><div>${q.text}</div>${q.target&&!q.done?`<small>${q.progress||0}/${q.target}</small>`:''}</div>`).join('');openModal(`<h2>📖 Adventure Journal</h2><p style="text-align:center;font-weight:800">Every adventure helps DreamBound grow!</p>${qs}<h3>🏆 Stickers & Achievements</h3><div style="text-align:center;font-size:30px">${state.profile.achievements.length?state.profile.achievements.map(()=> '🌟').join(' '):'Go explore to earn your first one!'}</div>`)}
function openMap(){const current=zoneAt(state.player.x,state.player.y).name;openModal(`<h2>🗺️ DreamBound Explorer Map</h2><p style="text-align:center;font-weight:900">Tap any discovered land to fast-travel there.</p><div class="world-map-grid">${ZONES.map((z,i)=>{const seen=state.profile.discoveredZones.includes(z.name),photo=state.profile.photos.includes(z.name);return `<button class="map-zone ${seen?'seen':'locked'} ${z.name===current?'current':''}" data-i="${i}" ${seen?'':'disabled'}><span>${seen?z.emoji:'❔'}</span><strong>${seen?z.name:'Undiscovered Land'}</strong><small>${z.name===current?'📍 You are here':seen?(photo?'📸 Photo collected':'✨ Discovered'):'Keep exploring!'}</small></button>`}).join('')}</div><div class="map-stats"><span>🗺️ ${state.profile.discoveredZones.length}/6 lands</span><span>📸 ${state.profile.photos.length}/6 photos</span><span>🌠 ${state.profile.worldEvents||0} falling stars</span></div>`);$$('.map-zone.seen').forEach(b=>b.onclick=()=>{const z=ZONES[+b.dataset.i];state.player.x=z.x+z.w/2;state.player.y=z.y+z.h/2;state.buddy.x=state.player.x-50;state.buddy.y=state.player.y+35;closeModal();showZoneBanner(z);Audio.success()})}
function openSettings(){const s=state.profile.settings;openModal(`<h2>⚙️ Explorer Settings</h2><div class="settings-row"><strong>🗣️ Spoken instructions</strong><button id="narrToggle" class="toggle ${s.narration?'on':''}"></button></div><div class="settings-row"><strong>🌦️ Weather effects</strong><button id="weatherToggle" class="toggle ${s.weather?'on':''}"></button></div><div class="settings-row"><strong>🎯 Challenge level</strong><select id="diffSelect"><option value="adaptive" ${s.difficulty==='adaptive'?'selected':''}>Adaptive</option><option value="easy" ${s.difficulty==='easy'?'selected':''}>Gentle</option><option value="hard" ${s.difficulty==='hard'?'selected':''}>Big Brain</option></select></div><div class="settings-row"><strong>☀️ Change weather</strong><button id="changeWeather">Change</button></div><div class="settings-row"><strong>⏱️ Break reminder</strong><select id="breakSelect"><option value="0">Off</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></div><button id="saveExit" class="big-btn secondary">💾 Save & Choose Player</button>`);$('#narrToggle').onclick=e=>{s.narration=!s.narration;e.currentTarget.classList.toggle('on',s.narration);saveProfile()};$('#weatherToggle').onclick=e=>{s.weather=!s.weather;e.currentTarget.classList.toggle('on',s.weather);setWeather(s.weather?state.weather:'sunny');saveProfile()};$('#diffSelect').onchange=e=>{s.difficulty=e.target.value;saveProfile()};$('#changeWeather').onclick=()=>{const arr=['sunny','rain','sparkles'];setWeather(arr[(arr.indexOf(state.weather)+1)%arr.length])};$('#breakSelect').value=String(s.sessionLimit||0);$('#breakSelect').onchange=e=>{s.sessionLimit=+e.target.value;saveProfile()};$('#saveExit').onclick=()=>{saveProfile();state.running=false;closeModal();loadProfiles();showScreen('profileScreen')};}
function setWeather(w){state.weather=w;const l=$('#weatherLayer');l.innerHTML='';if(!state.profile?.settings?.weather)return;if(w==='rain'){for(let i=0;i<70;i++){const d=document.createElement('i');d.className='rain-drop';d.style.left=rand(0,100)+'%';d.style.top=rand(-100,30)+'%';d.style.animationDelay=rand(-1,0)+'s';d.style.animationDuration=rand(.6,1.1)+'s';l.appendChild(d)}}else if(w==='sparkles'){for(let i=0;i<22;i++){const d=document.createElement('span');d.textContent='✨';d.style.position='absolute';d.style.left=rand(0,100)+'%';d.style.top=rand(0,100)+'%';d.style.fontSize=rand(12,28)+'px';d.style.animation='twinkle '+rand(1,2.5)+'s infinite';l.appendChild(d)}}}

function difficulty(){const d=state.profile.settings.difficulty;if(d==='easy')return 0;if(d==='hard')return 2;return state.profile.age<=5?0:state.profile.age<=7?1:2}
function openMathGame(){let round=0,score=0;function next(){round++;if(round>5){state.profile.stars+=score;state.profile.buddyLevel=Math.min(9,(state.profile.buddyLevel||1)+(score>=4?1:0));updateHUD();saveProfile();completeQuest('brain');confetti();openModal(`<h2>⚡ Dream Machine Powered!</h2><div style="font-size:76px;text-align:center">🤖✨</div><p style="text-align:center;font-size:22px;font-weight:900">You earned ${score} bonus Dream Stars!</p><button id="mgDone" class="big-btn primary">BACK TO ADVENTURE</button>`);$('#mgDone').onclick=closeModal;return}const dif=difficulty(),a=Math.floor(rand(1,dif===0?6:dif===1?11:21)),b=Math.floor(rand(1,dif===0?5:dif===1?10:15)),op=(dif===2&&Math.random()>.55)?'-':'+',aa=op==='-'?Math.max(a,b):a,bb=op==='-'?Math.min(a,b):b,ans=op==='-'?aa-bb:aa+bb;let opts=[ans];while(opts.length<3){const v=Math.max(0,ans+Math.floor(rand(-4,5)));if(!opts.includes(v))opts.push(v)}opts.sort(()=>Math.random()-.5);openModal(`<div class="minigame"><h2>🧠 Brain Sparks</h2><div class="question-card"><small style="font-weight:900">POWER CELL ${round}/5</small><div class="question">${aa} ${op} ${bb} = ?</div><div class="answers">${opts.map(v=>`<button class="answer-btn" data-v="${v}">${v}</button>`).join('')}</div><p>Score: ⭐ ${score}</p></div></div>`);$$('.answer-btn').forEach(btn=>btn.onclick=()=>{if(+btn.dataset.v===ans){score++;Audio.success();btn.textContent='✅';speak('Great job!')}else{Audio.tone(180,.13,'sawtooth');btn.textContent='Try again!';speak('Almost! Let’s try another one.')}setTimeout(next,650)})}next()}
function openMemoryGame(){const dif=difficulty(),pairs=dif===0?3:dif===1?6:8,icons=['🥚','🦕','🦖','🌋','🦴','🌿','☄️','🐾'].slice(0,pairs),cards=[...icons,...icons].sort(()=>Math.random()-.5);let first=null,lock=false,matched=0;openModal(`<div class="minigame"><h2>🥚 Dino Egg Memory</h2><p style="text-align:center;font-weight:900">Find all the matching pairs!</p><div class="memory-grid" style="grid-template-columns:repeat(${pairs<=3?3:4},1fr)">${cards.map((v,i)=>`<button class="memory-card" data-i="${i}" data-v="${v}">?</button>`).join('')}</div></div>`);const btns=$$('.memory-card');btns.forEach(b=>b.onclick=()=>{if(lock||b.classList.contains('matched')||b===first)return;b.classList.add('flipped');b.textContent=b.dataset.v;if(!first){first=b;Audio.tone(500,.04);return}if(first.dataset.v===b.dataset.v){first.classList.add('matched');b.classList.add('matched');first=null;matched+=2;Audio.collect();if(matched===cards.length){setTimeout(()=>{state.profile.gems=(state.profile.gems||0)+3;updateHUD();saveProfile();completeQuest('brain');confetti();openModal(`<h2>🦕 Dino Detective!</h2><div style="font-size:80px;text-align:center">🥚✨🦕</div><p style="text-align:center;font-size:21px;font-weight:900">All eggs found! You earned 3 💎 gems.</p><button id="memDone" class="big-btn primary">KEEP EXPLORING</button>`);$('#memDone').onclick=closeModal},500)}}else{lock=true;setTimeout(()=>{first.classList.remove('flipped');b.classList.remove('flipped');first.textContent='?';b.textContent='?';first=null;lock=false},650)}})}
function openBreakModal(){openModal(`<h2>🌈 Adventure Break</h2><div style="font-size:70px;text-align:center">💧🧘🌳</div><p style="text-align:center;font-size:21px;font-weight:900">Great exploring! How about a stretch, a drink, or showing someone what you built?</p><button id="continueBtn" class="big-btn primary">I'M READY TO KEEP PLAYING</button>`);$('#continueBtn').onclick=()=>{state.sessionSeconds=0;closeModal()}}

function openHow(){openModal(`<h2>✨ Welcome to DreamBound!</h2><div class="modal-grid"><div class="menu-tile"><strong>🕹️ Explore</strong><small>Use arrow keys, WASD, touch controls, or a gamepad.</small></div><div class="menu-tile"><strong>✨ Talk & Discover</strong><small>Walk near friends and press Space/E or the sparkle button.</small></div><div class="menu-tile"><strong>⭐ Collect</strong><small>Find stars and gems hidden all over the world.</small></div><div class="menu-tile"><strong>🧱 Build</strong><small>Use gems to add your own creations to DreamBound.</small></div><div class="menu-tile"><strong>🧠 Play</strong><small>Mini-games quietly adjust to each explorer's age.</small></div><div class="menu-tile"><strong>💖 Grow</strong><small>Complete quests and become best friends with your DreamBuddy.</small></div><div class="menu-tile"><strong>🏎️ Race & Dig</strong><small>Race at the Ridge, dig fossils in Dino Valley, and unlock stickers.</small></div><div class="menu-tile"><strong>🪄 Learn Magic</strong><small>Visit Mira in Magic Grove and unlock playful spells.</small></div><div class="menu-tile"><strong>💖 DreamBuddy</strong><small>Pet, play and grow your friendship.</small></div><div class="menu-tile"><strong>📸 Photo Safari</strong><small>Photograph every land for your adventure book.</small></div><div class="menu-tile"><strong>🛴 Ride</strong><small>Unlock a safe scooter for faster exploring.</small></div><div class="menu-tile"><strong>🌠 World Events</strong><small>Chase surprise falling stars for special rewards.</small></div></div>`)}
function openParentGate(){let hold=0,timer=null;openModal(`<h2>🔒 Parent Corner</h2><p style="text-align:center;font-weight:800">Grown-up check: hold the button for 3 seconds.</p><button id="holdParent" class="big-btn secondary">HOLD FOR GROWN-UPS</button><div id="holdProgress" style="height:12px;background:#e8e4f7;border-radius:9px;overflow:hidden"><div style="height:100%;width:0;background:#6754e8"></div></div>`);const b=$('#holdParent'),bar=$('#holdProgress div');const start=()=>{hold=0;timer=setInterval(()=>{hold+=100;bar.style.width=Math.min(100,hold/30)+'%';if(hold>=3000){clearInterval(timer);openParentPanel()}},100)};const stop=()=>{clearInterval(timer);hold=0;bar.style.width='0%'};['pointerdown'].forEach(ev=>b.addEventListener(ev,start));['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop))}
function openParentPanel(){const profiles=[0,1,2].map(i=>readStoredProfile(i)).filter(Boolean);openModal(`<h2>👨‍👩‍👧 Parent Corner</h2><p style="text-align:center;font-weight:800">DreamBound stores progress only in this browser on this device.</p>${profiles.map(p=>`<div class="parent-profile-card"><div class="parent-avatar" style="background:${p.color}">${p.buddy}</div><div><strong>${escapeHTML(p.name)} • Age ${p.age}</strong><small>Explorer Level ${p.explorerLevel||1} • 💖 Buddy ${p.buddyLevel||1}</small><div class="parent-stat-row"><span>⭐ ${p.stars||0}</span><span>💎 ${p.gems||0}</span><span>✅ ${(p.quests||[]).filter(q=>q.done).length}/${(p.quests||[]).length||0}</span><span>📸 ${(p.photos||[]).length}/6</span><span>🐾 ${(p.creatures||[]).length}/${CREATURES.length}</span></div></div></div>`).join('')||'<p>No explorers yet.</p>'}<div class="settings-row"><strong>⏱️ Play-break reminders</strong><span>Each explorer can use 20, 30, or 45 minute reminders in ⚙️ Settings.</span></div><div class="settings-row"><strong>🧠 Adaptive challenge</strong><span>Activities automatically simplify for younger explorers and add challenge for older ones.</span></div><p style="font-size:13px;font-weight:800;color:#73799b">Safety: No ads, external links, purchases, analytics, public chat, online accounts, or strangers are included in this build.</p>`)}

// ===== DreamBound v0.2.0 ADVANCED ADVENTUR