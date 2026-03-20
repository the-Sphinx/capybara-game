# Asset To Game Workflow

This document describes the current end-to-end flow for taking a GLB from source selection to seeing it in the game.

## 1. Choose A Candidate Asset

Pick a GLB from your source collection under `assets/source/` that you want to test in the pipeline.

## 2. Put The Raw GLB Into The Pipeline Input Folder

Copy the candidate GLB into:

```text
assets/pipeline/models/raw/
```

The normalization command now scans this folder automatically and processes every `.glb` file it finds there.

## 3. Run Normalization

From the repo root, run:

```bash
npm run normalize-assets
```

This will:
- import each raw GLB through Blender
- preserve embedded textures/materials
- normalize to unit height
- ground-align the asset
- write the result into:

```text
assets/pipeline/models/normalized/
```

You can also normalize a single raw file by basename:

```bash
npm run normalize-assets tree_1
```

## 4. Review The Normalized Output

Inspect the corresponding file in:

```text
assets/pipeline/models/normalized/
```

Confirm that:
- the mesh still looks correct
- materials/textures are preserved
- the scale and grounding look reasonable

If you are done with a raw test asset, you can remove it from `assets/pipeline/models/raw/`.

## 5. Promote Approved Assets Into Game-Ready

Manually copy or move the normalized asset you want to keep into the curated game-ready folder:

```text
assets/game_ready/models/
```

Use the appropriate category folder, for example:
- `assets/game_ready/models/buildings/`
- `assets/game_ready/models/props/`
- `assets/game_ready/models/characters/`
- `assets/game_ready/models/accessories/`

Only assets placed under `assets/game_ready/` are considered final curated assets for the game/editor pipeline.

There is currently no separate asset registry file to maintain for this step.
The editor auto-discovers eligible assets directly from `assets/game_ready/models/`.

## 6. Publish Curated Assets And Layouts

From the repo root, run:

```bash
npm run publish-assets
```

This copies:
- `assets/game_ready/**` into `capy-village/public/assets/**`
- `layouts/**` into `capy-village/public/layouts/**`

The game runtime reads from the published `public` folders, not directly from `assets/game_ready` or `layouts`.

## 7. Open The Layout Editor

Start the app:

```bash
cd capy-village
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/capybara-game/editor.html
```

The editor asset palette reads curated assets from `assets/game_ready/models/`.

For now, the editor ignores:
- `characters/`
- `accessories/`

## 8. Place The Asset In The Layout

In the editor:
- spawn the asset from the palette
- move/rotate/scale it
- adjust the player position if needed
- save the layout JSON

The intended source-of-truth layout file is:

```text
layouts/village_hub_v1.json
```

If the editor downloads a JSON file through the browser, replace the source layout file with that downloaded content.

## 9. Publish Again After Layout Changes

If you changed the source layout in `layouts/`, publish again:

```bash
cd /Users/gorkem/workspace/gorkem/capybara-game
npm run publish-assets
```

This step is required so the runtime gets the latest layout under:

```text
capy-village/public/layouts/
```

If you edit the file directly in `capy-village/public/layouts/`, you can skip publishing, but that is not the preferred source-of-truth workflow.

## 10. Run The Game

Open:

```text
http://127.0.0.1:5173/capybara-game/
```

Refresh the page after publishing.

At that point you should see:
- the newly promoted asset in the world
- the latest published layout
- the latest published player spawn position

## Summary

The current recommended flow is:

1. source GLB
2. `assets/pipeline/models/raw/`
3. `npm run normalize-assets`
4. `assets/pipeline/models/normalized/`
5. manually promote selected assets into `assets/game_ready/models/`
6. `npm run publish-assets`
7. place assets in the editor
8. save to `layouts/village_hub_v1.json`
9. `npm run publish-assets`
10. open the game and verify
