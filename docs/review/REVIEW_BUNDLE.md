# REVIEW BUNDLE

## 1. Task Summary
- Task name: Interaction polish and collision refinement
- Date: 2026-03-23
- Time: 13:39 +03
- Branch: scene-restructure
- Commit hash: ca8c9cc
- Agent: Codex
- Status: completed

## 2. Objective
Improve authored-village interaction feel without changing the core runtime architecture by removing scale-based feedback, making building collisions more natural, and making landmark interactions easier to trigger near building edges.

## 3. What Changed
- Removed the authored-world scale pulse interaction feedback.
- Replaced active-object feedback with a subtle emissive highlight.
- Added support for circle and rotated-rectangle colliders in the runtime collision evaluator.
- Switched authored building collisions from broad AABB-only blockers to tighter per-asset footprints for the current village landmarks.
- Expanded runtime interaction reach so interactables become available slightly before the player reaches the collider edge.
- Added lightweight selection hysteresis so nearby interactables do not flicker as aggressively when the player stands near overlap boundaries.
- Hid the bottom prompt cleanly while modals are open.

## 4. Files Changed
- capy-village/src/world.js
- capy-village/src/runtimeLayout.js
- capy-village/src/main.js

## 5. Architecture Impact
This is a polish pass on top of the current systems. Movement logic, camera behavior, published layout loading, and the existing prompt/`E` interaction flow all remain intact. The runtime now has a richer collider representation and a softer active-feedback path, but no new architecture or UI layer was introduced.

## 6. Key Implementation Notes
Collision handling in `capy-village/src/world.js` now supports:

```text
circle:
- center x/z
- radius

rect:
- center x/z
- width/depth
- rotation
```

Authored runtime footprints in `capy-village/src/runtimeLayout.js` now use targeted shapes for the current scene:

```text
hut_1            -> circle
mushroom_house   -> circle
book_statue      -> circle
pumpkin          -> circle
hat_stand        -> rotated rect
melon_stand_2    -> rotated rect
```

Active authored interactables now use a soft emissive intensity boost instead of changing `object.scale`. Interaction radii are derived from collider size plus a buffer so prompts appear comfortably before the player hits the blocker edge.

## 7. Risks / Known Issues
- The per-asset collider footprints are intentionally hand-tuned for the current village set; newly added buildings still fall back to a rotated rectangle derived from bounds until they get an explicit footprint.
- Selection hysteresis is intentionally light, so very tightly clustered future interactables may still want one more tuning pass.
- The Playwright CLI session used for live verification was flaky about its socket/session state, so browser verification for this task was weaker than the publish/build verification.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: unchanged
- hybrid retrieval: improved because authored runtime landmarks now feel more naturally approachable
- verification layer: preserved through publish/build checks
- generic schema: unchanged
- inspectability: improved because prompts should appear more reliably at intended landmarks without visual wobble

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from repo root.
- Ran `npm run build` successfully in `capy-village`.
- Confirmed the interaction feedback code no longer modifies `object.scale`.
- Reviewed the runtime authored-role path to ensure interaction radius now derives from collider size plus a buffer.
- Confirmed the prompt is cleared when a modal is open.

## 10. Example Output / Logs
```text
Feedback change:
- removed scale pulse
- added subtle emissive highlight
```

```text
Collision change:
- broad authored AABB blockers replaced with circle/rotated-rect footprints for current key buildings
```

## 11. Recommended Reviewer Focus
- Walk around the mushroom house, hut, and melon stand diagonally to confirm the capy can approach naturally without early invisible walls.
- Check that the prompt becomes available slightly before the player reaches the collision edge of the hat stand and melon stand.
- Verify the emissive feedback reads softly and does not look like a hard glow under the current lighting rig.

## 12. Suggested Next Step
If more authored buildings are added soon, the next best follow-up is to keep expanding the explicit footprint table rather than relying on bounds-derived fallback colliders for hero assets.
