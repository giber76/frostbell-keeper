// FROSTBELL — Hearthlight (v9): tuning and palette for a light-steering game.
// One file, one job: every number the rest of the game shares lives here so
// the balance can be read at a glance. The keeper aims the hearth's beam with
// the mouse; ice mirrors bend it around frost pillars; holding focus narrows
// the beam and burns through armour.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const STEP = 1 / 60;

export const HEARTH = { x: 640, y: 648, r: 44 };
export const HEARTH_MAX_HP = 100;

export const BEAM = {
  maxBounces: 8,
  sweepWidth: 26,
  focusWidth: 9,
  sweepDps: 34,
  focusDps: 120,
  focusDrain: 30, // focus meter per second while focusing
  focusRegen: 15, // per second while not focusing
  range: 1500,
};

export const MIRROR = {
  length: 76,
  cost: 15,
  refund: 10,
  startCount: 4,
  maxCount: 8,
  rotateStep: Math.PI / 15, // Q / E
  wheelStep: Math.PI / 60,
};

export const ECONOMY = {
  startEmbers: 60,
  nightBonus: 25,
};

export const NIGHTS = 10;

// Frost pillars: solid ice that blocks the beam and that enemies walk around.
// They are what makes mirrors necessary — the beam cannot reach what hides
// behind a pillar without a bounce.
export const PILLARS = [
  { x: 300, y: 300, r: 52 },
  { x: 980, y: 300, r: 52 },
  { x: 460, y: 180, r: 44 },
  { x: 820, y: 180, r: 44 },
  { x: 640, y: 330, r: 58 },
];

export const ENEMY_KINDS = {
  wisp: { hp: 22, speed: 58, radius: 13, damage: 6, embers: 4, score: 10 },
  wraith: { hp: 48, speed: 40, radius: 17, damage: 10, embers: 7, score: 15 },
  wolf: { hp: 32, speed: 74, radius: 14, damage: 8, embers: 6, score: 15 },
  // The armored one: slow, huge, and the sweep barely scratches it.
  // The focus beam is the answer — the sweep is the wrong tool. 180
  // health, not 230: at 230 the focus beam took too long to chew through
  // a night-eight wall of them and the march reached the hearth.
  golem: { hp: 180, speed: 21, radius: 26, damage: 20, embers: 15, score: 40, armored: true },
  // Night ten's boss: she holds off at range and throws ice at the hearth.
  // 1400 health keeps the fight a climax but winnable — at 1800 the
  // focus beam could not finish her before her bolts took the hearth.
  matriarch: { hp: 1400, speed: 15, radius: 46, damage: 40, embers: 100, score: 300, armored: true, boss: true },
};

export const BEST_KEY = 'frostbell-hearthlight-best';

export const PALETTE = {
  skyTop: '#070d1d',
  skyMid: '#0e1a33',
  skyLow: '#1b2f52',
  snow: '#dfe9f7',
  pine: '#0c1f16',
  pineSnow: '#cfe0ee',
  house: '#2a2118',
  windowWarm: '#ffc46b',
  pillar: '#9fd8ef',
  pillarCore: '#e8f7ff',
  hearthGlow: '#ff9a3c',
  hearthCore: '#ffd27a',
  beamSweep: 'rgba(255, 214, 130, 0.55)',
  beamCore: 'rgba(255, 246, 214, 0.95)',
  beamFocus: 'rgba(255, 236, 170, 0.9)',
  mirror: '#bfe9ff',
  mirrorEdge: '#eaf9ff',
  hud: '#e8f1ff',
  danger: '#ff6b6b',
};
