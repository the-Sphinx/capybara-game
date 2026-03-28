import { defineModeDescriptor } from '../pluginUtils.js';

export const answerEquationMode = defineModeDescriptor({
  kind: 'answer_equation',
  family: 'answer',
  docs: {
    summary: 'Tap the correct arithmetic answer for addition, subtraction, or mixed equations.',
    exampleRecipe: {
      kind: 'answer_equation',
      title: 'Addition Garden',
      prompt: 'Tap the correct answer!',
      rules: {
        operation: 'addition',
        numberRange: [1, 10],
        answerCount: 3,
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
    optional: [],
    defaults: {},
    overrideable: ['operation', 'numberRange', 'answerCount'],
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
      "enum": ["addition", "subtraction", "mixed"]
    },
    numberRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    answerCount: { "type": "number" }
  },
  scoringSchemas: {
    pointsPerCorrect: { "type": "number" },
    wrongPenalty: { "type": "number" },
    wrongFeedback: { "type": "string" }
  },
  validateRecipe({ path, rules, fail }) {
    if (!['addition', 'subtraction', 'mixed'].includes(rules.operation)) {
      fail(`${path}.rules.operation`, `expected one of ["addition","subtraction","mixed"], got "${rules.operation}"`);
    }
    if (!Array.isArray(rules.numberRange) || rules.numberRange.length !== 2) {
      fail(`${path}.rules.numberRange`, 'must be a [min, max] pair');
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
