// The moon turns every wave: the night's second rule that changes as
// the waves pass, beside the wind. The moon crosses the square in a low
// arc — east on the first wave, over the hearth by the last — and the
// band of silver light under it is where the defence strikes hardest.
// The moon is a fixed table, never a roll, so a seeded night replays
// exactly, and the frame always shows where the light stands.

import { MOON } from './config.js';

// Where the moon hangs this wave: x sweeps the whole square left to
// right, y rises and falls in a low arc over the hearth.
export function moonForWave(wave) {
  const t = Math.max(0, Math.min(wave - 1, 15)) / 15;
  return {
    x: Math.round(320 + t * 640),
    y: Math.round(78 + 34 * Math.sin(Math.PI * t)),
    wave,
  };
}

// The band of moonlight on the ground: a vertical strip under the moon,
// 300 px wide, from the top of the board to the bottom.
export function inMoonlight(x, moon) {
  if (!moon) return false;
  return x >= moon.x - MOON.bandHalfWidth && x <= moon.x + MOON.bandHalfWidth;
}

// The band's place in words, for the HUD: west, heart or east.
export function moonRegionName(moon) {
  if (!moon) return 'the night';
  if (moon.x < 490) return 'the west road';
  if (moon.x > 790) return 'the east road';
  return 'the heart of the square';
}

// The moon the towers read: set once per wave from game.js, the same
// way the wind is set — towerDamage reads it through moonTowerMult.
let moonState = moonForWave(1);

export function setMoon(moon) {
  moonState = moon || moonForWave(1);
}

export function currentMoon() {
  return moonState;
}

// How hard a tower at this x strikes: a quarter harder in the band.
export function moonTowerMult(x) {
  return inMoonlight(x, moonState) ? MOON.towerMult : 1;
}

// How hard the Keeper's bolts bite from this x: the same quarter, when
// he stands in the band.
export function moonKeeperMult(x) {
  return inMoonlight(x, moonState) ? MOON.keeperMult : 1;
}

// One frame of moonlight: creatures standing in the band walk a little
// slower — the silver light holds the frost, the way the sweep's cone
// does, only gentler and over the whole band.
export function applyMoon(g, now) {
  if (!g.moon) return 0;
  let held = 0;
  for (const e of g.enemies) {
    if (e.dead || e.leaked) continue;
    if (!inMoonlight(e.x, g.moon)) continue;
    held += 1;
    e.slowUntil = now + 0.15;
    e.slowFactor = Math.min(e.slowFactor, MOON.slow);
  }
  return held;
}
