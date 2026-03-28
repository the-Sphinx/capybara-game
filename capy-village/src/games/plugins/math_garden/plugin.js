import { normalizeGameManifest } from '../pluginUtils.js';
import { collectNumbersMode } from './collectNumbers.mode.js';
import { answerEquationMode } from './answerEquation.mode.js';
import { MathNumberCollectMode, MathEquationAnswerMode } from '../../mathGarden/modeRuntime.js';

const modeDescriptors = [collectNumbersMode, answerEquationMode];
const handlerMap = {
  collect_numbers: MathNumberCollectMode,
  answer_equation: MathEquationAnswerMode,
};

export const mathGardenPlugin = {
  gameId: 'math_garden',
  modeDescriptors,
  normalize(manifest) {
    return normalizeGameManifest(this, manifest);
  },
  createHandler(shell, resolvedRecipe) {
    const HandlerClass = handlerMap[resolvedRecipe.kind];
    return new HandlerClass(shell, resolvedRecipe);
  },
};
