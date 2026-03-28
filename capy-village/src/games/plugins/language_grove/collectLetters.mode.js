import { defineModeDescriptor } from '../pluginUtils.js';

export const collectLettersMode = defineModeDescriptor({
  kind: 'collect_letters',
  family: 'stream',
  docs: {
    summary: 'Catch vowels, consonants, or letters belonging to a target word.',
  },
  rules: {
    required: ['letterSet', 'fallSpeed'],
    optional: ['targetWord', 'itemCount'],
    defaults: { itemCount: 5 },
    overrideable: ['letterSet', 'targetWord', 'fallSpeed', 'itemCount'],
  },
  scoring: {
    required: ['pointsPerCorrect', 'wrongPenalty'],
    optional: [],
    defaults: {},
    overrideable: ['pointsPerCorrect', 'wrongPenalty'],
  },
  validateRecipe({ id, rules }) {
    if (!['vowels', 'consonants', 'word_letters'].includes(rules.letterSet)) {
      throw new Error(`Recipe "${id}" letterSet must be vowels, consonants, or word_letters`);
    }
    if (rules.letterSet === 'word_letters' && typeof rules.targetWord !== 'string') {
      throw new Error(`Recipe "${id}" requires targetWord for word_letters`);
    }
  },
  resolve({ recipe, rules, scoring }) {
    return {
      id: recipe.id,
      family: 'stream',
      title: recipe.title,
      prompt: recipe.prompt,
      kind: 'collect_letters',
      rules,
      scoring,
    };
  },
});
