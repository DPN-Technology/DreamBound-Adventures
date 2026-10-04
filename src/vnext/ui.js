(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const objectiveText=()=>{
  const s=DBX.state;
  if(!s.signalSolved)return 'Decode the star signal in Mission Control.';
  if(!s.solarFixed)return 'Restore the Solar Array.';
  if(!s.rocketFixed)return 'Assemble the rocket in the Workshop.';
  if(!s.launched)return 'Launch from the Space Center.';
  if(!s.moonRoute)return 'Map a safe Moon rover route.';
  if(s.moonRocks.length<3)return 'Collect all 3 Moon rocks.';
  return 'Space Pathfinder complete — keep exploring the Moon!';
};
function openModal(html){
  $('#vnextModalCard').innerHTML=html;
  $('#vnextModal').classList.remove('hidden');
}
function closeModal(){$('#vnextModal').classList.add('hidden');$('#vnextModalCard').innerHTML=''}
function toast(title,text){
  const el=$('#vnextToast');el.innerHTML='<strong>'+title+'</strong><span>'+text+'</span>';el.classList.remove('hidden');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),2600);
}
function reward(stars,gems,label){
  DBX.state.stars+=stars;DBX.state.gems+=gems;DBX.storage.save();DBX.events.emit('hud:update');
  toast(label,'+'+stars+' ⭐  +'+gems+' 💎');
}
function sequencePuzzle({title,help,symbols,length,onWin}){
  const seq=Array.from({length},()=>symbols[Math.floor(Math.random()*symbols.length)]);
  let pos=0,locked=true;
  openModal(
    '<h2>'+title+'</h2><p>'+help+'</p>'+
    '<div id="vnextSeq" class="vnext-sequence">'+seq.join(' ')+'</div>'+
    '<div id="vnextChoices" class="vnext-choices">'+symbols.map(x=>'<button disabled>'+x+'</button>').join('')+'</div>'+
    '<button id="vnextClosePuzzle" class="small-btn">Close</button>'
  );
  setTimeout(()=>{
    const line=$('#vnextSeq');if(!line)return;
    locked=false;line.textContent='• '.repeat(length);$$('#vnextChoices button').forEach(b=>b.disabled=false);
  },1300);
  $$('#vnextChoices button').forEach(btn=>btn.addEventListener('click',()=>{
    if(locked)return;
    if(btn.textContent===seq[pos]){
      pos++;$('#vnextSeq').textContent='✓ '.repeat(pos)+'• '.repeat(length-pos);
      if(pos===length)setTimeout(()=>{closeModal();onWin()},250);
    }else{
      pos=0;$('#vnextSeq').textContent='• '.repeat(length);toast('Try the signal again','No penalty—start from the first symbol.');
    }
  }));
  $('#vnextClosePuzzle').onclick=closeModal;
}
function orderPuzzle({title,help,parts,onWin}){
  let pos=0;
  openModal(
    '<h2>'+title+'</h2><p>'+help+'</p>'+
    '<div id="vnextOrder" class="vnext-order">'+parts.map((p,i)=>'<span>'+p+'<small>'+(i+1)+'</small></span>').join('<b>→</b>')+'</div>'+
    '<div class="vnext-choices">'+[...parts].sort(()=>Math.random()-.5).map(p=>'<button>'+p+'</button>').join('')+'</div>'+
    '<div id="vnextOrderProgress" class="vnext-progress">○ '.repeat(parts.length)+'</div>'+
    '<button id="vnextCloseOrder" class="small-btn">Close</button>'
  );
  $$('.vnext-choices button').forEach(btn=>btn.onclick=()=>{
    if(btn.textContent===parts[pos]){
      pos++;$('#vnextOrderProgress').textContent='● '.repeat(pos)+'○ '.repeat(parts.length-pos);
      if(pos===parts.length)setTimeout(()=>{closeModal();onWin()},220);
    }else{
      pos=0;$('#vnextOrderProgress').textContent='○ '.repeat(parts.length);toast('Blueprint reset','Start from step 1. Nothing breaks.');
    }
  };
  $('#vnextCloseOrder').onclick=closeModal;
}
DBX.ui={
  openModal,closeModal,toast,objectiveText,
  updateHUD(){
    $('#vnextStars').textContent=DBX.state.stars;
    $('#vnextGems').textContent=DBX.state.gems;
    $('#vnextObjective').textContent=objectiveText();
    const done=[DBX.state.signalSolved,DBX.state.solarFixed,DBX.state.rocketFixed,DBX.state.launched,DBX.state.moonRoute].filter(Boolean).length;
    $('#vnextProgress').style.width=(done/5*100)+'%';
    $('#vnextStage').textContent=(done+1>5?5:done+1)+'/5';
  },
  interact(object){
    if(!object)return;
    const s=DBX.state;
    if(object.action==='signal'){
      if(s.signalSolved){toast('Mission Control','Star signal already decoded.');return}
      sequencePuzzle({
        title:'🛰️ Decode the Star Signal',help:'Watch the signal, then copy it.',
        symbols:['⭐','🌙','✨','🪐'],length:4,
        onWin(){s.signalSolved=true;s.questStep=Math.max(s.questStep,1);reward(3,1,'Signal decoded!');DBX.storage.save();DBX.ui.updateHUD()}
      });
      return;
    }
    if(object.action==='solar'){
      if(s.solarFixed){toast('Solar Array','Power is stable and ready.');return}
      orderPuzzle({
        title:'☀️ Restore Solar Power',help:'Connect the panels in the safe engineering order.',
        parts:['🔌','☀️','⚡'],
        onWin(){s.solarFixed=true;s.questStep=Math.max(s.questStep,2);reward(3,2,'Solar online!');DBX.storage.save();DBX.ui.updateHUD()}
      });
      return;
    }
    if(object.action==='rocket'){
      if(!s.signalSolved||!s.solarFixed){toast('Workshop locked','Decode the signal and restore solar power first.');return}
      if(s.rocketFixed){toast('Rocket Workshop','Rocket systems are ready.');return}
      orderPuzzle({
        title:'🛠️ Assemble the Explorer Rocket',help:'Build from guidance to power to launch.',
        parts:['🧭','🔋','🚀'],
        onWin(){s.rocketFixed=true;s.questStep=Math.max(s.questStep,3);reward(5,3,'Rocket ready!');DBX.storage.save();DBX.ui.updateHUD()}
      });
      return;
    }
    if(object.action==='launch'){
      if(!s.signalSolved||!s.solarFixed||!s.rocketFixed){toast('Launch check','Mission Control, Solar, and Rocket Workshop must all be green.');return}
      if(s.launched){toast('Launch Pad','Moon route is already open.');return}
      openModal(
        '<h2>🚀 Ready for Launch!</h2><div class="launch-card">3… 2… 1… 🌟</div>'+
        '<p>Your safe training rocket will open the Moon sector.</p><button id="vnextLaunchNow" class="primary-btn">LAUNCH!</button>'+
        '<button id="vnextLaunchCancel" class="small-btn">Not yet</button>'
      );
      $('#vnextLaunchNow').onclick=()=>{
        s.launched=true;s.questStep=Math.max(s.questStep,4);s.player.x=1370;s.player.y=860;
        DBX.storage.save();closeModal();reward(8,4,'Moon route unlocked!');DBX.ui.updateHUD();DBX.events.emit('launch');
      };
      $('#vnextLaunchCancel').onclick=closeModal;
      return;
    }
    if(object.action==='moon'){
      if(!s.launched){toast('Moon Console','Launch from the Space Center first.');return}
      if(s.moonRoute){toast('Rover Console','Safe route already mapped—collect Moon rocks!');return}
      sequencePuzzle({
        title:'🌕 Map the Moon Rover Route',help:'Copy the rover direction beacons.',
        symbols:['⬅️','⬆️','➡️','⬇️'],length:5,
        onWin(){s.moonRoute=true;s.questStep=5;reward(8,5,'Moon route mapped!');DBX.storage.save();DBX.ui.updateHUD()}
      });
    }
  },
  moonRock(id){
    if(DBX.state.moonRocks.includes(id))return;
    DBX.state.moonRocks.push(id);reward(2,1,'Moon rock collected!');
    DBX.storage.save();DBX.ui.updateHUD();
    if(DBX.state.moonRocks.length===3&&DBX.state.moonRoute){
      openModal('<h2>🌟 SPACE PATHFINDER!</h2><div class="finale-icons">🛰️ ☀️ 🚀 🌕 🪨</div><p>You powered the campus, built the rocket, reached the Moon, mapped the rover trail, and collected all three Moon rocks.</p><button id="vnextFinalDone" class="primary-btn">KEEP EXPLORING</button>');
      $('#vnextFinalDone').onclick=closeModal;
    }
  }
};
DBX.events.on('hud:update',()=>DBX.ui.updateHUD());
})();