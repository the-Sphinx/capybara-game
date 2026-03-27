import { gameState }   from '../state.js';
import { saveManager } from '../SaveManager.js';
import {
  createModeHandler,
  normalizeLevelDefinitions,
  normalizeModeDefinitions,
  resolveModeForLevel,
} from './modeRegistry.js';

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
    this._registry      = new Map();
    this._gameConfigs   = new Map();
    this._configLoads   = new Map();
    this._activeGame    = null;

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
    const [arcadeConfig, worldSelectConfig, levelSelectConfig, modes] = await Promise.all([
      fetchJson(joinConfigPath(gameId, 'arcade.json')),
      fetchJson(joinConfigPath(gameId, 'world_select.json')),
      fetchJson(joinConfigPath(gameId, 'level_select.json')),
      fetchJson(joinConfigPath(gameId, 'modes.json')),
    ]);

    const normalizedModes = normalizeModeDefinitions(gameId, modes);
    const modeMap = new Map(normalizedModes.map((mode) => [mode.id, mode]));
    const levels = [];
    for (const world of worldSelectConfig?.worlds ?? []) {
      const worldId = world.id;
      const adventureLevels = await fetchJson(joinConfigPath(gameId, `levels/${worldId}_levels.json`));
      levels.push(...normalizeLevelDefinitions(gameId, adventureLevels, modeMap, worldId));
    }

    const arcadeModeIds = arcadeConfig?.modeIds
      ?? Object.keys(arcadeConfig?.arcadeWeights ?? {});
    const resolvedArcadeModes = arcadeModeIds
      .map((modeId) => modeMap.get(modeId))
      .filter(Boolean);

    return {
      gameId,
      levels,
      modes: normalizedModes,
      modeMap,
      arcadeConfig: {
        ...arcadeConfig,
        modes: resolvedArcadeModes,
      },
      worldSelectConfig,
      levelSelectConfig,
    };
  }

  ensureCachedGameConfig(gameId) {
    return this._gameConfigs.get(gameId) ?? null;
  }

  getLevels(gameId) {
    return this._gameConfigs.get(gameId)?.levels ?? [];
  }

  getArcadeConfig(gameId) {
    return this._gameConfigs.get(gameId)?.arcadeConfig ?? null;
  }

  getWorldSelectConfig(gameId) {
    return this._gameConfigs.get(gameId)?.worldSelectConfig ?? null;
  }

  getLevelSelectConfig(gameId) {
    return this._gameConfigs.get(gameId)?.levelSelectConfig ?? null;
  }

  getModeConfig(gameId, modeId) {
    return this._gameConfigs.get(gameId)?.modeMap?.get(modeId) ?? null;
  }

  resolveModeForLevel(gameId, levelRef) {
    const level = typeof levelRef === 'string'
      ? this.getLevelById(gameId, levelRef)
      : levelRef;
    if (!level) return null;
    return resolveModeForLevel(this.getModeConfig(gameId, level.modeId), level);
  }

  createModeHandler(gameId, shell) {
    return createModeHandler(shell, shell.mode);
  }

  resolveLaunchConfig(gameId, launchConfig) {
    if (!launchConfig || launchConfig.mode === 'arcade') {
      return launchConfig;
    }
    const sourceLevel = launchConfig.levelId
      ? (this.getLevelById(gameId, launchConfig.levelId) ?? launchConfig)
      : launchConfig;
    const resolvedMode = this.resolveModeForLevel(gameId, sourceLevel);
    return {
      ...sourceLevel,
      ...launchConfig,
      levelId: sourceLevel.levelId,
      worldId: sourceLevel.worldId,
      resolvedMode,
    };
  }

  getModes(gameId) {
    return this._gameConfigs.get(gameId)?.modes ?? [];
  }

  getLevelById(gameId, levelId) {
    return this.getLevels(gameId).find((level) => level.levelId === levelId) ?? null;
  }

  getNextAdventureLevel(gameId, levelId) {
    const levels = this.getLevels(gameId);
    const current = this.getLevelById(gameId, levelId);
    if (!current) return null;
    const worldLevels = levels
      .filter((level) => level.worldId === current.worldId)
      .sort((a, b) => a.levelNum - b.levelNum);
    const index = worldLevels.findIndex((level) => level.levelId === levelId);
    return index >= 0 ? (worldLevels[index + 1] ?? null) : null;
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
      console.log('[GameManager] result:', result);
      if (typeof result.coinsEarned === 'number' && result.coinsEarned > 0) {
        saveManager.addCoins(result.coinsEarned);
        console.log(`[GameManager] +${result.coinsEarned} coins → total ${saveManager.getData().coins}`);
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
