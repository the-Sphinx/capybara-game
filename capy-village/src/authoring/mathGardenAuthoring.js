import { getAllFields, getFieldById, isFieldVisible } from './descriptors/core.js';
import { collectStreamActivity } from './descriptors/activityTypes/collectStream.descriptor.js';
import { answerPromptActivity } from './descriptors/activityTypes/answerPrompt.descriptor.js';

const ACTIVITY_DESCRIPTORS = [collectStreamActivity, answerPromptActivity];
const ACTIVITY_MAP = new Map(ACTIVITY_DESCRIPTORS.map((descriptor) => [descriptor.id, descriptor]));

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
  return structuredClone(value);
}

function mergeNested(base = {}, override = {}) {
  const result = deepClone(base ?? {});
  for (const [key, value] of Object.entries(override ?? {})) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeNested(result[key], value);
    } else {
      result[key] = deepClone(value);
    }
  }
  return result;
}

function pathSegments(path) {
  return String(path)
    .split('.')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function setAtPath(target, path, value) {
  const segments = pathSegments(path);
  let cursor = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = segments[index + 1];
    if (cursor[segment] == null) {
      cursor[segment] = typeof next === 'number' ? [] : {};
    }
    cursor = cursor[segment];
  }
  cursor[segments[segments.length - 1]] = value;
}

function getAtPath(source, path) {
  return pathSegments(path).reduce((cursor, segment) => cursor?.[segment], source);
}

function deleteEmptyObjects(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => deleteEmptyObjects(entry))
      .filter((entry) => entry != null && (!(typeof entry === 'object') || Object.keys(entry).length > 0));
  }
  if (!isPlainObject(value)) {
    return value;
  }
  const result = {};
  Object.entries(value).forEach(([key, entry]) => {
    const normalized = deleteEmptyObjects(entry);
    if (normalized == null) return;
    if (Array.isArray(normalized) && normalized.length === 0) return;
    if (isPlainObject(normalized) && Object.keys(normalized).length === 0) return;
    result[key] = normalized;
  });
  return result;
}

function assertRange(range, path) {
  if (!Array.isArray(range) || range.length !== 2 || !Number.isFinite(range[0]) || !Number.isFinite(range[1]) || range[0] > range[1]) {
    fail(path, 'must be a [min, max] pair');
  }
}

