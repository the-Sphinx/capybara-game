import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMathGardenActivityDescriptors } from '../capy-village/src/authoring/mathGardenAuthoring.js';
import { buildGameSchema, buildWorldSchema } from '../capy-village/src/authoring/schema/generateSchema.js';
import { generateActivityBasedAuthoringDoc } from '../capy-village/src/authoring/docs/generateAuthoringDoc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const schemaDir = path.join(repoRoot, 'capy-village', 'src', 'config', 'games', 'schemas');
const docsDir = path.join(repoRoot, 'docs', 'authoring');
const activityDocPath = path.join(docsDir, 'activity_based_authoring.md');
const legacyMathDocPath = path.join(repoRoot, 'docs', 'math_garden_authoring.md');
const activityDescriptors = getMathGardenActivityDescriptors();

await fs.mkdir(schemaDir, { recursive: true });
await fs.mkdir(docsDir, { recursive: true });

await fs.writeFile(
  path.join(schemaDir, 'math_garden.game.schema.json'),
  `${JSON.stringify(buildGameSchema({ gameId: 'math_garden', gameLabel: 'Math Garden', activityDescriptors }), null, 2)}\n`,
  'utf8',
);
await fs.writeFile(
  path.join(schemaDir, 'math_garden.world.schema.json'),
  `${JSON.stringify(buildWorldSchema({ gameLabel: 'Math Garden', activityDescriptors }), null, 2)}\n`,
  'utf8',
);

const activityDoc = `${generateActivityBasedAuthoringDoc({
  gameLabel: 'Math Garden',
  activityDescriptors,
})}\n`;
await fs.writeFile(activityDocPath, activityDoc, 'utf8');
await fs.writeFile(
  legacyMathDocPath,
  '# Math Garden Authoring\n\nSee [activity_based_authoring.md](./authoring/activity_based_authoring.md) for the current activity-type authoring model.\n',
  'utf8',
);
