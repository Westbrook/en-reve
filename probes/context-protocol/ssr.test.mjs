import '@en-reve/ssr/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { html } from 'lit';
import { renderToString } from '@en-reve/ssr';
import { registerAll } from '@en-reve/elements/catalog.js';
registerAll();

test('reorderable authored and data trees have the same first-paint handles and shortcuts', async () => {
  const authored = await renderToString(html`<en-tree reorderable><en-tree-item value="one" label="One"></en-tree-item><en-tree-item value="two" label="Two" disabled></en-tree-item></en-tree>`);
  const data = await renderToString(html`<en-tree reorderable .items=${[{value:'one',label:'One'},{value:'two',label:'Two',disabled:true}]}></en-tree>`);
  for (const markup of [authored,data]) {
    assert.equal((markup.match(/part="drag-handle"/g)??[]).length,1);
    assert.equal((markup.match(/aria-keyshortcuts="Alt\+M"/g)??[]).length,2);
  }
  const ordinary = await renderToString(html`<en-tree><en-tree-item value="one" label="One"></en-tree-item></en-tree>`);
  assert.doesNotMatch(ordinary,/part="drag-handle"/);
});

test('explicit messages render on the server without requiring browser context', async () => {
  const markup=await renderToString(html`<en-editor-toolbar .messages=${{commands:{bold:'Gras',italic:'Italique'}}}></en-editor-toolbar>`);
  assert.match(markup,/Gras/);assert.match(markup,/Italique/);
  const ordinary=await renderToString(html`<en-editor-toolbar></en-editor-toolbar>`);
  assert.match(ordinary,/Bold/);assert.doesNotMatch(ordinary,/Gras/);
});
