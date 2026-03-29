import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const gameRoot = path.join(repoRoot, 'capy-village', 'public', 'config', 'games', 'math_garden');
const gamePath = path.join(gameRoot, 'game.json');
const worldsRoot = path.join(gameRoot, 'worlds');

function deepClone(value) {
  return structuredClone(value);
}

function matcherToObjectiveRule(rules = {}) {
  const matcher = rules.matcher;
  if (!matcher) {
    return { type: 'parity', parity: 'even' };
  }
  if (typeof matcher === 'string') {
    if (matcher === 'even' || matcher === 'odd') {
      return { type: 'parity', parity: matcher };
    }
    if (matcher === 'prime') {
      return { type: 'prime' };
    }
    if (matcher === 'divisible_by') {
      return { type: 'modulo', mod: rules.divisor ?? 2, remainder: rules.remainder ?? 0 };
    }
  }
  if (matcher.type === 'even' || matcher.type === 'odd') {
    return { type: 'parity', parity: matcher.type };
  }
  if (matcher.type === 'prime') {
    return { type: 'prime' };
  }
  if (matcher.type === 'divisible_by') {
    return { type: 'modulo', mod: matcher.divisor, remainder: matcher.remainder ?? 0 };
  }
  if (matcher.type === 'less_than_or_equal' || matcher.type === 'greater_than_or_equal') {
    return { type: 'comparison', comparison: matcher.type, value: matcher.value };
  }
  return { type: 'compound', matcher: deepClone(matcher) };
}

function collectLevelFromRecipe(worldId, level, recipe) {
  const mergedRules = {
    ...deepClone(recipe.rules ?? {}),
    ...deepClone(level.overrides?.rules ?? {}),
  };
  const mergedScoring = {
    ...deepClone(recipe.scoring ?? {}),
    ...deepClone(level.overrides?.scoring ?? {}),
  };
  const phases = (mergedRules.phases ?? []).map((phase) => ({
    switchAfterCaught: phase.switchAfterCaught,
    objective: {
      rule: matcherToObjectiveRule({ ...mergedRules, ...phase, matcher: phase.matcher ?? mergedRules.matcher }),
    },
    content: {
      domain: {
        kind: 'numbers',
        range: deepClone(phase.numberRange ?? mergedRules.numberRange ?? [1, 20]),
      },
      itemCount: phase.itemCount ?? mergedRules.itemCount,
      spawnDelayRange: deepClone(phase.spawnDelayRange ?? mergedRules.spawnDelayRange ?? null),
      fallSpeedRange: deepClone(phase.fallSpeedRange ?? mergedRules.fallSpeedRange ?? null),
    },
    presentation: {
      prompt: phase.prompt ?? recipe.prompt,
    },
  }));

  return {
    id: level.levelId,
    label: level.label,
    levelNum: level.levelNum,
    slot: level.slot,
    activityType: 'collect_stream',
    schemaVersion: 1,
    sourcePresetId: level.recipeId,
    objective: {
      rule: matcherToObjectiveRule(mergedRules),
    },
    content: {
      domain: {
        kind: 'numbers',
        range: deepClone(mergedRules.numberRange ?? [1, 20]),
      },
      itemCount: mergedRules.itemCount ?? 5,
      spawnDelayRange: deepClone(mergedRules.spawnDelayRange ?? null),
      fallSpeedRange: deepClone(mergedRules.fallSpeedRange ?? null),
    },
    difficulty: {
      timeLimit: level.timeLimit,
      goal: deepClone(level.goal),
      phases,
    },
    scoring: {
      pointsPerCorrect: mergedScoring.pointsPerCorrect ?? 2,
      wrongPenalty: mergedScoring.wrongPenalty ?? 0,
      wrongFeedback: mergedScoring.wrongFeedback ?? 'Wrong!',
      clearReward: level.clearReward,
      bonusTiers: deepClone(level.bonusTiers ?? []),
    },
    presentation: {
      title: recipe.title,
      prompt: recipe.prompt,
    },
  };
}

function answerLevelFromRecipe(level, recipe) {
  const mergedRules = {
    ...deepClone(recipe.rules ?? {}),
    ...deepClone(level.overrides?.rules ?? {}),
  };
  const mergedScoring = {
    ...deepClone(recipe.scoring ?? {}),
    ...deepClone(level.overrides?.scoring ?? {}),
  };

  return {
    id: level.levelId,
    label: level.label,
    levelNum: level.levelNum,
    slot: level.slot,
    activityType: 'answer_prompt',
    schemaVersion: 1,
    sourcePresetId: level.recipeId,
    objective: {
      operation: mergedRules.operation ?? 'addition',
    },
    content: {
      numberRange: deepClone(mergedRules.numberRange ?? [1, 10]),
      answerCount: mergedRules.answerCount ?? 3,
      fixedOperand: mergedRules.fixedOperand ?? null,
      targetValue: mergedRules.targetValue ?? null,
      leftRange: deepClone(mergedRules.leftRange ?? null),
      rightRange: deepClone(mergedRules.rightRange ?? null),
    },
    difficulty: {
      timeLimit: level.timeLimit,
      goal: deepClone(level.goal),
    },
    scoring: {
      pointsPerCorrect: mergedScoring.pointsPerCorrect ?? 10,
      wrongPenalty: mergedScoring.wrongPenalty ?? 0,
      wrongFeedback: mergedScoring.wrongFeedback ?? 'Try again!',
      clearReward: level.clearReward,
      bonusTiers: deepClone(level.bonusTiers ?? []),
    },
    presentation: {
      title: recipe.title,
      prompt: recipe.prompt,
    },
  };
}

