import {documentHTML} from './document.mjs';
import { createServer } from 'vite';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
const root = new URL('../../../../', import.meta.url).pathname;
const server = await createServer({ configFile: false, root, appType: 'custom', server: { host: '127.0.0.1', port: 4395, strictPort: true, fs: { allow: [root] } } });
server.middlewares.use(async (request, response, next) => {
	if (!request.url?.startsWith('/fixture')) return next();
	try {
		await server.ssrLoadModule('@en-reve/elements/define/skeleton.js');
		const { fixtureTemplate, initialState } = await server.ssrLoadModule('/packages/primitives/tests/content/fixture-template.ts');
		const { contentStyles } = await server.ssrLoadModule('@en-reve/styles/content.js');
		const { foundationStyles } = await server.ssrLoadModule('@en-reve/styles/foundations.js');
		const body = await collectResult(render(fixtureTemplate({ ...initialState(), loading: new URL(request.url, 'http://localhost').searchParams.has('loading') })));
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.end(documentHTML(body,{styles:foundationStyles.cssText+contentStyles.cssText}));
	} catch (error) { response.statusCode = 500; response.end(String(error?.stack ?? error)); }
});
await server.listen();
