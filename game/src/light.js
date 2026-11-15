// The light: everything that makes the one warm thing in the cold dark
// visible. The night ground is dark on purpose — the hearth, the braziers
// and the Keeper's lantern carve pools of warm light out of it, and the
// further from a flame a creature stands, the colder and dimmer it looks.
// This is the game's whole visual idea, so it lives in its own file.

import { HEARTH } from './config.js';

function radial(ctx, x, y, r, stops) {
  const glow = ctx.createRadialGradient(x, y, 2, x, y, r);
  for (const [at, color] of stops) glow.addColorStop(at, color);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// The hearth's glow: a hot core, a wide warm pool, and a faint halo that
// reaches the plaza's edges. It breathes with the flame and dims as the
// warmth is stolen — a cold hearth lights nothing.
export function drawHearthGlow(ctx, g) {
  const { now, warmth } = g;
  const flick = 1 + Math.sin(now * 9) * 0.06 + Math.sin(now * 23) * 0.04;
  const lit = 0.25 + 0.75 * (warmth / 100);
  const core = 260 * flick * (0.4 + 0.6 * lit);
  radial(ctx, HEARTH.x, HEARTH.y, core, [
    [0, 'rgba(255,196,96,0.85)'],
    [0.35, 'rgba(255,140,40,0.38)'],
    [0.7, 'rgba(255,110,30,0.12)'],
    [1, 'rgba(255,110,30,0)'],
  ]);
  radial(ctx, HEARTH.x, HEARTH.y, 430 * flick, [
    [0, 'rgba(255,150,50,0.10)'],
    [1, 'rgba(255,150,50,0)'],
  ]);
}

// One lit tower's pool of light. Braziers burn widest; a higher level burns
// further. The Keeper's lantern is a small warm circle that follows him.
export function drawTowerGlow(ctx, t, now) {
  if (t.kind === 'brazier') {
    const flick = 1 + Math.sin(now * 11 + t.x) * 0.12;
    const r = (58 + 14 * (t.level - 1)) * flick;
    radial(ctx, t.x, t.y, r, [
      [0, 'rgba(255,180,71,0.75)'],
      [0.6, 'rgba(255,122,26,0.22)'],
      [1, 'rgba(255,122,26,0)'],
    ]);
  }
}

export function drawKeeperGlow(ctx, k, now) {
  if (!k) return;
  const flick = 1 + Math.sin(now * 8) * 0.05;
  radial(ctx, k.x, k.y, 62 * flick, [
    [0, 'rgba(255,215,106,0.5)'],
    [1, 'rgba(255,215,106,0)'],
  ]);
}

// Every light in the scene, in one pass, under everything it lights.
export function drawLightPools(ctx, g) {
  drawHearthGlow(ctx, g);
  for (const p of [...g.world.plots, ...g.world.walls]) {
    if (p.tower) drawTowerGlow(ctx, p.tower, g.now);
  }
  drawKeeperGlow(ctx, g.keeper, g.now);
}

// The cold at the edges: the board's corners fall away into dark blue, so
// the eye stays on the warm centre where the hearth burns.
export function drawNightVignette(ctx) {
  const vig = ctx.createRadialGradient(640, 360, 240, 640, 360, 760);
  vig.addColorStop(0, 'rgba(8,12,28,0)');
  vig.addColorStop(0.7, 'rgba(8,12,28,0.18)');
  vig.addColorStop(1, 'rgba(8,12,28,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 1280, 720);
}
