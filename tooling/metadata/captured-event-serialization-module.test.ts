import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {portableConstructorProofs} from './portable-constructor-proofs.ts';
import {code,fixture,row} from './captured-event-serialization-fixture.ts';

test('captured serialization refuses an undocumented factory emission before it can disappear from final facets',async()=>{
 const source=code.replace('=>object','=>EventTarget').replace('export class Base {','export class Base extends EventTarget {').replace('/** @fires {CustomEvent<{value:InstanceType<T>}>} changed */','').replace('class extends Parent{}',
  'class extends Parent{send(){this.dispatchEvent(new CustomEvent("changed"));}}');
 await fixture({'main.ts':source},f=>assert.throws(f.serialize,/no complete supported source contract/));
});

test('captured serialization binds an imported module event to the exact mixed consumer facet',async()=>{
 const results:any[]=[];
 for(let i=0;i<2;i++)await fixture({
  'types.ts':'export interface Detail {value:string}',
  'main.ts':'/** @fires {CustomEvent<import("./types.js").Detail>} changed */\nexport class Base {}export function M<T extends new(...args:any[])=>object>(Parent:T){return class extends Parent{};}',
  'nested/consumer.ts':'import {M,Base} from "../main.js";export class Leaf extends M(Base){}'
 },f=>{
  const result=f.serialize(),event=row(result,'Leaf','nested/consumer.ts').events[0],proof=result.proofs.facets.find((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
  assert.equal(event.type.text,'CustomEvent<import("../types.js").Detail>');assert.equal(proof.eventContract.detail,'import("../types.js").Detail');assert.equal(proof.step,0);assert.equal(proof.eventDispatch,undefined);assert.equal(proof.eventVisibility.scope,'module-event-visibility');
  results.push({manifest:result.manifest,proofs:portableConstructorProofs(f.program,f.sources,f.root,result.proofs)});
 });
 assert.deepEqual(results[0],results[1]);
});
test('captured serialization keeps module source visibility checks even when a factory shadows the event',async()=>{
 const source=code.replace('export class Base {id=1;}','type Hidden=string;\n/** @fires {CustomEvent<Hidden>} changed */\nexport class Base {id=1;}');
 await fixture({'main.ts':source},f=>{
  const owner=f.sources[0].statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Base');assert.equal(ts.getJSDocTags(owner).filter((tag:any)=>tag.tagName.text==='fires').length,1);
  assert.throws(f.serialize,/unexported type/);
 });
});
