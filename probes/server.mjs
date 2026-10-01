import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import { createServer } from 'vite';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
const { requestTemplate } = await import('./fixtures/ssr-element.mjs');
async function ssrMiddleware(req, res, next) {
  if (!req.url?.startsWith('/ssr?')) return next();
  const url = new URL(req.url, 'http://localhost');
  const snapshot = { count: Number(url.searchParams.get('count') || 0), label: url.searchParams.get('label') || 'Request' };
  const content = await collectResult(render(requestTemplate(snapshot)));
  const serialized = JSON.stringify(snapshot).replaceAll('<', '\\u003c');
  res.setHeader('Content-Type', 'text/html');
  res.end(`<!doctype html><html lang="en"><title>Ordinary SSR probe</title><body><main id="rendered">${content}</main><button id="hydrate">Hydrate</button><script type="module">const snapshot=${serialized};document.querySelector('#hydrate').onclick=window.hydrateProbe=async()=>{await import('/fixtures/hydrate.mjs').then(m=>m.start(snapshot));document.body.dataset.hydrated='true';};</script></body></html>`);
}
const vite = await createServer({ root: 'probes', server: { host: '127.0.0.1', port: 4179, strictPort: true }, appType: 'mpa', plugins: [{ name: 'probe-ssr', configureServer(server) { server.middlewares.use(ssrMiddleware); } }] });
await vite.listen();
