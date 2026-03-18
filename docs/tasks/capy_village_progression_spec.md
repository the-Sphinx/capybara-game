# Capy Village — Progression System, Level Map UI, and Category Flow Spec

## Goal

Introduce a **real progression layer** to Capy Village without removing the existing fun, replayable minigame loop.

The game should now support:

- **Arcade Mode** and **Adventure Mode**
- multiple **game categories** (Watermelon Catch and Math for now, Language later)
- a **shared access point** via the existing pillar / wisdom-tree-style trigger
- a **category selection UI**
- a **mode selection UI**
- a **level map UI** for Adventure Mode
- JSON-based level definitions so content can be expanded easily
- a new **Math Equation Falling Answers** game mode inside the Math category

This milestone should create the progression framework that future content can plug into.

---

# 1. High-Level Product Decision

## Keep both game styles

### Arcade Mode
Purpose:
- fast replayable session
- coin farming
- casual play
- no win/lose level progression required

### Adventure Mode
Purpose:
- structured progression
- clear win conditions
- unlock next level on success
- milestone rewards later (stickers, medals, cosmetics, etc.)

This preserves the current fun loop while adding meaningful progression.

---

# 2. New Content Structure

The game should no longer feel like “one game with slightly different rules.”

Use this hierarchy:

```text
Minigame Hub
 ├── Watermelon Catch
 │    ├── Arcade
 │    └── Adventure
 │
 ├── Math Garden
 │    ├── Arcade
 │    └── Adventure
 │
 └── Language Grove
      ├── Arcade
      └── Adventure
```

Important distinction:

- **Category** = major minigame family
- **Mode** = Arcade or Adventure
- **Level** = one designed challenge in Adventure

---

# 3. Access Flow From Existing Pillar

For now, keep the **same pillar interaction object**.
Treat it as the global **Wisdom Tree / Minigame Hub**.

## Interaction Flow

Player presses interaction key near pillar:

```text
Press E to Play
```

This opens the **Minigame Hub Window**.

## Flow

```text
Pillar / Wisdom Tree
   ↓
Category Select
   ↓
Mode Select
   ↓
If Arcade: start arcade session
If Adventure: open level map
   ↓
Select unlocked level
   ↓
Start level
```

---

# 4. UI Flow Design

## 4.1 Minigame Hub Window

This is the first screen after interacting with the pillar.

### Purpose
Let the player choose a minigame category.

### Suggested layout

```text
┌─────────────────────────────────────────────┐
│              CAPY VILLAGE HUB               │
│        Choose a game category to play       │
│                                             │
│   [ Watermelon Catch ]                      │
│   Catch fruit and special items             │
│                                             │
│   [ Math Garden ]                           │
│   Solve number and equation challenges      │
│                                             │
│   [ Language Grove ]                        │
│   Letters, words, and reading games         │
│                                             │
│                        [ Close ]            │
└─────────────────────────────────────────────┘
```

### Notes
- Language category can appear as **Coming Soon** if not implemented yet.
- Each card should show:
  - title
  - short description
  - optional progress summary later

---

## 4.2 Mode Select Window

After selecting a category, show the mode menu.

### Suggested layout

```text
┌─────────────────────────────────────────────┐
│               WATERMELON CATCH              │
│                                             │
│   [ Adventure Mode ]                        │
│   Structured levels and progression         │
│                                             │
│   [ Arcade Mode ]                           │
│   Endless replay for coins and practice     │
│                                             │
│   [ Back ]                                  │
└─────────────────────────────────────────────┘
```

### Notes
- This same layout can be reused for all categories.
- Mode descriptions are important because players need to understand the difference.

---

## 4.3 Level Map UI (Adventure Mode)

This is the key missing piece in the current project.

### Purpose
Let players see progression visually.

## Recommended style
A cozy, simple **horizontal path with connected nodes**.

### Suggested first implementation
Use a **10-node track** for each category.
Later this can expand to 20, 50, 100+.

### Mockup

```text
┌────────────────────────────────────────────────────────────┐
│                  WATERMELON CATCH — ADVENTURE             │
│                                                            │
│   ●──●──●──●──●──●──●──●──●──🏆                            │
│   1  2  3  4  5  6  7  8  9 10                            │
│                                                            │
│   Selected Level: 4                                        │
│   Goal: Score 10                                           │
│   Time: 60s                                                │
│   Difficulty: Easy                                         │
│                                                            │
│   Reward Preview: coins now, medals/stickers later         │
│                                                            │
│   [ Play Level ]      [ Back ]                             │
└────────────────────────────────────────────────────────────┘
```

## Node states

### Locked
- dimmed
- not clickable
- shows lock icon

### Unlocked but not completed
- bright node
- clickable

### Completed
- checkmark / star fill / glow ring

