import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
const { html, LitElement } = await import('lit');
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderToString } = await import('../dist/index.js');
const { renderIslandMarkup } = await import('../dist/island-markup.js');
registerAll();
function templates(markup) {
  const found = [];
  const visit = node => { if (node.tagName === 'template') found.push(node); for (const child of node.childNodes ?? []) visit(child); if (node.content) visit(node.content); };
  visit(parseFragment(markup)); return found;
}
const attr = (node, name) => node.attrs.find(attr => attr.name === name)?.value;

test('each field renderer serializes its own target, including nested and textarea adapters', async () => {
  const markup = await renderToString(html`<en-card><en-text-field label="Name"></en-text-field><en-textarea label="Notes" value="hello"></en-textarea><en-select label="Format"></en-select><en-combobox label="Asset"></en-combobox></en-card><en-button>Save</en-button>`);
  const roots = templates(markup).filter(node => attr(node, 'shadowrootmode'));
  assert.equal(roots.filter(node => attr(node, 'shadowrootreferencetarget') === 'control').length, 4);
  assert.equal(roots.filter(node => attr(node, 'shadowrootreferencetarget') === undefined).length, roots.length - 4);
  assert.ok(!markup.includes('data-en-reference-target-ssr'));
});

test('request-local target records preserve escaping, null and renderer identity', async () => {
  class Special extends LitElement {
    static properties = { target: {} };
    static shadowRootOptions = { mode: 'open', referenceTarget: 'quoted"<&' };
    render() { return html`<input id="quoted">`; }
  }
  class Unset extends Special { static shadowRootOptions = { mode: 'open', referenceTarget: null }; }
  customElements.define('reference-special', Special);customElements.define('reference-unset', Unset);
  const outputs = await Promise.all(Array.from({length: 5}, () => renderToString(html`<reference-special></reference-special><reference-unset></reference-unset>`)));
  for (const output of outputs) {
    assert.deepEqual(templates(output).map(node => attr(node, 'shadowrootreferencetarget')), ['quoted"<&', undefined]);
    assert.ok(!output.includes('data-en-reference-target-ssr'));
  }
});

test('scoped and inert island markup retain per-component targets and hydration markers', async () => {
  const output = await renderToString(html`<en-text-field label="Scoped name"></en-text-field><en-textarea label="Scoped notes"></en-textarea>`);
  const result = { key: 'fields', version: 'v1', tags: ['en-text-field', 'en-textarea'], html: output };
  for (const delivery of ['shadow', 'global', 'template']) {
    const { html: markup } = renderIslandMarkup(result, 'field-island', delivery);
    assert.equal(templates(markup).filter(node => attr(node, 'shadowrootreferencetarget') === 'control').length, 2);
    assert.equal(markup.split('<!--lit-part').length, output.split('<!--lit-part').length);
  }
});
