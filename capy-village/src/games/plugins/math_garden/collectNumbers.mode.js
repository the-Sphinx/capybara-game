import { defineModeDescriptor } from '../pluginUtils.js';

export const collectNumbersMode = defineModeDescriptor({
  kind: 'collect_numbers',
  family: 'collection',
  docs: {
    summary: 'Catch numbers that match a number rule like odd, even, prime, or divisible-by.',
    exampleRecipe: {
      kind: 'collect_numbers',
      title: 'Collect Prime Numbers',
      prompt: 'Catch prime numbers!',
      rules: {
        matcher: 'prime',
        numberRange: [1, 30],
      },
      scoring: {
        pointsPerCorrect: 3,
        wrongPenalty: 1,
        wrongFeedback: 'Not prime!',
      },
    },
    exampleLevel: {
      levelId: 'number_garden_prime_1',
      levelNum: 5,
      label: 'Prime Harvest',
      slot: 5,
      recipeId: 'collect_prime_basic',
      timeLimit: 45,
      goal: { type: 'catchCount', value: 10 },
      clearReward: 18,
      bonusTiers: [{ threshold: 14, reward: 6 }, { threshold: 18, reward: 8 }],
      overrides: {
        rules: {
          numberRange: [1, 40],
          itemCount: 6,
        },
      },
    },
  },
  rules: {
    required: ['matcher', 'numberRange'],
    optional: ['divisor', 'remainder', 'itemCount'],
    defaults: { itemCount: 5 },
    overrideable: ['matcher', 'numberRange', 'divisor', 'remainder', 'itemCount'],
  },
  scoring: {
    required: ['pointsPerCorrect', 'wrongPenalty'],
    optional: ['wrongFeedback'],
    defaults: { wrongFeedback: 'Wrong!' },
    overrideable: ['pointsPerCorrect', 'wrongPenalty', 'wrongFeedback'],
  },
  ruleSchemas: {
    matcher: {
      "type": "string",
      "enum": ["even", "odd", "prime", "divisible_by"]
    },
    numberRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    divisor: { "type": "number" },
    remainder: { "type": "number" },
    itemCount: { "type": "number" }
  },
  scoringSchemas: {
    pointsPerCorrect: { "type": "number" },
    wrongPenalty: { "type": "number" },
    wrongFeedback: { "type": "string" }
  },
  validateRecipe({ path, rules, fail }) {
    const allowed = new Set(['odd', 'even', 'prime', 'divisible_by']);
    if (!allowed.has(rules.matcher)) {
      fail(`${path}.rules.matcher`, `expected one of ["even","odd","prime","divisible_by"], got "${rules.matcher}"`);
    }
    if (!Array.isArray(rules.numberRange) || rules.numberRange.length !== 2) {
      fail(`${path}.rules.numberRange`, 'must be a [min, max] pair');
    }
    if (rules.matcher === 'divisible_by' && (!Number.isInteger(rules.divisor) || rules.divisor <= 0)) {
      fail(`${path}.rules.divisor`, 'must be a positive integer when matcher is "divisible_by"');
    }
  },
  resolve({ recipe, rules, scoring }) {
    return {
      id: recipe.id,
      family: 'collection',
      title: recipe.title,
      prompt: recipe.prompt,
      kind: 'collect_numbers',
      rules,
      scoring,
    };
  },
});
