// The game itself: the state machine (title → build → wave → … → victory or
// defeat), the economy, the spawning, the bolts, and the scoring. The
// renderer only paints this state; nothing here draws.

import {
  BUILD_SECONDS, EARLY_START_BONUS, HEARTH_MAX_WARMTH, START_SHARDS,
  TOTAL_WAVES, TOWER_KEYS, TOWERS, WAVE_CLEAR_BONUS, KEEPER,
} from './config.js';
import { createRandom } from './random.js';
import { createWorld, pickSlot, pickTowerAt } from './world.js';
import { makeEnemy, waveSpawnList, updateEnemy } from './enemies.js';
import { makeTower, updateTower, upgradeCost, canUpgrade } from './towers.js';
import { makeKeeper, updateKeeper, tollBell } from './keeper.js';
import { makeParticles, spawnSnow, updateParticles, burst, floater } from './particles.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_BUILD = 'build';
export const SCREEN_WAVE = 'wave';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_DEFEAT = 'defeat';
export const SCREEN_PAUSED = 'paused';

export function createGame(seed, audio) {
  const random = createRandom(seed);
  const world = createWorld(random);
  const particles = makeParticles(random);
  spawnSnow(particles, 160);
  return {
    seed, random, world, particles, audio,
    screen: SCREEN_TITLE,
    prevScreen: SCREEN_BUILD,
    now: 0,
    wave: 0,
    score: 0,
    best: 0,
    shards: START_SHARDS,
    warmth: HEARTH_MAX_WARMTH,
    kills: 0,
    leakedTotal: 0,
    enemies: [],
    bolts: [],
    spawnQueue: [],
    spawnTimer: 0,
    buildTimer: BUILD_SECONDS,
    selectedKind: 'brazier',
    selectedPlot: null,
    message: '',
    messageUntil: 0,
    stats: { boltsFired: 0, bells: 0, built: 0, upgraded: 0 },
    difficulty: 'Keeper',
    muted: false,
  };
}

export function startGame(g, difficulty) {
  g.difficulty = difficulty || 'Keeper';
  const fresh = createGame(g.seed, g.audio);
  fresh.best = g.best;
  fresh.difficulty = g.difficulty;
  Object.keys(fresh).forEach((k) => { g[k] = fresh[k]; });
  g.screen = SCREEN_BUILD;
  g.wave = 0;
  g.buildTimer = BUILD_SECONDS;
  say(g, 'Build your defences — press ENTER when ready', 6);
}

function say(g, text, seconds) {
  g.message = text;
  g.messageUntil = g.now + (seconds || 3);
}

export function startWave(g) {
  if (g.wave >= TOTAL_WAVES) return;
  g.wave += 1;
  g.spawnQueue = waveSpawnList(g.wave, g.random);
  g.spawnTimer = 0.5;
  g.screen = SCREEN_WAVE;
  g.audio.horn();
  say(g, `Wave ${g.wave} of ${TOTAL_WAVES} — they come for the hearth!`, 3);
}

function endWave(g) {
  const bonus = WAVE_CLEAR_BONUS + g.wave * 10;
  g.score += bonus;
  g.shards += 12;
  g.audio.waveClear();
  if (g.wave >= TOTAL_WAVES) {
    g.score += g.warmth * 5;
    g.screen = SCREEN_VICTORY;
    g.audio.win();
    return;
  }
  g.screen = SCREEN_BUILD;
  g.buildTimer = BUILD_SECONDS;
  say(g, `Wave ${g.wave} held! +${bonus} score, +12 shards — build, then ENTER`, 4);
}

export function tryBuild(g, slot) {
  if (!slot) return false;
  if (slot.tower) { g.selectedPlot = slot; return true; }
  const kind = g.selectedKind;
  if (slot.kind === 'wall' && kind !== 'wall') {
    say(g, 'Road slots hold Snow Walls only — press 4', 2.5);
    g.audio.denied();
    return false;
  }
  if (slot.kind === 'plot' && kind === 'wall') {
    say(g, 'Snow Walls go on the road slots — click a road marker', 2.5);
    g.audio.denied();
    return false;
  }
  const cost = TOWERS[kind].cost;
  if (g.shards < cost) {
    say(g, `Not enough shards — ${TOWERS[kind].name} costs ${cost}`, 2.5);
    g.audio.denied();
    return false;
  }
  g.shards -= cost;
  slot.tower = makeTower(kind, slot.x, slot.y);
  g.stats.built += 1;
  g.audio.build();
  burst(g.particles, slot.x, slot.y, '#ffd76a', 12, 90);
  return true;
}