function isPrime(value) {
  if (value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
}

function matcherFromRule(rule) {
  if (!rule) {
    return { type: 'even' };
  }
  switch (rule.type) {
    case 'parity':
      return { type: rule.parity === 'odd' ? 'odd' : 'even' };
    case 'modulo':
      return { type: 'divisible_by', divisor: rule.mod, remainder: rule.remainder ?? 0 };
    case 'prime':
      return { type: 'prime' };
    case 'comparison':
      return {
        type: rule.comparison === 'greater_than_or_equal' ? 'greater_than_or_equal' : 'less_than_or_equal',
        value: rule.value,
      };
    case 'compound':
      return deepClone(rule.matcher ?? { type: 'even' });
    default:
      return deepClone(rule);
  }
}

function describeRule(rule) {
  if (!rule) return 'Catch the correct numbers!';
  switch (rule.type) {
    case 'parity':
      return `Catch ${rule.parity} numbers!`;
    case 'modulo':
      return `Catch numbers where remainder is ${rule.remainder ?? 0} when divided by ${rule.mod}!`;
    case 'prime':
      return 'Catch prime numbers!';
    case 'comparison':
      return rule.comparison === 'greater_than_or_equal'
        ? `Catch numbers ${rule.value} and above!`
        : `Catch numbers up to ${rule.value}!`;
    case 'compound':
      return 'Catch numbers that match the compound rule!';
    default:
      return 'Catch the correct numbers!';
  }
}

function sampleCollectPreview(level) {
  const range = level.content?.domain?.range ?? [1, 20];
  const matcher = matcherFromRule(level.objective?.rule);
  const phases = Array.isArray(level.difficulty?.phases) && level.difficulty.phases.length
    ? level.difficulty.phases
    : [{ prompt: level.presentation?.prompt, objective: { rule: level.objective?.rule }, content: level.content }];

  let seed = 13;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const matches = (matcherRule, value) => {
    switch (matcherRule.type) {
      case 'odd':
        return value % 2 === 1;
      case 'even':
        return value % 2 === 0;
      case 'prime':
        return isPrime(value);
      case 'divisible_by':
        return value % matcherRule.divisor === (matcherRule.remainder ?? 0);
      case 'less_than_or_equal':
        return value <= matcherRule.value;
      case 'greater_than_or_equal':
        return value >= matcherRule.value;
      case 'not':
        return !matches(matcherRule.rule, value);
      case 'any_of':
        return matcherRule.rules.some((child) => matches(child, value));
      case 'all_of':
        return matcherRule.rules.every((child) => matches(child, value));
      default:
        return false;
    }
  };

  return {
    type: 'collection',
    phases: phases.map((phase, index) => {
      const phaseRange = phase.content?.domain?.range ?? phase.content?.range ?? range;
      const phaseMatcher = matcherFromRule(phase.objective?.rule ?? level.objective?.rule);
      const samples = Array.from({ length: 12 }, () => {
        const value = Math.floor(random() * (phaseRange[1] - phaseRange[0] + 1)) + phaseRange[0];
        return { value, match: matches(phaseMatcher, value) };
      });
      return {
        label: phase.presentation?.prompt ?? phase.prompt ?? level.presentation?.prompt ?? describeRule(level.objective?.rule),
        switchAfterCaught: phase.switchAfterCaught ?? null,
        samples,
      };
    }),
    matcherSummary: JSON.stringify(matcher ?? {}),
  };
}

function sampleAnswerPreview(level) {
  const objective = level.objective ?? {};
  const content = level.content ?? {};
  const operation = objective.operation ?? 'addition';
  const symbols = operation === 'mixed' ? ['+', '-', '×', '÷'] : [
    operation === 'addition' ? '+' : operation === 'subtraction' ? '-' : operation === 'multiplication' ? '×' : '÷',
  ];
  let seed = 21;
  const random = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 0x100000000;
  };
  const pickInt = (range, fallback) => {
    const source = Array.isArray(range) ? range : fallback;
    return Math.floor(random() * (source[1] - source[0] + 1)) + source[0];
  };
  const range = content.numberRange ?? [1, 10];
  const rounds = Array.from({ length: 3 }, () => {
    const symbol = symbols[Math.floor(random() * symbols.length)];
    const leftRange = content.leftRange ?? range;
    const rightRange = content.rightRange ?? range;
    let left;
    let right;
    let answer;
    if (symbol === '+') {
      left = pickInt(leftRange, range);
      right = pickInt(rightRange, range);
      answer = left + right;
    } else if (symbol === '-') {
      left = pickInt(leftRange, range);
      right = Math.min(left, pickInt(rightRange, range));
      answer = left - right;
    } else if (symbol === '×') {
      left = Number.isInteger(content.fixedOperand) ? content.fixedOperand : pickInt(leftRange, range);
      right = pickInt(rightRange, range);
      answer = left * right;
    } else {
      right = Number.isInteger(content.fixedOperand) ? content.fixedOperand : Math.max(1, pickInt(rightRange, range));
      answer = pickInt(leftRange, range);
      left = answer * right;
    }
    const options = new Set([answer]);
    while (options.size < (content.answerCount ?? 3)) {
      const delta = options.size;
      const candidate = Math.max(0, answer + (delta % 2 === 0 ? -delta : delta));
      options.add(candidate);
    }
    return {
      equation: `${left} ${symbol} ${right} = ?`,
      answer,
      options: [...options].sort((a, b) => a - b),
    };
  });
  return { type: 'answer', rounds };
}

function previewForLevel(level) {
  return level.activityType === 'collect_stream'
    ? sampleCollectPreview(level)
    : sampleAnswerPreview(level);
}

function validateMatcher(matcher, path) {
  if (!isPlainObject(matcher)) {
    fail(path, 'must be an object');
  }
  switch (matcher.type) {
    case 'odd':
    case 'even':
    case 'prime':
      return;
    case 'divisible_by':
      if (!Number.isInteger(matcher.divisor) || matcher.divisor < 2) {
        fail(`${path}.divisor`, 'must be an integer >= 2');
      }
      if (matcher.remainder != null && !Number.isInteger(matcher.remainder)) {
        fail(`${path}.remainder`, 'must be an integer');
      }
      return;
    case 'less_than_or_equal':
    case 'greater_than_or_equal':
      if (!Number.isInteger(matcher.value)) {
        fail(`${path}.value`, 'must be an integer');
      }
      return;
    case 'not':
      validateMatcher(matcher.rule, `${path}.rule`);
      return;
    case 'any_of':
    case 'all_of':
      if (!Array.isArray(matcher.rules) || matcher.rules.length < 2) {
        fail(`${path}.rules`, 'must contain at least two child rules');
      }
      matcher.rules.forEach((rule, index) => validateMatcher(rule, `${path}.rules[${index}]`));
      return;
    default:
      fail(`${path}.type`, `unsupported matcher type "${matcher.type}"`);
  }
}

