import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: { alias: [
    { find: '@rufait77/demodock/react', replacement: fileURLToPath(new URL('../../packages/demodock/src/react.tsx', import.meta.url)) },
    { find: '@rufait77/demodock/styles.css', replacement: fileURLToPath(new URL('../../packages/demodock/src/styles.css', import.meta.url)) },
    { find: '@rufait77/demodock', replacement: fileURLToPath(new URL('../../packages/demodock/src/index.ts', import.meta.url)) }
  ] },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: '../../dist', emptyOutDir: true }
});
