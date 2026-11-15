// Frost creatures: what marches, how it moves, what it does when it reaches
// a wall or the hearth. Each creature walks its road toward the hearth; a
// snow wall on that road makes it stop and chew the wall instead.

import { ENEMIES, enemyHp, WAVES } from './config.js';
import { laneLength, lanePoint, wallOnLane } from './world.js';

let nextId = 1;

export function makeEnemy(kind, lane, wave, random) {
  const def = ENEMIES[kind];
  const total = laneLength(lane);
  return {
    id: nextId += 1,
    kind, lane, wave,
    def,
    hp: enemyHp(kind, wave),
    maxHp: enemyHp(kind, wave),
    speed: def.speed * random.range(0.92, 1.08),
    dist: -random.range(0, 30),
    total,
    wobble: random.range(-14, 14),
    wobblePhase: random.range(0, Math.PI * 2),
    slowUntil: 0,
    slowFactor: 1,
    frozenUntil: 0,
    burnUntil: 0,
    burnDps: 0,
    flash: 0,
    lastHitBy: '',
    enraged: false,
    chewing: false,
    dead: false,
    leaked: false,
    x: 0, y: 0,
  };
}

// The spawn list for a wave, shuffled so the roads are not predictable.
export function waveSpawnList(wave, random) {
  const spec = WAVES[wave - 1];
  const lanes = ['N', 'E', 'S', 'W'];
  const list = [];
  for (const kind of ['wraith', 'wolf', 'golem', 'alpha', 'matriarch']) {
    for (let i = 0; i < (spec[kind] || 0); i += 1) {
      list.push({ kind, lane: lanes[(i + (kind === 'matriarch' ? 1 : 0)) % 4] });
    }
  }
  // Shuffle, but keep the matriarch last so the boss arrives at the end.
  const boss = list.filter((s) => s.kind === 'matriarch');
  const rest = list.filter((s) => s.kind !== 'matriarch');
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random.next() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...rest, ...boss];
}

export function updateEnemy(e, dt, now, world) {
  if (e.dead || e.leaked) return;
  if (e.flash > 0) e.flash -= dt;
  // Burning: the brazier's fire keeps eating the creature after the hit.
  if (e.burnUntil > now && e.burnDps > 0) {
    e.hp -= e.burnDps * dt;
    if (e.hp <= 0) { e.dead = true; return; }
  }
  if (e.frozenUntil > now) {
    const p = lanePoint(e.lane, Math.max(0, e.dist), e.wobble);
    e.x = p.x; e.y = p.y;
    return;
  }
  let speed = e.speed;
  if (e.slowUntil > now) speed *= e.slowFactor;
  // The Matriarch's second phase: below half health she runs faster and
  // burns violet — the march's last push before dawn.
  if (e.kind === 'matriarch' && e.hp <= e.maxHp / 2) {
    e.enraged = true;
    speed *= 1.4;
  }
  // A snow wall on this road: stop at it and chew.
  const wall = wallOnLane(world, e.lane);
  if (wall && wall.tower) {
    const stopAt = wall.dist - e.def.radius - 16;
    if (e.dist >= stopAt) {
      e.dist = stopAt;
      e.chewing = true;
      wall.tower.hp -= 26 * dt;
      if (wall.tower.hp <= 0) {
        wall.tower = null;
        e.chewing = false;
      }
      const p = lanePoint(e.lane, Math.max(0, e.dist), e.wobble);
      e.x = p.x; e.y = p.y;
      return;
    }
  }
  e.chewing = false;
  e.dist += speed * dt;
  const wob = Math.sin(now * 1.3 + e.wobblePhase) * 6;
  const p = lanePoint(e.lane, Math.max(0, e.dist), e.wobble + wob);
  e.x = p.x; e.y = p.y;
  if (e.dist >= e.total) {
    e.leaked = true;
  }
}
