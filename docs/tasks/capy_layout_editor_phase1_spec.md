# Capy Village — Feature 2 Implementation
## Layout Editor (Phase 1: Minimal Useful Editor)

This document specifies the first implementation of the **Layout Editor** for Capy Village.

The goal is to let the user place normalized assets into a village layout quickly and safely, without depending on code edits for every scene composition change.

This is **Phase 1** only.
Do **not** implement the full honeycomb / occupancy system yet.

Start with a minimal but highly usable editor.

---

# Goal of Phase 1

The editor must allow the user to:

- load available assets from the asset registry
- see an empty scene or current saved layout
- place assets into the world
- select placed assets
- move them on the ground plane
- rotate them
- scale them per instance
- duplicate them
- delete them
- save the layout to JSON
- load an existing layout JSON

This editor is meant to support **manual village composition**.

---

# Important Scope Rule

Do NOT implement yet:

- hex / honeycomb grid
- automatic footprint occupancy marking
- overlap prevention logic
- terrain sculpting
- navmesh generation
- complex multi-user editing

Those can come later.

For now, build the smallest editor that is actually useful.

---

# Folder / File Expectations

Suggested additions:

```text
config/
    asset_registry.json
    layout_schemas/
        village_layout.schema.json

layouts/
    village_hub_v1.json

src/editor/
    LayoutEditor.ts
    LayoutEditorUI.ts
    AssetPalette.ts
    SelectionController.ts
    TransformController.ts
    LayoutSerializer.ts
```

Exact file names may vary, but the responsibilities should exist.

---

# Core Inputs

## 1. Asset Registry
Use the existing asset registry as the source of available placeable assets.

Expected minimum fields:

```json
{
  "assets": [
    {
      "id": "book_statue",
      "source": "assets/raw_assets/book_statue.glb",
      "output": "assets/normalized_assets/book_statue.glb",
      "class": "centerpiece"
    }
  ]
}
```

The editor should read from the **normalized asset path** when spawning.

In the current repo workflow, the editor should load only manually curated assets from:

```text
assets/game_ready/models/
```

For now, it should ignore assets under:

```text
assets/game_ready/models/characters/
assets/game_ready/models/accessories/
```

---

## 2. Layout JSON
The layout file is the saved scene composition.

Example structure:

```json
{
  "layoutName": "village_hub_v1",
  "objects": [
    {
      "id": "obj_001",
      "assetId": "book_statue",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [2.5, 2.5, 2.5]
    }
  ]
}
```

Use Euler rotation in degrees for readability.

---

# Editor UI Requirements

## Overall Layout

The editor should have:

### Left side panel
Asset palette

### Main center view
3D world / editor viewport

### Right side panel
Selected object properties

### Top bar
Basic editor actions

Recommended controls:

- Load Layout
- Save Layout
- New Layout
- Duplicate Selected
- Delete Selected
- Snap toggle
- Grid toggle

---

# Left Panel — Asset Palette

The asset palette must:

- list all assets from the registry
- show at least asset id and class
- allow click-to-spawn
- optionally support search/filter later

Minimum display per asset:

- asset id
- asset class

When the user clicks an asset in the palette:
- spawn one instance into the scene
- place it near the center or in front of the camera
- automatically select it

---

# Main Viewport Behavior

The main viewport should support:

- orbit / pan / zoom editor camera
- visible ground plane
- optional visible grid
- click to select placed objects
- drag selected object on the ground plane

Do not reuse the gameplay camera for the editor.
Use a separate **editor camera**.

---

# Editor Camera

The editor camera should support:

- orbit around target
- zoom in/out
- pan
- reset view

This is not the gameplay camera.
This is a level editing camera.

Suggested defaults:

- angled 3/4 view
- moderate zoom
- smooth but responsive movement

---

# Ground Plane

The editor must contain a visible ground plane.

Requirements:

- large enough for layout prototyping
- neutral color
- optional visible grid overlay
- all placement snaps or drags should happen relative to this plane

Selected object movement should keep the object base at `Y = 0` unless explicitly changed later.

---

# Object Placement Rules

When a new asset is spawned:

1. Load normalized GLB
2. Create scene instance
3. Set default position near center
4. Set default rotation `[0, 0, 0]`
5. Set default scale `[1, 1, 1]`
6. Select it immediately

The object must appear sitting correctly on the ground if normalization worked.

---

