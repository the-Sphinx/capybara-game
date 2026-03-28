import { gameState } from '../state.js';
import { saveManager } from '../SaveManager.js';
import { GAME_PLUGINS } from './plugins/index.js';

const BASE_URL = import.meta.env.BASE_URL;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

function joinConfigPath(gameId, relativePath) {
  return `${BASE_URL}config/games/${gameId}/${relativePath}`;
}

class GameManager {
  constructor() {
    this._registry = new Map();
    this._gameConfigs = new Map();
    this._configLoads = new Map();
    this._activeGame = null;

    this._overlay = document.createElement('div');
    this._overlay.id = 'game-overlay';
    this._overlay.style.display = 'none';
    document.body.appendChild(this._overlay);
  }

  register(gameId, factory) {
    this._registry.set(gameId, factory);
  }

  async ensureGameConfig(gameId) {
    if (this._gameConfigs.has(gameId)) {
      return this._gameConfigs.get(gameId);
    }
    if (this._configLoads.has(gameId)) {
      return this._configLoads.get(gameId);
    }

    const loadPromise = this._loadGameConfig(gameId);
    this._configLoads.set(gameId, loadPromise);

    try {
      const config = await loadPromise;
      this._gameConfigs.set(gameId, config);
      return config;
    } finally {
      this._configLoads.delete(gameId);
    }
  }

  async preloadGameConfigs(gameIds) {
    await Promise.all(gameIds.map((gameId) => this.ensureGameConfig(gameId)));
  }

  async _loadGameConfig(gameId) {
    const plugin = GAME_PLUGINS[gameId];
    if (!plugin) {
      throw new Error(`No game plugin registered for "${gameId}"`);
    }
    const authoredManifest = await fetchJson(joinConfigPath(gameId, 'game.json'));
    const worldIds = authoredManifest.worldIds ?? [];
    const worlds = await Promise.all(
      worldIds.map((worldId) => fetchJson(joinConfigPath(gameId, `worlds/${worldId}.json`))),
    );
    const { worldIds: _worldIds, ...sharedManifest } = authoredManifest;
    const config = plugin.normalize({
      ...sharedManifest,
      worlds,
    });

    const recipeIds = config.arcade.recipeIds ?? Object.keys(config.arcade.weights ?? {});
    const arcadeRecipes = recipeIds.map((recipeId) => config.recipes.get(recipeId)).filter(Boolean);

    return {
      ...config,
      plugin,
      arcade: {
        ...config.arcade,
        recipes: arcadeRecipes,
      },
    };
  }

  ensureCachedGameConfig(gameId) {
    return this._gameConfigs.get(gameId) ?? null;
  }

  getLevels(gameId) {
    return this._gameConfigs.get(gameId)?.levels ?? [];
  }

  getWorlds(gameId) {
    return this._gameConfigs.get(gameId)?.worlds ?? [];
  }

  getWorldById(gameId, worldId) {
    return this.getWorlds(gameId).find((world) => world.id === worldId) ?? null;
  }

  getArcadeConfig(gameId) {
    return this._gameConfigs.get(gameId)?.arcade ?? null;
  }

  getWorldSelectConfig(gameId) {
    return this._gameConfigs.get(gameId)?.worldSelect ?? null;
  }

  getLevelSelectConfig(gameId) {
    return this._gameConfigs.get(gameId)?.levelSelect ?? null;
  }

  getRecipes(gameId) {
    return this._gameConfigs.get(gameId)?.recipes ?? new Map();
  }

  getRecipe(gameId, recipeId) {
    return this._gameConfigs.get(gameId)?.recipes?.get(recipeId) ?? null;
  }

  resolveRecipeForLevel(gameId, levelRef) {
    const level = typeof levelRef === 'string'
      ? this.getLevelById(gameId, levelRef)
      : levelRef;
    if (!level) return null;
    return level.resolvedRecipe ?? null;
  }

  createModeHandler(gameId, shell) {
    const config = this._gameConfigs.get(gameId);
    return config?.plugin?.createHandler(shell, shell.mode) ?? null;
  }

  resolveLaunchConfig(gameId, launchConfig) {
    if (!launchConfig || launchConfig.mode === 'arcade') {
      return launchConfig;
    }
    const sourceLevel = launchConfig.levelId
      ? (this.getLevelById(gameId, launchConfig.levelId) ?? launchConfig)
      : launchConfig;
    const resolvedRecipe = this.resolveRecipeForLevel(gameId, sourceLevel);
    return {
      ...sourceLevel,
      ...launchConfig,
      levelId: sourceLevel.levelId,
      worldId: sourceLevel.worldId,
      resolvedRecipe,
    };
  }

  getLevelById(gameId, levelId) {
    return this.getLevels(gameId).find((level) => level.levelId === levelId) ?? null;
  }

  getNextAdventureLevel(gameId, levelId) {
    const levels = this.getLevels(gameId);
    const current = this.getLevelById(gameId, levelId);
    if (!current) return null;
    const worlds = this.getWorlds(gameId);
    const worldLevels = levels
      .filter((level) => level.worldId === current.worldId)
      .sort((a, b) => a.levelNum - b.levelNum);
    const index = worldLevels.findIndex((level) => level.levelId === levelId);
    if (index < 0) return null;
    const nextInWorld = worldLevels[index + 1] ?? null;
    if (nextInWorld) {
      return nextInWorld;
    }

    const currentWorldIndex = worlds.findIndex((world) => world.id === current.worldId);
    if (currentWorldIndex === -1) return null;

    const explicitUnlockTarget = worlds.find((world) =>
      world.unlockAfterWorldId === current.worldId && (world.levels?.length ?? 0) > 0,
    );
    if (explicitUnlockTarget) {
      return [...explicitUnlockTarget.levels].sort((a, b) => a.levelNum - b.levelNum)[0] ?? null;
    }

    for (let i = currentWorldIndex + 1; i < worlds.length; i += 1) {
      const nextWorld = worlds[i];
      if ((nextWorld.levels?.length ?? 0) > 0) {
        return [...nextWorld.levels].sort((a, b) => a.levelNum - b.levelNum)[0] ?? null;
      }
    }
    return null;
  }

  startGame(gameId, levelConfig = null) {
    const factory = this._registry.get(gameId);
    if (!factory) {
      console.warn(`GameManager: no game registered for "${gameId}"`);
      return;
    }
    if (this._activeGame) this._endActiveGame(null);

    gameState.modalOpen = true;

    const game = factory(this.resolveLaunchConfig(gameId, levelConfig));
    game._onFinish = (result) => this.endGame(result);
    this._activeGame = game;

    this._overlay.style.display = 'flex';
    this._overlay.innerHTML = '';
    game.start(this._overlay);
  }

  endGame(result) {
    if (!this._activeGame) return;
    this._endActiveGame(result);
  }

  _endActiveGame(result) {
    if (result) {
      if (typeof result.coinsEarned === 'number' && result.coinsEarned > 0) {
        saveManager.addCoins(result.coinsEarned);
      }
    }

    this._activeGame.destroy();
    this._activeGame = null;

    this._overlay.style.display = 'none';
    this._overlay.innerHTML = '';
    gameState.modalOpen = false;
  }

  update(delta) {
    if (this._activeGame) this._activeGame.update(delta);
  }

  isGameRunning() {
    return this._activeGame !== null;
  }
}

export const gameManager = new GameManager();
