# Capy Village — Toy Village Conversion Blueprint (Step by Step)

## Goal

Transform the current prototype village into a **cohesive toy-like educational village** closer to the warm reference style, without rebuilding the core game systems.

This plan assumes:

- keep current capy player
- reuse existing minigame and UI systems
- use the current capy model for NPCs at first
- add a central **book statue** or **wisdom tree** later when the final model is found
- prioritize **camera**, **lighting**, **colors**, and **layout** first

---

# High-Level Strategy

Do this in **small visual passes** instead of trying to rebuild the entire village at once.

Recommended order:

1. Camera pass
2. Lighting + color pass
3. Ground + road layout pass
4. Central hub pass
5. Building placement pass
6. Decoration pass
7. NPC pass
8. Polish / atmosphere pass

This order gives the biggest visual improvement fastest.

---

# Phase 1 — Camera Pass (Most Important)

## Goal
Make the game instantly feel like a **small toy village diorama**.

## Current Problem
The prototype camera feels too plain and too close to a default gameplay camera.

## Target Feel
A camera that feels:
- slightly elevated
- gently angled downward
- cozy
- readable
- toy-like

## Recommended Camera Style

Use a **soft isometric-like third-person camera**, not a strict top-down and not a flat side view.

### Suggested direction
- camera slightly above the capy
- camera tilted downward
- camera pulled back enough to show nearby roads and buildings
- avoid very wide FOV because it makes the world feel less toy-like

## Suggested starting values
These are starting points only:

- FOV: **35 to 45**
- vertical tilt: **35° to 50° downward**
- distance from player: **medium**, enough to see the next branch in the road
- slight camera smoothing / damping

## Camera behavior
- smooth follow, not rigid
- no sudden snaps
- keep capy slightly below center screen so more of the village is visible ahead
- clamp extreme rotation for consistency

## Important rule
Do not let the camera become too realistic or too free.
The world should feel like a designed miniature set.

---

# Phase 2 — Lighting and Color Pass

## Goal
Create the **warm handcrafted toy look**.

## Current Problem
The prototype uses simple colors and default-feeling lighting, so objects feel disconnected.

## Target Feel
- warm sunlight
- soft shadows
- gentle contrast
- pastel / toy palette
- readable, cheerful mood

## Recommended Lighting Setup

### Main directional light
Acts like warm afternoon sun.

Suggested characteristics:
- warm yellow/orange tint
- soft shadows
- angled from upper left or upper right

### Ambient / hemispheric fill
Prevents harsh darkness.

Suggested characteristics:
- soft sky-blue upper contribution
- warm ground bounce
- low contrast

### Optional subtle fog
A very light atmospheric haze can unify the scene.

Do not make it heavy.
Just enough to soften the far background.

## Color Direction

Use a limited consistent palette:

- warm wood browns
- straw / hay yellows
- soft grass greens
- warm cream ground tones
- gentle sky blue
- muted accent colors for signs / roofs / accessories

Avoid:
- highly saturated neon colors
- dark realistic shadows
- harsh black outlines
- overly shiny materials

## Material direction
Everything should feel:
- matte
- soft
- rounded
- toy-like

Reduce metallic / glossy feeling.
Use rougher materials.

---

# Phase 3 — Ground and Road Layout Pass

## Goal
Replace the “objects on a flat field” feeling with a **planned village layout**.

## Recommended Layout
Build a **small circular plaza** around the central hub.

### Layout concept

```text
                  [ Language Hut ]

         tree                         tree

[ Math Hut ]   [ Central Book / Wisdom Tree ]   [ Watermelon Hut ]

         tree                         tree

                  [ Future / Reward Hut ]
```

## Roads
Use curved or radial paths connecting:
- central hub
- each category hut
- a few decorative side branches

## Ground design
Split the ground into clear zones:
- central plaza
- grass areas
- footpaths
- small garden patches

## Recommendation
Use lighter path color than grass so the village reads clearly from the elevated camera.

---

# Phase 4 — Central Hub Pass

## Goal
Create a memorable focal point.

## Temporary solution
Until the final model is found, use a placeholder central landmark:

- raised circular platform
- simple pedestal
- placeholder book object
- or placeholder tree trunk + canopy

## Final target
One of these:
- **Wisdom Book statue**
- **Wisdom Tree**
- possibly a book-on-fountain hybrid if it fits your world style

## Function
This central object should become the main “all minigames” interaction point for now.