export function tryUpgrade(g) {
  const slot = g.selectedPlot;
  if (!slot || !slot.tower) return false;
  const tower = slot.tower;
  if (!canUpgrade(tower)) {
    say(g, tower.kind === 'wall' ? 'Snow Walls cannot be upgraded' : 'Already at level 3', 2);
    g.audio.denied();
    return false;
  }
  const cost = upgradeCost(tower);
  if (g.shards < cost) {
    say(g, `Upgrade costs ${cost} shards`, 2);
    g.audio.denied();
    return false;
  }
  g.shards -= cost;
  tower.level += 1;
  if (tower.kind === 'wall') { /* walls have no levels */ }
  tower.maxHp = Math.round((TOWERS[tower.kind].hp || 0) * (1 + 0.5 * (tower.level - 1)));
  tower.hp = tower.maxHp;
  g.stats.upgraded += 1;
  g.audio.build();
  burst(g.particles, tower.x, tower.y, '#7dffb2', 14, 110);
  floater(g.particles, tower.x, tower.y - 24, `LEVEL ${tower.level}`, '#7dffb2');
  return true;
}

function fireBolt(g, bolt) {
  g.bolts.push({ ...bolt, alive: true, hit: false });
  g.stats.boltsFired += 1;
}

function updateBolts(g, dt) {
  for (const b of g.bolts) {
    if (!b.alive) continue;
    if (b.target) {
      if (b.target.dead || b.target.leaked) { b.alive = false; continue; }
      const ang = Math.atan2(b.target.y - b.y, b.target.x - b.x);
      b.x += Math.cos(ang) * b.speed * dt;
      b.y += Math.sin(ang) * b.speed * dt;
      if (Math.hypot(b.target.x - b.x, b.target.y - b.y) < b.target.def.radius + b.radius) {
        b.target.hp -= b.damage;
        b.target.flash = 0.12;
        burst(g.particles, b.target.x, b.target.y, '#ff9a3d', 6, 120);
        if (b.target.hp <= 0) b.target.dead = true;
        b.alive = false;
      }
    } else {
      b.x += Math.cos(b.angle) * b.speed * dt;
      b.y += Math.sin(b.angle) * b.speed * dt;
      if (b.x < 200 || b.x > 1080 || b.y < 56 || b.y > 664) { b.alive = false; continue; }
      for (const e of g.enemies) {
        if (e.dead || e.leaked) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.def.radius + b.radius) {
          e.hp -= b.damage;
          e.flash = 0.12;
          e.burnUntil = Math.max(e.burnUntil, g.now + 0.8);
          e.burnDps = Math.max(e.burnDps, 6);
          burst(g.particles, e.x, e.y, '#ff9a3d', 5, 100);
          if (e.hp <= 0) e.dead = true;
          b.alive = false;
          break;
        }
      }
    }
  }
  g.bolts = g.bolts.filter((b) => b.alive);
}

function resolveDeaths(g) {
  for (const e of g.enemies) {
    if (e.dead) {
      g.kills += 1;
      g.shards += e.def.reward;
      g.score += e.def.score;
      burst(g.particles, e.x, e.y, e.def.color, 14, 140);
      floater(g.particles, e.x, e.y - 16, `+${e.def.reward}`, '#ffd76a');
      g.audio.kill();
    } else if (e.leaked) {
      g.warmth -= e.def.leak;
      g.leakedTotal += 1;
      burst(g.particles, e.x, e.y, '#9fd8ff', 18, 160);
      floater(g.particles, e.x, e.y - 16, `-${e.def.leak} warmth`, '#ff6b6b');
      g.audio.leak();
      if (g.warmth <= 0) {
        g.warmth = 0;
        g.screen = SCREEN_DEFEAT;
        g.audio.lose();
      }
    }
  }
  g.enemies = g.enemies.filter((e) => !e.dead && !e.leaked);
}