### Current selected
- slightly enlarged
- pulsing outline

### Final milestone node
- trophy / medal / sticker icon instead of normal dot

---

# 5. Level Map UI Design Guidance

## Recommended visual behavior

- connected path line between level nodes
- each node shows number
- completed nodes visually different from unlocked nodes
- current selectable node highlighted
- info panel updates when selecting a node
- “Play Level” button disabled for locked levels

## Future extensibility
Later you can support:
- multiple pages
- scrolling tracks
- themed tracks per category
- sub-chapters

For now, keep it simple:
- 10 nodes
- single track
- one category at a time

---

# 6. Adventure vs Arcade Rules

## Arcade Mode
- no level map
- directly start current free-play version
- rewards coins
- supports practice
- can use current endless/randomized structure

## Adventure Mode
- level selected from map
- clear win condition
- clear lose/fail condition if needed
- level completion unlocks next level
- completion saved to persistent data

---

# 7. Required Save Data Extension

Extend current save format to support category progression.

## Suggested structure

```json
{
  "version": 2,
  "coins": 0,
  "ownedItems": [],
  "equipped": {
    "hat": null,
    "neck": null
  },
  "progress": {
    "watermelonCatch": {
      "completedLevels": [],
      "unlockedLevels": [1],
      "bestScores": {}
    },
    "mathGarden": {
      "completedLevels": [],
      "unlockedLevels": [1],
      "bestScores": {}
    },
    "languageGrove": {
      "completedLevels": [],
      "unlockedLevels": [1],
      "bestScores": {}
    }
  },
  "settings": {
    "soundOn": true,
    "musicOn": true
  }
}
```

## Required behavior
When a level is completed:
- mark level as completed
- unlock next level if it exists
- save immediately

---

# 8. JSON-Based Content Structure

All Adventure levels should be stored in JSON so they are easy to edit without changing gameplay logic.

Use separate files per category.

Suggested files:

```text
/data/levels/watermelonCatchLevels.json
/data/levels/mathGardenLevels.json
/data/levels/languageGroveLevels.json
```

---

# 9. Watermelon Catch — First 10 Adventure Levels

## Suggested level JSON

```json
[
  {
    "id": 1,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "score",
    "goalValue": 5,
    "timeLimit": 60,
    "spawnRate": 0.8,
    "fallSpeed": 1.0,
    "maxMisses": null,
    "specialItems": {
      "golden": false,
      "hourglass": false,
      "bomb": false
    },
    "label": "Welcome to Watermelon Catch"
  },
  {
    "id": 2,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "score",
    "goalValue": 8,
    "timeLimit": 60,
    "spawnRate": 0.9,
    "fallSpeed": 1.05,
    "maxMisses": null,
    "specialItems": {
      "golden": false,
      "hourglass": false,
      "bomb": false
    },
    "label": "A Little Faster"
  },
  {
    "id": 3,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "score",
    "goalValue": 10,
    "timeLimit": 60,
    "spawnRate": 1.0,
    "fallSpeed": 1.1,
    "maxMisses": null,
    "specialItems": {
      "golden": true,
      "hourglass": false,
      "bomb": false
    },
    "label": "Golden Surprise"
  },
  {
    "id": 4,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "catchCount",
    "goalValue": 10,
    "timeLimit": 60,
    "spawnRate": 1.0,
    "fallSpeed": 1.15,
    "maxMisses": null,
    "specialItems": {
      "golden": true,
      "hourglass": true,
      "bomb": false
    },
    "label": "Steady Hands"
  },
  {
    "id": 5,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "combo",
    "goalValue": 3,
    "timeLimit": 60,
    "spawnRate": 1.05,
    "fallSpeed": 1.15,
    "maxMisses": null,
    "specialItems": {
      "golden": true,
      "hourglass": true,
      "bomb": false
    },
    "label": "First Combo"
  },
  {
    "id": 6,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "score",
    "goalValue": 12,
    "timeLimit": 55,
    "spawnRate": 1.1,
    "fallSpeed": 1.2,
    "maxMisses": null,
    "specialItems": {
      "golden": true,
      "hourglass": true,
      "bomb": true
    },
    "label": "Watch Out for Bombs"
  },
  {
    "id": 7,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "score",
    "goalValue": 15,
    "timeLimit": 55,
    "spawnRate": 1.15,
    "fallSpeed": 1.25,
    "maxMisses": 4,
    "specialItems": {
      "golden": true,
      "hourglass": true,
      "bomb": true
    },
    "label": "Don’t Miss Too Many"
  },
  {
    "id": 8,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "catchCount",
    "goalValue": 14,
    "timeLimit": 50,
    "spawnRate": 1.2,
    "fallSpeed": 1.3,
    "maxMisses": 4,
    "specialItems": {
      "golden": true,
      "hourglass": true,
      "bomb": true
    },
    "label": "Quick Catching"
  },
  {
    "id": 9,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "combo",
    "goalValue": 5,
    "timeLimit": 50,
    "spawnRate": 1.2,
    "fallSpeed": 1.35,
    "maxMisses": 3,
    "specialItems": {
      "golden": true,
      "hourglass": true,
      "bomb": true
    },
    "label": "Combo Master"
  },
  {
    "id": 10,
    "category": "watermelonCatch",
    "mode": "classic",
    "goalType": "score",
    "goalValue": 20,
    "timeLimit": 45,
    "spawnRate": 1.3,
    "fallSpeed": 1.4,
    "maxMisses": 3,
    "specialItems": {
      "golden": true,
      "hourglass": true,
      "bomb": true
    },
    "label": "Track Champion"
  }
]
```

