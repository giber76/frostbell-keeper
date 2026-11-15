// Boot and the one loop: input is read every frame, the game advances in
// fixed 1/60 s steps, and the renderer paints what is there.
//
// ?seed=N fixes the night's randomness. ?shot=title|build|play|victory|defeat
// (with &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot. ?selftest=1 plays sixteen
// waves with a scripted strategy and reports SELFTEST ok (or ERR:) in the
// document title, so a headless browser can check the game end to end.

import { BEST_KEY, STEP, VIEW_W, VIEW_H } from './config.js';
import { createAudio } from './audio.js';
import { createInput, ACTION_CONFIRM } from './input.js';
import { createGame, updateGame, runSelfTest } from './game.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const selftest = params.get('selftest') === '1';
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
// 2x supersampling: the canvas paints at twice the logical resolution and
// the browser downsamples it to the 1280x720 frame, so every edge in a
// screenshot is antialiased instead of stair-stepped. The renderer scales
// its context by 2, and input.js maps the mouse to logical coordinates, so
// no game code ever sees the extra pixels.
canvas.width = VIEW_W * 2;
canvas.height = VIEW_H * 2;
const audio = createAudio();
const input = createInput(canvas);
const game = createGame(seed, audio);
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

game.best = readBest();

function runShot(name) {
  const scene = stageShot(name, game, updateGame);
  let painted = 0;
  function paint() {
    renderer.draw(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
  document.title = `SELFTEST shot ${name} screen=${game.screen} wave=${game.wave} score=${game.score}`;
}

function runSelftestMode() {
  const result = runSelfTest(game);
  if (result.ok) {
    document.title = `SELFTEST ok screen=${result.screen} waves=${result.wavesCleared} kills=${result.kills} score=${result.score} warmth=${result.warmth} steps=${result.steps} bestCombo=${result.bestCombo} built=${result.built} upgraded=${result.upgraded} bells=${result.bells} shardsEarned=${result.shardsEarned} kinds=${JSON.stringify(result.killsByKind)}`;
  } else {
    document.title = `ERR: selftest failed ${JSON.stringify(result).slice(0, 300)}`;
  }
  window.__shotReady = true;
}

if (selftest) {
  runSelftestMode();
} else if (shot) {
  runShot(shot);
} else {
  let last = performance.now();
  let acc = 0;
  function frame(t) {
    const dt = Math.min(MAX_FRAME, (t - last) / 1000);
    last = t;
    acc += dt;
    while (acc >= STEP) {
      updateGame(game, STEP, input);
      acc -= STEP;
    }
    if (game.best < game.score) {
      game.best = game.score;
      saveBest(game.best);
    }
    renderer.draw(game);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  document.title = 'FROSTBELL — Keeper of the Last Hearth';
  requestAnimationFrame(frame);
}
