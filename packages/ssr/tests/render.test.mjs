import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { html } = await import('lit');
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderRequest, renderToString } = await import('../dist/index.js');
registerAll();

function all(root, tag) {
  const found = [];
  function visit(node) {
    if (node.tagName === tag) found.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(root);
  return found;
}
const attr = (node, name) => node.attrs.find(item => item.name === name)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');

test('renders actual component DSD and native initial field semantics', async () => {
  const tags = new Set();
  const document = parseFragment(await renderToString(html`<en-text-field label="Project" name="project" value="Studio"></en-text-field><en-button>Save</en-button>`, { onCustomElementRendered: tag => tags.add(tag) }));
  assert.equal(all(document, 'template').filter(node => attr(node, 'shadowrootmode') === 'open').length, 2);
  assert.equal(attr(all(document, 'input')[0], 'value'), 'Studio');
  assert.equal(attr(all(document, 'label')[0], 'for'), 'control');
  assert.equal(text(all(document, 'slot').find(node => attr(node, 'name') === 'label')), 'Project');
  assert.equal(all(document, 'button').length, 1);
  assert.deepEqual([...tags].sort(), ['en-button', 'en-text-field']);
});

test('textarea serializes multiline, leading newline and hostile text as native text', async () => {
  const value = '\nFirst line\n</textarea><script>danger()</script>& final';
  const document = parseFragment(await renderToString(html`<en-textarea label="Notes" .value=${value}></en-textarea>`));
  assert.equal(text(all(document, 'textarea')[0]), value);
  assert.equal(all(document, 'script').length, 0);
  assert.equal(all(document, 'textarea').length, 1);
});

test('concurrent request snapshots do not share accepted state or generated field text', async () => {
  const snapshots = Array.from({ length: 12 }, (_, index) => ({ label: `Request ${index}`, value: `Value ${index}` }));
  const outputs = await Promise.all(snapshots.map(snapshot => renderRequest(snapshot, data => html`<en-text-field .label=${data.label} .value=${data.value}></en-text-field><en-textarea .value=${data.value}></en-textarea>`)));
  outputs.forEach((output, index) => {
    const document = parseFragment(output);
    assert.equal(attr(all(document, 'input')[0], 'value'), snapshots[index].value);
    assert.equal(text(all(document, 'textarea')[0]), snapshots[index].value);
    assert.equal(text(all(document, 'slot').find(node => attr(node, 'name') === 'label')), snapshots[index].label);
  });
});
