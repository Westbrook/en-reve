import test from 'node:test';
import assert from 'node:assert/strict';

test('base imports without a browser and exposes inherited reactive size metadata', async () => {
  assert.equal(globalThis.document, undefined);
  const { EnElement } = await import('../../../dist/internal/en-element.js');
  class SizeFixture extends EnElement {}
  SizeFixture.finalize();
  const untouched = new SizeFixture();
  assert.equal(untouched.size, 'medium');
  assert.equal(untouched.hasAttribute('size'), false);
  assert.equal(SizeFixture.getPropertyOptions('size').reflect, true);
  assert.ok(SizeFixture.observedAttributes.includes('size'));
  untouched.size = 'large';
  assert.equal(untouched.size, 'large');
});

test('SSR retains an absent default size and reflects a supplied concrete scope', async () => {
  await import('@lit-labs/ssr/lib/install-global-dom-shim.js');
  const { EnElement } = await import('../../../dist/internal/en-element.js');
  const { html } = await import('lit');
  const { render } = await import('@lit-labs/ssr');
  const { collectResult } = await import('@lit-labs/ssr/lib/render-result.js');
  const { parseFragment } = await import('parse5');
  class SizeSSRFixture extends EnElement {
    render() { return html`<output>${this.size}</output>`; }
  }
  customElements.define('en-size-ssr-fixture', SizeSSRFixture);
  const defaultDOM = parseFragment(await collectResult(render(html`<en-size-ssr-fixture></en-size-ssr-fixture>`)));
  const explicitDefaultDOM = parseFragment(await collectResult(render(html`<en-size-ssr-fixture .size=${'medium'}></en-size-ssr-fixture>`)));
  const explicitDOM = parseFragment(await collectResult(render(html`<en-size-ssr-fixture .size=${'small'}></en-size-ssr-fixture>`)));
  const host = (fragment: any) => fragment.childNodes.find((node: any) => node.tagName === 'en-size-ssr-fixture');
  assert.equal(host(defaultDOM).attrs.some((attr: any) => attr.name === 'size'), false);
  assert.equal(host(explicitDefaultDOM).attrs.find((attr: any) => attr.name === 'size').value, 'medium');
  assert.equal(host(explicitDOM).attrs.find((attr: any) => attr.name === 'size').value, 'small');
  const shadow = host(explicitDOM).childNodes.find((node: any) => node.tagName === 'template');
  assert.equal(shadow.attrs.find((attr: any) => attr.name === 'shadowrootmode').value, 'open');
});
