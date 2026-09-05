import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const buildSha = process.env.VITE_BUILD_SHA || execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const appRoutes = new Set(['/', '/demo', '/privacy', '/terms']);
const notFoundSource = readFileSync(resolve('public/404.html'), 'utf8');

function routeChecks() {
  const install = (middlewares: { use: (handler: (request: { method?: string; url?: string }, response: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }, next: () => void) => void) => void }) => {
    middlewares.use((request, response, next) => {
      if (!['GET', 'HEAD'].includes(request.method || '') || !request.url) return next();
      const path = new URL(request.url, 'http://local.test').pathname;
      const isToolPath = path.startsWith('/@') || path.startsWith('/src/') || path.startsWith('/node_modules/');
      const isAsset = /\.[a-z0-9]+$/i.test(path) && path !== '/404.html';
      if (appRoutes.has(path) || isToolPath || isAsset) return next();
      response.statusCode = 404;
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(request.method === 'HEAD' ? undefined : notFoundSource.replaceAll('__BUILD_ID__', buildSha));
    });
  };
  return {
    name: 'roomcode-route-checks',
    configureServer(server: { middlewares: Parameters<typeof install>[0] }) { install(server.middlewares); },
    configurePreviewServer(server: { middlewares: Parameters<typeof install>[0] }) { install(server.middlewares); },
    closeBundle() {
      const outputPath = resolve('dist/404.html');
      const output = readFileSync(outputPath, 'utf8');
      writeFileSync(outputPath, output.replaceAll('__BUILD_ID__', buildSha));
    },
  };
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_SHA': JSON.stringify(buildSha),
  },
  plugins: [routeChecks()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
  },
  server: {
    strictPort: true,
  },
});
