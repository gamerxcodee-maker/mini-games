const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),R=require('../assets/collection-rules.js'),A=require('../assets/collection-action-rules.js');
const code=fs.readFileSync(__dirname+'/../assets/collection-action.js','utf8');
function harness(game,blocked=false){
 const nodes=new Map(),actionNodes=new Map(),events={},store=new Map();let clock=0,frame,privacy=false;
 const paint=new Proxy({}, {get:()=>()=>{},set:()=>true});
 class Element{
  constructor(){this.events={};this.style={};this.attrs={};this.textContent='';this.value='';this.dataset={};const classes=new Set();this.classList={add:c=>classes.add(c),remove:c=>classes.delete(c)};}
  set innerHTML(html){this.html=html;for(const m of html.matchAll(/\bid="([^"]+)"/g)){const e=new Element();nodes.set(m[1],e);if(m[1]==='cx-canvas'){e.height=game==='neonrunner'?320:game==='darts'?480:600;e.width=480;}}for(const m of html.matchAll(/data-do="([^"]+)"/g)){const e=new Element();e.dataset.do=m[1];actionNodes.set(m[1],e);}for(const m of html.matchAll(/id="([^"]+)"[^>]*value="([^"]+)"/g))nodes.get(m[1]).value=m[2];}
  get innerHTML(){return this.html;}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
  querySelector(selector){const key=selector.match(/data-do="([^"]+)"/)?.[1];return actionNodes.get(key)||null;}
  getContext(){return paint;}getBoundingClientRect(){return {left:0,top:0,width:480,height:this.height};}focus(){}setPointerCapture(){}
  insertAdjacentHTML(_,s){for(const m of s.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new Element());}
 }
 for(const id of ['cx-board','cx-controls','cx-bar','cx-status','cx-new','cx-title'])nodes.set(id,new Element());
 const doc={body:{dataset:{collection:game}},hidden:false,getElementById:k=>nodes.get(k),querySelector:()=>privacy?{}:null,addEventListener:(k,f)=>(events[k]??=[]).push(f)};
 const context={window:{BACollection:R,BAAction:A,addEventListener(){}},document:doc,Date:{now:()=>12345},performance:{now:()=>clock},requestAnimationFrame:f=>frame=f,localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return store.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');store.set(k,v);}}};
 vm.runInNewContext(code,context);
 const advance=seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++){clock+=1000/60;frame(clock);}};
 const action=key=>{for(const f of nodes.get('cx-controls').events.click||[])f({target:{closest:()=>({dataset:{do:key}})}});};
 const event=(key,type)=>{for(const f of actionNodes.get(key).events[type]||[])f({preventDefault(){},pointerId:1,code:'Space',key:' '});};
 return {nodes,store,doc,advance,action,event,privacy:v=>privacy=v,visibility:()=>{for(const f of events.visibilitychange||[])f();}};
}
let h=harness('reaction');h.nodes.get('cx-react').onclick();h.nodes.get('cx-react').onclick();assert.match(h.nodes.get('cx-status').textContent,/False start/);
for(let attempt=0;attempt<5;attempt++){h.nodes.get('cx-react').onclick();h.advance(4.5);assert.equal(h.nodes.get('cx-react').textContent,'TAP NOW');h.advance(.1);h.nodes.get('cx-react').onclick();}
assert.match(h.nodes.get('cx-status').textContent,/Five valid attempts complete/);assert(JSON.parse(h.store.get('ba_reaction_best'))>=100);
h.nodes.get('cx-new').onclick();h.nodes.get('cx-react').onclick();h.doc.hidden=true;h.visibility();assert.match(h.nodes.get('cx-status').textContent,/cancelled/);h.doc.hidden=false;
h.nodes.get('cx-react').onclick();h.privacy(true);h.advance(.1);assert.match(h.nodes.get('cx-status').textContent,/privacy choices cancelled/);
h=harness('mathsprint');h.nodes.get('cx-difficulty').value='easy';h.action('start');let question=h.nodes.get('cx-question').textContent.match(/(\d+) ([+−×]) (\d+)/),a=Number(question[1]),b=Number(question[3]);h.nodes.get('cx-answer').value=String(question[2]==='+'?a+b:question[2]==='−'?a-b:a*b);h.action('submit');assert.match(h.nodes.get('cx-bar').textContent,/Score 10/);h.nodes.get('cx-answer').value='999999';h.action('submit');assert.match(h.nodes.get('cx-bar').textContent,/Score 7/);
h.nodes.get('cx-pause').onclick();h.advance(70);assert.doesNotMatch(h.nodes.get('cx-status').textContent,/complete/);h.nodes.get('cx-pause').onclick();h.advance(61);assert.match(h.nodes.get('cx-status').textContent,/Sprint complete: 7 points/);assert.equal(JSON.parse(h.store.get('ba_mathsprint_best')),7);
h=harness('fishing');h.action('cast');h.advance(4.3); // Waiting delay is at most 4.1s; hook must still be within its 1.3s window.
assert.equal(h.nodes.get('cx-fish').textContent,'BITE!');h.action('hook');assert.match(h.nodes.get('cx-status').textContent,/Hooked/);
for(let i=0;i<1000&&!h.nodes.get('cx-status').textContent.startsWith('Landed');i++){const tension=Number(h.nodes.get('cx-tension').getAttribute('aria-valuenow'));h.event('reel',tension<52?'keydown':'keyup');h.advance(1/60);}
assert.match(h.nodes.get('cx-status').textContent,/Landed a/);assert(JSON.parse(h.store.get('ba_fishing_best'))>0);h.nodes.get('cx-new').onclick();h.advance(.1);assert.match(h.nodes.get('cx-bar').textContent,/Catches 0/);
h=harness('bowling');for(let i=0;i<12;i++){h.action('roll');h.advance(2);}assert.match(h.nodes.get('cx-status').textContent,/Game complete: 300 points/);assert.equal(JSON.parse(h.store.get('ba_bowling_best')),300);h.nodes.get('cx-new').onclick();h.advance(.1);assert.match(h.nodes.get('cx-bar').textContent,/Frame 1/);
for(const game of ['reaction','mathsprint','fishing','bowling','pinball','neonrunner','darts'])assert.doesNotThrow(()=>{const c=harness(game,true);c.advance(.1);c.nodes.get('cx-new').onclick();});
console.log('PASS: actual action controllers: five reaction attempts/record/reset/hidden/privacy cancellation; arithmetic accuracy/countdown/pause/result; fishing keyboard reel to a catch/reset; ten-frame bowling score/record/reset; blocked storage across all seven action games.');
