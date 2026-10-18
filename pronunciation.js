/* One audio engine for embedded English speech, Thai translations. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s),cache=new Map(),labels={en:'อังกฤษ',meaning:'คำแปลไทย'};
 let ctx=null,source=null,current=null,kind='en',rate=1,sequence=0,active=false,settle=null;
 const fallback=document.createElement('audio');fallback.id='pronunciation-player';fallback.controls=true;fallback.preload='none';fallback.hidden=true;fallback.setAttribute('aria-label','เครื่องเล่นเสียงอ่านคำศัพท์สำรอง');
 function status(text){const el=$('#pronunciation-status');if(el)el.textContent=text;}
 function announce(value){document.dispatchEvent(new CustomEvent('study:speech',{detail:{active:value}}));}
 function sync(){
  document.querySelectorAll('[data-pronounce]').forEach(b=>{const selected=active&&Number(b.dataset.pronounce)===current&&Number(b.dataset.rate||1)===rate&&(b.dataset.voice||'en')===kind;b.classList.toggle('is-speaking',selected);b.setAttribute('aria-pressed',String(selected));});
  const stop=$('#pronunciation-stop');if(stop)stop.disabled=!active;
 }
 function stop(quiet=false){
  sequence++;const was=active;active=false;
  if(settle){settle(false);settle=null;}
  if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}
  fallback.pause();sync();announce(false);if(was&&!quiet)status('หยุดเสียงแล้ว · แตะปุ่มบนการ์ดเพื่อฟังอีกครั้ง');
 }
 function finished(request,resolve){if(request!==sequence)return;active=false;source?.disconnect();source=null;settle=null;sync();announce(false);status('ฟังจบแล้ว · แตะฟังซ้ำหรือเลือกคำถัดไปได้เลย');resolve(true);}
 async function bufferFor(clip,key){
  if(cache.has(key))return cache.get(key);
  let bytes;if(/^data:audio\/[^;]+;base64,/.test(clip.src)){const raw=atob(clip.src.split(',')[1]);bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;}
  else{const response=await fetch(clip.src,{credentials:'same-origin'});if(!response.ok)throw Error('audio unavailable');bytes=await response.arrayBuffer();}
  const buffer=await ctx.decodeAudioData(bytes);cache.set(key,buffer);if(cache.size>64)cache.delete(cache.keys().next().value);return buffer;
 }
 async function speak(index,speed=1,voice='en',origin='manual'){
  const word=window.STUDY.vocab[index],record=voice==='en'?window.STUDY_VOICE?.words[index]:window.STUDY_THAI_VOICES?.words[index],clip=voice==='en'?record:record?.[voice];
  if(!word||!clip||record.term!==word[0]||!labels[voice])return false;
  document.dispatchEvent(new CustomEvent('study:audio-request',{detail:{origin}}));
  stop(true);current=index;kind=voice;rate=[.75,1,1.25].includes(speed)?speed:1;active=true;const request=sequence;
  let resolve;const completion=new Promise(r=>{resolve=r;});settle=resolve;sync();announce(true);status(`กำลังเตรียมเสียง${labels[voice]}...`);
  try{
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC){
    const slot=$('#pronunciation-native');if(slot){slot.append(fallback);fallback.hidden=false;}
    fallback.onended=()=>finished(request,resolve);fallback.src=clip.src;fallback.volume=1;fallback.muted=false;fallback.playbackRate=rate;await fallback.play();
   }else{
    if(!ctx)ctx=new AC();const resumed=ctx.resume(),decoded=bufferFor(clip,voice+':'+index);await resumed;const buffer=await decoded;
    if(request!==sequence||document.hidden){if(request===sequence)stop(true);return completion;}
    if(ctx.state!=='running')throw Error('Audio context not running');
    source=ctx.createBufferSource();source.buffer=buffer;source.playbackRate.value=rate;source.connect(ctx.destination);source.onended=()=>finished(request,resolve);source.start();
   }
   if(request===sequence)status(`กำลังอ่าน${labels[voice]} “${voice==='en'?clip.term:clip.text}” · ${rate===.75?'ช้า 0.75×':rate===1.25?'เร็ว 1.25×':'ปกติ 1×'}`);
  }catch{
   if(request===sequence){active=false;settle=null;sync();announce(false);status('ยังเริ่มเสียงไม่ได้ ลองแตะฟังอีกครั้งและตรวจระดับเสียงสื่อของเครื่อง');resolve(false);}
  }
  return completion;
 }
 function mount(){stop(true);current=null;fallback.hidden=true;const slot=$('#pronunciation-native');if(slot)slot.append(fallback);status(document.body.dataset.page==='cards'?'แตะลำโพงเพื่อฟังอังกฤษหรือคำแปลไทย':'แตะปุ่มลำโพงเพื่อฟัง · เสียงอ่านแยกจากเสียงเกม');}
 document.addEventListener('click',ev=>{const button=ev.target.closest('[data-pronounce]');if(button){speak(Number(button.dataset.pronounce),Number(button.dataset.rate||1),button.dataset.voice||'en');return;}if(ev.target.closest('#pronunciation-stop')){document.dispatchEvent(new CustomEvent('study:audio-request',{detail:{origin:'manual'}}));stop();}else sync();});
 for(const event of ['study:render','study:weak-render','study:cards-render'])document.addEventListener(event,mount);
 document.addEventListener('input',()=>sync());document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',()=>stop(true));
 window.STUDY_AUDIO={play:speak,stop:()=>stop(true)};
 mount();
})();
