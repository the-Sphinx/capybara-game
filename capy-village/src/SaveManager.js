import { playerState } from './playerState.js';
import { EQUIPPED, CLOSET_TABS } from './state.js';

const STORAGE_KEY = 'capy_save';
const CURRENT_VERSION = 1;

const DEFAULT_SAVE = {
  version: 1,
  coins: 30,
  ownedItems: [],
  equipped: { hats: null, neck: null },
  progress: {
    watermelonCatch: { unlockedModes: ['classic'], bestScores: {} }
  },
  settings: { soundOn: true, musicOn: true },
};

class SaveManager {
  constructor() { this._data = null; }

  load() {
    let save = null;
    try { save = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    if (!save || typeof save !== 'object') save = structuredClone(DEFAULT_SAVE);
    if (save.version < CURRENT_VERSION) { this._migrate(save); }
    this._data = save;
    // Hydrate in-memory state
    playerState.coins      = this._data.coins;
    playerState.ownedItems = [...this._data.ownedItems];
    playerState.equipped   = { ...this._data.equipped };
    // Sync EQUIPPED (3D anchors) from playerState via CLOSET_TABS
    for (const [tabKey, tabCfg] of Object.entries(CLOSET_TABS)) {
      EQUIPPED[tabCfg.anchor] = playerState.equipped[tabKey] ?? null;
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  }

  getData() { return structuredClone(this._data); }

  addCoins(amount) {
    this._data.coins += amount;
    playerState.coins = this._data.coins;
    this.save();
  }

  spendCoins(amount) {
    if (this._data.coins < amount) return false;
    this._data.coins -= amount;
    playerState.coins = this._data.coins;
    this.save();
    return true;
  }

  unlockItem(id) {
    if (this._data.ownedItems.includes(id)) return;
    this._data.ownedItems.push(id);
    playerState.ownedItems.push(id);
    this.save();
  }

  equipItem(tabKey, itemId) {
    this._data.equipped[tabKey] = itemId;
    playerState.equipped[tabKey] = itemId;
    EQUIPPED[CLOSET_TABS[tabKey].anchor] = itemId;
    this.save();
  }

  unequipItem(tabKey) {
    this._data.equipped[tabKey] = null;
    playerState.equipped[tabKey] = null;
    EQUIPPED[CLOSET_TABS[tabKey].anchor] = null;
    this.save();
  }

  // gameId = save key ('watermelonCatch'), modeId = mode string, score = number
  recordScore(gameId, modeId, score) {
    const prog = this._data.progress[gameId];
    if (!prog) return;
    const prev = prog.bestScores[modeId] ?? 0;
    if (score > prev) {
      prog.bestScores[modeId] = score;
      this.save();
    }
  }

  _migrate(save) {
    // Future version migrations go here
    save.version = CURRENT_VERSION;
  }
}

export const saveManager = new SaveManager();
