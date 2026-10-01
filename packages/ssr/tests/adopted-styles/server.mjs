import '../../dist/install.js';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { renderToString } from '../../dist/index.js';
import { fixtureTemplate, registerFixture } from './fixture.mjs';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const port = Number(process.env.EN_ADOPTED_STYLES_PORT ?? 4461);
const themeCSS = await readFile(new URL('../../../tokens/dist/default.css', import.meta.url), 'utf8');
registerFixture();
const server = await createServer({
	root, appType: 'custom',
	cacheDir: `${root}/node_modules/.cache/en-adopted-styles-tests`,
	optimizeDeps: { entries: [`${root}/packages/ssr/tests/adopted-styles/hydrate.mjs`] },
	server: { host: '127.0.0.1', port, strictPort: true },
	plugins: [{ name: 'adopted-styles-fixture', configureServer(vite) {
		vite.middlewares.use(async (request, response, next) => {
			try {
				const url = new URL(request.url, 'http://localhost');
				if (url.pathname === '/consumer-style.css') {
					response.setHeader('Content-Type', 'text/css');
					response.end('.en-button { border-bottom: 9px solid rgb(71, 19, 43); }');
					return;
				}
				if (url.pathname !== '/fixture') return next();
				const markup = await renderToString(fixtureTemplate());
				response.setHeader('Content-Type', 'text/html');
				response.end(`<!doctype html><html lang="en" data-en-appearance="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>SSR stylesheet adoption</title><style>${themeCSS}</style><style>body{padding:1rem;font-family:system-ui}form{display:grid;gap:1rem;max-inline-size:36rem}#owned-link{letter-spacing:3px}#button-a::part(control){outline:3px solid rgb(109,31,71)}en-adopted-style-probe,en-adopted-link-probe{display:block;margin-block:1rem}</style></head><body><main id="fixture">${markup}</main><script type="module">window.hydrateStyleFixture=()=>import('/packages/ssr/tests/adopted-styles/hydrate.mjs').then(module=>module.start());</script></body></html>`);
			} catch (error) { next(error); }
		});
	} }],
});
await server.listen();
