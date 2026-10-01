import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { html, LitElement, nothing } = await import('lit');
const { LitElementRenderer } = await import('@lit-labs/ssr/lib/lit-element-renderer.js');
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderToString, renderRequest } = await import('../dist/index.js');
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
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const directElements = node => (node.childNodes ?? []).filter(child => child.tagName);
const shadow = host => directElements(host).find(node => node.tagName === 'template' && attr(node, 'shadowrootmode'));

function projection(host) {
  assert.ok(host, 'the public breadcrumb host exists');
  const root = shadow(host);
  assert.ok(root, 'the public component has declarative shadow DOM');
  assert.equal(attr(root, 'shadowrootmode'), 'open');
  assert.notEqual(attr(root, 'shadowrootslotassignment'), 'manual');
  const nav = all(root.content, 'nav')[0];
  const list = directElements(nav).find(node => node.tagName === 'ol');
  const items = directElements(list).filter(node => node.tagName === 'li');
  const children = directElements(host).filter(node => node !== root);
  assert.equal(items.length, children.length);
  const names = items.map(item => {
    const slots = all(item, 'slot');
    assert.equal(slots.length, 1);
    return attr(slots[0], 'name');
  });
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(children.map(child => attr(child, 'slot')), names);
  return { root, nav, list, items, children };
}

test('ordinary public rendering projects authored native children without caller mapping', async () => {
  const markup = await renderToString(html`<en-breadcrumbs .label=${'Project & workspace path'}>
    <a href="/projects">Projects</a>
    <a href="/projects/studio"><strong>Studio</strong> &amp; tools</a>
    <span aria-current="page">Overview</span>
  </en-breadcrumbs>`);
  const { nav, children } = projection(all(parseFragment(markup), 'en-breadcrumbs')[0]);
  assert.equal(attr(nav, 'aria-label'), 'Project & workspace path');
  assert.deepEqual(children.map(child => [child.tagName, attr(child, 'href'), text(child)]), [
    ['a', '/projects', 'Projects'], ['a', '/projects/studio', 'Studio & tools'], ['span', undefined, 'Overview'],
  ]);
  assert.equal(attr(children[2], 'aria-current'), 'page');
});

test('source edits preserve rich labels, comments and caller-owned native attributes', async () => {
  const content = html`<a href="/projects?q=a&amp;b=c" target="_blank" rel="noopener"><em>${'A < B'}</em><!-- authored label --> &copy;</a>`;
  const bare = await renderToString(content);
  const markup = await renderToString(html`<en-breadcrumbs>${content}${nothing}</en-breadcrumbs>`);
  const { children } = projection(all(parseFragment(markup, { sourceCodeLocationInfo: true }), 'en-breadcrumbs')[0]);
  const original = all(parseFragment(bare, { sourceCodeLocationInfo: true }), 'a')[0];
  const sourceInside = (source, node) => source.slice(node.sourceCodeLocation.startTag.endOffset, node.sourceCodeLocation.endTag.startOffset);
  assert.equal(sourceInside(markup, children[0]), sourceInside(bare, original));
  assert.equal(attr(children[0], 'href'), '/projects?q=a&b=c');
  assert.equal(attr(children[0], 'target'), '_blank');
  assert.equal(attr(children[0], 'rel'), 'noopener');
});

test('requested size reflects before projection and an untouched default remains absent', async () => {
  const document = parseFragment(await renderToString(html`
    <en-breadcrumbs><a href="/default">Default</a></en-breadcrumbs>
    <en-breadcrumbs .size=${'small'}><a href="/small">Small</a></en-breadcrumbs>
    <en-breadcrumbs .size=${'inherit'}><a href="/inherit">Inherited</a></en-breadcrumbs>
    <en-breadcrumbs .size=${'medium'}><a href="/medium">Explicit medium</a></en-breadcrumbs>
  `));
  const hosts = all(document, 'en-breadcrumbs');
  assert.deepEqual(hosts.map(host => attr(host, 'size')), [undefined, 'small', 'inherit', 'medium']);
  hosts.forEach(projection);
});

test('ordinary hidden items keep source nodes and a hidden semantic wrapper', async () => {
  const document = parseFragment(await renderToString(html`<en-breadcrumbs>
    <a hidden href="/hidden">Hidden ancestor</a>
    <a href="/projects">Projects</a>
    <span aria-current="page">Overview</span>
  </en-breadcrumbs>`));
  const { children, items } = projection(all(document, 'en-breadcrumbs')[0]);
  assert.equal(attr(children[0], 'hidden'), '');
  assert.equal(attr(items[0], 'hidden'), '');
  assert.equal(attr(items[1], 'hidden'), undefined);
  assert.equal(all(items[1], 'span').filter(node => attr(node, 'part') === 'separator').length, 0, 'first visible item has no leading separator');
});

