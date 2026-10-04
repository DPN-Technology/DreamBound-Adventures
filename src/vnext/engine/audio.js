(() => {
'use strict';
const DBX=window.DreamBoundVNext;
let ctx=null,master=null,enabled=true;
function ensure(){
  if(!enabled)return null;
  if(!ctx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    ctx=new AC();master=ctx.createGain();master.gain.value=.14;master.connect(ctx.destination);
  }
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return ctx;
}
function tone(freq=440,duration=.08,type='sine',volume=.6,delay=0){
  const c=ensure();if(!c)return;
  const o=c.createOscillator(),g=c.createGain(),now=c.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(freq,now);
  g.gain.setValueAtTime(.0001,now);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.01);
  g.gain.exponentialRampToValueAtTime(.0001,now+duration);
  o.connect(g);g.connect(master);o.start(now);o.stop(now+duration+.03);
}
function chord(notes,duration=.16,type='triangle',volume=.22){
  notes.forEach((n,i)=>tone(n,duration,type,volume,i*.025));
}
function noise(duration=.12,volume=.12){
  const c=ensure();if(!c)return;
  const len=Math.max(1,Math.floor(c.sampleRate*duration));
  const buf=c.createBuffer(1,len,c.sampleRate),data=buf.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
  const src=c.createBufferSource(),g=c.createGain();src.buffer=buf;g.gain.value=volume;src.connect(g);g.connect(master);src.start();
}
DBX.audio={
  get enabled(){return enabled},
  set enabled(v){enabled=!!v;if(master)master.gain.value=enabled ? .14 : 0},
  click(){tone(540,.045,'square',.18)},
  collect(){chord([660,880],.08,'sine',.17)},
  success(){chord([523,659,784,1047],.22,'triangle',.18)},
  error(){tone(170,.12,'sawtooth',.12)},
  launch(){noise(.45,.08);tone(120,.7,'sawtooth',.13);tone(240,.8,'triangle',.08,.08)},
  rover(){tone(105,.06,'square',.08)},
  magic(){chord([740,988,1175],.18,'sine',.12)},
  station(){chord([330,494,659],.25,'sine',.1)}
};
addEventListener('pointerdown',()=>ensure(),{once:true});
addEventListener('keydown',()=>ensure(),{once:true});
})();