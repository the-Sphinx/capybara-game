import { deepClone } from './descriptors/core.js';
import { collectStreamActivity } from './descriptors/activityTypes/collectStream.descriptor.js';
import { answerPromptActivity } from './descriptors/activityTypes/answerPrompt.descriptor.js';
import { resolveInheritance } from './inheritance/resolveInheritance.js';
import { validateResolvedLevel } from './validation/validateLevel.js';

const ACTIVITY_DESCRIPTORS = [collectStreamActivity, answerPromptActivity];
const ACTIVITY_MAP = new Map(ACTIVITY_DESCRIPTORS.map((descriptor) => [descriptor.id, descriptor]));

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function normalizeStarter(starter, index) {
  if (!starter || typeof starter !== 'object' || Array.isArray(starter)) {
    fail(`starters[${index}]`, 'must be an object');
  }
  if (typeof starter.id !== 'string' || !starter.id.startsWith('starter_')) {
    fail(`starters[${index}].id`, 'must start with "starter_"');
  }
  const descriptor = ACTIVITY_MAP.get(starter.activityType);
  if (!descriptor) {
    fail(`starters[${index}].activityType`, `unknown activity type "${starter.activityType}"`);
  }
  const starterLevel = resolveInheritance(descriptor, {}, {}, {
    id: starter.id,
    label: starter.label ?? starter.id,
    levelNum: 1,
    activityType: starter.activityType,
    schemaVersion: starter.schemaVersion ?? 1,
    objective: starter.objective ?? {},
    content: starter.content ?? {},
    difficulty: starter.difficulty ?? {},
    scoring: starter.scoring ?? {},
    presentation: starter.presentation ?? {},
  });
  validateResolvedLevel(descriptor, starterLevel, `starters[${index}]`);
  return {
    id: starter.id,
    label: starter.label ?? starter.id,
    description: starter.description ?? '',
    activityType: starter.activityType,
    objective: deepClone(starter.objective ?? {}),
    content: deepClone(starter.content ?? {}),
    difficulty: deepClone(starter.difficulty ?? {}),
    scoring: deepClone(starter.scoring ?? {}),
    presentation: deepClone(starter.presentation ?? {}),
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

    const resolvedLevel = resolveInheritance(descriptor, gameDefaults, defaults, level);
    validateResolvedLevel(descriptor, resolvedLevel, `worlds.${world.id}.levels[${index}]`);
    const resolvedActivity = {
      descriptor,
      ...descriptor.buildRuntime(resolvedLevel),
    };

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
      resolvedActivity,
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
  const resolved = resolveInheritance(descriptor, gameDefaults, {}, activity);
  validateResolvedLevel(descriptor, resolved, `arcade.activities[${index}]`);
  return {
    ...resolved,
    weight: activity.weight ?? 1,
    resolvedActivity: {
      descriptor,
      ...descriptor.buildRuntime(resolved),
    },
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
    starters: manifest.starters ?? [],
    authoringTiers: ['basic', 'advanced'],
    buildPreview(levelOrResolvedLevel) {
      const descriptor = ACTIVITY_MAP.get(levelOrResolvedLevel?.activityType);
      return descriptor?.buildPreview?.(levelOrResolvedLevel) ?? null;
    },
  };
}

export function normalizeMathGardenAuthoringManifest(manifest) {
  if (manifest.id !== 'math_garden') {
    fail('id', `expected "math_garden", got "${manifest.id}"`);
  }

  const defaults = deepClone(manifest.defaults ?? {});
  const starters = (manifest.starters ?? []).map(normalizeStarter);
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
    starters: deepClone(starters),
    worlds,
    levels,
    activities: new Map(),
    arcade: {
      enabled: manifest.arcade?.enabled !== false,
      activities: arcadeActivities.map((activity) => activity.resolvedActivity),
      activityIds: arcadeActivities.map((activity) => activity.id),
      weights: Object.fromEntries(arcadeActivities.map((activity) => [activity.id, activity.weight ?? 1])),
      definitions: arcadeActivities,
    },
    editorDefinition: buildEditorDefinition({
      id: manifest.id,
      label: manifest.label ?? 'Math Garden',
      starters,
    }),
  };
}

export function getMathGardenActivityDescriptors() {
  return ACTIVITY_DESCRIPTORS;
}

export function getMathGardenEditorDefinition(manifest) {
  return buildEditorDefinition(manifest);
}

export function buildStarterFromLevel(level, starterId) {
  return {
    id: starterId.startsWith('starter_') ? starterId : `starter_${starterId}`,
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
