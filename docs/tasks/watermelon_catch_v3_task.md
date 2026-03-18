# Task: Upgrade Watermelon Catch into a Configurable Educational Game (v3)

## Goal

Evolve Watermelon Catch from a single arcade minigame into a reusable educational game framework with configurable rule modes.

This version should add:

- a configurable mode system
- visual polish improvements
- the first educational mode
- support for future difficulty / level progression

The idea is to turn Watermelon Catch into a game family, not just one fixed game.

---

# Current State

The project already has:

- BaseGame architecture
- GameManager
- world interaction launch flow
- Watermelon Catch v2:
  - falling watermelons
  - variable falling speeds
  - timer
  - scoring
  - results
  - coin rewards

Now we want to build on top of this rather than creating a second separate game too early.

---

# High-Level Design

Watermelon Catch should now be treated as a configurable catch / selection game engine.

Instead of being a single hardcoded minigame, it should support different rule sets.

Think of it as:

- one core gameplay engine
- multiple educational modes
- future levels / difficulty progression

---

# 1. Add a Mode Config System

Create a config file or config structure for Watermelon Catch modes.

Suggested file:

`src/games/configs/watermelonCatchModes.js`

The purpose of this file is to make it easy to add new educational modes later without rewriting the core game.

Each mode should define things like:

- id
- title
- subject
- prompt / instructions
- layout type
- item type
- scoring / answer rules
- future difficulty metadata

---

# 2. Recommended Core Separation

Split the game into these conceptual layers:

## A. Presentation Layer
How the items look:
- watermelon
- numbers
- icons

## B. Layout Layer
How items appear:
- falling one-by-one
- falling multiple
- static grid
- future variations

## C. Rule Layer
What counts as correct:
- click any watermelon
- click even numbers
- click multiples of 3
- click the answer to 3 + 5
- future multi-select rules

This separation is important for scalability.

---

# 3. First Educational Mode to Add

Do not add every mode yet.

For v3, add one first educational mode safely:

### Mode: Catch Even Numbers

Behavior:

- falling items are numbers instead of watermelons
- prompt says:

`Catch even numbers`

- player gains score only for clicking even numbers
- clicking odd numbers should count as wrong
- missed numbers simply disappear

This is the safest first educational upgrade because it keeps the same gameplay flow as v2.

---

# 4. Mode Selection

Each time the player launches Watermelon Catch, the game should start in one mode.

For now, support these two modes:

1. Classic Watermelon Catch
2. Catch Even Numbers

Mode choice can be:

- random each time
- or manually set in config during development

Random is preferred if simple.

At game start, display the selected mode title / prompt clearly.

Examples:

`Catch even numbers`

`Catch the watermelons!`

---

# 5. Visual Polish Pass

The current visuals are functional but temporary.

Improve the presentation without overcomplicating implementation.

Recommended improvements:

## A. Brighter / Cleaner Play Area
- make the inner game area more playful and readable
- reduce the heavy/dark feeling
- consider a soft sky or garden-like background inside the minigame panel

## B. Better Item Presentation
- make watermelons / numbers easier to read and click
- add slight drop shadow or pop effect

## C. Feedback
Add small moment-to-moment feedback:

- correct click → small `+1` or success pop
- wrong click → small red flash / shake / `Oops!`
- caught item disappears with tiny pop animation if easy

## D. Timer / Score Readability
Keep score and time clear and visible at the top.

Optional but nice:
- timer bar
- subtle urgency near the end

---

# 6. Wrong Answer Logic

In educational mode:

If player clicks the wrong item:

- do not award score
- optionally count as wrong click
- show small negative feedback

Keep punishment light for now.

Examples:

- small red flash
- tiny shake
- optional `Wrong` text

Do not make it frustrating.

---

# 7. Result Screen Improvements

When the game ends, result screen should reflect the mode.

Example:

Watermelon Catch Results
Mode: Catch Even Numbers

Score: 12
Caught: 12
Missed: 4
Wrong Clicks: 3

Coins Earned: +6 🍉

This will make the educational layer feel integrated.

---

# 8. Prepare for Difficulty / Levels

Do not build the full level system yet, but structure the game so it can support progression.

Future examples:

- Level 1 → identify numbers
- Level 2 → even / odd
- Level 3 → addition
- Level 4 → subtraction
- Level 5 → multiplication
- Level 6 → division / multiples / factors

For now, simply include placeholders in the config structure such as:

- difficulty
- level
- subject
- unlock order

The code does not need full progression UI yet, but should be built with this in mind.

---

# 9. Suggested Future Modes (Not Yet)

Do not implement these all now, but structure for them:

- Catch odd numbers
- Catch multiples of 3
- Catch numbers divisible by 2
- Catch the answer to 3 + 5
- Catch the answer to 7 - 2
- Pick two numbers that add to 5
- Static number selection mode

Only implement the first educational mode now.

---

# 10. Recommended File Structure

Suggested structure:

`src/games/WatermelonCatchGame.js`
`src/games/configs/watermelonCatchModes.js`

Use equivalent project structure if needed.

The main point is:

- core game code separate from mode definitions

---

# 11. Success Criteria

This task is complete when:

1. Watermelon Catch supports a mode config system
2. The game can run at least two modes:
   - classic watermelon mode
   - catch even numbers mode
3. Educational mode has correct / wrong answer logic
4. The prompt updates according to mode
5. Visual polish is improved
6. Result screen reflects the active mode
7. The architecture is ready for future levels / educational expansion

---

# 12. Notes for the Coding Agent

- Keep v3 focused and clean
- Do not add too many modes at once
- Preserve the existing working game architecture
- Build for scalability
- Prioritize one strong educational mode over many weak modes

This task turns Watermelon Catch into the first true educational game system in the project.
