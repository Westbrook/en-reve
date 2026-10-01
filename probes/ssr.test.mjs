import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { parseFragment } from 'parse5';
import { createModel } from './fixtures/model.mjs';
const { requestTemplate } = await import('./fixtures/ssr-element.mjs');
function find(node, tag) {
  if (node.tagName === tag) return node;
  for (const child of node.childNodes || node.content?.childNodes || []) { const match = find(child, tag); if (match) return match; }
}
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
async function output(snapshot) {
  const fragment = parseFragment(await collectResult(render(requestTemplate(snapshot))));
  const host = find(fragment, 'en-probe-ssr');
  const template = find(host, 'template');
  assert.equal(template.attrs.find(attr => attr.name === 'shadowrootmode').value, 'open');
  return { heading: text(find(template.content, 'h2')), count: text(find(template.content, 'output')), input: find(template.content, 'input') };
}
test('a pure snapshot is complete on first synchronous read', () => {
  const model = createModel(5);
  assert.deepEqual(model.view.get(), { count: 5, doubled: 10 });
});
test('SSR uses each request snapshot without user-state leakage', async () => {
  const snapshots = [{ count: 7, label: 'First' }, { count: 23, label: 'Second' }, { count: 7, label: 'First' }];
  const rendered = await Promise.all(snapshots.map(output));
  assert.deepEqual(rendered.map(value => [value.heading, value.count]), [['First', '7'], ['Second', '23'], ['First', '7']]);
  assert.equal(rendered[0].input.attrs.find(attr => attr.name === 'value').value, 'server');
});
test('SSR escapes request text as literal text in the parsed DOM', async () => {
  const label = '<script>alert("user input")</script>';
  const rendered = await output({ count: 4, label });
  assert.equal(rendered.heading, label);
});
