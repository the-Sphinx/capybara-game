# REVIEW BUNDLE

## 1. Task Summary
- Task name: Class-based footprint editing with shared export
- Date: 2026-03-23
- Time: 15:12 +03
- Branch: scene-restructure
- Commit hash: pending
- Agent: Codex
- Status: completed

## 2. Objective
Move footprint tuning to a class-based shared model so layout JSON stays transform-only, the editor can tune asset footprints visually, and the resulting shared footprint registry can be exported as JSON for manual replacement in the repo.

## 3. What Changed
- Added a top-toolbar `Footprints: On/Off` toggle to the layout editor, defaulting to off.
- Added a top-toolbar `Save Footprints` action that downloads the current shared footprint registry as `collider_footprints.json`.
- Kept the dedicated `Update Footprint` editor flow for selected non-player world objects.
- Kept semi-transparent footprint overlays with darker blue borders, and made footprint-edit mode show the selected asset-class footprint even when the global overlay toggle is off.
- Switched footprint storage to a shared JSON file at `config/collider_footprints.json`.
- Reworked the shared footprint module so editor and runtime both read the same asset-class footprint registry.
- Removed object-level footprint persistence from layout save/load/schema so layout JSON remains placement-only.

## 4. Files Changed
- config/collider_footprints.json
- capy-village/src/footprints.js
- capy-village/src/runtimeLayout.js
- capy-village/src/editor/LayoutEditor.js
- capy-village/src/editor/LayoutEditorUI.js
- capy-village/src/editor/LayoutSerializer.js
- capy-village/src/editor/editor.css
- config/layout_schemas/village_layout.schema.json

## 5. Architecture Impact
This keeps the current editor/runtime architecture intact but changes the persistence model. Footprints are now asset-class data owned by a shared JSON file, not object-instance data owned by layouts. The editor and runtime both consume the same registry, and the editor’s save path now exports that registry explicitly instead of hiding footprint changes inside layout files.

## 6. Key Implementation Notes
The new shared footprint layer in `capy-village/src/footprints.js` now provides:

```text
- shared per-asset footprint registry creation from JSON
- footprint normalization
- registry serialization for export
- shared footprint lookup by assetId
- collider computation from a scene root
```

The editor still supports two property-panel modes:
- main transform/object mode
- footprint editing mode

The top toolbar now exposes:

```text
- Footprints: On/Off
- Save Footprints
```

When footprint overlays are visible:
- circle footprints render as filled discs plus a line loop
- rect footprints render as filled rotated planes plus a border loop

The shared footprint JSON now uses asset ids as keys:

```json
{
  "hut_1": {
    "type": "circle",
    "radius": 1.72,
    "offsetX": 0,
    "offsetZ": 0,
    "rotationOffset": 0
  },
  "hat_stand": {
    "type": "rect",
    "width": 1.7,
    "depth": 1.1,
    "offsetX": 0,
    "offsetZ": 0,
    "rotationOffset": 0
  }
}
```

## 7. Risks / Known Issues
- This pass was verified through publish/build and code-path inspection, but I intentionally did not open another browser session because of the recent Playwright/Chrome orphan-window issue.
- The footprint editor currently operates on world objects only; player preview remains excluded by design.
- `Save Footprints` downloads the updated shared JSON; the checked-in repo file still needs to be replaced manually because the browser editor should not write directly into the workspace.
- Adding the shared footprint module introduced a separate build chunk; this is acceptable for now but could be revisited if bundle shaping becomes a priority.

## 8. Alignment Check Against MASTER_BRIEF
- source grounding: improved because visual tuning now matches runtime collision logic directly
- hybrid retrieval: unchanged
- verification layer: improved through shared editor/runtime footprint computation
- generic schema: simplified again so layouts remain transform-only
- inspectability: significantly improved because footprint shapes are now visible and editable in-editor

## 9. Testing Performed
- Ran `npm run publish-assets` successfully from repo root.
- Ran `npm run build` successfully in `capy-village`.
- Reviewed the editor save/load path to confirm footprint data is no longer serialized into layout JSON.
- Reviewed the runtime path to confirm collider generation now reads the shared asset-class footprint registry only.
- Reviewed the export path to confirm `Save Footprints` downloads `collider_footprints.json`.

## 10. Example Output / Logs
```text
Toolbar toggle:
- Footprints: Off
- Footprints: On
```

```text
Editor footprint fields:
- type
- radius
- width
- depth
- offsetX
- offsetZ
- rotationOffset
```

## 11. Recommended Reviewer Focus
- Turn on footprint overlays and confirm the shapes line up visually with `hut_1`, `mushroom_house`, `hat_stand`, and `melon_stand_2`.
- Open `Update Footprint` on one instance of a repeated asset and confirm edits update all instances of that asset type immediately.
- Export `collider_footprints.json`, replace the checked-in file with it, refresh, and confirm the shared footprint remains consistent.
- Verify `rotationOffset` feels intuitive for stands and other rotated rect objects.

## 12. Suggested Next Step
If footprint tuning becomes a regular workflow, the next good follow-up would be adding a file-import button so the editor can reload an updated `collider_footprints.json` without a full refresh.
