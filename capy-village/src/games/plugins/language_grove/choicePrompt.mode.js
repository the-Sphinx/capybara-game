import { defineModeDescriptor } from '../pluginUtils.js';

export const choicePromptMode = defineModeDescriptor({
  kind: 'choice_prompt',
  family: 'choice_round',
  docs: {
    summary: 'Show a prompt and let the player choose the correct answer from falling choices.',
  },
  rules: {
    required: ['promptSet', 'fallSpeed', 'answerCount'],
    optional: [],
    defaults: {},
    overrideable: ['promptSet', 'fallSpeed', 'answerCount'],
  },
  scoring: {
    required: ['pointsPerCorrect', 'wrongPenalty'],
    optional: [],
    defaults: {},
    overrideable: ['pointsPerCorrect', 'wrongPenalty'],
  },
  validateRecipe({ id, rules }) {
    if (!['sentence_completion', 'opposites', 'synonyms', 'riddle'].includes(rules.promptSet)) {
      throw new Error(`Recipe "${id}" promptSet is unsupported`);
    }
  },
  resolve({ recipe, rules, scoring }) {
    return {
      id: recipe.id,
      family: 'choice_round',
      title: recipe.title,
      prompt: recipe.prompt,
      kind: 'choice_prompt',
      rules,
      scoring,
    };
  },
});
