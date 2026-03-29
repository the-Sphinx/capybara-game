import { defineActivityType } from '../core.js';

function assertRange(range, path, fail) {
  if (!Array.isArray(range) || range.length !== 2 || !Number.isFinite(range[0]) || !Number.isFinite(range[1]) || range[0] > range[1]) {
    fail(path, 'must be a [min, max] pair');
  }
}

function buildPreview(level) {
  const objective = level.objective ?? {};
  const content = level.content ?? {};
  const operation = objective.operation ?? 'addition';
  const symbols = operation === 'mixed'
    ? ['+', '-', '×', '÷']
    : [operation === 'addition' ? '+' : operation === 'subtraction' ? '-' : operation === 'multiplication' ? '×' : '÷'];
  let seed = 21;
  const random = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 0x100000000;
  };
  const pickInt = (range, fallback) => {
    const source = Array.isArray(range) ? range : fallback;
    return Math.floor(random() * (source[1] - source[0] + 1)) + source[0];
  };
  const range = content.numberRange ?? [1, 10];
  const rounds = Array.from({ length: 3 }, () => {
    const symbol = symbols[Math.floor(random() * symbols.length)];
    const leftRange = content.leftRange ?? range;
    const rightRange = content.rightRange ?? range;
    let left;
    let right;
    let answer;
    if (symbol === '+') {
      left = pickInt(leftRange, range);
      right = pickInt(rightRange, range);
      answer = left + right;
    } else if (symbol === '-') {
      left = pickInt(leftRange, range);
      right = Math.min(left, pickInt(rightRange, range));
      answer = left - right;
    } else if (symbol === '×') {
      left = Number.isInteger(content.fixedOperand) ? content.fixedOperand : pickInt(leftRange, range);
      right = pickInt(rightRange, range);
      answer = left * right;
    } else {
      right = Number.isInteger(content.fixedOperand) ? content.fixedOperand : Math.max(1, pickInt(rightRange, range));
      answer = pickInt(leftRange, range);
      left = answer * right;
    }
    const options = new Set([answer]);
    while (options.size < (content.answerCount ?? 3)) {
      const delta = options.size;
      const candidate = Math.max(0, answer + (delta % 2 === 0 ? -delta : delta));
      options.add(candidate);
    }
    return {
      equation: `${left} ${symbol} ${right} = ?`,
      answer,
      options: [...options].sort((a, b) => a - b),
    };
  });
  return { type: 'answer', rounds };
}

