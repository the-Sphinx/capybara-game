# Math Garden — World-Aligned Level Redesign Instructions

## Objective

Replace the current **Math Garden** levels with a world-aligned progression that fits each world's actual theme and the current supported game mechanics.

Important:
- **Do not change `number_garden`**
- Keep the overall flavor of better progression:
  - tutorial → practice → variation → challenge → boss
  - rising difficulty through **thinking**, not just larger numbers
  - variety without becoming random or confusing
- **Make every level fit its world's theme**
- If a level concept does not truly fit a world with the current supported mechanics, **delete it rather than force it**

---

## Ground Truth You Must Respect

The current Math Garden manifest defines these world ids:

- `number_garden`
- `addition_field`
- `subtraction_patch`
- `multiplication_meadow`
- `division_grove`
- `geometry_yard`
- `fraction_forest`

The current supported Math Garden mode kinds are only:

### `collect_numbers`
Supports number rules like:
- `even`
- `odd`
- `prime`
- `divisible_by`

### `answer_equation`
Supports arithmetic answer play for:
- `addition`
- `subtraction`
- `mixed`

Per-level tuning belongs in:
- `overrides.rules`
- `overrides.scoring`

This means:
- Addition and subtraction worlds should primarily use `answer_equation`
- Multiplication and division worlds can reasonably use `collect_numbers` with divisibility logic
- Geometry and fraction content are **not well supported** by the current mechanics and should **not be faked** with unrelated prime/odd/mixed levels

---

## High-Level Design Decision

### Keep unchanged
- `number_garden`

### Redesign and keep
- `addition_field`
- `subtraction_patch`
- `multiplication_meadow`
- `division_grove`

### Remove existing mismatched levels
- delete any level in:
  - `subtraction_patch` that uses odd/even collection
  - `geometry_yard` that uses odd collection or multiples of 3
  - `fraction_forest` that uses generic mixed equations pretending to be fractions

### Recommendation for unsupported worlds
Because the current mechanics do not properly support geometry or fractions:
- either leave `geometry_yard.levels = []`
- and leave `fraction_forest.levels = []`

OR, if empty worlds are undesirable in the current UX:
- temporarily keep the worlds in the map
- but with no playable levels until proper geometry/fraction mode kinds exist

Do **not** shoehorn unrelated number gameplay into those worlds.

---

## Required Outcome

After your changes:

- `number_garden` remains unchanged
- all **playable** redesigned levels fit their world theme
- progression is clearer and less repetitive
- bonuses and rewards scale sensibly
- no world teaches the wrong concept
- unsupported themes are left empty instead of being misleading

---

# World-by-World Instructions

---

## 1. `number_garden`
### Action
- **Do not touch**
- Leave current levels as-is

Rationale:
- This world is already acceptable and aligned with its theme.

---

## 2. `addition_field`
### Theme
Addition only.
This world should teach comfort, fluency, and confidence with addition.

### Allowed mechanics
- `answer_equation`
- `rules.operation = "addition"`

### Do NOT use
- `mixed`
- subtraction
- primes
- odd/even collect modes
- divisibility collect modes

### Target progression
Build 10 levels with this shape:

1. **Warm-up tutorial**
   Small number range, low answer count, generous time, zero or low penalty.

2. **Easy fluency**
   Same concept, slightly higher goal.

3. **More distractors**
   Increase `answerCount` so the child must think, not just react.

4. **Higher range**
   Slightly larger addition range.

5. **Speed challenge**
   Same math concept, shorter time.

6. **Accuracy challenge**
   Slightly higher wrong penalty.

7. **Dense thinking**
   Larger range plus more answers on screen.

8. **Fast fluency**
   Slightly shorter time + higher goal.

9. **Pre-boss mixed difficulty inside addition only**
   Larger range, more answers, accuracy matters.

10. **Boss**
   Hardest addition level in this world: higher range, tighter time, stronger rewards.

### Difficulty principles
- Increase difficulty using:
  - `numberRange`
  - `answerCount`
  - `timeLimit`
  - `wrongPenalty`
  - `goal`
- Do not jump too sharply.
- Make levels 1–3 confidence-building.
- Make levels 4–7 genuine practice.
- Make levels 8–10 feel exciting.

