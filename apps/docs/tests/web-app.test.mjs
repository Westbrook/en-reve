import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { installableDocument, webAppPlugin } from '../scripts/web-app.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDocumentStylesInliner } from '../scripts/document-styles.mjs';
const docs = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('public/manifest.json', docs), 'utf8'));

async function shells(directory = docs) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'artifacts', 'public', 'tests'].includes(entry.name)) continue;
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) result.push(...await shells(path));
    else if (entry.name.endsWith('.html')) result.push(path);
  }
  return result;
}

test('all authored and generated docs shells receive shared installation metadata without changing their body', async () => {
  const pages = await shells();
  assert(pages.length > 15);
  for (const file of pages) {
    const before = await readFile(file, 'utf8');
    const after = installableDocument(before);
    assert.equal(after.match(/rel="manifest"/g)?.length, 1, file.pathname);
    assert.equal(after.match(/rel="apple-touch-icon"/g)?.length, 1, file.pathname);
    assert.match(after, /name="viewport" content="[^\"]*viewport-fit=cover/);
    assert.doesNotMatch(after, /user-scalable=no|maximum-scale=1/);
    assert.equal(after.slice(after.indexOf('</head>')), before.slice(before.indexOf('</head>')));
  }
});

test('manifest URLs retain a single identity, launch, shortcuts and icons within root or subpath deployments', async () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  for (const base of ['/', '/en-reve/']) {
    const manifestURL = new URL(`${base}manifest.json`, 'https://example.test');
    const scope = new URL(manifest.scope, manifestURL);
    for (const path of [manifest.id, manifest.start_url, ...manifest.shortcuts.map(s => s.url), ...manifest.icons.map(i => i.src)]) {
      const url = new URL(path, manifestURL);
      assert.equal(url.origin, scope.origin);
      assert(url.pathname.startsWith(scope.pathname));
    }
    const plugin = webAppPlugin();
    plugin.configResolved({ base });
    const head = plugin.transformIndexHtml.handler(await readFile(new URL('workflows/settings.html', docs), 'utf8'));
    assert(head.includes(`href="${base}manifest.json"`));
    assert(head.includes(`href="${base}apple-touch-icon.png"`));
  }
  for (const shortcut of manifest.shortcuts) await readFile(new URL(shortcut.url, docs));
});

test('every declared PNG exists with the advertised pixel dimensions', async () => {
  const icons = [...manifest.icons, { src: 'apple-touch-icon.png', sizes: '180x180' }, { src: 'favicon.png', sizes: '32x32' }];
  for (const icon of icons) {
    const png = await readFile(new URL(`public/${icon.src}`, docs));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  assert(manifest.icons.some(icon => icon.purpose === 'maskable' && icon.sizes === '512x512'));
});


test('SSR document finalization accepts the safe-area stylesheet and preserves install metadata', async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), 'en-web-app-inlining-'));
  try {
    await copyFile(new URL('public/installed-app.css', docs), join(outputRoot, 'installed-app.css'));
    const shell = installableDocument('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>Example</body></html>');
    const output = await createDocumentStylesInliner({ outputRoot })(shell);
    assert.match(output, /<style>[\s\S]*safe-area-inset-bottom/);
    assert.match(output, /rel="manifest" crossorigin="use-credentials"/);
    assert.match(output, /apple-touch-icon/);
    assert.match(output, /<body>Example<\/body>/);
  } finally { await rm(outputRoot, { recursive: true, force: true }); }
});
