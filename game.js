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
    {id:'lighthouse',name:'Rainbow Lighthouse',face:'🗼',x:2910,y:1340,text:'The lighthouse be