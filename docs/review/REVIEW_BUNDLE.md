# REVIEW BUNDLE

## 1. Task Summary
- Task name: Implement publish pipeline and .gitignore fix
- Date: 2026-03-19
- Time: 16:52 +03
- Branch: scene-restructure
- Commit hash: 11eb014
- Agent: Codex
- Status: completed

## 2. Objective
Create a simple publish bridge that copies curated runtime assets and layouts into `capy-village/public`, generates a manifest for runtime asset lookup, and narrows `.gitignore` so the asset folder structure can live in the repo without committing heavy binaries.

## 3. What Changed
- Added `tools/publish_assets.ts`.
- Added root npm command `npm run publish-assets`.
- Implemented recursive publish from `assets/game_ready/**` to `capy-village/public/assets/`.
- Implemented recursive publish from `layouts/**` to `capy-village/public/layouts/`.
- Added target-folder cleanup before publish.
- Added generated `capy-village/public/assets/manifest.json` with `.glb` asset ids and public paths.
- Reworked `.gitignore` to ignore heavy asset binaries while keeping directory structure and metadata visible.
- Updated the GitHub Pages workflow to run the publish step before building `capy-village`.

## 4. Files Changed
- .gitignore
- package.json
- tools/publish_assets.ts
- .github/workflows/verify.yml

## 5. Architecture Impact
This adds a lightweight publish stage between curated game-ready assets and the runtime app. The game build can now depend on generated `public/assets` and `public/layouts` rather than directly coupling runtime loading to source or pipeline asset locations.

## 6. Key Implementation Notes
The publish script keeps the implementation intentionally simple: clear target directories, recursively copy files, and generate a flat GLB manifest keyed by filename stem. The workflow runs from the repo root and does not introduce any new package dependencies or bundler plugins.

## 7. Risks / Known Issues
- `manifest.json` currently keys assets by filename only, so duplicate `.glb` filenames in different subfolders would collide.
- Generated `capy-village/public/assets/` and `capy-village/public/layouts/` outputs are not committed by this task; they are produced locally and in CI by running `npm run publish-assets`.
- Existing runtime code still has older public model paths for unrelated character/accessory content; this task only adds the publish bridge and does not refactor all loaders.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: not applicable to this task
- hybrid retrieval: not affected
- verification layer: not affected
- generic schema: preserved
- inspectability: improved through the published manifest and explicit runtime asset boundary

## 9. Testing Performed
- Ran `npm run publish-assets` from the repo root.
- Verified published outputs exist in `capy-village/public/assets` and `capy-village/public/layouts`.
- Verified `capy-village/public/assets/manifest.json` contains the expected runtime paths.
- Ran `npm run build` in `capy-village` after publish and confirmed the app still builds successfully.

## 10. Example Output / Logs
```text
[Publish] Copying assets...
[Publish] Copied: book_statue.glb
[Publish] Copied: hut_1.glb
[Publish] Copied: mushroom_house.glb
[Publish] Copying layouts...
[Publish] Copied: village_hub_v1.json
[Publish] Done.
```

```json
{
  "book_statue": "/assets/models/book_statue.glb",
  "hut_1": "/assets/models/hut_1.glb",
  "mushroom_house": "/assets/models/mushroom_house.glb"
}
```

## 11. Recommended Reviewer Focus
- Check whether manifest keying by basename is sufficient or should be replaced with category-aware ids.
- Review whether generated public publish outputs should stay untracked or be ignored explicitly to avoid noisy working trees.
- Confirm the GitHub Pages workflow ordering matches the intended deployment model.

## 12. Suggested Next Step
Refactor the runtime/world loader to consume published layout and asset manifest data directly from `public/assets` and `public/layouts`.
