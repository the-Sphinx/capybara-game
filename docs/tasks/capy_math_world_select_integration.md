# Capy Village — Math World Select Integration (Using Mapped Sign Boxes)

## Goal

Implement the **Math World Select** screen using the finalized **Math Garden background image** and the **manually fixed sign-box coordinates** provided by the user.

This task should make the screen:
- visually attractive
- data-driven
- interactive
- reusable for future game themes

The user has already finalized:
- the background image: "math_garden_v3.png" in assets/game_ready/images
- the sign box coordinates: see below for the corrected mapping

Use those user-provided coordinates as the source of truth.

---

## Scope

Implement:
- Math Game → World Select screen
- background image rendering
- interactive world patch selection
- sign overlay rendering using mapped boxes
- right-side details panel
- locked/unlocked/current/completed state visuals
- open-world action for unlocked worlds

Do NOT implement:
- level map inside each world
- passport
- capy level
- store locks
- new reward logic
- new world art generation

---

## Assets

Use the finalized Math Garden world background image provided by the user.

Do NOT swap it for another generated image.

The sign box coordinates have already been manually corrected by the user.
Use those exact coordinates.

---

## Data Model

Use a reusable world-select data shape.

Example:

```js
{
  id: "addition_field",
  title: "Addition Field",
  subtitle: "Add and grow",
  levelsTotal: 10,
  levelsCompleted: 2,
  starsEarned: 2,
  starsMax: 3,
  isLocked: false,
  isCurrent: true,
  isCompleted: false,
  unlockRequirementText: "",
  signBox: { x: 0, y: 0, w: 0, h: 0 }
}
```

The actual `signBox` values should come from the user-finalized coordinate map.

---

## Required Worlds

Use these initial worlds for Math:

```js
const MATH_WORLDS = [
  { id: "number_garden", title: "Number Garden", subtitle: "Odd, even, divisible" },
  { id: "addition_field", title: "Addition Field", subtitle: "Add and grow" },
  { id: "subtraction_patch", title: "Subtraction Patch", subtitle: "Take away" },
  { id: "multiplication_meadow", title: "Multiplication Meadow", subtitle: "Groups and times" },
  { id: "division_grove", title: "Division Grove", subtitle: "Split fairly" },
  { id: "geometry_yard", title: "Geometry Yard", subtitle: "Shapes and space" }
];
```

---

## Sign Box Mapping

The user has already corrected the sign-box coordinates manually.

### Important:
- Do NOT re-estimate the boxes
- Do NOT use older coordinates from planning
- Do NOT recalculate from image analysis

Create the world overlays using the **user-provided final sign box mapping**.

Corrected sign box mapping:

```js
const MATH_WORLD_SIGN_BOXES = {
  "Number Garden": {
    "x": 0.1298,
    "y": 0.2964,
    "w": 0.1081,
    "h": 0.0526
  },
  "Subtraction Patch": {
    "x": 0.1739,
    "y": 0.4725,
    "w": 0.109,
    "h": 0.0537
  },
  "Division Grove": {
    "x": 0.1986,
    "y": 0.7319,
    "w": 0.126,
    "h": 0.0649
  },
  "Multiplication Meadow": {
    "x": 0.5023,
    "y": 0.5444,
    "w": 0.111,
    "h": 0.0532
  },
  "Addition Field": {
    "x": 0.359,
    "y": 0.2856,
    "w": 0.0999,
    "h": 0.0463
  },
  "Fraction Forest": {
    "x": 0.7386,
    "y": 0.3564,
    "w": 0.1003,
    "h": 0.0439
  },
  "Geometry Yard": {
    "x": 0.7822,
    "y": 0.7334,
    "w": 0.1289,
    "h": 0.0629
  }
}

```

Use normalized coordinates.

---

## Rendering Model

### Background Layer
Render the Math Garden image as the world map background.

### Overlay Layer
Render absolutely positioned overlay boxes on top of each wooden sign.

These overlay boxes should display:
- title
- stars
- progress OR lock state

The overlay content must be dynamic and driven by save/progress data.

---

## Overlay Content Rules

### Unlocked world
Show:
- world title
- stars row
- progress like `2/10`

Example:

```text
Addition Field
★★☆
2/10
```

### Locked world
Show:
- world title
- lock indicator
- short label like `Locked`

