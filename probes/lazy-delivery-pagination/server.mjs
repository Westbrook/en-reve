import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root = resolve(import.meta.dirname, '../..', process.env.EN_LAZY_DELIVERY_PAGINATION_OUT ?? 'artifacts/lazy-delivery-pagination/packed');
const port = Number(process.env.EN_LAZY_DELIVERY_PAGINATION_PORT ?? 4263);
createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + '/')) throw Error('Invalid path');
    const bytes = await readFile(file);
    response.writeHead(200, {'content-type': ({'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css'})[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store'}); response.end(bytes);
  } catch {response.writeHead(404); response.end('Not found');}
}).listen(port, '127.0.0.1');

