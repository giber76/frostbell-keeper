// The Keeper: the player walks the square with WASD or arrows, aims with
// the mouse, holds click to throw ember bolts, tolls the great bell with
// SPACE to freeze every frost creature for a few seconds — and, since v6,
// holds right-click (or Q) to sweep the lantern's light across the march.

import { BOARD, KEEPER, OIL_MAX, SWEEP } from './config.js';

export function makeKeeper() {
  return {
    x: 640, y: 500, angle: -Math.PI / 2,
    cooldown: 0, bellCooldown: 0, bellFlash: 0,
    walkPhase: 0, moving: false,
    // The lantern's oil: the sweep drinks it, the night refills it.
    oil: OIL_MAX, oilMax: OIL_MAX, sweeping: false, sweepHeld: 0, oilLocked: false,
  };
}

export function updateKeeper(k, dt, input, addBolt, audio, canSweep) {
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
  // The Lantern Sweep: hold right-click (or Q) and the lantern drinks oil
  // to hold its cone of light on the march. Empty oil ends the sweep at
  // once and locks the lantern until it has gathered again (SWEEP's
  // rechargeAt), so the light never flickers at the bottom of the tank;
  // the lantern refills while it rests. The sweep is a wave's tool
  // only — while building, the right button deselects instead.
  const wantSweep = canSweep !== false && (input.mouse.rightDown || input.down('q')) && k.oil > 0 && !k.oilLocked;
  k.sweeping = wantSweep;
  if (k.sweeping) {
    k.oil = Math.max(0, k.oil - SWEEP.drainPerSecond * dt);
    k.sweepHeld += dt;
    if (k.oil <= 0) { k.sweeping = false; k.oilLocked = true; }
  } else {
    k.oil = Math.min(k.oilMax, k.oil + SWEEP.refillPerSecond * dt);
    if (k.oilLocked && k.oil >= SWEEP.rechargeAt) k.oilLocked = false;
  }
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
// A blessing taken at dawn (Long Fuse, v6) holds the freeze longer —
// the caller passes the freeze length, defaulting to the Keeper's own.
export function tollBell(k, enemies, now, audio, freezeSeconds) {
  if (k.bellCooldown > 0) return false;
  k.bellCooldown = KEEPER.bellCooldownSeconds;
  k.bellFlash = 0.6;
  const freeze = freezeSeconds || KEEPER.bellFreezeSeconds;
  for (const e of enemies) {
    if (!e.dead && !e.leaked) e.frozenUntil = Math.max(e.frozenUntil, now + freeze);
  }
  audio.bell();
  return true;
}
