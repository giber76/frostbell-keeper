// The wind turns every wave: the night's one rule that changes as the
// waves pass, so no two waves play the same. Each wind is a trade — the
// march runs faster, but every kill pays more; the storm hardens the
// creatures, but your bolts bite deeper. The final wave brings the Dawn
// Wind, warm from the morning. A wind is a fixed table, never a roll, so
// a seeded night replays exactly. The top entries name their one mechanic
// in the title (SUNWRIGHT: "the sun moves every wave") — the wind is ours,
// and the title screen says so in plain words.

export const WINDS = {
  still: {
    id: 'still', name: 'Still Night', blurb: 'The air holds its breath.',
    enemySpeed: 1, enemyHp: 1, towerDamage: 1, towerRange: 1,
    boltDamage: 1, shardBonus: 1, snowDrift: 0,
  },
  ember: {
    id: 'ember', name: 'Ember Breeze', blurb: 'Warm wind feeds the flames.',
    enemySpeed: 1.05, enemyHp: 1, towerDamage: 1.15, towerRange: 1,
    boltDamage: 1, shardBonus: 1, snowDrift: 20,
  },
  gale: {
    id: 'gale', name: 'North Gale', blurb: 'The march runs faster — every kill pays more.',
    enemySpeed: 1.15, enemyHp: 1, towerDamage: 1, towerRange: 1,
    boltDamage: 1, shardBonus: 1.25, snowDrift: 45,
  },
  snow: {
    id: 'snow', name: 'Soft Snowfall', blurb: 'Snow muffles the world; all move slower.',
    enemySpeed: 0.9, enemyHp: 1, towerDamage: 1, towerRange: 0.9,
    boltDamage: 1, shardBonus: 1, snowDrift: -15,
  },
  blizzard: {
    id: 'blizzard', name: 'Blizzard', blurb: 'The storm hardens them — your bolts bite deeper.',
    enemySpeed: 1, enemyHp: 1.1, towerDamage: 1, towerRange: 1,
    boltDamage: 1.25, shardBonus: 1, snowDrift: -60,
  },
  dawn: {
    id: 'dawn', name: 'Dawn Wind', blurb: 'A warm wind from the morning.',
    enemySpeed: 0.95, enemyHp: 1, towerDamage: 1, towerRange: 1,
    boltDamage: 1, shardBonus: 1.5, snowDrift: 10,
  },
};

// One wind per wave, fixed in the schedule: the boss waves get the winds
// that make their arrival a moment (a gale for the Alpha, a blizzard for
// the Matron), and the last wave gets the Dawn Wind at the Keeper's back.
export const WAVE_WINDS = [
  'still', 'ember', 'gale', 'still',
  'gale', 'snow', 'ember', 'blizzard',
  'gale', 'blizzard', 'snow', 'ember',
  'gale', 'blizzard', 'snow', 'dawn',
];

export function windForWave(wave) {
  const id = WAVE_WINDS[Math.max(0, Math.min(wave - 1, WAVE_WINDS.length - 1))];
  return WINDS[id];
}
