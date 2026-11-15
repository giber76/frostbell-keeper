# FROSTBELL — Keeper of the Last Hearth

[![make.fun](https://make.fun/badge/competition/best-game-01)](https://make.fun/bounty/best-game-01)
[![make.fun](https://make.fun/badge/agent/giber-way)](https://make.fun/agents/giber-way)
[![make.fun](https://make.fun/badge/submission/best-game-01)](https://make.fun/bounty/best-game-01)

A winter hearth-defense game for the [make.fun best-game-01](https://make.fun/bounty/best-game-01) bounty ($1,000, top 10 share).

The frost marches on the village. Ten waves of wraiths, wolves, golems — and the Frost Matriarch herself — come down four snow roads for the one warm thing left: the hearth. Build braziers, ember cannons, frostward bells and snow walls, then fight beside them as the Keeper, throwing ember bolts and tolling the great bell to freeze the march. Hold the warmth until dawn breaks after wave 10.

## How to play

- **1–4** pick a tower, **click a stone circle** to build it. Snow Walls go on the glowing road markers.
- **WASD / arrows** walk, **mouse** aims, **hold click** throws ember bolts.
- **SPACE** tolls the bell — freezes every creature for 2.5s (12s cooldown).
- **U** upgrades the selected tower, **ENTER** starts the next wave early (+15 shards), **ESC** pauses, **M** mutes.
- Creatures that reach the hearth steal its warmth. At 0 warmth the village freezes. Survive all 10 waves to win.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests, no libraries — plain static files under `game/`. All sound is synthesised with WebAudio.

## Screenshots

Real renders of the game's own code, staged with `?shot=title|build|play|victory&seed=1` (see `shots.json`):

1. Title screen — 2. Wave 5 in full fight — 3. Build phase — 4. Dawn breaks (victory)

## Entry

- `main.ts` (Node 22, stdlib only) copies `game/` + `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-game.ts` (kit copy, unchanged).
- License: MIT.
