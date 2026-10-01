import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedFactoryEventEmissions,assertCapturedFactoryEventEmissions} from './captured-factory-event-dispatch.ts';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics} from './captured-annotation-scope.ts';
import {factory,fixture,event} from './captured-factory-event-fixtures.ts';
const direct='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("en-action",{detail:{action:"choose" as const,data:value}}));}';
const typed='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent<{action:"choose";data:InstanceType<T>}>("en-action",{detail:{action:"choose",data:value}}));}';
const check=(f:any,helpers=false)=>checkCapturedFactoryEventEmissions(f.program,f.callable,f.owner,f.tag,helpers?f.helperSource:undefined);

test('factory direct emission recursively checks generic parameter constraints',async()=>{
 await fixture(factory('CustomEvent<{value:number}>','send<U extends {value:any}>(value:U){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}'),f=>assert.throws(()=>check(f),/unchecked any/));
 await fixture(factory('CustomEvent<{value:number}>','send<U extends {value:number}>(value:U){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
});


test('factory direct emission checks deferred indexed-access constraints before assignability',async()=>{
 await fixture(factory('CustomEvent<{value:number}>',"send<U extends {value:any}>(value:U['value']){this.dispatchEvent(new CustomEvent('en-action',{detail:value}));}"),f=>{
  const annotation=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(annotation,f.program,f.callable,f.owner,f.tag);
  const method=semantic.probe.mapReplayNode(f.owner.members[0]),type=semantic.checker.getTypeAtLocation(method.parameters[0]);
  assert.ok(type.flags&ts.TypeFlags.IndexedAccess);assert.ok(semantic.checker.getBaseConstraintOfType(type).flags&ts.TypeFlags.Any);
  assert.throws(()=>check(f),/unchecked any/);
 });
 await fixture(factory('CustomEvent<number>',"send<U extends {value:number}>(value:U['value']){this.dispatchEvent(new CustomEvent('en-action',{detail:value}));}"),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
});
test('factory direct emission admits captured platform types but rejects authored unchecked fields on their subclasses',async()=>{
 await fixture(factory('CustomEvent<URL>','send(value:URL){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
 await fixture(factory('CustomEvent<URL>','send(value:Unsafe){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}','class Unsafe extends URL {leak:any;}'),f=>assert.throws(()=>check(f),/unchecked any/));
});
