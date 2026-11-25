// DramaHub static builder: content/*.json  ->  dist/ (SEO pages, sitemap, llms.txt)
const fs=require('fs'),path=require('path');
const SC=JSON.parse(fs.readFileSync(path.join(__dirname,'site.config.json'),'utf8'));
const CONFIG={NAME:SC.name,SITE:(process.env.SITE_URL||process.env.URL||'https://example.com').replace(/\/$/,''),TAGLINE:SC.tagline,EMAIL:SC.email,ABOUT:SC.about||'',META_TITLE:SC.meta_title,META_DESC:SC.meta_description,SOCIAL:SC.social||{}};
const {NAME,SITE}=CONFIG,R=__dirname,OUT=path.join(R,'dist');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clip=(s,n)=>{s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1).replace(/\s\S*$/,'')+'…':s};
const slugify=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
const plat=d=>d.platform||(/cdreader/.test(d.image_url)?'MoboReels':/shorttv/.test(d.image_url)?'ShortTV':/tikshorts/.test(d.image_url)?'TikShort':'Short Drama');

// ---- load every content/*.json (later files override earlier ones by id)
const map=new Map();
for(const f of fs.readdirSync(path.join(R,'content')).filter(f=>f.endsWith('.json')).sort()){
  const j=JSON.parse(fs.readFileSync(path.join(R,'content',f),'utf8'));
  for(const d of (Array.isArray(j)?j:[j])) if(d&&d.id){const o=map.get(String(d.id))||{};
    for(const k in d) if(d[k]!==''&&d[k]!=null) o[k]=d[k]; map.set(String(d.id),o);}
}
const skipped=[];
const items=[...map.values()].filter(d=>{const ok=d.title&&d.image_url&&(d.watch_now_link||d.full_drama_link);if(!ok)skipped.push(d.id);return ok})
 .map(d=>({...d,plat:plat(d),slug:(slugify(d.title)||'drama')+'-'+d.id,tags:d.tags||[]}))
 .sort((a,b)=>String(b.saved_at||'').localeCompare(String(a.saved_at||'')));

