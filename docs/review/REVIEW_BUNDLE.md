# REVIEW BUNDLE

## 1. Task Summary
- Task name: Camera follow dead-zone system
- Date: 2026-03-22
- Time: 16:40 +03
- Branch: scene-restructure
- Commit hash: 3c4aa1b
- Agent: Codex
- Status: completed

## 2. Objective
Reintroduce camera follow so the gameplay camera responds to the capy smoothly without breaking the current diorama composition, using a soft dead-zone instead of a rigid player lock or a fully static view.

## 3. What Changed
- Added a dead-zone follow system in the main runtime loop.
- Kept the current fixed diorama framing as the baseline and derived follow motion from that existing camera offset.
- Camera now stays still during small player movement and only starts moving when the capy exits the dead zone.
- Applied smoothing through anchor interpolation so the camera nudges softly instead of snapping.
- Left world lighting, ground, layout loading, and player movement logic unchanged.

## 4. Files Changed
- capy-village/src/main.js

## 5. Architecture Impact
This change affects runtime camera behavior only. The camera follow state now lives in `bootstrap()`/`animate()` inside `main.js`, using a persistent anchor plus offset model. No asset, layout, editor, lighting, or collision architecture changed.

## 6. Key Implementation Notes
The task wanted the camera to keep the current composition while following only when needed. To do that, the implementation captures the current camera-to-capy offset once the capy is available, then maintains a `cameraAnchor` centered on the player's current focus point. Movement inside the dead zone does nothing; movement beyond it shifts the desired anchor only by the overflow amount.

That desired anchor is then smoothed with `lerp(..., 0.05)`, and the actual camera position is rebuilt from the preserved offset. This keeps the established diorama angle/height while making the scene breathe with player movement. The dead-zone values used are `x: 1.5` and `z: 1.5`.

## 7. Risks / Known Issues
- This pass does not add bounds clamping yet, so in very edge-heavy future layouts the camera may drift farther than ideal.
- The camera always looks at the smoothed anchor, so if a future task wants stronger composition bias toward the village center, a blended target may be better.
- Build output still reports large GLB chunk warnings unrelated to this task.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: unchanged
- hybrid retrieval: unchanged
- verification layer: preserved through build checks
- generic schema: unchanged
- inspectability: improved because the player can move without leaving the curated diorama framing abruptly

## 9. Testing Performed
- Ran `npm run build` successfully in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/main.js`.
- Verified the implementation keeps the current camera offset as the follow baseline instead of replacing the framing.

## 10. Example Output / Logs
```text
Dead zone:
- x: 1.5
- z: 1.5
```

```text
Smoothing:
- anchor lerp factor: 0.05
- follow style: offset-preserving dead-zone follow
```

```text
Camera behavior:
- small movement inside dead zone: no camera movement
- larger movement outside dead zone: smooth follow
```

## 11. Recommended Reviewer Focus
- Check whether the current `0.05` smoothing feels responsive enough without becoming floaty.
- Verify the player remains comfortably framed near the village edges.
- Review whether a future clamp should be added once the authored layout footprint stabilizes.

## 12. Suggested Next Step
Add gentle camera bounds clamping and only if needed a slightly center-biased look target, while keeping the same dead-zone structure.
