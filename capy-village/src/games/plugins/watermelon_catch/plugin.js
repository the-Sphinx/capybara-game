import { normalizeGameManifest } from '../pluginUtils.js';
import { classicCollectMode } from './classicCollect.mode.js';
import { WatermelonClassicCollectionMode } from '../../watermelonCatch/modeRuntime.js';

const modeDescriptors = [classicCollectMode];

export const watermelonCatchPlugin = {
  gameId: 'watermelon_catch',
  modeDescriptors,
  normalize(manifest) {
    return normalizeGameManifest(this, manifest);
  },
  createHandler(shell, resolvedRecipe) {
    return new WatermelonClassicCollectionMode(shell, resolvedRecipe);
  },
};
