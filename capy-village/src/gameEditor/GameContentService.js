import { GAME_PLUGINS } from '../games/plugins/index.js';

const BASE_URL = import.meta.env.BASE_URL;

function deepClone(value) {
  return structuredClone(value);
}

function pathJoin(...parts) {
  return parts.map((part, index) => {
    if (index === 0) return part.replace(/\/+$/, '');
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
  return errors;
}

function detectLevelIssues(worlds) {
  const errors = [];
  worlds.forEach((world) => {
    const slotMap = new Map();
    const idMap = new Map();
    const numMap = new Map();
    (world.levels ?? []).forEach((level, index) => {
      const path = `worlds.${world.id}.levels[${index}]`;
      if (!level.id) {
        errors.push(makeValidationError(`${path}.id`, 'Level is missing an id'));
      } else if (idMap.has(level.id)) {
        errors.push(makeValidationError(`${path}.id`, `Duplicate level id "${level.id}" in world`));
      } else {
        idMap.set(level.id, true);
      }
      if (level.levelNum == null) {
        errors.push(makeValidationError(`${path}.levelNum`, 'Level is missing a level number'));
      } else if (numMap.has(level.levelNum)) {
        errors.push(makeValidationError(`${path}.levelNum`, `Duplicate level number ${level.levelNum} in world`));
      } else {
        numMap.set(level.levelNum, true);
      }
      if (level.slot == null) {
        errors.push(makeValidationError(`${path}.slot`, 'Level is missing a slot assignment'));
      } else if (slotMap.has(level.slot)) {
        errors.push(makeValidationError(`${path}.slot`, `Duplicate slot ${level.slot} in world`));
      } else {
        slotMap.set(level.slot, true);
      }
      if (!level.activityType) {
        errors.push(makeValidationError(`${path}.activityType`, 'Level is missing an activity type'));
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

  async load() {
    const payload = await fetchJson(pathJoin(BASE_URL, '__authoring/game-config', this.gameId));
    const game = deepClone(payload.game);
    const worlds = deepClone(payload.worlds ?? []);
    const validation = this.validate(game, worlds);
    return {
      game,
      worlds,
      validation,
      editorDefinition: this.plugin.getEditorDefinition(validation.normalized),
    };
  }

  validate(game, worlds) {
    const errors = [
      ...detectWorldGraphIssues(worlds),
      ...detectLevelIssues(worlds),
    ];
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

  getResolvedLevel(validation, levelId) {
    return validation.normalized?.levels?.find((level) => level.levelId === levelId || level.id === levelId) ?? null;
  }

  getPreset(editorDefinition, presetId) {
    return editorDefinition?.presets?.find((preset) => preset.id === presetId) ?? null;
  }

  getPreview(editorDefinition, levelOrResolvedLevel) {
    return editorDefinition?.buildPreview?.(levelOrResolvedLevel) ?? null;
  }
}
