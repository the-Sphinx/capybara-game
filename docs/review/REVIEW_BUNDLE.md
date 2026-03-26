# REVIEW BUNDLE

## 1. Task Summary
- Task name: Published minigame config restructure
- Date: 2026-03-26
- Time: 02:10 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Unify minigame world-select assets, level-select assets, and gameplay config under a published JSON-driven structure so authored map metadata no longer lives in JS and all minigames follow the same scalable folder layout.

## 3. What Changed
- Replaced the earlier manifest-based experiment with the simpler final structure:
- `config/games/<gameId>/arcade.json`
- `config/games/<gameId>/world_select.json`
- `config/games/<gameId>/level_select.json`
- `config/games/<gameId>/levels/<worldId>_levels.json`
- Moved Math, Watermelon Catch, and Language Grove adventure/arcade JSON out of `capy-village/src/games/**` into `config/games/**`.
- Added Math-specific published world metadata in:
- `config/games/math_garden/world_select.json`
- `config/games/math_garden/level_select.json`
- `config/games/math_garden/levels/<worldId>_levels.json`
- Moved Math world-select and Number Garden level-select images into:
- `assets/game_ready/games/math_garden/world_select.png`
- `assets/game_ready/games/math_garden/level_select.jpeg`
- Extended the publish step so `config/games/**` is copied into `capy-village/public/assets/config/games/**`.
- Reworked `GameManager` to fetch and cache convention-driven game config at runtime.
- Reworked `main.js` to preload published minigame config instead of importing gameplay JSON from source.
- Reworked `HubModal.js` to read world-select and world-map metadata from `GameManager` cache instead of `worlds.js`.
- Deleted:
- `capy-village/src/games/mathGarden/worlds.js`
- `config/level_points.json`
- bundled minigame `adventure.json` / `arcade.json` files under `capy-village/src/games/**`

## 4. Files Changed
- assets/game_ready/games/math_garden/world_select.png
- assets/game_ready/games/math_garden/level_select.jpeg
- config/games/math_garden/arcade.json
- config/games/math_garden/world_select.json
- config/games/math_garden/level_select.json
- config/games/math_garden/levels/*
- config/games/watermelon_catch/arcade.json
- config/games/watermelon_catch/world_select.json
- config/games/watermelon_catch/level_select.json
- config/games/watermelon_catch/levels/main_levels.json
- config/games/language_grove/arcade.json
- config/games/language_grove/world_select.json
- config/games/language_grove/level_select.json
- config/games/language_grove/levels/main_levels.json
- capy-village/src/games/GameManager.js
- capy-village/src/games/mathGarden/MathGardenGame.js
- capy-village/src/games/watermelonCatch/WatermelonCatchGame.js
- capy-village/src/games/languageGrove/LanguageGroveGame.js
- capy-village/src/main.js
- capy-village/src/ui/HubModal.js
- tools/publish_assets.ts
- docs/review/REVIEW_BUNDLE.md
- docs/progress.md

## 5. Architecture Impact
This replaces the old split source-of-truth with one published config pipeline:
- authored game images under `assets/game_ready/games/**`
- authored game JSON under `config/games/**`
- published runtime consumption from `public/assets/games/**` and `public/assets/config/games/**`

The app now treats minigame config as runtime data loaded through `GameManager`, which removes hardcoded authored world metadata from JS and gives future games/worlds a consistent place to add images, coordinates, and level data.

## 6. Key Implementation Notes
The new runtime config model is:

```text
arcade.json
world_select.json
level_select.json
levels/<worldId>_levels.json
```

Published paths now include:

```text
public/assets/config/games/<gameId>/...
public/assets/games/<gameId>/...
```

Math-specific authored map config is now JSON-only:

```text
world_select.json -> world sign boxes and labels
level_select.json -> all world node coordinates and the shared level-select background image
levels/<worldId>_levels.json -> levels belonging only to that world
```

## 7. Risks / Known Issues
- The app still preloads a fixed list of current minigame ids in `main.js`; that is acceptable for the current 3-game set, but future fully dynamic game discovery would require categories-driven preload.
- Watermelon Catch and Language Grove now carry `world_select.json` and `level_select.json` in the same structure, but both stay disabled for direct level-map behavior.
- This pass was verified through publish/build and code-path inspection, but I intentionally did not start a new Playwright browser session because of the earlier orphan-window issue.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: strongly improved because authored map metadata now lives in published JSON instead of JS constants
- hybrid retrieval: improved because minigame config is now fetched as runtime data while gameplay logic stays in code
- verification layer: improved because published config output can be inspected directly under `public/assets/config/games`
- generic schema: improved through a consistent manifest + levels + worlds layout across games
- inspectability: improved because images and coordinates are now colocated by game/world rather than scattered across flat asset/config files

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from the repo root.
- Ran `npm run build` successfully in `capy-village`.
- Verified published config output exists under `capy-village/public/assets/config/games`.
- Verified published Math game images exist under `capy-village/public/assets/games/math_garden`.
- Reviewed `main.js` and `GameManager` wiring to confirm bundled minigame JSON imports were removed.
- Reviewed `HubModal.js` to confirm world-select and level-select rendering now resolve through cached fetched config rather than `worlds.js`.

## 10. Example Output / Logs
```text
public/assets/config/games/math_garden/world_select.json
public/assets/config/games/math_garden/level_select.json
public/assets/games/math_garden/world_select.png
```

```text
public/assets/config/games/watermelon_catch/levels/main_levels.json
public/assets/config/games/language_grove/arcade.json
```

## 11. Recommended Reviewer Focus
- Inspect the published `assets/config/games/**` output and confirm each game has a manifest plus level JSON.
- Confirm Math world-select and Number Garden level-select image paths now come from config JSON rather than JS constants.
- Confirm there are no remaining source imports of minigame `adventure.json` / `arcade.json` under `capy-village/src`.

## 12. Suggested Next Step
The next strong follow-up would be extending Math’s `worlds/<worldId>.json` coverage beyond `number_garden` so the remaining Math worlds can move from placeholder world-entry screens to authored level-map overlays.
