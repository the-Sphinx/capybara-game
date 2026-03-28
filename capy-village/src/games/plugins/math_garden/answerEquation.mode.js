import { defineModeDescriptor } from '../pluginUtils.js';

export const answerEquationMode = defineModeDescriptor({
  kind: 'answer_equation',
  family: 'answer',
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
