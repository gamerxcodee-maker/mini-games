const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
let checks=0;
function check(ok,message){if(!ok)throw Error(message);checks++;}
const titles=new Set();
const descriptions=new Set();
for(const file of files){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
 const description=html.match(/<meta name="description" content="([^"]+)"/s)?.[1];
 check(title&&!titles.has(title),'Missing/duplicate title: '+file);titles.add(title);
 check(description&&!descriptions.has(description),'Missing/duplicate description: '+file);descriptions.add(description);
 const errorPage=file==='404.html';
 check((html.match(/rel="canonical"/g)||[]).length===(errorPage?0:1),'Canonical count: '+file);
 if(errorPage)check(html.includes('<meta name="robots" content="noindex">'),'Error page noindex');
 else check(html.includes('https://brightarcade.in/'+(file==='index.html'?'':file)+'"'),'Canonical URL: '+file);
 check(html.includes('data-privacy-open')&&html.includes('id="ba-privacy"'),'Missing privacy UI: '+file);
 check(!/<script[^>]+src="https:\/\/www.googletagmanager.com/.test(html),'Unconditional analytics: '+file);
 check(!/adsbygoogle|pagead2\.googlesyndication\.com/.test(html),'Unexpected live advertising code: '+file);
 check((html.match(/name="google-adsense-account" content="ca-pub-4926802783588277"/g)||[]).length===1,'AdSense verification: '+file);
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(m[1].includes('application/ld+json')){JSON.parse(m[2]);checks++;}
   else if(!m[1].includes('src=')){new vm.Script(m[2],{filename:file});checks++;}
 }
 const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 for(const m of markup.matchAll(/(?:href|src)="([^"]+)"/g)){
   const link=m[1];if(/^(?:https?:|mailto:|#|data:)/.test(link))continue;
   const target=decodeURIComponent(link.split(/[?#]/)[0]);
   check(fs.existsSync(path.join(root,target==='/'?'index.html':target.replace(/^\//,''))),'Broken local link '+file+' -> '+link);
 }
}
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
check(fs.readFileSync(path.join(root,'ads.txt'),'utf8').trim()==='google.com, pub-4926802783588277, DIRECT, f08c47fec0942fa0','Publisher ads.txt');
const indexable=files.filter(f=>f!=='404.html');
check((sitemap.match(/<loc>/g)||[]).length===indexable.length,'Sitemap coverage');
check(!sitemap.includes('/404.html'),'Error page excluded from sitemap');
for(const file of indexable)check(sitemap.includes('https://brightarcade.in/'+(file==='index.html'?'':file)+'</loc>'),'Missing sitemap URL: '+file);
const homepage=fs.readFileSync(path.join(root,'index.html'),'utf8');
const games=vm.runInNewContext(homepage.match(/const GAMES = (\[[\s\S]*?\n\]);/)[1]);
check(games.length===JSON.parse(fs.readFileSync(path.join(root,'content/game-guides.json'),'utf8')).length,'Game/guide count');
for(const game of games)check(homepage.split('<script>')[0].includes('href="'+game.url+'"'),'Game missing static link: '+game.id);
new vm.Script(fs.readFileSync(path.join(root,'assets/site.js'),'utf8'));
// Execute analytics controls in a small browser model: no network by default,
// opt-in loads exactly one GA script, rejection removes cookies and reloads.
for(const consent of [null,'denied','granted']){
 const listeners={},scripts=[],cookies=[];let reloads=0;
 const status={textContent:''};const dialog={showModal(){},close(){}};
 const document={head:{appendChild(s){scripts.push(s)}},createElement(){return {}},querySelectorAll(){return [{addEventListener(e,fn){listeners.open=fn}}]},querySelector(s){if(s==='#ba-privacy')return dialog;if(s==='#ba-consent-status')return status;return {addEventListener(e,fn){listeners[s]=fn}}},get cookie(){return '_ga=test; _ga_TEST=test; game_score=9'},set cookie(v){cookies.push(v)}};
 const storage=new Map(consent? [['ba_analytics_consent',consent]]:[]);
 const window={};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/site.js'),'utf8'),{window,document,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},location:{hostname:'brightarcade.in',reload(){reloads++}}});
 check(scripts.length===(consent==='granted'?1:0),'Analytics consent gating: '+consent);
 listeners['[data-analytics-deny]']();
 check(storage.get('ba_analytics_consent')==='denied'&&reloads===1,'Consent rejection');
 check(cookies.length===6&&!cookies.some(c=>c.startsWith('game_score')),'Analytics cookie cleanup');
}
console.log('PASS:',checks,'checks across',files.length,'HTML pages; scripts, links, metadata, sitemap and analytics consent.');
