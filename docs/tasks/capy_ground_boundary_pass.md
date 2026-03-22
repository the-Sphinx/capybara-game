# Capy Village — Ground Boundary + Horizon Control (STRICT TASK)

## Goal
Remove the infinite flat ground and create a **contained diorama world**.

This should visually match the reference:
- Village feels like a small crafted island
- Beyond trees → only sky
- No visible endless plane

---

## HARD RULES

Do NOT change:
- camera
- lighting
- asset positions
- layout system
- player logic

Only change:
- ground geometry
- background / horizon behavior
- optional subtle edge fading

---

# PART 1 — REMOVE INFINITE GROUND

If current ground is:
- very large plane (e.g. 100x100 or more)

👉 Replace it with a **bounded ground mesh**

---

# PART 2 — CREATE ISLAND GROUND

Create a circular (or slightly oval) ground:

```js
const groundRadius = 12;

const groundGeo = new THREE.CircleGeometry(groundRadius, 64);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0xd8d2a8,
  roughness: 1.0,
  metalness: 0.0
});

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
```

---

# PART 3 — ADD SOFT EDGE FALL-OFF

We want edges to visually disappear into sky.

### Option A (Simple color fade)
Make outer ground slightly lighter:

```js
groundMat.color = new THREE.Color(0xded8b8);
```

---

### Option B (Better — vertex gradient)

If supported:
- darken center slightly
- lighten edges

But keep it subtle.

---

# PART 4 — REMOVE HARD HORIZON LINE

Right now you see a clear line between ground and sky.

We want to soften/remove it.

### Solution: Slight vertical offset

```js
ground.position.y = -0.05;
```

---

# PART 5 — TREE WALL AS VISUAL BOUNDARY

Trees already exist — now they become your **natural horizon blocker**.

Ensure:
- trees form a loose ring
- no big gaps where ground edge is visible

If needed:
- add a few more trees near edges (NOT too dense)

---

# PART 6 — SKY DOMINANCE

Background must take over beyond village.

Ensure:

```js
scene.background = new THREE.Color(0xe6efe8);
```

---

# PART 7 — OPTIONAL EDGE FOG (VERY LIGHT)

If edge still feels visible:

```js
scene.fog = new THREE.Fog(0xe6efe8, 10, 22);
```

⚠️ Keep it VERY subtle  
⚠️ If it flattens scene → REMOVE IT

---

# PART 8 — SHADOW CHECK

Make sure:
- ground still receives shadows
- shadows do not disappear near edges

---

# PART 9 — VISUAL ACCEPTANCE CHECKLIST

All must be true:

- [ ] No visible infinite plane
- [ ] Ground clearly feels like a contained island
- [ ] Trees block most horizon edges
- [ ] Beyond trees → only sky visible
- [ ] No hard horizon line
- [ ] Scene feels like a small toy world
- [ ] Lighting and camera unchanged

---

# PART 10 — WHAT NOT TO DO

Do NOT:
- scale entire world
- move assets inward
- change camera height
- add giant walls or domes
- add visible borders

---

# PART 11 — DELIVERABLE

After implementation report:

1. Ground radius used
2. Whether fog was used
3. Whether tree ring was adjusted
4. Whether horizon line is still visible

---

# PART 12 — NEXT STEP

After this:

## Camera Follow System (Dead-Zone + Soft Follow)

---

END OF TASK
