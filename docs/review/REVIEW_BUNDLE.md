# REVIEW BUNDLE

## 1. Task Summary
- Task name: Implement layout editor phase 1
- Date: 2026-03-19
- Time: Europe/Istanbul
- Branch: scene-restructure
- Commit hash: 67e0cbb
- Agent: Codex
- Status: completed

## 2. Objective
Implement the first usable Capy Village layout editor so normalized assets can be placed, selected, transformed, duplicated, deleted, saved to JSON, and reloaded without hand-editing scene code.

## 3. What Changed
- Added a dedicated `editor.html` Vite entry for the layout editor.
- Built a separate editor UI with top actions, asset palette, viewport, status bar, and selected-object properties panel.
- Implemented editor scene setup with its own camera, orbit controls, ground plane, and grid helper.
- Added registry-backed asset loading for normalized GLBs and instance spawning with unique object ids.
- Added single-selection highlighting, ground-plane dragging, numeric transform editing, duplication, deletion, snap toggle, and grid toggle.
- Added layout serialization/parsing, validation helpers, a JSON schema, and an initial `village_hub_v1.json` layout file.
- Configured Vite to build both the gameplay app and the editor page.

## 4. Files Changed
- .gitignore
- capy-village/vite.config.js
- capy-village/editor.html
- capy-village/src/editor-main.js
- capy-village/src/editor/AssetPalette.js
- capy-village/src/editor/LayoutEditor.js
- capy-village/src/editor/LayoutEditorUI.js
- capy-village/src/editor/LayoutSerializer.js
- capy-village/src/editor/SelectionController.js
- capy-village/src/editor/TransformController.js
- capy-village/src/editor/assetRegistry.js
- capy-village/src/editor/editor.css
- config/layout_schemas/village_layout.schema.json
- layouts/village_hub_v1.json

## 5. Architecture Impact
This adds a new editor-facing app surface alongside the gameplay entry point. It introduces a layout authoring workflow built on top of the asset normalization pipeline and establishes a schema-backed JSON layout format that future world-loading code can consume.

## 6. Key Implementation Notes
The editor is intentionally isolated from the gameplay camera and world code. Normalized assets are resolved from the root asset registry and bundled into the editor build. The current interaction model favors reliability over advanced gizmos: orbit camera plus direct ground-plane dragging, with numeric transform editing in the side panel for precise control.

## 7. Risks / Known Issues
- Browser verification covered spawn, selection, numeric editing, duplication, and save; loading from a user-picked JSON file is implemented but was not exercised end-to-end in Playwright this round.
- A harmless `favicon.ico` 404 appears in browser console on the editor page.
- Three.js logs a warning about multiple instances being imported in dev mode; the editor still loads and behaves correctly, but that is worth revisiting if it starts causing addon issues.
- The editor currently downloads layout JSON to the browser rather than writing directly back into the repo.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: not applicable to this task
- hybrid retrieval: not affected
- verification layer: not affected
- generic schema: improved via the new village layout schema
- inspectability: preserved via explicit JSON serialization, readable transform fields, and registry-driven assets

## 9. Testing Performed
- Ran `npm run build` in `capy-village` successfully after adding the editor entry point.
- Verified the production build emits both `dist/index.html` and `dist/editor.html`.
- Launched the editor in a real browser with Playwright against the local Vite server.
- In-browser flow verified:
  - spawn `hut_1`
  - automatic selection and property panel population
  - numeric rotation edit
  - numeric scale edit
  - duplicate selected object
  - save layout and inspect downloaded JSON output

## 10. Example Output / Logs
```text
dist/index.html
dist/editor.html
dist/assets/editor-D58TBJRi.js
dist/assets/hut_1-Cw3vMzkg.glb
dist/assets/book_statue-D0qXl9AV.glb
dist/assets/mushroom_house-DgfpGVTv.glb
```

```json
{
  "layoutName": "village_hub_v1",
  "objects": [
    {
      "id": "obj_001",
      "assetId": "hut_1",
      "position": [-1, 0, 0],
      "rotation": [0, 30, 0],
      "scale": [2.5, 1, 1]
    },
    {
      "id": "obj_002",
      "assetId": "hut_1",
      "position": [-0.25, 0, 0.75],
      "rotation": [0, 30, 0],
      "scale": [2.5, 1, 1]
    }
  ]
}
```

## 11. Recommended Reviewer Focus
- Review whether bundling normalized GLBs from the root `assets/normalized_assets/` directory is the right long-term path for editor/runtime parity.
- Check the transform-editing UX, especially whether phase 1 should keep non-uniform scale fully open or add a uniform-scale toggle soon.
- Review the new layout JSON contract for any fields that should be reserved now for future world-loading or occupancy phases.

## 12. Suggested Next Step
Use the new editor to author the first meaningful village hub layout JSON, then teach the runtime world builder to load that layout instead of relying on hardcoded placeholder placement.
