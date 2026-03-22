# REVIEW BUNDLE

## 1. Task Summary
- Task name: Performance optimization pass (repo-aligned)
- Date: 2026-03-22
- Time: 19:10 +03
- Branch: scene-restructure
- Commit hash: c00213b
- Agent: Codex
- Status: completed

## 2. Objective
Improve runtime performance without changing the authored village look by instancing repeated non-blocking decor inside the existing published-layout runtime loader.

## 3. What Changed
- Added a focused instancing path to `loadPublishedVillage(scene)` for repeated non-blocking decor groups only.
- Kept the current `templateCache`, `sanitizeMeshForRuntime()`, `clonePublishedScene()`, `applyObjectTransform()`, and collider helpers intact.
- Grouped layout objects by `assetId` before runtime instantiation.
- Built one `THREE.InstancedMesh` per mesh node for eligible repeated decor assets.
- Kept hero assets, unique assets, and blocking assets on the existing clone path.
- Limited detailed sanitize logging to dev mode while retaining lightweight instancing summary logs.

## 4. Files Changed
- capy-village/src/runtimeLayout.js

## 5. Architecture Impact
This is a focused runtime asset-instantiation optimization. The published layout loader now has two paths:
- normal clone path for unique/blocking/hero assets
- instanced path for repeated non-blocking decor

No camera, lighting, layout schema, asset transforms, or player logic changed.

## 6. Key Implementation Notes
The implementation starts by grouping authored layout objects by `assetId`. Each asset is still loaded once and cached once. For groups with more than one object, the loader checks whether every authored instance remains non-blocking under the existing repo logic in `isNonBlockingDecor(assetId, size)`. Only then does it build instanced meshes.

Template meshes are sanitized once, then their world matrices are combined with each authored object transform matrix to produce instance matrices. This preserves placement, rotation, and scale while reducing repeated decorative draw overhead. Collider generation remains unchanged for blocking objects and is skipped entirely for instanced non-blocking decor.

## 7. Risks / Known Issues
- Instancing is intentionally limited to repeated static non-blocking decor and does not attempt to optimize blocking or hero assets.
- Multi-mesh repeated assets still create one `InstancedMesh` per mesh node, so gains are best on simple repeated props.
- Build output still reports large GLB chunk warnings unrelated to this task.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: unchanged
- hybrid retrieval: unchanged
- verification layer: preserved through publish/build checks
- generic schema: unchanged
- inspectability: improved because busy repeated decor is cheaper without changing authored composition

## 9. Testing Performed
- Ran `npm run publish-assets` successfully.
- Ran `npm run build` successfully in `capy-village`.
- Inspected the current authored layout repetition counts to confirm repeated decor candidates exist in the real scene.

## 10. Example Output / Logs
```text
Current repeated decor candidates in layout:
- stones_4: 28
- stones_1: 3
- stones_3: 2
- cubes_1: 2
```

```text
Instancing eligibility:
- repeated more than once
- must satisfy current non-blocking decor rules
- no colliders added for instanced decor
```

```text
Runtime logging:
- detailed mesh/material sanitize logs: dev only
- instanced asset summary log: kept
```

## 11. Recommended Reviewer Focus
- Check that repeated stones and simple repeated decor now follow the instanced path.
- Verify blocking assets still generate colliders and behave exactly as before.
- Review whether more repeated decor categories should be added only after confirming their collider/material behavior is equally safe.

## 12. Suggested Next Step
If this pass is stable, the next performance target is a second narrow pass for other repeated static decor that is visually simple but still cloned today.
