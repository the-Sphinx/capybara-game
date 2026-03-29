import { defineActivityType } from '../core.js';

function assertRange(range, path, fail) {
  if (!Array.isArray(range) || range.length !== 2 || !Number.isFinite(range[0]) || !Number.isFinite(range[1]) || range[0] > range[1]) {
    fail(path, 'must be a [min, max] pair');
  }
}

function isPrime(value) {
  if (value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
}

function matcherFromRule(rule) {
  if (!rule) return { type: 'even' };
  switch (rule.type) {
    case 'parity':
      return { type: rule.parity === 'odd' ? 'odd' : 'even' };
    case 'modulo':
      return { type: 'divisible_by', divisor: rule.mod, remainder: rule.remainder ?? 0 };
    case 'prime':
      return { type: 'prime' };
    case 'comparison':
      return {
        type: rule.comparison === 'greater_than_or_equal' ? 'greater_than_or_equal' : 'less_than_or_equal',
        value: rule.value,
      };
    case 'compound':
      return structuredClone(rule.matcher ?? { type: 'even' });
    default:
      return structuredClone(rule);
  }
}

function matches(matcherRule, value) {
  switch (matcherRule.type) {
    case 'odd':
      return value % 2 === 1;
    case 'even':
      return value % 2 === 0;
    case 'prime':
      return isPrime(value);
    case 'divisible_by':
      return value % matcherRule.divisor === (matcherRule.remainder ?? 0);
    case 'less_than_or_equal':
      return value <= matcherRule.value;
    case 'greater_than_or_equal':
      return value >= matcherRule.value;
    case 'not':
      return !matches(matcherRule.rule, value);
    case 'any_of':
      return matcherRule.rules.some((child) => matches(child, value));
    case 'all_of':
      return matcherRule.rules.every((child) => matches(child, value));
    default:
      return false;
  }
}

function describeRule(rule) {
  if (!rule) return 'Catch the correct numbers!';
  switch (rule.type) {
    case 'parity':
      return `Catch ${rule.parity} numbers!`;
    case 'modulo':
      return `Catch numbers where remainder is ${rule.remainder ?? 0} when divided by ${rule.mod}!`;
    case 'prime':
      return 'Catch prime numbers!';
    case 'comparison':
      return rule.comparison === 'greater_than_or_equal'
        ? `Catch numbers ${rule.value} and above!`
        : `Catch numbers up to ${rule.value}!`;
    case 'compound':
      return 'Catch numbers that match the compound rule!';
    default:
      return 'Catch the correct numbers!';
  }
}

function validateMatcher(matcher, path, fail) {
  if (!matcher || typeof matcher !== 'object' || Array.isArray(matcher)) {
    fail(path, 'must be an object');
  }
  switch (matcher.type) {
    case 'odd':
    case 'even':
    case 'prime':
      return;
    case 'divisible_by':
      if (!Number.isInteger(matcher.divisor) || matcher.divisor < 2) {
        fail(`${path}.divisor`, 'must be an integer >= 2');
      }
      if (matcher.remainder != null && !Number.isInteger(matcher.remainder)) {
        fail(`${path}.remainder`, 'must be an integer');
      }
      return;
    case 'less_than_or_equal':
    case 'greater_than_or_equal':
      if (!Number.isInteger(matcher.value)) {
        fail(`${path}.value`, 'must be an integer');
      }
      return;
    case 'not':
      validateMatcher(matcher.rule, `${path}.rule`, fail);
      return;
    case 'any_of':
    case 'all_of':
      if (!Array.isArray(matcher.rules) || matcher.rules.length < 2) {
        fail(`${path}.rules`, 'must contain at least two child rules');
      }
      matcher.rules.forEach((rule, index) => validateMatcher(rule, `${path}.rules[${index}]`, fail));
      return;
    default:
      fail(`${path}.type`, `unsupported matcher type "${matcher.type}"`);
  }
}

function buildPreview(level) {
  const range = level.content?.domain?.range ?? [1, 20];
  const phases = Array.isArray(level.difficulty?.phases) && level.difficulty.phases.length
    ? level.difficulty.phases
    : [{ prompt: level.presentation?.prompt, objective: { rule: level.objective?.rule }, content: level.content }];
  let seed = 13;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  return {
    type: 'collection',
    phases: phases.map((phase) => {
      const phaseRange = phase.content?.domain?.range ?? phase.content?.range ?? range;
      const phaseMatcher = matcherFromRule(phase.objective?.rule ?? level.objective?.rule);
      const samples = Array.from({ length: 12 }, () => {
        const value = Math.floor(random() * (phaseRange[1] - phaseRange[0] + 1)) + phaseRange[0];
        return { value, match: matches(phaseMatcher, value) };
      });
      return {
        label: phase.presentation?.prompt ?? phase.prompt ?? level.presentation?.prompt ?? describeRule(level.objective?.rule),
        switchAfterCaught: phase.switchAfterCaught ?? null,
        samples,
      };
    }),
    matcherSummary: JSON.stringify(matcherFromRule(level.objective?.rule) ?? {}),
  };
}

function validateResolvedLevel({ level, path, fail }) {
  const rule = level.objective?.rule;
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    fail(`${path}.objective.rule`, 'must be an object');
  }
  switch (rule.type) {
    case 'parity':
      if (!['even', 'odd'].includes(rule.parity)) {
        fail(`${path}.objective.rule.parity`, 'must be "even" or "odd"');
      }
      break;
    case 'modulo':
      if (!Number.isInteger(rule.mod) || rule.mod < 2) {
        fail(`${path}.objective.rule.mod`, 'must be an integer >= 2');
      }
      if (!Number.isInteger(rule.remainder) || rule.remainder < 0 || rule.remainder >= rule.mod) {
        fail(`${path}.objective.rule.remainder`, 'must be an integer >= 0 and < mod');
      }
      break;
    case 'prime':
      break;
    case 'comparison':
      if (!['less_than_or_equal', 'greater_than_or_equal'].includes(rule.comparison)) {
        fail(`${path}.objective.rule.comparison`, 'must be a supported comparison');
      }
      if (!Number.isInteger(rule.value)) {
        fail(`${path}.objective.rule.value`, 'must be an integer');
      }
      break;
    case 'compound':
      validateMatcher(rule.matcher, `${path}.objective.rule.matcher`, fail);
      break;
    default:
      fail(`${path}.objective.rule.type`, `unsupported rule type "${rule.type}"`);
  }

  assertRange(level.content?.domain?.range, `${path}.content.domain.range`, fail);
  if (!Number.isFinite(level.content?.itemCount) || level.content.itemCount < 1) {
    fail(`${path}.content.itemCount`, 'must be a positive number');
  }
  if (level.content?.spawnDelayRange) {
    assertRange(level.content.spawnDelayRange, `${path}.content.spawnDelayRange`, fail);
  }
  if (level.content?.fallSpeedRange) {
    assertRange(level.content.fallSpeedRange, `${path}.content.fallSpeedRange`, fail);
  }
  if (!Number.isFinite(level.difficulty?.timeLimit) || level.difficulty.timeLimit <= 0) {
    fail(`${path}.difficulty.timeLimit`, 'must be a positive number');
  }
  if (!level.difficulty?.goal || typeof level.difficulty.goal !== 'object') {
    fail(`${path}.difficulty.goal`, 'must be an object');
  }
  if (!Number.isFinite(level.difficulty.goal.value) || level.difficulty.goal.value <= 0) {
    fail(`${path}.difficulty.goal.value`, 'must be a positive number');
  }
  if (level.scoring?.bonusTiers != null && !Array.isArray(level.scoring.bonusTiers)) {
    fail(`${path}.scoring.bonusTiers`, 'must be an array');
  }
  if (Array.isArray(level.difficulty?.phases)) {
    level.difficulty.phases.forEach((phase, index) => {
      const phasePath = `${path}.difficulty.phases[${index}]`;
      if (!phase || typeof phase !== 'object' || Array.isArray(phase)) {
        fail(phasePath, 'must be an object');
      }
      if (phase.switchAfterCaught != null && (!Number.isFinite(phase.switchAfterCaught) || phase.switchAfterCaught < 0)) {
        fail(`${phasePath}.switchAfterCaught`, 'must be a non-negative number');
      }
      if (phase.objective?.rule) {
        const synthetic = {
          objective: phase.objective,
          content: phase.content ?? level.content,
          difficulty: { timeLimit: 1, goal: { type: 'catchCount', value: 1 } },
          scoring: { bonusTiers: [] },
        };
        validateResolvedLevel({ level: synthetic, path: phasePath, fail });
      }
    });
  }
}

