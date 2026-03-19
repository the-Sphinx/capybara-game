# Progress

## 2026-03-19

### Completed
- Implemented the Phase 1 layout editor from `docs/tasks/capy_layout_editor_phase1_spec.md`.
- Added a dedicated editor entry page at `capy-village/editor.html`.
- Added the editor UI, asset palette, selection/highlight flow, transform editing, duplication, deletion, save, and load plumbing.
- Added `config/layout_schemas/village_layout.schema.json` and an initial `layouts/village_hub_v1.json`.
- Configured Vite to build both the gameplay app and the editor app.
- Browser-verified the core manual composition flow with Playwright.

### Self-Check
- Asset palette reads from the existing registry and spawns normalized asset instances.
- New objects are selected immediately and expose editable position, rotation, and scale fields.
- Duplicate and delete are wired to per-instance object ids.
- Save produces readable layout JSON with Euler rotations in degrees.
- Build emits `dist/editor.html` alongside the main game entry.

### Known Risks
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
