import '@en-reve/ssr/install.js';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const { EnNavigation } = await import('@en-reve/elements/navigation.js');
const { EnBreadcrumbs } = await import('@en-reve/elements/breadcrumbs.js');
const { renderToString } = await import('@en-reve/ssr');
const { fixtureTemplate } = await import('./fixture-template.mjs');
customElements.define('en-navigation', EnNavigation);
customElements.define('en-breadcrumbs', EnBreadcrumbs);
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const port = Number(process.env.EN_NAVIGATION_ELEMENTS_TEST_PORT ?? 4395);
const server = await createServer({
	configFile: false, root, appType: 'custom',
	cacheDir: fileURLToPath(new URL('./.vite/', import.meta.url)),
	optimizeDeps: { entries: [fileURLToPath(new URL('./fixture.mjs', import.meta.url))] },
	server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } },
});
server.middlewares.use(async (request, response, next) => {
	const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
	if (url.pathname === '/destination') {
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.end('<!doctype html><html lang="en"><head><title>Preview destination</title></head><body><h1>Preview destination</h1></body></html>');
		return;
	}
	if (url.pathname !== '/fixture') return next();
	try {
		const mode = url.searchParams.get('render') === 'client' ? 'client' : 'server';
		const direction = url.searchParams.get('dir') === 'rtl' ? 'rtl' : 'ltr';
		const hidden = url.searchParams.get('hidden') === '1';
		const navigationHidden = url.searchParams.get('navigation-hidden') === '1';
		// Automatic public integration: callers author children only.
		const markup = mode === 'server' ? await renderToString(fixtureTemplate({ hidden, navigationHidden })) : '';
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.end(`<!doctype html><html lang="en" dir="${direction}"><head>
			<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
			<title>Encapsulated navigation consumer</title>
			<link rel="stylesheet" href="/packages/tokens/dist/default.css">
			<style>
				html { scroll-behavior: auto; }
				body { margin: 24px; font-family: system-ui; background: white; color: #172026; }
				#fixture { margin-block: 24px; }
				main section { min-block-size: 680px; padding-block-start: 24px; }
				main h2 { margin-block-start: 0; }
				body.hostile a, body.hostile nav { display: none !important; color: rgb(255, 0, 255) !important; font-size: 77px !important; }
				body.custom-parts en-navigation > a, body.custom-parts en-breadcrumbs > a {
					text-decoration: overline; border-radius: 11px;
				}
				body.custom-parts en-navigation::part(base) { border-block-end-width: 5px; }
				body.custom-parts en-breadcrumbs::part(item) { padding-inline: 9px; }
				body.custom-parts en-breadcrumbs::part(separator) { color: rgb(120, 40, 160); }
			</style>
		</head><body data-render="${mode}" data-hidden="${hidden}" data-navigation-hidden="${navigationHidden}">
			<button id="before">Before navigation</button>
			<div id="fixture">${markup}</div>
			<button id="after">After navigation</button>
			<nav aria-label="Host page navigation" id="hostile-control"><a href="#overview">Host page link</a></nav>
			<main><section id="overview" tabindex="-1"><h2>Overview destination</h2><button>Overview action</button></section>
			<section id="details" tabindex="-1"><h2>Details destination</h2><button>Details action</button></section>
			<section id="cancelled" tabindex="-1"><h2>Cancelled destination</h2></section></main>
			<script type="module">
				window.startNavigationFixture = () => import('/packages/elements/src/navigation/tests/fixture.mjs').then(module => module.start());
			</script>
		</body></html>`);
	} catch (error) {
		response.statusCode = 500;
		response.end(String(error?.stack ?? error));
	}
});
await server.listen();
