/* Original Bright Arcade game rules. Shared by the browser and regression checks. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BAArcade=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 const Sort={
  solved:t=>t.every(a=>!a.length||(a.length===4&&a.every(c=>c===a[0]))),
  canMove(t,a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a!==b&&!!t[a]?.length&&Array.isArray(t[b])&&t[b].length<4&&(!t[b].length||t[a].at(-1)===t[b].at(-1));},
  move(t,a,b){if(!this.canMove(t,a,b))return false;t[b].push(t[a].pop());return true;},
  puzzle(level){
   const n=Math.min(7,3+Math.floor((level-1)/2)),rng=random(level*7919),t=Array.from({length:n},(_,i)=>Array(4).fill(i));t.push([],[]);
   let previous='',reverse=[];
   // Reverse one-counter moves from a solved board. Every scramble step has a legal inverse.
   for(let k=0;k<120+n*30;k++){
    const choices=[];
    for(let a=0;a<t.length;a++)if(t[a].length&& (t[a].length===1||t[a].at(-1)===t[a].at(-2)))for(let b=0;b<t.length;b++)if(a!==b&&t[b].length<4&&`${a},${b}`!==previous)choices.push([a,b]);
    if(!choices.length)break;const [a,b]=choices[Math.floor(rng()*choices.length)];t[b].push(t[a].pop());reverse.unshift([b,a]);previous=`${b},${a}`;
   }
   return {tubes:t,solution:reverse};
  }
 };
 function brickLevel(level){const rows=3+Math.min(level,5);return Array.from({length:rows*8},(_,i)=>({x:15+i%8*57,y:65+Math.floor(i/8)*25,w:51,h:18,hp:level>1&&Math.floor(i/8)===0?2:1}));}
 function brickGame(){return {level:1,lives:3,score:0,paddle:240,ball:{x:240,y:535,vx:0,vy:0},bricks:brickLevel(1),drops:[],expanded:0,slow:0,state:'ready',message:'Move the paddle, then launch.'};}
 function launchBrick(g){if(g.state!=='ready')return;g.ball={x:g.paddle,y:535,vx:155,vy:-280};g.state='playing';g.message='Clear every brick. Catch the power-ups.';}
 function brickStep(g,dt){
  if(g.state!=='playing'){if(g.state==='ready'){g.ball.x=g.paddle;g.ball.y=535;}return;}
  const steps=Math.ceil(Math.min(dt,.05)*240),h=Math.min(dt,.05)/steps;
  for(let s=0;s<steps&&g.state==='playing';s++){
   g.expanded=Math.max(0,g.expanded-h);g.slow=Math.max(0,g.slow-h);const ball=g.ball,oldY=ball.y,r=7,half=g.expanded?67:45,mult=g.slow>0?0.7:1;
   ball.x+=ball.vx*h*mult;ball.y+=ball.vy*h*mult;
   if(ball.x<r){ball.x=r;ball.vx=Math.abs(ball.vx);}if(ball.x>480-r){ball.x=480-r;ball.vx=-Math.abs(ball.vx);}if(ball.y<r){ball.y=r;ball.vy=Math.abs(ball.vy);}
   if(ball.vy>0&&oldY+r<=550&&ball.y+r>=550&&Math.abs(ball.x-g.paddle)<half+r){const offset=clamp((ball.x-g.paddle)/half,-1,1),speed=Math.min(470,Math.hypot(ball.vx,ball.vy)+3);ball.vx=Math.sin(offset*1.05)*speed;ball.vy=-Math.cos(offset*1.05)*speed;ball.y=543;}
   for(const brick of g.bricks){if(brick.hp<=0||ball.x+r<brick.x||ball.x-r>brick.x+brick.w||ball.y+r<brick.y||ball.y-r>brick.y+brick.h)continue;
    if(oldY+r<=brick.y||oldY-r>=brick.y+brick.h){ball.vy*=-1;ball.y=oldY;}else {ball.vx*=-1;ball.x+=Math.sign(ball.vx)*3;}
    brick.hp--;g.score+=10;if(brick.hp===0&&g.bricks.filter(b=>b.hp===0).length%9===0)g.drops.push({x:brick.x+25,y:brick.y,type:g.bricks.filter(b=>b.hp===0).length/9%2?'wide':'slow'});break;
   }
   for(const drop of g.drops){drop.y+=100*h;if(drop.y>536&&drop.y<570&&Math.abs(drop.x-g.paddle)<half+10){if(drop.type==='wide')g.expanded=12;else g.slow=12;drop.y=700;g.message=drop.type==='wide'?'Wide paddle: 12 seconds.':'Slow ball: 12 seconds.';}}
   g.drops=g.drops.filter(d=>d.y<620);
   if(ball.y>620){g.lives--;g.drops=[];g.expanded=0;g.slow=0;g.state=g.lives?'ready':'over';g.message=g.lives?'Ball lost. Launch when ready.':'Run finished. Start a new run to try again.';}
   else if(g.bricks.every(b=>b.hp===0)){g.level++;g.drops=[];g.expanded=0;g.slow=0;if(g.level>5){g.state='won';g.message='All five levels cleared!';}else{g.bricks=brickLevel(g.level);g.state='ready';g.message='Level cleared! Launch to continue.';}}
  }
 }
 const holes=[
  {name:'First line',start:[240,500],cup:[240,100],par:2,walls:[]},
  {name:'Split fairway',start:[110,500],cup:[370,100],par:3,walls:[[205,225,70,180]]},
  {name:'Bank shot',start:[95,490],cup:[390,115],par:3,walls:[[0,270,340,24]]},
  {name:'Through the gate',start:[240,510],cup:[240,90],par:3,walls:[[0,290,190,25],[290,290,190,25],[100,150,90,22],[290,150,90,22]]},
  {name:'Switchback',start:[100,510],cup:[100,90],par:4,walls:[[0,360,330,24],[150,210,330,24]]},
  {name:'Final pocket',start:[390,510],cup:[100,90],par:4,walls:[[205,170,25,310],[70,200,135,24],[280,350,130,24]]}
 ];
 function golfGame(index=0){const hole=holes[index];return {index,ball:{x:hole.start[0],y:hole.start[1],vx:0,vy:0},strokes:0,state:'aiming'};}
 function shootGolf(g,angle,power){if(g.state!=='aiming'||!Number.isFinite(angle)||!Number.isFinite(power))return false;const speed=clamp(power,10,100)*5;g.ball.vx=Math.cos(angle)*speed;g.ball.vy=Math.sin(angle)*speed;g.strokes++;g.state='moving';return true;}
 function golfStep(g,dt){if(g.state!=='moving')return;const b=g.ball,hole=holes[g.index],steps=Math.ceil(Math.min(dt,.05)*240),h=Math.min(dt,.05)/steps,r=8;
  for(let i=0;i<steps&&g.state==='moving';i++){
   const ox=b.x,oy=b.y;b.x+=b.vx*h;b.y+=b.vy*h;
   if(b.x<r){b.x=r;b.vx=Math.abs(b.vx)*.8;}if(b.x>480-r){b.x=480-r;b.vx=-Math.abs(b.vx)*.8;}if(b.y<r){b.y=r;b.vy=Math.abs(b.vy)*.8;}if(b.y>600-r){b.y=600-r;b.vy=-Math.abs(b.vy)*.8;}
   for(const [x,y,w,hh] of hole.walls){if(b.x+r<=x||b.x-r>=x+w||b.y+r<=y||b.y-r>=y+hh)continue;if(oy+r<=y||oy-r>=y+hh){b.y=oy;b.vy*=-.8;}else{b.x=ox;b.vx*=-.8;}}
   const speed=Math.hypot(b.vx,b.vy);if(Math.hypot(b.x-hole.cup[0],b.y-hole.cup[1])<12&&speed<210){b.x=hole.cup[0];b.y=hole.cup[1];b.vx=b.vy=0;g.state='holed';break;}
   const next=Math.max(0,speed-75*h);if(next<7){b.vx=b.vy=0;g.state='aiming';}else{b.vx*=next/speed;b.vy*=next/speed;}
  }
 }
 return {clamp,Sort,brickLevel,brickGame,launchBrick,brickStep,holes,golfGame,shootGolf,golfStep};
});
