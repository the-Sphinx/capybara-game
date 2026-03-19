# Capy Village — Task: Publish Pipeline + .gitignore Fix

## Goal

Stabilize the asset pipeline by:

1. Creating a **publish script** that copies runtime-ready assets and layouts into the game folder
2. Fixing `.gitignore` so the asset structure and metadata are preserved in the repo

This is a **small, focused task**. Do not refactor the entire project.

---

# Part 1 — Publish Script

## Script Name

Create:

tools/publish_assets.ts

## Purpose

Copy:

- assets/game_ready/** → capy-village/public/assets/
- layouts/** → capy-village/public/layouts/

This ensures the game loads only **published runtime assets**.

---

## Requirements

### 1. Clean target folders before copying

Before copying:

capy-village/public/assets/
capy-village/public/layouts/

- delete existing contents (not the folders themselves)

---

### 2. Recursive copy

Copy all files preserving folder structure:

Example:

assets/game_ready/models/buildings/hut_01.glb
→ capy-village/public/assets/models/buildings/hut_01.glb

---

### 3. Console output

Print clear logs:

[Publish] Copying assets...
[Publish] Copied: hut_01.glb
[Publish] Copying layouts...
[Publish] Done.

---

### 4. Error handling

Fail clearly if:
- source folders missing
- permission issues

Do NOT fail silently.

---

### 5. NPM command

Update root package.json:

"scripts": {
  "publish-assets": "node --experimental-strip-types ./tools/publish_assets.ts"
}

---

# Part 2 — Runtime Asset Manifest (Minimal)

Generate a simple manifest file during publish:

capy-village/public/assets/manifest.json

Example:

{
  "hut_01": "/assets/models/buildings/hut_01.glb",
  "book_statue": "/assets/models/center/book_statue.glb"
}

## Rules

- Use file name (without extension) as asset id
- Include only .glb files for now
- Path must be relative to /public

---

# Part 3 — .gitignore Fix

## Problem

Currently .gitignore ignores the entire assets/ directory.

This is too aggressive.

---

## Required Change

Update .gitignore to:

# Ignore heavy asset binaries
assets/**/*.glb
assets/**/*.fbx
assets/**/*.wav
assets/**/*.mp3
assets/**/*.ogg
assets/**/*.png
assets/**/*.jpg

# Keep structure and configs
!assets/**/
!assets/**/*.json
!assets/**/*.md

---

## Important

We want to keep:
- folder structure
- manifests
- configs
- pipeline scripts

We do NOT want to commit:
- large binary assets

---

# Part 4 — Success Criteria

This task is complete if:

- running npm run publish-assets:
  - clears and repopulates public/assets
  - copies layouts correctly
  - generates manifest.json

- .gitignore:
  - no longer hides the entire assets structure
  - still prevents large binaries from being committed

- game can load assets ONLY from:

/public/assets/
/public/layouts/

---

# Part 5 — Test Instructions

After implementation:

1. Run:
npm run publish-assets

2. Verify:
- files exist in capy-village/public/assets
- layouts exist in capy-village/public/layouts
- manifest is generated

3. Open game:
- ensure layout loads correctly
- ensure assets render correctly

---

# Notes

- Keep implementation simple
- Do NOT introduce build systems or bundlers
- Do NOT refactor existing asset pipeline
- This is just a clean bridge between pipeline and runtime

---

# End of Task
