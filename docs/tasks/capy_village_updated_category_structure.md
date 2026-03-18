# Capy Village -- Updated Progression & Category Architecture (v2)

This document updates the previous progression specification to clarify
**where different learning modes belong** and how the **game categories
are structured**.

The key decision:

**Learning goals determine the category, not the gameplay mechanic.**

Even if different games use the same falling-object mechanic, they
should belong to different categories depending on what the player is
learning.

------------------------------------------------------------------------

# 1. Core Design Principle

Separate:

**Game Mechanics** vs **Learning Categories**

Example:

Mechanic: - falling objects

Categories that use that mechanic: - Watermelon Catch (reflex
gameplay) - Math Garden (numbers learning) - Language Grove (letters &
words learning)

Players experience categories as different games, even if internally
they reuse similar systems.

------------------------------------------------------------------------

# 2. Final Category Structure

    Minigame Hub (Wisdom Tree / Pillar)
    │
    ├── Watermelon Catch
    │   ├── Arcade Mode
    │   └── Adventure Mode
    │
    ├── Math Garden
    │   ├── Arcade Mode
    │   └── Adventure Mode
    │
    └── Language Grove
        ├── Arcade Mode
        └── Adventure Mode

Each category has its **own level track** and **its own progression**.

------------------------------------------------------------------------

# 3. What Belongs In Each Category

## Watermelon Catch

Purpose: Reflex-based catching gameplay.

Focus: - timing - reaction - combos - item effects

Examples:

-   Catch watermelons
-   Avoid bombs
-   Collect golden watermelon
-   Survival challenges
-   Combo challenges

No educational objectives should live here.

------------------------------------------------------------------------

## Math Garden

Purpose: Teach number recognition and arithmetic.

Modes include:

-   Catch **even numbers**
-   Catch **odd numbers**
-   Catch numbers **divisible by 3**
-   Catch the **correct equation answer**
-   Addition challenges
-   Subtraction challenges

These all belong in Math Garden even if they reuse falling mechanics.

Example structure:

    Math Garden
    │
    ├── Falling Answers (equation answers)
    │
    ├── Number Selection
    │   ├── Even numbers
    │   ├── Odd numbers
    │   └── Multiples of 3

------------------------------------------------------------------------

## Language Grove

Purpose: Teach letters, spelling, and vocabulary.

Examples:

-   Catch **vowels**
-   Catch **consonants**
-   Pick letters contained in a word
-   Image shown → catch letters in the object's name
-   Match uppercase and lowercase

Example structure:

    Language Grove
    │
    ├── Letter Selection
    │   ├── Vowels
    │   └── Consonants
    │
    ├── Word Builder
    │
    └── Image → Letters

------------------------------------------------------------------------

# 4. Shared Game Mechanics

To keep development efficient, mechanics should be reusable.

Example mechanics library:

    Mechanics
    │
    ├── fallingCatch
    │   Used by Watermelon Catch
    │
    ├── fallingChoices
    │   Used by Math Garden and Language Grove
    │
    └── future mechanics

Example usage:

    Watermelon Catch
      uses fallingCatch

    Math Garden
      uses fallingChoices

    Language Grove
      uses fallingChoices

------------------------------------------------------------------------

# 5. Updated Level Track Structure

Each category has its own **Adventure level track**.

Example:

    Watermelon Catch Track

    ●—●—●—●—●—●—●—●—●—🏆
    1  2  3  4  5  6  7  8  9 10

    Math Garden Track

    ●—●—●—●—●—●—●—●—●—🏆
    1  2  3  4  5  6  7  8  9 10

    Language Grove Track

    ●—●—●—●—●—●—●—●—●—🏆
    1  2  3  4  5  6  7  8  9 10

Each track has separate progress saved.

------------------------------------------------------------------------

# 6. Updated Save Data Structure

    {
     "version": 2,
     "coins": 0,
     "progress": {

       "watermelonCatch": {
          "completedLevels": [],
          "unlockedLevels": [1]
       },

       "mathGarden": {
          "completedLevels": [],
          "unlockedLevels": [1]
       },

       "languageGrove": {
          "completedLevels": [],
          "unlockedLevels": [1]
       }

     }
    }

------------------------------------------------------------------------

# 7. Math Garden -- Subgame: Falling Answers

Gameplay:

1.  Show equation at top
2.  Spawn answer choices simultaneously
3.  Answers fall downward
4.  Player must catch the correct one

Difficulty tuning variables:

-   falling speed
-   number of answer choices
-   equation difficulty
-   time limit

Example:

    4 + 5 = ?

    falling answers:
    7   9   6

Correct answer = 9

------------------------------------------------------------------------

# 8. Math Garden -- Number Selection Modes

These should live in Math Garden, not Watermelon Catch.

Examples:

-   Catch even numbers
-   Catch odd numbers
-   Catch multiples of 3

Even if visually similar to the fruit catching game, the learning goal
is mathematical.

------------------------------------------------------------------------

# 9. Language Grove Future Modes

Examples planned:

-   Catch vowels
-   Catch consonants
-   Pick letters inside a word
-   Image shown → catch letters belonging to the word

Example:

    Image: APPLE

    falling letters:
    A   P   E   B   T

Player must catch:

A P P L E

------------------------------------------------------------------------

# 10. Updated Player Flow

    Pillar / Wisdom Tree
          ↓
    Minigame Hub
          ↓
    Choose Category
          ↓
    Choose Mode
          ↓
    Arcade → Start game
    Adventure → Level Map
          ↓
    Select Level
          ↓
    Play Level
          ↓
    Win → Unlock next level
    Lose → Retry

------------------------------------------------------------------------

# 11. Benefits of This Structure

Advantages:

-   clean learning categories
-   scalable game architecture
-   easy to add new educational modes
-   reusable mechanics
-   clear player understanding of goals

This structure allows Capy Village to grow into a large educational game
without becoming confusing.
