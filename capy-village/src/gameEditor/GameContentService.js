import { GAME_PLUGINS } from '../games/plugins/index.js';

const BASE_URL = import.meta.env.BASE_URL;

function deepClone(value) {
  return structuredClone(value);
}

function pathJoin(...parts) {
  return parts.map((part, index) => {
    if (index === 0) {
      return part.replace(/\/+$/, '');
    }
    return part.replace(/^\/+|\/+$/g, '');
  }).join('/');
}

async function fetchJson(url, options = undefined) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

function authoredManifestFromState(game, worlds) {
  return {
    ...deepClone(game),
    worlds: worlds.map((world) => deepClone(world)),
  };
}

function makeValidationError(path, message, severity = 'error') {
  return { path, message, severity };
}

function detectWorldGraphIssues(worlds) {
  const errors = [];
  const worldMap = new Map(worlds.map((world) => [world.id, world]));

  worlds.forEach((world) => {
    if (world.unlockAfterWorldId && !worldMap.has(world.unlockAfterWorldId)) {
      errors.push(makeValidationError(`worlds.${world.id}.unlockAfterWorldId`, `Unknown world id "${world.unlockAfterWorldId}"`));
    }
  });

  worlds.forEach((world) => {
    const seen = new Set([world.id]);
    let cursor = world;
    while (cursor?.unlockAfterWorldId) {
      if (seen.has(cursor.unlockAfterWorldId)) {
        errors.push(makeValidationError(`worlds.${world.id}.unlockAfterWorldId`, 'World unlock graph contains a cycle'));
        break;
      }
      seen.add(cursor.unlockAfterWorldId);
      cursor = worldMap.get(cursor.unlockAfterWorldId) ?? null;
    }
  });

  return errors;
}

function detectLevelIssues(worlds, recipeIds) {
  const errors = [];
  worlds.forEach((world) => {
    const slotMap = new Map();
    const levelIdMap = new Map();
    const levelNumMap = new Map();
    (world.levels ?? []).forEach((level, index) => {
      const levelPath = `worlds.${world.id}.levels[${index}]`;
      if (recipeIds && !recipeIds.has(level.recipeId)) {
        errors.push(makeValidationError(`${levelPath}.recipeId`, `Unknown recipe id "${level.recipeId}"`));
      }
      if (level.slot == null) {
        errors.push(makeValidationError(`${levelPath}.slot`, 'Level is missing a slot assignment'));
      } else if (slotMap.has(level.slot)) {
        errors.push(makeValidationError(`${levelPath}.slot`, `Slot ${level.slot} is already used by "${slotMap.get(level.slot)}"`));
      } else {
        slotMap.set(level.slot, level.label || level.levelId);
      }

      if (level.levelId) {
        if (levelIdMap.has(level.levelId)) {
          errors.push(makeValidationError(`${levelPath}.levelId`, `Duplicate levelId "${level.levelId}" in world`));
        } else {
          levelIdMap.set(level.levelId, true);
        }
      }
      if (level.levelNum != null) {
        if (levelNumMap.has(level.levelNum)) {
          errors.push(makeValidationError(`${levelPath}.levelNum`, `Duplicate levelNum ${level.levelNum} in world`));
        } else {
          levelNumMap.set(level.levelNum, true);
        }
      }
    });
  });
  return errors;
}

export class GameContentService {
  constructor(gameId) {
    this.gameId = gameId;
    this.plugin = GAME_PLUGINS[gameId];
    if (!this.plugin) {
      throw new Error(`No game plugin found for "${gameId}"`);
    }
  }

  getEditorDefinition() {
    return this.plugin.getEditorDefinition?.() ?? {
      gameId: this.gameId,
      label: this.gameId,
      goalTypes: [],
      modeDescriptors: this.plugin.modeDescriptors ?? [],
    };
  }

  async load() {
    const payload = await fetchJson(pathJoin(BASE_URL, '__authoring/game-config', this.gameId));
    const game = deepClone(payload.game);
    const worlds = deepClone(payload.worlds ?? []);
    const validation = this.validate(game, worlds);
    return {
      game,
      worlds,
      validation,
      editorDefinition: this.getEditorDefinition(),
    };
  }

  validate(game, worlds) {
    const errors = [];
    const recipeIds = new Set(Object.keys(game.recipes ?? {}));
    errors.push(...detectWorldGraphIssues(worlds));
    errors.push(...detectLevelIssues(worlds, recipeIds));

    try {
      const normalized = this.plugin.normalize(authoredManifestFromState(game, worlds));
      return {
        valid: errors.length === 0,
        errors,
        normalized,
      };
    } catch (error) {
      errors.push(makeValidationError('manifest', error instanceof Error ? error.message : String(error)));
      return {
        valid: false,
        errors,
        normalized: null,
      };
    }
  }

  async saveGame(game) {
    return fetchJson(pathJoin(BASE_URL, '__authoring/game-config', this.gameId, 'save-game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game),
    });
  }

  async saveWorld(world) {
    return fetchJson(pathJoin(BASE_URL, '__authoring/game-config', this.gameId, 'save-world', world.id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(world),
    });
  }

  getResolvedRecipe(validation, recipeId) {
    return validation.normalized?.recipes?.get(recipeId) ?? null;
  }

  getResolvedLevel(validation, levelId) {
    return validation.normalized?.levels?.find((level) => level.levelId === levelId) ?? null;
  }

  getUsedBy(worlds, recipeId) {
    return worlds.flatMap((world) =>
      (world.levels ?? [])
        .filter((level) => level.recipeId === recipeId)
        .map((level) => ({
          worldId: world.id,
          worldTitle: world.title,
          levelId: level.levelId,
          levelNum: level.levelNum,
          label: level.label,
        })),
    );
  }
}
