// Screenshot scenes: deterministic staged states of the real game, built
// by playing the real update loop for a fixed number of ticks with a fixed
// seed. Nothing here is a mock — the same code runs when a person plays.

import { startGame, startNight, runSelfTest } from './game.js';
import { placeMirror } from './mirrors.js';
import { HEARTH, MIRROR } from './config.js';
import { createScriptedInput } from './input.js';

// A believable mid-game mirror set: a diamond above the hearth, two
// turning the beam left, two turning it right.
function layMirrors(g) {
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
  g.embers = 120;
}

// Aim the beam at the nearest living creature; focus when it is armored
// or a boss, or when the meter is nearly full.
function aimAtNearest(g, input) {
  let best = null;
  let bestD = 1e9;
  for (const e of g.enemies) {
    const d = Math.hypot(e.x - HEARTH.x, e.y - HEARTH.y);
    if (d < bestD) { bestD = d; best = e; }
  }
  if (best) {
    input.mouse.x = best.x;
    input.mouse.y = best.y;
    input.mouse.down = best.kind === 'golem' || best.kind === 'matriarch' || g.focus > 85;
  } else {
    input.mouse.x = 640;
    input.mouse.y = 200;
    input.mouse.down = false;
  }
}

export function stageShot(name, g, updateGame) {
  if (name === 'title') {
    return { screen: 'title' };
  }
  if (name === 'build') {
    startGame(g);
    layMirrors(g);
    g.buildTimer = 18;
    g.message = 'Place mirrors, take a gift — press ENTER when the night is ready';
    g.messageUntil = 9999;
    return { screen: 'build' };
  }
  if (name === 'play') {
    startGame(g);
    layMirrors(g);
    // Stage night five, the middle of the game: the march is thick, the
    // mirrors are up, and the beam is doing the work.
    g.night = 4;
    startNight(g);
    const input = createScriptedInput();
    // Play twelve real seconds: the keeper hunts the nearest creature
    // while the march closes in, so the frame shows the beam burning
    // through the frost with mirrors bouncing it around the pillars.
    for (let i = 0; i < 60 * 12 && g.screen === 'night'; i += 1) {
      aimAtNearest(g, input);
      updateGame(g, 1 / 60, input);
      input.endFrame();
    }
    return { screen: 'night' };
  }
  if (name === 'victory') {
    // A real win: play all ten nights with the scripted keeper, then
    // paint the victory screen the game actually reached — the ledger
    // on it is the night that was really won.
    const result = runSelfTest(g);
    if (result.ok && g.screen === 'victory') return { screen: 'victory' };
    // The self-test did not win: paint the defeat it reached instead,
    // so the shot never lies about what happened.
    return { screen: g.screen };
  }
  if (name === 'defeat') {
    startGame(g);
    layMirrors(g);
    startNight(g);
    // A staged loss: the hearth is nearly out, and the keeper does not
    // fight back — the march walks in unopposed and the first creature
    // to reach the hearth ends the night. Played for real until the
    // warmth runs out.
    g.hearthHp = 5;
    const input = createScriptedInput();
    input.mouse.x = 640;
    input.mouse.y = 200;
    input.mouse.down = false;
    for (let i = 0; i < 60 * 60 && g.screen === 'night'; i += 1) {
      updateGame(g, 1 / 60, input);
      input.endFrame();
    }
    return { screen: g.screen };
  }
  return { screen: 'title' };
}
