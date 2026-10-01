import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics,checkCapturedOccurrenceAnnotationScope,capturedOccurrenceAnnotationSemantics} from './captured-annotation-scope.ts';
import {checkCapturedFactoryEventDispatch,assertCapturedFactoryEventDispatch} from './captured-factory-event-dispatch.ts';
import {factory,fixture,event,valid} from './captured-factory-event-fixtures.ts';

test('factory tag semantics retain the original body binder and same-spelled module alias separation',async()=>fixture(factory(event,valid),f=>{
 const proof=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(proof,f.program,f.callable,f.owner,f.tag);
 const reference=semantic.typeNode.typeArguments[0].members[1].type.typeArguments[0];
 assert.equal(semantic.probe.mapOriginalSymbol(semantic.checker.getSymbolAtLocation(reference.typeName))===f.program.getTypeChecker().getSymbolAtLocation(f.callable.typeParameters[0].name),true);
 assert.equal(proof.receipt.scope,'original-factory-body-tag-lexical-correspondence');assert.equal(proof.publicVisibilityChecked,false);
 assert.throws(()=>capturedFactoryAnnotationSemantics({...proof},f.program,f.callable,f.owner,f.tag),/Unknown factory/);
}));

test('generic dispatch checks payload expressions against their original lexical event detail',async()=>fixture(factory(event,valid),f=>{
 const result=f.check();assert.equal(result.receipt.checkedCalls.length,1);assert.equal(result.receipt.checkedCalls[0].helper,'dispatchAction');
 assert.deepEqual(result.receipt.checkedCalls[0].fields,['action','data']);assert.equal(result.receipt.helperPackagePolicyBound,false);assert.equal(result.receipt.finalOccurrenceQualified,false);
 assert.equal(assertCapturedFactoryEventDispatch(result,f.program,f.callable,f.owner,f.tag,f.helperSource),true);
}));

test('generic dispatch rejects a wrong payload while retaining TypeScript-valid helper calls',async()=>fixture(factory(event,'send(value:number){dispatchAction(this,{action:"choose",data:value});}'),f=>assert.throws(f.check,/Generic emitted payload disagrees/)));

test('generic dispatch rejects unchecked payload any and assertion-based substitutions',async()=>{
 for(const body of ['send(value:any){dispatchAction(this,{action:"choose",data:value});}','send(value:unknown){dispatchAction(this,{action:"choose",data:value as InstanceType<T>});}'])
  await fixture(factory(event,body),f=>assert.throws(f.check,/unchecked any|payload assertion/));
});

test('generic dispatch checks required fields and explicit extraDetail with authoritative overwritten change keys',async()=>{
 const type='CustomEvent<{previous:InstanceType<T>;proposed:InstanceType<T>;reason:"edit";extra:number}>';
 await fixture(factory(type,'send(value:InstanceType<T>){dispatchChange(this,{previous:value,proposed:value,reason:"edit"},{eventName:"en-action",extraDetail:{extra:1,previous:"ignored"}});}'),f=>assert.equal(f.check().receipt.checkedCalls.length,1));
 await fixture(factory(type,'send(value:InstanceType<T>){dispatchChange(this,{previous:value,proposed:value,reason:"edit"},{eventName:"en-action"});}'),f=>assert.throws(f.check,/Generic emitted payload disagrees/));
});

test('same-named unrelated helper functions receive no dispatch proof',async()=>fixture(factory(event,'send(value:number){function dispatchAction(target:EventTarget,payload:object){}dispatchAction(this,{action:"choose",data:value});}'),f=>{
 const result=f.check();assert.equal(result.receipt.checkedCalls.length,0);assert.equal(result.receipt.allOwnDispatches.length,0);
}));

test('generic dispatch refuses dynamic event names and non-own receivers',async()=>{
 await fixture(factory(event,'send(value:InstanceType<T>,name:string){dispatchChange(this,{previous:value,proposed:value,reason:"edit"},{eventName:name});}'),f=>assert.throws(f.check,/Dynamic dispatch event name/));
 await fixture(factory(event,'send(value:InstanceType<T>,other:EventTarget){dispatchAction(other,{action:"choose",data:value});}'),f=>assert.throws(f.check,/direct owned this/));
});

test('factory event detail must be a typed platform event with a non-any detail',async()=>{
 for(const type of ['CustomEvent<any>','CustomEvent<unknown>','{detail:{action:"choose";data:InstanceType<T>}}'])await fixture(factory(type,valid),f=>assert.throws(f.check,/typed platform CustomEvent|detail must be checked/));
});
