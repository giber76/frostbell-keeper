// The beam: pure optics. From the hearth it travels in a straight line
// until it meets a mirror (it reflects), a frost pillar (it stops, spent) or
// the edge of the field. castBeam returns the list of segments the light
// actually takes, so the renderer can paint it and the game can test what
// the light touches. Nothing here knows about enemies or damage — the game
// asks pointInBeam / enemyInBeam about that.

import { BEAM, PILLARS, VIEW_W, VIEW_H } from './config.js';
import { mirrorEnds } from './mirrors.js';

function raySegment(origin, dir, a, b) {
  // Ray origin + t*dir against segment a..b. Returns t along the ray, or
  // null when they do not meet ahead of the ray.
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const denom = dir.x * ey - dir.y * ex;
  if (Math.abs(denom) < 1e-9) return null;
  const rx = a.x - origin.x;
  const ry = a.y - origin.y;
  const t = (rx * ey - ry * ex) / denom;
  const s = (rx * dir.y - ry * dir.x) / denom;
  if (t <= 0.001 || s < 0 || s > 1) return null;
  return t;
}

function rayCircle(origin, dir, c, r) {
  const ox = origin.x - c.x;
  const oy = origin.y - c.y;
  const b = ox * dir.x + oy * dir.y;
  const cc = ox * ox + oy * oy - r * r;
  const disc = b * b - cc;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > 0.001 ? t : null;
}

export function castBeam(origin, angle, mirrors) {
  const segments = [];
  let pos = { x: origin.x, y: origin.y };
  let dir = { x: Math.cos(angle), y: Math.sin(angle) };
  let travelled = 0;

  for (let bounce = 0; bounce <= BEAM.maxBounces; bounce += 1) {
    let bestT = BEAM.range - travelled;
    let hit = null;

    for (const m of mirrors) {
      const e = mirrorEnds(m);
      const t = raySegment(pos, dir, { x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 });
      if (t !== null && t < bestT) { bestT = t; hit = { kind: 'mirror', mirror: m }; }
    }
    for (const p of PILLARS) {
      const t = rayCircle(pos, dir, p, p.r);
      if (t !== null && t < bestT) { bestT = t; hit = { kind: 'pillar' }; }
    }
    // Field edges stop the beam too.
    const edgeT = Math.min(
      dir.x > 0.001 ? (VIEW_W - pos.x) / dir.x : Infinity,
      dir.x < -0.001 ? (0 - pos.x) / dir.x : Infinity,
      dir.y > 0.001 ? (VIEW_H - pos.y) / dir.y : Infinity,
      dir.y < -0.001 ? (0 - pos.y) / dir.y : Infinity,
    );
    if (edgeT < bestT) { bestT = edgeT; hit = { kind: 'edge' }; }

    const end = { x: pos.x + dir.x * bestT, y: pos.y + dir.y * bestT };
    segments.push({ x1: pos.x, y1: pos.y, x2: end.x, y2: end.y, bounce });
    travelled += bestT;

    if (!hit || hit.kind !== 'mirror') return segments;
    // Reflect the direction about the mirror's line. A mirror is double
    // sided: the same reflection works from either face.
    const mx = Math.cos(hit.mirror.angle);
    const my = Math.sin(hit.mirror.angle);
    const dot = dir.x * mx + dir.y * my;
    dir = { x: 2 * dot * mx - dir.x, y: 2 * dot * my - dir.y };
    pos = { x: end.x + dir.x * 0.5, y: end.y + dir.y * 0.5 };
  }
  return segments;
}

export function distToSegment(px, py, seg) {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - seg.x1) * dx + (py - seg.y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = seg.x1 + t * dx;
  const cy = seg.y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function enemyInBeam(enemy, segments, halfWidth) {
  for (const seg of segments) {
    if (distToSegment(enemy.x, enemy.y, seg) < enemy.radius + halfWidth) return true;
  }
  return false;
}

export function pointInBeam(x, y, segments, halfWidth) {
  for (const seg of segments) {
    if (distToSegment(x, y, seg) < halfWidth) return true;
  }
  return false;
}
