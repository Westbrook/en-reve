import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { navigationBodyCapture } from '../../probes/performance-review/response-body.mjs';

async function fixture({ body = '日本語 🧭', base64Encoded = false, bodyError, finishError } = {}) {
  const session = new EventEmitter(), calls = [], frame = {}, page = { mainFrame: () => frame };
  session.send = async (method, parameters) => {
    calls.push({ method, parameters });
    if (method === 'Page.getFrameTree') return { frameTree: { frame: { id: 'main' } } };
    if (method === 'Network.enable') return {};
    if (method === 'Network.getResponseBody') {
      if (bodyError) throw bodyError;
      return { body, base64Encoded };
    }
    throw new Error('Unexpected protocol operation: ' + method);
  };
  const capture = await navigationBodyCapture(session, page, 22 * 1024 * 1024);
  const response = { frame: () => frame, request: () => ({ isNavigationRequest: () => true }), finished: async () => finishError ?? null, url: () => 'http://fixture/', status: () => 200 };
  const document = (requestId = 'document', extra = {}) => session.emit('Network.responseReceived', { requestId, type: 'Document', frameId: 'main', response: { url: response.url(), status: 200 }, ...extra });
  return { session, calls, page, capture, response, document };
}

test('document capture owns a bounded buffer and binds UTF-8 bytes to the main navigation', async () => {
  const f = await fixture();
  f.document('iframe', { frameId: 'child' }); f.document('xhr', { type: 'XHR' }); f.document();
  const result = await f.capture.read(f.response);
  assert.deepEqual(result.bytes, Buffer.from('日本語 🧭'));
  assert.equal(result.requestId, 'document');
  assert.deepEqual(f.calls.find(x => x.method === 'Network.enable').parameters, { maxResourceBufferSize: 44 * 1024 * 1024, maxTotalBufferSize: 88 * 1024 * 1024 });
  assert.deepEqual(f.calls.at(-1), { method: 'Network.getResponseBody', parameters: { requestId: 'document' } });
});
test('base64 response bytes are decoded exactly', async () => {
  const bytes = Buffer.from([0, 0xff, 0x80, 0x41]);
  const f = await fixture({ body: bytes.toString('base64'), base64Encoded: true }); f.document();
  assert.deepEqual((await f.capture.read(f.response)).bytes, bytes);
});
test('unbounded or invalid body sizes fail before enabling capture', async () => {
  for (const size of [0, -1, 0.5, NaN, Infinity, 0x7fffffff]) {
    await assert.rejects(navigationBodyCapture({ send: () => assert.fail('Protocol must not be touched') }, {}, size), /bounded positive/);
  }
});
test('subframe and non-navigation responses cannot fulfill document identity', async () => {
  const f = await fixture(); f.document();
  await assert.rejects(f.capture.read({ ...f.response, frame: () => ({}) }), /main navigation/);
  await assert.rejects(f.capture.read({ ...f.response, request: () => ({ isNavigationRequest: () => false }) }), /main navigation/);
  await assert.rejects(f.capture.read(null), /main navigation/);
});
test('missing, mismatched and ambiguous main-document records fail closed', async () => {
  const f = await fixture();
  await assert.rejects(f.capture.read(f.response), /found 0/);
  f.document();
  await assert.rejects(f.capture.read({ ...f.response, url: () => 'http://wrong/' }), /found 0/);
  await assert.rejects(f.capture.read({ ...f.response, status: () => 404 }), /found 0/);
  f.document('second-navigation');
  await assert.rejects(f.capture.read(f.response), /found 2/);
});
test('network completion failure is retained without substituting local bytes', async () => {
  const f = await fixture({ finishError: new Error('navigation aborted') }); f.document();
  await assert.rejects(f.capture.read(f.response), /navigation aborted/);
  assert(!f.calls.some(x => x.method === 'Network.getResponseBody'));
});
test('response cache failure is retained without substituting local bytes', async () => {
  const f = await fixture({ bodyError: new Error('inspector cache evicted') }); f.document();
  await assert.rejects(f.capture.read(f.response), /inspector cache evicted/);
});
test('diagnostic verifier requires three successful samples of the measured document', t => {
  const directory = mkdtempSync(join(tmpdir(), 'en-docs-diagnostic-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const sha256 = 'a'.repeat(64);
  const good = { assets: [{ path: 'index.html', sha256 }], finalHtmlSha256: sha256, buildChangedDuringProbe: false, runs: [0, 1, 2].map(sample => ({ sample, errors: [], htmlSha256: sha256 })) };
  const check = report => {
    const file = join(directory, 'report.json'); writeFileSync(file, JSON.stringify(report));
    return spawnSync(process.execPath, [new URL('./verify-diagnostic.mjs', import.meta.url).pathname, file], { encoding: 'utf8' });
  };
  const passed = check(good); assert.equal(passed.status, 0, passed.stderr);
  for (const mutate of [
    x => x.runs.pop(), x => { x.runs[1].sample = 0; }, x => { x.runs[1].failure = 'capture failed'; },
    x => x.runs[1].errors.push('page failure'), x => { x.runs[1].htmlSha256 = 'b'.repeat(64); },
    x => { x.finalHtmlSha256 = 'b'.repeat(64); }, x => { x.buildChangedDuringProbe = true; }, x => { x.assets = []; },
  ]) {
    const report = structuredClone(good); mutate(report); assert.notEqual(check(report).status, 0);
  }
});
