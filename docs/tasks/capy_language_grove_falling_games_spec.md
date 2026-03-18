
# Capy Village — Language Grove Minigame Specification (Falling Mechanics)

This document defines the **Language Grove minigames** that fit the current Capy Village framework.

Important constraints based on the current game architecture:

- Reuse the existing **fallingChoices mechanic**
- Compatible with the **Adventure / Arcade mode system**
- Compatible with the **Universal Adventure HUD**
- No puzzle mechanics yet (word rearranging etc. postponed)
- Content targeted for **age group 7–8**
- Minigames must support **level-based progression**

Puzzle-based word games (scramble/typing) are postponed for later versions.

---

# Language Grove Category Overview

Language Grove teaches:

- vocabulary
- semantic understanding
- sentence comprehension
- word relationships

All initial games use the **same falling object interaction** used in Math Garden.

Objects falling from the top may be:

- words
- letters
- answer choices

The player catches the **correct ones** and avoids incorrect ones.

---

# Supported Language Grove Minigames

The following minigames will be implemented initially.

1. Category Catch
2. Picture → Letter Catch
3. Sentence Completion
4. Opposites / Synonyms
5. Riddle Catch

These all reuse the **fallingChoices system**.

---

# 1. Category Catch

### Concept

The player must catch words belonging to a given category.

### Example Level

Goal:

Catch **Animals**

Falling words:

DOG  
CAR  
CAT  
TREE  
LION

Correct:

DOG  
CAT  
LION

Incorrect:

CAR  
TREE

### HUD Example

Correct: 3 / 6      Level 2 • Seed • Category Catch      Time: 0:45  
Catch Animals

---

## Category Examples

Easy:

Animals  
Fruits  
Colors  
Foods  
Clothes  

Medium:

Things that fly  
Things in a house  
Things you wear  
Things you eat  

Hard:

Living things  
Things made of metal  
Things that are round  
Things used for writing

---

# 2. Picture → Letter Catch

### Concept

A picture is shown. The player must catch letters that appear in the object's name.

Example:

Picture: APPLE

Falling letters:

A  
P  
E  
B  
T  

Correct letters:

A  
P  
E  

Incorrect letters:

B  
T  

---

## Alternative Mode

Catch letters **NOT in the word**.

Example:

Picture: DOG

Letters:

D  
O  
G  
A  
T  

Catch:

A  
T

---

## Difficulty Scaling

Level 1–3  
3–4 letter words

DOG  
CAT  
SUN  

Level 4–7  
5 letter words

APPLE  
HOUSE  
PLANT  

Level 8–10  
Longer words

ELEPHANT  
BANANA  
FLOWER

---

# 3. Sentence Completion

### Concept

A sentence with a blank appears. The player must catch the correct word.

Example:

Sentence:

Birds can ___.

Falling choices:

FLY  
TREE  
TABLE  
SLEEP

Correct:

FLY

---

## Example Levels

The cat likes to ___.

sleep  
run  
banana  
table

Correct:

sleep

---

## Difficulty Scaling

Increase difficulty using:

- longer sentences
- more similar distractors
- faster falling speed
- more answer options

---

# 4. Opposites / Synonyms

### Opposites

Prompt:

Opposite of HOT

Falling answers:

COLD  
DRY  
FAST  
SUN  

Correct:

COLD

---

### Synonyms

Prompt:

Word similar to BIG

Falling answers:

HUGE  
SMALL  
TINY  
FAST  

Correct:

HUGE

---

# 5. Riddle Catch

### Concept

A short riddle is shown and the player catches the correct answer.

Example:

Riddle:

I have wings but I am not a plane.  
I sing in the morning.

Falling answers:

BIRD  
DOG  
TREE  
CAR

Correct:

BIRD

---

# Shared Gameplay Loop

All Language Grove minigames follow the same loop:

1. Level begins
2. Goal banner appears
3. Words/letters begin falling
4. Player catches objects
5. System evaluates correctness
6. Progress meter updates
7. Level ends when:
   - goal reached (win)
   - time expires (lose)

---

# Difficulty Parameters

Difficulty can be tuned using the following parameters.

fallSpeed  
objectCount  
correctRatio  
timeLimit  
goalValue  
wordDifficulty

Example progression:

Level 1  
4 objects, slow speed, goal 3

Level 5  
5 objects, medium speed, goal 4

Level 10  
6 objects, fast speed, goal 6

---

# Level Configuration JSON

Example configuration for a Language Grove level.

{
"id": 1,
"category": "languageGrove",
"subgame": "categoryCatch",
"mode": "animals",
"goalType": "correctAnswers",
"goalValue": 4,
"timeLimit": 60,
"fallSpeed": 1.0,
"objectCount": 4,
"clearReward": 50,
"label": "Catch Animals"
}

---

# Mode Values

Possible subgame modes.

categoryCatch

pictureLetterCatch

sentenceCompletion

opposites

synonyms

riddle

---

# Implementation Notes

The coding agent should:

1. Create **Language Grove category**
2. Reuse the **fallingChoices mechanic**
3. Support multiple minigame modes
4. Load level parameters from JSON
5. Use the **Adventure HUD system**
6. Grant **watermelon coin reward after level clear**

---

# Future Expansion (Not in this version)

The following mechanics may be added later:

Word Builder  
Spelling Puzzles  
Letter Ordering  
Word Search  

These will require **a new puzzle interaction system** and are intentionally postponed.
