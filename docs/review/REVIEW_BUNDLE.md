# REVIEW BUNDLE

## 1. Task Summary
- Task name: Imported GLB visibility fix and toy lighting baseline
- Date: 2026-03-19
- Time: 23:58 +03
- Branch: scene-restructure
- Commit hash: 37d30f0
- Agent: Codex
- Status: completed

## 2. Objective
Restore readable runtime rendering for imported published GLB world assets and establish a clean toy-village lighting baseline, without changing layout data, world placement, player logic, or editor behavior.

## 3. What Changed
- Added runtime mesh diagnostics for imported published assets, including material type, material color, vertex-color usage, normals state, bounding-box validity, missing-material status, and fallback usage.
- Added runtime geometry sanitation so imported meshes recompute vertex normals only when needed and ensure geometry bounding boxes are valid.
- Added runtime material sanitation that preserves vertex colors, simplifies imported materials to a readable matte `MeshStandardMaterial` baseline, and applies a warm clay fallback for unreadable or effectively blank materials.
- Added a targeted warm fallback path for white/no-map world meshes that were still rendering as unreadable silhouettes.
- Updated the main runtime renderer to use `sRGB` output, `ACESFilmicToneMapping`, and exposure `1.0`.
- Replaced the old ambient-only baseline with a warmer toy-like hemisphere fill plus a warm directional sun, and updated the world background/ground materials to match the softer baseline.

## 4. Files Changed
- capy-village/src/runtimeLayout.js
- capy-village/src/world.js

## 5. Architecture Impact
This affects runtime rendering only. The change does not alter layout JSON, placement logic, player spawning, gameplay systems, or editor workflows. It changes how published GLB world assets are sanitized and shaded after load, and it changes the scene-wide renderer/light baseline used by both authored and fallback worlds.

## 6. Key Implementation Notes
The main fix lives in `runtimeLayout.js`. Imported GLB meshes are now inspected and sanitized as they load from the published manifest. If a mesh has no valid normals, normals are recomputed. If it has valid vertex colors, the runtime material keeps them enabled. Imported `MeshPhysicalMaterial` / similar materials are converted into a simpler readable `MeshStandardMaterial` baseline so the village remains inspectable under the lightweight runtime light rig. For meshes that still effectively have no usable color signal, a warm clay fallback material is applied instead.

The lighting update in `world.js` is intentionally conservative. It uses a soft sky background, a hemisphere fill (`#CDE1FF` / `#EBE1CD`, `0.48`), and a warm off-white directional key light (`#FFF4E0`, `1.0`) with ACES filmic tone mapping at exposure `1.0`. This is enough to judge shapes, placement, and relative scale without treating it as final art direction.

## 7. Risks / Known Issues
- The current fallback still produces a simplified clay-style look for some assets (`hut_1`, `book_statue`) rather than restoring authored final colors, because the imported material data was not producing readable results in runtime.
- `mushroom_house` keeps its vertex-color path and is more neutral/pale than the clay-fallback assets, so the palette is readable but not yet stylistically unified.
- Browser verification still shows the harmless `favicon.ico` 404.
- The runtime diagnostics are intentionally verbose right now; they are useful for this material-repair phase but may be worth gating behind a debug flag later.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: preserved, because the task only changes runtime rendering treatment after published assets load
- hybrid retrieval: not affected
- verification layer: improved via per-mesh runtime diagnostics for imported GLBs
- generic schema: not affected
- inspectability: improved significantly because the village is readable again and imported asset material state is now visible in logs

## 9. Testing Performed
- Ran `npm run build` in `capy-village` successfully.
- Launched the live game in a headed browser and verified the authored runtime village still loads from published layout + manifest.
- Captured runtime console diagnostics for the loaded published assets and confirmed:
- `hut_1` preserved mesh normals, had no vertex colors, and used the warm fallback material
- `mushroom_house` preserved vertex colors and stayed on the non-fallback readable path
- `book_statue` preserved mesh normals, had no vertex colors, and used the warm fallback material
- Captured before/after screenshots showing the world assets are no longer black silhouettes and are readable against the environment.

## 10. Example Output / Logs
```text
[Runtime Asset] hut_1
mesh: node_0
material: MeshStandardMaterial
materialColor: #b89a74
vertexColors: false
normals: present
bboxValid: true
materialMissing: false
fallbackApplied: true
```

```text
[Runtime Asset] mushroom_house
mesh: node_0005
material: MeshStandardMaterial
materialColor: #ffffff
vertexColors: true
normals: present
bboxValid: true
materialMissing: false
fallbackApplied: false
```

```text
[Runtime Asset] book_statue
mesh: node_0
material: MeshStandardMaterial
materialColor: #b89a74
vertexColors: false
normals: present
bboxValid: true
materialMissing: false
fallbackApplied: true
```

```text
Renderer:
- outputColorSpace: THREE.SRGBColorSpace
- toneMapping: THREE.ACESFilmicToneMapping
- toneMappingExposure: 1.0

Lighting:
- directional: #FFF4E0 @ 1.0
- hemisphere sky: #CDE1FF
- hemisphere ground: #EBE1CD
- hemisphere intensity: 0.48
- background: #D6E8FF
```

## 11. Recommended Reviewer Focus
- Review whether the clay fallback should stay global for unreadable white/no-map assets or become asset-specific later.
- Inspect whether the vertex-colored `mushroom_house` should get a small contrast/saturation boost so it sits better beside the fallback-treated assets.
- Review whether the runtime diagnostics should remain always-on during this phase or move behind a debug toggle once the asset set stabilizes.

## 12. Suggested Next Step
Tune the remaining authored village materials toward a more intentional toy-village palette by replacing the temporary clay fallback on a per-asset basis and nudging the capy/world color relationship so the environment feels more cohesive without losing readability.
