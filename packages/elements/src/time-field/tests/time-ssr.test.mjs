import test from 'node:test';import assert from 'node:assert/strict';
await import('@lit-labs/ssr/lib/install-global-dom-shim.js');
const {html}=await import('lit');const {render}=await import('@lit-labs/ssr');const {collectResult}=await import('@lit-labs/ssr/lib/render-result.js');await import('../../../dist/define/time-field.js');
test('SSR includes localized time, same-shadow label and format hint',async()=>{
 const output=await collectResult(render(html`<en-time-field label="Start time" value="13:30" hour-cycle="12" locale="en-US" name="start"></en-time-field>`));assert.match(output,/value="01:30 PM"/);assert.match(output,/for="control"/);assert.match(output,/Start time/);assert.match(output,/aria-describedby="description format-hint"/);assert.match(output,/part="format-hint"/);
});
test('SSR reports unavailable locale without silently changing locale',async()=>{
 const output=await collectResult(render(html`<en-time-field locale="invalid_locale" value="13:30"></en-time-field>`));assert.match(output,/Time format is unavailable/);
});
