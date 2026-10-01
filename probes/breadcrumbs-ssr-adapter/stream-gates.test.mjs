import test from 'node:test';
import assert from 'node:assert/strict';
import { StreamGates } from './stream-gates.mjs';
test('concurrent stream release and cancellation cannot cross navigation identities', async () => {
 const gates=new StreamGates();const a=gates.create('a'),b=gates.create('b');let aDone=false;a.promise.then(()=>aDone=true);
 assert.throws(()=>gates.create('a'),/duplicate/);assert.equal(gates.release('unknown'),false);
 assert.equal(gates.release('b'),true);await b.promise;assert.equal(aDone,false);a.cancel();await a.promise;assert.equal(gates.release('a'),false);
});
