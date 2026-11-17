// The frost: what marches on the hearth, and how it moves. Enemies walk
// toward the hearth in a straight line and slide around frost pillars when
// one blocks them. Wisps wobble, wolves zigzag, golems shrug off a wide
// beam (only a focused beam bites them), and the Matriarch stops at range
// and hurls frost bolts at the hearth.

import { ENEMY_KINDS, HEARTH, PILLARS, VIEW_W } from './config.js';

let nextId = 1;

export function spawnEnemy(kind, x, y, hpMult) {
  const base = ENEMY_KINDS[kind];
  return {
    id: nextId,
    kind,
    x, y,
    hp: Math.round(base.hp * hpMult),
    maxHp: Math.round(base.hp * hpMult),
    speed: base.speed,
    radius: base.radius,
    damage: base.damage,
    embers: base.embers,
    score: base.score,
    armored: !!base.armored,
    boss: !!base.boss,
    wobble: Math.random() * Math.PI * 2,
    age: 0,
    flash: 0,
    boltTimer: 3,
  };
}
nextId = 1;

export function spawnPoint(rng, side) {
  if (side === 'top') return { x: rng.range(60, VIEW_W - 60), y: -20 };
  if (side === 'left') return { x: -20, y: rng.range(60, 420) };
  return { x: VIEW_W + 20, y: rng.range(60, 420) };
}

function blockedByPillar(x, y, radius) {
  return PILLARS.some((p) => Math.hypot(x - p.x, y - p.y) < p.r + radius + 2);
}

export function moveEnemy(e, dt) {
  e.age += dt;
  if (e.flash > 0) e.flash -= dt;
  const dx = HEARTH.x - e.x;
  const dy = HEARTH.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  // The Matriarch holds at range and throws frost instead of walking in.
  if (e.boss && dist < 190) return 'holding';
  let vx = (dx / dist) * e.speed;
  let vy = (dy / dist) * e.speed;
  if (e.kind === 'wisp') {
    const w = Math.sin(e.age * 3 + e.wobble) * 26;
    vx += (-dy / dist) * w;
    vy += (dx / dist) * w;
  } else if (e.kind === 'wolf') {
    const z = Math.sin(e.age * 5 + e.wobble) > 0 ? 1 : -1;
    vx += (-dy / dist) * 30 * z;
    vy += (dx / dist) * 30 * z;
  }
  const nx = e.x + vx * dt;
  const ny = e.y + vy * dt;
  if (!blockedByPillar(nx, ny, e.radius)) {
    e.x = nx; e.y = ny;
  } else {
    // The direct road is blocked by a pillar: slide around it. The
    // perpendicular direction that brings the march closer to the hearth
    // goes first, the other way second — so a creature caught dead
    // centre behind a pillar walks around it instead of stalling there
    // forever, out of the beam's reach and out of the hearth's.
    const px = -dy / dist;
    const py = dx / dist;
    const s1x = e.x + px * e.speed * dt;
    const s1y = e.y + py * e.speed * dt;
    const s2x = e.x - px * e.speed * dt;
    const s2y = e.y - py * e.speed * dt;
    const d1 = Math.hypot(HEARTH.x - s1x, HEARTH.y - s1y);
    const d2 = Math.hypot(HEARTH.x - s2x, HEARTH.y - s2y);
    const first = d1 <= d2 ? [s1x, s1y] : [s2x, s2y];
    const second = d1 <= d2 ? [s2x, s2y] : [s1x, s1y];
    if (!blockedByPillar(first[0], first[1], e.radius)) {
      e.x = first[0]; e.y = first[1];
    } else if (!blockedByPillar(second[0], second[1], e.radius)) {
      e.x = second[0]; e.y = second[1];
    }
  }
  return 'walking';
}

export function enemyAtHearth(e) {
  return Math.hypot(e.x - HEARTH.x, e.y - HEARTH.y) < HEARTH.r + e.radius - 6;
}
