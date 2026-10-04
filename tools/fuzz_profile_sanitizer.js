#!/usr/bin/env node
'use strict';
const assert=require('assert');
const {sanitizeProfile}=require('../profile-sanitizer.js');
const ctx={
  colors:['#735cff','#ff5fae','#35bdf1','#4fd57a','#ffb83f','#ff6b52'],
  buddies:['🐉','🤖','🦄','🐶','🐱','🦖','👽','🐼'],
  zoneNames:['Home Valley','Magic Grove','Racing Ridge','Dino Valley','Builder Bay','Ocean Cove'],
  creatureIds:['puff','sprout','tango','pebble','nibbles','tiny'],
  stickerNames:['Rainbow Finder','Robot Friend','Dino Detective','Racing Rookie','Fossil Finder','Magic Maker','Creature Helper','Master Builder','Ocean Explorer','Best Buddies','Photo Safari','World Explorer','Wish Maker','Star Chaser','Landmark Legend','Dream Team','Sibling Stars','Star Keeper'],
  landmarkIds:['homebase','moontower','speedway','museum','workshop','lighttower'],
  buildItemIds:['flower','tree','blocks','trampoline','tent','castle'],
  world:{w:3200,h:2200},
  questTemplates:[
    {id:'hello',title:'Meet Pip',text:'Safe template',done:false,reward:2,xp:8,icon:'🤖'},
    {id:'teamwork',title:'Dream Team',text:'Safe template',done:false,reward:10,xp:30,progress:0,target:3,icon:'🤝'},
    {id:'home-magic',title:'The Sleeping Star',text:'Safe template',done:false,reward:15,xp:50,progress:0,target:5,icon:'🌟'}
  ]
};
const explicit={name:'<img src=x onerror=alert(1)>',age:999,color:'red" onmouseover="alert(1)',buddy:'<script>alert(1)</script>',stars:-999,quests:[{id:'hello',title:'<svg/onload=1>',text:'evil',done:'yes',progress:99999}],settings:{difficulty:'root',sessionLimit:9999,narration:'yes'},buildings:[{id:'"><script>',item:'castle',x:Infinity,y:-9},{item:'not-real',x:2,y:2}],avatarV6:{hair:'"><img',accessory:'evil'},storyV6:{step:999,petals:['petal-home-1','<script>'],restored:'yes'},__proto__:{polluted:true}};
const safe=sanitizeProfile(explicit,ctx);
assert(safe);
assert(!/[<>]/.test(safe.name));
assert(ctx.colors.includes(safe.color));
assert(ctx.buddies.includes(safe.buddy));
assert(safe.age>=4&&safe.age<=8);
assert.strictEqual(safe.quests[0].title,'Meet Pip');
assert.strictEqual(safe.quests[0].text,'Safe template');
assert.strictEqual(safe.settings.difficulty,'adaptive');
assert.strictEqual(safe.settings.sessionLimit,0);
assert.strictEqual(safe.avatarV6.hair,'classic');
assert.strictEqual(safe.avatarV6.accessory,'none');
assert(safe.storyV6.step<=5);
assert(!({}).polluted);

function randomScalar(){
  const pool=[null,undefined,true,false,0,-1,1e50,NaN,Infinity,'<script>alert(1)</script>','"><img src=x onerror=1>','\u0000\u0001DreamBound','A'.repeat(5000),{},[],{__proto__:{x:1}}];
  return pool[Math.floor(Math.random()*pool.length)];
}
function randomValue(depth=0){
  if(depth>3||Math.random()<.45)return randomScalar();
  if(Math.random()<.5)return Array.from({length:Math.floor(Math.random()*30)},()=>randomValue(depth+1));
  const o={},keys=['name','age','color','buddy','stars','gems','settings','quests','buildings','position','avatarV6','storyV6','__proto__','constructor'];
  for(let i=0;i<Math.floor(Math.random()*20);i++)o[keys[Math.floor(Math.random()*keys.length)]]=randomValue(depth+1);
  return o;
}
for(let i=0;i<4000;i++){
  const result=sanitizeProfile(randomValue(),ctx);
  if(result===null)continue;
  assert(typeof result.name==='string'&&result.name.length<=12);
  assert(!/[<>]/.test(result.name));
  assert(ctx.colors.includes(result.color));
  assert(ctx.buddies.includes(result.buddy));
  assert(Number.isInteger(result.age)&&result.age>=4&&result.age<=8);
  assert(Array.isArray(result.quests)&&result.quests.length===ctx.questTemplates.length);
  assert(result.buildings.length<=250);
  assert(result.taken.length<=500);
  assert(result.achievements.length<=100);
  assert(result.coopGates.length<=3);
  assert(result.coopActivities.length<=4);
}
console.log('DreamBound profile sanitizer fuzz: PASS (4000 randomized inputs)');
