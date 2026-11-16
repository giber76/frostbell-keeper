// The game itself: the state machine (title → build → wave → … → victory or
// defeat), the economy, the spawning, the bolts, and the scoring. The
// renderer only paints this state; nothing here draws.

import {
  BUILD_SECONDS, EARLY_START_BONUS, HEARTH_MAX_WARMTH, START_SHARDS,
  TOTAL_WAVES, TOWER_KEYS, TOWERS, WAVE_CLEAR_BONUS, KEEPER, WAVES,
  BOONS,
} from './config.js';
import { moonForWave, setMoon, applyMoon, moonKeeperMult } from './moon.js';
import { beginWard, extendWard, endWard, applyWards, wardCost, wardLength } from './wards.js';
import { createRandom } from './random.js';
import { createWorld, pickSlot, pickTowerAt } from './world.js';
import { makeEnemy, waveSpawnList, updateEnemy } from './enemies.js';
import { makeTower, updateTower, upgradeCost, canUpgrade, setWind, setBoonFactors } from './towers.js';
import { makeKeeper, updateKeeper, tollBell } from './keeper.js';
import { makeParticles, spawnSnow, updateParticles, burst, floater } from './particles.js';
import { createVillage, updateVillage } from './village.js';
import { windForWave } from './wind.js';
import { nightForWave, nightEndsAt, NIGHT_BONUS_SHARDS } from './nights.js';
import { createAnimals, updateAnimals } from './animals.js';
import { createMelody } from './music.js';
import { offerBoons, pickBoon, boonCardAt, boonSummary, rerollBoons, rerollButtonAt } from './boons.js';
import { applySweep } from './sweep.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_BUILD = 'build';
export const SCREEN_WAVE = 'wave';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_DEFEAT = 'defeat';
export const SCREEN_PAUSED = 'paused';

export function createGame(seed, audio) {
  const random = createRandom(seed);
  const world = createWorld(random);
  const village = createVillage();
  const animals = createAnimals();
  const melody = createMelody(audio);
  const particles = makeParticles(random);
  spawnSnow(particles, 160);
  return {
    seed, random, world, village, animals, melody, particles, audio,
    screen: SCREEN_TITLE,
    prevScreen: SCREEN_BUILD,
    now: 0,
    wave: 0,
    wind: windForWave(1),
    score: 0,
    best: 0,
    shards: START_SHARDS,
    warmth: HEARTH_MAX_WARMTH,
    kills: 0,
    combo: 0,
    comboUntil: 0,
    feed: [],
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
    // Dawn Boons (v6): blessings the Keeper has taken, and the offer open
    // right now. Multipliers start at 1 and grow as boons are taken.
    boon: {
      held: [], taken: 0,
      boltMult: 1, bellBonus: 0, brazierMult: 1, cannonMult: 1,
      rateMult: 1, wallBonus: 0, rerolled: false,
    },
    boonOffer: null,
    boonPicked: false,
    // The moon (v7): where it hangs this wave, and the band of light
    // under it. Ember wards (v7): the lines the Keeper has laid, and
    // the drag in progress.
    moon: moonForWave(1),
    wards: [],
    ward: { tool: false, drawing: false, points: [] },
    stats: {
      boltsFired: 0, bells: 0, built: 0, upgraded: 0,
      killsByKind: {}, bestCombo: 0, shardsEarned: 0, boonsTaken: 0,
      wardsDrawn: 0,
    },
    difficulty: 'Keeper',
    muted: false,
  };
}

export function startGame(g, difficulty) {
  g.difficulty = difficulty || 'Keeper';
  // Stop the old melody before the fresh game brings its own, or two
  // music-boxes would play over each other on every replay.
  if (g.melody) g.melody.stop();
  const fresh = createGame(g.seed, g.audio);
  fresh.best = g.best;
  fresh.difficulty = g.difficulty;
  Object.keys(fresh).forEach((k) => { g[k] = fresh[k]; });
  // A fresh night starts with no blessings: the towers module keeps its
  // factors between games on one page, so reset them here, or a second
  // play would inherit the first night's boons.
  syncBoonFactors(g);
  // The moon module keeps its band the same way: a fresh night starts
  // under the first wave's moon.
  setMoon(g.moon);
  g.screen = SCREEN_BUILD;
  g.wave = 0;
  g.buildTimer = BUILD_SECONDS;
  g.melody.start();
  say(g, 'Build your defences — press ENTER when ready', 6);
}

