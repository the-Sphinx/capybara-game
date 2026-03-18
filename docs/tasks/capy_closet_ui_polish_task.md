
# Capy Closet UI – Improvement Task

This document describes small but high‑impact UI improvements for the Capy Closet system.
These changes make the interface closer to modern game UI standards while keeping the
existing design and logic intact.

---

# 1. Status Row (Always Filled)

Every item card should always contain **three rows**:

1. Icon
2. Item name
3. Status row

The **status row must never be empty**.

### Possible Status Values

| State | Display |
|-----|-----|
| Locked | 🔒 Locked |
| Locked but purchasable | 120 🍉 |
| Owned | ✓ Owned |
| Equipped | ✓ Equipped |

Example card:

ICON  
Crown  
🔒 Locked

Another example:

ICON  
Beanie  
✓ Equipped

This avoids empty UI space and keeps cards visually consistent.

---

# 2. Color Coding for Item States

Add subtle color coding to improve readability.

| State | Color |
|-----|-----|
Locked | light gray |
Price | orange |
Owned | green |
Equipped | gold border + checkmark |

Example:

• Equipped item → yellow/gold border  
• Owned item → green label  
• Locked item → dimmed card

---

# 3. Selected Item Highlight

When an item is selected:

• Slight glow or yellow border  
• Card lifts slightly (scale 1.03)  
• Shadow becomes stronger

This improves clarity on mobile and desktop.

---

# 4. Action Button Behavior

Only **one main action button** exists under the item list.

Button text changes based on selected item state.

| Item State | Button |
|-----|-----|
Locked (enough coins) | BUY 120 🍉 |
Locked (not enough coins) | NOT ENOUGH 🍉 |
Owned | EQUIP |
Equipped | EQUIPPED ✓ |

Button should visually change:

• Disabled state → gray  
• Buy → orange  
• Equip → yellow  

---

# 5. Purchase Feedback Animation (Optional but Recommended)

When buying an item:

1. Coins briefly animate downward
2. Floating text appears:

-80 🍉

3. Card changes from:

🔒 Locked → ✓ Owned

This gives satisfying player feedback.

---

# 6. Item Hover / Tap Feedback

When hovering or tapping an item:

• card scale → 1.02
• slight shadow increase

This makes the interface feel responsive.

---

# 7. Equipped Item Glow

Equipped items should have:

• gold border
• small checkmark icon
• optional soft glow

This helps players instantly recognize what is active.

---

# 8. Maintain Current Preview Behavior

Important rule:

Selecting item → preview capy only

Pressing EQUIP → updates world capy

Do not merge these behaviors.

---

# Success Criteria

The UI improvement task is complete when:

1. Every card always shows a status row
2. Locked / Owned / Equipped states are clearly visible
3. The bottom button changes according to selected item
4. Selected item has visual highlight
5. Equipped item has gold border
6. UI remains cute and readable

---

# Result

These changes will make the Capy Closet feel more like a polished
mobile/indie game interface while keeping the current structure intact.
