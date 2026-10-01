import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const port = Number(process.env.EN_FOCUS_SCROLL_PORT ?? 4482);
const server = await createServer({
  root, configFile: false, cacheDir: `${root}/node_modules/.cache/en-focus-scroll-tests`,
  resolve: { alias: [
    { find: /^@en-reve\/styles\/(.+)\.js$/, replacement: `${root}/packages/styles/src/$1.ts` },
  ] },
  optimizeDeps: { entries: [`${root}/packages/styles/tests/focus-scroll/fixture.ts`] },
  server: { host: '127.0.0.1', port, strictPort: true },
});
await server.listen();
