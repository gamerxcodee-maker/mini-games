// Keep the first paint usable before the homepage enhancement script runs.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=path.join(__dirname,'../index.html');
const source=fs.readFileSync(file,'utf8');
const start=source.indexOf('const GAMES ='),end=source.indexOf('/* ---------- State ---------- */');
if(start<0||end<start)throw Error('Homepage render definitions missing');
const {GAMES,CATS,tileHTML,orderedGames}=vm.runInNewContext(source.slice(start,end)+'\n;({GAMES,CATS,tileHTML,orderedGames})');
const chips='<nav class="chips" id="chips" aria-label="Categories">'+CATS.map(c=>`<button class="chip" data-cat="${c.id}" aria-pressed="${c.id==='all'}">${c.label}</button>`).join('')+'</nav>';
const grid='<div class="grid" id="grid">'+orderedGames().map(g=>tileHTML(g)).join('')+'</div>';
const future=orderedGames([{id:'future-game',cats:['puzzle']},...GAMES]);
if(future[0].id!=='2048'||future[1].id!=='sudoku'||future.findIndex(g=>g.id==='future-game')<Math.max(...future.map((g,i)=>g.cats.includes('classic')?i:-1)))throw Error('Classic-first priority was lost');
let result=source.replace(/<nav class="chips" id="chips" aria-label="Categories">[\s\S]*?<\/nav>/,chips).replace(/<div class="grid" id="grid">[\s\S]*?<\/div>/,grid);
// Keep the text directory in the same priority order as the playable grid.
result=result.replace(/(<h2>All \d+ games, with instructions<\/h2>[\s\S]*?<div class="ba-cards">)([\s\S]*?)(<\/div>)/,(whole,before,body,after)=>{
 const cards=new Map([...body.matchAll(/<a class="ba-card" href="([^"]+)">[\s\S]*?<\/a>/g)].map(m=>[m[1],m[0]]));
 if(cards.size!==GAMES.length)throw Error('Homepage text directory coverage differs from games');
 return before+orderedGames().map(g=>cards.get(g.url)).join('')+after;
});
if(process.argv.includes('--check')){
 if(result!==source)throw Error('Homepage static tiles/categories are stale. Run node scripts/prerender-home.cjs');
 console.log('PASS: homepage tiles and category controls are present before JavaScript and match the game definitions.');
}else{fs.writeFileSync(file,result);console.log('Prerendered homepage tiles and categories.');}
