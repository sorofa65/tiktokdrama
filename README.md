# TikTokDrama – Short Drama Affiliate Website

Static website (HTML/CSS/JS). `content/*.json` theke build hoy. GitHub e push korlei Netlify auto update kore.

## Project structure
```
content/            ← drama JSON file gulo (ekhane kaj korben)
templates/          ← layout.html, index.html (home), drama.html (drama page)
assets/             ← style.css, app.js, logo.svg, icon.svg, png icons
public/             ← favicon.ico, site.webmanifest (root e copy hoy)
videos/             ← nijer mp4 video
netlify/functions/  ← track.mjs (Telegram notification)
build.js            ← content theke dist/ banay
netlify.toml        ← Netlify config
dist/               ← AUTO toiri, edit korben na, GitHub e jabe na
```

## Content update (rojker kaj)
1. `content/` e notun file banan, jemon `content/2026-11-27.json`, ba purono file e item jog korun.
2. Format (array):
```json
[{
  "id": "150650322",
  "title": "Drama Title",
  "story": "Short blurb...",
  "image_url": "https://...jpg",
  "watch_now_link": "https://reels.cdreader.com/...",
  "full_drama_link": "https://eng.moboreels.com/...",
  "promo_code": "328URJ",
  "saved_at": "2026-11-27T06:00:00+06:00"
}]
```
3. Optional field: `episodes`, `language`, `paid_from`, `hot` (true), `tags` (["Mafia","Werewolf"]), `platform`,
   `video` ("/videos/x.mp4"), `video_embed` (YouTube link), `telegram` (public post link `https://t.me/channel/123`),
   `video_title`, `video_intro`, `video_duration` ("PT1M30S"), `video_date`, `extra` (nijer lekha review, `\n` = notun paragraph),
   `meta_title`, `meta_description`.
4. Save kore push korun (niche dekhun). 1-2 minute e site update.

## Niyom (must follow)
- `id` unique hote hobe. Same id arekbar dile porer file ta age-r data override kore.
- `title`, `image_url` ar komport ekta link (`watch_now_link` ba `full_drama_link`) na thakle drama site e ashbe na (build log e skip list dekhay).
- Notun drama sob somoy notun file e dian (date diye naam), purono file kom bodlan.
- Drama muchte hole JSON theke item delete korun, page auto bondho hoye jabe.
- Slug (URL) `title + id` theke auto hoy. Title bodlale URL bodle jay, tai publish-er por title bodlaben na.
- Prottek drama te `episodes`, `tags`, `extra` (nijer unique lekha) dilei SEO beshi kaj kore.
- Video: Telegram channel **public** hote hobe. mp4 file `videos/` e rekhe `"video":"/videos/name.mp4"` likhun.
- Token/password kokhono code ba JSON e likhben na. Shudhu Netlify Environment Variables e.
- `dist/` folder edit ba commit korben na.
- Push er age local e `node build.js` chalie error ache kina dekhe nin.

## Local e chalano (VS Code)
```
node build.js
npx serve dist
```
Telegram shoho test: `.env` file e `TG_TOKEN=...` ar `TG_CHAT_ID=...` likhe `npx netlify dev` chalan.

## GitHub e code rakha (prothom bar)
```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOURNAME/tiktokdrama.git
git push -u origin main
```
Er por content update: `git add . && git commit -m "add dramas 2026-11-27" && git push`.
(GitHub website e `content/` folder e **Add file → Upload files** diyeo kora jay.)

## Netlify auto deploy
1. netlify.com → **Add new site → Import an existing project → GitHub** → repo select korun.
2. Build settings auto ashbe (`netlify.toml` theke): command `node build.js`, publish `dist`. **Deploy** chapun.
3. **Site configuration → Environment variables** e dian:
   - `TG_TOKEN` (BotFather token)
   - `TG_CHAT_ID`
   - `SITE_URL` (apnar domain, jemon `https://tiktokdrama.com`)
   - `TG_VISITS=0` (optional, visitor alert bondho korte)
4. Env variable dewar por **Deploys → Trigger deploy**.
5. Er por GitHub e push korlei auto build + deploy hoy.
6. **Domain management** e custom domain add korun, tarpor `SITE_URL` update kore redeploy korun.

## SEO checklist
- Google Search Console e domain add kore `https://yourdomain/sitemap.xml` submit korun. Bing Webmaster-o korun.
- `llms.txt`, `robots.txt`, schema (TVSeries, VideoObject, FAQPage) auto toiri hoy.

## Trust pages, header/footer, contact form
- `pages/*.html` theke auto page toiri hoy: About, Contact, Privacy Policy, Terms, Disclaimer & Affiliate Disclosure, DMCA, Thanks.
  Prothom line e `<!-- title: ... | desc: ... -->`. Notun page: `pages/xyz.html` banan, `/xyz/` e ashbe, sitemap e jabe.
- `site.config.json` e site naam, tagline, **email** ar social link (telegram, facebook, youtube, instagram, x) dian. Header/footer/schema sob jaygay auto boshe.
- Contact form Netlify Forms diye cholbe (deploy er por Netlify → Forms e message dekhben; **Site configuration → Notifications** e email alert on korun). Spam er jonno honeypot ache.
- Privacy/Terms er lekha template, publish er age nijer desh onujayi ekbar poren (ami lawyer na).
- Cookie notice shob page e ashe.

## Ads
`ads/` folder dekhun, `ads/README.md` te slot list, Adsterra/AdSense/Monetag tips ache. Ads shudhu home + drama page e, legal/contact page e na.

## SEO / AI files (sob auto, build e toiri hoy)
- Home meta title/description ar "about" lekha `site.config.json` e (`meta_title`, `meta_description`, `about`). Eta bodlalei home page, llms.txt, schema sob update.
- `sitemap.xml` (page + drama + poster image + video), `robots.txt` (Google, Bing ar AI bot allow; band korte `"allow_ai_bots": false`),
  `llms.txt` (AI-er jonno site summary + sob drama list), `llms-full.txt` (sob drama-r full text), `dramas.json`, `feed.xml` (RSS),
  protita drama-r `index.md` (AI-friendly Markdown version).
- Notun drama JSON e dile sob file nijei update hoy, kichu korte hobe na.
