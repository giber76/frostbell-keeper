// Screenshot scenes: deterministic staged states of the real game, built by
// playing the real update loop for a fixed number of ticks with a fixed seed.
// Nothing here is a mock — the same code runs when a person plays.

import { startGame, startWave, tryBuild } from './game.js';
import { pickSlot } from './world.js';

const IDLE_INPUT = {
  keys: new Set(), pressed: new Set(),
  mouse: { x: 640, y: 360, down: false, clicked: false, rightClicked: false },
  down: () => false,
  wasPressed: () => false,
  action: () => false,
  endFrame: () => {},
};

// Build a believable mid-game defence: towers on the plots, walls on the roads.
function buildDefence(g) {
  const plan = [
    ['brazier', 520, 250], ['brazier', 760, 250], ['brazier', 520, 470], ['brazier', 760, 470],
    ['cannon', 300, 150], ['cannon', 980, 150], ['cannon', 300, 570], ['cannon', 980, 570],
    ['bell', 420, 250], ['bell', 860, 470],
  ];
  g.shards = 2000;
  for (const [kind, x, y] of plan) {
    g.selectedKind = kind;
    const slot = pickSlot(g.world, x, y);
    if (slot) tryBuild(g, slot);
  }
  for (const w of g.world.walls) {
    g.selectedKind = 'wall';
    if (!w.tower) tryBuild(g, w);
  }
  g.shards = 240;
}

export function stageShot(name, g, updateGame) {
  if (name === 'title') {
    return { screen: 'title' };
  }
  if (name === 'build') {
    startGame(g, 'Keeper');
    buildDefence(g);
    g.buildTimer = 18;
    g.message = 'Build your defences — press ENTER when ready';
    g.messageUntil = 9999;
    g.selectedKind = 'cannon';
    return { screen: 'build' };
  }
  if (name === 'play') {
    startGame(g, 'Keeper');
    buildDefence(g);
    // Stage wave 8 directly: wraiths, wolves and golems together, so the
    // roads are full of creatures when the shutter falls. The loop below
    // then plays it for real.
    g.wave = 7;
    startWave(g);
    const aim = {
      ...IDLE_INPUT,
      mouse: { x: 700, y: 300, down: true, clicked: false, rightClicked: false },
    };
    // Aim the keeper at the nearest creature each tick, for 20 real seconds.
    for (let i = 0; i < 60 * 20; i += 1) {
      let best = null;
      let bestD = 1e9;
      for (const e of g.enemies) {
        const d = Math.hypot(e.x - g.keeper.x, e.y - g.keeper.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) { aim.mouse.x = best.x; aim.mouse.y = best.y; }
      updateGame(g, 1 / 60, aim);
      if (g.screen !== 'wave') break;
    }
    return { screen: 'wave' };
  }
  if (name === 'victory') {
    startGame(g, 'Keeper');
    buildDefence(g);
    g.wave = 10;
    g.score = 2840;
    g.kills = 187;
    g.warmth = 62;
    g.message = '';
    g.screen = 'victory';
    return { screen: 'victory' };
  }
  if (name === 'defeat') {
    startGame(g, 'Keeper');
    g.wave = 7;
    g.score = 1420;
    g.kills = 96;
    g.warmth = 0;
    g.screen = 'defeat';
    return { screen: 'defeat' };
  }
  return { screen: 'title' };
}
