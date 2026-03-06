# Capy Village — Step 02: Keyboard Movement Prototype

## Goal
Extend the existing Three.js prototype so the capy can be moved around the ground plane using keyboard input.

This step is complete only when the capy:

- moves with keyboard input
- stays grounded on the plane
- keeps playing animation while moving
- faces the movement direction
- remains stable with no jitter or sliding off-screen

---

## Prerequisite

Step 01 must already be working:

- scene loads
- capy model appears
- idle animation plays
- no loading errors

---

## Movement Controls

Implement keyboard movement using either:

- Arrow keys
- WASD

Preferred: support both.

### Required directions

- Up / W → move forward
- Down / S → move backward
- Left / A → move left
- Right / D → move right

---

## Movement Requirements

### Grounded movement

- The capy must remain on the ground plane.
- No jumping or vertical movement.
- Y position should remain fixed unless the model requires a fixed offset.

### Movement speed

Use a simple constant move speed.

Suggested starting value:

```text
1.5 to 2.5 units per second
```

### Frame-rate independence

Movement must use `delta time` from the render loop.

---

## Facing Direction

The capy should rotate to face the direction of movement.

Requirements:

- rotation should update when movement input changes
- turning can be immediate for now
- no smoothing required yet

---

## Animation Behavior

Keep the current idle animation working.

For this step, one of these is acceptable:

### Acceptable Option A
Keep the idle animation always playing, even while moving.

### Acceptable Option B
If the agent prefers, pause idle when no movement and play the same clip while moving.

Do **not** create a walk animation yet.

---

## Camera Behavior

For this step, the camera can remain fixed.

However, the capy must stay visible while moving around a reasonable area of the plane.

Do not implement camera follow yet unless necessary for visibility.

---

## Boundary Requirements

Add simple movement boundaries so the capy cannot move infinitely far away.

Suggested approach:

- clamp X and Z within a square area
- example range: `-6 to 6`

---

## Acceptance Criteria

This step is complete only if all of the following are true:

1. Arrow keys and/or WASD move the capy.
2. The capy remains grounded on the plane.
3. The capy rotates to face the movement direction.
4. Animation still plays without breaking.
5. The capy stays within a bounded area.
6. No major jitter, flipping, or drifting occurs.
7. No console errors appear.

---

## Notes for the Coding Agent

- Keep implementation simple.
- Do not add camera follow yet.
- Do not add collision with village objects yet.
- Do not add UI yet.
- Do not add new animations yet.

Focus only on:

- input
- movement
- facing direction
- stable scene behavior

---

## Deliverable

A running local web app where the capy can be moved around the ground plane with the keyboard.

After implementation, provide:

- the local URL
- a short summary of movement behavior
- any console errors if present

