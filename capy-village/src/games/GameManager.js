import { gameState }   from '../state.js';
import { saveManager } from '../SaveManager.js';

const BASE_URL = import.meta.env.BASE_URL;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

function joinConfigPath(gameId, relativePath) {
  return `${BASE_URL}assets/config/games/${gameId}/${relativePath}`;
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
    const [arcadeConfig, worldSelectConfig] = await Promise.all([
      fetchJson(joinConfigPath(gameId, 'arcade.json')),
      fetchJson(joinConfigPath(gameId, 'world_select.json')),
    ]);

    const levels = [];
    const worldMapConfigs = {};
    for (const world of worldSelectConfig?.worlds ?? []) {
      const worldId = world.id;
      const [levelSelectConfig, adventureLevels] = await Promise.all([
        fetchJson(joinConfigPath(gameId, `worlds/${worldId}/level_select.json`)),
        fetchJson(joinConfigPath(gameId, `worlds/${worldId}/adventure_levels.json`)),
      ]);
      worldMapConfigs[worldId] = levelSelectConfig;
      levels.push(...adventureLevels);
    }

    return {
      gameId,
      levels,
      arcadeConfig,
      worldSelectConfig,
      worldMapConfigs,
    };
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

  getWorldMapConfig(gameId, worldId) {
    return this._gameConfigs.get(gameId)?.worldMapConfigs?.[worldId] ?? null;
  }

  startGame(gameId, levelConfig = null) {
    const factory = this._registry.get(gameId);
    if (!factory) {
      console.warn(`GameManager: no game registered for "${gameId}"`);
      return;
    }
    if (this._activeGame) this._endActiveGame(null);

    gameState.modalOpen = true;

    const game = factory(levelConfig);
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