function buildRuntime(level) {
  const phases = Array.isArray(level.difficulty?.phases)
    ? level.difficulty.phases.map((phase) => ({
      switchAfterCaught: phase.switchAfterCaught,
      prompt: phase.presentation?.prompt ?? phase.prompt ?? level.presentation?.prompt,
      matcher: matcherFromRule(phase.objective?.rule ?? level.objective.rule),
      numberRange: phase.content?.domain?.range ?? phase.content?.range,
      itemCount: phase.content?.itemCount,
      spawnDelayRange: phase.content?.spawnDelayRange,
      fallSpeedRange: phase.content?.fallSpeedRange,
    }))
    : [];

  return {
    id: level.id,
    family: 'collection',
    kind: 'collect_stream',
    title: level.presentation?.title || level.label,
    prompt: level.presentation?.prompt || describeRule(level.objective.rule),
    rules: {
      matcher: matcherFromRule(level.objective.rule),
      numberRange: level.content?.domain?.range ?? [1, 20],
      itemCount: level.content?.itemCount ?? 5,
      spawnDelayRange: level.content?.spawnDelayRange,
      fallSpeedRange: level.content?.fallSpeedRange,
      phases,
    },
    scoring: {
      pointsPerCorrect: level.scoring?.pointsPerCorrect ?? 1,
      wrongPenalty: level.scoring?.wrongPenalty ?? 0,
      wrongFeedback: level.scoring?.wrongFeedback ?? 'Wrong!',
    },
  };
}

