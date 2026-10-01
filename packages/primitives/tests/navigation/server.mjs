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
    response.end(`<!doctype html><html lang="en" dir="${dir}"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Native navigation fixture</title>
      <link rel="stylesheet" href="/packages/styles/dist/navigation.css">
      <style>
        html { scroll-behavior: auto; }
        body { margin: 0; color: #172026; background: white; font-family: system-ui; }
        header, [data-scope] { padding-inline: 20px; }
        header { padding-block: 12px; }
        h1 { font-size: 1.5rem; }
        [data-section] { min-block-size: 720px; padding-block: 12px; }
        [data-section] h2 { margin-block-start: 0; }
        [data-scope] { min-inline-size: 0; }
        [data-mode="two"] { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        [data-mode="nested"] [data-scope] { block-size: 420px; overflow: auto; margin: 120px 16px 900px; border: 2px solid; }
        [data-mode="nested"] [data-section] { min-block-size: 620px; }
        button { font: inherit; }
      </style>
    </head><body data-mode="${mode}">${body}
      <script type="module" src="/packages/primitives/tests/navigation/fixture.ts"></script>
    </body></html>`);
  } catch (error) {
    response.statusCode = 500;
    response.end(String(error?.stack ?? error));
  }
});
await server.listen();
