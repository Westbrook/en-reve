import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedFactoryEventEmissions,assertCapturedFactoryEventEmissions} from './captured-factory-event-dispatch.ts';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics} from './captured-annotation-scope.ts';
import {factory,fixture,event} from './captured-factory-event-fixtures.ts';
const direct='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("en-action",{detail:{action:"choose" as const,data:value}}));}';
const typed='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent<{action:"choose";data:InstanceType<T>}>("en-action",{detail:{action:"choose",data:value}}));}';
const check=(f:any,helpers=false)=>checkCapturedFactoryEventEmissions(f.program,f.callable,f.owner,f.tag,helpers?f.helperSource:undefined);

test('factory direct emission preserves other event names for coverage reconciliation',async()=>fixture(factory('CustomEvent<null>','send(){this.dispatchEvent(new CustomEvent("other"));}'),f=>{
 const result=check(f);assert.equal(result.receipt.checkedCalls.length,0);assert.deepEqual(result.receipt.allOwnDispatches.map((x:any)=>x.eventName),['other']);
}));
test('factory direct emission refuses forged certificates and changed original AST',async()=>fixture(factory(event,typed),f=>{
 const result=check(f);assert.throws(()=>assertCapturedFactoryEventEmissions({...result},f.program,f.callable,f.owner,f.tag),/Unknown factory emission/);
 f.callable.name.escapedText='Changed';assert.throws(result.assertOriginal,/changed/);
}));


test('factory direct emission applies CustomEvent undefined defaults before comparison',async()=>{
 await fixture(factory('CustomEvent<null>','send(){this.dispatchEvent(new CustomEvent("en-action",{detail:undefined}));}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
 await fixture(factory('CustomEvent<undefined>','send(){this.dispatchEvent(new CustomEvent("en-action",{detail:undefined}));}'),f=>assert.throws(()=>check(f),/disagrees/));
 await fixture(factory('CustomEvent<string|null>','send(value:string|undefined){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
});
