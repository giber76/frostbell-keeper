// FROSTBELL — Keeper of the Last Hearth: every tunable number lives here.
// A winter hearth-defense game: frost creatures march down four snow roads
// toward the village hearth. The Keeper places braziers, cannons, bells,
// frost lanterns, shard mortars and snow walls, and fights beside them with
// ember bolts — and, since v6, sweeps the lantern's light across the
// march — until dawn breaks after wave 16 — or the last warmth is
// stolen and the village freezes. The wind turns every wave, the moon
// crosses the sky as the waves pass, the sixteen waves are told in ten
// nights, and after every wave the dawn offers the Keeper a choice of
// three blessings. Since v7 the Keeper also draws ember wards: lines of
// light traced with the mouse, laid across the roads to burn the march.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const STEP = 1 / 60;
export const BEST_KEY = 'frostbell-best-score';

// Board: the village square the game is played on. The hearth burns at its
// centre; four roads run in from the gates at the board's edges.
export const BOARD = { x: 208, y: 64, w: 864, h: 592 };
export const HEARTH = { x: 640, y: 360, r: 34 };
export const HEARTH_MAX_WARMTH = 100;
export const TOTAL_WAVES = 16;
export const BUILD_SECONDS = 25;
export const START_SHARDS = 80;
export const WAVE_CLEAR_BONUS = 100;
export const EARLY_START_BONUS = 15;

// The night deepens as the waves pass: the palette tint per wave, 0 = dusk.
// Kept light — the dark ground itself does the night work now, so the tint
// only deepens the edges a little as the night goes on.
export const NIGHT_TINT = [
  'rgba(8,12,28,0.00)', 'rgba(8,12,28,0.02)', 'rgba(8,12,28,0.04)',
  'rgba(8,12,28,0.06)', 'rgba(8,12,28,0.08)', 'rgba(8,12,28,0.10)',
  'rgba(8,12,28,0.12)', 'rgba(8,12,28,0.14)', 'rgba(8,12,28,0.16)',
  'rgba(8,12,28,0.18)', 'rgba(8,12,28,0.20)', 'rgba(8,12,28,0.22)',
  'rgba(8,12,28,0.24)', 'rgba(8,12,28,0.26)', 'rgba(8,12,28,0.28)',
  'rgba(8,12,28,0.30)',
];

// Every wave has a name the HUD shows — the night tells its own story.
export const WAVE_NAMES = [
  'First Frost',
  'The Pack Gathers',
  'Stone and Snow',
  'Howling Dark',
  'The Rime Alpha',
  'The Mite Swarm',
  'Whispers Over Walls',
  'The Glacier Wall',
  'The Wolf Tide',
  'The Frostbite Matron',
  'The Long Night',
  'Golem March',
  'The Deep Freeze',
  'The Wisp Storm',
  'Storm Before Dawn',
  'The Frost Matriarch',
];

export const PALETTE = {
  night: '#0d1526',
  ground: '#141d33',
  plaza: '#202c47',
  plazaEdge: '#31406a',
  road: '#2a3a5f',
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
  wolf: { name: 'Frost Wolf', hp: 50, speed: 70, radius: 12, reward: 9, leak: 6, score: 15, color: '#8fd0ff', core: '#d6f0ff' },
  golem: { name: 'Ice Golem', hp: 220, speed: 24, radius: 20, reward: 20, leak: 12, score: 30, color: '#7fb8e8', core: '#cfeaff' },
  // New in v3: a tiny swarmer that comes in packs, a wisp that flies over
  // snow walls, and a glacier tank that soaks up ember fire.
  mite: { name: 'Rime Mite', hp: 18, speed: 100, radius: 8, reward: 4, leak: 2, score: 6, color: '#d6ecff', core: '#ffffff' },
  wisp: { name: 'Frost Wisp', hp: 42, speed: 58, radius: 10, reward: 10, leak: 5, score: 18, color: '#a8e0ff', core: '#eaf7ff' },
  bulwark: { name: 'Glacier Bulwark', hp: 420, speed: 16, radius: 26, reward: 35, leak: 12, score: 50, color: '#6fa8dc', core: '#d6e9ff' },
  alpha: { name: 'Rime Wolf Alpha', hp: 500, speed: 60, radius: 17, reward: 50, leak: 12, score: 80, color: '#c9a7ff', core: '#efe6ff' },
  // The mid-night boss (wave 10): a lesser Matriarch who enrages below half
  // health, like the Matriarch herself at wave 16.
  matron: { name: 'Frostbite Matron', hp: 900, speed: 22, radius: 24, reward: 100, leak: 25, score: 180, color: '#e0aaff', core: '#f8e8ff' },
  matriarch: { name: 'The Frost Matriarch', hp: 1500, speed: 18, radius: 30, reward: 150, leak: 40, score: 300, color: '#d8b4fe', core: '#f3e8ff' },
};