const LATEST=items.reduce((m,d)=>String(d.saved_at||'')>m?String(d.saved_at||''):m,'')||new Date().toISOString();
const ld=o=>`<script type="application/ld+json">${JSON.stringify(o).replace(/</g,'\\u003c')}</script>`;
const faqLd=f=>({'@context':'https://schema.org','@type':'FAQPage',mainEntity:f.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
const faqHtml=f=>`<section class="faq"><h2>FAQ</h2>${f.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`;
const rel='rel="sponsored nofollow noopener" target="_blank"';
const btns=d=>[d.watch_now_link&&`<a class="b p" href="${esc(d.watch_now_link)}" ${rel} data-a="watch" data-id="${d.id}" data-n="${esc(d.title)}">▶ Watch Now</a>`,
 d.full_drama_link&&`<a class="b ${d.watch_now_link?'s':'p'}" href="${esc(d.full_drama_link)}" ${rel} data-a="full" data-id="${d.id}" data-n="${esc(d.title)}">${d.watch_now_link?'Full Drama':'▶ Watch Full Drama'}</a>`].filter(Boolean).join('');
const card=d=>`<article class="card" data-p="${esc(d.plat)}" data-t="${esc((d.title+' '+d.plat+' '+d.tags.join(' ')+' '+clip(d.story,200)).toLowerCase())}"><a class="cv" href="/drama/${d.slug}/" data-a="open" data-id="${d.id}" data-n="${esc(d.title)}"><img src="${esc(d.image_url)}" alt="${esc(d.title)} poster" width="300" height="400" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="pl">${esc(d.plat)}</span></a><h3><a href="/drama/${d.slug}/">${esc(d.title)}</a></h3><div class="act">${btns(d)}</div></article>`;

const T=n=>fs.readFileSync(path.join(R,'templates',n+'.html'),'utf8');
const fill=(t,o)=>t.replace(/\{\{(\w+)\}\}/g,(_,k)=>o[k]??'');
// ---- ads: each slot = ads/<slot>.html (empty/comment-only = off)
const adf=n=>path.join(R,'ads',n);
const ADC=fs.existsSync(adf('config.json'))?JSON.parse(fs.readFileSync(adf('config.json'),'utf8')):{};
const adRaw=n=>fs.existsSync(adf(n+'.html'))?fs.readFileSync(adf(n+'.html'),'utf8'):'';
const strip=c=>c.replace(/<!--[\s\S]*?-->/g,'').trim();
const adScript=n=>ADC.enabled===false?'':strip(adRaw(n));
const adSlot=n=>{if(ADC.enabled===false)return '';const raw=adRaw(n),code=strip(raw);if(!code)return '';
 const m=raw.match(/<!--\s*isolate\s+(\d+)x(\d+)\s*-->/);
 const inner=m?`<iframe width="${m[1]}" height="${m[2]}" scrolling="no" frameborder="0" loading="lazy" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin" srcdoc="${esc('<!doctype html><html><body style="margin:0;background:transparent">'+code+'</body></html>')}"></iframe>`:code;
 return n==='sticky_bottom'?`<div class="ad-sticky"><button class="x" aria-label="Close ad">×</button>${inner}</div>`:`<div class="ad ad-${n}"><small>Advertisement</small>${inner}</div>`};
const adEvery=+ADC.in_feed_every||8;
const social=Object.entries(CONFIG.SOCIAL).filter(([,v])=>v);
const page=({title,desc,url,img,body,lds=[],type='website',noads=false,noindex=false,alt=''})=>fill(T('layout'),{ALT:alt,TITLE:esc(title),DESC:esc(desc),URL:SITE+url,TYPE:type,NAME,EMAIL:esc(CONFIG.EMAIL),
 ROBOTS:noindex?'noindex,follow':'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
 IMG:img?`<meta property="og:image" content="${esc(img)}"><meta name="twitter:image" content="${esc(img)}">`:'',LDS:lds.map(ld).join(''),BODY:body,YEAR:new Date().getFullYear(),
 TGBTN:CONFIG.SOCIAL.telegram?`<a class="tgb" href="${esc(CONFIG.SOCIAL.telegram)}" rel="noopener" target="_blank" data-a="telegram">✈ Join Telegram</a>`:'',
 SOCIAL:social.map(([k,v])=>`<a href="${esc(v)}" rel="noopener me" target="_blank">${esc(k[0].toUpperCase()+k.slice(1))}</a>`).join(''),
 ADS_HEAD:noads?'':adScript('head'),ADS_BODYEND:noads?'':adScript('body_end'),
 AD_HEADER:noads?'':adSlot('header_banner'),AD_FOOTER:noads?'':adSlot('footer_banner'),AD_STICKY:noads?'':adSlot('sticky_bottom')});
const grid=arr=>{const ad=adSlot('in_feed');return arr.map((d,i)=>card(d)+(ad&&(i+1)%adEvery===0&&i+1<arr.length?`<div class="adcell">${ad}</div>`:'')).join('')};
const w=(p,c)=>{const f=path.join(OUT,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c)};
fs.rmSync(OUT,{recursive:true,force:true});
if(fs.existsSync(path.join(R,'public')))fs.cpSync(path.join(R,'public'),OUT,{recursive:true});
for(const d of ['assets','videos']) if(fs.existsSync(path.join(R,d))) fs.cpSync(path.join(R,d),path.join(OUT,d),{recursive:true});

// ---- home
const plats=[...new Set(items.map(d=>d.plat))];
const tagCount={};items.forEach(d=>d.tags.forEach(t=>tagCount[t]=(tagCount[t]||0)+1));
const topTags=Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
const homeFaq=[[`What is ${NAME}?`,CONFIG.ABOUT],
 [`How can I watch full episodes of short dramas?`,`Open a drama page on ${NAME} and tap Watch Now. You are taken to the official platform (${plats.join(', ')}) where the full drama plays. Some platforms offer early episodes free and charge for later ones.`],
 [`Does ${NAME} host the videos?`,`No. ${NAME} is a directory. All videos are hosted and played by the official platforms.`],
 [`Which short drama genres are available?`,topTags.length?`Popular genres include ${topTags.join(', ')}.`:`Romance, werewolf, mafia, billionaire and revenge-themed titles are common.`],
 [`How often is ${NAME} updated?`,`New dramas are added regularly. The catalogue lists ${items.length} dramas and was last updated on ${LATEST.slice(0,10)}.`]];
const HOME_TITLE=CONFIG.META_TITLE||`${NAME} – Watch Short Dramas Full Episodes Online`;
const HOME_DESC=CONFIG.META_DESC||`Find trending short dramas and watch full episodes on official apps. ${items.length}+ titles with story summaries, episode info and direct links. Updated daily.`;
w('index.html',page({title:HOME_TITLE,desc:HOME_DESC,url:'/',img:SITE+'/assets/og-default.png',
 lds:[{'@context':'https://schema.org','@type':'WebPage',name:HOME_TITLE,description:HOME_DESC,url:SITE+'/',dateModified:LATEST,isPartOf:{'@type':'WebSite',name:NAME,url:SITE+'/'}},{'@context':'https://schema.org','@type':'Organization',description:CONFIG.ABOUT,name:NAME,url:SITE+'/',logo:SITE+'/assets/icon-512.png',sameAs:social.map(x=>x[1]),contactPoint:{'@type':'ContactPoint',email:CONFIG.EMAIL,contactType:'customer support'}},{'@context':'https://schema.org','@type':'WebSite',name:NAME,url:SITE+'/',potentialAction:{'@type':'SearchAction',target:`${SITE}/?q={search_term_string}`,'query-input':'required name=search_term_string'}},
  {'@context':'https://schema.org','@type':'ItemList',itemListElement:items.slice(0,50).map((d,i)=>({'@type':'ListItem',position:i+1,url:`${SITE}/drama/${d.slug}/`,name:d.title}))},faqLd(homeFaq)],
 body:fill(T('index'),{TAGLINE:CONFIG.TAGLINE,COUNT:items.length,PLATCOUNT:plats.length,
  CHIPS:plats.map(p=>`<button class="chip" data-p="${esc(p)}">${esc(p)}</button>`).join(''),
  NEW:items.slice(0,6).map(card).join(''),CARDS:grid(items),ABOUT:`<section class="aboutb"><h2>What is ${esc(NAME)}?</h2><p>${esc(CONFIG.ABOUT)}</p><ul><li>${items.length} short dramas listed</li><li>Platforms: ${esc(plats.join(', '))}</li><li>Last updated: ${LATEST.slice(0,10)}</li></ul></section>`,AD_BELOW_HERO:adSlot('below_hero'),FAQ:faqHtml(homeFaq)})}));

// ---- drama pages (one per JSON id)
const MDS=[];
const yt=u=>{const m=String(u).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);return m?`https://www.youtube.com/embed/${m[1]}`:u};
const videosOf=d=>{const v=[];
 if(d.video)v.push({k:'mp4',src:d.video});
 if(d.video_embed)v.push({k:'iframe',src:yt(d.video_embed)});
 if(d.telegram){const t=String(d.telegram).replace(/\?.*$/,'');v.push({k:'tg',src:t+'?embed=1&mode=tme'})}
 return v.filter(x=>/^(https:\/\/|\/)/.test(x.src))};
const para=x=>(Array.isArray(x)?x:String(x||'').split(/\n+/)).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
for(const d of items){
 const url=`/drama/${d.slug}/`,eps=+d.episodes||0,pf=+d.paid_from||0,link=d.watch_now_link||d.full_drama_link;
 const metaTitle=d.meta_title||`${d.title}${eps?` (${eps} Episodes)`:''} – Watch Full Drama Online | ${NAME}`;
 const desc=d.meta_description||clip(d.story||`Watch ${d.title} online on ${d.plat}.`,155);
 const faq=[[`What is "${d.title}" about?`,clip(d.story,350)||`${d.title} is a short drama available on ${d.plat}.`],
  [`Where can I watch "${d.title}"?`,`"${d.title}" is available on ${d.plat}. Use the Watch Now button on this page to open it${d.promo_code?`, or search the code ${d.promo_code} in the app`:''}.`],
  ...(eps?[[`How many episodes does "${d.title}" have?`,`"${d.title}" has ${eps} episodes${d.language?` in ${d.language}`:''}.`]]:[]),
  [`Is "${d.title}" free?`,pf?`The first ${pf-1} episodes are free on ${d.plat}; from episode ${pf} onward you need coins or a subscription.`:`Pricing is set by ${d.plat}. Early episodes are often free; later episodes may need coins or a subscription.`]];
 const md=[`# ${d.title}`,'',`URL: ${SITE}${url}`,`Platform: ${d.plat}`,eps?`Episodes: ${eps}`:null,d.language?`Language: ${d.language}`:null,d.tags.length?`Genre: ${d.tags.join(', ')}`:null,d.saved_at?`Updated: ${String(d.saved_at).slice(0,10)}`:null,'','## Story',d.story||'','',...(d.extra?['## Notes',...(Array.isArray(d.extra)?d.extra:String(d.extra).split(/\n+/)),'']:[]),'## How to watch',`Open the official ${d.plat} link on ${SITE}${url}${d.promo_code?` or search the code ${d.promo_code} in the app`:''}.`,'','## FAQ',...faq.flatMap(([q,a])=>[`**${q}**`,a,''])].filter(x=>typeof x==='string').join('\n');
 MDS.push(md);w(`drama/${d.slug}/index.md`,md);
 const vs=videosOf(d),vdate=d.video_date||d.saved_at||new Date().toISOString();
 const vlds=vs.map((v,i)=>({'@context':'https://schema.org','@type':'VideoObject',name:d.video_title||`${d.title} – Official Trailer`,description:clip(d.video_intro||d.story,300)||d.title,thumbnailUrl:[d.image_url],uploadDate:vdate,
  ...(d.video_duration?{duration:d.video_duration}:{}),...(v.k==='mp4'?{contentUrl:v.src.startsWith('http')?v.src:SITE+v.src}:{embedUrl:v.src})}));
 const vhtml=vs.length?`<section class="vid"><h2>Watch ${esc(d.title)} – Trailer &amp; Intro</h2>${d.video_intro?`<p>${esc(d.video_intro)}</p>`:''}<div class="vgrid">${vs.map(v=>v.k==='mp4'?`<video controls preload="none" playsinline poster="${esc(d.image_url)}" src="${esc(v.src)}"></video>`:`<iframe class="${v.k==='tg'?'tgf':'ytf'}" src="${esc(v.src)}" title="${esc(d.title)} video" loading="lazy" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>`).join('')}</div></section>`:'';
 const epsHtml=eps?`<section class="eps"><h2>Episodes (${eps})</h2><div class="epg">${Array.from({length:eps},(_,i)=>{const n=i+1,paid=pf&&n>=pf;return `<a class="ep${paid?' paid':''}" href="${esc(link)}" ${rel} data-a="episode" data-id="${d.id}" data-n="${esc(d.title)} EP${n}">${n}</a>`}).join('')}</div>${pf?`<p class="note">EP 1–${pf-1} free · EP ${pf}+ paid (coins / subscription)</p>`:''}</section>`:'';
 const facts=[['Platform',d.plat],eps&&['Episodes',eps],d.language&&['Language',d.language],pf&&['Free episodes',`EP 1–${pf-1}`],d.tags.length&&['Genre',d.tags.join(', ')],d.saved_at&&['Updated',String(d.saved_at).slice(0,10)]].filter(Boolean);
 const howto=`<section class="howto"><h2>How to watch ${esc(d.title)}</h2><ol><li>Tap <b>Watch Now</b> to open ${esc(d.plat)}.</li><li>Install or open the ${esc(d.plat)} app.</li>${d.promo_code?`<li>Search the code <b>${esc(d.promo_code)}</b> in the app to find the drama.</li>`:`<li>Search "${esc(d.title)}" in the app.</li>`}<li>Start from episode 1${pf?` (free until EP ${pf-1})`:''}.</li></ol></section>`;
 const tagSet=new Set(d.tags);
 const more=items.filter(x=>x.id!==d.id).map(x=>({x,s:x.tags.filter(t=>tagSet.has(t)).length*2+(x.plat===d.plat?1:0)})).sort((a,b)=>b.s-a.s).slice(0,8).map(o=>o.x);
 w(`drama/${d.slug}/index.html`,page({title:metaTitle,desc,url,img:d.image_url,type:'video.tv_show',alt:`<link rel="alternate" type="text/markdown" href="${url}index.md">`,
  lds:[{'@context':'https://schema.org','@type':'TVSeries',name:d.title,description:clip(d.story,500),image:d.image_url,url:SITE+url,...(d.saved_at?{dateModified:d.saved_at}:{}),genre:d.tags.length?d.tags:'Short drama',...(eps?{numberOfEpisodes:eps}:{}),...(d.language?{inLanguage:d.language}:{})},
   ...vlds,faqLd(faq),{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE+'/'},{'@type':'ListItem',position:2,name:d.title,item:SITE+url}]}],
  body:fill(T('drama'),{TITLE:esc(d.title),IMG:esc(d.image_url),PLAT:esc(d.plat),HOT:d.hot?'<span class="hot">🔥 Hot</span>':'',
   META:[eps&&`Total ${eps} episodes`,d.language,d.plat].filter(Boolean).map(esc).join(' · '),
   TAGS:d.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join(''),STORY:esc(d.story),BTNS:btns(d),
   CODE:d.promo_code?`<p class="code">Code: <b>${esc(d.promo_code)}</b> <button class="cp" data-code="${esc(d.promo_code)}" data-a="code" data-id="${d.id}" data-n="${esc(d.title)}">Copy</button></p>`:'',
   VIDEOS:vhtml,EPS:epsHtml,FACTS:`<section class="facts"><h2>${esc(d.title)} – quick facts</h2><table>${facts.map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table></section>`,
   HOWTO:howto,EXTRA:d.extra?`<section class="extra"><h2>More about ${esc(d.title)}</h2>${para(d.extra)}</section>`:'',AD_TOP:adSlot('drama_top'),AD_MID:adSlot('drama_mid'),AD_BOTTOM:adSlot('drama_bottom'),FAQ:faqHtml(faq),MORE:more.map(card).join('')})}));
}

