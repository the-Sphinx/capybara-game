# Minigame Authoring

This document is generated from per-game plugin descriptors.

Games are authored through one `game.json` manifest per game.

Top-level structure:
- `worldSelect` for world-map metadata
- `levelSelect` for shared level-slot metadata
- `arcade` for arcade recipe selection
- `recipes` for reusable gameplay recipes
- `worlds` for hierarchical world and level content

Levels reference recipes with `recipeId`.
Per-level tuning goes under `overrides.rules` and `overrides.scoring`.

# math_garden authoring

This game is authored through a single `game.json` manifest.

Recipes live under `recipes`.
Levels reference recipes with `recipeId`.
Level-specific tuning goes under `overrides.rules` and `overrides.scoring`.

## `collect_numbers`

Catch numbers that match a number rule like odd, even, prime, or divisible-by.

Uses family: `collection`

Required rules:
- `matcher`
- `numberRange`

Optional rules:
- `divisor`
- `remainder`
- `itemCount`

Required scoring:
- `pointsPerCorrect`
- `wrongPenalty`

Optional scoring:
- `wrongFeedback`

Level overrideable rule keys:
- `matcher`
- `numberRange`
- `divisor`
- `remainder`
- `itemCount`

Level overrideable scoring keys:
- `pointsPerCorrect`
- `wrongPenalty`
- `wrongFeedback`

## `answer_equation`

Tap the correct arithmetic answer for addition, subtraction, or mixed equations.

Uses family: `answer`

Required rules:
- `operation`
- `numberRange`
- `answerCount`

Optional rules:
- none

Required scoring:
- `pointsPerCorrect`
- `wrongPenalty`

Optional scoring:
- `wrongFeedback`

Level overrideable rule keys:
- `operation`
- `numberRange`
- `answerCount`

Level overrideable scoring keys:
- `pointsPerCorrect`
- `wrongPenalty`
- `wrongFeedback`


# language_grove authoring

This game is authored through a single `game.json` manifest.

Recipes live under `recipes`.
Levels reference recipes with `recipeId`.
Level-specific tuning goes under `overrides.rules` and `overrides.scoring`.

## `collect_letters`

Catch vowels, consonants, or letters belonging to a target word.

Uses family: `stream`

Required rules:
- `letterSet`
- `fallSpeed`

Optional rules:
- `targetWord`
- `itemCount`

Required scoring:
- `pointsPerCorrect`
- `wrongPenalty`

Optional scoring:
- none

Level overrideable rule keys:
- `letterSet`
- `targetWord`
- `fallSpeed`
- `itemCount`

Level overrideable scoring keys:
- `pointsPerCorrect`
- `wrongPenalty`

## `collect_category_words`

Catch words that belong to a category such as animals, foods, or flying things.

Uses family: `stream`

Required rules:
- `category`
- `fallSpeed`

Optional rules:
- `itemCount`

Required scoring:
- `pointsPerCorrect`
- `wrongPenalty`

Optional scoring:
- none

Level overrideable rule keys:
- `category`
- `fallSpeed`
- `itemCount`

Level overrideable scoring keys:
- `pointsPerCorrect`
- `wrongPenalty`

## `choice_prompt`

Show a prompt and let the player choose the correct answer from falling choices.

Uses family: `choice_round`

Required rules:
- `promptSet`
- `fallSpeed`
- `answerCount`

Optional rules:
- none

Required scoring:
- `pointsPerCorrect`
- `wrongPenalty`

Optional scoring:
- none

Level overrideable rule keys:
- `promptSet`
- `fallSpeed`
- `answerCount`

Level overrideable scoring keys:
- `pointsPerCorrect`
- `wrongPenalty`


# watermelon_catch authoring

This game is authored through a single `game.json` manifest.

Recipes live under `recipes`.
Levels reference recipes with `recipeId`.
Level-specific tuning goes under `overrides.rules` and `overrides.scoring`.

## `classic_collect`

Classic Watermelon Catch rules with fruit, specials, bombs, and time bonuses.

Uses family: `collection`

Required rules:
- `itemValues`
- `timeBonuses`
- `bombPenalty`

Optional rules:
- `fallSpeedMult`
- `spawnRateMult`
- `specialItems`

Required scoring:
- none

Optional scoring:
- `wrongPenalty`
- `wrongFeedback`

Level overrideable rule keys:
- `fallSpeedMult`
- `spawnRateMult`
- `specialItems`

Level overrideable scoring keys:
- `wrongPenalty`
- `wrongFeedback`

