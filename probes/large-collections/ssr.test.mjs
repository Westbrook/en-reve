import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const {html}=await import('lit');
const {renderToString}=await import('../../packages/ssr/dist/index.js');
await import('@en-reve/elements/define/activity-feed.js');
await import('@en-reve/elements/define/carousel.js');

const activities=Array.from({length:1000},(_,i)=>({key:`activity-${i}`,author:'Mira',text:`Update ${i}`,group:`Day ${Math.floor(i/20)}`}));
const slides=Array.from({length:1000},(_,i)=>({key:`slide-${i}`,label:`Study ${i}`}));
const activityBody=record=>html`<p data-ssr-record>${record.key}</p>`;
const slideBody=record=>html`<p data-ssr-record>${record.key}</p>`;
const count=markup=>(markup.match(/data-ssr-record/g)??[]).length;

test('data history has a deterministic bounded initial window and full reading page without browser hooks',async()=>{
 const virtual=await renderToString(html`<en-activity-feed mode="virtual" .items=${activities} .renderItem=${activityBody}></en-activity-feed>`);
 assert.ok(count(virtual)>0&&count(virtual)<30);assert.match(virtual,/activity-0/);assert.doesNotMatch(virtual,/activity-999/);
 const paged=await renderToString(html`<en-activity-feed mode="paged" page="3" page-size="10" .items=${activities} .renderItem=${activityBody}></en-activity-feed>`);
 assert.equal(count(paged),10);assert.match(paged,/activity-20/);assert.match(paged,/activity-29/);assert.doesNotMatch(paged,/activity-30/);
});
test('data carousel bounds its server slides and renders a complete reading page',async()=>{
 const window=await renderToString(html`<en-carousel .items=${slides} .renderItem=${slideBody}></en-carousel>`);
 assert.ok(count(window)>0&&count(window)<30);assert.match(window,/slide-0/);assert.doesNotMatch(window,/slide-999/);
 const reading=await renderToString(html`<en-carousel reading-mode="list" page-size="12" .items=${slides} .renderItem=${slideBody}></en-carousel>`);
 assert.equal(count(reading),12);assert.match(reading,/<ol/);assert.match(reading,/slide-11/);assert.doesNotMatch(reading,/slide-12/);
 const clamped=await renderToString(html`<en-carousel .items=${slides.slice(0,2)} .index=${5000} .renderItem=${slideBody}></en-carousel>`);
 assert.equal(count(clamped),1);assert.match(clamped,/slide-1/);
});
test('empty data does not leak a previous request and authored fallback stays available',async()=>{
 const output=await Promise.all([
  renderToString(html`<en-activity-feed .items=${activities.slice(0,2)} .renderItem=${activityBody}></en-activity-feed>`),
  renderToString(html`<en-activity-feed .items=${[]} .renderItem=${activityBody}></en-activity-feed>`),
  renderToString(html`<en-carousel .items=${slides.slice(0,2)} .renderItem=${slideBody}></en-carousel>`),
  renderToString(html`<en-carousel .items=${[]} .renderItem=${slideBody}></en-carousel>`),
 ]);
 assert.deepEqual(output.map(count),[2,0,2,0]);
 const authored=await renderToString(html`<en-activity-feed><en-activity-item author="Alex">Authored history</en-activity-item></en-activity-feed><en-carousel><en-carousel-slide>Authored slide</en-carousel-slide></en-carousel>`);
 assert.match(authored,/Authored history/);assert.match(authored,/Authored slide/);
});
