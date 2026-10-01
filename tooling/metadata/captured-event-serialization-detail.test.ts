import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';
import {code,fixture,row} from './captured-event-serialization-fixture.ts';

test('captured serialization binds a module reintroduction after factory suppression',async()=>{
 const source=code.replace('export class Leaf extends M(Base){}',`\n/** @internalEvent changed */\nexport class Middle extends M(Base){}\n/** @fires {CustomEvent<number>} changed */\nexport class Leaf extends Middle{}`);
 await fixture({'main.ts':source},f=>{
  const result=f.serialize(),event=row(result,'Leaf').events[0],proof=result.proofs.facets.find((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
  const middle=f.sources[0].statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Middle'),leaf=f.sources[0].statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Leaf');
  assert.equal(ts.getJSDocTags(middle).filter((tag:any)=>tag.tagName.text==='internalEvent').length,1);assert.equal(ts.getJSDocTags(leaf).filter((tag:any)=>tag.tagName.text==='fires').length,1);assert.equal(row(result,'Middle').events[0].privacy,'private');
  assert.equal(event.privacy,undefined);assert.equal(event.type.text,'CustomEvent<number>');assert.equal(proof.eventContract.detail,'number');assert.equal(proof.eventDispatch,undefined);assert.equal(result.validate().constructorFacets,result.proofs.facets.length);
 });
});

test('captured serialization preserves inferred module detail as its checked documented public contract',async()=>fixture({
 'main.ts':'export type Notice=CustomEvent<string>|CustomEvent<number>;\n/** @fires {Notice} changed */\nexport class Base extends EventTarget{send(){this.dispatchEvent(new CustomEvent("changed",{detail:1}));}}export function M<T extends new(...args:any[])=>EventTarget>(Parent:T){return class extends Parent{};}export class Leaf extends M(Base){}'
},f=>{
 const extraction=f.extract(),original=extraction.internal.modules[0].declarations.find((entry:any)=>entry.name==='Base').events[0];assert.equal(original.detail,'number');assert.equal(typeof original.parsedType,'string','precondition: owning extractor expands the alias');assert.notEqual(original.parsedType,'Notice');
 const result=serializeConstructorComposition(f.program,f.sources,f.roots,extraction),event=row(result,'Leaf').events[0],proof=result.proofs.facets.find((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
 assert.equal(event.detail.text,proof.eventContract.detail);assert.match(event.detail.text,/string/);assert.match(event.detail.text,/number/);assert.equal(event.parsedType.text,event.type.text);assert.equal(proof.eventDispatch.scope,'supported-owned-module-emissions');assert.equal(proof.eventDispatch.emissions.length,1);
}));

test('captured serialization refuses incompatible inferred module detail before contract normalization',async()=>fixture({
 'main.ts':'/** @fires {CustomEvent<string>} changed */\nexport class Base extends EventTarget{send(){this.dispatchEvent(new CustomEvent("changed",{detail:1}));}}export function M<T extends new(...args:any[])=>EventTarget>(Parent:T){return class extends Parent{};}export class Leaf extends M(Base){}'
},f=>assert.throws(f.serialize,/disagrees/)));
