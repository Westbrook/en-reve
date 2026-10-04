import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { html } = await import('lit');
const { renderToString } = await import('../dist/index.js');
await import('@en-reve/elements/define/rating.js');

function nodes(root, predicate) {
  const found = [];
  function visit(node) {
    if (predicate(node)) found.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(root);
  return found;
}
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const hasPart = (node, part) => (attr(node, 'part') ?? '').split(/\s+/).includes(part);
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');

function assertRatingParts(document, value, max = 5) {
  const root = nodes(document, node => node.tagName === 'template' && attr(node, 'shadowrootmode') === 'open')[0];
  assert.ok(root, 'the rating renders declarative shadow DOM');
  const stars = nodes(root.content, node => hasPart(node, 'star'));
  assert.equal(stars.length, max, 'all positive stars retain the existing Part');
  assert.deepEqual(stars.map(star => hasPart(star, 'star-filled')),
    Array.from({ length: max }, (_, index) => index < value));
  assert.deepEqual(stars.map(text), Array.from({ length: max }, (_, index) => index < value ? '★' : '☆'));
  assert.equal(nodes(root.content, node => hasPart(node, 'star-filled')).length, value);
  const clear = nodes(root.content, node => hasPart(node, 'clear-option'))[0];
  assert.ok(clear, 'the clear choice remains available');
  assert.equal(nodes(clear, node => hasPart(node, 'star') || hasPart(node, 'star-filled')).length, 0);
  const checked = nodes(root.content, node => node.tagName === 'input' && attr(node, 'checked') !== undefined);
  assert.deepEqual(checked.map(input => attr(input, 'value')), [String(value)]);
}

test('rating SSR exposes filled Parts for the initial score and retains the existing star Part', async () => {
  const document = parseFragment(await renderToString(html`<en-rating label="Study rating" value="2"></en-rating>`));
  assertRatingParts(document, 2);
});

test('rating SSR derives filled Parts from normalized property values, including clear and clamped scores', async () => {
  for (const [value, expected] of [[0, 0], [2.6, 3], [-4, 0], [20, 5], [NaN, 0]]) {
    const document = parseFragment(await renderToString(html`<en-rating label="Study rating" .value=${value}></en-rating>`));
    assertRatingParts(document, expected);
  }
  const limited = parseFragment(await renderToString(html`<en-rating label="Study rating" .max=${3} .value=${8}></en-rating>`));
  assertRatingParts(limited, 3, 3);
});

test('disabled rating SSR retains filled Parts for its actual score', async () => {
  const document = parseFragment(await renderToString(html`<en-rating label="Study rating" value="3" disabled></en-rating>`));
  assertRatingParts(document, 3);
  const field = nodes(document, node => hasPart(node, 'field'))[0];
  assert.equal(attr(field, 'disabled'), '');
});
