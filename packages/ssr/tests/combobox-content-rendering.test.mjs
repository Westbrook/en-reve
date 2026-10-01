import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { html } = await import('lit');
const { EnCombobox } = await import('@en-reve/elements/combobox.js');
const { renderToString } = await import('../dist/index.js');
const { comboboxContentItems } = await import('./fixtures/combobox-content-template.mjs');
customElements.define('en-combobox', EnCombobox);

test('SSR eager rows and accepted labels remain independent across requests', async () => {
  const render = (value, items = comboboxContentItems) => renderToString(html`<en-combobox label="Asset" value=${value} description="Choose an asset."
    .items=${items}></en-combobox>`);
  const cases = [
    { value: 'forest', label: 'Forest canvas', items: comboboxContentItems, rows: 4 },
    { value: 'sunset', label: 'Sunset study', items: comboboxContentItems, rows: 4 },
    { value: 'fjord', label: 'Fjord study', items: [comboboxContentItems[2]], rows: 1 },
  ];
  const markup = await Promise.all(cases.map(({ value, items }) => render(value, items)));
  for (const [index, result] of markup.entries()) {
    assert.equal((result.match(/role="option"/g) ?? []).length, cases[index].rows);
    assert.ok(result.includes(`value="${cases[index].label}"`));
    for (const pattern of [/role="combobox"/, /aria-expanded="false"/, /role="listbox"/, /part="status"/, /part="space-status"/, /Choose an asset\./]) assert.match(result, pattern);
  }
  const repeated = await render('forest');
  assert.equal((repeated.match(/role="option"/g) ?? []).length, 4);
  assert.match(repeated, /value="Forest canvas"/);
});
