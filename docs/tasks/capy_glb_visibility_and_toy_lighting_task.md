# Capy Village — Task: Imported GLB Material Visibility + Toy Lighting Baseline

## Goal

Fix the current runtime issue where imported GLB world assets appear **black / unreadable**, and establish a clean **toy-village baseline lighting setup** so the village can be judged visually.

This task is about **rendering correctness first**, not final art polish.

After this task:
- imported huts/statues/props must be visibly readable
- local colors/materials must show up
- the village must no longer look like black silhouettes
- the scene must have a basic warm readable toy-like lighting baseline

---

# Important Scope Rule

Do NOT change:
- layout JSON structure
- object transforms
- asset placement logic
- player spawn logic
- editor functionality
- gameplay systems

Only work on:
- runtime GLB material handling
- renderer settings related to color/material visibility
- basic runtime world lighting
- optional safe fallback material handling for broken GLBs

---

# Part 1 — Diagnose Imported GLB Material State

When loading runtime assets from layout + manifest, inspect each imported GLB scene.

For each mesh, log or verify:

- mesh name
- material type
- material color
- whether `vertexColors` are used
- whether normals exist
- whether geometry bounding box is valid

The purpose is to determine why imported models are rendering black.

---

# Part 2 — Runtime Material Visibility Fix

The runtime loader must make imported GLB assets visibly renderable.

## Requirements

### 1. Preserve GLB materials if valid
If the imported GLB already has a valid readable material, keep it.

Do NOT replace materials unnecessarily.

### 2. Respect vertex colors if present
If the mesh uses vertex colors, ensure the runtime material supports them.

Typical cases:
- `material.vertexColors = true`
- preserve base color if present

### 3. Ensure normals are valid
If imported geometry has missing or broken normals:
- compute vertex normals as a fallback

This should only be applied when needed.

### 4. Safe fallback material for black/unreadable meshes
If a mesh loads with a missing or unusable material and appears black, assign a temporary readable fallback material.

Fallback material requirements:
- matte
- warm neutral clay/wood tone
- not shiny
- readable under soft light

Suggested fallback base color:
- `#B89A74` or similarly warm beige-brown

The fallback is only for meshes that are otherwise unreadable.
Do NOT override good materials.

### 5. Double-sided only if needed
If some geometry appears invisible because of backface issues, use double-sided material only where required.
Do NOT globally force everything to double-sided unless necessary.

---

# Part 3 — Renderer Color / Tone Setup

Check runtime renderer settings.

## Required
- ensure output color space is correct for modern Three.js
- use a sane tone mapping mode
- exposure must not crush the scene into darkness

Suggested baseline:
- output color space: sRGB
- tone mapping: ACESFilmic or neutral filmic equivalent
- exposure around `1.0`

Do NOT add strong color grading yet.

---

# Part 4 — Runtime Lighting Baseline

Add a simple but effective runtime world lighting setup.

## 1. Directional light (sun)
Use one main directional light.

Suggested values:
- color: warm off-white
- approximate color: `#FFF4E0`
- intensity: `1.0`
- angle: side-lit, not top-down

The goal is readable form and warmth.

## 2. Hemisphere or ambient fill
Add soft fill light so stylized assets do not fall into black shadow.

Suggested:
- sky color: `#CDE1FF`
- ground color: `#EBE1CD`
- intensity: `0.4–0.5`

This is important for toy-like readability.

## 3. Background / clear color
Replace black or harsh background with a soft sky-like color.

Suggested:
- `#D6E8FF`

---

# Part 5 — Runtime Material Sanity Check

After implementing the fixes, the following must be true in the runtime game scene:

- imported huts are visibly readable
- center statue is visibly readable
- materials are no longer solid black
- the capy is still visible and not washed out
- local color differences are visible
- the village can now be judged visually for composition

This task does NOT need to achieve the final reference style yet.
It only needs to restore readable stylized rendering.

---

# Part 6 — Debug Output

Temporarily print useful diagnostics for imported meshes.

Example:

```text
[Runtime Asset] hut_01
mesh: Roof
material: MeshStandardMaterial
vertexColors: true
normals: present
fallbackApplied: false
```

If fallback is applied:

```text
[Runtime Asset] book_statue
mesh: Base
materialMissing: true
fallbackApplied: true
```

This will help verify what is happening.

---

# Part 7 — Acceptance Criteria

This task is successful if:

- imported GLB world assets no longer appear black
- readable material/color is visible on placed runtime assets
- the scene has a soft baseline toy-like lighting setup
- capy remains readable against the environment
- the game still loads the custom layout correctly

---

# Part 8 — Required Agent Report

After implementation, respond with:

## Material Fixes Applied
- what was changed for imported GLB materials
- whether vertex colors are supported
- whether normals were recomputed anywhere
- whether fallback materials were used

## Renderer Settings
- output color space
- tone mapping
- exposure

## Lighting Settings
- directional light color/intensity
- hemisphere or ambient light color/intensity
- background color

## Remaining Visual Issues
- what still differs from the toy-village reference
- what should be fixed next

## Status
PASS / NEEDS ADJUSTMENT

---

# Notes

- Do not over-polish yet
- Do not redesign materials artistically yet
- Do not change the world layout
- The purpose is to make the current custom village **visible and readable**
- Final art direction tuning will happen after this task

---

# End of Task
