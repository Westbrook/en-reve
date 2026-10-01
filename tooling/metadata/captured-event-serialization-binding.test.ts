import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';
import {code,fixture,row} from './captured-event-serialization-fixture.ts';

test('captured event serialization refuses in-place event-row edits and changed root selection',async()=>fixture({'main.ts':code},f=>{
 const extraction=f.extract(),declaration=extraction.internal.modules[0].declarations.find((entry:any)=>entry.name==='M');
 assert.throws(()=>serializeConstructorComposition(f.program,f.sources,[...f.roots].reverse(),extraction),/exact owned extraction inputs/);
 const implementation=extraction.bindings.provenanceUnits(declaration).implementation;extraction.bindings.factoryEvent(implementation,'changed');
 declaration.events[0].type='CustomEvent<number>';assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,extraction),/draft changed/);
}));

test('captured event serialization binds differently typed tags on the same factory independently',async()=>{
 const source=code.replace('/** @fires {CustomEvent<{value:InstanceType<T>}>} changed */',`/**
 * @fires {CustomEvent<{value:InstanceType<T>}>} changed
 * @fires {CustomEvent<{reason:string}>} reason
 */`);
 await fixture({'main.ts':source},f=>{
  const result=f.serialize(),events=row(result,'Leaf').events,proofs=result.proofs.facets.filter((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
  assert.deepEqual(events.map((entry:any)=>entry.name),['changed','reason']);assert.match(events[0].type.text,/InstanceType<typeof Base>/);assert.match(events[1].type.text,/reason: string/);
  assert.equal(proofs.length,2);for(const proof of proofs)assert.equal(proof.eventContract.type,events.find((entry:any)=>entry.name===proof.key).type.text);
 });
});


test('captured serialization binds owned direct emission evidence to each surviving event facet',async()=>{
 const source=code.replace('=>object','=>EventTarget').replace('export class Base {','export class Base extends EventTarget {').replace('class extends Parent{}',
  'class extends Parent{send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent("changed",{detail:{value}}));}}');
 await fixture({'main.ts':source},f=>{
  const result=f.serialize(),proof=result.proofs.facets.find((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
  assert.equal(proof.eventDispatch.emissions.length,1);assert.equal(proof.eventDispatch.emissions[0].eventName,'changed');assert.equal(proof.eventDispatch.helperPolicy,null);
  assert.equal(proof.eventContract.type,row(result,'Leaf').events[0].type.text);result.validate();
 });
});
