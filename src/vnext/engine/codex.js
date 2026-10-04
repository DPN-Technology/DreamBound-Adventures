(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX)return;
const allEntries=[
  ['Earthrise','🌍','Sky Discovery'],['Moon crystal','💠','Lunar Resource'],['Meteor shard','☄️','Space Science'],
  ['Aurora ribbon','🌌','Rare Event'],['Luma','🐇','DreamCreature'],['Lunar moss','🌿','Moon Biology'],
  ['Rover blueprint','🛻','Engineering'],['Dream signal','🛰️','Navigation'],
  ['Cloud Fox','🦊','DreamCreature'],['Moon Rockhopper','🐾','DreamCreature'],['Lunar Moth','🦋','DreamCreature'],
  ['Star Sprite','✨','DreamCreature'],['Starwell Song','🎵','Story Discovery']
];
function open(){
  const unlocked=new Set(DBX.state.codexEntries||[]);
  if(DBX.state.lumaRescued)unlocked.add('Luma');
  if(DBX.state.stationDiscoveries?.includes('Earthrise'))unlocked.add('Earthrise');
  const entries=allEntries.map(([name,icon,type])=>{
    const yes=unlocked.has(name);
    return '<article class="codex-entry '+(yes?'unlocked':'locked')+'"><div>'+ (yes?icon:'❔') +'</div><strong>'+(yes?name:'Undiscovered')+'</strong><small>'+type+'</small></article>';
  }).join('');
  const friends=DBX.state.npcFriendship||{nova:0,gear:0,moss:0};
  DBX.ui.openModal(
    '<h2>📚 DreamBound Discovery Codex</h2>'+
    '<div class="codex-summary"><span><b>'+unlocked.size+'</b>/'+allEntries.length+' discoveries</span><span><b>'+DBX.state.eventWins+'</b> world events</span><span><b>'+DBX.state.baseModules.length+'</b>/4 base modules</span></div>'+
    '<div class="codex-grid">'+entries+'</div>'+
    '<div class="friend-roster"><strong>Explorer Friends</strong><span>👩‍🚀 Nova '+friends.nova+'/10</span><span>🧑‍🔧 Gear '+friends.gear+'/10</span><span>🧑‍🔬 Moss '+friends.moss+'/10</span></div>'+
    '<button id="codexClose" class="primary-btn">BACK TO WORLD</button>'
  );
  document.querySelector('#codexClose').onclick=DBX.ui.closeModal;
}
DBX.codex={open,allEntries};
})();