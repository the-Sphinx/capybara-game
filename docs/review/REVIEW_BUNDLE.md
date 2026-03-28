# REVIEW BUNDLE

## 0. Final Fix Follow-Up

### Math Garden Five-World Progression Pass
- Expanded Math Garden’s authored progression so the five core worlds now each contain 10 levels:
- `number_garden`
- `addition_field`
- `subtraction_patch`
- `multiplication_meadow`
- `division_grove`
- Added new Math recipes for:
- number-property collection
- addition progression
- subtraction progression
- multiplication tables and mixed multiplication
- exact-division progression
- Extended the `answer_equation` contract to support `multiplication` and `division`, plus lightweight authored rule fields for:
- `fixedOperand`
- `targetValue`
- `leftRange`
- `rightRange`
- Updated the Math runtime so division levels generate exact whole-number equations and multiplication levels can express table-style/fixed-operand recipes.

### Reviewer Focus
- Confirm the five core Math world files now each have 10 levels using slots `1..10`.
- Confirm the new recipe ids in `math_garden/game.json` stay world-themed and are not cross-topic.
- Confirm `math_garden.game.schema.json` and `docs/minigame_mode_authoring.md` now expose the expanded `answer_equation` authoring surface.
- Confirm untouched worlds `geometry_yard` and `fraction_forest` still reference valid recipes and remain unchanged.

### Config Structure Cleanup
- Followed up by simplifying the authored config split:
- `game.json` now contains shared game config plus `worldIds`
- world-specific progression content now lives in `worlds/<worldId>.json`
- Removed the duplicate `levelSelectBackgroundPath` from `worldSelect`; `levelSelect.backgroundPath` is now the only source for level-select art.
- Updated `GameManager` to load and assemble the per-world files before plugin normalization.
- Regenerated schemas and authoring docs to match this smaller, clearer authored structure.

### Reviewer Focus
- Confirm `capy-village/public/config/games/*/game.json` no longer embeds full world blocks inline.
- Confirm world files now exist under `capy-village/public/config/games/*/worlds/`.
- Confirm the generated schema requires `worldIds` and no longer includes `worldSelect.levelSelectBackgroundPath`.
- Confirm the runtime still derives `worldSelect.worlds` correctly from the loaded world files.

### What Changed
- Implemented the final authoring-contract cleanup after the plugin-manifest refactor.
- Tightened `capy-village/src/games/plugins/pluginUtils.js` so authored manifest validation now reports path-specific errors and validates:
- top-level defaults
- world-select metadata
- level-select slot layout
- arcade config shape
- world sign/click boxes
- level goals, rewards, and bonus tiers
- Fixed resolved recipe normalization so runtime handlers always receive the descriptor metadata needed to instantiate the correct handler class.
- Removed the leftover local handler-map pattern from game plugins by attaching runtime handler classes directly to descriptors.
- Strengthened generated schema output under `capy-village/src/config/games/schemas/*.game.schema.json` so top-level sections and recipe fields are concretely typed rather than left as placeholder objects.
- Regenerated `docs/minigame_mode_authoring.md` so it now documents the current single `game.json` structure, core concepts, and concrete recipe/level examples.
- Added the expected script alias:
- `npm run generate:authoring`

### Reviewer Focus
- Confirm the generated `math_garden.game.schema.json` now includes explicit enums like `matcher: even|odd|prime|divisible_by` and typed arrays/numbers for Math recipe fields.
- Confirm plugin runtime creation no longer depends on a separate per-plugin mini-registry and instead derives handler classes from the resolved descriptor.
- Confirm `docs/minigame_mode_authoring.md` now matches the current `game.json` authoring model rather than older split-file terminology.
- Confirm runtime validation errors are now specific enough to tell authors exactly which manifest path is invalid.

### Verification
- Ran `npm run generate:authoring` successfully in `capy-village`.
- Ran `npm run build` successfully in `capy-village`.

## 17. Math Garden World-Aligned Redesign

### What Changed
- Left `number_garden` unchanged as instructed.
- Replaced the mismatched redesign content in the active Math worlds with world-aligned progressions:
  - `addition_field` now uses only `answer_equation` with `operation: "addition"`
  - `subtraction_patch` now uses only `answer_equation` with `operation: "subtraction"`
  - `multiplication_meadow` now uses only divisibility-based `collect_numbers`
  - `division_grove` now also uses divisibility-based `collect_numbers`, but with tighter timing, higher penalties, and harder divisors
- Added new reusable divisibility recipes in `capy-village/public/config/games/math_garden/game.json`:
  - `collect_divisible_by_6`
  - `collect_divisible_by_8`
  - `collect_divisible_by_10`
- Emptied unsupported worlds so they no longer mis-teach unrelated concepts:
  - `capy-village/public/config/games/math_garden/worlds/geometry_yard.json`
  - `capy-village/public/config/games/math_garden/worlds/fraction_forest.json`

