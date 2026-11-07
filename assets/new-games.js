(function(){
 'use strict';
 const M=window.BAArcade,$=id=>document.getElementById(id),game=document.body.dataset.game;
 const get=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}},put=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Games remain playable without storage. */}};
 const number=(value,fallback=0)=>Number.isFinite(value)&&value>=0?value:fallback;
 const status=text=>{$('game-status').textContent=text;};
 if(game==='colorsort'){
  const key='ba_colorsort_v1';let saved=get(key,{}),level=Number.isInteger(saved.level)&&saved.level>0&&saved.level<10000?saved.level:1;
  let tubes,moves=0,selected=null,history=[],won=false;let bests=Array.isArray(saved.bests)?saved.bests:[];
  const colors=['#ffd166','#6fdfb8','#a4bfff','#ff9dbb','#cfadff','#f6b27f','#89e0ea'];
  const validBoard=t=>{const n=Math.min(7,3+Math.floor((level-1)/2));return Array.isArray(t)&&t.length===n+2&&t.every(a=>Array.isArray(a)&&a.length<=4&&a.every(c=>Number.isInteger(c)&&c>=0&&c<n))&&Array.from({length:n},(_,i)=>t.flat().filter(c=>c===i).length).every(n=>n===4);};
  function persist(){put(key,{level,tubes,moves,bests});}
  function render(){
   const board=$('sort-board');board.replaceChildren();
   tubes.forEach((tube,i)=>{const button=document.createElement('button');button.type='button';button.className='ng-tube'+(selected===i?' selected':'');button.setAttribute('aria-pressed',String(selected===i));button.setAttribute('aria-label',`Tube ${i+1}: ${tube.length?tube.map(c=>String.fromCharCode(65+c)).join(', ')+' from bottom to top':'empty'}. Select to move a top counter.`);const vessel=document.createElement('span');vessel.className='ng-vessel';vessel.setAttribute('aria-hidden','true');tube.forEach(c=>{const counter=document.createElement('span');counter.className='ng-counter';counter.style.background=colors[c];counter.textContent=String.fromCharCode(65+c);vessel.append(counter);});button.append(vessel,document.createTextNode('Tube '+(i+1)));button.addEventListener('click',()=>choose(i));board.append(button);});
   $('level').textContent=level;$('moves').textContent=moves;$('best').textContent=number(bests[level],Infinity)===Infinity?'—':bests[level];$('undo').disabled=!history.length;$('next').disabled=!won;
  }
  function finish(){won=M.Sort.solved(tubes);if(won){bests[level]=Math.min(number(bests[level],Infinity),moves);status(`Level ${level} sorted in ${moves} moves! Next level is unlocked.`);}persist();render();}
  function choose(i){if(won)return;if(selected===null){if(!tubes[i].length){status('Choose a tube with a counter first.');return;}selected=i;status(`Tube ${i+1} selected. Choose an empty tube or one with the same top letter.`);render();$('sort-board').children[i]?.focus();return;}if(selected===i){selected=null;status('Selection cleared.');render();$('sort-board').children[i]?.focus();return;}const from=selected;if(!M.Sort.canMove(tubes,from,i)){status('That move does not fit. Choose an empty tube or a matching top letter.');return;}history.push(tubes.map(t=>[...t]));if(history.length>100)history.shift();M.Sort.move(tubes,from,i);moves++;selected=null;status(`Moved one counter from tube ${from+1} to tube ${i+1}.`);finish();$('sort-board').children[i]?.focus();}
  function start(resume=false){tubes=resume&&validBoard(saved.tubes)?saved.tubes:M.Sort.puzzle(level).tubes;moves=resume&&validBoard(saved.tubes)&&Number.isInteger(saved.moves)&&saved.moves>=0?saved.moves:0;selected=null;history=[];status('Group each letter into its own full tube. Each move transfers one top counter.');finish();}
  $('undo').onclick=()=>{if(!history.length)return;tubes=history.pop();moves=Math.max(0,moves-1);selected=null;won=false;status('Last move undone.');persist();render();};
  $('restart').onclick=()=>start();$('next').onclick=()=>{if(!won)return;level++;start();};start(true);return;
 }
 const canvas=$('game-canvas'),ctx=canvas.getContext('2d');let paused=false,last=0,keys=new Set(),pointer=null;
 function point(e){const box=canvas.getBoundingClientRect();return {x:(e.clientX-box.left)*480/box.width,y:(e.clientY-box.top)*600/box.height};}
 function text(s,x,y,size=20,color='#fff'){ctx.fillStyle=color;ctx.font=`700 ${size}px system-ui`;ctx.textAlign='center';ctx.fillText(s,x,y);}
 function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 let g,render,update,primary;
 function pause(force){paused=force??!paused;keys.clear();pointer=null;$('pause').textContent=paused?'Resume':'Pause';status(paused?'Paused. Resume when ready.':game==='brickbreaker'?g.message:'Aim when the ball stops. Drag back from the ball or use Angle and Power.');}
 if(game==='brickbreaker'){
  let best=number(get('ba_brick_best',0));g=M.brickGame();
  function hud(){if(g.score>best){best=g.score;put('ba_brick_best',best);}$('score').textContent=g.score;$('best').textContent=best;$('level').textContent=Math.min(g.level,5);$('lives').textContent=g.lives;$('launch').disabled=g.state!=='ready'||paused;}
  primary=()=>{if(paused)return;M.launchBrick(g);status(g.message);hud();};
  $('launch').onclick=primary;$('restart').onclick=()=>{g=M.brickGame();paused=false;$('pause').textContent='Pause';keys.clear();status(g.message);hud();};
  for(const [id,key]of [['left','ArrowLeft'],['right','ArrowRight']]){const button=$(id);button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(key);});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>keys.delete(key));}
  canvas.addEventListener('pointerdown',e=>{if(paused)return;canvas.focus();canvas.setPointerCapture(e.pointerId);g.paddle=M.clamp(point(e).x,67,413);pointer=e.pointerId;});
  canvas.addEventListener('pointermove',e=>{if(!paused&&pointer===e.pointerId)g.paddle=M.clamp(point(e).x,67,413);});
  canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
  update=dt=>{if(keys.has('ArrowLeft'))g.paddle-=420*dt;if(keys.has('ArrowRight'))g.paddle+=420*dt;g.paddle=M.clamp(g.paddle,g.expanded?67:45,g.expanded?413:435);const before=g.state,level=g.level,message=g.message;M.brickStep(g,dt);if(before!==g.state||level!==g.level||message!==g.message)status(g.message);hud();};
  render=()=>{ctx.fillStyle='#111a36';ctx.fillRect(0,0,480,600);ctx.strokeStyle='#263354';for(let y=25;y<600;y+=35){ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(470,y);ctx.stroke();}const palette=['#bca4ff','#ff9dbb','#ffd166','#6fdfb8','#8fc9ff','#e0acff','#ffb581','#81e0ec'];for(const b of g.bricks)if(b.hp){ctx.fillStyle=palette[Math.floor((b.y-65)/25)];ctx.fillRect(b.x,b.y,b.w,b.h);if(b.hp>1){ctx.fillStyle='#111a36';ctx.fillRect(b.x+20,b.y+6,11,5);}}for(const d of g.drops){circle(d.x,d.y,12,d.type==='wide'?'#6fdfb8':'#ffd166');text(d.type==='wide'?'W':'S',d.x,d.y+5,14,'#111a36');}ctx.fillStyle=g.expanded?'#6fdfb8':'#fff';ctx.fillRect(g.paddle-(g.expanded?67:45),550,g.expanded?134:90,12);circle(g.ball.x,g.ball.y,7,'#ffd166');if(g.state!=='playing'){ctx.fillStyle='#111a36dc';ctx.fillRect(25,310,430,100);text(g.state==='ready'?'Ready to launch':g.state==='won'?'Five levels cleared!':'Run complete',240,350,27);text(g.state==='ready'?'Press Launch or Space':'Choose New run to play again',240,382,16,'#d3dcf5');}};
  hud();status(g.message);
 }else if(game==='minigolf'){
  const key='ba_golf_course_v1',saved=get(key,{});let scores=Array.isArray(saved.scores)&&saved.scores.length<6&&saved.scores.every(n=>Number.isInteger(n)&&n>0&&n<=12)?saved.scores:[],best=number(get('ba_golf_best',0)),drag=null;
  g=M.golfGame(scores.length);
  function hud(){$('hole').textContent=(g.index+1)+'/6';$('strokes').textContent=g.strokes;$('total').textContent=scores.reduce((a,b)=>a+b,0)+(g.state==='finished'?0:g.strokes);$('best').textContent=best||'—';$('shoot').disabled=paused||g.state!=='aiming';$('next').disabled=!['holed','limit'].includes(g.state);$('next').textContent=g.index===5?'Finish course':'Next hole';$('angle').disabled=$('power').disabled=g.state!=='aiming';}
  function aim(){return {angle:Number($('angle').value)*Math.PI/180,power:Number($('power').value)};}
  function sliders(){const a=aim();$('angle-value').textContent=$('angle').value+'°';$('power-value').textContent=$('power').value+'%';return a;}
  function ready(){$('angle').value=-90;$('power').value=55;sliders();status(`Hole ${g.index+1}: ${M.holes[g.index].name}. Par ${M.holes[g.index].par}. Drag back from the ball and release, or set Angle and Power.`);hud();}
  primary=()=>{const a=aim();if(!paused&&M.shootGolf(g,a.angle,a.power)){drag=null;status('Ball moving…');hud();}};$('shoot').onclick=primary;
  $('angle').oninput=$('power').oninput=sliders;
  $('next').onclick=()=>{if(!['holed','limit'].includes(g.state)||paused)return;scores.push(g.strokes);if(g.index===5){const total=scores.reduce((a,b)=>a+b,0);if(!best||total<best){best=total;put('ba_golf_best',best);}put(key,{scores:[]});g.state='finished';$('next').disabled=true;status(`Course complete: ${total} strokes. Par 19. Best full course: ${best}. Choose New course to play again.`);hud();$('next').disabled=true;}else{put(key,{scores});g=M.golfGame(scores.length);ready();}};
  $('restart').onclick=()=>{scores=[];put(key,{scores});g=M.golfGame();paused=false;$('pause').textContent='Pause';drag=null;ready();};
  canvas.addEventListener('pointerdown',e=>{if(paused||g.state!=='aiming')return;const p=point(e);if(Math.hypot(p.x-g.ball.x,p.y-g.ball.y)>55){status('Start the drag on the white ball, then pull back and release.');return;}canvas.focus();canvas.setPointerCapture(e.pointerId);pointer=e.pointerId;drag=p;});
  canvas.addEventListener('pointermove',e=>{if(pointer!==e.pointerId||!drag||paused)return;drag=point(e);const dx=g.ball.x-drag.x,dy=g.ball.y-drag.y;$('angle').value=Math.round(Math.atan2(dy,dx)*180/Math.PI);$('power').value=M.clamp(Math.round(Math.hypot(dx,dy)/1.5),10,100);sliders();});
  canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;const p=point(e),distance=Math.hypot(p.x-g.ball.x,p.y-g.ball.y);pointer=null;drag=null;if(distance>=10)primary();});canvas.addEventListener('pointercancel',()=>{pointer=null;drag=null;});
  update=dt=>{const before=g.state;M.golfStep(g,dt);if(before==='moving'&&g.state==='aiming'&&g.strokes>=12)g.state='limit';if(before!==g.state){if(g.state==='holed')status(`Holed in ${g.strokes}! Choose ${g.index===5?'Finish course':'Next hole'}.`);else if(g.state==='limit')status('12-stroke limit reached. This hole scores 12; continue to the next hole.');else if(g.state==='aiming')status('Ball stopped. Adjust Angle and Power, or drag back for your next shot.');hud();}};
  render=()=>{const hole=M.holes[g.index];ctx.fillStyle='#0d5848';ctx.fillRect(0,0,480,600);for(let y=0;y<600;y+=60){ctx.fillStyle='#ffffff05';ctx.fillRect(0,y,480,30);}ctx.strokeStyle='#83cbae';ctx.lineWidth=4;ctx.strokeRect(2,2,476,596);for(const [x,y,w,h]of hole.walls){ctx.fillStyle='#bed8d5';ctx.fillRect(x,y,w,h);ctx.fillStyle='#7ca8a5';ctx.fillRect(x,y+h-4,w,4);}circle(...hole.cup,13,'#062d27');ctx.strokeStyle='#ffe198';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hole.cup[0],hole.cup[1]-5);ctx.lineTo(hole.cup[0],hole.cup[1]-47);ctx.stroke();ctx.fillStyle='#ffd166';ctx.fillRect(hole.cup[0],hole.cup[1]-47,25,15);text('Par '+hole.par,420,36,17,'#daefe8');if(g.state==='aiming'){const a=aim(),length=30+a.power*.8;ctx.setLineDash([7,6]);ctx.strokeStyle='#ffe198';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(g.ball.x,g.ball.y);ctx.lineTo(g.ball.x+Math.cos(a.angle)*length,g.ball.y+Math.sin(a.angle)*length);ctx.stroke();ctx.setLineDash([]);}circle(g.ball.x,g.ball.y,8,'#fff');if(g.state==='finished'){ctx.fillStyle='#062d27dd';ctx.fillRect(25,260,430,110);text('Course complete!',240,305,30);text(scores.reduce((a,b)=>a+b,0)+' strokes · par 19',240,340,20,'#ffe198');}};
  ready();
 }
 $('pause').onclick=()=>{pause();if(game==='brickbreaker')$('launch').disabled=paused||g.state!=='ready';if(game==='minigolf')$('shoot').disabled=paused||g.state!=='aiming';};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
 window.addEventListener('blur',()=>{keys.clear();});
 document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea,button,a')||document.querySelector('dialog[open]'))return;if(e.code==='Space'){e.preventDefault();if(!e.repeat)primary();}else if(e.key==='p'||e.key==='P'){if(!e.repeat)$('pause').click();}else if(game==='brickbreaker'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(e.key);}});
 document.addEventListener('keyup',e=>keys.delete(e.key));
 function frame(t){const dt=last?Math.min((t-last)/1000,.05):0;last=t;if(document.querySelector('dialog[open]')&&!paused)pause(true);if(!paused)update(dt);render();if(paused){ctx.fillStyle='#111a36cc';ctx.fillRect(90,250,300,90);text('Paused',240,305,30);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
