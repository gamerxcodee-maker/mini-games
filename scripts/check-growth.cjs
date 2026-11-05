const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const root=__dirname+'/../';
const source=fs.readFileSync(root+'2048.html','utf8').replaceAll('\r\n','\n');
const merge=source.match(/function slideRowLeft\(row\)\{[\s\S]*?\n  \}\n\n  function rotateGridCW/)[0].split('\n\n  function rotateGridCW')[0];
const sandbox={SIZE:4,won:false};vm.createContext(sandbox);vm.runInContext(merge,sandbox);
for(const [before,after,gained] of [[[2,2,2,0],[4,2,0,0],4],[[2,2,4,4],[4,8,0,0],12],[[4,4,8,0],[8,8,0,0],8],[[2,4,8,16],[2,4,8,16],0]]){
 const result=sandbox.slideRowLeft(before);assert.deepEqual(Array.from(result.row),after);assert.equal(result.gained,gained);
}
const typing=fs.readFileSync(root+'typingtest.html','utf8').replaceAll('\r\n','\n');
const timer=typing.match(/function startTimer\(\)\{[\s\S]*?\n  \}\n\n  function updateLiveWpm/)[0].split('\n\n  function updateLiveWpm')[0];
let now=1000,callback,finished=0;
const clock={Date:{now:()=>now},startTime:null,timeLimit:60,timeLeft:60,timeValEl:{textContent:60},timerInterval:null,setInterval:fn=>{callback=fn;return 1},updateLiveWpm(){},finishTest(reason){assert.equal(reason,'time');finished++}};
vm.createContext(clock);vm.runInContext(timer,clock);clock.startTimer();
now=32000;callback();assert.equal(clock.timeLeft,29);assert.equal(finished,0);
now=62000;callback();assert.equal(clock.timeLeft,0);assert.equal(finished,1);
assert(typing.includes('aria-label="Type the passage here"'));assert(typing.includes("textPanel.addEventListener('focus'"));
assert(source.includes("document.querySelector('dialog[open]')"));
console.log('PASS: guide merge examples, no-chain merge rule, throttled typing timer, keyboard input labelling and dialog guard.');
