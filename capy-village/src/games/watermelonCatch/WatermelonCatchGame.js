import { EngineGame } from '../engine/EngineGame.js';
import { createWatermelonHandler } from './modeRuntime.js';

const ASSET_BASE = import.meta.env.BASE_URL + 'games/watermelon/';

export class WatermelonCatchGame extends EngineGame {
  constructor(levelConfig = null) {
    super({
      gameId: 'watermelon_catch',
      label: 'Watermelon Catch',
      categoryId: 'watermelonCatch',
      levelConfig,
      assetBase: ASSET_BASE,
      resultPrefix: 'wmc',
    });
  }

  buildCenterContent() {
    if (this.isArcade) {
      return {
        line: this.mode?.title ?? 'Watermelon Catch 🍉',
        text: this.mode?.prompt ?? '',
      };
    }

    return {
      line: `Level ${this.levelConfig.levelNum} · ${this.levelConfig.label}`,
      text: '',
    };
  }

  createHandler() {
    return createWatermelonHandler(this);
  }
}
