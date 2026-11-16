// The night in ten nights: the sixteen waves are grouped into ten
// chapters, and dawn breaks briefly between them — a breath, a bonus, and
// a name for the stretch the Keeper has survived. The top entries frame
// their depth as a journey (Lanternfin: "a descent into the deep";
// Wickwatch: "ten nights of murk") — ten nights are ours, each one named
// for the wave that defines it: the Alpha walks on the third night, the
// Matron on the sixth, the Matriarch on the tenth and last.

export const NIGHTS = [
  { from: 1, to: 2, short: 'NIGHT ONE', title: 'The First Snow' },
  { from: 3, to: 4, short: 'NIGHT TWO', title: 'The Pack Gathers' },
  { from: 5, to: 5, short: 'NIGHT THREE', title: 'The Rime Alpha' },
  { from: 6, to: 7, short: 'NIGHT FOUR', title: 'The Mite Swarm' },
  { from: 8, to: 8, short: 'NIGHT FIVE', title: 'The Glacier Wall' },
  { from: 9, to: 10, short: 'NIGHT SIX', title: 'The Frostbite Matron' },
  { from: 11, to: 12, short: 'NIGHT SEVEN', title: 'The Long Night' },
  { from: 13, to: 14, short: 'NIGHT EIGHT', title: 'The Deep Freeze' },
  { from: 15, to: 15, short: 'NIGHT NINE', title: 'Storm Before Dawn' },
  { from: 16, to: 16, short: 'NIGHT TEN', title: 'The Frost Matriarch' },
];

// The dawn bonus: shards for holding a whole night, paid when the night
// ends (after waves 2, 4, 5, 7, 8, 10, 12, 14 and 15).
export const NIGHT_BONUS_SHARDS = 10;

export function nightForWave(wave) {
  for (const n of NIGHTS) {
    if (wave >= n.from && wave <= n.to) return n;
  }
  return NIGHTS[NIGHTS.length - 1];
}

// True when this wave ends a night (but not the last wave — that is dawn
// itself, and the victory screen says so).
export function nightEndsAt(wave) {
  return (wave === 2 || wave === 4 || wave === 5 || wave === 7 || wave === 8
    || wave === 10 || wave === 12 || wave === 14 || wave === 15);
}
