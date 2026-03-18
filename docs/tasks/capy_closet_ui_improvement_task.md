
# Task: Improve Capy Closet UI (Preview Panel + Cuteness Pass)

## Context

The current implementation of the **Capy Closet** UI works functionally:

- Player can open the closet
- Player can select hats
- Selection immediately equips on the capy

However, the UI differs from the original design mockup in several important ways:

1. There is **no preview panel** for the capy.
2. The UI feels **less cute / toy-like** than intended.
3. The selection grid is correct but lacks visual polish.
4. The closet panel feels more like a tool menu than a playful game UI.

The attached screenshot shows the current implementation.

Goal of this task: **upgrade the closet UI to match the intended playful design.**

Referened mockup: docs/images/capy_closet_ui.jpeg

---

# Key Improvements Required

## 1. Add a Capy Preview Window

The UI must include a **preview area** showing the capy with the currently selected accessories.

This preview should appear **inside the closet UI panel**, not only in the world scene.

### Layout

Left side of the UI panel:

+--------------------------+
|                          |
|      CAPY PREVIEW        |
|                          |
|  (3D capy model)         |
|                          |
+--------------------------+

Right side of panel:

Accessory categories  
Item grid  
Equip button

### Preview Behavior

When the user selects an item:

click beanie → preview capy updates  
click crown → preview capy updates  

The world capy should **not equip immediately**.

Instead:

selection → preview  
press EQUIP → apply to real capy  

This creates a much nicer UX.

---

# 2. Selection vs Equipped State

Currently selection = equip.

We want:

### States

Previewed item  
- highlighted in UI

Equipped item  
- small checkmark icon

Example:

Beanie → highlighted (preview)  
Crown → checkmark (currently equipped)

---

# 3. Improve UI Cuteness / Style

The UI should feel like a **cozy casual game**.

### Visual improvements

Increase:

- rounded corners
- pastel gradients
- soft shadows
- playful icons

Reduce:

- flat panels
- hard edges


### Font style
Use a more playful font like the one in the original mockup:
- rounded
- bold
- slightly irregular (not perfectly uniform)

### Item style
The item icons in the grid should also be more playful:
- bigger
- rounded edges
- soft drop shadow
- pastel background tile
- we can definitely use the screenshots of the actual 3d items in a soft background tile for the icons, instead of the current flat icons

### Button style

Equip button should feel like a toy button:

rounded  
soft orange/yellow gradient  
slight bounce animation on hover  
paw icon

---

# 4. Accessory Icons

Icons should appear more playful.

Add:

- slight drop shadow
- rounded background tiles
- hover highlight

Example tile style:

soft rounded square  
pastel background  
item icon centered

---

# 5. Panel Layout Improvements

Current panel is too narrow and vertical.

Adjust proportions:

Preview panel: ~40%  
Item panel: ~60%

Example layout:

+--------------------------------------------------+
| Capy Closet                                      |
|                                                  |
|  [Preview Window]   |   Hats / Neck tabs         |
|                     |                            |
|                     |   Item Grid                |
|                     |                            |
|                     |   Equip Button             |
+--------------------------------------------------+

---

# 6. Category Tabs

Improve visual distinction between tabs.

Active tab should have:

highlight color  
raised look  
icon glow

Example:

[ Hats ]   Neck

---

# 7. Add Subtle UI Animations

Small animations greatly increase perceived quality.

Add:

- item hover scale (1.05x)
- equip button bounce
- tab switching slide animation

Animations should be **very subtle**.

---

# 8. Prepare for Future Features

Structure the UI so we can later add:

- watermelon coin price
- locked items
- unlock animations
- inventory persistence

Do not implement these yet.

---

# Technical Notes

The preview capy can be implemented this way:

Create a **second Three.js scene** rendered inside the UI preview panel.

The preview capy should:

- rotate slowly
- show currently previewed accessories

---

# Deliverables

Updated closet UI with:

✔ Capy preview panel  
✔ Selection vs equip state  
✔ Improved cute visual style  
✔ Animated buttons / hover states  
✔ Cleaner layout  

