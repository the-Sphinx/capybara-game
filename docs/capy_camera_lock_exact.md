# Capy Village — Camera Lock Instructions (Concrete, Non-Interpretive)

## Purpose

Lock the camera to a **specific measurable setup** so the village stops drifting into an overly top-down, far-away, prototype-looking view.

This document is intentionally concrete.
Do not “interpret” the style.
Apply the exact values first.

---

# Important Rule

Do NOT redesign the world.
Do NOT move huts, trees, props, or NPCs.
Do NOT change gameplay systems.

Only change:
- camera position
- camera target / look-at
- field of view
- smoothing
- ground plane size if needed to remove huge empty space

---

# Camera Mode

For now, use a **fixed diorama-style hub camera** focused on the plaza.

Do NOT use a loose free camera.
Do NOT use a high top-down camera.
Do NOT use a far zoomed-out chase camera.

If the player can still move in the hub, the camera should remain anchored to the village center and only use very mild follow or no follow.

---

# Exact Starting Camera Values

Assume the **center plaza / tree / book area** is the camera target.

Set:

- `camera.position.x = plazaCenter.x`
- `camera.position.y = plazaCenter.y + 7`
- `camera.position.z = plazaCenter.z + 8`

Then aim the camera at:

- `lookAt(plazaCenter.x, plazaCenter.y + 1.2, plazaCenter.z)`

If your coordinate system is reversed, keep the same magnitudes but flip the Z sign as needed.
The important part is:
- camera above center by about **7**
- camera back from center by about **8**
- looking slightly downward at the center

---

# Rotation / Angle Target

The effective camera pitch should end up around:

- **35° to 40° downward**

It must NOT end up near 55°–70°.
If it looks top-down, it is wrong.

---

# Field of View

Set:

- `FOV = 36`

Allowed adjustment range:
- minimum **34**
- maximum **40**

Do NOT use 50, 60, 70, or wider.

---

# Follow Behavior

For now choose one of these:

## Preferred
No follow in the hub scene.
Camera stays fixed on the village center.

## Acceptable fallback
Very soft follow only on X/Z:
- smoothing = `0.05`

Do NOT tightly follow the player.
Do NOT recenter aggressively.

---

# Ground Plane Constraint

If the ground plane is so large that the village looks tiny, reduce it.

## Rule
The visible ground should extend only a moderate amount past the outer huts.

Target:
- village occupies roughly **65% to 80% of the screen width**
- not 20% to 30%

If needed, reduce ground plane width/depth so there is not a huge empty border.

---

# Visual Target Checklist

After applying the settings, verify all of these are true:

- The village fills most of the frame
- The center plaza is the visual focus
- The camera is not top-down
- The huts feel arranged around the center
- The scene feels like a toy diorama, not a giant empty map
- The player can still be seen, but the world is the priority

If any of these fail, do not mark the task as passed.

---

# Required Output

After applying this, report the actual final values in this exact format:

## Final Camera Values
- position.x = ?
- position.y = ?
- position.z = ?
- lookAt.x = ?
- lookAt.y = ?
- lookAt.z = ?
- FOV = ?
- follow mode = fixed / soft follow
- smoothing = ?

## Verification
- village fills frame: YES / NO
- top-down look avoided: YES / NO
- center plaza visible: YES / NO
- scene feels zoomed too far out: YES / NO

## Status
PASS / NEEDS ADJUSTMENT

---

# Important Warning

Do NOT claim PASS unless:
- the village fills most of the frame
- the camera is clearly 3/4 and not top-down
- the plaza is visually central
