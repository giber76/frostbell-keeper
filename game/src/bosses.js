// The bosses of the night: the named creatures whose arrival is a moment
// in itself, with a wide HP bar across the top of the screen. The Rime Wolf
// Alpha hunts at wave 5, the Frostbite Matron — a lesser Matriarch — at
// wave 10, and the Frost Matriarch herself at wave 16, the last wave.
// A boss below half health is enraged: she runs faster and burns brighter.

import { TOTAL_WAVES } from './config.js';

export const BOSS_KINDS = ['alpha', 'matron', 'matriarch'];

export function isBossKind(kind) {
  return BOSS_KINDS.includes(kind);
}

// Which boss, if any, walks in this wave.
export function bossForWave(wave) {
  if (wave === 5) return 'alpha';
  if (wave === 10) return 'matron';
  if (wave === TOTAL_WAVES) return 'matriarch';
  return null;
}

// Enraged speed multiplier below half health.
export function bossEnrageFactor(kind) {
  if (kind === 'matriarch') return 1.4;
  if (kind === 'matron') return 1.35;
  if (kind === 'alpha') return 1.3;
  return 1;
}

// The wide bar's label for a boss on the field.
export function bossBarLabel(kind, enraged) {
  if (kind === 'matriarch') {
    return enraged ? 'THE FROST MATRIARCH — PHASE 2 · ENRAGED' : 'THE FROST MATRIARCH — PHASE 1';
  }
  if (kind === 'matron') {
    return enraged ? 'FROSTBITE MATRON — PHASE 2 · ENRAGED' : 'FROSTBITE MATRON — PHASE 1';
  }
  return enraged ? 'RIME WOLF ALPHA — PHASE 2 · ENRAGED' : 'RIME WOLF ALPHA';
}
