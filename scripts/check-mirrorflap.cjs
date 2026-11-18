const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/../mirrorflap.html', 'utf8');
const engine = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(code => code.includes('function spawnPipe'));

function controller() {
  const nodes = new Map(), events = {};
  let modal = false;
  function element() {
    const classes = new Set();
    const listeners = {};
    return {
      textContent: '',
      classList: {add(c) {classes.add(c);}, remove(c) {classes.delete(c);}, contains(c) {return classes.has(c);}},
      addEventListener(k, f) {(listeners[k] ??= []).push(f);},
      emit(k, e = {}) {for (const f of listeners[k] || []) f(e);},
      getBoundingClientRect: () => ({width: 390, height: 520}),
      getContext: () => ({setTransform() {}})
    };
  }
  const document = {
    hidden: false,
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id);},
    querySelector() {return modal ? {} : null;},
    addEventListener(k, f) {(events[k] ??= []).push(f);}
  };
  const c = {document, window: {devicePixelRatio: 1, addEventListener() {}},
    localStorage: {getItem() {return '4';}, setItem() {}}, requestAnimationFrame() {},
    getComputedStyle: () => ({getPropertyValue: () => '#123456'})};
  const instrumented = engine.replace(/requestAnimationFrame\(frame\);\s*\}\)\(\);\s*$/,
    'requestAnimationFrame(frame); globalThis.api={flap,update,newGame,snapshot:()=>({started,over,score,elapsed,spawnTimer,ballA:{...ballA},ballB:{...ballB},pipes:pipes.map(p=>({...p}))})};})();');
  assert.notEqual(instrumented, engine);
  vm.runInNewContext(instrumented, c);
  return {api: c.api, document, nodes, modal(v) {modal = v;},
    emit(k, e) {for (const f of events[k] || []) f(e);}};
}

const game = controller();
game.document.hidden = true;
game.emit('visibilitychange');
assert.equal(game.nodes.get('overlayBtn').textContent, 'Start', 'ready game must remain ready');
game.document.hidden = false;
game.api.flap();
game.api.update(0.05);
game.document.hidden = true;
game.emit('visibilitychange');
assert.equal(game.nodes.get('overlayText').textContent, 'Paused', 'switching tabs must pause a live run');
const frozen = JSON.stringify(game.api.snapshot());
game.api.update(5);
game.api.flap();
assert.equal(JSON.stringify(game.api.snapshot()), frozen, 'hidden play must not move either orb, timers, score or pipes');
game.document.hidden = false;
game.emit('visibilitychange');
game.api.update(5);
assert.equal(JSON.stringify(game.api.snapshot()), frozen, 'returning must wait for explicit resume');
assert.equal(game.nodes.get('overlayBtn').textContent, 'Resume');
game.nodes.get('overlayBtn').emit('click', {stopPropagation() {}});
assert.equal(game.api.snapshot().ballA.vy, -290);
assert.equal(game.api.snapshot().ballB.vy, 290);
assert.equal(game.nodes.get('overlay').classList.contains('show'), false);
game.api.update(0.02);
assert.notEqual(JSON.stringify(game.api.snapshot()), frozen, 'resumed run must advance');

game.modal(true);
game.emit('click', {target: {closest: () => ({})}});
assert.equal(game.nodes.get('overlayText').textContent, 'Paused', 'privacy choices must pause play');
const privacyFrozen = JSON.stringify(game.api.snapshot());
game.api.update(5);
game.api.flap();
assert.equal(JSON.stringify(game.api.snapshot()), privacyFrozen);
game.modal(false);
game.api.update(5);
assert.equal(JSON.stringify(game.api.snapshot()), privacyFrozen, 'closing privacy must not auto-resume');
game.api.flap();
game.api.update(0.02);
assert.notEqual(JSON.stringify(game.api.snapshot()), privacyFrozen);

game.api.update(10); // A real boundary collision still ends an active run.
assert.equal(game.api.snapshot().over, true);
game.document.hidden = true;
game.emit('visibilitychange');
assert.equal(game.nodes.get('overlayText').textContent, 'Both Down!', 'finished run must not become resumable');
game.api.newGame();
assert.equal(game.nodes.get('overlayBtn').textContent, 'Start');
assert.equal(game.api.snapshot().score, 0);
console.log('PASS: Mirror Flap actual controller pauses both orbs/timers on hidden tab or privacy, waits for explicit resume, preserves collision/restart behavior.');
