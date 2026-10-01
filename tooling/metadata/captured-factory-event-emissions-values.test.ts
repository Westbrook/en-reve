import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedFactoryEventEmissions,assertCapturedFactoryEventEmissions} from './captured-factory-event-dispatch.ts';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics} from './captured-annotation-scope.ts';
import {factory,fixture,event} from './captured-factory-event-fixtures.ts';
const direct='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("en-action",{detail:{action:"choose" as const,data:value}}));}';
const typed='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent<{action:"choose";data:InstanceType<T>}>("en-action",{detail:{action:"choose",data:value}}));}';
const check=(f:any,helpers=false)=>checkCapturedFactoryEventEmissions(f.program,f.callable,f.owner,f.tag,helpers?f.helperSource:undefined);

test('factory direct emission preserves unions while checking every runtime detail variant',async()=>{
 await fixture(factory('CustomEvent<string|number>','send(value:string|number){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
 await fixture(factory('CustomEvent<string>','send(value:string|number){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}'),f=>assert.throws(()=>check(f),/disagrees/));
});
test('factory direct emission refuses nested function receivers while isolating nested class decoys',async()=>{
 await fixture(factory('CustomEvent<null>','send(){function later(this:EventTarget){this.dispatchEvent(new CustomEvent("en-action"));}later.call(this);}'),f=>assert.throws(()=>check(f),/non-owned callable/));
 await fixture(factory('CustomEvent<null>','send(){class Other extends EventTarget{run(){this.dispatchEvent(new CustomEvent("other"));}}this.dispatchEvent(new CustomEvent("en-action"));}'),f=>assert.equal(check(f).receipt.allOwnDispatches.length,1));
});
test('factory direct emission refuses nested prototype setters before structural assignability',async()=>fixture(factory('CustomEvent<{box:{__proto__:number}}>','send(){this.dispatchEvent(new CustomEvent("en-action",{detail:{box:{__proto__:1}}}));}'),f=>assert.throws(()=>check(f),/prototype setter/)));
