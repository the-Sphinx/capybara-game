# Capy Village — Camera Follow (Soft Dead-Zone System)

## Goal
Make the camera follow the capybara smoothly without breaking composition.

The camera should:
- NOT be rigidly locked to the player
- NOT stay completely static
- Follow only when needed
- Move smoothly (no snapping)

---

## CORE IDEA — DEAD ZONE

Define an invisible box around screen center:

- If capy stays inside → camera does NOT move
- If capy exits → camera smoothly follows

---

## STEP 1 — SETUP FOLLOW TARGET

```js
const target = capy.position;
```

---

## STEP 2 — DEFINE OFFSETS

```js
const cameraOffset = new THREE.Vector3(0, 6, 8); // keep your current angle
```

---

## STEP 3 — DEAD ZONE SETTINGS

```js
const deadZone = {
  x: 1.5,
  z: 1.5
};
```

---

## STEP 4 — CAMERA UPDATE LOGIC

Inside your animation loop:

```js
const desiredPosition = target.clone().add(cameraOffset);

// difference between camera and player
const dx = target.x - camera.position.x;
const dz = target.z - (camera.position.z - cameraOffset.z);

let moveX = 0;
let moveZ = 0;

// check dead zone
if (Math.abs(dx) > deadZone.x) {
  moveX = dx - Math.sign(dx) * deadZone.x;
}

if (Math.abs(dz) > deadZone.z) {
  moveZ = dz - Math.sign(dz) * deadZone.z;
}

// apply smoothing
camera.position.x += moveX * 0.05;
camera.position.z += moveZ * 0.05;

// always look at center (or player)
camera.lookAt(target);
```

---

## STEP 5 — SMOOTHING TUNING

Adjust responsiveness:

- slower:
```js
* 0.03
```

- faster:
```js
* 0.08
```

---

## STEP 6 — KEEP HEIGHT CONSTANT

Do NOT change Y:

```js
camera.position.y = 6;
```

---

## ACCEPTANCE CRITERIA

- [ ] Camera does NOT move when player makes small movements
- [ ] Camera follows when player moves far
- [ ] No snapping or jitter
- [ ] Composition remains similar to current
- [ ] Player never leaves screen

---

## OPTIONAL (LATER)

- add slight rotation follow
- add camera bounds clamp
- add subtle camera lag

---

END OF TASK
