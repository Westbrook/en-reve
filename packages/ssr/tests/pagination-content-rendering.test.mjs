import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { EnPagination } = await import('@en-reve/elements/pagination.js');
const { renderToString } = await import('../dist/index.js');
const { paginationContentInitial, paginationContentTemplate } = await import('./fixtures/pagination-content-template.mjs');
customElements.define('en-pagination', EnPagination);

const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
function all(root, predicate) {
  const result = [];
  const visit = node => {
    if (predicate(node)) result.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(root);
  return result;
}
const tags = (root, tag) => all(root, node => node.tagName === tag);
const ownShadow = host => host.childNodes.find(node => node.tagName === 'template' && attr(node, 'shadowrootmode') === 'open').content;

for (const pager of paginationContentInitial.slice(0, 2)) {
  test(`${pager.id}: SSR keeps native navigation, popover shell and authored slots with an eager numeric editor`, async () => {
    const markup = await renderToString(paginationContentTemplate([pager]));
    const host = tags(parseFragment(markup), 'en-pagination')[0];
    const shadow = ownShadow(host);
    const nav = tags(shadow, 'nav');
    assert.equal(nav.length, 1);
    assert.equal(attr(nav[0], 'aria-label'), pager.label);
    assert.equal(tags(shadow, 'button').filter(node => attr(node, 'aria-current') === 'page').length, 1);
    assert.equal(all(shadow, node => attr(node, 'part')?.split(' ').includes('status')).length, 2);
    const panel = all(shadow, node => attr(node, 'popover') === 'auto');
    assert.equal(panel.length, 1);
    assert.equal(attr(panel[0], 'id'), 'page-jump');
    assert.equal(attr(panel[0], 'role'), 'dialog');
    assert.equal(attr(panel[0], 'aria-label'), 'Choose a page');
    assert.equal(attr(panel[0], 'data-positioned'), undefined);
    const invokers = tags(shadow, 'button').filter(node => attr(node, 'popovertarget') !== undefined);
    assert.ok(invokers.length > 0);
    assert.ok(invokers.every(node => attr(node, 'popovertarget') === attr(panel[0], 'id')));
    for (const name of ['previous', 'next']) {
      assert.equal(tags(shadow, 'slot').filter(node => attr(node, 'name') === name).length, 1);
      assert.equal(host.childNodes.filter(node => attr(node, `data-${name}`) === pager.id).length, 1);
    }
    const inputs = tags(panel[0], 'input');
    assert.equal(inputs.length, 1);
    assert.equal(tags(panel[0], 'label').length, inputs.length);
    assert.equal(tags(panel[0], 'button').length, inputs.length * 2);
    if (inputs.length) {
      for (const [name, value] of Object.entries({ type: 'number', min: '1', max: '18', value: '3', required: '' })) assert.equal(attr(inputs[0], name), value);
      assert.equal(attr(tags(panel[0], 'label')[0], 'for'), attr(inputs[0], 'id'));
    }
  });
}

test('concurrent SSR requests retain independent eager page defaults', async () => {
  const pages = [2, 5, 9, 11];
  const { html } = await import('lit');
  const markup = await Promise.all(pages.map(page => renderToString(html`<en-pagination page=${page} page-count="12"></en-pagination>`)));
  for (const [index, result] of markup.entries()) {
    const shadow = ownShadow(tags(parseFragment(result), 'en-pagination')[0]);
    const inputs = tags(shadow, 'input');
    assert.equal(inputs.length, 1);
    assert.equal(attr(inputs[0], 'value'), String(pages[index]));
    assert.equal(all(shadow, node => attr(node, 'popover') === 'auto').length, 1);
  }
});
