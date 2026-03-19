# REVIEW BUNDLE

## 1. Task Summary
- Task name: Normalize capy character to unit height and retune live accessories
- Date: 2026-03-19
- Time: 21:45 +03
- Branch: scene-restructure
- Commit hash: 6535014
- Agent: Codex
- Status: completed

## 2. Objective
Normalize the main capy character so the gameplay GLB is `height = 1` and grounded at `Y = 0`, keep the existing runtime paths intact, preserve animation and attachment anchors, and rescale all live accessory assets so they continue matching the capy at the new unit convention.

## 3. What Changed
- Updated the capy runtime grounding logic to use bounding-box `minY` instead of assuming the GLB is vertically centered.
- Added a reusable Node GLB utility module for loading, measuring, and exporting GLBs from the repo toolchain.
- Added `npm run normalize-capy-assets` to normalize the capy/accessory GLBs and keep the source-side companion GLBs in sync.
- Added `npm run verify-capy-assets` to measure the normalized character and live accessories.
- Regenerated the runtime character GLB so it is `height = 1`, grounded at `Y = 0`, and still includes animation plus `hat_anchor` and `neck_anchor`.
- Regenerated the live accessory GLBs (`crown`, `chef_hat`, `knit_beanie`, `scarf_v2`) with the same shared normalization factor used for the character.
- Added a shell helper for the Blender-side source-blend step so the character/accessory `.blend` sources can be scaled alongside the runtime assets when desired.

## 4. Files Changed
- capy-village/src/capy.js
- package.json
- scripts/normalize_capy_assets.sh
- tools/lib/gltf_node.ts
- tools/normalize_capy_assets.ts
- tools/verify_capy_assets.ts
- capy-village/public/models/characters/capy_idle.glb
- capy-village/public/models/accessories/crown.glb
- capy-village/public/models/accessories/chef_hat.glb
- capy-village/public/models/accessories/knit_beanie.glb
- capy-village/public/models/accessories/scarf_v2.glb

## 5. Architecture Impact
This changes the asset-size convention for the main playable character and its live accessories. Runtime character placement now follows the same grounding convention as normalized environment assets, and the toolchain now has a dedicated capy/accessory normalization and verification path. The change affects runtime asset loading, binary asset outputs, and local asset-maintenance workflow.

## 6. Key Implementation Notes
The final implementation splits the work into two layers. The reliable automated path is GLB-first: measure the current capy runtime GLB, compute the shared scale factor, normalize the runtime GLB plus source-side companion GLBs, and verify the results. A separate Blender shell helper exists for scaling the local `.blend` sources with the same factor. During implementation, direct Blender CLI export stripped the armature when used for the character runtime export, so the runtime binaries were normalized from the original animated GLBs instead of depending on Blender export for the final gameplay output.

## 7. Risks / Known Issues
- `npm run normalize-capy-assets` defaults to the reliable GLB normalization path and skips the Blender source-blend step unless `CAPY_NORMALIZE_SOURCE_BLENDS=1` is set.
- The local source `.blend` files were normalized manually during this task, but they live under ignored `assets/source/**` paths and are therefore not part of the git commit.
- Accessory fit was validated by restored anchor presence and removal of runtime anchor warnings, but there is still no dedicated automated visual regression harness for wearable placement.
- The verification helper intentionally checks strict normalization only for the capy; accessories are reported for inspection but not hard-failed on absolute dimensions.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved, because the capy runtime asset now follows the same grounded-at-zero convention as normalized world assets
- hybrid retrieval: not affected
- verification layer: improved via `npm run verify-capy-assets`
- generic schema: not affected
- inspectability: improved via explicit GLB measurement output and dedicated normalization tooling

## 9. Testing Performed
- Ran `npm run verify-capy-assets` and confirmed the capy runtime GLB reports `height=1` and `minY=0`.
- Inspected the normalized capy runtime GLB node list and confirmed it still contains one animation plus `hat_anchor` and `neck_anchor`.
- Ran `npm run build` in `capy-village` successfully after the runtime grounding change and binary asset updates.
- Opened the live game in a headed browser and confirmed the earlier anchor warnings disappeared; only the existing `favicon.ico` 404 remained.
- Re-ran `npm run normalize-capy-assets` on the normalized workspace and confirmed the GLB normalization path is idempotent.

## 10. Example Output / Logs
```text
capy_idle height=1 minY=-0 maxY=1 width=0.6963 depth=1.3243
crown height=0.1473 minY=-0.0004 maxY=0.1469 width=0.304 depth=0.3052
chef_hat height=0.2284 minY=0.0005 maxY=0.2289 width=0.3042 depth=0.3048
knit_beanie height=0.315 minY=0 maxY=0.315 width=0.3052 depth=0.3048
scarf_v2 height=0.6208 minY=-0.3297 maxY=0.2911 width=0.6808 depth=0.6164
[Verify] Capy character normalization checks passed.
```

```json
{
  "animations": 1,
  "hasHat": true,
  "hasNeck": true
}
```

```text
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) @ http://127.0.0.1:5173/favicon.ico:0
```

## 11. Recommended Reviewer Focus
- Review whether the Blender source-blend step should remain opt-in or be made fully reliable from the packaged command.
- Check whether accessory verification should add anchor-relative spatial assertions instead of only reporting raw bounds.
- Inspect whether the current character/public GLB duplication strategy is the right long-term home for source-side companion exports.

## 12. Suggested Next Step
Add a small runtime or editor-side size-reference scene that places the unit-height capy beside unit-height normalized environment assets, so building scale decisions can be tuned visually with the new shared convention.
