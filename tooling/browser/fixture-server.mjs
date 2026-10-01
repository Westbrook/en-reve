import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';

/** Serve built package consumers; never silently replace this with a source/Vite fixture. */
export async function startFixtureServer({root,fixtureRoot,port,label,additionalImports={},additionalRoots=[]}) {
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid ${label} test port.`);
const imports = { ...additionalImports,
	'@en-reve/elements/': '/packages/elements/dist/',
	'@en-reve/primitives/': '/packages/primitives/dist/',
	'@en-reve/styles': '/packages/styles/dist/index.js',
	'@en-reve/styles/': '/packages/styles/dist/',
	'@en-reve/tokens': '/packages/tokens/dist/index.js',
	'@en-reve/tokens/': '/packages/tokens/dist/',
	'lit': '/node_modules/lit/index.js',
	'lit/': '/node_modules/lit/',
	'lit-html': '/node_modules/lit-html/lit-html.js',
	'lit-html/': '/node_modules/lit-html/',
	'lit-element': '/node_modules/lit-element/lit-element.js',
	'lit-element/': '/node_modules/lit-element/',
	'@lit/reactive-element': '/node_modules/@lit/reactive-element/reactive-element.js',
	'@lit/reactive-element/': '/node_modules/@lit/reactive-element/',
	'signal-polyfill': '/node_modules/signal-polyfill/dist/index.js',
	'signal-utils/subtle/reaction': '/node_modules/signal-utils/dist/subtle/reaction.ts.js',
};
const fixture = (await readFile(resolve(fixtureRoot, 'fixture.html'), 'utf8'))
	.replace('<!-- import-map -->', `<script type="importmap">${JSON.stringify({ imports })}</script>`);
const roots = [
	'packages/elements/dist', 'packages/primitives/dist', 'packages/styles/dist', 'packages/tokens/dist',
	'node_modules/lit', 'node_modules/lit-html', 'node_modules/lit-element', 'node_modules/@lit/reactive-element',
	'node_modules/signal-polyfill', 'node_modules/signal-utils',
].concat(additionalRoots).map(path => resolve(root, path));
const mime = { '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const server = createServer(async (request, response) => {
	try {
		if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
		const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://127.0.0.1:${port}`).pathname);
		if (pathname === '/fixture') {
			response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
			response.end(request.method === 'HEAD' ? undefined : fixture); return;
		}
		if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
		const path = pathname === '/fixture.mjs' ? resolve(fixtureRoot, 'fixture.mjs') : resolve(root, `.${pathname}`);
		if (pathname !== '/fixture.mjs' && !roots.some(allowed => path.startsWith(allowed + sep))) { response.writeHead(404).end(); return; }
		const contents = await readFile(path);
		response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
		response.end(request.method === 'HEAD' ? undefined : contents);
	} catch { response.writeHead(404).end(); }
});
server.listen(port,'127.0.0.1');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
return server;
}
