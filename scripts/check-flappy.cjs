const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(__dirname+'/../flappydash.html','utf8').replaceAll('\r\n','\n');
const end=s.slice(s.indexOf('  function endGame(){'),s.indexOf('  function draw(){'));
for(const [score,best,newBest] of [[4,5,false],[5,5,false],[6,5,true],[0,0,false]]){
 const c={state:'playing',score,best,bestEl:{},overlayText:{},overlaySub:{},overlayBtn:{},overlay:{classList:{add(){}}},saveBest(v){assert.equal(v,Math.max(score,best))}};
 vm.createContext(c);vm.runInContext(end,c);c.endGame();assert.equal(c.state,'over');assert.equal(c.overlaySub.textContent.includes('new best!'),newBest);
}
const keys=s.match(/document.addEventListener\('keydown', \(e\) => \{([\s\S]*?)\n  \}\);/)[1];
for(const [dialog,control,repeat,expectedFlaps,expectedPrevent] of [[false,false,false,1,1],[false,false,true,0,1],[false,true,false,0,0],[true,false,false,0,0]]){
 let flaps=0,prevented=0;const c={document:{querySelector(){return dialog}},flap(){flaps++}};vm.createContext(c);
 vm.runInContext('function handle(e){'+keys+'}',c);
 c.handle({code:'Space',repeat,target:{closest(){return control}},preventDefault(){prevented++}});
 assert.equal(flaps,expectedFlaps);assert.equal(prevented,expectedPrevent);
}
// Run the actual controller with a small DOM, not a second version of its rules.
const engine=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(code=>code.includes('function spawnPipe'));
function controller(saved,blocked=false){
 const nodes=new Map(),events={}; let modal=false;
 const element=()=>({textContent:'',classList:{add(){},remove(){}},addEventListener(){},getBoundingClientRect:()=>({width:390,height:520}),getContext:()=>({setTransform(){}})});
 const document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},querySelector(){return modal?{}:null},addEventListener(k,f){(events[k]??=[]).push(f)}};
 const c={document,window:{devicePixelRatio:1,addEventListener(){}},localStorage:{getItem(){if(blocked)throw Error('blocked');return saved},setItem(){}},requestAnimationFrame(){}};
 const instrumented=engine.replace(/requestAnimationFrame\(frame\);\s*\}\)\(\);\s*$/, 'requestAnimationFrame(frame); globalThis.api={flap,update,snapshot:()=>({state,score,best,bird:{...bird}})};})();');
 assert.notEqual(instrumented,engine);vm.runInNewContext(instrumented,c);
 return {api:c.api,document,nodes,modal(value){modal=value},emit(k,e){for(const f of events[k]||[])f(e)}};
}
for(const [saved,expected] of [[null,0],['9',9],['0',0],['NaN',0],['12points',0],['-3',0],['2.5',0],['Infinity',0],['9007199254740992',0]]){
 const game=controller(saved);assert.equal(game.api.snapshot().best,expected);assert.equal(game.nodes.get('best').textContent,expected);
}
assert.equal(controller('9',true).api.snapshot().best,0);
const game=controller('4');game.api.flap();assert.equal(game.api.snapshot().state,'playing');
game.document.hidden=true;game.emit('visibilitychange');assert.equal(game.api.snapshot().state,'paused');
const birdBefore=JSON.stringify(game.api.snapshot().bird);game.api.update(5);assert.equal(JSON.stringify(game.api.snapshot().bird),birdBefore);assert.equal(game.api.snapshot().score,0);
game.api.flap();assert.equal(game.api.snapshot().state,'paused');
game.document.hidden=false;game.emit('visibilitychange');assert.equal(game.api.snapshot().state,'paused');
game.api.flap();assert.equal(game.api.snapshot().state,'playing');assert.equal(game.api.snapshot().bird.vy,-420);
game.modal(true);game.emit('click',{target:{closest:()=>({})}});assert.equal(game.api.snapshot().state,'paused');
game.api.flap();assert.equal(game.api.snapshot().state,'paused');game.modal(false);game.api.flap();assert.equal(game.api.snapshot().state,'playing');
console.log('PASS: Flappy records/storage recovery, input isolation and actual controller hidden-tab/privacy pause, frozen physics and explicit resume.');
