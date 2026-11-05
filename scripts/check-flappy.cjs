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
console.log('PASS: Flappy best-score ties, new records, input/dialog keyboard isolation and held-Space scroll prevention.');
