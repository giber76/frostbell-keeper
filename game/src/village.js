// The village: the place the hearth keeps warm. Houses with lit windows
// around the square, snow pines along the edges, villagers huddled by the
// fire in coats of their own — and a supply sleigh that circles the hearth
// on a fixed route, bringing shards every loop. The village is scenery with
// one honest job: it makes the screenshots read as a village under siege,
// not an empty field. Nothing here blocks a road, a plot or a creature, so
// it can never break the game; the sleigh's position is a pure function of
// its own clock, so a seeded night replays exactly.

import { HEARTH } from './config.js';
import { floater } from './particles.js';

// The sleigh's loop: one circle around the hearth every 30 seconds, each
// full loop bringing 8 shards to the Keeper's purse.
export const SLEIGH_PERIOD = 30;
export const SLEIGH_SHARDS = 8;
export const SLEIGH_RADIUS = 100;

// Houses and cottages. Every one stands clear of the roads, the build
// plots and the pines, so the village never argues with the game.
const BUILDINGS = [
  { kind: 'chapel', x: 480, y: 108, w: 64, h: 52, wall: '#7a6a58', roof: '#5d3a2e' },
  { kind: 'granary', x: 795, y: 102, w: 62, h: 44, wall: '#8a6f4d', roof: '#6b4a2f' },
  { kind: 'cottage', x: 250, y: 200, w: 44, h: 36, wall: '#7d6b52', roof: '#4a3a2e' },
  { kind: 'cottage', x: 1030, y: 200, w: 44, h: 36, wall: '#6b5a48', roof: '#3f4a5a' },
  { kind: 'cottage', x: 250, y: 420, w: 44, h: 36, wall: '#857a5a', roof: '#5a3a3a' },
  { kind: 'cottage', x: 1030, y: 420, w: 44, h: 36, wall: '#6f6250', roof: '#2e4a3a' },
  { kind: 'cottage', x: 350, y: 620, w: 44, h: 36, wall: '#7a6a55', roof: '#4a3a4a' },
  { kind: 'cottage', x: 930, y: 620, w: 44, h: 36, wall: '#8a7a60', roof: '#3a4a6a' },
];

// Extra pines along the board's edges, between the corner pines that
// world.js already plants. Fixed spots, so the square always looks the same.
const VILLAGE_PINES = [
  { x: 380, y: 90, s: 1.05 }, { x: 560, y: 88, s: 0.9 }, { x: 900, y: 90, s: 1.1 },
  { x: 420, y: 628, s: 1.0 }, { x: 860, y: 628, s: 0.95 },
  { x: 222, y: 300, s: 1.15 }, { x: 222, y: 500, s: 0.9 },
  { x: 1058, y: 300, s: 1.0 }, { x: 1058, y: 500, s: 1.2 },
];

// The villagers: four people by the hearth, each in an outfit of their
// own — no two coats, hats or scarves alike. They stand and watch the
// night; they never move, fight or block anything.
const VILLAGERS = [
  { x: 550, y: 270, coat: '#b03040', hat: 'cap', scarf: '#e8b93a', trim: 'stripe', phase: 0.0 },
  { x: 730, y: 270, coat: '#2e7a6a', hat: 'fur', scarf: '#b03040', trim: 'solid', phase: 1.7 },
  { x: 550, y: 452, coat: '#d8a020', hat: 'hood', scarf: '#6a4a8a', trim: 'belt', phase: 3.1 },
  { x: 730, y: 452, coat: '#6a4a8a', hat: 'scarf', scarf: '#2e7a6a', trim: 'stripe', phase: 4.4 },
];

export function createVillage() {
  return {
    buildings: BUILDINGS.map((b) => ({ ...b })),
    trees: VILLAGE_PINES.map((p) => ({ ...p, sway: p.x * 0.013 })),
    villagers: VILLAGERS.map((v) => ({ ...v })),
    sleigh: { t: 0, loops: 0 },
  };
}

// Where the sleigh is on its circle, and which way it faces (the tangent).
export function sleighPosition(village) {
  const a = -Math.PI / 2 + (village.sleigh.t / SLEIGH_PERIOD) * Math.PI * 2;
  return {
    x: HEARTH.x + Math.cos(a) * SLEIGH_RADIUS,
    y: HEARTH.y + Math.sin(a) * SLEIGH_RADIUS,
    angle: a + Math.PI / 2,
  };
}

