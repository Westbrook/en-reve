import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDefinitionLoader} from '../../packages/elements/dist/lazy-loader.js';
const registry = () => { const values = new Map(), calls = []; return {values, calls, get: tag=>values.get(tag), define(tag,ctor){calls.push(tag);values.set(tag,ctor);}}; };
const def = (tagName, dependencies=[]) => ({tagName,elementClass:class {},dependencies});
test('imports are shared across scopes; closures register dependency-first once per scope', async () => {
 const child=def('en-child'), parent=def('en-parent',[child]);let count=0;
 const manifest={'en-parent':async()=>{count++;return parent;}};
 const a=registry(),b=registry(),one=createDefinitionLoader(a,manifest),two=createDefinitionLoader(b,manifest);
 const p=one.ensure(['en-parent']);assert.equal(p,one.ensure(['en-parent','en-parent']));
 await Promise.all([p,two.ensure(['en-parent']),createDefinitionLoader(a,manifest).ensure(['en-parent'])]);
 assert.equal(count,1);assert.deepEqual(a.calls,['en-child','en-parent']);assert.deepEqual(b.calls,a.calls);
});
test('unknown names validate the entire request before importing; load never registers',async()=>{
 let count=0;const r=registry(),loader=createDefinitionLoader(r,{'en-a':async()=>{count++;return def('en-a');}});
 await assert.rejects(loader.ensure(['en-a','__proto__']),{stage:'lookup'});assert.equal(count,0);
 await loader.load(['en-a']);assert.equal(count,1);assert.deepEqual(r.calls,[]);
});
test('failed imports are cached until explicit retry; no partial registrations on failed imports',async()=>{
 let calls=0;const r=registry(),loader=createDefinitionLoader(r,{'en-a':async()=>def('en-a'),'en-b':async()=>{if(++calls===1)throw Error('offline');return def('en-b');}});
 await assert.rejects(loader.ensure(['en-a','en-b']),{stage:'load'});assert.deepEqual(r.calls,[]);
 await assert.rejects(loader.ensure(['en-b']),{stage:'load'});assert.equal(calls,1);
 await loader.ensure(['en-a','en-b'],{retry:true});assert.equal(calls,2);assert.deepEqual(r.calls,['en-a','en-b']);
});
test('all conflicts are preflighted; registration failures are not retried or rolled back',async()=>{
 const r=registry(),a=def('en-a'),b=def('en-b');r.values.set('en-b',class {});
 const loader=createDefinitionLoader(r,{'en-a':async()=>a,'en-b':async()=>b});
 await assert.rejects(loader.ensure(['en-a','en-b']),{stage:'registration'});assert.deepEqual(r.calls,[]);
 r.values.delete('en-b');await assert.rejects(loader.ensure(['en-a','en-b'],{retry:true}),{stage:'registration'});
 let calls=0;const broken={get:()=>undefined,define(){if(++calls===2)throw Error('native failure');}};
 const native=createDefinitionLoader(broken,{'en-b':async()=>def('en-b',[a])});
 await assert.rejects(native.ensure(['en-b']),{stage:'registration'});await assert.rejects(native.ensure(['en-b'],{retry:true}),{stage:'registration'});assert.equal(calls,2);
});
test('mismatched manifests reject as load errors',async()=>{
 await assert.rejects(createDefinitionLoader(registry(),{'en-a':async()=>def('en-b')}).ensure(['en-a']),{stage:'load'});
});
test('convenience manifest imports in Node with no DOM or global registration',async()=>{
 assert.equal(globalThis.customElements,undefined);const {elementLoaders,createElementLoader}=await import('../../packages/elements/dist/lazy.js');
 assert.equal(Object.keys(elementLoaders).length,96);assert.equal(typeof createElementLoader,'function');assert.equal(globalThis.customElements,undefined);
});
