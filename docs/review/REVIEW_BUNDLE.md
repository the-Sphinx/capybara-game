# REVIEW BUNDLE

## 1. Task Summary
- Task name: Migrate asset tooling to source/pipeline/game_ready paths
- Date: 2026-03-19
- Time: 16:52 +03
- Branch: scene-restructure
- Commit hash: c0f62af
- Agent: Codex
- Status: completed

## 2. Objective
Update the normalization pipeline and layout editor so they follow the new asset workflow: raw pipeline inputs under `assets/pipeline/models/raw`, normalized outputs under `assets/pipeline/models/normalized`, and editor/runtime-curated assets under `assets/game_ready/models`.

## 3. What Changed
- Updated the asset registry source/output paths to the new pipeline directories.
- Kept the normalization script working through the registry, so it now reads and writes through the new pipeline layout automatically.
- Switched the editor asset discovery from normalized pipeline outputs to curated `assets/game_ready/models/**`.
- Added filtering so the editor ignores `characters` and `accessories` folders under `assets/game_ready/models`.
- Updated the tracked normalization task doc to describe the new pipeline folder structure.

## 4. Files Changed
- config/asset_registry.json
- capy-village/src/editor/assetRegistry.js
- docs/tasks/capy_asset_normalization_pipeline.md

## 5. Architecture Impact
This changes the asset flow contract rather than the editor/runtime architecture. The pipeline remains registry-driven, while the editor now depends on a curated game-ready asset layer instead of directly consuming normalized pipeline outputs.

## 6. Key Implementation Notes
The editor still uses the registry for asset metadata and ids, but it resolves actual GLB URLs from `assets/game_ready/models` by filename match. This preserves the existing layout JSON and editor behavior while matching the new manual curation step between normalization and gameplay/editor use.

## 7. Risks / Known Issues
- The editor path migration currently matches game-ready files by basename, so duplicate filenames across different game-ready subfolders would be ambiguous.
- `assets/game_ready/models/book_statue.glb`, `hut_1.glb`, and `mushroom_house.glb` are currently at the root of `models/`; if you later move them into category subfolders, the current glob still works as long as filenames remain unique.
- The untracked task file `docs/tasks/capy_layout_editor_phase1_spec.md` was updated locally but intentionally not committed because it is part of your ongoing docs/task restructuring.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: not applicable to this task
- hybrid retrieval: not affected
- verification layer: not affected
- generic schema: preserved
- inspectability: improved through a clearer separation between pipeline assets and curated game-ready assets

## 9. Testing Performed
- Ran `npm run normalize-assets hut_1` from the repo root and verified output now lands in `assets/pipeline/models/normalized/hut_1.glb`.
- Ran `npm run build` in `capy-village` and verified the editor still bundles curated game-ready assets successfully.

## 10. Example Output / Logs
```text
Asset: hut_1

Original Height: 0.903
Target Height: 1
Scale Applied: 1.107

Exported To:
assets/pipeline/models/normalized/hut_1.glb
```

```text
dist/assets/hut_1-Cw3vMzkg.glb
dist/assets/book_statue-D0qXl9AV.glb
dist/assets/mushroom_house-DgfpGVTv.glb
```

## 11. Recommended Reviewer Focus
- Review whether filename-based matching between registry entries and curated game-ready assets is sufficient or whether the registry should gain an explicit `gameReady` path field.
- Check whether the editor should eventually derive its asset list directly from `game_ready/models` instead of registry-plus-match.
- Confirm the new asset folder contract is documented clearly enough for future contributors.

## 12. Suggested Next Step
Add explicit `gameReady` paths or categories to the registry so curated game assets can move into `buildings/`, `props/`, and future folders without relying on basename matching.