### Reward guidance
For addition:
- `clearReward` should feel meaningfully better than Number Garden
- bonus tiers should reward good performance, not perfection only

Suggested pattern:
- early levels: modest clear reward, reachable first bonus
- mid levels: noticeable jump
- boss level: highest reward in world

---

## 3. `subtraction_patch`
### Theme
Subtraction only.
This world should focus on taking away, comparison, and slightly more effortful thinking than addition.

### Allowed mechanics
- `answer_equation`
- `rules.operation = "subtraction"`

### Remove immediately
Delete the current odd/even collection level in this world.
That level is a theme mismatch with `subtraction_patch`.

### Do NOT use
- `mixed`
- addition
- odd/even collect
- primes
- divisibility collect

### Target progression
Build 10 levels with this shape:

1. **Subtraction introduction**
   Small range, easy facts, generous time.

2. **Simple subtraction practice**
   Slightly bigger goal.

3. **Distractor pressure**
   More answer choices.

4. **Range increase**
   Slightly harder values.

5. **Accuracy checkpoint**
   Wrong answers matter a bit more.

6. **Speed checkpoint**
   Shorter time, still fair.

7. **Harder subtraction**
   Larger range and denser answer choices.

8. **Fast accuracy**
   Short time + meaningful penalty.

9. **Pre-boss**
   High focus, higher goal.

10. **Boss**
   Best subtraction challenge for the current system.

### Difficulty feel
Subtraction should feel:
- a little more demanding than addition
- not punishing too early
- satisfying when mastered

### Reward guidance
Rewards should be slightly higher than Addition Field overall because subtraction is cognitively a bit harder.

---

## 4. `multiplication_meadow`
### Theme
Multiplication through grouping and multiples.
With the current system, the best approximation is divisibility/multiples collection.

### Allowed mechanics
- `collect_numbers`
- `matcher = "divisible_by"`

### Recommended divisors
Use a progression such as:
- 2
- 3
- 4
- 5
- then mixed difficulty through range, density, and precision

### Do NOT use
- odd/even as the main theme except possibly divisor 2
- prime
- answer_equation addition/subtraction as the core identity
- unrelated mixed math

### Target progression
Build 10 levels with this shape:

1. **Multiples of 2 tutorial**
2. **Multiples of 3 practice**
3. **Multiples of 2 with more distractors**
4. **Multiples of 4 introduction**
5. **Multiples of 5 introduction**
6. **Multiples of 3 challenge**
7. **Multiples of 4 challenge**
8. **Fast multiples**
9. **Precision multiples**
10. **Boss: hardest divisibility collection in this world**

### Difficulty principles
For collect levels, increase challenge using:
- larger `numberRange`
- slightly tighter `timeLimit`
- higher `goal`
- more `itemCount`
- slightly stronger `wrongPenalty`

Do not make every level only “same divisor, bigger range.”
Rotate divisors and pacing.

### Fun factor
This world should feel lively and pattern-based, not like rote memorization only.

---

## 5. `division_grove`
### Theme
Division / sharing / divisibility.
With the current mechanics, the closest valid gameplay is also divisibility-based collection, but it should feel more exact and more thoughtful than Multiplication Meadow.

### Allowed mechanics
- `collect_numbers`
- `matcher = "divisible_by"`

### Important distinction from `multiplication_meadow`
This world should not just repeat Multiplication Meadow.
Make it feel more advanced by using:
- trickier divisors
- tighter time
- higher precision
- slightly stronger penalties
- larger ranges

### Recommended divisor progression
Possible set:
- 2
- 3
- 5
- 6
- 8
- 10

### Target progression
Build 10 levels with this shape:

1. **Divisible by 2 review**
2. **Divisible by 5 review**
3. **Divisible by 3 precision**
4. **Divisible by 6 introduction**
5. **Divisible by 10 introduction**
6. **Divisible by 8 challenge**
7. **Dense divisor challenge**
8. **Fast divisor challenge**
9. **High-accuracy divisor challenge**
10. **Boss: toughest divisibility level in current game**

### Design rule
Division Grove should feel like:
- more exact
- less forgiving
- more advanced than Multiplication Meadow

