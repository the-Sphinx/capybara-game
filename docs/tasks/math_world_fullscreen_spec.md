# Capy Village — Math World Select (Full-Screen Simplified Version)

## Goal

Implement a **full-screen Math World selection screen** using the Math Garden image.

This version:
- removes the right-side panel
- uses the world image as the primary UI
- renders minimal, clean overlays directly on wooden signs
- focuses on clarity and playful interaction

---

## Core Design Principles

- Image-first UI
- Minimal text
- Strong visual feedback
- Child-friendly clarity
- Reusable for future worlds

---

## What to Render on Each Sign

Each sign contains ONLY:

### 1. World Title

### 2. Progress Indicator (row below title)

Use **5 garden-themed icons (flowers recommended)**

- 10 levels total
- 1 icon = 2 levels
- half-lit icon = 1 level

---

## Locked World State

Display:

- Title
- Lock icon centered

---

## Interaction Model

### Hover
- subtle glow or brightness increase (entire island)

### Selected
- slightly stronger glow

### Click (Unlocked)
- enter world

### Click (Locked)
- show popup message

---

## Clickable Areas

Clickable region should include:
- sign
- surrounding island/patch

---

## Sign Box Mapping

Use user-provided final sign bounding boxes.

---

## Rendering Approach

Render background full-screen and overlay absolute-positioned UI.

---

## Layout Inside Each Sign

- top 50% → title
- bottom 50% → progress icons or lock

---

## Visual Style

- warm tones
- soft shadows
- rounded, kid-friendly

---

## Acceptance Criteria

- full-screen image
- no right panel
- working interactions
- correct progress display
- locked behavior works

---

## Final Note

This should feel like exploring a world, not a menu.
