const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname+'/../';
const read=f=>fs.readFileSync(root+f,'utf8').replaceAll('\r\n','\n');
const scoreGames=['bubbleshooter','fruitslice','galaxyshooter','linedrop','mirrorflap','platformjumper','snake','stacktower','turbodash','whackamole','zombiesiege'];
for(const game of scoreGames){
 const s=read(game+'.html');assert(s.includes('runBestAtStart = loadBest();'));
 const lines=s.split('\n').filter(l=>l.includes('overlaySub.textContent =')&&l.includes('new best!'));
 for(const line of lines)for(const [score,start,expected] of [[0,0,false],[5,5,false],[6,5,true]]){
  const c={score,runBestAtStart:start,best:Math.max(score,start),wave:1,overlaySub:{}};vm.createContext(c);vm.runInContext(line,c);assert.equal(c.overlaySub.textContent.includes('new best!'),expected,game+' '+line);
 }
}
const turbo=read('turbodash.html');
const fn=(source,name)=>source.match(new RegExp('  function '+name+'\\([^)]*\\)\\{[\\s\\S]*?\\n  \\}'))[0];
let savedBest=10;
const element=()=>({textContent:'',classList:{add(){},remove(){}}});
const c={W:300,H:600,LANES:3,CAR_Y_RATIO:.8,laneX:[],coinScoreTotal:100,nearMissScore:50,scoreEl:element(),bestEl:element(),overlayText:element(),overlaySub:element(),overlayBtn:element(),overlay:element(),loadBest:()=>savedBest,saveBest:v=>{savedBest=v},getCss:()=>'',spawnParticles(){},spawnRow(){}};
vm.createContext(c);vm.runInContext(['computeLanes','newGame','refreshScore','crash','update'].map(n=>fn(turbo,n)).join('\n'),c);c.newGame();assert.equal(c.coinScoreTotal,0);assert.equal(c.nearMissScore,0);assert.equal(c.runBestAtStart,10);
c.started=true;c.rows=[{lane:0,y:481,passed:false}];c.coins=[{lane:1,y:480,taken:false}];c.update(0);assert.equal(c.score,25);c.update(0);assert.equal(c.score,25);c.newGame();assert.equal(c.coinScoreTotal,0);assert.equal(c.score,0);assert.equal(c.runBestAtStart,25);
// Memory Match: execute its actual game script with a small DOM and clock.
let memory=[...read('memorymatch.html').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const EMOJIS'));
memory=memory.replace('  newGame();\n})();','  newGame();\n  globalThis.testApi={newGame,onCardClick,state:()=>({flipped,locked,matchedCount,seconds})};\n})();');
const nodes=new Map();
class E{constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.attrs={};this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x)};}set innerHTML(v){this.children=[];this.html=v}get innerHTML(){return this.html}appendChild(e){this.children.push(e)}addEventListener(){}setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]}}
for(const id of ['board','moves','timer','best','overlay','overlayText','overlaySub','overlayBtn','newGameBtn'])nodes.set(id,new E());
let now=1000,id=0;const timers=new Map(),intervals=new Map(),storage=new Map();
const m={document:{getElementById:k=>nodes.get(k),querySelectorAll:()=>[],createElement:t=>new E(t)},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Date:{now:()=>now},setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:i=>timers.delete(i),setInterval:f=>{intervals.set(++id,f);return id},clearInterval:i=>intervals.delete(i)};
vm.createContext(m);vm.runInContext(memory,m);assert.equal(intervals.size,0);let cards=nodes.get('board').children;assert.equal(cards.length,16);assert.equal(cards[0].tagName,'BUTTON');
const first=cards[0],different=cards.find(x=>x.dataset.sym!==first.dataset.sym);m.testApi.onCardClick(first);assert.equal(intervals.size,1);now=32000;for(const f of intervals.values())f();assert.equal(nodes.get('timer').textContent,'0:31');m.testApi.onCardClick(different);assert.equal(timers.size,1);assert.equal(m.testApi.state().locked,true);m.testApi.newGame();assert.equal(timers.size,0);assert.equal(intervals.size,0);cards=nodes.get('board').children;m.testApi.onCardClick(cards[0]);assert.equal(m.testApi.state().flipped.length,1);
const partner=cards.find(x=>x!==cards[0]&&x.dataset.sym===cards[0].dataset.sym);m.testApi.onCardClick(partner);assert.equal(cards[0].disabled,true);assert.equal(partner.disabled,true);assert.equal(m.testApi.state().matchedCount,1);assert(cards[0].getAttribute('aria-label').includes('matched'));
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const s=read(file);for(const match of s.matchAll(/document.addEventListener\('keydown', \(e\) => \{([\s\S]*?)\n  \}\);/g)){const scope={document:{querySelector:()=>true}};vm.createContext(scope);vm.runInContext('function keyHandler(e){'+match[1]+'}',scope);scope.keyHandler({target:{closest:()=>false}});}}
const snakeCode=[...read('snake.html').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const GRID'));
let drawCalls=0;const paint=new Proxy({}, {get:()=>()=>{drawCalls++;return paint}});
const snakeNodes=new Map(),windowEvents={};
const snakeElement=()=>({textContent:'',classList:{add(){},remove(){}},addEventListener(){},getBoundingClientRect:()=>({width:380,height:380}),getContext:()=>paint});
const snakeContext={document:{getElementById:id=>{if(!snakeNodes.has(id))snakeNodes.set(id,snakeElement());return snakeNodes.get(id)},addEventListener(){},documentElement:{}},window:{addEventListener:(event,fn)=>windowEvents[event]=fn},getComputedStyle:()=>({getPropertyValue:()=> '#22d38a'}),localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>1,clearTimeout(){}};
vm.createContext(snakeContext);vm.runInContext(snakeCode,snakeContext);assert(drawCalls>0);windowEvents.resize();
console.log('PASS: 11 games distinguish tied/new records; Turbo coin reset and persistent bonuses; Memory mismatch reset, elapsed clock and keyboard cards; Snake initial draw/resize; document keyboard handlers isolate open dialogs.');
