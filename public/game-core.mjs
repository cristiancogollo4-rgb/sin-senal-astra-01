export const PLAYER_Z = 3;
export const CRUISE_SPEED = 30;
export const RADAR_RANGE = 110;
export const THEMES = [
  { name: 'Astra', color: '#56eadc', secondary: '#7892ff' },
  { name: 'Umbra', color: '#8c9eff', secondary: '#d589ff' },
  { name: 'Solaris', color: '#ffc66d', secondary: '#ff758e' }
];
export const ZONES = ['Corredor abierto', 'Conductos', 'Tráfico orbital'];
export const WEAPONS = {
  laser: { name: 'Láser', color: '#8eefff', cadence: .18, damage: 1, duration: 0 },
  triple: { name: 'Triple', color: '#ffcf7a', cadence: .24, damage: .65, duration: 12 },
  pierce: { name: 'Perforante', color: '#c9a1ff', cadence: .48, damage: 2, duration: 12 }
};
export const PORTS = {
  open: { label: 'ABIERTO', symbol: '+', color: '#62efd3', detail: 'Servicio activo · suministros' },
  closed: { label: 'CERRADO', symbol: '×', color: '#c1cddd', detail: 'Sin servicio disponible' },
  filtered: { label: 'FILTRADO', symbol: '?', color: '#ffd17d', detail: 'Estado desconocido' }
};
export const POWERUPS = {
  nmap: { key: '1', name: 'Nmap', color: '#56eadc', duration: 10, short: 'Reconoce servicios', effect: 'Un pulso de 110 m identifica contactos y revela los puertos de las balizas durante 10 s. Busca + ABIERTO para recoger suministros.', concept: 'Reconocimiento', fact: 'Nmap descubre equipos y servicios en redes autorizadas. Abierto indica un servicio activo; cerrado, que no escucha un servicio; filtrado, que no se puede determinar el estado. Abierto no significa vulnerable.' },
  firewall: { key: '2', name: 'Firewall', color: '#79bcff', duration: 10, short: 'Filtra proyectiles', effect: 'Filtra los proyectiles cercanos durante 10 s. No bloquea minas, drones ni barreras.', concept: 'Filtrado de tráfico', fact: 'Un firewall permite o bloquea tráfico según reglas. No protege contra cualquier peligro.' },
  honeypot: { key: '3', name: 'Señuelo', color: '#d497ff', duration: 8, short: 'Desvía ataques', effect: 'Una nave holográfica atrae los proyectiles durante 8 s.', concept: 'Honeypot', fact: 'Un honeypot es un recurso señuelo para atraer y observar actividad sospechosa. La nave falsa es una analogía.' },
  backup: { key: '4', name: 'Respaldo', color: '#ffd17d', duration: 0, short: 'Prepara tu regreso', effect: 'Prepara una recuperación con tu energía actual, mínimo 60%. Funciona una vez ante un impacto fatal.', concept: 'Recuperación', fact: 'Las copias permiten recuperar datos y sistemas. Recuperar la nave es una analogía; no rebobina tus puntos ni el tiempo.' }
};
export const POWERUP_TYPES = Object.keys(POWERUPS);
const KIT_SEQUENCE = ['nmap', 'firewall', 'nmap', 'honeypot', 'nmap', 'backup'];
const SOLIDS = ['drone', 'mine', 'gate'];
const PICKUPS = ['powerup', 'shard', 'repair', 'weapon', 'beacon'];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function createGame() {
  return {
    status: 'playing', time: 0, travel: 0, speed: CRUISE_SPEED, intensity: 1, theme: 0, zone: 0,
    player: { x: 0, y: -.7, z: PLAYER_Z, vx: 0, vy: 0 }, energy: 100,
    score: 0, combo: 1, maxCombo: 1, invulnerable: 0, boost: false,
    active: { nmap: 0, firewall: 0, honeypot: 0 }, weapon: 'laser', weaponTime: 0,
    inventory: { nmap: 0, firewall: 0, honeypot: 0, backup: 0 },
    uses: { nmap: 0, firewall: 0, honeypot: 0, backup: 0 },
    pickups: { nmap: 0, firewall: 0, honeypot: 0, backup: 0 },
    backupEnergy: 0, decoy: { x: 0, y: 0, z: 0 },
    stats: { contacts: 0, services: 0, supplies: 0, filtered: 0, diverted: 0, restored: 0, destroyed: 0, coins: 0, nearMisses: 0, repairs: 0, weapons: 0, hits: 0 },
    tracked: new Set(), entities: [], shots: [], enemyShots: [], events: [], bursts: [], nextId: 1,
    hazardTimer: 2.8, collectibleTimer: .5, powerupTimer: .8, powerupIndex: 0, attackTimer: 6,
    serviceTimer: 1.4, serviceIndex: 0, repairTimer: 16, weaponTimer: 5, weaponIndex: 0,
    waveIndex: 0, route: { x: 0, y: 0 }, fireTimer: 0, scanStarted: -100,
    pulse: 0, damageFlash: 0, lastHit: '', hitDirection: { x: 0, y: 0 },
    message: 'Pilotar: WASD / flechas. El disparo es automático.', messageTime: 5
  };
}
function emit(game, kind, entity = game.player, extra = {}) {
  game.events.push({ kind, x: entity.x ?? game.player.x, y: entity.y ?? game.player.y, z: entity.z ?? PLAYER_Z, ...extra });
}
function notify(game, text, duration = 3) { game.message = text; game.messageTime = duration; }
function reward(game, amount, chain = false) {
  const points = Math.round(amount * game.combo);
  game.score += points;
  if (chain) { game.combo = Math.min(8, game.combo + 1); game.maxCombo = Math.max(game.maxCombo, game.combo); }
  return points;
}
export function addEntity(game, kind, x, y, z, extra = {}) {
  const entity = { id: game.nextId++, kind, x, y, z, previousZ: z, radius: .48, hp: 1, dead: false, ...extra };
  game.entities.push(entity); return entity;
}
export function collectPowerup(game, entity) {
  const type = entity.powerType, item = POWERUPS[type]; if (!item) return;
  entity.dead = true; game.pickups[type]++;
  const stored = game.inventory[type] < 2;
  if (stored) game.inventory[type]++;
  notify(game, stored ? item.name + ' listo · pulsa ' + item.key : item.name + ': inventario lleno · puntos extra.');
  emit(game, 'collect', entity, { type, points: reward(game, 30), stored });
}
export function activatePowerup(game, type) {
  const item = POWERUPS[type]; if (!item || game.status !== 'playing') return false;
  if (game.inventory[type] <= 0) { notify(game, 'Recoge primero ' + item.name + '.'); return false; }
  if ((type === 'backup' && game.backupEnergy > 0) || game.active[type] > 0) { notify(game, item.name + ' ya está activo. Conservas tu carga.'); return false; }
  game.inventory[type]--; game.uses[type]++;
  if (type === 'backup') game.backupEnergy = Math.max(60, game.energy);
  else game.active[type] = item.duration;
  if (type === 'honeypot') {
    game.decoy = { x: game.player.x <= 0 ? 2.9 : -2.9, y: game.player.y > 0 ? -1.8 : 1.8, z: .4 };
    for (const packet of game.enemyShots) packet.diverted = true;
  }
  if (type === 'nmap') { game.pulse = 1.2; game.scanStarted = game.time; }
  notify(game, item.name + ' · ' + item.short + '.');
  emit(game, 'powerup', game.player, { type });
  return true;
}
export function radarContacts(game) {
  if (game.active.nmap <= 0) return [];
  return [...game.entities, ...game.enemyShots].filter(e => !e.dead && [...SOLIDS, 'packet', 'beacon'].includes(e.kind) && PLAYER_Z - e.z >= 0 && PLAYER_Z - e.z <= RADAR_RANGE);
}
export function scanContacts(game) {
  if (game.active.nmap <= 0) return;
  const reach = Math.min(RADAR_RANGE, Math.max(0, game.time - game.scanStarted) * 120 + 5);
  for (const e of radarContacts(game)) {
    if (PLAYER_Z - e.z > reach) continue;
    e.scannedUntil = game.time + game.active.nmap;
    if (!game.tracked.has(e.id)) { game.tracked.add(e.id); game.stats.contacts++; }
    if (e.kind === 'beacon' && !e.discovered) {
      e.discovered = true; game.stats.services++;
      emit(game, 'discover', e, { portState: e.portState });
    }
  }
}
export function equipWeapon(game, type) {
  if (!WEAPONS[type] || type === 'laser') return false;
  game.weapon = type; game.weaponTime = WEAPONS[type].duration; game.fireTimer = Math.min(game.fireTimer, .08);
  game.stats.weapons++; return true;
}
export function touchesPickup(game, entity) {
  if (entity.previousZ > PLAYER_Z + 1.35 || entity.z < PLAYER_Z - 1.55) return false;
  const large = entity.kind !== 'shard';
  return Math.hypot((entity.x - game.player.x) / (large ? 1.65 : 1.4), (entity.y - game.player.y) / (large ? 1.15 : .95)) <= 1;
}
function attractPickup(game, e, dt) {
  if (e.kind === 'beacon') return;
  const depth = PLAYER_Z - e.z; if (depth > 10 || depth < -1.35) return;
  if (!e.magnetized && Math.hypot((e.x - game.player.x) / 2.05, (e.y - game.player.y) / 1.45) > 1) return;
  e.magnetized = true; const pull = 1 - Math.exp(-11 * dt);
  e.x += (game.player.x - e.x) * pull; e.y += (game.player.y - e.y) * pull;
}
export function hitsPlayer(game, entity) {
  if (entity.previousZ > PLAYER_Z + .8 || entity.z < PLAYER_Z - .8) return false;
  if (entity.kind === 'gate') return Math.abs(game.player.x - entity.gapX) > entity.gapWidth / 2 - .32 || Math.abs(game.player.y - entity.gapY) > entity.gapHeight / 2 - .24;
  return Math.hypot(entity.x - game.player.x, entity.y - game.player.y) < entity.radius + .34;
}
export function damage(game, entity) {
  entity.dead = true; if (game.invulnerable > 0) return;
  game.energy = Math.max(0, game.energy - 20); game.combo = 1; game.damageFlash = .38; game.invulnerable = .95; game.stats.hits++;
  game.lastHit = ({packet: 'Proyectil enemigo', gate: 'Choque con barrera', mine: 'Choque con mina', drone: 'Choque con dron'})[entity.kind] || 'Impacto';
  game.hitDirection = { x: (entity.x ?? game.player.x) - game.player.x, y: (entity.y ?? game.player.y) - game.player.y };
  emit(game, 'hit', game.player); notify(game, game.lastHit + ' · −20 de energía.');
  if (game.energy > 0) return;
  if (game.backupEnergy > 0) {
    game.energy = game.backupEnergy; game.backupEnergy = 0; game.stats.restored++; game.invulnerable = 2.5;
    for (const e of game.entities) if (e.z > -12 && SOLIDS.includes(e.kind)) e.dead = true;
    for (const e of game.enemyShots) if (e.z > -18) e.dead = true;
    game.bursts.length = 0;
    emit(game, 'restore'); notify(game, 'Respaldo restaurado. Conservas puntos y distancia.');
  } else { game.status = 'dead'; emit(game, 'end'); }
}
// Every wave reserves a continuous hole. Successive hole centers move at most
// 1.25m horizontally / .9m vertically, well within steering at maximum wave frequency.
export function spawnHazard(game, random = Math.random) {
  const gapX = clamp(game.route.x + (random() - .5) * 2.5, -1.8, 1.8);
  const gapY = clamp(game.route.y + (random() - .5) * 1.8, -1.1, 1.1);
  game.route = {x: gapX, y: gapY}; game.waveIndex++;
  const gate = game.time > 9 && (game.zone === 1 ? game.waveIndex % 2 === 0 : game.waveIndex % 5 === 0);
  if (gate) {
    addEntity(game, 'gate', 0, 0, -100, {gapX, gapY, gapWidth: Math.max(2.8, 3.6 - game.intensity * .06), gapHeight: Math.max(2.35, 2.9 - game.intensity * .04)});
    return;
  }
  const cells = [];
  for (const x of [-2.7, 0, 2.7]) for (const y of [-1.9, 0, 1.9]) {
    if (Math.abs(x - gapX) > 2 || Math.abs(y - gapY) > 1.65) cells.push({x, y});
  }
  const count = Math.min(cells.length, game.time < 8 ? 1 : 2 + Math.min(2, Math.floor(game.time / 40)) + (game.zone === 2 ? 1 : 0));
  const offset = Math.floor(random() * cells.length);
  for (let i = 0; i < count; i++) {
    const cell = cells[(i + offset) % cells.length];
    const moving = (i + game.waveIndex) % 3 === 0;
    const kind = (i + game.waveIndex) % 4 === 0 ? 'mine' : 'drone';
    addEntity(game, kind, cell.x, cell.y, -100, {baseX: cell.x, baseY: cell.y, amplitude: moving && kind === 'drone' ? .25 : 0, phase: i, radius: kind === 'mine' ? .48 : .56, hp: kind === 'mine' ? 3 : game.time > 35 ? 3 : 2, safeX: gapX, safeY: gapY});
  }
}
function spawnCollectible(game, random) {
  const x = (Math.floor(random() * 3) - 1) * 2.2, y = (Math.floor(random() * 3) - 1) * 1.55;
  for (let i = 0; i < 5; i++) addEntity(game, 'shard', x, y, -42 - i * 3.2, {radius: .3});
}
function spawnPowerup(game, random) {
  const type = KIT_SEQUENCE[game.powerupIndex++ % KIT_SEQUENCE.length], initial = game.time < 2;
  addEntity(game, 'powerup', initial ? game.player.x : (random() - .5) * 4.3, initial ? game.player.y : (random() - .5) * 2.8, -33, {powerType: type, radius: .72});
}
export function spawnServices(game, random = Math.random) {
  const initial = game.serviceIndex++ === 0;
  const openIndex = initial ? 1 : Math.floor(random() * 3);
  for (let i = 0; i < 3; i++) addEntity(game, 'beacon', (i - 1) * 2.7, -.7, -85, {radius: .6, portState: i === openIndex ? 'open' : (i + 3 - openIndex) % 3 === 1 ? 'closed' : 'filtered'});
}
export function spawnPacket(game, source, spread = 0) {
  const x = source?.x ?? game.player.x, y = source?.y ?? game.player.y, z = source ? Math.min(-18, source.z) : -65;
  const speed = 40 + Math.min(12, game.intensity * 1.2);
  const targetX = source?.aimX ?? game.player.x, targetY = source?.aimY ?? game.player.y;
  const flight = Math.max(.3, (PLAYER_Z - z) / speed);
  game.enemyShots.push({id: game.nextId++, kind: 'packet', x, y, z, previousZ: z, radius: .2, dead: false, diverted: game.active.honeypot > 0, vx: (targetX - x) / flight + spread, vy: (targetY - y) / flight, speed});
}
function queueBurst(game) {
  const source = game.entities.find(e => e.kind === 'drone' && !e.dead && e.z < -28 && e.z > -95 && !e.warning);
  if (!source) return;
  source.warning = .85;
  game.bursts.push({id: source.id, at: game.time + .85, aimX: game.player.x, aimY: game.player.y});
  emit(game, 'warning', source);
}
function moveEnemyPackets(game, dt) {
  for (const packet of game.enemyShots) {
    packet.previousZ = packet.z; packet.z += (packet.speed || 40) * dt;
    if (game.active.honeypot > 0) packet.diverted = true;
    if (packet.diverted) {
      const steer = Math.min(1, dt * 5); packet.x += (game.decoy.x - packet.x) * steer; packet.y += (game.decoy.y - packet.y) * steer;
    } else { packet.x += (packet.vx || 0) * dt; packet.y += (packet.vy || 0) * dt; }
    if (packet.diverted && packet.z >= game.decoy.z - .6) {
      packet.dead = true; game.stats.diverted++; reward(game, 10); emit(game, 'divert', packet);
    } else if (game.active.firewall > 0 && packet.z >= PLAYER_Z - 1.7 && Math.hypot(packet.x - game.player.x, packet.y - game.player.y) < 1.7) {
      packet.dead = true; game.stats.filtered++; reward(game, 12); emit(game, 'filter', packet);
    } else if (hitsPlayer(game, packet)) damage(game, packet);
    else checkNearMiss(game, packet);
    if (game.status === 'dead') break;
  }
}
function checkNearMiss(game, e) {
  if (e.nearChecked || e.kind === 'gate' || e.z < PLAYER_Z + .8) return;
  e.nearChecked = true;
  const distance = Math.hypot(e.x - game.player.x, e.y - game.player.y);
  if (!e.dead && game.invulnerable <= 0 && distance > e.radius + .34 && distance < e.radius + 1.05) {
    game.stats.nearMisses++; const points = reward(game, 70, true); emit(game, 'near', game.player, {points}); notify(game, '¡Esquiva ajustada! +' + points);
  }
}
function fire(game) {
  const weapon = WEAPONS[game.weapon];
  for (const vx of game.weapon === 'triple' ? [-9, 0, 9] : [0]) game.shots.push({
    id: game.nextId++, x: game.player.x, y: game.player.y, z: PLAYER_Z - .9, previousZ: PLAYER_Z - .9,
    vx, damage: weapon.damage, weapon: game.weapon, hits: new Set()
  });
  game.fireTimer += weapon.cadence;
}
function moveShots(game, dt) {
  for (const shot of game.shots) {
    if (shot.dead) continue;
    shot.previousZ = shot.z; shot.z -= 76 * dt; shot.x += (shot.vx || 0) * dt;
    // Resolve nearest impact first; a wall must stop even a piercing ray.
    const candidates = game.entities.filter(e => !e.dead && SOLIDS.includes(e.kind) && !shot.hits?.has(e.id) &&
      shot.previousZ >= Math.min(e.previousZ, e.z) - .6 && shot.z <= Math.max(e.previousZ, e.z) + .6).sort((a, b) => b.z - a.z);
    for (const e of candidates) {
      const hit = e.kind === 'gate' ? Math.abs(shot.x - e.gapX) > e.gapWidth / 2 || Math.abs(shot.y - e.gapY) > e.gapHeight / 2 : Math.hypot(shot.x - e.x, shot.y - e.y) < e.radius + .12;
      if (!hit) continue;
      shot.hits?.add(e.id);
      if (e.kind === 'gate' || shot.weapon !== 'pierce') shot.dead = true;
      if (e.kind !== 'gate') {
        e.hp -= shot.damage ?? 1;
        if (e.hp <= 0) { e.dead = true; game.stats.destroyed++; reward(game, 55, true); emit(game, 'destroy', e); }
      }
      if (shot.dead) break;
    }
  }
}
function collect(game, e) {
  if (e.kind === 'beacon') {
    if (e.portState !== 'open' || !e.discovered || !(e.scannedUntil >= game.time)) return;
    e.dead = true; game.stats.supplies++; game.energy = Math.min(100, game.energy + 12);
    emit(game, 'collect', e, {supply: true, points: reward(game, 100)});
    notify(game, 'Servicio abierto · +12 de energía y suministros.');
  } else if (e.kind === 'powerup') collectPowerup(game, e);
  else {
    e.dead = true;
    if (e.kind === 'shard') { game.stats.coins++; emit(game, 'collect', e, {coin: true, points: reward(game, 20)}); }
    if (e.kind === 'repair') { game.energy = Math.min(100, game.energy + 20); game.stats.repairs++; emit(game, 'collect', e, {repair: true}); notify(game, 'Reparación · +20 de energía.'); }
    if (e.kind === 'weapon') { equipWeapon(game, e.weaponType); emit(game, 'collect', e, {weapon: e.weaponType}); notify(game, WEAPONS[e.weaponType].name + ' equipado · 12 s.'); }
  }
}
export function stepGame(game, input, dt, random = Math.random) {
  if (game.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, .05);
  let dx = Number(!!input.right) - Number(!!input.left), dy = Number(!!input.up) - Number(!!input.down);
  const length = Math.hypot(dx, dy) || 1; dx /= length; dy /= length;
  const movement = input.boost ? 8.6 : 6.4; game.boost = !!input.boost;
  game.player.vx = dx * movement; game.player.vy = dy * movement;
  game.player.x = clamp(game.player.x + dx * movement * dt, -3.45, 3.45);
  game.player.y = clamp(game.player.y + dy * movement * dt, -2.25, 2.25);
  game.time += dt; game.intensity = 1 + Math.floor(game.time / 22); game.theme = Math.floor(game.time / 42) % THEMES.length; game.zone = Math.floor(game.time / 28) % ZONES.length;
  game.speed = Math.min(44, CRUISE_SPEED + game.time * .065) + (input.boost ? 9 : 0); game.travel += game.speed * dt; game.score += dt * 5;
  for (const key of ['invulnerable', 'pulse', 'damageFlash', 'messageTime', 'weaponTime']) game[key] = Math.max(0, game[key] - dt);
  if (!game.weaponTime) game.weapon = 'laser';
  for (const key of ['nmap', 'firewall', 'honeypot']) game.active[key] = Math.max(0, game.active[key] - dt);
  game.fireTimer -= dt; if (game.fireTimer <= 0) fire(game);
  for (const key of ['hazardTimer', 'collectibleTimer', 'powerupTimer', 'attackTimer', 'serviceTimer', 'repairTimer', 'weaponTimer']) game[key] -= dt;
  if (game.hazardTimer <= 0) { spawnHazard(game, random); game.hazardTimer += Math.max(.85, 1.5 - game.time * .004); }
  if (game.collectibleTimer <= 0) { spawnCollectible(game, random); game.collectibleTimer += 3; }
  if (game.powerupTimer <= 0) { spawnPowerup(game, random); game.powerupTimer += 8; }
  if (game.serviceTimer <= 0) { spawnServices(game, random); game.serviceTimer += 16; }
  if (game.repairTimer <= 0) { addEntity(game, 'repair', (random() - .5) * 5, (random() - .5) * 3, -65); game.repairTimer += 22; }
  if (game.weaponTimer <= 0) { addEntity(game, 'weapon', (random() - .5) * 4, (random() - .5) * 2.6, -45, {weaponType: game.weaponIndex++ % 2 === 0 ? 'triple' : 'pierce'}); game.weaponTimer += 16; }
  if (game.attackTimer <= 0) { queueBurst(game); game.attackTimer += Math.max(1.65, 3.1 - game.time * .007); }
  for (const e of game.entities) {
    e.previousZ = e.z; e.z += game.speed * dt;
    if (e.amplitude) e.x = e.baseX + Math.sin(game.time * 2.2 + e.phase) * e.amplitude;
    if (e.warning) e.warning = Math.max(0, e.warning - dt);
  }
  scanContacts(game);
  for (const burst of game.bursts) {
    if (burst.at > game.time) continue;
    const source = game.entities.find(e => e.id === burst.id && !e.dead && e.z < -16);
    if (source) for (const spread of game.time > 40 ? [-1.1, 0, 1.1] : [0]) spawnPacket(game, {...source, aimX: burst.aimX, aimY: burst.aimY}, spread);
    burst.done = true;
  }
  game.bursts = game.bursts.filter(b => !b.done);
  moveShots(game, dt);
  for (const e of game.entities) {
    if (e.dead) continue;
    if (PICKUPS.includes(e.kind)) { attractPickup(game, e, dt); if (touchesPickup(game, e)) collect(game, e); }
    else if (hitsPlayer(game, e)) damage(game, e);
    else checkNearMiss(game, e);
    if (game.status === 'dead') break;
  }
  if (game.status === 'playing') moveEnemyPackets(game, dt);
  game.entities = game.entities.filter(e => !e.dead && e.z < 10);
  game.shots = game.shots.filter(s => !s.dead && s.z > -115 && Math.abs(s.x) < 9);
  game.enemyShots = game.enemyShots.filter(s => !s.dead && s.z < 10);
  const ids = new Set([...game.entities, ...game.enemyShots].map(e => e.id));
  for (const id of game.tracked) if (!ids.has(id)) game.tracked.delete(id);
}