It is okay that both worlds use `divisible_by`, as long as their feel is different.

---

## 6. `geometry_yard`
### Theme
Shapes and space.

### Current system fit
**Not supported** by current mechanics.

Current supported mechanics do not provide:
- shape recognition
- polygon matching
- angle/spatial reasoning
- area/perimeter concepts

### Action
- Delete all current levels in `geometry_yard`
- set `levels` to an empty array

### Do NOT replace with
- odd/even levels
- prime levels
- multiples levels
- generic mixed arithmetic

Reason:
A wrong theme is worse than no content.

---

## 7. `fraction_forest`
### Theme
Pieces and parts / fractions.

### Current system fit
**Not properly supported** by current mechanics.

Current supported mechanics do not provide:
- fraction values
- equivalent fractions
- parts-of-whole visuals
- numerator/denominator comparisons

### Action
- Delete all current levels in `fraction_forest`
- set `levels` to an empty array

### Do NOT replace with
- mixed addition/subtraction
- prime levels
- divisibility levels
- generic number collection

Reason:
Fake fraction content will teach the wrong expectation.

---

# Progression and Balance Rules

## Difficulty curve
Across each active world:
- Levels 1–2: approachable
- Levels 3–4: familiar but slightly harder
- Levels 5–7: meaningful challenge
- Levels 8–9: high focus
- Level 10: boss / climax

## Avoid repetition
Do not create 10 levels that are only:
- same recipe
- same rule
- bigger range

Instead rotate challenge dimensions:
- time pressure
- goal pressure
- item count
- answer count
- wrong penalty
- range
- divisor

## Keep learning visible
Each world should clearly teach one idea:
- `addition_field` → addition
- `subtraction_patch` → subtraction
- `multiplication_meadow` → multiples / grouping
- `division_grove` → divisibility / precision

---

# Bonus and Reward Guidance

## General principle
Bonuses should be:
- reachable for a good player
- not trivial
- exciting enough to try again

## Suggested pattern
For each level:
- `clearReward` = baseline completion reward
- `bonusTiers[0]` = good performance
- `bonusTiers[1]` = excellent performance

### Early levels
- first bonus should be fairly reachable
- second bonus should encourage replay

### Mid levels
- rewards should ramp
- bonuses should feel meaningful

### Boss levels
- highest clear reward in the world
- strongest bonus rewards in the world

## Avoid
- bonus thresholds that are too close to the clear goal
- bonus thresholds that are practically impossible
- random reward jumps with no difficulty justification

---

# Concrete Implementation Rules

## File to edit
- `capy-village/public/config/games/math_garden/game.json`

## Keep these worlds active with 10 levels each
- `addition_field`
- `subtraction_patch`
- `multiplication_meadow`
- `division_grove`

## Leave unchanged
- `number_garden`

## Empty out these unsupported worlds
- `geometry_yard`
- `fraction_forest`

## Recipe strategy
Use reusable recipes where it makes sense, but do not be afraid to add more recipes if that makes the level JSON cleaner.

Recommended recipe families to add:
- addition recipes with different default ranges / answer counts
- subtraction recipes with different default ranges / answer counts
- divisibility recipes for several divisors

The key requirement is clarity and theme alignment, not minimizing recipe count at all costs.

---

# Final Validation Checklist

Before finishing, verify all of these:

## Theme alignment
- No subtraction world level uses odd/even collection
- No geometry world level uses prime / odd / multiples content
- No fraction world level uses mixed equations pretending to be fractions

## UX quality
- Each active world has 10 levels
- `number_garden` unchanged
- Active worlds feel distinct from each other
- Difficulty rises in a smooth and intentional way
- Bonus tiers feel achievable but motivating

## Learning quality
- Addition world teaches addition
- Subtraction world teaches subtraction
- Multiplication world teaches multiples
- Division world teaches divisibility / exactness

## Structural quality
- valid `recipeId`
- valid `kind`
- valid rule keys
- valid scoring keys
- valid level fields

---

# Deliverable Expected From You

Please update `math_garden/game.json` accordingly and provide a short implementation summary including:

1. which worlds were rewritten
2. which worlds were emptied
3. how many new recipes were added
4. a short note on the difficulty logic used for each world