function validateGoal(goal, path) {
  if (!isPlainObject(goal)) {
    fail(path, 'must be an object');
  }
  if (typeof goal.type !== 'string' || !goal.type) {
    fail(`${path}.type`, 'must be a non-empty string');
  }
  if (!Number.isFinite(goal.value) || goal.value <= 0) {
    fail(`${path}.value`, 'must be a positive number');
  }
}

function validateBonusTiers(tiers, path) {
  if (tiers == null) return;
  if (!Array.isArray(tiers)) {
    fail(path, 'must be an array');
  }
  tiers.forEach((tier, index) => {
    if (!isPlainObject(tier)) {
      fail(`${path}[${index}]`, 'must be an object');
    }
    if (!Number.isFinite(tier.threshold)) {
      fail(`${path}[${index}].threshold`, 'must be a number');
    }
    if (!Number.isFinite(tier.reward)) {
      fail(`${path}[${index}].reward`, 'must be a number');
    }
  });
}

function validateCollectLevel(level, path) {
  const rule = level.objective?.rule;
  if (!isPlainObject(rule)) {
    fail(`${path}.objective.rule`, 'must be an object');
  }
  switch (rule.type) {
    case 'parity':
      if (!['even', 'odd'].includes(rule.parity)) {
        fail(`${path}.objective.rule.parity`, 'must be "even" or "odd"');
      }
      break;
    case 'modulo':
      if (!Number.isInteger(rule.mod) || rule.mod < 2) {
        fail(`${path}.objective.rule.mod`, 'must be an integer >= 2');
      }
      if (!Number.isInteger(rule.remainder) || rule.remainder < 0 || rule.remainder >= rule.mod) {
        fail(`${path}.objective.rule.remainder`, 'must be an integer >= 0 and < mod');
      }
      break;
    case 'prime':
      break;
    case 'comparison':
      if (!['less_than_or_equal', 'greater_than_or_equal'].includes(rule.comparison)) {
        fail(`${path}.objective.rule.comparison`, 'must be a supported comparison');
      }
      if (!Number.isInteger(rule.value)) {
        fail(`${path}.objective.rule.value`, 'must be an integer');
      }
      break;
    case 'compound':
      validateMatcher(rule.matcher, `${path}.objective.rule.matcher`);
      break;
    default:
      fail(`${path}.objective.rule.type`, `unsupported rule type "${rule.type}"`);
  }

  assertRange(level.content?.domain?.range, `${path}.content.domain.range`);
  if (!Number.isFinite(level.content?.itemCount) || level.content.itemCount < 1) {
    fail(`${path}.content.itemCount`, 'must be a positive number');
  }
  if (level.content?.spawnDelayRange) {
    assertRange(level.content.spawnDelayRange, `${path}.content.spawnDelayRange`);
  }
  if (level.content?.fallSpeedRange) {
    assertRange(level.content.fallSpeedRange, `${path}.content.fallSpeedRange`);
  }
  if (!Number.isFinite(level.difficulty?.timeLimit) || level.difficulty.timeLimit <= 0) {
    fail(`${path}.difficulty.timeLimit`, 'must be a positive number');
  }
  validateGoal(level.difficulty?.goal, `${path}.difficulty.goal`);
  validateBonusTiers(level.scoring?.bonusTiers, `${path}.scoring.bonusTiers`);
  if (Array.isArray(level.difficulty?.phases)) {
    level.difficulty.phases.forEach((phase, index) => {
      const phasePath = `${path}.difficulty.phases[${index}]`;
      if (!isPlainObject(phase)) {
        fail(phasePath, 'must be an object');
      }
      if (phase.switchAfterCaught != null && (!Number.isFinite(phase.switchAfterCaught) || phase.switchAfterCaught < 0)) {
        fail(`${phasePath}.switchAfterCaught`, 'must be a non-negative number');
      }
      if (phase.objective?.rule) {
        validateCollectLevel({
          objective: phase.objective,
          content: phase.content ?? level.content,
          difficulty: { timeLimit: 1, goal: { type: 'catchCount', value: 1 } },
          scoring: { bonusTiers: [] },
        }, phasePath);
      }
    });
  }
}