// Push the Keeper's blessings into the towers module, so a tower's damage
// and rate are the blessings' as well as its own. Called on a fresh game
// and every time a boon is taken.
export function syncBoonFactors(g) {
  setBoonFactors({
    brazier: g.boon.brazierMult,
    cannon: g.boon.cannonMult,
    rate: g.boon.rateMult,
  });
}

// Take one of the offered dawn boons: apply it, count it, close the offer.
export function takeBoon(g, index) {
  if (!g.boonOffer || g.boonPicked) return false;
  const id = g.boonOffer[index];
  if (!id) return false;
  if (!pickBoon(g, id)) return false;
  syncBoonFactors(g);
  g.boonPicked = true;
  g.stats.boonsTaken += 1;
  g.boonOffer = null;
  const boon = BOONS[id];
  say(g, `Dawn blessing taken: ${boon.name} — ${boon.blurb}`, 4);
  g.audio.build();
  return true;
}

// Turn the dawn's offer (v6): redraw the three cards for 15 shards,
// once per dawn. A turn that cannot happen says why, and the click that
// asked for it is spent either way — the panel, not the plot behind it,
// owns that click.
export function rerollOffer(g) {
  if (!g.boonOffer || g.boonPicked) return false;
  const fresh = rerollBoons(g);
  if (!fresh) {
    say(g, g.boon.rerolled
      ? 'The dawn has turned once already — take a blessing'
      : 'Not enough shards to turn the dawn — 15◆', 2.5);
    return false;
  }
  g.boonOffer = fresh;
  say(g, 'The dawn turns — three new blessings, 15◆', 3);
  g.audio.build();
  return true;
}

function say(g, text, seconds) {
  g.message = text;
  g.messageUntil = g.now + (seconds || 3);
}

export function startWave(g) {
  if (g.wave >= TOTAL_WAVES) return;
  g.wave += 1;
  g.combo = 0;
  // The dawn's offer closes when the wave starts: a blessing not taken
  // by then is gone with the night that offered it.
  g.boonOffer = null;
  g.boonPicked = false;
  // The wind turns: this wave's wind is set on the game and on the
  // towers, so every shot, every march and every reward feels it.
  g.wind = windForWave(g.wave);
  setWind(g.wind);
  // The moon turns (v7): this wave's moon is set on the game and on
  // the towers, so the band of light moves with the night.
  g.moon = moonForWave(g.wave);
  setMoon(g.moon);
  g.spawnQueue = waveSpawnList(g.wave, g.random);
  g.spawnTimer = 0.5;
  g.screen = SCREEN_WAVE;
  g.audio.horn();
  say(g, `Wave ${g.wave} of ${TOTAL_WAVES} — ${g.wind.name}: ${g.wind.blurb}`, 4);
}