// ---- static trust pages (pages/*.html) + ads.txt
const PAGES=[];
for(const f of fs.readdirSync(path.join(R,'pages')).filter(f=>f.endsWith('.html'))){
 const raw=fs.readFileSync(path.join(R,'pages',f),'utf8'),hd=(raw.match(/^<!--([\s\S]*?)-->/)||[,''])[1].split('|').map(x=>x.trim());
 const get=k=>fill((hd.find(x=>x.startsWith(k+':'))||'').slice(k.length+1).trim(),{NAME}),slug=f.replace('.html',''),url=`/${slug}/`,noindex=hd.includes('noindex');
 const body=fill(raw.replace(/^<!--[\s\S]*?-->/,''),{NAME,SITE,EMAIL:CONFIG.EMAIL});
 w(`${slug}/index.html`,page({title:`${get('title')} | ${NAME}`,desc:get('desc'),url,body:`<article class="page">${body}</article>`,noads:true,noindex}));PAGES.push({url,noindex,title:get('title')});
}
// ---- 404 page (Netlify serves dist/404.html automatically for unknown URLs)
w('404.html',page({title:`Page Not Found | ${NAME}`,desc:'The page you are looking for does not exist.',url:'/404.html',noads:true,noindex:true,
 body:`<section class="nf"><div class="nf-code">404</div><h1>Page not found</h1><p>The page may have been moved or removed. Try searching for a drama, or pick one below.</p><form class="nf-search" action="/" method="get"><input type="search" name="q" placeholder="Search drama, genre, platform…" aria-label="Search dramas"><button class="b p" type="submit">Search</button></form><p><a class="b s" style="display:inline-block;padding:10px 22px" href="/">← Back to home</a></p></section><h2 class="sec">Latest short dramas</h2><section class="grid">${items.slice(0,10).map(card).join('')}</section>`}));