// The sleigh's clock runs whenever the game runs; a loop only pays out
// while the Keeper is building or fighting, never on the title screen.
export function updateVillage(g, dt) {
  const v = g.village;
  v.sleigh.t += dt;
  if (v.sleigh.t >= SLEIGH_PERIOD) {
    v.sleigh.t -= SLEIGH_PERIOD;
    v.sleigh.loops += 1;
    if (g.screen === 'build' || g.screen === 'wave') {
      g.shards += SLEIGH_SHARDS;
      const p = sleighPosition(v);
      floater(g.particles, p.x, p.y - 20, `+${SLEIGH_SHARDS} ◆ supply sleigh`, '#ffd76a');
      g.audio.coin();
    }
  }
}

function radial(ctx, x, y, r, stops) {
  const glow = ctx.createRadialGradient(x, y, 1, x, y, r);
  for (const [at, color] of stops) glow.addColorStop(at, color);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// One snow pine: trunk, three layered branches, snow on every tier.
// Shared with the corner pines in world.js, so every tree looks the same.
export function drawPine(ctx, x, y, s, sway, now) {
  const w = Math.sin(now * 0.9 + sway) * 2;
  // Soft shadow on the snow.
  ctx.fillStyle = 'rgba(8,12,28,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 15 * s, 14 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trunk.
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(x - 2.5 * s, y + 6 * s, 5 * s, 10 * s);
  // Three tiers, dark at the back, lit at the front, snow on each.
  const tiers = [
    { top: -26, half: 16, base: 14, dark: '#123527', mid: '#1d4a38', snow: 8 },
    { top: -16, half: 13, base: 8, dark: '#123527', mid: '#1d4a38', snow: 7 },
    { top: -6, half: 10, base: 2, dark: '#123527', mid: '#256b4a', snow: 6 },
  ];
  for (const t of tiers) {
    ctx.fillStyle = t.dark;
    ctx.beginPath();
    ctx.moveTo(x - t.half * s, y + t.base * s);
    ctx.lineTo(x + w, y + t.top * s);
    ctx.lineTo(x + t.half * s, y + t.base * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = t.mid;
    ctx.beginPath();
    ctx.moveTo(x - (t.half - 3) * s, y + (t.base - 4) * s);
    ctx.lineTo(x + w, y + (t.top + 2) * s);
    ctx.lineTo(x + (t.half - 3) * s, y + (t.base - 4) * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#eaf2ff';
    ctx.beginPath();
    ctx.moveTo(x - t.snow * s, y + (t.base - 6) * s);
    ctx.lineTo(x + w, y + (t.top + 4) * s);
    ctx.lineTo(x + t.snow * s, y + (t.base - 6) * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWindows(ctx, b) {
  // Two lit windows flanking the door, warm against the cold night.
  const wy = b.y - b.h / 2 + 8;
  const wx = [b.x - b.w / 4, b.x + b.w / 4];
  for (const x of wx) {
    ctx.fillStyle = '#2c2118';
    ctx.fillRect(x - 7, wy - 6, 14, 12);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(x - 5, wy - 4, 10, 8);
    ctx.strokeStyle = '#2c2118';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, wy - 4);
    ctx.lineTo(x, wy + 4);
    ctx.moveTo(x - 5, wy);
    ctx.lineTo(x + 5, wy);
    ctx.stroke();
  }
}

function drawChimneySmoke(ctx, b, now) {
  // Two puffs climbing from the chimney, looped on the clock so a seeded
  // night draws them the same way every time.
  const cx = b.x + b.w / 2 - 8;
  const cy = b.y - b.h / 2 - 12;
  for (let i = 0; i < 2; i += 1) {
    const ph = ((now * 0.35 + i * 0.5) % 1);
    const r = 3 + ph * 6;
    ctx.fillStyle = `rgba(234,242,255,${0.35 * (1 - ph)})`;
    ctx.beginPath();
    ctx.arc(cx + Math.sin(now + i * 2) * 3, cy - ph * 26, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBuilding(ctx, b, now) {
  const x0 = b.x - b.w / 2;
  const y0 = b.y - b.h / 2;
  // Soft shadow on the snow.
  ctx.fillStyle = 'rgba(8,12,28,0.4)';
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + b.h / 2 + 3, b.w / 2 + 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Walls, with a darker stone base.
  ctx.fillStyle = b.wall;
  ctx.fillRect(x0, y0, b.w, b.h);
  ctx.fillStyle = 'rgba(13,21,38,0.35)';
  ctx.fillRect(x0, y0 + b.h - 8, b.w, 8);
  ctx.strokeStyle = 'rgba(13,21,38,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, y0, b.w, b.h);
  // Roof: a pitched cap with snow on top.
  ctx.fillStyle = b.roof;
  ctx.beginPath();
  ctx.moveTo(x0 - 4, y0);
  ctx.lineTo(b.x, y0 - 16);
  ctx.lineTo(x0 + b.w + 4, y0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#eaf2ff';
  ctx.beginPath();
  ctx.moveTo(x0 - 4, y0);
  ctx.lineTo(b.x, y0 - 16);
  ctx.lineTo(x0 + b.w + 4, y0);
  ctx.lineTo(x0 + b.w, y0 + 2);
  ctx.lineTo(b.x, y0 - 12);
  ctx.lineTo(x0, y0 + 2);
  ctx.closePath();
  ctx.fill();
  // Door.
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(b.x - 5, y0 + b.h - 16, 10, 16);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(b.x + 2, y0 + b.h - 9, 2, 2);
  drawWindows(ctx, b);
  if (b.kind === 'chapel') {
    // A steeple with a little bell, and a round window above the door.
    ctx.fillStyle = b.wall;
    ctx.fillRect(b.x - 8, y0 - 34, 16, 20);
    ctx.fillStyle = b.roof;
    ctx.beginPath();
    ctx.moveTo(b.x - 10, y0 - 34);
    ctx.lineTo(b.x, y0 - 50);
    ctx.lineTo(b.x + 10, y0 - 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(b.x, y0 - 26, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(b.x, y0 + 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c2118';
    ctx.beginPath();
    ctx.arc(b.x, y0 + 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (b.kind === 'granary') {
    // A wide barn door with cross braces.
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(b.x - 11, y0 + b.h - 20, 22, 20);
    ctx.strokeStyle = '#5d3a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x - 11, y0 + b.h - 20);
    ctx.lineTo(b.x + 11, y0 + b.h);
    ctx.moveTo(b.x + 11, y0 + b.h - 20);
    ctx.lineTo(b.x - 11, y0 + b.h);
    ctx.stroke();
  }
  // Chimney and smoke, on the right side of the roof.
  ctx.fillStyle = '#5d4a3a';
  ctx.fillRect(b.x + b.w / 2 - 12, y0 - 12, 8, 12);
  drawChimneySmoke(ctx, b, now);
}

// The village itself: window glows first (so they spill on the snow),
// then the houses, then the pines. Background layer — drawn right after
// the board, under the towers, creatures and the Keeper.
export function drawVillage(ctx, g) {
  const { now } = g;
  for (const b of g.village.buildings) {
    const wy = b.y - b.h / 2 + 8;
    for (const x of [b.x - b.w / 4, b.x + b.w / 4]) {
      radial(ctx, x, wy, 34, [
        [0, 'rgba(255,215,106,0.35)'],
        [1, 'rgba(255,215,106,0)'],
      ]);
    }
  }
  for (const b of g.village.buildings) drawBuilding(ctx, b, now);
  for (const p of g.village.trees) drawPine(ctx, p.x, p.y, p.s, p.sway, now);
}

// One villager: cloak, head, a hat of their own, a scarf of their own,
// and the trim that makes the outfit theirs. They bob gently on the spot.
export function drawVillager(ctx, v, now) {
  const bob = Math.sin(now * 1.2 + v.phase) * 1.5;
  const x = v.x;
  const y = v.y + bob;
  // Shadow.
  ctx.fillStyle = 'rgba(8,12,28,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, v.y + 13, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak.
  ctx.fillStyle = v.coat;
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 12);
  ctx.quadraticCurveTo(x - 10, y - 4, x, y - 8);
  ctx.quadraticCurveTo(x + 10, y - 4, x + 9, y + 12);
  ctx.closePath();
  ctx.fill();
  // Trim: a stripe, a belt, or a plain hem, by outfit.
  if (v.trim === 'stripe') {
    ctx.strokeStyle = '#eaf2ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 6);
    ctx.lineTo(x + 8, y + 6);
    ctx.stroke();
  } else if (v.trim === 'belt') {
    ctx.fillStyle = '#2c2118';
    ctx.fillRect(x - 8, y + 2, 16, 3);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(x - 2, y + 2, 4, 3);
  }
  // Head.
  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath();
  ctx.arc(x, y - 11, 6, 0, Math.PI * 2);
  ctx.fill();
  // The hat: a wool cap, a fur hat, a hood, or a headscarf.
  if (v.hat === 'cap') {
    ctx.fillStyle = '#3a4a6a';
    ctx.beginPath();
    ctx.arc(x, y - 13, 6.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 6.5, y - 14, 13, 2.5);
  } else if (v.hat === 'fur') {
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath();
    ctx.arc(x, y - 13, 7.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(x - 7.5, y - 14, 15, 2);
  } else if (v.hat === 'hood') {
    ctx.fillStyle = v.coat;
    ctx.beginPath();
    ctx.arc(x, y - 12, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0c8a0';
    ctx.beginPath();
    ctx.arc(x, y - 11, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = v.scarf;
    ctx.beginPath();
    ctx.arc(x, y - 13, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 7, y - 14, 14, 2.5);
  }
  // Scarf: a band at the neck with a tail that waves on the clock.
  const wave = Math.sin(now * 2.4 + v.phase) * 2;
  ctx.fillStyle = v.scarf;
  ctx.fillRect(x - 6, y - 6, 12, 4);
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 4);
  ctx.quadraticCurveTo(x + 8, y + 2 + wave, x + 6, y + 10 + wave);
  ctx.quadraticCurveTo(x + 2, y + 6, x, y - 2);
  ctx.closePath();
  ctx.fill();
}

export function drawVillagers(ctx, g) {
  for (const v of g.village.villagers) drawVillager(ctx, v, g.now);
}

// The supply sleigh: a reindeer pulling a laden sleigh with a lantern,
// trotting around the hearth. Drawn after the Keeper so it is never hidden.
export function drawSleigh(ctx, g) {
  const v = g.village;
  const p = sleighPosition(v);
  // The lantern's little pool of light, under the sleigh — wide and warm
  // enough that the reindeer reads against the dark ground.
  radial(ctx, p.x - Math.cos(p.angle) * 34, p.y - Math.sin(p.angle) * 34, 36, [
    [0, 'rgba(255,215,106,0.5)'],
    [1, 'rgba(255,215,106,0)'],
  ]);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Shadow on the snow.
  ctx.fillStyle = 'rgba(8,12,28,0.35)';
  ctx.beginPath();
  ctx.ellipse(-2, 14, 30, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Reindeer: body, neck, head, antlers, four trotting legs. A warm
  // chestnut coat, so it reads against the dark night ground.
  ctx.fillStyle = '#8a6242';
  ctx.beginPath();
  ctx.ellipse(14, 0, 13, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#96683f';
  ctx.beginPath();
  ctx.ellipse(24, -6, 5, 8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6242';
  ctx.beginPath();
  ctx.ellipse(28, -11, 5.5, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Antlers.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(26, -15);
  ctx.lineTo(22, -21);
  ctx.lineTo(19, -19);
  ctx.moveTo(22, -21);
  ctx.lineTo(24, -24);
  ctx.moveTo(29, -15);
  ctx.lineTo(30, -22);
  ctx.lineTo(33, -20);
  ctx.stroke();
  // Legs, trotting on the clock.
  ctx.strokeStyle = '#5d4128';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i += 1) {
    const lx = 6 + i * 5;
    const swing = Math.sin(v.sleigh.t * 10 + i * Math.PI) * 3;
    ctx.beginPath();
    ctx.moveTo(lx, 5);
    ctx.lineTo(lx + swing, 12);
    ctx.stroke();
  }
  // Harness to the sleigh.
  ctx.strokeStyle = '#2c2118';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-8, 2);
  ctx.stroke();
  // Sleigh: curved runners, a laden box, sacks, and a lantern at the back.
  ctx.strokeStyle = '#8a6f4d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-34, 10);
  ctx.quadraticCurveTo(-30, 14, -24, 10);
  ctx.lineTo(-8, 10);
  ctx.stroke();
  ctx.fillStyle = '#a8326e';
  ctx.beginPath();
  ctx.moveTo(-34, 8);
  ctx.lineTo(-8, 8);
  ctx.lineTo(-10, -2);
  ctx.lineTo(-32, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8c49a';
  ctx.beginPath();
  ctx.arc(-28, -4, 5, 0, Math.PI * 2);
  ctx.arc(-18, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(-34, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
