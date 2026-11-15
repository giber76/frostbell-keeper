// The village square: four snow roads, the hearth at the centre, build plots
// beside the roads and wall slots on them. A road is a straight line from its
// gate to the hearth; a creature's position is its distance along that line,
// plus a small sideways wobble so the march never looks like a conga line.

import { BOARD, HEARTH, buildPlots, wallSlots } from './config.js';

export const LANES = {
  N: { gate: { x: HEARTH.x, y: BOARD.y - 6 }, dir: { x: 0, y: 1 } },
  S: { gate: { x: HEARTH.x, y: BOARD.y + BOARD.h + 6 }, dir: { x: 0, y: -1 } },
  W: { gate: { x: BOARD.x - 6, y: HEARTH.y }, dir: { x: 1, y: 0 } },
  E: { gate: { x: BOARD.x + BOARD.w + 6, y: HEARTH.y }, dir: { x: -1, y: 0 } },
};
export const LANE_ORDER = ['N', 'E', 'S', 'W'];

// Distance from gate to the hearth's edge, in px.
export function laneLength(lane) {
  const g = LANES[lane].gate;
  const dx = HEARTH.x - g.x;
  const dy = HEARTH.y - g.y;
  return Math.hypot(dx, dy) - HEARTH.r - 6;
}

export function lanePoint(lane, dist, wobble) {
  const g = LANES[lane].gate;
  const d = LANES[lane].dir;
  const px = -d.y;
  const py = d.x;
  return { x: g.x + d.x * dist + px * (wobble || 0), y: g.y + d.y * dist + py * (wobble || 0) };
}

export function createWorld(random) {
  const plots = buildPlots().map((p) => ({ ...p, tower: null }));
  const walls = wallSlots().map((w) => {
    const dist = Math.round(w.frac * laneLength(w.lane));
    const pos = lanePoint(w.lane, dist, 0);
    return { ...w, dist, x: pos.x, y: pos.y, tower: null };
  });
  // Pine trees for the corners, placed once so the square always looks the same.
  const pines = [];
  const pineSpots = [
    [232, 92], [268, 118], [1040, 96], [1006, 128], [238, 628], [272, 600],
    [1036, 624], [1002, 596], [300, 84], [980, 84], [296, 636], [984, 636],
  ];
  for (const [x, y] of pineSpots) pines.push({ x, y, s: random.range(0.8, 1.25), sway: random.range(0, Math.PI * 2) });
  return { plots, walls, pines, random };
}

// The nearest empty build plot or wall slot to a point, if it is close enough.
export function pickSlot(world, x, y) {
  let best = null;
  let bestD = 34;
  for (const p of world.plots) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) { bestD = d; best = p; }
  }
  for (const w of world.walls) {
    const d = Math.hypot(w.x - x, w.y - y);
    if (d < bestD) { bestD = d; best = w; }
  }
  return best;
}

export function pickTowerAt(world, x, y) {
  for (const p of [...world.plots, ...world.walls]) {
    if (p.tower && Math.hypot(p.x - x, p.y - y) < 30) return p;
  }
  return null;
}

export function towersOf(world) {
  const out = [];
  for (const p of [...world.plots, ...world.walls]) if (p.tower) out.push(p.tower);
  return out;
}

// The wall standing on a lane, if any, and how far along the road it sits.
export function wallOnLane(world, lane) {
  for (const w of world.walls) {
    if (w.lane === lane && w.tower && w.tower.hp > 0) return w;
  }
  return null;
}
