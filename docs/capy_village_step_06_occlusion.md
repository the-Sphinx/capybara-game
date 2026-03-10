# Capy Village — Step 06: Camera Occlusion Handling

## Goal

Improve scene readability by preventing large objects, especially buildings, from fully blocking the capy when they sit between the camera and the player.

This step is complete only when:

- the capy remains visible when moving behind a building
- blocking buildings fade automatically while occluding the capy
- buildings return to normal when they stop occluding
- the effect is stable and does not flicker badly
- the camera itself does not need to move or zoom

---

## Prerequisite

Step 05 must already be working:

- capy movement works
- camera follow works
- placeholder village exists
- at least one building interaction works
- no console errors

---

## Design Principle

Do NOT solve this by changing the camera behavior yet.

Do NOT solve this by moving the camera closer or farther.

Do NOT solve this by rotating the camera.

Instead, keep the toy-like fixed camera style and make large occluding objects fade when they block the line of sight between the camera and the capy.

This keeps the visual style stable and is appropriate for a cozy toy-like game.

---

## Which Objects Can Occlude

Only large scene objects should participate in occlusion fading.

For Step 06, include:

- buildings

Optional later:
- large trees

Do NOT include:

- rocks
- bushes
- paths
- tiny props
- the capy itself

---

## Required Behavior

Each frame:

1. determine the capy world position
2. determine the camera world position
3. check whether any occluding building lies between the camera and the capy
4. if a building blocks the view:
   - fade that building
5. if a building no longer blocks the view:
   - restore it to normal opacity

The player should remain visible without the camera changing position.

---

## Detection Method

Preferred method:

- raycast or segment check from camera to capy

Suggested target:

- aim toward the capy upper body, not the feet

For example, conceptually use:

camera position → capy position plus a small vertical offset

This helps detect meaningful visual occlusion.

Do NOT use:

- distance from camera to object center
- distance from capy to object center
- a fixed global radius

Occlusion must be based on actual line-of-sight blocking.

---

## Fade Behavior

When a building blocks the line of sight:

- set its material to transparent if needed
- reduce opacity smoothly

Suggested target opacity:

- 0.25 to 0.40

Recommended starting value:

- 0.30

When a building is no longer blocking:

- smoothly restore opacity to 1.0

---

## Smoothness Requirement

Do NOT instantly snap opacity if avoidable.

Opacity should interpolate smoothly each frame.

This prevents visual popping.

Suggested approach:

- maintain a target opacity per occluder
- lerp current opacity toward target opacity

This does not need to be mathematically perfect, only visually stable.

---

## Material Requirements

If a building uses a material that is not yet transparent-capable:

- enable transparency on that material

Important:

If multiple buildings share the same material instance, the agent must ensure fading one building does not accidentally fade all buildings at once.

Preferred solution:

- each occluding building should have its own material instance

---

## Interaction With Existing UI

The bottom-center interaction prompt should remain unchanged.

The center interaction panel should remain unchanged.

Occlusion handling should only affect world objects, not screen-space UI.

---

## Camera Behavior

Do NOT modify:

- camera distance
- camera angle
- camera follow logic

This step is only about visibility through fading occluders.

---

## Acceptable Scope for Step 06

At minimum, implement fading for:

- the main placeholder buildings

That is enough to complete the step.

Large trees can be ignored for now if needed.

---

## Things to Avoid

Do NOT:

- redesign the village layout yet
- add collision changes
- move buildings to fix occlusion
- add roof cutaways
- add complex camera collision
- add post-processing
- change the prompt system

Focus only on occlusion fading.

---

## Acceptance Criteria

Step 06 is complete only if all of the following are true:

1. When the capy moves behind a building, the building fades enough to keep the capy visible.
2. When the capy is no longer behind the building, the building returns to normal opacity.
3. Only relevant large objects fade.
4. The effect does not fade the whole scene accidentally.
5. The camera behavior remains otherwise unchanged.
6. The effect is reasonably smooth and not badly flickery.
7. No console errors appear.

---

## Deliverable

Provide:

- the running URL
- a short summary of how occlusion is detected
- confirmation of which objects are fade-enabled
- a screenshot or short recording showing:
  - capy behind building
  - building fading
  - building restoring afterward

---

## Notes for the Coding Agent

Recommended implementation outline:

- maintain a list of occluding building meshes
- each frame, test line of sight from camera to capy
- for any intersecting building:
  - set target opacity to faded value
- for all other occluders:
  - set target opacity to 1.0
- interpolate current opacity toward target opacity
- ensure each building has its own material instance

Keep implementation simple and robust.