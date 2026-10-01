import '../../dist/install.js';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { renderToString } from '../../dist/index.js';
import { fixtureTemplate, registerFixture } from './fixture.mjs';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const port = Number(process.env.EN_POPUP_MOTION_PORT ?? 4467);
const themeCSS = await readFile(new URL('../../../tokens/dist/default.css', import.meta.url), 'utf8');
registerFixture();
const server = await createServer({
	root, appType: 'custom',
	cacheDir: `${root}/node_modules/.cache/en-popup-motion-tests`,
	optimizeDeps: { entries: [`${root}/packages/ssr/tests/popup-motion/hydrate.mjs`] },
	server: { host: '127.0.0.1', port, strictPort: true },
	plugins: [{ name: 'popup-motion-fixture', configureServer(vite) {
		vite.middlewares.use(async (request, response, next) => {
			try {
				const url = new URL(request.url, 'http://localhost');
				if (url.pathname !== '/fixture') return next();
				const markup = await renderToString(fixtureTemplate());
				response.setHeader('Content-Type', 'text/html');
				response.end(`<!doctype html><html lang="en" data-en-appearance="light"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Native popup motion</title><style>${themeCSS}</style><style>:root{--en-duration-enter:400ms;--en-duration-exit:400ms;--en-motion-surface-offset:8px;--en-motion-surface-scale:.95}body{padding:2rem;font-family:system-ui}#fixture{display:grid;align-items:start;justify-items:start;gap:1rem;max-inline-size:36rem}en-combobox{inline-size:20rem}</style></head><body><main id="fixture">${markup}</main><script type="module">window.hydrateMotionFixture=()=>import('/packages/ssr/tests/popup-motion/hydrate.mjs').then(module=>module.start());</script></body></html>`);
			} catch (error) { next(error); }
		});
	} }],
});
await server.listen();
