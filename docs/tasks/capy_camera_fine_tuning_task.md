# Capy Village — Camera Fine-Tuning Task

## Goal

Fine-tune the **existing camera follow system** in the `scene-restructure` branch.

Important:
- **Do not rewrite** the camera system from scratch.
- **Do not remove** the current dead-zone / edge-zone architecture.
- **Do not change** the overall diorama-like composition style.
- Make the camera feel **a bit more responsive and reliable** while still staying soft, cozy, and cinematic.

The current repo already has:
- dead zone follow
- edge zone stronger follow
- capped camera shift
- blended look target
- composition bias
- player movement bounds

This task is only about **parameter tuning and very small behavioral polish**.

---

## File to Edit

- `capy-village/src/main.js`

---

## Current Situation

The current implementation is already good, but the likely improvement target is:

- make it slightly harder for Capy to drift visually too far from the player’s attention
- improve follow response a bit
- preserve the handcrafted village framing
- avoid introducing jitter, harsh snapping, or “camera glued to player” feel

---

## Implementation Strategy

Adjust the existing tuning values only, plus add **very light optional debug support** if useful.

### 1. Tighten the dead zone slightly

Find the current dead zone values and reduce them a little.

Current values are approximately:
- `deadZone.x = 3.5`
- `deadZone.z = 3.0`

Suggested new values:
- `deadZone.x = 2.8`
- `deadZone.z = 2.4`

Intent:
- the camera should start reacting a little sooner
- still allow some free movement so the view remains calm

Do **not** make the dead zone tiny.

---

### 2. Tighten the edge zone slightly

Find the edge zone values and reduce them a bit so the stronger follow engages slightly sooner.

Current values are approximately:
- `edgeZone.x = 5.0`
- `edgeZone.z = 4.2`

Suggested new values:
- `edgeZone.x = 4.3`
- `edgeZone.z = 3.6`

Intent:
- when Capy approaches the visual edge of the comfortable area, the camera should catch up sooner

---

### 3. Increase soft follow a little

Find the current follow lerp strengths.

Current values are approximately:
- `followLerpSoft = 0.025`
- `followLerpStrong = 0.07`

Suggested new values:
- `followLerpSoft = 0.04`
- `followLerpStrong = 0.09`

Intent:
- regular camera movement should feel less sluggish
- strong catch-up should remain smooth, not snappy

If `0.09` feels too reactive, fall back to `0.085`.

---

### 4. Increase look-follow slightly

Find:
- `lookFollowFactor`

Increase it modestly.

If current value is around `0.2`–`0.3`, raise it slightly, for example:
- new target range: `0.32` to `0.38`

Intent:
- the camera should visually acknowledge Capy’s movement a bit more
- but the focal composition should still retain village-center bias

Do **not** make the look target fully lock to Capy.

---

### 5. Slightly reduce composition bias if needed

Find:
- `compositionBias`

Reduce only a little if the view still feels too resistant to player movement.

Example adjustment:
- reduce by about `10%` to `15%`

Intent:
- keep the scene composition intact
- but allow a bit more player-driven framing

If the camera already feels nicely framed after steps 1–4, leave this unchanged.

---

### 6. Keep max camera shift protection

Do **not** remove or weaken:
- `maxCameraShift`

This cap is important for preserving the village composition and preventing extreme drift.

Only touch it if testing proves it is the main reason Capy still feels too off-center.
If changed at all, keep the change very small.

---

## Optional Debug Helper

If helpful, add a small temporary debug toggle so values are easy to tune during testing.

Possible approach:
- create a `const CAMERA_DEBUG = false`
- when enabled, log current camera tuning values once on startup
- optionally expose a clearly grouped camera settings object

But keep this minimal.
Do not add UI libraries or a full debug panel for this task.

---

## Preferred Refactor Scope

A very small cleanup is acceptable **only if it makes tuning safer**.

Example:
- group camera tuning constants in one object like:
  - `cameraTuning.deadZone`
  - `cameraTuning.edgeZone`
  - `cameraTuning.followLerpSoft`
  - etc.

Only do this if it is low-risk and does not disturb the current flow.

Do not perform a broad structural refactor.

---

## Acceptance Criteria

The task is successful if:

1. Capy stays within comfortable view more reliably during movement.
2. Camera reacts a bit sooner and feels less sluggish.
3. Camera still feels soft and cinematic.
4. Village center composition is still preserved.
5. No jitter, snapping, or over-rotation is introduced.
6. Existing player bounds and current camera architecture remain intact.

---

## Testing Checklist

After implementation, test all of the following:

### Basic movement
- Move slowly in all directions
- Move diagonally
- Stop and start repeatedly

Expected:
- camera response is smooth
- no trembling or overshoot

### Edge behavior
- Move Capy toward outer playable bounds
- especially near corners

Expected:
- camera catches up earlier than before
- Capy does not feel visually abandoned near frame edges

### Composition
- Return to center area
- Stand still

Expected:
- village composition still feels intentional and attractive
- camera does not over-center on Capy like a generic chase cam

### Feel
- The camera should feel:
  - slightly more responsive
  - still cozy
  - still stylized
  - not “tight” or “stiff”

---

## Guardrails

Do not:
- replace the system with OrbitControls
- attach the camera directly to the player
- remove dead-zone logic
- remove edge-zone logic
- remove capped camera shift
- make the camera constantly hard-center on Capy
- introduce complex camera collision logic in this task

---

## Deliverable

Commit the camera fine-tuning changes to the current branch and provide a short summary including:

1. which parameters were changed
2. the old and new values
3. whether `compositionBias` was changed
4. a 2–4 sentence subjective feel summary:
   - e.g. “camera now responds earlier and keeps Capy framed better while preserving the village diorama feel”

---

## Recommended Starting Preset

Use this as the first test preset:

- `deadZone.x = 2.8`
- `deadZone.z = 2.4`
- `edgeZone.x = 4.3`
- `edgeZone.z = 3.6`
- `followLerpSoft = 0.04`
- `followLerpStrong = 0.09`
- `lookFollowFactor = slightly increased`
- `compositionBias = unchanged initially`

Then test and make only **small final adjustments** if needed.

---

## Final Note

This is a **fine-tuning task**, not a camera rewrite.

Preserve what is already working.
The objective is to improve feel, not to redesign the system.
