(() => {
'use strict';
const DBX=window.DreamBoundVNext;
const key='dreambound-vnext-settings-v1';
const defaults={audio:true,reducedMotion:false,highContrast:false,largeUI:false};
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(key)||'{}');
    return {
      audio:typeof raw.audio==='boolean'?raw.audio:true,
      reducedMotion:typeof raw.reducedMotion==='boolean'?raw.reducedMotion:false,
      highContrast:typeof raw.highContrast==='boolean'?raw.highContrast:false,
      largeUI:typeof raw.largeUI==='boolean'?raw.largeUI:false
    };
  }catch{return {...defaults}}
}
const state=load();
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{};apply()}
function apply(){
  document.documentElement.classList.toggle('reduced-motion',state.reducedMotion);
  document.documentElement.classList.toggle('high-contrast',state.highContrast);
  document.documentElement.classList.toggle('large-ui',state.largeUI);
  if(DBX.audio)DBX.audio.enabled=state.audio;
}
function open(){
  DBX.ui.openModal(
    '<h2>⚙️ Explorer Settings</h2><div class="settings-grid">'+
      toggle('Audio','Procedural sound effects','audio','🔊')+
      toggle('Reduced Motion','Fewer animated effects','reducedMotion','🫧')+
      toggle('High Contrast','Stronger interface contrast','highContrast','◐')+
      toggle('Large UI','Bigger buttons and text','largeUI','🔎')+
    '</div><button id="settingsClose" class="primary-btn">SAVE & CLOSE</button>'
  );
  document.querySelectorAll('[data-setting]').forEach(btn=>btn.onclick=()=>{
    const name=btn.dataset.setting;if(!(name in state))return;
    state[name]=!state[name];save();open();
  });
  document.querySelector('#settingsClose').onclick=DBX.ui.closeModal;
}
function toggle(title,desc,name,icon){
  return '<button class="setting-card '+(state[name]?'on':'')+'" data-setting="'+name+'"><span>'+icon+'</span><strong>'+title+'</strong><small>'+desc+'</small><b>'+(state[name]?'ON':'OFF')+'</b></button>';
}
DBX.settings={state,save,apply,open};
apply();
})();