/* Embedded speech played with Web Audio, including inside an authenticated app tab. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s),cache=new Map();
 let ctx=null,source=null,current=null,rate=1,sequence=0,active=false;
 const fallback=document.createElement('audio');fallback.id='pronunciation-player';fallback.controls=true;fallback.preload='none';fallback.hidden=true;
 fallback.setAttribute('aria-label','เครื่องเล่นเสียงอ่านคำศัพท์สำรอง');
 function status(text){const el=$('#pronunciation-status');if(el)el.textContent=text;}
 function announce(value){document.dispatchEvent(new CustomEvent('study:speech',{detail:{active:value}}));}
 function sync(){
  document.querySelectorAll('[data-pronounce]').forEach(b=>{const selected=active&&Number(b.dataset.pronounce)===current&&Number(b.dataset.rate||1)===rate;b.classList.toggle('is-speaking',selected);b.setAttribute('aria-pressed',String(selected));});
  const stop=$('#pronunciation-stop');if(stop)stop.disabled=!active;
 }
 function stop(quiet=false){
  sequence++;const was=active;active=false;
  if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}
  fallback.pause();sync();announce(false);
  if(was&&!quiet)status('หยุดเสียงแล้ว · แตะปุ่มบนการ์ดเพื่อฟังอีกครั้ง');
 }
 async function bufferFor(clip,index){
  if(cache.has(index))return cache.get(index);
  let bytes;
  if(clip.src.startsWith('data:audio/wav;base64,')){const raw=atob(clip.src.split(',')[1]);bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;}
  else{const response=await fetch(clip.src,{credentials:'same-origin'});if(!response.ok)throw Error('audio unavailable');bytes=await response.arrayBuffer();}
  const buffer=await ctx.decodeAudioData(bytes);cache.set(index,buffer);return buffer;
 }
 async function speak(index,speed=1){
  const clip=window.STUDY_VOICE?.words[index];if(!clip||clip.term!==window.STUDY.vocab[index]?.[0])return;
  stop(true);current=index;rate=speed===.75?.75:1;active=true;const request=sequence;
  sync();announce(true);status(`กำลังเตรียมเสียง “${clip.term}”...`);
  try{
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC){
    const slot=$('#pronunciation-native');if(slot){slot.append(fallback);fallback.hidden=false;}
    fallback.src=clip.src;fallback.volume=1;fallback.muted=false;fallback.playbackRate=rate;await fallback.play();
   }else{
    if(!ctx)ctx=new AC();
    const resumed=ctx.resume();const decoded=bufferFor(clip,index);
    await resumed;const buffer=await decoded;
    if(request!==sequence||document.hidden)return;
    if(ctx.state!=='running')throw Error('Audio context not running');
    source=ctx.createBufferSource();source.buffer=buffer;source.playbackRate.value=rate;source.connect(ctx.destination);
    source.onended=()=>{if(request!==sequence)return;active=false;source.disconnect();source=null;sync();announce(false);status('ฟังจบแล้ว · แตะฟังซ้ำหรือเลือกคำถัดไปได้เลย');};
    source.start();
   }
   if(request===sequence)status(`กำลังอ่าน “${clip.term}” · ${rate===.75?'ช้า 0.75×':'ปกติ 1×'}`);
  }catch{
   if(request!==sequence)return;active=false;sync();announce(false);
   status('ยังเริ่มเสียงไม่ได้ ลองแตะฟังอีกครั้งและตรวจระดับเสียงสื่อของเครื่อง');
  }
 }
 fallback.addEventListener('ended',()=>{active=false;sync();announce(false);status('ฟังจบแล้ว · แตะฟังซ้ำได้เลย');});
 function mount(){stop(true);current=null;fallback.hidden=true;const slot=$('#pronunciation-native');if(slot)slot.append(fallback);status('แตะปุ่มลำโพงเพื่อฟัง · เสียงอ่านแยกจากเสียงเกม');}
 document.addEventListener('click',ev=>{const button=ev.target.closest('[data-pronounce]');if(button){speak(Number(button.dataset.pronounce),Number(button.dataset.rate||1));return;}if(ev.target.closest('#pronunciation-stop'))stop();else sync();});
 document.addEventListener('study:render',mount);
 document.addEventListener('input',()=>sync());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',()=>stop(true));
 mount();
})();
