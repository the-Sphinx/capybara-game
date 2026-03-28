import { mathGardenPlugin } from './math_garden/plugin.js';
import { languageGrovePlugin } from './language_grove/plugin.js';
import { watermelonCatchPlugin } from './watermelon_catch/plugin.js';

export const GAME_PLUGINS = Object.freeze({
  math_garden: mathGardenPlugin,
  language_grove: languageGrovePlugin,
  watermelon_catch: watermelonCatchPlugin,
});
