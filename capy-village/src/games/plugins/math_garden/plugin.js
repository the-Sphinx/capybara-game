import { normalizeMathGardenAuthoringManifest } from '../../../authoring/mathGardenAuthoring.js';
import { MathNumberCollectMode, MathEquationAnswerMode } from '../../mathGarden/modeRuntime.js';

const HANDLER_MAP = Object.freeze({
  collect_stream: MathNumberCollectMode,
  answer_prompt: MathEquationAnswerMode,
});

export const mathGardenPlugin = {
  gameId: 'math_garden',
  normalize(manifest) {
    return normalizeMathGardenAuthoringManifest(manifest);
  },
  getEditorDefinition(config) {
    return config?.editorDefinition ?? {
      gameId: this.gameId,
      label: 'Math Garden',
      activityDescriptors: [],
      goalTypes: [],
      presets: [],
      authoringTiers: ['basic', 'advanced'],
    };
  },
  createHandler(shell, resolvedActivity) {
    const HandlerClass = HANDLER_MAP[resolvedActivity?.kind];
    if (!HandlerClass) {
      throw new Error(`No runtime handler registered for "${resolvedActivity?.kind}"`);
    }
    return new HandlerClass(shell, resolvedActivity);
  },
};
