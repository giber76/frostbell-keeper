// FROSTBELL v9 — the game itself. The keeper no longer stands back and
// lets towers do the work: the hearth's light is a beam the player aims
// with the mouse, sweeps across the field, focuses with SPACE, and bounces
// off ice mirrors the player places and turns. Everything else — the ten
// nights, the frost march, the dawn gifts, the win and lose — hangs off
// that one verb: steer the light.
//
// The renderer only paints this state; nothing here draws.

import {
  BEAM, ECONOMY, ENEMY_KINDS, HEARTH, HEARTH_MAX_HP, MIRROR, NIGHTS,
  VIEW_W, VIEW_H,
} from './config.js';
import { makeRng } from './random.js';
import {
  createMirrorSet, canPlace, placeMirror, mirrorAt, rotateSelected,
  removeSelected, selectedMirror,
} from './mirrors.js';
import { castBeam, distToSegment, pointInBeam } from './beam.js';
import {
  spawnEnemy, spawnPoint, moveEnemy, enemyAtHearth,
} from './enemies.js';
import {
  nightComposition, nightInterval, nightHpMult, offerUpgrades,
  NIGHT_NAMES, UPGRADES,
} from './nights.js';
import {
  makeParticles, seedSnow, spawnEmber, burst, floater, updateParticles,
} from './particles.js';

// Local numbers the config does not own: the focus meter, the build
// clock, the early-start bonus, the glimmer shard's value.
const FOCUS_MAX = 100;
const FOCUS_LOCK = 40;
const BUILD_SECONDS = 25;
const EARLY_START_BONUS = 15;
const SHARD_VALUE = 6;
const SPAWN_SIDES = ['top', 'left', 'right'];

export const SCREEN_TITLE = 'title';
export const SCREEN_BUILD = 'build';
export const SCREEN_NIGHT = 'night';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_DEFEAT = 'defeat';
export const SCREEN_PAUSED = 'paused';

// One fresh game. The seed only drives the nights' spawns and the gift
// offers — the snow and embers use Math.random, so they never touch the
// night's determinism.
export function createGame(seed, audio) {
  const rng = makeRng(seed);
  const particles = makeParticles();
  seedSnow(particles, 150);
  return {
    seed, rng, particles, audio,
    screen: SCREEN_TITLE,
    prevScreen: SCREEN_BUILD,
    now: 0,
    night: 0,
    score: 0,
    best: 0,
    embers: ECONOMY.startEmbers,
    hearthHp: HEARTH_MAX_HP,
    // The focus meter: holding SPACE drains it, releasing refills it.
    // Run it dry and it locks until it recovers to 40.
    focus: FOCUS_MAX,
    focusLocked: false,
    mirrors: createMirrorSet(),
    maxMirrors: MIRROR.startCount,
    damageMult: 1,
    focusDrainMult: 1,
    prismMult: 1,
    sweepDamageMult: 1,
    sweepWidthMult: 1,
    enemies: [],
    bolts: [],
    shards: [],
    spawnQueue: [],
    spawnTimer: 0,
    shardTimer: 6,
    spawnSide: 0,
    buildTimer: BUILD_SECONDS,
    upgradeOffer: null,
    upgradePicked: false,
    beam: null,
    beamAngle: -Math.PI / 2,
    focusing: false,
    kills: 0,
    killsByKind: {},
    combo: 0,
    comboUntil: 0,
    bestCombo: 0,
    feed: [],
    message: '',
    messageUntil: 0,
    stats: {
      mirrorsPlaced: 0,
      mirrorsRemoved: 0,
      focusSeconds: 0,
      shardsCollected: 0,
      giftsTaken: 0,
      nightsCleared: 0,
    },
    muted: false,
  };
}

function say(g, text, seconds) {
  g.message = text;
  g.messageUntil = g.now + (seconds ?? 3);
}

