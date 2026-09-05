import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
  },
  server: {
    strictPort: true,
  },
});
