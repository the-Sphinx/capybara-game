import { gameState }   from '../state.js';
import { saveManager } from '../SaveManager.js';

class GameManager {
  constructor() {
    this._registry      = new Map();
    this._levels        = new Map();
    this._arcadeConfigs = new Map();
    this._activeGame    = null;

    this._overlay = document.createElement('div');
    this._overlay.id = 'game-overlay';
    this._overlay.style.display = 'none';
    document.body.appendChild(this._overlay);
  }

  register(gameId, factory) {
    this._registry.set(gameId, factory);
  }

  registerLevels(gameId, levels) {
    this._levels.set(gameId, levels);
  }

  registerArcadeConfig(gameId, config) {
    this._arcadeConfigs.set(gameId, config);
  }

  getLevels(gameId) {
    return this._levels.get(gameId) ?? [];
  }

  getArcadeConfig(gameId) {
    return this._arcadeConfigs.get(gameId) ?? null;
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
