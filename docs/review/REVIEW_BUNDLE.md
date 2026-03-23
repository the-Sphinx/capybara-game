# REVIEW BUNDLE

## 1. Task Summary
- Task name: Camera fine-tuning
- Date: 2026-03-23
- Time: 00:12 +03
- Branch: scene-restructure
- Commit hash: 1103213
- Agent: Codex
- Status: completed

## 2. Objective
Tune the existing hybrid diorama camera so it reacts a bit sooner and feels less sluggish, while preserving the current dead-zone/edge-zone architecture, composition bias, capped shift, and player bounds.

## 3. What Changed
- Tightened the dead zone so the camera starts reacting earlier.
- Tightened the edge zone so stronger follow engages sooner near the frame edge.
- Increased both soft and strong follow lerp strengths.
- Kept `lookFollowFactor` unchanged because it already sits in the task’s desired range.
- Kept `compositionBias` unchanged because the framing balance was already aligned with the task intent.
- Removed the duplicate inner `compositionBias` declaration so the tuning values now live in one place.

## 4. Files Changed
- capy-village/src/main.js

## 5. Architecture Impact
This is a parameter-tuning-only runtime camera change. It does not alter the camera architecture, movement bounds design, look-target strategy, or any gameplay/layout/lighting system. The existing dead-zone, edge-zone, capped shift, and blended look target remain intact.

## 6. Key Implementation Notes
The requested “starting preset” maps directly onto the current code, so the change is intentionally small and local. The following values changed:

```text
deadZone:
- x: 3.5 -> 2.8
- z: 3.0 -> 2.4

edgeZone:
- x: 5.0 -> 4.3
- z: 4.2 -> 3.6

follow:
- soft: 0.025 -> 0.04
- strong: 0.07 -> 0.09
```

`lookFollowFactor` remains `0.35`, which already fits the task’s recommended `0.32–0.38` range. `compositionBias` remains `0.15`, and the duplicate redeclaration inside `animate()` was removed to avoid accidental divergence during future tuning.

## 7. Risks / Known Issues
- This is still a feel-based tuning pass, so the ideal values may want one more subjective iteration after more live play time.
- The camera remains bounded by the current `maxCameraShift`, so very edge-heavy future layouts may still feel resistant before any cap changes are considered.
- Build output still reports large GLB chunk warnings unrelated to this task.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: unchanged
- hybrid retrieval: unchanged
- verification layer: preserved through build checks
- generic schema: unchanged
- inspectability: improved because the player should stay comfortably framed more often without losing the village-center diorama feel

## 9. Testing Performed
- Ran `npm run build` successfully in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/main.js`.

## 10. Example Output / Logs
```text
Unchanged:
- lookFollowFactor: 0.35
- compositionBias: 0.15
- maxCameraShift: x=2.8, z=2.4
```

```text
Removed cleanup issue:
- duplicate inner compositionBias declaration removed
```

## 11. Recommended Reviewer Focus
- Check whether the stronger soft follow feels pleasantly responsive rather than too eager during diagonal movement.
- Verify the camera still settles calmly after movement stops.
- Review whether the unchanged `compositionBias` still preserves the right statue-centered framing now that the follow starts earlier.

## 12. Suggested Next Step
If one more polish pass is needed, the next likely tuning point is a very small adjustment to `compositionBias` or `maxCameraShift`, not another dead-zone architecture change.
