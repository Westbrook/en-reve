import '../dist/install.js';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { prepareMinificationFixture } from './minification/build.mjs';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const distribution = resolve(root, 'dist');
// The producer registry is isolated; all browser engines share this server's fresh fixture.
const { directory: minificationRoot } = await prepareMinificationFixture();
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderToString } = await import('../dist/index.js');
const {patternsTemplate} = await import('./fixtures/patterns-template.mjs');
const { compositeAccessibilityTemplate } = await import('./fixtures/composite-accessibility-template.mjs');
const { descriptionContentTemplate } = await import('./fixtures/description-content-template.mjs');
const { fixtureTemplate } = await import('./fixtures/template.mjs');
const { optionalSlotsTemplate, optionalSlotsDocumentStyles } = await import('./fixtures/optional-slots-template.mjs');
const { comboboxContentTemplate } = await import('./fixtures/combobox-content-template.mjs');
const { mediaViewerDeliveryTemplate, mediaViewerDeliveryDocumentParts } = await import('./fixtures/media-viewer-delivery-template.mjs');
const { commandPaletteContentTemplate, commandPaletteContentDocumentParts } = await import('./fixtures/command-palette-content-template.mjs');
const { paginationContentTemplate, paginationContentDocumentParts } = await import('./fixtures/pagination-content-template.mjs');
registerAll();

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const deliveryFixtures = [
  { name: 'media-viewer-delivery', template: mediaViewerDeliveryTemplate, documentParts: mediaViewerDeliveryDocumentParts, streams: new Map() },
  { name: 'command-palette-content', template: commandPaletteContentTemplate, documentParts: commandPaletteContentDocumentParts, streams: new Map() },
];
const server = await createServer({
  root,
  cacheDir: resolve(root, 'node_modules/.cache/en-reve-ssr-test-vite'),
  optimizeDeps: { entries: [resolve(root, 'packages/ssr/tests/fixtures/hydrate.mjs')] },
  appType: 'custom',
  server: { host: '127.0.0.1', port: Number(process.env.EN_SSR_TEST_PORT ?? 4192), strictPort: true },
  plugins: [{ name: 'real-ssr-tests', configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;
        const delivery = deliveryFixtures.find(fixture => ['fixture', 'stream', 'release'].some(suffix => pathname === `/${fixture.name}-${suffix}`));
        if (delivery && pathname === `/${delivery.name}-release`) {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          const id = url.searchParams.get('id');
          const pending = delivery.streams.get(id);
          if (!pending) { res.statusCode = 404; res.end(); return; }
          if (pending.suffix === undefined) { res.statusCode = 409; res.end(); return; }
          delivery.streams.delete(id);
          pending.response.end(pending.suffix);
          res.statusCode = 204; res.end(); return;
        }
        if (delivery) {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return; }
          const streamed = pathname === `/${delivery.name}-stream`;
          const id = url.searchParams.get('id');
          if (streamed && (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) { res.statusCode = 400; res.end(); return; }
          if (streamed && delivery.streams.has(id)) { res.statusCode = 409; res.end(); return; }
          const pending = { response: res, suffix: undefined };
          if (streamed) {
            delivery.streams.set(id, pending);
            res.once('close', () => { if (delivery.streams.get(id) === pending) delivery.streams.delete(id); });
          }
          const markup = await renderToString(delivery.template());
          const { prefix, suffix } = delivery.documentParts(markup);
          res.setHeader('Content-Type', 'text/html');
          if (streamed) { pending.suffix = suffix; res.write(prefix); }
          else res.end(prefix + suffix);
          return;
        }
        if (pathname === '/minification-fixture' || pathname.startsWith('/minification-assets/')) {
          const path = pathname === '/minification-fixture'
            ? resolve(minificationRoot, 'document.html')
            : resolve(minificationRoot, 'client', pathname.slice('/minification-assets/'.length));
          const allowedRoot = pathname === '/minification-fixture' ? minificationRoot : resolve(minificationRoot, 'client');
          if (!path.startsWith(allowedRoot + sep)) throw new Error('Invalid fixture file path');
          res.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
          res.end(await readFile(path));
          return;
        }
        if (pathname === '/optional-slots-fixture') {
          const markup = await renderToString(optionalSlotsTemplate());
          res.setHeader('Content-Type', 'text/html');
          res.end(`<!doctype html><html lang="en"><head><title>Optional slot hydration</title><style>${optionalSlotsDocumentStyles}</style></head><body><main id="optional-slots-fixture">${markup}</main><script type="module">window.hydrateOptionalSlotsFixture = () => import('/packages/ssr/tests/fixtures/optional-slots-hydrate.mjs').then(module => module.start());</script></body></html>`);
          return;
        }
        if (pathname === '/combobox-content-fixture') {
          const markup = await renderToString(comboboxContentTemplate());
          res.setHeader('Content-Type', 'text/html');
          res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Combobox content hydration</title><link rel="stylesheet" href="/packages/tokens/dist/default.css"><style>body{margin:24px;font:16px/1.5 sans-serif}form{display:grid;gap:16px;max-width:32rem}</style></head><body><main id="combobox-content-fixture">${markup}</main><script type="module">window.hydrateComboboxContent = () => import('/packages/ssr/tests/fixtures/combobox-content-hydrate.mjs').then(module => module.start());</script></body></html>`);
          return;
        }
        if (pathname === '/pagination-content-fixture') {
          const markup = await renderToString(paginationContentTemplate());
          res.setHeader('Content-Type', 'text/html');
          res.end(paginationContentDocumentParts(markup));
          return;
        }
        if (pathname === '/patterns-fixture') {
          const markup = await renderToString(patternsTemplate());
          res.setHeader('Content-Type','text/html');
          res.end(`<!doctype html><html lang="en"><head><title>Pattern hydration</title></head><body><main id="patterns-fixture">${markup}</main><script type="module">window.hydratePatterns=()=>import('/packages/ssr/tests/fixtures/patterns-hydrate.mjs').then(module=>module.start());</script></body></html>`);return;
        }
        if (pathname === '/composite-accessibility-fixture') {
          const markup = await renderToString(compositeAccessibilityTemplate());
          res.setHeader('Content-Type', 'text/html');
          res.end(`<!doctype html><html lang="en"><head><title>Composite accessibility</title></head><body><main>${markup}</main><script type="module">window.hydrateComposites = () => import('/packages/ssr/tests/fixtures/composite-accessibility-hydrate.mjs').then(module => module.start());</script></body></html>`);
          return;
        }
        if (pathname === '/description-content-fixture') {
          const markup = await renderToString(descriptionContentTemplate());
          res.setHeader('Content-Type', 'text/html');
          res.end(`<!doctype html><html lang="en"><head><title>Description content</title><link rel="stylesheet" href="/packages/tokens/dist/default.css"><style>body{margin:24px;font:16px/1.5 sans-serif}main> :is(en-rich-text-editor,en-token-editor,en-range-slider,en-selection-collection){display:block;margin-block:16px;max-inline-size:40rem}</style></head><body><main id="description-content-fixture">${markup}</main><script type="module">window.hydrateDescriptions = () => import('/packages/ssr/tests/fixtures/description-content-hydrate.mjs').then(module => module.start());</script></body></html>`);
          return;
        }
        if (pathname === '/fixture') {
          const markup = await renderToString(fixtureTemplate());
          res.setHeader('Content-Type', 'text/html');
          res.end(`<!doctype html><html lang="en"><head><title>Real component hydration</title></head><body><main id="fixture">${markup}</main><script type="module">window.hydrateFixture = () => import('/packages/ssr/tests/fixtures/hydrate.mjs').then(module => module.start());</script></body></html>`);
          return;
        }
        if (pathname === '/' || pathname.startsWith('/assets/') || pathname.startsWith('/evidence/')) {
          const path = resolve(distribution, pathname === '/' ? 'index.html' : pathname.slice(1));
          if (!path.startsWith(distribution + sep)) throw new Error('Invalid file path');
          res.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
          res.end(await readFile(path));
          return;
        }
        next();
      } catch (error) { next(error); }
    });
  } }],
});
await server.listen();
