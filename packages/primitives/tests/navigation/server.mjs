import {documentHTML} from './document.mjs';
import { createServer } from 'vite';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';

const root = new URL('../../../../', import.meta.url).pathname;
const port = Number(process.env.EN_NAVIGATION_TEST_PORT ?? 4394);
const server = await createServer({
  configFile: false,
  root,
  cacheDir: new URL('./.vite', import.meta.url).pathname,
  appType: 'custom',
  optimizeDeps: { entries: ['packages/primitives/tests/navigation/fixture.ts'] },
  server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } },
});
server.middlewares.use(async (request, response, next) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
  if (url.pathname !== '/fixture') return next();
  try {
    const mode = ['single', 'nested', 'two'].includes(url.searchParams.get('mode')) ? url.searchParams.get('mode') : 'single';
    const dir = url.searchParams.get('dir') === 'rtl' ? 'rtl' : 'ltr';
    const { fixtureTemplate } = await server.ssrLoadModule('/packages/primitives/tests/navigation/fixture-template.ts');
    const body = await collectResult(render(fixtureTemplate(mode)));
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(documentHTML(body,{mode,dir}));
  } catch (error) {
    response.statusCode = 500;
    response.end(String(error?.stack ?? error));
  }
});
await server.listen();
