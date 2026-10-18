/* Original, locally synthesised game sounds. Audio starts only by explicit tap. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s), key='studycraft-volume';
 let enabled=false, music=false, volume=30, ctx=null, master=null, musicTimer=null, unlockPromise=null, speaking=false;
 const active=new Set();
 try{const stored=localStorage.getItem(key);if(stored!==null&&Number.isFinite(Number(stored)))volume=Math.max(0,Math.min(100,Number(stored)));}catch{}
 const patterns={
  click:[[392,0,.045,.08]], select:[[440,0,.055,.08]],
  correct:[[523.25,0,.08,.13],[659.25,.095,.08,.12],[783.99,.19,.15,.12]],
  wrong:[[293.66,0,.1,.1],[261.63,.12,.15,.09]],
  read:[[659.25,0,.08,.11],[880,.1,.15,.1]],
  complete:[[523.25,0,.09,.12],[659.25,.11,.09,.11],[783.99,.22,.11,.11],[1046.5,.36,.24,.1]],
  unlock:[[392,0,.07,.1],[523.25,.08,.12,.1]]
 };
 function status(text){const el=$('#sound-status');if(el)el.textContent=text;}
 function sync(){
  const b=$('#sound-toggle');if(b){b.textContent=enabled?'♪ เสียงเกมเปิด':'♪ เสียงเกม';b.setAttribute('aria-pressed',String(enabled));b.setAttribute('aria-label',enabled?'ปิดเสียงเกม':'เปิดเสียงเกม');}
  const r=$('#sound-volume');if(r)r.value=String(volume);
  const o=$('#sound-volume-value');if(o)o.textContent=volume+'%';
  const m=$('#sound-music');if(m)m.checked=music;
  if(master&&ctx){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(enabled&&!speaking&&!document.hidden?volume/100*.38:0,ctx.currentTime,.015);}
 }
 async function ready(){
  if(!enabled||document.hidden)return false;
  try{
   if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('unsupported');ctx=new AC();master=ctx.createGain();master.gain.value=0;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3300;filter.Q.value=.4;master.connect(filter);filter.connect(ctx.destination);}
   if(ctx.state!=='running'){if(!unlockPromise)unlockPromise=ctx.resume().finally(()=>{unlockPromise=null;});await unlockPromise;}
   if(ctx.state!=='running')throw Error('suspended');
   if(!enabled||document.hidden)return false;
   sync();return true;
  }catch{
   enabled=false;stopAll();sync();status('ยังเปิดเสียงไม่ได้ ลองแตะเปิดเสียงอีกครั้ง');return false;
  }
 }
 function note(frequency,delay,duration,level,wave='square'){
  if(!ctx||!master||!enabled||document.hidden||volume===0||ctx.state!=='running')return;
  const start=ctx.currentTime+.01+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=wave;osc.frequency.setValueAtTime(frequency,start);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(level,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(master);active.add(osc);
  osc.onended=()=>{active.delete(osc);osc.disconnect();gain.disconnect();};
  osc.start(start);osc.stop(start+duration+.025);
 }
 async function play(type){if(!enabled||speaking||document.hidden||volume===0)return;if(!await ready())return;for(const n of patterns[type]||patterns.click)note(...n);}
 function stopMusic(){clearTimeout(musicTimer);musicTimer=null;}
 function stopAll(){stopMusic();for(const osc of [...active]){try{osc.stop();}catch{}}active.clear();if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.01);}
 function phrase(){
  stopMusic();if(!enabled||speaking||!music||document.hidden||!ctx||ctx.state!=='running')return;
  // A sparse, original 16-step C-major motif, never music taken from a game.
  const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,659.25,783.99,1046.5,783.99,587.33,698.46,783.99,659.25];
  melody.forEach((f,i)=>note(f,i*.45,.3,.055,'triangle'));
  [130.81,146.83,164.81,130.81].forEach((f,i)=>note(f,i*1.8,.7,.055,'sine'));
  musicTimer=setTimeout(phrase,7200);
 }
 async function setEnabled(next){
  enabled=next;sync();
  if(!enabled){stopAll();if(ctx)ctx.suspend().catch(()=>{});status('ปิดเสียงแล้ว · แตะเปิดได้ทุกเมื่อ');return;}
  if(await ready()){status('เสียงเอฟเฟกต์พร้อมแล้ว · ดนตรีคลอเลือกเปิดเพิ่มได้');play('unlock');if(music)phrase();}
 }
 $('#sound-toggle')?.addEventListener('click',()=>setEnabled(!enabled));
 $('#sound-volume')?.addEventListener('input',ev=>{volume=Number(ev.target.value);try{localStorage.setItem(key,String(volume));}catch{}sync();status(volume===0?'ความดัง 0% · ไม่มีเสียงออก':`ความดัง ${volume}%${enabled?'':' · แตะเปิดเสียงก่อน'}`);});
 $('#sound-volume')?.addEventListener('change',()=>play('select'));
 $('#sound-music')?.addEventListener('change',async ev=>{music=ev.target.checked;if(!music){stopAll();sync();status('ปิดดนตรีคลอแล้ว · ยังมีเสียงเอฟเฟกต์');return;}if(!enabled)await setEnabled(true);else if(await ready())phrase();status(enabled?'เปิดดนตรีคลอเบา ๆ แล้ว':'แตะเปิดเสียงเพื่อลองอีกครั้ง');});
 $('#sound-test')?.addEventListener('click',async()=>{if(!enabled)await setEnabled(true);else await ready();play('complete');});
 document.addEventListener('study:speech',ev=>{speaking=!!ev.detail?.active;if(speaking)stopAll();sync();if(!speaking&&enabled&&music&&!document.hidden)phrase();});
 document.addEventListener('study:sound',ev=>play(ev.detail?.type||'click'));
 document.addEventListener('click',ev=>{
  const el=ev.target.closest('button,a,summary');if(!el||el.disabled||el.closest('.sound-control')||el.id==='dialog-confirm'||el.closest('[data-pronounce],.pronunciation-guide'))return;
  const action=el.dataset.action;
  if(action==='answer'||action==='read')return;
  play('click');
 });
 document.addEventListener('click',ev=>{const menu=$('#sound-settings');if(menu?.open&&!menu.contains(ev.target)&&!ev.target.closest('#sound-toggle'))menu.open=false;});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){const menu=$('#sound-settings');if(menu?.open){menu.open=false;menu.querySelector('summary')?.focus();}}});
 document.addEventListener('visibilitychange',async()=>{
  if(document.hidden){stopAll();if(ctx)ctx.suspend().catch(()=>{});return;}
  if(enabled&&await ready()){status('เสียงพร้อมใช้งาน');if(music)phrase();}
 });
 window.addEventListener('pagehide',()=>{stopAll();if(ctx)ctx.suspend().catch(()=>{});});
 window.addEventListener('pageshow',async ev=>{if(ev.persisted&&enabled&&await ready()&&music)phrase();});
 sync();status('แตะ “เปิดเสียง” เพื่อเริ่ม · ความดังบันทึกไว้ในเครื่องนี้');
})();
