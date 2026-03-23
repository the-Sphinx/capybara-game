# Capy Village — World Roles & Interaction Mapping Task

## Goal

Turn the village from a visual scene into a **playable world with clear destinations**.

This task assigns **gameplay roles** to existing and newly added props:
- Central statue (book fountain) → Game Hub (Wisdom Place)
- Hat Stand → Boutique (Cosmetics / Closet)
- Watermelon Stand → Watermelon Catch game

Important:
- DO NOT redesign the camera system
- DO NOT change core architecture
- DO NOT add heavy UI overlays
- Keep everything **diegetic (in-world)** and minimal

---

## File Scope

Main expected edits:
- `capy-village/src/main.js`
- `capy-village/src/ui.js`
- (possibly interaction helpers if separated)

---

## OBJECT ROLE ASSIGNMENTS

### 1. Wisdom Place (Central Statue)

Object:
- Book fountain at center

Behavior:
- Acts as **main entry point to game hub**

On interaction:
```js
openHub();
```

Prompt text:
- "Explore Knowledge"

---

### 2. Hat Stand → Boutique

Object:
- Newly added hat stand

Behavior:
- Opens closet / cosmetic shop

On interaction:
```js
openModal("store");
```

Prompt text:
- "Browse Hats"

---

### 3. Watermelon Stand → Game Entry

Object:
- Newly added watermelon stand

Behavior:
- Directly launches watermelon game

On interaction:
```js
launchGame("watermelon_catch");
```

Prompt text:
- "Play Watermelon Catch"

---

## INTERACTION SYSTEM

### Proximity Detection

Use existing interaction system (do not rewrite).

If not centralized yet:
- detect nearest interactable within radius (~2.5–3 units)

---

### Prompt Display

When player is near an interactable:
- show a **small floating prompt**

Example:
- "Press E to Explore Knowledge"
- "Press E to Browse Hats"
- "Press E to Play Watermelon Catch"

Requirements:
- lightweight (no big panels)
- fade in/out
- anchored near bottom center OR above object

---

### Input

Use existing input system:
```js
if (key === "E") {
  triggerInteraction();
}
```

Do not introduce new control schemes.

---

## VISUAL FEEDBACK (VERY SUBTLE)

When player is near an interactable:

Apply ONE of the following (keep it minimal):
- slight scale pulse (1.0 → 1.05)
- very soft glow/emissive increase
- tiny floating icon above object

Do NOT:
- add bright outlines
- add aggressive animations
- break stylized look

---

## INTERACTABLE REGISTRATION

Create or extend a simple structure:

```js
const interactables = [
  {
    object: wisdomStatue,
    action: () => openHub(),
    label: "Explore Knowledge"
  },
  {
    object: hatStand,
    action: () => openModal("store"),
    label: "Browse Hats"
  },
  {
    object: watermelonStand,
    action: () => launchGame("watermelon_catch"),
    label: "Play Watermelon Catch"
  }
];
```

---

## SELECTION LOGIC

Each frame:
1. Compute distance to each interactable
2. Pick closest within threshold
3. Set as `activeInteractable`

---

## INTERACTION FLOW

On key press:
```js
if (activeInteractable) {
  activeInteractable.action();
}
```

---

## CLEAN UX RULES

- Only ONE prompt visible at a time
- No permanent HUD elements added
- No coin counter added to main screen
- Keep screen visually clean

---

## OPTIONAL (LOW PRIORITY)

If quick to implement:
- add tiny bounce animation when entering proximity
- add soft sound cue on interaction

Do NOT add audio systems if not already present

---

## ACCEPTANCE CRITERIA

1. Player can walk to:
   - statue → opens hub
   - hat stand → opens boutique
   - watermelon stand → starts game

2. Each location:
   - shows correct prompt
   - responds to interaction key

3. Only one interaction is active at a time

4. Visual style remains:
   - soft
   - minimal
   - uncluttered

5. No regressions in:
   - camera behavior
   - movement bounds
   - performance

---

## TESTING CHECKLIST

- Approach each object slowly
- Approach diagonally
- Stand between two objects → nearest one should be selected
- Spam interaction key → should not crash or duplicate UI
- Enter/exit multiple times

---

## FINAL NOTE

This task is about **making the world readable and playable**, not adding UI complexity.

Keep everything:
- simple
- soft
- intentional
- consistent with the cozy village aesthetic
