# Capy Village --- Language Grove Minigame Specification

This document defines the **first Language Grove minigame family** for
Capy Village.

The goal is to introduce language-learning gameplay while **reusing the
existing fallingChoices mechanic** used in Math Garden.

This keeps development fast and architecture clean.

All games in this document belong to the **Language Grove category**.

------------------------------------------------------------------------

# 1. Category Overview

Category: **Language Grove**

Purpose: Teach fundamental literacy concepts through simple interactive
gameplay.

Core mechanic used:

    fallingChoices

Objects falling from the top are **letters** instead of numbers.

Players must catch the **correct letters** based on the level objective.

------------------------------------------------------------------------

# 2. Supported Language Grove Game Modes

The following modes should be supported by the system.

## Mode 1 --- Catch the Vowels

### Goal

Catch vowel letters.

Vowels:

    A E I O U

### Example Gameplay

Instruction:

    Goal: Catch 5 Vowels

Falling letters:

    A   B   E   T   O

Correct letters:

    A E O

Incorrect letters:

    B T

### Example HUD

    Correct: 2 / 5      Level 1 • Seed • Vowels      Time: 0:50
                        Catch the Vowels

------------------------------------------------------------------------

## Mode 2 --- Catch the Consonants

### Goal

Catch consonant letters.

Consonants include:

    B C D F G H J K L M N P Q R S T V W X Y Z

### Example Gameplay

Instruction:

    Goal: Catch 6 Consonants

Falling letters:

    A   T   E   B   O

Correct letters:

    T B

Incorrect letters:

    A E O

------------------------------------------------------------------------

## Mode 3 --- Catch Letters in a Word

### Goal

Catch letters belonging to a displayed word.

### Example

Displayed word:

    APPLE

Falling letters:

    A   P   E   B   T

Correct letters:

    A P E

Incorrect letters:

    B T

### HUD Example

    Correct: 2 / 5      Level 4 • Seed • Word Match      Time: 0:45
                        Letters in: APPLE

------------------------------------------------------------------------

## Mode 4 --- Missing Letter

### Goal

Complete a word by catching the missing letter.

### Example

Displayed word:

    C _ T

Falling letters:

    A   O   B   T

Correct letter:

    A

After catching A, the word becomes:

    CAT

------------------------------------------------------------------------

## Mode 5 --- Uppercase vs Lowercase

### Goal

Match uppercase and lowercase letters.

### Example

Displayed letter:

    A

Falling letters:

    a   b   d   e

Correct answer:

    a

### HUD Example

    Correct: 1 / 5      Level 6 • Leaf • Case Match      Time: 0:45
                        Match the lowercase letter

------------------------------------------------------------------------

# 3. Shared Gameplay Loop

All Language Grove modes follow this loop.

1.  Level starts
2.  Goal banner appears
3.  Letters begin falling
4.  Player catches letters
5.  System evaluates:
    -   correct letter
    -   incorrect letter
6.  Progress updates
7.  Level ends when:
    -   goal reached (win)
    -   time runs out (lose)

------------------------------------------------------------------------

# 4. Difficulty Scaling

Difficulty can be increased using the following parameters.

  Parameter           Easy   Hard
  ------------------- ------ -------
  fall speed          slow   fast
  number of letters   4      6
  correct ratio       high   low
  time limit          long   short

Example scaling:

  Level   Letters   Speed    Goal
  ------- --------- -------- ------
  1       4         slow     3
  3       5         slow     4
  5       5         medium   5
  7       6         medium   6
  10      6         fast     7

------------------------------------------------------------------------

# 5. Letter Generation Rules

For each spawn set:

1.  Generate correct letters based on level mode
2.  Generate incorrect letters
3.  Shuffle order
4.  Ensure **at least one correct letter exists**

Example spawn array:

    ["A","B","E","T","O"]

------------------------------------------------------------------------

# 6. Level Configuration JSON

Example level configuration.

    {
    "id": 1,
    "category": "languageGrove",
    "subgame": "letterSelection",
    "mode": "vowels",

    "goalType": "correctAnswers",
    "goalValue": 3,

    "timeLimit": 60,

    "fallSpeed": 1.0,
    "letterCount": 4,

    "clearReward": 40,

    "label": "Catch the Vowels"
    }

Possible mode values:

    vowels
    consonants
    lettersInWord
    missingLetter
    caseMatch

------------------------------------------------------------------------

# 7. Future Expansion

Language Grove can easily expand to include:

-   spelling challenges
-   word builder
-   sentence ordering
-   phonics matching
-   picture-to-word matching

The current system should remain flexible for those future additions.

------------------------------------------------------------------------

# 8. Implementation Summary

Coding agent should implement:

### Systems

-   Language Grove category
-   letterSelection subgame
-   fallingChoices mechanic reused
-   support for multiple language modes

### Initial Modes

-   Catch Vowels
-   Catch Consonants
-   Letters in Word
-   Missing Letter
-   Uppercase vs Lowercase

### Content

-   first 10 levels for vowel mode
-   additional modes can reuse same architecture