export function startGame(g) {
  const fresh = createGame(g.seed, g.audio);
  fresh.best = g.best;
  for (const k of Object.keys(fresh)) g[k] = fresh[k];
  g.screen = SCREEN_BUILD;
  g.night = 0;
  g.buildTimer = BUILD_SECONDS;
  g.upgradeOffer = offerUpgrades(g.rng, 3);
  g.upgradePicked = false;
  say(g, 'Place ice mirrors with a click — then press ENTER when the night is ready', 6);
}

// Take one of the three dawn gifts offered between nights. Each gift
// knows how to apply itself (nights.js) — the game only counts it.
export function takeUpgrade(g, index) {
  if (!g.upgradeOffer || g.upgradePicked) return false;
  const up = g.upgradeOffer[index];
  if (!up) return false;
  up.apply(g);
  g.upgradePicked = true;
  g.stats.giftsTaken += 1;
  g.upgradeOffer = null;
  say(g, `Dawn gift taken: ${up.name} — ${up.blurb}`, 4);
  g.audio.pickUpgrade();
  return true;
}

export function startNight(g) {
  if (g.night >= NIGHTS) return;
  g.night += 1;
  g.spawnQueue = nightComposition(g.night, g.rng);
  g.spawnTimer = 0.8;
  g.shardTimer = 6;
  g.spawnSide = 0;
  g.screen = SCREEN_NIGHT;
  g.audio.nightStart();
  say(g, `${NIGHT_NAMES[g.night - 1]}`, 4);
}

function endNight(g) {
  const bonus = ECONOMY.nightBonus + g.night * 10;
  g.score += bonus;
  g.embers += 12;
  g.stats.nightsCleared += 1;
  g.audio.nightClear();
  if (g.night >= NIGHTS) {
    g.score += g.hearthHp * 5;
    g.screen = SCREEN_VICTORY;
    g.audio.victory();
    return;
  }
  g.upgradeOffer = offerUpgrades(g.rng, 3);
  g.upgradePicked = false;
  g.screen = SCREEN_BUILD;
  g.buildTimer = BUILD_SECONDS;
  const next = NIGHT_NAMES[g.night];
  say(g, `Night ${g.night} held! +${bonus} score, +12 embers — take a gift, place mirrors, then ENTER for ${next}`, 5);
}

// One enemy dies to the beam. Rewards, combo, the tale, the sparks.
function killEnemy(g, e, focused) {
  g.kills += 1;
  g.killsByKind[e.kind] = (g.killsByKind[e.kind] || 0) + 1;
  g.embers += e.embers;
  g.combo = g.now <= g.comboUntil ? g.combo + 1 : 1;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  g.comboUntil = g.now + 2.5;
  const mult = 1 + Math.min(g.combo - 1, 8) * 0.25;
  g.score += Math.round(e.score * mult);
  if (g.combo >= 4) {
    g.feed.push(`The light burned ${g.combo} in a row`);
    if (g.feed.length > 3) g.feed.shift();
  }
  burst(g.particles, e.x, e.y, focused);
  floater(g.particles, e.x, e.y - 14, `+${e.embers}`, '#ffd76a');
  g.audio.kill();
  if (e.kind === 'matriarch') {
    g.feed.push('The Frost Matriarch is broken — dawn comes');
    if (g.feed.length > 3) g.feed.shift();
  }
}

// The beam's damage for one enemy this tick. Focused light burns hot;
// sweep light is wide and cool; armor shrugs off the sweep but not the
// focus; light that has already bounced off a mirror (prism) hits harder.
// `bounce` is the segment the enemy was caught on: 0 is the direct beam.
function beamDamageFor(g, e, bounce) {
  let dps = g.focusing ? BEAM.focusDps : BEAM.sweepDps;
  dps *= g.damageMult;
  if (!g.focusing) dps *= g.sweepDamageMult;
  if (bounce >= 1) dps *= g.prismMult;
  if (e.armored && !g.focusing) dps *= 0.25;
  return dps;
}

// Which segment of the beam touches this enemy, and on which bounce —
// or -1 when the light misses it entirely.
function beamBounceHit(segments, e, halfWidth) {
  let best = -1;
  for (const seg of segments) {
    if (distToSegment(e.x, e.y, seg) < e.radius + halfWidth) {
      if (best === -1 || seg.bounce < best) best = seg.bounce;
    }
  }
  return best;
}

