# REVIEW BUNDLE

## 1. Task Summary
- Task name: Raw-folder normalization workflow
- Date: 2026-03-20
- Time: 11:37 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Align the normalization pipeline with the current asset workflow so `npm run normalize-assets` processes every GLB found in `assets/pipeline/models/raw` automatically, without depending on `config/asset_registry.json`.

## 3. What Changed
- Removed the normalization pipeline’s dependency on `config/asset_registry.json`.
- Updated `tools/normalize_assets.ts` to scan `assets/pipeline/models/raw` for every `.glb` file.
- Kept output naming simple by writing normalized files to `assets/pipeline/models/normalized/<same-file-name>.glb`.
- Preserved support for single-asset normalization by accepting a filename-based id like `tree_1`.
- Kept the Blender-backed texture-preserving normalization path unchanged.

## 4. Files Changed
- tools/normalize_assets.ts

## 5. Architecture Impact
This affects only the normalization workflow. It does not change publish behavior, runtime layout loading, or the game-ready asset manifest. It removes the registry as a normalization driver so the raw folder itself becomes the authoritative input list.

## 6. Key Implementation Notes
The new workflow derives asset ids directly from raw GLB filenames. Hidden files and non-GLB files are ignored, and outputs are written with the same basename under the normalized pipeline folder. This better matches the intended “drop files in raw, normalize everything, manually promote selected outputs to game_ready” flow.

This change does not remove `config/asset_registry.json` from the repo, because that file can still be repurposed later for curated editor metadata, categories, or durable asset ids. It is simply no longer consulted by `npm run normalize-assets`.

## 7. Risks / Known Issues
- Single-asset targeting now depends on filename-derived ids, so renaming a raw file changes the CLI target id.
- The current Blender script still leaves a small non-zero `min_z` on some assets, so ground alignment is effectively correct but not mathematically exact yet.
- There are unrelated local edits in `capy-village/src/world.js` and `layouts/village_hub_v1.json` that were intentionally left out of this workflow change.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: preserved, because Blender-based normalization remains the authoritative geometry/material path
- hybrid retrieval: not affected
- verification layer: preserved via texture/image count reporting during normalization
- generic schema: not affected
- inspectability: improved for pipeline operations because the raw folder now directly determines what will be normalized

## 9. Testing Performed
- Ran `npm run normalize-assets` successfully.
- Verified the command normalized all current raw assets:
- `cubes_1`
- `tree_1`
- `tree_2`
- Verified each normalized asset reported `status: OK`.
- Verified texture/image counts were preserved for each run.

## 10. Example Output / Logs
```text
[Normalize] cubes_1.glb
input textures: 3
output textures: 3
input images: 3
output images: 3
status: OK
```

```text
[Normalize] tree_1.glb
input textures: 3
output textures: 3
input images: 3
output images: 3
status: OK
```

```text
[Normalize] tree_2.glb
input textures: 3
output textures: 3
input images: 3
output images: 3
status: OK
```

## 11. Recommended Reviewer Focus
- Review whether filename-derived ids are sufficient for the raw-folder workflow or whether a separate curated metadata registry should be added for editor/runtime-facing ids later.
- Inspect whether the Blender script should get a tighter final grounding pass so `min_z` is consistently at zero.
- Review whether normalized output cleanup should remove stale files when raw files disappear, or whether manual cleanup is preferred.

## 12. Suggested Next Step
Create a separate curated game-ready asset metadata registry for editor categories and durable layout-facing ids, while leaving raw-folder normalization fully automatic.
