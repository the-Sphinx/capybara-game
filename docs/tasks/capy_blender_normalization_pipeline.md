# Capy Village — Task: Blender-Based Normalization Pipeline (Texture-Safe)

## Goal

Replace the current Node-based normalization pipeline (which strips materials/textures) with a **Blender-backed normalization pipeline** that:

- preserves ALL embedded textures and materials
- correctly applies:
  - pivot alignment
  - ground alignment
  - uniform scaling (target height = 1)
- outputs GLB files fully compatible with runtime

This is a **critical pipeline fix**. After this task, assets should retain their original stylized look in-game.

---

# 🚨 Critical Rule

DO NOT:
- recreate materials manually
- override materials in runtime
- strip textures
- convert materials to flat colors

We must **preserve original GLB materials exactly as authored**.

---

# Part 1 — Replace Normalization Backend

## Current Problem

`tools/normalize_assets.ts`:
- loads GLB
- loses embedded textures
- exports material-less GLB

## Required Change

Replace this flow:

```text
Node GLTF loader → transform → GLTFExporter
```

WITH:

```text
Blender (headless) → import GLB → transform → export GLB
```

---

# Part 2 — Blender Normalization Script

Use the existing script as base:

```text
scripts/blender_normalize_glb.py
```

## Required Behavior

### 1. Import GLB
- load full scene
- preserve:
  - materials
  - textures
  - UVs

---

### 2. Apply transforms

For the main object(s):

#### a. Apply scale and rotation
```python
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
```

#### b. Compute bounding box
- calculate min/max Z
- calculate total height

#### c. Normalize height
- scale uniformly so height = target (1.0)

#### d. Ground alignment
- shift object so lowest Z = 0

#### e. Center pivot (optional but recommended)
- center X/Y around origin

---

### 3. DO NOT TOUCH MATERIALS

Absolutely do NOT:
- remove nodes
- convert shaders
- strip textures
- reassign materials

---

### 4. Export GLB

Use:

```python
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_apply=True,
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
    export_colors=True,
)
```

Ensure:
- textures remain embedded
- materials preserved

---

# Part 3 — Integrate Into Pipeline

## Update normalization script

Modify:

```text
tools/normalize_assets.ts
```

### New behavior:

For each asset in `raw`:

1. call Blender via CLI:

```bash
Blender --background --python blender_normalize_glb.py --     --input <raw.glb>     --output <normalized.glb>     --target-height 1
```

2. replace Node-based normalization completely

---

# Part 4 — Regenerate Assets

Re-run normalization for:

- huts
- statue
- any textured assets

Then:

```text
normalized → game_ready → publish
```

---

# Part 5 — Verification (MANDATORY)

## 1. GLB inspection

Check normalized GLB:

- contains textures
- contains materials
- file size significantly larger than stripped version

Expected:
```text
normalized ≫ old normalized size
```

---

## 2. Runtime verification

Run the game and confirm:

### REQUIRED

- hut has:
  - colored roof
  - colored door
  - visible shading
- statue shows detail (not flat brown)
- NO black/gray fallback look

---

# Part 6 — Debug Output

Print during normalization:

```text
[Normalize] hut_1.glb
input textures: 3
output textures: 3
status: OK
```

If textures drop:

```text
status: ERROR — TEXTURES LOST
```

---

# Part 7 — Acceptance Criteria

This task is successful if:

✔ normalized GLBs retain textures  
✔ runtime shows colored/stylized assets  
✔ no black or gray placeholder materials  
✔ file sizes reflect embedded textures  
✔ pipeline works end-to-end  

---

# Part 8 — DO NOT DO

- Do NOT optimize textures yet
- Do NOT compress GLBs
- Do NOT reduce file size
- Do NOT redesign materials

Optimization comes later.

---

# Part 9 — Next Step (after this task)

Once this is done:

→ Lighting polish  
→ Camera framing  
→ Ground styling  

---

# End of Task
