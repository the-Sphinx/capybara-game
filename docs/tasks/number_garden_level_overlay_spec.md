# Capy Village — Level Node Overlay & Info Bubble Spec

## Goal

Implement an **interactive level map system** using:
- full-screen background image
- selectable level nodes (stones)
- lightweight info bubble (no panels)

---

## 1. Node Structure

Each node consists of:

- base: stone (from image)
- overlay:
  - level number (center)
  - optional lock icon (overlayed)
  - optional glow (current level)

---

## 2. Node States

### Completed
- number visible
- slightly dim glow OR checkmark (optional)

### Current
- number visible
- soft golden glow
- slight pulse animation

### Locked
- number visible but dimmed
- semi-transparent lock icon centered over number

---

## 3. Always-Visible Info (Minimal)

Each node shows:
- number (center)

Optional:
- small coin icon + value near node (only if readable)

---

## 4. Interaction

### Hover (desktop)
- slight brightness increase
- subtle scale (1 → 1.05)

### Tap / Click
- open info bubble
- highlight node

---

## 5. Info Bubble (Core Component)

### Behavior
- appears near selected node
- disappears on:
  - clicking elsewhere
  - selecting another node

### Positioning
- anchored to node center
- offset upward

```js
function getBubblePosition(node) {
  return {
    x: node.x,
    y: node.y - 0.08
  };
}
```

---

## 6. Info Bubble Layout

Unlocked:

Level 4 — Even Numbers  
Find all even numbers  

💰 12 coins  
⭐ Bonus: +4 / +6  

[ Play ]

Locked:

🔒 Locked  
Complete Level 3 first  

💰 12 coins  
⭐ Bonus: +4 / +6  

---

## 7. Visual Style

### Bubble
- rounded rectangle
- soft shadow
- warm cream background (#FFF3D6)

### Text
- dark brown (#5A3E2B)
- friendly rounded font

### Button
- green rounded button
- subtle shadow

---

## 8. Animation

### On appear
- fade + scale (0.95 → 1)

### On disappear
- quick fade

---

## 9. Data Model

```js
{
  id: 4,
  title: "Even Numbers",
  description: "Find all even numbers",
  reward: 12,
  bonus: [4, 6],
  isLocked: false,
  unlockCondition: "Complete Level 3"
}
```

---

## 10. Acceptance Criteria

- nodes clickable
- overlay numbers visible
- lock state works
- bubble appears near node
- no screen resizing
- map remains full-screen
- interaction feels responsive

---

## Final Note

This system keeps the map clean while still exposing all level information dynamically.