# Selection Rules

The editor must support selecting one object at a time.

On selection:

- highlight the object visually
- populate the right panel with editable properties

Recommended visual selection methods:

- bounding box outline
- glow outline
- wireframe highlight

At least one of these must exist.

---

# Right Panel — Selected Object Properties

The right panel must display and allow editing of:

- object id
- asset id
- position x/y/z
- rotation x/y/z
- scale x/y/z

Minimum editing requirements:

- numeric inputs for all transform values
- instant update in viewport

Recommended convenience buttons:

- reset rotation
- reset scale to 1
- move to ground (Y = 0)

---

# Transform Controls

The editor must support at least these operations:

## Move
- drag selected object on ground plane
- numeric editing in right panel

## Rotate
- numeric editing at minimum
- optional rotation gizmo if easy

## Scale
- numeric editing
- uniform scale button / toggle preferred

For Phase 1, numeric transform editing is enough even if gizmos are basic.

---

# Duplicate and Delete

## Duplicate
When duplicate is pressed:
- create a new object with same assetId and transform
- offset slightly in X or Z so it is visible
- assign new unique object id
- select the duplicate

## Delete
When delete is pressed:
- remove selected object from scene
- remove it from layout data

---

# Snap Mode

Implement a simple snap mode toggle.

Phase 1 snap behavior:
- position snap to a square grid
- default grid size: `0.5`
- allow changing later

If snap is OFF:
- free movement

If snap is ON:
- movement rounds X/Z to nearest grid step

Do not implement hex snap yet.

---

# Save / Load

## Save Layout
Saving must produce a JSON file that contains:

- layoutName
- object list
- for each object:
  - id
  - assetId
  - position
  - rotation
  - scale

Example:

```json
{
  "layoutName": "village_hub_v1",
  "objects": [
    {
      "id": "obj_001",
      "assetId": "book_statue",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [2.5, 2.5, 2.5]
    },
    {
      "id": "obj_002",
      "assetId": "hut_1",
      "position": [-5, 0, 3],
      "rotation": [0, 30, 0],
      "scale": [2.2, 2.2, 2.2]
    }
  ]
}
```

## Load Layout
Loading must:
- clear current scene objects (after confirmation if useful)
- instantiate every object from the JSON
- restore transforms exactly

---

# Unique Object IDs

Each placed object needs its own instance id.

Examples:

- `obj_001`
- `obj_002`

This is separate from `assetId`.

The same asset can appear many times with different object ids.

---

# Layout Schema

Create a simple JSON schema for validation.

Suggested required fields:

- `layoutName`
- `objects[]`
- `objects[].id`
- `objects[].assetId`
- `objects[].position`
- `objects[].rotation`
- `objects[].scale`

---

# Recommended Initial Workflow

The finished Phase 1 editor should let the user do this:

1. Open editor
2. Load empty layout
3. Spawn `book_statue`
4. Scale it up
5. Spawn `hut_1`
6. Move hut to left side of statue
7. Rotate hut slightly
8. Spawn second hut
9. Save as `village_hub_v1.json`

If this works smoothly, Phase 1 is successful.

---

# Data Rules

## Asset transforms
Use normalized assets as source.
The editor should never modify original GLBs.

## Instance transforms
All artistic variation happens per placed object:
- one tree can be `1.8`
- another can be `2.2`
- one hut can be `2.4`
- another can be `2.9`

This is intentional and should be supported.

---

# Error Handling

The editor must warn clearly if:

- asset registry cannot be loaded
- normalized asset path missing
- layout JSON malformed
- assetId in layout does not exist in registry

Do not crash silently.

---

# Out of Scope for Phase 1

Do not implement yet:

- automatic footprint occupancy
- terrain-aware placement
- path drawing tool
- prefab groups
- undo/redo history (nice to have later)
- random scattering tools
- hex layout mode

---

# Success Criteria

Feature 2 Phase 1 is successful if:

- user can place normalized assets visually
- user can move, rotate, and scale them
- user can save and reload the layout
- the editor is stable enough to compose the village hub manually

This is enough to begin building the new village scene intentionally.

---

# Suggested Next Phases (Not Now)

## Phase 2
- occupancy / footprint preview
- overlap helpers
- better gizmos
- multi-select
- lock object toggle

## Phase 3
- hex mode if still desired
- asset thumbnails
- group placement
- path authoring
- NPC route markers