// The night's combat: aim, focus meter, beam damage, kills, the march,
// the boss's bolts, the glimmer shards the beam gathers.
function updateNight(g, dt, input) {
  // Aim: the beam follows the mouse from the hearth, always.
  const m = input.mouse;
  g.beamAngle = Math.atan2(m.y - HEARTH.y, m.x - HEARTH.x);
  const wantFocus = input.down(' ') || input.mouse.down;
  g.focusing = false;
  if (wantFocus && !g.focusLocked) {
    g.focusing = true;
    g.focus -= BEAM.focusDrain * g.focusDrainMult * dt;
    g.stats.focusSeconds += dt;
    if (g.focus <= 0) {
      g.focus = 0;
      g.focusLocked = true;
      g.focusing = false;
      say(g, 'The light is spent — let it breathe back to 40', 2.5);
      g.audio.denied();
    }
  } else {
    g.focus = Math.min(FOCUS_MAX, g.focus + BEAM.focusRegen * dt);
    if (g.focusLocked && g.focus >= FOCUS_LOCK) g.focusLocked = false;
  }

  // The beam itself, cast fresh every tick from the hearth.
  const width = (g.focusing ? BEAM.focusWidth : BEAM.sweepWidth * g.sweepWidthMult);
  const segments = castBeam({ x: HEARTH.x, y: HEARTH.y }, g.beamAngle, g.mirrors.list);
  g.beam = { segments, width, focusing: g.focusing };
  g.audio.setBeam(g.focusing ? 1 : 0.3);

  // Damage: every enemy the beam touches burns.
  for (const e of g.enemies) {
    const bounce = beamBounceHit(segments, e, width / 2);
    if (bounce < 0) continue;
    const dps = beamDamageFor(g, e, bounce);
    e.hp -= dps * dt;
    e.flash = 0.1;
    if (e.hp <= 0) e.dead = true;
  }

  // Spawning: the march comes in from the top, left and right in turn.
  if (g.spawnQueue.length > 0) {
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      const kind = g.spawnQueue.shift();
      const side = SPAWN_SIDES[g.spawnSide % SPAWN_SIDES.length];
      g.spawnSide += 1;
      const pt = spawnPoint(g.rng, side);
      const e = spawnEnemy(kind, pt.x, pt.y, nightHpMult(g.night));
      g.enemies.push(e);
      g.spawnTimer = nightInterval(g.night) * (0.9 + g.rng.next() * 0.2);
    }
  }

  // The march. moveEnemy returns 'holding' when the Matriarch has
  // stopped at range — that is when she throws ice at the hearth.
  for (const e of g.enemies) {
    const state = moveEnemy(e, dt);
    if (enemyAtHearth(e)) {
      g.hearthHp -= e.damage;
      e.leaked = true;
      burst(g.particles, e.x, e.y, false);
      floater(g.particles, e.x, e.y - 14, `-${e.damage} warmth`, '#ff6b6b');
      g.audio.hearthHit();
      if (g.hearthHp <= 0) {
        g.hearthHp = 0;
        g.screen = SCREEN_DEFEAT;
        g.audio.defeat();
        return;
      }
    }
    if (state === 'holding' && !e.dead && !e.leaked) {
      e.boltTimer -= dt;
      if (e.boltTimer <= 0) {
        e.boltTimer = 2.8;
        const ang = Math.atan2(HEARTH.y - e.y, HEARTH.x - e.x);
        g.bolts.push({ x: e.x, y: e.y, angle: ang, speed: 260, radius: 6, alive: true });
        g.audio.bossBolt();
      }
    }
  }

  // Boss bolts fly; one that reaches the hearth steals warmth.
  for (const b of g.bolts) {
    if (!b.alive) continue;
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    if (Math.hypot(b.x - HEARTH.x, b.y - HEARTH.y) < HEARTH.r + b.radius) {
      b.alive = false;
      g.hearthHp -= 5;
      burst(g.particles, HEARTH.x, HEARTH.y - 20, false);
      floater(g.particles, HEARTH.x, HEARTH.y - 40, '-6 warmth', '#ff6b6b');
      g.audio.hearthHit();
      if (g.hearthHp <= 0) {
        g.hearthHp = 0;
        g.screen = SCREEN_DEFEAT;
        g.audio.defeat();
        return;
      }
    }
    if (b.x < 0 || b.x > VIEW_W || b.y < 0 || b.y > VIEW_H) b.alive = false;
  }
  g.bolts = g.bolts.filter((b) => b.alive);

  // Glimmer shards drift down; the beam gathers them.
  g.shardTimer -= dt;
  if (g.shardTimer <= 0 && g.shards.length < 3) {
    g.shardTimer = 7;
    g.shards.push({
      x: 280 + g.rng.next() * 720,
      y: 60,
      vy: 12,
      age: 0,
      value: SHARD_VALUE,
    });
  }
  for (const s of g.shards) {
    s.age += dt;
    s.y += s.vy * dt;
    s.x += Math.sin(s.age * 1.5) * 8 * dt;
    if (pointInBeam(s.x, s.y, segments, 10)) {
      s.collected = true;
      g.embers += s.value;
      g.stats.shardsCollected += 1;
      floater(g.particles, s.x, s.y - 10, `+${s.value} embers`, '#9fd8ff');
      g.audio.coin();
    }
  }
  g.shards = g.shards.filter((s) => !s.collected && s.y < VIEW_H - 40);

  // Deaths.
  for (const e of g.enemies) {
    if (e.dead) killEnemy(g, e, g.focusing);
  }
  g.enemies = g.enemies.filter((e) => !e.dead && !e.leaked);
  if (g.screen === SCREEN_DEFEAT) return;
  if (g.spawnQueue.length === 0 && g.enemies.length === 0) endNight(g);
}