function endWave(g) {
  const bonus = WAVE_CLEAR_BONUS + g.wave * 10;
  g.score += bonus;
  g.shards += 12;
  g.stats.shardsEarned += 12;
  g.combo = 0;
  g.audio.waveClear();
  if (g.wave >= TOTAL_WAVES) {
    g.score += g.warmth * 5;
    g.screen = SCREEN_VICTORY;
    g.audio.win();
    return;
  }
  // Dawn breaks briefly between nights: a breath, a bonus, a blessing,
  // and the next night's name — the night is told in ten chapters, not
  // sixteen waves. The dawn offers three blessings after every wave; the
  // Keeper takes one before the next wave starts.
  g.boonOffer = offerBoons(g);
  g.boonPicked = false;
  // A fresh dawn can be turned once — the reroll is per offer, not per night.
  g.boon.rerolled = false;
  if (nightEndsAt(g.wave)) {
    const next = nightForWave(g.wave + 1);
    g.shards += NIGHT_BONUS_SHARDS;
    g.stats.shardsEarned += NIGHT_BONUS_SHARDS;
    g.screen = SCREEN_BUILD;
    g.buildTimer = BUILD_SECONDS;
    say(g, `Wave ${g.wave} held! Dawn breaks briefly — ${next.short}, ${next.title}. +${bonus} score, +${12 + NIGHT_BONUS_SHARDS} shards`, 5);
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
  // Iron Walls (v6): a blessing taken earlier in the night strengthens
  // every wall the Keeper builds from then on, not just the standing ones.
  if (kind === 'wall' && g.boon.wallBonus > 0) {
    slot.tower.maxHp += g.boon.wallBonus;
    slot.tower.hp = slot.tower.maxHp;
  }
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
  // The Keeper's own bolts ride the wind; tower bolts already carry it
  // in their damage, so only the Keeper's are scaled here. A blessing
  // taken at dawn (Ember Heart) feeds them too — and so does the moon
  // (v7), when the Keeper stands in its band.
  if (bolt.from === 'keeper') bolt.damage = Math.round(bolt.damage * g.wind.boltDamage * g.boon.boltMult * moonKeeperMult(g.keeper.x));
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
        b.target.lastHitBy = b.from === 'cannon' ? 'Ember Cannon' : b.from === 'mortar' ? 'Mortar' : 'Keeper';
        b.target.flash = 0.12;
        burst(g.particles, b.target.x, b.target.y, '#ff9a3d', 6, 120);
        if (b.target.hp <= 0) b.target.dead = true;
        // A mortar shell bursts over the crowd: everything caught in its
        // splash takes the same hit, and the tale names the Mortar.
        if (b.from === 'mortar' && b.splash) {
          burst(g.particles, b.target.x, b.target.y, '#ffd76a', 16, 180);
          for (const e of g.enemies) {
            if (e.dead || e.leaked || e === b.target) continue;
            if (Math.hypot(e.x - b.target.x, e.y - b.target.y) <= b.splash) {
              e.hp -= b.damage;
              e.lastHitBy = 'Mortar';
              e.flash = 0.12;
              if (e.hp <= 0) e.dead = true;
            }
          }
        }
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
          e.lastHitBy = 'Keeper';
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
      g.stats.killsByKind[e.kind] = (g.stats.killsByKind[e.kind] || 0) + 1;
      // The wind pays: a gale's kills are worth more, a dawn wind more still.
      const reward = Math.round(e.def.reward * g.wind.shardBonus);
      g.shards += reward;
      g.stats.shardsEarned += reward;
      // Combo: kills within 2.5 s of each other build a multiplier, up to x3.
      g.combo = g.now <= g.comboUntil ? g.combo + 1 : 1;
      g.stats.bestCombo = Math.max(g.stats.bestCombo, g.combo);
      g.comboUntil = g.now + 2.5;
      const mult = 1 + Math.min(g.combo - 1, 8) * 0.25;
      g.score += Math.round(e.def.score * mult);
      // The tale: who slew what, for the HUD's feed — short names, so the
      // line fits the panel at a glance.
      const killerShort = { Brazier: 'Brazier', 'Ember Cannon': 'Cannon', Mortar: 'Mortar', Keeper: 'Keeper', 'Ember Ward': 'Ward' }[e.lastHitBy] || 'The hearth';
      const preyShort = { wraith: 'Wraith', wolf: 'Wolf', mite: 'Mite', wisp: 'Wisp', golem: 'Golem', bulwark: 'Bulwark', alpha: 'Alpha', matron: 'Matron', matriarch: 'Matriarch' }[e.kind] || e.def.name;
      const verb = killerShort === 'Brazier' ? 'scorched' : killerShort === 'Cannon' ? 'shattered' : killerShort === 'Mortar' ? 'burst' : killerShort === 'Ward' ? 'warded' : 'slew';
      g.feed.push(`${killerShort} ${verb} a ${preyShort}`);
      if (g.feed.length > 3) g.feed.shift();
      burst(g.particles, e.x, e.y, e.def.color, 14, 140);
      floater(g.particles, e.x, e.y - 16, `+${reward}`, '#ffd76a');
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
    if (input.wasPressed(TOWERS[kind].key)) {
      g.selectedKind = kind;
      // Picking a tower puts the ward pen away — the Keeper holds one
      // tool at a time.
      g.ward.tool = false;
    }
  }
  // Ember Wards (v7): V opens the ward tool, V again puts it away.
  if (input.wasPressed('v')) {
    g.ward.tool = !g.ward.tool;
    if (g.ward.tool) say(g, 'Ember ward tool — drag the mouse to draw a line of light, release to lay it', 3);
    else if (g.ward.drawing) { g.ward.drawing = false; g.ward.points = []; }
  }
  // The dawn's offer (v6): three blessing cards, centre board. A click
  // on a card takes it and is spent — it must not also select the plot
  // behind the card. Keys 7 / 8 / 9 take the cards the same way; R (or
  // the button under the cards) turns the dawn once, for 15 shards.
  let clickSpent = false;
  if (g.boonOffer && !g.boonPicked) {
    if (input.wasPressed('7')) clickSpent = takeBoon(g, 0);
    else if (input.wasPressed('8')) clickSpent = takeBoon(g, 1);
    else if (input.wasPressed('9')) clickSpent = takeBoon(g, 2);
    else if (input.wasPressed('r')) clickSpent = rerollOffer(g);
    else if (input.mouse.clicked) {
      const card = boonCardAt(input.mouse.x, input.mouse.y);
      if (card >= 0) clickSpent = takeBoon(g, card);
      else if (rerollButtonAt(input.mouse.x, input.mouse.y)) {
        clickSpent = true;
        rerollOffer(g);
      }
    }
  }
  if (input.action('upgrade')) tryUpgrade(g);
  // Ember Wards (v7): in a wave, with the ward tool open, the mouse
  // draws instead of builds. The drag's click is spent — it must not
  // also build a tower on the plot behind the line.
  if (g.screen === SCREEN_WAVE && g.ward.tool) {
    if (input.mouse.clicked && !clickSpent) {
      beginWard(g, input.mouse.x, input.mouse.y);
      clickSpent = true;
    } else if (g.ward.drawing && input.mouse.down) {
      extendWard(g, input.mouse.x, input.mouse.y);
    }
    if (g.ward.drawing && !input.mouse.down) {
      const done = endWard(g);
      if (done === 'short') say(g, 'Draw a longer line of light — the ward needs a real stroke', 2);
      else if (done === 'poor') say(g, 'Not enough shards to lay that ward', 2);
      else if (done === 'ok') say(g, 'Ember ward laid — the road burns where the light falls', 2.5);
    }
  }
  if (input.mouse.clicked && !clickSpent) {
    const slot = pickSlot(g.world, input.mouse.x, input.mouse.y);
    if (slot) {
      tryBuild(g, slot);
    } else {
      const towerSlot = pickTowerAt(g.world, input.mouse.x, input.mouse.y);
      if (towerSlot) g.selectedPlot = towerSlot;
      else g.selectedPlot = null;
    }
  }
  // Right-click deselects a plot — but not in a wave, where holding the
  // right button is the Lantern Sweep and the click that starts it is
  // not a deselect.
  if (input.mouse.rightClicked && g.screen !== SCREEN_WAVE) g.selectedPlot = null;
}

