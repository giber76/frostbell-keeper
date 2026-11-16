// The Lantern Sweep — v6's direct verb. The top entries all hand the
// player something to DO every moment (CINDERLINE drives its train,
// MARGINALIA draws its loops, SUNWRIGHT steers its sun); FROSTBELL's
// Keeper only ever threw bolts and waited. Now, holding right-click (or
// Q) sweeps the Keeper's lantern in a cone of golden light toward the
// mouse: frost caught in the cone is slowed hard and scorched, and every
// tower the light passes over is rekindled — it fires half again as hard
// for two seconds. The sweep drinks lantern oil, which refills while the
// lantern rests, so the Keeper chooses when the light matters most.

import { SWEEP } from './config.js';

// True when this point stands inside the sweep cone (range + half-angle).
export function inSweepCone(k, x, y) {
  const dx = x - k.x;
  const dy = y - k.y;
  const d = Math.hypot(dx, dy);
  if (d > SWEEP.range) return false;
  if (d < 24) return true;
  let diff = Math.atan2(dy, dx) - k.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= SWEEP.halfAngle;
}

// One frame of sweeping: slow and scorch the caught frost, rekindle the
// caught towers. Returns how many creatures the cone held, for the HUD.
export function applySweep(g, now) {
  const k = g.keeper;
  if (!k || !k.sweeping) return 0;
  let held = 0;
  for (const e of g.enemies) {
    if (e.dead || e.leaked) continue;
    if (!inSweepCone(k, e.x, e.y)) continue;
    held += 1;
    e.slowUntil = now + 0.15;
    e.slowFactor = Math.min(e.slowFactor, SWEEP.slow);
    e.burnUntil = Math.max(e.burnUntil, now + 0.3);
    e.burnDps = Math.max(e.burnDps, SWEEP.burnDps);
    e.flash = Math.max(e.flash, 0.05);
  }
  for (const p of [...g.world.plots, ...g.world.walls]) {
    const t = p.tower;
    if (!t || t.kind === 'wall') continue;
    if (inSweepCone(k, t.x, t.y)) t.rekindledUntil = now + SWEEP.rekindleSeconds;
  }
  return held;
}
