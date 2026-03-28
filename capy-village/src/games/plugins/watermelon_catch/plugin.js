import { attachRuntimeHandler, normalizeGameManifest } from '../pluginUtils.js';
import { classicCollectMode } from './classicCollect.mode.js';
import { WatermelonClassicCollectionMode } from '../../watermelonCatch/modeRuntime.js';

const modeDescriptors = [attachRuntimeHandler(classicCollectMode, WatermelonClassicCollectionMode)];

export const watermelonCatchPlugin = {
  gameId: 'watermelon_catch',
  modeDescriptors,
  normalize(manifest) {
    return normalizeGameManifest(this, manifest);
  },
  createHandler(shell, resolvedRecipe) {
    const HandlerClass = resolvedRecipe.descriptor?.handlerClass;
    return new HandlerClass(shell, resolvedRecipe);
  },
};
