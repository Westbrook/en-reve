import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePackOutput, singlePackOutput } from './npm-pack.mjs';
const archive = { name: '@en-reve/elements', filename: 'en-reve-elements-0.1.0.tgz', integrity: 'sha512-example' };
test('npm 11 arrays and npm 12 keyed receipts retain archive identity', () => {
  for (const value of [[archive], { [archive.name]: archive }]) {
    assert.deepEqual(singlePackOutput(JSON.stringify(value), archive.name), archive);
  }
});
test('pack parsing rejects empty, wrong-package, multiple and invalid archive receipts', () => {
  for (const value of [null, [], {}, [{ ...archive, filename: '../escape.tgz' }], { error: { message: 'pack failed' } }]) {
    assert.throws(() => parsePackOutput(JSON.stringify(value)), /Invalid npm pack/);
  }
  assert.throws(() => singlePackOutput(JSON.stringify([archive]), '@en-reve/styles'), /exactly one/);
  assert.throws(() => singlePackOutput(JSON.stringify([archive, archive]), archive.name), /exactly one/);
});
