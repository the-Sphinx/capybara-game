import {
  MathDivisibilityCollectionMode,
  MathOperationAnswerMode,
} from './mathGarden/modeRuntime.js';
import {
  LanguageLettersStreamMode,
  LanguageCategoryStreamMode,
  LanguageSentenceChoiceMode,
  LanguageOppositesChoiceMode,
  LanguageSynonymsChoiceMode,
  LanguageRiddleChoiceMode,
} from './languageGrove/modeRuntime.js';
import { WatermelonClassicCollectionMode } from './watermelonCatch/modeRuntime.js';

const BASE_LEVEL_KEYS = new Set([
  'levelId',
  'levelNum',
  'worldId',
  'modeId',
  'label',
  'goal',
  'clearReward',
  'bonusTiers',
  'slot',
  'timeLimit',
]);

function makeParamMap(required, optional = [], defaults = {}) {
  return {
    required,
    optional,
    defaults,
    allowed: new Set([...required, ...optional]),
  };
}

export const MODE_TYPE_REGISTRY = Object.freeze({
  'math.collection.divisibility': {
    gameId: 'math_garden',
    family: 'collection',
    handlerClass: MathDivisibilityCollectionMode,
    label: 'Math Divisibility Collection',
    description: 'Collect numbers whose remainder matches divisor/remainder rules.',
    params: makeParamMap(
      ['divisor', 'numberRange', 'pointsPerCorrect', 'wrongPenalty', 'wrongFeedback'],
      ['remainder'],
      { remainder: 0 },
    ),
    overrideableLevelKeys: ['numberRange', 'pointsPerCorrect', 'wrongPenalty', 'wrongFeedback', 'divisor', 'remainder'],
    validateParams(params) {
      if (!Number.isInteger(params.divisor) || params.divisor <= 0) {
        return 'divisor must be a positive integer';
      }
      if (!Array.isArray(params.numberRange) || params.numberRange.length !== 2) {
        return 'numberRange must be a [min, max] pair';
      }
      return null;
    },
  },
  'math.answer.operation': {
    gameId: 'math_garden',
    family: 'answer',
    handlerClass: MathOperationAnswerMode,
    label: 'Math Operation Answer',
    description: 'Answer arithmetic questions for a chosen operation set.',
    params: makeParamMap(
      ['operation', 'numberRange', 'answerCount', 'pointsPerCorrect', 'wrongPenalty', 'wrongFeedback'],
      [],
      {},
    ),
    overrideableLevelKeys: ['operation', 'numberRange', 'answerCount', 'pointsPerCorrect', 'wrongPenalty', 'wrongFeedback'],
    validateParams(params) {
      if (!['addition', 'subtraction', 'mixed'].includes(params.operation)) {
        return 'operation must be addition, subtraction, or mixed';
      }
      return null;
    },
  },
  'language.stream.letters': {
    gameId: 'language_grove',
    family: 'stream',
    handlerClass: LanguageLettersStreamMode,
    label: 'Language Letters Stream',
    description: 'Catch letter targets such as vowels, consonants, or letters in a word.',
    params: makeParamMap(
      ['letterSet', 'fallSpeed', 'pointsPerCorrect', 'wrongPenalty'],
      ['itemCount', 'targetWord'],
      {},
    ),
    overrideableLevelKeys: ['letterSet', 'targetWord', 'fallSpeed', 'pointsPerCorrect', 'wrongPenalty', 'itemCount'],
    validateParams(params) {
      if (!['vowels', 'consonants', 'word_letters'].includes(params.letterSet)) {
        return 'letterSet must be vowels, consonants, or word_letters';
      }
      if (params.letterSet === 'word_letters' && typeof params.targetWord !== 'string') {
        return 'targetWord is required when letterSet is word_letters';
      }
      return null;
    },
  },
  'language.stream.category': {
    gameId: 'language_grove',
    family: 'stream',
    handlerClass: LanguageCategoryStreamMode,
    label: 'Language Category Stream',
    description: 'Catch words from a named content category.',
    params: makeParamMap(
      ['category', 'fallSpeed', 'pointsPerCorrect', 'wrongPenalty'],
      ['itemCount'],
      {},
    ),
    overrideableLevelKeys: ['category', 'fallSpeed', 'pointsPerCorrect', 'wrongPenalty', 'itemCount'],
    validateParams(params) {
      if (typeof params.category !== 'string' || !params.category) {
        return 'category must be a non-empty string';
      }
      return null;
    },
  },
  'language.choice.sentence_completion': {
    gameId: 'language_grove',
    family: 'choice_round',
    handlerClass: LanguageSentenceChoiceMode,
    label: 'Language Sentence Completion',
    description: 'Choose the missing word that completes the sentence.',
    params: makeParamMap(
      ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
      [],
      {},
    ),
    overrideableLevelKeys: ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
    validateParams() { return null; },
  },
  'language.choice.opposites': {
    gameId: 'language_grove',
    family: 'choice_round',
    handlerClass: LanguageOppositesChoiceMode,
    label: 'Language Opposites Choice',
    description: 'Choose the opposite word.',
    params: makeParamMap(
      ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
      [],
      {},
    ),
    overrideableLevelKeys: ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
    validateParams() { return null; },
  },
  'language.choice.synonyms': {
    gameId: 'language_grove',
    family: 'choice_round',
    handlerClass: LanguageSynonymsChoiceMode,
    label: 'Language Synonyms Choice',
    description: 'Choose the synonym.',
    params: makeParamMap(
      ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
      [],
      {},
    ),
    overrideableLevelKeys: ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
    validateParams() { return null; },
  },
  'language.choice.riddle': {
    gameId: 'language_grove',
    family: 'choice_round',
    handlerClass: LanguageRiddleChoiceMode,
    label: 'Language Riddle Choice',
    description: 'Choose the answer to a riddle.',
    params: makeParamMap(
      ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
      [],
      {},
    ),
    overrideableLevelKeys: ['fallSpeed', 'answerCount', 'pointsPerCorrect', 'wrongPenalty'],
    validateParams() { return null; },
  },
  'watermelon.collection.classic': {
    gameId: 'watermelon_catch',
    family: 'collection',
    handlerClass: WatermelonClassicCollectionMode,
    label: 'Watermelon Classic Collection',
    description: 'Catch fruit and specials with the standard watermelon ruleset.',
    params: makeParamMap(
      ['itemValues', 'timeBonuses', 'bombPenalty'],
      ['fallSpeedMult', 'spawnRateMult', 'specialItems', 'wrongPenalty', 'wrongFeedback'],
      {
        fallSpeedMult: 1,
        spawnRateMult: 1,
        wrongPenalty: 0,
        wrongFeedback: '🚫',
        specialItems: {
          hourglass: true,
          clock: true,
          bomb: true,
          gold: true,
          silver: true,
        },
      },
    ),
    overrideableLevelKeys: ['fallSpeedMult', 'spawnRateMult', 'specialItems'],
    validateParams(params) {
      if (typeof params.itemValues !== 'object' || typeof params.timeBonuses !== 'object') {
        return 'itemValues and timeBonuses must be objects';
      }
      return null;
    },
  },
});

