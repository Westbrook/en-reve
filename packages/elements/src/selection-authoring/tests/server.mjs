import '@en-reve/ssr/install.js';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { registerAll } from '@en-reve/elements/catalog.js';
import { renderToString } from '@en-reve/ssr';
import { selectionTemplate, unselectedTemplate, rejectedSegmentedRootTemplate } from './fixture.mjs';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const port = Number(process.env.EN_SELECTION_AUTHORING_PORT ?? 4457);
registerAll();
const server = await createServer({
  root,
  appType: 'custom',
  cacheDir: `${root}/node_modules/.cache/en-selection-authoring`,
  optimizeDeps: { entries: [`${root}/packages/elements/src/selection-authoring/tests/hydrate.mjs`] },
  server: { host: '127.0.0.1', port, strictPort: true },
  plugins: [{ name: 'selection-authoring-ssr', configureServer(vite) {
    vite.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url, 'http://localhost');
// Add rejectedSegmentedRootTemplate to the server's existing fixture.mjs import.
// Insert after `const url = ...` and before the /fixture pathname guard.
if (url.pathname === '/descriptor-diagnostic') {
  const attribute = url.searchParams.get('attribute');
  if (!['tabindex', 'contenteditable', 'inert', 'aria-hidden'].includes(attribute)) {
    response.statusCode = 400;
    response.end('Unknown diagnostic fixture.');
    return;
  }
  response.setHeader('Content-Type', 'application/json');
  try {
    await renderToString(rejectedSegmentedRootTemplate(attribute));
    response.end(JSON.stringify({ name: null, message: null }));
  } catch (error) {
    if (!(error instanceof TypeError)) return next(error);
    response.statusCode = 422;
    response.end(JSON.stringify({ name: error.name, message: error.message }));
  }
  return;
}
      if (url.pathname !== '/fixture') return next();
      try {
        const propertyBound = url.searchParams.has('property-bound');
        const unselected = url.searchParams.has('unselected');
        const markup = await renderToString(unselected ? unselectedTemplate() : selectionTemplate(propertyBound));
        response.setHeader('Content-Type', 'text/html');
        response.end(`<!doctype html><html lang="en" data-property-bound="${propertyBound}" data-unselected="${unselected}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selection child authoring</title><style>body{font:1rem/1.5 system-ui;margin:1rem}form{display:grid;gap:1rem;max-inline-size:40rem}input{font:inherit}</style></head><body><main id="fixture">${markup}</main><script type="module">window.selectionSubmissions=[];window.hydrateSelectionFixture=()=>import('/packages/elements/src/selection-authoring/tests/hydrate.mjs').then(module=>module.start());</script></body></html>`);
      } catch (error) { next(error); }
    });
  } }],
});
await server.listen();
