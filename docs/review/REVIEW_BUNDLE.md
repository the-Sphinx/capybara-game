# REVIEW BUNDLE

## 1. Task Summary
- Task name: Toy ground and warm lighting pass
- Date: 2026-03-20
- Time: 00:49 +03
- Branch: scene-restructure
- Commit hash: 982d5a5
- Agent: Codex
- Status: completed

## 2. Objective
Replace the prototype flat ground and cooler placeholder lighting with a warmer toy-base presentation that improves softness, depth, and overall miniature-village feel without modifying any asset materials.

## 3. What Changed
- Replaced the old flat green plane in `world.js` with a layered circular toy-base ground built from stacked cylinders.
- Added a darker lower ring and inset top platform to create a soft toy-base edge silhouette.
- Added subtle ground variation using several softly tinted circular patches instead of a single uniform surface.
- Added a raised central plaza disk with a beige top and darker base ring so the village center reads more intentionally.
- Updated scene lighting to use physically correct lights, a warm directional sun, warmer hemisphere bounce, and a soft ambient fill.
- Increased tone-mapping exposure slightly and shifted the background toward a softer sky tone.
- Kept all asset materials untouched; only scene-level ground/light presentation changed.

## 4. Files Changed
- capy-village/src/world.js

## 5. Architecture Impact
This affects only runtime scene presentation. It changes the global renderer/light setup and the procedural ground meshes created at scene initialization. It does not alter layout JSON, runtime asset loading, materials authored in GLBs, editor behavior, or player/gameplay data structures.

## 6. Key Implementation Notes
The new `createToyGround()` helper builds the ground from simple `MeshStandardMaterial` primitives rather than textures or shader tricks, which keeps the change lightweight and easy to iterate on. The layered cylinders create a more toy-like base profile, while the inset meadow and small circular patches break the previous flat monotone look.

The light rig now follows the task spec more closely: warm sun (`0xfff2cc`, `1.2`), warm hemisphere fill (`0xfff5d6` / `0x9dbf87`, `0.6`), and a soft ambient top-up (`0.2`). Renderer settings now enable physically correct lights and slightly brighter ACES exposure (`1.1`) so the scene reads warmer without washing out authored GLB colors.

## 7. Risks / Known Issues
- The visual verification in `vite dev` hit an existing published-layout fallback warning, so the screenshot review used the fallback village rather than the fully authored published layout.
- The new plaza is centered at the world origin; if future authored layouts move the main centerpiece far away from the origin, that plaza placement may need to become layout-driven.
- Ground variation is intentionally simple and procedural for now; it improves flatness but is not final environment art.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: preserved, because no authored asset materials or geometry were changed
- hybrid retrieval: not affected
- verification layer: not materially changed
- generic schema: not affected
- inspectability: improved, because the world now reads more clearly with a distinct base, softer shadows, and warmer depth cues

## 9. Testing Performed
- Ran `npm run build` successfully in `capy-village`.
- Ran `npm run publish-assets` successfully before the live visual check.
- Launched the game in a headed automation browser and captured a screenshot of the updated scene.
- Verified visually that:
- the flat plane is gone
- the base now has layered edge definition
- the center plaza reads as a separate warm platform
- shadows are softer and visible
- scene lighting feels warmer overall

## 10. Example Output / Logs
```text
Renderer:
- physicallyCorrectLights: true
- outputColorSpace: THREE.SRGBColorSpace
- toneMapping: THREE.ACESFilmicToneMapping
- toneMappingExposure: 1.1
```

```text
Lighting:
- directional: #fff2cc @ 1.2
- hemisphere sky: #fff5d6
- hemisphere ground: #9dbf87
- hemisphere intensity: 0.6
- ambient: #ffffff @ 0.2
```

```text
Visual verification:
- Screenshot captured at .playwright-cli/page-2026-03-19T21-47-33-788Z.png
- Ground shows darker outer base ring, lighter main top, and raised center disk
- Warm sunlight and soft shadows visible in scene
```

## 11. Recommended Reviewer Focus
- Review whether the plaza diameter and placement should remain fixed at the origin or become data-driven from the authored layout.
- Inspect whether the ground patches need slightly more tonal contrast now that textured authored buildings are back in the scene.
- Review the remaining dev-only layout fallback warning separately so live dev visual checks reflect the published authored village consistently.

## 12. Suggested Next Step
Tune camera composition and framing against the new toy-base scene so the player and main village cluster read as a stronger hero composition from the default gameplay view.
