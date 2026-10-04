(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX)return;
let timer=0,lastZone='';
function zoneName(){
  if(DBX.scene?.id==='station')return 'LUNAR SPACE STATION';
  const p=DBX.state.player;
  if(p.x<1250)return 'SPACE CENTER CAMPUS';
  if(p.y>960)return 'MOON BASE PLATEAU';
  if(p.x>1630&&p.y<800)return 'LUMA HOLLOW';
  if(p.x>1500)return 'CRYSTAL RIDGE';
  return 'TRANQUILITY BASIN';
}
function update(dt){
  timer-=dt;
  const name=zoneName();
  if(name!==lastZone&&timer<=0){
    lastZone=name;timer=4;
    const card=document.querySelector('#vnextCinematic');
    if(card){card.querySelector('small').textContent='NOW EXPLORING';card.querySelector('strong').textContent=name;card.classList.add('show');setTimeout(()=>card.classList.remove('show'),2600)}
    DBX.audio?.magic();
  }
}
DBX.events.on('worldevent:start',def=>{
  const card=document.querySelector('#vnextCinematic');if(!card)return;
  card.querySelector('small').textContent='WORLD EVENT';
  card.querySelector('strong').textContent=def.title.toUpperCase();
  card.classList.add('show');setTimeout(()=>card.classList.remove('show'),3000);
});
DBX.events.on('story:beat',beat=>{
  const card=document.querySelector('#vnextCinematic');if(!card)return;
  card.querySelector('small').textContent=beat?.label||'STORY';
  card.querySelector('strong').textContent=(beat?.title||'NEW CHAPTER').toUpperCase();
  card.classList.add('show');setTimeout(()=>card.classList.remove('show'),3400);
});
DBX.cinematic={update,zoneName};
})();