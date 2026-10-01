import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
export default defineConfig({
  root,
  resolve: { alias: [
    { find: /^@en-reve\/primitives\/(.*)\.js$/, replacement: `${root}/packages/primitives/src/$1.ts` },
    { find: /^@en-reve\/styles\/(.*)\.js$/, replacement: `${root}/packages/styles/src/$1.ts` },
    { find: /^@en-reve\/tokens\/(.*)\.js$/, replacement: `${root}/packages/tokens/dist/$1.js` },
  ] },
  server: { host: '127.0.0.1', port: 4386, strictPort: true },
});
