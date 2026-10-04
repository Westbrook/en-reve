import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { html } = await import('lit');
// Environment installation and registration are both explicit in this test.
await import('@en-reve/elements/define/slider.js');
await import('@en-reve/elements/define/range-slider.js');
const { renderToString } = await import('../dist/index.js');

function all(root, predicate) {
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
const part = name => node => (attr(node, 'part') ?? '').split(/\s+/).includes(name);
const style = node => Object.fromEntries((attr(node, 'style') ?? '').split(';').filter(Boolean).map(declaration => {
  const colon = declaration.indexOf(':');
  return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
}));

test('scalar SSR serializes the normalized initial native value and matching fill percentage', async () => {
  for (const { min, max, value, accepted, percent } of [
    { min: 0, max: 100, value: 25, accepted: 25, percent: 25 },
    { min: 0, max: 100, value: 200, accepted: 100, percent: 100 },
    { min: 0, max: 0, value: 25, accepted: 0, percent: 0 },
  ]) {
    const document = parseFragment(await renderToString(html`<en-slider label="Amount" min=${min} max=${max} value=${value}></en-slider>`));
    const shadows = all(document, node => node.tagName === 'template' && attr(node, 'shadowrootmode') === 'open');
    assert.equal(shadows.length, 1);
    const controls = all(shadows[0].content, node => node.tagName === 'input' && part('control')(node));
    assert.equal(controls.length, 1);
    assert.equal(attr(controls[0], 'type'), 'range');
    assert.equal(attr(controls[0], 'value'), String(accepted));
    assert.equal(style(controls[0])['--en-slider-value-percent'], `${percent}%`);
  }
});

test('interval SSR exposes a decorative range Part with the same initial endpoint snapshot', async () => {
  const document = parseFragment(await renderToString(html`<en-range-slider label="Budget" min="0" max="100" value="[20,80]"></en-range-slider>`));
  const ranges = all(document, part('range'));
  assert.equal(ranges.length, 1);
  assert.equal(attr(ranges[0], 'aria-hidden'), 'true');
  assert.equal(style(ranges[0])['inset-inline-start'], '20%');
  assert.equal(style(ranges[0])['inline-size'], '60%');
  assert.equal(attr(all(document, part('lower-thumb'))[0], 'aria-valuenow'), '20');
  assert.equal(attr(all(document, part('upper-thumb'))[0], 'aria-valuenow'), '80');
});
