# REVIEW BUNDLE

## 1. Task Summary
- Task name: Math world select integration
- Date: 2026-03-25
- Time: 11:30 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Replace the flat Math Garden adventure entry with a polished world-select screen that uses the finalized background image, exact sign-box coordinates, dynamic locked/unlocked/current/completed state rendering, and a clean placeholder path for future inside-world navigation.

## 3. What Changed
- Added a dedicated Math Garden world-select flow inside the existing hub modal while leaving the other minigame hub paths unchanged.
- Added a reusable world-select data source for the 7 Math worlds, including exact normalized sign-box coordinates and world metadata.
- Added `worldId` metadata to Math Garden adventure levels so world progress can be derived explicitly instead of guessed from names.
- Replaced the Math Garden adventure branch in the hub with a background-image world map, clickable sign overlays, and a warm right-side details panel.
- Derived each world’s state from existing save data as `locked`, `unlocked`, `current`, or `completed`.
- Added a clean `Open World` placeholder screen for unlocked worlds so the navigation path is ready for a future per-world level map.

## 4. Files Changed
- capy-village/src/games/mathGarden/worlds.js
- capy-village/src/games/mathGarden/adventure.json
- capy-village/src/ui/HubModal.js
- capy-village/src/style.css
- assets/game_ready/images/math_garden_v3.png

## 5. Architecture Impact
This adds a reusable world-select rendering path to the hub without changing runtime-layout or game-launch architecture. The implementation is data-driven: world background, sign boxes, subtitles, and unlock copy live in world config, while world state is computed from existing save/level metadata. The flow is ready for future themes to plug in a different background and different sign coordinates.

## 6. Key Implementation Notes
The new Math world configuration in `capy-village/src/games/mathGarden/worlds.js` provides:

```text
- background image path
- world ids / titles / subtitles
- unlock requirement text
- exact normalized sign boxes
```

World state is derived in the hub from:

```text
- math adventure levels grouped by worldId
- completedLevels from save data
- unlockedLevels from save data
```

Math world selection currently prefers:

```text
1. the world containing preferLevelNum when returning from gameplay
2. otherwise the current world
3. otherwise the first unlocked world
4. otherwise the first world in order
```

## 7. Risks / Known Issues
- The current 10 Math Garden adventure levels are now distributed across 7 worlds using explicit `worldId` assignments, but some world-to-content semantics are still temporary until deeper world-specific content is authored.
- `Open World` intentionally routes to a placeholder screen rather than a true world-internal level map, because the task explicitly scoped that part out.
- This pass was verified through publish/build and code-path inspection, but I intentionally did not start a new Playwright browser session because of the earlier orphan-window issue.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved because Math Garden world selection now uses the finalized authored image and exact user-provided sign boxes
- hybrid retrieval: unchanged
- verification layer: improved because locked/unlocked/current/completed world state is surfaced directly in the UI
- generic schema: improved because the world-select component is data-driven and reusable for future themes
- inspectability: improved through explicit world metadata and progress grouping in the hub

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from the repo root.
- Ran `npm run build` successfully in `capy-village`.
- Verified the finalized `math_garden_v3.png` image is now published into the public assets path.
- Reviewed the Math Garden hub path to confirm `Adventure` now enters the world-select screen instead of the old flat level map.
- Reviewed the world-state derivation logic to confirm locked/unlocked/current/completed states are computed from existing level save data.
- Reviewed the world placeholder navigation path to confirm unlocked worlds have a clean next-step action without inventing an out-of-scope level-map implementation.

## 10. Example Output / Logs
```text
Math Garden — Adventure Worlds
```

```text
Open World
```

## 11. Recommended Reviewer Focus
- Open `Book Statue` → `Math Garden` → `Adventure` and confirm the world-select screen appears with the finalized background art.
- Check that each world overlay aligns with the intended wooden sign and stays aligned when the panel scales.
- Confirm locked worlds can be selected for preview, unlocked worlds enable `Open World`, and the details panel reflects the selected world immediately.

## 12. Suggested Next Step
The next good follow-up would be replacing the current `Open World` placeholder with a true per-world level-map screen that reuses the selected world context and only shows levels from that world.