// The build phase: place, turn and remove mirrors; take a gift; start.
function handleBuildInput(g, input) {
  const m = input.mouse;
  // Gift cards: click, or keys 1/2/3.
  if (g.upgradeOffer && !g.upgradePicked) {
    if (input.wasPressed('1')) takeUpgrade(g, 0);
    else if (input.wasPressed('2')) takeUpgrade(g, 1);
    else if (input.wasPressed('3')) takeUpgrade(g, 2);
    else if (m.clicked) {
      const card = giftCardAt(m.x, m.y);
      if (card >= 0) takeUpgrade(g, card);
    }
  }
  // Mirror keys: Q/E turn the selected mirror, wheel turns it too.
  if (input.wasPressed('q')) rotateSelected(g.mirrors, -MIRROR.rotateStep);
  if (input.wasPressed('e')) rotateSelected(g.mirrors, MIRROR.rotateStep);
  if (input.wheel !== 0) rotateSelected(g.mirrors, input.wheel * MIRROR.wheelStep);
  // Right-click removes the selected mirror and refunds most of its cost.
  if (m.rightClicked) {
    const sel = selectedMirror(g.mirrors);
    if (sel) {
      removeSelected(g.mirrors);
      g.embers += MIRROR.refund;
      g.stats.mirrorsRemoved += 1;
      say(g, `Mirror lifted — ${MIRROR.refund} embers back`, 2);
      g.audio.removeMirror();
    }
  }
  // Left-click: pick a mirror, or place a new one on empty ground.
  if (m.clicked) {
    if (g.upgradeOffer && !g.upgradePicked && giftCardAt(m.x, m.y) >= 0) return;
    const hit = mirrorAt(g.mirrors, m.x, m.y);
    if (hit) {
      g.mirrors.selected = hit.id;
      return;
    }
    const check = canPlace(g.mirrors, m.x, m.y, g.embers, g.maxMirrors);
    if (!check.ok) {
      say(g, check.why, 2.5);
      g.audio.denied();
      return;
    }
    placeMirror(g.mirrors, m.x, m.y);
    g.embers -= MIRROR.cost;
    g.stats.mirrorsPlaced += 1;
    say(g, 'Ice mirror set — drag the mouse to aim the beam, Q/E to turn it', 2.5);
    g.audio.placeMirror();
  }
}

