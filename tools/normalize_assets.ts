import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Box3,
  Group,
  Matrix4,
  Mesh,
  Object3D,
  Vector3,
} from '../capy-village/node_modules/three/build/three.module.js';
import { GLTFLoader } from '../capy-village/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from '../capy-village/node_modules/three/examples/jsm/exporters/GLTFExporter.js';

type AssetEntry = {
  id: string;
  source: string;
  output: string;
  class: string;
};

type AssetRegistry = {
  assets: AssetEntry[];
};

type Bounds = {
  width: number;
  height: number;
  depth: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerZ: number;
};

type PolyfilledGlobal = typeof globalThis & {
  FileReader?: typeof FileReader;
  ProgressEvent?: typeof ProgressEvent;
  self?: typeof globalThis;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const registryPath = path.resolve(repoRoot, 'config/asset_registry.json');

const NORMALIZED_HEIGHT = 1;

const globalWithPolyfills = globalThis as PolyfilledGlobal;
globalWithPolyfills.self ??= globalThis;
globalWithPolyfills.ProgressEvent ??= class ProgressEvent extends Event {
  loaded: number;
  total: number;

  constructor(type: string, init?: EventInit & { loaded?: number; total?: number }) {
    super(type, init);
    this.loaded = init?.loaded ?? 0;
    this.total = init?.total ?? 0;
  }
};
globalWithPolyfills.FileReader ??= class FileReader extends EventTarget {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  error: DOMException | null = null;
  onabort: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;
  onload: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;
  onloadstart: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent) => unknown) | null = null;
  readyState = 0;
  result: ArrayBuffer | string | null = null;

  abort(): void {
    this.readyState = 2;
    this.result = null;
    this.dispatchReaderEvent('abort');
    this.dispatchReaderEvent('loadend');
  }

  readAsArrayBuffer(blob: Blob): void {
    void this.readBlob(blob, async () => blob.arrayBuffer());
  }

  readAsDataURL(blob: Blob): void {
    void this.readBlob(blob, async () => {
      const buffer = Buffer.from(await blob.arrayBuffer());
      return `data:${blob.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    });
  }

  readAsText(blob: Blob): void {
    void this.readBlob(blob, async () => blob.text());
  }

  private async readBlob(blob: Blob, read: () => Promise<ArrayBuffer | string>): Promise<void> {
    this.readyState = 1;
    this.dispatchReaderEvent('loadstart');

    try {
      this.result = await read();
      this.readyState = 2;
      this.dispatchReaderEvent('progress', { loaded: blob.size, total: blob.size });
      this.dispatchReaderEvent('load');
      this.dispatchReaderEvent('loadend');
    } catch (error) {
      this.error = error instanceof DOMException ? error : new DOMException(String(error));
      this.readyState = 2;
      this.dispatchReaderEvent('error');
      this.dispatchReaderEvent('loadend');
    }
  }

  private dispatchReaderEvent(type: string, init?: { loaded?: number; total?: number }): void {
    const event = new globalWithPolyfills.ProgressEvent!(type, init);
    this.dispatchEvent(event);

    const handlerName = `on${type}` as const;
    const handler = this[handlerName];
    if (typeof handler === 'function') {
      handler.call(this, event);
    }
  }
};

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3).replace(/\.?0+$/, '') : 'n/a';
}

function cloneSceneForExport(source: Group): Group {
  const clone = source.clone(true);

  source.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }

    const cloneNode = clone.getObjectByName(node.name);
    if (!(cloneNode instanceof Mesh)) {
      return;
    }

    cloneNode.geometry = node.geometry.clone();
    cloneNode.material = Array.isArray(node.material)
      ? node.material.map((material) => material.clone())
      : node.material.clone();
  });

  return clone;
}

function getMeshCount(root: Object3D): number {
  let meshCount = 0;
  root.traverse((node) => {
    if (node instanceof Mesh) {
      meshCount += 1;
    }
  });
  return meshCount;
}

function computeBounds(root: Object3D): Bounds | null {
  root.updateMatrixWorld(true);
  const boundingBox = new Box3().setFromObject(root);
  if (boundingBox.isEmpty()) {
    return null;
  }

  const size = boundingBox.getSize(new Vector3());
  const center = boundingBox.getCenter(new Vector3());

  return {
    width: size.x,
    height: size.y,
    depth: size.z,
    minY: boundingBox.min.y,
    maxY: boundingBox.max.y,
    centerX: center.x,
    centerZ: center.z,
  };
}

async function loadRegistry(): Promise<AssetRegistry> {
  const raw = await fs.readFile(registryPath, 'utf8');
  return JSON.parse(raw) as AssetRegistry;
}

async function loadGlbScene(assetPath: string): Promise<Group> {
  const loader = new GLTFLoader();
  const absoluteAssetPath = path.resolve(repoRoot, assetPath);
  const buffer = await fs.readFile(absoluteAssetPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return await new Promise<Group>((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      path.dirname(absoluteAssetPath) + path.sep,
      (gltf) => resolve(gltf.scene),
      (error) => reject(error),
    );
  });
}

function bakeTransforms(root: Object3D): void {
  root.updateMatrixWorld(true);

  root.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }

    node.updateWorldMatrix(true, false);
    node.geometry = node.geometry.clone();
    node.geometry.applyMatrix4(node.matrixWorld);
    node.position.set(0, 0, 0);
    node.rotation.set(0, 0, 0);
    node.quaternion.identity();
    node.scale.set(1, 1, 1);
    node.updateMatrix();
    node.updateMatrixWorld(true);
  });

  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.quaternion.identity();
  root.scale.set(1, 1, 1);
  root.updateMatrix();
  root.updateMatrixWorld(true);
}

async function exportGlb(root: Group, outputPath: string): Promise<void> {
  const exporter = new GLTFExporter();
  const absoluteOutputPath = path.resolve(repoRoot, outputPath);

  await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });

  const result = await exporter.parseAsync(root, {
    binary: true,
    onlyVisible: false,
  });

  if (!(result instanceof ArrayBuffer)) {
    throw new Error(`Expected binary GLB output for ${outputPath}.`);
  }

  await fs.writeFile(absoluteOutputPath, Buffer.from(result));
}

function printReport(asset: AssetEntry, originalBounds: Bounds, targetHeight: number, scaleFactor: number): void {
  console.log(`Asset: ${asset.id}`);
  console.log('');
  console.log(`Original Height: ${formatNumber(originalBounds.height)}`);
  console.log(`Target Height: ${formatNumber(targetHeight)}`);
  console.log(`Scale Applied: ${formatNumber(scaleFactor)}`);
  console.log('');
  console.log('Pivot Adjusted: YES');
  console.log('Ground Adjusted: YES');
  console.log('');
  console.log('Exported To:');
  console.log(asset.output);
  console.log('');
}

async function normalizeAsset(asset: AssetEntry): Promise<void> {
  if (!asset.class) {
    console.warn(`Warning: asset "${asset.id}" has unknown class "${asset.class}". Skipping.`);
    return;
  }

  const scene = await loadGlbScene(asset.source);
  if (getMeshCount(scene) === 0) {
    console.warn(`Warning: asset "${asset.id}" contains no mesh. Skipping.`);
    return;
  }

  const workingScene = cloneSceneForExport(scene);
  const originalBounds = computeBounds(workingScene);

  if (!originalBounds) {
    console.warn(`Warning: bounding box could not be computed for asset "${asset.id}". Skipping.`);
    return;
  }

  const translation = new Matrix4().makeTranslation(
    -originalBounds.centerX,
    -originalBounds.minY,
    -originalBounds.centerZ,
  );
  workingScene.applyMatrix4(translation);
  workingScene.updateMatrixWorld(true);

  const groundedBounds = computeBounds(workingScene);
  if (!groundedBounds || groundedBounds.height <= 0) {
    console.warn(`Warning: bounding box could not be computed for asset "${asset.id}" after alignment. Skipping.`);
    return;
  }

  const targetHeight = NORMALIZED_HEIGHT;
  const scaleFactor = targetHeight / groundedBounds.height;
  workingScene.scale.multiplyScalar(scaleFactor);
  workingScene.updateMatrixWorld(true);

  bakeTransforms(workingScene);

  const finalBounds = computeBounds(workingScene);
  if (!finalBounds) {
    console.warn(`Warning: bounding box could not be computed for asset "${asset.id}" after baking. Skipping.`);
    return;
  }

  // Re-apply a final alignment pass to absorb numerical drift from baking.
  const finalTranslation = new Matrix4().makeTranslation(-finalBounds.centerX, -finalBounds.minY, -finalBounds.centerZ);
  workingScene.applyMatrix4(finalTranslation);
  bakeTransforms(workingScene);

  await exportGlb(workingScene, asset.output);
  printReport(asset, originalBounds, targetHeight, scaleFactor);
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
