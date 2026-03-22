# Capy Village — Sky + Cute Cloud Layer

## Goal
Add a soft stylized sky and simple animated clouds that:
- enhance atmosphere
- match the toy/diorama aesthetic
- do NOT distract from gameplay
- do NOT affect performance significantly

---

## HARD RULES

Do NOT:
- use photo skyboxes or HDRI environments
- introduce realistic lighting changes
- add heavy textures or high-poly models
- cast shadows from clouds

Keep everything:
- stylized
- soft
- lightweight

---

# PART 1 — SKY BACKGROUND

Replace current background with a soft pastel sky color.

## Suggested colors (pick one)

```js
scene.background = new THREE.Color("#DCEEFF"); // soft blue
// or
scene.background = new THREE.Color("#E8F3FF"); // slightly lighter
// or
scene.background = new THREE.Color("#F2F8FF"); // very soft
```

### Optional gradient (nice but optional)
If later desired, can implement gradient sky using shader or large plane.
For now: **solid color is enough**

---

# PART 2 — CLOUD DESIGN (STYLIZED)

Create 3–4 reusable cloud meshes.

## Style rules
Clouds should be:
- rounded blobs
- made from 2–5 overlapping spheres
- low poly (very important)
- smooth shading
- slightly warm white

## Example material

```js
const cloudMaterial = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF,
  roughness: 1.0,
  metalness: 0.0,
});
```

Optional slight tint:
```js
color: 0xFFF8F0 // warmer soft white
```

---

# PART 3 — CLOUD VARIANTS

Create at least:

1. Small puff cloud
2. Medium horizontal cloud
3. Tall stacked cloud
4. Wide stretched cloud

Each built from simple spheres merged/grouped.

---

# PART 4 — CLOUD PLACEMENT

Create ~6–10 cloud instances.

## Placement rules
- place BEHIND tree line
- higher than all buildings
- spread across scene width
- do NOT intersect village objects
- keep some empty sky space

## Example

```js
cloud.position.set(x, 8–12, z);
```

Z should be slightly behind village.

---

# PART 5 — SLOW CLOUD MOVEMENT

Add subtle horizontal movement.

## Important
Movement must be:
- VERY slow
- almost unnoticeable
- calming

## Example

```js
cloud.position.x += 0.002;
```

---

# PART 6 — CLOUD LOOPING

When clouds go too far, wrap them back.

## Example

```js
if (cloud.position.x > 15) {
  cloud.position.x = -15;
}
```

Use values matching your scene size.

---

# PART 7 — PERFORMANCE RULES

- reuse same geometry for cloud types
- reuse same material
- keep poly count low
- avoid shadows
- no textures required

---

# PART 8 — VISUAL INTENT

Clouds should:
- enhance depth
- create softness
- support cozy mood

They should NOT:
- draw attention away from center statue
- block important gameplay view
- feel animated like foreground objects

---

# PART 9 — ACCEPTANCE CHECKLIST

- [ ] sky color feels soft and pleasant
- [ ] clouds match toy-like style
- [ ] clouds move slowly and smoothly
- [ ] clouds stay behind village
- [ ] no performance drop
- [ ] scene feels more alive but still calm

---

# PART 10 — NEXT STEPS

After clouds:

1. Performance optimization (instancing stones/trees)
2. Subtle ambient animation (e.g., leaves sway)
3. UI / interaction layer

---

END OF TASK
