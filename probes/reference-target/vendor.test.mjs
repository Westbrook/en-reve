import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
test('isolated polyfill source matches the pinned upstream receipt', async () => {
  const root = new URL('./vendor/', import.meta.url);
  const provenance = JSON.parse(await readFile(new URL('provenance.json', root), 'utf8'));
  for (const [path, expected] of Object.entries(provenance.files)) {
    assert.equal(createHash('sha256').update(await readFile(new URL(path, root))).digest('hex'), expected, path);
  }
});
test('importing the requested core and label adapter does not require a DOM', async () => {
  assert.equal(typeof globalThis.document, 'undefined');
  const { installReferenceTarget } = await import('./vendor/src/core.js');
  const { labels } = await import('./vendor/src/adapters/labels.js');
  assert.equal(typeof installReferenceTarget, 'function');
  assert.equal(labels({ activation: 'focus', naming: true }).id, 'labels');
  assert.equal(typeof globalThis.document, 'undefined');
});
test('component-owned controller import does not install globals or require a DOM', async () => {
  assert.equal(typeof globalThis.document, 'undefined');
  const { OwnedLabels } = await import('./owned-labels.js');
  assert.equal(typeof OwnedLabels, 'function');
  assert.equal(typeof globalThis.document, 'undefined');
});
