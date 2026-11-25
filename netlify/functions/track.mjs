// Netlify Function: POST /api/track -> Telegram
// Env vars (Netlify > Site settings > Environment variables): TG_TOKEN, TG_CHAT_ID, optional TG_VISITS=0
const ALLOWED={visit:'🟢 New visitor',search:'🔎 Search',filter:'🏷 Platform filter',open:'📖 Drama opened',watch:'💰 WATCH click (affiliate)',full:'💰 FULL DRAMA click (affiliate)',episode:'💰 EPISODE click (affiliate)',code:'🎟 Promo code copied'};
const e=s=>String(s??'').slice(0,180).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export default async (req,context)=>{
  if(req.method!=='POST')return new Response(null,{status:405});
  const ua=req.headers.get('user-agent')||'';
  if(/bot|crawl|spider|preview|curl|facebookexternalhit|headless/i.test(ua))return new Response(null,{status:204});
  const o=req.headers.get('origin');if(o&&new URL(o).host!==new URL(req.url).host)return new Response(null,{status:403});
  let d;try{d=JSON.parse(await req.text())}catch{return new Response(null,{status:400})}
  const title=ALLOWED[d.t];if(!title)return new Response(null,{status:400});
  const env=process.env;if(d.t==='visit'&&env.TG_VISITS==='0')return new Response(null,{status:204});
  const geo=context.geo||{},mob=/mobile|android|iphone/i.test(ua)?'📱 Mobile':'💻 Desktop';
  let src='Direct / Telegram / App';try{if(d.r)src=new URL(d.r).host}catch{}
  const utm=new URLSearchParams(d.u||'').get('utm_source');
  const L=[`<b>${title}</b>`];
  if(d.n)L.push(`Drama: <b>${e(d.n)}</b>`);
  if(d.t==='search')L.push(`Query: <b>${e(d.q)}</b> (${Number(d.c)||0} results${d.c==0?' ⚠️ no result':''})`);
  if(d.t==='filter')L.push(`Platform: ${e(d.q)}`);
  L.push(`Page: ${e(d.p)}`,`Source: ${e(utm||src)}`,`${mob} · ${e(geo.country?.code||'?')}${geo.city?', '+e(geo.city):''}`,new Date().toISOString().replace('T',' ').slice(0,16)+' UTC');
  if(env.TG_TOKEN&&env.TG_CHAT_ID)
    await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({chat_id:env.TG_CHAT_ID,text:L.join('\n'),parse_mode:'HTML',disable_web_page_preview:true})});
  return new Response(null,{status:204});
};
export const config={path:'/api/track'};
