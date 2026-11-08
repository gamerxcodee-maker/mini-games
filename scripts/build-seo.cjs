/* Crawlable metadata and visible navigation. No ranking/traffic claims. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),origin='https://brightarcade.in/';
const games=vm.runInNewContext(read('index.html').match(/const GAMES = (\[[\s\S]*?\n\]);/)[1]);
const collections={'2player':['2-player-games.html','2 Player Games'],puzzle:['puzzle-games.html','Puzzle Games'],action:['action-games.html','Action Games'],brain:['brain-games.html','Brain and Typing Games'],board:['board-games.html','Board and Card Games'],classic:['classic-games.html','Classic Games']};
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function decorate(file,source){
 if(!file.endsWith('.html'))return source;
 let html=source.replace(/<!-- ba-seo:start -->[\s\S]*?<!-- ba-seo:end -->\s*/g,'').replace(/<!-- ba-discovery:start -->[\s\S]*?<!-- ba-discovery:end -->\s*/g,'');
 const icon='<link rel="icon" type="image/svg+xml" sizes="any" href="/assets/favicon.svg"><link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">';
 if(file==='404.html')return html.replace('</head>','<!-- ba-seo:start -->'+icon+'<!-- ba-seo:end -->\n</head>');
 const game=games.find(g=>g.url===file),title=decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'Bright Arcade'),description=decode(html.match(/<meta name="description" content="([^"]+)"/)?.[1]||''),url=origin+(file==='index.html'?'':file),image=origin+'assets/social/'+(game?game.id:'bright-arcade')+'.jpg';
 const label=game?.name||decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g,'')||title.split(' — ')[0]);
 const trail=[{name:'Bright Arcade',url:origin}];
 if(game){const group=collections[game.cats[0]];if(group)trail.push({name:group[1],url:origin+group[0]});}
 else if(['2048-strategy.html','typing-practice.html','flappy-dash-tips.html'].includes(file))trail.push({name:'Game guides',url:origin+'game-guides.html'});
 if(file!=='index.html')trail.push({name:label,url});
 // Replace metadata that might have been supplied by an older page template.
 html=html.replace(/<meta\s+(?:property|name)="(?:og:image(?::[^"]+)?|twitter:image(?::[^"]+)?)"[^>]*>/g,'').replace(/<meta name="twitter:card" content="[^"]*">/g,'<meta name="twitter:card" content="summary_large_image">');
 if(!html.includes('name="twitter:card"'))html=html.replace('</head>','<meta name="twitter:card" content="summary_large_image"></head>');
 if(file==='index.html')html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(all,json)=>{try{return JSON.parse(json)['@type']==='WebSite'?'':all;}catch{return all;}});
 const schema=file==='index.html'?{'@context':'https://schema.org','@type':'WebSite',name:'Bright Arcade',alternateName:'BrightArcade',url:origin}:{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:trail.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,item:p.url}))};
 const meta=icon+`<meta property="og:image" content="${image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(game?game.name+' on Bright Arcade':'Bright Arcade — free browser games')}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${esc(game?game.name+' on Bright Arcade':'Bright Arcade — free browser games')}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><script defer src="/assets/share.js"></script>`;
 html=html.replace('</head>','<!-- ba-seo:start -->'+meta+'<!-- ba-seo:end -->\n</head>');
 const breadcrumb=file==='index.html'?'':`<nav class="ba-breadcrumb" aria-label="Breadcrumb"><ol>${trail.map((p,i)=>'<li>'+(i===trail.length-1?'<span aria-current="page">'+esc(p.name)+'</span>':'<a href="'+p.url+'">'+esc(p.name)+'</a>')+'</li>').join('')}</ol></nav>`;
 const share=`<section class="ba-share" aria-label="Share ${game?'this game':'this page'}"><h2>${game?'Share this game':'Share this page'}</h2><p>Send a direct link to ${esc(game?.name||'this page')}.</p><div><button type="button" data-ba-copy>Copy link</button><button type="button" data-ba-share hidden>Share…</button></div><label data-ba-link-label hidden>Page link<input type="text" readonly aria-label="Page link" value="${url}"></label><p role="status" aria-live="polite" data-ba-share-status></p></section>`;
 const marker='<footer class="ba-footer">';if(!html.includes(marker))throw Error('Shared footer missing '+file);
 return html.replace(marker,'<!-- ba-discovery:start -->'+breadcrumb+share+'<!-- ba-discovery:end -->\n'+marker);
}
module.exports={decorate,games,origin};
if(require.main===module){
 const check=process.argv.includes('--check'),files=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
 for(const file of files){const old=read(file),next=decorate(file,old);if(check){if(old.replaceAll('\r\n','\n')!==next.replaceAll('\r\n','\n'))throw Error('SEO output stale: '+file);}else fs.writeFileSync(path.join(root,file),next);}
 console.log((check?'PASS: checked ':'Built ')+files.length+' pages: social previews, icons, site name/breadcrumb data and share links.');
}
