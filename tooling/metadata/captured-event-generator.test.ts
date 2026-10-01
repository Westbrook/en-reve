import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink,readdir} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {generateCandidateCem,verifyCandidateReceipt,verifyCandidateComposition} from './generate-wc-toolkit.ts';
const base=`export type Ctor=new(...args:any[])=>EventTarget;export class Base extends EventTarget{id=1;}
export function M<T extends Ctor>(Parent:T){return (
/** @fires {CustomEvent<{value:InstanceType<T>}>} changed */
class extends Parent{send(value:InstanceType<T>){this.dispatchEvent(new CustomEvent('changed',{detail:{value}}));}});}
export class Leaf extends M(Base){}`;
async function fixture(files:Record<string,string>,run:(f:any)=>unknown){
 const root=await mkdtemp(join(tmpdir(),'cem-event-generator-'));
 try{
  const dependencies=resolve(import.meta.dirname,'../../node_modules');await mkdir(join(root,'node_modules'));for(const name of await readdir(dependencies))await symlink(join(dependencies,name),join(root,'node_modules',name));
  for(const[name,text]of Object.entries(files)){await mkdir(dirname(join(root,name)),{recursive:true});await writeFile(join(root,name),text);}
  const options={sourceRoot:root,sources:Object.keys(files),lit:false};
  const program=ts.createProgram(options.sources.map(name=>join(root,name)),{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,strict:true,skipLibCheck:true,noEmit:true});
  for(const name of options.sources){const source=program.getSourceFile(join(root,name))!;assert.deepEqual(program.getSemanticDiagnostics(source).map((item:any)=>ts.flattenDiagnosticMessageText(item.messageText,' ')),[]);}
  await run({root,options,generate:()=>generateCandidateCem(options)});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('captured event producer binds real generic emissions and verifies the fresh composition',async()=>fixture({'main.ts':base},async f=>{
 const result=await f.generate(),proof=result.receipt.constructorComposition.proofs.facets.find((entry:any)=>entry.declaration==='Leaf'&&entry.facet==='events');
 assert.equal(proof.eventDispatch.emissions.length,1);assert.match(proof.eventContract.type,/InstanceType<typeof Base>/);
 await verifyCandidateReceipt(result.manifest,result.receipt,f.options);const fresh=await f.generate();verifyCandidateComposition(result.receipt,fresh.receipt);
}));
test('captured event producer refuses a compiler-clean mismatched generic emission',async()=>fixture({'main.ts':base.replace('detail:{value}','detail:{value:42}')},f=>assert.rejects(f.generate,/assignable|payload|detail/i)));
test('captured event producer preserves portable imported module contracts across relocation',async()=>{
 const results:any[]=[];
 for(let i=0;i<2;i++)await fixture({
  'types.ts':'export interface Detail{value:string}',
  'main.ts':'/** @fires {CustomEvent<import("./types.js").Detail>} changed */\nexport class Base{}export function M<T extends new(...args:any[])=>object>(Parent:T){return class extends Parent{};}',
  'nested/consumer.ts':'import {M,Base} from "../main.js";export class Leaf extends M(Base){}'
 },async f=>{
  const result=await f.generate(),declaration=result.manifest.modules.find((entry:any)=>entry.path==='nested/consumer.ts').declarations.find((entry:any)=>entry.name==='Leaf'),event=declaration.events.find((entry:any)=>entry.name==='changed');
  const proof=result.receipt.constructorComposition.proofs.facets.find((entry:any)=>entry.module==='nested/consumer.ts'&&entry.declaration==='Leaf'&&entry.facet==='events'&&entry.key==='changed');
  assert.ok(event);assert.ok(proof);assert.equal(event.type.text,'CustomEvent<import("../types.js").Detail>');assert.equal(proof.eventContract.type,event.type.text);assert.equal(proof.eventContract.detail,'import("../types.js").Detail');assert.equal(proof.eventVisibility.scope,'module-event-visibility');assert.equal(proof.eventDispatch,undefined);
  results.push({manifest:result.manifest,proofs:result.receipt.constructorComposition.proofs});
 });
 assert.deepEqual(results[0],results[1]);
});

test('captured event producer preserves the ordinary-only event route without composition markers',async()=>fixture({
 'main.ts':'/** @fires {CustomEvent<string>} changed */\nexport class Ordinary {}'
},async f=>{
 const result=await f.generate(),declaration=result.manifest.modules.find((entry:any)=>entry.path==='main.ts').declarations.find((entry:any)=>entry.name==='Ordinary');
 assert.equal(declaration.events.length,1);assert.equal(declaration.events[0].name,'changed');assert.equal(declaration.events[0].type.text,'CustomEvent<string>');assert.equal(declaration['x-en-constructor-composition'],undefined);assert.equal(result.receipt.constructorComposition,undefined);
}));


test('ordinary event metadata merges documentation and dispatches without duplicates or composition markers',async()=>{
 const docs=`/**
 * @event {CustomEvent<string>} changed - Documented change.
 * @fires {CustomEvent<number>} documented - Documented only.
 */`;
 const members=`send(value:string){
  this.dispatchEvent(new CustomEvent('changed',{detail:value}));
  this.dispatchEvent(new Event('plain'));
 }`;
 await fixture({'main.ts':`${docs}
export class Ordinary extends EventTarget {${members}}
${docs}
export class Native extends HTMLElement {${members}}
export class Empty {}`},async f=>{
  const result=await f.generate(),declarations=result.manifest.modules.find((entry:any)=>entry.path==='main.ts').declarations;
  const ordinary=declarations.find((entry:any)=>entry.name==='Ordinary'),native=declarations.find((entry:any)=>entry.name==='Native'),empty=declarations.find((entry:any)=>entry.name==='Empty');
  assert.ok(Array.isArray(ordinary.events));assert.equal(ordinary.events.length,3);
  assert.deepEqual(ordinary.events.map((entry:any)=>entry.name).sort(),['changed','documented','plain']);
  const changed=ordinary.events.find((entry:any)=>entry.name==='changed'),documented=ordinary.events.find((entry:any)=>entry.name==='documented');
  assert.equal(changed.type.text,'CustomEvent<string>');assert.equal(changed.description,'Documented change.');
  assert.equal(documented.type.text,'CustomEvent<number>');assert.equal(documented.description,'Documented only.');
  assert.equal(ordinary.events.find((entry:any)=>entry.name==='plain').type.text,'Event');
  assert.deepEqual(ordinary.events,native.events);
  assert.equal(empty.events,undefined);
  for(const declaration of [ordinary,native,empty])assert.equal(declaration['x-en-constructor-composition'],undefined);
  assert.equal(result.receipt.constructorComposition,undefined);
 });
});
