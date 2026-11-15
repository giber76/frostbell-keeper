// Particles and floating text: falling snow, hearth embers, hit sparks,
// muzzle flashes and the little numbers that pop when a creature dies.
// Cosmetic only — nothing here changes the game.

export function makeParticles(random) {
  return {
    snow: [],
    sparks: [],
    floaters: [],
    embers: [],
    random,
  };
}

export function spawnSnow(p, count) {
  for (let i = 0; i < count; i += 1) {
    p.snow.push({
      x: p.random.range(0, 1280), y: p.random.range(-20, 720),
      r: p.random.range(1, 2.6), speed: p.random.range(18, 55),
      drift: p.random.range(-12, 12), phase: p.random.range(0, Math.PI * 2),
    });
  }
}

export function updateParticles(p, dt, now, hearth) {
  for (const s of p.snow) {
    s.y += s.speed * dt;
    s.x += (s.drift + Math.sin(now * 0.8 + s.phase) * 8) * dt;
    if (s.y > 724) { s.y = -6; s.x = p.random.range(0, 1280); }
    if (s.x < -6) s.x = 1286;
    if (s.x > 1286) s.x = -6;
  }
  for (let i = p.sparks.length - 1; i >= 0; i -= 1) {
    const s = p.sparks[i];
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 60 * dt;
    if (s.life <= 0) p.sparks.splice(i, 1);
  }
  for (let i = p.floaters.length - 1; i >= 0; i -= 1) {
    const f = p.floaters[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) p.floaters.splice(i, 1);
  }
  // Hearth embers rise and fade above the fire. The gate draws from the
  // seeded random, not Math.random — the whole night must replay exactly
  // from its seed, or a screenshot scene and a self-test would drift.
  if (p.embers.length < 26 && p.random.chance(0.5)) {
    p.embers.push({
      x: hearth.x + p.random.range(-22, 22), y: hearth.y - 6,
      vy: p.random.range(-46, -22), vx: p.random.range(-8, 8),
      life: p.random.range(0.6, 1.4), maxLife: 1.4, r: p.random.range(1.5, 3.5),
    });
  }
  for (let i = p.embers.length - 1; i >= 0; i -= 1) {
    const e = p.embers[i];
    e.life -= dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (e.life <= 0) p.embers.splice(i, 1);
  }
}

export function burst(p, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const a = p.random.range(0, Math.PI * 2);
    const v = p.random.range(speed * 0.4, speed);
    p.sparks.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: p.random.range(0.25, 0.6), maxLife: 0.6, r: p.random.range(1.5, 3.5), color,
    });
  }
}

export function floater(p, x, y, text, color) {
  p.floaters.push({ x, y, text, color: color || '#ffd76a', life: 1.1 });
}
