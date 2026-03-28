import { defineModeDescriptor } from '../pluginUtils.js';

function createSeededRandom(seed = 'math-answer') {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pickInRange(random, range, fallback) {
  if (Array.isArray(range) && range.length === 2) {
    return randInt(random, range[0], range[1]);
  }
  return randInt(random, fallback[0], fallback[1]);
}

function buildEquationPreview(resolvedRecipe, sampleCount = 3) {
  const random = createSeededRandom(resolvedRecipe.id || resolvedRecipe.title || 'answer-preview');
  const rules = resolvedRecipe.rules ?? {};
  const operation = rules.operation ?? 'addition';
  const symbols = operation === 'addition'
    ? ['+']
    : operation === 'subtraction'
      ? ['-']
      : operation === 'multiplication'
        ? ['×']
        : operation === 'division'
          ? ['÷']
          : ['+', '-', '×', '÷'];
  const [min, max] = rules.numberRange ?? [1, 10];
  const rounds = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const symbol = symbols[Math.floor(random() * symbols.length)];
    const leftRange = rules.leftRange ?? [min, max];
    const rightRange = rules.rightRange ?? [min, max];
    let left;
    let right;
    let answer;

    if (symbol === '+') {
      if (Number.isInteger(rules.targetValue)) {
        left = pickInRange(random, leftRange, [min, max]);
        right = Math.max(rightRange[0], Math.min(rightRange[1], rules.targetValue - left));
        left = rules.targetValue - right;
      } else {
        left = pickInRange(random, leftRange, [min, max]);
        right = pickInRange(random, rightRange, [min, max]);
      }
      answer = left + right;
    } else if (symbol === '-') {
      if (Number.isInteger(rules.targetValue)) {
        right = pickInRange(random, rightRange, [min, max]);
        left = right + rules.targetValue;
      } else {
        left = pickInRange(random, leftRange, [min, max]);
        right = randInt(random, rightRange[0], Math.min(rightRange[1], left));
      }
      answer = left - right;
    } else if (symbol === '×') {
      left = Number.isInteger(rules.fixedOperand) ? rules.fixedOperand : pickInRange(random, leftRange, [min, max]);
      right = pickInRange(random, rightRange, [min, max]);
      answer = left * right;
    } else {
      right = Number.isInteger(rules.fixedOperand) ? rules.fixedOperand : Math.max(1, pickInRange(random, rightRange, [min, max]));
      answer = pickInRange(random, leftRange, [min, max]);
      left = right * answer;
    }

    const options = new Set([answer]);
    const maxOptions = Math.max(2, rules.answerCount ?? 3);
    let offset = 1;
    while (options.size < maxOptions && offset < 20) {
      const next = answer + (offset % 2 === 0 ? -offset : offset);
      if (next >= 0) {
        options.add(next);
      }
      offset += 1;
    }

    rounds.push({
      equation: `${left} ${symbol} ${right} = ?`,
      answer,
      options: Array.from(options).sort((a, b) => a - b),
    });
  }

  return {
    type: 'answer',
    title: resolvedRecipe.title,
    prompt: resolvedRecipe.prompt,
    rounds,
  };
}