This keeps the workflow simple while the village art evolves.

---

# Phase 5 — Category Huts / Buildings Pass

## Goal
Make the village feel like it has places with meaning.

## Initial buildings to add
- Watermelon Catch hut / stand
- Math Garden hut
- Language Grove hut
- one optional extra hut for future content or rewards

## Design style
All buildings should share:
- rounded toy proportions
- warm wood
- simple roofs
- oversized readable silhouettes

They do not need realism.
They need charm and clarity.

## Visual identity suggestions

### Watermelon Catch
- fruit crate / orchard stand vibe
- green-red sign accent

### Math Garden
- number blocks / abacus / counting sign
- slightly more structured shapes

### Language Grove
- book / letter blocks / scroll sign
- softer scholarly feeling

## Important rule
Even if buildings are simple, keep:
- consistent scale
- same material family
- same visual language

---

# Phase 6 — Decoration Pass

## Goal
Make the world feel handcrafted and alive.

## High-value decorations
These give strong improvement for low effort:

- fences
- sign posts
- flower patches
- bushes
- small rocks
- bunting flags
- benches
- lamp posts or lantern posts
- stacked blocks or crates
- tiny garden props

## Placement strategy
Do not scatter randomly.
Decorations should:
- frame roads
- mark hut entrances
- soften empty corners
- reinforce category themes

## Very important
Leave some open space.
A toy village feels best when readable, not cluttered.

---

# Phase 7 — NPC Pass

## Goal
Make the village feel inhabited.

## Initial solution
Use the same capy model with:
- different fur colors
- different hats / scarves / accessories
- a few scale tweaks if useful

## Simple NPC behaviors
Do not build complex AI yet.

Use simple loops like:
- walk between 2 points
- pause
- turn
- walk back

Optional behaviors:
- stand near hut entrance
- sit near bench
- circle the central plaza
- idle near the book statue

## Suggested first NPC roles
- student capy
- gardener capy
- traveler capy
- reader capy
- fruit seller capy

Even if they do not interact deeply, they add huge charm.

---

# Phase 8 — Polish and Atmosphere Pass

## Goal
Push the scene from “playable” to “cozy”.

## Add small ambient motion
Recommended:
- flags sway gently
- trees sway slightly
- tiny floating dust / pollen particles in sunlight
- subtle cloud motion
- idle bob for certain decorative props if it fits

## Audio
Later, add:
- soft village ambience
- birds
- gentle wind
- occasional page flutter near the book hub

## UI-world consistency
Match the world palette with your HUD and menus.
The game will feel much more unified.

---

# Recommended Immediate Build Order (Fastest Visual Wins)

## Day 1 / Pass A
- improve camera
- improve lighting
- choose palette
- add better ground / path layout

## Day 2 / Pass B
- place central hub
- add 3 category huts
- position them in circular arrangement

## Day 3 / Pass C
- add fences, signs, bushes, flowers, blocks
- add 3 to 5 NPC capys

## Day 4 / Pass D
- tweak spacing, scale, materials, shadows
- add subtle ambient motion

This sequence gives a huge improvement quickly.

---

# Camera Notes for Coding Agent

The camera is the highest priority visual system change.

## Requirements
- maintain gameplay readability
- feel like a miniature diorama
- slightly elevated angle
- smooth follow
- no harsh snapping
- avoid overly wide perspective

## Test checklist
The camera is “correct” if:
- roads and buildings ahead are visible
- the village feels small and toy-like
- player movement is easy to read
- the central hub can be appreciated visually

---

# Art Direction Rules

Use these rules for all new assets and placement decisions:

1. Prefer rounded silhouettes over harsh angular forms
2. Prefer matte materials over glossy materials
3. Keep scale exaggerated and cute
4. Use a limited warm palette
5. Make the village readable from the chosen camera angle
6. Favor charm over realism
7. Keep the world compact and dense enough to feel intentional

---

# Minimal Deliverables for the Next Visual Milestone

The next milestone should include:

- new camera settings
- new lighting setup
- circular village layout
- central placeholder hub
- 3 category huts
- basic roads / paths
- 3–5 decorative clusters
- 3 NPC capys with simple looping movement

If these are done well, the game will already feel much closer to the target toy-village vision.

---

# Final Recommendation

Do not try to perfect the final village immediately.

First create a **strong miniature village composition** using simple assets and strong camera / lighting decisions.
Once the composition feels right, better models and props can be added gradually without changing the game structure.
