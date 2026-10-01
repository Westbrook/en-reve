import test from 'node:test';
import assert from 'node:assert/strict';
import { LifecycleReceipts } from '../src/lifecycle-receipt.mjs';
const before = { documentId:'correct', timestamp:10, vitals:{LCP:{name:'LCP',value:25,delta:25,id:'metric-1'}}, milestones:{load:4} };
const valid = { ...before, timestamp:12, visibility:'hidden', protocol:'ack-v1', terminal:true };
test('acknowledges delayed correct payload, ignores wrong-document/incomplete/old payloads and duplicates', async () => {
 const broker = new LifecycleReceipts();const receipt=broker.expect(before,200);
 for(const payload of [{...valid,protocol:'fixed-wait-v1'}, {...valid,terminal:false}, {...valid,vitals:{LCP:{name:'LCP',value:null}}}, {...valid,documentId:'wrong'}, {...valid,timestamp:9}, {...valid,visibility:'visible'}, {...valid,vitals:{}}, {...valid,milestones:null}, {...valid,milestones:{load:null}}, {...valid,milestones:{load:5}}]) assert.equal(broker.deliver(payload),false);
 setTimeout(()=>broker.deliver(valid),20);
 assert.deepEqual(await receipt.promise,valid);assert.equal(broker.deliver(valid),false);assert.equal(broker.pending,0);
});
test('bounded missing delivery, duplicate expectations and navigation cancellation release ownership', async () => {
 const broker=new LifecycleReceipts();const missing=broker.expect(before,10);
 assert.throws(()=>broker.expect(before),/duplicate/);await assert.rejects(missing.promise,/Missing valid/);assert.equal(broker.pending,0);
 const canceled=broker.expect(before);canceled.cancel();await assert.rejects(canceled.promise,/canceled/);assert.equal(broker.pending,0);
});


test('expectation owns an immutable snapshot and completed cancellation cannot remove a later waiter', async()=>{
 const broker=new LifecycleReceipts(),snapshot=structuredClone(before),first=broker.expect(snapshot);
 snapshot.milestones.load=500;
 assert.equal(broker.deliver(valid),true);await first.promise;
 const second=broker.expect(before);first.cancel();assert.equal(broker.pending,1);
 assert.equal(broker.deliver(valid),true);await second.promise;assert.equal(broker.pending,0);
});
