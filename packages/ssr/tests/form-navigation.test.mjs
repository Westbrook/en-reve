import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
const { html } = await import('lit');
const { renderToString } = await import('../dist/index.js');
await import('@en-reve/elements/define/progress-steps.js');
await import('@en-reve/elements/define/validation-summary.js');
function all(root, predicate) {
 const found=[]; function walk(node) { if(predicate(node))found.push(node); for(const child of node.childNodes??[])walk(child);if(node.content)walk(node.content); } walk(root);return found;
}
const attr=(node,name)=>node.attrs?.find(item=>item.name===name)?.value;
const text=node=>node.nodeName==='#text'?node.value:(node.childNodes??[]).map(text).join('');
test('SSR emits error text, native links and a named focusable region without a live-region duplicate',async()=>{
 const markup=await renderToString(html`<en-validation-summary .items=${[{target:'project field',message:'Enter <project> & try again.'}]}><span slot="heading">Check the project</span></en-validation-summary>`);
 const dom=parseFragment(markup);const region=all(dom,n=>n.tagName==='section')[0];
 assert.equal(attr(region,'tabindex'),'-1');assert.equal(attr(region,'aria-labelledby'),'summary-heading');assert.equal(attr(region,'role'),undefined);
 const link=all(dom,n=>n.tagName==='a')[0];assert.equal(attr(link,'href'),'#project%20field');assert.equal(text(link),'Enter <project> & try again.');
 assert.ok(all(dom,n=>n.tagName==='style').length);assert.equal(all(dom,n=>n.tagName==='project').length,0);
 const empty=parseFragment(await renderToString(html`<en-validation-summary></en-validation-summary>`));assert.equal(all(empty,n=>n.tagName==='section').length,0);
});
test('SSR current/completed/unavailable steps are request-local and retain label slots',async()=>{
 const items=[{value:'details',label:'Details',status:'complete'},{value:'review',label:'Review',disabled:true}];
 for(const value of ['details','review']) {
  const dom=parseFragment(await renderToString(html`<en-progress-steps .items=${items} .value=${value}><strong slot="step-details">Project details</strong></en-progress-steps>`));
  assert.equal(all(dom,n=>n.tagName==='li').length,2);assert.equal(all(dom,n=>n.tagName==='button'&&attr(n,'aria-current')==='step').length,1);
  const current=all(dom,n=>n.tagName==='button'&&attr(n,'aria-current')==='step')[0];assert.match(text(current),value==='details'?/Details/:/Review/);
  assert.equal(all(dom,n=>n.tagName==='button'&&attr(n,'disabled')!==undefined).length,1);
  assert.equal(all(dom,n=>n.tagName==='slot'&&attr(n,'name')==='step-details').length,1);
 }
});
test('child lists render rich labels and native links in the first response, ahead of arrays',async()=>{
 const markup=await renderToString(html`<en-progress-steps value="a" .items=${[{value:'fallback',label:'Fallback'}]}><en-progress-step value="a" status="complete"><strong>Authored alpha</strong></en-progress-step><en-progress-step value="b" disabled label="Beta"></en-progress-step><en-progress-step value="c" hidden>Hidden</en-progress-step></en-progress-steps><en-validation-summary .items=${[{target:'wrong',message:'Wrong'}]}><a href="#field%20one">Enter <strong>the name</strong>.</a><a href="#field%20one" hidden>Hidden issue</a></en-validation-summary>`);
 const dom=parseFragment(markup);
 assert.equal(all(dom,n=>n.tagName==='button').length,2);
 assert.equal(all(dom,n=>n.tagName==='button'&&attr(n,'disabled')!==undefined).length,1);
 assert.equal(all(dom,n=>n.tagName==='li').length,3);
 assert.equal(all(dom,n=>n.tagName==='strong'&&text(n)==='Authored alpha').length,1);
 assert.equal(all(dom,n=>n.tagName==='a').length,2);
 assert.equal(all(dom,n=>n.tagName==='a'&&attr(n,'href')==='#wrong').length,0);
 for(const host of all(dom,n=>['en-progress-steps','en-validation-summary'].includes(n.tagName))) {
  const plan=JSON.parse(attr(host,'data-en-form-children'));assert.equal(plan.version,1);
  for(const child of host.childNodes.filter(n=>['en-progress-step','a'].includes(n.tagName))) assert.match(attr(child,'slot'),/^en-form-child-ssr-/);
 }
 const summary=all(dom,n=>n.tagName==='en-validation-summary')[0];assert.equal(JSON.parse(attr(summary,'data-en-form-children')).items[0].target,'field one');
 const again=parseFragment(await renderToString(html`<en-progress-steps><en-progress-step value="only">Only</en-progress-step></en-progress-steps>`));
 assert.equal(all(again,n=>n.tagName==='button').length,1);
});
test('invalid child contracts are rejected rather than silently falling back',async()=>{
 for(const example of [
  html`<en-progress-steps><en-progress-step value="same">A</en-progress-step><en-progress-step value="same">B</en-progress-step></en-progress-steps>`,
  html`<en-progress-steps><en-progress-step value="a"><button>Nested</button></en-progress-step></en-progress-steps>`,
  html`<en-validation-summary><a href="/other">Other</a></en-validation-summary>`,
  html`<en-validation-summary><a href="#bad%">Bad encoding</a></en-validation-summary>`,
 ]) await assert.rejects(renderToString(example));
});
