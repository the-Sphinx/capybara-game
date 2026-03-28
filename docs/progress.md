# Progress

## 2026-03-28

### Math Garden Core Worlds Level Design Pass
- Expanded Math Garden’s core progression to 10 levels each for:
- `number_garden`
- `addition_field`
- `subtraction_patch`
- `multiplication_meadow`
- `division_grove`
- Added a broader Math recipe catalog in `capy-village/public/config/games/math_garden/game.json` to support world-specific progression without reusing off-theme content.
- Extended `answer_equation` so it now supports:
- `multiplication`
- `division`
- Added lightweight authored rule support for:
- `fixedOperand`
- `targetValue`
- `leftRange`
- `rightRange`
- Updated the Math runtime so:
- multiplication can target table-style recipes cleanly
- division generates only exact whole-number equations
- addition recipes can support make-10 style authored targets
- two-digit plus/minus one-digit progression can be authored with side-specific ranges
- Left `geometry_yard` and `fraction_forest` unchanged.

### Self-Check
- Verified `npm run generate:authoring` succeeds in `capy-village`.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed all five core worlds now have exactly 10 levels.
- Confirmed each of those worlds uses slots `1..10` exactly once.
- Confirmed all authored Math level `recipeId` values resolve to existing recipes.

### Minigame Config Split Cleanup
- Simplified the authored minigame config contract again.
- Removed the duplicated `levelSelectBackgroundPath` from `worldSelect`; level-select art now lives only under `levelSelect.backgroundPath`.
- Split large per-game `game.json` files so world-specific content now lives under:
- `capy-village/public/config/games/<gameId>/worlds/<worldId>.json`
- Added `worldIds` to each `game.json` to define load order.
- Updated `GameManager` to fetch `game.json`, then load `worlds/<worldId>.json` files and compose the full manifest before plugin normalization.
- Regenerated authoring docs and schemas so they now describe the new `game.json + worlds/*.json` structure.

### Self-Check
- Verified `npm run generate:authoring` succeeds in `capy-village`.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed `math_garden.game.schema.json` now expects `worldIds` instead of inline `worlds`.
- Confirmed the generated authoring doc now tells authors to add new worlds under `worlds/<worldId>.json`.

### Final Minigame Authoring Fix Pass
- Implemented `docs/tasks/capy_final_fix_plan.md`.
- Tightened plugin manifest validation so authored `game.json` files now fail with path-specific errors for bad keys and invalid nested values.
- Added validation for:
- `defaults`
- `worldSelect`
- `levelSelect`
- `arcade`
- world sign/click boxes
- level goal and bonus tier blocks
- level override containers
- Fixed resolved recipe normalization so runtime handlers always receive the descriptor/handler metadata they need.
- Removed the remaining mini-registry feel inside game plugins by attaching runtime handlers directly to descriptors and deriving the handler class from the resolved descriptor.
- Strengthened generated game schemas under `capy-village/src/config/games/schemas/` so they now include real field typing for top-level manifest sections and concrete recipe enums/number/string shapes.
- Regenerated `docs/minigame_mode_authoring.md` so it now matches the single `game.json` model, explains the core concepts, and includes concrete recipe/level examples for Math Garden authoring.
- Added the expected script alias `npm run generate:authoring` alongside the existing generator command.

### Self-Check
- Verified `npm run generate:authoring` succeeds in `capy-village`.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the generated `math_garden.game.schema.json` now contains explicit enums and typed fields for Math recipe authoring.
- Confirmed the generated authoring doc now describes `recipes`, `recipeId`, `overrides.rules`, and `overrides.scoring` against the current `game.json` structure.

### Known Risks
- Level `overrides.rules` / `overrides.scoring` remain validated at runtime against the selected recipe kind, but the JSON schema cannot fully discriminate those override keys by `recipeId` without a much more complex generated cross-reference model.
- This pass was build-verified and generator-verified, but not browser-verified.

## 2026-03-26

### Published Minigame Config Restructure
- Implemented the minigame config and asset reorganization task.
- Added a shared `config/games/<gameId>/...` structure with:
- one `arcade.json` per game
- one `world_select.json` per game
- one `level_select.json` per game
- one `levels/<worldId>_levels.json` per world
- Added a published runtime config path under `public/assets/config/games/...` by extending the asset publish step.
- Moved Math Garden authored map images into `assets/game_ready/games/math_garden/` as:
- `world_select.png`
- `level_select.jpeg`
- Removed hardcoded Math world and level-overlay metadata from JS and deleted `capy-village/src/games/mathGarden/worlds.js`.
- Removed the old source-import minigame JSON files from `capy-village/src/games/**` and switched runtime loading to fetched published JSON.
- Removed the earlier `manifest.json` experiment and rewired `GameManager` to load by convention from `arcade.json`, `world_select.json`, `level_select.json`, and `levels/<worldId>_levels.json`.
- Rewired `main.js` and `HubModal.js` to use that fetched config cache.
- Kept gameplay ids, world ids, level numbers, rewards, unlock behavior, and current Number Garden overlay behavior unchanged.
- Refined Math Garden shared level-select config so node positions are now reusable `slots` instead of being keyed by global `levelNum`.
- Updated the Math level overlay to assign each world’s levels onto the shared slots by level order.

### Self-Check
- Verified `npm run publish-assets` succeeds from the repo root.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed published game configs now exist under `capy-village/public/assets/config/games`.
- Confirmed published Math game images now exist as:
- `capy-village/public/assets/games/math_garden/world_select.png`
- `capy-village/public/assets/games/math_garden/level_select.jpeg`
- Confirmed Math level nodes now come from one shared `config/games/math_garden/level_select.json`.
- Confirmed Math gameplay levels are now split into `config/games/math_garden/levels/<worldId>_levels.json`.
- Confirmed shared Math level-select slots no longer depend on global `levelNum` keys.