export const collectStreamActivity = defineActivityType({
  id: 'collect_stream',
  label: 'Collect Stream',
  description: 'Collect valid falling items while avoiding incorrect ones.',
  category: 'collection',
  docs: {
    summary: 'Use for parity, prime, modulo, comparison, and compound collection tasks.',
  },
  validateResolvedLevel,
  buildRuntime,
  buildPreview,
  sections: [
    {
      id: 'objective',
      label: 'Objective',
      fields: [
        { id: 'objective.rule.type', label: 'Rule Type', description: 'What makes an item correct.', valueType: 'enum', required: true, defaultValue: 'parity', editorControl: 'select', options: [{ value: 'parity', label: 'Parity' }, { value: 'modulo', label: 'Modulo / Divisibility' }, { value: 'prime', label: 'Prime Numbers' }, { value: 'comparison', label: 'Comparison' }, { value: 'compound', label: 'Compound Rule' }], inheritability: 'none', authoringTier: 'basic' },
        { id: 'objective.rule.parity', label: 'Parity', valueType: 'enum', required: true, defaultValue: 'even', editorControl: 'select', options: [{ value: 'even', label: 'Even' }, { value: 'odd', label: 'Odd' }], inheritability: 'none', authoringTier: 'basic', visibility: [{ dependsOn: 'objective.rule.type', operator: 'equals', value: 'parity' }] },
        { id: 'objective.rule.mod', label: 'Modulo Base', valueType: 'number', required: true, defaultValue: 2, editorControl: 'number', inheritability: 'none', authoringTier: 'basic', visibility: [{ dependsOn: 'objective.rule.type', operator: 'equals', value: 'modulo' }] },
        { id: 'objective.rule.remainder', label: 'Required Remainder', valueType: 'number', required: true, defaultValue: 0, editorControl: 'number', inheritability: 'none', authoringTier: 'basic', visibility: [{ dependsOn: 'objective.rule.type', operator: 'equals', value: 'modulo' }] },
        { id: 'objective.rule.comparison', label: 'Comparison', valueType: 'enum', required: true, defaultValue: 'less_than_or_equal', editorControl: 'select', options: [{ value: 'less_than_or_equal', label: 'Less Than Or Equal' }, { value: 'greater_than_or_equal', label: 'Greater Than Or Equal' }], inheritability: 'none', authoringTier: 'basic', visibility: [{ dependsOn: 'objective.rule.type', operator: 'equals', value: 'comparison' }] },
        { id: 'objective.rule.value', label: 'Comparison Value', valueType: 'number', required: true, defaultValue: 10, editorControl: 'number', inheritability: 'none', authoringTier: 'basic', visibility: [{ dependsOn: 'objective.rule.type', operator: 'equals', value: 'comparison' }] },
        { id: 'objective.rule.matcher', label: 'Compound Matcher', description: 'Advanced nested rule builder for compound collection tasks.', valueType: 'object', required: true, defaultValue: { type: 'even' }, editorControl: 'matcher_builder', inheritability: 'none', authoringTier: 'advanced', visibility: [{ dependsOn: 'objective.rule.type', operator: 'equals', value: 'compound' }] },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      fields: [
        { id: 'content.domain.kind', label: 'Content Domain', valueType: 'enum', required: true, defaultValue: 'numbers', editorControl: 'select', options: [{ value: 'numbers', label: 'Numbers' }], inheritability: 'both', authoringTier: 'basic' },
        { id: 'content.domain.range', label: 'Number Range', valueType: 'array', required: true, defaultValue: [1, 20], editorControl: 'range_pair', inheritability: 'both', authoringTier: 'basic' },
        { id: 'content.itemCount', label: 'Items On Screen', valueType: 'number', required: true, defaultValue: 5, editorControl: 'slider', inheritability: 'both', authoringTier: 'basic' },
        { id: 'content.spawnDelayRange', label: 'Spawn Delay Range', valueType: 'array', required: false, defaultValue: [0.8, 1.2], editorControl: 'range_pair', inheritability: 'both', authoringTier: 'advanced' },
        { id: 'content.fallSpeedRange', label: 'Fall Speed Range', valueType: 'array', required: false, defaultValue: [80, 140], editorControl: 'range_pair', inheritability: 'both', authoringTier: 'advanced' },
      ],
    },
    {
      id: 'difficulty',
      label: 'Difficulty',
      fields: [
        { id: 'difficulty.timeLimit', label: 'Time Limit', valueType: 'number', required: true, defaultValue: 60, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'difficulty.goal.type', label: 'Goal Type', valueType: 'enum', required: true, defaultValue: 'catchCount', editorControl: 'select', options: [{ value: 'catchCount', label: 'Catch Count' }, { value: 'score', label: 'Score' }, { value: 'combo', label: 'Combo' }], inheritability: 'both', authoringTier: 'basic' },
        { id: 'difficulty.goal.value', label: 'Goal Value', valueType: 'number', required: true, defaultValue: 10, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'difficulty.phases', label: 'Phases', valueType: 'array', required: false, defaultValue: [], editorControl: 'phase_builder', inheritability: 'none', authoringTier: 'advanced' },
      ],
    },
    {
      id: 'scoring',
      label: 'Scoring',
      fields: [
        { id: 'scoring.pointsPerCorrect', label: 'Points Per Correct', valueType: 'number', required: true, defaultValue: 2, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.wrongPenalty', label: 'Wrong Penalty', valueType: 'number', required: true, defaultValue: 1, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.wrongFeedback', label: 'Wrong Feedback', valueType: 'string', required: false, defaultValue: 'Wrong!', editorControl: 'text', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.clearReward', label: 'Clear Reward', valueType: 'number', required: true, defaultValue: 10, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.bonusTiers', label: 'Bonus Tiers', valueType: 'array', required: false, defaultValue: [], editorControl: 'bonus_tiers', inheritability: 'both', authoringTier: 'advanced' },
      ],
    },
    {
      id: 'presentation',
      label: 'Presentation',
      fields: [
        { id: 'presentation.title', label: 'Level Title', valueType: 'string', required: false, defaultValue: '', editorControl: 'text', inheritability: 'both', authoringTier: 'basic' },
        { id: 'presentation.prompt', label: 'Prompt', valueType: 'string', required: true, defaultValue: 'Catch the correct numbers!', editorControl: 'text', inheritability: 'both', authoringTier: 'basic' },
        { id: 'presentation.hint', label: 'Hint', valueType: 'string', required: false, defaultValue: '', editorControl: 'textarea', inheritability: 'both', authoringTier: 'advanced' },
      ],
    },
  ],
});
