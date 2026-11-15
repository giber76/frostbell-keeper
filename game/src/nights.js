// The night in three nights: the sixteen waves are grouped into three
// chapters, and dawn breaks briefly between them — a breath, a bonus, and
// a name for the stretch the Keeper has survived. The top entries frame
// their depth as a journey (Lanternfin: "a descent into the deep";
// Mothlight: "Seven Nights of the Last Lantern") — the nights are ours.

export const NIGHTS = [
  { from: 1, to: 5, short: 'NIGHT ONE', title: 'The First Snow' },
  { from: 6, to: 10, short: 'NIGHT TWO', title: 'The Deep Night' },
  { from: 11, to: 16, short: 'NIGHT THREE', title: 'The Longest Night' },
];

// The dawn bonus: shards for holding a whole night, paid when the night
// ends (after waves 5 and 10).
export const NIGHT_BONUS_SHARDS = 25;

export function nightForWave(wave) {
  for (const n of NIGHTS) {
    if (wave >= n.from && wave <= n.to) return n;
  }
  return NIGHTS[NIGHTS.length - 1];
}

// True when this wave ends a night (but not the last wave — that is dawn
// itself, and the victory screen says so).
export function nightEndsAt(wave) {
  return (wave === 5 || wave === 10);
}
