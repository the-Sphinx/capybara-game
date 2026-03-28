import { defineModeDescriptor } from '../pluginUtils.js';

export const classicCollectMode = defineModeDescriptor({
  kind: 'classic_collect',
  family: 'collection',
  docs: {
    summary: 'Classic Watermelon Catch rules with fruit, specials, bombs, and time bonuses.',
  },
  rules: {
    required: ['itemValues', 'timeBonuses', 'bombPenalty'],
    optional: ['fallSpeedMult', 'spawnRateMult', 'specialItems'],
    defaults: {
      fallSpeedMult: 1,
      spawnRateMult: 1,
      specialItems: {
        hourglass: true,
        clock: true,
        bomb: true,
        gold: true,
        silver: true,
      },
    },
    overrideable: ['fallSpeedMult', 'spawnRateMult', 'specialItems'],
  },
  scoring: {
    required: [],
    optional: ['wrongPenalty', 'wrongFeedback'],
    defaults: {
      wrongPenalty: 0,
      wrongFeedback: '🚫',
    },
    overrideable: ['wrongPenalty', 'wrongFeedback'],
  },
  ruleSchemas: {
    itemValues: { "type": "object" },
    timeBonuses: { "type": "object" },
    bombPenalty: { "type": "number" },
    fallSpeedMult: { "type": "number" },
    spawnRateMult: { "type": "number" },
    specialItems: { "type": "object" }
  },
  scoringSchemas: {
    wrongPenalty: { "type": "number" },
    wrongFeedback: { "type": "string" }
  },
  validateRecipe({ path, rules, fail }) {
    if (typeof rules.itemValues !== 'object' || typeof rules.timeBonuses !== 'object') {
      fail(path, 'requires itemValues and timeBonuses objects');
    }
  },
  resolve({ recipe, rules, scoring }) {
    return {
      id: recipe.id,
      family: 'collection',
      title: recipe.title,
      prompt: recipe.prompt,
      kind: 'classic_collect',
      rules,
      scoring,
    };
  },
});
