# Progress

## 2026-03-19

### GLB Visibility And Lighting
- Implemented `docs/tasks/capy_glb_visibility_and_toy_lighting_task.md`.
- Added runtime GLB mesh diagnostics for material type, base color, vertex colors, normals state, bounding-box validity, and fallback usage.
- Added runtime geometry sanitation so imported published meshes recompute vertex normals only when needed.
- Simplified imported world materials to a readable matte `MeshStandardMaterial` baseline while preserving vertex colors and usable maps.
- Added a warm clay fallback material for unreadable white/no-map published meshes.
- Updated the runtime renderer to use `sRGB` output, `ACESFilmicToneMapping`, and exposure `1.0`.
- Replaced the old ambient-only world lighting with a hemisphere fill and a warm directional key light.
- Updated the runtime background and ground material so the village reads against a softer toy-like baseline.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Browser-verified the runtime authored village still loads from the published layout and manifest.
- Verified imported published assets are no longer black silhouettes in the live runtime scene.
- Verified runtime diagnostics report:
- `hut_1` uses the warm fallback path
- `mushroom_house` preserves vertex colors without fallback
- `book_statue` uses the warm fallback path

### Known Risks
- Some assets now read as a temporary clay/wood fallback rather than their eventual final authored palette.
- `mushroom_house` is readable but still visually paler than the fallback-treated assets.
- Runtime diagnostics are intentionally verbose for now and may need gating later.

### Runtime Layout Bridge
- Implemented `docs/tasks/capy_player_preview_and_runtime_layout_task.md`.
- Extended layout JSON and schema with a top-level `player` transform block.
- Added a real capy player preview to the editor at locked scale `1`.
- Made player preview selectable but non-scalable, non-duplicable, and non-deletable.
- Updated the editor save/load flow to persist `layout.player.position` and `layout.player.rotation`.
- Added runtime loading for published `/layouts/village_hub_v1.json` and `/assets/manifest.json`.
- Switched the main game path to spawn world assets from the published layout instead of using the hardcoded prototype village by default.
- Kept the prototype village as a fallback when published layout loading fails.
- Updated runtime capy spawning to use the saved layout player transform.

### Public Asset Cleanup
- Moved curated audio files into `assets/game_ready/audio`.
- Moved curated UI images into `assets/game_ready/images`.
- Moved the remaining curated `capy_store` building source into `assets/game_ready/models/buildings`.
- Updated gameplay asset paths so runtime now reads from published `assets/...` locations instead of legacy root `public/models`, `public/audio`, and `public/images`.
- Updated publish tooling to remove legacy root-level public asset folders after publishing.
- Stopped tracking generated `capy-village/public/assets` and `capy-village/public/layouts` outputs in git so `assets/game_ready` remains the source of truth.

### Self-Check
- Verified `npm run publish-assets` succeeds after the `assets/game_ready` cleanup.
- Verified `npm run build` succeeds in `capy-village`.
- Verified `npm run verify-capy-assets` still reports `capy_idle height=1` and `minY=0`.
- Browser-verified the editor player preview in Playwright:
- player preview appears and is selected
- `Type` shows `player`
- duplicate/delete are disabled
- scale control is hidden/locked
- palette asset clicks resolve against local `assets/game_ready` GLBs successfully
- selection now happens before transform-drag handling, so the player preview can be clicked and dragged more directly
- skeleton-aware preview cloning keeps the visible capy mesh moving with the player transform instead of leaving only the selection box behind
- Browser-verified the runtime in Playwright:
- requests `/layouts/village_hub_v1.json`
- requests `/assets/manifest.json`
- loads published building GLBs and the published capy GLB
- renders the authored village with the capy in the scene

### Known Risks
- The editor still downloads layouts instead of writing directly to `layouts/`.
- The browser still logs a harmless `favicon.ico` 404.
- Runtime authored-world collision uses broad bounding boxes rather than hand-authored collision volumes.
- The editor flow still requires a publish step before the game reflects the latest saved layout.

