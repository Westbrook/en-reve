import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const server = await createServer({ root, configFile: false,
  plugins: [{ name: 'composition-entry', configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url !== '/') return next();
      res.writeHead(302, { Location: '/packages/styles/tests/composition/fixture.html' }); res.end();
    });
  } }],
  cacheDir: `${root}/node_modules/.cache/en-composition-tests`,
  optimizeDeps: { entries: [`${root}/packages/styles/tests/composition/fixture.ts`] },
  server: { host: '127.0.0.1', port: Number(process.env.EN_COMPOSITION_PORT ?? 4486), strictPort: true },
});
await server.listen();
