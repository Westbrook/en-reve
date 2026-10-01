import { StreamGates } from './stream-gates.mjs';
import '@en-reve/ssr/install.js';
import { build, createServer } from 'vite';
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { minifyLitTemplates } from '../../tooling/minify/literals.mjs';
import { createDocumentMinifier } from '../../tooling/minify/document.mjs';

const { renderFixture } = await import('./ssr-entry.mjs');
const root = fileURLToPath(new URL('../../', import.meta.url));
const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.EN_BREADCRUMBS_ADAPTER_TEST_PORT ?? 4396);
const outputRoot = resolve(process.env.EN_BREADCRUMBS_ADAPTER_BUILD_DIR ?? resolve(root, 'node_modules/.cache/en-breadcrumbs-ssr-adapter-build'));

function documentFor(markup, { mode = 'server', caseName = 'default', built = false, hidden = false } = {}) {
	const client = built ? '/built-assets/entry.js' : '/probes/breadcrumbs-ssr-adapter/client.mjs';
	return `<!doctype html><html lang="en"><head>
		<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
		<title>Automatic breadcrumbs SSR adapter</title>
		<link rel="icon" href="data:,">
		<style>
			body { margin: 24px; font: 16px / 1.5 system-ui; background: white; color: #172026; }
			#fixture { margin-block: 24px; }
			main section { min-block-size: 650px; padding-block-start: 24px; }
			main h1 { margin-block-start: 0; }
		</style>
	</head><body data-mode="${mode}" data-case="${caseName}" data-built="${built}" data-hidden="${hidden}">
		<button id="before">Before path</button><div id="fixture">${markup}</div><button id="after">After path</button>
		<main><section id="home" tabindex="-1"><h1>Home destination</h1></section>
		<section id="projects" tabindex="-1"><h1>Projects destination</h1></section>
		<section id="extra" tabindex="-1"><h1>Extra destination</h1></section>
		<section id="updated" tabindex="-1"><h1>Updated destination</h1></section>
		<section id="cancelled" tabindex="-1"><h1>Cancelled destination</h1></section></main>
		<script type="module">window.startProbe = () => import('${client}').then(module => module.start());</script>
	</body></html>`;
}

// Build both sides with the maintained literal minifier. Rendering runs in a
// child process so its bundled constructors cannot collide with this server's registry.
async function prepareBuiltFixture() {
	await mkdir(outputRoot, { recursive: true });
	try { await symlink(resolve(root, 'node_modules'), resolve(outputRoot, 'node_modules'), 'dir'); }
	catch (error) { if (error.code !== 'EEXIST') throw error; }
	await writeFile(resolve(outputRoot, 'package.json'), '{"type":"module"}\n');
	const entry = resolve(fixtureRoot, 'ssr-entry.mjs');
	const include = [fixtureRoot, resolve(root, 'packages')];
	const shared = { root, configFile: false, logLevel: 'warn', plugins: [minifyLitTemplates({ include })] };
	await build({ ...shared, base: '/built-assets/', build: {
		target: 'es2022', outDir: resolve(outputRoot, 'client'), emptyOutDir: true, sourcemap: true,
		rolldownOptions: { input: resolve(fixtureRoot, 'client.mjs'), output: { entryFileNames: 'entry.js' }, preserveEntrySignatures: 'strict' },
	} });
	await build({ ...shared, ssr: { external: ['lit', '@lit-labs/ssr', '@lit-labs/ssr-client', 'signal-polyfill', 'signal-utils'], noExternal: [/^@en-reve\//] }, build: {
		target: 'node24', ssr: entry, outDir: resolve(outputRoot, 'server'), emptyOutDir: true, minify: false,
		rolldownOptions: { output: { entryFileNames: 'entry.mjs' } },
	} });
	const runner = resolve(outputRoot, 'render-built.mjs');
	const rendered = resolve(outputRoot, 'markup.html');
	await writeFile(runner, `import '@en-reve/ssr/install.js';\nimport { writeFile } from 'node:fs/promises';\nconst { renderFixture } = await import(${JSON.stringify(pathToFileURL(resolve(outputRoot, 'server/entry.mjs')).href)});\nawait writeFile(${JSON.stringify(rendered)}, await renderFixture());\n`);
	await promisify(execFile)(process.execPath, [runner], { cwd: root, env: process.env, timeout: 30_000 });
	const source = documentFor(await readFile(rendered, 'utf8'), { built: true });
	const { html, report } = createDocumentMinifier()(source, { filename: 'breadcrumbs-built.html' });
	await writeFile(resolve(outputRoot, 'document.html'), html);
	await writeFile(resolve(outputRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
await prepareBuiltFixture();
if (process.env.EN_BREADCRUMBS_ADAPTER_PREPARE_ONLY === '1') process.exit(0);

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.map': 'application/json' };
const server = await createServer({
	configFile: false, root, appType: 'custom', cacheDir: resolve(root, 'node_modules/.cache/en-breadcrumbs-ssr-adapter-vite'),
	optimizeDeps: { entries: [resolve(fixtureRoot, 'client.mjs')] },
	server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } },
});
const streamGates = new StreamGates();
server.middlewares.use(async (request, response, next) => {
	const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
	try {
		if (url.pathname === '/release-stream') { const released = streamGates.release(url.searchParams.get('id')); response.statusCode = released ? 200 : 404; response.end(released ? 'Released' : 'Unknown stream'); return; }
		if (url.pathname === '/built-fixture' || url.pathname === '/built-report' || url.pathname.startsWith('/built-assets/')) {
			const path = url.pathname === '/built-fixture' ? resolve(outputRoot, 'document.html')
				: url.pathname === '/built-report' ? resolve(outputRoot, 'report.json')
				: resolve(outputRoot, 'client', url.pathname.slice('/built-assets/'.length));
			const allowedRoot = url.pathname.startsWith('/built-assets/') ? resolve(outputRoot, 'client') : outputRoot;
			if (!path.startsWith(allowedRoot + sep)) throw new Error('Invalid built asset path');
			response.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
			response.end(await readFile(path)); return;
		}
		if (url.pathname !== '/fixture') return next();
		const mode = url.searchParams.get('mode') === 'client' ? 'client' : 'server';
		const caseName = ['adjacent', 'nested'].includes(url.searchParams.get('case')) ? url.searchParams.get('case') : 'default';
		const hidden = url.searchParams.get('hidden') === '1';
		const markup = mode === 'client' ? '' : await renderFixture(caseName, hidden);
		const document = documentFor(markup, { mode, caseName, hidden });
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.setHeader('X-Probe-Renderer', '@en-reve/ssr + createBreadcrumbsSsrAdapter');
		if (url.searchParams.has('stream')) {
			// Stage the already-buffered adapter output. This tests incremental
			// browser parsing, not an adapter capable of output before finalization.
			const parsed = parse(document, { sourceCodeLocationInfo: true });
			function find(node) {
				if (node.tagName === 'a' && node.attrs?.some(attribute => attribute.name === 'id' && attribute.value === 'path-home')) return node;
				for (const child of node.childNodes ?? []) { const found = find(child); if (found) return found; }
			}
			const split = find(parsed)?.sourceCodeLocation?.endTag?.endOffset;
			if (!split) throw new Error('Streaming fixture is missing its first authored anchor');
			const gate = streamGates.create(url.searchParams.get('stream'));
			response.once('close', gate.cancel);
			response.write(document.slice(0, split)); await gate.promise;
			if (!response.destroyed) response.end(document.slice(split));
		} else response.end(document);
	} catch (error) { response.statusCode = 500; response.end(String(error?.stack ?? error)); }
});
await server.listen();
