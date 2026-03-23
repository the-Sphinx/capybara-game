# Capy Village — Interaction Polish & Collision Refinement

## Goal

Improve interaction quality and fix collision issues around buildings **without changing core systems**.

Focus on:
1. Removing awkward visual feedback (scaling)
2. Improving collision accuracy near buildings
3. Making interactions easier and more forgiving

---

## File Scope

Primary:
- `capy-village/src/main.js`
- `capy-village/src/world.js` (or wherever colliders are defined)

---

## PART 1 — REMOVE SCALE PULSE EFFECT

### Problem
Buildings currently grow/shrink when player is near.

This:
- breaks immersion
- feels UI-like, not world-like

### Task

Remove any logic that modifies:
```js
object.scale
```

Specifically:
- proximity-based scaling
- pulsing animations

---

## PART 2 — REPLACE WITH SUBTLE FEEDBACK

Choose ONE or combine lightly:

### Option A — Emissive Highlight (Preferred)
```js
material.emissiveIntensity = 0.1 → 0.25 (when active)
```

### Option B — Soft Lift
- slightly raise object (y + 0.05)
- return smoothly

### Option C — Floating Icon
- small icon above building (question mark, sparkle, etc.)

---

## PART 3 — COLLISION REFINEMENT

### Problem

Current system likely uses:
- axis-aligned bounding boxes (AABB)

Issues:
- circular buildings feel blocked too early
- rotated buildings behave incorrectly
- player cannot approach naturally

---

## TARGET APPROACH

### Replace generic blockers with simple 2D footprints

Define per-building colliders using:

#### 1. Circle collider (for round buildings)
```js
{
  type: "circle",
  x: centerX,
  z: centerZ,
  radius: 1.8
}
```

#### 2. Rectangle collider (for shops / stands)
```js
{
  type: "rect",
  x: centerX,
  z: centerZ,
  width: 3,
  depth: 2,
  rotation: Math.PI / 4 // if needed
}
```

#### 3. Composite (for complex shapes)
- combine 2–3 circles instead of one big box

---

## COLLISION CHECK UPDATE

Update `collides(x, z)` to support:

### Circle
```js
const dx = x - c.x;
const dz = z - c.z;
if (dx*dx + dz*dz < c.radius*c.radius) return true;
```

### Rotated Rectangle
1. Translate point into local space
2. Apply inverse rotation
3. Check bounds

```js
const cos = Math.cos(-c.rotation);
const sin = Math.sin(-c.rotation);

const dx = x - c.x;
const dz = z - c.z;

const localX = dx * cos - dz * sin;
const localZ = dx * sin + dz * cos;

if (
  Math.abs(localX) < c.width / 2 &&
  Math.abs(localZ) < c.depth / 2
) return true;
```

---

## IMPORTANT

- Do NOT remove existing movement logic
- Only improve how `collides()` evaluates obstacles

---

## PART 4 — INTERACTION RADIUS BUFFER

### Problem
Player must get too close due to collision limits

### Solution

Each interactable should have:

```js
interactionRadius = colliderRadius + 0.8
```

Interaction detection should use this radius instead of strict position

---

## PART 5 — SMOOTH UX IMPROVEMENTS

### Prompt Behavior
- appears slightly earlier (due to larger radius)
- fades in/out smoothly
- does not flicker

### Selection Logic
- choose nearest interactable within radius
- avoid rapid switching between two nearby objects

Optional:
- add small hysteresis (stick to current selection briefly)

---

## ACCEPTANCE CRITERIA

1. Player can approach buildings naturally from all angles
2. No “invisible wall” feeling
3. Interaction triggers comfortably before collision edge
4. No scaling effect remains
5. Visual feedback is subtle and clean
6. No regressions in:
   - camera
   - movement
   - performance

---

## TESTING CHECKLIST

### Movement
- walk around circular buildings
- walk around rotated buildings
- approach diagonally

Expected:
- smooth approach
- no early blocking

### Interaction
- approach interactables slowly
- stand near edges

Expected:
- prompt appears reliably
- interaction works consistently

### Visual
- no scale changes
- highlight is subtle

---

## FINAL NOTE

This is a **precision polish task**.

Do not over-engineer.
Do not introduce physics engines.

The goal is:
- natural movement
- clean interaction
- preserved aesthetic
