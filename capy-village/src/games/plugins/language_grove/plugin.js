import { attachRuntimeHandler, normalizeGameManifest } from '../pluginUtils.js';
import { collectLettersMode } from './collectLetters.mode.js';
import { collectCategoryWordsMode } from './collectCategoryWords.mode.js';
import { choicePromptMode } from './choicePrompt.mode.js';
import {
  LanguageLettersCollectMode,
  LanguageCategoryCollectMode,
  LanguageChoicePromptMode,
} from '../../languageGrove/modeRuntime.js';

const modeDescriptors = [
  attachRuntimeHandler(collectLettersMode, LanguageLettersCollectMode),
  attachRuntimeHandler(collectCategoryWordsMode, LanguageCategoryCollectMode),
  attachRuntimeHandler(choicePromptMode, LanguageChoicePromptMode),
];

export const languageGrovePlugin = {
  gameId: 'language_grove',
  modeDescriptors,
  normalize(manifest) {
    return normalizeGameManifest(this, manifest);
  },
  createHandler(shell, resolvedRecipe) {
    const HandlerClass = resolvedRecipe.descriptor?.handlerClass;
    return new HandlerClass(shell, resolvedRecipe);
  },
};