function presetFromRecipe(id, recipe) {
  if (recipe.kind === 'collect_numbers') {
    return {
      id,
      label: recipe.title,
      description: recipe.prompt,
      activityType: 'collect_stream',
      objective: { rule: matcherToObjectiveRule(recipe.rules ?? {}) },
      content: {
        domain: {
          kind: 'numbers',
          range: deepClone(recipe.rules?.numberRange ?? [1, 20]),
        },
        itemCount: recipe.rules?.itemCount ?? 5,
        spawnDelayRange: deepClone(recipe.rules?.spawnDelayRange ?? null),
        fallSpeedRange: deepClone(recipe.rules?.fallSpeedRange ?? null),
      },
      difficulty: {},
      scoring: deepClone(recipe.scoring ?? {}),
      presentation: {
        title: recipe.title,
        prompt: recipe.prompt,
      },
    };
  }

  return {
    id,
    label: recipe.title,
    description: recipe.prompt,
    activityType: 'answer_prompt',
    objective: {
      operation: recipe.rules?.operation ?? 'addition',
    },
    content: {
      numberRange: deepClone(recipe.rules?.numberRange ?? [1, 10]),
      answerCount: recipe.rules?.answerCount ?? 3,
      fixedOperand: recipe.rules?.fixedOperand ?? null,
      targetValue: recipe.rules?.targetValue ?? null,
      leftRange: deepClone(recipe.rules?.leftRange ?? null),
      rightRange: deepClone(recipe.rules?.rightRange ?? null),
    },
    difficulty: {},
    scoring: deepClone(recipe.scoring ?? {}),
    presentation: {
      title: recipe.title,
      prompt: recipe.prompt,
    },
  };
}

const rawGame = JSON.parse(await fs.readFile(gamePath, 'utf8'));
const worldIds = rawGame.worldIds ?? [];
const worlds = await Promise.all(
  worldIds.map(async (worldId) => JSON.parse(await fs.readFile(path.join(worldsRoot, `${worldId}.json`), 'utf8'))),
);

const recipes = rawGame.recipes ?? {};
const migratedGame = {
  id: rawGame.id,
  label: 'Math Garden',
  schemaVersion: 1,
  defaults: {},
  worldIds: deepClone(worldIds),
  worldSelect: deepClone(rawGame.worldSelect ?? { enabled: false }),
  levelSelect: deepClone(rawGame.levelSelect ?? { enabled: false, slots: [] }),
  arcade: {
    enabled: rawGame.arcade?.enabled !== false,
    activities: (rawGame.arcade?.recipeIds ?? []).map((recipeId) => {
      const recipe = recipes[recipeId];
      const preset = presetFromRecipe(recipeId, recipe);
      return {
        id: recipeId,
        label: preset.label,
        activityType: preset.activityType,
        schemaVersion: 1,
        objective: preset.objective,
        content: preset.content,
        difficulty: {
          timeLimit: 60,
          goal: {
            type: preset.activityType === 'answer_prompt' ? 'correctAnswers' : 'catchCount',
            value: preset.activityType === 'answer_prompt' ? 8 : 12,
          },
        },
        scoring: {
          ...preset.scoring,
          clearReward: 0,
          bonusTiers: [],
        },
        presentation: preset.presentation,
        weight: rawGame.arcade?.weights?.[recipeId] ?? 1,
      };
    }),
  },
  presets: Object.entries(recipes).map(([id, recipe]) => presetFromRecipe(id, recipe)),
};

for (const world of worlds) {
  const migratedWorld = {
    id: world.id,
    title: world.title,
    subtitle: world.subtitle ?? '',
    label: world.title,
    theme: slugTheme(world.id),
    learningObjective: world.subtitle ?? '',
    unlockRequirementText: world.unlockRequirementText ?? '',
    startsUnlocked: world.startsUnlocked === true,
    unlockAfterWorldId: world.unlockAfterWorldId ?? null,
    signBox: deepClone(world.signBox ?? null),
    clickBox: deepClone(world.clickBox ?? null),
    defaults: {},
    levels: world.levels.map((level) => {
      const recipe = recipes[level.recipeId];
      return recipe.kind === 'collect_numbers'
        ? collectLevelFromRecipe(world.id, level, recipe)
        : answerLevelFromRecipe(level, recipe);
    }),
  };
  await fs.writeFile(path.join(worldsRoot, `${world.id}.json`), `${JSON.stringify(migratedWorld, null, 2)}\n`, 'utf8');
}

await fs.writeFile(gamePath, `${JSON.stringify(migratedGame, null, 2)}\n`, 'utf8');

function slugTheme(worldId) {
  return worldId.replaceAll('_', ' ');
}
