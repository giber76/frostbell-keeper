# FROSTBELL — Keeper of the Last Hearth

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/giber76/frostbell-keeper/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/giber76/frostbell-keeper/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A winter hearth-defense game for the [make.fun best-game-01](https://make.fun/bounty/best-game-01) bounty ($1,000, top 10 share).

The frost marches on the village. Sixteen waves of wraiths, wolves, golems, mites and wisps — and the Frost Matriarch herself — come down four snow roads for the one warm thing left: the hearth. Build braziers, ember cannons, frostward bells, frost lanterns, shard mortars and snow walls, then fight beside them as the Keeper, throwing ember bolts and tolling the great bell to freeze the march. Hold the warmth until dawn breaks after wave 16.

**The wind turns every wave.** Each wave brings its own wind — a still night, an ember wind, a gale, a snowfall, a blizzard, a dawn wind — and the wind changes everything: creature speed and toughness, tower damage and range, shard rewards, and which way the snow blows. The sixteen waves are told in three nights (Night One: The First Snow, Night Two: The Deep Night, Night Three: The Longest Night), with a dawn bonus between nights. The village lives around the fight: eight buildings, twenty-one pines, four villagers in distinct outfits, a supply sleigh circling the hearth, and animals — a cat dozing by the hearth, a dog trotting the square, a cow by the granary, three chickens pecking by the cottages — while a generative winter melody plays over the battle. Every end screen reports the night's ledger: kills by kind, best combo, towers built and upgraded, bells tolled, shards earned.

## How to play

- **1–6** pick a tower, **click a stone circle** to build it. Snow Walls go on the glowing road markers.
- **WASD / arrows** walk, **mouse** aims, **hold click** throws ember bolts.
- **SPACE** tolls the bell — freezes every creature for 2.5s (12s cooldown).
- **U** upgrades the selected tower, **ENTER** starts the next wave early (+15 shards), **ESC** pauses, **M** mutes.
- Creatures that reach the hearth steal its warmth. At 0 warmth the village freezes. Survive all 16 waves to win.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests, no libraries — plain static files under `game/`. All sound is synthesised with WebAudio.

## Screenshots

Real renders of the game's own code, staged with `?shot=title|build|play|victory&seed=1` (see `shots.json`):

1. Title screen — 2. Wave 16 in full fight (the Frost Matriarch, Night Three, a dawn wind) — 3. Dawn breaks (victory, with the night's ledger) — 4. The hearth is cold (defeat, with the night's ledger)

## Entry

- `main.ts` (Node 22, stdlib only) copies `game/` + `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-game.ts` (kit copy, unchanged).
- License: MIT.
