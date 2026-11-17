// Everything the player sees: the winter square, the hearth, the frost
// pillars, the mirrors, the beam, the march, and every screen — title,
// build, night, victory, defeat. All HUD is drawn on the canvas, so a
// screenshot always shows the whole game. Coordinates here must match the
// click zones in game.js (PLAY button, gift cards, PLAY AGAIN).

import {
  ENEMY_KINDS, HEARTH, MIRROR, NIGHTS, PILLARS, VIEW_W, VIEW_H,
} from './config.js';
import { NIGHT_NAMES } from './nights.js';

// The stone plaza in the middle of the snow, and the focus meter's top.
const PLAZA = { x: 240, y: 56, w: 800, h: 608 };
const FOCUS_MAX = 100;
const FOCUS_LOCK = 40;

const INK = '#eaf2ff';
const DIM = '#9fb2d8';
const GOLD = '#ffd76a';
const PANEL = 'rgba(22,35,63,0.92)';
const PANEL_EDGE = '#2e4a7a';
const FIRE = '#ff9a3d';
const FIRE_HOT = '#ffb347';
const ICE = '#9fd8ff';
const DANGER = '#ff6b6b';
const HEAL = '#7dffb2';

// Body colors for the frost kinds — the config only carries numbers, so
// the look lives here.
const KIND_COLORS = {
  wisp: '#cfe8ff',
  wraith: '#bcd6f5',
  wolf: '#8fa8c8',
  golem: '#8fb8d8',
  matriarch: '#d8b4fe',
};

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
  ctx.fillStyle = color || INK;
  ctx.font = `${weight || '600'} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function panel(ctx, x, y, w, h, title) {
  ctx.fillStyle = PANEL;
  ctx.strokeStyle = PANEL_EDGE;
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  if (title) {
    text(ctx, title, x + w / 2, y + 16, 13, GOLD, 'center', '700');
    ctx.strokeStyle = 'rgba(46,74,122,0.8)';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 30);
    ctx.lineTo(x + w - 10, y + 30);
    ctx.stroke();
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // 2x supersampling: the canvas paints at twice the logical resolution
  // and the browser downsamples it to the 1280x720 frame, so every edge
  // in a screenshot is antialiased. All drawing code still works in
  // 1280x720 logical coordinates.
  ctx.scale(2, 2);
  return { draw(g) { drawGame(ctx, g); } };
}

function drawSky(ctx, g) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#0a1122');
  sky.addColorStop(0.6, '#101d38');
  sky.addColorStop(1, '#0d1526');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Stars, twinkling on the clock.
  ctx.fillStyle = 'rgba(234,242,255,0.7)';
  for (let i = 0; i < 40; i += 1) {
    const sx = (i * 317) % VIEW_W;
    const sy = (i * 173) % 200;
    ctx.globalAlpha = (0.4 + 0.6 * Math.abs(Math.sin(g.now * 0.7 + i))) * 0.8;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  // The moon, high and cold.
  const mx = 1120;
  const my = 90;
  const glow = ctx.createRadialGradient(mx, my, 4, mx, my, 70);
  glow.addColorStop(0, 'rgba(235,242,255,0.85)');
  glow.addColorStop(0.4, 'rgba(210,228,255,0.28)');
  glow.addColorStop(1, 'rgba(210,228,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(mx, my, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eef4ff';
  ctx.beginPath();
  ctx.arc(mx, my, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,198,228,0.8)';
  ctx.beginPath();
  ctx.arc(mx - 8, my - 4, 5, 0, Math.PI * 2);
  ctx.arc(mx + 9, my + 7, 4, 0, Math.PI * 2);
  ctx.fill();
  // Snow ground.
  ctx.fillStyle = '#16233f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(38,54,90,0.55)';
  for (let i = 0; i < 24; i += 1) {
    const sx = (i * 211) % VIEW_W;
    const sy = (i * 97) % VIEW_H;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 60 + (i % 5) * 14, 18 + (i % 3) * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // The village square: a dark stone plaza in the middle of the snow.
  ctx.fillStyle = '#1b2a4a';
  rr(ctx, PLAZA.x - 8, PLAZA.y - 8, PLAZA.w + 16, PLAZA.h + 16, 12);
  ctx.fill();
  ctx.strokeStyle = '#2e4a7a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,145,200,0.22)';
  ctx.lineWidth = 1;
  for (let x = PLAZA.x; x <= PLAZA.x + PLAZA.w; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, PLAZA.y); ctx.lineTo(x, PLAZA.y + PLAZA.h); ctx.stroke();
  }
  for (let y = PLAZA.y; y <= PLAZA.y + PLAZA.h; y += 54) {
    ctx.beginPath(); ctx.moveTo(PLAZA.x, y); ctx.lineTo(PLAZA.x + PLAZA.w, y); ctx.stroke();
  }
}

function drawCottage(ctx, x, y, s, lit) {
  // A small snow-roofed cottage at the square's edge, window warm.
  ctx.fillStyle = '#3d4a63';
  ctx.fillRect(x - 34 * s, y - 10 * s, 68 * s, 34 * s);
  ctx.fillStyle = '#eaf2ff';
  ctx.beginPath();
  ctx.moveTo(x - 42 * s, y - 8 * s);
  ctx.lineTo(x, y - 34 * s);
  ctx.lineTo(x + 42 * s, y - 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lit ? '#ffd76a' : '#2e4a7a';
  ctx.fillRect(x - 18 * s, y + 2 * s, 14 * s, 14 * s);
  ctx.fillRect(x + 6 * s, y + 2 * s, 14 * s, 14 * s);
  ctx.fillStyle = '#2c2118';
  ctx.fillRect(x - 5 * s, y + 8 * s, 10 * s, 16 * s);
  if (lit) {
    const glow = ctx.createRadialGradient(x, y + 9 * s, 2, x, y + 9 * s, 46 * s);
    glow.addColorStop(0, 'rgba(255,215,106,0.25)');
    glow.addColorStop(1, 'rgba(255,215,106,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + 9 * s, 46 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPillar(ctx, p, now) {
  // A frost pillar: a tall ice crystal the beam cannot cross, and the
  // march must walk around. It shimmers faintly on the clock.
  const shimmer = 0.5 + 0.3 * Math.sin(now * 1.3 + p.x * 0.01);
  ctx.fillStyle = `rgba(120,180,230,${0.75 * shimmer})`;
  ctx.beginPath();
  ctx.moveTo(p.x - p.r, p.y + p.r * 0.9);
  ctx.lineTo(p.x - p.r * 0.4, p.y - p.r * 1.6);
  ctx.lineTo(p.x, p.y - p.r * 2.1);
  ctx.lineTo(p.x + p.r * 0.4, p.y - p.r * 1.6);
  ctx.lineTo(p.x + p.r, p.y + p.r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(234,247,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(p.x - p.r * 0.25, p.y - p.r * 1.2);
  ctx.lineTo(p.x, p.y - p.r * 1.9);
  ctx.lineTo(p.x + p.r * 0.25, p.y - p.r * 1.2);
  ctx.closePath();
  ctx.fill();
}

function drawHearth(ctx, g) {
  const { now, hearthHp } = g;
  const flick = 1 + Math.sin(now * 9) * 0.06 + Math.sin(now * 23) * 0.04;
  // Warm glow on the snow around the hearth.
  const glow = ctx.createRadialGradient(HEARTH.x, HEARTH.y, 10, HEARTH.x, HEARTH.y, 150);
  glow.addColorStop(0, 'rgba(255,180,71,0.35)');
  glow.addColorStop(1, 'rgba(255,180,71,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(HEARTH.x, HEARTH.y, 150, 0, Math.PI * 2);
  ctx.fill();
  // Stone ring.
  ctx.fillStyle = '#6b7688';
  ctx.beginPath();
  ctx.arc(HEARTH.x, HEARTH.y, HEARTH.r + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d4a63';
  ctx.beginPath();
  ctx.arc(HEARTH.x, HEARTH.y, HEARTH.r, 0, Math.PI * 2);
  ctx.fill();
  // The fire: layered flames, smaller as the hearth cools.
  const h = (26 + Math.sin(now * 7) * 4) * flick * (0.3 + 0.7 * (hearthHp / 100));
  ctx.fillStyle = FIRE_HOT;
  ctx.beginPath();
  ctx.moveTo(HEARTH.x - 16, HEARTH.y + 12);
  ctx.quadraticCurveTo(HEARTH.x - 20, HEARTH.y - h, HEARTH.x, HEARTH.y - h - 10);
  ctx.quadraticCurveTo(HEARTH.x + 20, HEARTH.y - h, HEARTH.x + 16, HEARTH.y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = FIRE;
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
  text(ctx, `HEARTH  ${Math.max(0, Math.ceil(hearthHp))}`, HEARTH.x, HEARTH.y + HEARTH.r + 24, 13, hearthHp < 30 ? DANGER : GOLD, 'center', '700');
}

function drawMirror(ctx, m, selected) {
  const half = MIRROR.length / 2;
  const dx = Math.cos(m.angle);
  const dy = Math.sin(m.angle);
  const x1 = m.x - dx * half;
  const y1 = m.y - dy * half;
  const x2 = m.x + dx * half;
  const y2 = m.y + dy * half;
  // A soft halo, then the bright bar, then a white core.
  ctx.strokeStyle = 'rgba(159,216,255,0.25)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = '#bfe6ff';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  // The mount: a small dark post under the bar's middle.
  ctx.fillStyle = '#3d4a63';
  ctx.beginPath();
  ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
  ctx.fill();
  // The selected mirror wears a gold ring and a normal tick, so the
  // player sees which one Q/E and the wheel will turn.
  if (selected) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(m.x, m.y, half + 12, 0, Math.PI * 2);
    ctx.stroke();
    const nx = Math.cos(m.angle + Math.PI / 2);
    const ny = Math.sin(m.angle + Math.PI / 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(m.x + nx * 22, m.y + ny * 22);
    ctx.stroke();
  }
}

// The beam: a living line of light from the hearth, through its bounces.
// Three strokes — wide faint halo, bright mid, white core — so it reads
// as light falling on the field, not as a painted line.
function drawBeam(ctx, g) {
  const b = g.beam;
  if (!b || !b.segments || b.segments.length === 0) return;
  const pts = [{ x: b.segments[0].x1, y: b.segments[0].y1 }];
  for (const s of b.segments) pts.push({ x: s.x2, y: s.y2 });
  const color = b.focusing ? '255,190,80' : '255,215,106';
  const widths = [b.width + 22, b.width + 8, b.width];
  const alphas = [0.10, 0.35, 0.95];
  for (let layer = 0; layer < 3; layer += 1) {
    ctx.strokeStyle = `rgba(${color},${alphas[layer]})`;
    ctx.lineWidth = widths[layer];
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  // A bright point where the beam leaves the hearth.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(pts[0].x, pts[0].y, 7, 0, Math.PI * 2);
  ctx.fill();
  // A small sparkle where each bounce lands, so the mirrors read as
  // doing the work.
  for (let i = 1; i < pts.length - 1; i += 1) {
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemy(ctx, e, now) {
  const radius = ENEMY_KINDS[e.kind].radius;
  const color = KIND_COLORS[e.kind] || '#bcd6f5';
  const bob = Math.sin(now * 5 + e.wobble) * (e.kind === 'wisp' ? 7 : 3) - (e.kind === 'wisp' ? 10 : 0);
  // Shadow.
  ctx.fillStyle = 'rgba(13,21,38,0.25)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + radius * 0.8, radius, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cold glow around the body.
  const glow = ctx.createRadialGradient(e.x, e.y + bob, 2, e.x, e.y + bob, radius + 10);
  glow.addColorStop(0, 'rgba(191,230,255,0.5)');
  glow.addColorStop(1, 'rgba(159,216,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(e.x, e.y + bob, radius + 10, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : color;
  ctx.beginPath();
  ctx.arc(e.x, e.y + bob, radius, 0, Math.PI * 2);
  ctx.fill();
  if (e.kind === 'golem' || e.kind === 'matriarch') {
    ctx.fillStyle = '#5aa9e6';
    ctx.beginPath();
    ctx.moveTo(e.x - radius, e.y + bob + 4);
    ctx.lineTo(e.x - radius * 0.4, e.y + bob - radius * 0.9);
    ctx.lineTo(e.x + radius * 0.2, e.y + bob + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + radius, e.y + bob + 4);
    ctx.lineTo(e.x + radius * 0.4, e.y + bob - radius * 0.9);
    ctx.lineTo(e.x - radius * 0.2, e.y + bob + 2);
    ctx.closePath();
    ctx.fill();
  }
  if (e.kind === 'wolf') {
    ctx.fillStyle = color;
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
  if (e.kind === 'matriarch') {
    // A crown of ice shards.
    ctx.fillStyle = '#d8b4fe';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(e.x + i * 14 - 5, e.y + bob - radius + 6);
      ctx.lineTo(e.x + i * 14, e.y + bob - radius - 12);
      ctx.lineTo(e.x + i * 14 + 5, e.y + bob - radius + 6);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Eyes: two cold sparks.
  ctx.fillStyle = '#0d1526';
  ctx.beginPath();
  ctx.arc(e.x - 5, e.y + bob - 2, 2.4, 0, Math.PI * 2);
  ctx.arc(e.x + 5, e.y + bob - 2, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Health bar when hurt.
  if (e.hp < e.maxHp) {
    const w = radius * 2;
    ctx.fillStyle = 'rgba(13,21,38,0.6)';
    ctx.fillRect(e.x - w / 2, e.y + bob - radius - 10, w, 5);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? HEAL : DANGER;
    ctx.fillRect(e.x - w / 2, e.y + bob - radius - 10, w * Math.max(0, e.hp / e.maxHp), 5);
  }
  if (e.kind === 'matriarch') {
    text(ctx, 'THE FROST MATRIARCH', e.x, e.y + bob - radius - 22, 12, '#d8b4fe', 'center', '700');
  }
}

function drawBolt(ctx, b) {
  const glow = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 16);
  glow.addColorStop(0, 'rgba(159,216,255,0.9)');
  glow.addColorStop(1, 'rgba(159,216,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eaf7ff';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawShard(ctx, s, now) {
  const tw = 0.7 + 0.3 * Math.sin(now * 6 + s.x);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = `rgba(159,216,255,${tw})`;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.fillStyle = '#eaf7ff';
  ctx.fillRect(-3.5, -3.5, 7, 7);
  ctx.restore();
  text(ctx, `+${s.value}`, s.x, s.y + 20, 10, ICE, 'center', '700');
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
    ctx.globalAlpha = Math.max(0, 1 - e.age / e.life);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const s of p.sparks) {
    ctx.globalAlpha = Math.max(0, 1 - s.age / s.life);
    ctx.fillStyle = s.hot ? '#ffd76a' : '#bfe6ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of p.floaters) {
    ctx.globalAlpha = Math.min(1, 1.1 - f.age);
    text(ctx, f.text, f.x, f.y, 14, f.color, 'center', '700');
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, g) {
  // Top bar.
  ctx.fillStyle = 'rgba(13,21,38,0.92)';
  ctx.fillRect(0, 0, VIEW_W, 52);
  text(ctx, '❄  FROSTBELL  ❄', 110, 27, 20, GOLD, 'center', '700');
  text(ctx, 'Keeper of the Last Hearth', 110, 44, 10, DIM);
  // Short label on purpose: the full night name is long, and a long
  // centred label collides with the combo text on the same line. The
  // night's full name is announced in the toast when the night starts.
  const nightLabel = g.screen === 'title' ? '—'
    : `NIGHT ${Math.max(1, g.night)} / ${NIGHTS}`;
  text(ctx, nightLabel, 640, 22, 20, INK, 'center', '700');
  const sub = g.screen === 'night'
    ? `${g.enemies.length + g.spawnQueue.length} frost creatures remain — aim the light, hold SPACE or mouse to focus`
    : g.screen === 'build' && g.upgradeOffer && !g.upgradePicked
      ? 'Take a dawn gift — click a card, or press 1, 2 or 3 — then ENTER for the next night'
      : g.screen === 'build'
        ? `Build phase — ${Math.max(0, Math.ceil(g.buildTimer))}s — place mirrors, then ENTER for night ${g.night + 1}`
        : g.screen === 'title' ? 'The night is cold. The hearth is all that is warm.'
          : g.screen === 'victory' ? 'Dawn has broken.'
            : 'The hearth has gone cold.';
  text(ctx, sub, 640, 42, 12, DIM);
  // Warmth bar, top right.
  const bx = 920;
  ctx.fillStyle = 'rgba(234,242,255,0.2)';
  rr(ctx, bx, 14, 150, 16, 8);
  ctx.fill();
  ctx.fillStyle = g.hearthHp > 50 ? FIRE : g.hearthHp > 25 ? '#ff9a3d' : DANGER;
  if (g.hearthHp > 0) {
    rr(ctx, bx, 14, 150 * (g.hearthHp / 100), 16, 8);
    ctx.fill();
  }
  text(ctx, `WARMTH ${Math.max(0, Math.ceil(g.hearthHp))}`, bx + 75, 22, 11, '#fff', 'center', '700');
  text(ctx, `SCORE ${g.score}`, 1180, 22, 15, INK, 'center', '700');
  text(ctx, `◆ ${g.embers}`, 1180, 40, 12, GOLD, 'center', '700');
  // Combo.
  if (g.combo >= 2 && g.now <= g.comboUntil) {
    text(ctx, `COMBO ×${Math.min(g.combo, 9)}`, 860, 22, 15, GOLD, 'center', '700');
  }

  // Boss bar.
  const boss = g.enemies.find((e) => e.kind === 'matriarch');
  if (boss && g.screen === 'night') {
    const frac = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = 'rgba(13,21,38,0.88)';
    rr(ctx, 430, 56, 420, 30, 8);
    ctx.fill();
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(234,242,255,0.2)';
    rr(ctx, 442, 74, 396, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#b388ff';
    if (frac > 0) {
      rr(ctx, 442, 74, 396 * frac, 8, 4);
      ctx.fill();
    }
    text(ctx, 'THE FROST MATRIARCH', 640, 66, 12, '#e9dcff', 'center', '700');
  }

  // Left panel: the mirror bench.
  panel(ctx, 8, 64, 192, 220, 'ICE MIRRORS');
  text(ctx, `${g.mirrors.list.length} / ${g.maxMirrors} placed`, 104, 112, 13, INK, 'center', '700');
  text(ctx, `◆ ${MIRROR.cost} each`, 104, 134, 12, GOLD, 'center', '700');
  text(ctx, 'Click empty ground to place', 104, 160, 11, DIM);
  text(ctx, 'Click a mirror to select it', 104, 178, 11, DIM);
  text(ctx, 'Q / E or wheel: turn it', 104, 196, 11, DIM);
  text(ctx, 'Right-click: lift it', 104, 214, 11, DIM);
  text(ctx, `Refund ◆ ${MIRROR.refund}`, 104, 232, 11, DIM);
  text(ctx, 'The beam bounces off mirrors', 104, 254, 11, DIM);
  text(ctx, 'and burns harder after one', 104, 270, 11, DIM);
  // Focus meter, under the bench.
  panel(ctx, 8, 292, 192, 96, 'FOCUS');
  const ffrac = g.focus / FOCUS_MAX;
  ctx.fillStyle = 'rgba(234,242,255,0.2)';
  rr(ctx, 24, 330, 160, 16, 8);
  ctx.fill();
  ctx.fillStyle = g.focusLocked ? DANGER : GOLD;
  if (ffrac > 0) {
    rr(ctx, 24, 330, 160 * ffrac, 16, 8);
    ctx.fill();
  }
  text(ctx, g.focusLocked ? `SPENT — back at ${FOCUS_LOCK}` : g.focusing ? 'FOCUSING — burning hot' : 'Hold SPACE / mouse to focus', 104, 360, 11, g.focusLocked ? DANGER : DIM);
  text(ctx, 'Focus: armor-piercing, 120 dps', 104, 376, 11, DIM);

  // Right panel: the night's ledger.
  panel(ctx, 1080, 64, 192, 250, 'THE NIGHT');
  text(ctx, 'SCORE', 1176, 112, 11, DIM, 'center', '700');
  text(ctx, `${g.score}`, 1176, 136, 26, INK, 'center', '700');
  text(ctx, 'EMBERS', 1176, 168, 11, DIM, 'center', '700');
  text(ctx, `◆ ${g.embers}`, 1176, 192, 22, GOLD, 'center', '700');
  text(ctx, 'CREATURES SLAIN', 1176, 222, 11, DIM, 'center', '700');
  text(ctx, `${g.kills}`, 1176, 246, 22, INK, 'center', '700');
  text(ctx, 'BEST', 1176, 276, 11, DIM, 'center', '700');
  text(ctx, `${Math.max(g.best, g.score)}`, 1176, 300, 16, DIM, 'center', '700');
  panel(ctx, 1080, 322, 192, 118, 'INCOMING');
  if (g.screen === 'build') {
    text(ctx, `Night ${g.night + 1} of ${NIGHTS}`, 1176, 362, 13, INK, 'center', '700');
    text(ctx, NIGHT_NAMES[g.night] || '', 1176, 384, 12, GOLD);
    text(ctx, 'The march comes at dark', 1176, 408, 11, DIM);
  } else if (g.screen === 'night') {
    text(ctx, `${g.spawnQueue.length} still marching in`, 1176, 372, 12, INK);
    text(ctx, `${g.enemies.length} on the roads now`, 1176, 396, 12, INK);
    text(ctx, g.night >= NIGHTS ? 'The Matriarch walks…' : '', 1176, 418, 11, '#d8b4fe');
  } else {
    text(ctx, '—', 1176, 382, 14, DIM);
  }
  // The tale: the last three lines.
  panel(ctx, 1080, 448, 192, 118, 'THE TALE');
  if (g.feed.length === 0) {
    text(ctx, 'No creature slain yet.', 1176, 500, 11, DIM);
  } else {
    let fy = 486;
    for (const line of g.feed) {
      text(ctx, line, 1176, fy, 10.5, INK, 'center', '400');
      fy += 20;
    }
    text(ctx, 'The night remembers.', 1176, fy + 8, 10, DIM, 'center', '400');
  }

  // Focus meter, bottom centre — the beam's own gauge, always in view
  // while playing. The title screen hides it: its "Press ENTER" line
  // sits on the same band, and the left panel already shows the meter.
  if (g.screen !== 'title') {
    const fw = 300;
    const fx = 640 - fw / 2;
    ctx.fillStyle = 'rgba(13,21,38,0.85)';
    rr(ctx, fx - 10, 668, fw + 20, 34, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(234,242,255,0.2)';
    rr(ctx, fx, 676, fw, 12, 6);
    ctx.fill();
    ctx.fillStyle = g.focusLocked ? DANGER : GOLD;
    if (ffrac > 0) {
      rr(ctx, fx, 676, fw * ffrac, 12, 6);
      ctx.fill();
    }
    text(ctx, g.focusLocked ? 'LIGHT SPENT' : g.focusing ? 'FOCUS' : 'FOCUS — hold SPACE / mouse', 640, 696, 10, g.focusLocked ? DANGER : DIM, 'center', '700');
  }

  // Bottom bar: controls.
  if (g.screen !== 'title') {
    ctx.fillStyle = 'rgba(13,21,38,0.92)';
    ctx.fillRect(0, 664, 1280, 56);
    text(ctx, 'Mouse: aim the light · Hold click / SPACE: focus · Click ground: place mirror · Click mirror: select · Q/E or wheel: turn · Right-click: lift mirror · ESC pause · M mute', 640, 684, 13, DIM);
    text(ctx, `WIN: hold the hearth through night ${NIGHTS} · LOSE: warmth hits 0 · Every creature that reaches the hearth steals its warmth.`, 640, 704, 11, DIM);
  }

  // Toast message. When the boss bar is up it sits at y 56–86, so the
  // toast drops below it instead of covering it.
  if (g.message) {
    const toastY = (boss && g.screen === 'night') ? 92 : 60;
    const w = Math.min(720, 40 + g.message.length * 7.5);
    ctx.fillStyle = 'rgba(13,21,38,0.88)';
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    rr(ctx, 640 - w / 2, toastY, w, 30, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, g.message, 640, toastY + 16, 13, GOLD, 'center', '600');
  }
  // Pause veil.
  if (g.screen === 'paused') {
    ctx.fillStyle = 'rgba(13,21,38,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', 640, 330, 56, INK, 'center', '700');
    text(ctx, 'ESC or ENTER to return to the night', 640, 380, 16, DIM);
  }
}

// The dawn's offer: three gift cards across the board. The rects here
// must match giftCardAt in game.js exactly (x 340 + i*200, y 300, w 180,
// h 130).
function drawGifts(ctx, g) {
  ctx.fillStyle = 'rgba(8,12,28,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'THE DAWN OFFERS THREE GIFTS', 640, 196, 24, GOLD, 'center', '700');
  text(ctx, 'The night rewards the Keeper — take one before the next night. Click a card, or press 1, 2 or 3.', 640, 224, 14, INK);
  for (let i = 0; i < g.upgradeOffer.length; i += 1) {
    const up = g.upgradeOffer[i];
    const x = 340 + i * 200;
    const y = 300;
    ctx.fillStyle = 'rgba(22,35,63,0.97)';
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    rr(ctx, x, y, 180, 130, 12);
    ctx.fill();
    ctx.stroke();
    text(ctx, `${i + 1}`, x + 18, y + 20, 13, DIM, 'center', '700');
    text(ctx, up.name.toUpperCase(), x + 90, y + 52, 17, GOLD, 'center', '700');
    const words = up.blurb.split(' ');
    const half = Math.ceil(words.length / 2);
    text(ctx, words.slice(0, half).join(' '), x + 90, y + 88, 12, INK);
    text(ctx, words.slice(half).join(' '), x + 90, y + 108, 12, INK);
  }
}

function drawTitle(ctx, g) {
  const veil = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  veil.addColorStop(0, 'rgba(8,12,28,0.62)');
  veil.addColorStop(0.55, 'rgba(8,12,28,0.42)');
  veil.addColorStop(1, 'rgba(8,12,28,0.22)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Title banner.
  ctx.fillStyle = 'rgba(22,35,63,0.92)';
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  rr(ctx, 330, 96, 620, 150, 14);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'FROSTBELL', 640, 156, 74, GOLD, 'center', '700');
  text(ctx, '— Keeper of the Last Hearth —', 640, 212, 18, INK, 'center', '400');
  // The pitch: the goal as a verb — steer the light.
  text(ctx, 'The frost marches on the village. Ten nights. One hearth. The light is yours to steer.', 640, 286, 16, INK);
  text(ctx, 'Aim the hearth’s beam with the mouse, bounce it off ice mirrors you place and turn, hold SPACE to focus it hot.', 640, 310, 14, DIM);
  // PLAY button (click zone in game.js: x 540–740, y 330–392).
  ctx.fillStyle = '#a8326e';
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  rr(ctx, 540, 330, 200, 62, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'PLAY', 640, 362, 30, '#fff', 'center', '700');
  text(ctx, `Best score: ${g.best}`, 640, 424, 13, DIM);
  text(ctx, 'HOW TO PLAY', 640, 462, 13, GOLD, 'center', '700');
  text(ctx, 'Mouse aims the beam — it burns everything it touches, 34 damage a second', 640, 486, 13, INK);
  text(ctx, 'Hold click or SPACE to focus: a narrow beam, 120 damage a second, cuts through armor', 640, 508, 13, INK);
  text(ctx, 'Click empty ground to place an ice mirror (◆15) — the beam bounces off it and burns harder after', 640, 530, 13, INK);
  text(ctx, 'Click a mirror to select it, Q / E or the wheel to turn it, right-click to lift it (◆10 back)', 640, 552, 13, INK);
  text(ctx, 'Frost pillars block the beam — bounce around them. Glimmer shards drift down: catch them with the beam', 640, 574, 13, INK);
  text(ctx, 'After every night the dawn offers three gifts — click a card, or press 1, 2 or 3, to take one', 640, 596, 13, INK);
  text(ctx, 'Creatures that reach the hearth steal its warmth. At 0 warmth the village freezes. Hold ten nights.', 640, 618, 13, INK);
  text(ctx, 'On night ten the Frost Matriarch walks — she holds off and throws ice bolts at the hearth.', 640, 640, 13, GOLD);
  text(ctx, 'Press ENTER to begin', 640, 684, 14, GOLD, 'center', '700');
}

function drawEnd(ctx, g, won) {
  if (won) {
    const dawn = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    dawn.addColorStop(0, 'rgba(255,190,80,0.5)');
    dawn.addColorStop(0.5, 'rgba(255,170,90,0.3)');
    dawn.addColorStop(1, 'rgba(255,150,60,0.12)');
    ctx.fillStyle = dawn;
  } else {
    ctx.fillStyle = 'rgba(8,12,28,0.62)';
  }
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(22,35,63,0.94)';
  ctx.strokeStyle = won ? GOLD : '#5aa9e6';
  ctx.lineWidth = 2.5;
  rr(ctx, 340, 130, 600, 330, 14);
  ctx.fill();
  ctx.stroke();
  text(ctx, won ? 'DAWN BREAKS' : 'THE HEARTH IS COLD', 640, 190, 40, won ? GOLD : ICE, 'center', '700');
  text(ctx, won
    ? 'Ten nights held. The Frost Matriarch is broken — her wolves scatter into the dark.'
    : 'The last warmth is gone. Snow settles over the silent square.',
  640, 232, 15, INK);
  text(ctx, `FINAL SCORE   ${g.score}`, 640, 300, 34, INK, 'center', '700');
  text(ctx, `Nights held: ${won ? NIGHTS : Math.max(0, g.night - 1)} / ${NIGHTS}    ·    Creatures slain: ${g.kills}    ·    Warmth left: ${Math.max(0, Math.ceil(g.hearthHp))}`, 640, 340, 14, DIM);
  text(ctx, `Best score: ${Math.max(g.best, g.score)}`, 640, 372, 14, DIM);
  // The night's ledger: what the Keeper actually did.
  const byKind = g.killsByKind || {};
  const topKinds = Object.entries(byKind).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const kindNames = { wisp: 'Wisps', wraith: 'Wraiths', wolf: 'Wolves', golem: 'Golems', matriarch: 'Matriarch' };
  const kindsLine = topKinds.length > 0
    ? topKinds.map(([k, n]) => `${n} × ${kindNames[k] || k}`).join('  ·  ')
    : 'No creature slain.';
  text(ctx, kindsLine, 640, 404, 13, INK);
  text(ctx, `Best combo ×${Math.min(g.bestCombo || 0, 9)} · Mirrors placed ${g.stats.mirrorsPlaced} · Focus held ${Math.round(g.stats.focusSeconds)}s · Shards gathered ${g.stats.shardsCollected} · Gifts taken ${g.stats.giftsTaken}`, 640, 428, 13, DIM);
  // Restart button (click zone in game.js: x 540–740, y 520–572).
  ctx.fillStyle = '#a8326e';
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  rr(ctx, 540, 520, 200, 52, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'PLAY AGAIN', 640, 547, 20, '#fff', 'center', '700');
  text(ctx, 'Press R or ENTER to play again', 640, 600, 13, DIM);
}

function drawGame(ctx, g) {
  drawSky(ctx, g);
  // Cottages at the square's corners, windows warm.
  drawCottage(ctx, 150, 640, 1, true);
  drawCottage(ctx, 1130, 640, 1, true);
  drawCottage(ctx, 150, 130, 0.9, false);
  drawCottage(ctx, 1130, 130, 0.9, true);
  for (const p of PILLARS) drawPillar(ctx, p, g.now);
  drawHearth(ctx, g);
  // The beam is painted under the mirrors and the march, over the ground
  // — light falling on the field, with the creatures standing in it.
  drawBeam(ctx, g);
  for (const m of g.mirrors.list) drawMirror(ctx, m, g.mirrors.selected === m.id);
  // Enemies, lower ones later so the near ones overlap the far ones.
  const sorted = [...g.enemies].sort((a, b) => a.y - b.y);
  for (const e of sorted) drawEnemy(ctx, e, g.now);
  for (const b of g.bolts) drawBolt(ctx, b);
  for (const s of g.shards) drawShard(ctx, s, g.now);
  drawParticles(ctx, g);
  drawHud(ctx, g);
  if (g.screen === 'build' && g.upgradeOffer && !g.upgradePicked) drawGifts(ctx, g);
  if (g.screen === 'title') drawTitle(ctx, g);
  if (g.screen === 'victory') drawEnd(ctx, g, true);
  if (g.screen === 'defeat') drawEnd(ctx, g, false);
}