### Completed
- Normalized the capy character runtime GLB to `height = 1` and grounded it at `Y = 0`.
- Rescaled the live accessory runtime GLBs (`crown`, `chef_hat`, `knit_beanie`, `scarf_v2`) with the same shared factor used for the capy.
- Updated `capy-village/src/capy.js` so runtime grounding uses bounding-box `minY` rather than assuming the model is vertically centered.
- Added `npm run normalize-capy-assets` and `npm run verify-capy-assets`.
- Added reusable GLB tooling for loading, measuring, and re-exporting normalized character/accessory assets.
- Implemented the Phase 1 layout editor from `docs/tasks/capy_layout_editor_phase1_spec.md`.
- Added a dedicated editor entry page at `capy-village/editor.html`.
- Added the editor UI, asset palette, selection/highlight flow, transform editing, duplication, deletion, save, and load plumbing.
- Added `config/layout_schemas/village_layout.schema.json` and an initial `layouts/village_hub_v1.json`.
- Configured Vite to build both the gameplay app and the editor app.
- Browser-verified the core manual composition flow with Playwright.

### Self-Check
- Verified the capy runtime GLB still contains animation plus `hat_anchor` and `neck_anchor` after normalization.
- Verified `npm run verify-capy-assets` reports `capy_idle height=1` and `minY=0`.
- Verified the live game no longer logs missing anchor warnings after the normalized character GLB is loaded.
- Verified `npm run build` still passes in `capy-village`.
- Asset palette reads from the existing registry and spawns normalized asset instances.
- New objects are selected immediately and expose editable position, rotation, and scale fields.
- Duplicate and delete are wired to per-instance object ids.
- Save produces readable layout JSON with Euler rotations in degrees.
- Build emits `dist/editor.html` alongside the main game entry.

### Known Risks
- The Blender source-blend normalization path is present but opt-in because direct Blender CLI invocation from the packaged command was unstable in this environment.
- The local source `.blend` files under `assets/source/**` were updated during the task but remain ignored and therefore are not part of the git history.
- Accessory fit verification is currently based on preserved anchors and runtime sanity checks, not a dedicated automated visual diff.
- Load-via-file is implemented but was not exercised end-to-end in browser automation during this task.
- The editor currently downloads layout JSON rather than writing directly into `layouts/`.
- Dev console still shows a harmless `favicon.ico` 404 and a Three.js duplicate-instance warning.

### UI Polish
- Enabled snap by default and kept grid visible by default.
- Tuned the grid colors so the minor snap lines stay visible while the center axes still read clearly.
- Simplified scale editing to a single uniform scale control.
- Removed the editable object id field from the right panel.
- Renamed the display-only asset field to `Asset Name`.
- Moved duplicate/delete controls into the right panel.
- Reduced right-panel clutter by removing extra helper copy and tightening transform rows.
- Forced the top action bar into a single horizontal row.

### Asset Flow Migration
- Updated the normalization pipeline to use `assets/pipeline/models/raw` as input and `assets/pipeline/models/normalized` as output via the asset registry.
- Switched editor asset discovery to curated assets under `assets/game_ready/models`.
- Added editor-side filtering so `assets/game_ready/models/characters` and `assets/game_ready/models/accessories` are ignored for now.

### Publish Bridge
- Added `npm run publish-assets` at the repo root.
- Added `tools/publish_assets.ts` to copy curated game-ready assets into `capy-village/public/assets`.
- Added layout publishing into `capy-village/public/layouts`.
- Added generated runtime `manifest.json` for published `.glb` assets.
- Tightened `.gitignore` so heavy binaries stay ignored while asset folder structure and metadata remain visible.
- Updated the GitHub Pages workflow to publish assets before building.

## 2026-03-18

### Completed
- Implemented the asset normalization pipeline from `docs/tasks/capy_asset_normalization_pipeline.md`.
- Added a root `npm run normalize-assets` command.
- Added the initial asset registry for `hut_1`, `mushroom_house`, and `book_statue`.
- Switched normalization to canonical unit-height exports so layout JSON can define true in-world size later.
- Verified normalized outputs are ground-aligned, bottom-centered, and effectively `height = 1`.
- Added `assets/` to `.gitignore`.
- Added a review bundle at `docs/review/REVIEW_BUNDLE.md`.

### Workflow Notes
- New tasks should be read from `docs/tasks/`.
- After each meaningful task: self-check the implementation against the task doc, update `docs/review/REVIEW_BUNDLE.md`, update this file, then commit and push.

### Known Risks
- The current Node-based GLB pipeline emits texture-loading warnings, so final texture preservation still needs review.