// One entry per wave: how many of each creature march, and how fast they come.
// Waves 1–5 are the v2 opening, unchanged; the night then grows to sixteen
// waves, with mites at 6, wisps at 7, bulwarks at 8, the Matron at 10 and
// the Matriarch at 16.
export const WAVES = [
  { wraith: 8, wolf: 0, golem: 0, matriarch: 0, interval: 1.6 },
  { wraith: 12, wolf: 3, golem: 0, matriarch: 0, interval: 1.4 },
  { wraith: 14, wolf: 6, golem: 1, matriarch: 0, interval: 1.25 },
  { wraith: 16, wolf: 9, golem: 2, matriarch: 0, interval: 1.15 },
  { wraith: 20, wolf: 12, golem: 3, alpha: 1, matriarch: 0, interval: 1.05 },
  { wraith: 22, wolf: 16, golem: 4, mite: 8, matriarch: 0, interval: 0.95 },
  { wraith: 24, wolf: 18, golem: 5, mite: 12, wisp: 3, matriarch: 0, interval: 0.9 },
  { wraith: 24, wolf: 20, golem: 6, mite: 14, wisp: 5, bulwark: 1, matriarch: 0, interval: 0.85 },
  { wraith: 26, wolf: 22, golem: 7, mite: 16, wisp: 6, bulwark: 2, matriarch: 0, interval: 0.8 },
  { wraith: 24, wolf: 20, golem: 6, mite: 16, wisp: 6, bulwark: 2, matron: 1, matriarch: 0, interval: 0.75 },
  { wraith: 28, wolf: 24, golem: 8, mite: 18, wisp: 8, bulwark: 2, matriarch: 0, interval: 0.72 },
  { wraith: 26, wolf: 22, golem: 8, mite: 16, wisp: 7, bulwark: 2, matriarch: 0, interval: 0.7 },
  { wraith: 26, wolf: 24, golem: 8, mite: 18, wisp: 8, bulwark: 2, matriarch: 0, interval: 0.68 },
  { wraith: 26, wolf: 24, golem: 8, mite: 18, wisp: 8, bulwark: 2, matriarch: 0, interval: 0.66 },
  { wraith: 26, wolf: 26, golem: 9, mite: 20, wisp: 9, bulwark: 2, matriarch: 0, interval: 0.64 },
  { wraith: 24, wolf: 22, golem: 8, mite: 16, wisp: 8, bulwark: 2, matriarch: 1, interval: 0.6 },
];

// Creature health grows with the wave so late waves stay dangerous. The
// factor is gentler than v2's 1.14: sixteen waves at 1.14 would make the
// last waves' health seven times base, which no defence could hold.
// (Tuned from 1.11 after the first v3 self-test: the defence collapsed at
// wave 12, so the late waves' health and numbers were both trimmed.)
export function enemyHp(kind, wave) {
  return Math.round(ENEMIES[kind].hp * Math.pow(1.095, wave - 1));
}

