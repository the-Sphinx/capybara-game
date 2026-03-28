function keySet(list = []) {
  return new Set(list);
}

function validateKeys(target, allowedKeys, context) {
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    throw new Error(`${context} must be an object`);
  }
  for (const key of Object.keys(target)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`${context} has unsupported key "${key}"`);
    }
  }
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeNested(base = {}, override = {}) {
  const result = structuredClone(base ?? {});
  for (const [key, value] of Object.entries(override ?? {})) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeNested(result[key], value);
    } else {
      result[key] = structuredClone(value);
    }
  }
  return result;
}

function mergeLevelDefaults(gameDefaults = {}, worldDefaults = {}, level = {}) {
  return {
    recipeId: level.recipeId ?? worldDefaults.recipeId ?? gameDefaults.recipeId ?? null,
    timeLimit: level.timeLimit ?? worldDefaults.timeLimit ?? gameDefaults.timeLimit ?? null,
    goal: structuredClone(level.goal ?? worldDefaults.goal ?? gameDefaults.goal ?? null),
    clearReward: level.clearReward ?? worldDefaults.clearReward ?? gameDefaults.clearReward ?? null,
    bonusTiers: structuredClone(level.bonusTiers ?? worldDefaults.bonusTiers ?? gameDefaults.bonusTiers ?? []),
  };
}

export function defineModeDescriptor(descriptor) {
  return Object.freeze({
    rules: {
      required: descriptor.rules?.required ?? [],
      optional: descriptor.rules?.optional ?? [],
      defaults: descriptor.rules?.defaults ?? {},
      overrideable: descriptor.rules?.overrideable ?? [],
    },
    scoring: {
      required: descriptor.scoring?.required ?? [],
      optional: descriptor.scoring?.optional ?? [],
      defaults: descriptor.scoring?.defaults ?? {},
      overrideable: descriptor.scoring?.overrideable ?? [],
    },
    docs: descriptor.docs ?? {},
    ...descriptor,
  });
}

function normalizeRecipe(plugin, recipeId, recipe, descriptorMap) {
  if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) {
    throw new Error(`Recipe "${recipeId}" must be an object`);
  }
  validateKeys(recipe, keySet(['kind', 'title', 'prompt', 'rules', 'scoring']), `Recipe "${recipeId}"`);
  if (typeof recipe.kind !== 'string' || !recipe.kind) {
    throw new Error(`Recipe "${recipeId}" is missing kind`);
  }

  const descriptor = descriptorMap.get(recipe.kind);
  if (!descriptor) {
    throw new Error(`Recipe "${recipeId}" uses unknown kind "${recipe.kind}" for game "${plugin.gameId}"`);
  }

  if (typeof recipe.title !== 'string' || typeof recipe.prompt !== 'string') {
    throw new Error(`Recipe "${recipeId}" must include title and prompt`);
  }

  const rulesAllowed = keySet([...descriptor.rules.required, ...descriptor.rules.optional]);
  const scoringAllowed = keySet([...descriptor.scoring.required, ...descriptor.scoring.optional]);
  const rules = mergeNested(descriptor.rules.defaults, recipe.rules ?? {});
  const scoring = mergeNested(descriptor.scoring.defaults, recipe.scoring ?? {});

  validateKeys(rules, rulesAllowed, `Recipe "${recipeId}" rules`);
  validateKeys(scoring, scoringAllowed, `Recipe "${recipeId}" scoring`);

  for (const key of descriptor.rules.required) {
    if (!(key in rules)) {
      throw new Error(`Recipe "${recipeId}" is missing required rule "${key}"`);
    }
  }
  for (const key of descriptor.scoring.required) {
    if (!(key in scoring)) {
      throw new Error(`Recipe "${recipeId}" is missing required scoring key "${key}"`);
    }
  }

  descriptor.validateRecipe?.({ id: recipeId, rules, scoring, recipe });

  return {
    id: recipeId,
    kind: recipe.kind,
    title: recipe.title,
    prompt: recipe.prompt,
    family: descriptor.family,
    rules,
    scoring,
    descriptor,
  };
}

