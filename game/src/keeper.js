// The Keeper: the player walks the square with WASD or arrows, aims with
// the mouse, holds click to throw ember bolts, and tolls the great bell with
// SPACE to freeze every frost creature for a few seconds.

import { BOARD, KEEPER } from './config.js';

export function makeKeeper() {
  return {
    x: 640, y: 500, angle: -Math.PI / 2,
    cooldown: 0, bellCooldown: 0, bellFlash: 0,
    walkPhase: 0, moving: false,
  };
}

export function updateKeeper(k, dt, input, addBolt, audio) {
  let mx = 0;
  let my = 0;
  if (input.down('w', 'arrowup')) my -= 1;
  if (input.down('s', 'arrowdown')) my += 1;
  if (input.down('a', 'arrowleft')) mx -= 1;
  if (input.down('d', 'arrowright')) mx += 1;
  k.moving = mx !== 0 || my !== 0;
  if (k.moving) {
    const len = Math.hypot(mx, my);
    k.x += (mx / len) * KEEPER.speed * dt;
    k.y += (my / len) * KEEPER.speed * dt;
    k.walkPhase += dt * 10;
  }
  k.x = Math.max(BOARD.x + 16, Math.min(BOARD.x + BOARD.w - 16, k.x));
  k.y = Math.max(BOARD.y + 16, Math.min(BOARD.y + BOARD.h - 16, k.y));
  k.angle = Math.atan2(input.mouse.y - k.y, input.mouse.x - k.x);
  if (k.cooldown > 0) k.cooldown -= dt;
  if (k.bellCooldown > 0) k.bellCooldown -= dt;
  if (k.bellFlash > 0) k.bellFlash -= dt;
  if (input.mouse.down && k.cooldown <= 0) {
    k.cooldown = KEEPER.boltRate;
    addBolt({
      x: k.x + Math.cos(k.angle) * 18, y: k.y + Math.sin(k.angle) * 18,
      angle: k.angle, speed: KEEPER.boltSpeed,
      damage: KEEPER.boltDamage, radius: KEEPER.boltRadius, from: 'keeper',
    });
    audio.shoot();
  }
  return false;
}

// The bell toll: freeze the whole march. Returns true when it fires.
export function tollBell(k, enemies, now, audio) {
  if (k.bellCooldown > 0) return false;
  k.bellCooldown = KEEPER.bellCooldownSeconds;
  k.bellFlash = 0.6;
  for (const e of enemies) {
    if (!e.dead && !e.leaked) e.frozenUntil = Math.max(e.frozenUntil, now + KEEPER.bellFreezeSeconds);
  }
  audio.bell();
  return true;
}
