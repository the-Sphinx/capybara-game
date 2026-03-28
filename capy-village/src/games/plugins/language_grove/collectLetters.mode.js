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
  ruleSchemas: {
    letterSet: {
      "type": "string",
      "enum": ["vowels", "consonants", "word_letters"]
    },
    targetWord: { "type": "string" },
    fallSpeed: { "type": "number" },
    itemCount: { "type": "number" }
  },
  scoringSchemas: {
    pointsPerCorrect: { "type": "number" },
    wrongPenalty: { "type": "number" }
  },
  validateRecipe({ path, rules, fail }) {
    if (!['vowels', 'consonants', 'word_letters'].includes(rules.letterSet)) {
      fail(`${path}.rules.letterSet`, `expected one of ["vowels","consonants","word_letters"], got "${rules.letterSet}"`);
    }
    if (rules.letterSet === 'word_letters' && typeof rules.targetWord !== 'string') {
      fail(`${path}.rules.targetWord`, 'must be provided when letterSet is "word_letters"');
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
