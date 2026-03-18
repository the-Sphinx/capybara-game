# Capy Village — Step 04: Placeholder Village Layout

## Goal
Extend the current prototype by replacing the empty ground plane with a simple toy-like village layout made from placeholder geometry.

This step is complete only when the prototype contains a readable mini village space with:

- a central walkable area
- several placeholder buildings
- simple path structure
- a few environmental props
- enough layout structure to feel like the beginning of a real village

This is a **layout step**, not a final art step.

---

## Prerequisite

Step 03 must already be working:

- capy loads correctly
- idle animation plays
- keyboard movement works
- camera follows smoothly
- no console errors

---

## Visual Direction

Use a **toy-like cozy village** style.

For this step, all assets may be simple placeholder geometry such as:

- boxes
- rounded boxes
- cylinders
- cones
- spheres
- simple colored meshes

Do not use final assets yet.

Do not spend time on polish yet.

The goal is spatial readability.

---

## Required Layout Elements

Implement a small village-like environment containing at least:

### 1. Central open area
A visible central area where the capy can stand and move comfortably.

### 2. Path structure
At least one visible path network using simple geometry or a differently colored ground surface.

Suggested path idea:

- one central path
- one cross path
- or a circular / hub-like path

### 3. Placeholder buildings
At least **3 placeholder buildings**, such as:

- Capy Store
- Boutique
- Bakery or House

Each building may be represented using simple box-based shapes.

Buildings should be visually distinct in size and/or color.

### 4. Environmental props
Add at least **5 simple props**, such as:

- trees
- bushes
- rocks
- signposts
- benches
- fence sections

Props can be repeated if needed.

---

## Ground and Path Requirements

### Ground
You may keep the existing green ground base, but the village area should no longer feel like one empty plane.

### Paths
Paths should be visually readable using one of these approaches:

- different colored flat meshes
- slightly raised geometry
- slightly lowered geometry
- simple path tiles

Suggested path color:
- warm beige / dirt-like

---

## Building Requirements

Each building should:

- sit above the ground correctly
- be placed intentionally, not randomly
- leave walkable space between structures
- help define a village layout

Suggested building construction:
- base box for walls
- smaller roof shape above
- optional door marker on front

Buildings do **not** need interiors.

Buildings do **not** need interaction yet.

---

## Environment Readability Requirements

The village should feel like:

- a small place with structure
- not just scattered objects on a flat plane
- easy to understand from the camera view

The capy should still remain easy to see while moving through the layout.

Do not overcrowd the scene.

---

## Collision Requirements

For this step, one of the following is acceptable:

### Acceptable Option A
Buildings are only visual and the capy can move through them.

### Acceptable Option B
Very simple collision boundaries are added around buildings.

Preferred for this step: **Option A**  
Keep it simple unless collision is very easy to add cleanly.

---

## Camera Requirements

The existing follow camera should continue to work correctly in the larger layout.

The village should fit well within the current toy-like camera style.

If small camera offset tweaks are needed for visibility, that is acceptable.

---

## Performance Requirements

The scene should remain lightweight and responsive.

Use very simple meshes and materials.

Do not add heavy textures, shadows, or post-processing yet.

---

## Acceptance Criteria

This step is complete only if all of the following are true:

1. The empty world is replaced by a small readable village layout.
2. At least 3 placeholder buildings are present.
3. At least 5 environmental props are present.
4. A visible path structure exists.
5. The capy can move through the village space.
6. The camera continues to follow correctly.
7. The village feels intentionally arranged rather than random.
8. No console errors appear.

---

## Notes for the Coding Agent

- Keep implementation simple and modular.
- Use primitive geometry only.
- Do not add final art assets yet.
- Do not add interaction yet.
- Do not add UI yet.
- Do not add collision unless it is trivial and stable.

Focus only on:

- readable village layout
- placeholder buildings
- placeholder props
- maintaining clean movement and camera behavior

---

## Deliverable

A running local or deployed web app where the capy moves inside a simple toy-like placeholder village.

After implementation, provide:

- the URL
- a short summary of the layout
- a screenshot or short screen recording
- any console errors if present