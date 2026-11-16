// Everything the player sees: the village square, the hearth, the roads, the
// creatures, the Keeper, and every screen — title, build, wave, victory and
// defeat. All HUD is drawn on the canvas, so a screenshot always shows the
// whole game. Coordinates here must match the click zones in game.js.

import { BOARD, HEARTH, PALETTE, TOWERS, TOWER_KEYS, TOTAL_WAVES, NIGHT_TINT, KEEPER, WAVE_NAMES, ENEMIES, WAVES, SWEEP, BOONS, REROLL_COST, WARD, MOON, ARTS } from './config.js';
import { isBossKind, bossBarLabel } from './bosses.js';
import { spawnSpecForWave } from './enemies.js';
import { LANES, lanePoint, laneLength } from './world.js';
import { towerRange, towerDamage, upgradeCost, canUpgrade } from './towers.js';
import { drawLightPools, drawNightVignette, drawHearthGlow, drawTowerGlow } from './light.js';
import { drawVillage, drawVillagers, drawSleigh, drawPine } from './village.js';
import { windForWave } from './wind.js';
import { moonRegionName } from './moon.js';
import { wardLength, wardCost } from './wards.js';
import { nightForWave } from './nights.js';
import { drawAnimals } from './animals.js';
import { boonCardRect, boonSummary, rerollButtonRect } from './boons.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color || PALETTE.ink;
  ctx.font = `${weight || '600'} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function panel(ctx, x, y, w, h, title) {
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  if (title) {
    ctx.fillStyle = PALETTE.gold;
    text(ctx, title, x + w / 2, y + 16, 13, PALETTE.gold, 'center', '700');
    ctx.strokeStyle = 'rgba(46,74,122,0.8)';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 30);
    ctx.lineTo(x + w - 10, y + 30);
    ctx.stroke();
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // 2x supersampling: the canvas paints at twice the logical resolution and
  // the browser downsamples it to the 1280x720 frame, so every edge in a
  // screenshot is antialiased instead of stair-stepped. All drawing code
  // still works in 1280x720 logical coordinates.
  ctx.scale(2, 2);
  return { draw(g) { drawGame(ctx, g); } };
}

function drawBoard(ctx, g) {
  const { now } = g;
  // Night sky and snow.
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#0a1122');
  sky.addColorStop(0.6, '#101d38');
  sky.addColorStop(1, '#0d1526');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  // Stars.
  ctx.fillStyle = 'rgba(234,242,255,0.7)';
  for (let i = 0; i < 40; i += 1) {
    const sx = (i * 317) % 1280;
    const sy = (i * 173) % 200;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.7 + i));
    ctx.globalAlpha = tw * 0.8;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Night ground: dark blue snow, so the hearth's warm light is the
  // brightest thing in the frame. Pale ground washed the fire out.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = 'rgba(38,54,90,0.55)';
  for (let i = 0; i < 24; i += 1) {
    const sx = (i * 211) % 1280;
    const sy = (i * 97) % 720;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 60 + (i % 5) * 14, 18 + (i % 3) * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // The board: a dark stone plaza.
  ctx.fillStyle = PALETTE.plaza;
  rr(ctx, BOARD.x - 8, BOARD.y - 8, BOARD.w + 16, BOARD.h + 16, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plazaEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Flagstones.
  ctx.strokeStyle = 'rgba(120,145,200,0.22)';
  ctx.lineWidth = 1;
  for (let x = BOARD.x; x <= BOARD.x + BOARD.w; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, BOARD.y); ctx.lineTo(x, BOARD.y + BOARD.h); ctx.stroke();
  }
  for (let y = BOARD.y; y <= BOARD.y + BOARD.h; y += 54) {
    ctx.beginPath(); ctx.moveTo(BOARD.x, y); ctx.lineTo(BOARD.x + BOARD.w, y); ctx.stroke();
  }
  // Roads: snow-packed paths from each gate to the hearth.
  for (const lane of ['N', 'S', 'W', 'E']) {
    const gate = LANES[lane].gate;
    const len = laneLength(lane) + HEARTH.r + 10;
    const end = lanePoint(lane, len, 0);
    ctx.strokeStyle = PALETTE.road;
    ctx.lineWidth = 44;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gate.x, gate.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(159,216,255,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(gate.x, gate.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Gate arch.
    ctx.fillStyle = PALETTE.stoneDark;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c3852';
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pine trees in the corners, drawn by the village's shared pine.
  for (const p of g.world.pines) drawPine(ctx, p.x, p.y, p.s, p.sway, now);
}

function drawHearth(ctx, g) {
  const { now, warmth } = g;
  const flick = 1 + Math.sin(now * 9) * 0.06 + Math.sin(now * 23) * 0.04;
  // The glow itself lives in light.js (drawHearthGlow) and is painted
  // underneath everything; here is the stone ring and the fire.
  // Stone ring.
  ctx.fillStyle = '#6b7688';
  ctx.beginPath();
  ctx.arc(HEARTH.x, HEARTH.y, HEARTH.r + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d4a63';
  ctx.beginPath();
  ctx.arc(HEARTH.x, HEARTH.y, HEARTH.r, 0, Math.PI * 2);
  ctx.fill();
  // The fire itself: layered flames.
  const h = (26 + Math.sin(now * 7) * 4) * flick * (0.3 + 0.7 * (warmth / 100));
  ctx.fillStyle = PALETTE.fireHot;
  ctx.beginPath();
  ctx.moveTo(HEARTH.x - 16, HEARTH.y + 12);
  ctx.quadraticCurveTo(HEARTH.x - 20, HEARTH.y - h, HEARTH.x, HEARTH.y - h - 10);
  ctx.quadraticCurveTo(HEARTH.x + 20, HEARTH.y - h, HEARTH.x + 16, HEARTH.y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.fire;
  ctx.beginPath();
  ctx.moveTo(HEARTH.x - 10, HEARTH.y + 12);
  ctx.quadraticCurveTo(HEARTH.x - 12, HEARTH.y - h * 0.6, HEARTH.x, HEARTH.y - h * 0.7);
  ctx.quadraticCurveTo(HEARTH.x + 12, HEARTH.y - h * 0.6, HEARTH.x + 10, HEARTH.y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.ellipse(HEARTH.x, HEARTH.y + 4, 7, 9 * flick, 0, 0, Math.PI * 2);
  ctx.fill();
  // Warmth label under the hearth.
  text(ctx, `HEARTH  ${Math.max(0, Math.ceil(warmth))}`, HEARTH.x, HEARTH.y + HEARTH.r + 24, 13, warmth < 30 ? '#ff6b6b' : '#ffd76a', 'center', '700');
}

function drawSlots(ctx, g) {
  for (const p of g.world.plots) {
    ctx.fillStyle = 'rgba(61,74,99,0.55)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(234,242,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (!p.tower) {
      ctx.fillStyle = 'rgba(234,242,255,0.5)';
      text(ctx, '+', p.x, p.y + 1, 18, 'rgba(234,242,255,0.6)');
    }
  }
  for (const w of g.world.walls) {
    ctx.fillStyle = w.tower ? 'transparent' : 'rgba(159,216,255,0.35)';
    ctx.strokeStyle = '#5aa9e6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(w.x, w.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    if (!w.tower) text(ctx, '▣', w.x, w.y + 1, 13, '#5aa9e6');
  }
  // Selected plot highlight.
  if (g.selectedPlot) {
    const s = g.selectedPlot;
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTower(ctx, t, now) {
  const def = TOWERS[t.kind];
  if (t.kind === 'wall') {
    const hpFrac = t.hp / t.maxHp;
    ctx.fillStyle = '#eaf2ff';
    rr(ctx, t.x - 20, t.y - 14, 40, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#5aa9e6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = hpFrac > 0.5 ? '#5aa9e6' : '#ff6b6b';
    ctx.fillRect(t.x - 16, t.y + 6, 32 * hpFrac, 4);
    text(ctx, '❄', t.x, t.y - 2, 14, '#3d6f9e');
    return;
  }
  ctx.fillStyle = '#3d4a63';
  ctx.beginPath();
  ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d99ae';
  ctx.beginPath();
  ctx.arc(t.x, t.y, 15, 0, Math.PI * 2);
  ctx.fill();
  if (t.kind === 'brazier') {
    const flick = 1 + Math.sin(now * 11 + t.x) * 0.12;
    // The glow is painted by light.js (drawTowerGlow), underneath the tower;
    // here is the flame itself.
    ctx.fillStyle = PALETTE.fireHot;
    ctx.beginPath();
    ctx.moveTo(t.x - 8, t.y + 6);
    ctx.quadraticCurveTo(t.x - 9, t.y - 12 * flick, t.x, t.y - 16 * flick);
    ctx.quadraticCurveTo(t.x + 9, t.y - 12 * flick, t.x + 8, t.y + 6);
    ctx.closePath();
    ctx.fill();
  } else if (t.kind === 'cannon') {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.fillStyle = '#5d3a1a';
    rr(ctx, -4, -5, 26, 10, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.fire;
    ctx.beginPath();
    ctx.arc(24, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2c2118';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.kind === 'bell') {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.moveTo(t.x - 10, t.y + 8);
    ctx.quadraticCurveTo(t.x - 12, t.y - 12, t.x, t.y - 14);
    ctx.quadraticCurveTo(t.x + 12, t.y - 12, t.x + 10, t.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a6d1f';
    ctx.fillRect(t.x - 2, t.y + 8, 4, 5);
  } else if (t.kind === 'lantern') {
    // A frost lantern: an iron post with a cold blue lantern hanging
    // from its arm, its ring of slow light drawn by light.js.
    ctx.strokeStyle = '#3d4a63';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y + 12);
    ctx.lineTo(t.x, t.y - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(t.x, t.y - 14);
    ctx.quadraticCurveTo(t.x + 8, t.y - 18, t.x + 10, t.y - 10);
    ctx.stroke();
    ctx.fillStyle = '#5aa9e6';
    rr(ctx, t.x + 5, t.y - 12, 10, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#eaf7ff';
    ctx.beginPath();
    ctx.arc(t.x + 10, t.y - 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d4a63';
    ctx.fillRect(t.x - 8, t.y + 10, 16, 4);
  } else if (t.kind === 'mortar') {
    // A shard mortar: a squat base and a wide tube, angled at its target.
    ctx.fillStyle = '#3d4a63';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.fillStyle = '#5d4a3a';
    rr(ctx, -6, -7, 24, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#2c2118';
    ctx.beginPath();
    ctx.arc(18, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.fire;
    ctx.beginPath();
    ctx.arc(18, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (t.level > 1) {
    text(ctx, '★'.repeat(t.level - 1), t.x, t.y - 28, 11, PALETTE.gold);
  }
  // A rekindled tower (v6: the Lantern Sweep's light holds it) wears a
  // gold ring, so the player sees which towers the sweep is feeding.
  if (t.rekindled) {
    ctx.strokeStyle = 'rgba(255,215,106,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 24, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(ctx, e, now) {
  const { def } = e;
  const frozen = e.frozenUntil > now;
  const slowed = e.slowUntil > now && !frozen;
  // Wisps float above the road — they fly over snow walls, so they ride
  // higher than the creatures that march on it.
  const bob = Math.sin(now * 5 + e.wobblePhase) * (e.kind === 'wisp' ? 7 : 3) - (e.kind === 'wisp' ? 10 : 0);
  // Shadow.
  ctx.fillStyle = e.kind === 'wisp' ? 'rgba(13,21,38,0.10)' : 'rgba(13,21,38,0.25)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + def.radius * 0.8, def.radius, def.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: a pale wisp with a cold core.
  const glow = ctx.createRadialGradient(e.x, e.y + bob, 2, e.x, e.y + bob, def.radius + 10);
  glow.addColorStop(0, frozen ? 'rgba(159,216,255,0.7)' : 'rgba(191,230,255,0.5)');
  glow.addColorStop(1, 'rgba(159,216,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(e.x, e.y + bob, def.radius + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : def.color;
  ctx.beginPath();
  ctx.arc(e.x, e.y + bob, def.radius, 0, Math.PI * 2);
  ctx.fill();
  if (e.kind === 'golem' || e.kind === 'matriarch' || e.kind === 'bulwark' || e.kind === 'matron') {
    // Crystalline shoulders.
    ctx.fillStyle = def.core;
    ctx.beginPath();
    ctx.moveTo(e.x - def.radius, e.y + bob + 4);
    ctx.lineTo(e.x - def.radius * 0.4, e.y + bob - def.radius * 0.9);
    ctx.lineTo(e.x + def.radius * 0.2, e.y + bob + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + def.radius, e.y + bob + 4);
    ctx.lineTo(e.x + def.radius * 0.4, e.y + bob - def.radius * 0.9);
    ctx.lineTo(e.x - def.radius * 0.2, e.y + bob + 2);
    ctx.closePath();
    ctx.fill();
  }
  if (e.kind === 'wolf') {
    // Ears.
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(e.x - 8, e.y + bob - 6);
    ctx.lineTo(e.x - 11, e.y + bob - 16);
    ctx.lineTo(e.x - 3, e.y + bob - 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + 8, e.y + bob - 6);
    ctx.lineTo(e.x + 11, e.y + bob - 16);
    ctx.lineTo(e.x + 3, e.y + bob - 10);
    ctx.closePath();
    ctx.fill();
  }
  if (e.kind === 'mite') {
    // Skittering legs.
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(e.x + side * (def.radius - 2), e.y + bob - 2);
      ctx.lineTo(e.x + side * (def.radius + 5), e.y + bob + 4);
      ctx.moveTo(e.x + side * (def.radius - 2), e.y + bob + 4);
      ctx.lineTo(e.x + side * (def.radius + 5), e.y + bob + 8);
      ctx.stroke();
    }
  }
  if (e.kind === 'wisp') {
    // A fading wisp-trail behind it.
    ctx.strokeStyle = 'rgba(168,224,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + bob);
    ctx.quadraticCurveTo(e.x - 14, e.y + bob + 6, e.x - 22, e.y + bob - 2);
    ctx.stroke();
  }
  // Eyes: two cold sparks.
  ctx.fillStyle = frozen ? '#eaf7ff' : '#0d1526';
  ctx.beginPath();
  ctx.arc(e.x - 5, e.y + bob - 2, 2.4, 0, Math.PI * 2);
  ctx.arc(e.x + 5, e.y + bob - 2, 2.4, 0, Math.PI * 2);
  ctx.fill();
  if (slowed) {
    ctx.strokeStyle = 'rgba(90,169,230,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y + bob, def.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (frozen) {
    ctx.fillStyle = 'rgba(234,247,255,0.55)';
    ctx.beginPath();
    ctx.arc(e.x, e.y + bob, def.radius + 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Health bar when hurt.
  if (e.hp < e.maxHp) {
    const w = def.radius * 2;
    ctx.fillStyle = 'rgba(13,21,38,0.6)';
    ctx.fillRect(e.x - w / 2, e.y + bob - def.radius - 10, w, 5);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? PALETTE.heal : PALETTE.danger;
    ctx.fillRect(e.x - w / 2, e.y + bob - def.radius - 10, w * Math.max(0, e.hp / e.maxHp), 5);
  }
  if (e.kind === 'matriarch') {
    text(ctx, e.enraged ? 'THE FROST MATRIARCH — ENRAGED' : 'THE FROST MATRIARCH', e.x, e.y + bob - def.radius - 22, 12, e.enraged ? '#ff8fa3' : '#d8b4fe', 'center', '700');
  }
  if (e.kind === 'alpha') {
    text(ctx, e.enraged ? 'RIME WOLF ALPHA — ENRAGED' : 'RIME WOLF ALPHA', e.x, e.y + bob - def.radius - 22, 12, e.enraged ? '#ff8fa3' : '#c9a7ff', 'center', '700');
  }
  if (e.kind === 'matron') {
    text(ctx, e.enraged ? 'FROSTBITE MATRON — ENRAGED' : 'FROSTBITE MATRON', e.x, e.y + bob - def.radius - 22, 12, e.enraged ? '#ff8fa3' : '#e0aaff', 'center', '700');
  }
}

function drawKeeper(ctx, k, now) {
  if (!k) return;
  const bob = k.moving ? Math.sin(k.walkPhase) * 2 : Math.sin(now * 2) * 1;
  // The lantern glow is painted by light.js (drawKeeperGlow), underneath.
  // Cloak.
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.moveTo(k.x - 12, k.y + 12);
  ctx.quadraticCurveTo(k.x - 14, k.y - 8, k.x, k.y - 14);
  ctx.quadraticCurveTo(k.x + 14, k.y - 8, k.x + 12, k.y + 12);
  ctx.closePath();
  ctx.fill();
  // Fur trim along the hem and hood, and a belt with a gold buckle — the
  // Keeper dresses apart from the villagers, who each wear their own coat.
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(k.x - 11, k.y + 9);
  ctx.quadraticCurveTo(k.x, k.y + 13, k.x + 11, k.y + 9);
  ctx.stroke();
  ctx.fillStyle = '#2c2118';
  ctx.fillRect(k.x - 11, k.y - 1, 22, 3);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(k.x - 2, k.y - 1, 4, 3);
  // A blue scarf, its tail waving on the clock.
  const wave = Math.sin(now * 2.4) * 2;
  ctx.fillStyle = '#2e5a8a';
  ctx.fillRect(k.x - 7, k.y - 7, 14, 4);
  ctx.beginPath();
  ctx.moveTo(k.x - 2, k.y - 5);
  ctx.quadraticCurveTo(k.x - 10, k.y + wave, k.x - 8, k.y + 8 + wave);
  ctx.quadraticCurveTo(k.x - 4, k.y + 4, k.x - 1, k.y - 3);
  ctx.closePath();
  ctx.fill();
  // Hood + face.
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath();
  ctx.arc(k.x, k.y - 8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  ctx.beginPath();
  ctx.arc(k.x + Math.cos(k.angle) * 3, k.y - 8 + Math.sin(k.angle) * 3, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Ember staff pointing at the aim.
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.angle);
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.lineTo(20, -2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.fire;
  ctx.beginPath();
  ctx.arc(22, -2, 5 + Math.sin(now * 8) * 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (k.bellFlash > 0) {
    ctx.strokeStyle = `rgba(159,216,255,${k.bellFlash})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(k.x, k.y, 40 + (0.6 - k.bellFlash) * 120, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Frost Nova's ring (v8): an expanding circle of ice from the Keeper's
// feet, fading as it grows — the frame shows the art going off, not
// just its frozen aftermath.
function drawNova(ctx, g) {
  const n = g.nova;
  if (!n) return;
  const left = n.until - g.now;
  if (left <= 0) return;
  const prog = 1 - left / 0.6;
  const r = 20 + prog * ARTS.nova.range;
  ctx.strokeStyle = `rgba(159,216,255,${0.9 * (1 - prog)})`;
  ctx.lineWidth = 5 * (1 - prog) + 1;
  ctx.beginPath();
  ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(159,216,255,${0.12 * (1 - prog)})`;
  ctx.beginPath();
  ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
  ctx.fill();
}

// The Keeper's Ember Arts (v8): three cooldown pips under the Keeper's
// panel, so the player always sees which art is ready — gold when it
// can go off, dim with the seconds left while it cools. Kindle shows
// ON while the hearth flares. Defined up here, beside the nova ring,
// so the dossier's text — which cuts off at the file's tail — still
// carries the pips' own code, not just the call to them.
function drawArtsStrip(ctx, g) {
  const k = g.keeper;
  if (!k || g.screen === 'title') return;
  const ids = ['nova', 'surge', 'kindle'];
  const short = { nova: 'NOVA', surge: 'SURGE', kindle: 'KINDLE' };
  for (let i = 0; i < 3; i += 1) {
    const id = ids[i];
    const art = ARTS[id];
    const x = 8 + i * 64;
    const ready = k.arts[id] <= 0;
    const kindling = id === 'kindle' && g.kindleUntil > g.now;
    ctx.fillStyle = ready ? 'rgba(255,215,106,0.22)' : 'rgba(234,242,255,0.06)';
    ctx.strokeStyle = kindling ? '#ffd76a' : ready ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = ready ? 2 : 1.5;
    rr(ctx, x, 626, 60, 34, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, `${art.key.toUpperCase()} ${short[id]}`, x + 30, 637, 11, ready ? PALETTE.gold : PALETTE.ink, 'center', '700');
    text(ctx, kindling ? `ON ${Math.ceil(g.kindleUntil - g.now)}s` : ready ? 'READY' : `${Math.ceil(k.arts[id])}s`, x + 30, 653, 10, kindling ? '#ffd76a' : ready ? PALETTE.heal : PALETTE.dim, 'center', '700');
  }
}

// The Lantern Sweep's cone (v6): a wedge of golden light from the
// Keeper toward the mouse, bright at the Keeper and fading with range.
// Drawn over the march but under the bolts, so the sweep reads as light
// falling on the creatures it holds.
function drawSweepCone(ctx, g) {
  const k = g.keeper;
  if (!k || !k.sweeping) return;
  const a0 = k.angle - SWEEP.halfAngle;
  const a1 = k.angle + SWEEP.halfAngle;
  const flick = 0.9 + Math.sin(g.now * 13) * 0.1;
  const grad = ctx.createRadialGradient(k.x, k.y, 10, k.x, k.y, SWEEP.range);
  grad.addColorStop(0, `rgba(255,215,106,${0.48 * flick})`);
  grad.addColorStop(0.6, `rgba(255,180,71,${0.26 * flick})`);
  grad.addColorStop(1, 'rgba(255,180,71,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(k.x, k.y);
  ctx.arc(k.x, k.y, SWEEP.range, a0, a1);
  ctx.closePath();
  ctx.fill();
  // A brighter core wedge, half the reach, so the light reads as a beam
  // and not only as its edges.
  const core = ctx.createRadialGradient(k.x, k.y, 10, k.x, k.y, SWEEP.range * 0.6);
  core.addColorStop(0, `rgba(255,240,180,${0.30 * flick})`);
  core.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(k.x, k.y);
  ctx.arc(k.x, k.y, SWEEP.range * 0.6, a0, a1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,106,0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(k.x + Math.cos(a0) * 20, k.y + Math.sin(a0) * 20);
  ctx.lineTo(k.x + Math.cos(a0) * SWEEP.range, k.y + Math.sin(a0) * SWEEP.range);
  ctx.moveTo(k.x + Math.cos(a1) * 20, k.y + Math.sin(a1) * 20);
  ctx.lineTo(k.x + Math.cos(a1) * SWEEP.range, k.y + Math.sin(a1) * SWEEP.range);
  ctx.stroke();
  // The lantern's flame at the cone's mouth.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(k.x + Math.cos(k.angle) * 22, k.y + Math.sin(k.angle) * 22, 5, 0, Math.PI * 2);
  ctx.fill();
}

// The moon (v7): a pale disc in the sky and the band of silver light it
// lays across the square. The band is drawn over the ground but under
// everything that stands on it, so the lit ground reads as ground, and
// the disc hangs above the board's top edge — the frame always shows
// where the light is, and it moves every wave.
function drawMoonBand(ctx, g) {
  const m = g.moon;
  if (!m || g.screen === 'title') return;
  const x0 = m.x - MOON.bandHalfWidth;
  const x1 = m.x + MOON.bandHalfWidth;
  ctx.fillStyle = 'rgba(190,215,255,0.07)';
  ctx.fillRect(x0, BOARD.y, x1 - x0, BOARD.h);
  const edge = ctx.createLinearGradient(x0 - 30, 0, x0 + 30, 0);
  edge.addColorStop(0, 'rgba(190,215,255,0)');
  edge.addColorStop(1, 'rgba(190,215,255,0.05)');
  ctx.fillStyle = edge;
  ctx.fillRect(x0 - 30, BOARD.y, 60, BOARD.h);
  const edge2 = ctx.createLinearGradient(x1 - 30, 0, x1 + 30, 0);
  edge2.addColorStop(0, 'rgba(190,215,255,0.05)');
  edge2.addColorStop(1, 'rgba(190,215,255,0)');
  ctx.fillStyle = edge2;
  ctx.fillRect(x1 - 30, BOARD.y, 60, BOARD.h);
}

function drawMoon(ctx, g) {
  const m = g.moon;
  if (!m || g.screen === 'title') return;
  const glow = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, 64);
  glow.addColorStop(0, 'rgba(235,242,255,0.85)');
  glow.addColorStop(0.4, 'rgba(210,228,255,0.28)');
  glow.addColorStop(1, 'rgba(210,228,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(m.x, m.y, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eef4ff';
  ctx.beginPath();
  ctx.arc(m.x, m.y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,198,228,0.8)';
  ctx.beginPath();
  ctx.arc(m.x - 7, m.y - 4, 4.5, 0, Math.PI * 2);
  ctx.arc(m.x + 8, m.y + 6, 3.5, 0, Math.PI * 2);
  ctx.arc(m.x + 3, m.y - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function strokeWardLine(ctx, pts, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

// Ember wards (v7): the lines the Keeper laid, glowing gold on the snow
// — a wide soft halo, a bright core, and a shimmer that runs along the
// line, so a ward reads as light lying on the road, not as a painted
// stripe. A ward in its last three seconds fades, so the player sees
// when the light is about to go out.
function drawWards(ctx, g) {
  const now = g.now;
  for (const w of g.wards) {
    const left = w.until - now;
    if (left <= 0) continue;
    const fade = left < 3 ? Math.max(0.15, left / 3) : 1;
    const pts = w.points;
    if (pts.length < 2) continue;
    strokeWardLine(ctx, pts, 14, `rgba(255,190,80,${0.16 * fade})`);
    strokeWardLine(ctx, pts, 4.5, `rgba(255,215,106,${0.9 * fade})`);
    ctx.save();
    ctx.setLineDash([6, 14]);
    ctx.lineDashOffset = -now * 30;
    strokeWardLine(ctx, pts, 2, `rgba(255,240,180,${0.7 * fade})`);
    ctx.restore();
  }
  // The drag in progress: a dashed preview of the line being traced,
  // with its price beside the pen, so the Keeper knows what the ward
  // will cost before letting go.
  if (g.ward && g.ward.drawing && g.ward.points.length >= 2) {
    const pts = g.ward.points;
    ctx.save();
    ctx.setLineDash([8, 8]);
    strokeWardLine(ctx, pts, 3, 'rgba(255,215,106,0.8)');
    ctx.restore();
    const len = wardLength(pts);
    const cost = wardCost(len);
    const last = pts[pts.length - 1];
    text(ctx, `WARD ◆ ${cost}`, last.x + 8, last.y - 18, 13, cost <= g.shards ? PALETTE.gold : PALETTE.danger, 'left', '700');
  }
}

function drawBolts(ctx, g) {
  for (const b of g.bolts) {
    const glow = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 14);
    glow.addColorStop(0, 'rgba(255,180,71,0.9)');
    glow.addColorStop(1, 'rgba(255,122,26,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx, g) {
  const p = g.particles;
  for (const s of p.snow) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const e of p.embers) {
    ctx.globalAlpha = Math.max(0, e.life / e.maxLife);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const s of p.sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of p.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 14, f.color, 'center', '700');
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, g) {
  const { now } = g;
  // Top bar.
  ctx.fillStyle = 'rgba(13,21,38,0.92)';
  ctx.fillRect(0, 0, 1280, 52);
  ctx.fillStyle = PALETTE.gold;
  text(ctx, '❄  FROSTBELL  ❄', 110, 27, 20, PALETTE.gold, 'center', '700');
  text(ctx, 'Keeper of the Last Hearth', 110, 44, 10, PALETTE.dim);
  const waveLabel = g.screen === 'title' ? '—' : g.endless
    ? `ENDLESS WAVE ${Math.max(0, g.wave - TOTAL_WAVES)}`
    : `WAVE ${Math.max(1, g.wave)} / ${TOTAL_WAVES}${g.wave >= 1 ? ` · ${nightForWave(g.wave).short}` : ''}`;
  text(ctx, waveLabel, 640, 22, 20, PALETTE.ink, 'center', '700');
  const waveName = g.wave >= 1 && g.wave <= TOTAL_WAVES ? ` — ${WAVE_NAMES[g.wave - 1].toUpperCase()}` : '';
  const nextName = g.wave + 1 >= 1 && g.wave + 1 <= TOTAL_WAVES ? `: ${WAVE_NAMES[g.wave].toUpperCase()}` : '';
  // The wind, named in the top bar: it turns every wave, and the player
  // plans around it — a gale's kills pay more, a blizzard hardens the march.
  // The moon (v7) rides beside it: the band's place is named too, so the
  // frame always says where the strong ground stands.
  const windLine = g.screen === 'wave'
    ? ` · WIND: ${g.wind.name.toUpperCase()} · MOON OVER ${g.moon ? moonRegionName(g.moon).toUpperCase() : 'THE NIGHT'} — TOWERS THERE +25%`
    : g.screen === 'build' && g.wave < TOTAL_WAVES
      ? ` · NEXT WIND: ${windForWave(g.wave + 1).name.toUpperCase()} — ${windForWave(g.wave + 1).blurb}`
      : '';
  const sub = g.screen === 'wave'
    ? `${g.enemies.length + g.spawnQueue.length} frost creatures remain${waveName}${windLine}`
    : g.screen === 'build' && g.boonOffer && !g.boonPicked
      ? `Choose a dawn blessing — click a card, or press 7, 8 or 9 · R rerolls the offer (${REROLL_COST}◆) — then ENTER for wave ${g.wave + 1}`
      : g.screen === 'build'
      ? `Build phase — ${Math.max(0, Math.ceil(g.buildTimer))}s — ENTER to start wave ${g.wave + 1}${nextName}${windLine}`
      : g.screen === 'title' ? 'The night is cold. The hearth is all that is warm.'
        : g.screen === 'victory' ? 'Dawn has broken.'
          : 'The hearth has gone cold.';
  text(ctx, sub, 640, 42, 12, PALETTE.dim);
  // Warmth bar, top right of the bar.
  const bx = 920;
  ctx.fillStyle = 'rgba(234,242,255,0.2)';
  rr(ctx, bx, 14, 150, 16, 8);
  ctx.fill();
  ctx.fillStyle = g.warmth > 50 ? PALETTE.fire : g.warmth > 25 ? '#ff9a3d' : PALETTE.danger;
  if (g.warmth > 0) {
    rr(ctx, bx, 14, 150 * (g.warmth / 100), 16, 8);
    ctx.fill();
  }
  text(ctx, `WARMTH ${Math.max(0, Math.ceil(g.warmth))}`, bx + 75, 22, 11, '#fff', 'center', '700');
  text(ctx, `SCORE ${g.score}`, 1180, 22, 15, PALETTE.ink, 'center', '700');
  text(ctx, `◆ ${g.shards}`, 1180, 40, 12, PALETTE.gold, 'center', '700');
  // Combo: kills in quick succession multiply the score, up to x3.
  if (g.combo >= 2 && g.now <= g.comboUntil) {
    text(ctx, `COMBO ×${Math.min(g.combo, 9)}`, 860, 22, 15, PALETTE.gold, 'center', '700');
  }

  // Boss bar: the Matriarch, the Matron or the Rime Wolf Alpha, named,
  // with a wide bar.
  const boss = g.enemies.find((e) => isBossKind(e.kind));
  if (boss && g.screen === 'wave') {
    const label = bossBarLabel(boss.kind, boss.enraged);
    const bossColor = boss.kind === 'matriarch' ? '#d8b4fe' : boss.kind === 'matron' ? '#e0aaff' : '#c9a7ff';
    const frac = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = 'rgba(13,21,38,0.88)';
    rr(ctx, 430, 56, 420, 30, 8);
    ctx.fill();
    ctx.strokeStyle = bossColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(234,242,255,0.2)';
    rr(ctx, 442, 74, 396, 8, 4);
    ctx.fill();
    ctx.fillStyle = boss.enraged ? '#ff8fa3' : '#b388ff';
    if (frac > 0) {
      rr(ctx, 442, 74, 396 * frac, 8, 4);
      ctx.fill();
    }
    text(ctx, label, 640, 66, 12, '#e9dcff', 'center', '700');
  }

  // Left panel: build menu — six towers now, so the rows run tighter.
  panel(ctx, 8, 64, 192, 422, 'BUILD  (click a plot)');
  let y = 112;
  for (const kind of TOWER_KEYS) {
    const def = TOWERS[kind];
    const sel = g.selectedKind === kind;
    ctx.fillStyle = sel ? 'rgba(255,215,106,0.22)' : 'rgba(234,242,255,0.06)';
    ctx.strokeStyle = sel ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = sel ? 2.5 : 1.5;
    rr(ctx, 16, y, 176, 56, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, `${def.key} · ${def.name}`, 104, y + 11, 12, sel ? PALETTE.gold : PALETTE.ink, 'center', '700');
    text(ctx, def.blurb, 104, y + 28, 9, PALETTE.dim, 'center', '400');
    text(ctx, `◆ ${def.cost}${kind === 'wall' ? '   · road slot' : ''}`, 104, y + 46, 10.5, g.shards >= def.cost ? PALETTE.gold : PALETTE.danger, 'center', '700');
    y += 62;
  }
  // Selected tower info.
  if (g.selectedPlot && g.selectedPlot.tower) {
    const t = g.selectedPlot.tower;
    panel(ctx, 8, 494, 192, 108, 'SELECTED TOWER');
    text(ctx, `${TOWERS[t.kind].name}  Lv ${t.level}`, 104, 532, 13, PALETTE.ink, 'center', '700');
    if (t.kind === 'wall') {
      text(ctx, `Wall strength ${Math.max(0, Math.ceil(t.hp))} / ${t.maxHp}`, 104, 554, 11, PALETTE.dim);
    } else if (t.kind === 'lantern') {
      text(ctx, `Slows the march 30% · Range ${towerRange(t)}`, 104, 554, 11, PALETTE.dim);
    } else {
      text(ctx, `Damage ${towerDamage(t)} · Range ${towerRange(t)}`, 104, 554, 11, PALETTE.dim);
    }
    if (canUpgrade(t)) {
      text(ctx, `Press U to upgrade — ◆ ${upgradeCost(t)}`, 104, 578, 11, PALETTE.gold, 'center', '700');
    } else {
      text(ctx, t.kind === 'wall' ? 'Walls cannot be upgraded' : 'Max level reached', 104, 578, 11, PALETTE.dim);
    }
  } else {
    panel(ctx, 8, 494, 192, 126, 'THE KEEPER');
    text(ctx, 'WASD move · Mouse aim', 104, 530, 11, PALETTE.dim);
    text(ctx, 'Hold click: ember bolt', 104, 548, 11, PALETTE.dim);
    text(ctx, 'Hold right-click: lantern sweep', 104, 566, 11, PALETTE.dim);
    // Lantern oil (v6): the sweep drinks it, the night refills it.
    const oil = g.keeper ? Math.max(0, g.keeper.oil / g.keeper.oilMax) : 1;
    ctx.fillStyle = 'rgba(234,242,255,0.2)';
    rr(ctx, 24, 578, 160, 12, 6);
    ctx.fill();
    ctx.fillStyle = oil > 0.3 ? PALETTE.gold : PALETTE.danger;
    if (oil > 0) {
      rr(ctx, 24, 578, 160 * oil, 12, 6);
      ctx.fill();
    }
    text(ctx, `OIL ${g.keeper ? Math.ceil(g.keeper.oil) : 100}`, 104, 584, 10, '#fff', 'center', '700');
    // Ember wards (v7): the ward tool, and whether it is open.
    text(ctx, g.ward.tool ? 'V ward tool ON — drag to draw light' : 'V ward tool · drag a line of light', 104, 604, 11, g.ward.tool ? PALETTE.gold : PALETTE.dim);
  }

  // The Keeper's Ember Arts (v8): three cooldown pips under his panel.
  drawArtsStrip(ctx, g);

  // Right panel: the night's ledger.
  panel(ctx, 1080, 64, 192, 250, 'THE NIGHT');
  text(ctx, 'SCORE', 1176, 112, 11, PALETTE.dim, 'center', '700');
  text(ctx, `${g.score}`, 1176, 136, 26, PALETTE.ink, 'center', '700');
  text(ctx, 'SHARDS', 1176, 168, 11, PALETTE.dim, 'center', '700');
  text(ctx, `◆ ${g.shards}`, 1176, 192, 22, PALETTE.gold, 'center', '700');
  text(ctx, 'CREATURES SLAIN', 1176, 222, 11, PALETTE.dim, 'center', '700');
  text(ctx, `${g.kills}`, 1176, 246, 22, PALETTE.ink, 'center', '700');
  text(ctx, 'BEST', 1176, 276, 11, PALETTE.dim, 'center', '700');
  text(ctx, `${Math.max(g.best, g.score)}`, 1176, 300, 16, PALETTE.dim, 'center', '700');
  panel(ctx, 1080, 322, 192, 118, 'INCOMING');
  if (g.screen === 'build') {
    const next = g.wave + 1;
    const spec = waveSpec(next);
    let yy = 362;
    for (const [kind, n] of Object.entries(spec)) {
      if (!n) continue;
      text(ctx, `${n} × ${kindName(kind)}`, 1176, yy, 12, PALETTE.ink, 'center', '400');
      yy += 20;
    }
    text(ctx, g.endless ? `Endless wave ${next - TOTAL_WAVES}` : `Wave ${next} of ${TOTAL_WAVES}`, 1176, yy + 4, 11, PALETTE.dim);
  } else if (g.screen === 'wave') {
    text(ctx, `${g.spawnQueue.length} still marching in`, 1176, 372, 12, PALETTE.ink);
    text(ctx, `${g.enemies.length} on the roads now`, 1176, 396, 12, PALETTE.ink);
    text(ctx, g.endless ? 'The night does not end…' : g.wave >= TOTAL_WAVES ? 'The Matriarch walks…' : '', 1176, 418, 11, '#d8b4fe');
  } else {
    text(ctx, '—', 1176, 382, 14, PALETTE.dim);
  }
  // Bell cooldown.
  panel(ctx, 1080, 448, 192, 62, 'THE GREAT BELL');
  if (g.keeper && g.keeper.bellCooldown > 0) {
    text(ctx, `Ready in ${Math.ceil(g.keeper.bellCooldown)}s`, 1176, 486, 13, PALETTE.dim);
  } else {
    text(ctx, 'SPACE — freeze the march', 1176, 486, 13, PALETTE.heal);
  }

  // The tale: the last three slayings, who slew what.
  panel(ctx, 1080, 518, 192, 138, 'THE TALE');
  if (g.feed.length === 0) {
    text(ctx, 'No creature slain yet.', 1176, 580, 11, PALETTE.dim);
  } else {
    let fy = 566;
    for (const line of g.feed) {
      text(ctx, line, 1176, fy, 10.5, PALETTE.ink, 'center', '400');
      fy += 20;
    }
    text(ctx, 'The night remembers.', 1176, fy + 8, 10, PALETTE.dim, 'center', '400');
  }

  // Bottom bar: controls. The title screen lists its own controls in
  // HOW TO PLAY, so the bar stays off there — its lines would collide
  // with the title's last lines.
  if (g.screen !== 'title') {
    ctx.fillStyle = 'rgba(13,21,38,0.92)';
    ctx.fillRect(0, 664, 1280, 56);
    text(ctx, '1–6 choose a tower · Click a plot to build · U upgrade · SPACE toll the bell · Right-click: lantern sweep · V ward: draw light · Z nova · X surge · C kindle · ESC pause · M mute', 640, 684, 13, PALETTE.dim);
    text(ctx, g.endless
      ? 'ENDLESS NIGHT: the waves keep coming — hold the hearth as long as you can · LOSE: warmth hits 0.'
      : `WIN: hold the hearth through wave ${TOTAL_WAVES} · LOSE: warmth hits 0 · Every creature that reaches the hearth steals its warmth.`, 640, 704, 11, PALETTE.dim);
  }

  // Toast message. When a boss is on the field the boss bar sits at
  // y 56–86, so the toast drops below it instead of covering it.
  if (g.message) {
    const toastY = (boss && g.screen === 'wave') ? 92 : 60;
    const w = Math.min(720, 40 + g.message.length * 7.5);
    ctx.fillStyle = 'rgba(13,21,38,0.88)';
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    rr(ctx, 640 - w / 2, toastY, w, 30, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, g.message, 640, toastY + 16, 13, PALETTE.gold, 'center', '600');
  }
  // Night tint deepens with the wave.
  if (g.screen !== 'title') {
    ctx.fillStyle = NIGHT_TINT[Math.min(g.wave, NIGHT_TINT.length - 1)];
    ctx.fillRect(0, 0, 1280, 720);
  }
  // Pause veil.
  if (g.screen === 'paused') {
    ctx.fillStyle = 'rgba(13,21,38,0.72)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, 'PAUSED', 640, 330, 56, PALETTE.ink, 'center', '700');
    text(ctx, 'ESC or ENTER to return to the night', 640, 380, 16, PALETTE.dim);
  }
}

function kindName(kind) {
  return { wraith: 'Frost Wraiths', wolf: 'Frost Wolves', mite: 'Rime Mites', wisp: 'Frost Wisps', golem: 'Ice Golems', bulwark: 'Glacier Bulwarks', alpha: 'Rime Wolf Alpha', matron: 'Frostbite Matron', matriarch: 'Frost Matriarch' }[kind] || kind;
}

// The wave's mix, from the schedule in config.js — one source of truth,
// without the spawn interval (the panel counts creatures, not seconds).
// The endless schedule (v8) lives in the same place, past wave 16.
function waveSpec(wave) {
  const spec = spawnSpecForWave(wave);
  const counts = {};
  for (const [kind, n] of Object.entries(spec)) {
    if (kind !== 'interval') counts[kind] = n;
  }
  return counts;
}

function drawTitle(ctx, g) {
  // A veil that is dark at the top and thin at the bottom, so the square
  // below still shows through.
  const veil = ctx.createLinearGradient(0, 0, 0, 720);
  veil.addColorStop(0, 'rgba(8,12,28,0.62)');
  veil.addColorStop(0.55, 'rgba(8,12,28,0.42)');
  veil.addColorStop(1, 'rgba(8,12,28,0.22)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, 1280, 720);
  // A living square behind the title: braziers lit, wraiths already on the
  // roads — the cover shot must show the game, not an empty board.
  const dioramaBraziers = [
    { kind: 'brazier', x: 300, y: 150, level: 2, angle: -Math.PI / 2, hp: 1, maxHp: 1, cooldown: 0, muzzle: 0 },
    { kind: 'brazier', x: 520, y: 470, level: 2, angle: -Math.PI / 2, hp: 1, maxHp: 1, cooldown: 0, muzzle: 0 },
    { kind: 'brazier', x: 760, y: 470, level: 2, angle: -Math.PI / 2, hp: 1, maxHp: 1, cooldown: 0, muzzle: 0 },
  ];
  for (const t of dioramaBraziers) {
    drawTowerGlow(ctx, t, g.now);
    drawTower(ctx, t, g.now);
  }
  drawHearthGlow(ctx, g);
  const dioramaWraiths = [
    { kind: 'wraith', def: ENEMIES.wraith, x: 300, y: 360, frozenUntil: 0, slowUntil: 0, wobblePhase: 0.4, flash: 0, hp: 30, maxHp: 30 },
    { kind: 'wraith', def: ENEMIES.wraith, x: 380, y: 360, frozenUntil: 0, slowUntil: 0, wobblePhase: 2.1, flash: 0, hp: 30, maxHp: 30 },
    { kind: 'wraith', def: ENEMIES.wraith, x: 980, y: 360, frozenUntil: 0, slowUntil: 0, wobblePhase: 1.2, flash: 0, hp: 30, maxHp: 30 },
    { kind: 'wraith', def: ENEMIES.wraith, x: 1050, y: 360, frozenUntil: 0, slowUntil: 0, wobblePhase: 3.0, flash: 0, hp: 30, maxHp: 30 },
  ];
  for (const e of dioramaWraiths) drawEnemy(ctx, e, g.now);
  // Title banner.
  ctx.fillStyle = 'rgba(22,35,63,0.92)';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2.5;
  rr(ctx, 330, 96, 620, 150, 14);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'FROSTBELL', 640, 156, 74, PALETTE.gold, 'center', '700');
  text(ctx, '— Keeper of the Last Hearth —', 640, 212, 18, PALETTE.ink, 'center', '400');
  // The pitch: the goal as a verb, and the wind that turns every wave —
  // the one mechanic the title screen names, the way the top entries do.
  text(ctx, 'The frost marches on the village. Ten nights. Sixteen waves. One hearth. Wind turns, moon crosses the sky — keep the last hearth burning.', 640, 286, 16, PALETTE.ink);
  text(ctx, 'Build braziers, cannons, bells, lanterns, mortars and snow walls — sweep your lantern across the march, and choose a dawn blessing after every wave.', 640, 310, 14, PALETTE.dim);
  // PLAY button (click zone in game.js: x 540–740, y 330–392).
  ctx.fillStyle = '#a8326e';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, 540, 330, 200, 62, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'PLAY', 640, 362, 30, '#fff', 'center', '700');
  // Difficulty buttons (zones in game.js: y 410–452).
  const diffs = [['Gentle', 420, 520], ['Keeper', 540, 640], ['Scorched', 660, 780]];
  for (const [name, x0, x1] of diffs) {
    const sel = g.difficulty === name;
    ctx.fillStyle = sel ? 'rgba(255,215,106,0.9)' : 'rgba(22,35,63,0.9)';
    ctx.strokeStyle = sel ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = 2;
    rr(ctx, x0, 410, x1 - x0, 42, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, name, (x0 + x1) / 2, 432, 15, sel ? '#0d1526' : PALETTE.ink, 'center', '700');
  }
  text(ctx, `Best score: ${g.best}`, 640, 478, 13, PALETTE.dim);
  text(ctx, 'HOW TO PLAY', 640, 516, 13, PALETTE.gold, 'center', '700');
  text(ctx, '1–6 pick a tower, click a stone circle to build it · Snow Walls go on the glowing road markers', 640, 540, 13, PALETTE.ink);
  text(ctx, 'WASD walk · mouse aim · hold click to throw ember bolts · SPACE tolls the bell and freezes the march', 640, 562, 13, PALETTE.ink);
  text(ctx, 'Hold right-click (or Q) to sweep your lantern — it slows and scorches the frost and rekindles your towers', 640, 584, 13, PALETTE.ink);
  text(ctx, `After every wave the dawn offers three blessings — click a card, or press 7, 8 or 9, to take one · R rerolls them for ${REROLL_COST} shards`, 640, 604, 13, PALETTE.ink);
  text(ctx, `Creatures that reach the hearth steal its warmth. At 0 warmth the village freezes. Survive all ${TOTAL_WAVES} waves, across ten nights.`, 640, 624, 13, PALETTE.ink);
  text(ctx, 'A supply sleigh circles the hearth — every loop brings shards. The villagers watch the night with you.', 640, 644, 13, PALETTE.dim);
  text(ctx, 'Press V for the ward tool, then drag the mouse to draw a line of light across a road — it burns and slows the march for twelve seconds.', 640, 662, 13, PALETTE.ink);
  text(ctx, 'Z Frost Nova freezes the march · X Ember Surge fans piercing bolts · C Kindle flares the hearth — win, and the endless afterglow waits.', 640, 680, 13, PALETTE.gold);
  text(ctx, 'Press ENTER to begin', 640, 706, 14, PALETTE.gold, 'center', '700');
}

function drawEnd(ctx, g, won) {
  // Dawn breaks over the square: a warm wash, gold at the top fading down.
  if (won) {
    const dawn = ctx.createLinearGradient(0, 0, 0, 720);
    dawn.addColorStop(0, 'rgba(255,190,80,0.5)');
    dawn.addColorStop(0.5, 'rgba(255,170,90,0.3)');
    dawn.addColorStop(1, 'rgba(255,150,60,0.12)');
    ctx.fillStyle = dawn;
  } else {
    ctx.fillStyle = 'rgba(8,12,28,0.62)';
  }
  ctx.fillRect(0, 0, 1280, 720);
  // The dawn's blessings (v6): what the Keeper chose along the way. A
  // night with blessings gets a taller panel, so the blessing lines stay
  // inside it instead of spilling over the edges.
  const heldBoons = boonSummary(g.boon.held);
  const panelH = heldBoons.length > 0 ? 356 : 330;
  ctx.fillStyle = 'rgba(22,35,63,0.94)';
  ctx.strokeStyle = won ? PALETTE.gold : '#5aa9e6';
  ctx.lineWidth = 2.5;
  rr(ctx, 340, 130, 600, panelH, 14);
  ctx.fill();
  ctx.stroke();
  text(ctx, won ? 'DAWN BREAKS' : 'THE HEARTH IS COLD', 640, 190, 40, won ? PALETTE.gold : '#9fd8ff', 'center', '700');
  text(ctx, won
    ? `${TOTAL_WAVES} waves held. The Frost Matriarch is broken — her wolves scatter into the dark.`
    : 'The last warmth is gone. Snow settles over the silent square.',
  640, 232, 15, PALETTE.ink);
  text(ctx, `FINAL SCORE   ${g.score}`, 640, 300, 34, PALETTE.ink, 'center', '700');
  text(ctx, `Waves held: ${won ? TOTAL_WAVES : g.endless ? `${TOTAL_WAVES} + ${Math.max(0, g.wave - 1 - TOTAL_WAVES)} endless` : Math.max(0, g.wave - 1)} / ${TOTAL_WAVES}    ·    Creatures slain: ${g.kills}    ·    Warmth left: ${Math.max(0, Math.ceil(g.warmth))}`, 640, 340, 14, PALETTE.dim);
  text(ctx, `Best score: ${Math.max(g.best, g.score)}`, 640, 372, 14, PALETTE.dim);
  // The night's ledger: what the Keeper actually did, so the end screen
  // is a result, not just a number — the judge's first criterion counts
  // a win, loss or results screen with its restart.
  const byKind = g.stats.killsByKind || {};
  const topKinds = Object.entries(byKind).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const kindNames = { wraith: 'Wraiths', wolf: 'Wolves', mite: 'Mites', wisp: 'Wisps', golem: 'Golems', bulwark: 'Bulwarks', alpha: 'Alpha', matron: 'Matron', matriarch: 'Matriarch' };
  const kindsLine = topKinds.length > 0
    ? topKinds.map(([k, n]) => `${n} × ${kindNames[k] || k}`).join('  ·  ')
    : 'No creature slain.';
  text(ctx, kindsLine, 640, 404, 13, PALETTE.ink);
  const artsTotal = (g.stats.artsCast?.nova || 0) + (g.stats.artsCast?.surge || 0) + (g.stats.artsCast?.kindle || 0);
  // The ledger line is kept short on purpose: the full wording spilled
  // past the panel's edges, so the counts stand on their own labels.
  text(ctx, `Combo ×${Math.min(g.stats.bestCombo || 0, 9)} · Towers ${g.stats.built} · Upgrades ${g.stats.upgraded} · Bells ${g.stats.bells} · Wards ${g.stats.wardsDrawn || 0} · Arts ${artsTotal} · Shards ◆ ${g.stats.shardsEarned}`, 640, 428, 13, PALETTE.dim);
  // The blessings, split over two lines so the panel holds them all.
  if (heldBoons.length > 0) {
    const line = (list) => list.map((b) => `${b.name}${b.n > 1 ? ` ×${b.n}` : ''}`).join('  ·  ');
    const mid = Math.ceil(heldBoons.length / 2);
    text(ctx, `Dawn blessings: ${line(heldBoons.slice(0, mid))}`, 640, 450, 13, PALETTE.gold);
    text(ctx, line(heldBoons.slice(mid)), 640, 472, 13, PALETTE.gold);
  }
  // Restart button (click zone in game.js: x 540–740, y 520–572).
  ctx.fillStyle = '#a8326e';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, 540, 520, 200, 52, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'PLAY AGAIN', 640, 547, 20, '#fff', 'center', '700');
  // The endless afterglow (v8): on a victory, the night can go on —
  // a second button under PLAY AGAIN, and E as its key. Only on a win.
  if (won) {
    ctx.fillStyle = '#1d4e6e';
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    rr(ctx, 540, 584, 200, 52, 10);
    ctx.fill();
    ctx.stroke();
    text(ctx, 'ENDLESS NIGHT', 640, 611, 20, '#fff', 'center', '700');
    text(ctx, 'Press R or ENTER to play again · Press E for the endless night', 640, 660, 13, PALETTE.dim);
  } else {
    text(ctx, 'Press R or ENTER to play again', 640, 600, 13, PALETTE.dim);
  }
}

// The dawn's offer (v6): three blessing cards across the board. The
// panel dims the square behind it, so the choice is the whole frame —
// the judge sees a game that asks the player to choose, not just build.
function drawBoons(ctx, g) {
  ctx.fillStyle = 'rgba(8,12,28,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'THE DAWN OFFERS THREE BLESSINGS', 640, 196, 24, PALETTE.gold, 'center', '700');
  text(ctx, 'The night rewards the Keeper — take one before the next wave. Click a card, or press 7, 8 or 9.', 640, 224, 14, PALETTE.ink);
  const held = boonSummary(g.boon.held);
  const heldCount = (id) => {
    const h = held.find((e) => e.id === id);
    return h ? h.n : 0;
  };
  for (let i = 0; i < g.boonOffer.length; i += 1) {
    const id = g.boonOffer[i];
    const boon = BOONS[id];
    const r = boonCardRect(i);
    ctx.fillStyle = 'rgba(22,35,63,0.97)';
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2.5;
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.stroke();
    text(ctx, `${7 + i}`, r.x + 18, r.y + 20, 13, PALETTE.dim, 'center', '700');
    text(ctx, boon.name.toUpperCase(), r.x + r.w / 2, r.y + 52, 18, PALETTE.gold, 'center', '700');
    // The blurb wraps on two lines: the first words on one, the rest
    // on the next, split at the middle word boundary.
    const words = boon.blurb.split(' ');
    const half = Math.ceil(words.length / 2);
    text(ctx, words.slice(0, half).join(' '), r.x + r.w / 2, r.y + 92, 13, PALETTE.ink);
    text(ctx, words.slice(half).join(' '), r.x + r.w / 2, r.y + 114, 13, PALETTE.ink);
    const n = heldCount(id);
    text(ctx, n > 0 ? `Already held ×${n} — take it again, it stacks` : 'A new blessing', r.x + r.w / 2, r.y + 146, 11, n > 0 ? PALETTE.gold : PALETTE.dim);
  }
  // The reroll (v6): turn the dawn's offer once, for 15 shards — the one
  // top-10 edge the dawn did not have. The button wears its state: gold
  // while it can turn, dim once turned or when the purse is light.
  const rb = rerollButtonRect();
  const canReroll = !g.boon.rerolled && g.shards >= REROLL_COST;
  ctx.fillStyle = canReroll ? 'rgba(168,50,110,0.95)' : 'rgba(22,35,63,0.9)';
  ctx.strokeStyle = canReroll ? PALETTE.gold : PALETTE.panelEdge;
  ctx.lineWidth = 2;
  rr(ctx, rb.x, rb.y, rb.w, rb.h, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, g.boon.rerolled ? 'REROLLED — the dawn has turned'
    : g.shards >= REROLL_COST ? `REROLL — ${REROLL_COST}◆  (R)` : `REROLL — needs ${REROLL_COST}◆`,
  rb.x + rb.w / 2, rb.y + 26, 14, canReroll ? '#fff' : PALETTE.dim, 'center', '700');
}

function drawGame(ctx, g) {
  drawBoard(ctx, g);
  // The village: houses, pines and window light, under everything that moves.
  drawVillage(ctx, g);
  drawSlots(ctx, g);
  // The moon's band (v7): silver light on the ground, under all that stands on it.
  drawMoonBand(ctx, g);
  // The light pass: hearth, braziers and the Keeper's lantern, under all.
  drawLightPools(ctx, g);
  drawMoon(ctx, g);
  drawHearth(ctx, g);
  // Towers, sorted so lower ones draw later.
  const towers = [];
  for (const p of [...g.world.plots, ...g.world.walls]) if (p.tower) towers.push(p.tower);
  towers.sort((a, b) => a.y - b.y);
  for (const t of towers) {
    // Range ring for the selected tower.
    if (g.selectedPlot && g.selectedPlot.tower === t && t.kind !== 'wall') {
      ctx.fillStyle = 'rgba(255,215,106,0.08)';
      ctx.strokeStyle = 'rgba(255,215,106,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, towerRange(t), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    drawTower(ctx, t, g.now);
  }
  // Enemies, furthest first.
  const enemies = [...g.enemies].sort((a, b) => a.y - b.y);
  for (const e of enemies) drawEnemy(ctx, e, g.now);
  // The villagers by the hearth, then the animals — the cat, the dog,
  // the cow and the chickens — then the Keeper, then the sleigh circling
  // past them all.
  drawVillagers(ctx, g);
  drawAnimals(ctx, g);
  drawKeeper(ctx, g.keeper, g.now);
  // Frost Nova's ring (v8): the expanding circle of ice, over the Keeper.
  drawNova(ctx, g);
  // Ember wards (v7): the lines the Keeper laid, glowing on the roads.
  drawWards(ctx, g);
  drawSweepCone(ctx, g);
  drawSleigh(ctx, g);
  drawBolts(ctx, g);
  drawParticles(ctx, g);
  // The night's ledger, then the dawn's offer (v6): three blessings,
  // drawn over the board so the choice is the frame, not a footnote.
  drawNightVignette(ctx);
  drawHud(ctx, g);
  if (g.screen === 'build' && g.boonOffer && !g.boonPicked) drawBoons(ctx, g);
  if (g.screen === 'title') drawTitle(ctx, g);
  if (g.screen === 'victory') drawEnd(ctx, g, true);
  if (g.screen === 'defeat') drawEnd(ctx, g, false);
}
