function keySet(list = []) {
  return new Set(list);
}

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function validateKeys(target, allowedKeys, context) {
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    fail(context, 'must be an object');
  }
  for (const key of Object.keys(target)) {
    if (!allowedKeys.has(key)) {
      fail(`${context}.${key}`, 'unsupported key');
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
    ruleSchemas: descriptor.ruleSchemas ?? {},
    scoringSchemas: descriptor.scoringSchemas ?? {},
    docs: descriptor.docs ?? {},
    editor: descriptor.editor ?? {},
    ...descriptor,
  });
}

export function attachRuntimeHandler(descriptor, handlerClass) {
  return Object.freeze({
    ...descriptor,
    handlerClass,
  });
}

function validateGoal(goal, path) {
  if (goal == null) return;
  if (!goal || typeof goal !== 'object' || Array.isArray(goal)) {
    fail(path, 'must be an object');
  }
  validateKeys(goal, keySet(['type', 'value']), path);
  if (typeof goal.type !== 'string' || !goal.type) {
    fail(`${path}.type`, 'must be a non-empty string');
  }
  if (!Number.isFinite(goal.value)) {
    fail(`${path}.value`, 'must be a number');
  }
}

function validateBonusTiers(bonusTiers, path) {
  if (bonusTiers == null) return;
  if (!Array.isArray(bonusTiers)) {
    fail(path, 'must be an array');
  }
  bonusTiers.forEach((tier, index) => {
    const tierPath = `${path}[${index}]`;
    if (!tier || typeof tier !== 'object' || Array.isArray(tier)) {
      fail(tierPath, 'must be an object');
    }
    validateKeys(tier, keySet(['threshold', 'reward']), tierPath);
    if (!Number.isFinite(tier.threshold)) {
      fail(`${tierPath}.threshold`, 'must be a number');
    }
    if (!Number.isFinite(tier.reward)) {
      fail(`${tierPath}.reward`, 'must be a number');
    }
  });
}

function validateDefaultBlock(block, path) {
  if (block == null) return;
  validateKeys(block, keySet(['recipeId', 'timeLimit', 'goal', 'clearReward', 'bonusTiers']), path);
  if ('recipeId' in block && (typeof block.recipeId !== 'string' || !block.recipeId)) {
    fail(`${path}.recipeId`, 'must be a non-empty string');
  }
  if ('timeLimit' in block && !Number.isFinite(block.timeLimit)) {
    fail(`${path}.timeLimit`, 'must be a number');
  }
  if ('clearReward' in block && !Number.isFinite(block.clearReward)) {
    fail(`${path}.clearReward`, 'must be a number');
  }
  validateGoal(block.goal, `${path}.goal`);
  validateBonusTiers(block.bonusTiers, `${path}.bonusTiers`);
}

function validateBox(box, path) {
  if (box == null) return;
  if (!box || typeof box !== 'object' || Array.isArray(box)) {
    fail(path, 'must be an object');
  }
  validateKeys(box, keySet(['x', 'y', 'w', 'h']), path);
  for (const key of ['x', 'y', 'w', 'h']) {
    if (!Number.isFinite(box[key])) {
      fail(`${path}.${key}`, 'must be a number');
    }
  }
}

function validateWorldSelect(worldSelect, path) {
  if (worldSelect == null) return;
  validateKeys(worldSelect, keySet(['enabled', 'backgroundPath']), path);
  if ('enabled' in worldSelect && typeof worldSelect.enabled !== 'boolean') {
    fail(`${path}.enabled`, 'must be a boolean');
  }
  if ('backgroundPath' in worldSelect && typeof worldSelect.backgroundPath !== 'string') {
    fail(`${path}.backgroundPath`, 'must be a string');
  }
}

