const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../wordstreak.html','utf8');
let code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const WORDS ='));
code=code.replace("  startGame('daily');\n})();", "  startGame('daily');\n  globalThis.testApi={handleKey,startGame,yesterdayKey,state:()=>({curRow,curCol,over,targetWord,keyStates,activeDayKey}),score:(word,guess)=>{targetWord=word;keyStates={};colorRow(0,guess,true);}};\n})();");
// Normalize Windows newlines before inserting the test-only exports.
if(!code.includes('globalThis.testApi')){
 code=code.replaceAll('\r\n','\n').replace("  startGame('daily');\n})();", "  startGame('daily');\n  globalThis.testApi={handleKey,startGame,yesterdayKey,state:()=>({curRow,curCol,over,targetWord,keyStates,activeDayKey}),score:(word,guess)=>{targetWord=word;keyStates={};colorRow(0,guess,true);}};\n})();");
}
function run({storage=new Map(),date=[2026,10,5]}={}){
 let now=new Date(...date,12).getTime();const nodes=new Map(),events={};let dialog=false;
 class Element{
  constructor(){this.children=[];this.attrs={};this.style={};this.dataset={};this.textContent='';this.events={};this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};}
  set id(v){this._id=v;nodes.set(v,this)} get id(){return this._id}
  set innerHTML(v){this.children=[]} appendChild(e){this.children.push(e)}
  setAttribute(k,v){this.attrs[k]=v} addEventListener(k,fn){this.events[k]=fn} focus(){}
  querySelector(s){const key=s.match(/data-key="([^"]+)"/)[1];const visit=e=>e.dataset.key===key?e:e.children.map(visit).find(Boolean);return visit(this)}
 }
 for(const id of ['board','keyboard','message','streakVal','bestVal','modeDaily','modePractice','shareRow','shareWA','shareFB','shareRD','shareIG','shareCopy']){const e=new Element();e.id=id;}
 class FakeDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
 const context={Date:FakeDate,document:{createElement:()=>new Element(),getElementById:id=>{assert(nodes.has(id),'Missing node '+id);return nodes.get(id)},addEventListener:(e,fn)=>events[e]=fn,querySelector:()=>dialog},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>1,window:{location:{href:'https://brightarcade.in/wordstreak.html'}},navigator:{}};
 vm.createContext(context);vm.runInContext(code,context);
 return {api:context.testApi,nodes,storage,events,setDate:d=>{now=new Date(...d,12).getTime()},setDialog:v=>{dialog=v}};
}
function enter(game,word){for(const letter of word)game.api.handleKey(letter);game.api.handleKey('ENTER')}
let g=run();enter(g,g.api.state().targetWord);assert.equal(g.nodes.get('message').textContent,'Nice! You got it in 1/6');assert.equal(g.nodes.get('streakVal').textContent,1);
let restored=run({storage:g.storage});assert.equal(restored.nodes.get('message').textContent,'Nice! You got it in 1/6');assert.equal(restored.nodes.get('streakVal').textContent,1);assert(Object.values(restored.api.state().keyStates).every(v=>v==='correct'));
let consecutive=new Map([['wordstreak_streak',JSON.stringify({streak:3,best:3,lastWin:'2026-11-4'})]]);g=run({storage:consecutive});enter(g,g.api.state().targetWord);assert.equal(g.nodes.get('streakVal').textContent,4);
let skipped=new Map([['wordstreak_streak',JSON.stringify({streak:3,best:5,lastWin:'2026-11-2'})]]);g=run({storage:skipped});assert.equal(g.nodes.get('streakVal').textContent,0);enter(g,g.api.state().targetWord);assert.equal(g.nodes.get('streakVal').textContent,1);assert.equal(g.nodes.get('bestVal').textContent,5);
g=run({date:[2024,2,1]});assert.equal(g.api.yesterdayKey(),'2024-2-29');
g=run();g.api.score('apple','allee');assert.equal(g.nodes.get('tile-0-0').classes.has('correct'),true);assert.equal(g.nodes.get('tile-0-1').classes.has('present'),true);assert.equal(g.nodes.get('tile-0-2').classes.has('absent'),true);assert.equal(g.api.state().keyStates.l,'present');assert.equal(g.api.state().keyStates.e,'correct');
g=run();const absent='abcdefghijklmnopqrstuvwxyz'.split('').find(x=>!g.api.state().targetWord.includes(x));enter(g,absent.repeat(5));assert.equal(g.api.state().keyStates[absent],'absent');restored=run({storage:g.storage});assert.equal(restored.api.state().keyStates[absent],'absent');assert.equal(restored.api.state().curRow,1);
g=run();g.api.handleKey('a');g.setDate([2026,10,6]);g.api.handleKey('b');assert.equal(g.api.state().activeDayKey,'2026-11-6');assert.equal(g.api.state().curCol,0);
g=run();g.setDialog(true);g.events.keydown({key:'a',target:{closest:()=>false}});assert.equal(g.api.state().curCol,0);
g.setDialog(false);g.events.keydown({key:'a',target:{closest:()=>true}});assert.equal(g.api.state().curCol,0);
g.api.startGame('practice');enter(g,g.api.state().targetWord);assert(!g.storage.has('wordstreak_streak')||JSON.parse(g.storage.get('wordstreak_streak')).streak===0);
g=run({storage:new Map([['wordstreak_streak',JSON.stringify({streak:3,best:3,lastWin:'2026-11-4'})]])});
const missing='abcdefghijklmnopqrstuvwxyz'.split('').find(x=>!g.api.state().targetWord.includes(x));for(let n=0;n<6;n++)enter(g,missing.repeat(5));assert.equal(g.api.state().over,true);assert.equal(g.nodes.get('streakVal').textContent,0);restored=run({storage:g.storage});assert.equal(restored.api.state().over,true);assert(restored.nodes.get('message').textContent.startsWith('The word was '));
console.log('PASS: Word Streak first-try result, restored results/keyboard colours, consecutive/missed-day streaks, leap-day boundary, duplicate letters, daily rollover, privacy controls and practice isolation.');
