# Capy Village — Step 03: Camera Follow Prototype

## Goal
Extend the current Three.js prototype so the camera follows the capy smoothly while the capy moves around the ground plane.

This step is complete only when the camera:

- keeps the capy visible at all times during normal movement
- follows the capy smoothly
- preserves the toy-like elevated viewing angle
- does not clip into the ground
- does not jitter or snap unpleasantly

---

## Prerequisite

Step 02 must already be working:

- capy loads correctly
- capy stands on the ground plane
- idle animation plays
- keyboard movement works
- capy rotates toward movement direction
- boundaries are implemented
- no console errors

---

## Camera Behavior

Implement a simple third-person follow camera.

The camera should:

- stay behind and above the capy
- maintain a consistent toy-like angle
- move smoothly as the capy moves
- continue looking at the capy

Do not implement orbit controls.

Do not allow manual camera rotation yet.

---

## Suggested Camera Style

Use a cozy toy-village style camera similar to a simple exploration game.

Suggested behavior:

- slightly elevated
- slightly behind the capy
- angled downward
- fixed relative offset from the capy

Suggested starting offset:

`(0, 2.5, 4.5)`

This offset may be adjusted slightly if needed for better framing.

---

## Follow Logic

The camera should not be rigidly attached to the capy.

Instead:

- compute a desired camera position based on the capy's position
- interpolate smoothly toward that desired position every frame

Suggested approach:

- use linear interpolation (`lerp`) for the camera position
- keep the look target centered near the capy

---

## Look Target

The camera should look at the capy continuously.

Suggested look target:

- capy world position
- optionally with a slight vertical offset, such as looking at the upper body instead of the feet

Example target idea:

`capy.position + (0, 0.5, 0)`

---

## Movement + Camera Interaction Requirements

- Camera must continue to work while the capy moves in any allowed direction.
- Camera must not lag too far behind.
- Camera must not overshoot heavily.
- Camera must not clip below the ground plane.
- Capy should remain comfortably visible within the viewport.

---

## Boundary Behavior

When the capy reaches the movement bounds:

- camera behavior should remain stable
- no sudden jump or shake should happen

---

## Acceptance Criteria

This step is complete only if all of the following are true:

1. The camera follows the capy during movement.
2. The capy remains visible at all times during normal movement.
3. The camera motion feels smooth rather than rigidly locked.
4. The camera maintains a readable toy-like angle.
5. The camera does not clip into the ground.
6. No major jitter, snapping, or drifting occurs.
7. No console errors appear.

---

## Notes for the Coding Agent

- Keep implementation simple.
- Do not add collision avoidance yet.
- Do not add orbit controls.
- Do not add mouse controls.
- Do not add cinematic effects.
- Do not add zoom controls yet.

Focus only on:

- camera follow
- smooth interpolation
- stable visibility
- preserving the prototype feel

---

## Deliverable

A running local or deployed web app where the camera smoothly follows the capy during keyboard movement.

After implementation, provide:

- the URL
- a short summary of camera behavior
- a screenshot or short screen recording
- any console errors if present