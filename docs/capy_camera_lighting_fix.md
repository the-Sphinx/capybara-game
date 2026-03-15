
# Capy Village — Camera & Lighting Fix (Concrete Instructions)

This document gives **very specific instructions** for adjusting the camera and lighting in the current prototype village.

Do NOT redesign the environment.  
Do NOT change huts, trees, props, or layout.

Only adjust:
- camera
- lighting
- sky/background

The goal is to make the scene feel like a **miniature toy diorama** similar to the reference village.

---

# PART 1 — Camera Setup

Modify the main gameplay camera using the following exact settings.

## Camera Position

Use a **3/4 elevated view**.

Camera rotation:

X rotation: **40 degrees downward**  
Y rotation: **0 degrees** (or facing center of plaza)  
Z rotation: **0**

Camera distance from player:

**10–14 world units**

The camera should always look slightly downward at the player and the plaza.

---

## Field of View

Set:

FOV = **40**

Do not use wide FOV values like 60–75 because they distort the toy look.

---

## Player Framing

The player should NOT be centered.

Instead:

- player position on screen ≈ **lower 35–40% of screen**
- this leaves space to see huts and plaza ahead

---

## Camera Follow

Enable smooth follow.

Recommended parameters:

follow smoothing = **0.1–0.2**  
rotation smoothing = **0.15**

The camera should move smoothly, not snap.

---

# PART 2 — Lighting Setup

Replace current lighting with the following configuration.

---

## Directional Light (Sun)

Create or adjust a directional light.

Rotation:

X = **45°**
Y = **30°**
Z = **0°**

Color:

warm sunlight tone

RGB suggestion:

255 / 236 / 200

Intensity:

**1.2 – 1.4**

Shadow softness:

soft shadows enabled

---

## Ambient Light

Ambient lighting should prevent harsh darkness.

Use a soft sky tone.

RGB suggestion:

170 / 200 / 255

Intensity:

**0.35 – 0.45**

---

## Shadow Strength

Shadows should not be too dark.

Set shadow strength to around:

**0.4 – 0.5**

---

# PART 3 — Background / Sky

If the background is currently black:

Replace it with a simple sky color.

Suggested color:

RGB

200 / 225 / 255

This prevents the scene from feeling like it floats in darkness.

Optional later:

- stylized clouds
- distant hills

But not required for now.

---

# PART 4 — Do NOT Modify

During this step do NOT change:

- huts
- trees
- props
- paths
- plaza
- NPCs
- models
- materials

Only camera and lighting.

---

# PART 5 — Visual Verification Checklist

After implementing the changes, verify the following:

### Camera

- camera angle ≈ 40° downward
- player sits slightly below screen center
- plaza and huts are clearly visible
- no strong perspective distortion

### Lighting

- sunlight feels warm
- shadows are soft
- objects are not too dark
- environment feels cozy

### Background

- no black background
- scene sits inside a soft sky color

---

# Required Agent Output

After completing the task, respond with:

### Camera Settings Applied
(list final camera values)

### Lighting Settings Applied
(list final light values)

### Remaining Issues
(any visual problems still visible)

### Status
PASS / NEEDS ADJUSTMENT
