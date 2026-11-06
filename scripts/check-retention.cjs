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
const c={document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},querySelectorAll:()=>cells},window:{location:{search:''},addEventListener:(k,f)=>events['ttt-'+k]=f},URLSearchParams,setTimeout:f=>{cpuTimers.set(++timerId,f);return timerId},clearTimeout:id=>cpuTimers.delete(id)};
vm.runInNewContext(code,c);
nodes.get('modeCpu').events.click();c.api.handleMove(0);assert.equal(cpuTimers.size,1);
const stale=[...cpuTimers.values()][0];c.api.newRound();assert.equal(cpuTimers.size,0);stale();assert.equal(c.api.state().board.filter(Boolean).length,0);
c.api.handleMove(0);nodes.get('mode2p').events.click();assert.equal(cpuTimers.size,0);stale();assert.equal(c.api.state().board.filter(Boolean).length,0);
nodes.get('modeCpu').events.click();c.api.handleMove(0);nodes.get('modeOnline').events.click();assert.equal(cpuTimers.size,0);stale();assert.equal(c.api.state().board.filter(Boolean).length,0);
nodes.get('modeCpu').events.click();c.api.handleMove(0);[...cpuTimers.values()][0]();assert.equal(c.api.state().board.filter(Boolean).length,2);assert.equal(c.api.state().turn,'x');
for(const bad of [-1,9,'0',null,NaN])c.api.handleMove(bad);assert.equal(c.api.state().board.filter(Boolean).length,2);
console.log('PASS: daily saved-progress states, blocked/malformed storage, midnight rollover; Tic Tac Toe CPU reset/mode cancellation, valid round and invalid move guards.');
class Emitter {
  constructor(){this.handlers={};this.open=false;this.sent=[];this.closed=false}
  on(k,f){(this.handlers[k]??=[]).push(f)}
  emit(k,...args){for(const f of this.handlers[k]||[])f(...args)}
  close(){this.closed=true;this.open=false;this.emit('close')}
  send(data){this.sent.push(data)}
}
const peers=[];
c.Peer=class extends Emitter{
  constructor(){super();peers.push(this)}
  destroy(){this.destroyed=true;this.emit('close')}
  connect(){this.connection=new Emitter();return this.connection}
};
function click(id){nodes.get(id).events.click()}
function create(){click('modeOnline');click('createRoomBtn');const p=peers.at(-1);p.emit('open');return p}
function connect(p){const conn=new Emitter();p.emit('connection',conn);conn.open=true;conn.emit('open');return conn}
let owner=create(),channel=connect(owner);
assert.match(nodes.get('onlineStatus').textContent,/Connected/);
channel.emit('data',null);channel.emit('data',{type:'move',index:0});assert.equal(c.api.state().board.filter(Boolean).length,0,'remote cannot play the host turn');
c.api.handleMove(0);channel.emit('data',{type:'move',index:4});assert.equal(c.api.state().board.filter(Boolean).length,2);
const extra=new Emitter();owner.emit('connection',extra);assert.equal(extra.closed,true);assert.equal(channel.closed,false);
click('leaveRoomBtn');assert.equal(channel.closed,true);assert.equal(owner.destroyed,true);assert.match(nodes.get('onlineStatus').textContent,/You left/);
const previous=owner;owner=create();channel=connect(owner);previous.emit('error');assert.match(nodes.get('onlineStatus').textContent,/Connected/,'stale errors do not affect a new room');
click('mode2p');assert.equal(owner.destroyed,true);channel.emit('data',{type:'move',index:2});assert.equal(c.api.state().board.filter(Boolean).length,0);
owner=create();channel=connect(owner);channel.emit('close');assert.match(nodes.get('onlineStatus').textContent,/Friend disconnected/);assert.equal(owner.destroyed,true);
click('modeOnline');nodes.get('joinCodeInput').value='bad';click('joinRoomBtn');assert.match(nodes.get('onlineStatus').textContent,/six-character/);
nodes.get('joinCodeInput').value=' abc234 ';click('joinRoomBtn');owner=peers.at(-1);owner.emit('open');channel=owner.connection;assert(channel);channel.open=true;channel.emit('open');assert.match(nodes.get('onlineStatus').textContent,/playing as O/);
events['ttt-pagehide']();assert.equal(owner.destroyed,true);assert.equal(channel.closed,true);
owner=create();click('joinRoomBtn'); // replacing a waiting room clears its previous timer/peer
assert.equal(owner.destroyed,true);
const timeout=[...cpuTimers.values()].at(-1);timeout();assert.match(nodes.get('onlineStatus').textContent,/timed out/);
delete c.Peer;click('createRoomBtn');assert.match(nodes.get('onlineStatus').textContent,/service could not load/);
console.log('PASS: Tic Tac Toe leave/mode/pagehide cleanup, stale callbacks, single guest, remote-turn validation, disconnect, room-code normalization, timeout and missing-service fallback.');
