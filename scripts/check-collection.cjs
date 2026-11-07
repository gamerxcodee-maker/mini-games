const assert=require('node:assert/strict'),fs=require('node:fs'),R=require('../assets/collection-rules.js'),A=require('../assets/collection-action-rules.js');
let assertions=0;const ok=(v,m)=>{assert(v,m);assertions++;};
for(let seed=1;seed<=100;seed++){
 const maze=R.maze(seed),seen=new Set([0]),queue=[0];while(queue.length){const i=queue.shift();for(const [d,delta]of [[0,-11],[1,1],[2,11],[3,-1]])if(!maze[i][d]){const j=i+delta;ok(j>=0&&j<121,'Maze boundary');ok(!maze[j][(d+2)%4],'Maze reciprocal wall');if(!seen.has(j)){seen.add(j);queue.push(j);}}}ok(seen.size===121,'Maze connectivity');
 const n=R.nonogram(seed);ok(R.nonogramSolved(n.board,n),'Nonogram solution');
 const l=R.lights(seed);for(const i of l.solution)R.lightsToggle(l.board,i);ok(l.board.every(v=>!v),'Lights reverse solution');
 const p=R.pipes(seed);ok(R.pipeWater(p.solved).has(24),'Pipe solution');
 const h=R.hashi(seed);ok(R.hashiSolved(h,h.solution),'Hashi connected solution');const empty=Array(12).fill(0);ok(!R.hashiSolved(h,empty),'Hashi incomplete rejection');
 const k=R.kakuro(seed);ok(R.kakuroSolved(k.board,k),'Kakuro valid construction');ok(!R.kakuroSolved(Array(9).fill(2),k),'Kakuro repeat rejection');
 const w=R.wordSearch(seed);ok(w.placements.length===5,'Five placed words');for(const p of w.placements){ok(p.cells.map(i=>w.board[i]).join('')===p.word,'Word placement matches letters');ok(R.wordSearchMatch(w,[],p.cells[0],p.cells.at(-1)),'Word endpoints accepted');ok(R.wordSearchMatch(w,[],p.cells.at(-1),p.cells[0]),'Reversed endpoints accepted');}
 const f=R.fleet(seed);ok(f.filter(Boolean).length===7,'Fleet cells');[3,2,2].forEach((n,i)=>ok(f.filter(v=>v===i+1).length===n,'Fleet ship length'));
 const m=R.mancalaNew(),random=R.rng(seed);for(let step=0;step<500&&!m.over;step++){const legal=m.pits.map((v,i)=>v&&((m.turn===1&&i<6)||(m.turn===2&&i>=7&&i<13))?i:-1).filter(i=>i>=0);ok(legal.length>0,'Mancala legal move');R.mancalaMove(m,legal[Math.floor(random()*legal.length)]);ok(m.pits.reduce((a,b)=>a+b,0)===48,'Mancala seed conservation');}ok(m.over,'Mancala terminates');
}
for(const line of [[0,1,2,3],[0,7,14,21],[0,8,16,24],[6,12,18,24]]){const b=Array(42).fill(0);line.forEach(i=>b[i]=1);ok(R.connectWin(b)===1,'Connect Four line');}
let b=Array(42).fill(0);[35,36,37].forEach(i=>b[i]=2);ok(R.connectCPU(b)===3,'CPU immediate win');b=Array(42).fill(0);[35,36,37].forEach(i=>b[i]=1);ok(R.connectCPU(b)===3,'CPU immediate block');
b=Array(64).fill(0);b[27]=b[36]=2;b[28]=b[35]=1;ok(R.reversiMoves(b,1).length===4,'Reversi start');let player=1,passes=0;for(let i=0;i<130&&passes<2;i++){const legal=R.reversiMoves(b,player);if(!legal.length){passes++;player=3-player;continue;}passes=0;const at=legal[0],flips=R.flips(b,at,player),before=b.filter(Boolean).length;flips.forEach(i=>b[i]=player);b[at]=player;ok(b.filter(Boolean).length===before+1,'Reversi occupancy');player=3-player;}ok(passes===2||b.every(Boolean),'Reversi termination');
const d=R.dotsNew();for(const type of ['h','v'])for(let i=0;i<12;i++)R.dotsMove(d,type,i);ok(d.boxes.every(Boolean),'Dots all boxes assigned');const prior=JSON.stringify(d);ok(!R.dotsMove(d,'h',0)&&JSON.stringify(d)===prior,'Dots duplicate guard');
let m=R.mancalaNew();R.mancalaMove(m,2);ok(m.turn===1&&m.pits[6]===1,'Mancala extra turn');m={pits:Array(14).fill(0),turn:1,over:false};m.pits[0]=1;m.pits[2]=1;m.pits[11]=5;m.pits[7]=1;R.mancalaMove(m,0);ok(m.pits[6]===6&&m.pits[11]===0,'Mancala opposite capture');
let l=R.ludoNew();l.roll=5;ok(!R.ludoMove(l,0),'Ludo base requires six');l.roll=6;ok(R.ludoMove(l,0)&&l.tokens[0][0]===0&&l.turn===0,'Ludo entry and repeat');l.tokens[0][0]=27;l.roll=2;ok(!R.ludoLegal(l,0),'Ludo exact home');l.roll=1;ok(R.ludoMove(l,0)&&l.tokens[0][0]===28,'Ludo home arrival');
const peg=R.pegNew();ok(peg.filter(v=>v===1).length===32,'Peg start');ok(R.pegMove(peg,10,24)&&peg.filter(v=>v===1).length===31,'Peg legal capture');ok(!R.pegMove(peg,0,24),'Peg invalid capture');
assert.deepEqual(R.codeFeedback([0,1,2,3],[0,0,4,5]),{exact:1,near:0});assert.deepEqual(R.codeFeedback([0,0,1,1],[1,0,1,0]),{exact:2,near:2});
// Push-state BFS: boxes plus the player's reachable region, without guessing a solution.
const sokobanSolutions=[];
for(let level=0;level<R.sokobanLevels.length;level++){
 const start=R.sokoban(level),queue=[start],visited=new Set();let solved=null;
 for(let head=0;head<queue.length&&head<150000;head++){
  const s=queue[head];if(s.goals.every(i=>s.boxes.includes(i))){solved=s;break;}
  const reachable=new Set([s.player]),walk=[s.player];for(let q=0;q<walk.length;q++){const a=walk[q];for(const [dy,dx]of [[-1,0],[1,0],[0,-1],[0,1]]){const y=Math.floor(a/s.w)+dy,x=a%s.w+dx,j=y*s.w+x;if(y>=0&&y<s.h&&x>=0&&x<s.w&&!s.walls[j]&&!s.boxes.includes(j)&&!reachable.has(j)){reachable.add(j);walk.push(j);}}}
  const key=[...s.boxes].sort((a,b)=>a-b).join(',')+'|'+Math.min(...reachable);if(visited.has(key))continue;visited.add(key);
  for(const box of s.boxes)for(const [dy,dx]of [[-1,0],[1,0],[0,-1],[0,1]]){const behind=box-dy*s.w-dx;if(!reachable.has(behind))continue;const next=JSON.parse(JSON.stringify(s));next.player=behind;if(R.sokobanMove(next,dy,dx))queue.push(next);}
 }
 ok(solved,'Sokoban level '+(level+1)+' must be solvable');sokobanSolutions.push({level:level+1,pushes:solved.pushes,states:visited.size});
}
ok(R.bowlingScore(Array(12).fill(10))===300,'Perfect bowling');ok(R.bowlingScore(Array(21).fill(5))===150,'All-spare bowling');ok(R.bowlingScore(Array(20).fill(0))===0,'Gutter bowling');ok(R.bowlingScore(Array.from({length:20},(_,i)=>i%2?0:9))===90,'Open bowling');ok(R.bowlingScore([10])===null,'Pending strike bonus');ok(R.bowlingProgress(Array(12).fill(10)).done,'Tenth bonus completion');ok(!R.bowlingProgress(Array(11).fill(10)).done,'Third tenth-frame ball');
ok(R.dartScore(0,-.3)===20&&R.dartScore(0,-.58)===60&&R.dartScore(0,-.95)===40,'Dart top rings');ok(R.dartScore(0,0)===50&&R.dartScore(.1,0)===25&&R.dartScore(2,0)===0,'Dart bulls and miss');
let run=A.runner();A.jump(run);const velocity=run.vy;A.jump(run);ok(run.vy===velocity,'No double jump');run=A.runner();run.state='playing';run.obstacles=[{x:90,type:'block'}];A.runnerStep(run,.01);ok(run.state==='over','Runner low collision');run=A.runner();run.state='playing';run.slide=true;run.obstacles=[{x:90,type:'arch'}];A.runnerStep(run,.01);ok(run.state==='playing','Runner sliding clearance');
let pin=A.pinball();A.launchPin(pin);pin.ball={x:150,y:522,vx:0,vy:200};pin.left=true;A.pinballStep(pin,.01);ok(pin.ball.vy<0,'Pinball left flipper');pin.ball={x:150,y:185,vx:0,vy:-100};A.pinballStep(pin,.02);ok(pin.score===10,'Pinball bumper');pin.ball.y=630;A.pinballStep(pin,.01);ok(pin.lives===2&&pin.state==='ready','Pinball drain');
ok(A.bowlHits(Array(10).fill(true),0,80).length>0,'Bowling line hits');ok(A.bowlHits(Array(10).fill(true),130,80).length===0,'Bowling gutter');ok(A.bowlHits(Array(10).fill(false),0,80).length===0,'No repeated pin score');
let fish=A.fish();fish.wait=.1;A.fishStep(fish,.05);A.fishStep(fish,.05);ok(fish.phase==='bite','Fishing bite');fish.phase='reeling';fish.elapsed=0;for(let i=0;i<1000&&fish.phase==='reeling';i++){fish.reel=fish.tension<55;A.fishStep(fish,.02);}ok(fish.phase==='caught','Fishing can be landed');fish=A.fish();fish.phase='reeling';fish.reel=true;for(let i=0;i<200;i++)A.fishStep(fish,.02);ok(fish.phase==='lost','Fishing high tension fails');
for(const f of ['collection-rules.js','collection-board.js','collection-action-rules.js','collection-action.js'])new(require('node:vm').Script)(fs.readFileSync(__dirname+'/../assets/'+f,'utf8'),{filename:f});
const duplicateWord={board:Array(64).fill('X'),placements:[{word:'CAT',cells:[0,1,2]}]};[0,1,2,8,9,10].forEach((i,k)=>duplicateWord.board[i]='CAT'[k%3]);ok(R.wordSearchMatch(duplicateWord,[],8,10),'Accidental valid copy accepted');ok(!R.wordSearchMatch(duplicateWord,[],0,10),'Bent endpoint rejected');
console.log('PASS: '+assertions+' collection assertions; 100 seeded maze/puzzle/fleet/Mancala cases; board wins/captures/turns; five Sokoban solutions; scoring and action collisions.');
console.log('Sokoban verified:',JSON.stringify(sokobanSolutions));
