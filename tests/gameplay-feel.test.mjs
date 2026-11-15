import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, addEntity } from '../public/game-core.mjs';

function quiet() {
  const game = createGame();
  for (const timer of ['hazardTimer','collectibleTimer','powerupTimer','attackTimer','fireTimer','serviceTimer','repairTimer','weaponTimer']) game[timer] = 10000;
  return game;
}

test('cruise starts at an arcade pace rather than a slow ramp', () => {
  const game = quiet(); stepGame(game, {}, .02);
  assert.ok(game.speed >= 28);
});
test('coins touching the wing area are collected', () => {
  const game = quiet(); const coin = addEntity(game, 'shard', 1.05, game.player.y, 2.5, { radius: .3 });
  game.energy = 80;
  stepGame(game, {}, .02);
  assert.equal(coin.dead, true);
  assert.equal(game.stats.coins, 1);
  assert.equal(game.energy, 80); // Coins score; repairs now restore energy instead.
  assert.ok(game.events.some(event => event.kind === 'collect' && event.coin && event.points > 0));
  stepGame(game, {}, .02);
  assert.equal(game.stats.coins, 1);
});
test('powerups close to a wing are collected without perfect center alignment', () => {
  const game = quiet(); addEntity(game, 'powerup', 1.4, game.player.y, 2.5, { radius: .72, powerType: 'firewall' });
  stepGame(game, {}, .02);
  assert.equal(game.inventory.firewall, 1);
});
test('a nearby pickup does not make unrelated hazards easier to hit', () => {
  const game = quiet(); addEntity(game, 'mine', 1.3, game.player.y, 2.5, { radius: .48 });
  stepGame(game, {}, .02);
  assert.equal(game.energy, 100);
});

test('nearby coins move toward the ship before collection', () => {
  const game = quiet(); const coin = addEntity(game, 'shard', 1.8, game.player.y, -5, { radius: .3 });
  stepGame(game, {}, .02);
  assert.ok(coin.x < 1.8);
  assert.equal(coin.magnetized, true);
  assert.equal(game.stats.coins, 0);
  for (let frame = 0; frame < 30; frame++) stepGame(game, {}, .02);
  assert.equal(game.stats.coins, 1);
});

test('coins in distant lanes are not collected remotely', () => {
  const game = quiet(); const coin = addEntity(game, 'shard', 3.4, game.player.y, 2.5, { radius: .3 });
  stepGame(game, {}, .02);
  assert.equal(coin.dead, false);
  assert.equal(coin.x, 3.4);
  assert.equal(game.stats.coins, 0);
});

test('aligned coins far ahead remain visible until the ship reaches them', () => {
  const game = quiet(); const coin = addEntity(game, 'shard', game.player.x, game.player.y, -30, { radius: .3 });
  stepGame(game, {}, .02);
  assert.equal(coin.dead, false);
  assert.equal(game.stats.coins, 0);
});

test('boost increases both forward speed and steering response', () => {
  const normal = quiet(); const boosted = quiet();
  stepGame(normal, {right: true}, .05);
  stepGame(boosted, {right: true, boost: true}, .05);
  assert.ok(boosted.speed > normal.speed);
  assert.ok(boosted.player.x > normal.player.x);
});