const SPAGES=PAGES.filter(p=>!p.noindex).map(p=>`<url><loc>${SITE}${p.url}</loc><priority>0.3</priority></url>`).join('');
if(fs.existsSync(adf('ads.txt'))&&fs.readFileSync(adf('ads.txt'),'utf8').split('\n').some(l=>l.trim()&&!l.trim().startsWith('#')))fs.copyFileSync(adf('ads.txt'),path.join(OUT,'ads.txt'));

// ---- sitemap, robots, llms.txt
// ---- sitemap (pages + images + videos), robots, AI files
const X=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const day=x=>String(x||LATEST).slice(0,10),vurl=u=>u.startsWith('http')?u:SITE+u;
w('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`+
 `<url><loc>${SITE}/</loc><lastmod>${day()}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`+SPAGES+
 items.map(d=>`<url><loc>${SITE}/drama/${d.slug}/</loc><lastmod>${day(d.saved_at)}</lastmod><priority>0.8</priority><image:image><image:loc>${X(d.image_url)}</image:loc><image:title>${X(d.title)}</image:title></image:image>${videosOf(d).map(v=>`<video:video><video:thumbnail_loc>${X(d.image_url)}</video:thumbnail_loc><video:title>${X(d.video_title||d.title+' – Trailer')}</video:title><video:description>${X(clip(d.video_intro||d.story||d.title,2000))}</video:description>${v.k==='mp4'?`<video:content_loc>${X(vurl(v.src))}</video:content_loc>`:`<video:player_loc>${X(v.src)}</video:player_loc>`}<video:publication_date>${day(d.video_date||d.saved_at)}</video:publication_date></video:video>`).join('')}</url>`).join('')+`</urlset>`);