export const answerEquationMode = defineModeDescriptor({
  kind: 'answer_equation',
  family: 'answer',
  editor: {
    label: 'Answer Equation',
    summary: 'Arithmetic tap mode with configurable operation, ranges, and answer counts.',
    ruleFields: [
      {
        key: 'operation',
        label: 'Operation',
        type: 'select',
        options: [
          { value: 'addition', label: 'Addition' },
          { value: 'subtraction', label: 'Subtraction' },
          { value: 'multiplication', label: 'Multiplication' },
          { value: 'division', label: 'Division' },
          { value: 'mixed', label: 'Mixed' },
        ],
      },
      { key: 'numberRange', label: 'Number Range', type: 'range', min: 0, max: 100, step: 1 },
      { key: 'answerCount', label: 'Answer Choices', type: 'number', min: 2, max: 6, step: 1 },
      { key: 'fixedOperand', label: 'Fixed Operand', type: 'number', min: 1, max: 20, step: 1, optional: true },
      { key: 'targetValue', label: 'Target Value', type: 'number', min: 0, max: 100, step: 1, optional: true },
      { key: 'leftRange', label: 'Left Range', type: 'range', min: 0, max: 100, step: 1, optional: true },
      { key: 'rightRange', label: 'Right Range', type: 'range', min: 0, max: 100, step: 1, optional: true },
    ],
    scoringFields: [
      { key: 'pointsPerCorrect', label: 'Points Per Correct', type: 'number', min: 0, max: 100, step: 1 },
      { key: 'wrongPenalty', label: 'Wrong Penalty', type: 'number', min: 0, max: 20, step: 1 },
      { key: 'wrongFeedback', label: 'Wrong Feedback', type: 'text', optional: true },
    ],
    preview: buildEquationPreview,
  },
  docs: {
    summary: 'Tap the correct arithmetic answer for addition, subtraction, multiplication, division, or mixed equations.',
    exampleRecipe: {
      kind: 'answer_equation',
      title: 'Addition Garden',
      prompt: 'Tap the correct answer!',
      rules: {
        operation: 'addition',
        numberRange: [1, 10],
        answerCount: 3,
        targetValue: 10,
      },
      scoring: {
        pointsPerCorrect: 10,
        wrongPenalty: 0,
        wrongFeedback: 'Wrong!',
      },
    },
    exampleLevel: {
      levelId: 'addition_field_1',
      levelNum: 1,
      label: 'Seedling',
      slot: 1,
      recipeId: 'addition_basic',
      timeLimit: 60,
      goal: { type: 'correctAnswers', value: 5 },
      clearReward: 20,
      bonusTiers: [{ threshold: 9, reward: 8 }, { threshold: 13, reward: 10 }],
      overrides: {
        rules: {
          numberRange: [1, 12],
        },
      },
    },
  },
  rules: {
    required: ['operation', 'numberRange', 'answerCount'],
    optional: ['fixedOperand', 'targetValue', 'leftRange', 'rightRange'],
    defaults: {},
    overrideable: ['operation', 'numberRange', 'answerCount', 'fixedOperand', 'targetValue', 'leftRange', 'rightRange'],
  },
  scoring: {
    required: ['pointsPerCorrect', 'wrongPenalty'],
    optional: ['wrongFeedback'],
    defaults: { wrongFeedback: 'Wrong!' },
    overrideable: ['pointsPerCorrect', 'wrongPenalty', 'wrongFeedback'],
  },
  ruleSchemas: {
    operation: {
      "type": "string",
      "enum": ["addition", "subtraction", "multiplication", "division", "mixed"]
    },
    numberRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    leftRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    rightRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    answerCount: { "type": "number" },
    fixedOperand: { "type": "number" },
    targetValue: { "type": "number" }
  },
  scoringSchemas: {
    pointsPerCorrect: { "type": "number" },
    wrongPenalty: { "type": "number" },
    wrongFeedback: { "type": "string" }
  },
  validateRecipe({ path, rules, fail }) {
    if (!['addition', 'subtraction', 'multiplication', 'division', 'mixed'].includes(rules.operation)) {
      fail(`${path}.rules.operation`, `expected one of ["addition","subtraction","multiplication","division","mixed"], got "${rules.operation}"`);
    }
    if (!Array.isArray(rules.numberRange) || rules.numberRange.length !== 2) {
      fail(`${path}.rules.numberRange`, 'must be a [min, max] pair');
    }
    if ('leftRange' in rules && (!Array.isArray(rules.leftRange) || rules.leftRange.length !== 2)) {
      fail(`${path}.rules.leftRange`, 'must be a [min, max] pair');
    }
    if ('rightRange' in rules && (!Array.isArray(rules.rightRange) || rules.rightRange.length !== 2)) {
      fail(`${path}.rules.rightRange`, 'must be a [min, max] pair');
    }
    if ('fixedOperand' in rules && (!Number.isInteger(rules.fixedOperand) || rules.fixedOperand <= 0)) {
      fail(`${path}.rules.fixedOperand`, 'must be a positive integer');
    }
    if ('targetValue' in rules && !Number.isInteger(rules.targetValue)) {
      fail(`${path}.rules.targetValue`, 'must be an integer');
    }
    if ((rules.operation === 'multiplication' || rules.operation === 'division') && 'targetValue' in rules) {
      fail(`${path}.rules.targetValue`, 'is only supported for addition and subtraction recipes');
    }
  },
  resolve({ recipe, rules, scoring }) {
    return {
      id: recipe.id,
      family: 'answer',
      title: recipe.title,
      prompt: recipe.prompt,
      kind: 'answer_equation',
      rules,
      scoring,
    };
  },
});
