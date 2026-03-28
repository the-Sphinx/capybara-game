import { defineModeDescriptor } from '../pluginUtils.js';

export const collectCategoryWordsMode = defineModeDescriptor({
  kind: 'collect_category_words',
  family: 'stream',
  docs: {
    summary: 'Catch words that belong to a category such as animals, foods, or flying things.',
  },
  rules: {
    required: ['category', 'fallSpeed'],
    optional: ['itemCount'],
    defaults: { itemCount: 5 },
    overrideable: ['category', 'fallSpeed', 'itemCount'],
  },
  scoring: {
    required: ['pointsPerCorrect', 'wrongPenalty'],
    optional: [],
    defaults: {},
    overrideable: ['pointsPerCorrect', 'wrongPenalty'],
  },
  validateRecipe({ id, rules }) {
    if (typeof rules.category !== 'string' || !rules.category) {
      throw new Error(`Recipe "${id}" requires a category`);
    }
  },
  resolve({ recipe, rules, scoring }) {
    return {
      id: recipe.id,
      family: 'stream',
      title: recipe.title,
      prompt: recipe.prompt,
      kind: 'collect_category_words',
      rules,
      scoring,
    };
  },
});