function updateWavePlay(g, dt, input) {
  // Spawning.
  if (g.spawnQueue.length > 0) {
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      const next = g.spawnQueue.shift();
      const waveScale = g.difficulty === 'Gentle' ? 0.85 : g.difficulty === 'Scorched' ? 1.2 : 1;
      const enemy = makeEnemy(next.kind, next.lane, g.wave, g.random);
      // The wind walks with the march: faster in a gale, harder in a
      // blizzard, and the Keeper's favour in a dawn wind.
      enemy.hp = Math.round(enemy.hp * waveScale * g.wind.enemyHp);
      enemy.maxHp = enemy.hp;
      enemy.speed *= g.wind.enemySpeed;
      g.enemies.push(enemy);
      g.spawnTimer = Math.max(0.35, (requireWaveInterval(g.wave)) * (0.9 + g.random.next() * 0.2));
    }
  }
  // Keeper + towers + enemies + bolts.
  // The ward tool (v7) holds the Keeper's hands: while it is open he
  // draws light instead of throwing bolts.
  updateKeeper(g.keeper, dt, input, (b) => fireBolt(g, b), g.audio, true, !g.ward.tool);
  // The Lantern Sweep (v6): the cone the Keeper holds slows and scorches
  // the caught frost and rekindles the caught towers.
  if (g.keeper.sweeping) applySweep(g, g.now);
  // The moon turns (v7): the band's silver light holds the frost.
  if (g.moon) applyMoon(g, g.now);
  // Ember wards (v7): the lines the Keeper laid burn and slow the march.
  if (g.wards.length > 0) applyWards(g, g.now);
  if (input.action('bell')) {
    // A blessing taken at dawn (Long Fuse) holds the freeze longer.
    if (tollBell(g.keeper, g.enemies, g.now, g.audio, KEEPER.bellFreezeSeconds + g.boon.bellBonus)) {
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
  // The spawn interval lives in the wave schedule itself (config.js), so
  // the schedule is the one source of truth — no second list to drift.
  return (WAVES[wave - 1] && WAVES[wave - 1].interval) || 1;
}

export function updateGame(g, dt, input) {
  g.now += dt;
  // The snow itself feels the wind: a gale drives it sideways across the
  // square, a still night lets it fall straight down.
  updateParticles(g.particles, dt, g.now, { x: 640, y: 360 }, g.wind.snowDrift);
  // The village lives on its own clock: the sleigh circles the hearth
  // whenever the game runs, and a loop pays out only while building or
  // fighting — never on the title screen. The dog trots its circle too.
  updateVillage(g, dt);
  updateAnimals(g, dt);
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
    updateKeeper(g.keeper, dt, input, () => {}, g.audio, false);
    g.buildTimer -= dt;
    if (input.action('confirm')) {
      // A dawn offer unpicked blocks the wave: the Keeper chooses first.
      // The toast says so, and the cards name their keys.
      if (g.boonOffer && !g.boonPicked) {
        say(g, 'Choose a dawn blessing first — click a card, or press 7, 8 or 9', 2.5);
        return;
      }
      g.shards += EARLY_START_BONUS;
      say(g, `Early start! +${EARLY_START_BONUS} shards`, 2);
      startWave(g);
      return;
    }
    if (g.buildTimer <= 0) {
      // The timer ran out with an offer unpicked: the dawn takes the
      // first card for the Keeper, so the night never stalls.
      if (g.boonOffer && !g.boonPicked) takeBoon(g, 0);
      startWave(g);
    }
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
      ['brazier', 420, 150], ['brazier', 860, 150],
      ['brazier', 980, 250], ['brazier', 300, 470],
      ['cannon', 300, 150], ['cannon', 980, 150], ['cannon', 300, 570], ['cannon', 980, 570],
      ['cannon', 420, 570], ['cannon', 860, 570],
      ['bell', 420, 250], ['bell', 860, 470], ['bell', 300, 250],
      ['lantern', 420, 470], ['mortar', 860, 250],
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
      mouse: { x: 640, y: 360, down: true, clicked: false, rightClicked: false, rightDown: false },
      down: () => false,
      wasPressed: () => false,
      action: (name) => name === 'confirm' && g.screen === SCREEN_BUILD,
      endFrame: () => {},
    };
    let steps = 0;
    let wavesCleared = 0;
    let lastWave = 0;
    let maintainedWave = -1;
    // Ember wards (v7): the scripted Keeper draws one line a wave,
    // alternating the east road and the north road, the way a player
    // would lay light across the march. The moon's place is recorded
    // each wave, so the report shows it really turned.
    let wardWave = 0;
    const moonXs = [];
    // Sixteen waves take longer than ten: thirty minutes of sim time.
    while (steps < 60 * 60 * 30 && g.screen !== SCREEN_VICTORY && g.screen !== SCREEN_DEFEAT) {
      // Between waves, a real player spends: rebuild chewed walls, upgrade towers.
      if (g.screen === SCREEN_BUILD && maintainedWave !== g.wave) {
        maintainedWave = g.wave;
        // The dawn offers a blessing after every wave: take the first
        // card, or the wave never starts (ENTER is blocked until chosen).
        if (g.boonOffer && !g.boonPicked) takeBoon(g, 0);
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
      // The Lantern Sweep (v6): hold it while the march is close enough
      // for the cone to catch — the oil drains, then refills while it rests.
      fakeInput.mouse.rightDown = g.screen === SCREEN_WAVE && bestD < 320;
      if (g.screen === SCREEN_BUILD) fakeInput.action = (name) => name === 'confirm';
      else fakeInput.action = (name) => name === 'bell' && g.keeper.bellCooldown <= 0;
      if (g.wave > lastWave) { wavesCleared = g.wave; lastWave = g.wave; }
      // One ward a wave, drawn through the real code path: across the
      // east road on even waves, down the north road on odd ones.
      if (g.screen === SCREEN_WAVE && g.wave > wardWave) {
        wardWave = g.wave;
        moonXs.push(g.moon ? g.moon.x : null);
        if (g.shards >= 30) {
          if (g.wave % 2 === 0) {
            beginWard(g, 470, 360);
            for (let x = 490; x <= 770; x += 20) extendWard(g, x, 360);
            endWard(g);
          } else {
            beginWard(g, 640, 210);
            for (let y = 230; y <= 510; y += 20) extendWard(g, 640, y);
            endWard(g);
          }
        }
      }
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
      // The night's ledger, so a staged end screen can show the real
      // numbers a won game actually posts — never invented ones.
      killsByKind: g.stats.killsByKind,
      bestCombo: g.stats.bestCombo,
      built: g.stats.built,
      upgraded: g.stats.upgraded,
      bells: g.stats.bells,
      shardsEarned: g.stats.shardsEarned,
      boonsTaken: g.stats.boonsTaken,
      boonsHeld: g.boon.held,
      sweepHeldSeconds: g.keeper ? Math.round(g.keeper.sweepHeld * 10) / 10 : 0,
      wardsDrawn: g.stats.wardsDrawn,
      moonXs,
      errors,
    };
  } catch (err) {
    errors.push(String(err && err.stack || err));
    return { ok: false, screen: g.screen, errors };
  }
}
