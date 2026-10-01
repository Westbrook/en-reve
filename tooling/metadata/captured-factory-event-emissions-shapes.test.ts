import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedFactoryEventEmissions,assertCapturedFactoryEventEmissions} from './captured-factory-event-dispatch.ts';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics} from './captured-annotation-scope.ts';
import {factory,fixture,event} from './captured-factory-event-fixtures.ts';
const direct='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("en-action",{detail:{action:"choose" as const,data:value}}));}';
const typed='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent<{action:"choose";data:InstanceType<T>}>("en-action",{detail:{action:"choose",data:value}}));}';
const check=(f:any,helpers=false)=>checkCapturedFactoryEventEmissions(f.program,f.callable,f.owner,f.tag,helpers?f.helperSource:undefined);

test('factory direct emission rejects method aliases indexed calls and foreign receivers',async()=>{
 for(const body of ['send(){const send=this.dispatchEvent;send(new CustomEvent("en-action"));}',
  'send(){this["dispatchEvent"](new CustomEvent("en-action"));}',
  'send(other:EventTarget){other.dispatchEvent(new CustomEvent("en-action"));}'])
  await fixture(factory(event,body),f=>assert.throws(()=>check(f),/aliases|exact owned this/));
});
test('factory direct emission rejects indirect constructor values and dynamic names',async()=>{
 for(const body of ['send(value:CustomEvent){this.dispatchEvent(value);}',
  'send(name:string){this.dispatchEvent(new CustomEvent(name));}'])
  await fixture(factory(event,body),f=>assert.throws(()=>check(f),/immediate platform|Dynamic dispatch/));
});
test('factory direct emission binds runtime default null detail and checks explicit primitive detail',async()=>{
 await fixture(factory('CustomEvent<null>','send(){this.dispatchEvent(new CustomEvent("en-action"));}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
 await fixture(factory('CustomEvent<number>','send(value:number){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
 await fixture(factory('CustomEvent<number>','send(){this.dispatchEvent(new CustomEvent("en-action"));}'),f=>assert.throws(()=>check(f),/disagrees/));
});
