import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { createGameApp } from './app.js';

const port = Number(process.env.PORT || 8080);
const dataDir = process.env.DATA_DIR || (existsSync('/data') ? '/data' : resolve(process.cwd(), 'data'));
mkdirSync(dataDir, { recursive: true });
const buildSha = process.env.BUILD_SHA || process.env.GIT_SHA || 'dev';
const { app } = createGameApp({ dataDir, buildSha });

console.log(JSON.stringify({ level: 'info', event: 'room_service_started', port, dataDir: dataDir === '/data' ? '/data' : 'local fallback', signingKey: 'loaded-or-generated', build: buildSha }));
serve({ fetch: app.fetch, port });
