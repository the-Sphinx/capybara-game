# REVIEW BUNDLE

## 1. Task Summary
- Task name: World roles and interaction mapping
- Date: 2026-03-23
- Time: 13:39 +03
- Branch: scene-restructure
- Commit hash: 7cfa612
- Agent: Codex
- Status: completed

## 2. Objective
Turn the authored village into a readable playable world by mapping the central book fountain, hat stand, and watermelon stand onto the existing interaction system without redesigning the camera, adding heavy UI, or changing the core runtime architecture.

## 3. What Changed
- Added authored-world role mapping for `book_statue`, `hat_stand`, and `melon_stand_2`.
- Registered runtime-layout interactables directly from published layout instances instead of relying only on the old prototype zone list.
- Reused the existing bottom-center prompt and `E` interaction flow for all three destinations.
- Routed the central statue to the game hub, the hat stand to the closet/boutique flow, and the watermelon stand directly to `watermelon_catch`.
- Added a very subtle scale pulse on the active authored interactable to improve readability without outlines or heavy UI.
- Added lightweight string aliases in `openModal(...)` so `store`, `hub`, and `watermelon_catch` can resolve cleanly if used by future interaction helpers.

## 4. Files Changed
- capy-village/src/world.js
- capy-village/src/runtimeLayout.js
- capy-village/src/main.js
- capy-village/src/ui.js
- layouts/village_hub_v1.json
- assets/game_ready/models/buildings/hat_stand.glb
- assets/game_ready/models/buildings/melon_stand_2.glb

## 5. Architecture Impact
This keeps the existing interaction architecture intact. The old prototype interactables and fallback zone-based path still exist, but the published authored village now injects its own interactables into that same `activeTarget -> prompt -> openModal/startGame` pipeline. No camera, movement-bounds, or UI architecture was redesigned.

## 6. Key Implementation Notes
Runtime object-role mapping now lives in `capy-village/src/runtimeLayout.js`:

```text
book_statue   -> id=minigame_hub     -> "Press [E] to Explore Knowledge"
hat_stand     -> id=capy-store       -> "Press [E] to Browse Hats"
melon_stand_2 -> gameId=watermelon_catch -> "Press [E] to Play Watermelon Catch"
```

`capy-village/src/world.js` now supports two interaction sources:
- prototype hardcoded zones
- runtime-layout object-based interactables with nearest-distance selection

Active authored interactables get a small pulse in the `1.0 -> ~1.04` range. Only one interactable is selected at a time, and prompt text still uses the existing prompt element.

## 7. Risks / Known Issues
- The live authored-role mapping currently keys off `assetId`, so if multiple copies of `hat_stand` or `melon_stand_2` are added later, they will all become interactable unless a future task adds per-object role metadata.
- The subtle pulse is intentionally minimal and may want one more visual tune after longer playtesting.
- Build output still reports large GLB chunk warnings unrelated to this task.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: unchanged
- hybrid retrieval: improved because authored layout objects now carry gameplay meaning in runtime mode
- verification layer: preserved through publish/build checks
- generic schema: unchanged
- inspectability: improved because core village landmarks now expose clear interaction roles

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from repo root.
- Ran `npm run build` successfully in `capy-village`.
- Confirmed the current authored layout contains `book_statue`, `hat_stand`, and `melon_stand_2`.
- Reviewed the runtime path to verify that published layout instances now register interactables before the capy is loaded.
- Checked the live browser bootstrap path enough to confirm the published scene opens, with the only console error being the pre-existing missing favicon.

## 10. Example Output / Logs
```text
Published authored role assets:
- hat_stand.glb
- melon_stand_2.glb
```

```text
Prompts:
- Press [E] to Explore Knowledge
- Press [E] to Browse Hats
- Press [E] to Play Watermelon Catch
```

## 11. Recommended Reviewer Focus
- Walk diagonally between the statue, hat stand, and watermelon stand to verify the nearest-target selection feels natural.
- Check that opening and closing the hub/closet/game entry does not leave the prompt or pulse stuck on-screen.
- Verify the stand colliders still allow the capy to get close enough for interaction comfortably.

## 12. Suggested Next Step
If world roles expand further, the next clean upgrade would be attaching interaction metadata to authored layout objects directly rather than inferring roles from `assetId`.
