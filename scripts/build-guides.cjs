const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),checkOnly=process.argv.includes('--check');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=read('index.html');
const games=vm.runInNewContext(source.match(/const GAMES = (\[[\s\S]*?\n\]);/)[1]);
const entries=JSON.parse(read('content/game-guides.json'));
if(entries.length!==games.length||new Set(entries.map(e=>e.id)).size!==games.length)throw Error('One unique guide entry required per game');
const byId=new Map(entries.map(e=>[e.id,e]));
for(const g of games){
 const e=byId.get(g.id);if(!e)throw Error('Missing guide for '+g.id);
 if(e.guide&&!fs.existsSync(path.join(root,e.guide)))throw Error('Missing standalone guide '+e.guide);
 if(!e.guide&&(!e.focus||!e.explain||!e.exampleTitle||!e.example||e.practice?.length!==3||!e.watch))throw Error('Incomplete practical guide '+g.id);
}
for(const e of entries)if(!games.some(g=>g.id===e.id))throw Error('Unknown game '+e.id);
const target=g=>byId.get(g.id).guide||g.url+'#practice-guide';
const nav=(links)=>'<nav class="ba-guide-directory" aria-label="Game guides">'+links.map(([href,label])=>`<a href="${esc(href)}">${esc(label)}</a>`).join('')+'</nav>';
const pending=new Map();let guideCount=0;
for(const g of games){
 const e=byId.get(g.id);let html=read(g.url);
 const related=games.filter(x=>x.id!==g.id&&x.cats.some(c=>g.cats.includes(c))).slice(0,2);
 const links=[['game-guides.html',`All ${games.length} game guides`],...related.map(x=>[target(x),x.name+' guide'])];
 let section;
 if(e.guide){
  section=`<section class="ba-practice" id="practice-guide" data-game-guide="${g.id}" aria-labelledby="practice-heading"><h2 id="practice-heading">${esc(g.name)} practice guide</h2><p>${esc(e.summary)}</p><p><a class="ba-play-link" href="${esc(e.guide)}">Read the ${esc(g.name)} guide</a></p>${nav(links)}</section>`;
 }else{
  section=`<section class="ba-practice" id="practice-guide" data-game-guide="${g.id}" aria-labelledby="practice-heading"><h2 id="practice-heading">${esc(g.name)} practice guide</h2><h3>${esc(e.focus)}</h3><p>${esc(e.explain)}</p><h3>${esc(e.exampleTitle)}</h3><p>${esc(e.example)}</p><h3>A focused practice session</h3><ol>${e.practice.map(s=>'<li>'+esc(s)+'</li>').join('')}</ol><h3>What to keep in mind</h3><p>${esc(e.watch)}</p>${nav(links)}</section>`;
 }
 const pattern=/<section class="ba-practice" id="practice-guide"[\s\S]*?<\/section>/;
 if(pattern.test(html))html=html.replace(pattern,section);
 else{
  const marker='<section class="ba-related" aria-label="Related games">';
  if(!html.includes(marker))throw Error('Related-game insertion point missing '+g.url);
  html=html.replace(marker,section+'\n'+marker);
 }
 pending.set(g.url,html);guideCount++;
 if(e.guide){
  let article=read(e.guide);const directory=nav([['game-guides.html',`Browse all ${games.length} game guides`],[g.url,'Play '+g.name]]);
  if(/<nav class="ba-guide-directory"/.test(article))article=article.replace(/<nav class="ba-guide-directory"[\s\S]*?<\/nav>/,directory);
  else article=article.replace('</main>',directory+'</main>');
  pending.set(e.guide,article);
 }
}
const title='Game Guides: Rules, Worked Examples and Practice Tips — Bright Arcade';
const description=`Find practical guides for all ${games.length} Bright Arcade games, with worked examples, controls, mistakes to avoid and focused practice sessions.`;
const canonical='https://brightarcade.in/game-guides.html';
const info=read('2048-strategy.html');const footer=info.slice(info.indexOf('<footer class="ba-footer">'));
const sorted=[...games].sort((a,b)=>a.name.localeCompare(b.name));
const hub=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Bright Arcade"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary"><meta name="google-adsense-account" content="ca-pub-4926802783588277"><link rel="stylesheet" href="assets/site.css"><script defer src="assets/site.js"></script></head><body class="ba-page"><header class="ba-page-header"><a href="/">Bright Arcade</a><a href="/#games">Play games</a></header><main class="ba-content"><p><a href="/">Home</a> / Game guides</p><h1>Practical guides for all ${games.length} games</h1><p>Choose a game for a worked example, mistakes to watch for and a focused practice session. Most guides open on the game page; 2048, Typing and Flappy Dash have separate longer guides.</p><h2>Choose your game</h2><div class="ba-cards">${sorted.map(g=>`<a class="ba-card" href="${target(g)}" data-guide-card="${g.id}"><strong>${esc(g.name)}</strong><span>${esc(byId.get(g.id).summary)}</span></a>`).join('')}</div><h2>Make a short session useful</h2><p>Read the controls first, choose one habit to practise and review a specific decision after the run. Compare results on the same difficulty and input method. Random layouts and opponents change, so a score difference alone does not tell you which habit improved.</p><p>Saved records usually belong to the browser where you played. See each game’s instructions for the exact scoring, mode and storage behaviour. For a rule that seems different from the guide, use the <a href="contact.html">contact page</a> to report the game and the situation.</p>${nav([['/','All games'],['puzzle-games.html','Puzzle games'],['action-games.html','Action games'],['board-games.html','Board games']])}</main>${footer}`;
pending.set('game-guides.html',hub);
let home=source;
const hubCard=`<a class="ba-card" href="game-guides.html" data-guide-hub><strong>Guides for all ${games.length} games</strong><span>Worked examples and focused practice for puzzles, action, board games and more.</span></a>`;
if(!home.includes('data-guide-hub')){
 const marker='<section class="ba-related" aria-label="Game guides"><h2>Learn as you play</h2><div class="ba-cards">';
 if(!home.includes(marker))throw Error('Homepage guide section missing');
 home=home.replace(marker,marker+hubCard);
}
pending.set('index.html',home);
for(const file of ['2-player-games.html','puzzle-games.html','action-games.html','brain-games.html','board-games.html','classic-games.html']){
 let category=read(file);if(!category.includes('href="game-guides.html"'))category=category.replace('<h2>Try another collection</h2>',nav([['game-guides.html',`Rules, examples and practice for all ${games.length} games`]])+'<h2>Try another collection</h2>');
 pending.set(file,category);
}
let sitemap=read('sitemap.xml');if(!sitemap.includes('<loc>'+canonical+'</loc>'))sitemap=sitemap.replace('</urlset>','  <url><loc>'+canonical+'</loc></url>\n</urlset>');pending.set('sitemap.xml',sitemap);
for(const [file,html]of pending){
 if(checkOnly){if(!fs.existsSync(path.join(root,file))||read(file).replaceAll('\r\n','\n')!==html.replaceAll('\r\n','\n'))throw Error('Guide output stale: '+file+'; run node scripts/build-guides.cjs');}
 else fs.writeFileSync(path.join(root,file),html);
}
console.log((checkOnly?'PASS: checked ':'Built ')+guideCount+' game guide entries, hub, related links and sitemap.');