function normalizeLevel(plugin, gameDefaults, world, level, recipeMap) {
  validateKeys(
    level,
    keySet(['levelId', 'levelNum', 'label', 'slot', 'recipeId', 'timeLimit', 'goal', 'clearReward', 'bonusTiers', 'overrides']),
    `Level "${level?.levelId ?? level?.levelNum ?? 'unknown'}"`,
  );

  const merged = mergeLevelDefaults(gameDefaults, world.defaults ?? {}, level);
  const recipeId = merged.recipeId;
  if (typeof recipeId !== 'string' || !recipeId) {
    throw new Error(`Level "${level?.levelId ?? level?.levelNum ?? 'unknown'}" is missing recipeId`);
  }
  const recipe = recipeMap.get(recipeId);
  if (!recipe) {
    throw new Error(`Level "${level?.levelId ?? level?.levelNum ?? 'unknown'}" references unknown recipeId "${recipeId}"`);
  }

  const descriptor = recipe.descriptor;
  const overrides = level.overrides ?? {};
  validateKeys(overrides, keySet(['rules', 'scoring']), `Level "${level.levelId ?? level.levelNum}" overrides`);
  const ruleOverrides = overrides.rules ?? {};
  const scoringOverrides = overrides.scoring ?? {};
  validateKeys(
    ruleOverrides,
    keySet(descriptor.rules.overrideable),
    `Level "${level.levelId ?? level.levelNum}" rule overrides`,
  );
  validateKeys(
    scoringOverrides,
    keySet(descriptor.scoring.overrideable),
    `Level "${level.levelId ?? level.levelNum}" scoring overrides`,
  );

  const resolvedRecipe = descriptor.resolve({
    recipe,
    level,
    world,
    rules: mergeNested(recipe.rules, ruleOverrides),
    scoring: mergeNested(recipe.scoring, scoringOverrides),
  });

  return {
    levelId: level.levelId ?? `${world.id}_${level.levelNum}`,
    levelNum: level.levelNum,
    label: level.label,
    worldId: world.id,
    slot: level.slot ?? null,
    recipeId,
    timeLimit: merged.timeLimit,
    goal: merged.goal,
    clearReward: merged.clearReward,
    bonusTiers: merged.bonusTiers,
    overrides: {
      rules: ruleOverrides,
      scoring: scoringOverrides,
    },
    resolvedRecipe,
  };
}

export function normalizeGameManifest(plugin, manifest) {
  validateKeys(
    manifest,
    keySet(['id', 'defaults', 'worldSelect', 'levelSelect', 'arcade', 'recipes', 'worlds']),
    `Game manifest "${plugin.gameId}"`,
  );
  if (manifest.id !== plugin.gameId) {
    throw new Error(`Game manifest id "${manifest.id}" does not match plugin "${plugin.gameId}"`);
  }

  const descriptorMap = new Map(plugin.modeDescriptors.map((descriptor) => [descriptor.kind, descriptor]));
  const recipeMap = new Map(
    Object.entries(manifest.recipes ?? {}).map(([recipeId, recipe]) => [
      recipeId,
      normalizeRecipe(plugin, recipeId, recipe, descriptorMap),
    ]),
  );

  const worlds = (manifest.worlds ?? []).map((world) => {
    validateKeys(
      world,
      keySet(['id', 'title', 'subtitle', 'unlockRequirementText', 'signBox', 'clickBox', 'defaults', 'levels']),
      `World "${world?.id ?? 'unknown'}"`,
    );
    const levels = (world.levels ?? []).map((level) =>
      normalizeLevel(plugin, manifest.defaults ?? {}, world, level, recipeMap),
    );
    return {
      ...world,
      defaults: world.defaults ?? {},
      levels,
    };
  });

  const levels = worlds.flatMap((world) => world.levels);
  const arcade = normalizeArcade(manifest.arcade ?? {}, recipeMap);

  return {
    gameId: plugin.gameId,
    defaults: manifest.defaults ?? {},
    worldSelect: {
      ...(manifest.worldSelect ?? { enabled: false }),
      worlds: worlds.map((world) => ({
        id: world.id,
        title: world.title,
        subtitle: world.subtitle ?? '',
        unlockRequirementText: world.unlockRequirementText ?? '',
        signBox: world.signBox,
        clickBox: world.clickBox,
      })),
    },
    levelSelect: manifest.levelSelect ?? { enabled: false },
    arcade,
    recipes: recipeMap,
    worlds,
    levels,
  };
}

