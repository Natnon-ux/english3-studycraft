/* Original block-world graphics and CSS-driven companions. No game assets loaded. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s), motionKey='studycraft-motion';
 let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
 try{const pref=localStorage.getItem(motionKey);if(pref)paused=pref==='paused';}catch{}
 const svg=(body)=>`<svg aria-hidden="true" viewBox="0 0 24 24" shape-rendering="crispEdges">${body}</svg>`;
 const icons={
  home:svg('<path fill="#77b84d" d="M2 3h20v7H2z"/><path fill="#99663e" d="M2 10h20v12H2z"/><path fill="#c68b53" d="M4 12h4v4H4zm10 4h5v4h-5z"/><path fill="#b0de75" d="M2 3h20v2H2z"/>'),
  vocab:svg('<path fill="#4b2c1d" d="M2 6h20v15H2z"/><path fill="#b98040" d="M3 7h18v5H3zm0 7h18v6H3z"/><path fill="#e1b76a" d="M11 10h3v6h-3z"/><path fill="#f7dc9d" d="M11 10h3v2h-3z"/>'),
  match:svg('<path fill="#194e43" d="M9 1h6v3h4v4h4v7h-4v5h-4v3H9v-3H5v-5H1V8h4V4h4z"/><path fill="#4cc3ad" d="M9 4h6v3h4v8h-4v5H9v-5H5V7h4z"/><path fill="#c7fff1" d="M9 5h5v4H9z"/>'),
  grammar:svg('<path fill="#513a26" d="M4 3h17v19H4z"/><path fill="#d0a568" d="M6 4h14v16H6z"/><path fill="#f6ebca" d="M8 5h12v14H8z"/><path fill="#9b7643" d="M10 8h8v2h-8zm0 4h8v2h-8z"/><path fill="#89b75d" d="M16 3h3v10l-2-2-1 2z"/>'),
  reading:svg('<path fill="#235f57" d="M2 6h9v16H2zm11 0h9v16h-9z"/><path fill="#f9eccc" d="M3 4h8v15H3zm10 0h8v15h-8z"/><path fill="#b0a47b" d="M5 7h4v2H5zm0 4h4v2H5zm10-4h4v2h-4zm0 4h4v2h-4z"/>'),
  review:svg('<path fill="#a464a5" d="M7 2h10v3h4v12h-4v4H7v-4H3V5h4z"/><path fill="#e0a9d2" d="M8 4h8v3h3v8h-3v4H8v-4H5V7h3z"/><path fill="#fff0b5" d="M11 6h2v4h4v3h-4v4h-2v-4H7v-3h4z"/>'),
  quiz:svg('<path fill="#62452a" d="m4 19 12-12 3 3L7 22H4z"/><path fill="#43c8bd" d="m9 4 5-2h8v6l-3 5-3-2 2-4-5 1z"/><path fill="#9ff5df" d="M14 2h8v3h-8z"/>'),
  progress:svg('<path fill="#80662b" d="M5 3h14v13H5zM3 5h3v7H3zm15 0h3v7h-3zM10 16h4v4h-4zM6 20h12v3H6z"/><path fill="#efc758" d="M7 3h10v10H7z"/><path fill="#fff0a2" d="M8 4h3v7H8z"/>')
 };
 function cat(){return `<svg class="cat-sprite" aria-hidden="true" viewBox="0 0 32 40" shape-rendering="crispEdges"><rect x="5" y="37" width="23" height="2" fill="#213c2840"/><g class="leg leg-a"><path fill="#355d5b" d="M10 26h6v9h-6z"/><path fill="#44342d" d="M9 33h7v4H9z"/></g><g class="leg leg-b"><path fill="#294d4a" d="M18 26h6v9h-6z"/><path fill="#44342d" d="M18 33h8v4h-8z"/></g><g class="sprite-body"><path class="cat-tail" fill="#bd7740" d="M3 19h4v9H2v-4H0v-6h3z"/><path fill="#b8864c" d="M5 16h8v13H5z"/><path fill="#e1b975" d="M5 17h3v10H5z"/><path fill="#3a9c86" d="M10 16h15v13H10z"/><path fill="#70c6a2" d="M11 17h11v4H11z"/><path fill="#f5d593" d="M13 23h9v3h-9z"/><path fill="#50ae94" d="M24 18h4v9h-4z"/><path fill="#efc995" d="M24 25h4v4h-4z"/><path fill="#b77745" d="M8 1h6v6h8V1h6v17H8z"/><path fill="#efd0a0" d="M9 7h18v10H9z"/><path fill="#f2b0a1" d="M10 2h3v4h-3zm13 0h3v4h-3z"/><path fill="#fff0d2" d="M14 11h10v7H14z"/><g class="sprite-eyes" fill="#3d3a32"><path d="M13 8h2v3h-2zm10 0h2v3h-2z"/></g><path fill="#bd796b" d="M18 12h3v2h-3z"/><path fill="#c6ac89" d="M17 15h5v1h-5z"/></g></svg>`;}
 function chick(){return `<svg class="chick-sprite" aria-hidden="true" viewBox="0 0 24 26" shape-rendering="crispEdges"><path fill="#213c2830" d="M3 24h18v2H3z"/><path class="leg leg-a" fill="#c97a29" d="M8 19h2v5H6v-2h2z"/><path class="leg leg-b" fill="#d78b2e" d="M15 19h2v5h-4v-2h2z"/><g class="sprite-body"><path fill="#f4d67d" d="M3 10h17v11H3z"/><path fill="#fff2b1" d="M8 3h13v14H8z"/><path fill="#d15f45" d="M11 0h4v4h-4zm4 1h3v3h-3z"/><path fill="#e5ad45" d="M21 8h3v4h-3z"/><path fill="#443c2c" d="M17 6h2v3h-2z"/><path fill="#e9bc56" d="M4 12h9v5H4z"/></g></svg>`;}
 const walkers=()=>`<div class="walk-track"><div class="walker cat-walker"><div class="sprite-facing">${cat()}</div></div><div class="walker chick-walker"><div class="sprite-facing">${chick()}</div></div></div>`;
 function world(){return `<div class="block-world" aria-hidden="true"><div class="pixel-cloud cloud-one"></div><div class="pixel-cloud cloud-two"></div><div class="block-sun"></div><div class="block-hill hill-back"></div><div class="block-hill hill-front"></div><div class="block-tree tree-one"><i></i><b></b></div><div class="block-tree tree-two"><i></i><b></b></div><div class="world-sign">YOUR STUDY WORLD<br><strong data-world-progress>0 / 15 บท</strong><div class="world-meter"><span></span></div></div><div class="block-ground"></div><div class="block-flower flower-one"></div><div class="block-flower flower-two"></div>${walkers()}</div>`;}
 function syncMotion(){document.documentElement.classList.toggle('motion-paused',paused);const b=$('#motion-toggle');if(b){b.textContent=paused?'▶ ให้ตัวละครเดิน':'Ⅱ พักตัวละคร';b.setAttribute('aria-pressed',String(paused));b.setAttribute('aria-label',paused?'เปิดการเดินของตัวละคร':'หยุดการเดินของตัวละคร');}}
 function syncProgress(){let read=[];try{read=JSON.parse(localStorage.getItem('english3-final-v1'))?.read||[];}catch{}const ids=[...window.STUDY.grammar,...window.STUDY.readings,...(window.STUDY.review?.sections||[])].map(x=>x.id);const n=ids.filter(id=>Array.isArray(read)&&read.includes(id)).length;document.querySelectorAll('[data-world-progress]').forEach(x=>x.textContent=`${n} / ${ids.length} บท`);document.querySelectorAll('.world-meter span').forEach(x=>x.style.width=`${n/ids.length*100}%`);}
 function enhance(){
  const hero=$('.hero');if(hero&&!hero.querySelector('.block-world')){hero.querySelector('.hero-art')?.remove();hero.insertAdjacentHTML('beforeend',world());}
  document.querySelectorAll('[data-nav]').forEach(a=>{const icon=a.querySelector('.nav-icon');if(icon&&icons[a.dataset.nav])icon.innerHTML=icons[a.dataset.nav];});
  document.querySelectorAll('.module-icon').forEach((x,i)=>{if(!x.querySelector('svg'))x.innerHTML=icons[x.dataset.icon||['vocab','grammar','reading'][i%3]];});
  const legend=$('.map-legend');if(legend)legend.textContent='เขียว = ตอบแล้ว · ขีดทอง = ปักหมุด';
  syncMotion();syncProgress();
 }
 const footer=document.querySelector('.workspace>footer');if(footer)footer.insertAdjacentHTML('beforebegin',`<div class="trail-footer" aria-hidden="true"><span class="trail-message">ค่อย ๆ เก็บความรู้ ทีละบล็อก</span><div class="block-ground"></div>${walkers()}</div>`);
 $('#motion-toggle')?.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem(motionKey,paused?'paused':'running');}catch{}syncMotion();});
 document.addEventListener('study:render',enhance);
 document.addEventListener('click',ev=>{if(ev.target.closest('[data-action="read"]'))syncProgress();});
 enhance();
})();