function validateAnswerLevel(level, path) {
  if (!['addition', 'subtraction', 'multiplication', 'division', 'mixed'].includes(level.objective?.operation)) {
    fail(`${path}.objective.operation`, 'must be a supported operation');
  }
  assertRange(level.content?.numberRange, `${path}.content.numberRange`);
  if (!Number.isFinite(level.content?.answerCount) || level.content.answerCount < 2) {
    fail(`${path}.content.answerCount`, 'must be a number >= 2');
  }
  if (level.content?.leftRange) {
    assertRange(level.content.leftRange, `${path}.content.leftRange`);
  }
  if (level.content?.rightRange) {
    assertRange(level.content.rightRange, `${path}.content.rightRange`);
  }
  if (level.content?.fixedOperand != null && (!Number.isInteger(level.content.fixedOperand) || level.content.fixedOperand <= 0)) {
    fail(`${path}.content.fixedOperand`, 'must be a positive integer');
  }
  if (level.content?.targetValue != null && !Number.isInteger(level.content.targetValue)) {
    fail(`${path}.content.targetValue`, 'must be an integer');
  }
  if (!Number.isFinite(level.difficulty?.timeLimit) || level.difficulty.timeLimit <= 0) {
    fail(`${path}.difficulty.timeLimit`, 'must be a positive number');
  }
  validateGoal(level.difficulty?.goal, `${path}.difficulty.goal`);
  validateBonusTiers(level.scoring?.bonusTiers, `${path}.scoring.bonusTiers`);
}

function defaultGoalType(activityType) {
  return activityType === 'answer_prompt' ? 'correctAnswers' : 'catchCount';
}

function deepFillDefaults(target, defaults = {}) {
  const result = deepClone(target ?? {});
  for (const [key, value] of Object.entries(defaults ?? {})) {
    if (result[key] == null) {
      result[key] = deepClone(value);
    } else if (isPlainObject(result[key]) && isPlainObject(value)) {
      result[key] = deepFillDefaults(result[key], value);
    }
  }
  return result;
}

function resolveActivityFields(activityDescriptor, gameDefaults, worldDefaults, level) {
  const resolved = {
    id: level.id,
    activityType: level.activityType,
    schemaVersion: level.schemaVersion ?? 1,
    label: level.label,
    levelNum: level.levelNum,
    slot: level.slot ?? null,
    objective: deepClone(level.objective ?? {}),
    content: deepClone(level.content ?? {}),
    difficulty: deepClone(level.difficulty ?? {}),
    scoring: deepClone(level.scoring ?? {}),
    presentation: deepClone(level.presentation ?? {}),
  };

  getAllFields(activityDescriptor).forEach((field) => {
    const [sectionId, ...localPath] = field.id.split('.');
    const sectionPath = localPath.join('.');
    const mergedSectionDefaults = mergeNested(
      gameDefaults?.[sectionId] ?? {},
      worldDefaults?.[sectionId] ?? {},
    );
    const currentValue = getAtPath(resolved, field.id);
    const inheritability = field.inheritability ?? 'none';
    let candidateValue = currentValue;

    if (candidateValue == null && (inheritability === 'world_default' || inheritability === 'game_default' || inheritability === 'both')) {
      candidateValue = getAtPath({ [sectionId]: mergedSectionDefaults }, field.id);
    }
    if (candidateValue == null && field.defaultValue !== undefined) {
      candidateValue = deepClone(field.defaultValue);
    }
    if (candidateValue != null) {
      if (sectionPath) {
        setAtPath(resolved[sectionId], sectionPath, candidateValue);
      } else {
        resolved[sectionId] = candidateValue;
      }
    }
  });

  return {
    ...resolved,
    objective: deleteEmptyObjects(resolved.objective) ?? {},
    content: deleteEmptyObjects(resolved.content) ?? {},
    difficulty: deleteEmptyObjects(resolved.difficulty) ?? {},
    scoring: deleteEmptyObjects(resolved.scoring) ?? {},
    presentation: deleteEmptyObjects(resolved.presentation) ?? {},
  };
}

