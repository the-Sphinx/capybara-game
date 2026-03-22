# Capy Village — Task: Player Preview in Editor + Runtime Layout Loading

## Goal

Implement the missing bridge between:

- the **layout editor**
- the **saved custom layout JSON**
- the **actual game runtime**

This task adds:

1. a **special player preview / player spawn object** in the layout editor
2. **locked player scaling** in the editor
3. runtime loading of the published layout and published asset manifest
4. spawning the real gameplay player using the saved player spawn transform
5. spawning world assets from the saved layout instead of using the old hardcoded prototype village

This task should preserve the existing project direction:

- normalized assets are canonical size `1`
- world assets use **per-instance scaling**
- player scale is **locked**
- accessories remain attached through the normal gameplay character system

---

# Important Design Rules

## 1. Player is special
The player must NOT be treated like a normal placeable prop.

The player entry in the layout exists for:
- composition
- scale reference
- starting position
- starting rotation

The player is **not** a normal world asset.

## 2. Player scale must be locked
In the editor:
- player may be moved
- player may be rotated
- player must NOT be scalable
- player must NOT be duplicated
- player should ideally not be deletable

## 3. Runtime player still comes from gameplay code
The actual playable capy should still be created by the gameplay character system.

The layout only provides:
- player start position
- player start rotation

---

# Part 1 — Layout Format Extension

Extend the layout format to support a special player entry.

## Preferred Structure

Add a top-level `player` block to the layout JSON.

Example:

```json
{
  "layoutName": "village_hub_v1",
  "player": {
    "position": [0, 0, 2],
    "rotation": [0, 180, 0]
  },
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

## Why top-level player is preferred
This keeps the player separate from ordinary placeable objects and makes runtime logic cleaner.

---

# Part 2 — Editor Support for Player Preview

## Goal
The editor should show a player preview object so village composition can be designed around the real capy size.

## Requirements

### 1. Spawn player preview automatically
When a new layout is created:
- automatically include a player preview at a default position near the center

When an existing layout is loaded:
- restore the player preview from `layout.player`

### 2. Player preview visual
Use the canonical capy asset if available.
If not yet available, a simple temporary placeholder is acceptable until the real capy base is ready.

The long-term goal is to display the **real normalized capy at scale 1**.

### 3. Locked scale
The player preview must always stay at:

```text
scale = [1, 1, 1]
```

The right panel should either:
- hide scale inputs for player preview
- or display them as read-only

### 4. Limited editing
Allowed:
- move player preview
- rotate player preview

Not allowed:
- scale
- duplicate
- delete

### 5. Selection behavior
Player preview should still be selectable so the user can move or rotate it.

---

# Part 3 — Editor UI Rules for Player Preview

When the player preview is selected:

## Right panel should show:
- type: `player`
- position x/y/z
- rotation x/y/z

## Right panel should NOT allow:
- editing scale

## Optional UI note
A small label such as:

```text
Player Preview (Scale Locked)
```

would be helpful.

---

# Part 4 — Save / Load Behavior

## Save
When saving a layout:
- save `layout.player.position`
- save `layout.player.rotation`
- save all world objects normally

## Load
When loading a layout:
- restore player preview transform
- restore world objects

---

# Part 5 — Runtime Layout Loader

## Goal
Make the actual game runtime load the published layout instead of building the village from hardcoded placeholder geometry.

## Required Runtime Inputs

Runtime must load from published files only:

- `/layouts/village_hub_v1.json`
- `/assets/manifest.json`

Do NOT load from:
- pipeline folders
- editor source folders
- raw assets

---

# Part 6 — Runtime Asset Manifest Usage

Use the published asset manifest to map `assetId` to runtime asset path.

Example manifest:

```json
{
  "book_statue": "/assets/models/center/book_statue.glb",
  "hut_1": "/assets/models/buildings/hut_1.glb"
}
```

For each world object in the layout:
1. resolve `assetId` using the manifest
2. load the GLB
3. instantiate it in the scene
4. apply saved position / rotation / scale

---

# Part 7 — Runtime Player Spawn

## Goal
Use the saved layout player transform to place the real player character.

## Behavior
At runtime:
1. initialize gameplay scene
2. load layout JSON
3. read `layout.player.position`
4. read `layout.player.rotation`
5. create the actual playable capy through the normal character system
6. place the real player at the saved transform

## Important
Do NOT spawn the player from the layout object list.
The player should still come from gameplay code.

---

# Part 8 — Fallback Behavior

Do not remove the old prototype village path immediately.

Instead use this logic:

```text
if published layout + manifest load successfully:
    build world from layout
else:
    fall back to old hardcoded prototype world
```

This makes the transition safer during development.

---

# Part 9 — Initial Scene Loading

Add a simple boot rule for now:

Runtime should try to load:

```text
/layouts/village_hub_v1.json
```

You do NOT need to build a full scene management system yet.

Just make the game load this layout as the first hub scene.

Later this can become configurable.

---

# Part 10 — World Assets vs Player

## World assets from layout
Spawn from layout + manifest:
- buildings
- statue
- trees
- props
- decorations

## Player from gameplay code
Spawn separately:
- player capy
- accessories
- movement controller
- interaction logic

This separation is intentional and should be preserved.

---

# Part 11 — Success Criteria

This task is successful if all of the following work:

## In the editor
- player preview appears in layout
- player preview can be moved
- player preview can be rotated
- player preview scale is locked
- player preview is saved/loaded with the layout

## In the game runtime
- game loads `/layouts/village_hub_v1.json`
- game loads `/assets/manifest.json`
- world assets spawn from the layout
- real player spawns at the saved player position/rotation
- old hardcoded world is no longer the primary path
- fallback still exists if runtime layout loading fails

---

# Part 12 — Testing Checklist

## Editor test
1. open editor
2. confirm player preview exists
3. move player preview
4. rotate player preview
5. confirm scaling is disabled
6. save layout
7. reload layout
8. confirm player transform persists

## Runtime test
1. run publish step
2. run game
3. confirm published world assets appear
4. confirm player starts at saved layout position
5. confirm player accessories still behave normally
6. confirm no hardcoded prototype village appears if layout loading succeeds

---

# Notes

- Keep implementation focused
- Do NOT build a full scene manager yet
- Do NOT merge player into the normal asset placement system
- Do NOT add player scaling in the editor
- This task is about making the editor-authored village actually appear in the game, while preserving the character system

---

# End of Task
