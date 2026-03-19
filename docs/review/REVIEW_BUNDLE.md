# REVIEW BUNDLE

## 1. Task Summary
- Task name: Blender-based normalization pipeline
- Date: 2026-03-20
- Time: 00:34 +03
- Branch: scene-restructure
- Commit hash: 9eaef44
- Agent: Codex
- Status: completed

## 2. Objective
Replace the texture-stripping Node GLB normalization path with a Blender-backed pipeline that preserves authored embedded materials/textures while still producing unit-height, centered, ground-aligned GLBs for runtime use.

## 3. What Changed
- Replaced the old Node import-transform-export normalization flow with a Blender CLI wrapper in `tools/normalize_assets.ts`.
- Added a headless Blender normalization script that imports GLBs, applies rotation/scale, centers X/Y, grounds to Z=0, and scales to target height `1.0` without modifying material graphs.
- Added GLB inspection/reporting during normalization so each asset logs input/output texture counts, image counts, file size, and an explicit `OK` vs `ERROR - TEXTURES LOST` status.
- Regenerated the normalized building assets with embedded textures preserved and copied those textured GLBs into `assets/game_ready/models/buildings`.
- Removed the runtime material-flattening fallback path so published authored GLB materials now render as exported instead of being converted to clay-like placeholders.

## 4. Files Changed
- scripts/blender_normalize_glb.py
- tools/normalize_assets.ts
- capy-village/src/runtimeLayout.js
- assets/game_ready/models/buildings/hut_1.glb
- assets/game_ready/models/buildings/mushroom_house.glb
- assets/game_ready/models/buildings/book_statue.glb

## 5. Architecture Impact
This changes the asset pipeline and runtime material handling. The normalization backend now depends on Blender for publish-ready building assets, and the runtime no longer rewrites imported authored materials after load. Layout schema, player logic, editor save/load format, and publish manifest structure remain unchanged.

## 6. Key Implementation Notes
The core fix was moving normalization out of the Node GLTFLoader/GLTFExporter path, which was dropping embedded textures from authored GLBs. The new Blender script preserves import/export material data while still applying the geometric normalization steps the editor/runtime expect. `tools/normalize_assets.ts` now inspects GLB JSON chunks directly before and after Blender runs, and fails the asset if output texture/image counts drop.

On the runtime side, the earlier emergency fallback that converted imported materials to generic `MeshStandardMaterial` clay colors was removed. Runtime sanitation now limits itself to geometry safety checks, optional normal recomputation, and cloned material preservation so authored textures survive all the way into the live scene.

## 7. Risks / Known Issues
- The normalized textured GLBs are now much larger than the stripped versions because embedded textures are intentionally preserved.
- Blender export logs a repeated warning about multiple shader image nodes per texture sampler; exports still succeed and textures remain present, but that warning should be monitored if more complex assets are added later.
- The task intentionally does not optimize or compress textures yet, so runtime/download size is higher until a later optimization pass.
- A temporary local file remains under `tmp/hut_1_blender_normalized.glb`; it is not part of the commit and can be removed later.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: preserved, because authored GLB content is now kept intact instead of being stripped during normalization
- hybrid retrieval: not affected
- verification layer: improved via normalization-time texture/image preservation checks and explicit per-asset reporting
- generic schema: not affected
- inspectability: improved significantly because authored stylized materials now survive through normalization, game-ready curation, publish, and runtime rendering

## 9. Testing Performed
- Ran `npm run normalize-assets` successfully.
- Verified normalization logs reported `status: OK` for `hut_1`, `mushroom_house`, and `book_statue`.
- Verified normalized, game-ready, and published `hut_1.glb` all contain `textures: 3` and `images: 3`.
- Ran `npm run publish-assets` successfully.
- Ran `npm run build` successfully in `capy-village`.
- Previously browser-verified the published runtime village now shows authored colors/materials instead of black/clay fallback rendering.

## 10. Example Output / Logs
```text
[Normalize] hut_1.glb
input textures: 3
output textures: 3
input images: 3
output images: 3
input size: 29.9 MB
output size: 29.9 MB
status: OK
```

```text
{"input": ".../assets/pipeline/models/raw/hut_1.glb", "output": ".../assets/pipeline/models/normalized/hut_1.glb", "scale_factor": 1.107337852039074, "height": 0.9999999859719537, "min_z": -5.678919842466712e-05, "max_z": 0.999943196773529}
```

```text
assets/pipeline/models/normalized/hut_1.glb { textures: 3, images: 3, size: 31395392 }
assets/game_ready/models/buildings/hut_1.glb { textures: 3, images: 3, size: 31395392 }
capy-village/public/assets/models/buildings/hut_1.glb { textures: 3, images: 3, size: 31395392 }
```

## 11. Recommended Reviewer Focus
- Review whether the Blender normalization script should eventually emit a tighter grounding tolerance so `min_z` lands exactly on zero rather than very close to zero.
- Inspect whether runtime should keep any optional material diagnostics once the authored asset set stabilizes.
- Review the larger textured GLB sizes and suggest a later optimization strategy that does not compromise authored look.

## 12. Suggested Next Step
Add a texture-safe optimization pass for published assets, such as optional compression or publish-time variants, while keeping the Blender normalization path as the authoritative geometry/material preservation step.
