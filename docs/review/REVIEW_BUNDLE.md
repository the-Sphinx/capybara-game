# REVIEW BUNDLE

## 1. Task Summary
- Task name: Camera visibility safeguard + soft village bounds
- Date: 2026-03-22
- Time: 16:49 +03
- Branch: scene-restructure
- Commit hash: 566faef
- Agent: Codex
- Status: completed

## 2. Objective
Keep the capy visible without breaking the hybrid diorama composition by strengthening camera response only near the edges and adding soft movement bounds so the player stays within the designed village footprint.

## 3. What Changed
- Kept the current hybrid camera base instead of replacing it.
- Added a second, stronger edge-response zone on top of the existing safe-zone follow behavior.
- Selected follow strength dynamically:
  - soft follow inside the edge zone
  - stronger follow near the frame edge
- Added soft movement bounds to keep the capy inside the designed village area.
- Kept the composition-preserving partial look-target bias toward the village center/statue.

## 4. Files Changed
- capy-village/src/main.js

## 5. Architecture Impact
This affects runtime camera response and player movement clamping only. The camera follow state remains in `main.js`, now with two response zones and explicit movement bounds. No camera FOV, base angle, lighting, layout, or material systems changed.

## 6. Key Implementation Notes
The existing hybrid camera already had a composition-preserving anchor and partial look-target follow. This pass keeps that structure and layers in an outer edge zone using the task’s suggested values. When the capy is outside the safe zone but still inside the edge zone, the camera uses the gentler `0.025` follow strength. When the capy pushes beyond the edge zone, follow strength increases to `0.07` so the player is less likely to drift off-frame.

The player movement path was also clamped into a soft authored village footprint using `minX: -7.5`, `maxX: 7.5`, `minZ: -6.5`, and `maxZ: 7.0`. This keeps movement free within the village but prevents wandering into empty off-stage space that would undermine the diorama framing.

## 7. Risks / Known Issues
- This pass does not include a direct viewport-space visibility test, so the safeguard is still heuristic via follow zones and movement bounds.
- The current max camera shift remains capped, so if the layout footprint grows significantly the bounds and camera cap may want retuning together.
- Build output still reports large GLB chunk warnings unrelated to this task.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: unchanged
- hybrid retrieval: unchanged
- verification layer: preserved through build checks
- generic schema: unchanged
- inspectability: improved because the player stays within the staged village while the statue-centered composition remains mostly intact

## 9. Testing Performed
- Ran `npm run build` successfully in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/main.js`.
- Verified the camera still uses the current composition-biased look logic instead of fully centering on the capy at all times.

## 10. Example Output / Logs
```text
Follow zones:
- deadZone: x=3.5, z=3.0
- edgeZone: x=5.0, z=4.2
```

```text
Follow strengths:
- soft: 0.025
- strong: 0.07
```

```text
Movement bounds:
- minX: -7.5
- maxX: 7.5
- minZ: -6.5
- maxZ: 7.0
```

## 11. Recommended Reviewer Focus
- Check whether the stronger edge response is enough to keep the capy visible without making the camera feel nervous.
- Verify the movement bounds feel invisible rather than restrictive.
- Review whether the current max camera shift and movement bounds still fit comfortably if the authored village expands.

## 12. Suggested Next Step
If visibility still occasionally feels tight, add a lightweight viewport-aware safeguard before considering any stronger recentering behavior.