function validateResolvedLevel({ level, path, fail }) {
  if (!['addition', 'subtraction', 'multiplication', 'division', 'mixed'].includes(level.objective?.operation)) {
    fail(`${path}.objective.operation`, 'must be a supported operation');
  }
  assertRange(level.content?.numberRange, `${path}.content.numberRange`, fail);
  if (!Number.isFinite(level.content?.answerCount) || level.content.answerCount < 2) {
    fail(`${path}.content.answerCount`, 'must be a number >= 2');
  }
  if (level.content?.leftRange) {
    assertRange(level.content.leftRange, `${path}.content.leftRange`, fail);
  }
  if (level.content?.rightRange) {
    assertRange(level.content.rightRange, `${path}.content.rightRange`, fail);
  }
  if (level.content?.fixedOperand != null && (!Number.isInteger(level.content.fixedOperand) || level.content.fixedOperand <= 0)) {
    fail(`${path}.content.fixedOperand`, 'must be a positive integer');
  }
  if (level.content?.targetValue != null && !Number.isInteger(level.content.targetValue)) {
    fail(`${path}.content.targetValue`, 'must be an integer');
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
}

function buildRuntime(level) {
  return {
    id: level.id,
    family: 'answer',
    kind: 'answer_prompt',
    title: level.presentation?.title || level.label,
    prompt: level.presentation?.prompt || 'Tap the correct answer!',
    rules: {
      operation: level.objective?.operation ?? 'addition',
      numberRange: level.content?.numberRange ?? [1, 10],
      answerCount: level.content?.answerCount ?? 3,
      fixedOperand: level.content?.fixedOperand,
      targetValue: level.content?.targetValue,
      leftRange: level.content?.leftRange,
      rightRange: level.content?.rightRange,
    },
    scoring: {
      pointsPerCorrect: level.scoring?.pointsPerCorrect ?? 10,
      wrongPenalty: level.scoring?.wrongPenalty ?? 0,
      wrongFeedback: level.scoring?.wrongFeedback ?? 'Try again!',
    },
  };
}

export const answerPromptActivity = defineActivityType({
  id: 'answer_prompt',
  label: 'Answer Prompt',
  description: 'Answer generated math prompts by tapping the correct option.',
  category: 'answer',
  docs: {
    summary: 'Use for arithmetic question/answer levels such as addition, subtraction, multiplication, and division.',
  },
  validateResolvedLevel,
  buildRuntime,
  buildPreview,
  sections: [
    {
      id: 'objective',
      label: 'Objective',
      fields: [
        { id: 'objective.operation', label: 'Operation', valueType: 'enum', required: true, defaultValue: 'addition', editorControl: 'select', options: [{ value: 'addition', label: 'Addition' }, { value: 'subtraction', label: 'Subtraction' }, { value: 'multiplication', label: 'Multiplication' }, { value: 'division', label: 'Division' }, { value: 'mixed', label: 'Mixed' }], inheritability: 'none', authoringTier: 'basic' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      fields: [
        { id: 'content.numberRange', label: 'Number Range', valueType: 'array', required: true, defaultValue: [1, 10], editorControl: 'range_pair', inheritability: 'both', authoringTier: 'basic' },
        { id: 'content.answerCount', label: 'Answer Count', valueType: 'number', required: true, defaultValue: 3, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'content.fixedOperand', label: 'Fixed Operand', valueType: 'number', required: false, defaultValue: null, editorControl: 'number', inheritability: 'both', authoringTier: 'advanced' },
        { id: 'content.targetValue', label: 'Target Value', valueType: 'number', required: false, defaultValue: null, editorControl: 'number', inheritability: 'both', authoringTier: 'advanced', visibility: [{ dependsOn: 'objective.operation', operator: 'in', value: ['addition', 'subtraction'] }] },
        { id: 'content.leftRange', label: 'Left Operand Range', valueType: 'array', required: false, defaultValue: null, editorControl: 'range_pair', inheritability: 'both', authoringTier: 'advanced' },
        { id: 'content.rightRange', label: 'Right Operand Range', valueType: 'array', required: false, defaultValue: null, editorControl: 'range_pair', inheritability: 'both', authoringTier: 'advanced' },
      ],
    },
    {
      id: 'difficulty',
      label: 'Difficulty',
      fields: [
        { id: 'difficulty.timeLimit', label: 'Time Limit', valueType: 'number', required: true, defaultValue: 60, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'difficulty.goal.type', label: 'Goal Type', valueType: 'enum', required: true, defaultValue: 'correctAnswers', editorControl: 'select', options: [{ value: 'correctAnswers', label: 'Correct Answers' }, { value: 'score', label: 'Score' }, { value: 'combo', label: 'Combo' }], inheritability: 'both', authoringTier: 'basic' },
        { id: 'difficulty.goal.value', label: 'Goal Value', valueType: 'number', required: true, defaultValue: 6, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
      ],
    },
    {
      id: 'scoring',
      label: 'Scoring',
      fields: [
        { id: 'scoring.pointsPerCorrect', label: 'Points Per Correct', valueType: 'number', required: true, defaultValue: 10, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.wrongPenalty', label: 'Wrong Penalty', valueType: 'number', required: true, defaultValue: 0, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.wrongFeedback', label: 'Wrong Feedback', valueType: 'string', required: false, defaultValue: 'Try again!', editorControl: 'text', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.clearReward', label: 'Clear Reward', valueType: 'number', required: true, defaultValue: 10, editorControl: 'number', inheritability: 'both', authoringTier: 'basic' },
        { id: 'scoring.bonusTiers', label: 'Bonus Tiers', valueType: 'array', required: false, defaultValue: [], editorControl: 'bonus_tiers', inheritability: 'both', authoringTier: 'advanced' },
      ],
    },
    {
      id: 'presentation',
      label: 'Presentation',
      fields: [
        { id: 'presentation.title', label: 'Level Title', valueType: 'string', required: false, defaultValue: '', editorControl: 'text', inheritability: 'both', authoringTier: 'basic' },
        { id: 'presentation.prompt', label: 'Prompt', valueType: 'string', required: true, defaultValue: 'Tap the correct answer!', editorControl: 'text', inheritability: 'both', authoringTier: 'basic' },
        { id: 'presentation.hint', label: 'Hint', valueType: 'string', required: false, defaultValue: '', editorControl: 'textarea', inheritability: 'both', authoringTier: 'advanced' },
      ],
    },
  ],
});
