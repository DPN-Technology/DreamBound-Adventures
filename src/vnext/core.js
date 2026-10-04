(() => {
'use strict';
const DBX=window.DreamBoundVNext=window.DreamBoundVNext||{};
DBX.VERSION='0.8.0-dev';
DBX.WORLD={w:1800,h:1200};
DBX.util={
  clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),
  dist:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),
  int:(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback},
  bool:(v,fallback=false)=>typeof v==='boolean'?v:fallback
};
DBX.events=(()=>{
  const map=new Map();
  return {
    on(name,fn){if(!map.has(name))map.set(name,new Set());map.get(name).add(fn);return()=>map.get(name)?.delete(fn)},
    emit(name,payload){for(const fn of map.get(name)||[])try{fn(payload)}catch(err){console.error('[DreamBound vNext event]',name,err)}}
  };
})();
const defaults=()=>({
  player:{x:220,y:650,dir:0,speed:250},
  camera:{x:0,y:0},
  questStep:0,
  signalSolved:false,
  solarFixed:false,
  rocketFixed:false,
  launched:false,
  moonRoute:false,
  moonRocks:[],
  stars:0,
  gems:0,
  sessionStarted:Date.now()
});
DBX.state=defaults();
DBX.storage={
  key:'dreambound-vnext-space-v1',
  sanitize(raw){
    const d=defaults(),r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    return {
      ...d,
      player:{
        x:DBX.util.int(r.player?.x,40,DBX.WORLD.w-40,d.player.x),
        y:DBX.util.int(r.player?.y,60,DBX.WORLD.h-40,d.player.y),
        dir:Number.isFinite(Number(r.player?.dir))?Number(r.player.dir):0,
        speed:250
      },
      questStep:DBX.util.int(r.questStep,0,5,0),
      signalSolved:DBX.util.bool(r.signalSolved,false),
      solarFixed:DBX.util.bool(r.solarFixed,false),
      rocketFixed:DBX.util.bool(r.rocketFixed,false),
      launched:DBX.util.bool(r.launched,false),
      moonRoute:DBX.util.bool(r.moonRoute,false),
      moonRocks:Array.isArray(r.moonRocks)?r.moonRocks.filter(x=>['rock-a','rock-b','rock-c'].includes(x)).slice(0,3):[],
      stars:DBX.util.int(r.stars,0,9999,0),
      gems:DBX.util.int(r.gems,0,9999,0)
    };
  },
  load(){
    try{
      const raw=localStorage.getItem(this.key);
      DBX.state=raw?this.sanitize(JSON.parse(raw)):defaults();
    }catch{
      DBX.state=defaults();
      try{localStorage.removeItem(this.key)}catch{}
    }
    return DBX.state;
  },
  save(){
    try{
      const s=DBX.state;
      localStorage.setItem(this.key,JSON.stringify({
        player:s.player,questStep:s.questStep,signalSolved:s.signalSolved,solarFixed:s.solarFixed,
        rocketFixed:s.rocketFixed,launched:s.launched,moonRoute:s.moonRoute,moonRocks:s.moonRocks,
        stars:s.stars,gems:s.gems
      }));
    }catch{}
  },
  reset(){
    DBX.state=defaults();
    try{localStorage.removeItem(this.key)}catch{}
    DBX.events.emit('state:reset',DBX.state);
  }
};
DBX.storage.load();
})();