
# Task: Implement Capy Customization / Shop UI (Accessory Preview & Equip)

## Goal
Create a **Customization / Shop UI overlay** in the Three.js app that allows the player to:
- Browse cosmetic accessories
- Preview them on the capy character
- Equip one item per category (Hats / Neck)

This step validates the core cosmetic system before adding currency or store interiors.

For now this UI will be triggered when the player enters the building.

---

# Context

The project already has:
- A **capy character** with anchors:
  - `hat_anchor`
  - `neck_anchor`
- Accessories exported as separate `.glb` files:
  - `crown.glb`
  - `beanie.glb`
  - `chef_hat.glb`
  - `scarf.glb`

Accessories attach like:

```javascript
hatAnchor.add(hatModel)
neckAnchor.add(scarfModel)
```

The attachment pipeline is already working.

---

# UI Layout

Create a **UI overlay panel** that appears on the right side of the screen.

Sections:

## Header
Capy Closet

## Category Tabs
- Hats
- Neck

## Item Grid

Show square cards for items.

### Hats
- Crown
- Beanie
- Chef Hat

### Neck
- Scarf

Each card shows:
- icon / thumbnail
- item name

When clicked:
- item previews on capy immediately

---

# Equip Logic

Rules:

Only **one hat** equipped at a time.

Only **one neck item** equipped at a time.

Example behavior:

click Crown → Crown appears  
click Beanie → Crown removed → Beanie appears  

Same logic for neck items.

---

# Preview Behavior

When clicking an item:

1. Remove currently equipped item in that category
2. Load new accessory GLB
3. Attach to the correct anchor

Example:

```javascript
if(category === "hat"){
    hatAnchor.clear()
    hatAnchor.add(newHat)
}
```


---

# UI Implementation Notes

The UI can be implemented using:

- HTML + CSS overlay
- or a lightweight UI library if already used

Recommended simple structure:

```
<div id="closet-panel">
    <div class="tabs"></div>
    <div class="item-grid"></div>
</div>
```

The panel should be:
- clean
- colorful
- toy-like

---

# Visual Style

The UI should match the capy world style:

- playful
- rounded
- pastel colors
- cute icons

No dark / cyberpunk UI.

Think:

Animal Crossing  
Fall Guys  
Cozy mobile game  

There is a UI layout in docs/images/capy_closet_ui.jpeg for reference. If you can implement something very similar, that would be great.

---

# Deliverables

Working UI that allows:

- switching between Hats / Neck tabs
- previewing accessories
- equipping accessories
- replacing previously equipped items

No coin system yet.

This is **pure cosmetic preview + equip**.

---

# Future Extensions (not in this task)

Later we will add:

- watermelon coin cost
- locked items
- buy button
- inventory persistence

But **not yet**.
