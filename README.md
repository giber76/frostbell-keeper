# FROSTBELL — Keeper of the Last Hearth

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/giber76/frostbell-keeper/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/giber76/frostbell-keeper/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A winter hearth-defense game for the [make.fun best-game-01](https://make.fun/bounty/best-game-01) bounty ($1,000, top 10 share).

The frost marches on the village. Ten nights of wisps, wraiths, wolves and golems — and on the tenth night the Frost Matriarch herself — come down the snow for the one warm thing left: the hearth. But the Keeper does not stand back and watch towers fight. **The light is the weapon, and it is yours to steer.**

Move the mouse and the hearth's beam follows — a living line of light that burns everything it touches, 34 damage a second, wide and cool. Hold click or SPACE and it narrows into a focused lance, 120 damage a second, hot enough to cut through a golem's armor. The focus meter drains while you hold it and refills while you let go; run it dry and the light locks until it breathes back to 40.

**Ice mirrors bend the beam.** Click empty ground to place one (◆15 embers). The beam bounces off it and burns half again as hard after the bounce — a prism gift makes it stronger still. Click a mirror to select it, turn it with Q / E or the mouse wheel, lift it with a right-click (◆10 back). Five frost pillars stand in the square and the beam cannot cross them: bounce around them, or let the march walk into the light on its own. Glimmer shards drift down through the night — catch them with the beam for ◆6 each.

**After every night the dawn offers three gifts** — another mirror slot, hotter light, a cooler focus, a stronger prism, a repaired hearth, a wider sweep — and the Keeper takes one. **The march grows:** each night brings more creatures, tougher hides, faster feet, and on night ten the Frost Matriarch holds off at range and throws ice bolts at the hearth. Every end screen reports the night's ledger: kills by kind, best combo, mirrors placed, seconds of focus held, shards gathered, gifts taken.

## How to play

- **Mouse** aims the beam — it burns everything it touches.
- **Hold click or SPACE** to focus: a narrow beam, 120 damage a second, cuts through armor. Watch the focus meter.
- **Click empty ground** to place an ice mirror (◆15). **Click a mirror** to select it, **Q / E or the mouse wheel** to turn it, **right-click** to lift it (◆10 back).
- **After every night**, the dawn offers three gifts — **click a card, or press 1 / 2 / 3**, to take one.
- **ENTER** starts the next night early (+15 embers), **ESC** pauses, **M** mutes.
- Creatures that reach the hearth steal its warmth. At 0 warmth the village freezes. Hold all ten nights to win.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests, no libraries — plain static files under `game/`. All sound is synthesised with WebAudio.

## Screenshots

Real renders of the game's own code, staged with `?shot=title|build|play|victory&seed=1` (see `shots.json`):

1. Title screen — 2. Build phase, mirrors set and the dawn's gifts offered — 3. Night five in full fight, the beam bouncing off mirrors around the frost pillars — 4. Dawn breaks (victory, with the night's ledger)

## Entry

- `main.ts` (Node 22, stdlib only) copies `game/` + `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-game.ts` (kit copy, unchanged).
- License: MIT.
