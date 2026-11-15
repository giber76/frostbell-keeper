// FROSTBELL — Keeper of the Last Hearth: every tunable number lives here.
// A winter hearth-defense game: frost creatures march down four snow roads
// toward the village hearth. The Keeper places braziers, cannons, bells and
// snow walls, and fights beside them with ember bolts, until dawn breaks
// after wave 10 — or the last warmth is stolen and the village freezes.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const STEP = 1 / 60;
export const BEST_KEY = 'frostbell-best-score';

// Board: the village square the game is played on. The hearth burns at its
// centre; four roads run in from the gates at the board's edges.
export const BOARD = { x: 208, y: 64, w: 864, h: 592 };
export const HEARTH = { x: 640, y: 360, r: 34 };
export const HEARTH_MAX_WARMTH = 100;
export const TOTAL_WAVES = 10;
export const BUILD_SECONDS = 25;
export const START_SHARDS = 80;
export const WAVE_CLEAR_BONUS = 100;
export const EARLY_START_BONUS = 15;

// The night deepens as the waves pass: the palette tint per wave, 0 = dusk.
export const NIGHT_TINT = [
  'rgba(8,12,28,0.00)', 'rgba(8,12,28,0.05)', 'rgba(8,12,28,0.10)',
  'rgba(8,12,28,0.15)', 'rgba(8,12,28,0.20)', 'rgba(8,12,28,0.25)',
  'rgba(8,12,28,0.30)', 'rgba(8,12,28,0.35)', 'rgba(8,12,28,0.40)',
  'rgba(8,12,28,0.45)',
];

export const PALETTE = {
  night: '#0d1526',
  snow: '#dfe9f5',
  snowDark: '#b9c9de',
  stone: '#8d99ae',
  stoneDark: '#5d6b84',
  pine: '#1d4a38',
  pineDark: '#123527',
  fire: '#ffb347',
  fireHot: '#ff7a1a',
  ember: '#ff5d3a',
  frost: '#9fd8ff',
  frostDeep: '#5aa9e6',
  gold: '#ffd76a',
  panel: '#16233f',
  panelEdge: '#2e4a7a',
  ink: '#eaf2ff',
  dim: '#93a7c8',
  danger: '#ff6b6b',
  heal: '#7dffb2',
};

// Frost creatures. speed is px/s along a road, hp scales per wave.
export const ENEMIES = {
  wraith: { name: 'Frost Wraith', hp: 30, speed: 42, radius: 13, reward: 6, leak: 4, score: 10, color: '#bfe6ff', core: '#eaf7ff' },
  wolf: { name: 'Frost Wolf', hp: 55, speed: 78, radius: 12, reward: 9, leak: 6, score: 15, color: '#8fd0ff', core: '#d6f0ff' },
  golem: { name: 'Ice Golem', hp: 220, speed: 24, radius: 20, reward: 20, leak: 12, score: 30, color: '#7fb8e8', core: '#cfeaff' },
  matriarch: { name: 'The Frost Matriarch', hp: 1500, speed: 18, radius: 30, reward: 150, leak: 40, score: 300, color: '#d8b4fe', core: '#f3e8ff' },
};

// One entry per wave: how many of each creature march, and how fast they come.
export const WAVES = [
  { wraith: 8, wolf: 0, golem: 0, matriarch: 0, interval: 1.6 },
  { wraith: 12, wolf: 3, golem: 0, matriarch: 0, interval: 1.4 },
  { wraith: 14, wolf: 6, golem: 1, matriarch: 0, interval: 1.25 },
  { wraith: 16, wolf: 9, golem: 2, matriarch: 0, interval: 1.15 },
  { wraith: 20, wolf: 12, golem: 3, matriarch: 0, interval: 1.05 },
  { wraith: 22, wolf: 16, golem: 4, matriarch: 0, interval: 0.95 },
  { wraith: 24, wolf: 18, golem: 6, matriarch: 0, interval: 0.9 },
  { wraith: 26, wolf: 22, golem: 7, matriarch: 0, interval: 0.85 },
  { wraith: 28, wolf: 24, golem: 9, matriarch: 0, interval: 0.8 },
  { wraith: 20, wolf: 16, golem: 6, matriarch: 1, interval: 0.75 },
];

// Creature health grows with the wave so late waves stay dangerous.
export function enemyHp(kind, wave) {
  return Math.round(ENEMIES[kind].hp * Math.pow(1.14, wave - 1));
}

// What the Keeper can build. range in px, damage per hit (or per second for
// auras), rate in seconds between shots. wall blocks a road instead of firing.
export const TOWERS = {
  brazier: {
    key: '1', name: 'Brazier', cost: 30, range: 95, damage: 16, rate: 0.5,
    blurb: 'Burns all frost nearby.',
  },
  cannon: {
    key: '2', name: 'Ember Cannon', cost: 50, range: 210, damage: 38, rate: 1.1,
    blurb: 'Heavy ember, long range.',
  },
  bell: {
    key: '3', name: 'Frostward Bell', cost: 40, range: 130, damage: 4, rate: 0.8, slow: 0.55, slowTime: 1.6,
    blurb: 'Slows frost creatures.',
  },
  wall: {
    key: '4', name: 'Snow Wall', cost: 25, range: 0, damage: 0, rate: 0, hp: 320,
    blurb: 'Blocks the road.',
  },
};
export const TOWER_KEYS = ['brazier', 'cannon', 'bell', 'wall'];
export const UPGRADE_COST_FRACTION = 0.6;
export const UPGRADE_DAMAGE_FRACTION = 0.6;
export const MAX_TOWER_LEVEL = 3;

// The Keeper: a guardian who walks the square and throws ember bolts.
export const KEEPER = {
  speed: 210, radius: 14, boltDamage: 18, boltSpeed: 520, boltRate: 0.22,
  boltRadius: 5, bellFreezeSeconds: 2.5, bellCooldownSeconds: 12,
};

// A build plot is a stone circle beside a road where one tower can stand.
// Wall slots sit ON a road; a wall there blocks the march.
export function buildPlots() {
  const plots = [];
  const rows = [150, 250, 470, 570];
  const cols = [300, 420, 860, 980];
  for (const y of rows) for (const x of cols) plots.push({ x, y, kind: 'plot' });
  // Extra plots hugging the hearth, for close defence.
  plots.push({ x: 520, y: 250, kind: 'plot' });
  plots.push({ x: 760, y: 250, kind: 'plot' });
  plots.push({ x: 520, y: 470, kind: 'plot' });
  plots.push({ x: 760, y: 470, kind: 'plot' });
  return plots;
}

export function wallSlots() {
  // Two per road: a far barricade and a near one, as a fraction of the road's
  // length from the gate (roads differ in length, so fractions keep every
  // slot on its road and clear of the hearth).
  return [
    { lane: 'N', frac: 0.45, kind: 'wall' }, { lane: 'N', frac: 0.8, kind: 'wall' },
    { lane: 'S', frac: 0.45, kind: 'wall' }, { lane: 'S', frac: 0.8, kind: 'wall' },
    { lane: 'W', frac: 0.45, kind: 'wall' }, { lane: 'W', frac: 0.8, kind: 'wall' },
    { lane: 'E', frac: 0.45, kind: 'wall' }, { lane: 'E', frac: 0.8, kind: 'wall' },
  ];
}
