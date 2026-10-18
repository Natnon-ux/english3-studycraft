/* Word Quest: local, resumable vocabulary memory game. */
(() => {
 'use strict';
 const D=window.STUDY,key='studycraft-match-v1',levels={easy:{name:'Easy',pairs:4,delay:1200,hint:true},medium:{name:'Medium',pairs:6,delay:850,hint:false},hard:{name:'Hard',pairs:8,delay:650,hint:false}};
 const categories={all:'ทุกหมวด',added:'ศัพท์เสริมเดิม',pdf:'✦ จากไฟล์เฉลยใหม่',Reading:'ศัพท์บทอ่าน',Rules:'หน้าที่ / การอนุญาต',Ability:'ความสามารถ',Sport:'กีฬา',Cause:'เหตุและผล',Difficulty:'ความยาก','Multi-word':'กริยาหลายคำ',Graph:'กราฟ',saved:'★ คำที่บันทึก'};
 const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffled=list=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 let round=null,prefs={level:'easy',category:'all'},records={},timer=null,locked=false;
 function valid(r){return r&&levels[r.level]&&categories[r.category]&&Array.isArray(r.ids)&&r.ids.length>0&&r.ids.length<=levels[r.level].pairs&&new Set(r.ids).size===r.ids.length&&r.ids.every(id=>Number.isInteger(id)&&D.vocab[id])&&Array.isArray(r.cards)&&r.cards.length===r.ids.length*2&&r.ids.every(id=>['en','th'].every(lang=>r.cards.filter(c=>c.id===id&&c.lang===lang).length===1))&&Array.isArray(r.matched)&&new Set(r.matched).size===r.matched.length&&r.matched.every(id=>r.ids.includes(id))&&Number.isInteger(r.moves)&&r.moves>=r.matched.length&&Array.isArray(r.open)&&r.open.length<=2&&r.open.every(n=>Number.isInteger(n)&&r.cards[n]&&!r.matched.includes(r.cards[n].id));}
 try{const data=JSON.parse(localStorage.getItem(key));if(levels[data?.prefs?.level]&&categories[data?.prefs?.category])prefs=data.prefs;if(data?.records&&typeof data.records==='object')records=data.records;if(valid(data?.round)){round=data.round;if(round.open.length===2)round.open=[];}}catch{}
 function save(){try{localStorage.setItem(key,JSON.stringify({round,prefs,records}));}catch{}}
 function say(text){const out=$('#match-status');if(out)out.textContent=text;}
 function pool(){let saved=[];try{saved=JSON.parse(localStorage.getItem('english3-final-v1'))?.saved||[];}catch{}
  return D.vocab.map((v,id)=>({v,id})).filter(({v,id})=>prefs.category==='all'||prefs.category==='added'&&D.addedVocabIds?.includes(id)||prefs.category==='pdf'&&D.pdfVocabIds?.includes(id)||prefs.category==='saved'&&saved.includes(id)||v[2]===prefs.category);
 }
 function newRound(){
  clearTimeout(timer);locked=false;const entries=pool(),n=Math.min(levels[prefs.level].pairs,entries.length);
  if(!n){round=null;save();paint();say('ยังไม่มีคำที่บันทึก เลือกหมวดอื่น หรือแตะดาวที่คลังศัพท์ก่อน');return;}
  let candidates=entries;
  if(prefs.level==='easy'){const short=entries.filter(({v})=>!/[ /]/.test(v[0]));if(short.length>=n)candidates=short;}
  const ids=shuffled(candidates).slice(0,n).map(x=>x.id);
  round={ids,cards:shuffled(ids.flatMap(id=>[{id,lang:'en'},{id,lang:'th'}])),matched:[],open:[],moves:0,level:prefs.level,category:prefs.category};
  save();paint();say(`เริ่ม ${levels[round.level].name} · จับคู่ให้ครบ ${n} คู่`);
 }
 function recordKey(){return `${round.level}:${round.category}:${round.ids.length}`;}
 function paint(){
  const slot=$('#match-round');if(!slot)return;
  if(!round){slot.innerHTML='<div class="panel match-empty"><h2>พร้อมสะสมศัพท์แล้วหรือยัง?</h2><p>เลือกหมวดและระดับ แล้วแตะ “เริ่มชุดใหม่”</p><a class="text-link" href="#vocab">ไปเก็บศัพท์ด้วยปุ่มดาว →</a></div>';return;}
  const done=round.matched.length===round.ids.length,level=levels[round.level],best=records[recordKey()];
  slot.innerHTML=`<div class="match-stats"><div><span>LEVEL</span><b>${level.name}</b></div><div><span>จับคู่แล้ว</span><b>${round.matched.length} / ${round.ids.length}</b></div><div><span>เปิดคู่</span><b>${round.moves} ครั้ง</b></div><div><span>สถิติดีที่สุด</span><b>${Number.isInteger(best)?best+' ครั้ง':'—'}</b></div></div><div class="match-progress" aria-label="ความคืบหน้า ${round.matched.length} จาก ${round.ids.length} คู่"><span style="width:${round.matched.length/round.ids.length*100}%"></span></div>
  ${done?`<section class="match-win" role="status"><span class="match-gem" aria-hidden="true">◆</span><div><h2>ภารกิจสำเร็จ! +${round.ids.length*10} XP</h2><p>เก็บได้ ${round.ids.length} คู่ จากการเปิด ${round.moves} ครั้ง · ${round.moves===round.ids.length?'จับคู่แม่นทุกครั้ง!':'ทวนศัพท์ด้านล่าง แล้วลองทำลายสถิติอีกครั้ง'}</p></div><button class="btn" data-match-new>เล่นชุดใหม่ →</button></section>`:''}
  <div class="match-board" aria-label="การ์ดจับคู่คำศัพท์">${round.cards.map((card,i)=>{
   const matched=round.matched.includes(card.id),open=matched||round.open.includes(i),v=D.vocab[card.id];
   return `<button class="match-card ${open?'is-open':''} ${matched?'is-matched':''} ${card.lang}" data-match-card="${i}" ${matched?'disabled':''} aria-label="${open?esc(card.lang==='en'?v[0]:v[1]):'การ์ดภาษา'+(card.lang==='en'?'อังกฤษ':'ไทย')+' ใบที่ '+(i+1)}" aria-pressed="${open}"><span class="match-card-tag">${matched?'✓':card.lang.toUpperCase()}</span>${open?`<span class="match-face" lang="${card.lang==='en'?'en':'th'}">${esc(card.lang==='en'?v[0]:v[1])}</span>${card.lang==='en'&&(level.hint||matched)?`<small class="match-hint">${esc(window.STUDY_THAI_READINGS[v[0]]||'')}</small>`:''}`:'<span class="match-card-back" aria-hidden="true">?</span><small>แตะเพื่อเปิด</small>'}</button>`;
  }).join('')}</div>
  ${round.matched.length?`<section class="match-collection"><div class="section-top"><h2>ศัพท์ที่เก็บได้</h2><span>ฟังเสียงแล้วอ่านตามได้เลย</span></div><ul>${round.matched.map(id=>{const v=D.vocab[id];return `<li><div><b lang="en">${esc(v[0])}</b><span class="match-reading">${esc(window.STUDY_THAI_READINGS[v[0]]||'')}</span><span>${esc(v[1])}</span></div><button class="pronounce-btn" data-pronounce="${id}" data-rate="1" aria-label="ฟังคำอ่าน ${esc(v[0])}" aria-pressed="false">🔊 ฟัง</button></li>`;}).join('')}</ul></section>`:''}`;
 }
 function flip(index){
  if(!round||locked||!round.cards[index]||round.open.includes(index)||round.matched.includes(round.cards[index].id))return;
  round.open.push(index);
  if(round.open.length===1){save();paint();$('#match-round [data-match-card="'+index+'"]').focus({preventScroll:true});say('เลือกอีกใบเพื่อจับคู่');return;}
  round.moves++;const [a,b]=round.open.map(i=>round.cards[i]);
  if(a.id===b.id&&a.lang!==b.lang){
   window.STUDY_WEAKNESS.recordWord(a.id,true,`match:${Date.now()}:${round.moves}:${a.id}`);round.matched.push(a.id);round.open=[];
   const done=round.matched.length===round.ids.length;
   if(done){const old=records[recordKey()];records[recordKey()]=Number.isInteger(old)?Math.min(old,round.moves):round.moves;}
   save();paint();say(done?'จับคู่ครบแล้ว! ทวนคำที่เก็บได้หรือเริ่มชุดใหม่ได้เลย':'ถูกคู่! '+D.vocab[a.id][0]+' = '+D.vocab[a.id][1]);
   document.dispatchEvent(new CustomEvent('study:sound',{detail:{type:done?'complete':'correct'}}));
   $('#match-round [data-match-card]:not(:disabled)')?.focus({preventScroll:true});
  }else{
   for(const card of [a,b])window.STUDY_WEAKNESS.recordWord(card.id,false,`match:${Date.now()}:${round.moves}:${card.id}`);locked=true;save();paint();say('ยังไม่ใช่คู่เดียวกัน ลองจำตำแหน่งแล้วเปิดใหม่');
   document.dispatchEvent(new CustomEvent('study:sound',{detail:{type:'wrong'}}));
   const snapshot=round;
   timer=setTimeout(()=>{if(round!==snapshot)return;round.open=[];locked=false;save();paint();$('#match-round [data-match-card="'+index+'"]')?.focus({preventScroll:true});},levelDelay());
  }
 }
 function levelDelay(){return levels[round.level].delay;}
 function page(){return `<div class="page-heading"><div><div class="eyebrow">WORD QUEST · MEMORY MATCH</div><h1>เปิดบล็อก เก็บศัพท์</h1><p class="subtitle">เปิดการ์ด EN และ TH ที่มีความหมายตรงกัน · เลือกระดับ แล้วสะสมคำทีละคู่</p></div><span class="match-emblem" aria-hidden="true">◆</span></div>
 <section class="match-controls panel"><div><label for="match-level">ระดับความท้าทาย</label><select id="match-level">${Object.entries(levels).map(([id,v])=>`<option value="${id}" ${prefs.level===id?'selected':''}>${v.name} · ${v.pairs} คู่${v.hint?' + คำอ่านช่วยจำ':''}</option>`).join('')}</select></div><div><label for="match-category">หมวดคำศัพท์</label><select id="match-category">${Object.entries(categories).map(([id,name])=>`<option value="${id}" ${prefs.category===id?'selected':''}>${name}</option>`).join('')}</select></div><button class="btn" data-match-new>เริ่มชุดใหม่ ↻</button><p>Easy 4 คู่พร้อมคำอ่าน · Medium 6 คู่ · Hard 8 คู่<br>เลือกค่าที่ต้องการแล้วกดเริ่มชุดใหม่ · ชุดที่เล่นอยู่บันทึกอัตโนมัติในเครื่องนี้</p></section>
 <p class="match-status" id="match-status" role="status">เลือกการ์ดภาษาอังกฤษ EN กับคำแปลภาษาไทย TH ที่ตรงกัน</p><div id="match-round"></div>
 <div class="match-audio"><p id="pronunciation-status" role="status">จับคู่แล้วแตะลำโพงที่ศัพท์เพื่อฟังเสียง</p><button class="btn secondary small" id="pronunciation-stop" disabled>■ หยุดอ่าน</button><div id="pronunciation-native"></div></div>`;}
 window.STUDY_MATCHING={page};
 document.addEventListener('study:render',()=>{if(!$('#match-round'))return;if(!round)newRound();else paint();});
 document.addEventListener('change',ev=>{if(ev.target.id==='match-level'){prefs.level=ev.target.value;save();}if(ev.target.id==='match-category'){prefs.category=ev.target.value;save();}});
 document.addEventListener('click',ev=>{if(ev.target.closest('[data-match-new]')){newRound();return;}const tile=ev.target.closest('[data-match-card]');if(tile)flip(Number(tile.dataset.matchCard));});
})();
