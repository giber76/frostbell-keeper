// Ice mirrors: the player's tool for bending the hearth's light. A mirror is
// a short bright segment with an angle. Click empty ground to place one (it
// costs embers), click a mirror to select it, Q / E or the wheel rotates the
// selected one, right-click removes it for a partial refund. The beam file
// does the optics; this file only owns the mirrors themselves.

import { MIRROR, HEARTH, PILLARS } from './config.js';

export function createMirrorSet() {
  return { list: [], selected: null, nextId: 1 };
}

export function mirrorEnds(m) {
  const half = MIRROR.length / 2;
  const dx = Math.cos(m.angle) * half;
  const dy = Math.sin(m.angle) * half;
  return { x1: m.x - dx, y1: m.y - dy, x2: m.x + dx, y2: m.y + dy };
}

function distToHearth(x, y) {
  return Math.hypot(x - HEARTH.x, y - HEARTH.y);
}

function clearOfPillars(x, y) {
  return PILLARS.every((p) => Math.hypot(x - p.x, y - p.y) > p.r + 46);
}

export function canPlace(set, x, y, embers, maxCount) {
  if (set.list.length >= maxCount) return { ok: false, why: 'No mirror slots left' };
  if (embers < MIRROR.cost) return { ok: false, why: 'Not enough embers' };
  if (distToHearth(x, y) < HEARTH.r + 60) return { ok: false, why: 'Too close to the hearth' };
  if (x < 40 || x > 1240 || y < 40 || y > 680) return { ok: false, why: 'Too close to the edge' };
  if (!clearOfPillars(x, y)) return { ok: false, why: 'Too close to a frost pillar' };
  if (set.list.some((m) => Math.hypot(m.x - x, m.y - y) < 70)) {
    return { ok: false, why: 'Too close to another mirror' };
  }
  return { ok: true };
}

export function placeMirror(set, x, y) {
  const m = { id: set.nextId, x, y, angle: -Math.PI / 4 };
  set.nextId += 1;
  set.list.push(m);
  set.selected = m.id;
  return m;
}

export function mirrorAt(set, x, y) {
  let best = null;
  let bestDist = 30;
  for (const m of set.list) {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < bestDist) { best = m; bestDist = d; }
  }
  return best;
}

export function selectedMirror(set) {
  return set.list.find((m) => m.id === set.selected) || null;
}

export function rotateSelected(set, delta) {
  const m = selectedMirror(set);
  if (m) m.angle += delta;
}

export function removeSelected(set) {
  const m = selectedMirror(set);
  if (!m) return null;
  set.list = set.list.filter((o) => o.id !== m.id);
  set.selected = null;
  return m;
}
