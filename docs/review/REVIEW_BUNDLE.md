# REVIEW BUNDLE

## 1. Task Summary
- Task name: Class-based footprint transform scaling
- Date: 2026-03-23
- Time: 15:12 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Keep the shared class-based footprint model, but make each instance derive its actual collider from the asset-class footprint plus that instance’s transform so different scales and rotations no longer share the same world-sized footprint.

## 3. What Changed
- Reworked shared collider computation so asset-class footprints are treated as canonical local-space footprints.
- Footprint offsets now scale with the instance and rotate with the instance yaw before being applied.
- Rect footprints now scale by instance `scale.x` and `scale.z`.
- Circle footprints now scale by the larger of instance `scale.x` and `scale.z` so collision stays conservative under non-uniform scale.
- Runtime and editor now both use the same transformed shared-footprint math, so differently scaled instances of the same asset no longer share one fixed-size world footprint.

## 4. Files Changed
- capy-village/src/footprints.js

## 5. Architecture Impact
This keeps the current shared JSON footprint model intact and only changes the world-space derivation step. The canonical footprint remains asset-class data, while the editor and runtime now derive per-instance collider size and offset placement from the object transform at use time.

## 6. Key Implementation Notes
The new shared footprint layer in `capy-village/src/footprints.js` now provides:

```text
- shared per-asset footprint lookup
- footprint normalization
- world-yaw extraction
- instance-scaled local offset handling
- collider computation from a scene root plus instance transform
```

Canonical shared footprints are now interpreted in local space:
- `offsetX` and `offsetZ` are scaled and then rotated with the instance
- `width` and `depth` scale with the instance for rect footprints
- `radius` scales with `max(scaleX, scaleZ)` for circle footprints

## 7. Risks / Known Issues
- This pass was verified through publish/build and code-path inspection, but I intentionally did not open another browser session because of the recent Playwright/Chrome orphan-window issue.
- Circle footprints remain circles under non-uniform scale rather than becoming ellipses; this is an intentional conservative simplification.
- The current derivation assumes gameplay-relevant footprint yaw comes from world `Y` rotation only, which matches the current authored village assets.
- Follow-up regression fix: footprint type switching now updates the editor form immediately, and deselecting now refreshes overlays so hidden footprint visuals do not linger when the global toggle is off.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved because visual tuning now matches runtime collision logic directly
- hybrid retrieval: unchanged
- verification layer: improved through shared editor/runtime footprint computation with instance-aware scaling
- generic schema: unchanged in this pass
- inspectability: significantly improved because footprint shapes are now visible and editable in-editor

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from repo root.
- Ran `npm run build` successfully in `capy-village`.
- Reviewed the editor path to confirm footprint overlays use the updated instance-aware collider computation.
- Reviewed the runtime path to confirm authored collider registration uses the same transformed shared-footprint computation.
- Reviewed the shared collider math to confirm offsets rotate with yaw and dimensions scale with instance scale.
- Verified the editor build still passes after fixing footprint type switching and deselection-driven overlay refresh.

## 10. Example Output / Logs
```text
Toolbar toggle:
- Footprints: Off
- Footprints: On
```

```text
Editor footprint fields:
- type
- radius
- width
- depth
- offsetX
- offsetZ
- rotationOffset
```

## 11. Recommended Reviewer Focus
- Place two instances of the same asset at different scales and confirm their footprint overlays differ in world size.
- Rotate an asset with non-zero `offsetX` or `offsetZ` and confirm the footprint center rotates around with the object.
- Verify rotated rect footprints still block correctly in runtime after the yaw-based offset handling.

## 12. Suggested Next Step
If footprint tuning becomes a regular workflow, the next good follow-up would be adding a lightweight in-editor collider debug label so size and offset values can be read without opening the panel.
