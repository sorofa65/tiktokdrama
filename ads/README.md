# Ads (Adsterra, AdSense, Monetag, PropellerAds …)
Prottek slot = ekta file. Network er code **sorasori paste** korun (JSON escape lagbe na). File faka/comment-only thakle oi slot bondho.
Ads shudhu **home + drama page** e ashe. About/Contact/Privacy/Terms e kono ad ashe na (trust + policy).

| File | Kothay dekhay | Ki boshabe |
|---|---|---|
| head.html | sob page `<head>` | AdSense auto-ads script, site verification |
| body_end.html | sob page `</body>` age | Social Bar, Popunder, Push, Interstitial |
| header_banner.html | header er niche | 728x90 / 320x50 / responsive |
| below_hero.html | search er niche (home) | banner |
| in_feed.html | grid er majhe, proti N card | native / 300x250 |
| drama_top / drama_mid / drama_bottom | drama page | banner / native |
| footer_banner.html | footer er upore | banner |
| sticky_bottom.html | screen er niche sticky | 320x50 |
| config.json | `enabled:false` dile sob ads bondho; `in_feed_every` | |
| ads.txt | `/ads.txt` hishebe publish hoy | network er ads.txt line |

## Adsterra banner (atOptions) tip
Ek page e ekadhik Adsterra banner e `atOptions` conflict hoy. Slot file er prothom line e likhun `<!-- isolate 300x250 -->` (width x height). Build oi code ta iframe er bhitore isolate kore dey, tai ekadhik banner thikmoto cholbe.
Social Bar / Popunder `body_end.html` e dian, isolate lagbe na.

## Kisu niyom
- Ad e nijer click korben na. Popunder beshi dile bounce rate ar SEO kharap hoy, ekta-duto network-i jothesto.
- AdSense use korle EU traffic er jonno Google Funding Choices (consent) chalu korun.
- Code paste/change korar por `git push`, Netlify auto deploy.
