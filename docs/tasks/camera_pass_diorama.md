# 📷 Camera Pass — Toy Village Diorama (STRICT TASK)

## ❗ Goal
Transform the current gameplay camera into a **toy-like diorama camera**.

The camera must:
- show most of the village
- reduce perspective distortion
- feel like a **miniature scene photographed from above**
- still allow player movement without losing visibility

---

## 🚫 Hard Rules (DO NOT VIOLATE)

- ❌ DO NOT change lighting
- ❌ DO NOT change materials
- ❌ DO NOT change layout or props
- ❌ DO NOT add/remove objects
- ❌ DO NOT modify player logic

Only camera behavior and parameters are allowed.

---

## 🎯 Step 1 — Replace Camera Setup

```js
camera.fov = 30;

camera.near = 0.1;
camera.far = 1000;

camera.position.set(0, 14, 18);
camera.lookAt(0, 0, 0);

camera.updateProjectionMatrix();
```

---

## 🎯 Step 2 — Fix Camera Angle (Diorama Style)

Camera must:
- be angled downward (~35–45 degrees)
- not top-down
- not eye-level
- slightly tilted toward center

---

## 🎯 Step 3 — Implement Soft Follow (Dead Zone System)

```js
const DEAD_ZONE_RADIUS = 2.5;

const delta = player.position.clone().sub(cameraTarget);

if (delta.length() > DEAD_ZONE_RADIUS) {
  const move = delta.multiplyScalar(0.08);
  cameraTarget.add(move);
}

camera.position.x = cameraTarget.x;
camera.position.z = cameraTarget.z + 18;
camera.lookAt(cameraTarget);
```

---

## 🎯 Step 4 — Clamp Camera Movement

```js
cameraTarget.x = Math.max(-6, Math.min(6, cameraTarget.x));
cameraTarget.z = Math.max(-6, Math.min(6, cameraTarget.z));
```

---

## 🎯 Step 5 — Remove Perspective Distortion

- Keep FOV ≤ 35
- Move camera further instead of increasing FOV

---

## 🎯 Step 6 — Composition Requirement

- Center statue visible
- 70% of village visible
- Player always visible
- Toy-like diorama feeling

---

## ✅ Acceptance Checklist

- [ ] Village fits inside frame
- [ ] No wide-angle distortion
- [ ] Smooth camera motion
- [ ] Player always visible
- [ ] Diorama feeling achieved

---

## 📌 Deliverable

- Updated camera code
- Explanation of FOV, distance, smoothing
