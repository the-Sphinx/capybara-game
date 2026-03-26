# Capy Village — Locked Popup UX & Microcopy Spec

## Goal

Design a **contextual, kid-friendly locked feedback system** that:
- appears near the clicked world
- feels part of the game world (not UI overlay)
- is instantly understandable for children (6–8 yrs)

---

## 1. Trigger Behavior

When user clicks a locked world:

1. Do NOT navigate
2. Show contextual popup near clicked sign
3. Play soft feedback animation
4. Auto-dismiss after ~2 seconds OR on next interaction

---

## 2. Placement Rules (VERY IMPORTANT)

### Primary Rule
Popup should appear **anchored to the clicked world**

### Positioning Priority
1. Above the sign (preferred)
2. If no space → slightly offset left/right
3. NEVER overlap:
   - top "MATH GARDEN" sign
   - screen edges

### Implementation Tip

```js
function getPopupPosition(box) {
  return {
    x: box.x + box.w / 2,
    y: box.y - 0.05 // slightly above
  };
}
```

---

## 3. Popup Layout

Structure:

```
[ 🔒 ] Locked
Complete Number Garden first
```

### Layout Rules
- 2 lines max
- centered text
- compact width
- rounded bubble container

---

## 4. Microcopy Rules

### Title (line 1)
Always:
**Locked**

### Message (line 2)

Format:
**Complete {REQUIRED_WORLD} first**

Examples:
- Complete Number Garden first
- Complete Addition Field first

---

## 5. Visual Design

### Container
- rounded rectangle (border-radius: high)
- soft shadow
- slightly elevated (floating feel)

### Colors
- background: warm cream (#FFF3D6)
- text: dark brown (#5A3E2B)
- lock icon: muted golden/orange (#D9A441)

### Typography
- friendly rounded font
- medium weight for title
- regular for message

---

## 6. Animation

### On Appear
- fade in (150ms)
- slight scale (0.95 → 1.0)
- optional tiny bounce

### On Disappear
- fade out (120ms)

---

## 7. Interaction Feedback

When locked world is clicked:

1. show popup
2. slight “bump” animation on the sign:
   - scale: 1 → 0.97 → 1
3. optional soft “blocked” sound

---

## 8. Avoid These

❌ Full-screen modal  
❌ Top-center toast (current version)  
❌ Bright red warning colors  
❌ Long sentences  
❌ Multiple lines of explanation  

---

## 9. Optional Enhancement (Later)

- small arrow from popup pointing to sign
- subtle particle sparkle when unlocked worlds are clicked (contrast)

---

## 10. Acceptance Criteria

- popup appears near clicked world
- never overlaps UI header
- message readable in <1 second
- disappears automatically
- does not block interaction flow
- consistent across all worlds

---

## Final Note

This popup should feel like:
👉 the world itself is talking to the player

NOT like:
❌ a system error message
