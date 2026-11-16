// Dawn Boons — v6's choice system. STORMKEEPER's reroll is one of the
// top 10's clearest edges: after every wave the player picks something
// that matters. After each wave the dawn offers three blessings and the
// Keeper takes one — a stronger bolt, a longer bell, deeper pockets, hotter
// braziers, harder cannon shells, iron walls, swifter towers, or a fuller
// lantern. The offer is drawn from the night's own seeded random, so a
// seed replays the same three cards. A wave never starts until the Keeper
// has chosen (the build timer auto-takes the first card if it runs out).

import { BOONS, REROLL_COST } from './config.js';

// Draw three distinct blessings from the pool, in the night's order.
export function offerBoons(g) {
  const ids = Object.keys(BOONS);
  const drawn = [];
  const seen = new Set();
  let guard = 0;
  while (drawn.length < 3 && guard < 40) {
    guard += 1;
    const id = ids[Math.floor(g.random.next() * ids.length)];
    if (seen.has(id)) continue;
    seen.add(id);
    drawn.push(id);
  }
  return drawn;
}

// Take a blessing: apply its effect now, remember it on the night's ledger.
export function pickBoon(g, id) {
  const boon = BOONS[id];
  if (!boon) return false;
  const b = g.boon;
  b.held.push(id);
  b.taken += 1;
  if (id === 'emberHeart') b.boltMult += 0.30;
  else if (id === 'longFuse') b.bellBonus += 1;
  else if (id === 'deepPockets') { g.shards += 40; g.stats.shardsEarned += 40; }
  else if (id === 'kindling') b.brazierMult += 0.40;
  else if (id === 'frostbiteRounds') b.cannonMult += 0.25;
  else if (id === 'ironWalls') {
    b.wallBonus += 200;
    for (const p of [...g.world.plots, ...g.world.walls]) {
      const t = p.tower;
      if (t && t.kind === 'wall') { t.maxHp += 200; t.hp += 200; }
    }
  } else if (id === 'swiftHands') b.rateMult *= 0.85;
  else if (id === 'lanternOil') {
    g.keeper.oilMax += 40;
    g.keeper.oil = g.keeper.oilMax;
  }
  return true;
}

// The dawn's offer can be turned (v6): STORMKEEPER's reroll, the one
// top-10 edge the dawn did not have. Once per offer, for 15 shards, the
// three cards are drawn again from the night's own random — a seed
// replays the same turn, reroll included. Returns the fresh offer, or
// null when the dawn cannot turn (already turned, or too few shards).
export function rerollBoons(g) {
  if (!g.boonOffer || g.boonPicked || g.boon.rerolled) return null;
  if (g.shards < REROLL_COST) return null;
  g.shards -= REROLL_COST;
  g.boon.rerolled = true;
  return offerBoons(g);
}

// The reroll button under the cards: one geometry the game (clicks) and
// the renderer (painting) both read, like the cards above it.
export function rerollButtonRect() {
  return { x: 520, y: 436, w: 240, h: 40 };
}

export function rerollButtonAt(x, y) {
  const r = rerollButtonRect();
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// The night's ledger of blessings, for the end screens and the HUD.
export function boonSummary(held) {
  const counts = {};
  for (const id of held) counts[id] = (counts[id] || 0) + 1;
  return Object.entries(counts).map(([id, n]) => ({
    id, name: BOONS[id].name, n,
  }));
}

// The three cards on the dawn-choice panel: one geometry the game (clicks)
// and the renderer (painting) both read, so a card never drifts from its
// click zone. Cards sit centre-board, three across, keys 7 / 8 / 9.
export function boonCardRect(i) {
  return { x: 200 + i * 300, y: 240, w: 280, h: 170 };
}

export function boonCardAt(x, y) {
  for (let i = 0; i < 3; i += 1) {
    const r = boonCardRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
