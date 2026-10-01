import assert from 'node:assert/strict';
import test from 'node:test';
import {ts} from './compiler-api.mjs';
import {extractConstructorOrigins} from './candidate-origin-extraction.ts';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';
import {code,fixture,row} from './captured-event-serialization-fixture.ts';

test('captured event serialization keeps own generic templates distinct from exact surviving occurrence contracts',async()=>fixture({'main.ts':code},f=>{
 const result=f.serialize(),own=row(result,'M').events[0],effective=row(result,'Leaf').events[0];
 assert.match(own.type.text,/InstanceType<T>/);assert.match(effective.type.text,/InstanceType<typeof Base>/);
 const proofs=result.proofs.facets.filter((proof:any)=>proof.facet==='events');
 assert.equal(proofs.find((proof:any)=>proof.declaration==='M').eventContract,undefined);
 const proof=proofs.find((proof:any)=>proof.declaration==='Leaf');assert.equal(proof.step,1);assert.equal(proof.eventContract.type,effective.type.text);assert.match(proof.eventContract.detail,/value:/);
 assert.equal(result.validate().constructorFacets,result.proofs.facets.length);
}));

test('captured event serialization retains own hidden source failures even when a later public event shadows them',async()=>{
 const source=code.replace('export function M','type Hidden=string;export function M').replace('CustomEvent<{value:InstanceType<T>}>','CustomEvent<Hidden>').replace('export class Leaf extends M(Base){}',`
/** @fires {CustomEvent<string>} changed */\nexport class Leaf extends M(Base){}`);
 await fixture({'main.ts':source},f=>assert.throws(f.serialize,/unexported type/));
});

test('captured event serialization requires exact extraction/capture identities and original mutation guards',async()=>fixture({'main.ts':code},f=>{
 assert.throws(()=>extractConstructorOrigins(f.program,f.sources,f.root,f.roots,false,undefined,{...f.capture}),/exact explicit event capture/);
 const extraction=f.extract();assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,{...extraction}),/exact owned extraction inputs/);
 const result=f.serialize(),callable=f.sources[0].statements.find((node:any)=>ts.isFunctionDeclaration(node));callable.name.escapedText='Changed';assert.throws(result.validate,/changed/);
}));