### Known Risks
- This pass was verified through publish/build and source inspection, but I intentionally did not start another Playwright Chrome session because of the earlier orphan-window issue.
- Only Math Garden currently uses the world-select / level-select map path, but Watermelon Catch and Language Grove now follow the same config shape with `world_select.json` and `level_select.json` disabled for direct level-map behavior.

### Number Garden Level Overlay
- Implemented `docs/tasks/number_garden_level_overlay_spec.md`.
- Added a reusable full-screen level-overlay path for Math worlds and connected it to `Number Garden`.
- Replaced the old generic `Number Garden` placeholder with clickable stone-style level nodes on the map.
- Added explicit normalized Number Garden node coordinates to the Math world config.
- Added current/completed/locked node visuals, including glow, lock overlay, and selection highlight.
- Added a lightweight anchored info bubble with level title, description, reward, bonus preview, and play action for unlocked levels.
- Added click-outside behavior to dismiss the selected level bubble.
- Kept the remaining Math worlds on the placeholder path for now.

### Self-Check
- Verified `npm run publish-assets` succeeds from the repo root.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed `Number Garden` now enters the node-overlay flow instead of the generic placeholder.
- Confirmed unlocked node bubbles can launch the corresponding Math Garden adventure level.

### Known Risks
- Number Garden node positions are authored directly in config because the task did not provide explicit node coordinates or a dedicated level-map image.
- The overlay currently uses the shared Math Garden background image rather than a world-specific map asset.
- This pass was not browser-verified because I intentionally avoided starting another Playwright Chrome session after the earlier orphan-window issue.

## 2026-03-25

### Locked Popup UX And Microcopy
- Implemented `docs/tasks/capy_locked_popup_spec.md`.
- Replaced the temporary top-centered locked banner on the Math world screen with a contextual popup anchored near the clicked locked world.
- Updated locked-world microcopy to a compact two-line format:
- `Locked`
- `Complete {Required World} first`
- Added popup auto-dismiss after about 2 seconds.
- Added popup dismissal on the next interaction by clearing it on hover/selection changes.
- Added a subtle bump animation to the clicked locked sign.
- Tightened sign presentation by slightly enlarging titles, brightening the flower row, reducing lock size a bit, and normalizing title-to-row spacing.
- Centered the title + second row as one pack inside each sign with a fixed 3px gap.
- Kept unlocked-world navigation behavior unchanged.

### Self-Check
- Verified `npm run publish-assets` succeeds from the repo root.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the previous top-centered world message is no longer used for locked feedback.
- Confirmed locked-world popup placement is derived from the clicked sign box and clamped away from the top edge.
- Confirmed popup dismissal is now handled explicitly instead of depending on a full rerender.
- Confirmed hover/focus no longer immediately clear the popup after the locked click rerender.

### Known Risks
- Popup placement uses a generic anchored clamp rather than per-world authored bubble anchors.
- This pass was not browser-verified because I intentionally avoided starting another Playwright Chrome session after the earlier orphan-window issue.

### Math World Fullscreen Simplification
- Implemented `docs/tasks/math_world_fullscreen_spec.md`.
- Converted the Math Garden world-select screen from a split panel into a fullscreen, image-first experience.
- Removed the right-side details panel from the Math world-select flow.
- Removed the extra top title/chrome from the world screen so the authored image itself carries the title and framing.
- Removed the `X` button from the world screen and moved navigation to a single overlaid `Back` button in the bottom-right corner.
- Locked the world image to its native `3:2` aspect ratio so sign overlays remain aligned to the authored coordinates.
- Kept only minimal sign-local content:
- world title
- 5 flower-based progress icons for unlocked worlds
- centered lock icon for locked worlds
- Added broader clickable hotspots around each sign so the nearby world patch is easier to click.
- Changed locked-world interactions to show a lightweight in-screen popup message instead of relying on a side panel.
- Kept unlocked-world clicks wired into the existing placeholder world-entry path.

### Self-Check
- Verified `npm run publish-assets` succeeds from the repo root.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the Math Garden world-select screen no longer renders the right-side details panel, top title, or close button.
- Confirmed locked clicks now produce popup feedback and unlocked clicks still proceed.
- Confirmed the world screen now preserves the image’s `3:2` ratio.

### Known Risks
- The broader click regions are generated by expanding sign bounds rather than using hand-authored patch polygons, so they are friendlier than sign-only clicks but still approximate.
- The 5-flower progress row assumes the current 10-level total interpretation described in the task.
- This pass was not browser-verified because I intentionally avoided starting another Playwright Chrome session after the earlier orphan-window issue.

### Math World Select Integration
- Implemented `docs/tasks/capy_math_world_select_integration.md`.
- Added a dedicated Math Garden world-select screen inside the existing hub flow for `Adventure`.
- Added the finalized `math_garden_v3.png` background image to `assets/game_ready/images`.
- Added a data-driven Math world configuration source with 7 worlds and the exact user-provided normalized sign-box coordinates.
- Added `worldId` metadata to Math Garden adventure levels so world progress is grouped explicitly.
- Replaced the old flat Math adventure level-map entry with clickable world signs and a warm right-side details panel.
- Derived `locked`, `unlocked`, `current`, and `completed` world states from the existing save data instead of creating a separate world-save model.
- Added an `Open World` placeholder screen for unlocked worlds so the navigation path is cleanly wired for a future inside-world level map.

### Self-Check
- Verified `npm run publish-assets` succeeds from the repo root.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the finalized background image is published into the public assets path.
- Confirmed the Math Garden adventure branch now routes to the new world-select screen rather than the old flat level list.

### Known Risks
- The current 10 Math Garden adventure levels are now distributed across 7 worlds using explicit `worldId` assignments, but some world-to-content semantics are still temporary until deeper world-specific content is authored.
- `Open World` is intentionally a placeholder screen for now, because world-internal level maps were out of scope for this task.
- This pass was not browser-verified because I intentionally avoided starting another Playwright Chrome session after the earlier orphan-window issue.

