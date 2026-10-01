import test from 'node:test';
import assert from 'node:assert/strict';
import {createScopedRenderer,renderIslandMarkup,serializeHydrationManifest} from '../dist/scoped.js';
const entries={one:{module:new URL('./scoped-fixtures/one.mjs',import.meta.url),version:'one'},two:{module:new URL('./scoped-fixtures/two.mjs',import.meta.url),version:'two'}};
test('concurrent request-local versions never install definitions in the caller',async()=>{
 const previous=globalThis.customElements,renderer=createScopedRenderer(entries);
 try{const results=await Promise.all(Array.from({length:6},(_,i)=>renderer.render({key:i%2?'two':'one',snapshot:{message:`request-${i}`}})));
 for(const [i,r]of results.entries()){assert.match(r.html,new RegExp(`Version ${i%2?'two':'one'}`));assert.match(r.html,new RegExp(`request-${i}`));assert(r.tags.includes('test-scoped-message'));}
 assert.equal(globalThis.customElements,previous);assert.equal(previous?.get('test-scoped-message'),undefined);
 const island=renderIslandMarkup(results[0],'first');assert.equal((island.html.match(/shadowrootcustomelementregistry/g)||[]).length,3);assert.match(island.html,/name="draft"/);assert.equal(JSON.parse(serializeHydrationManifest(island.manifest)).version,'one');
 }finally{renderer.dispose();}
});
test('allowlist/version validation and snapshot capture',async()=>{
 const renderer=createScopedRenderer({...entries,bad:{...entries.one,version:'wrong'}},{concurrency:1});
 try{await assert.rejects(renderer.render({key:'file:///untrusted.js',snapshot:{}}),/Unknown/);await assert.rejects(renderer.render({key:'bad',snapshot:{}}),/version/);
 const snapshot={message:'before'};const promise=renderer.render({key:'one',snapshot});snapshot.message='after';assert.match((await promise).html,/before/);
 assert.throws(()=>renderIslandMarkup({html:'',key:'one',version:'one',tags:['test-scoped-message']},'" onclick="'),/Invalid/);
 }finally{renderer.dispose();}
});
test('abort, bounded queue, timeout and disposal release requests',async()=>{
 const renderer=createScopedRenderer({slow:{module:new URL('./scoped-fixtures/slow.mjs',import.meta.url),version:'one'}},{concurrency:1,maxPending:1,timeoutMs:100});
 const signal=new AbortController();const first=renderer.render({key:'slow',snapshot:{}},{signal:signal.signal});const second=renderer.render({key:'slow',snapshot:{}});const timeout=assert.rejects(second,/timed out/);
 await assert.rejects(renderer.render({key:'slow',snapshot:{}}),/queue is full/);signal.abort();await assert.rejects(first,{name:'AbortError'});await timeout;renderer.dispose();await assert.rejects(renderer.render({key:'slow',snapshot:{}}),/disposed/);
});
