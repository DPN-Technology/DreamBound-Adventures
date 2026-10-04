(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const keys=new Set();
const held={up:false,down:false,left:false,right:false};
let action=false,lastPadAction=false;
function keyName(e){return String(e.key||'').toLowerCase()}
addEventListener('keydown',e=>{
  const k=keyName(e);keys.add(k);
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter','e'].includes(k))e.preventDefault();
  if(k===' '||k==='enter'||k==='e')action=true;
});
addEventListener('keyup',e=>keys.delete(keyName(e)));
function gamepad(){
  const pads=navigator.getGamepads?.()||[];
  return Array.from(pads).find(Boolean)||null;
}
function padVector(){
  const p=gamepad();if(!p)return {x:0,y:0};
  let x=Number(p.axes?.[0]||0),y=Number(p.axes?.[1]||0);
  if(Math.abs(x)<.18)x=0;if(Math.abs(y)<.18)y=0;
  const dx=(p.buttons?.[15]?.pressed?1:0)-(p.buttons?.[14]?.pressed?1:0);
  const dy=(p.buttons?.[13]?.pressed?1:0)-(p.buttons?.[12]?.pressed?1:0);
  x=DBX.util.clamp(x+dx,-1,1);y=DBX.util.clamp(y+dy,-1,1);
  return {x,y};
}
DBX.input={
  vector(){
    let x=(keys.has('arrowright')||keys.has('d')||held.right?1:0)-(keys.has('arrowleft')||keys.has('a')||held.left?1:0);
    let y=(keys.has('arrowdown')||keys.has('s')||held.down?1:0)-(keys.has('arrowup')||keys.has('w')||held.up?1:0);
    const pad=padVector();x+=pad.x;y+=pad.y;
    if(x||y){const len=Math.hypot(x,y);if(len>1){x/=len;y/=len}}
    return {x,y};
  },
  consumeAction(){
    const p=gamepad(),pressed=!!p?.buttons?.[0]?.pressed;
    const edge=pressed&&!lastPadAction;lastPadAction=pressed;
    const v=action||edge;action=false;return v;
  },
  requestAction(){action=true},
  boosting(){
    const p=gamepad();
    return keys.has('shift')||!!p?.buttons?.[7]?.pressed;
  },
  rumble(ms=80,strong=.35){
    const p=gamepad(),act=p?.vibrationActuator;
    if(!act?.playEffect)return;
    act.playEffect('dual-rumble',{duration:ms,strongMagnitude:strong,weakMagnitude:strong*.6}).catch(()=>{});
  },
  bindTouch(root=document){
    root.querySelectorAll('[data-move]').forEach(btn=>{
      const dir=btn.dataset.move,set=v=>{held[dir]=v};
      btn.addEventListener('pointerdown',e=>{e.preventDefault();set(true)});
      ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>set(false)));
    });
    root.querySelector('#vnextAction')?.addEventListener('pointerdown',e=>{e.preventDefault();action=true});
  }
};
})();