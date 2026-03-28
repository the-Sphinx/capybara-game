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
  getEditorDefinition() {
    return {
      gameId: this.gameId,
      label: 'Math Garden',
      goalTypes: [
        {
          value: 'catchCount',
          label: 'Catch Count',
          description: 'Player must catch the target number of correct falling items.',
        },
        {
          value: 'correctAnswers',
          label: 'Correct Answers',
          description: 'Player must tap the target number of correct answers.',
        },
        {
          value: 'score',
          label: 'Score',
          description: 'Player must reach the target score before time runs out.',
        },
        {
          value: 'combo',
          label: 'Combo',
          description: 'Player must reach the target combo streak.',
        },
      ],
      modeDescriptors: this.modeDescriptors,
    };
  },
  normalize(manifest) {
    return normalizeGameManifest(this, manifest);
  },
  createHandler(shell, resolvedRecipe) {
    const HandlerClass = resolvedRecipe.descriptor?.handlerClass;
    return new HandlerClass(shell, resolvedRecipe);
  },
};