// The gift cards sit across the middle of the board while the offer is
// open; the click zones here must match the renderer's cards exactly.
export function giftCardAt(x, y) {
  if (y < 300 || y > 430) return -1;
  for (let i = 0; i < 3; i += 1) {
    const cx = 340 + i * 200;
    if (x >= cx && x <= cx + 180) return i;
  }
  return -1;
}

export function updateGame(g, dt, input) {
  g.now += dt;
  updateParticles(g.particles, dt);
  // The hearth's embers rise while the game runs — title screen included.
  if (g.screen !== SCREEN_DEFEAT) spawnEmber(g.particles, HEARTH.x, HEARTH.y, 1);
  if (g.messageUntil < g.now) g.message = '';
  if (input.action('mute')) g.muted = g.audio.toggleMute();

  if (g.screen === SCREEN_TITLE) {
    if (input.mouse.clicked) {
      const m2 = input.mouse;
      if (m2.x > 540 && m2.x < 740 && m2.y > 330 && m2.y < 392) {
        g.audio.unlock();
        startGame(g);
      }
    }
    if (input.action('confirm')) {
      g.audio.unlock();
      startGame(g);
    }
    return;
  }
  if (g.screen === SCREEN_PAUSED) {
    if (input.action('pause') || input.action('confirm')) g.screen = g.prevScreen;
    return;
  }
  if (g.screen === SCREEN_VICTORY || g.screen === SCREEN_DEFEAT) {
    const m = input.mouse;
    const inPlayAgain = m.x > 540 && m.x < 740 && m.y > 520 && m.y < 572;
    if (input.action('restart') || (m.clicked && inPlayAgain)) startGame(g);
    return;
  }
  if (input.action('pause')) {
    g.prevScreen = g.screen;
    g.screen = SCREEN_PAUSED;
    return;
  }
  if (g.screen === SCREEN_BUILD) {
    // The beam is always visible, even while building — the player aims
    // and places mirrors against it, so the build phase is already play.
    g.beamAngle = Math.atan2(input.mouse.y - HEARTH.y, input.mouse.x - HEARTH.x);
    g.focusing = false;
    const segments = castBeam({ x: HEARTH.x, y: HEARTH.y }, g.beamAngle, g.mirrors.list);
    g.beam = { segments, width: BEAM.sweepWidth * g.sweepWidthMult, focusing: false };
    g.audio.setBeam(0.3);
    handleBuildInput(g, input);
    g.buildTimer -= dt;
    if (input.action('confirm')) {
      if (g.upgradeOffer && !g.upgradePicked) {
        say(g, 'Take a dawn gift first — click a card, or press 1, 2 or 3', 2.5);
        return;
      }
      g.embers += EARLY_START_BONUS;
      say(g, `Early start! +${EARLY_START_BONUS} embers`, 2);
      startNight(g);
      return;
    }
    if (g.buildTimer <= 0) {
      if (g.upgradeOffer && !g.upgradePicked) takeUpgrade(g, 0);
      startNight(g);
    }
    return;
  }
  if (g.screen === SCREEN_NIGHT) {
    // In a night the player can still lift a mirror with a right-click —
    // the beam is the weapon, and the mirrors are part of it.
    if (input.mouse.rightClicked) {
      const sel = selectedMirror(g.mirrors);
      if (sel) {
        removeSelected(g.mirrors);
        g.embers += MIRROR.refund;
        g.stats.mirrorsRemoved += 1;
        say(g, `Mirror lifted — ${MIRROR.refund} embers back`, 2);
        g.audio.removeMirror();
      }
    }
    if (input.mouse.clicked) {
      const hit = mirrorAt(g.mirrors, input.mouse.x, input.mouse.y);
      if (hit) g.mirrors.selected = hit.id;
    }
    if (input.wasPressed('q')) rotateSelected(g.mirrors, -MIRROR.rotateStep);
    if (input.wasPressed('e')) rotateSelected(g.mirrors, MIRROR.rotateStep);
    if (input.wheel !== 0) rotateSelected(g.mirrors, input.wheel * MIRROR.wheelStep);
    updateNight(g, dt, input);
  }
}

