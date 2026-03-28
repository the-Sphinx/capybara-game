import { defineModeDescriptor } from '../pluginUtils.js';

export const collectNumbersMode = defineModeDescriptor({
  kind: 'collect_numbers',
  family: 'collection',
  docs: {
    summary: 'Catch numbers that match a number rule like odd, even, prime, or divisible-by.',
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
  validateRecipe({ id, rules }) {
    const allowed = new Set(['odd', 'even', 'prime', 'divisible_by']);
    if (!allowed.has(rules.matcher)) {
      throw new Error(`Recipe "${id}" has unsupported matcher "${rules.matcher}"`);
    }
    if (!Array.isArray(rules.numberRange) || rules.numberRange.length !== 2) {
      throw new Error(`Recipe "${id}" numberRange must be [min, max]`);
    }
    if (rules.matcher === 'divisible_by' && (!Number.isInteger(rules.divisor) || rules.divisor <= 0)) {
      throw new Error(`Recipe "${id}" requires a positive integer divisor`);
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
