import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedFactoryEventEmissions,assertCapturedFactoryEventEmissions} from './captured-factory-event-dispatch.ts';
import {ts} from './compiler-api.mjs';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics} from './captured-annotation-scope.ts';
import {factory,fixture,event} from './captured-factory-event-fixtures.ts';
const direct='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("en-action",{detail:{action:"choose" as const,data:value}}));}';
const typed='send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent<{action:"choose";data:InstanceType<T>}>("en-action",{detail:{action:"choose",data:value}}));}';
const check=(f:any,helpers=false)=>checkCapturedFactoryEventEmissions(f.program,f.callable,f.owner,f.tag,helpers?f.helperSource:undefined);

test('factory direct emission audits inherited platform generic arguments before opaque member exclusion',async()=>{
 await fixture(factory('CustomEvent<Promise<number>>','send(value:Unsafe){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}','class Unsafe extends Promise<any>{}'),f=>assert.throws(()=>check(f),/unchecked any/));
 await fixture(factory('CustomEvent<Promise<number>>','send(value:Checked){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}','class Checked extends Promise<number>{}'),f=>assert.equal(check(f).receipt.checkedCalls.length,1));
});


test('factory direct emission refuses deferred conditional any branches before reduced constraints can erase them',async()=>{
 await fixture(factory('CustomEvent<number>','send<U>(value:Maybe<U>){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}','type Maybe<U>=U extends string?any:number;'),f=>{
  const annotation=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(annotation,f.program,f.callable,f.owner,f.tag);
  const type=semantic.checker.getTypeAtLocation(semantic.probe.mapReplayNode(f.owner.members[0]).parameters[0]);assert.ok(type.flags&ts.TypeFlags.Conditional);assert.ok(semantic.checker.getBaseConstraintOfType(type).flags&ts.TypeFlags.Number);
  assert.throws(()=>check(f),/Conditional payload branches/);
 });
 await fixture(factory('CustomEvent<number>',"send<U>(value:Maybe<U>['value']){this.dispatchEvent(new CustomEvent('en-action',{detail:value}));}",'type Maybe<U>=U extends string?any:{value:number};'),f=>{
  const annotation=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(annotation,f.program,f.callable,f.owner,f.tag);
  const type=semantic.checker.getTypeAtLocation(semantic.probe.mapReplayNode(f.owner.members[0]).parameters[0]);assert.ok(type.flags&ts.TypeFlags.IndexedAccess);assert.ok(type.objectType.flags&ts.TypeFlags.Conditional);
  assert.throws(()=>check(f),/Conditional payload branches/);
 });
});


test('factory direct emission audits InstanceType constructor dependencies before constraint reduction',async()=>fixture(factory('CustomEvent<number>',
 'send<U,V extends Maybe<U>>(value:InstanceType<V>){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}',
 'type Maybe<U>=U extends string?any:new(...args:any[])=>number;'),f=>{
 const annotation=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(annotation,f.program,f.callable,f.owner,f.tag);
 const method=semantic.probe.mapReplayNode(f.owner.members[0]),value=semantic.checker.getTypeAtLocation(method.parameters[0]);
 assert.ok(value.flags&ts.TypeFlags.Conditional);assert.equal(value.aliasSymbol.name,'InstanceType');
 assert.ok(semantic.checker.getTypeFromTypeNode(method.typeParameters[1].constraint).flags&ts.TypeFlags.Conditional);
 assert.throws(()=>check(f),/Deferred InstanceType constructor/);
}));
test('factory direct emission separates exact lexical constructor capture from emitted constructor values',async()=>{
 const inspect=(f:any,name:string)=>{
  const annotation=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(annotation,f.program,f.callable,f.owner,f.tag);
  const original=f.callable.body.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text===name),replayed=semantic.probe.mapReplayNode(original);
  const parameter=semantic.checker.getTypeAtLocation(semantic.probe.mapReplayNode(f.callable.typeParameters[0])),type=semantic.checker.getTypeAtLocation(replayed.name);
  assert.equal((original.typeParameters?.length??0)===0,true);
  assert.equal(type.target.outerTypeParameters.length===1,true);
  assert.equal(type.target.outerTypeParameters[0]===parameter,true);
  assert.equal(semantic.checker.getTypeArguments(type)[0]===parameter,true);
  assert.equal(semantic.checker.getSignaturesOfType(semantic.checker.getBaseConstraintOfType(parameter),ts.SignatureKind.Construct).length>0,true);
  assert.deepEqual(f.program.getSemanticDiagnostics(f.source).map((item:any)=>ts.flattenDiagnosticMessageText(item.messageText,' ')),[]);
 };
 await fixture(factory('CustomEvent<URL>','send(value:Checked){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}','class Checked extends URL {label="ready";}'),f=>{
  inspect(f,'Checked');assert.equal(check(f).receipt.checkedCalls.length,1);
 });
 await fixture(factory('CustomEvent<object>','send(value:Stored){this.dispatchEvent(new CustomEvent("en-action",{detail:value}));}','class Stored {constructor(public value:T){}}'),f=>{
  inspect(f,'Stored');assert.throws(()=>check(f),/Callable payload types/);
 });
});
