import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics,checkCapturedOccurrenceAnnotationScope,capturedOccurrenceAnnotationSemantics} from './captured-annotation-scope.ts';
import {checkCapturedFactoryEventDispatch,assertCapturedFactoryEventDispatch} from './captured-factory-event-dispatch.ts';
import {constructorHeritageGraph} from './candidate-mixin-graph.ts';
import {factory,fixture,event,valid} from './captured-factory-event-fixtures.ts';

test('factory lexical proof supports local aliases and rejects class-local annotation rebinding',async()=>{
 await fixture(factory('Local',valid,`type Local=${event};`),f=>assert.equal(f.check().receipt.checkedCalls.length,1));
 await fixture(factory(event,valid),f=>assert.throws(()=>checkCapturedFactoryAnnotationScope(f.program,{},f.owner,f.tag),/exact nearest enclosing callable/));
});

test('dispatch proof refuses foreign identities and detects original source AST mutation',async()=>fixture(factory(event,valid),f=>{
 const result=f.check();assert.throws(()=>assertCapturedFactoryEventDispatch({...result},f.program,f.callable,f.owner,f.tag,f.helperSource),/Unknown factory/);
 assert.throws(()=>checkCapturedFactoryEventDispatch(f.program,f.callable,f.owner,f.tag,{}),/exact original source/);
 f.callable.name.escapedText='Changed';assert.throws(()=>result.assertOriginal(),/parsed structure changed/);
}));

test('occurrence semantic accessor returns the instantiated event return type and keeps exact root-step authority',async()=>fixture(factory(event,valid),f=>{
 const graph=constructorHeritageGraph(f.program,[f.source,f.helperSource],(source:any)=>source.fileName,[f.leaf]);
 assert.deepEqual(graph.compositionFor(graph.classes.get(f.leaf)).map((step:any)=>step.kind),['terminal','class','application','class']);
 const proof=checkCapturedOccurrenceAnnotationScope(f.program,f.leaf,2,f.tag),semantic=capturedOccurrenceAnnotationSemantics(proof,f.program,f.leaf,2,f.tag);
 const detail=semantic.checker.getTypeOfSymbolAtLocation(semantic.type.getProperty('detail'),semantic.typeNode),data=semantic.checker.getTypeOfSymbolAtLocation(detail.getProperty('data'),semantic.typeNode);
 assert.equal(semantic.checker.typeToString(data),'Base');assert.throws(()=>capturedOccurrenceAnnotationSemantics(proof,f.program,f.leaf,1,f.tag),/Unknown occurrence/);
}));


test('generic dispatch rejects nested any and asserted local payload aliases',async()=>{
 const type='CustomEvent<{action:"choose";data:{value:string}}>';
 for(const body of ['send(value:any){dispatchAction(this,{action:"choose",data:{value}});}',
  'send(value:unknown){const data=value as {value:string};dispatchAction(this,{action:"choose",data});}'])
  await fixture(factory(type,body),f=>assert.throws(f.check,/unchecked any|payload assertion/));
});

test('payload and extraDetail prototype setters cannot satisfy emitted own fields',async()=>{
 const type='CustomEvent<{action:"choose";data:string;__proto__:object}>';
 await fixture(factory(type,'send(value:string){dispatchAction(this,{action:"choose",data:value,__proto__:{}});}'),f=>assert.throws(f.check,/prototype setter/));
 const change='CustomEvent<{previous:string;proposed:string;reason:"edit";__proto__:object}>';
 await fixture(factory(change,'send(value:string){dispatchChange(this,{previous:value,proposed:value,reason:"edit"},{eventName:"en-action",extraDetail:{__proto__:{}}});}'),f=>assert.throws(f.check,/prototype setter/));
});

test('helper value aliases destructuring and call/apply cannot disappear from coverage',async()=>{
 for(const body of ['send(value:InstanceType<T>){const fire=dispatchAction;fire(this,{action:"choose",data:value});}',
  'send(value:InstanceType<T>){const {dispatchAction:fire}=Events;fire(this,{action:"choose",data:value});}',
  'send(value:InstanceType<T>){dispatchAction.call(undefined,this,{action:"choose",data:value});}',
  'send(value:InstanceType<T>){dispatchAction.apply(undefined,[this,{action:"choose",data:value}]);}'])
  await fixture(factory(event,body),f=>assert.throws(f.check,/helper aliases or escapes/));
});

test('dispatch admission rejects forged Program getters without invoking them',()=>{
 let reads=0;const program=new Proxy({}, {get(){reads++;throw new Error('forged getter');}});
 assert.throws(()=>checkCapturedFactoryEventDispatch(program,{},{},{},{}),/captured|Captured/);assert.equal(reads,0);
});
