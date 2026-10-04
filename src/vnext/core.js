(() => {
'use strict';
const DBX=window.DreamBoundVNext=window.DreamBoundVNext||{};
DBX.VERSION='1.1.0-dev';
DBX.WORLD={w:1800,h:1200};
function finitePrimitive(v,fallback=0){
  if(typeof v==='number')return Number.isFinite(v)?v:fallback;
  if(typeof v==='string'&&v.trim()!==''){
    const n=Number(v);return Number.isFinite(n)?n:fallback;
  }
  return fallback;
}
DBX.util={
  clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),
  dist:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),
  int:(v,min,max,fallback)=>Math.max(min,Math.min(max,Math.trunc(finitePrimitive(v,fallback)))),
  bool:(v,fallback=false)=>typeof v==='boolean'?v:fallback,
  num:(v,min,max,fallback)=>Math.max(min,Math.min(max,finitePrimitive(v,fallback))),
  list:(v,allowed,max=50)=>{
    if(!Array.isArray(v))return [];
    const set=allowed?new Set(allowed):null,out=[];
    for(const item of v){
      if(typeof item!=='string')continue;
      const clean=item.replace(/[<>\u0000-\u001f\u007f]/g,'').slice(0,48);
      if(!clean||set&&!set.has(clean)||out.includes(clean))continue;
      out.push(clean);if(out.length>=max)break;
    }
    return out;
  }
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
  stationVisited:false,
  stationGarden:false,
  roverUnlocked:false,
  roverActive:false,
  lumaRescued:false,
  lunarBadge:false,
  stationDiscoveries:[],
  completedQuests:[],
  lumaBond:0,
  sceneVisits:['surface'],
  badges:[],
  totalDistance:0,
  moonCrystals:0,
  baseModules:[],
  codexEntries:[],
  completedWorldEvents:[],
  npcFriendship:{nova:0,gear:0,moss:0},
  meteorSamples:0,
  auroraSeen:false,
  eventWins:0,
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
        dir:finitePrimitive(r.player?.dir,0),
        speed:250
      },
      questStep:DBX.util.int(r.questStep,0,5,0),
      signalSolved:DBX.util.bool(r.signalSolved,false),
      solarFixed:DBX.util.bool(r.solarFixed,false),
      rocketFixed:DBX.util.bool(r.rocketFixed,false),
      launched:DBX.util.bool(r.launched,false),
      moonRoute:DBX.util.bool(r.moonRoute,false),
      moonRocks:Array.isArray(r.moonRocks)?r.moonRocks.filter(x=>['rock-a','rock-b','rock-c'].includes(x)).slice(0,3):[],
      stationVisited:DBX.util.bool(r.stationVisited,false),
      stationGarden:DBX.util.bool(r.stationGarden,false),
      roverUnlocked:DBX.util.bool(r.roverUnlocked,false),
      roverActive:DBX.util.bool(r.roverActive,false),
      lumaRescued:DBX.util.bool(r.lumaRescued,false),
      lunarBadge:DBX.util.bool(r.lunarBadge,false),
      stationDiscoveries:DBX.util.list(r.stationDiscoveries,['Earthrise','Moon crystal pattern','Lunar dust sample'],3),
      completedQuests:DBX.util.list(r.completedQuests,['launch-path','lunar-guardian','station-scientist','buddy-bond'],4),
      lumaBond:DBX.util.num(r.lumaBond,0,10,0),
      sceneVisits:DBX.util.list(r.sceneVisits,['surface','station'],2),
      badges:DBX.util.list(r.badges,['Space Pathfinder','Lunar Guardian','Station Scientist','Best Moon Friends'],8),
      totalDistance:DBX.util.num(r.totalDistance,0,999999999,0),
      moonCrystals:DBX.util.int(r.moonCrystals,0,999,0),
      baseModules:DBX.util.list(r.baseModules,['habitat','observatory','garage','greenhouse'],4),
      codexEntries:DBX.util.list(r.codexEntries,['Earthrise','Moon crystal','Meteor shard','Aurora ribbon','Luma','Lunar moss','Rover blueprint','Dream signal'],20),
      completedWorldEvents:DBX.util.list(r.completedWorldEvents,['meteor-shower','crystal-bloom','aurora-wave','luma-parade'],8),
      npcFriendship:{
        nova:DBX.util.int(r.npcFriendship?.nova,0,10,0),
        gear:DBX.util.int(r.npcFriendship?.gear,0,10,0),
        moss:DBX.util.int(r.npcFriendship?.moss,0,10,0)
      },
      meteorSamples:DBX.util.int(r.meteorSamples,0,99,0),
      auroraSeen:DBX.util.bool(r.auroraSeen,false),
      eventWins:DBX.util.int(r.eventWins,0,99,0),
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
        stationVisited:s.stationVisited,stationGarden:s.stationGarden,roverUnlocked:s.roverUnlocked,
        roverActive:s.roverActive,lumaRescued:s.lumaRescued,lunarBadge:s.lunarBadge,
        stationDiscoveries:s.stationDiscoveries,completedQuests:s.completedQuests,lumaBond:s.lumaBond,
        sceneVisits:s.sceneVisits,badges:s.badges,totalDistance:s.totalDistance,
        moonCrystals:s.moonCrystals,baseModules:s.baseModules,codexEntries:s.codexEntries,
        completedWorldEvents:s.completedWorldEvents,npcFriendship:s.npcFriendship,
        meteorSamples:s.meteorSamples,auroraSeen:s.auroraSeen,eventWins:s.eventWins,
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