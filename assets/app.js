(()=>{const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
// tracking -> /api/track -> Telegram
const send=o=>{try{const b=new Blob([JSON.stringify({...o,p:location.pathname,u:location.search,r:document.referrer,w:innerWidth})],{type:'application/json'});
 if(!navigator.sendBeacon||!navigator.sendBeacon('/api/track',b))fetch('/api/track',{method:'POST',body:b,keepalive:true})}catch(e){}};
try{if(!sessionStorage.pv){sessionStorage.pv=1;send({t:'visit'})}}catch(e){send({t:'visit'})}
document.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;
 if(a.dataset.code){navigator.clipboard&&navigator.clipboard.writeText(a.dataset.code);a.textContent='Copied ✓'}
 send({t:a.dataset.a,id:a.dataset.id,n:a.dataset.n})});
// nav, cookie notice, sticky ad close
const bg=$('.burger'),nv=$('#nav');if(bg)bg.addEventListener('click',()=>{const o=nv.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
const sx=$('.ad-sticky .x');if(sx)sx.addEventListener('click',()=>sx.parentNode.remove());
try{if(!localStorage.cc){const c=document.createElement('div');c.className='cc';c.innerHTML='<span>We use cookies for analytics and ads. See our <a href="/privacy-policy/">Privacy Policy</a>.</span><button>OK</button>';c.querySelector('button').onclick=()=>{localStorage.cc=1;c.remove()};document.body.appendChild(c)}}catch(e){}
// search + platform filter (home only)
const q=$('#q');if(!q)return;let plat='',timer;
const run=()=>{const w=q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);let n=0;
 $$('#grid .card').forEach(c=>{const ok=(!plat||c.dataset.p===plat)&&w.every(x=>c.dataset.t.includes(x));c.hidden=!ok;if(ok)n++});
 $('#empty').hidden=n>0;const f=!!(w.length||plat);$$('.adcell').forEach(a=>a.hidden=f);return n};
q.addEventListener('input',()=>{const n=run();clearTimeout(timer);const v=q.value.trim();
 if(v.length>1)timer=setTimeout(()=>send({t:'search',q:v,c:n}),1200)});
$$('.chip').forEach(b=>b.addEventListener('click',()=>{$$('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');plat=b.dataset.p;run();
 if(plat)send({t:'filter',q:plat})}));
const init=new URLSearchParams(location.search).get('q');if(init){q.value=init;run()}
})();
