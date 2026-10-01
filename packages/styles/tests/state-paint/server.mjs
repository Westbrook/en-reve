import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const server = await createServer({ root, configFile: false,
  plugins: [{ name: 'state-paint-entry', configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url !== '/') return next();
      res.writeHead(302, { Location: '/packages/styles/tests/state-paint/fixture.html' }); res.end();
    });
  } }],
  cacheDir: `${root}/node_modules/.cache/en-state-paint-tests`,
  optimizeDeps: { entries: [`${root}/packages/styles/tests/state-paint/fixture.ts`] },
  server: { host: '127.0.0.1', port: 4483, strictPort: true },
});
await server.listen();
