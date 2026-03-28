import { normalizeGameManifest } from '../pluginUtils.js';
import { collectLettersMode } from './collectLetters.mode.js';
import { collectCategoryWordsMode } from './collectCategoryWords.mode.js';
import { choicePromptMode } from './choicePrompt.mode.js';
import {
  LanguageLettersCollectMode,
  LanguageCategoryCollectMode,
  LanguageChoicePromptMode,
} from '../../languageGrove/modeRuntime.js';

const modeDescriptors = [collectLettersMode, collectCategoryWordsMode, choicePromptMode];
const handlerMap = {
  collect_letters: LanguageLettersCollectMode,
  collect_category_words: LanguageCategoryCollectMode,
  choice_prompt: LanguageChoicePromptMode,
};

export const languageGrovePlugin = {
  gameId: 'language_grove',
  modeDescriptors,
  normalize(manifest) {
    return normalizeGameManifest(this, manifest);
  },
  createHandler(shell, resolvedRecipe) {
    const HandlerClass = handlerMap[resolvedRecipe.kind];
    return new HandlerClass(shell, resolvedRecipe);
  },
};