const BOTS=['Googlebot','Bingbot','GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-User','Claude-SearchBot','PerplexityBot','Google-Extended','Applebot-Extended'];
const rule=`Allow: /\nDisallow: /api/\nDisallow: /thanks/\n`;
w('robots.txt',`User-agent: *\n${rule}\n`+(SC.allow_ai_bots===false?'':BOTS.map(b=>`User-agent: ${b}\n${rule}`).join('\n')+'\n')+`Sitemap: ${SITE}/sitemap.xml\n`);
const facts=[`${NAME} is a directory of short dramas; it does not host or stream videos.`,`${items.length} dramas listed, from platforms: ${plats.join(', ')}.`,`Each drama page has: story summary, genre tags, episode info, FAQ and a link to watch the full drama on the official platform.`,`Last updated: ${LATEST.slice(0,10)}. New dramas are added regularly.`,`Contact: ${CONFIG.EMAIL}`];
w('llms.txt',`# ${NAME}\n\n> ${CONFIG.ABOUT}\n\n## Key facts\n${facts.map(f=>`- ${f}`).join('\n')}\n\n## Main pages\n- [Home](${SITE}/): ${HOME_DESC}\n${PAGES.filter(p=>!p.noindex).map(p=>`- [${p.title}](${SITE}${p.url})`).join('\n')}\n\n## Short dramas\n${items.map(d=>`- [${d.title}](${SITE}/drama/${d.slug}/index.md): ${d.plat}${(+d.episodes)?`, ${d.episodes} episodes`:''}. ${clip(d.story,120)}`).join('\n')}\n\n## Machine-readable\n- [Full content](${SITE}/llms-full.txt): every drama in Markdown\n- [JSON data](${SITE}/dramas.json)\n- [Sitemap](${SITE}/sitemap.xml)\n- [RSS feed](${SITE}/feed.xml)\n`);
w('llms-full.txt',`# ${NAME} – full content\n\n> ${CONFIG.ABOUT}\n\n${facts.map(f=>`- ${f}`).join('\n')}\n\n---\n\n${MDS.join('\n\n---\n\n')}\n`);
w('dramas.json',JSON.stringify({site:SITE,name:NAME,updated:LATEST,count:items.length,dramas:items.map(d=>({id:d.id,title:d.title,url:`${SITE}/drama/${d.slug}/`,platform:d.plat,episodes:+d.episodes||null,language:d.language||null,tags:d.tags,description:clip(d.story,500),image:d.image_url,updated:d.saved_at||null}))},null,1));
w('feed.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${X(NAME)}</title><link>${SITE}/</link><description>${X(HOME_DESC)}</description><language>en</language>${items.slice(0,50).map(d=>`<item><title>${X(d.title)}</title><link>${SITE}/drama/${d.slug}/</link><guid>${SITE}/drama/${d.slug}/</guid>${d.saved_at?`<pubDate>${new Date(d.saved_at).toUTCString()}</pubDate>`:''}<description>${X(clip(d.story,300))}</description></item>`).join('')}</channel></rss>`);
console.log(`Built ${items.length} dramas. Skipped (no title/image/link): ${skipped.length}`, skipped.join(','));
