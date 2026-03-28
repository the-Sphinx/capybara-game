import { defineModeDescriptor } from '../pluginUtils.js';

export const answerEquationMode = defineModeDescriptor({
  kind: 'answer_equation',
  family: 'answer',
  docs: {
    summary: 'Tap the correct arithmetic answer for addition, subtraction, or mixed equations.',
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
  validateRecipe({ id, rules }) {
    if (!['addition', 'subtraction', 'mixed'].includes(rules.operation)) {
      throw new Error(`Recipe "${id}" operation must be addition, subtraction, or mixed`);
    }
    if (!Array.isArray(rules.numberRange) || rules.numberRange.length !== 2) {
      throw new Error(`Recipe "${id}" numberRange must be [min, max]`);
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
