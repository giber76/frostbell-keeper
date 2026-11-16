# FROSTBELL — Keeper of the Last Hearth

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/giber76/frostbell-keeper/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/giber76/frostbell-keeper/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A winter hearth-defense game for the [make.fun best-game-01](https://make.fun/bounty/best-game-01) bounty ($1,000, top 10 share).

The frost marches on the village. Sixteen waves of wraiths, wolves, golems, mites and wisps — and the Frost Matriarch herself — come down four snow roads for the one warm thing left: the hearth. Build braziers, ember cannons, frostward bells, frost lanterns, shard mortars and snow walls, then fight beside them as the Keeper, throwing ember bolts and tolling the great bell to freeze the march. Hold the warmth until dawn breaks after wave 16.

**The wind turns every wave.** Each wave brings its own wind — a still night, an ember wind, a gale, a snowfall, a blizzard, a dawn wind — and the wind changes everything: creature speed and toughness, tower damage and range, shard rewards, and which way the snow blows. **The moon turns every wave (v7):** the moon crosses the sky as the night passes — low in the east on the first wave, high over the hearth by the last — and the band of silver light under it is where the defence strikes hardest: towers standing in the band fire a quarter harder, the Keeper's bolts bite a quarter deeper, and the frost caught in the moonlight walks slower. The sixteen waves are told in ten nights (Night One: The First Snow, … Night Ten: The Frost Matriarch), with a dawn bonus between nights. **The Keeper's lantern sweeps (v6):** hold right-click (or Q) and the lantern throws a cone of light across the march — frost caught in it is slowed and scorched, and every tower the light touches is rekindled and fires half again as hard. The sweep drinks lantern oil, which refills while the lantern rests. **The Keeper draws ember wards (v7):** press V for the ward tool, then drag the mouse to trace a line of light across the roads and release to lay it — the line burns and slows every creature that touches it for twelve seconds, at a shard per ten pixels of line. **The Keeper's ember arts (v8):** press Z for a frost nova that freezes the march around him, X for an ember surge that fans nine piercing bolts toward the mouse, C to kindle the hearth — +10 warmth, and every tower fires 50% faster for six seconds. Each art has its own cooldown, shown as pips under the Keeper's panel. **Win, and the endless afterglow waits (v8):** from the dawn-breaks screen, press E (or the ENDLESS NIGHT button) to keep the night going — waves without end, growing from the Matriarch's own wave, a Matron every third endless wave, the Matriarch herself every fifth. **After every wave the dawn offers three blessings (v6)** — a stronger bolt, a longer bell, deeper pockets, hotter braziers, harder cannon shells, iron walls, swifter towers, a fuller lantern — and the Keeper takes one. **The dawn's offer can be turned (v6)** — press R, or the button under the cards, to redraw the three blessings for 15 shards, once per dawn. Every boss enrages below half health and runs faster in her second phase. The village lives around the fight: eight buildings, twenty-one pines, four villagers in distinct outfits, a supply sleigh circling the hearth, and animals — a cat dozing by the hearth, a dog trotting the square, a cow by the granary, three chickens pecking by the cottages — while a generative winter melody plays over the battle. Every end screen reports the night's ledger: kills by kind, best combo, towers built and upgraded, bells tolled, wards drawn, shards earned, and the dawn blessings taken.

## How to play

- **1–6** pick a tower, **click a stone circle** to build it. Snow Walls go on the glowing road markers.
- **WASD / arrows** walk, **mouse** aims, **hold click** throws ember bolts.
- **SPACE** tolls the bell — freezes every creature for 2.5s (12s cooldown).
- **Hold right-click (or Q)** sweeps the lantern — slows and scorches the frost in its cone, rekindles the towers it touches (drains oil, refills at rest).
- **Z / X / C** — Frost Nova (freezes the march around the Keeper for 3s), Ember Surge (nine piercing bolts toward the mouse), Kindle (+10 warmth, towers 50% faster for 6s). Each art has its own cooldown.
- **After every wave**, the dawn offers three blessings — **click a card, or press 7 / 8 / 9**, to take one. **R** rerolls the offer (15 shards, once per dawn).
- **U** upgrades the selected tower, **ENTER** starts the next wave early (+15 shards), **ESC** pauses, **M** mutes.
- Creatures that reach the hearth steal its warmth. At 0 warmth the village freezes. Survive all 16 waves to win — then press **E** on the victory screen to keep the night going in the endless afterglow.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests, no libraries — plain static files under `game/`. All sound is synthesised with WebAudio.

## Screenshots

Real renders of the game's own code, staged with `?shot=title|build|play|victory&seed=1` (see `shots.json`):

1. Title screen — 2. Wave 16 in full fight (the Frost Matriarch, Night Ten, a dawn wind, the moon over the east road, an ember ward burning the road, the lantern sweeping, an ember surge in flight) — 3. Dawn breaks (victory, with the night's ledger and blessings, and the endless-night button) — 4. The hearth is cold (defeat, with the night's ledger)

## Entry

- `main.ts` (Node 22, stdlib only) copies `game/` + `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-game.ts` (kit copy, unchanged).
- License: MIT.
