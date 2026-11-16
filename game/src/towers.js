// Towers: what the Keeper builds on plots and wall slots, what they cost,
// how they aim and fire, and how they grow when upgraded.

import { TOWERS, UPGRADE_COST_FRACTION, UPGRADE_DAMAGE_FRACTION, MAX_TOWER_LEVEL } from './config.js';

// The wind's hand on the towers: set once per wave from game.js, so a
// tower's damage and range are the wind's as well as its own. Walls have
// no damage or range, so the wind leaves them alone.
let windFactors = { towerDamage: 1, towerRange: 1 };

export function setWind(wind) {
  windFactors = wind || { towerDamage: 1, towerRange: 1 };
}

// The dawn's hand on the towers (v6): blessings the Keeper chose after a
// wave — Kindling feeds the braziers, Frostbite Rounds feed the cannons,
// Swift Hands quicken every tower. Set from game.js when a boon is taken,
// the same way the wind is set once per wave.
let boonFactors = { brazier: 1, cannon: 1, rate: 1 };

export function setBoonFactors(factors) {
  boonFactors = factors || { brazier: 1, cannon: 1, rate: 1 };
}

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
  // A rekindled tower (v6: the Lantern Sweep's light touched it) fires
  // half again as hard; a blessed tower fires its blessing's harder still.
  const boon = tower.kind === 'brazier' ? boonFactors.brazier
    : tower.kind === 'cannon' ? boonFactors.cannon : 1;
  const rekindled = tower.rekindled ? 1.5 : 1;
  return Math.round(base * (1 + UPGRADE_DAMAGE_FRACTION * (tower.level - 1)) * (windFactors.towerDamage || 1) * boon * rekindled);
}

export function towerRange(tower) {
  return Math.round((TOWERS[tower.kind].range + (tower.level - 1) * 12) * (windFactors.towerRange || 1));
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
    // The Lantern Sweep (v6): set while the cone holds the tower.
    rekindledUntil: 0, rekindled: false,
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
  // The Lantern Sweep's rekindling (v6): while the cone's light holds
  // this tower it fires half again as hard — towerDamage reads the flag.
  tower.rekindled = tower.rekindledUntil > now;
  // A blessed tower (v6: Swift Hands) fires faster; the rate lives in
  // the one local, so every branch below pays it the same way.
  const rate = def.rate * boonFactors.rate;
  if (tower.cooldown > 0) tower.cooldown -= dt;
  if (tower.kind === 'wall') return events;
  if (tower.kind === 'brazier') {
    // A brazier burns everything in its circle, a little at a time.
    if (tower.cooldown <= 0) {
      tower.cooldown = rate;
      const range = towerRange(tower);
      for (const e of enemies) {
        if (e.dead || e.leaked) continue;
        if (Math.hypot(e.x - tower.x, e.y - tower.y) <= range) {
          e.hp -= towerDamage(tower);
          e.lastHitBy = 'Brazier';
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
      tower.cooldown = rate;
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
  if (tower.kind === 'lantern') {
    // A frost lantern does not fire: its cold light holds the march in
    // its ring, a little at a time, as long as creatures stand in it.
    if (tower.cooldown <= 0) {
      tower.cooldown = rate;
      const range = towerRange(tower);
      let held = false;
      for (const e of enemies) {
        if (e.dead || e.leaked) continue;
        if (Math.hypot(e.x - tower.x, e.y - tower.y) <= range) {
          e.slowUntil = now + def.slowTime;
          e.slowFactor = Math.min(e.slowFactor, def.slow);
          held = true;
        }
      }
      if (held) events.push({ type: 'ring', x: tower.x, y: tower.y, range });
    }
    return events;
  }
  if (tower.kind === 'mortar') {
    // A shard mortar lobs one heavy shell at the furthest-along creature
    // in its long range; the shell bursts over the crowd when it lands.
    if (tower.cooldown <= 0) {
      const target = pickTarget(tower, enemies);
      if (target) {
        tower.cooldown = rate;
        tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
        tower.muzzle = 0.12;
        addBolt({
          x: tower.x, y: tower.y, target, speed: 380,
          damage: towerDamage(tower), radius: 8, from: 'mortar',
          splash: def.splash,
        });
        events.push({ type: 'shoot', x: tower.x, y: tower.y });
      }
    }
    return events;
  }
  // Ember cannon: one heavy shot at the furthest-along creature in range.
  if (tower.cooldown <= 0) {
    const target = pickTarget(tower, enemies);
    if (target) {
      tower.cooldown = rate;
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