// What the Keeper can build. range in px, damage per hit (or per second for
// auras), rate in seconds between shots. wall blocks a road instead of firing.
export const TOWERS = {
  brazier: {
    key: '1', name: 'Brazier', cost: 30, range: 95, damage: 18, rate: 0.5,
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
  // New in v5: a cold lantern that slows the march in its ring, and a
  // long-range mortar whose shards burst over a crowd. Six towers now —
  // Emberline advertises six, and the build menu shows them all.
  lantern: {
    key: '5', name: 'Frost Lantern', cost: 45, range: 110, damage: 0, rate: 0.5, slow: 0.7, slowTime: 1.0,
    blurb: 'Cold light slows the march.',
  },
  mortar: {
    key: '6', name: 'Shard Mortar', cost: 60, range: 300, damage: 30, rate: 1.6, splash: 45,
    blurb: 'Long-range shards that burst.',
  },
};
export const TOWER_KEYS = ['brazier', 'cannon', 'bell', 'wall', 'lantern', 'mortar'];
export const UPGRADE_COST_FRACTION = 0.6;
export const UPGRADE_DAMAGE_FRACTION = 0.6;
export const MAX_TOWER_LEVEL = 3;

// The Keeper: a guardian who walks the square and throws ember bolts.
export const KEEPER = {
  speed: 210, radius: 14, boltDamage: 22, boltSpeed: 520, boltRate: 0.22,
  boltRadius: 5, bellFreezeSeconds: 2.5, bellCooldownSeconds: 12,
};

// The Lantern Sweep (v6): hold right-click or Q and the Keeper sweeps a
// cone of lantern light toward the mouse. Frost in the cone is slowed and
// scorched; towers the light touches are rekindled and fire half again as
// hard for two seconds. The sweep drinks oil, which refills while the
// lantern rests — the Keeper chooses when the light matters most.
export const SWEEP = {
  range: 260, halfAngle: 0.5, slow: 0.45, burnDps: 14,
  drainPerSecond: 26, refillPerSecond: 16, rekindleSeconds: 2, rekindleMult: 1.5,
  // Once the oil runs dry the lantern locks until it has gathered this
  // much again — without the lock the sweep would flicker on and off at
  // the bottom of the tank, which reads as a broken light, not a choice.
  rechargeAt: 40,
};
export const OIL_MAX = 100;

// Dawn Boons (v6): after every wave the dawn offers three blessings and
// the Keeper takes one. Each is a real number the game already uses — a
// stronger bolt, a longer bell, deeper pockets, hotter braziers, harder
// cannon shells, iron walls, swifter towers, a fuller lantern.
export const BOONS = {
  emberHeart: { name: 'Ember Heart', blurb: 'Keeper bolts +30% damage.' },
  longFuse: { name: 'Long Fuse', blurb: 'The great bell freezes +1s.' },
  deepPockets: { name: 'Deep Pockets', blurb: '+40 shards, right now.' },
  kindling: { name: 'Kindling', blurb: 'Braziers burn +40% damage.' },
  frostbiteRounds: { name: 'Frostbite Rounds', blurb: 'Ember Cannons +25% damage.' },
  ironWalls: { name: 'Iron Walls', blurb: 'Every Snow Wall +200 strength.' },
  swiftHands: { name: 'Swift Hands', blurb: 'All towers fire 15% faster.' },
  lanternOil: { name: 'Lantern Oil', blurb: 'Lantern +40 oil, refilled now.' },
};

// Turning the dawn (v6): STORMKEEPER's reroll, the one top-10 edge the
// dawn did not have. Once per offer, the three cards are drawn again.
export const REROLL_COST = 15;

// The Keeper's Ember Arts (v8): three aimed powers with cooldowns, so
// the Keeper himself is a third verb beside the bell and the sweep —
// Z freezes the march around him, X fans piercing embers at the mouse,
// C kindles the hearth and quickens every tower.
export const ARTS = {
  nova: { key: 'z', name: 'Frost Nova', cooldown: 14, range: 220, freeze: 3, damage: 40 },
  surge: { key: 'x', name: 'Ember Surge', cooldown: 10, bolts: 9, spread: 0.7, damage: 30, speed: 560 },
  kindle: { key: 'c', name: 'Kindle', cooldown: 20, warmth: 10, rate: 2 / 3, seconds: 6 },
};

// The Moon Turns (v7): SUNWRIGHT's moving sun, in our own sky. The moon
// crosses the square as the waves pass — low in the east on the first wave,
// high over the hearth by the last — and the band of moonlight under it
// is where the defence strikes hardest: towers standing in the band fire
// a quarter harder, the Keeper's bolts bite a quarter deeper, and the
// frost caught in the silver light walks slower. The band moves every
// wave, so the strong ground moves with it — no two waves play the same,
// and the frame always shows where the light is.
export const MOON = {
  bandHalfWidth: 150,
  towerMult: 1.25,
  keeperMult: 1.25,
  slow: 0.9,
};

// Ember Wards (v7): MARGINALIA's drawn verb, in light instead of ink.
// Press V for the ward tool, then drag the mouse to trace a line of light
// across the board and release to lay it: a ward is one stroke, at most
// 360 px, costing a shard per 10 px (at least 8, at most 36), and it
// burns and slows every creature that touches it for twelve seconds.
// Four wards at most; a fifth lays the oldest to rest.
export const WARD = {
  costPerPx: 1 / 10,
  minCost: 8,
  maxCost: 36,
  maxLength: 360,
  minLength: 40,
  maxWards: 4,
  lifetime: 12,
  burnDps: 22,
  slow: 0.6,
  reach: 16,
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
