const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../assets/arcade-models.js');
// Test the inverse of the actual scramble, rather than accepting a shuffled board as solvable.
for(let level=1;level<=250;level++){
 const puzzle=M.Sort.puzzle(level),again=M.Sort.puzzle(level);assert.deepEqual(puzzle,again);const t=puzzle.tubes.map(t=>[...t]);assert(!M.Sort.solved(t),'Unexpected already-solved level '+level);
 for(const [a,b]of puzzle.solution)assert(M.Sort.move(t,a,b),'Broken inverse on level '+level);
 assert(M.Sort.solved(t));assert(t.every(a=>a.length===0||a.length===4));
}
let t=[[0,1],[0],[],[1,1,1],[0,0]];assert(!M.Sort.move(t,0,1));assert(!M.Sort.move(t,0,0));assert(M.Sort.move(t,0,2));assert(M.Sort.move(t,0,1));
let b=M.brickGame();M.launchBrick(b);b.ball={x:5,y:400,vx:-300,vy:-100};M.brickStep(b,.02);assert(b.ball.vx>0);
b.ball={x:240,y:539,vx:0,vy:300};M.brickStep(b,.03);assert(b.ball.vy<0);assert.equal(b.lives,3);
b.ball={x:100,y:619,vx:0,vy:300};M.brickStep(b,.03);assert.equal(b.lives,2);assert.equal(b.state,'ready');M.brickStep(b,.03);assert.equal(b.ball.x,b.paddle);
for(let lost=0;lost<2;lost++){M.launchBrick(b);b.ball.y=621;M.brickStep(b,.01);}assert.equal(b.state,'over');assert.equal(b.lives,0);
b=M.brickGame();M.launchBrick(b);const brick=b.bricks[0];b.bricks=[brick,{x:420,y:30,w:30,h:10,hp:1}];b.ball={x:brick.x+20,y:brick.y+brick.h+8,vx:0,vy:-300};M.brickStep(b,.02);assert.equal(brick.hp,0);assert.equal(b.score,10);assert(b.ball.vy>0);
for(let level=1;level<=5;level++){b.level=level;b.bricks.forEach(x=>x.hp=0);b.state='playing';b.ball={x:240,y:400,vx:10,vy:-100};M.brickStep(b,.01);assert.equal(b.state,level===5?'won':'ready');assert.equal(b.level,level+1);}
b=M.brickGame();M.launchBrick(b);b.drops=[{x:240,y:540,type:'wide'},{x:240,y:540,type:'slow'}];M.brickStep(b,.01);assert(b.expanded>11.9&&b.slow>11.9);assert.equal(b.drops.length,0);
let g=M.golfGame();assert(M.shootGolf(g,-Math.PI/2,50));assert(!M.shootGolf(g,0,50));assert.equal(g.strokes,1);for(let i=0;i<2000&&g.state==='moving';i++)M.golfStep(g,1/120);assert.notEqual(g.state,'moving');
g=M.golfGame();g.state='moving';g.ball={x:240,y:110,vx:0,vy:-40};M.golfStep(g,.02);assert.equal(g.state,'holed');
g=M.golfGame();g.state='moving';g.ball={x:240,y:110,vx:0,vy:-350};M.golfStep(g,.02);assert.equal(g.state,'moving','Fast cup pass should not drop');
g=M.golfGame(2);g.state='moving';g.ball={x:100,y:305,vx:0,vy:-350};M.golfStep(g,.05);assert(g.ball.vy>0,'Barrier should reflect ball');assert(g.ball.y>302);
for(let index=0;index<M.holes.length;index++){g=M.golfGame(index);assert(g.ball.x>=8&&g.ball.x<=472);assert(g.ball.y>=8&&g.ball.y<=592);assert(M.holes[index].walls.every(([x,y,w,h])=>!(g.ball.x+8>x&&g.ball.x-8<x+w&&g.ball.y+8>y&&g.ball.y-8<y+h)));}
// Execute the actual browser controller for Color Sort with clickable DOM nodes.
const controller=fs.readFileSync(__dirname+'/../assets/new-games.js','utf8');
class Node{constructor(){this.children=[];this.attrs={};this.style={};this.events={};this.disabled=false;}append(...items){this.children.push(...items);}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,f){this.events[k]=f;}focus(){}}
function sortController(seed,blocked=false){const nodes=new Map(),storage=new Map(seed?[['ba_colorsort_v1',JSON.stringify(seed)]]:[]);const doc={body:{dataset:{game:'colorsort'}},getElementById:k=>{if(!nodes.has(k))nodes.set(k,new Node());return nodes.get(k);},createElement:()=>new Node(),createTextNode:s=>s};vm.runInNewContext(controller,{window:{BAArcade:M},document:doc,localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);}}});return {nodes,storage,click:i=>nodes.get('sort-board').children[i].events.click()};}
let ui=sortController();const solution=M.Sort.puzzle(1).solution;
for(const [a,c]of solution){ui.click(a);ui.click(c);}
assert.equal(ui.nodes.get('next').disabled,false);const winning=JSON.parse(ui.storage.get('ba_colorsort_v1'));assert(M.Sort.solved(winning.tubes));assert.equal(winning.bests[1],solution.length);
ui.nodes.get('undo').onclick();assert.equal(ui.nodes.get('next').disabled,true);assert.equal(ui.nodes.get('moves').textContent,solution.length-1);
ui.click(solution.at(-1)[0]);ui.click(solution.at(-1)[1]);ui.nodes.get('next').onclick();assert.equal(ui.nodes.get('level').textContent,2);
ui=sortController(JSON.parse(ui.storage.get('ba_colorsort_v1')));assert.equal(ui.nodes.get('level').textContent,2);assert.equal(ui.nodes.get('undo').disabled,true);
assert.doesNotThrow(()=>sortController({level:1,tubes:'invalid',moves:-3},true));
const golfNodes=new Map(),golfStorage=new Map(),paint=new Proxy({}, {get:()=>()=>{}});let frame,clock=1000;
const golfDoc={body:{dataset:{game:'minigolf'}},hidden:false,getElementById:k=>{if(!golfNodes.has(k)){const e=new Node();e.value=k==='angle'?-90:55;e.getContext=()=>paint;golfNodes.set(k,e);}return golfNodes.get(k);},querySelector:()=>null,addEventListener(){}};
vm.runInNewContext(controller,{window:{BAArcade:M,addEventListener(){}},document:golfDoc,requestAnimationFrame:f=>frame=f,localStorage:{getItem:k=>golfStorage.get(k)||null,setItem:(k,v)=>golfStorage.set(k,v)}});
// Finish each hole via the real cap/Next flow and catch score double-counting after Finish.
for(let hole=0;hole<6;hole++){
 for(let shot=0;shot<12;shot++){golfNodes.get('angle').value=90;golfNodes.get('power').value=10;golfNodes.get('shoot').onclick();for(let tick=0;tick<120;tick++){clock+=1000/60;frame(clock);}}
 assert.equal(golfNodes.get('strokes').textContent,12);assert.equal(golfNodes.get('next').disabled,false);golfNodes.get('next').onclick();
}
assert.equal(golfNodes.get('total').textContent,72);assert.equal(JSON.parse(golfStorage.get('ba_golf_best')),72);assert.match(golfNodes.get('game-status').textContent,/Course complete: 72 strokes/);assert.equal(golfNodes.get('shoot').disabled,true);assert.deepEqual(JSON.parse(golfStorage.get('ba_golf_course_v1')).scores,[]);
golfNodes.get('restart').onclick();assert.equal(golfNodes.get('total').textContent,0);assert.equal(golfNodes.get('best').textContent,72);
console.log('PASS: 250 solvable/reproducible Color Sort levels; actual controller win/undo/next/reload/blocked storage; Brick wall/paddle/brick/life/level/power-ups; Golf capture/fast miss/barrier/start rules and actual six-hole cap/Finish total/best/reset flow.');

