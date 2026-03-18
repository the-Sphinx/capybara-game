# Capy Village --- Universal HUD + Wording + Reward System Spec (v1)

This document defines the **universal HUD component**, wording rules,
and reward system for both **Arcade Mode** and **Adventure Mode**.

The purpose is to eliminate player confusion between:

-   gameplay metrics (score, correct answers, catch counts)
-   persistent currency (watermelon coins)

and ensure a **consistent UI across all game categories**.

Categories supported:

-   Watermelon Catch
-   Math Garden
-   Language Grove

------------------------------------------------------------------------

# 1. Core Principle

There are two fundamentally different play styles:

### Arcade Mode

Free play where **everything collected becomes currency**.

### Adventure Mode

Structured levels with **goals** where the player earns **coins only as
a reward for clearing the level**.

These two modes must **use different HUD wording**.

------------------------------------------------------------------------

# 2. Arcade Mode HUD

Arcade represents **pure collection gameplay**.

Anything collected during play becomes **watermelon coins**.

## Arcade HUD Layout

    Watermelons: 37                Time: 0:41

Watermelons represent the **coins being earned during that run**.

## End of Arcade Run

    Run Complete

    Watermelons Collected: 37
    Coins Earned: +37

    Wallet Total: 340

The number of watermelons collected is directly converted to coins.

------------------------------------------------------------------------

# 3. Adventure Mode HUD

Adventure levels must **never display the word "Watermelon" during
gameplay**.

Instead the HUD shows **progress toward the level goal**.

Possible progress labels:

-   Score
-   Correct
-   Caught
-   Best Combo

These labels depend on the **goal type of the level**.

------------------------------------------------------------------------

# 4. Universal Adventure HUD Layout

The Adventure HUD should have three zones:

    [ GOAL PROGRESS ]   [ LEVEL INFO + INSTRUCTION ]   [ TIME ]

Example layout:

    Score: 14 / 20      Level 1 • Sprout • Addition      Time: 0:41
                             4 + 4 = ?

This communicates:

-   goal progress
-   level identity
-   level rule
-   time remaining

------------------------------------------------------------------------

# 5. Goal Progress Labels

The label displayed depends on the level configuration.

Examples:

### Score Level

    Score: 12 / 20

### Catch Count Level

    Caught: 7 / 10

### Correct Answer Level

    Correct: 3 / 5

### Combo Challenge

    Best Combo: 2 / 5

------------------------------------------------------------------------

# 6. Level Identity + Instruction

The center header should show **level identity** and **level rule**.

Example:

    Level 1 • Sprout • Addition
    4 + 4 = ?

or

    Level 4 • Sprout
    Catch Odd Numbers

This header area may contain:

-   level number
-   level name
-   level rule
-   current math question

------------------------------------------------------------------------

# 7. Math Question Placement

Math equations should appear **in the center header section**, below the
level name.

Example:

    Correct: 1 / 5      Level 1 • Sprout • Addition      Time: 0:41
                            4 + 4 = ?

The question should remain visible while answers fall.

------------------------------------------------------------------------

# 8. Level Start Banner

When a level begins, briefly display the objective.

Duration: \~2 seconds.

Example:

    Level 3

    Goal:
    Catch 10 Odd Numbers

or

    Level 2

    Goal:
    Score 20 Points

This banner fades before gameplay starts.

------------------------------------------------------------------------

# 9. End-of-Level Reward Screen

Coins are awarded **only after the level is cleared**.

Example result screen:

    Level Complete!

    Goal Reached
    Score: 120

    Level Reward: +50 Watermelon Coins

    Wallet Total: 340

Important:

The **score during the run is not currency**.

Coins are only granted through the **reward system**.

------------------------------------------------------------------------

# 10. Level Reward System

Each level configuration should contain a reward value.

Example:

    clearReward

This reward is granted **only if the level goal is achieved**.

Optional future extension:

    performanceBonus

This could grant extra coins for high performance.

Example:

    Clear Reward: +30
    Performance Bonus: +20
    Total Earned: +50

------------------------------------------------------------------------

# 11. Updated Level Configuration Fields

Level JSON should include reward information.

Example:

``` json
{
  "id": 1,
  "goalType": "score",
  "goalValue": 20,
  "timeLimit": 45,
  "clearReward": 50,
  "label": "Warm‑Up"
}
```

Possible goal types:

-   score
-   catchCount
-   correctAnswers
-   combo

------------------------------------------------------------------------

# 12. Universal HUD Component Structure

Implement a single reusable HUD component.

Suggested component structure:

    AdventureHUD
     ├── GoalProgress
     ├── LevelHeader
     │     ├── LevelName
     │     └── LevelInstruction / Question
     └── TimeRemaining

This HUD must work for:

-   Watermelon Catch Adventure
-   Math Garden Adventure
-   Language Grove Adventure

The component should dynamically adjust based on **goalType** and
**level configuration**.

------------------------------------------------------------------------

# 13. Arcade vs Adventure HUD Switch

The game must load different HUD layouts depending on the mode.

    if mode == Arcade:
        use ArcadeHUD
    else:
        use AdventureHUD

ArcadeHUD:

    Watermelons: X
    Time: XX

AdventureHUD:

    Score / Correct / Caught / Combo
    Level header
    Time

------------------------------------------------------------------------

# 14. Key UX Rule

During Adventure Mode gameplay:

**Do NOT show the word "Watermelon".**

Watermelon terminology should appear **only in the reward screen** when
coins are granted.

This prevents confusion between:

-   score progress
-   currency reward

------------------------------------------------------------------------

# 15. Expected Implementation Result

After these changes:

Players will understand:

    Arcade Mode
    = collect watermelons → earn coins

    Adventure Mode
    = complete goals → earn reward coins

This separation creates a clear and scalable economy for Capy Village.
