(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DreamBoundSanitizer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ownObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const finite=(value,fallback=0)=>{
    if(typeof value==='number')return Number.isFinite(value)?value:fallback;
    if(typeof value==='string'&&value.trim()!==''){
      const n=Number(value);return Number.isFinite(n)?n:fallback;
    }
    return fallback;
  };
  const int=(value,min,max,fallback)=>Math.max(min,Math.min(max,Math.trunc(finite(value,fallback))));
  const bool=(value,fallback=false)=>typeof value==='boolean'?value:fallback;
  const cleanText=(value,max=64)=>{
    let text='';
    if(typeof value==='string')text=value;
    else if(typeof value==='number'||typeof value==='boolean'||typeof value==='bigint')text=String(value);
    else return '';
    return text.replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,max);
  };
  const enumValue=(value,allowed,fallback)=>(Array.isArray(allowed)?allowed:[]).includes(value)?value:fallback;
  const stringList=(value,allowed,max=100)=>{
    if(!Array.isArray(value))return [];
    const allowedSet=allowed?new Set(allowed):null,out=[];
    for(const item of value){
      const clean=cleanText(item,64);
      if(!clean||allowedSet&&!allowedSet.has(clean)||out.includes(clean))continue;
      out.push(clean);if(out.length>=max)break;
    }
    return out;
  };
  const safeTimestamp=value=>int(value,0,4102444800000,Date.now());

  function sanitizeSettings(raw){
    const s=ownObject(raw)?raw:{},session=int(s.sessionLimit,0,180,0);
    return {
      narration:bool(s.narration,true),
      reducedMotion:bool(s.reducedMotion,false),
      difficulty:enumValue(s.difficulty,['adaptive','easy','hard'],'adaptive'),
      weather:bool(s.weather,true),
      sessionLimit:[0,20,30,45,60,90,120].includes(session)?session:0
    };
  }

  function sanitizeQuests(raw,templates){
    const source=Array.isArray(raw)?raw:[],byId=new Map();
    for(const q of source){
      if(!ownObject(q))continue;
      const id=cleanText(q.id,48);if(id&&!byId.has(id))byId.set(id,q);
    }
    return (Array.isArray(templates)?templates:[]).map(template=>{
      const base=Object.assign({},template),old=byId.get(template.id);
      if(!old)return base;
      base.done=bool(old.done,false);
      if(Object.prototype.hasOwnProperty.call(base,'target')){
        base.progress=int(old.progress,0,Math.max(0,int(base.target,0,10000,0)),0);
      }
      return base;
    });
  }

  function sanitizeBuildings(raw,allowedItems,world){
    if(!Array.isArray(raw))return [];
    const allowed=new Set(Array.isArray(allowedItems)?allowedItems:[]);
    const width=int(world&&world.w,100,100000,3200),height=int(world&&world.h,100,100000,2200),out=[];
    for(const entry of raw){
      if(!ownObject(entry))continue;
      const item=cleanText(entry.item,32);if(!allowed.has(item))continue;
      out.push({
        id:cleanText(entry.id,64)||('safe-'+out.length),
        item,
        x:int(entry.x,0,width,Math.trunc(width/2)),
        y:int(entry.y,0,height,Math.trunc(height/2))
      });
      if(out.length>=250)break;
    }
    return out;
  }

  function sanitizeProfile(raw,ctx){
    if(!ownObject(raw))return null;
    const c=ownObject(ctx)?ctx:{};
    const colors=Array.isArray(c.colors)?c.colors:[],buddies=Array.isArray(c.buddies)?c.buddies:[];
    const zones=Array.isArray(c.zoneNames)?c.zoneNames:[],creatures=Array.isArray(c.creatureIds)?c.creatureIds:[];
    const stickerNames=Array.isArray(c.stickerNames)?c.stickerNames:[],landmarks=Array.isArray(c.landmarkIds)?c.landmarkIds:[];
    const questTemplates=Array.isArray(c.questTemplates)?c.questTemplates:[];
    const p={
      name:cleanText(raw.name,12)||'Explorer',
      age:int(raw.age,4,8,6),
      color:enumValue(raw.color,colors,colors[0]||'#735cff'),
      buddy:enumValue(raw.buddy,buddies,buddies[0]||'🐉'),
      stars:int(raw.stars,0,999999,0),gems:int(raw.gems,0,999999,0),
      buddyLevel:int(raw.buddyLevel,1,20,1),explorerLevel:int(raw.explorerLevel,1,100,1),xp:int(raw.xp,0,999999,0),
      achievements:stringList(raw.achievements,null,100),
      stickers:stringList(raw.stickers,stickerNames,100),
      creatures:stringList(raw.creatures,creatures,creatures.length||100),
      spells:stringList(raw.spells,['sparkle','grow','rainbow'],8),
      fossils:int(raw.fossils,0,9999,0),
      quests:sanitizeQuests(raw.quests,questTemplates),
      buildings:sanitizeBuildings(raw.buildings,c.buildItemIds,c.world),
      homeUpgrades:stringList(raw.homeUpgrades,['bed','plant','arcade','rocket'],16),
      homeStyle:enumValue(raw.homeStyle,['sky','forest','space','ocean'],'sky'),
      homeThemes:stringList(raw.homeThemes,['sky','forest','space','ocean'],4),
      settings:sanitizeSettings(raw.settings),
      created:safeTimestamp(raw.created),lastPlayed:safeTimestamp(raw.lastPlayed),
      position:{
        x:int(raw.position&&raw.position.x,0,(c.world&&c.world.w)||3200,530),
        y:int(raw.position&&raw.position.y,0,(c.world&&c.world.h)||2200,520)
      },
      taken:stringList(raw.taken,null,500),
      photos:stringList(raw.photos,zones,zones.length||20),
      discoveredZones:stringList(raw.discoveredZones,zones,zones.length||20),
      buddyPlays:int(raw.buddyPlays,0,99999,0),wishes:int(raw.wishes,0,99999,0),
      totalDistance:int(raw.totalDistance,0,999999999,0),worldEvents:int(raw.worldEvents,0,99999,0),
      landmarks:stringList(raw.landmarks,landmarks,landmarks.length||20),
      visualBadges:stringList(raw.visualBadges,null,50),
      coopGates:stringList(raw.coopGates,['home-link','builder-link','ocean-link'],3),
      coopSessions:int(raw.coopSessions,0,99999,0),teamworkPoints:int(raw.teamworkPoints,0,999999,0),
      coopActivities:stringList(raw.coopActivities,['repair','rescue','race','magic'],4),
      coopWins:int(raw.coopWins,0,99999,0),teamRescues:int(raw.teamRescues,0,99999,0),
      teamMagic:int(raw.teamMagic,0,99999,0),teamRepairs:int(raw.teamRepairs,0,99999,0),
      avatarV6:{
        hair:enumValue(raw.avatarV6&&raw.avatarV6.hair,['classic','spikes','puffs','swoop'],'classic'),
        accessory:enumValue(raw.avatarV6&&raw.avatarV6.accessory,['none','star-glasses','explorer-cap','magic-bow','dino-hood','star-crown'],'none')
      },
      storyV6:{
        step:int(raw.storyV6&&raw.storyV6.step,0,5,0),
        petals:stringList(raw.storyV6&&raw.storyV6.petals,['petal-home-1','petal-home-2','petal-home-3'],3),
        restored:bool(raw.storyV6&&raw.storyV6.restored,false),
        chapterComplete:bool(raw.storyV6&&raw.storyV6.chapterComplete,false)
      },
      storyV7:{
        step:int(raw.storyV7&&raw.storyV7.step,0,6,0),
        fossilFragment:bool(raw.storyV7&&raw.storyV7.fossilFragment,false),
        compassGear:bool(raw.storyV7&&raw.storyV7.compassGear,false),
        pearlLens:bool(raw.storyV7&&raw.storyV7.pearlLens,false),
        mapRestored:bool(raw.storyV7&&raw.storyV7.mapRestored,false),
        chapterComplete:bool(raw.storyV7&&raw.storyV7.chapterComplete,false),
        sonarWins:int(raw.storyV7&&raw.storyV7.sonarWins,0,99999,0)
      },
      interiorVisits:stringList(raw.interiorVisits,['fossil','maker','ocean'],3),
      submarineUnlocked:bool(raw.submarineUnlocked,false)
    };
    if(!p.homeThemes.includes('sky'))p.homeThemes.unshift('sky');
    if(!p.discoveredZones.length&&zones.includes('Home Valley'))p.discoveredZones=['Home Valley'];
    if(typeof raw.brandMigratedFrom==='string')p.brandMigratedFrom=cleanText(raw.brandMigratedFrom,64);
    if(raw.brandMigratedAt!==undefined)p.brandMigratedAt=safeTimestamp(raw.brandMigratedAt);
    return p;
  }
  return {sanitizeProfile,cleanText};
});
