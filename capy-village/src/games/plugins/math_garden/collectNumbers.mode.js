import { defineModeDescriptor } from '../pluginUtils.js';

export const collectNumbersMode = defineModeDescriptor({
  kind: 'collect_numbers',
  family: 'collection',
  docs: {
    summary: 'Catch numbers that match a number rule like odd, even, prime, divisible-by, or authored rule combinations with phases.',
    exampleRecipe: {
      kind: 'collect_numbers',
      title: 'Prime Switch',
      prompt: 'Catch prime numbers!',
      rules: {
        matcher: { type: 'prime' },
        numberRange: [1, 30],
        spawnDelayRange: [0.8, 1.1],
        phases: [
          {
            switchAfterCaught: 4,
            prompt: 'Catch prime numbers!',
            matcher: { type: 'prime' }
          },
          {
            prompt: 'Now catch numbers that are not prime!',
            matcher: {
              type: 'not',
              rule: { type: 'prime' }
            }
          }
        ]
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
          spawnDelayRange: [0.7, 1.0]
        },
      },
    },
  },
  rules: {
    required: ['numberRange'],
    optional: ['matcher', 'divisor', 'remainder', 'itemCount', 'spawnDelayRange', 'fallSpeedRange', 'phases'],
    defaults: { itemCount: 5 },
    overrideable: ['matcher', 'numberRange', 'divisor', 'remainder', 'itemCount', 'spawnDelayRange', 'fallSpeedRange', 'phases'],
  },
  scoring: {
    required: ['pointsPerCorrect', 'wrongPenalty'],
    optional: ['wrongFeedback'],
    defaults: { wrongFeedback: 'Wrong!' },
    overrideable: ['pointsPerCorrect', 'wrongPenalty', 'wrongFeedback'],
  },
  ruleSchemas: {
    matcher: {
      "oneOf": [
        {
          "type": "string",
          "enum": ["even", "odd", "prime", "divisible_by"]
        },
        {
          "type": "object"
        }
      ]
    },
    numberRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    divisor: { "type": "number" },
    remainder: { "type": "number" },
    itemCount: { "type": "number" },
    spawnDelayRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    fallSpeedRange: {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "number" }
    },
    phases: {
      "type": "array",
      "items": { "type": "object" }
    }
  },
  scoringSchemas: {
    pointsPerCorrect: { "type": "number" },
    wrongPenalty: { "type": "number" },
    wrongFeedback: { "type": "string" }
  },
  validateRecipe({ path, rules, fail }) {
    function validateRange(range, rangePath) {
      if (!Array.isArray(range) || range.length !== 2 || !Number.isFinite(range[0]) || !Number.isFinite(range[1]) || range[0] > range[1]) {
        fail(rangePath, 'must be a [min, max] pair');
      }
    }

    function validateMatcher(matcher, matcherPath) {
      const allowed = new Set(['odd', 'even', 'prime', 'divisible_by']);
      if (typeof matcher === 'string') {
        if (!allowed.has(matcher)) {
          fail(matcherPath, `expected one of ["even","odd","prime","divisible_by"], got "${matcher}"`);
        }
        return;
      }
      if (!matcher || typeof matcher !== 'object' || Array.isArray(matcher)) {
        fail(matcherPath, 'must be a string matcher or matcher object');
      }
      const type = matcher.type;
      if (!type || typeof type !== 'string') {
        fail(`${matcherPath}.type`, 'must be a non-empty string');
      }
      switch (type) {
        case 'odd':
        case 'even':
        case 'prime':
          return;
        case 'divisible_by':
          if (!Number.isInteger(matcher.divisor) || matcher.divisor <= 0) {
            fail(`${matcherPath}.divisor`, 'must be a positive integer for "divisible_by"');
          }
          if ('remainder' in matcher && !Number.isInteger(matcher.remainder)) {
            fail(`${matcherPath}.remainder`, 'must be an integer when provided');
          }
          return;
        case 'less_than_or_equal':
        case 'greater_than_or_equal':
          if (!Number.isInteger(matcher.value)) {
            fail(`${matcherPath}.value`, 'must be an integer');
          }
          return;
        case 'not':
          validateMatcher(matcher.rule, `${matcherPath}.rule`);
          return;
        case 'any_of':
        case 'all_of':
          if (!Array.isArray(matcher.rules) || matcher.rules.length < 2) {
            fail(`${matcherPath}.rules`, 'must be an array with at least two matcher rules');
          }
          matcher.rules.forEach((rule, index) => validateMatcher(rule, `${matcherPath}.rules[${index}]`));
          return;
        default:
          fail(`${matcherPath}.type`, `unsupported matcher type "${type}"`);
      }
    }

    validateRange(rules.numberRange, `${path}.rules.numberRange`);
    if ('spawnDelayRange' in rules) {
      validateRange(rules.spawnDelayRange, `${path}.rules.spawnDelayRange`);
    }
    if ('fallSpeedRange' in rules) {
      validateRange(rules.fallSpeedRange, `${path}.rules.fallSpeedRange`);
    }
    if ('matcher' in rules) {
      validateMatcher(rules.matcher, `${path}.rules.matcher`);
    }
    if (typeof rules.matcher === 'string' && rules.matcher === 'divisible_by' && (!Number.isInteger(rules.divisor) || rules.divisor <= 0)) {
      fail(`${path}.rules.divisor`, 'must be a positive integer when matcher is "divisible_by"');
    }
    if (Array.isArray(rules.phases)) {
      rules.phases.forEach((phase, index) => {
        const phasePath = `${path}.rules.phases[${index}]`;
        if (!phase || typeof phase !== 'object' || Array.isArray(phase)) {
          fail(phasePath, 'must be an object');
        }
        if ('prompt' in phase && typeof phase.prompt !== 'string') {
          fail(`${phasePath}.prompt`, 'must be a string');
        }
        if ('switchAfterCaught' in phase && (!Number.isFinite(phase.switchAfterCaught) || phase.switchAfterCaught < 0)) {
          fail(`${phasePath}.switchAfterCaught`, 'must be a non-negative number');
        }
        if ('numberRange' in phase) {
          validateRange(phase.numberRange, `${phasePath}.numberRange`);
        }
        if ('spawnDelayRange' in phase) {
          validateRange(phase.spawnDelayRange, `${phasePath}.spawnDelayRange`);
        }
        if ('fallSpeedRange' in phase) {
          validateRange(phase.fallSpeedRange, `${phasePath}.fallSpeedRange`);
        }
        if ('matcher' in phase) {
          validateMatcher(phase.matcher, `${phasePath}.matcher`);
        }
        if (typeof phase.matcher === 'string' && phase.matcher === 'divisible_by' && (!Number.isInteger(phase.divisor) || phase.divisor <= 0)) {
          fail(`${phasePath}.divisor`, 'must be a positive integer when matcher is "divisible_by"');
        }
      });
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
