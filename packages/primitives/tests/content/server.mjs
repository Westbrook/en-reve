import { createServer } from 'vite';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
const root = new URL('../../../../', import.meta.url).pathname;
const server = await createServer({ configFile: false, root, appType: 'custom', server: { host: '127.0.0.1', port: 4395, strictPort: true, fs: { allow: [root] } } });
server.middlewares.use(async (request, response, next) => {
	if (!request.url?.startsWith('/fixture')) return next();
	try {
		await server.ssrLoadModule('/packages/elements/src/define/skeleton.ts');
		const { fixtureTemplate, initialState } = await server.ssrLoadModule('/packages/primitives/tests/content/fixture-template.ts');
		const { contentStyles } = await server.ssrLoadModule('/packages/styles/src/content.ts');
		const { foundationStyles } = await server.ssrLoadModule('/packages/styles/src/foundations.ts');
		const body = await collectResult(render(fixtureTemplate({ ...initialState(), loading: new URL(request.url, 'http://localhost').searchParams.has('loading') })));
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Content recipes</title><style>${foundationStyles.cssText}${contentStyles.cssText}body{margin:16px}main{display:grid;gap:24px}main>button{justify-self:start}h2{font-size:1.1em}button,a{font:inherit}section{min-inline-size:0}</style></head><body><main class="en-foundation">${body}</main><script type="module" src="/packages/primitives/tests/content/fixture.ts"></script></body></html>`);
	} catch (error) { response.statusCode = 500; response.end(String(error?.stack ?? error)); }
});
await server.listen();
