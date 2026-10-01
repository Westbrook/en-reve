import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { registerDefinitions } = await import('@en-reve/primitives/interactions/registration.js');
const { renderToString } = await import('../dist/index.js');
const { definitions, mediaViewerDeliveryInitial, mediaViewerDeliveryTemplate } = await import('./fixtures/media-viewer-delivery-template.mjs');
registerDefinitions(customElements, definitions);

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
const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const tags = (root, tag) => all(root, node => node.tagName === tag);
const ownShadow = host => host.childNodes.find(node => node.tagName === 'template' && attr(node, 'shadowrootmode') === 'open').content;
const text = root => all(root, node => node.nodeName === '#text').map(node => node.value).join('');

for (const { id, open } of mediaViewerDeliveryInitial.viewers) {
  test(`${id}: initial SSR includes the eager media body`, async () => {
    const snapshot = { ...mediaViewerDeliveryInitial, viewers: mediaViewerDeliveryInitial.viewers.filter(viewer => viewer.id === id) };
    const rendered = [];
    const document = parseFragment(await renderToString(mediaViewerDeliveryTemplate(snapshot), { onCustomElementRendered: tag => rendered.push(tag) }));
    const host = tags(document, 'en-media-viewer')[0];
    const shadow = ownShadow(host);
    assert.equal(attr(host, 'open'), open ? '' : undefined);
    assert.equal(tags(shadow, 'dialog').length, 1);
    // Native modality begins after hydration even for an initially open host.
    assert.equal(attr(tags(shadow, 'dialog')[0], 'open'), undefined);
    assert.equal(attr(tags(shadow, 'dialog')[0], 'inert'), '');
    assert.equal(tags(shadow, 'en-button').filter(node => attr(node, 'class') === 'en-overlay-close').length, 1);
    assert.equal(tags(shadow, 'en-carousel').length, 1);
    assert.equal(tags(shadow, 'en-carousel-slide').length, snapshot.items.length);
    assert.equal(tags(shadow, 'figure').length, snapshot.items.length);
    assert.equal(all(shadow, node => attr(node, 'class') === 'tools').length, 1);
    assert.equal(tags(shadow, 'input').filter(node => attr(node, 'type') === 'range').length, 1);
    assert.equal(rendered.includes('en-carousel'), true);
    assert.deepEqual(tags(shadow, 'figure').map(figure => attr(tags(figure, 'img')[0], 'src')), snapshot.items.map(item => item.src));
    const activeFrame = all(shadow, node => attr(node, 'data-current') === 'true')[0];
    assert.equal(attr(tags(activeFrame, 'img')[0], 'alt'), 'Second server image');
    assert.match(text(shadow), /Second server caption/);
  });
}

test('a prior open SSR request does not change later closed request data or modality', async () => {
  const one = viewer => ({ ...mediaViewerDeliveryInitial, viewers: [viewer] });
  const open = { ...one(mediaViewerDeliveryInitial.viewers[2]), activeKey: 'other',
    items: [{ key: 'other', src: 'prior-request.svg', alt: 'Prior request image' }] };
  const closed = one(mediaViewerDeliveryInitial.viewers[1]);
  await renderToString(mediaViewerDeliveryTemplate(open));
  const results = await Promise.all(Array.from({ length: 4 }, () => renderToString(mediaViewerDeliveryTemplate(closed))));
  for (const markup of results) {
    const document = parseFragment(markup), host = tags(document, 'en-media-viewer')[0], shadow = ownShadow(host);
    assert.equal(attr(host, 'open'), undefined);
    assert.equal(attr(tags(shadow, 'dialog')[0], 'open'), undefined);
    assert.equal(tags(shadow, 'en-carousel').length, 1);
    assert.deepEqual(tags(shadow, 'figure').map(figure => attr(tags(figure, 'img')[0], 'src')), closed.items.map(item => item.src));
    assert.equal(attr(tags(all(shadow, node => attr(node, 'data-current') === 'true')[0], 'img')[0], 'alt'), 'Second server image');
    assert.doesNotMatch(markup, /prior-request\.svg|Prior request image/);
  }
});
