# Capy Village — Task: Toy Ground + Warm Lighting Pass

## Goal

Transform the current scene from a prototype look into a **toy-like miniature village** by:

1. Replacing the flat green ground
2. Implementing warm, soft lighting

This task should dramatically improve visual quality **without changing assets**.

---

# PART 1 — GROUND REPLACEMENT (HIGH IMPACT)

## REMOVE

- Existing flat green plane

---

## CREATE NEW GROUND SYSTEM

### 1. Base Ground

Create a **large soft base platform**

Properties:
- shape: circular or slightly rounded square
- scale: large enough to contain village
- color: warm desaturated green or beige

Example:
```js
color: 0xbfd8a6 // soft green
```

---

### 2. Ground Material (IMPORTANT)

Use MeshStandardMaterial:

```js
new THREE.MeshStandardMaterial({
  color: 0xbfd8a6,
  roughness: 0.9,
  metalness: 0.0
})
```

---

### 3. Add Subtle Variation (VERY IMPORTANT)

DO NOT leave ground flat.

Add:
- slight color variation OR
- second slightly darker/lighter plane
- OR vertex color noise (simple)

Goal:
👉 break uniform flatness

---

### 4. Central Plaza (Optional but Recommended)

Under the statue:

- create circular platform
- slightly raised
- color: light beige

```js
color: 0xe8d8b5
```

---

### 5. Soft Edge Illusion

Optional but powerful:

- slightly scale down top surface
- add darker ring underneath

👉 creates "toy base" feeling

---

# PART 2 — LIGHTING (CRITICAL)

## REMOVE OLD LIGHTS

Clear all previous lights.

---

## ADD NEW LIGHT SETUP

### 1. Directional Light (Sun)

```js
const sun = new THREE.DirectionalLight(0xfff2cc, 1.2);
sun.position.set(5, 10, 5);
sun.castShadow = true;
```

Shadow settings:

```js
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
```

---

### 2. Hemisphere Light (Soft Fill)

```js
const hemi = new THREE.HemisphereLight(
  0xfff5d6, // warm sky
  0x9dbf87, // ground bounce
  0.6
);
```

---

### 3. Ambient Light (Very Soft)

```js
const ambient = new THREE.AmbientLight(0xffffff, 0.2);
```

---

# PART 3 — RENDERER SETTINGS (IMPORTANT)

Ensure:

```js
renderer.physicallyCorrectLights = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
```

---

# PART 4 — SHADOW QUALITY

Ensure meshes:

```js
mesh.castShadow = true;
mesh.receiveShadow = true;
```

Ground:

```js
ground.receiveShadow = true;
```

---

# PART 5 — COLOR CHECK (CRITICAL)

After implementation:

### EXPECTED RESULT

- NO green/yellow color cast
- colors match Blender look
- warm sunlight tone
- soft shadows
- readable details

---

# PART 6 — ACCEPTANCE CRITERIA

This task is complete if:

✔ Ground is no longer flat  
✔ Scene feels soft and warm  
✔ Colors look natural (not washed/green)  
✔ Shadows are visible but soft  
✔ Scene feels like a toy base  

---

# PART 7 — DO NOT DO

- Do NOT add textures yet
- Do NOT add complex shaders
- Do NOT change asset materials
- Do NOT overcomplicate

---

# NEXT STEP

After this:

👉 Camera composition  
👉 Scene population (trees, props)

---

# END
