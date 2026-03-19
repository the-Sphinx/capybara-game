import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const assetsSourceDir = path.resolve(repoRoot, 'assets/game_ready');
const layoutsSourceDir = path.resolve(repoRoot, 'layouts');
const assetsTargetDir = path.resolve(repoRoot, 'capy-village/public/assets');
const layoutsTargetDir = path.resolve(repoRoot, 'capy-village/public/layouts');
const legacyPublicDirs = [
  path.resolve(repoRoot, 'capy-village/public/models'),
  path.resolve(repoRoot, 'capy-village/public/audio'),
  path.resolve(repoRoot, 'capy-village/public/images'),
];

type Manifest = Record<string, string>;

function log(message: string): void {
  console.log(`[Publish] ${message}`);
}

async function ensureDirExists(dirPath: string, label: string): Promise<void> {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      throw new Error(`${label} is not a directory: ${dirPath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`${label} is missing: ${dirPath}`);
    }
    throw error;
  }
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function clearDirectoryContents(dirPath: string): Promise<void> {
  await ensureDir(dirPath);
  const entries = await fs.readdir(dirPath);
  await Promise.all(entries.map((entry) => fs.rm(path.join(dirPath, entry), { recursive: true, force: true })));
}

async function copyRecursive(sourceDir: string, targetDir: string, onFile: (sourceFile: string, targetFile: string) => Promise<void>): Promise<void> {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  await ensureDir(targetDir);

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(sourcePath, targetPath, onFile);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    await ensureDir(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
    await onFile(sourcePath, targetPath);
  }
}

function toPublicPath(filePath: string): string {
  return `/${path.relative(path.resolve(repoRoot, 'capy-village/public'), filePath).split(path.sep).join('/')}`;
}

async function writeManifest(manifest: Manifest): Promise<void> {
  const manifestPath = path.join(assetsTargetDir, 'manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function removeLegacyPublicDirs(): Promise<void> {
  await Promise.all(legacyPublicDirs.map((dirPath) => fs.rm(dirPath, { recursive: true, force: true })));
}

async function publish(): Promise<void> {
  await ensureDirExists(assetsSourceDir, 'Assets source folder');
  await ensureDirExists(layoutsSourceDir, 'Layouts source folder');

  log('Copying assets...');
  await clearDirectoryContents(assetsTargetDir);

  const manifest: Manifest = {};
  await copyRecursive(assetsSourceDir, assetsTargetDir, async (sourceFile, targetFile) => {
    log(`Copied: ${path.basename(sourceFile)}`);

    if (path.extname(sourceFile).toLowerCase() === '.glb') {
      manifest[path.basename(sourceFile, '.glb')] = toPublicPath(targetFile);
    }
  });
  await writeManifest(manifest);

  log('Copying layouts...');
  await clearDirectoryContents(layoutsTargetDir);
  await copyRecursive(layoutsSourceDir, layoutsTargetDir, async (sourceFile) => {
    log(`Copied: ${path.basename(sourceFile)}`);
  });

  await removeLegacyPublicDirs();
  log('Done.');
}

try {
  await publish();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Publish] Failed: ${message}`);
  process.exitCode = 1;
}