### Reviewer Focus
- Confirm `number_garden` was not modified by this pass.
- Confirm `addition_field` contains no collect-mode or mixed-operation levels.
- Confirm `subtraction_patch` contains no odd/even, prime, or divisibility collection levels.
- Confirm `multiplication_meadow` and `division_grove` both use divisibility collection, but with clearly different pacing and penalty feel.
- Confirm empty `geometry_yard` and `fraction_forest` worlds do not cause hub regressions and are preferable to misleading placeholder gameplay.

### Verification
- Ran `npm run build` successfully in `capy-village`.
- Confirmed via config sanity check:
  - `addition_field`, `subtraction_patch`, `multiplication_meadow`, and `division_grove` each have 10 levels
  - `geometry_yard` and `fraction_forest` each have 0 levels

## 18. World Unlock Progression

### What Changed
- Fixed the user-progress gap where the save system stored stable `levelId`s correctly but world-to-world advancement stopped at the final level of each world.
- Added explicit world unlock metadata in Math Garden world configs:
  - `startsUnlocked`
  - `unlockAfterWorldId`
- Added `unlockLevel(...)` to `capy-village/src/SaveManager.js` so the app can explicitly seed the first level of a newly available world.
- Updated `capy-village/src/games/GameManager.js` so `getNextAdventureLevel(...)` now:
  - returns the next level inside the current world when available
  - otherwise returns the first level of the configured next world in the unlock chain
- Updated `capy-village/src/ui/HubModal.js` so world lock state respects configured world unlock rules instead of relying only on `unlockedLevelIds` side effects.

### Reviewer Focus
- Confirm clearing `*_10` in an active Math world now unlocks `*_1` of the next configured world.
- Confirm the first world can be configured as initially open via `startsUnlocked: true`.
- Confirm future worlds can be configured as locked/unlocked independently through world config rather than implicit hub text only.
- Confirm older saves that had already completed prerequisite worlds will now get the first level of the next world unlocked when the hub rebuilds world models.

### Verification
- Ran `npm run build` successfully in `capy-village`.
- Confirmed the current Math unlock chain:
  - `number_garden` starts unlocked
  - `addition_field` unlocks after `number_garden`
  - `subtraction_patch` unlocks after `addition_field`
  - `multiplication_meadow` unlocks after `subtraction_patch`
  - `division_grove` unlocks after `multiplication_meadow`

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
- Refined `config/games/math_garden/level_select.json` so shared node positions are stored as reusable `slots` rather than global `levelNum`-keyed positions.
- Reworked Math level-overlay binding so each world’s level list is assigned onto shared slots by sorted world level order.
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
level_select.json -> shared slot coordinates and the shared level-select background image
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
- Reviewed shared-slot mapping to confirm world level overlays no longer depend on global `levelNum` coordinates in `level_select.json`.

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
- Config home is now split by purpose:
  - authored runtime JSON lives in `capy-village/public/config/...`
  - editor-only schema lives in `capy-village/src/config/layouts/village_layout.schema.json`
- Runtime and hub no longer depend on published copies under `public/assets/config/...`.
- `publish-assets` is now asset-focused again; it removes old generated config/layout output instead of republishing config JSON.

## 13. Minigame Engine Rewrite

### What Changed
- Added a shared engine shell at `capy-village/src/games/engine/EngineGame.js` to own common minigame lifecycle, HUD, timer loop, reward handling, result screens, and hub return flow.
- Added explicit mode families under `capy-village/src/games/modes/`:
  - `collection`
  - `answer`
  - `stream`
  - `choice_round`
- Refactored:
  - `MathGardenGame`
  - `LanguageGroveGame`
  - `WatermelonCatchGame`
  into thin adapters over that shared engine plus per-game runtime providers.
- Added per-game mode recipe files:
  - `capy-village/public/config/games/math_garden/modes.json`
  - `capy-village/public/config/games/language_grove/modes.json`
  - `capy-village/public/config/games/watermelon_catch/modes.json`
- Added stable `levelId` to adventure level JSON and switched save/hub progression to level-id-based unlock/completion.
- Removed authored `subType` from level JSON so mode family now derives from the selected mode recipe.

### Save/Progress Model
- `SaveManager` now uses `completedLevelIds` and `unlockedLevelIds`.
- Save version bumped to `4`.
- Migration intentionally resets minigame progression to the new level-id model while keeping coins and closet/equipment data.

### Reviewer Focus
- Confirm `GameManager` now loads `modes.json` in addition to `arcade.json`, `world_select.json`, `level_select.json`, and per-world level JSON.
- Confirm hub world/level overlays now rely on `levelId` rather than `levelNum` for unlock/completion state.
- Confirm Math, Language, and Watermelon no longer duplicate their own timer/HUD/result shell logic.

### Verification
- Ran `npm run build` successfully in `capy-village`.

## 14. Typed Mode Registry And Authoring Contract