// A headless self-test: plays all ten nights with a scripted keeper and
// reports whether the loop works — nights clear, kills happen, no crash.
// The harness runs this with ?selftest=1 and reads document.title.
export function runSelfTest(g) {
  const errors = [];
  try {
    startGame(g);
    // The scripted keeper places four mirrors in a diamond above the
    // hearth: two at +45° turning the beam left, two at -45° turning it
    // right, so the beam can reach around the frost pillars.
    g.embers = 400;
    const plan = [
      [520, 470, Math.PI / 4],
      [760, 470, -Math.PI / 4],
      [400, 300, Math.PI / 4],
      [880, 300, -Math.PI / 4],
    ];
    for (const [x, y, a] of plan) {
      const mm = placeMirror(g.mirrors, x, y);
      mm.angle = a;
      g.embers -= MIRROR.cost;
      g.stats.mirrorsPlaced += 1;
    }
    g.embers = 60;
    const fakeInput = {
      keys: new Set(), pressed: new Set(),
      mouse: { x: 640, y: 360, down: false, clicked: false, rightClicked: false },
      wheel: 0,
      down: (n) => n === ' ' && fakeInput.mouse.down,
      wasPressed: () => false,
      action: (name) => name === 'confirm' && g.screen === SCREEN_BUILD,
      endFrame: () => {},
    };
    let steps = 0;
    let nightsCleared = 0;
    let lastNight = 0;
    let maintainedNight = -1;
    // Thirty minutes of sim time is the cap; ten nights take less.
    while (steps < 60 * 60 * 30 && g.screen !== SCREEN_VICTORY && g.screen !== SCREEN_DEFEAT) {
      if (g.screen === SCREEN_BUILD && maintainedNight !== g.night) {
        maintainedNight = g.night;
        if (g.upgradeOffer && !g.upgradePicked) takeUpgrade(g, 0);
      }
      // Aim: first anything close to the hearth — that is the emergency.
      // Then the Matriarch, when nothing is at the door: she holds off
      // at range and throws ice at the hearth, so she cannot be ignored
      // for long. Otherwise the nearest creature.
      let best = null;
      let bestD = 1e9;
      for (const e of g.enemies) {
        const d = Math.hypot(e.x - HEARTH.x, e.y - HEARTH.y);
        if (d < 260 && d < bestD) { bestD = d; best = e; }
      }
      if (!best) best = g.enemies.find((e) => e.kind === 'matriarch');
      if (!best) {
        for (const e of g.enemies) {
          const d = Math.hypot(e.x - HEARTH.x, e.y - HEARTH.y);
          if (d < bestD) { bestD = d; best = e; }
        }
      }
      if (best) {
        fakeInput.mouse.x = best.x;
        fakeInput.mouse.y = best.y;
        fakeInput.mouse.down = best.armored || best.boss || g.focus > 85;
      } else {
        fakeInput.mouse.x = 640;
        fakeInput.mouse.y = 200;
        fakeInput.mouse.down = false;
      }
      if (g.night > lastNight) { nightsCleared = g.night; lastNight = g.night; }
      updateGame(g, 1 / 60, fakeInput);
      steps += 1;
    }
    const ok = g.screen === SCREEN_VICTORY || nightsCleared >= 3;
    return {
      ok,
      screen: g.screen,
      nightsCleared,
      kills: g.kills,
      score: g.score,
      hearthHp: g.hearthHp,
      steps,
      killsByKind: g.killsByKind,
      bestCombo: g.bestCombo,
      mirrorsPlaced: g.stats.mirrorsPlaced,
      focusSeconds: Math.round(g.stats.focusSeconds),
      shardsCollected: g.stats.shardsCollected,
      giftsTaken: g.stats.giftsTaken,
      errors,
    };
  } catch (err) {
    errors.push(String((err && err.stack) || err));
    return { ok: false, screen: g.screen, errors };
  }
}
