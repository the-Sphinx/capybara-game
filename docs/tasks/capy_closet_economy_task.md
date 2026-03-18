# Task: Add Watermelon Coin Economy + Item Ownership to Capy Closet

## Goal

Turn the current Capy Closet from a pure preview/equip screen into a real progression system.

Add:

- watermelon coin currency
- item prices
- locked / owned / equipped states
- buy logic
- data-driven accessory registry

This step should **not** add minigames yet.
It should prepare the system so minigames can later award coins.

---

# Current State

The project already has:

- working Capy Closet UI
- tabs for accessory categories
- preview panel
- equip logic
- accessory attachment in Three.js

Currently all items are effectively free and immediately available.

---

# What This Task Should Add

## 1. Watermelon Coin Counter

Add a visible coin counter to the closet UI.

Display style example:

- `120 🍉`
- or a small watermelon icon plus number

Recommended placement:

- top-right of closet panel
- or near the title bar

The style should match the cute UI.

---

## 2. Central Accessory Registry

Create a data file to drive the closet UI.

Recommended file:

`public/data/accessories.json`

Example structure:

```json
{
  "hats": [
    {
      "id": "crown",
      "name": "Crown",
      "file": "/assets/crown.glb",
      "price": 120
    },
    {
      "id": "beanie",
      "name": "Beanie",
      "file": "/assets/beanie.glb",
      "price": 40
    },
    {
      "id": "chef_hat",
      "name": "Chef Hat",
      "file": "/assets/chef_hat.glb",
      "price": 80
    }
  ],
  "neck": [
    {
      "id": "scarf",
      "name": "Scarf",
      "file": "/assets/scarf.glb",
      "price": 60
    }
  ]
}
```

The closet UI should generate item cards from this file instead of hardcoded items.

---

## 3. Player Economy / Inventory State

Create a simple player state object for now.

It can be stored in JS first.
Local persistence can come later.

Example:

```javascript
const playerState = {
  coins: 120,
  ownedItems: ["beanie", "scarf"],
  equipped: {
    hats: "beanie",
    neck: "scarf"
  }
};
```

Notes:

- `coins` = current watermelon coin count
- `ownedItems` = items already purchased
- `equipped` = currently equipped item by category

---

## 4. Item States in the UI

Each item card should show one of these states:

### Locked
Item not owned yet.

Show:
- price
- lock indicator or dimmed style

Example:
- `Crown`
- `120 🍉`
- small lock icon

### Owned
Item purchased but not equipped.

Show:
- `Owned`
- normal bright appearance

### Equipped
Currently equipped item.

Show:
- checkmark
- highlighted border

### Previewed
Currently selected in preview but not yet bought/equipped.

Show:
- selected highlight only

Important:
`previewed` and `equipped` are not always the same.

---

## 5. Buy / Equip Button Logic

The bottom button should change depending on the selected item.

### If selected item is locked
Button text:

`BUY`

Behavior:
- if player has enough coins:
  - subtract price
  - add item to ownedItems
  - keep it selected
  - optionally auto-equip after purchase
- if not enough coins:
  - button disabled or show “Not enough 🍉”

### If selected item is owned
Button text:

`EQUIP`

Behavior:
- equip item in that category
- replace previously equipped item in same category

### If selected item is already equipped
Button text:

`EQUIPPED`

Behavior:
- disabled or non-interactive

---

## 6. Selection / Preview Behavior

Keep the current preview system, but change the behavior to support buying.

### When clicking an item card
- item becomes selected
- preview panel updates immediately
- world capy does NOT change yet unless item is equipped
- bottom button updates based on locked/owned/equipped state

### When pressing BUY
- purchase item
- update coins
- mark item owned
- optionally auto-equip

### When pressing EQUIP
- apply item to actual world capy
- update equipped state
- update UI

---

## 7. World Capy vs Preview Capy

Keep the existing idea:

- preview capy = shown in closet preview window
- world capy = actual gameplay capy

Important behavior:

- selecting item only affects preview capy
- equipping item updates world capy

This distinction must remain.

---

## 8. Default Starting State

Use a simple starter state for now.

Recommended:

- coins: `120`
- owned by default:
  - `beanie`
  - `scarf`
- locked:
  - `crown`
  - `chef_hat`

This creates an immediate test case:
- some items can equip
- some items require purchase

---

## 9. UI Additions Needed

Update the current closet UI to include:

- coin display
- price display on locked items
- lock / owned / equipped visual states
- dynamic BUY / EQUIP / EQUIPPED button label
- disabled button state when not enough coins

Keep the cute visual style from the current closet.

---

## 10. Recommended File / System Structure

Suggested structure:

- `public/data/accessories.json`
- `src/data/playerState.js` or equivalent
- `src/ui/closet/` components or equivalent
- `src/game/accessories/` or equivalent

Do not over-engineer.
A simple clean structure is enough.

---

## 11. Nice-to-Have (only if easy)

If simple to add, show a tiny feedback when buying:

- small pop animation
- `-80 🍉`
- item card changes from locked to owned

This is optional.
Do not block the task on fancy animation.

---

# Success Criteria

This task is complete when:

1. Closet items come from `accessories.json`
2. Coin counter is visible
3. Locked items show prices
4. Buying an item decreases coins
5. Bought items become owned
6. Owned items can be equipped
7. Equipped item updates the real world capy
8. Preview and equip remain separate
9. The UI still looks cute and polished

---

# Important Notes

- Do not add minigames yet
- Do not add store interior yet
- Do not add persistence unless it is trivial
- Focus on making the reward / purchase / equip loop real

This is the first true progression layer of the game.