function buildRuntimeMode(level, descriptor) {
  if (level.activityType === 'collect_stream') {
    const baseMatcher = matcherFromRule(level.objective.rule);
    const phases = Array.isArray(level.difficulty?.phases)
      ? level.difficulty.phases.map((phase) => ({
        switchAfterCaught: phase.switchAfterCaught,
        prompt: phase.presentation?.prompt ?? phase.prompt ?? level.presentation?.prompt,
        matcher: matcherFromRule(phase.objective?.rule ?? level.objective.rule),
        numberRange: phase.content?.domain?.range ?? phase.content?.range,
        itemCount: phase.content?.itemCount,
        spawnDelayRange: phase.content?.spawnDelayRange,
        fallSpeedRange: phase.content?.fallSpeedRange,
      }))
      : [];
    return {
      id: level.id,
      family: 'collection',
      kind: 'collect_stream',
      title: level.presentation?.title || level.label,
      prompt: level.presentation?.prompt || describeRule(level.objective.rule),
      descriptor,
      rules: {
        matcher: baseMatcher,
        numberRange: level.content?.domain?.range ?? [1, 20],
        itemCount: level.content?.itemCount ?? 5,
        spawnDelayRange: level.content?.spawnDelayRange,
        fallSpeedRange: level.content?.fallSpeedRange,
        phases,
      },
      scoring: {
        pointsPerCorrect: level.scoring?.pointsPerCorrect ?? 1,
        wrongPenalty: level.scoring?.wrongPenalty ?? 0,
        wrongFeedback: level.scoring?.wrongFeedback ?? 'Wrong!',
      },
    };
  }

  return {
    id: level.id,
    family: 'answer',
    kind: 'answer_prompt',
    title: level.presentation?.title || level.label,
    prompt: level.presentation?.prompt || 'Tap the correct answer!',
    descriptor,
    rules: {
      operation: level.objective?.operation ?? 'addition',
      numberRange: level.content?.numberRange ?? [1, 10],
      answerCount: level.content?.answerCount ?? 3,
      fixedOperand: level.content?.fixedOperand,
      targetValue: level.content?.targetValue,
      leftRange: level.content?.leftRange,
      rightRange: level.content?.rightRange,
    },
    scoring: {
      pointsPerCorrect: level.scoring?.pointsPerCorrect ?? 10,
      wrongPenalty: level.scoring?.wrongPenalty ?? 0,
      wrongFeedback: level.scoring?.wrongFeedback ?? 'Try again!',
    },
  };
}

function normalizeWorld(world, gameDefaults) {
  const defaults = deepClone(world.defaults ?? {});
  const levels = (world.levels ?? []).map((level, index) => {
    if (typeof level.id !== 'string' || !level.id) {
      fail(`worlds.${world.id}.levels[${index}].id`, 'must be a non-empty string');
    }
    if (typeof level.label !== 'string' || !level.label) {
      fail(`worlds.${world.id}.levels[${index}].label`, 'must be a non-empty string');
    }
    if (!Number.isFinite(level.levelNum)) {
      fail(`worlds.${world.id}.levels[${index}].levelNum`, 'must be a number');
    }
    const descriptor = ACTIVITY_MAP.get(level.activityType);
    if (!descriptor) {
      fail(`worlds.${world.id}.levels[${index}].activityType`, `unknown activity type "${level.activityType}"`);
    }

    const resolvedLevel = resolveActivityFields(descriptor, gameDefaults, defaults, level);
    if (descriptor.id === 'collect_stream') {
      validateCollectLevel(resolvedLevel, `worlds.${world.id}.levels[${index}]`);
    } else {
      validateAnswerLevel(resolvedLevel, `worlds.${world.id}.levels[${index}]`);
    }

    const runtimeMode = buildRuntimeMode(resolvedLevel, descriptor);
    return {
      levelId: resolvedLevel.id,
      id: resolvedLevel.id,
      levelNum: resolvedLevel.levelNum,
      label: resolvedLevel.label,
      worldId: world.id,
      slot: resolvedLevel.slot,
      activityType: resolvedLevel.activityType,
      schemaVersion: resolvedLevel.schemaVersion,
      objective: resolvedLevel.objective,
      content: resolvedLevel.content,
      difficulty: resolvedLevel.difficulty,
      scoring: resolvedLevel.scoring,
      presentation: resolvedLevel.presentation,
      timeLimit: resolvedLevel.difficulty.timeLimit,
      goal: resolvedLevel.difficulty.goal,
      clearReward: resolvedLevel.scoring.clearReward,
      bonusTiers: resolvedLevel.scoring.bonusTiers ?? [],
      resolvedRecipe: runtimeMode,
    };
  });

  return {
    ...world,
    label: world.label ?? world.title,
    title: world.title ?? world.label,
    subtitle: world.subtitle ?? '',
    defaults,
    levels,
  };
}