function validateLevelSelect(levelSelect, path) {
  if (levelSelect == null) return;
  validateKeys(levelSelect, keySet(['enabled', 'backgroundPath', 'slots']), path);
  if ('enabled' in levelSelect && typeof levelSelect.enabled !== 'boolean') {
    fail(`${path}.enabled`, 'must be a boolean');
  }
  if ('backgroundPath' in levelSelect && typeof levelSelect.backgroundPath !== 'string') {
    fail(`${path}.backgroundPath`, 'must be a string');
  }
  if ('slots' in levelSelect) {
    if (!Array.isArray(levelSelect.slots)) {
      fail(`${path}.slots`, 'must be an array');
    }
    levelSelect.slots.forEach((slot, index) => {
      const slotPath = `${path}.slots[${index}]`;
      validateKeys(slot, keySet(['slot', 'x', 'y', 'r']), slotPath);
      for (const key of ['slot', 'x', 'y', 'r']) {
        if (!Number.isFinite(slot[key])) {
          fail(`${slotPath}.${key}`, 'must be a number');
        }
      }
    });
  }
}

function normalizeRecipe(plugin, recipeId, recipe, descriptorMap) {
  if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) {
    throw new Error(`Recipe "${recipeId}" must be an object`);
  }
  const recipePath = `recipes.${recipeId}`;
  validateKeys(recipe, keySet(['kind', 'title', 'prompt', 'rules', 'scoring']), recipePath);
  if (typeof recipe.kind !== 'string' || !recipe.kind) {
    fail(`${recipePath}.kind`, 'must be a non-empty string');
  }

  const descriptor = descriptorMap.get(recipe.kind);
  if (!descriptor) {
    fail(`${recipePath}.kind`, `expected one of [${[...descriptorMap.keys()].join(', ')}], got "${recipe.kind}"`);
  }

  if (typeof recipe.title !== 'string' || typeof recipe.prompt !== 'string') {
    fail(recipePath, 'must include title and prompt strings');
  }

  const rulesAllowed = keySet([...descriptor.rules.required, ...descriptor.rules.optional]);
  const scoringAllowed = keySet([...descriptor.scoring.required, ...descriptor.scoring.optional]);
  const rules = mergeNested(descriptor.rules.defaults, recipe.rules ?? {});
  const scoring = mergeNested(descriptor.scoring.defaults, recipe.scoring ?? {});

  validateKeys(rules, rulesAllowed, `${recipePath}.rules`);
  validateKeys(scoring, scoringAllowed, `${recipePath}.scoring`);

  for (const key of descriptor.rules.required) {
    if (!(key in rules)) {
      fail(`${recipePath}.rules.${key}`, 'missing required key');
    }
  }
  for (const key of descriptor.scoring.required) {
    if (!(key in scoring)) {
      fail(`${recipePath}.scoring.${key}`, 'missing required key');
    }
  }

  descriptor.validateRecipe?.({
    id: recipeId,
    path: recipePath,
    rules,
    scoring,
    recipe,
    fail,
  });

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
  const levelPath = `worlds.${world.id}.levels.${level?.levelId ?? level?.levelNum ?? 'unknown'}`;
  validateKeys(
    level,
    keySet(['levelId', 'levelNum', 'label', 'slot', 'recipeId', 'timeLimit', 'goal', 'clearReward', 'bonusTiers', 'overrides']),
    levelPath,
  );
  if (typeof level?.levelId !== 'string' || !level.levelId) {
    fail(`${levelPath}.levelId`, 'must be a non-empty string');
  }
  if (!Number.isFinite(level?.levelNum)) {
    fail(`${levelPath}.levelNum`, 'must be a number');
  }
  if (typeof level?.label !== 'string' || !level.label) {
    fail(`${levelPath}.label`, 'must be a non-empty string');
  }
  if ('slot' in level && !Number.isFinite(level.slot)) {
    fail(`${levelPath}.slot`, 'must be a number');
  }

  const merged = mergeLevelDefaults(gameDefaults, world.defaults ?? {}, level);
  const recipeId = merged.recipeId;
  if (typeof recipeId !== 'string' || !recipeId) {
    fail(`${levelPath}.recipeId`, 'must be a non-empty string');
  }
  const recipe = recipeMap.get(recipeId);
  if (!recipe) {
    fail(`${levelPath}.recipeId`, `unknown recipeId "${recipeId}"`);
  }

  const descriptor = recipe.descriptor;
  const overrides = level.overrides ?? {};
  validateKeys(overrides, keySet(['rules', 'scoring']), `${levelPath}.overrides`);
  const ruleOverrides = overrides.rules ?? {};
  const scoringOverrides = overrides.scoring ?? {};
  validateKeys(
    ruleOverrides,
    keySet(descriptor.rules.overrideable),
    `${levelPath}.overrides.rules`,
  );
  validateKeys(
    scoringOverrides,
    keySet(descriptor.scoring.overrideable),
    `${levelPath}.overrides.scoring`,
  );
  if ('timeLimit' in level && !Number.isFinite(level.timeLimit)) {
    fail(`${levelPath}.timeLimit`, 'must be a number');
  }
  if ('clearReward' in level && !Number.isFinite(level.clearReward)) {
    fail(`${levelPath}.clearReward`, 'must be a number');
  }
  validateGoal(level.goal, `${levelPath}.goal`);
  validateBonusTiers(level.bonusTiers, `${levelPath}.bonusTiers`);

  const resolvedRecipe = descriptor.resolve({
    recipe,
    level,
    world,
    rules: mergeNested(recipe.rules, ruleOverrides),
    scoring: mergeNested(recipe.scoring, scoringOverrides),
  });
  const normalizedResolvedRecipe = {
    descriptor,
    ...resolvedRecipe,
  };

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
    resolvedRecipe: normalizedResolvedRecipe,
  };
}

