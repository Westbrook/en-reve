/** Portable verifier/server: built-in Node modules only; copied into each package. */
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
export function safePath(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.includes('\0') || path.split('/').some(part => !part || part === '.' || part === '..') || /^[a-z]:/i.test(path) || path.startsWith('/')) throw new Error('Unsafe package path: ' + path);
  return path;
}
export async function inventory(root, prefix = '') {
  if (!(await lstat(root)).isDirectory()) throw new Error('Expected a real directory: ' + root);
  const files = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const path = safePath(prefix + entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not supported: ' + path);
    if (entry.isDirectory()) files.push(...await inventory(resolve(root, entry.name), path + '/'));
    else if (entry.isFile()) files.push({ path, sha256: digest(await readFile(resolve(root, entry.name))) });
    else throw new Error('Unsupported file: ' + path);
  }
  return files;
}
export async function verifyFiles(root, files, manifestPath, actual = null) {
  actual ??= await inventory(root);
  const expected = new Map();
  for (const entry of files) {
    safePath(entry.path);
    if (expected.has(entry.path) || entry.path === manifestPath || !/^sha256:[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Invalid package file record');
    expected.set(entry.path, entry.sha256);
  }
  for (const entry of actual.filter(entry => entry.path !== manifestPath)) {
    if (expected.get(entry.path) !== entry.sha256) throw new Error('Package integrity mismatch: ' + entry.path);
    expected.delete(entry.path);
  }
  if (expected.size) throw new Error('Missing package files: ' + [...expected.keys()].join(', '));
}

export async function readVerifiedFile(root, path, expectedDigest) {
  safePath(path);
  const absolute = resolve(root, path);
  for (let current = absolute; current !== root; current = dirname(current)) {
    if ((await lstat(current)).isSymbolicLink()) throw new Error('Package changed: symlink');
  }
  const bytes = await readFile(absolute);
  if (digest(bytes) !== expectedDigest) throw new Error('Package changed: ' + path);
  return bytes;
}

export async function verifyPackage(root) {
  const actual = await inventory(root);
  const manifest = JSON.parse(await readFile(resolve(root, 'offline-review.json'), 'utf8'));
  if (manifest.schema !== 'en-reve/offline-review' || manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) throw new Error('Unsupported offline review package');
  await verifyFiles(root, manifest.files, 'offline-review.json', actual);
  for (const required of ['serve.mjs', 'site/review-build.json', 'site/theme-review.html', 'candidate.json', 'index.html']) {
    if (!manifest.files.some(entry => entry.path === required)) throw new Error('Missing required package entry: ' + required);
  }
  const build = JSON.parse(await readFile(resolve(root, 'site/review-build.json'), 'utf8'));
  if (manifest.buildFingerprint !== build.fingerprint) throw new Error('Package build identity mismatch');
  return manifest;
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8' };
export async function startOfflineReview(root, { port = 0 } = {}) {
  root = resolve(root);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
  const manifest = await verifyPackage(root);
  const hashes = new Map(manifest.files.map(entry => [entry.path, entry.sha256]));
  const server = createServer(async (request, response) => {
    try {
      if (request.headers.host !== `127.0.0.1:${server.address().port}`) { response.writeHead(403).end(); return; }
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      let path;
      if (pathname === '/offline-review') path = 'index.html';
      else if (pathname === '/offline-candidate.json') path = 'candidate.json';
      else {
        const name = pathname.replace(/^\//, '').replace(/\/$/, '') || 'index.html';
        safePath(name);
        path = 'site/' + name;
        if (!hashes.has(path) && !extname(name)) path += '.html';
      }
      if (!hashes.has(path)) { response.writeHead(404).end(); return; }
      // Check the actual bytes immediately before delivery as well as at startup.
      const bytes = await readVerifiedFile(root, path, hashes.get(path));
      response.writeHead(200, {
        'Content-Type': mime[extname(path)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
        ...(path === 'candidate.json' ? { 'Content-Disposition': 'attachment; filename="candidate.json"' } : {}),
      });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(409).end('Review package changed or request invalid. Stop and verify the package.'); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((done, reject) => server.close(error => error ? reject(error) : done())) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = dirname(fileURLToPath(import.meta.url));
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && args[0] !== '--verify')) throw new Error('Usage: node serve.mjs [--verify]');
  if (args[0] === '--verify') { await verifyPackage(root); console.log('Offline review package integrity verified.'); }
  else {
    const server = await startOfflineReview(root);
    console.log('Open ' + server.url + '/offline-review');
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close().then(() => process.exit(0)));
  }
}