const MODE_TOP_LEVEL_KEYS = new Set(['id', 'type', 'title', 'prompt', 'params']);

export function getRegistryEntry(type) {
  return MODE_TYPE_REGISTRY[type] ?? null;
}

export function listModeTypes(gameId = null) {
  return Object.entries(MODE_TYPE_REGISTRY)
    .filter(([, entry]) => !gameId || entry.gameId === gameId)
    .map(([type, entry]) => ({ type, ...entry }));
}

export function normalizeModeDefinitions(gameId, modeDefinitions) {
  return (modeDefinitions ?? []).map((mode) => normalizeModeDefinition(gameId, mode));
}

function normalizeModeDefinition(gameId, mode) {
  for (const key of Object.keys(mode ?? {})) {
    if (!MODE_TOP_LEVEL_KEYS.has(key)) {
      throw new Error(`Invalid key "${key}" in mode "${mode?.id ?? 'unknown'}"`);
    }
  }
  if (typeof mode?.id !== 'string' || !mode.id) {
    throw new Error('Mode id must be a non-empty string');
  }
  if (typeof mode?.type !== 'string' || !mode.type) {
    throw new Error(`Mode "${mode.id}" is missing type`);
  }
  const registryEntry = getRegistryEntry(mode.type);
  if (!registryEntry) {
    throw new Error(`Mode "${mode.id}" uses unsupported type "${mode.type}"`);
  }
  if (registryEntry.gameId !== gameId) {
    throw new Error(`Mode "${mode.id}" type "${mode.type}" does not belong to game "${gameId}"`);
  }
  if (typeof mode.title !== 'string' || typeof mode.prompt !== 'string') {
    throw new Error(`Mode "${mode.id}" must include title and prompt strings`);
  }
  const params = { ...structuredClone(registryEntry.params.defaults ?? {}), ...(mode.params ?? {}) };
  for (const requiredKey of registryEntry.params.required) {
    if (!(requiredKey in params)) {
      throw new Error(`Mode "${mode.id}" is missing required param "${requiredKey}"`);
    }
  }
  for (const paramKey of Object.keys(params)) {
    if (!registryEntry.params.allowed.has(paramKey)) {
      throw new Error(`Mode "${mode.id}" has unsupported param "${paramKey}" for type "${mode.type}"`);
    }
  }
  const validationMessage = registryEntry.validateParams?.(params);
  if (validationMessage) {
    throw new Error(`Mode "${mode.id}" is invalid: ${validationMessage}`);
  }

  return {
    id: mode.id,
    type: mode.type,
    title: mode.title,
    prompt: mode.prompt,
    family: registryEntry.family,
    gameId,
    label: registryEntry.label,
    description: registryEntry.description,
    params,
    overrideableLevelKeys: [...registryEntry.overrideableLevelKeys],
    handlerClass: registryEntry.handlerClass,
  };
}

