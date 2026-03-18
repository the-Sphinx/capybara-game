# REVIEW BUNDLE

## 1. Task Summary
- Task name: Implement asset normalization pipeline and adopt task/review workflow
- Date: 2026-03-18
- Time: Europe/Istanbul
- Branch: scene-restructure
- Commit hash: 738985a
- Agent: Codex
- Status: completed

## 2. Objective
Implement the asset normalization pipeline from the task document so raw GLBs are exported as ground-aligned, bottom-centered, unit-height normalized assets, and align the repo workflow around `docs/tasks`, review bundles, and progress tracking.

## 3. What Changed
- Added a root npm entrypoint for the normalization pipeline.
- Added an asset registry for the current raw building assets.
- Implemented `tools/normalize_assets.ts` to load GLBs, compute bounds, ground-align, center pivot, scale to height `1`, bake transforms, and export normalized GLBs.
- Updated the asset normalization task doc under `docs/tasks/` to reflect the unit-height convention.
- Added `assets/` to `.gitignore` so raw and generated asset files stay out of git.
- Added the review bundle spec file used for the new workflow.

## 4. Files Changed
- .gitignore
- package.json
- config/asset_registry.json
- tools/normalize_assets.ts
- docs/tasks/capy_asset_normalization_pipeline.md
- docs/review_bundle_creation.md

## 5. Architecture Impact
This change adds a small asset-prep toolchain outside the game runtime. It does not change the current data model, retrieval pipeline, verifier, evaluation flow, or game UI directly. It introduces a registry-driven preprocessing step that future layout data can depend on for canonical asset dimensions and pivots.

## 6. Key Implementation Notes
The pipeline uses Three.js `GLTFLoader` and `GLTFExporter` from the existing `capy-village` dependency tree, avoiding a separate install step. Assets are normalized by height only, with width and depth scaling proportionally. The exported asset convention is now: bottom center pivot, base on `Y = 0`, and baked geometry with effective transform reset.

## 7. Risks / Known Issues
- Three.js logs texture-loading warnings in plain Node while parsing these GLBs, so geometry normalization is verified but texture fidelity should be reviewed before relying on this for final art assets.
- The registry currently contains only the three raw assets present during implementation.
- The repo has unrelated user-side doc moves and deletions under `docs/`; those were intentionally left out of the implementation commit.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: not applicable to this task
- hybrid retrieval: not affected
- verification layer: not affected
- generic schema: not affected
- inspectability: preserved via registry-driven inputs and CLI validation output

## 9. Testing Performed
- Ran `npm run normalize-assets` successfully from the repo root.
- Ran `npm run normalize-assets hut_1` successfully for single-asset mode.
- Verified exported bounds for all normalized assets: height approximately `1`, `minY = 0`, horizontal center at origin.

## 10. Example Output / Logs
```text
Asset: hut_1

Original Height: 0.903
Target Height: 1
Scale Applied: 1.107

Pivot Adjusted: YES
Ground Adjusted: YES

Exported To:
assets/normalized_assets/hut_1.glb
```

```text
assets/normalized_assets/hut_1.glb height=1.000000 minY=0.000000 centerX=0.000000 centerZ=0.000000
assets/normalized_assets/mushroom_house.glb height=1.000000 minY=0.000000 centerX=0.000000 centerZ=0.000000
assets/normalized_assets/book_statue.glb height=0.999999 minY=0.000000 centerX=0.000000 centerZ=0.000000
```

## 11. Recommended Reviewer Focus
- Confirm the unit-height normalization convention is the right long-term contract for layout data.
- Review whether the Node-based Three.js pipeline is acceptable despite current texture warnings.
- Check whether the registry format should later include canonical metadata like intended world height or category-specific placement hints.

## 12. Suggested Next Step
Implement the first layout JSON format and loader that assigns final in-world size to these unit-normalized assets.
