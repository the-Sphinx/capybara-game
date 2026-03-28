# Minigame Authoring

This document is generated from per-game plugin descriptors.

Games are authored through one `game.json` manifest per game.

Top-level structure in `public/config/games/<gameId>/game.json`:
- `worldSelect` for world-map metadata
- `levelSelect` for shared level-slot metadata
- `arcade` for arcade recipe selection
- `recipes` for reusable gameplay recipes
- `worlds` for hierarchical world and level content

Core concepts:
- Add a new recipe by creating one entry under `recipes`.
- Add a new level by adding one object under `worlds[].levels[]`.
- Levels reference recipes with `recipeId`.
- Per-level tuning goes under `overrides.rules` and `overrides.scoring`.
- Game-level `defaults` apply first, then world-level `defaults`, then the level itself.

# math_garden authoring

This game is authored through a single `game.json` manifest.

Core concepts:
- `recipes` define reusable gameplay templates.
- Each recipe declares a `kind`, plus `rules` and `scoring`.
- `worlds[].levels[]` define progression and rewards.
- Levels reference recipes with `recipeId`.
- Level-specific tuning goes under `overrides.rules` and `overrides.scoring`.
- `defaults` can be set at the game level or per world, then overridden per level.

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

Allowed `matcher` values: `even`, `odd`, `prime`, `divisible_by`

Recipe example:
```json
{
  "kind": "collect_numbers",
  "title": "Collect Prime Numbers",
  "prompt": "Catch prime numbers!",
  "rules": {
    "matcher": "prime",
    "numberRange": [
      1,
      30
    ]
  },
  "scoring": {
    "pointsPerCorrect": 3,
    "wrongPenalty": 1,
    "wrongFeedback": "Not prime!"
  }
}
```

Level example:
```json
{
  "levelId": "number_garden_prime_1",
  "levelNum": 5,
  "label": "Prime Harvest",
  "slot": 5,
  "recipeId": "collect_prime_basic",
  "timeLimit": 45,
  "goal": {
    "type": "catchCount",
    "value": 10
  },
  "clearReward": 18,
  "bonusTiers": [
    {
      "threshold": 14,
      "reward": 6
    },
    {
      "threshold": 18,
      "reward": 8
    }
  ],
  "overrides": {
    "rules": {
      "numberRange": [
        1,
        40
      ],
      "itemCount": 6
    }
  }
}
```


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

Allowed `operation` values: `addition`, `subtraction`, `mixed`

Recipe example:
```json
{
  "kind": "answer_equation",
  "title": "Addition Garden",
  "prompt": "Tap the correct answer!",
  "rules": {
    "operation": "addition",
    "numberRange": [
      1,
      10
    ],
    "answerCount": 3
  },
  "scoring": {
    "pointsPerCorrect": 10,
    "wrongPenalty": 0,
    "wrongFeedback": "Wrong!"
  }
}
```

Level example:
```json
{
  "levelId": "addition_field_1",
  "levelNum": 1,
  "label": "Seedling",
  "slot": 1,
  "recipeId": "addition_basic",
  "timeLimit": 60,
  "goal": {
    "type": "correctAnswers",
    "value": 5
  },
  "clearReward": 20,
  "bonusTiers": [
    {
      "threshold": 9,
      "reward": 8
    },
    {
      "threshold": 13,
      "reward": 10
    }
  ],
  "overrides": {
    "rules": {
      "numberRange": [
        1,
        12
      ]
    }
  }
}
```



# language_grove authoring

This game is authored through a single `game.json` manifest.

Core concepts:
- `recipes` define reusable gameplay templates.
- Each recipe declares a `kind`, plus `rules` and `scoring`.
- `worlds[].levels[]` define progression and rewards.
- Levels reference recipes with `recipeId`.
- Level-specific tuning goes under `overrides.rules` and `overrides.scoring`.
- `defaults` can be set at the game level or per world, then overridden per level.

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

Allowed `letterSet` values: `vowels`, `consonants`, `word_letters`




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

Allowed `promptSet` values: `sentence_completion`, `opposites`, `synonyms`, `riddle`





# watermelon_catch authoring

This game is authored through a single `game.json` manifest.

Core concepts:
- `recipes` define reusable gameplay templates.
- Each recipe declares a `kind`, plus `rules` and `scoring`.
- `worlds[].levels[]` define progression and rewards.
- Levels reference recipes with `recipeId`.
- Level-specific tuning goes under `overrides.rules` and `overrides.scoring`.
- `defaults` can be set at the game level or per world, then overridden per level.

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






