# Capy Village — Master Capybara Character Modeling Specification

This document describes how to generate the **Master Capybara Character** for the game **Capy Village**.

The character should be created in **Blender**, exported as **GLB**, and designed to support animation and accessories later.

The character must follow the proportions and structure described below.

---

# Reference Image

Use the following image as the visual reference for modeling.

![Capy Turnaround](capy_turnaround_reference.png)

The sheet shows the following views:

- Front
- 3/4 Front
- Side
- 3/4 Back
- Back

The model should match the overall proportions and silhouette of this character.

---

# Modeling Style

The character should follow these rules:

- Stylized
- Toy-like proportions
- Smooth surfaces
- No sharp edges
- No realistic fur texture
- Minimalist design
- Suitable for a children's game

---

# Blender Scene Setup

Units: Metric  
Scale: 1 meter  

Target character height: **0.8 meters**

---

# Character Proportions

Use these approximate ratios.

| Part | Size |
|-----|------|
| Body length | 1.5 |
| Body height | 1 |
| Head radius | 0.35 |
| Snout radius | 0.22 |
| Leg height | 0.20 |
| Ear radius | 0.08 |

---

# Required Model Structure

The character must be built from **separate objects**.

Do NOT merge them.
capy
├ body
├ head
├ snout
├ ear_L
├ ear_R
├ leg_FL
├ leg_FR
├ leg_BL
└ leg_BR


---


# Materials

Use **three materials only**. No textures required.

### Fur

Color: `#E3A68C`

### Snout

Color: `#D89075`

### Eyes

Color: `#2B2B2B`

Apply **smooth shading** to the meshes.

Blender operation:

Right Click → Shade Smooth

---

# Polycount Target

Keep geometry lightweight.

This model is intended for a **web-based game**.

---

# Export Settings

Export format: **GLB**

Export options:

- Apply transforms: enabled
- Include normals: enabled

File name:

capy_base.glb

---

# Result Expectations

The final character should:

- Match the reference silhouette
- Be smooth and rounded
- Be composed of simple shapes
- Be lightweight
- Be suitable for animation later

This model will be used as the **base character for all future skins and accessories in Capy Village**.
