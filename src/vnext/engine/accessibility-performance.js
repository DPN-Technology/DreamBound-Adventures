(() => {
'use strict';
const DBX=window.DreamBoundVNext;
if(!DBX||!DBX.settings)return;

const KEY='dreambound-vnext-accessibility-v1';
const defaults=()=>({focusAssist:true,calmEffects:false,performance:'auto',showLabels:true});
function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const perf=['auto','quality','balanced','battery'].includes(r.performance)?r.performance:'auto';
  return {
    focusAssist:typeof r.focusAssist==='boolean'?r.focusAssist:true,
    calmEffects:typeof r.calmEffects==='boolean'?r.calmEffects:false,
    performance:perf,
    showLabels:typeof r.showLabels==='boolean'?r.showLabels:true
  };
}
function load(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return defaults()}}
const state=load();
const runtime={fps:60,frameAvg:16.7,quality:2,lastSample:performance.now(),frames:0,accum:0};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}apply()}
function desiredQuality(){
  if(state.performance==='quality')return 2;
  if(state.performance==='balanced')return 1;
  if(state.performance==='battery')return 0;
  if(DBX.settings.state.reducedMotion||state.calmEffects)return 0;
  return runtime.fps<42?0:runtime.fps<54?1:2;
}
function apply(){
  const root=document.documentElement;
  root.classList.toggle('focus-assist',state.focusAssist);
  root.classList.toggle('calm-effects',state.calmEffects);
  root.classList.toggle('show-world-labels',state.showLabels);
  root.dataset.performance=state.performance;
  runtime.quality=desiredQuality();
}
function sampleFrame(dt){
  const ms=Math.max(1,dt*1000);
  runtime.accum+=ms;runtime.frames++;
  const now=performance.now();
  if(now-runtime.lastSample>=1000){
    runtime.frameAvg=runtime.accum/Math.max(1,runtime.frames);
    runtime.fps=Math.round(1000/runtime.frameAvg);
    runtime.accum=0;runtime.frames=0;runtime.lastSample=now;
    const next=desiredQuality();
    if(next!==runtime.quality){
      runtime.quality=next;
      DBX.events.emit('performance:tier',{quality:next,fps:runtime.fps});
    }
  }
}
function particleBudget(base){
  const scale=[.35,.65,1][runtime.quality]??1;
  return Math.max(1,Math.round(base*scale));
}
function shouldAnimate(){
  return !DBX.settings.state.reducedMotion&&!state.calmEffects&&runtime.quality>0;
}
function interactionRadius(base=110){
  return state.focusAssist?Math.round(base*1.35):base;
}
function open(){
  DBX.ui.openModal(
    '<h2>♿ Explorer Accessibility+</h2>'+
    '<p>Make DreamBound easier to read, calmer to watch, and smoother on this device.</p>'+
    '<div class="settings-grid">'+
      toggle('Focus Assist','Larger interaction range and clearer nearby prompts','focusAssist','🎯')+
      toggle('Calm Effects','Reduce extra motion and visual intensity','calmEffects','🌙')+
      toggle('World Labels','Keep important world labels visible','showLabels','🏷️')+
    '</div>'+
    '<div class="director-score">PERFORMANCE <b>'+runtime.fps+' FPS</b></div>'+
    '<div class="director-grid">'+
      perf('auto','AUTO','Adapts effects to keep gameplay smooth.')+
      perf('quality','QUALITY','Full visual effects when the device can handle them.')+
      perf('balanced','BALANCED','Moderate effects and stable performance.')+
      perf('battery','BATTERY','Minimal effects for cooler, lighter play.')+
    '</div>'+
    '<button id="accessClose" class="primary-btn">SAVE & CLOSE</button>'
  );
  document.querySelectorAll('[data-access]').forEach(btn=>btn.onclick=()=>{
    const key=btn.dataset.access;if(!(key in state))return;
    state[key]=!state[key];save();open();
  });
  document.querySelectorAll('[data-performance]').forEach(btn=>btn.onclick=()=>{
    const mode=btn.dataset.performance;if(!['auto','quality','balanced','battery'].includes(mode))return;
    state.performance=mode;save();open();
  });
  document.querySelector('#accessClose').onclick=DBX.ui.closeModal;
}
function toggle(title,desc,name,icon){
  return '<button class="setting-card '+(state[name]?'on':'')+'" data-access="'+name+'"><span>'+icon+'</span><strong>'+title+'</strong><small>'+desc+'</small><b>'+(state[name]?'ON':'OFF')+'</b></button>';
}
function perf(mode,title,desc){
  return '<button class="director-level '+(state.performance===mode?'active':'')+'" data-performance="'+mode+'"><span>⚙️</span><strong>'+title+'</strong><small>'+desc+'</small></button>';
}
const oldOpen=DBX.settings.open.bind(DBX.settings);
DBX.settings.open=()=>{
  oldOpen();
  const card=document.querySelector('#vnextModalCard');
  if(card&&!document.querySelector('#accessibilityPlus')){
    const b=document.createElement('button');b.id='accessibilityPlus';b.className='primary-btn';b.textContent='♿ ACCESSIBILITY + PERFORMANCE';b.onclick=open;card.appendChild(b);
  }
};
DBX.events.on('state:reset',()=>{Object.assign(state,defaults());save()});
DBX.accessibility={state,runtime,apply,open,sampleFrame,particleBudget,shouldAnimate,interactionRadius};
apply();
})();