# REVIEW BUNDLE

## 1. Task Summary
- Task name: Remove asset registry file
- Date: 2026-03-20
- Time: 11:49 +03
- Branch: scene-restructure
- Commit hash: 14bc8a2
- Agent: Codex
- Status: completed

## 2. Objective
Delete the now-obsolete `config/asset_registry.json` file and simplify the editor so it relies entirely on auto-discovered curated assets from `assets/game_ready/models`.

## 3. What Changed
- Removed the editor import of `config/asset_registry.json`.
- Simplified editor asset discovery so it builds the palette directly from `assets/game_ready/models/**/*.glb`.
- Preserved folder-based filtering so `characters/` and `accessories/` remain excluded from the editor palette.
- Kept id generation filename-based and class inference folder-based.
- Deleted `config/asset_registry.json`.
- Updated the workflow doc to state that no asset registry maintenance is currently required.

## 4. Files Changed
- capy-village/src/editor/assetRegistry.js
- config/asset_registry.json
- docs/asset_to_game_workflow.md

## 5. Architecture Impact
This affects editor asset discovery only. The editor now uses curated game-ready assets as its sole source of truth for palette entries. Normalization, publishing, runtime manifest generation, and layout schema are unchanged.

## 6. Key Implementation Notes
The old registry file was carrying stale source/output fields from when normalization depended on it. Since normalization is now raw-folder-driven and the editor already had fallback auto-discovery behavior, the cleanest path was to remove the registry entirely and let the editor always derive its available assets from the `game_ready` folder.

Asset ids remain the GLB basenames, and classes remain inferred from folder names such as `buildings/` and `props/`. That keeps the current layout/editor behavior stable without maintaining a second metadata file.

## 7. Risks / Known Issues
- Asset ids are still filename-derived, so renaming a curated game-ready file changes the editor/runtime-facing asset id.
- If curated metadata such as custom display names or durable ids are needed later, a new registry may need to be reintroduced with a clearer purpose.
- There are unrelated local edits in `capy-village/src/world.js` and `layouts/village_hub_v1.json` that were intentionally left out of this change.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: preserved
- hybrid retrieval: not affected
- verification layer: not materially changed
- generic schema: not affected
- inspectability: improved slightly because the asset pipeline now has one less stale source of truth to reconcile

## 9. Testing Performed
- Ran `npm run build` successfully in `capy-village`.
- Verified the build includes auto-discovered game-ready assets in the editor bundle.
- Verified no code references to `config/asset_registry.json` remain outside historical docs/task docs.

## 10. Example Output / Logs
```text
Editor asset source:
- assets/game_ready/models/**/*.glb
- excludes /characters/
- excludes /accessories/
```

```text
Build:
- npm run build
- result: success
```

## 11. Recommended Reviewer Focus
- Review whether filename-derived asset ids are still sufficient for long-term layout stability.
- Inspect whether curated display metadata should eventually live in a lighter-weight editor-only config instead of a full asset registry.

## 12. Suggested Next Step
If asset naming starts to drift, add a small optional curated metadata layer focused only on stable ids, labels, and categories for game-ready assets.
