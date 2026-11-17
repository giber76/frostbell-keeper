// Particles: falling snow, fire embers, sparks from beam kills, and the
// floating text that pops up when a shard is gathered or a combo lands.
// Everything here is cosmetic — it never changes the game state.

import { VIEW_W, VIEW_H } from './config.js';

// A particle set keeps its own array so snow and embers never interfere
// with each other. Spawn rates are tuned for a 1280x720 night scene.
export function makeParticles() {
  return {
    snow: [],
    embers: [],
    sparks: [],
    floaters: [],
    snowTimer: 0,
  };
}

// Fill the sky with flakes before the first frame so the title screen
// already looks like a winter night instead of fading in.
export function seedSnow(p, count) {
  for (let i = 0; i < count; i += 1) {
    p.snow.push({
      x: Math.random() * VIEW_W,
      y: Math.random() * VIEW_H,
      r: 0.8 + Math.random() * 1.8,
      speed: 14 + Math.random() * 22,
      drift: (Math.random() - 0.5) * 12,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

// A small fire burst at the hearth — called every frame while the fire is
// burning, so the hearth always has a living flame above it.
export function spawnEmber(p, x, y, count = 1) {
  for (let i = 0; i < count; i += 1) {
    p.embers.push({
      x: x + (Math.random() - 0.5) * 26,
      y: y - Math.random() * 6,
      vx: (Math.random() - 0.5) * 10,
      vy: -(18 + Math.random() * 30),
      age: 0,
      life: 0.5 + Math.random() * 0.7,
      r: 1.2 + Math.random() * 2,
    });
  }
}

// The bright scatter when a beam kill lands — gold when the beam was
// focused, cool blue-white when it was a sweep hit.
export function burst(p, x, y, focused) {
  const n = focused ? 14 : 9;
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 130;
    p.sparks.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      age: 0,
      life: 0.3 + Math.random() * 0.45,
      r: 1 + Math.random() * 2.2,
      hot: focused,
    });
  }
}

// Rising text: "+6 embers", "Combo x8", "Mirror shattered".
export function floater(p, x, y, text, color) {
  p.floaters.push({ x, y, text, color: color ?? '#ffe9a8', age: 0, life: 1.1 });
}

export function updateParticles(p, dt) {
  // Snow keeps falling at a steady rate.
  p.snowTimer += dt;
  while (p.snowTimer > 0.14) {
    p.snowTimer -= 0.14;
    p.snow.push({
      x: Math.random() * VIEW_W,
      y: -4,
      r: 0.8 + Math.random() * 1.8,
      speed: 14 + Math.random() * 22,
      drift: (Math.random() - 0.5) * 12,
      phase: Math.random() * Math.PI * 2,
    });
  }
  for (const f of p.snow) {
    f.y += f.speed * dt;
    f.x += (f.drift + Math.sin(f.phase + f.y * 0.01) * 6) * dt;
    f.phase += dt;
  }
  p.snow = p.snow.filter((f) => f.y < VIEW_H + 6 && f.x > -8 && f.x < VIEW_W + 8);

  for (const e of p.embers) {
    e.age += dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vy -= 8 * dt;
  }
  p.embers = p.embers.filter((e) => e.age < e.life);

  for (const s of p.sparks) {
    s.age += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 1 - 2.4 * dt;
    s.vy *= 1 - 2.4 * dt;
  }
  p.sparks = p.sparks.filter((s) => s.age < s.life);

  for (const f of p.floaters) {
    f.age += dt;
    f.y -= 26 * dt;
  }
  p.floaters = p.floaters.filter((f) => f.age < f.life);
}
