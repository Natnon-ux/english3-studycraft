/* Missed items and calendar-day spaced review stay in this browser. */
(() => {
 'use strict';
 const D=window.STUDY,KEY='studycraft-weak-v1',QUIZ_KEY='english3-final-v1';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const dayOf=stamp=>{const d=new Date(stamp);return Number.isNaN(d.getTime())?today():`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const addDays=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return dayOf(d);};
 const formatDay=day=>new Date(day+'T12:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short'});
 const validId=(kind,id)=>Number.isInteger(id)&&(kind==='q'?D.questions.some(q=>q.id===id):kind==='v'&&!!D.vocab[id]);
 const validDay=day=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&dayOf(day+'T12:00:00')===day;
 const shuffle=list=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 let data={items:{},migrated:false,round:null},storageWarning=false;
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&typeof saved.items==='object'&&saved.items){
  for(const [key,item] of Object.entries(saved.items)){if(item&&validId(item.kind,item.id)&&key===`${item.kind}:${item.id}`&&Number.isInteger(item.lapses)&&item.lapses>0&&Number.isInteger(item.streak)&&item.streak>=0&&item.streak<=3&&validDay(item.due))data.items[key]=item;}
  data.migrated=saved.migrated===true;if(validRound(saved.round))data.round=saved.round;
 }}catch{}
 function validRound(r){return r&&Array.isArray(r.ids)&&r.ids.length>0&&new Set(r.ids).size===r.ids.length&&r.ids.every(id=>validId('v',id))&&Array.isArray(r.cards)&&r.cards.length===r.ids.length&&r.cards.every((c,i)=>c.id===r.ids[i]&&Array.isArray(c.options)&&c.options.length===4&&new Set(c.options.map(id=>D.vocab[id]?.[1])).size===4&&c.options.includes(c.id)&&c.options.every(id=>validId('v',id)))&&Number.isInteger(r.index)&&r.index>=0&&r.index<r.ids.length&&r.answers&&typeof r.answers==='object'&&Object.entries(r.answers).every(([id,v])=>r.ids.includes(Number(id))&&r.cards.find(c=>c.id===Number(id)).options.includes(v));}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(data));storageWarning=false;}catch{storageWarning=true;}}
 function record(kind,id,correct,eventId,day=today()){
  if(!validId(kind,id))return;
  const key=`${kind}:${id}`,old=data.items[key];if(old?.lastEvent===eventId)return;
  if(correct&&!old)return;
  const item=old||{kind,id,lapses:0,streak:0,due:addDays(day,1),mastered:false};
  item.lastEvent=eventId;item.lastSeen=day;
  if(!correct){item.lapses++;item.streak=0;item.mastered=false;item.lastWrong=day;item.lastSuccess=null;item.due=addDays(day,1);}
  else if(!item.mastered&&item.lastSuccess!==day&&item.lastWrong!==day&&day>=item.due){item.lastSuccess=day;item.streak=Math.min(3,item.streak+1);item.mastered=item.streak===3;item.due=addDays(day,[3,7,14][item.streak-1]);}
  data.items[key]=item;save();
 }
 function recordQuestion(id,correct,eventId,day){record('q',id,correct,eventId,day);}
 function recordWord(id,correct,eventId){record('v',id,correct,eventId);}
 if(!data.migrated){
  try{const history=JSON.parse(localStorage.getItem(QUIZ_KEY))?.history;
   if(Array.isArray(history))for(const r of [...history].reverse())if(r&&Array.isArray(r.items)&&r.answers&&r.date){const day=dayOf(r.date);for(const it of r.items){const q=D.questions.find(q=>q.id===it.id);if(q)recordQuestion(q.id,r.answers[q.id]===q.answer,`import:${r.id}:${q.id}`,day);}}
  }catch{}
  data.migrated=true;save();
 }
 function items(kind,scope='all'){return Object.values(data.items).filter(x=>!x.mastered&&(!kind||x.kind===kind)&&(scope!=='due'||x.due<=today())).sort((a,b)=>a.due.localeCompare(b.due)||b.lapses-a.lapses||a.id-b.id);}
 function stats(){const all=items();return {total:all.length,due:items(null,'due').length,questions:items('q').length,words:items('v').length,mastered:Object.values(data.items).filter(x=>x.mastered).length};}
 function summaryCard(){const s=stats();return `<section class="weak-banner"><div><div class="eyebrow">DAILY QUEST · ทวนให้จำได้จริง</div><h2>กลับมาเก็บจุดที่เคยพลาด</h2><p>ถึงกำหนดวันนี้ <strong>${s.due}</strong> รายการ · ข้อสอบที่ต้องทวน ${s.questions} ข้อ · ศัพท์ ${s.words} คำ</p></div><a class="btn" href="#weak">ทวนจุดอ่อน →</a></section>`;}
 function list(kind){const all=items(kind);if(!all.length)return `<p class="weak-empty">${kind==='q'?'ยังไม่มีข้อสอบที่ต้องทวน ลองฝึกแบบทดสอบก่อนได้เลย':'ยังไม่มีศัพท์ที่ต้องทวน คำที่จับคู่พลาดจะมาอยู่ตรงนี้'}</p>`;
  return `<details class="weak-list"><summary>ดูรายการที่ต้องทวน (${all.length})</summary><ul>${all.map(item=>`<li><div><b ${kind==='v'?'lang="en"':''}>${esc(kind==='q'?D.questions.find(q=>q.id===item.id).prompt:D.vocab[item.id][0])}</b><small>พลาด ${item.lapses} ครั้ง · ทวนถูกต่างวัน ${item.streak}/3 รอบ</small></div><span class="weak-date ${item.due<=today()?'is-due':''}">${item.due<=today()?'ถึงกำหนดแล้ว':'ทวน '+esc(formatDay(item.due))}</span></li>`).join('')}</ul></details>`;
 }
 function panel(kind,title,description){const all=items(kind),due=items(kind,'due');return `<section class="panel weak-kind"><h2>${title}</h2><p>${description}</p><div class="weak-count"><strong>${all.length}</strong><span>${kind==='q'?'ข้อ':'คำ'}ที่ต้องทวน · ถึงกำหนด ${due.length}</span></div><div class="actions"><button class="btn" data-weak-start="${kind}" data-scope="due" ${due.length?'':'disabled'}>ทวนที่ถึงกำหนด (${due.length})</button><button class="btn secondary" data-weak-start="${kind}" data-scope="all" ${all.length?'':'disabled'}>ทวนทั้งหมดตอนนี้</button></div>${list(kind)}</section>`;}
 function page(){const s=stats();return `<div class="page-heading"><div><div class="eyebrow">DAILY QUEST · YOUR NEXT LEVEL</div><h1>ทวนจุดอ่อน ทีละบล็อก</h1><p class="subtitle">รวมข้อสอบที่ผิดหรือเว้นไว้ และศัพท์ที่จับคู่พลาด · บันทึกอัตโนมัติในเบราว์เซอร์นี้</p></div></div>
 <section class="weak-overview"><div><strong>${s.due}</strong><span>ถึงกำหนดวันนี้</span></div><div><strong>${s.total}</strong><span>รายการที่ต้องทวน</span></div><div><strong>${s.mastered}</strong><span>จำแม่นแล้ว</span></div></section>
 <p class="weak-storage-note" role="status">${storageWarning?'เบราว์เซอร์บันทึกข้อมูลไม่ได้ รอบนี้จะอยู่เฉพาะตอนเปิดเว็บ':'พลาดวันนี้ → นัดทวนพรุ่งนี้ · ทวนถูกตามกำหนด → เว้น 3 วัน แล้ว 7 วัน · ถูกต่างวันครบ 3 รอบจะย้ายไป “จำแม่นแล้ว”'}</p>
 <div id="weak-round">${wordRound()}</div><div class="weak-grid">${panel('q','✎ ข้อสอบที่ยังไม่แม่น','ฝึกจากข้อที่พลาดทุกชุด พร้อมคำแปลและเหตุผลหลังตอบ')}${panel('v','◆ ศัพท์ที่เคยสับสน','ลองเลือกคำแปลใหม่ โดยยังไม่เปิดเฉลย ฟังเสียงอ่านได้ทุกคำ')}</div>
 <div class="note spaced">ทวนก่อนกำหนดได้ แต่จะยังไม่เพิ่มรอบจำแม่นจนถึงวันนัด · รายการใหม่เริ่มนัดวันถัดไป · หากพลาดอีกจะเริ่มนับ 3 รอบใหม่<br>ข้อมูลอยู่เฉพาะเบราว์เซอร์เครื่องนี้ การเปิดอีกเครื่องจะมีประวัติแยกกัน</div><div class="actions"><a class="btn secondary" href="#quiz">ฝึกข้อสอบเพิ่ม →</a><a class="btn secondary" href="#match">เล่นจับคู่ศัพท์ →</a></div>`;}
 function newWordRound(scope){const ids=shuffle(items('v',scope)).map(x=>x.id);if(!ids.length)return;
  data.round={ids,index:0,answers:{},startedAt:Date.now(),cards:ids.map(id=>{
   const seen=new Set([D.vocab[id][1]]),all=D.vocab.map((_,i)=>i),candidates=[...shuffle(all.filter(i=>D.vocab[i][2]===D.vocab[id][2])),...shuffle(all.filter(i=>D.vocab[i][2]!==D.vocab[id][2]))],others=candidates.filter(i=>{const meaning=D.vocab[i][1];if(seen.has(meaning))return false;seen.add(meaning);return true;}).slice(0,3);
   return {id,options:shuffle([id,...others])};
  })};save();paint();document.querySelector('#weak-round')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function wordRound(){const r=data.round;if(!r)return '';
  const card=r.cards[r.index],v=D.vocab[card.id],chosen=r.answers[card.id],answered=Number.isInteger(chosen),done=r.ids.every(id=>Number.isInteger(r.answers[id]));
  return `<section class="panel weak-word-round" aria-label="ทวนศัพท์ที่เคยพลาด"><div class="eyebrow">WORD RECALL · ${r.index+1} / ${r.ids.length}</div><h2 lang="en">${esc(v[0])}</h2><p class="thai-reading">${esc(window.STUDY_THAI_READINGS[v[0]]||'')}</p><button class="pronounce-btn" data-pronounce="${card.id}" data-rate="1" aria-pressed="false" aria-label="ฟังคำอ่าน ${esc(v[0])}">🔊 ฟังคำอ่าน</button><h3>คำนี้แปลว่าอะไร?</h3><div class="weak-word-options">${card.options.map((id,i)=>`<button class="weak-word-option ${answered&&id===card.id?'is-correct':''} ${answered&&id===chosen&&chosen!==card.id?'is-wrong':''}" data-weak-answer="${id}" aria-pressed="${chosen===id}" ${answered?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${esc(D.vocab[id][1])}</button>`).join('')}</div>
  ${answered?`<div class="weak-word-feedback" role="status"><b>${chosen===card.id?'✓ จำได้แล้ว':'ยังไม่ถูก ลองเชื่อมกับตัวอย่างนี้'}</b><p><strong lang="en">${esc(v[0])}</strong> = ${esc(v[1])}</p><p lang="en">${esc(v[3])}</p><p>${esc(v[4])}</p></div>`:''}
  <div class="actions">${answered&&r.index<r.ids.length-1?'<button class="btn" data-weak-next>คำถัดไป →</button>':''}${done?`<p class="weak-done" role="status">จบรอบแล้ว · ถูก ${r.ids.filter(id=>r.answers[id]===id).length}/${r.ids.length} คำ · ดูวันนัดทวนด้านล่างได้เลย</p>`:''}<button class="btn secondary small" data-weak-close>${done?'ปิดรอบทวน':'พักรอบนี้ไว้'}</button></div>
  <div class="weak-audio"><p id="pronunciation-status" role="status">แตะลำโพงแล้วออกเสียงตามได้</p><button class="btn secondary small" id="pronunciation-stop" disabled>■ หยุดอ่าน</button><div id="pronunciation-native"></div></div></section>`;
 }
 function paint(){const main=document.querySelector('body[data-page="weak"] #main');if(!main)return;main.innerHTML=page();document.dispatchEvent(new CustomEvent('study:weak-render'));}
 function reset(){data={items:{},migrated:true,round:null};save();}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.body.dataset.page==='weak')paint();});
 window.STUDY_WEAKNESS={page,stats,summaryCard,items,recordQuestion,recordWord,reset};
 document.addEventListener('click',ev=>{
  const start=ev.target.closest('[data-weak-start]');if(start&&!start.disabled){const kind=start.dataset.weakStart,scope=start.dataset.scope;if(kind==='q'){document.dispatchEvent(new CustomEvent('study:weak-questions',{detail:{ids:items('q',scope).map(x=>x.id)}}));}else if(!data.round||data.round.ids.every(id=>Number.isInteger(data.round.answers[id])))newWordRound(scope);else document.dispatchEvent(new CustomEvent('study:weak-replace',{detail:{launch:()=>newWordRound(scope)}}));return;}
  const answer=ev.target.closest('[data-weak-answer]');if(answer&&!answer.disabled&&data.round){const r=data.round,card=r.cards[r.index];if(Number.isInteger(r.answers[card.id]))return;const id=Number(answer.dataset.weakAnswer);if(!card.options.includes(id))return;r.answers[card.id]=id;recordWord(card.id,id===card.id,`recall:${r.startedAt}:${card.id}`);save();paint();document.dispatchEvent(new CustomEvent('study:sound',{detail:{type:id===card.id?'correct':'wrong'}}));return;}
  if(ev.target.closest('[data-weak-next]')&&data.round){const r=data.round;if(Number.isInteger(r.answers[r.ids[r.index]])&&r.index<r.ids.length-1){r.index++;save();paint();document.querySelector('#weak-round')?.scrollIntoView({behavior:'smooth',block:'start'});}return;}
  if(ev.target.closest('[data-weak-close]')&&data.round){if(data.round.ids.every(id=>Number.isInteger(data.round.answers[id]))){data.round=null;save();paint();}else location.hash='quiz';}
 });
})();
