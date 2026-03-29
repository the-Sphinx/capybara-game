# Math Garden Authoring

This document is generated from the new activity-type descriptors.

Levels are authored directly as complete units with:
- `activityType`
- `objective`
- `content`
- `difficulty`
- `scoring`
- `presentation`

Presets are optional convenience starters only. Runtime does not depend on them.

## `collect_stream`

Collect valid falling items while avoiding incorrect ones.

### Objective

- `objective.rule.type` (select) required
  What makes an item correct.
  Options: `parity`, `modulo`, `prime`, `comparison`, `compound`
- `objective.rule.parity` (select) required
  Options: `even`, `odd`
- `objective.rule.mod` (number) required
- `objective.rule.remainder` (number) required
- `objective.rule.comparison` (select) required
  Options: `less_than_or_equal`, `greater_than_or_equal`
- `objective.rule.value` (number) required
- `objective.rule.matcher` (matcher_builder) required
  Advanced nested rule builder for compound collection tasks.

### Content

- `content.domain.kind` (select) required
  Options: `numbers`
- `content.domain.range` (range_pair) required
- `content.itemCount` (slider) required
- `content.spawnDelayRange` (range_pair)
- `content.fallSpeedRange` (range_pair)

### Difficulty

- `difficulty.timeLimit` (number) required
- `difficulty.goal.type` (select) required
  Options: `catchCount`, `score`, `combo`
- `difficulty.goal.value` (number) required
- `difficulty.phases` (phase_builder)

### Scoring

- `scoring.pointsPerCorrect` (number) required
- `scoring.wrongPenalty` (number) required
- `scoring.wrongFeedback` (text)
- `scoring.clearReward` (number) required
- `scoring.bonusTiers` (bonus_tiers)

### Presentation

- `presentation.title` (text)
- `presentation.prompt` (text) required
- `presentation.hint` (textarea)

## `answer_prompt`

Answer generated math prompts by tapping the correct option.

### Objective

- `objective.operation` (select) required
  Options: `addition`, `subtraction`, `multiplication`, `division`, `mixed`

### Content

- `content.numberRange` (range_pair) required
- `content.answerCount` (number) required
- `content.fixedOperand` (number)
- `content.targetValue` (number)
- `content.leftRange` (range_pair)
- `content.rightRange` (range_pair)

### Difficulty

- `difficulty.timeLimit` (number) required
- `difficulty.goal.type` (select) required
  Options: `correctAnswers`, `score`, `combo`
- `difficulty.goal.value` (number) required

### Scoring

- `scoring.pointsPerCorrect` (number) required
- `scoring.wrongPenalty` (number) required
- `scoring.wrongFeedback` (text)
- `scoring.clearReward` (number) required
- `scoring.bonusTiers` (bonus_tiers)

### Presentation

- `presentation.title` (text)
- `presentation.prompt` (text) required
- `presentation.hint` (textarea)

