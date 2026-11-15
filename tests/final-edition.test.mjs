import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, stepGame, addEntity, activatePowerup, equipWeapon, spawnHazard, spawnServices, hitsPlayer, spawnPacket, WEAPONS, POWERUPS} from '../public/game-core.mjs';

function quiet() {
  const g=createGame();for(const k of Object.keys(g))if(k.endsWith('Timer'))g[k]=10000;return g;
}
function tick(g,seconds,input={}) {for(let t=0;t<seconds-1e-8;t+=.02)stepGame(g,input,Math.min(.02,seconds-t),()=>.5);}
function seed(value=417){return()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};}

test('coins award points but cannot undo damage by healing',()=>{
  const g=quiet();g.energy=40;for(let i=0;i<5;i++)addEntity(g,'shard',0,-.7,2.6);
  tick(g,.02);assert.equal(g.energy,40);assert.equal(g.stats.coins,5);assert.ok(g.score>=100);assert.equal(g.combo,1);
});
test('repair capsules restore twenty points and are capped at full energy',()=>{
  const g=quiet();g.energy=85;addEntity(g,'repair',0,-.7,2.6);tick(g,.02);assert.equal(g.energy,100);assert.equal(g.stats.repairs,1);
});
test('Nmap sweeps forward, discovers all three port states without changing them',()=>{
  const g=quiet();spawnServices(g,()=>.5);g.inventory.nmap=1;activatePowerup(g,'nmap');
  tick(g,.02);assert.equal(g.stats.services,0);tick(g,.7);
  assert.equal(g.stats.services,3);assert.deepEqual(g.entities.map(e=>e.portState).sort(),['closed','filtered','open']);
  assert.ok(g.entities.every(e=>e.discovered&&e.scannedUntil>g.time));
  tick(g,.1);assert.equal(g.stats.services,3);
});
for(const state of ['closed','filtered'])test(state+' ports do not provide supplies or cause damage',()=>{
  const g=quiet();g.energy=50;const e=addEntity(g,'beacon',0,-.7,2.6,{portState:state,discovered:true,scannedUntil:10});
  tick(g,.02);assert.equal(g.energy,50);assert.equal(g.stats.supplies,0);assert.equal(e.dead,false);
});
test('open services need reconnaissance before supplies can be collected',()=>{
  const g=quiet();g.energy=50;const e=addEntity(g,'beacon',0,-.7,2.6,{portState:'open'});tick(g,.02);
  assert.equal(g.energy,50);assert.equal(e.dead,false);
  e.z=2.6;e.discovered=true;e.scannedUntil=10;tick(g,.02);assert.equal(g.energy,62);assert.equal(g.stats.supplies,1);assert.equal(e.dead,true);
});
test('expired reconnaissance cannot be used to collect supplies',()=>{
  const g=quiet();g.time=20;g.energy=50;addEntity(g,'beacon',0,-.7,2.6,{portState:'open',discovered:true,scannedUntil:19});tick(g,.02);assert.equal(g.energy,50);assert.equal(g.stats.supplies,0);
});
test('weapon capsules equip automatically and do not consume kit inventory',()=>{
  const g=quiet();addEntity(g,'weapon',0,-.7,2.6,{weaponType:'triple'});tick(g,.02);
  assert.equal(g.weapon,'triple');assert.equal(g.weaponTime,12);assert.equal(g.stats.weapons,1);assert.equal(Object.values(g.inventory).reduce((a,b)=>a+b),0);
});
test('triple fire has three trajectories and lower damage per projectile',()=>{
  const g=quiet();equipWeapon(g,'triple');g.fireTimer=0;tick(g,.02);
  assert.equal(g.shots.length,3);assert.deepEqual(g.shots.map(s=>s.vx),[-9,0,9]);assert.ok(g.shots.every(s=>s.damage<WEAPONS.laser.damage));
});
test('piercing shots can hit two aligned enemies once each',()=>{
  const g=quiet();const a=addEntity(g,'drone',0,-.7,-.6,{hp:1}),b=addEntity(g,'drone',0,-.7,-1.5,{hp:1});
  g.shots.push({id:g.nextId++,x:0,y:-.7,z:1,previousZ:1,weapon:'pierce',damage:2,hits:new Set()});
  tick(g,.04);assert.equal(a.dead,true);assert.equal(b.dead,true);assert.equal(g.stats.destroyed,2);
});
test('solid walls stop piercing fire before targets behind them',()=>{
  const g=quiet();addEntity(g,'gate',0,0,0,{gapX:2,gapY:0,gapWidth:1,gapHeight:2});const b=addEntity(g,'drone',0,-.7,-1.5,{hp:3});
  const shot={id:g.nextId++,x:0,y:-.7,z:1,previousZ:1,weapon:'pierce',damage:2,hits:new Set()};g.shots.push(shot);tick(g,.04);
  assert.equal(shot.dead,true);assert.equal(b.hp,3);
});
test('a piercing ray cannot repeatedly damage the same enemy during overlap',()=>{
  const g=quiet();const e=addEntity(g,'drone',0,-.7,-.6,{hp:10});g.shots.push({id:g.nextId++,x:0,y:-.7,z:1,previousZ:1,weapon:'pierce',damage:2,hits:new Set()});
  tick(g,.06);assert.equal(e.hp,8);
});
test('weapon expiration restores laser and recollection resets rather than stacks duration',()=>{
  const g=quiet();equipWeapon(g,'triple');tick(g,5);equipWeapon(g,'pierce');assert.equal(g.weaponTime,12);tick(g,12.02);assert.equal(g.weapon,'laser');assert.equal(g.weaponTime,0);
});
test('pause freezes weapons, scan wave and queued bursts',()=>{
  const g=quiet();equipWeapon(g,'pierce');g.inventory.nmap=1;activatePowerup(g,'nmap');g.status='paused';tick(g,2);
  assert.equal(g.time,0);assert.equal(g.weaponTime,12);assert.equal(g.active.nmap,POWERUPS.nmap.duration);assert.equal(g.pulse,1.2);
});
test('each procedural wave reserves a reachable, collision-free opening',()=>{
  const g=quiet(),random=seed();let previous={...g.route};
  for(let wave=0;wave<300;wave++){
    g.entities=[];g.time=wave*2;g.intensity=1+Math.floor(g.time/22);g.zone=Math.floor(g.time/28)%3;spawnHazard(g,random);
    assert.ok(Math.hypot(g.route.x-previous.x,g.route.y-previous.y)<1.56);
    assert.ok(Math.abs(g.route.x)<=1.8&&Math.abs(g.route.y)<=1.1);
    g.player.x=g.route.x;g.player.y=g.route.y;
    for(const e of g.entities){e.previousZ=2.5;e.z=3.1;assert.equal(hitsPlayer(g,e),false,'reserved hole blocked in wave '+wave);}
    previous={...g.route};
  }
});
test('moving drones remain outside the reserved safe hole',()=>{
  const g=quiet();g.time=80;g.zone=2;spawnHazard(g,seed(11));g.player.x=g.route.x;g.player.y=g.route.y;
  const movers=g.entities.filter(e=>e.amplitude);assert.ok(movers.length>0);
  for(const e of movers)for(const side of [-1,1]){e.x=e.baseX+side*e.amplitude;e.z=3;e.previousZ=2.5;assert.equal(hitsPlayer(g,e),false);}
});
test('incoming bursts provide a warning before projectiles exist',()=>{
  const g=quiet();const d=addEntity(g,'drone',2,1,-80,{hp:5});g.attackTimer=0;tick(g,.02);
  assert.ok(d.warning>0);assert.equal(g.enemyShots.length,0);assert.ok(g.events.some(e=>e.kind==='warning'));
  tick(g,.7);assert.equal(g.enemyShots.length,0);tick(g,.2);assert.ok(g.enemyShots.length>0);
});
test('ordinary projectiles retain their aim instead of following every movement',()=>{
  const g=quiet();spawnPacket(g,{x:2,y:1,z:-60});const p=g.enemyShots[0],vx=p.vx,vy=p.vy;tick(g,.3,{left:true});assert.equal(p.vx,vx);assert.equal(p.vy,vy);
});
test('near misses reward skill once, not on every frame',()=>{
  const g=quiet();addEntity(g,'mine',1.1,-.7,3.3,{radius:.48});tick(g,.04);assert.equal(g.stats.nearMisses,1);assert.equal(g.combo,2);tick(g,.2);assert.equal(g.stats.nearMisses,1);
});
test('idle play is not sufficient to survive the growing deterministic encounters',()=>{
  const g=createGame(),random=seed(874);for(let t=0;t<180&&g.status==='playing';t+=.02)stepGame(g,{},.02,random);
  assert.ok(g.stats.hits>=5);assert.equal(g.status,'dead');assert.ok(g.time<180);
});
test('diagonal input has the same movement magnitude as a single direction',()=>{
  const a=quiet(),b=quiet();tick(a,.2,{right:true});tick(b,.2,{right:true,up:true});assert.ok(Math.abs(a.player.x-Math.hypot(b.player.x,b.player.y+.7))<1e-8);
});
test('a fresh run resets final-edition state completely',()=>{
  const g=createGame();assert.equal(g.weapon,'laser');assert.equal(g.stats.services,0);assert.equal(g.stats.nearMisses,0);assert.equal(g.bursts.length,0);assert.equal(g.zone,0);
});

