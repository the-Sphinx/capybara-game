import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTHORING_PREFIX = '/__authoring/game-config/';

function json(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function writeJsonAtomic(targetPath, payload) {
  const tempPath = `${targetPath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, targetPath);
}

function safeJoin(basePath, ...parts) {
  const targetPath = path.resolve(basePath, ...parts);
  if (!targetPath.startsWith(basePath)) {
    throw new Error('Path escape rejected');
  }
  return targetPath;
}

function authoringApiPlugin() {
  const configRoot = path.resolve(__dirname, 'public/config/games');
  return {
    name: 'authoring-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url ? new URL(request.url, 'http://localhost') : null;
        const pathname = requestUrl?.pathname ?? '';
        const normalizedPath = pathname.startsWith('/capybara-game/')
          ? pathname.slice('/capybara-game'.length)
          : pathname;

        if (!normalizedPath.startsWith(AUTHORING_PREFIX)) {
          next();
          return;
        }

        try {
          const relativePath = normalizedPath.slice(AUTHORING_PREFIX.length);
          const segments = relativePath.split('/').filter(Boolean);
          const [gameId, action, worldId] = segments;
          if (!gameId) {
            json(response, 400, { error: 'Missing game id' });
            return;
          }

          const gameRoot = safeJoin(configRoot, gameId);
          const gamePath = safeJoin(gameRoot, 'game.json');
          const worldsRoot = safeJoin(gameRoot, 'worlds');

          if (request.method === 'GET' && segments.length === 1) {
            const game = JSON.parse(await fs.readFile(gamePath, 'utf8'));
            const worldIds = game.worldIds ?? [];
            const worlds = await Promise.all(
              worldIds.map(async (id) => JSON.parse(await fs.readFile(safeJoin(worldsRoot, `${id}.json`), 'utf8'))),
            );
            json(response, 200, { game, worlds });
            return;
          }

          if (request.method === 'POST' && action === 'save-game' && segments.length === 2) {
            const body = JSON.parse(await readBody(request));
            await writeJsonAtomic(gamePath, body);
            json(response, 200, { ok: true });
            return;
          }

          if (request.method === 'POST' && action === 'save-world' && worldId && segments.length === 3) {
            const body = JSON.parse(await readBody(request));
            await writeJsonAtomic(safeJoin(worldsRoot, `${worldId}.json`), body);
            json(response, 200, { ok: true });
            return;
          }

          json(response, 404, { error: 'Unknown authoring endpoint' });
        } catch (error) {
          json(response, 500, { error: error instanceof Error ? error.message : String(error) });
        }
      });
    },
  };
}

export default defineConfig({
  base: '/capybara-game/',
  plugins: [authoringApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        editor: path.resolve(__dirname, 'editor.html'),
        gameEditor: path.resolve(__dirname, 'game-editor.html'),
      },
    },
  },
});