We 

---

# 10. Goal Types to Support

Implement generic goal types so future categories can reuse them:

- `score`
- `catchCount`
- `combo`
- `correctAnswers`
- `survival` 

## Suggested win conditions
- `score`: current score >= goalValue before timer ends
- `catchCount`: correct catches >= goalValue before timer ends
- `combo`: reach combo goalValue at least once during run
- `correctAnswers`: correct answers >= goalValue before timer ends

## Suggested fail condition
- time runs out before reaching goal
- optional secondary fail: exceeded `maxMisses` or `wrongAnswers`

---

# 11. Math Category Design

Category name:
**Math Garden**

This category should feel distinct from Watermelon Catch even if it reuses falling objects.

## Current math subgame to add now
**Catch the Correct Answer**
- equation shown at top
- multiple candidate answers begin falling at the same time
- player must catch the correct answer before the answers hit the bottom

This should be grouped under **Math Garden**, not under Watermelon Catch.

---

# 12. Math Equation Falling Answers — Core Design

## Basic loop
1. Show equation at top of screen
2. Spawn several answer candidates simultaneously
3. All candidates fall downward
4. Player catches one answer
5. If correct:
   - score/correct count increases
   - next question starts
6. If wrong:
   - count as wrong answer / miss opportunity / combo break if needed
7. If all answers reach bottom unanswered:
   - count as missed question
   - next question starts

## Difficulty axes
Difficulty can be controlled by:
- falling speed
- total time limit
- number of candidate answers
- equation difficulty
- numeric range
- addition vs subtraction

---

# 13. Math Garden — First 10 Adventure Levels

Suggested file:
`/data/levels/mathGardenLevels.json`

```json
[
  {
    "id": 1,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "addition",
    "numberRange": [1, 5],
    "digits": 1,
    "goalType": "correctAnswers",
    "goalValue": 5,
    "timeLimit": 60,
    "fallSpeed": 1.0,
    "answerCount": 3,
    "label": "Tiny Sums"
  },
  {
    "id": 2,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "addition",
    "numberRange": [1, 5],
    "digits": 1,
    "goalType": "correctAnswers",
    "goalValue": 6,
    "timeLimit": 60,
    "fallSpeed": 1.05,
    "answerCount": 3,
    "label": "More Tiny Sums"
  },
  {
    "id": 3,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "addition",
    "numberRange": [1, 9],
    "digits": 1,
    "goalType": "correctAnswers",
    "goalValue": 6,
    "timeLimit": 55,
    "fallSpeed": 1.1,
    "answerCount": 3,
    "label": "Single Digit Practice"
  },
  {
    "id": 4,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "subtraction",
    "numberRange": [1, 9],
    "digits": 1,
    "goalType": "correctAnswers",
    "goalValue": 5,
    "timeLimit": 55,
    "fallSpeed": 1.1,
    "answerCount": 3,
    "label": "First Subtractions"
  },
  {
    "id": 5,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "addition",
    "numberRange": [1, 9],
    "digits": 1,
    "goalType": "correctAnswers",
    "goalValue": 7,
    "timeLimit": 50,
    "fallSpeed": 1.15,
    "answerCount": 4,
    "label": "Four Choices"
  },
  {
    "id": 6,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "subtraction",
    "numberRange": [1, 9],
    "digits": 1,
    "goalType": "correctAnswers",
    "goalValue": 7,
    "timeLimit": 50,
    "fallSpeed": 1.15,
    "answerCount": 4,
    "label": "Quick Difference"
  },
  {
    "id": 7,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "addition",
    "numberRange": [10, 30],
    "digits": 2,
    "goalType": "correctAnswers",
    "goalValue": 6,
    "timeLimit": 50,
    "fallSpeed": 1.2,
    "answerCount": 4,
    "label": "Double Digit Start"
  },
  {
    "id": 8,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "subtraction",
    "numberRange": [10, 30],
    "digits": 2,
    "goalType": "correctAnswers",
    "goalValue": 6,
    "timeLimit": 45,
    "fallSpeed": 1.25,
    "answerCount": 4,
    "label": "Bigger Differences"
  },
  {
    "id": 9,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "addition",
    "numberRange": [10, 50],
    "digits": 2,
    "goalType": "correctAnswers",
    "goalValue": 7,
    "timeLimit": 45,
    "fallSpeed": 1.3,
    "answerCount": 5,
    "label": "Fast Math"
  },
  {
    "id": 10,
    "category": "mathGarden",
    "subgame": "fallingAnswers",
    "operation": "subtraction",
    "numberRange": [10, 50],
    "digits": 2,
    "goalType": "correctAnswers",
    "goalValue": 8,
    "timeLimit": 40,
    "fallSpeed": 1.35,
    "answerCount": 5,
    "label": "Math Garden Champion"
  }
]
```

