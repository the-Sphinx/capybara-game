# Minigame Mode Authoring

Minigame mode recipes now use a typed structure:

```json
{
  "id": "number_garden_collect_odd",
  "type": "math.collection.divisibility",
  "title": "Collect Odd Numbers",
  "prompt": "Catch odd numbers!",
  "params": {
    "divisor": 2,
    "remainder": 1,
    "numberRange": [1, 20],
    "pointsPerCorrect": 2,
    "wrongPenalty": 1,
    "wrongFeedback": "Even!"
  }
}
```

## Shape

- `id`: stable authored recipe id referenced by level JSON and arcade config
- `type`: the executable behavior type
- `title`: human-readable mode title
- `prompt`: short HUD prompt
- `params`: only keys allowed by that `type`

Levels reference the recipe with `modeId`, then add level-specific overrides like:

- `timeLimit`
- `goal`
- `clearReward`
- `bonusTiers`
- `slot`

Some mode params can also be overridden at the level layer. If a level uses a key outside the allowed override list for its mode type, validation fails during config load.

## Supported Types

### `math.collection.divisibility`

Use for number-catching modes like odd, even, or multiples.

Required params:
- `divisor`
- `numberRange`
- `pointsPerCorrect`
- `wrongPenalty`
- `wrongFeedback`

Optional params:
- `remainder` default `0`

Level override keys:
- `divisor`
- `remainder`
- `numberRange`
- `pointsPerCorrect`
- `wrongPenalty`
- `wrongFeedback`

Examples:
- odd numbers: `divisor: 2`, `remainder: 1`
- even numbers: `divisor: 2`, `remainder: 0`
- multiples of 3: `divisor: 3`, `remainder: 0`

### `math.answer.operation`

Use for arithmetic answer-tapping modes.

Required params:
- `operation`
- `numberRange`
- `answerCount`
- `pointsPerCorrect`
- `wrongPenalty`
- `wrongFeedback`

Allowed `operation` values:
- `addition`
- `subtraction`
- `mixed`

Level override keys:
- `operation`
- `numberRange`
- `answerCount`
- `pointsPerCorrect`
- `wrongPenalty`
- `wrongFeedback`

### `language.stream.letters`

Use for falling-letter catch modes.

Required params:
- `letterSet`
- `fallSpeed`
- `pointsPerCorrect`
- `wrongPenalty`

Optional params:
- `targetWord`
- `itemCount`

Allowed `letterSet` values:
- `vowels`
- `consonants`
- `word_letters`

When `letterSet` is `word_letters`, `targetWord` is required.

Level override keys:
- `letterSet`
- `targetWord`
- `fallSpeed`
- `itemCount`
- `pointsPerCorrect`
- `wrongPenalty`

### `language.stream.category`

Use for falling-word category modes.

Required params:
- `category`
- `fallSpeed`
- `pointsPerCorrect`
- `wrongPenalty`

Optional params:
- `itemCount`

Level override keys:
- `category`
- `fallSpeed`
- `itemCount`
- `pointsPerCorrect`
- `wrongPenalty`

### `language.choice.sentence_completion`
### `language.choice.opposites`
### `language.choice.synonyms`
### `language.choice.riddle`

Use these for prompt + answer-choice rounds.

Required params:
- `fallSpeed`
- `answerCount`
- `pointsPerCorrect`
- `wrongPenalty`

Level override keys:
- `fallSpeed`
- `answerCount`
- `pointsPerCorrect`
- `wrongPenalty`

## Current Schema Files

- `/Users/gorkem/workspace/gorkem/capybara-game/capy-village/src/config/games/schemas/math_garden.modes.schema.json`
- `/Users/gorkem/workspace/gorkem/capybara-game/capy-village/src/config/games/schemas/language_grove.modes.schema.json`
- `/Users/gorkem/workspace/gorkem/capybara-game/capy-village/src/config/games/schemas/watermelon_catch.modes.schema.json`

## Authoring Workflow

1. Add or edit a recipe in `public/config/games/<gameId>/modes.json`.
2. Reference that recipe from level JSON via `modeId`.
3. Add only allowed level overrides for that mode type.
4. Keep rewards and bonus tiers in level JSON, not in runtime code.

## Naming Guidance

- `id` should describe the world/content intent
- `type` should describe the executable behavior

Examples:
- recipe id: `number_garden_collect_odd`
- recipe type: `math.collection.divisibility`
