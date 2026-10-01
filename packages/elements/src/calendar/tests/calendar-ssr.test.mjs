import test from 'node:test';
import assert from 'node:assert/strict';

await import('@lit-labs/ssr/lib/install-global-dom-shim.js');
const { html } = await import('lit');
const { render } = await import('@lit-labs/ssr');
const { collectResult } = await import('@lit-labs/ssr/lib/render-result.js');
await import('../../../dist/define/date-picker.js');

test('alternate calendar SSR includes era, localized grid and ISO-native edit description', async () => {
  const markup = await collectResult(render(html`<en-date-picker calendar="buddhist" locale="th-TH" value="2024-02-29" today="2024-02-01" name="date"></en-date-picker>`));
  assert.match(markup, /Buddhist calendar · BE/);
  assert.match(markup, /2567/);
  assert.match(markup, /type="date"[^>]*value="2024-02-29"/);
  assert.match(markup, /aria-describedby="description calendar-edit-hint"/);
  assert.match(markup, /Edit Gregorian date/);
  assert.match(markup, /data-date="2024-02-29"/);
});

test('unsupported SSR calendar has an explanation instead of a mislabeled Gregorian grid', async () => {
  const markup = await collectResult(render(html`<en-calendar calendar="hebrew" value="2024-02-29"></en-calendar>`));
  assert.match(markup, /part="configuration"/);
  assert.match(markup, /unsupported/);
  assert.doesNotMatch(markup, /role="grid"/);
});

test('range property bindings are safe before a render root exists and expose endpoint semantics', async()=>{
 const range=Object.freeze({start:'2026-09-16',end:'2026-09-18'});
 const markup=await collectResult(render(html`<en-date-picker selection="range" .rangeValue=${range} start-name="from" end-name="to" calendar="buddhist" locale="en" today="2026-09-01" label="Period"></en-date-picker>`));
 assert.match(markup,/range-summary/);
 assert.match(markup,/2569/);
 assert.match(markup,/calendar-range-start/);
 assert.match(markup,/Apply range/);
 assert.match(markup,/range-start/);
});
