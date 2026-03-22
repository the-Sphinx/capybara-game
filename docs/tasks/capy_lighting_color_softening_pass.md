# Capy Village — Lighting + Color Softening Pass (STRICT TASK)

## Goal
Transform the current scene from a clean 3D render into a **warm, soft, toy-like diorama**.

This pass must improve:
- warmth
- softness
- shadow feel
- overall color harmony

without changing:
- camera
- layout
- props
- asset transforms
- gameplay

---

## HARD RULES

Do NOT change:
- camera position
- camera FOV
- camera target
- object positions
- object scales
- object rotations
- layout loading
- player logic

Only change:
- lights
- renderer tone/exposure
- sky/background color
- optional subtle fog if needed

---

# PART 1 — REMOVE OLD LIGHTING

Clear or disable previous lighting setup before applying the new one.

The new setup must be the only active runtime lighting.

---

# PART 2 — MAIN LIGHT (WARM SUN)

Create one main directional light.

Use exactly this as the starting point:

```js
const sun = new THREE.DirectionalLight(0xffefcf, 1.15);
sun.position.set(6, 10, 5);
sun.castShadow = true;
```

Shadow settings:

```js
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
sun.shadow.bias = -0.0005;
```

If shadow radius/blur is supported in the current setup, make shadows slightly softer.

## Intent
- warm but not orange
- readable
- soft
- toy-photography feel

---

# PART 3 — HEMISPHERE LIGHT (SOFT FILL)

Add a hemisphere light:

```js
const hemi = new THREE.HemisphereLight(
  0xe9f2ff, // sky fill
  0xc8c29b, // warm ground bounce
  0.85
);
```

## Intent
This is what removes the harsh, dry look and lifts shadowed areas.

Do NOT skip this light.

---

# PART 4 — VERY SOFT AMBIENT SUPPORT

Add a subtle ambient light:

```js
const ambient = new THREE.AmbientLight(0xffffff, 0.18);
```

This is just support. Keep it low.

---

# PART 5 — RENDERER SETTINGS

Set renderer values exactly like this as the starting point:

```js
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
```

If exposure still feels too dark:
- increase only slightly, up to `1.15`

If it feels washed out:
- decrease slightly, down to `1.0`

Do NOT make large jumps.

---

# PART 6 — SKY / BACKGROUND

Replace the current flat sky with a softer sky color.

Use:

```js
scene.background = new THREE.Color(0xdfeaf6);
```

This should feel:
- soft
- airy
- pastel
- non-distracting

Do NOT use saturated blue.

---

# PART 7 — OPTIONAL VERY SUBTLE FOG

Only if needed for softness, add extremely light fog:

```js
scene.fog = new THREE.Fog(0xdfeaf6, 18, 40);
```

Use only if it improves softness.
If it reduces clarity, remove it.

---

# PART 8 — SHADOW / CONTRAST GOAL

The final lighting should produce:

- no crushed blacks
- no harsh dramatic shadows
- warm top lighting
- soft readable forms
- gentle toy-like contrast

Reference feeling:
- handcrafted
- cozy
- photographed miniature
- not realistic / not harsh

---

# PART 9 — VISUAL ACCEPTANCE CHECKLIST

All of these must be true:

- [ ] Scene feels warmer than before
- [ ] Shadows are softer and less harsh
- [ ] Tree greens feel less aggressive
- [ ] Buildings feel more pastel / toy-like
- [ ] Center statue reads clearly
- [ ] Capy remains readable
- [ ] No washed-out overexposure
- [ ] Camera and composition remain unchanged

---

# PART 10 — WHAT NOT TO DO

Do NOT:
- change materials
- recolor meshes manually
- change camera
- add postprocessing bloom
- add strong color grading
- add dramatic rim lights
- add multiple directional lights

This must stay simple and clean.

---

# PART 11 — DELIVERABLE

After applying the pass, report:

1. Final directional light color/intensity/position
2. Final hemisphere light values
3. Final ambient intensity
4. Final tone mapping exposure
5. Whether fog was used
6. Short note on whether shadows became softer and scene warmer

---

# PART 12 — NEXT STEP AFTER THIS

After this lighting pass is approved, the next step will be:

## Camera follow reintroduction
using a **soft dead-zone follow** on top of the now-locked diorama camera.

That follow system must preserve this composition as much as possible.

---

END OF TASK
