(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const keys=new Set();
const held={up:false,down:false,left:false,right:false};
let action=false;
function keyName(e){return String(e.key||'').toLowerCase()}
addEventListener('keydown',e=>{
  const k=keyName(e);keys.add(k);
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter','e'].includes(k))e.preventDefault();
  if(k===' '||k==='enter'||k==='e')action=true;
});
addEventListener('keyup',e=>keys.delete(keyName(e)));
DBX.input={
  vector(){
    let x=(keys.has('arrowright')||keys.has('d')||held.right?1:0)-(keys.has('arrowleft')||keys.has('a')||held.left?1:0);
    let y=(keys.has('arrowdown')||keys.has('s')||held.down?1:0)-(keys.has('arrowup')||keys.has('w')||held.up?1:0);
    if(x||y){const len=Math.hypot(x,y);x/=len;y/=len}
    return {x,y};
  },
  consumeAction(){const v=action;action=false;return v},
  requestAction(){action=true},
  bindTouch(root=document){
    root.querySelectorAll('[data-move]').forEach(btn=>{
      const dir=btn.dataset.move;
      const set=v=>{held[dir]=v};
      btn.addEventListener('pointerdown',e=>{e.preventDefault();set(true)});
      ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>set(false)));
    });
    root.querySelector('#vnextAction')?.addEventListener('pointerdown',e=>{e.preventDefault();action=true});
  }
};
})();