export function normalizeLevelDefinitions(gameId, levels, modeMap, worldId) {
  return (levels ?? []).map((level) => normalizeLevelDefinition(gameId, level, modeMap, worldId));
}

function normalizeLevelDefinition(gameId, level, modeMap, worldId) {
  if (typeof level?.modeId !== 'string' || !level.modeId) {
    throw new Error(`Level "${level?.levelId ?? level?.levelNum ?? 'unknown'}" is missing modeId`);
  }
  const mode = modeMap.get(level.modeId);
  if (!mode) {
    throw new Error(`Level "${level?.levelId ?? level?.levelNum ?? 'unknown'}" references unknown modeId "${level.modeId}"`);
  }
  const allowedKeys = new Set([...BASE_LEVEL_KEYS, ...mode.overrideableLevelKeys]);
  for (const key of Object.keys(level ?? {})) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Level "${level?.levelId ?? level?.levelNum ?? 'unknown'}" has unsupported key "${key}" for mode "${level.modeId}"`);
    }
  }
  const modeOverrides = {};
  for (const key of mode.overrideableLevelKeys) {
    if (key in level) {
      modeOverrides[key] = level[key];
    }
  }
  return {
    worldId,
    levelId: level.levelId ?? `${worldId}_${level.levelNum}`,
    ...level,
    worldId,
    modeOverrides,
  };
}

export function resolveModeForLevel(modeDefinition, levelDefinition) {
  if (!modeDefinition) return null;
  const overrideableKeys = new Set(modeDefinition.overrideableLevelKeys ?? []);
  const overrides = Object.fromEntries(
    Object.entries(levelDefinition?.modeOverrides ?? {}).filter(([key]) => overrideableKeys.has(key)),
  );
  return {
    ...modeDefinition,
    params: {
      ...modeDefinition.params,
      ...overrides,
    },
  };
}

export function createModeHandler(shell, modeDefinition) {
  const ModeClass = modeDefinition?.handlerClass;
  if (!ModeClass) {
    throw new Error(`No handler class registered for mode type "${modeDefinition?.type ?? 'unknown'}"`);
  }
  return new ModeClass(shell, modeDefinition);
}
