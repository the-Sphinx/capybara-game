# Capy Village — Camera Visibility Safeguard + Soft Village Bounds

## Goal
Keep the capybara visible during movement **without destroying the diorama composition**.

This task improves the current hybrid camera by:

1. keeping a **soft follow** when the capy moves normally
2. increasing follow strength when the capy approaches screen edges
3. adding **soft village movement bounds** so the player cannot wander too far beyond the designed village area

The result should be:
- player stays visible
- village composition stays mostly intact
- camera does not constantly re-center
- movement still feels free inside the village

---

## HARD RULES

Do NOT change:
- camera FOV
- base camera angle
- lighting
- layout
- asset positions
- materials

Only change:
- camera follow behavior
- player movement bounds / world limits

---

# PART 1 — KEEP THE CURRENT HYBRID CAMERA BASE

Do NOT replace the current hybrid diorama camera.

Keep:
- base camera position/angle
- soft follow idea
- village center as the main composition anchor

This task is only an improvement to prevent capy from leaving the screen.

---

# PART 2 — ADD TWO FOLLOW ZONES

Use two camera response zones:

## Zone A — Safe Zone
Inside this zone:
- camera responds very little
- current gentle follow behavior is preserved

## Zone B — Edge Zone
Near the edge of the screen:
- camera responds more strongly
- enough to keep capy visible

---

# PART 3 — IMPLEMENT TWO FOLLOW STRENGTHS

Use two thresholds relative to the camera anchor / follow anchor.

Example starting values:

```js
const deadZone = { x: 3.5, z: 3.0 };
const edgeZone = { x: 5.0, z: 4.2 };

const followLerpSoft = 0.025;
const followLerpStrong = 0.07;
```

## Behavior

### If capy is inside deadZone
- no meaningful camera movement

### If capy is outside deadZone but inside edgeZone
- use `followLerpSoft`

### If capy is outside edgeZone
- use `followLerpStrong`

This gives the camera a stronger response only when needed.

---

# PART 4 — SAMPLE FOLLOW LOGIC

Use the current follow structure, but select follow strength dynamically.

Pseudo logic:

```js
const dx = capy.position.x - cameraAnchor.x;
const dz = capy.position.z - cameraAnchor.y;

let desiredAnchorX = cameraAnchor.x;
let desiredAnchorZ = cameraAnchor.y;

if (Math.abs(dx) > deadZone.x) {
  desiredAnchorX += dx - Math.sign(dx) * deadZone.x;
}
if (Math.abs(dz) > deadZone.z) {
  desiredAnchorZ += dz - Math.sign(dz) * deadZone.z;
}

let currentFollowLerp = followLerpSoft;

if (Math.abs(dx) > edgeZone.x || Math.abs(dz) > edgeZone.z) {
  currentFollowLerp = followLerpStrong;
}

desiredAnchorX = THREE.MathUtils.clamp(desiredAnchorX, -maxCameraShift.x, maxCameraShift.x);
desiredAnchorZ = THREE.MathUtils.clamp(desiredAnchorZ, -maxCameraShift.z, maxCameraShift.z);

cameraAnchor.x = THREE.MathUtils.lerp(cameraAnchor.x, desiredAnchorX, currentFollowLerp);
cameraAnchor.y = THREE.MathUtils.lerp(cameraAnchor.y, desiredAnchorZ, currentFollowLerp);
```

Do not copy blindly if your variable names differ, but implement this exact behavior.

---

# PART 5 — KEEP COMPOSITION BIAS

Do NOT remove the composition-preserving look target logic.

The camera should still bias slightly toward the village center/statue.

That means:
- keep the base look target
- keep partial look follow
- do not fully look at capy at all times

The capy should remain visible, but the statue/village should still feel like the composition anchor.

---

# PART 6 — ADD SOFT VILLAGE BOUNDS

The capy should not be allowed to wander beyond the designed village area.

Add soft world bounds so the player remains inside the village play region.

## Suggested starting bounds

```js
const movementBounds = {
  minX: -7.5,
  maxX: 7.5,
  minZ: -6.5,
  maxZ: 7.0,
};
```

Use values appropriate to your actual village footprint.

---

# PART 7 — PLAYER MOVEMENT CLAMP

Clamp player/world movement after applying input.

Example:

```js
capy.position.x = THREE.MathUtils.clamp(capy.position.x, movementBounds.minX, movementBounds.maxX);
capy.position.z = THREE.MathUtils.clamp(capy.position.z, movementBounds.minZ, movementBounds.maxZ);
```

If you already use a movement vector before applying it, you may clamp the intended destination instead.

---

# PART 8 — DESIGN INTENT FOR BOUNDS

Bounds should feel:
- generous
- invisible
- natural

Do NOT make the area so small that the player feels trapped.

The purpose is:
- keep the player in the designed village
- avoid empty/off-stage space
- support the diorama composition

---

# PART 9 — ACCEPTANCE CHECKLIST

All must be true:

- [ ] capy does not leave the visible frame during normal movement
- [ ] camera still feels calm / not over-responsive
- [ ] camera only reacts strongly near edges
- [ ] village composition is still preserved
- [ ] player can move freely around the village
- [ ] player cannot wander off into irrelevant empty space

---

# PART 10 — WHAT NOT TO DO

Do NOT:
- make the camera always center the capy
- fully attach camera to player
- change the FOV
- rotate camera dynamically
- shrink playable area too aggressively
- add visible walls

---

# PART 11 — DELIVERABLE

After implementation, report:

1. deadZone values
2. edgeZone values
3. soft follow lerp
4. strong follow lerp
5. movement bounds used
6. whether the capy can still leave the screen
7. whether composition still feels preserved

---

# PART 12 — NEXT STEP

After this is stable, the next likely steps are:

- sky / cloud backdrop
- performance cleanup (instancing repeated stones/trees)
- prop batching / optimization

---

END OF TASK
