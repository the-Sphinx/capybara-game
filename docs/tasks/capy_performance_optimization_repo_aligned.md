# Capy Village — Performance Optimization Pass (Repo-Aligned)

## Goal
Improve runtime performance **without changing the look** of the village.

This task is based on the current repo structure and should work with the code that exists now, especially:

- `capy-village/src/runtimeLayout.js`
- `loadPublishedVillage(scene)`
- `templateCache`
- `sanitizeMeshForRuntime()`
- `clonePublishedScene()`
- `getColliderForObject()`
- `isNonBlockingDecor()`

The main goal is to reduce the cost of rendering many repeated decorative objects such as:
- stones
- small props
- repeated simple decorations

without changing:
- camera
- lighting
- layout composition
- gameplay feel

---

## HARD RULES

Do NOT change:
- camera logic in `main.js`
- lighting setup
- asset transforms in layout JSON
- village composition
- player movement logic

Only change:
- runtime asset instantiation strategy
- repeated prop rendering strategy
- optional collider generation for instanced/non-blocking decor
- optional debug logging behavior

---

# PART 1 — START WITH NON-BLOCKING REPEATED DECOR ONLY

## Why
The repo already has a concept of non-blocking decor in `runtimeLayout.js` through:

```js
isNonBlockingDecor(assetId, size)
```

and currently includes prefixes like:
- `stones_`
- `stem_`
- `milk`
- `pumpkin`
- `cubes_`

This is the safest place to optimize first because these items do not need collision boxes.

## Requirement
Only optimize repeated assets that are clearly decorative and non-blocking first.

Do NOT start with buildings or the center statue.

---

# PART 2 — ADD INSTANCING FOR REPEATED DECOR

## Target file
`capy-village/src/runtimeLayout.js`

## Current behavior
Right now `loadPublishedVillage(scene)`:
- loads a template scene once per asset id into `templateCache`
- clones that scene for every object
- adds every clone as a separate object to `villageGroup`

This is fine for hero assets, but expensive for many repeated stones.

## New behavior
For repeated non-blocking decor with the same `assetId`:
- build one `THREE.InstancedMesh` instead of many clones
- apply each object's transform matrix to one instance slot
- add the instanced mesh once to `villageGroup`

---

# PART 3 — SAFE SCOPE FOR INSTANCING

Only instance objects that meet BOTH conditions:

### Condition A
Their `assetId` is repeated more than once in the layout.

### Condition B
They are considered non-blocking decor by the current repo logic:
- via `isNonBlockingDecor(assetId, size)`
- or by the same asset-id prefix rules already present

This keeps the optimization aligned with the code you already have.

---

# PART 4 — IMPLEMENTATION STRATEGY

## Step 1
Group layout objects by `assetId`.

## Step 2
For each group:
- if count == 1 → keep current clone flow
- if count > 1:
  - load template once
  - detect whether it is safe for instancing
  - if safe → build instanced mesh
  - if not safe → keep clone flow

## Step 3
If a GLB scene contains multiple meshes:
- you may need one `InstancedMesh` per mesh/material pair
- preserve the original materials from the loaded asset
- still call `sanitizeMeshForRuntime()` on the template meshes first

Do NOT simplify materials or override art direction.

---

# PART 5 — COLLIDERS

The current repo adds colliders using:

```js
getColliderForObject(instance, object.assetId)
```

For instanced non-blocking decor, do NOT add colliders.

That is consistent with the current design because non-blocking decor already returns `null` collider results.

Do NOT change collider behavior for buildings, large props, or blocking objects.

---

# PART 6 — KEEP HERO ASSETS AS NORMAL OBJECTS

Do NOT instance these:
- center statue / book fountain
- main houses
- shop
- mushroom house
- any object that should keep its own collider
- anything unique / hero / animated later

These should remain normal scene objects.

---

# PART 7 — OPTIONAL SECONDARY OPTIMIZATION

If easy, reduce verbose runtime logging from `sanitizeMeshForRuntime()` for final play mode.

Right now the repo prints detailed runtime asset info for imported meshes. That is useful for debugging but not necessary forever.

Acceptable options:
- keep logs only in dev mode
- add a debug flag
- suppress logs for instanced repeated decor

Do NOT remove useful error reporting entirely.

---

# PART 8 — IMPORTANT CONSTRAINT

Do NOT rewrite the whole loader system.

Keep the existing structure:
- `fetchJson(...)`
- `templateCache`
- `loadPublishedVillage(scene)`
- `applyObjectTransform(...)`
- `getColliderForObject(...)`

Just add an instancing path for repeated non-blocking decor.

This should be a focused performance pass, not a refactor.

---

# PART 9 — ACCEPTANCE CHECKLIST

All must be true:

- [ ] repeated stones / repeated small decor no longer spawn as many separate clones
- [ ] village looks visually identical
- [ ] blocking objects still have colliders
- [ ] non-blocking decor remains non-blocking
- [ ] performance improves noticeably in the busy village layout
- [ ] camera, lighting, and composition remain unchanged

---

# PART 10 — DELIVERABLE

After implementation, report:

1. Which asset ids are now instanced
2. Which file(s) were changed
3. Whether collider behavior changed for any assets
4. Whether runtime logging was reduced
5. Estimated performance improvement (rough is fine)

---

# PART 11 — NEXT LIKELY STEP

After this optimization pass, likely next steps are:
- subtle sky/cloud polish
- gentle idle world animation
- interaction / UX polish

---

END OF TASK
