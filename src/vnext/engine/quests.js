(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const definitions=[
  {
    id:'launch-path',title:'🚀 Space Pathfinder',reward:{stars:8,gems:4},
    steps:[
      ['Decode Mission Signal',s=>s.signalSolved],['Restore Solar Array',s=>s.solarFixed],
      ['Assemble Explorer Rocket',s=>s.rocketFixed],['Launch to the Moon',s=>s.launched],
      ['Map Moon Route',s=>s.moonRoute],['Collect 3 Moon Rocks',s=>(s.moonRocks||[]).length>=3]
    ]
  },
  {
    id:'lunar-guardian',title:'🌙 Lunar Guardian',reward:{stars:14,gems:8},
    steps:[
      ['Enter Lunar Station',s=>s.stationVisited],['Restore Hydroponics',s=>s.stationGarden],
      ['Unlock Moon Rover',s=>s.roverUnlocked],['Rescue Luma',s=>s.lumaRescued]
    ]
  },
  {
    id:'station-scientist',title:'🔬 Station Scientist',reward:{stars:6,gems:5},
    steps:[
      ['Log Earthrise',s=>(s.stationDiscoveries||[]).includes('Earthrise')],
      ['Analyze a Moon sample',s=>(s.stationDiscoveries||[]).length>=2]
    ]
  },
  {
    id:'buddy-bond',title:'💜 Best Moon Friends',reward:{stars:7,gems:3},badge:'Best Moon Friends',
    steps:[['Reach Luma Bond 5',s=>(s.lumaBond||0)>=5]]
  },
  {
    id:'living-moon',title:'🌌 Living Moon Explorer',reward:{stars:10,gems:5},badge:'Living Moon Explorer',
    steps:[
      ['Complete a world event',s=>(s.eventWins||0)>=1],
      ['Reach friendship 3 with an explorer',s=>Math.max(s.npcFriendship?.nova||0,s.npcFriendship?.gear||0,s.npcFriendship?.moss||0)>=3],
      ['Build your first Moon Base module',s=>(s.baseModules||[]).length>=1]
    ]
  },
  {
    id:'moon-architect',title:'🏗️ Moon Architect',reward:{stars:14,gems:8},badge:'Moon Architect',
    steps:[
      ['Build Explorer Habitat',s=>(s.baseModules||[]).includes('habitat')],
      ['Build Sky Observatory',s=>(s.baseModules||[]).includes('observatory')],
      ['Build Rover Garage',s=>(s.baseModules||[]).includes('garage')],
      ['Build Moon Greenhouse',s=>(s.baseModules||[]).includes('greenhouse')]
    ]
  },
  {
    id:'world-scholar',title:'📚 World Scholar',reward:{stars:12,gems:7},badge:'World Scholar',
    steps:[
      ['Log 6 Codex discoveries',s=>(s.codexEntries||[]).length>=6],
      ['Complete 3 world events',s=>(s.eventWins||0)>=3],
      ['Reach friendship 5 with two explorers',s=>[s.npcFriendship?.nova||0,s.npcFriendship?.gear||0,s.npcFriendship?.moss||0].filter(v=>v>=5).length>=2]
    ]
  }
];
function ensure(){
  const s=DBX.state;
  s.completedQuests=Array.isArray(s.completedQuests)?s.completedQuests:[];
  s.stationDiscoveries=Array.isArray(s.stationDiscoveries)?s.stationDiscoveries:[];
  s.lumaBond=Number.isFinite(Number(s.lumaBond))?Math.max(0,Math.min(10,Number(s.lumaBond))):0;
}
function progress(q){
  ensure();const done=q.steps.filter(([,test])=>{try{return !!test(DBX.state)}catch{return false}}).length;
  return {done,total:q.steps.length,complete:done===q.steps.length};
}
function current(){
  ensure();return definitions.find(q=>!DBX.state.completedQuests.includes(q.id))||definitions[definitions.length-1];
}
function tick(){
  ensure();
  let changed=false;
  for(const q of definitions){
    if(DBX.state.completedQuests.includes(q.id))continue;
    const p=progress(q);
    if(!p.complete)continue;
    DBX.state.completedQuests.push(q.id);
    DBX.state.stars+=q.reward.stars;DBX.state.gems+=q.reward.gems;
    if(q.badge&&Array.isArray(DBX.state.badges)&&!DBX.state.badges.includes(q.badge))DBX.state.badges.push(q.badge);
    changed=true;
    DBX.fx?.flash(.55);DBX.fx?.burst(DBX.state.player.x,DBX.state.player.y,'🏆');DBX.audio?.success();
    DBX.ui?.toast('Quest Complete: '+q.title,'+'+q.reward.stars+' ⭐  +'+q.reward.gems+' 💎');
    DBX.events.emit('quest:complete',{id:q.id});
  }
  if(changed){DBX.storage.save();DBX.events.emit('hud:update')};
}
function renderJournal(){
  ensure();
  const rows=definitions.map(q=>{
    const p=progress(q),complete=DBX.state.completedQuests.includes(q.id);
    const steps=q.steps.map(([label,test])=>{
      let yes=false;try{yes=!!test(DBX.state)}catch{}
      return '<li class="'+(yes?'done':'')+'"><span>'+(yes?'✅':'○')+'</span>'+label+'</li>';
    }).join('');
    return '<article class="quest-card '+(complete?'complete':'')+'"><header><strong>'+q.title+'</strong><b>'+p.done+'/'+p.total+'</b></header><ul>'+steps+'</ul><small>Reward: '+q.reward.stars+' ⭐ · '+q.reward.gems+' 💎'+(q.badge?' · 🎟️ '+q.badge:'')+'</small></article>';
  }).join('');
  DBX.ui.openModal('<h2>📖 Explorer Mission Journal</h2><div class="quest-journal">'+rows+'</div><button id="questJournalClose" class="primary-btn">BACK TO ADVENTURE</button>');
  document.querySelector('#questJournalClose').onclick=DBX.ui.closeModal;
}
DBX.quests={definitions,ensure,progress,current,tick,renderJournal};
DBX.events.on('hud:update',tick);
DBX.events.on('milestone',tick);
setInterval(tick,1500);
ensure();
})();