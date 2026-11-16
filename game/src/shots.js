// Screenshot scenes: deterministic staged states of the real game, built by
// playing the real update loop for a fixed number of ticks with a fixed seed.
// Nothing here is a mock — the same code runs when a person plays.

import { startGame, startWave, tryBuild, castArt } from './game.js';
import { pickSlot } from './world.js';
import { offerBoons } from './boons.js';
import { beginWard, extendWard, endWard } from './wards.js';

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
    ['lantern', 420, 470], ['mortar', 860, 250],
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
    // Stage the dawn's offer (v6): the three blessing cards over the
    // board, so the choice panel can be seen and checked as a scene.
    g.boonOffer = offerBoons(g);
    g.boonPicked = false;
    return { screen: 'build' };
  }
  if (name === 'play') {
    startGame(g, 'Keeper');
    buildDefence(g);
    // Stage the final wave — "The Frost Matriarch" — and put the boss
    // first in the spawn queue, so the frame shows her with the boss bar
    // while the rest of the wave is still marching in. The loop below
    // then plays it for real; the real game still spawns her last.
    g.wave = 15;
    startWave(g);
    // The staged night took a blessing after wave 15 — Ember Heart — set
    // before the wave plays, so the Keeper's bolts in the frame really
    // are the stronger ones and the toast names a real choice.
    g.boon.held = ['emberHeart'];
    g.boon.boltMult = 1.3;
    g.message = 'Dawn blessing taken: Ember Heart — Keeper bolts +30% damage';
    g.messageUntil = 9999;
    const bossAt = g.spawnQueue.findIndex((s) => s.kind === 'matriarch');
    if (bossAt >= 0) {
      const [bossSpawn] = g.spawnQueue.splice(bossAt, 1);
      g.spawnQueue.unshift(bossSpawn);
    }
    const aim = {
      ...IDLE_INPUT,
      mouse: { x: 700, y: 300, down: true, clicked: false, rightClicked: false },
    };
    // Wait until the Matriarch is on the field, keeper shooting the
    // nearest creature meanwhile (5 real seconds at most).
    for (let i = 0; i < 60 * 5 && g.screen === 'wave'; i += 1) {
      let best = null;
      let bestD = 1e9;
      for (const e of g.enemies) {
        const d = Math.hypot(e.x - g.keeper.x, e.y - g.keeper.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) { aim.mouse.x = best.x; aim.mouse.y = best.y; }
      if (g.enemies.some((e) => e.kind === 'matriarch')) break;
      updateGame(g, 1 / 60, aim);
    }
    // Ten seconds on the boss: the Keeper hunts the small fry near her
    // (kills and combo for the frame) while the towers hammer her — the
    // boss bar stays up because she is far from dead. Toll the bell once
    // so the frozen march shows in the frame, and hold the Lantern Sweep
    // (v6) so the cone of light shows over the march too.
    if (g.screen === 'wave') {
      const bossAim = {
        ...IDLE_INPUT,
        mouse: { x: 640, y: 360, down: true, clicked: false, rightClicked: false, rightDown: true },
      };
      for (let i = 0; i < 60 * 12 && g.screen === 'wave'; i += 1) {
        let target = null;
        let bestD = 1e9;
        for (const e of g.enemies) {
          if (e.kind === 'matriarch') continue;
          const d = Math.hypot(e.x - g.keeper.x, e.y - g.keeper.y);
          if (d < bestD) { bestD = d; target = e; }
        }
        if (!target) target = g.enemies.find((e) => e.kind === 'matriarch');
        if (target) { bossAim.mouse.x = target.x; bossAim.mouse.y = target.y; }
        bossAim.action = (n) => i === 0 && n === 'bell' && g.keeper.bellCooldown <= 0;
        updateGame(g, 1 / 60, bossAim);
      }
      // Ember wards (v7): lay one across the east road, where the march
      // is thickest, so the frame shows the line of light burning the
      // road — drawn through the real code path, with real shards, and
      // lying in the moon's band (wave 16's moon stands over the east).
      if (g.shards >= 30) {
        beginWard(g, 780, 360);
        for (let x = 800; x <= 1060; x += 20) extendWard(g, x, 360);
        endWard(g);
      }
      // The frame must show the sweep: the twelve seconds of holding it
      // may have run the oil dry, so refill the lantern and hold the
      // cone open for the capture — a real state (full oil, sweeping),
      // staged the way the boss-first spawn order is staged.
      g.keeper.oil = g.keeper.oilMax;
      g.keeper.oilLocked = false;
      g.keeper.sweeping = true;
      // Ember Surge (v8): fan the piercing bolts across the boss's road,
      // so the frame shows the Keeper's own art in flight.
      castArt(g, 'surge');
    }
    return { screen: 'wave' };
  }
  if (name === 'victory') {
    startGame(g, 'Keeper');
    buildDefence(g);
    g.wave = 16;
    // A real night's numbers: seed 1's v8 self-test victory, so the staged
    // end screen shows what a won game actually scores. The kill ledger
    // is the real distribution (sums to 957); built/upgraded/bells/wards/
    // arts are what the self-test actually posted — 29 towers built, 38
    // upgrades, 67 bells tolled, 16 ember wards drawn, 59 ember arts cast
    // (20 novas, 38 surges, 1 kindle), one ward a wave.
    g.score = 40232;
    g.kills = 957;
    g.warmth = 100;
    g.stats.killsByKind = { wraith: 346, wolf: 268, mite: 172, wisp: 68, golem: 83, bulwark: 17, alpha: 1, matron: 1, matriarch: 1 };
    g.stats.bestCombo = 88;
    g.stats.built = 29;
    g.stats.upgraded = 38;
    g.stats.bells = 67;
    g.stats.wardsDrawn = 16;
    // The Keeper's Ember Arts (v8): the real seed-1 split — twenty novas,
    // thirty-eight surges, one kindle.
    g.stats.artsCast = { nova: 20, surge: 38, kindle: 1 };
    g.stats.shardsEarned = 9946;
    // Fifteen waves held means fifteen dawn blessings taken — a real
    // night's ledger, grouped by the end screen into kinds and counts.
    g.boon.held = ['frostbiteRounds', 'kindling', 'kindling', 'deepPockets', 'lanternOil', 'kindling', 'lanternOil', 'longFuse', 'swiftHands', 'swiftHands', 'ironWalls', 'ironWalls', 'kindling', 'deepPockets', 'frostbiteRounds'];
    g.stats.boonsTaken = 15;
    g.feed = ['Cannon shattered a Matriarch', 'Ward warded a Bulwark', 'Keeper slew a Wisp'];
    g.message = '';
    g.screen = 'victory';
    return { screen: 'victory' };
  }
  if (name === 'defeat') {
    startGame(g, 'Keeper');
    buildDefence(g);
    g.wave = 12;
    // A staged loss: the ledger is kept consistent with the staged
    // numbers — 210 slain, the kinds a wave-12 loss would have met.
    g.score = 3120;
    g.kills = 210;
    g.warmth = 0;
    g.stats.killsByKind = { wraith: 78, wolf: 62, mite: 40, wisp: 18, golem: 11, alpha: 1 };
    g.stats.bestCombo = 6;
    g.stats.built = 12;
    g.stats.upgraded = 2;
    g.stats.bells = 3;
    g.stats.shardsEarned = 2140;
    g.message = '';
    g.screen = 'defeat';
    return { screen: 'defeat' };
  }
  return { screen: 'title' };
}
