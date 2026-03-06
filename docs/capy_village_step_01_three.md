# Capy Village — Step 01: Web Prototype Foundation

## Goal
Create a minimal browser-based prototype using **Vite + Three.js** that:

- loads `capy_idle.glb`
- shows a flat ground plane
- plays the idle animation automatically
- displays a simple sky-colored background
- uses a fixed camera angle suitable for a toy-like game

This step is complete only when the running web app visibly shows the capy model on the ground with the idle animation playing.

---

## Tech Stack

- Vite
- JavaScript
- Three.js

---

## Required Project Structure

```text
capy-village/
  public/
    capy_idle.glb
  src/
    main.js
  index.html
  package.json
```

Place the exported `capy_idle.glb` in the `public/` folder.

---

## Setup Requirements

Initialize the project with:

```bash
npm create vite@latest capy-village
```

Choose:

- Vanilla
- JavaScript

Then run:

```bash
cd capy-village
npm install
npm install three
npm run dev
```

---

## Scene Requirements

### Background
Use a soft sky-blue background.

Suggested color:

```text
#BFE3FF
```

### Camera
Use a perspective camera with a slightly elevated toy-like view.

Suggested starting values:

- FOV: 60
- position: `(3, 2, 5)`
- look at model origin

### Lighting
Use:

- 1 directional light
- 1 ambient light

Suggested directional light position:

```text
(5, 10, 5)
```

### Ground
Create a flat plane as the ground.

Suggested values:

- size: `20 x 20`
- color: `#88CC88`
- rotated flat on X axis

---

## Model Loading Requirements

Use `GLTFLoader` to load:

```text
/capy_idle.glb
```

When loaded:

- add the model to the scene
- keep default scale unless visually incorrect
- create an `AnimationMixer`
- play the first animation clip automatically

---

## Animation Requirements

- The first animation clip must autoplay.
- The capy should visibly idle/breathe.
- The animation mixer must update every frame using `clock.getDelta()`.

---

## Acceptance Criteria

This step is complete only if all of the following are true:

1. The browser opens successfully with Vite.
2. The capy model appears in the scene.
3. The capy stands on the ground plane.
4. The idle animation plays continuously.
5. The camera angle feels toy-like and readable.
6. No console errors appear related to loading or animation.

---

## Notes for the Coding Agent

- Keep the implementation minimal.
- Do not add movement controls yet.
- Do not add a village yet.
- Do not add UI yet.
- Focus only on scene setup, model loading, and animation playback.

---

## Deliverable

A running local web app where the capy model is visible and animated.

After implementation, provide:

- the local URL
- a screenshot of the scene
- any console errors if present

