import test from 'node:test';
import assert from 'node:assert/strict';
await import('@lit-labs/ssr/lib/install-global-dom-shim.js');
const {html}=await import('lit');
const {render}=await import('@lit-labs/ssr');
const {collectResult}=await import('@lit-labs/ssr/lib/render-result.js');

test('picker import does not register a wheel; its standalone import registers only its field dependency',async()=>{
  await import('../../../dist/define/color-picker.js');
  assert.equal(customElements.get('en-color-wheel'),undefined);
  await import('../../../dist/define/color-wheel.js');
  assert.ok(customElements.get('en-color-wheel'));
  assert.ok(customElements.get('en-text-field'));
});
test('SSR exposes named scalar hue and exact entry with immutable P3 state',async()=>{
  const markup=await collectResult(render(html`<en-color-wheel label="Accent" hue-label="Hue angle" .value=${'color(display-p3 0 0 1 / 0.4)'}></en-color-wheel>`));
  assert.match(markup,/role="slider"/);assert.match(markup,/aria-valuenow="240"/);
  assert.match(markup,/Hue angle/);assert.match(markup,/aria-label="Accent"/);
  assert.match(markup,/size="small"/);assert.doesNotMatch(markup,/NaN|undefined°/);
});
