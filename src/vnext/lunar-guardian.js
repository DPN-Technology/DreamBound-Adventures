(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.world||!DBX.ui)return;

const extras=[
  {id:'station-airlock',name:'Lunar Space Station',x:1375,y:610,icon:'🛸',action:'station',hint:'Enter the Lunar Station.',moon:true},
  {id:'rover-bay',name:'Moon Rover Bay',x:1570,y:735,icon:'🛻',action:'rover',hint:'Board or park the Moon Rover.',moon:true},
  {id:'luma-rescue',name:'Luma',x:1715,y:610,icon:'🐇',action:'rescue',hint:'A tiny Moon creature needs help.',moon:true}
];
for(const item of extras){
  if(!DBX.world.interactables.some(x=>x.id===item.id))DBX.world.interactables.push(item);
}

const oldDraw=DBX.world.draw.bind(DBX.world);
DBX.world.draw=(ctx,t)=>{
  oldDraw(ctx,t);
  const s=DBX.state;
  if(!s.launched)return;

  // Lunar station.
  ctx.save();
  ctx.fillStyle='#dfe8ff';ctx.strokeStyle='#8ea0d0';ctx.lineWidth=5;
  ctx.beginPath();ctx.roundRect(1300,500,150,105,24);ctx.fill();ctx.stroke();
  ctx.fillStyle='#7082b5';ctx.fillRect(1355,560,40,45);
  ctx.fillStyle='#8df4ff';ctx.beginPath();ctx.arc(1335,535,18,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(1415,535,18,0,Math.PI*2);ctx.fill();
  ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#414d78';ctx.fillText('LUNAR STATION',1375,492);

  // Rover bay and rover.
  ctx.fillStyle='#555b83';ctx.beginPath();ctx.roundRect(1510,680,120,72,18);ctx.fill();
  ctx.font='38px serif';ctx.fillText('🛻',1570,728);
  ctx.font='900 10px system-ui';ctx.fillStyle='#eef4ff';ctx.fillText('ROVER BAY',1570,670);

  // Rescue creature before completion.
  if(!s.lumaRescued){
    const bob=Math.sin(t/320)*5;
    ctx.font='38px serif';ctx.fillText('🐇',1715,610+bob);
    ctx.font='18px serif';ctx.fillText('✨',1742,582+bob);
  }

  // Rover under the explorer while active.
  if(s.roverActive&&!DBX.vehicle){
    ctx.save();ctx.translate(s.player.x,s.player.y+15);
    ctx.fillStyle='rgba(15,18,45,.22)';ctx.beginPath();ctx.ellipse(0,23,42,12,0,0,Math.PI*2);ctx.fill();
    ctx.font='53px serif';ctx.fillText('🛻',0,12);ctx.restore();
  }

  // Luma follows after rescue.
  if(s.lumaRescued&&!DBX.companion){
    const lx=s.player.x+58+Math.cos(t/420)*6,ly=s.player.y+20+Math.sin(t/350)*5;
    ctx.font='31px serif';ctx.fillText('🐇',lx,ly);ctx.font='14px serif';ctx.fillText('✨',lx+20,ly-22);
  }
  ctx.restore();
};

function fixedText(value){return String(value??'').replace(/[<>]/g,'').slice(0,80)}
function reward(stars,gems,label){
  DBX.state.stars+=stars;DBX.state.gems+=gems;DBX.storage.save();
  DBX.events.emit('hud:update');
  DBX.ui.toast(fixedText(label),'+'+stars+' ⭐  +'+gems+' 💎');
}
function openStation(){
  const s=DBX.state;
  if(!s.launched){DBX.ui.toast('Station offline','Reach the Moon first.');return};
  s.stationVisited=true;DBX.storage.save();DBX.ui.updateHUD();
  const garden=s.stationGarden
    ?'<div class="station-status good">🌱 Hydroponics online</div>'
    :'<button id="stationGardenBtn" class="primary-btn">🌱 RESTORE MOON GARDEN</button>';
  DBX.ui.openModal(
    '<h2>🛸 Lunar Space Station</h2>'+
    '<div class="station-interior">'+
      '<div class="station-window">🌕 ✨ 🌌</div>'+
      '<div class="station-core">🔋<small>POWER CORE</small></div>'+
      '<div class="station-garden">🌱 🪴 🌿<small>HYDROPONICS</small></div>'+
      '<div class="station-lab">🔬 🧪<small>DISCOVERY LAB</small></div>'+
    '</div>'+
    '<p>The station is a safe explorer lab above the Moon surface.</p>'+garden+
    '<div class="station-actions"><button id="stationObserve" class="small-btn">🔭 Observatory</button><button id="stationExit" class="small-btn">🚪 Exit</button></div>'
  );
  const g=document.querySelector('#stationGardenBtn');
  if(g)g.onclick=()=>gardenPuzzle();
  document.querySelector('#stationObserve').onclick=()=>DBX.ui.toast('Observation Deck','You spotted Earth, the Moon ridge, and a tiny moving sparkle.');
  document.querySelector('#stationExit').onclick=DBX.ui.closeModal;
}
function gardenPuzzle(){
  const steps=['💧','🌱','☀️','🫧'];
  let pos=0;
  DBX.ui.openModal(
    '<h2>🌱 Restore the Moon Garden</h2><p>Balance water, seed, light, and air in the right order.</p>'+
    '<div class="vnext-order">'+steps.map((x,i)=>'<span>'+x+'<small>'+(i+1)+'</small></span>').join('<b>→</b>')+'</div>'+
    '<div class="vnext-choices">'+[...steps].reverse().map(x=>'<button>'+x+'</button>').join('')+'</div>'+
    '<div id="gardenProgress" class="vnext-progress">○ ○ ○ ○</div><button id="gardenClose" class="small-btn">Close</button>'
  );
  document.querySelectorAll('.vnext-choices button').forEach(btn=>btn.onclick=()=>{
    if(btn.textContent===steps[pos]){
      pos++;document.querySelector('#gardenProgress').textContent='● '.repeat(pos)+'○ '.repeat(steps.length-pos);
      if(pos===steps.length)setTimeout(()=>{
        DBX.state.stationGarden=true;DBX.storage.save();DBX.ui.closeModal();reward(5,4,'Moon Garden restored!');DBX.ui.updateHUD();
      },220);
    }else{
      pos=0;document.querySelector('#gardenProgress').textContent='○ ○ ○ ○';
      DBX.ui.toast('Garden reset','No harm done—start with water.');
    }
  });
  document.querySelector('#gardenClose').onclick=DBX.ui.closeModal;
}
function toggleRover(){
  const s=DBX.state;
  if(!s.launched||!s.moonRoute){DBX.ui.toast('Rover locked','Map the Moon route first.');return}
  if(!s.stationGarden){DBX.ui.toast('Rover charging','Restore the station garden power loop first.');return}
  if(!s.roverUnlocked){
    s.roverUnlocked=true;s.roverActive=true;s.player.speed=430;
    DBX.storage.save();reward(4,3,'Moon Rover unlocked!');DBX.ui.updateHUD();
    DBX.ui.toast('Rover online','Drive across the Moon at explorer speed.');
    return;
  }
  s.roverActive=!s.roverActive;
  s.player.speed=s.roverActive?430:250;
  DBX.storage.save();DBX.ui.updateHUD();
  DBX.ui.toast(s.roverActive?'Rover boarded':'Rover parked',s.roverActive?'Use normal movement controls to drive.':'Back on foot.');
}
function rescueLuma(){
  const s=DBX.state;
  if(s.lumaRescued){DBX.ui.toast('Luma is safe','Your new Moon friend is following you.');return}
  if(!s.roverUnlocked||!s.roverActive){DBX.ui.toast('Luma needs the rover','Board the Moon Rover and bring its rescue kit.');return}
  const symbols=['💜','⭐','🫧','🌙'],seq=['💜','⭐','🫧','🌙'],chosen=[];
  DBX.ui.openModal(
    '<h2>🐇 Rescue Luma</h2><p>Luma is nervous. Send the gentle beacon code in order.</p>'+
    '<div id="lumaProgress" class="vnext-sequence">• • • •</div>'+
    '<div class="vnext-choices">'+symbols.map(x=>'<button>'+x+'</button>').join('')+'</div>'+
    '<button id="lumaClose" class="small-btn">Close</button>'
  );
  document.querySelectorAll('.vnext-choices button').forEach(btn=>btn.onclick=()=>{
    if(btn.textContent===seq[chosen.length]){
      chosen.push(btn.textContent);document.querySelector('#lumaProgress').textContent='✓ '.repeat(chosen.length)+'• '.repeat(4-chosen.length);
      if(chosen.length===4)setTimeout(()=>{
        s.lumaRescued=true;s.lunarBadge=true;s.roverActive=false;s.player.speed=250;
        DBX.storage.save();DBX.ui.closeModal();reward(10,6,'Lunar Guardian!');DBX.ui.updateHUD();
        DBX.ui.openModal('<h2>🌙 LUNAR GUARDIAN!</h2><div class="luma-finale">🛸 🛻 🐇 ✨</div><p>You restored the Space Station, powered the rover, and rescued Luma. Luma will now follow your explorer.</p><button id="lumaDone" class="primary-btn">KEEP EXPLORING</button>');
        document.querySelector('#lumaDone').onclick=DBX.ui.closeModal;
      },240);
    }else{
      chosen.length=0;document.querySelector('#lumaProgress').textContent='• • • •';
      DBX.ui.toast('Gentle beacon reset','Luma is safe. Try the friendly code again.');
    }
  });
  document.querySelector('#lumaClose').onclick=DBX.ui.closeModal;
}

const oldInteract=DBX.ui.interact.bind(DBX.ui);
DBX.ui.interact=object=>{
  if(object?.action==='station'){openStation();return}
  if(object?.action==='rover'){toggleRover();return}
  if(object?.action==='rescue'){rescueLuma();return}
  oldInteract(object);
};

const extendedObjective=()=>{
  const s=DBX.state;
  if(!s.signalSolved)return 'Decode the star signal in Mission Control.';
  if(!s.solarFixed)return 'Restore the Solar Array.';
  if(!s.rocketFixed)return 'Assemble the rocket in the Workshop.';
  if(!s.launched)return 'Launch from the Space Center.';
  if(!s.moonRoute)return 'Map a safe Moon rover route.';
  if(s.moonRocks.length<3)return 'Collect all 3 Moon rocks.';
  if(!s.stationVisited)return 'Enter the Lunar Space Station.';
  if(!s.stationGarden)return 'Restore the Moon Garden.';
  if(!s.roverUnlocked)return 'Activate the Moon Rover.';
  if(!s.lumaRescued)return 'Drive the rover to rescue Luma.';
  return 'Lunar Guardian complete — explore with Luma!';
};
DBX.ui.objectiveText=extendedObjective;
const oldUpdateHUD=DBX.ui.updateHUD.bind(DBX.ui);
DBX.ui.updateHUD=()=>{
  oldUpdateHUD();
  const s=DBX.state;
  const done=[
    s.signalSolved,s.solarFixed,s.rocketFixed,s.launched,s.moonRoute,s.moonRocks.length===3,
    s.stationVisited,s.stationGarden,s.roverUnlocked,s.lumaRescued
  ].filter(Boolean).length;
  const obj=document.querySelector('#vnextObjective'),bar=document.querySelector('#vnextProgress'),stage=document.querySelector('#vnextStage');
  if(obj)obj.textContent=extendedObjective();
  if(bar)bar.style.width=(done/10*100)+'%';
  if(stage)stage.textContent=Math.min(done+1,10)+'/10';
  const vehicle=document.querySelector('#vnextVehicle');
  if(vehicle){
    vehicle.textContent=s.roverActive?'🛻 ROVER MODE':'🥾 ON FOOT';
    vehicle.classList.toggle('active',!!s.roverActive);
  }
};
if(DBX.state.roverActive)DBX.state.player.speed=430;
DBX.ui.updateHUD();
})();