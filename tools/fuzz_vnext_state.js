#!/usr/bin/env node
'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/vnext/core.js','utf8');
const store=new Map();
const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(String(key),String(value)),
  removeItem:key=>store.delete(String(key))
};
const sandbox={
  window:{},localStorage,console,Date,Number,Math,Set,Map,JSON,String,Array,Object,Boolean,
  performance:{now:()=>0}
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'src/vnext/core.js'});
const DBX=sandbox.window.DreamBoundVNext;
assert(DBX&&DBX.storage&&typeof DBX.storage.sanitize==='function');

function scalar(){
  const pool=[
    null,undefined,true,false,0,-1,1e99,NaN,Infinity,-Infinity,
    '<script>alert(1)</script>','"><img src=x onerror=1>',
    '\u0000\u0001DreamBound','A'.repeat(10000),{},[],{toString(){throw new Error('hostile toString')}}
  ];
  return pool[Math.floor(Math.random()*pool.length)];
}
function randomValue(depth=0){
  if(depth>3||Math.random()<.45)return scalar();
  if(Math.random()<.45)return Array.from({length:Math.floor(Math.random()*40)},()=>randomValue(depth+1));
  const out={};
  const keys=[
    'player','x','y','dir','speed','questStep','signalSolved','solarFixed','rocketFixed','launched',
    'moonRoute','moonRocks','stationVisited','stationGarden','roverUnlocked','roverActive','lumaRescued',
    'lunarBadge','stationDiscoveries','completedQuests','lumaBond','sceneVisits','badges','totalDistance',
    'moonCrystals','baseModules','codexEntries','completedWorldEvents','npcFriendship','meteorSamples','auroraSeen','eventWins','stars','gems','__proto__','constructor','prototype'
  ];
  for(let i=0;i<Math.floor(Math.random()*25);i++)out[keys[Math.floor(Math.random()*keys.length)]]=randomValue(depth+1);
  return out;
}
function validate(s){
  assert(s&&typeof s==='object'&&!Array.isArray(s));
  assert(Number.isFinite(s.player.x)&&s.player.x>=40&&s.player.x<=1760);
  assert(Number.isFinite(s.player.y)&&s.player.y>=60&&s.player.y<=1160);
  assert(Number.isFinite(s.lumaBond)&&s.lumaBond>=0&&s.lumaBond<=10);
  assert(Number.isFinite(s.totalDistance)&&s.totalDistance>=0&&s.totalDistance<=999999999);
  assert(Number.isInteger(s.stars)&&s.stars>=0&&s.stars<=9999);
  assert(Number.isInteger(s.gems)&&s.gems>=0&&s.gems<=9999);
  assert(Array.isArray(s.moonRocks)&&s.moonRocks.length<=3);
  assert(s.moonRocks.every(x=>['rock-a','rock-b','rock-c'].includes(x)));
  assert(Array.isArray(s.stationDiscoveries)&&s.stationDiscoveries.length<=3);
  assert(s.stationDiscoveries.every(x=>['Earthrise','Moon crystal pattern','Lunar dust sample'].includes(x)));
  assert(Array.isArray(s.completedQuests)&&s.completedQuests.length<=7);
  assert(s.completedQuests.every(x=>['launch-path','lunar-guardian','station-scientist','buddy-bond','living-moon','moon-architect','world-scholar'].includes(x)));
  assert(Array.isArray(s.sceneVisits)&&s.sceneVisits.length<=2);
  assert(s.sceneVisits.every(x=>['surface','station'].includes(x)));
  assert(Array.isArray(s.badges)&&s.badges.length<=12);
  assert(Number.isInteger(s.moonCrystals)&&s.moonCrystals>=0&&s.moonCrystals<=999);
  assert(Array.isArray(s.baseModules)&&s.baseModules.length<=4);
  assert(s.baseModules.every(x=>['habitat','observatory','garage','greenhouse'].includes(x)));
  assert(Array.isArray(s.codexEntries)&&s.codexEntries.length<=20);
  assert(Array.isArray(s.completedWorldEvents)&&s.completedWorldEvents.length<=8);
  assert(s.npcFriendship&&['nova','gear','moss'].every(k=>Number.isInteger(s.npcFriendship[k])&&s.npcFriendship[k]>=0&&s.npcFriendship[k]<=10));
  assert(Number.isInteger(s.eventWins)&&s.eventWins>=0&&s.eventWins<=99);
}
validate(DBX.storage.sanitize({
  player:{x:Infinity,y:-1000,dir:{},speed:999999},
  moonRocks:['rock-a','<script>','rock-a',{},'rock-c'],
  stationDiscoveries:['Earthrise','<img>','Moon crystal pattern',{}],
  completedQuests:['launch-path','evil'],
  lumaBond:999,totalDistance:-5,stars:999999,gems:-500
}));
for(let i=0;i<3500;i++)validate(DBX.storage.sanitize(randomValue()));
console.log('DreamBound vNext state fuzz: PASS (3500 randomized inputs)');
