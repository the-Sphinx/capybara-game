import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { computeBounds, exportGlb, formatNumber, loadGlb } from './lib/gltf_node.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const characterGameReadyGlb = path.resolve(repoRoot, 'assets/game_ready/models/characters/capy_idle.glb');
const characterSourceWithEyesGlb = path.resolve(repoRoot, 'assets/source/models/characters/capy_idle_with_eyes.glb');
const characterSourceRuntimeGlb = path.resolve(repoRoot, 'assets/source/models/characters/capy_idle.glb');

const accessoryJobs = [
  {
    id: 'crown',
    source: path.resolve(repoRoot, 'assets/source/models/accessories/crown.glb'),
    runtime: path.resolve(repoRoot, 'assets/game_ready/models/accessories/crown.glb'),
  },
  {
    id: 'chef_hat',
    source: path.resolve(repoRoot, 'assets/source/models/accessories/chef_hat.glb'),
    runtime: path.resolve(repoRoot, 'assets/game_ready/models/accessories/chef_hat.glb'),
  },
  {
    id: 'knit_beanie',
    source: path.resolve(repoRoot, 'assets/source/models/accessories/knit_beanie.glb'),
    runtime: path.resolve(repoRoot, 'assets/game_ready/models/accessories/knit_beanie.glb'),
  },
  {
    id: 'scarf_v2',
    source: path.resolve(repoRoot, 'assets/source/models/accessories/scarf_v2.glb'),
    runtime: path.resolve(repoRoot, 'assets/game_ready/models/accessories/scarf_v2.glb'),
  },
];

async function normalizeCharacterGlb(scaleFactor: number): Promise<void> {
  const { scene, animations } = await loadGlb(characterGameReadyGlb);
  const before = computeBounds(scene);
  if (!before || before.height <= 0) {
    throw new Error('Could not compute character bounds from runtime GLB.');
  }

  scene.scale.multiplyScalar(scaleFactor);
  const afterScale = computeBounds(scene);
  if (!afterScale) {
    throw new Error('Could not compute character bounds after scaling.');
  }

  scene.position.y -= afterScale.minY;

  const after = computeBounds(scene);
  if (!after) {
    throw new Error('Could not compute character bounds after grounding.');
  }

  await exportGlb(scene, characterSourceWithEyesGlb, animations);
  await exportGlb(scene, characterSourceRuntimeGlb, animations);
  await exportGlb(scene, characterGameReadyGlb, animations);

  console.log(`[Capy] GLB height ${formatNumber(before.height)} -> ${formatNumber(after.height)} (scale ${formatNumber(scaleFactor)})`);
  console.log(`[Capy] GLB ground alignment minY=${formatNumber(after.minY)} maxY=${formatNumber(after.maxY)}`);
}

async function normalizeAccessoryGlb(accessoryId: string, runtimePath: string, sourcePath: string, scaleFactor: number): Promise<void> {
  const { scene } = await loadGlb(runtimePath);
  const before = computeBounds(scene);
  if (!before || before.height <= 0) {
    throw new Error(`Could not compute bounds for ${accessoryId}.`);
  }

  scene.scale.multiplyScalar(scaleFactor);
  const after = computeBounds(scene);
  if (!after) {
    throw new Error(`Could not compute bounds for ${accessoryId} after scaling.`);
  }

  await exportGlb(scene, sourcePath);
  await exportGlb(scene, runtimePath);

  console.log(`[Accessory:${accessoryId}] GLB height ${formatNumber(before.height)} -> ${formatNumber(after.height)}`);
}

async function main(): Promise<void> {
  const { scene } = await loadGlb(characterGameReadyGlb);
  const currentBounds = computeBounds(scene);
  if (!currentBounds || currentBounds.height <= 0) {
    throw new Error('Could not compute current capy bounds from runtime GLB.');
  }

  const scaleFactor = 1 / currentBounds.height;
  console.log(
    `[Capy] Current runtime bounds height=${formatNumber(currentBounds.height)} minY=${formatNumber(currentBounds.minY)} maxY=${formatNumber(currentBounds.maxY)}`,
  );
  console.log(`[Capy] Applying shared GLB scale factor ${formatNumber(scaleFactor)}.`);

  await normalizeCharacterGlb(scaleFactor);
  for (const accessory of accessoryJobs) {
    await normalizeAccessoryGlb(accessory.id, accessory.runtime, accessory.source, scaleFactor);
  }

  console.log('[Capy] Runtime and source GLBs are normalized.');
}

await main();
