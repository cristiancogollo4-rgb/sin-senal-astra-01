import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, addEntity, activatePowerup, collectPowerup, radarContacts, damage, hitsPlayer, spawnPacket, POWERUPS } from '../public/game-core.mjs';

function quiet() { const g=createGame(); for(const key of ['hazardTimer','collectibleTimer','powerupTimer','attackTimer','fireTimer','serviceTimer','repairTimer','weaponTimer'])g[key]=10000;return g; }
function tick(g,seconds,input={}) { for(let t=0;t<seconds;t+=.02)stepGame(g,input,.02,()=>.8); }

test('flight continues beyond the old mission ending with increasing difficulty',()=>{
  const g=quiet();tick(g,200);assert.equal(g.status,'playing');assert.ok(g.time>=199);assert.ok(g.intensity>=7);assert.ok(g.speed>18);assert.ok(g.theme>=0&&g.theme<3);
});
test('3D collisions require the same depth and lane',()=>{
  const g=quiet();const e=addEntity(g,'mine',0,-.7,-40);assert.equal(hitsPlayer(g,e),false);e.previousZ=2.5;e.z=3.1;assert.equal(hitsPlayer(g,e),true);e.x=3;assert.equal(hitsPlayer(g,e),false);
});
test('gate opening matches the traversable area',()=>{
  const g=quiet();const e=addEntity(g,'gate',0,0,3,{previousZ:2,gapX:0,gapY:-.7,gapWidth:3.2,gapHeight:2.6});assert.equal(hitsPlayer(g,e),false);g.player.x=2.5;assert.equal(hitsPlayer(g,e),true);
});
test('powerups are collected into inventory and need explicit activation',()=>{
  const g=quiet();const e=addEntity(g,'powerup',0,-.7,2.7,{powerType:'nmap'});stepGame(g,{},.02);assert.equal(e.dead,true);assert.equal(g.inventory.nmap,1);assert.equal(g.active.nmap,0);assert.equal(activatePowerup(g,'nmap'),true);assert.equal(g.inventory.nmap,0);assert.equal(g.active.nmap,POWERUPS.nmap.duration);
});
test('Nmap reveals distant threats only while active and does not damage them',()=>{
  const g=quiet();const drone=addEntity(g,'drone',2,1,-98,{hp:2});addEntity(g,'mine',1,0,-120);addEntity(g,'shard',0,0,-20);assert.equal(radarContacts(g).length,0);
  g.inventory.nmap=1;activatePowerup(g,'nmap');assert.deepEqual(radarContacts(g).map(e=>e.id),[drone.id]);assert.equal(drone.hp,2);assert.equal(drone.dead,false);
  stepGame(g,{},.02);assert.equal(g.stats.contacts,0);tick(g,.65);assert.equal(g.stats.contacts,1);stepGame(g,{},.02);assert.equal(g.stats.contacts,1);
  g.active.nmap=.01;stepGame(g,{},.02);assert.equal(radarContacts(g).length,0);
});
test('empty or already-active slots do not consume another inventory charge',()=>{
  const g=quiet();assert.equal(activatePowerup(g,'nmap'),false);g.inventory.nmap=2;activatePowerup(g,'nmap');assert.equal(activatePowerup(g,'nmap'),false);assert.equal(g.inventory.nmap,1);assert.equal(g.uses.nmap,1);
});
test('firewall filters projectiles but does not grant immunity to solid hazards',()=>{
  const g=quiet();g.inventory.firewall=1;activatePowerup(g,'firewall');spawnPacket(g);g.enemyShots[0].z=1.2;stepGame(g,{},.02);assert.equal(g.stats.filtered,1);assert.equal(g.energy,100);
  addEntity(g,'mine',0,-.7,2.6);stepGame(g,{},.02);assert.equal(g.energy,80);assert.equal(g.active.firewall>0,true);
});
test('honeypot diverts incoming packets to the decoy and counts successful lures',()=>{
  const g=quiet();spawnPacket(g);g.enemyShots[0].z=-3;g.inventory.honeypot=1;activatePowerup(g,'honeypot');tick(g,.2);assert.equal(g.stats.diverted,1);assert.equal(g.energy,100);assert.equal(g.enemyShots.length,0);
});
test('backup must be prepared before a fatal hit and restores only once',()=>{
  const g=quiet();g.energy=20;g.score=1234;g.travel=300;g.inventory.backup=1;activatePowerup(g,'backup');assert.equal(g.backupEnergy,60);
  damage(g,{dead:false});assert.equal(g.energy,60);assert.equal(g.status,'playing');assert.equal(g.stats.restored,1);assert.equal(g.score,1234);assert.equal(g.travel,300);assert.equal(g.backupEnergy,0);
  g.invulnerable=0;g.energy=20;damage(g,{dead:false});assert.equal(g.status,'dead');
});
test('collecting a backup without preparing it does not revive the player',()=>{
  const g=quiet();g.inventory.backup=1;g.energy=20;damage(g,{dead:false});assert.equal(g.status,'dead');assert.equal(g.inventory.backup,1);
});
test('paused games freeze powerup timers, score and simulation',()=>{
  const g=quiet();g.inventory.firewall=1;activatePowerup(g,'firewall');g.status='paused';const before={t:g.time,score:g.score,firewall:g.active.firewall};tick(g,2,{right:true});assert.deepEqual({t:g.time,score:g.score,firewall:g.active.firewall},before);assert.equal(g.player.x,0);
});
test('inventory caps each type at two and new runs reset the complete kit',()=>{
  const g=quiet();for(const type of Object.keys(POWERUPS)){for(let i=0;i<3;i++)collectPowerup(g,{powerType:type,x:0,y:0,z:0});assert.equal(g.inventory[type],2);}const clean=createGame();assert.equal(Object.values(clean.inventory).reduce((a,b)=>a+b,0),0);assert.equal(clean.backupEnergy,0);assert.equal(clean.tracked.size,0);
});
test('shots retain their original trajectory when the player moves',()=>{
  const g=quiet();g.fireTimer=0;stepGame(g,{},.02);const x=g.shots[0].x;tick(g,.15,{right:true});assert.ok(g.player.x>x);assert.equal(g.shots[0].x,x);
});
test('expired radar contacts release their tracking IDs',()=>{
  const g=quiet();const e=addEntity(g,'mine',2,2,-20);g.inventory.nmap=1;activatePowerup(g,'nmap');tick(g,.2);assert.equal(g.tracked.has(e.id),true);e.z=11;stepGame(g,{},.02);assert.equal(g.tracked.size,0);assert.equal(g.stats.contacts,1);
});
