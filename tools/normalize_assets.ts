import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

type AssetEntry = {
  id: string;
  source: string;
  output: string;
  class: string;
};

type AssetRegistry = {
  assets: AssetEntry[];
};

type GlbSummary = {
  textures: number;
  images: number;
  materials: number;
  sizeBytes: number;
};

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const registryPath = path.resolve(repoRoot, 'config/asset_registry.json');
const blenderScriptPath = path.resolve(repoRoot, 'scripts/blender_normalize_glb.py');
const defaultBlenderBinary = '/Applications/Blender.app/Contents/MacOS/Blender';
const normalizedHeight = 1;

function resolveBlenderBinary(): string {
  return process.env.BLENDER_BIN || defaultBlenderBinary;
}

async function loadRegistry(): Promise<AssetRegistry> {
  const raw = await fs.readFile(registryPath, 'utf8');
  return JSON.parse(raw) as AssetRegistry;
}

function formatSize(sizeBytes: number): string {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (sizeBytes >= 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${sizeBytes} B`;
}

async function inspectGlb(assetPath: string): Promise<GlbSummary> {
  const absolutePath = path.resolve(repoRoot, assetPath);
  const buffer = await fs.readFile(absolutePath);
  const length = buffer.readUInt32LE(8);

  let offset = 12;
  while (offset < length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.toString('utf8', offset + 4, offset + 8);
    const chunkData = buffer.slice(offset + 8, offset + 8 + chunkLength);

    if (chunkType === 'JSON') {
      const gltf = JSON.parse(chunkData.toString('utf8'));
      return {
        textures: (gltf.textures ?? []).length,
        images: (gltf.images ?? []).length,
        materials: (gltf.materials ?? []).length,
        sizeBytes: buffer.byteLength,
      };
    }

    offset += 8 + chunkLength;
  }

  throw new Error(`Could not locate JSON chunk in ${assetPath}`);
}

async function runBlenderNormalize(asset: AssetEntry): Promise<string> {
  const blenderBinary = resolveBlenderBinary();
  const inputPath = path.resolve(repoRoot, asset.source);
  const outputPath = path.resolve(repoRoot, asset.output);

  const { stdout, stderr } = await execFileAsync(
    blenderBinary,
    [
      '--factory-startup',
      '--background',
      '--python',
      blenderScriptPath,
      '--',
      '--input',
      inputPath,
      '--output',
      outputPath,
      '--target-height',
      String(normalizedHeight),
    ],
    { cwd: repoRoot, maxBuffer: 1024 * 1024 * 16 },
  );

  const combinedOutput = [stdout, stderr].filter(Boolean).join('\n').trim();
  return combinedOutput;
}

function printReport(asset: AssetEntry, inputSummary: GlbSummary, outputSummary: GlbSummary, status: string): void {
  console.log(`[Normalize] ${path.basename(asset.source)}`);
  console.log(`input textures: ${inputSummary.textures}`);
  console.log(`output textures: ${outputSummary.textures}`);
  console.log(`input images: ${inputSummary.images}`);
  console.log(`output images: ${outputSummary.images}`);
  console.log(`input size: ${formatSize(inputSummary.sizeBytes)}`);
  console.log(`output size: ${formatSize(outputSummary.sizeBytes)}`);
  console.log(`status: ${status}`);
  console.log('');
}

async function normalizeAsset(asset: AssetEntry): Promise<void> {
  const inputSummary = await inspectGlb(asset.source);
  const blenderOutput = await runBlenderNormalize(asset);
  const outputSummary = await inspectGlb(asset.output);

  const texturesPreserved = outputSummary.textures >= inputSummary.textures
    && outputSummary.images >= inputSummary.images;

  const status = texturesPreserved ? 'OK' : 'ERROR - TEXTURES LOST';
  printReport(asset, inputSummary, outputSummary, status);

  if (blenderOutput) {
    console.log(blenderOutput);
    console.log('');
  }

  if (!texturesPreserved) {
    throw new Error(`Texture preservation failed for ${asset.id}.`);
  }
}

async function main(): Promise<void> {
  const registry = await loadRegistry();
  const requestedId = process.argv[2];
  const selectedAssets = requestedId
    ? registry.assets.filter((asset) => asset.id === requestedId)
    : registry.assets;

  if (requestedId && selectedAssets.length === 0) {
    console.error(`Asset "${requestedId}" was not found in config/asset_registry.json.`);
    process.exitCode = 1;
    return;
  }

  for (const asset of selectedAssets) {
    try {
      await normalizeAsset(asset);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to normalize "${asset.id}": ${message}`);
      process.exitCode = 1;
    }
  }
}

await main();
