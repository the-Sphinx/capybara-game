import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  Box3,
  Object3D,
  Vector3,
} from '../../capy-village/node_modules/three/build/three.module.js';
import { GLTFLoader } from '../../capy-village/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from '../../capy-village/node_modules/three/examples/jsm/exporters/GLTFExporter.js';

type PolyfilledGlobal = typeof globalThis & {
  FileReader?: typeof FileReader;
  ProgressEvent?: typeof ProgressEvent;
  self?: typeof globalThis;
};

export type LoadedGlb = {
  scene: Object3D;
  animations: unknown[];
};

export type Bounds = {
  width: number;
  height: number;
  depth: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

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

export function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(4).replace(/\.?0+$/, '') : 'n/a';
}

export function computeBounds(root: Object3D): Bounds | null {
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  if (box.isEmpty()) {
    return null;
  }

  const size = box.getSize(new Vector3());
  return {
    width: size.x,
    height: size.y,
    depth: size.z,
    minX: box.min.x,
    maxX: box.max.x,
    minY: box.min.y,
    maxY: box.max.y,
    minZ: box.min.z,
    maxZ: box.max.z,
  };
}

export async function loadGlb(assetPath: string): Promise<LoadedGlb> {
  const loader = new GLTFLoader();
  const absoluteAssetPath = path.resolve(assetPath);
  const buffer = await fs.readFile(absoluteAssetPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return await new Promise<LoadedGlb>((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      path.dirname(absoluteAssetPath) + path.sep,
      (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations }),
      (error) => reject(error),
    );
  });
}

export async function exportGlb(root: Object3D, outputPath: string, animations: unknown[] = []): Promise<void> {
  const exporter = new GLTFExporter();
  const absoluteOutputPath = path.resolve(outputPath);

  await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });

  const result = await exporter.parseAsync(root, {
    binary: true,
    onlyVisible: false,
    animations,
  });

  if (!(result instanceof ArrayBuffer)) {
    throw new Error(`Expected binary GLB output for ${outputPath}.`);
  }

  await fs.writeFile(absoluteOutputPath, Buffer.from(result));
}
