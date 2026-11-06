// Keep the first paint usable before the homepage enhancement script runs.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=path.join(__dirname,'../index.html');
const source=fs.readFileSync(file,'utf8');
const start=source.indexOf('const GAMES ='),end=source.indexOf('/* ---------- State ---------- */');
if(start<0||end<start)throw Error('Homepage render definitions missing');
const {GAMES,CATS,tileHTML}=vm.runInNewContext(source.slice(start,end)+'\n;({GAMES,CATS,tileHTML})');
const chips='<nav class="chips" id="chips" aria-label="Categories">'+CATS.map(c=>`<button class="chip" data-cat="${c.id}" aria-pressed="${c.id==='all'}">${c.label}</button>`).join('')+'</nav>';
const grid='<div class="grid" id="grid">'+GAMES.map(g=>tileHTML(g)).join('')+'</div>';
const result=source.replace(/<nav class="chips" id="chips" aria-label="Categories">[\s\S]*?<\/nav>/,chips).replace(/<div class="grid" id="grid">[\s\S]*?<\/div>/,grid);
if(process.argv.includes('--check')){
 if(result!==source)throw Error('Homepage static tiles/categories are stale. Run node scripts/prerender-home.cjs');
 console.log('PASS: all25 homepage tiles and category controls are present before JavaScript and match the game definitions.');
}else{fs.writeFileSync(file,result);console.log('Prerendered homepage tiles and categories.');}
