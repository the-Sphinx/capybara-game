# Capy Village — Color and Lighting Reset (Concrete, Non-Interpretive)

## Purpose

Remove the current **green/yellow color cast** and restore a cleaner toy-village palette where:

- grass is green but not fluorescent
- straw roofs stay warm yellow
- wood stays warm brown
- the capybara's pink/beige body remains readable
- the whole scene feels warm and soft, not tinted by one dominant filter

This document is intentionally concrete.
Apply these settings first before making artistic tweaks.

---

# Important Rule

Do NOT move objects.
Do NOT redesign the environment.
Do NOT change camera in this step.

Only change:
- directional light
- ambient / hemisphere light
- background color
- renderer exposure / tone mapping if needed
- material tint values only if the current scene still looks heavily filtered

---

# Step 1 — Remove Strong Yellow/Green Bias

The scene currently appears to have a global yellow-green wash.
First remove or reduce any of the following if present:

- overly saturated warm directional light
- very strong yellow ambient light
- green fog tint
- green/yellow postprocessing color grading
- environment/background colors that contaminate the whole scene

If there is any postprocess color grading, disable it for now.

---

# Step 2 — Directional Light (Sun)

Use one main sun light with these values:

## Color
Set directional light color to approximately:

- `RGB(255, 244, 224)`

Hex equivalent:
- `#FFF4E0`

This should feel warm, but **not orange** and not deeply yellow.

## Intensity
Set intensity to:

- `1.0` initially

Allowed range:
- `0.9` to `1.15`

If roofs become too yellow, reduce intensity before changing colors.

## Rotation
Use a side-lit direction, for example:

- X rotation ≈ `45°`
- Y rotation ≈ `30°`

This gives form without flattening everything.

---

# Step 3 — Ambient / Hemisphere Fill

Use a neutral-soft fill light so shadows are readable and colors stay balanced.

## Preferred Hemisphere Setup

### Sky color
- `RGB(205, 225, 255)`
- Hex: `#CDE1FF`

### Ground color
- `RGB(235, 225, 205)`
- Hex: `#EBE1CD`

### Intensity
- `0.45`

Allowed range:
- `0.35` to `0.5`

Important:
The ambient light should **not** be green.
The ground bounce should be beige/cream, not yellow-green.

---

# Step 4 — Background / Clear Color

If the background is a strong yellow or black, replace it.

Set background / clear color to:

- `RGB(214, 232, 255)`
- Hex: `#D6E8FF`

This gives a soft sky-like backdrop and stops the scene from feeling dirty or tinted.

---

# Step 5 — Shadow Strength

Shadows should stay soft and readable.

If shadow darkness is adjustable, target:

- shadow strength around `0.4`

If shadows look muddy green, the issue is likely ambient color contamination. Fix the ambient first.

---

# Step 6 — Material Sanity Check

After lighting reset, verify these material reads:

- grass = soft medium green
- roofs = warm straw yellow
- wood walls = warm brown
- path = light stone / beige
- capy body = clearly distinct from ground and huts

If the capy still looks washed out or greenish:
- reduce ambient intensity slightly
- reduce roof/grass saturation if they overpower the character
- ensure capy material is not sharing a tinted parent material or environment tint

---

# Step 7 — Optional Renderer Settings

If your renderer supports exposure/tone mapping:

## Exposure
Start with:
- `exposure = 1.0`

Allowed range:
- `0.95` to `1.1`

## Tone mapping
Use a neutral filmic tone mapping if available.
Do not use aggressive color grading.

---

# Visual Validation Checklist

After applying the settings, verify all of these:

- The capy is easy to see against the ground
- The scene is not dominated by green/yellow tint
- The roofs still look warm, but not glowing yellow
- Grass looks green, but not neon
- Wood looks warm brown
- Shadows are soft and readable
- The scene feels warm and clean, not muddy

If any of these fail, do not mark the task as passed.

---

# Required Output

Report final values in this exact format:

## Final Lighting Values
- directional color = ?
- directional intensity = ?
- directional rotation = ?
- hemisphere sky color = ?
- hemisphere ground color = ?
- hemisphere intensity = ?
- background color = ?
- exposure = ?
- tone mapping = ?

## Validation
- capy clearly visible: YES / NO
- strong green/yellow cast removed: YES / NO
- roofs still warm: YES / NO
- grass natural-looking: YES / NO
- scene still feels cozy: YES / NO

## Status
PASS / NEEDS ADJUSTMENT

---

# Important Warning

Do NOT claim PASS unless:
- the capy is clearly readable
- the green/yellow wash is noticeably reduced
- the lighting feels balanced rather than tinted
