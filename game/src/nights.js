// Nights and the dawn's gifts. Ten nights, each with its own name and its
// own mix of frost; the Matriarch comes on the tenth. Between nights the
// dawn offers three gifts and the keeper takes one — a fourth mirror, a
// hotter beam, a deeper focus, a mended hearth, a prism that makes the
// beam bite harder after its first bounce, or a wider sweep.

import { NIGHTS } from './config.js';

export const NIGHT_NAMES = [
  'Night One — The First Snow',
  'Night Two — The Pack Gathers',
  'Night Three — Stone and Snow',
  'Night Four — Howling Dark',
  'Night Five — The Rime Alpha',
  'Night Six — The Long Dark',
  'Night Seven — Whispers in the Pines',
  'Night Eight — The Glacier Wall',
  'Night Nine — Storm Before Dawn',
  'Night Ten — The Frost Matriarch',
];

export function nightComposition(night, rng) {
  const list = [];
  const add = (kind, count) => {
    for (let i = 0; i < count; i += 1) list.push(kind);
  };
  add('wisp', 4 + night);
  add('wraith', 3 + night);
  if (night >= 2) add('wolf', 2 + night);
  if (night >= 4) add('golem', Math.floor(night / 2));
  if (night >= 6) add('wisp', 4);
  if (night === NIGHTS) add('matriarch', 1);
  // Shuffle, but keep the Matriarch last so the night ends on her.
  const boss = list.filter((k) => k === 'matriarch');
  const rest = list.filter((k) => k !== 'matriarch');
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return rest.concat(boss);
}

export function nightInterval(night) {
  return Math.max(0.45, 1.05 - night * 0.05);
}

export function nightHpMult(night) {
  return 1 + (night - 1) * 0.09;
}

export const UPGRADES = [
  {
    id: 'mirror',
    name: 'Fourth Shard',
    blurb: '+1 mirror slot, ready to place.',
    apply(g) { g.maxMirrors = Math.min(8, g.maxMirrors + 1); },
  },
  {
    id: 'damage',
    name: 'Heartfire',
    blurb: 'The beam burns +20% hotter.',
    apply(g) { g.damageMult *= 1.2; },
  },
  {
    id: 'focus',
    name: 'Still Flame',
    blurb: 'Focus drains 25% slower.',
    apply(g) { g.focusDrainMult *= 0.75; },
  },
  {
    id: 'repair',
    name: 'Banked Coals',
    blurb: 'Mend the hearth +30 warmth.',
    apply(g) { g.hearthHp = Math.min(100, g.hearthHp + 30); },
  },
  {
    id: 'prism',
    name: 'Prism Heart',
    blurb: 'The beam bites +50% harder after its first bounce.',
    apply(g) { g.prismMult *= 1.5; },
  },
  {
    id: 'wide',
    name: 'Wide Dawn',
    blurb: 'The sweep grows +40% wider and +15% hotter.',
    apply(g) { g.sweepWidthMult *= 1.4; g.sweepDamageMult *= 1.15; },
  },
];

export function offerUpgrades(rng, count) {
  const pool = [...UPGRADES];
  const offered = [];
  while (offered.length < count && pool.length > 0) {
    const i = Math.floor(rng.next() * pool.length);
    offered.push(pool.splice(i, 1)[0]);
  }
  return offered;
}
