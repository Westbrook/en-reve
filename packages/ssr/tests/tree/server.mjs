import '../../dist/install.js';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../..', import.meta.url));
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderToString } = await import('../../dist/index.js');
const { treeTemplate } = await import('./template.mjs');
registerAll();

const server = await createServer({
  root, cacheDir: `${root}/node_modules/.cache/en-reve-tree-ssr-test-vite`,
  optimizeDeps: { entries: [`${root}/packages/ssr/tests/tree/hydrate.mjs`] },
  appType: 'custom', server: { host: '127.0.0.1', port: 4197, strictPort: true },
  plugins: [{ name: 'tree-ssr-fixture', configureServer(vite) {
    vite.middlewares.use(async (request, response, next) => {
      if (request.url !== '/tree') return next();
      try {
        const markup = await renderToString(treeTemplate());
        response.setHeader('Content-Type', 'text/html');
        response.end(`<!doctype html><html lang="en"><head><title>Tree hydration</title><style>body{margin:24px;font:16px/1.5 sans-serif}en-tree{max-width:400px}</style></head><body><main id="fixture">${markup}</main><script type="module">window.hydrateTreeFixture = replay => import('/packages/ssr/tests/tree/hydrate.mjs').then(module => module.start(replay));</script></body></html>`);
      } catch (error) { next(error); }
    });
  } }],
});
await server.listen();
