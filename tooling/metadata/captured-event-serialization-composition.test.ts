import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';
import {portableConstructorProofs} from './portable-constructor-proofs.ts';
import {code,fixture,row} from './captured-event-serialization-fixture.ts';

test('captured event proofs remain portable across relocated source roots',async()=>{
 const results:any[]=[];
 const source=code.replace('=>object','=>EventTarget').replace('export class Base {','export class Base extends EventTarget {').replace('class extends Parent{}','class extends Parent{send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("changed",{detail:{value}}));}}');
 for(let i=0;i<2;i++)await fixture({'main.ts':source},f=>{
  const extraction=f.extract(),own=extraction.internal.modules[0].declarations.find((entry:any)=>entry.name==='M').events[0];assert.equal(typeof own.detail,'string','precondition: owning direct detector contributes detail');
  const result=serializeConstructorComposition(f.program,f.sources,f.roots,extraction),proof=result.proofs.facets.find((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
  assert.equal(proof.eventDispatch.emissions.length,1);assert.equal(row(result,'Leaf').events[0].detail.text,proof.eventContract.detail);assert.equal(row(result,'M').events[0].detail.text,`(${row(result,'M').events[0].type.text})["detail"]`);
  assert.ok(result.proofs.types.some((entry:any)=>entry.kind==='captured-event-contract-field'&&entry.field==='detail'));
  results.push({manifest:result.manifest,proofs:portableConstructorProofs(f.program,f.sources,f.root,result.proofs)});
 });
 assert.deepEqual(results[0],results[1]);
});


test('captured event serialization binds the last exact repeated factory occurrence',async()=>fixture({'main.ts':code.replace('extends M(Base)','extends M(M(Base))')},f=>{
 const result=f.serialize(),proof=result.proofs.facets.find((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
 assert.equal(proof.step,2);assert.equal(proof.eventContract.type,row(result,'Leaf').events[0].type.text);assert.equal(proof.contexts.length,0);
 assert.equal(result.validate().constructorFacets,result.proofs.facets.length);
}));

test('captured event serialization retains final private suppression while validating the original public source',async()=>{
 const source=code.replace('export class Leaf extends M(Base){}',`
/** @internalEvent changed */
export class Leaf extends M(Base){}`);
 await fixture({'main.ts':source},f=>{const result=f.serialize(),leaf=row(result,'Leaf');assert.equal(leaf.events[0].privacy,'private');assert.equal(row(result,'M').events[0].privacy,undefined);assert.equal(result.validate().constructorFacets,result.proofs.facets.length);});
});
