import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const {html}=await import('lit');
const {renderToString}=await import('../dist/index.js');
const {createElementLoader}=await import('@en-reve/elements/lazy.js');
test('lazy SSR definitions register explicitly and color property setters need no owner document',async()=>{
 const loader=createElementLoader(customElements);
 assert.equal(customElements.get('en-color-plane'),undefined);
 await loader.load(['en-color-plane','en-color-wheel']);
 assert.equal(customElements.get('en-color-plane'),undefined);
 await loader.ensure(['en-color-plane','en-color-wheel']);
 const markup=await renderToString(html`<en-color-plane .value=${'#ff0000'}></en-color-plane><en-color-wheel .value=${'#00ff00'}></en-color-wheel>`);
 assert.match(markup,/Color plane/);assert.match(markup,/shadowrootmode="open"/);
});