function handleBuildInput(g, input) {
  for (const kind of TOWER_KEYS) {
    if (input.wasPressed(TOWERS[kind].key)) g.selectedKind = kind;
  }
  if (input.action('upgrade')) tryUpgrade(g);
  if (input.mouse.clicked) {
    const slot = pickSlot(g.world, input.mouse.x, input.mouse.y);
    if (slot) {
      tryBuild(g, slot);
    } else {
      const towerSlot = pickTowerAt(g.world, input.mouse.x, input.mouse.y);
      if (towerSlot) g.selectedPlot = towerSlot;
      else g.selectedPlot = null;
    }
  }
  if (input.mouse.rightClicked) g.selectedPlot = null;
}

function updateWavePlay(g, dt, input) {
  // Spawning.
  if (g.spawnQueue.length > 0) {
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      const next = g.spawnQueue.shift();
      const waveScale = g.difficulty === 'Gentle' ? 0.85 : g.difficulty === 'Scorched' ? 1.2 : 1;
      const enemy = makeEnemy(next.kind, next.lane, g.wave, g.random);
      enemy.hp = Math.round(enemy.hp * waveScale);
      enemy.maxHp = enemy.hp;
      g.enemies.push(enemy);
      g.spawnTimer = Math.max(0.35, (requireWaveInterval(g.wave)) * (0.9 + g.random.next() * 0.2));
    }
  }
  // Keeper + towers + enemies + bolts.
  updateKeeper(g.keeper, dt, input, (b) => fireBolt(g, b), g.audio);
  if (input.action('bell')) {
    if (tollBell(g.keeper, g.enemies, g.now, g.audio)) {
      g.stats.bells += 1;
      burst(g.particles, g.keeper.x, g.keeper.y, '#9fd8ff', 20, 200);
    }
  }
  for (const slot of [...g.world.plots, ...g.world.walls]) {
    if (!slot.tower) continue;
    const events = updateTower(slot.tower, dt, g.now, g.enemies, (b) => fireBolt(g, b));
    for (const ev of events) {
      if (ev.type === 'burn') burst(g.particles, ev.x, ev.y - 10, '#ff7a1a', 3, 40);
      if (ev.type === 'ring') burst(g.particles, ev.x, ev.y - 14, '#9fd8ff', 8, 90);
    }
  }
  for (const e of g.enemies) updateEnemy(e, dt, g.now, g.world);
  updateBolts(g, dt);
  resolveDeaths(g);
  if (g.screen === SCREEN_DEFEAT) return;
  if (g.spawnQueue.length === 0 && g.enemies.length === 0) endWave(g);
}

function requireWaveInterval(wave) {
  const waves = [
    1.6, 1.4, 1.25, 1.15, 1.05, 0.95, 0.9, 0.85, 0.8, 0.75,
  ];
  return waves[wave - 1] || 1;
}

export function updateGame(g, dt, input) {
  g.now += dt;
  updateParticles(g.particles, dt, g.now, { x: 640, y: 360 });
  if (g.messageUntil < g.now) g.message = '';
  if (input.action('mute')) {
    g.muted = g.audio.toggleMute();
  }
  if (g.screen === SCREEN_TITLE) {
    if (input.mouse.clicked) {
      const m = input.mouse;
      if (m.x > 540 && m.x < 740 && m.y > 330 && m.y < 392) {
        g.audio.unlock();
        g.audio.startCrackle();
        startGame(g, g.difficulty);
      } else if (m.x > 420 && m.x < 520 && m.y > 410 && m.y < 452) {
        g.difficulty = 'Gentle';
      } else if (m.x > 540 && m.x < 640 && m.y > 410 && m.y < 452) {
        g.difficulty = 'Keeper';
      } else if (m.x > 660 && m.x < 780 && m.y > 410 && m.y < 452) {
        g.difficulty = 'Scorched';
      }
    }
    if (input.action('confirm')) {
      g.audio.unlock();
      g.audio.startCrackle();
      startGame(g, g.difficulty);
    }
    return;
  }
  if (g.screen === SCREEN_PAUSED) {
    if (input.action('pause') || input.action('confirm')) g.screen = g.prevScreen;
    return;
  }
  if (g.screen === SCREEN_VICTORY || g.screen === SCREEN_DEFEAT) {
    if (input.action('restart') || input.mouse.clicked) {
      const m = input.mouse;
      const inButton = m.x > 540 && m.x < 740 && m.y > 520 && m.y < 572;
      if (input.action('restart') || inButton) startGame(g, g.difficulty);
    }
    return;
  }
  if (input.action('pause')) {
    g.prevScreen = g.screen;
    g.screen = SCREEN_PAUSED;
    return;
  }
  if (g.screen === SCREEN_BUILD) {
    if (!g.keeper) g.keeper = makeKeeper();
    handleBuildInput(g, input);
    updateKeeper(g.keeper, dt, input, () => {}, g.audio);
    g.buildTimer -= dt;
    if (input.action('confirm')) {
      g.shards += EARLY_START_BONUS;
      say(g, `Early start! +${EARLY_START_BONUS} shards`, 2);
      startWave(g);
      return;
    }
    if (g.buildTimer <= 0) startWave(g);
    return;
  }
  if (g.screen === SCREEN_WAVE) {
    if (!g.keeper) g.keeper = makeKeeper();
    handleBuildInput(g, input);
    updateWavePlay(g, dt, input);
  }
}