### What Changed
- Added a typed mode registry in `capy-village/src/games/modeRegistry.js` so authored recipes now declare a single explicit `type` instead of loose `family + ad hoc keys`.
- Replaced legacy recipe ids with explicit authored ids across Math Garden, Language Grove, and Watermelon Catch.
- Refactored game runtime handlers into explicit class-backed mode implementations:
  - `MathDivisibilityCollectionMode`
  - `MathOperationAnswerMode`
  - `LanguageLettersStreamMode`
  - `LanguageCategoryStreamMode`
  - `LanguageSentenceChoiceMode`
  - `LanguageOppositesChoiceMode`
  - `LanguageSynonymsChoiceMode`
  - `LanguageRiddleChoiceMode`
  - `WatermelonClassicCollectionMode`
- Added authoring schema files:
  - `capy-village/src/config/games/schemas/math_garden.modes.schema.json`
  - `capy-village/src/config/games/schemas/language_grove.modes.schema.json`
  - `capy-village/src/config/games/schemas/watermelon_catch.modes.schema.json`
- Added `docs/minigame_mode_authoring.md` documenting the valid types, params, and level override keys.

### Reviewer Focus
- Confirm all level JSON now references the new typed recipe ids rather than the old short ids.
- Confirm `GameManager` normalizes and validates both mode definitions and level override keys through `modeRegistry.js`.
- Confirm mode authoring is now discoverable through the schema files and authoring doc rather than hidden in runtime branching.
- Confirm Language Grove's authored `itemCount` now aligns with runtime behavior instead of being ignored.

### Verification
- Ran `npm run build` successfully in `capy-village` after the typed-registry refactor.

## 15. Plugin Manifest Architecture

### What Changed
- Removed the central authored-mode bottleneck by deleting `capy-village/src/games/modeRegistry.js`.
- Added explicit per-game plugins under `capy-village/src/games/plugins/` with small colocated mode descriptor files.
- Replaced split game config files with one `game.json` manifest per game in `capy-village/public/config/games/<gameId>/`.
- Preserved the shared runtime base classes (`CollectionMode`, `AnswerMode`, `StreamMode`, `ChoiceRoundMode`) while moving game-specific recipe resolution into plugin descriptors.
- Added inheritance-aware manifest normalization so authoring now flows through:
  - game defaults
  - world defaults
  - level overrides
- Generated authoring docs and schemas from descriptor metadata instead of maintaining a separate handwritten mode contract.

### Reviewer Focus
- Confirm `GameManager` now loads only `game.json` per game and resolves levels/recipes through `GAME_PLUGINS`.
- Confirm the old authored config split (`world_select.json`, `level_select.json`, `modes.json`, `levels/*.json`, `arcade.json`) is gone from active runtime paths.
- Confirm Math, Language, and Watermelon all create handlers through their game plugin, not a central registry file.
- Confirm `docs/minigame_mode_authoring.md` and `capy-village/src/config/games/schemas/*.game.schema.json` are generated from plugin descriptor metadata.
- Confirm Math recipe authoring can now express new number rules, such as prime matching, without touching central runtime wiring.

### Verification
- Ran `npm run generate:minigame-authoring` successfully in `capy-village`.
- Ran `npm run build` successfully in `capy-village`.

## 16. Math Garden Redesigned Core Levels

### What Changed
- Reworked the five active Math Garden worlds into a more varied teaching sequence with user-facing titles:
  - `Even & Odd`
  - `Multiples`
  - `Prime Numbers`
  - `Add & Subtract`
  - `Mixed Mastery`
- Reauthored the corresponding world configs under `capy-village/public/config/games/math_garden/worlds/` so each has 10 levels with stronger variation in:
  - rule complexity
  - speed
  - distractor density
  - mid-level instruction changes
- Expanded `collect_numbers` authoring in `capy-village/src/games/plugins/math_garden/collectNumbers.mode.js` to support:
  - composed matcher objects
  - `not`
  - `any_of`
  - `all_of`
  - authored `spawnDelayRange`
  - authored `fallSpeedRange`
  - authored phased rule switches via `rules.phases`
- Updated `capy-village/src/games/mathGarden/modeRuntime.js` so collection levels can switch prompts/rules mid-level and refresh on-screen items cleanly when the active rule changes.
- Collapsed the oversized Math recipe catalog in `capy-village/public/config/games/math_garden/game.json` into a smaller reusable toolkit that world levels customize via overrides.
- Fixed top-row level overlays in `capy-village/src/ui/HubModal.js` and `capy-village/src/style.css` so the bubble can render below the node instead of clipping off-screen.

### Reviewer Focus
- Confirm the redesigned world titles and unlock text now match the visible progression path in the hub.
- Confirm every collection level that uses `collect_custom_rule` includes a clear authored prompt via `rules.phases`.
- Confirm phased collection levels switch instructions at the intended caught-count thresholds and clear old falling items on transition.
- Confirm the new matcher composition rules (`not`, `any_of`, `all_of`) behave correctly for divisibility and prime-related challenges.
- Confirm top-row level info bubbles no longer clip beyond the screen edge.

### Verification
- Ran `npm run generate:authoring` successfully in `capy-village`.
- Ran `npm run build` successfully in `capy-village`.