class BreadcrumbFrame extends LitElement {
  static properties = { label: {}, leaf: {} };
  constructor() { super(); this.label = ''; this.leaf = ''; }
  render() {
    return html`<section><en-breadcrumbs .label=${this.label}><a href="/frame">Frame</a><span aria-current="page">${this.leaf}</span></en-breadcrumbs><slot></slot></section>`;
  }
}
customElements.define('en-ssr-breadcrumb-frame', BreadcrumbFrame);

test('public breadcrumbs nested inside another component retain renderer context and callbacks', async () => {
  const observed = [];
  const customFrames = [];
  class FrameRenderer extends LitElementRenderer {
    static matchesClass(_ctor, tagName) { return tagName === 'en-ssr-breadcrumb-frame'; }
    renderShadow(info) { customFrames.push(this.element.label); return super.renderShadow(info); }
  }
  const document = parseFragment(await renderToString(html`
    <en-ssr-breadcrumb-frame .label=${'Inside frame'} .leaf=${'Current leaf'}><p>Light child</p></en-ssr-breadcrumb-frame>
    <en-textarea .value=${'Preserved\ntextarea'}></en-textarea>
  `, { elementRenderers: [FrameRenderer], onCustomElementRendered: tag => observed.push(tag) }));
  const frame = all(document, 'en-ssr-breadcrumb-frame')[0];
  const { nav, children } = projection(all(shadow(frame).content, 'en-breadcrumbs')[0]);
  assert.equal(attr(nav, 'aria-label'), 'Inside frame');
  assert.equal(text(children[1]), 'Current leaf');
  assert.deepEqual(customFrames, ['Inside frame']);
  assert.deepEqual(observed.toSorted(), ['en-ssr-breadcrumb-frame', 'en-breadcrumbs', 'en-textarea'].toSorted());
  assert.equal(text(all(document, 'textarea')[0]), 'Preserved\ntextarea');
});

test('caller renderer precedence remains explicit even for the public breadcrumb tag', async () => {
  class OverrideRenderer extends LitElementRenderer {
    static matchesClass(_ctor, tagName) { return tagName === 'en-breadcrumbs'; }
    renderShadow() { return ['<nav aria-label="Application renderer"><ol><li>Owned output</li></ol></nav>']; }
  }
  const markup = await renderToString(html`<en-breadcrumbs><span>Authored leaf</span></en-breadcrumbs>`, { elementRenderers: [OverrideRenderer] });
  const host = all(parseFragment(markup), 'en-breadcrumbs')[0];
  assert.equal(attr(all(shadow(host).content, 'nav')[0], 'aria-label'), 'Application renderer');
  assert.equal(attr(host, 'data-en-breadcrumbs-plan'), undefined);
  assert.equal(attr(directElements(host).find(node => node.tagName === 'span'), 'slot'), undefined);
});

test('overlapping public request snapshots and rejected requests remain isolated', async () => {
  const snapshots = Array.from({ length: 10 }, (_, index) => ({ label: `Path ${index}`, leaf: `Leaf ${index}`, invalid: index === 3 }));
  const results = await Promise.allSettled(snapshots.map(snapshot => renderRequest(snapshot, data => html`
    <en-breadcrumbs .label=${data.label}>${data.invalid ? html`<button>Unsupported</button>` : html`<a href="/projects">Projects</a><span aria-current="page">${data.leaf}</span>`}</en-breadcrumbs>
  `)));
  results.forEach((result, index) => {
    assert.equal(result.status, snapshots[index].invalid ? 'rejected' : 'fulfilled');
    if (result.status === 'fulfilled') {
      const { nav, children } = projection(all(parseFragment(result.value), 'en-breadcrumbs')[0]);
      assert.equal(attr(nav, 'aria-label'), snapshots[index].label);
      assert.equal(text(children[1]), snapshots[index].leaf);
    }
  });
});

test('public adapter rejects authored projection ownership and unsupported find-until-found mode', async () => {
  for (const child of [html`<a slot="" href="/conflict">Conflict</a>`, html`<span hidden="until-found">Hidden until found</span>`]) {
    await assert.rejects(() => renderToString(html`<en-breadcrumbs>${child}</en-breadcrumbs>`));
  }
  await assert.rejects(() => renderToString(html`<en-breadcrumbs data-en-breadcrumbs-plan="author"><a href="/projects">Projects</a></en-breadcrumbs>`));
});
