import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Serve only the built distribution. These journeys must not silently use source aliases.
const root = fileURLToPath(new URL('../../../', import.meta.url));
export async function startDocsServer({ distribution = resolve(root, 'dist'), port = Number(process.env.EN_WORKFLOW_TEST_PORT ?? 4391) } = {}) {
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid workflow test server port.');
await Promise.all(['workflows.html', 'workflows/settings.html', 'workflows/chat.html'].map(path => stat(resolve(distribution, path)))).catch(() => { throw new Error('Build all three docs workflow pages before running workflow browser tests.'); });
const pageAliases = new Map([['/api-reference', 'api-reference.html'], ['/api-reference/', 'api-reference.html'], ['/workflows/selection', 'workflows/selection.html'], ['/workflows/selection/', 'workflows/selection.html'], ['/theme-review', 'theme-review.html'], ['/theme-review/', 'theme-review.html'], ['/', 'index.html'], ['/workflows', 'workflows.html'], ['/workflows/', 'workflows.html'], ['/workflows/settings', 'workflows/settings.html'], ['/workflows/settings/', 'workflows/settings.html'], ['/workflows/chat', 'workflows/chat.html'], ['/workflows/chat/', 'workflows/chat.html']]);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const cleanPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const path = resolve(distribution, pageAliases.get(pathname) ?? `.${cleanPath}${extname(cleanPath) ? '' : '.html'}`);
    if (!path.startsWith(distribution + sep)) { response.writeHead(403).end(); return; }
    const contents = await readFile(path);
    response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch (error) { response.writeHead(error?.code === 'ENOENT' ? 404 : 400).end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = await startDocsServer();
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close().then(() => process.exit(0)));
}
