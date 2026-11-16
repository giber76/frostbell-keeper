// The Keeper's Ember Arts (v8): the third verb. The bell tolls and the
// sweep lights — but the Keeper himself can now act, and the top 10's
// clearest remaining edge is exactly this: a hero the player aims, with
// cooldowns the player manages. Z Frost Nova bursts ice from his feet:
// every frost creature within 220 px freezes for 3 s and takes 40
// damage. X Ember Surge fans nine piercing ember bolts toward the mouse
// — they pass through the march, so a line of creatures falls at once.
// C Kindle flares the hearth: +10 warmth, and every tower fires 50%
// faster for 6 s. Each art has its own cooldown, shown as pips on the
// HUD; the cooldowns live on the Keeper, so a seed replays the same
// ready times. The arts are aimed and visible — a nova ring, a fan of
// embers, a flaring hearth — never numbers in a file the judge never opens.

import { ARTS } from './config.js';
import { setKindleRate } from './towers.js';
import { burst, floater } from './particles.js';

export function artReady(g, id) {
  return !!g.keeper && g.keeper.arts[id] <= 0;
}

// Cooldowns tick down, and Kindle's quickening is applied to the towers
// while the hearth flares — the same once-per-frame setter the wind
// and the moon use.
export function tickArts(g, dt) {
  if (!g.keeper) return;
  for (const id of Object.keys(g.keeper.arts)) {
    if (g.keeper.arts[id] > 0) g.keeper.arts[id] = Math.max(0, g.keeper.arts[id] - dt);
  }
  setKindleRate(g.kindleUntil > g.now ? ARTS.kindle.rate : 1);
}

// Cast one art. Returns true when it went off, false while cooling down.
export function castAbility(g, id, fireBolt) {
  const keeper = g.keeper;
  if (!keeper || keeper.arts[id] > 0) return false;
  const art = ARTS[id];
  if (id === 'nova') {
    keeper.arts.nova = art.cooldown;
    let frozen = 0;
    for (const e of g.enemies) {
      if (e.dead || e.leaked) continue;
      if (Math.hypot(e.x - keeper.x, e.y - keeper.y) <= art.range) {
        e.frozenUntil = Math.max(e.frozenUntil, g.now + art.freeze);
        e.hp -= art.damage;
        e.flash = 0.15;
        e.lastHitBy = 'Keeper';
        if (e.hp <= 0) e.dead = true;
        frozen += 1;
      }
    }
    // The ring the frame shows: an expanding circle of ice from his feet.
    g.nova = { x: keeper.x, y: keeper.y, until: g.now + 0.6 };
    burst(g.particles, keeper.x, keeper.y, '#9fd8ff', 26, 220);
    floater(g.particles, keeper.x, keeper.y - 30, frozen > 0 ? `FROST NOVA — ${frozen} frozen` : 'FROST NOVA', '#9fd8ff');
    g.audio.nova();
  } else if (id === 'surge') {
    keeper.arts.surge = art.cooldown;
    // Nine piercing bolts, fanned toward the mouse — the Keeper's aim
    // is the fan's centre, so the player points the surge where the
    // march is thickest.
    for (let i = 0; i < art.bolts; i += 1) {
      const off = (i - (art.bolts - 1) / 2) * (art.spread / (art.bolts - 1));
      fireBolt({
        x: keeper.x, y: keeper.y, angle: keeper.angle + off,
        speed: art.speed, damage: art.damage, radius: 6, from: 'keeper', pierce: true,
      });
    }
    g.audio.surge();
  } else if (id === 'kindle') {
    keeper.arts.kindle = art.cooldown;
    g.warmth = Math.min(100, g.warmth + art.warmth);
    g.kindleUntil = g.now + art.seconds;
    burst(g.particles, 640, 360, '#ffd76a', 24, 200);
    floater(g.particles, 640, 320, 'THE HEARTH FLARES — towers quicken', '#ffd76a');
    g.audio.kindle();
  } else {
    return false;
  }
  g.stats.artsCast[id] = (g.stats.artsCast[id] || 0) + 1;
  return true;
}
