import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root = resolve(import.meta.dirname, '../..', process.env.EN_LAZY_DELIVERY_EDITOR_OUT ?? 'artifacts/lazy-delivery-editor/packed');
const port = Number(process.env.EN_LAZY_DELIVERY_EDITOR_PORT ?? 4262);
createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + '/')) throw Error('Invalid path');
    const bytes = await readFile(file);
    response.writeHead(200, {'content-type': ({'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'})[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store'}); response.end(bytes);
  } catch {response.writeHead(404); response.end('Not found');}
}).listen(port, '127.0.0.1');
