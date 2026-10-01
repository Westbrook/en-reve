import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics,checkCapturedOccurrenceAnnotationScope,capturedOccurrenceAnnotationSemantics} from './captured-annotation-scope.ts';
import {checkCapturedFactoryEventDispatch,assertCapturedFactoryEventDispatch} from './captured-factory-event-dispatch.ts';
import {factory,fixture,event,valid} from './captured-factory-event-fixtures.ts';

test('destructured and mutated object aliases cannot hide assertion-backed payloads',async()=>{
 for(const [type,body] of [
  ['CustomEvent<{action:"choose";data:string}>','send(value:unknown){const asserted=value as string;const {data}={data:asserted};dispatchAction(this,{action:"choose",data});}'],
  ['CustomEvent<{action:"choose";data:{value:string}}>','send(value:unknown){const box={value:"safe"};box.value=value as string;dispatchAction(this,{action:"choose",data:box});}'],
  ['CustomEvent<{action:"choose";data:{value:string}}>','send(value:any){const box={value:"safe"};box.value=value;dispatchAction(this,{action:"choose",data:box});}']])
  await fixture(factory(type,body),f=>assert.throws(f.check,/payload assertion|flow adapter|unchecked any/));
});

test('callable payloads with unchecked parameter types require a signature adapter',async()=>fixture(
 factory('CustomEvent<{action:"choose";data:Callback}>','send(data:(value:any)=>string){dispatchAction(this,{action:"choose",data});}','type Callback=(value:string)=>string;'),f=>{
  assert.equal(checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag).typeSemanticsChecked,true);
  assert.throws(f.check,/signature adapter/);
 }));


test('element-access helper calls require explicit coverage and cannot vanish',async()=>fixture(
 factory(event,'send(value:InstanceType<T>){Events["dispatchAction"](this,{action:"choose",data:value});}'),f=>assert.throws(f.check,/helper aliases or escapes/)));

test('shorthand values retain variable provenance rather than the object property symbol',async()=>{
 const type='CustomEvent<{action:"choose";data:string}>';
 await fixture(factory(type,'send(value:any){const data:string=value;dispatchAction(this,{action:"choose",data});}'),f=>assert.throws(f.check,/unchecked any/));
 await fixture(factory(type,'send(data:string){dispatchAction(this,{action:"choose",data});}'),f=>assert.equal(f.check().receipt.checkedCalls.length,1));
});


test('parameter defaults require checked initializer types and retain valid typed defaults',async()=>{
 const type='CustomEvent<{action:"choose";data:string}>';
 await fixture(factory(type,'send(value:any,data:string=value){dispatchAction(this,{action:"choose",data});}'),f=>assert.throws(f.check,/unchecked any/));
 await fixture(factory(type,'send(value:string,data:string=value){dispatchAction(this,{action:"choose",data});}'),f=>assert.equal(f.check().receipt.checkedCalls.length,1));
});

test('definite-assignment declarations cannot replace an initialized immutable payload proof',async()=>fixture(
 factory('CustomEvent<{action:"choose";data:string}>','send(){let data!:string;dispatchAction(this,{action:"choose",data});}'),f=>assert.throws(f.check,/uninitialized payload aliases/)));


test('indexed stored payload values cannot bypass property provenance',async()=>fixture(
 factory('CustomEvent<{action:"choose";data:string}>','data:string=unsafe;send(){dispatchAction(this,{action:"choose",data:this["data"]});}','const unsafe:any=1;'),f=>assert.throws(f.check,/Indexed payload values/)));