function normalizeArcadeActivity(activity, index, gameDefaults) {
  const descriptor = ACTIVITY_MAP.get(activity.activityType);
  if (!descriptor) {
    fail(`arcade.activities[${index}].activityType`, `unknown activity type "${activity.activityType}"`);
  }
  const resolved = resolveActivityFields(descriptor, gameDefaults, {}, activity);
  if (descriptor.id === 'collect_stream') {
    validateCollectLevel(resolved, `arcade.activities[${index}]`);
  } else {
    validateAnswerLevel(resolved, `arcade.activities[${index}]`);
  }
  return {
    ...resolved,
    weight: activity.weight ?? 1,
    resolvedRecipe: buildRuntimeMode(resolved, descriptor),
  };
}

function buildEditorDefinition(manifest) {
  return {
    gameId: manifest.id,
    label: manifest.label ?? 'Math Garden',
    activityDescriptors: ACTIVITY_DESCRIPTORS,
    goalTypes: [
      { value: 'catchCount', label: 'Catch Count', description: 'Catch the target number of correct falling items.' },
      { value: 'correctAnswers', label: 'Correct Answers', description: 'Answer the target number of prompts correctly.' },
      { value: 'score', label: 'Score', description: 'Reach the target score before time runs out.' },
      { value: 'combo', label: 'Combo', description: 'Reach the target combo streak.' },
    ],
    presets: manifest.presets ?? [],
    authoringTiers: ['basic', 'advanced'],
    buildPreview: previewForLevel,
  };
}

export function normalizeMathGardenAuthoringManifest(manifest) {
  if (manifest.id !== 'math_garden') {
    fail('id', `expected "math_garden", got "${manifest.id}"`);
  }
  const defaults = deepFillDefaults(manifest.defaults ?? {}, {});
  const worlds = (manifest.worlds ?? []).map((world) => normalizeWorld(world, defaults));
  const levels = worlds.flatMap((world) => world.levels);
  const arcadeActivities = (manifest.arcade?.activities ?? []).map((activity, index) => normalizeArcadeActivity(activity, index, defaults));
  return {
    gameId: manifest.id,
    label: manifest.label ?? 'Math Garden',
    schemaVersion: manifest.schemaVersion ?? 1,
    defaults,
    worldSelect: {
      ...(manifest.worldSelect ?? { enabled: false }),
      worlds: worlds.map((world) => ({
        id: world.id,
        title: world.title,
        subtitle: world.subtitle ?? '',
        unlockRequirementText: world.unlockRequirementText ?? '',
        startsUnlocked: world.startsUnlocked === true,
        unlockAfterWorldId: world.unlockAfterWorldId ?? null,
        signBox: world.signBox,
        clickBox: world.clickBox,
      })),
    },
    levelSelect: manifest.levelSelect ?? { enabled: false, slots: [] },
    presets: deepClone(manifest.presets ?? []),
    worlds,
    levels,
    recipes: new Map(),
    arcade: {
      enabled: manifest.arcade?.enabled !== false,
      recipes: arcadeActivities.map((activity) => activity.resolvedRecipe),
      recipeIds: arcadeActivities.map((activity) => activity.id),
      weights: Object.fromEntries(arcadeActivities.map((activity) => [activity.id, activity.weight ?? 1])),
      activities: arcadeActivities,
    },
    editorDefinition: buildEditorDefinition(manifest),
  };
}

export function getMathGardenActivityDescriptors() {
  return ACTIVITY_DESCRIPTORS;
}

export function getMathGardenEditorDefinition(manifest) {
  return buildEditorDefinition(manifest);
}

export function buildMathGardenPreview(level) {
  return previewForLevel(level);
}

export function buildPresetFromLevel(level, presetId) {
  return {
    id: presetId,
    label: level.presentation?.title || level.label,
    description: level.presentation?.prompt || '',
    activityType: level.activityType,
    objective: deepClone(level.objective),
    content: deepClone(level.content),
    difficulty: {},
    scoring: {
      pointsPerCorrect: level.scoring?.pointsPerCorrect,
      wrongPenalty: level.scoring?.wrongPenalty,
      wrongFeedback: level.scoring?.wrongFeedback,
    },
    presentation: {
      prompt: level.presentation?.prompt,
      title: level.presentation?.title ?? level.label,
    },
  };
}
