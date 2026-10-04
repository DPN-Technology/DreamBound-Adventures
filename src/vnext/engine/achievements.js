(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX)return;
const defs=[
  ['first-launch','🚀','First Launch','Reach the Moon.',s=>s.launched],
  ['moon-friend','🐇','Moon Friend','Rescue Luma.',s=>s.lumaRescued],
  ['event-rookie','🌌','Event Rookie','Complete 1 living-world event.',s=>(s.eventWins||0)>=1],
  ['event-master','☄️','Event Master','Complete 5 living-world events.',s=>(s.eventWins||0)>=5],
  ['architect','🏗️','Moon Architect','Build all 4 Moon Base modules.',s=>(s.baseModules||[]).length>=4],
  ['scholar','📚','World Scholar','Log 8 Codex discoveries.',s=>(s.codexEntries||[]).length>=8],
  ['social-star','🤝','Friendship Star','Reach friendship 5 with every explorer.',s=>['nova','gear','moss'].every(k=>(s.npcFriendship?.[k]||0)>=5)],
  ['best-buddy','💜','Best Moon Friends','Reach Luma Bond 10.',s=>(s.lumaBond||0)>=10],
  ['crystal-keeper','💠','Crystal Keeper','Hold 25 Moon crystals.',s=>(s.moonCrystals||0)>=25],
  ['quest-champion','🏆','Quest Champion','Complete 7 advanced quests.',s=>(s.completedQuests||[]).length>=7],
  ['world-walker','🥾','World Walker','Travel 50,000 world units.',s=>(s.totalDistance||0)>=50000],
  ['dreambound-master','🌟','DreamBound Master','Earn 9 other mastery achievements.',s=>(s.masteryAchievements||[]).length>=9]
];
function ensure(){if(!Array.isArray(DBX.state.masteryAchievements))DBX.state.masteryAchievements=[]}
function tick(){
  ensure();let changed=false;
  for(const [id,icon,title,desc,test] of defs){
    if(DBX.state.masteryAchievements.includes(id))continue;
    let yes=false;try{yes=!!test(DBX.state)}catch{}
    if(!yes)continue;
    DBX.state.masteryAchievements.push(id);changed=true;
    DBX.state.stars=Math.min(9999,(DBX.state.stars||0)+3);
    DBX.fx?.burst(DBX.state.player.x,DBX.state.player.y,icon);
    DBX.audio?.success();
    DBX.ui?.toast('Achievement: '+title,'+3 ⭐ · '+desc);
  }
  if(changed){DBX.storage.save();DBX.events.emit('hud:update')}
}
function mastery(){
  ensure();
  const completed=DBX.state.masteryAchievements.length;
  const quests=DBX.state.completedQuests?.length||0;
  const events=Math.min(10,DBX.state.eventWins||0);
  const base=DBX.state.baseModules?.length||0;
  return Math.min(100,Math.round((completed/defs.length)*55+(quests/7)*20+(events/10)*10+(base/4)*15));
}
function open(){
  ensure();
  const unlocked=new Set(DBX.state.masteryAchievements);
  const cards=defs.map(([id,icon,title,desc])=>'<article class="mastery-card '+(unlocked.has(id)?'unlocked':'locked')+'"><span>'+(unlocked.has(id)?icon:'🔒')+'</span><strong>'+title+'</strong><small>'+desc+'</small></article>').join('');
  DBX.ui.openModal(
    '<h2>🏆 Explorer Mastery</h2>'+
    '<div class="mastery-score"><b>'+mastery()+'%</b><span>DreamBound Mastery</span><i><em style="width:'+mastery()+'%"></em></i></div>'+
    '<div class="mastery-grid">'+cards+'</div>'+
    '<button id="masteryClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#masteryClose').onclick=DBX.ui.closeModal;
}
DBX.achievements={defs,ensure,tick,mastery,open};
ensure();
})();