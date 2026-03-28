import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGameSchema, buildPluginDocs } from '../capy-village/src/games/plugins/pluginUtils.js';
import { collectNumbersMode } from '../capy-village/src/games/plugins/math_garden/collectNumbers.mode.js';
import { answerEquationMode } from '../capy-village/src/games/plugins/math_garden/answerEquation.mode.js';
import { collectLettersMode } from '../capy-village/src/games/plugins/language_grove/collectLetters.mode.js';
import { collectCategoryWordsMode } from '../capy-village/src/games/plugins/language_grove/collectCategoryWords.mode.js';
import { choicePromptMode } from '../capy-village/src/games/plugins/language_grove/choicePrompt.mode.js';
import { classicCollectMode } from '../capy-village/src/games/plugins/watermelon_catch/classicCollect.mode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const schemaDir = path.join(repoRoot, 'capy-village', 'src', 'config', 'games', 'schemas');
const docsPath = path.join(repoRoot, 'docs', 'minigame_mode_authoring.md');

const plugins = [
  { gameId: 'math_garden', modeDescriptors: [collectNumbersMode, answerEquationMode] },
  { gameId: 'language_grove', modeDescriptors: [collectLettersMode, collectCategoryWordsMode, choicePromptMode] },
  { gameId: 'watermelon_catch', modeDescriptors: [classicCollectMode] },
];

await fs.mkdir(schemaDir, { recursive: true });

for (const plugin of plugins) {
  const schema = buildGameSchema(plugin);
  const schemaPath = path.join(schemaDir, `${plugin.gameId}.game.schema.json`);
  await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2) + '\n', 'utf8');
}

const docParts = [
  '# Minigame Authoring',
  '',
  'This document is generated from per-game plugin descriptors.',
  '',
  'Games are authored through one shared `game.json` plus `worlds/<worldId>.json` files per game.',
  '',
  'Top-level structure in `public/config/games/<gameId>/game.json`:',
  '- `worldIds` for world loading order',
  '- `worldSelect` for world-map metadata',
  '- `levelSelect` for shared level-slot metadata',
  '- `arcade` for arcade recipe selection',
  '- `recipes` for reusable gameplay recipes',
  '',
  'Core concepts:',
  '- Add a new recipe by creating one entry under `recipes`.',
  '- Add a new world by adding its id to `worldIds` and creating `worlds/<worldId>.json`.',
  '- Add a new level by editing that world file under `worlds/<worldId>.json`.',
  '- Levels reference recipes with `recipeId`.',
  '- Per-level tuning goes under `overrides.rules` and `overrides.scoring`.',
  '- Game-level `defaults` apply first, then world-level `defaults`, then the level itself.',
  '',
];

for (const plugin of plugins) {
  docParts.push(buildPluginDocs(plugin), '');
}

await fs.writeFile(docsPath, docParts.join('\n'), 'utf8');
