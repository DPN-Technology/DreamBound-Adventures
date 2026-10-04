(() => {
'use strict';
const BLOCKED=new Set(['SCRIPT','IFRAME','OBJECT','EMBED','META','BASE','LINK']);
const URL_ATTRS=new Set(['href','src','xlink:href','action','formaction']);
function safeUrl(value){
  const v=String(value||'').trim();
  if(!v||v.startsWith('#')||v.startsWith('/')||v.startsWith('./')||v.startsWith('../'))return true;
  if(/^data:image\/(png|gif|jpeg|webp);base64,/i.test(v))return true;
  try{
    const u=new URL(v,location.href);
    return u.origin===location.origin&&['http:','https:'].includes(u.protocol);
  }catch{return false}
}
function safeStyle(value){
  const v=String(value||'');
  if(/(?:url\s*\(|expression\s*\(|@import|javascript:|vbscript:|-moz-binding|behavior\s*:)/i.test(v))return '';
  return v.slice(0,4000);
}
function sanitizeTree(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT);
  const remove=[];
  while(walker.nextNode()){
    const el=walker.currentNode;
    if(BLOCKED.has(el.tagName)){remove.push(el);continue;}
    for(const attr of [...el.attributes]){
      const name=attr.name.toLowerCase();
      if(name.startsWith('on')||name==='srcdoc'||name==='nonce'){
        el.removeAttribute(attr.name);continue;
      }
      if(name==='style'){
        const clean=safeStyle(attr.value);
        if(clean)el.setAttribute('style',clean);else el.removeAttribute('style');
        continue;
      }
      if(URL_ATTRS.has(name)&&!safeUrl(attr.value))el.removeAttribute(attr.name);
    }
  }
  for(const el of remove)el.remove();
}
function fragment(markup){
  const doc=new DOMParser().parseFromString('<body>'+String(markup??'')+'</body>','text/html');
  sanitizeTree(doc.body);
  const out=document.createDocumentFragment();
  for(const node of [...doc.body.childNodes])out.appendChild(document.importNode(node,true));
  return out;
}
function setHTML(target,markup){
  if(!target)return target;
  target.replaceChildren(fragment(markup));
  return target;
}
function appendHTML(target,markup){
  if(!target)return target;
  target.appendChild(fragment(markup));
  return target;
}
function insertHTML(target,position,markup){
  if(!target)return target;
  const f=fragment(markup);
  if(position==='afterbegin')target.prepend(f);
  else if(position==='beforebegin')target.parentNode?.insertBefore(f,target);
  else if(position==='afterend')target.parentNode?.insertBefore(f,target.nextSibling);
  else target.appendChild(f);
  return target;
}
function clear(target){if(target)target.replaceChildren();return target}
window.DreamBoundDOM=Object.freeze({setHTML,appendHTML,insertHTML,clear});
})();