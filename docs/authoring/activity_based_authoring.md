# Activity-Based Authoring

This document is generated from the activity descriptors for Math Garden.

Authoring hierarchy:
- Game
- World
- Level
- Activity Type

Each level is standalone and owns these sections:
- `objective`
- `content`
- `difficulty`
- `scoring`
- `presentation`

Starters are editor-only convenience templates.
They prefill form values, but runtime never depends on them.

## `collect_stream`

Collect valid falling items while avoiding incorrect ones.

### Objective

- `objective.rule.type` (required, select)
  What makes an item correct.
  Options: `parity`, `modulo`, `prime`, `comparison`, `compound`
- `objective.rule.parity` (required, select)
  Options: `even`, `odd`
- `objective.rule.mod` (required, number)
- `objective.rule.remainder` (required, number)
- `objective.rule.comparison` (required, select)
  Options: `less_than_or_equal`, `greater_than_or_equal`
- `objective.rule.value` (required, number)
- `objective.rule.matcher` (required, matcher_builder)
  Advanced nested rule builder for compound collection tasks.

### Content

- `content.domain.kind` (required, select)
  Options: `numbers`
- `content.domain.range` (required, range_pair)
- `content.itemCount` (required, slider)
- `content.spawnDelayRange` (range_pair)
- `content.fallSpeedRange` (range_pair)

### Difficulty

- `difficulty.timeLimit` (required, number)
- `difficulty.goal.type` (required, select)
  Options: `catchCount`, `score`, `combo`
- `difficulty.goal.value` (required, number)
- `difficulty.phases` (phase_builder)

### Scoring

- `scoring.pointsPerCorrect` (required, number)
- `scoring.wrongPenalty` (required, number)
- `scoring.wrongFeedback` (text)
- `scoring.clearReward` (required, number)
- `scoring.bonusTiers` (bonus_tiers)

### Presentation

- `presentation.title` (text)
- `presentation.prompt` (required, text)
- `presentation.hint` (textarea)

## `answer_prompt`

Answer generated math prompts by tapping the correct option.

### Objective

- `objective.operation` (required, select)
  Options: `addition`, `subtraction`, `multiplication`, `division`, `mixed`

### Content

- `content.numberRange` (required, range_pair)
- `content.answerCount` (required, number)
- `content.fixedOperand` (number)
- `content.targetValue` (number)
- `content.leftRange` (range_pair)
- `content.rightRange` (range_pair)

### Difficulty

- `difficulty.timeLimit` (required, number)
- `difficulty.goal.type` (required, select)
  Options: `correctAnswers`, `score`, `combo`
- `difficulty.goal.value` (required, number)

### Scoring

- `scoring.pointsPerCorrect` (required, number)
- `scoring.wrongPenalty` (required, number)
- `scoring.wrongFeedback` (text)
- `scoring.clearReward` (required, number)
- `scoring.bonusTiers` (bonus_tiers)

### Presentation

- `presentation.title` (text)
- `presentation.prompt` (required, text)
- `presentation.hint` (textarea)

