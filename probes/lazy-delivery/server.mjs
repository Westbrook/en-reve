import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root = resolve(import.meta.dirname, '../..', process.env.EN_LAZY_DELIVERY_OUT ?? 'artifacts/lazy-delivery/packed');
const port = Number(process.env.EN_LAZY_DELIVERY_PORT ?? 4261);
const streams = new Map();
const manifestMarker = '<script type="application/json" id="ssr-manifest">';

/** Fixture transport only: the renderer's buffered HTML is sent in two HTTP chunks. */
function streamSSR(bytes, url, response) {
  const token = url.searchParams.get('stream');
  if (!token || !/^[A-Za-z0-9_-]{1,120}$/.test(token)) { response.writeHead(400); response.end('A valid stream token is required'); return; }
  if (streams.has(token)) { response.writeHead(409); response.end('Stream token is already owned'); return; }
  const html = bytes.toString('utf8'), split = html.indexOf(manifestMarker);
  if (split < 0) throw Error('SSR manifest split point is missing');
  let tail = html.slice(split);
  const [side, kind] = (url.searchParams.get('mismatch') ?? '').split('-');
  if (side === 'manifest') {
    const end = tail.indexOf('</script>');
    const manifest = JSON.parse(tail.slice(manifestMarker.length, end));
    if (kind === 'missing') delete manifest.delivery;
    else if (kind === 'id') manifest.delivery.id = 'fixture/other';
    else if (kind === 'version') manifest.delivery.version = '2';
    else if (kind === 'schema') manifest.delivery.schemaVersion = 2;
    else throw Error('Unknown streamed manifest mismatch');
    const json = JSON.stringify(manifest).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
    tail = manifestMarker + json + tail.slice(end);
  }
  let timer;
  const cleanup = () => { clearTimeout(timer); if (streams.get(token) === record) streams.delete(token); };
  const record = {release() { cleanup(); response.end(tail); }};
  streams.set(token, record);
  // Each response owns its token. A failed test or disconnected page releases it;
  // the deadline fails the transport rather than silently delivering the suffix.
  response.once('close', cleanup);
  timer = setTimeout(() => { cleanup(); response.destroy(new Error('Stream release deadline expired')); }, 60_000);
  timer.unref();
  response.writeHead(200, {'content-type': 'text/html', 'cache-control': 'no-store', 'x-en-fixture-stream': 'buffered-ssr-shell-then-manifest'});
  response.flushHeaders();
  // Every island and its declarative shadow roots close before the split. The
  // later manifest/bootstrap owns these existing nodes; it does not replay HTML.
  response.write(html.slice(0, split));
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost'), pathname = url.pathname;
    if (pathname === '/__fixture/stream-release') {
      if (request.method !== 'POST') { response.writeHead(405, {allow: 'POST'}); response.end(); return; }
      const record = streams.get(url.searchParams.get('token'));
      if (!record) { response.writeHead(404); response.end('Unknown or completed stream'); return; }
      record.release(); response.writeHead(204); response.end(); return;
    }
    const streamed = /^\/stream-ssr-(global|shadow)\.html$/.exec(pathname);
    if (streamed) {
      streamSSR(await readFile(resolve(root, `ssr-${streamed[1]}.html`)), url, response);
      return;
    }
    const file = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + '/')) throw Error('Invalid path');
    const bytes = await readFile(file);
    response.writeHead(200, {'content-type': ({'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'})[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store'});
    response.end(bytes);
  } catch {response.writeHead(404); response.end('Not found');}
});
server.listen(port, '127.0.0.1');