Do NOT put a long unlock sentence on the wooden sign.
That belongs in the details panel.

Example:

```text
Geometry Yard
🔒 Locked
```

### Completed world
Show:
- world title
- full stars or completion mark
- `10/10`

### Current / Recommended world
Show same as unlocked, but apply a subtle visual emphasis.

---

## World Selection Interaction

### Hover / focus
When the pointer hovers over a world area or sign:
- slightly brighten the selected patch/sign
- optionally add a soft glow or outline
- keep it subtle
- do NOT scale aggressively
- do NOT pulse constantly

### Click / tap
Clicking a world should:
- set it as selected
- update the right-side details panel
- if unlocked, enable `Open World`
- if locked, keep button disabled and show unlock requirement

---

## Clickable Areas

There are two acceptable approaches:

### Preferred
Use a world interaction region broader than just the sign.
The player should be able to click:
- the sign
- or the nearby world patch

This is more user-friendly.

### Minimal acceptable
At least make the sign itself clickable.

If broader regions already exist in code, reuse them.
If not, start with sign hit areas and expand later.

---

## Details Panel

Add or update a right-side details panel.

It should show:
- world title
- subtitle
- progress
- star summary
- lock state
- unlock requirement if locked
- action button

### Unlocked example
```text
Addition Field
Add and grow

Progress: 2/10
Stars: 2/3
Status: Unlocked

[ Open World ]
```

### Locked example
```text
Geometry Yard
Shapes and space

Progress: 0/10
Stars: 0/3
Status: Locked
Unlock: Complete Division Grove

[ Locked ]
```

---

## Open World Behavior

If the selected world is unlocked and the user presses `Open World`:
- enter that world’s level map screen

If the level map screen is not yet implemented:
- wire this through the current navigation stub / placeholder
- keep the transition path clean so it can be upgraded later

Do NOT block this task on the full level-map implementation.

---

## Visual Style

Keep the overlay style aligned with the image:
- warm
- rounded
- kid-friendly
- readable

Recommended styling:
- centered text
- dark brown text
- gold/yellow stars
- subtle shadow if needed
- no harsh outlines
- no modern flat UI look

---

## Layout Guidance for Sign Overlay Content

Inside each sign box:

- top area: title
- middle area: stars
- bottom area: progress or lock text

Keep the text compact.
Do not let it spill outside the wood sign face.

Use text truncation or smaller font size if necessary for longer world names.

---

## Responsiveness

The world-select UI should scale with the map container.

Important:
- overlays must remain locked to the sign positions
- do not anchor to viewport
- anchor to the image/container

Recommended approach:

```js
function boxToStyle(b) {
  return {
    position: "absolute",
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: `${b.w * 100}%`,
    height: `${b.h * 100}%`
  };
}
```

---

## State Source

Use current save/progression data where available.

If the full world progression system is not yet complete, create a lightweight mock/data adapter with:
- levels completed
- stars earned
- locked/unlocked state
- current world

The implementation should still be structured so real save data can replace the mock later.

---

## Reusability Requirement

Even though this task is for Math Garden, structure it so future games can reuse the same component with:
- a different background image
- different sign boxes
- different world metadata

Examples later:
- Geography → islands or continents
- Animals → habitats
- Language → forest/workshop/valley
- Science → lab zones or planets

So avoid hardcoding math-specific rendering logic into the generic world-select component.

---

## Acceptance Criteria

1. The finalized Math Garden image is used as the world-select background
2. The user-corrected sign boxes are used exactly
3. Each world sign displays dynamic state
4. Worlds are selectable
5. The selected world updates the details panel
6. Locked worlds can be previewed but not opened
7. Unlocked worlds can proceed to `Open World`
8. The screen feels polished, readable, and kid-friendly

---

## Testing Checklist

- verify each overlay lines up with the correct wooden sign
- verify overlays stay aligned when the container scales
- verify each world can be selected
- verify locked state displays correctly
- verify unlocked state displays correctly
- verify current world emphasis is visible but subtle
- verify right-side details panel updates correctly
- verify `Open World` is disabled for locked worlds
- verify no overlay text spills outside sign face

---

## Final Note

This task should turn the Math Garden image into a **fully interactive world-select screen** using the finalized sign-box mapping.

Treat the image as the art layer and the overlay/state system as the live UI layer.
