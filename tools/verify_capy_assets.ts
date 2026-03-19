import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { computeBounds, formatNumber, loadGlb } from './lib/gltf_node.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const assetsToMeasure = [
  { id: 'capy_idle', path: path.resolve(repoRoot, 'capy-village/public/models/characters/capy_idle.glb') },
  { id: 'crown', path: path.resolve(repoRoot, 'capy-village/public/models/accessories/crown.glb') },
  { id: 'chef_hat', path: path.resolve(repoRoot, 'capy-village/public/models/accessories/chef_hat.glb') },
  { id: 'knit_beanie', path: path.resolve(repoRoot, 'capy-village/public/models/accessories/knit_beanie.glb') },
  { id: 'scarf_v2', path: path.resolve(repoRoot, 'capy-village/public/models/accessories/scarf_v2.glb') },
];

async function main(): Promise<void> {
  let failed = false;

  for (const asset of assetsToMeasure) {
    const { scene } = await loadGlb(asset.path);
    const bounds = computeBounds(scene);
    if (!bounds) {
      throw new Error(`Could not compute bounds for ${asset.id}.`);
    }

    console.log(
      [
        asset.id,
        `height=${formatNumber(bounds.height)}`,
        `minY=${formatNumber(bounds.minY)}`,
        `maxY=${formatNumber(bounds.maxY)}`,
        `width=${formatNumber(bounds.width)}`,
        `depth=${formatNumber(bounds.depth)}`,
      ].join(' '),
    );

    if (asset.id === 'capy_idle') {
      const heightDelta = Math.abs(bounds.height - 1);
      const minYDelta = Math.abs(bounds.minY);
      if (heightDelta > 0.01 || minYDelta > 0.01) {
        failed = true;
      }
    }
  }

  if (failed) {
    console.error('[Verify] Capy character is not normalized to height=1 and minY=0 within tolerance.');
    process.exitCode = 1;
    return;
  }

  console.log('[Verify] Capy character normalization checks passed.');
}

await main();