// A headless self-test: plays the game with a simple scripted strategy and
// reports whether the loop works (waves clear, kills happen, no crash). The
// harness runs this in a browser with ?selftest=1 and reads document.title.
export function runSelfTest(g) {
  const errors = [];
  try {
    startGame(g, 'Keeper');
    // Scripted builder: braziers near the hearth, cannons on the flanks,
    // walls on every road, then start the waves.
    const buildOrder = [
      ['brazier', 520, 250], ['brazier', 760, 250], ['brazier', 520, 470], ['brazier', 760, 470],
      ['cannon', 300, 150], ['cannon', 980, 150], ['cannon', 300, 570], ['cannon', 980, 570],
      ['bell', 420, 250], ['bell', 860, 470],
    ];
    // Grant the test enough shards to build the plan (the real game earns them).
    g.shards = 1000;
    for (const [kind, x, y] of buildOrder) {
      g.selectedKind = kind;
      const slot = pickSlot(g.world, x, y);
      if (slot) tryBuild(g, slot);
    }
    for (const w of g.world.walls) {
      g.selectedKind = 'wall';
      if (!w.tower) tryBuild(g, w);
    }
    g.shards = 60;
    // Play: 10 waves, keeper auto-aims at the nearest creature, bell on cooldown.
    const fakeInput = {
      keys: new Set(), pressed: new Set(),
      mouse: { x: 640, y: 360, down: true, clicked: false, rightClicked: false },
      down: () => false,
      wasPressed: () => false,
      action: (name) => name === 'confirm' && g.screen === SCREEN_BUILD,
      endFrame: () => {},
    };
    let steps = 0;
    let wavesCleared = 0;
    let lastWave = 0;
    let maintainedWave = -1;
    while (steps < 60 * 60 * 14 && g.screen !== SCREEN_VICTORY && g.screen !== SCREEN_DEFEAT) {
      // Between waves, a real player spends: rebuild chewed walls, upgrade towers.
      if (g.screen === SCREEN_BUILD && maintainedWave !== g.wave) {
        maintainedWave = g.wave;
        for (const w of g.world.walls) {
          if (!w.tower && g.shards >= TOWERS.wall.cost) {
            g.selectedKind = 'wall';
            tryBuild(g, w);
          }
        }
        for (const p of g.world.plots) {
          if (p.tower && canUpgrade(p.tower)) {
            g.selectedPlot = p;
            while (canUpgrade(p.tower) && g.shards > 80) tryUpgrade(g);
          }
        }
        g.selectedPlot = null;
      }
      // Aim at the nearest living creature.
      let best = null;
      let bestD = 1e9;
      for (const e of g.enemies) {
        const d = Math.hypot(e.x - g.keeper.x, e.y - g.keeper.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) { fakeInput.mouse.x = best.x; fakeInput.mouse.y = best.y; }
      if (g.screen === SCREEN_BUILD) fakeInput.action = (name) => name === 'confirm';
      else fakeInput.action = (name) => name === 'bell' && g.keeper.bellCooldown <= 0;
      if (g.wave > lastWave) { wavesCleared = g.wave; lastWave = g.wave; }
      updateGame(g, 1 / 60, fakeInput);
      steps += 1;
    }
    const ok = g.screen === SCREEN_VICTORY || wavesCleared >= 3;
    return {
      ok,
      screen: g.screen,
      wavesCleared,
      kills: g.kills,
      score: g.score,
      warmth: g.warmth,
      steps,
      errors,
    };
  } catch (err) {
    errors.push(String(err && err.stack || err));
    return { ok: false, screen: g.screen, errors };
  }
}