## 2026-03-24

### Reward System Clarity Pass
- Implemented `docs/tasks/capy_reward_system_draft.md`.
- Added a shared reward helper layer in `capy-village/src/games/rewardUtils.js`.
- Standardized all arcade games to award coins using `1 score = 1 coin`.
- Added shared adventure reward computation with clear reward plus bonus tiers.
- Added default bonus-tier generation so levels without explicit `bonusTiers` still preview and award extra coins consistently.
- Removed adventure auto-finish-on-goal behavior from Math Garden and Language Grove so players can keep playing for bonus coins.
- Added the in-run message `Goal Complete! Keep going for bonus coins!` to all three adventure games.
- Upgraded adventure result screens to show line-by-line reward breakdowns and total earned coins.
- Updated the hub to show arcade reward rules, preview locked levels, display reward details, and block play only at the start button level.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed no `Math.floor(score / 2)` arcade reward logic remains in the current game code.
- Confirmed locked level nodes are now previewable in hub rendering logic while keeping the play action disabled.

### Known Risks
- Bonus tiers are currently generated by shared defaults when level data does not provide explicit `bonusTiers`, so balance is coherent but still draft-level rather than fully authored per level.
- This pass was not browser-verified because I intentionally avoided starting another Playwright Chrome session after the earlier orphan-window issue.

## 2026-03-23

### Math Garden HUD Readability And Arcade Prompt Restore
- Restored the Math Garden arcade center HUD content so collection modes again show their title and instruction prompt.
- Fixed arcade collection mode rendering so prompts like `Catch even numbers!` and `Catch odd numbers!` are visible again.
- Improved center HUD readability by strengthening the equation/instruction outline and shadow treatment.
- Added a subtle pill background behind center-banner equations and instructions so they stand out better on the textured panel.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed Math Garden arcade prompt data already exists in `arcade.json` and now has an active render path again.

### Known Risks
- The stronger center HUD styling is shared with other games using the same banner classes, so the visual change is intentionally broader than Math Garden alone.

### Class-Based Footprint Transform Scaling
- Implemented the shared-footprint transform fix so asset-class footprints now derive world-space colliders from each instance transform.
- Treated shared footprint JSON values as canonical local-space footprint definitions.
- Updated footprint offsets to scale with the instance and rotate with the instance yaw before being applied.
- Updated rect footprints so `width` and `depth` scale with the instance `x/z` scale.
- Updated circle footprints so `radius` scales by the larger of `scaleX` and `scaleZ`.
- Kept the current shared asset-class footprint model and left layout JSON free of any footprint data.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the shared collider computation is now used by both editor overlays and runtime authored colliders.

### Known Risks
- Circle footprints remain conservative circles under non-uniform scale rather than becoming ellipses.
- This pass was not browser-verified because I intentionally avoided starting another Playwright Chrome session after the earlier orphan-window issue.

### Footprint Editor Regression Fix
- Fixed the footprint editor so switching `circle` / `rect` updates the visible field rows immediately.
- Fixed selection changes so deselecting refreshes footprint overlays and removes forced footprint visuals when the global toggle is off.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.

### Shared Footprint Export And Class-Based Editing
- Reworked footprint tuning to be class-based instead of instance-based.
- Added a `Footprints: On/Off` toolbar toggle with `Off` as the default state.
- Added a `Save Footprints` toolbar action that downloads the shared footprint registry as `collider_footprints.json`.
- Added semi-transparent footprint overlays with darker blue borders in the editor viewport.
- Added an `Update Footprint` action for selected world objects and a dedicated right-panel footprint editor with a local back button.
- Added editable footprint fields for `type`, `radius`, `width`, `depth`, `offsetX`, `offsetZ`, and `rotationOffset`.
- Added the shared asset-class footprint source file at `config/collider_footprints.json`.
- Reworked `capy-village/src/footprints.js` so editor and runtime both use the same JSON-backed shared footprint registry.
- Removed footprint data from layout save/load/schema so layout JSON stays focused on object placement transforms only.
- Updated the runtime layout path to use only the shared asset-class footprint registry for authored collisions.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the editor and runtime now share the same footprint computation path.
- Confirmed serialized layout objects no longer include footprint data.
- Confirmed the editor can export the current shared footprint registry as `collider_footprints.json`.

### Known Risks
- This pass was not browser-verified because I intentionally avoided starting another Playwright Chrome session after the earlier orphan-window issue.
- Saving shared footprints is an explicit export/download flow; the exported JSON still needs to replace the checked-in repo file manually.
- The new shared footprint module currently produces a separate build chunk, which is acceptable for now but may be revisited later if bundle shaping matters.

### Collision Refinement And Interaction Polish
- Implemented `docs/tasks/capy_collision_interaction_polish.md`.
- Removed authored-world proximity scaling feedback from the interaction system.
- Replaced the scale pulse with a subtle emissive highlight on the active runtime interactable.
- Added circle and rotated-rectangle collider support to `collides()`.
- Switched current authored building collisions to tighter per-asset footprints for `hut_1`, `mushroom_house`, `book_statue`, `pumpkin`, `hat_stand`, and `melon_stand_2`.
- Expanded interaction radii from collider size plus a buffer so prompts appear more comfortably near building edges.
- Added lightweight selection hysteresis so nearby authored interactables do not switch as abruptly.
- Hid the prompt while modal UI is open.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the active interaction feedback path no longer modifies `object.scale`.
- Confirmed authored role interactables now derive their interaction radius from collider size plus a buffer.
- Fixed the authored runtime collider-registration regression so the new footprint colliders are actually added to the scene at runtime.

### Known Risks
- Collider footprints are hand-tuned for the current authored building set and future hero buildings will still need explicit entries for best approach feel.
- Live browser verification was limited because the Playwright CLI session was flaky about its socket/session state during this pass.

