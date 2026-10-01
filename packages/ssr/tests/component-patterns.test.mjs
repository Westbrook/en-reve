import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const {html}=await import('lit');
const {registerAll}=await import('@en-reve/elements/catalog.js');
const {renderToString}=await import('../dist/index.js');
registerAll();
test('authored multi-choice SSR projects actual labels and initial selection',async()=>{
 const markup=await renderToString(html`<en-checkbox-group label="Teams" value='["a"]' cards><en-choice-option value="a">Alpha</en-choice-option><en-choice-option value="b" disabled>Beta</en-choice-option></en-checkbox-group><en-toggle-group label="View" value='["b"]'><en-choice-option value="a">Grid</en-choice-option><en-choice-option value="b">List</en-choice-option></en-toggle-group><en-multiselect label="People" value='["a"]'><en-choice-option value="a">Ada</en-choice-option></en-multiselect>`);
 assert.match(markup,/data-en-selection-children/);assert.match(markup,/en-choice-card/);assert.match(markup,/aria-pressed="true"/);assert.match(markup,/Remove Ada/);assert.doesNotMatch(markup,/en-selection-ssr:/);
});
test('workflow components render usable structure without browser globals',async()=>{
 const markup=await renderToString(html`<en-range-slider label="Price" value="[20,80]"></en-range-slider><en-chart label="Data" .data=${[{key:'a',label:'Alpha',value:4}]}></en-chart><en-questionnaire .questions=${[{id:'a',label:'Name'}]}></en-questionnaire><en-query-builder .fields=${[{value:'name',label:'Name'}]}></en-query-builder><en-transcript .messages=${[{id:'1',author:'Ada',text:'Hello'}]}></en-transcript><en-sheet label="Details"></en-sheet><en-action-overflow .items=${[{value:'save',label:'Save'}]}></en-action-overflow>`);
 assert.match(markup,/aria-valuenow="20"/);assert.match(markup,/<table/);assert.match(markup,/Alpha/);assert.match(markup,/Hello/);assert.match(markup,/Add condition/);
});
