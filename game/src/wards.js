// Ember Wards — v7's drawn verb. The top entries all hand the player
// something to DO with the mouse (MARGINALIA draws its loops, CINDERLINE
// drives its train); FROSTBELL's Keeper only ever threw bolts and swept
// a cone. Now, with the ward tool open (V), the Keeper traces a line of
// light with the mouse and releases it to lay it across the roads: the
// line burns and slows every creature that touches it, for twelve
// seconds, and costs shards by its length. A ward is one stroke, not
// the whole square — at most 360 px, at most four standing at once.

import { BOARD, WARD } from './config.js';

export function wardLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

export function wardCost(length) {
  return Math.min(WARD.maxCost, Math.max(WARD.minCost, Math.ceil(length * WARD.costPerPx)));
}

function clampToBoard(x, y) {
  return {
    x: Math.max(BOARD.x + 8, Math.min(BOARD.x + BOARD.w - 8, x)),
    y: Math.max(BOARD.y + 8, Math.min(BOARD.y + BOARD.h - 8, y)),
  };
}

// The drag begins: the Keeper's pen touches the snow.
export function beginWard(g, x, y) {
  if (!g.ward) return false;
  const p = clampToBoard(x, y);
  g.ward.drawing = true;
  g.ward.points = [p];
  return true;
}

// The drag continues: trace the line, one point every ten pixels. The
// line is capped at the ward's longest stroke — older points fall away,
// so a long drag lays the newest stretch, not the whole square.
export function extendWard(g, x, y) {
  if (!g.ward || !g.ward.drawing) return false;
  const pts = g.ward.points;
  const last = pts[pts.length - 1];
  const p = clampToBoard(x, y);
  if (Math.hypot(p.x - last.x, p.y - last.y) < 10) return false;
  pts.push(p);
  while (wardLength(pts) > WARD.maxLength && pts.length > 2) pts.shift();
  return true;
}

// The drag ends: lay the line, or say why it cannot be laid. Returns
// 'ok', 'short' (too small a stroke), 'poor' (not enough shards) or
// 'idle' (nothing was being drawn). The click that drew it is spent
// either way — the ward, not the plot behind it, owns that drag.
export function endWard(g) {
  if (!g.ward || !g.ward.drawing) return 'idle';
  g.ward.drawing = false;
  const pts = g.ward.points;
  g.ward.points = [];
  const len = wardLength(pts);
  if (len < WARD.minLength) return 'short';
  const cost = wardCost(len);
  if (g.shards < cost) return 'poor';
  g.shards -= cost;
  g.wards.push({
    points: pts.map((p) => ({ x: p.x, y: p.y })),
    born: g.now,
    until: g.now + WARD.lifetime,
    cost,
  });
  while (g.wards.length > WARD.maxWards) g.wards.shift();
  g.stats.wardsDrawn += 1;
  g.audio.build();
  return 'ok';
}

function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function nearWard(x, y, ward) {
  const pts = ward.points;
  for (let i = 1; i < pts.length; i += 1) {
    if (pointSegDist(x, y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= WARD.reach) return true;
  }
  return false;
}

// One frame: creatures touching a ward burn and slow, the way the
// sweep's cone burns them — and the tale names the ward that slew them.
export function applyWards(g, now) {
  g.wards = g.wards.filter((w) => w.until > now);
  let held = 0;
  for (const w of g.wards) {
    for (const e of g.enemies) {
      if (e.dead || e.leaked) continue;
      if (!nearWard(e.x, e.y, w)) continue;
      held += 1;
      e.slowUntil = now + 0.2;
      e.slowFactor = Math.min(e.slowFactor, WARD.slow);
      e.burnUntil = Math.max(e.burnUntil, now + 0.4);
      e.burnDps = Math.max(e.burnDps, WARD.burnDps);
      e.lastHitBy = 'Ember Ward';
      e.flash = Math.max(e.flash, 0.05);
    }
  }
  return held;
}