### World Roles And Interaction Mapping
- Implemented `docs/tasks/capy_world_roles_task.md`.
- Connected the authored runtime-layout objects `book_statue`, `hat_stand`, and `melon_stand_2` to the existing interaction system.
- Mapped the central book fountain to the hub flow with the prompt `Press [E] to Explore Knowledge`.
- Mapped the hat stand to the closet/boutique flow with the prompt `Press [E] to Browse Hats`.
- Mapped the watermelon stand to direct `watermelon_catch` launch with the prompt `Press [E] to Play Watermelon Catch`.
- Kept the existing one-active-target prompt system and `E` interaction flow instead of introducing a parallel architecture.
- Added a very subtle pulse feedback on the active authored interactable.
- Added support in `openModal(...)` for lightweight string aliases such as `store`, `hub`, and `watermelon_catch`.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the current authored layout contains the three task landmarks: `book_statue`, `hat_stand`, and `melon_stand_2`.
- Confirmed the runtime authored-layout path now registers interactables instead of only the old prototype zone list.

### Known Risks
- Role mapping is currently inferred by `assetId`, so duplicating role-bearing assets later would create multiple interactables unless a future task adds per-object metadata.
- The pulse feedback is intentionally minimal and may want one more visual tuning pass after more live playtesting.

### Camera Fine-Tuning
- Implemented `docs/tasks/capy_camera_fine_tuning_task.md`.
- Tightened the camera dead zone from `3.5 / 3.0` to `2.8 / 2.4`.
- Tightened the edge zone from `5.0 / 4.2` to `4.3 / 3.6`.
- Increased `followLerpSoft` from `0.025` to `0.04`.
- Increased `followLerpStrong` from `0.07` to `0.09`.
- Kept `lookFollowFactor = 0.35`.
- Kept `compositionBias = 0.15`.
- Removed the duplicate inner `compositionBias` declaration from `animate()`.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/main.js`.

### Known Risks
- This is still a subjective feel pass, so another small tuning round may still be desirable after more live movement testing.
- The current `maxCameraShift` cap remains unchanged and may still be the next limit if the camera feels too composition-anchored near the outer bounds.

## 2026-03-22

### Performance Optimization Pass
- Implemented `docs/tasks/capy_performance_optimization_repo_aligned.md`.
- Added a focused instancing path in `capy-village/src/runtimeLayout.js` for repeated non-blocking decor only.
- Grouped authored layout objects by `assetId` and kept the existing clone path for unique, blocking, and hero assets.
- Built one `THREE.InstancedMesh` per template mesh for eligible repeated decor groups.
- Kept collider behavior unchanged for blocking assets and skipped colliders for instanced non-blocking decor.
- Reduced detailed sanitize logging to dev mode while keeping lightweight instancing summary logs.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the current authored layout contains repeated eligible decor such as `stones_4`, `stones_1`, `stones_3`, and `cubes_1`.

### Known Risks
- Instancing is intentionally scoped to repeated static non-blocking decor and does not attempt to optimize hero assets or anything that may need independent collider/animation behavior later.
- Multi-mesh repeated assets still create one instanced object per mesh node, so gains are strongest on simple repeated props.

### Sky And Cute Clouds
- Implemented `docs/tasks/capy_sky_clouds.md`.
- Updated the runtime sky background to a softer pastel blue.
- Added four reusable stylized cloud variants made from overlapping low-poly sphere puffs.
- Added eight cloud instances placed high and behind the village tree line.
- Added very slow horizontal cloud drift with simple wraparound.
- Kept clouds lightweight with one shared material and no shadows.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/world.js` and the sky update hook in `capy-village/src/main.js`.

### Known Risks
- If future camera shift range grows, the cloud layer may want a few more instances to avoid sparse edges.
- The current wrap behavior is intentionally simple and may repeat visibly over very long play sessions.

### Camera Visibility Safeguard And Soft Bounds
- Implemented `docs/tasks/capy_camera_visibility_safeguard_and_bounds.md`.
- Kept the current hybrid diorama camera base and composition-preserving look-target bias.
- Added a second edge-response zone so camera follow strengthens only when the capy approaches the frame edge.
- Used `deadZone = { x: 3.5, z: 3.0 }` and `edgeZone = { x: 5.0, z: 4.2 }`.
- Used `followLerpSoft = 0.025` and `followLerpStrong = 0.07`.
- Added soft player movement bounds:
- `minX: -7.5`
- `maxX: 7.5`
- `minZ: -6.5`
- `maxZ: 7.0`

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/main.js`.

### Known Risks
- The visibility safeguard is still behavior-based rather than using a direct viewport visibility test.
- If the authored village footprint grows further, the movement bounds and max camera shift may need joint retuning.

### Camera Follow Dead-Zone
- Implemented `docs/tasks/capy_camera_follow_deadzone_task.md`.
- Reintroduced runtime camera follow using a soft dead-zone system instead of the temporary fully static debug camera.
- Preserved the current diorama framing by deriving follow from the existing camera-to-capy offset.
- Used a dead zone of `1.5` on both `x` and `z`.
- Smoothed camera motion by interpolating a follow anchor with factor `0.05`.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/main.js`.

### Known Risks
- Camera bounds clamping is still not present in this pass.
- If the layout footprint expands further, the follow target may want a slight center bias in a future tuning pass.

### Ground Boundary Cleanup
- Implemented `docs/tasks/capy_ground_boundary_cleanup_task.md`.
- Removed the overlapping large circular ground layers that were still making the island edge feel dirty and mismatched.
- Simplified the runtime base to one clean island mesh and one central plaza mesh.
- Switched the island base to a single clean beige material using `0xe2dcc2`.
- Kept the island radius at `12` and did not add extra trees during this cleanup.

### Self-Check
- Verified there is no old infinite `PlaneGeometry` floor in the runtime scene code.
- Temporarily added ground debug logging during the pass to confirm the active ground meshes, then removed it afterward.
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.

