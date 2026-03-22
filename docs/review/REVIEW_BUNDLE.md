# REVIEW BUNDLE

## 1. Task Summary
- Task name: Diorama camera pass
- Date: 2026-03-22
- Time: 13:49 +03
- Branch: scene-restructure
- Commit hash: ba9bedc
- Agent: Codex
- Status: completed

## 2. Objective
Replace the current gameplay framing with a toy-diorama camera pass using a narrower FOV, higher/further vantage point, and soft follow dead-zone behavior, while also addressing the movement issue caused by tiny decorative props behaving like full blockers.

## 3. What Changed
- Updated the main runtime camera to use a narrower `FOV = 30`, `near = 0.1`, `far = 1000`, and a higher diorama-style starting position.
- Reintroduced camera motion as a soft dead-zone follow instead of a hard player lock or the previous close follow camera.
- Added clamping for the camera target so the diorama framing stays centered on the village.
- Kept lighting, materials, layout placement, and player movement logic otherwise unchanged.
- Adjusted runtime collider generation so small decorative props such as stones/stems/cubes do not block the capy like buildings or trees.

## 4. Files Changed
- capy-village/src/world.js
- capy-village/src/main.js
- capy-village/src/runtimeLayout.js

## 5. Architecture Impact
This affects runtime camera behavior and collider generation only. It does not change asset data, authored layout files, the editor, lighting, materials, or layout serialization. The camera is now a scene-level diorama camera with dead-zone follow, and collider generation now distinguishes between structural blockers and tiny decorative props.

## 6. Key Implementation Notes
The task spec called for a diorama camera with a narrow FOV and soft dead-zone follow, so `world.js` now initializes the camera with a farther/higher setup and `main.js` owns a dead-zone tracking target with clamp limits. The result is a camera that keeps most of the village in frame while still nudging with player movement.

The movement issue appeared to come from the runtime collider system creating blockers for every laid-out object. Rather than altering player logic, `runtimeLayout.js` now treats very small decorative props and certain known tiny prop ids as non-blocking. That keeps the world dressed while letting the capy move through the layout more naturally.

## 7. Risks / Known Issues
- The collider filter currently uses a mixed heuristic of asset-id prefixes and small bounding-box size, so if a future decorative asset should block movement it may need a more explicit rule.
- The authored layout file has additional user-side changes in the worktree and was intentionally not modified or committed as part of this task.
- The new camera framing is validated against the current published local scene and may want one more tune after the broader village asset set stabilizes.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: preserved
- hybrid retrieval: not affected
- verification layer: not materially changed
- generic schema: not affected
- inspectability: improved because the village now reads more like a single photographed diorama and the player remains visible without wide-angle distortion

## 9. Testing Performed
- Ran `npm run publish-assets` successfully.
- Ran `npm run build` successfully in `capy-village`.
- Launched the game in a headed browser and captured a published-scene screenshot.
- Verified the published scene loads cleanly in dev with the new diorama framing.
- Sent movement input in the live scene after making tiny props non-blocking.

## 10. Example Output / Logs
```text
Camera:
- fov: 30
- near: 0.1
- far: 1000
- start position: (0, 14, 18)
- dead zone radius: 2.5
- follow strength: 0.08
- clamp x/z: [-6, 6]
```

```text
Non-blocking decorative props:
- stones_
- stem_
- milk
- pumpkin
- cubes_
```

```text
Visual verification:
- screenshot captured at .playwright-cli/page-2026-03-22T10-48-06-645Z.png
- follow-up movement screenshot captured at .playwright-cli/page-2026-03-22T10-48-47-444Z.png
```

## 11. Recommended Reviewer Focus
- Review whether the non-blocking prop heuristic should eventually become explicit metadata instead of filename-based rules.
- Inspect whether the dead-zone follow strength should be tuned slightly lower or higher once the full authored village footprint is settled.
- Review whether any medium-sized props should still block movement selectively rather than relying purely on the current heuristic.

## 12. Suggested Next Step
Introduce explicit runtime collision metadata for curated game-ready assets so decorative vs blocking behavior no longer depends on filename conventions or size heuristics.
