import { playerState } from './playerState.js';
import { EQUIPPED, CLOSET_TABS } from './state.js';

const STORAGE_KEY = 'capy_save';
const CURRENT_VERSION = 4;

const DEFAULT_SAVE = {
  version: 4,
  coins: 30,
  ownedItems: [],
  equipped: { hats: null, neck: null },
  progress: {
    watermelonCatch: { completedLevelIds: [], unlockedLevelIds: ['main_1'], arcadeBestScores: {} },
    mathGarden:      { completedLevelIds: [], unlockedLevelIds: ['number_garden_1'], arcadeBestScores: {} },
    languageGrove:   { completedLevelIds: [], unlockedLevelIds: ['main_1'], arcadeBestScores: {} },
  },
  settings: { soundOn: true, musicOn: true },
};

function toLevelId(levelRef) {
  if (!levelRef) return null;
  if (typeof levelRef === 'string') return levelRef;
  if (typeof levelRef === 'object') return levelRef.levelId ?? null;
  return null;
}

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

  isLevelUnlocked(categoryId, levelRef) {
    const prog = this._data.progress[categoryId];
    const levelId = toLevelId(levelRef);
    return prog && levelId ? prog.unlockedLevelIds.includes(levelId) : false;
  }

  isLevelCompleted(categoryId, levelRef) {
    const prog = this._data.progress[categoryId];
    const levelId = toLevelId(levelRef);
    return prog && levelId ? prog.completedLevelIds.includes(levelId) : false;
  }

  completeLevel(categoryId, levelRef, nextLevelRef = null) {
    const prog = this._data.progress[categoryId];
    const levelId = toLevelId(levelRef);
    const nextLevelId = toLevelId(nextLevelRef);
    if (!prog || !levelId) return;
    if (!prog.completedLevelIds.includes(levelId)) {
      prog.completedLevelIds.push(levelId);
    }
    if (nextLevelId && !prog.unlockedLevelIds.includes(nextLevelId)) {
      prog.unlockedLevelIds.push(nextLevelId);
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
      save.progress = structuredClone(DEFAULT_SAVE.progress);
    }
    // v2 → v3: add arcadeBestScores to each category progress
    if (save.version < 3) {
      for (const key of Object.keys(save.progress ?? {})) {
        if (!save.progress[key].arcadeBestScores) {
          save.progress[key].arcadeBestScores = {};
        }
      }
    }
    // v3 → v4: reset minigame progression to stable levelId keys.
    if (save.version < 4) {
      save.progress = structuredClone(DEFAULT_SAVE.progress);
    }
    save.version = CURRENT_VERSION;
  }
}

export const saveManager = new SaveManager();