### Known Risks
- The cleaner island is intentionally more minimal, so some earlier soft meadow variation is gone.
- If edge gaps are still visible from the fixed camera, the next adjustment should be sparse boundary trees rather than more ground layers.

### Ground Boundary And Horizon Control
- Implemented `docs/tasks/capy_ground_boundary_pass.md`.
- Reworked the runtime ground into a contained circular island with a lighter top surface and darker supporting body.
- Added a subtle center-to-edge ground fade so the outer edge softens toward the sky instead of reading like a hard cutoff.
- Lowered the main island surface slightly to reduce the visible horizon line.
- Kept the central plaza and soft meadow patches on the new bounded island.
- Matched the renderer clear color to the sky background and kept fog disabled.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/world.js`.

### Known Risks
- Tree placement was not expanded in this pass, so horizon blocking still depends on the current authored layout and fallback tree positions.
- Very edge-heavy future layouts may still reveal more of the island perimeter than desired.

### Lighting And Color Softening Pass
- Implemented `docs/tasks/capy_lighting_color_softening_pass.md`.
- Updated the runtime lighting rig to a softer toy-diorama baseline using a warm directional sun, cooler sky fill, warmer ground bounce, and restrained ambient support.
- Set the renderer to the requested ACES + sRGB baseline with `toneMappingExposure = 1.08`.
- Shifted the runtime background to a softer pastel sky color.
- Added subtle sky-matched fog to reduce harshness and improve miniature softness.
- Increased shadow softness by using a larger shadow map and blur radius on the main sun.
- Kept camera framing, layout, props, and gameplay logic unchanged.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Confirmed the task-constrained runtime changes are isolated to `capy-village/src/world.js`.

### Known Risks
- The optional fog may want one more tune if the village footprint expands farther from center.
- Saturated source asset textures may still read stronger than the softer lighting alone in some future layouts.

### Diorama Camera Pass
- Implemented `docs/tasks/camera_pass_diorama.md`.
- Updated the runtime camera to a higher/further diorama setup with `FOV = 30`.
- Added soft dead-zone follow behavior so the camera tracks the player gently instead of snapping or using the old close follow framing.
- Added camera target clamping so the village stays framed like a miniature scene.
- Adjusted runtime collision generation so tiny decorative props do not block the capy like buildings.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Browser-verified the published scene loads with the new diorama framing.
- Verified movement input can be sent in the live scene after the decorative-prop collider filter was added.

### Known Risks
- Decorative-prop collision filtering is still heuristic and may evolve into explicit metadata later.
- The authored layout has additional user-side work in the tree and was intentionally left out of this task commit.

## 2026-03-20

### Camera And Composition Lock
- Implemented `docs/tasks/capy_camera_composition_task.md`.
- Removed the runtime follow-camera behavior.
- Locked the gameplay view to a fixed diorama camera with a curated position, center look target, subtle tilt, and slightly wider framing.
- Preserved the user-authored statue-centered layout and recent prop additions as the main composition structure.
- Updated publish to skip hidden files like `.DS_Store`.
- Added ignore rules for `tmp/` and nested `.DS_Store` files.

### Self-Check
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Browser-verified that the runtime camera no longer follows the player dynamically.
- Verified publish logs no longer include copied `.DS_Store` files.

### Known Risks
- Live `vite dev` verification is still partially blocked by an existing GLB-loading fallback issue, so the browser screenshots do not yet show the fully authored published village.
- The fixed camera may need occasional retuning if the authored layout footprint grows.

### Asset Registry Removal
- Removed `config/asset_registry.json`.
- Simplified the editor to auto-discover palette assets directly from `assets/game_ready/models/**/*.glb`.
- Kept editor filtering so `characters/` and `accessories/` stay excluded.
- Updated the workflow doc to note that there is currently no asset registry file to maintain.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Verified the editor no longer imports `config/asset_registry.json`.

### Known Risks
- Asset ids still come from curated GLB filenames, so renaming a game-ready file changes its id.
- If custom labels/categories are needed later, a new purpose-built metadata file may be added back.

### Raw-Folder Normalization Workflow
- Updated the normalization pipeline so it no longer depends on `config/asset_registry.json`.
- Switched `npm run normalize-assets` to scan every `.glb` file under `assets/pipeline/models/raw`.
- Kept normalized outputs aligned by writing to `assets/pipeline/models/normalized` with the same basenames.
- Preserved single-asset normalization via filename-based ids such as `tree_1`.

### Self-Check
- Verified `npm run normalize-assets` succeeds against the current raw folder contents.
- Verified the command normalized `cubes_1`, `tree_1`, and `tree_2`.
- Verified all three runs preserved textures/images and reported `status: OK`.

### Known Risks
- Filename-derived ids are convenient for the raw pipeline, but a separate curated metadata registry is still the better place for durable editor/runtime asset ids later.
- Some normalized assets still land extremely close to `Y=0` rather than exactly `Y=0`.

### Toy Ground And Warm Lighting
- Implemented `docs/tasks/capy_ground_lighting_task.md`.
- Replaced the old flat green plane with a layered circular toy-base ground.
- Added a darker lower ring, lighter inset top surface, and a raised central plaza disk to give the ground more miniature-base character.
- Added simple procedural variation patches so the main ground no longer reads as a single flat color.
- Updated the scene light rig to a warmer directional sun, warmer hemisphere fill, and soft ambient support.
- Enabled physically correct lights and increased ACES exposure slightly for a softer, warmer presentation.
- Kept authored asset materials unchanged as required.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Verified `npm run publish-assets` succeeds before runtime inspection.
- Browser-verified the updated scene in a headed automation session and captured a screenshot.
- Confirmed visually that the flat plane is gone, the center plaza reads separately, and shadows are warmer and softer.

### Known Risks
- `vite dev` still hit an existing published-layout fallback warning during the live check, so the screenshot used the prototype village rather than the fully authored published village.
- The new central plaza is origin-based for now rather than layout-driven.
- Ground variation is intentionally simple and may want one more tuning pass once camera composition is finalized.

### Blender Normalization Pipeline
- Implemented `docs/tasks/capy_blender_normalization_pipeline.md`.
- Replaced the old Node-based asset normalization backend with a Blender CLI pipeline.
- Added `scripts/blender_normalize_glb.py` to import GLBs, apply rotation/scale, ground-align, center, and normalize to unit height without rewriting materials.
- Updated `tools/normalize_assets.ts` to call Blender headlessly for each registry asset.
- Added normalization-time GLB inspection so texture count, image count, file size, and preservation status are printed for every asset.
- Regenerated the normalized building assets with embedded textures preserved.
- Copied the textured normalized building GLBs into `assets/game_ready/models/buildings`.
- Kept published runtime assets aligned by re-running the publish step after regeneration.
- Removed the runtime material-flattening fallback so authored GLB materials now render as exported.

### Self-Check
- Verified `npm run normalize-assets` succeeds.
- Verified normalization reported `status: OK` for `hut_1`, `mushroom_house`, and `book_statue`.
- Verified normalized, game-ready, and published `hut_1.glb` each contain `textures: 3` and `images: 3`.
- Verified `npm run publish-assets` succeeds.
- Verified `npm run build` succeeds in `capy-village`.
- Previously browser-verified the published runtime village now shows authored colors and shading instead of stripped fallback materials.

### Known Risks
- Textured normalized GLBs are much larger than the stripped versions because embedded textures are intentionally preserved.
- Blender emits a repeated shader-image export warning, but the outputs still retain textures and render correctly.
- Texture optimization/compression is intentionally deferred to a later task.

## 2026-03-19

### GLB Visibility And Lighting
- Implemented `docs/tasks/capy_glb_visibility_and_toy_lighting_task.md`.
- Added runtime GLB mesh diagnostics for material type, base color, vertex colors, normals state, bounding-box validity, and fallback usage.
- Added runtime geometry sanitation so imported published meshes recompute vertex normals only when needed.
- Simplified imported world materials to a readable matte `MeshStandardMaterial` baseline while preserving vertex colors and usable maps.
- Added a warm clay fallback material for unreadable white/no-map published meshes.
- Updated the runtime renderer to use `sRGB` output, `ACESFilmicToneMapping`, and exposure `1.0`.
- Replaced the old ambient-only world lighting with a hemisphere fill and a warm directional key light.
- Updated the runtime background and ground material so the village reads against a softer toy-like baseline.

### Self-Check
- Verified `npm run build` succeeds in `capy-village`.
- Browser-verified the runtime authored village still loads from the published layout and manifest.
- Verified imported published assets are no longer black silhouettes in the live runtime scene.
- Verified runtime diagnostics report:
- `hut_1` uses the warm fallback path
- `mushroom_house` preserves vertex colors without fallback
- `book_statue` uses the warm fallback path

### Known Risks
- Some assets now read as a temporary clay/wood fallback rather than their eventual final authored palette.
- `mushroom_house` is readable but still visually paler than the fallback-treated assets.
- Runtime diagnostics are intentionally verbose for now and may need gating later.

### Runtime Layout Bridge
- Implemented `docs/tasks/capy_player_preview_and_runtime_layout_task.md`.
- Extended layout JSON and schema with a top-level `player` transform block.
- Added a real capy player preview to the editor at locked scale `1`.
- Made player preview selectable but non-scalable, non-duplicable, and non-deletable.
- Updated the editor save/load flow to persist `layout.player.position` and `layout.player.rotation`.
- Added runtime loading for published `/layouts/village_hub_v1.json` and `/assets/manifest.json`.
- Switched the main game path to spawn world assets from the published layout instead of using the hardcoded prototype village by default.
- Kept the prototype village as a fallback when published layout loading fails.
- Updated runtime capy spawning to use the saved layout player transform.

### Public Asset Cleanup
- Moved curated audio files into `assets/game_ready/audio`.
- Moved curated UI images into `assets/game_ready/images`.
- Moved the remaining curated `capy_store` building source into `assets/game_ready/models/buildings`.
- Updated gameplay asset paths so runtime now reads from published `assets/...` locations instead of legacy root `public/models`, `public/audio`, and `public/images`.
- Updated publish tooling to remove legacy root-level public asset folders after publishing.
- Stopped tracking generated `capy-village/public/assets` and `capy-village/public/layouts` outputs in git so `assets/game_ready` remains the source of truth.

### Self-Check
- Verified `npm run publish-assets` succeeds after the `assets/game_ready` cleanup.
- Verified `npm run build` succeeds in `capy-village`.
- Verified `npm run verify-capy-assets` still reports `capy_idle height=1` and `minY=0`.
- Browser-verified the editor player preview in Playwright:
- player preview appears and is selected
- `Type` shows `player`
- duplicate/delete are disabled
- scale control is hidden/locked
- palette asset clicks resolve against local `assets/game_ready` GLBs successfully
- selection now happens before transform-drag handling, so the player preview can be clicked and dragged more directly
- skeleton-aware preview cloning keeps the visible capy mesh moving with the player transform instead of leaving only the selection box behind
- Browser-verified the runtime in Playwright:
- requests `/layouts/village_hub_v1.json`
- requests `/assets/manifest.json`
- loads published building GLBs and the published capy GLB
- renders the authored village with the capy in the scene

### Known Risks
- The editor still downloads layouts instead of writing directly to `layouts/`.
- The browser still logs a harmless `favicon.ico` 404.
- Runtime authored-world collision uses broad bounding boxes rather than hand-authored collision volumes.
- The editor flow still requires a publish step before the game reflects the latest saved layout.

### Completed
- Normalized the capy character runtime GLB to `height = 1` and grounded it at `Y = 0`.
- Rescaled the live accessory runtime GLBs (`crown`, `chef_hat`, `knit_beanie`, `scarf_v2`) with the same shared factor used for the capy.
- Updated `capy-village/src/capy.js` so runtime grounding uses bounding-box `minY` rather than assuming the model is vertically centered.
- Added `npm run normalize-capy-assets` and `npm run verify-capy-assets`.
- Added reusable GLB tooling for loading, measuring, and re-exporting normalized character/accessory assets.
- Implemented the Phase 1 layout editor from `docs/tasks/capy_layout_editor_phase1_spec.md`.
- Added a dedicated editor entry page at `capy-village/editor.html`.
- Added the editor UI, asset palette, selection/highlight flow, transform editing, duplication, deletion, save, and load plumbing.
- Added `config/layout_schemas/village_layout.schema.json` and an initial `layouts/village_hub_v1.json`.
- Configured Vite to build both the gameplay app and the editor app.
- Browser-verified the core manual composition flow with Playwright.

### Self-Check
- Verified the capy runtime GLB still contains animation plus `hat_anchor` and `neck_anchor` after normalization.
- Verified `npm run verify-capy-assets` reports `capy_idle height=1` and `minY=0`.
- Verified the live game no longer logs missing anchor warnings after the normalized character GLB is loaded.
- Verified `npm run build` still passes in `capy-village`.
- Asset palette reads from the existing registry and spawns normalized asset instances.
- New objects are selected immediately and expose editable position, rotation, and scale fields.
- Duplicate and delete are wired to per-instance object ids.
- Save produces readable layout JSON with Euler rotations in degrees.
- Build emits `dist/editor.html` alongside the main game entry.

### Known Risks
- The Blender source-blend normalization path is present but opt-in because direct Blender CLI invocation from the packaged command was unstable in this environment.
- The local source `.blend` files under `assets/source/**` were updated during the task but remain ignored and therefore are not part of the git history.
- Accessory fit verification is currently based on preserved anchors and runtime sanity checks, not a dedicated automated visual diff.
- Load-via-file is implemented but was not exercised end-to-end in browser automation during this task.
- The editor currently downloads layout JSON rather than writing directly into `layouts/`.
- Dev console still shows a harmless `favicon.ico` 404 and a Three.js duplicate-instance warning.

### UI Polish
- Enabled snap by default and kept grid visible by default.
- Tuned the grid colors so the minor snap lines stay visible while the center axes still read clearly.
- Simplified scale editing to a single uniform scale control.
- Removed the editable object id field from the right panel.
- Renamed the display-only asset field to `Asset Name`.
- Moved duplicate/delete controls into the right panel.
- Reduced right-panel clutter by removing extra helper copy and tightening transform rows.
- Forced the top action bar into a single horizontal row.

### Asset Flow Migration
- Updated the normalization pipeline to use `assets/pipeline/models/raw` as input and `assets/pipeline/models/normalized` as output via the asset registry.
- Switched editor asset discovery to curated assets under `assets/game_ready/models`.
- Added editor-side filtering so `assets/game_ready/models/characters` and `assets/game_ready/models/accessories` are ignored for now.

### Publish Bridge
- Added `npm run publish-assets` at the repo root.
- Added `tools/publish_assets.ts` to copy curated game-ready assets into `capy-village/public/assets`.
- Added layout publishing into `capy-village/public/layouts`.
- Added generated runtime `manifest.json` for published `.glb` assets.
- Tightened `.gitignore` so heavy binaries stay ignored while asset folder structure and metadata remain visible.
- Updated the GitHub Pages workflow to publish assets before building.

## 2026-03-18

### Completed
- Implemented the asset normalization pipeline from `docs/tasks/capy_asset_normalization_pipeline.md`.
- Added a root `npm run normalize-assets` command.
- Added the initial asset registry for `hut_1`, `mushroom_house`, and `book_statue`.
- Switched normalization to canonical unit-height exports so layout JSON can define true in-world size later.
- Verified normalized outputs are ground-aligned, bottom-centered, and effectively `height = 1`.
- Added `assets/` to `.gitignore`.
- Added a review bundle at `docs/review/REVIEW_BUNDLE.md`.

### Workflow Notes
- New tasks should be read from `docs/tasks/`.
- After each meaningful task: self-check the implementation against the task doc, update `docs/review/REVIEW_BUNDLE.md`, update this file, then commit and push.

### Known Risks
- The current Node-based GLB pipeline emits texture-loading warnings, so final texture preservation still needs review.
- Moved authored runtime JSON into `capy-village/public/config/...` so the game/editor now read one in-app source of truth instead of repo-root config plus published copies.
- Moved the layout source to `capy-village/public/config/layouts/village_hub_v1.json` and updated runtime/editor paths accordingly.
- Moved hub categories to `capy-village/public/config/games/categories.json` and updated the hub fetch path.
- Replaced the dead legacy `public/data/accessories.json` with a real `capy-village/public/config/accessories.json` consumed by `state.js`.
- Kept only the layout schema in `capy-village/src/config/layouts/village_layout.schema.json`.
- Simplified `publish-assets` so it now publishes curated assets only and clears old legacy generated config/layout output under `public/assets/config` and `public/layouts`.

## 2026-03-27

### Completed
- Rebuilt the minigame runtime around a shared engine shell in `capy-village/src/games/engine/EngineGame.js`.
- Added explicit reusable mode families under `capy-village/src/games/modes/` for `collection`, `answer`, `stream`, and `choice_round`.
- Converted Math Garden, Language Grove, and Watermelon Catch into thin adapters over that shared shell plus per-game runtime providers.
- Added per-game `modes.json` files under `capy-village/public/config/games/*/modes.json`.
- Replaced the loose mode recipe shape with typed `type + params` recipes backed by a central registry in `capy-village/src/games/modeRegistry.js`.
- Renamed legacy mode ids like `collect_odd`, `answer_add`, and `classic` to explicit authored recipe ids.
- Added JSON schema files for each game's `modes.json` under `capy-village/src/config/games/schemas/`.
- Added `docs/minigame_mode_authoring.md` so supported mode types and valid params are discoverable without reading runtime code.
- Added stable `levelId` fields to adventure level JSON and switched hub/save progression to use level IDs instead of bare `levelNum`.
- Reset minigame progression in `SaveManager` migration `v4` so world-aware progress no longer collides across Math worlds.
- Removed authored `subType` from level JSON; handler family is now derived from the selected mode recipe.
- Simplified Math level-slot selection so the shared `level_select.json` only uses explicit `slot` mapping and no longer falls back to ordered placement.
- Added `modeId` explicitly to Watermelon adventure levels so all three games now resolve gameplay through the same typed recipe path.
- Made `itemCount` a real typed stream param in Language Grove instead of a dead authored field.

### Verification
- Ran `npm run build` successfully in `capy-village`.

### Follow-up Watchpoints
- The new engine shell preserves the shared HUD/timer/reward flow, but gameplay behavior should still be spot-checked in-browser for Math, Language, and Watermelon after the refactor.
- `main.js` still preloads a fixed set of current minigame ids; future dynamic game discovery would be a separate cleanup.
- The registry validates configs at runtime load, but the new schema files are currently authoring aids rather than automatically enforced by a separate schema toolchain.

### Completed
- Replaced the global `modeRegistry.js` path with explicit per-game plugins under `capy-village/src/games/plugins/`.
- Moved minigame authoring from split `modes/world_select/level_select/levels/arcade` files to one `game.json` manifest per game under `capy-village/public/config/games/<gameId>/`.
- Introduced colocated mode descriptors per game so author-facing kinds are now game-local concepts like `collect_numbers`, `answer_equation`, `collect_letters`, and `classic_collect`.
- Kept the shared runtime class hierarchy, but moved game-specific handler wiring into each plugin instead of one central registry.
- Added inheritance-aware manifest normalization with `defaults`, world-level defaults, and per-level `overrides.rules` / `overrides.scoring`.
- Generalized Math number collection so future recipes like prime-number collection can be added in config only.
- Added generated authoring artifacts:
  - `docs/minigame_mode_authoring.md`
  - `capy-village/src/config/games/schemas/*.game.schema.json`
- Added `npm run generate:minigame-authoring` in `capy-village` to regenerate docs/schema from descriptor metadata.

### Verification
- Ran `npm run generate:minigame-authoring` successfully in `capy-village`.
- Ran `npm run build` successfully in `capy-village`.

### Completed
- Redesigned the five core Math Garden world paths around a clearer learning arc:
  - `Even & Odd`
  - `Multiples`
  - `Prime Numbers`
  - `Add & Subtract`
  - `Mixed Mastery`
- Reauthored those five world files so each now has 10 levels with more variation in pressure, pacing, and rule complexity instead of simple range-only escalation.
- Extended `collect_numbers` authoring to support:
  - matcher objects
  - `not`, `any_of`, and `all_of` rule composition
  - per-level `spawnDelayRange`
  - per-level `fallSpeedRange`
  - phased rule switches via `rules.phases`
- Updated Math runtime so collection levels can change instructions mid-level, clear old falling items on rule switches, and honor authored spawn/fall-speed tuning.
- Simplified Math recipe authoring by collapsing the large world-specific recipe catalog into a smaller reusable toolkit in `capy-village/public/config/games/math_garden/game.json`.
- Fixed level info bubble placement for top-row nodes so the overlay can render below the stone instead of clipping off-screen.
- Updated the generated Math authoring schema and `docs/minigame_mode_authoring.md` to reflect the richer `collect_numbers` contract.

### Verification
- Ran `npm run generate:authoring` successfully in `capy-village`.
- Ran `npm run build` successfully in `capy-village`.

### Completed
- Realigned Math Garden world content to the actual current world themes from `docs/tasks/math_garden_world_aligned_redesign_instructions.md`.
- Kept `number_garden` unchanged.
- Rebuilt `addition_field` as a pure addition `answer_equation` progression with 10 levels.
- Rebuilt `subtraction_patch` as a pure subtraction `answer_equation` progression with 10 levels.
- Rebuilt `multiplication_meadow` as a divisibility-pattern `collect_numbers` progression using multiples of `2`, `3`, `4`, and `5`.
- Rebuilt `division_grove` as a more exacting divisibility progression using divisors `2`, `3`, `5`, `6`, `8`, and `10`.
- Added reusable divisibility recipes to `capy-village/public/config/games/math_garden/game.json` for:
  - `collect_divisible_by_6`
  - `collect_divisible_by_8`
  - `collect_divisible_by_10`
- Emptied unsupported worlds:
  - `geometry_yard`
  - `fraction_forest`
  so they no longer present misleading fake content.

### Verification
- Ran `npm run build` successfully in `capy-village`.
- Confirmed:
  - `addition_field`, `subtraction_patch`, `multiplication_meadow`, and `division_grove` each have 10 levels
  - `geometry_yard` and `fraction_forest` each have 0 levels

### Completed
- Fixed adventure progression so completing a level still unlocks the next level, and completing the final level of a world can now unlock the first level of the next world.
- Added explicit world unlock config support in Math Garden world files:
  - `startsUnlocked`
  - `unlockAfterWorldId`
- Added `saveManager.unlockLevel(...)` so progression rules can explicitly seed the first playable level of a newly unlocked world.
- Updated hub world-lock computation to respect configured world unlock rules instead of relying only on whether some level in that world had already been unlocked as a side effect.
- Added `GameManager.getWorlds(...)` / `getWorldById(...)` helpers and updated `getNextAdventureLevel(...)` so cross-world progression can resolve the first level of the next configured world.

### Verification
- Ran `npm run build` successfully in `capy-village`.
- Confirmed Math Garden unlock chain config:
  - `number_garden` starts unlocked
  - `addition_field` unlocks after `number_garden`
  - `subtraction_patch` unlocks after `addition_field`
  - `multiplication_meadow` unlocks after `subtraction_patch`
  - `division_grove` unlocks after `multiplication_meadow`
