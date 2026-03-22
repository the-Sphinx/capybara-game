# REVIEW BUNDLE

## 1. Task Summary
- Task name: Ground boundary + horizon control
- Date: 2026-03-22
- Time: 16:24 +03
- Branch: scene-restructure
- Commit hash: 2ac857d
- Agent: Codex
- Status: completed

## 2. Objective
Replace the flatter platform feel with a more contained toy-island ground so the village reads like a bounded diorama with sky beyond it, without changing camera, lighting, layout, props, or gameplay.

## 3. What Changed
- Reworked the runtime ground into a more island-like bounded shape with a circular top surface and darker supporting body.
- Added a subtle vertex-color falloff on the main ground disk so the island edges lighten toward the sky instead of ending abruptly.
- Kept the top surface slightly lowered to soften the visible horizon line.
- Retained the central plaza and soft decorative patches on top of the new island base.
- Matched the renderer clear color to the sky background so no background seam shows at the edge.
- Kept fog disabled.

## 4. Files Changed
- capy-village/src/world.js

## 5. Architecture Impact
This is a runtime presentation/ground-geometry pass only. It changes the base meshes created in `createToyGround()` and aligns the clear color with the sky background. Camera, lighting values, player logic, layout loading, and asset transforms remain unchanged.

## 6. Key Implementation Notes
The task asked for a contained island world rather than an endless plane. The runtime already used bounded geometry, so this pass focused on changing that base from a stacked platform feel into a softer island read. The new main ground uses a `CircleGeometry` with vertex colors to create a center-to-edge fade from `0xd8d2a8` toward `0xded8b8`, which helps the edge blend visually into the sky.

To keep a sense of physical miniature thickness, the top disk sits over a darker cylindrical body. The main disk is offset downward to `y = -0.05` as requested, which helps remove the harsher horizon read without affecting gameplay surfaces. The sky background remains `0xe6efe8`, and fog was intentionally left off to preserve depth.

## 7. Risks / Known Issues
- The tree ring itself was not adjusted in code during this pass, so horizon blocking still depends on the current authored layout and fallback tree placement.
- Because the island remains a simple geometric form, very edge-heavy future layouts may still expose more of the perimeter than desired.
- Build output still reports large GLB chunk warnings unrelated to this task.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: unchanged
- hybrid retrieval: unchanged
- verification layer: preserved through publish/build checks
- generic schema: unchanged
- inspectability: improved because the world reads as a contained miniature scene instead of continuing outward visually

## 9. Testing Performed
- Ran `npm run publish-assets` successfully.
- Ran `npm run build` successfully in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/world.js`.

## 10. Example Output / Logs
```text
Ground:
- radius: 12
- top disk y: -0.05
- edge fade: enabled via vertex colors
- lower body: enabled
```

```text
Horizon:
- background: 0xe6efe8
- clear color: 0xe6efe8
- fog: disabled
```

```text
Tree ring:
- adjusted: no
- relies on current layout/fallback tree placements
```

## 11. Recommended Reviewer Focus
- Check whether the current authored tree placement is enough to hide most of the island perimeter from the fixed camera.
- Review whether the edge fade is subtle enough to feel natural rather than painted.
- Confirm the darker island body reads as handcrafted diorama thickness rather than a visible pedestal.

## 12. Suggested Next Step
Reintroduce the camera dead-zone + soft follow system against this bounded-island baseline so motion can be tuned with the final horizon framing in place.
