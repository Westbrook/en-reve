import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  cacheDir: fileURLToPath(new URL('./.vite/', import.meta.url)),
  root: fileURLToPath(new URL('../../../../../apps/docs/', import.meta.url)),
  // These frozen interaction fixtures do not need HMR. Registering hundreds of
  // imported files with macOS FSEvents can block the first module responses.
  server: { host: '127.0.0.1', port: 4296, strictPort: true, hmr: false, watch: null, fs: { allow: [fileURLToPath(new URL('../../../../../', import.meta.url))] } },
});