function normalizeArcade(arcade, recipeMap) {
  validateKeys(arcade, keySet(['enabled', 'recipeIds', 'weights']), 'Arcade config');
  const recipeIds = arcade.recipeIds ?? Object.keys(arcade.weights ?? {});
  return {
    enabled: arcade.enabled !== false,
    recipeIds,
    weights: arcade.weights ?? {},
    recipes: recipeIds.map((recipeId) => recipeMap.get(recipeId)).filter(Boolean),
  };
}

export function buildGameSchema(plugin) {
  const kindEntries = plugin.modeDescriptors.map((descriptor) => {
    const ruleProperties = {};
    const scoringProperties = {};
    for (const key of [...descriptor.rules.required, ...descriptor.rules.optional]) {
      ruleProperties[key] = {};
    }
    for (const key of [...descriptor.scoring.required, ...descriptor.scoring.optional]) {
      scoringProperties[key] = {};
    }
    return {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'title', 'prompt', 'rules', 'scoring'],
      properties: {
        kind: { const: descriptor.kind },
        title: { type: 'string' },
        prompt: { type: 'string' },
        rules: {
          type: 'object',
          additionalProperties: false,
          required: descriptor.rules.required,
          properties: ruleProperties,
        },
        scoring: {
          type: 'object',
          additionalProperties: false,
          required: descriptor.scoring.required,
          properties: scoringProperties,
        },
      },
    };
  });

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: `${plugin.gameId} game manifest`,
    type: 'object',
    additionalProperties: false,
    required: ['id', 'recipes', 'worlds'],
    properties: {
      id: { const: plugin.gameId },
      defaults: { type: 'object' },
      worldSelect: { type: 'object' },
      levelSelect: { type: 'object' },
      arcade: { type: 'object' },
      recipes: {
        type: 'object',
        additionalProperties: {
          oneOf: kindEntries,
        },
      },
      worlds: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'title', 'levels'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            subtitle: { type: 'string' },
            unlockRequirementText: { type: 'string' },
            signBox: { type: 'object' },
            clickBox: { type: 'object' },
            defaults: { type: 'object' },
            levels: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  };
}

export function buildPluginDocs(plugin) {
  const sections = plugin.modeDescriptors.map((descriptor) => {
    const requiredRules = descriptor.rules.required.map((key) => `- \`${key}\``).join('\n') || '- none';
    const optionalRules = descriptor.rules.optional.map((key) => `- \`${key}\``).join('\n') || '- none';
    const requiredScoring = descriptor.scoring.required.map((key) => `- \`${key}\``).join('\n') || '- none';
    const optionalScoring = descriptor.scoring.optional.map((key) => `- \`${key}\``).join('\n') || '- none';
    const overrideRules = descriptor.rules.overrideable.map((key) => `- \`${key}\``).join('\n') || '- none';
    const overrideScoring = descriptor.scoring.overrideable.map((key) => `- \`${key}\``).join('\n') || '- none';
    return `## \`${descriptor.kind}\`

${descriptor.docs.summary ?? ''}

Uses family: \`${descriptor.family}\`

Required rules:
${requiredRules}

Optional rules:
${optionalRules}

Required scoring:
${requiredScoring}

Optional scoring:
${optionalScoring}

Level overrideable rule keys:
${overrideRules}

Level overrideable scoring keys:
${overrideScoring}
`;
  }).join('\n');

  return `# ${plugin.gameId} authoring

This game is authored through a single \`game.json\` manifest.

Recipes live under \`recipes\`.
Levels reference recipes with \`recipeId\`.
Level-specific tuning goes under \`overrides.rules\` and \`overrides.scoring\`.

${sections}`;
}
