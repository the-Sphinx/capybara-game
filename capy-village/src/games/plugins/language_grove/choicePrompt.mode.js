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
  ruleSchemas: {
    promptSet: {
      "type": "string",
      "enum": ["sentence_completion", "opposites", "synonyms", "riddle"]
    },
    fallSpeed: { "type": "number" },
    answerCount: { "type": "number" }
  },
  scoringSchemas: {
    pointsPerCorrect: { "type": "number" },
    wrongPenalty: { "type": "number" }
  },
  validateRecipe({ path, rules, fail }) {
    if (!['sentence_completion', 'opposites', 'synonyms', 'riddle'].includes(rules.promptSet)) {
      fail(`${path}.rules.promptSet`, `expected one of ["sentence_completion","opposites","synonyms","riddle"], got "${rules.promptSet}"`);
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
