import { playerState } from './playerState.js';
import { EQUIPPED, CLOSET_TABS } from './state.js';

const STORAGE_KEY = 'capy_save';
const CURRENT_VERSION = 3;

const DEFAULT_SAVE = {
  version: 3,
  coins: 30,
  ownedItems: [],
  equipped: { hats: null, neck: null },
  progress: {
    watermelonCatch: { completedLevels: [], unlockedLevels: [1], arcadeBestScores: {} },
    mathGarden:      { completedLevels: [], unlockedLevels: [1], arcadeBestScores: {} },
    languageGrove:   { completedLevels: [], unlockedLevels: [1], arcadeBestScores: {} },
  },
  settings: { soundOn: true, musicOn: true },
};

class SaveManager {
  constructor() { this._data = null; }

  load() {
    let save = null;
    try { save = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    if (!save || typeof save !== 'object') save = structuredClone(DEFAULT_SAVE);
    if (!save.version || save.version < CURRENT_VERSION) { this._migrate(save); }
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

  // ── Level progress ───────────────────────────────────────────────────────────

  isLevelUnlocked(categoryId, levelNum) {
    const prog = this._data.progress[categoryId];
    return prog ? prog.unlockedLevels.includes(levelNum) : false;
  }

  isLevelCompleted(categoryId, levelNum) {
    const prog = this._data.progress[categoryId];
    return prog ? prog.completedLevels.includes(levelNum) : false;
  }

  completeLevel(categoryId, levelNum) {
    const prog = this._data.progress[categoryId];
    if (!prog) return;
    if (!prog.completedLevels.includes(levelNum)) {
      prog.completedLevels.push(levelNum);
    }
    // Unlock next level
    const next = levelNum + 1;
    if (!prog.unlockedLevels.includes(next)) {
      prog.unlockedLevels.push(next);
    }
    this.save();
  }

  // ── Arcade best scores ───────────────────────────────────────────────────────

  recordArcadeScore(categoryId, modeId, score) {
    const prog = this._data.progress[categoryId];
    if (!prog) return;
    if (!prog.arcadeBestScores) prog.arcadeBestScores = {};
    if ((prog.arcadeBestScores[modeId] ?? -Infinity) < score) {
      prog.arcadeBestScores[modeId] = score;
      this.save();
    }
  }

  getArcadeBestScores(categoryId) {
    return { ...(this._data.progress[categoryId]?.arcadeBestScores ?? {}) };
  }

  _migrate(save) {
    // v1 → v2: replace unlockedModes/bestScores with completedLevels/unlockedLevels
    if (!save.version || save.version < 2) {
      save.progress = {
        watermelonCatch: { completedLevels: [], unlockedLevels: [1], arcadeBestScores: {} },
        mathGarden:      { completedLevels: [], unlockedLevels: [1], arcadeBestScores: {} },
        languageGrove:   { completedLevels: [], unlockedLevels: [1], arcadeBestScores: {} },
      };
    }
    // v2 → v3: add arcadeBestScores to each category progress
    if (save.version < 3) {
      for (const key of Object.keys(save.progress ?? {})) {
        if (!save.progress[key].arcadeBestScores) {
          save.progress[key].arcadeBestScores = {};
        }
      }
    }
    save.version = CURRENT_VERSION;
  }
}

export const saveManager = new SaveManager();