test('reserved routes remain traversable at maximum boosted speed across successive waves',()=>{
  const g=quiet(),random=seed(42);g.time=300;g.intensity=14;let previous={...g.route};
  for(let i=0;i<120;i++){
    g.entities=[];g.zone=i%3;spawnHazard(g,random);
    // Worst spacing: waves spawned at initial speed, later approached with full boost.
    const availableSeconds=.85*30/53;
    assert.ok(Math.hypot(g.route.x-previous.x,g.route.y-previous.y)/6.4<availableSeconds);
    g.player.x=g.route.x;g.player.y=g.route.y;
    for(const e of g.entities){e.z=1.7;e.previousZ=1.7;stepGame(g,{boost:true},.04,random);if(e.kind==='gate')assert.equal(e.dead,false);}
    assert.equal(g.energy,100);previous={...g.route};
  }
});

test('long endless sessions release objects and contact IDs instead of accumulating them',()=>{
  const g=createGame(),random=seed(82);g.inventory.nmap=2;activatePowerup(g,'nmap');
  for(let i=0;i<30000;i++){
    g.invulnerable=1;stepGame(g,{},.02,random);g.events.length=0;
    assert.ok(g.entities.length<100);assert.ok(g.shots.length<40);assert.ok(g.enemyShots.length<40);assert.ok(g.tracked.size<100);
  }
  assert.ok(g.time>599);assert.equal(g.status,'playing');assert.ok(g.zone>=0&&g.zone<3);
});
