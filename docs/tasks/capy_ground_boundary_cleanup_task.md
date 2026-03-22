# Capy Village — Ground Boundary Fix (Outer Ring / Extra Ground Cleanup)

## Goal
Fix the outer ground issue where:

- an extra extended ground area is still visible
- the outer beige area looks wrong / dirty / mismatched
- the island boundary does not yet feel clean and intentional

This task is a **cleanup pass**, not a redesign.

---

## HARD RULES

Do NOT change:
- camera
- lighting
- layout / object placement
- player logic
- asset transforms

Only change:
- ground meshes
- ground materials
- boundary rendering
- optional tree boundary density if absolutely needed

---

# PART 1 — REMOVE OLD / DUPLICATE GROUND

## Problem
There is most likely:
- an old large plane still active
- or a second ground layer still rendering under/around the island

## Required
Search for any previous ground creation such as:
- `PlaneGeometry(...)`
- older `ground` meshes
- shadow-catcher planes
- any large floor mesh added before the new island

Remove or disable them completely.

### Expected result
There must be only:
- one main island ground mesh
- one optional central plaza mesh

No infinite or oversized background floor should remain.

---

# PART 2 — VERIFY ONLY ONE GROUND SYSTEM EXISTS

Temporarily add debug logging to confirm.

For example:
- print all scene meshes
- confirm that only the intended island/base ground and plaza are present

If there is any extra floor mesh, remove it.

---

# PART 3 — FIX OUTER BEIGE AREA MATERIAL

## Problem
The outer beige ring currently looks like:
- stretched
- dirty
- mismatched
- possibly z-fighting or material overlap

## Required
Use one clean material for the island base.

Suggested starting material:

```js
const groundMat = new THREE.MeshStandardMaterial({
  color: 0xe2dcc2,
  roughness: 1.0,
  metalness: 0.0
});
```

### Important
- no texture
- no visible patterning
- no overlapping decals
- no secondary floor bleeding through

The ground must read as a smooth toy base.

---

# PART 4 — USE A SINGLE CLEAN ISLAND SHAPE

The playable village should sit on one contained island-like base.

Recommended:
- one circular or slightly oval main ground
- one central plaza if needed

Do NOT stack multiple large rings unless clearly intentional.

If the current setup uses several overlapping circular planes, simplify it.

---

# PART 5 — ADJUST ISLAND SIZE IF NEEDED

If the edge is too close and the scene exposes gaps, slightly increase the island radius.

Suggested adjustment:
- increase only a little
- enough so trees and buildings sit comfortably inside the boundary

Do NOT make it so large that it feels infinite again.

---

# PART 6 — SOFTEN OUTER EDGE

After duplicate ground cleanup, the island edge should still feel soft.

Use one or more of these:
- slightly lighter outer ground color
- slightly lower island Y offset
- tree ring to hide edge transitions

But do NOT create another visible outer platform.

---

# PART 7 — TREE BOUNDARY CHECK

If removing the extra ground exposes too much empty edge:
- add only a few trees where gaps are obvious
- keep them irregular
- do not create a rigid wall

The goal is:
- village inside
- sky outside

---

# PART 8 — ACCEPTANCE CHECKLIST

All must be true:

- [ ] No old infinite plane remains
- [ ] No second ground layer is visible
- [ ] Outer beige area looks clean and uniform
- [ ] No weird stretching / overlap / artifacting on outer ground
- [ ] Village reads as a contained toy island
- [ ] Beyond the outer tree line, sky dominates
- [ ] Camera and lighting remain unchanged

---

# PART 9 — DELIVERABLE

After implementation, report:

1. Whether an old floor/plane was found and removed
2. Final island radius
3. Final island material color
4. Whether any extra trees were added at the edge
5. Whether only one ground mesh remains active

---

# IMPORTANT

Do NOT redesign the village.
This is only a cleanup/fix pass so the ground boundary feels correct and polished.

---

END OF TASK
