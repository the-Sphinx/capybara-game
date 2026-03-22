# Capy Village — Task: Camera + Composition Lock (Toy Diorama)

## Goal

Transform the scene from “objects in space” into a **curated toy village diorama** by:

1. Locking a stylized camera
2. Creating intentional composition
3. Using existing assets (houses, props, trees) to form structure

---

# PART 1 — CAMERA LOCK (CRITICAL)

## REMOVE dynamic camera behavior

Disable:
- free orbit
- debug camera movement (for now)

---

## CREATE FIXED DIORAMA CAMERA

```js
camera.position.set(6, 5, 6);
camera.lookAt(0, 0.8, 0);
```

### Adjust until:

✔ Slight top-down angle  
✔ Not too high (avoid RTS look)  
✔ Not too low (avoid first-person)

---

## ADD SLIGHT TILT (IMPORTANT)

```js
camera.rotation.z = -0.05;
```

👉 subtle “toy photography” feel

---

## LOCK CAMERA

Disable user camera controls for now.

---

# PART 2 — DEFINE CENTER (ANCHOR)

## Statue = center of village

Place at:

```js
(0, 0, 0)
```

Everything else builds around this.

---

# PART 3 — PRIMARY STRUCTURE (CIRCLE)

Place 2–4 houses in a loose circle:

Example:

```js
House A → (-2.5, 0, 1.5)
House B → (2.5, 0, 1.5)
House C → (0, 0, -2.5)
```

Rules:

✔ Not perfectly symmetric  
✔ Slight rotation differences  
✔ Facing toward center

---

# PART 4 — ADD DEPTH LAYERS

## Layer 1 (foreground)
- small props (stones, boxes, plants)

## Layer 2 (midground)
- capybara
- main houses

## Layer 3 (background)
- trees
- larger houses

---

# PART 5 — PLACE CAPY (IMPORTANT)

Capy is the “viewer anchor”

```js
position: slightly off center
example: (0, 0, 1.5)
```

Facing:

```js
toward statue
```

---

# PART 6 — ADD PROPS (VERY IMPORTANT)

Use your existing assets:

- trees
- stones
- boxes
- small decorations

Rules:

✔ Cluster, don’t scatter  
✔ Groups of 2–3  
✔ Vary scale slightly (0.9–1.2)

---

# PART 7 — SCALE VARIATION

Even though normalized = 1:

Apply runtime scaling:

```js
tree.scale.setScalar(random(1.8, 2.2));
house.scale.setScalar(random(2.0, 2.5));
props.scale.setScalar(random(0.8, 1.2));
```

👉 This is critical for toy feel

---

# PART 8 — ROTATION VARIATION

Never leave assets perfectly aligned:

```js
mesh.rotation.y += random(-0.3, 0.3);
```

---

# PART 9 — REMOVE EMPTY SPACE

Current issue:

❌ too much empty ground

Fix:

✔ tighten layout  
✔ bring objects closer  
✔ reduce dead zones  

---

# PART 10 — ACCEPTANCE CRITERIA

Scene should feel like:

✔ A small curated toy village  
✔ Clear center (statue)  
✔ Natural clustering  
✔ No large empty areas  
✔ Camera feels intentional  

---

# PART 11 — DO NOT DO

- Do NOT add UI
- Do NOT change lighting again
- Do NOT change materials
- Do NOT over-randomize

---

# NEXT STEP

After this:

👉 Detail polish (paths, edges, small variations)

---

# END
