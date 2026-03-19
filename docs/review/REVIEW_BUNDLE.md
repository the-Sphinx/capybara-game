# REVIEW BUNDLE

## 1. Task Summary
- Task name: Player preview in editor, runtime layout loading, and public asset cleanup
- Date: 2026-03-19
- Time: 23:08 +03
- Branch: scene-restructure
- Commit hash: 3517ba3
- Agent: Codex
- Status: completed

## 2. Objective
Bridge the layout editor to the actual game runtime by introducing a special player preview transform in layout JSON, loading the published layout and manifest at runtime, spawning authored world assets from published outputs instead of the hardcoded prototype village, and cleaning the `capy-village/public` asset structure so generated publish artifacts live under `public/assets` while curated source assets live under `assets/game_ready`.

## 3. What Changed
- Extended the layout schema and serializer with a top-level `player` block containing position and rotation.
- Added a special player preview object to the editor that uses the real normalized capy, is selectable, and supports move/rotate only with scale locked to `[1, 1, 1]`.
- Updated the editor UI so player selection shows `type: player`, hides scale editing, and disables duplicate/delete for the player preview.
- Added runtime loading for `/layouts/village_hub_v1.json` and `/assets/manifest.json`, then instantiated authored world assets from the published manifest instead of defaulting to the prototype village.
- Updated gameplay capy spawning so the runtime player uses the saved layout player transform while still being created by the normal character system.
- Preserved the old prototype village as a fallback path when published layout loading fails.
- Moved curated audio, UI images, and the remaining building source asset into `assets/game_ready`, updated asset/tool paths accordingly, and stopped tracking generated `capy-village/public/assets` and `capy-village/public/layouts` outputs in git.

## 4. Files Changed
- .gitignore
- assets/game_ready/audio/apple_bite.mp3
- assets/game_ready/audio/ding.mp3
- assets/game_ready/audio/fail1.mp3
- assets/game_ready/audio/fail2.mp3
- assets/game_ready/audio/pop1.mp3
- assets/game_ready/audio/pop2.mp3
- assets/game_ready/audio/ticking_clock.mp3
- assets/game_ready/audio/victory.mp3
- assets/game_ready/images/ui_background.png
- assets/game_ready/images/ui_frame.png
- assets/game_ready/models/buildings/capy_store.glb
- capy-village/src/capy.js
- capy-village/src/config/sounds.js
- capy-village/src/editor/LayoutEditor.js
- capy-village/src/editor/LayoutEditorUI.js
- capy-village/src/editor/LayoutSerializer.js
- capy-village/src/editor/editor.css
- capy-village/src/main.js
- capy-village/src/runtimeLayout.js
- capy-village/src/state.js
- capy-village/src/ui.js
- capy-village/src/world.js
- config/layout_schemas/village_layout.schema.json
- layouts/village_hub_v1.json
- scripts/normalize_capy_assets.sh
- tools/normalize_capy_assets.ts
- tools/publish_assets.ts
- tools/verify_capy_assets.ts

## 5. Architecture Impact
This changes the layout data model, editor behavior, runtime world-loading path, and asset publishing structure. The game now prefers published layout-driven world composition over the prototype builder, while the player remains owned by gameplay code. The asset pipeline is cleaner because curated runtime assets now live in `assets/game_ready`, and `capy-village/public/assets` plus `public/layouts` are treated as generated publish output.

## 6. Key Implementation Notes
The player is intentionally kept separate from ordinary layout objects. The editor stores the player transform in a dedicated top-level layout block, not in the `objects` array, which keeps runtime loading simpler and avoids accidentally treating the player as a duplicable/scalable prop. Runtime loading was implemented as a dedicated `runtimeLayout.js` module that resolves published manifest entries, clones GLB scenes, applies authored transforms, and only falls back to `buildVillage(scene)` if the published files cannot be loaded successfully.

The public-folder cleanup was handled by moving the curated source audio/images/building asset into `assets/game_ready`, updating code to reference `assets/...` publish paths, updating publish tooling to remove legacy root-level `public/models`, `public/audio`, and `public/images`, and removing generated `public/assets` and `public/layouts` outputs from git tracking so the repo no longer mixes curated source assets with generated publish artifacts.