export function normalizeGameManifest(plugin, manifest) {
  validateKeys(
    manifest,
    keySet(['id', 'defaults', 'worldSelect', 'levelSelect', 'arcade', 'recipes', 'worlds']),
    `Game manifest "${plugin.gameId}"`,
  );
  if (manifest.id !== plugin.gameId) {
    fail('id', `expected "${plugin.gameId}", got "${manifest.id}"`);
  }
  validateDefaultBlock(manifest.defaults, 'defaults');
  validateWorldSelect(manifest.worldSelect, 'worldSelect');
  validateLevelSelect(manifest.levelSelect, 'levelSelect');

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
        keySet(['id', 'title', 'subtitle', 'unlockRequirementText', 'startsUnlocked', 'unlockAfterWorldId', 'signBox', 'clickBox', 'defaults', 'levels']),
      `worlds.${world?.id ?? 'unknown'}`,
    );
    if (typeof world.id !== 'string' || !world.id) {
      fail('worlds.id', 'must be a non-empty string');
    }
    if (typeof world.title !== 'string' || !world.title) {
      fail(`worlds.${world.id}.title`, 'must be a non-empty string');
    }
    if ('subtitle' in world && typeof world.subtitle !== 'string') {
      fail(`worlds.${world.id}.subtitle`, 'must be a string');
    }
    if ('unlockRequirementText' in world && typeof world.unlockRequirementText !== 'string') {
      fail(`worlds.${world.id}.unlockRequirementText`, 'must be a string');
    }
    if ('startsUnlocked' in world && typeof world.startsUnlocked !== 'boolean') {
      fail(`worlds.${world.id}.startsUnlocked`, 'must be a boolean');
    }
    if ('unlockAfterWorldId' in world && typeof world.unlockAfterWorldId !== 'string') {
      fail(`worlds.${world.id}.unlockAfterWorldId`, 'must be a string');
    }
    validateBox(world.signBox, `worlds.${world.id}.signBox`);
    validateBox(world.clickBox, `worlds.${world.id}.clickBox`);
    validateDefaultBlock(world.defaults, `worlds.${world.id}.defaults`);
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
        startsUnlocked: world.startsUnlocked === true,
        unlockAfterWorldId: world.unlockAfterWorldId ?? null,
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
  if ('enabled' in arcade && typeof arcade.enabled !== 'boolean') {
    fail('Arcade config.enabled', 'must be a boolean');
  }
  if ('recipeIds' in arcade && !Array.isArray(arcade.recipeIds)) {
    fail('Arcade config.recipeIds', 'must be an array');
  }
  if ('weights' in arcade && (!arcade.weights || typeof arcade.weights !== 'object' || Array.isArray(arcade.weights))) {
    fail('Arcade config.weights', 'must be an object');
  }
  const recipeIds = arcade.recipeIds ?? Object.keys(arcade.weights ?? {});
  return {
    enabled: arcade.enabled !== false,
    recipeIds,
    weights: arcade.weights ?? {},
    recipes: recipeIds.map((recipeId) => recipeMap.get(recipeId)).filter(Boolean),
  };
}