---

# 14. Math Question Generation Rules

## Addition
Generate `a + b`

## Subtraction
Generate `a - b`

For early subtraction levels:
- ensure non-negative results
- choose `a >= b`

## Wrong answer generation rules
Wrong answers should:
- be close enough to be meaningful
- not duplicate the correct answer
- not duplicate each other
- remain positive for early levels

Example wrong-answer offsets:
- `+1`
- `-1`
- `+2`
- `-2`
- `+10` later for harder levels

---

# 15. Shared Level System Architecture

Create a generic level system that is category-agnostic.

## Suggested components

### `CategoryManager`
Responsibilities:
- list categories
- load category metadata
- open selected category

### `ModeSelectUI`
Responsibilities:
- show Arcade vs Adventure

### `LevelMapUI`
Responsibilities:
- load category levels
- show unlocked/completed state
- return selected level

### `LevelManager`
Responsibilities:
- load level JSON
- resolve selected level config
- pass level config into game runtime
- determine win/loss at end

### `SaveManager` extension
Responsibilities:
- check unlocked levels
- mark completion
- unlock next level

---

# 16. Suggested Category Metadata JSON

Create a category config file.

Example:
`/data/categories.json`

```json
[
  {
    "id": "watermelonCatch",
    "title": "Watermelon Catch",
    "description": "Catch fruit, dodge danger, and master combos.",
    "status": "available"
  },
  {
    "id": "mathGarden",
    "title": "Math Garden",
    "description": "Solve equations before the answers reach the ground.",
    "status": "available"
  },
  {
    "id": "languageGrove",
    "title": "Language Grove",
    "description": "Letters, words, and reading games.",
    "status": "comingSoon"
  }
]
```

---

# 17. Suggested Implementation Order

## Phase 1 — Category and Mode UI
1. Create category data file
2. Build Minigame Hub window
3. Build Mode Select window
4. Wire pillar interaction to open hub

## Phase 2 — Adventure Framework
1. Create generic LevelMapUI
2. Create LevelManager
3. Extend save data for completed/unlocked levels
4. Load level JSON by category
5. Enable “Play Level” flow

## Phase 3 — Watermelon Adventure
1. Add first 10 Watermelon Catch levels
2. Implement goal evaluation
3. Implement unlock progression
4. Save results

## Phase 4 — Math Garden Adventure
1. Build Falling Answers subgame
2. Add first 10 Math levels
3. Reuse same Adventure framework
4. Save results

---

# 18. UI Generation Guidance

## Minimum viable generated UI
Need these screens:
- CategorySelectModal
- ModeSelectModal
- LevelMapModal
- LevelInfoPanel

## Visual tone
Should match existing cozy Capy Village style:
- rounded panels
- soft shadows
- warm colors
- big readable buttons
- friendly, child-safe spacing
- playful but not noisy

## Recommended layout behavior
- modal centered on screen
- semi-transparent dark overlay behind
- keyboard and mouse friendly
- easy back navigation

---

# 19. Final Recommendation Summary

Build the game around this loop:

```text
Pillar
 → Category Select
 → Mode Select
 → If Arcade: start free play
 → If Adventure: open level map
 → Select unlocked level
 → Play
 → Win/lose
 → Save progress
 → Unlock next level
```

This is the missing progression layer that the game currently needs.

Do not add new village objects yet.
Do not add rocket mode yet.
Do not expand accessories yet.

First establish the progression system cleanly, because all future content will rely on it.

---

# 20. Deliverables Expected From Coding Agent

## Systems
- category system
- mode select system
- level map system
- level manager
- save/progress extension

## Content
- first 10 Watermelon Catch Adventure levels
- first 10 Math Garden Adventure levels
- category metadata JSON

## UI
- hub category modal
- mode select modal
- level map modal
- level info panel

## Gameplay
- support Adventure win conditions
- keep Arcade mode intact
- add Math Falling Answers subgame
