import { EngineGame } from '../engine/EngineGame.js';
import { createMathHandler } from './modeRuntime.js';

const ASSET_BASE = import.meta.env.BASE_URL + 'games/watermelon/';

export class MathGardenGame extends EngineGame {
  constructor(levelConfig = null) {
    super({
      gameId: 'math_garden',
      label: 'Math Garden',
      categoryId: 'mathGarden',
      levelConfig,
      assetBase: ASSET_BASE,
      resultPrefix: 'mg',
    });
  }

  buildCenterContent() {
    if (this.isArcade) {
      return {
        line: this.mode?.title ?? 'Math Garden',
        text: this.mode?.family === 'answer'
          ? 'Tap the correct answer!'
          : (this.mode?.prompt ?? ''),
      };
    }

    const operation = this.levelConfig?.operation ?? this.mode?.operation;
    const opLabel = operation === 'addition'
      ? 'Addition'
      : operation === 'subtraction'
        ? 'Subtraction'
        : operation === 'mixed'
          ? 'Mixed Math'
          : '';

    return {
      line: opLabel
        ? `Level ${this.levelConfig.levelNum} · ${this.levelConfig.label} · ${opLabel}`
        : `Level ${this.levelConfig.levelNum} · ${this.levelConfig.label}`,
      text: this.mode?.family === 'answer'
        ? 'Tap the correct answer!'
        : (this.mode?.prompt ?? ''),
    };
  }

  createHandler() {
    return createMathHandler(this);
  }
}
