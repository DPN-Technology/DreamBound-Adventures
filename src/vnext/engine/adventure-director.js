(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX)return;

const runtime={timer:0,lastTier:-1,lastRecommendation:'',successStreak:0};

function score(){
  const s=DBX.state;
  let value=0;
  value+=(s.completedQuests?.length||0)*2;
  value+=(s.eventWins||0)*1.5;
  value+=(s.baseModules?.length||0)*2;
  value+=(s.codexEntries?.length||0)*.75;
  value+=Math.max(s.npcFriendship?.nova||0,s.npcFriendship?.gear||0,s.npcFriendship?.moss||0)*.5;
  value+=(s.lumaBond||0)*.4;
  value+=runtime.successStreak*.5;
  return value;
}
function tier(){
  const v=score();
  return v>=28?3:v>=16?2:v>=7?1:0;
}
function recommendation(){
  const s=DBX.state;
  if(!s.launched)return 'Finish launch training and reach the Moon.';
  if(!s.lumaRescued)return 'Follow the Lunar Guardian path and help Luma.';
  if((s.eventWins||0)<1)return 'Find and complete your first living-world event.';
  if((s.baseModules?.length||0)<1)return 'Collect Moon crystals and build your first base module.';
  if(Math.max(s.npcFriendship?.nova||0,s.npcFriendship?.gear||0,s.npcFriendship?.moss||0)<3)return 'Talk with Nova, Gear, or Moss and build a friendship.';
  if((s.codexEntries?.length||0)<6)return 'Hunt for discoveries and fill the DreamBound Codex.';
  if((s.baseModules?.length||0)<4)return 'Expand the Moon Base into a complete explorer outpost.';
  if((s.eventWins||0)<3)return 'Master more world events and unlock rare discoveries.';
  return 'Free-explore: deepen friendships, events, science, and base mastery.';
}
function challengeLength(base){
  const t=tier();
  return Math.max(2,Math.min(8,base+(t>=2?1:0)+(t>=3?1:0)));
}
function eventCadence(){
  return [58,48,38,30][tier()];
}
function update(dt){
  runtime.timer-=dt;
  if(runtime.timer>0)return;
  runtime.timer=2.5;
  const t=tier(),rec=recommendation();
  if(DBX.worldEvents?.runtime&&!DBX.worldEvents.runtime.active){
    DBX.worldEvents.runtime.nextIn=Math.min(DBX.worldEvents.runtime.nextIn,eventCadence());
  }
  const chip=document.querySelector('#vnextDirector');
  if(chip){
    chip.dataset.tier=String(t);
    chip.querySelector('b').textContent=['GUIDED','CURIOUS','BRAVE','MASTER'][t];
    chip.title=rec;
  }
  const line=document.querySelector('#vnextDirectorHint');
  if(line)line.textContent=rec;
  if(t!==runtime.lastTier){
    runtime.lastTier=t;
    DBX.events.emit('director:tier',{tier:t,score:score()});
  }
  runtime.lastRecommendation=rec;
}
function open(){
  const t=tier(),rec=recommendation();
  const levels=[
    ['🌱 Guided Explorer','Gentle pacing and frequent opportunities.'],
    ['🧭 Curious Explorer','More discoveries and slightly faster event pacing.'],
    ['🚀 Brave Explorer','Longer challenge patterns and denser world activity.'],
    ['🌟 Master Explorer','Full living-world pacing and advanced challenge lengths.']
  ];
  const cards=levels.map((x,i)=>'<article class="director-level '+(i===t?'active':'')+'"><span>'+x[0].split(' ')[0]+'</span><strong>'+x[0].slice(2)+'</strong><small>'+x[1]+'</small></article>').join('');
  DBX.ui.openModal(
    '<h2>🧠 DreamBound Adventure Director</h2>'+
    '<p>The world quietly adapts to progress without punishing mistakes.</p>'+
    '<div class="director-score">MASTERY SIGNAL <b>'+Math.round(score()*10)/10+'</b></div>'+
    '<div class="director-grid">'+cards+'</div>'+
    '<div class="director-recommendation"><strong>RECOMMENDED NEXT</strong><span>'+rec+'</span></div>'+
    '<button id="directorClose" class="primary-btn">BACK TO ADVENTURE</button>'
  );
  document.querySelector('#directorClose').onclick=DBX.ui.closeModal;
}
DBX.events.on('quest:complete',()=>{runtime.successStreak=Math.min(10,runtime.successStreak+1)});
DBX.events.on('worldevent:end',e=>{runtime.successStreak=e?.success?Math.min(10,runtime.successStreak+1):Math.max(0,runtime.successStreak-1)});
DBX.director={runtime,score,tier,recommendation,challengeLength,eventCadence,update,open};
})();