export function buildGameSchema(plugin) {
  const goalSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'value'],
    properties: {
      type: { type: 'string' },
      value: { type: 'number' },
    },
  };
  const bonusTierSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['threshold', 'reward'],
    properties: {
      threshold: { type: 'number' },
      reward: { type: 'number' },
    },
  };
  const defaultsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      recipeId: { type: 'string' },
      timeLimit: { type: 'number' },
      goal: goalSchema,
      clearReward: { type: 'number' },
      bonusTiers: { type: 'array', items: bonusTierSchema },
    },
  };
  const boxSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['x', 'y', 'w', 'h'],
    properties: {
      x: { type: 'number' },
      y: { type: 'number' },
      w: { type: 'number' },
      h: { type: 'number' },
    },
  };
  function typedField(fieldSchema = {}) {
    return Object.keys(fieldSchema).length ? fieldSchema : { type: 'string' };
  }
  const kindEntries = plugin.modeDescriptors.map((descriptor) => {
    const ruleProperties = {};
    const scoringProperties = {};
    for (const key of [...descriptor.rules.required, ...descriptor.rules.optional]) {
      ruleProperties[key] = typedField(descriptor.ruleSchemas[key]);
    }
    for (const key of [...descriptor.scoring.required, ...descriptor.scoring.optional]) {
      scoringProperties[key] = typedField(descriptor.scoringSchemas[key]);
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
    required: ['id', 'worldIds', 'recipes'],
    properties: {
      id: { const: plugin.gameId },
      worldIds: {
        type: 'array',
        items: { type: 'string' },
      },
      defaults: defaultsSchema,
      worldSelect: {
        type: 'object',
        additionalProperties: false,
        properties: {
          enabled: { type: 'boolean' },
          backgroundPath: { type: 'string' },
        },
      },
      levelSelect: {
        type: 'object',
        additionalProperties: false,
        properties: {
          enabled: { type: 'boolean' },
          backgroundPath: { type: 'string' },
          slots: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['slot', 'x', 'y', 'r'],
              properties: {
                slot: { type: 'number' },
                x: { type: 'number' },
                y: { type: 'number' },
                r: { type: 'number' },
              },
            },
          },
        },
      },
      arcade: {
        type: 'object',
        additionalProperties: false,
        properties: {
          enabled: { type: 'boolean' },
          recipeIds: {
            type: 'array',
            items: { type: 'string' },
          },
          weights: {
            type: 'object',
            additionalProperties: { type: 'number' },
          },
        },
      },
      recipes: {
        type: 'object',
        additionalProperties: {
          oneOf: kindEntries,
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
    const ruleExtras = Object.entries(descriptor.ruleSchemas ?? {})
      .filter(([, schema]) => Array.isArray(schema?.enum))
      .map(([key, schema]) => `Allowed \`${key}\` values: ${schema.enum.map((value) => `\`${value}\``).join(', ')}`)
      .join('\n');

    const recipeExample = descriptor.docs.exampleRecipe
      ? `Recipe example:
\`\`\`json
${JSON.stringify(descriptor.docs.exampleRecipe, null, 2)}
\`\`\`
`
      : '';

    const levelExample = descriptor.docs.exampleLevel
      ? `Level example:
\`\`\`json
${JSON.stringify(descriptor.docs.exampleLevel, null, 2)}
\`\`\`
`
      : '';

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

${ruleExtras}

${recipeExample}
${levelExample}
`;
  }).join('\n');

  return `# ${plugin.gameId} authoring

This game is authored through:
- \`game.json\` for shared game config
- \`worlds/<worldId>.json\` for world-specific progression content

Core concepts:
- \`recipes\` define reusable gameplay templates.
- Each recipe declares a \`kind\`, plus \`rules\` and \`scoring\`.
- \`worldIds\` in \`game.json\` define world loading order.
- Each \`worlds/<worldId>.json\` file defines one world and its \`levels\`.
- Levels reference recipes with \`recipeId\`.
- Level-specific tuning goes under \`overrides.rules\` and \`overrides.scoring\`.
- \`defaults\` can be set at the game level or per world, then overridden per level.

${sections}`;
}
