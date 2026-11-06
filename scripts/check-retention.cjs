const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname+'/../';
const daily=fs.readFileSync(root+'assets/daily-challenge.js','utf8');
let now=new Date(2026,10,6,23,59).getTime(),saved=null,blocked=false;
const progress={},link={},events={},timers=new Map();let next=0;
class Clock extends Date{constructor(...v){super(...(v.length?v:[now]))}}
const context={Date:Clock,document:{getElementById:id=>id==='daily-progress'?progress:link,addEventListener:(k,f)=>events[k]=f,hidden:false},window:{addEventListener:(k,f)=>events[k]=f},localStorage:{getItem:key=>{if(blocked)throw Error('blocked');return key==='wordstreak_daily_2026-11-6'?saved:null}},setTimeout:f=>{timers.set(++next,f);return next},clearTimeout:id=>timers.delete(id)};
vm.runInNewContext(daily,context);
assert.equal(link.textContent,"Play today's word");
for(const bad of ['oops','{}','{"guesses":["bad"]}','{"guesses":"hello"}']){saved=bad;events.storage();assert.equal(link.textContent,"Play today's word")}
saved=JSON.stringify({guesses:['crane','smile'],over:false,won:false});events.storage();assert.equal(link.textContent,'Continue daily word');assert.match(progress.textContent,/2\/6/);
saved=JSON.stringify({guesses:['crane'],over:true,won:true});events.pageshow();assert.match(progress.textContent,/solved in 1\/6/);
saved=JSON.stringify({guesses:Array(6).fill('crane'),over:true,won:false});events.storage();assert.match(progress.textContent,/complete/);assert.doesNotMatch(progress.textContent,/solved/);
now=new Date(2026,10,7,0,0,1).getTime();events.visibilitychange();assert.equal(link.textContent,"Play today's word");assert.equal(timers.size,1);
blocked=true;events.pageshow();assert.equal(link.textContent,"Play today's word");

const html=fs.readFileSync(root+'tictactoe.html','utf8');
let code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function cpuMove'));
code=code.replace(/newRound\(\);\s*\}\)\(\);\s*$/, 'newRound(); globalThis.api={newRound,handleMove,cpuMove,state:()=>({board,turn,vsCpu})};})();');
const nodes=new Map(),cells=Array.from({length:9},()=>element());
function element(){return {style:{},dataset:{},textContent:'',classList:{add(){},remove(){}},events:{},addEventListener(k,f){this.events[k]=f}}}
const cpuTimers=new Map();let timerId=0;
const c={document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},querySelectorAll:()=>cells},window:{location:{search:''}},URLSearchParams,setTimeout:f=>{cpuTimers.set(++timerId,f);return timerId},clearTimeout:id=>cpuTimers.delete(id)};
vm.runInNewContext(code,c);
nodes.get('modeCpu').events.click();c.api.handleMove(0);assert.equal(cpuTimers.size,1);
const stale=[...cpuTimers.values()][0];c.api.newRound();assert.equal(cpuTimers.size,0);stale();assert.equal(c.api.state().board.filter(Boolean).length,0);
c.api.handleMove(0);nodes.get('mode2p').events.click();assert.equal(cpuTimers.size,0);stale();assert.equal(c.api.state().board.filter(Boolean).length,0);
nodes.get('modeCpu').events.click();c.api.handleMove(0);nodes.get('modeOnline').events.click();assert.equal(cpuTimers.size,0);stale();assert.equal(c.api.state().board.filter(Boolean).length,0);
nodes.get('modeCpu').events.click();c.api.handleMove(0);[...cpuTimers.values()][0]();assert.equal(c.api.state().board.filter(Boolean).length,2);assert.equal(c.api.state().turn,'x');
for(const bad of [-1,9,'0',null,NaN])c.api.handleMove(bad);assert.equal(c.api.state().board.filter(Boolean).length,2);
console.log('PASS: daily saved-progress states, blocked/malformed storage, midnight rollover; Tic Tac Toe CPU reset/mode cancellation, valid round and invalid move guards.');
