(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const canvas=document.querySelector('#vnextCanvas');
const ctx=canvas.getContext('2d');
const minimap=document.querySelector('#vnextMinimap');
let last=performance.now(),near=null,cam={x:0,y:0},saveClock=0;

function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;
  canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(minimap){minimap.width=170;minimap.height=112}
}
function update(dt,t){
  DBX.fx?.update(dt);
  DBX.simulation?.step(dt);
  DBX.autonomousWorld?.tick(dt);
  DBX.emergentEcology?.tick(dt);
  if(!document.querySelector('#vnextModal').classList.contains('hidden'))return;
  DBX.worldEvents?.update(dt);
  DBX.worldSystems?.update(dt,t);
  DBX.cinematic?.update(dt);
  DBX.director?.update(dt);
  DBX.achievements?.tick();
  DBX.livingNpcs?.tick();
  const s=DBX.state,v=DBX.input.vector(),beforeX=s.player.x,beforeY=s.player.y;
  let handled=false;
  if(DBX.traversal?.handleMovement)handled=DBX.traversal.handleMovement(dt,v);
  if(!handled&&DBX.worldSystems?.movement)handled=DBX.worldSystems.movement(dt,v);
  if(!handled&&DBX.vehicle?.step)handled=DBX.vehicle.step(dt,v);
  if(!handled&&(v.x||v.y)){
    const speed=s.player.speed||250;
    s.player.x+=v.x*speed*dt;s.player.y+=v.y*speed*dt;
    if(DBX.scene?.id!=='station'&&!s.launched&&s.player.x>1230)s.player.x=1230;
    s.player.dir=Math.atan2(v.y,v.x);
  }
  if(DBX.scene?.clamp)DBX.scene.clamp(s.player);
  else{
    s.player.x=DBX.util.clamp(s.player.x,40,DBX.WORLD.w-40);
    s.player.y=DBX.util.clamp(s.player.y,60,DBX.WORLD.h-40);
  }
  const moved=Math.hypot(s.player.x-beforeX,s.player.y-beforeY);
  s.totalDistance=(s.totalDistance||0)+moved;

  const bounds=DBX.scene?.bounds||DBX.WORLD;
  cam.x+=(DBX.util.clamp(s.player.x-innerWidth/2,0,Math.max(0,bounds.w-innerWidth))-cam.x)*Math.min(1,dt*6);
  cam.y+=(DBX.util.clamp(s.player.y-innerHeight/2,0,Math.max(0,bounds.h-innerHeight))-cam.y)*Math.min(1,dt*6);

  const closest=DBX.world.currentInteractable();
  const radius=DBX.accessibility?.interactionRadius?.(110)||110;
  near=closest&&closest.d<radius?closest:null;
  const prompt=document.querySelector('#vnextPrompt');
  if(near){
    prompt.classList.remove('hidden');
    prompt.querySelector('strong').textContent=near.icon+' '+near.name;
    prompt.querySelector('span').textContent=near.hint;
  }else prompt.classList.add('hidden');

  if(DBX.input.consumeAction()){
    if(near)DBX.ui.interact(near);
    else if(s.lumaRescued)DBX.companion?.interact();
  }

  if(DBX.scene?.id!=='station'&&s.launched){
    for(const rock of DBX.world.rocks||[]){
      if(s.moonRocks.includes(rock.id))continue;
      if(Math.hypot(s.player.x-rock.x,s.player.y-rock.y)<52)DBX.ui.moonRock(rock.id);
    }
  }

  DBX.companion?.update(dt,t);
  saveClock+=dt;
  if(saveClock>1.1&&moved>0){saveClock=0;DBX.storage.save()}
  updateTelemetry();
}
function updateTelemetry(){
  const s=DBX.state;
  const energy=document.querySelector('#vnextEnergyBar');
  if(energy){
    const value=s.roverActive?(DBX.vehicle?.runtime.energy??100):100;
    energy.style.width=value+'%';
    energy.parentElement.classList.toggle('active',!!s.roverActive);
  }
  const bond=document.querySelector('#vnextBond');if(bond)bond.textContent=Math.floor(s.lumaBond||0)+'/10';
  const compass=document.querySelector('#vnextCompass');if(compass)compass.textContent=DBX.polish?.compassText()||'N';
  const zone=document.querySelector('#vnextZone');if(zone)zone.textContent=DBX.cinematic?.zoneName?.()||(DBX.scene?.id==='station'?'LUNAR STATION':(s.player.x>1250?'MOON SURFACE':'SPACE CENTER'));
  const crystals=document.querySelector('#vnextCrystals');if(crystals)crystals.textContent=s.moonCrystals||0;
  const eventWins=document.querySelector('#vnextEventWins');if(eventWins)eventWins.textContent=s.eventWins||0;
  const mastery=document.querySelector('#vnextMasteryValue');if(mastery)mastery.textContent=(DBX.achievements?.mastery?.()||0)+'%';
  const vehicle=document.querySelector('#vnextVehicle');if(vehicle)vehicle.textContent=DBX.traversal?.telemetry?.()||(s.roverActive?'🛻 MOON ROVER':DBX.worldSystems?.state.skimmerActive?'🛸 MOON SKIMMER':'🥾 ON FOOT');
}
function draw(t){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const shake=DBX.fx?.cameraOffset()||{x:0,y:0};
  ctx.save();ctx.translate(-cam.x+shake.x,-cam.y+shake.y);
  DBX.world.draw(ctx,t);
  DBX.polish?.drawAfterWorld(ctx,t);
  DBX.autonomousWorld?.drawZones(ctx,t);
  DBX.worldSystems?.draw(ctx,t);
  DBX.fx?.drawWorld(ctx,t);
  if(DBX.traversal?.state.selected==='glider')DBX.traversal.draw(ctx,t);
  else if(DBX.worldSystems?.state.skimmerActive)DBX.worldSystems.drawVehicle(ctx,t);
  else if(DBX.state.roverActive)DBX.vehicle?.draw(ctx,t);
  else drawPlayer(t);
  DBX.companion?.draw(ctx,t);
  ctx.restore();
  DBX.fx?.drawScreen(ctx,innerWidth,innerHeight,t);
  DBX.polish?.drawMinimap(minimap);
}
function drawPlayer(t){
  const p=DBX.state.player;
  ctx.save();ctx.translate(p.x,p.y);
  ctx.fillStyle='rgba(33,37,77,.22)';ctx.beginPath();ctx.ellipse(0,29,25,9,0,0,Math.PI*2);ctx.fill();
  const body=ctx.createLinearGradient(-20,-10,20,42);body.addColorStop(0,'#8b78ff');body.addColorStop(1,'#5143c5');
  ctx.fillStyle=body;ctx.beginPath();ctx.roundRect(-20,-10,40,52,16);ctx.fill();
  ctx.fillStyle='#ffd8bd';ctx.beginPath();ctx.arc(0,-22,19,0,Math.PI*2);ctx.fill();
  ctx.font='25px serif';ctx.textAlign='center';ctx.fillText('🪖',0,-29);
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-22,14,Math.PI*.1,Math.PI*.9);ctx.stroke();
  ctx.restore();
  if(!DBX.state.lumaRescued){
    const bx=p.x-46+Math.sin(t/500)*5,by=p.y+25+Math.cos(t/600)*4;
    ctx.font='30px serif';ctx.textAlign='center';ctx.fillText('🤖',bx,by);
  }
}
function loop(t){
  const dt=Math.min(.034,(t-last)/1000);last=t;DBX.accessibility?.sampleFrame?.(dt);update(dt,t);draw(t);requestAnimationFrame(loop);
}
document.querySelector('#vnextInteract').onclick=()=>DBX.input.requestAction();
document.querySelector('#vnextJournal').onclick=()=>DBX.quests?.renderJournal();
document.querySelector('#vnextSettings').onclick=()=>DBX.settings?.open();
document.querySelector('#vnextBuddy').onclick=()=>DBX.companion?.interact();
document.querySelector('#vnextCodex').onclick=()=>DBX.codex?.open();
document.querySelector('#vnextBase').onclick=()=>DBX.baseBuilder?.open();
document.querySelector('#vnextDirectorBtn').onclick=()=>DBX.director?.open();
document.querySelector('#vnextMastery').onclick=()=>DBX.achievements?.open();
document.querySelector('#vnextWorldSystems').onclick=()=>DBX.worldSystems?.open();
document.querySelector('#vnextReset').onclick=()=>{
  DBX.storage.reset();DBX.vehicle?.reset();DBX.ui.closeModal();DBX.ui.updateHUD();
  DBX.ui.toast('Adventure reset','v1.4 living-world progress cleared on this device.');
};
DBX.events.on('state:reset',()=>{cam={x:0,y:0}});
DBX.events.on('scene:changed',({id})=>{
  if(!DBX.state.sceneVisits.includes(id))DBX.state.sceneVisits.push(id);
  DBX.storage.save();cam={x:0,y:0};
});
DBX.input.bindTouch();
DBX.settings?.apply();
DBX.ui.updateHUD();DBX.quests?.tick();
resize();addEventListener('resize',resize);requestAnimationFrame(loop);
})();