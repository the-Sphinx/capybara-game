import { EngineGame } from '../engine/EngineGame.js';
import { createLanguageHandler } from './modeRuntime.js';

const ASSET_BASE = import.meta.env.BASE_URL + 'games/watermelon/';

export class LanguageGroveGame extends EngineGame {
  constructor(levelConfig = null) {
    super({
      gameId: 'language_grove',
      label: 'Language Grove',
      categoryId: 'languageGrove',
      levelConfig,
      assetBase: ASSET_BASE,
      resultPrefix: 'mg',
    });
  }

  buildCenterContent() {
    if (this.isArcade) {
      return {
        line: this.mode?.title ?? 'Language Grove',
        text: this.mode?.prompt ?? '',
      };
    }

    return {
      line: `Level ${this.levelConfig.levelNum} · ${this.levelConfig.label}`,
      text: this.mode?.prompt ?? '',
    };
  }

  createHandler() {
    return createLanguageHandler(this);
  }
}
