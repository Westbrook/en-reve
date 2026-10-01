import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedFactoryEventEmissions,assertCapturedFactoryEventEmissions} from './captured-factory-event-dispatch.ts';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics} from './captured-annotation-scope.ts';
import {factory,fixture,event} from './captured-factory-event-fixtures.ts';
const direct='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("en-action",{detail:{action:"choose" as const,data:value}}));}';
const typed='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent<{action:"choose";data:InstanceType<T>}>("en-action",{detail:{action:"choose",data:value}}));}';
const check=(f:any,helpers=false)=>checkCapturedFactoryEventEmissions(f.program,f.callable,f.owner,f.tag,helpers?f.helperSource:undefined);

test('factory direct emission binds platform constructor and generic detail in the same replay checker',async()=>fixture(factory(event,typed),f=>{
 const annotation=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(annotation,f.program,f.callable,f.owner,f.tag);
 const parameter=semantic.probe.mapReplayNode(f.owner.members[0]).parameters[0],type=semantic.checker.getTypeAtLocation(parameter);
 assert.ok(type.flags&ts.TypeFlags.Conditional);assert.equal(type.aliasSymbol.name,'InstanceType');assert.equal(type.aliasTypeArguments.length,1);
 assert.equal(type.aliasTypeArguments[0]===semantic.checker.getTypeAtLocation(semantic.probe.mapReplayNode(f.callable.typeParameters[0])),true);
 assert.ok(semantic.checker.getBaseConstraintOfType(type));
 const result=check(f);assert.equal(result.receipt.checkedCalls.length,1);assert.equal(result.receipt.allOwnDispatches.length,1);assert.equal(result.receipt.directPlatformDispatchChecked,true);assert.equal(result.receipt.helperModule,null);
}));
test('factory direct emission rejects mismatched generic payload and unchecked assertions',async()=>{
 await fixture(factory(event,typed.replace('data:InstanceType<T>','data:number').replace('data:value','data:1')),f=>assert.throws(()=>check(f),/disagrees/));
 await fixture(factory(event,direct),f=>assert.throws(()=>check(f),/payload assertion/));
});
test('factory direct emission accounts for both helper and platform calls without replacing helper obligations',async()=>fixture(factory(event,typed.replace('this.dispatchEvent','Events.dispatchAction(this,{action:"choose",data:value});this.dispatchEvent')),f=>{
 assert.throws(()=>check(f),/authorized source binding/);const result=check(f,true);assert.equal(result.receipt.checkedCalls.length,2);assert.deepEqual(result.receipt.allOwnDispatches.map((x:any)=>x.helper),['dispatchAction','platform-CustomEvent']);
}));
