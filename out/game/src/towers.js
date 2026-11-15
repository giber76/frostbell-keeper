// Towers: what the Keeper builds on plots and wall slots, what they cost,
// how they aim and fire, and how they grow when upgraded.

import { TOWERS, UPGRADE_COST_FRACTION, UPGRADE_DAMAGE_FRACTION, MAX_TOWER_LEVEL } from './config.js';

export function towerCost(kind, level) {
  const base = TOWERS[kind].cost;
  if (level <= 1) return base;
  return Math.round(base * Math.pow(1 + UPGRADE_COST_FRACTION, level - 1));
}

export function upgradeCost(tower) {
  return Math.round(TOWERS[tower.kind].cost * UPGRADE_COST_FRACTION * tower.level);
}

export function towerDamage(tower) {
  const base = TOWERS[tower.kind].damage;
  return Math.round(base * (1 + UPGRADE_DAMAGE_FRACTION * (tower.level - 1)));
}

export function towerRange(tower) {
  return TOWERS[tower.kind].range + (tower.level - 1) * 12;
}

export function makeTower(kind, x, y) {
  const def = TOWERS[kind];
  return {
    kind, x, y, level: 1,
    cooldown: 0,
    hp: def.hp || 0,
    maxHp: def.hp || 0,
    angle: -Math.PI / 2,
    muzzle: 0,
  };
}

export function canUpgrade(tower) {
  return tower.level < MAX_TOWER_LEVEL && tower.kind !== 'wall';
}

// A tower's target: the creature furthest along its road (closest to the
// hearth) inside its range. That is the one that matters most.
export function pickTarget(tower, enemies) {
  const range = towerRange(tower);
  let best = null;
  let bestDist = -1;
  for (const e of enemies) {
    if (e.dead || e.leaked) continue;
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d <= range && e.dist > bestDist) { bestDist = e.dist; best = e; }
  }
  return best;
}

// Returns events the game turns into particles, sounds and floating numbers.
export function updateTower(tower, dt, now, enemies, addBolt) {
  const def = TOWERS[tower.kind];
  const events = [];
  if (tower.cooldown > 0) tower.cooldown -= dt;
  if (tower.kind === 'wall') return events;
  if (tower.kind === 'brazier') {
    // A brazier burns everything in its circle, a little at a time.
    if (tower.cooldown <= 0) {
      tower.cooldown = def.rate;
      const range = towerRange(tower);
      for (const e of enemies) {
        if (e.dead || e.leaked) continue;
        if (Math.hypot(e.x - tower.x, e.y - tower.y) <= range) {
          e.hp -= towerDamage(tower);
          e.burnUntil = now + 1.5;
          e.burnDps = Math.max(e.burnDps, towerDamage(tower) * 0.6);
          e.flash = 0.12;
          if (e.hp <= 0) { e.dead = true; events.push({ type: 'kill', enemy: e }); }
        }
      }
      events.push({ type: 'burn', x: tower.x, y: tower.y, range });
    }
    return events;
  }
  if (tower.kind === 'bell') {
    if (tower.cooldown <= 0) {
      tower.cooldown = def.rate;
      const range = towerRange(tower);
      let rang = false;
      for (const e of enemies) {
        if (e.dead || e.leaked) continue;
        if (Math.hypot(e.x - tower.x, e.y - tower.y) <= range) {
          e.slowUntil = now + def.slowTime;
          e.slowFactor = def.slow;
          rang = true;
        }
      }
      if (rang) events.push({ type: 'ring', x: tower.x, y: tower.y, range });
    }
    return events;
  }
  // Ember cannon: one heavy shot at the furthest-along creature in range.
  if (tower.cooldown <= 0) {
    const target = pickTarget(tower, enemies);
    if (target) {
      tower.cooldown = def.rate;
      tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
      tower.muzzle = 0.12;
      addBolt({
        x: tower.x, y: tower.y, target, speed: 460,
        damage: towerDamage(tower), radius: 7, from: 'cannon',
      });
      events.push({ type: 'shoot', x: tower.x, y: tower.y });
    }
  }
  return events;
}