## 7. Risks / Known Issues
- The editor still saves layouts by downloading a JSON file rather than writing directly back into `layouts/`.
- Browser verification still shows the harmless `favicon.ico` 404.
- The runtime layout loader currently uses broad bounding-box colliders for authored assets; there is no per-asset custom collision authoring yet.
- The editor verification confirmed player-preview UI behavior, but load-via-file was not re-automated end to end in Playwright during this task.
- The editor relies on curated `assets/game_ready` binaries being present locally; missing game-ready GLBs are now skipped from the palette instead of surfacing as broken spawn entries.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: preserved, because published runtime assets now come from curated `assets/game_ready` sources rather than ad hoc public copies
- hybrid retrieval: not affected
- verification layer: improved via runtime publish/build/browser checks plus continued capy asset verification
- generic schema: improved, because layout JSON now has a clearer separation between player transform and ordinary placed objects
- inspectability: improved via manifest-driven runtime loading and a cleaner generated-vs-source asset boundary

## 9. Testing Performed
- Ran `npm run publish-assets` successfully after the `assets/game_ready` migration.
- Ran `npm run build` in `capy-village` successfully after fixing the runtime bootstrap.
- Ran `npm run verify-capy-assets` and confirmed the published source capy still reports `height=1` and `minY=0`.
- Verified the editor in a real browser with Playwright:
- confirmed the player preview is selected on load
- confirmed the right panel shows `Type = player`
- confirmed duplicate/delete are disabled and scale controls are hidden/locked for the player preview
- confirmed palette asset clicks load the `assets/game_ready` GLBs successfully without reproducing the earlier HTML/JSON parse failure
- confirmed pointer handling now selects before transform drag, enabling immediate drag gestures on the player preview after clicking it
- confirmed changing player preview position moves the visible capy mesh itself, not just the selection box, after switching the preview clone path to a skeleton-aware clone
- Verified the runtime in a real browser with Playwright:
- confirmed requests for `/layouts/village_hub_v1.json`
- confirmed requests for `/assets/manifest.json`
- confirmed runtime loading of published building GLBs and `assets/models/characters/capy_idle.glb`
- captured a screenshot showing the authored village plus the spawned capy instead of the prototype-only scene

## 10. Example Output / Logs
```text
[Publish] Copying assets...
[Publish] Copied: apple_bite.mp3
[Publish] Copied: ui_background.png
[Publish] Copied: hut_1.glb
[Publish] Copied: mushroom_house.glb
[Publish] Copied: book_statue.glb
[Publish] Copied: capy_idle.glb
[Publish] Copying layouts...
[Publish] Copied: village_hub_v1.json
[Publish] Done.
```

```text
capy_idle height=1 minY=0 maxY=1 width=0.6963 depth=1.3243
crown height=0.1473 minY=-0.0004 maxY=0.1469 width=0.304 depth=0.3052
chef_hat height=0.2284 minY=0.0005 maxY=0.2289 width=0.3042 depth=0.3048
knit_beanie height=0.315 minY=0 maxY=0.315 width=0.3052 depth=0.3048
scarf_v2 height=0.6208 minY=-0.3297 maxY=0.2911 width=0.6808 depth=0.6164
[Verify] Capy character normalization checks passed.
```

```text
[GET] http://127.0.0.1:4173/capybara-game/layouts/village_hub_v1.json => [200] OK
[GET] http://127.0.0.1:4173/capybara-game/assets/manifest.json => [200] OK
[GET] http://127.0.0.1:4173/capybara-game/assets/models/buildings/hut_1.glb => [200] OK
[GET] http://127.0.0.1:4173/capybara-game/assets/models/buildings/mushroom_house.glb => [200] OK
[GET] http://127.0.0.1:4173/capybara-game/assets/models/buildings/book_statue.glb => [200] OK
[GET] http://127.0.0.1:4173/capybara-game/assets/models/characters/capy_idle.glb => [200] OK
```

```text
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) @ http://127.0.0.1:4173/favicon.ico:0
```

## 11. Recommended Reviewer Focus
- Review whether the runtime fallback should eventually reset/clear authored colliders explicitly if scene management becomes more dynamic.
- Inspect whether the player preview should get a clearer in-editor visual treatment beyond the current locked controls.
- Review whether generated `public/layouts` should remain fully ignored long term or whether a checked-in default published layout is still useful for onboarding.

## 12. Suggested Next Step
Add a small layout-to-runtime authoring loop improvement so the editor can publish the current layout directly into `layouts/` or trigger `npm run publish-assets` from a guided workflow, reducing the manual step between authoring and testing in the game.
