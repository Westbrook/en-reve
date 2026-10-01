import '@en-reve/ssr/install.js';
import { createServer } from 'vite';
import { renderToString } from '@en-reve/ssr';
import { registerAll } from '@en-reve/elements/catalog.js';
import { treeTemplate } from './tree-template.mjs';
registerAll();
const root = process.cwd();
const server = await createServer({ configFile: false, root,
  plugins: [{ name: 'context-tree-ssr', configureServer(vite) { vite.middlewares.use(async (request,response,next) => {
    if (request.url !== '/context-tree') return next();
    try {
      const markup=await renderToString(treeTemplate());
      response.setHeader('Content-Type','text/html');
      response.end(`<!doctype html><html lang="en"><title>Tree reorder hydration</title><main>${markup}</main><script type="module">window.hydrateFixture=()=>import('/probes/context-protocol/tree-hydrate.mjs').then(m=>m.start());</script></html>`);
    } catch(error) { next(error); }
  }); } }],
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: ['elements', 'primitives', 'styles'].map(name => ({ find: new RegExp('^@en-reve/' + name + '/(.*)\\.js$'), replacement: root + '/packages/' + name + '/src/$1.ts' })) },
  server: { host: '127.0.0.1', port: 47849, strictPort: true },
});
await server.listen();
