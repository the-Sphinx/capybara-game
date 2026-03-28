import { attachRuntimeHandler, normalizeGameManifest } from '../pluginUtils.js';
import { collectNumbersMode } from './collectNumbers.mode.js';
import { answerEquationMode } from './answerEquation.mode.js';
import { MathNumberCollectMode, MathEquationAnswerMode } from '../../mathGarden/modeRuntime.js';

const modeDescriptors = [
  attachRuntimeHandler(collectNumbersMode, MathNumberCollectMode),
  attachRuntimeHandler(answerEquationMode, MathEquationAnswerMode),
];

export const mathGardenPlugin = {
  gameId: 'math_garden',
  modeDescriptors,
  normalize(manifest) {
    return normalizeGameManifest(this, manifest);
  },
  createHandler(shell, resolvedRecipe) {
    const HandlerClass = resolvedRecipe.descriptor?.handlerClass;
    return new HandlerClass(shell, resolvedRecipe);
  },
};
