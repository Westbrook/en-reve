import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateCem} from './generate.ts';
import {readEventContracts} from './event-contracts.ts';
import {snapshotCem} from '../releases/cem-diff.ts';
import {diffPublicGraph} from '../releases/graph-diff.ts';
import {generateElements,verifyGeneratedElements} from './generate-elements.ts';

async function fixture(run:(root:string)=>Promise<void>) {const root=await mkdtemp(join(tmpdir(),'api-contract-'));try{await mkdir(join(root,'src'));await symlink(fileURLToPath(new URL('../../node_modules',import.meta.url)),join(root,'node_modules'),'dir');await run(root);}finally{await rm(root,{recursive:true,force:true});}}

test('accessor contracts preserve inferred reads, typed writes and Lit attribute types',()=>fixture(async root=>{
 await writeFile(join(root,'src/element.ts'),`import {LitElement} from 'lit';
 /** @tag en-test */ export class Test extends LitElement {
 static properties={value:{type:String,noAccessor:true}};
 private accepted=''; get value(){return this.accepted;} set value(value:string){this.accepted=value;}
 }`);
 const result=await generateCem({sourceRoot:root,sources:['src/element.ts']});
 const surfaces=snapshotCem(result.manifest).elements.get('en-test')!.surfaces;
 assert.equal((surfaces.get('property:value')!.value as any).type.text,'string');
 assert.equal((surfaces.get('attribute:value')!.value as any).type.text,'string');
 await writeFile(join(root,'src/element.ts'),`/** @tag en-test */ export class Test { get value():string{return '';} set value(value:number){} }`);
 await assert.rejects(()=>generateCem({sourceRoot:root,sources:['src/element.ts']}),/getter\/setter type disagreement/);
}));

test('typed event enforcement rejects missing payloads, unresolved types and mismatched emitted schemas',()=>fixture(async root=>{
 const file=join(root,'src/event.ts');
 for(const type of ['CustomEvent','CustomEvent<any>','CustomEvent<unknown>','MissingEvent']) {
  await writeFile(file,`/** @fires {${type}} en-change */ export class Sample extends EventTarget {}`);
  await assert.rejects(()=>readEventContracts(root,['src/event.ts']));
 }
 const source=(value:string)=>`declare function dispatchChange(target:EventTarget,change:unknown):void;
 /** @fires {CustomEvent<{previous:number;proposed:number;reason:'test'}>} en-change */
 export class Sample extends EventTarget {run(){dispatchChange(this,{previous:1,proposed:${value},reason:'test'});}}`;
 await writeFile(file,source('2'));assert.equal((await readEventContracts(root,['src/event.ts'])).length,1);
 await writeFile(file,source("'wrong'"));await assert.rejects(()=>readEventContracts(root,['src/event.ts']),/Emitted payload disagrees/);
}));

test('CEM release resolution follows aliases and flags unresolved local exports; private events stay private',()=>{
 const manifest={schemaVersion:'1.0.0',modules:[
  {path:'src/index.ts',exports:[{kind:'js',name:'Public',declaration:{name:'Alias',module:'./barrel.js'}},{kind:'js',name:'Missing',declaration:{name:'Missing',module:'./missing.js'}}]},
  {path:'src/barrel.ts',exports:[{kind:'js',name:'Alias',declaration:{name:'Real',module:'./element.js'}}]},
  {path:'src/element.ts',declarations:[{kind:'class',name:'Real',tagName:'en-real',events:[{name:'en-private',privacy:'private'},{name:'en-public',type:{text:'CustomEvent<null>'}}]}]},
 ]};
 const snapshot=snapshotCem(manifest);
 assert.equal((snapshot.exports.get('src/index.ts#Public') as any).declaration.name,'Real');
 assert.ok(snapshot.gaps.some(x=>x.includes('Missing')));
 assert.equal(snapshot.elements.get('en-real')!.surfaces.has('event:en-private'),false);
 assert.equal((snapshot.exports.get('src/index.ts#Public') as any).declaration.events.length,1);
});

test('freshness rejects extraction identity drift even with identical source and CEM bytes',()=>fixture(async root=>{
 await writeFile(join(root,'src/element.ts'),'/** @tag en-test */ export class Test {}');
 await writeFile(join(root,'src/catalog.ts'),"import {Test} from './element.js'; export const definitions=[{tagName:'en-test',elementClass:Test}];");
 const {manifest,receipt}=await generateElements(root, {checkTagTypes:false});
 await writeFile(join(root,'custom-elements.json'),JSON.stringify(manifest));
 await writeFile(join(root,'custom-elements.json.receipt.json'),JSON.stringify({...receipt,generator:{...receipt.generator,typescript:'different'}}));
 await assert.rejects(()=>verifyGeneratedElements(root),/extraction policy/);
}));

test('graph release review detects policy/registration/behavior changes and rejects mismatched artifacts',async()=>{
 const root=new URL('../../packages/elements/',import.meta.url);
 const graph=JSON.parse(await readFile(new URL('public-api.json',root),'utf8'));
 const cem=JSON.parse(await readFile(new URL('custom-elements.json',root),'utf8'));
 const next=structuredClone(graph);next.components[0].dependencies.push('en-button');
 const diff=diffPublicGraph(cem,cem,graph,next);
 assert.ok(diff.facts.some(f=>f.name.startsWith('contract:')&&f.reviewRequired));
 next.typeDigest='wrong';assert.throws(()=>diffPublicGraph(cem,cem,graph,next),/does not match/);
});

test('output attributes describe read-only reflected state without introducing author input',()=>fixture(async root=>{
 await writeFile(join(root,'src/element.ts'),`import {LitElement} from 'lit';
 /**
  * @tag en-test
  * @outputAttribute dragging dragging - Read-only drag state.
  */
 export class Test extends LitElement {
 static properties={dragging:{attribute:false}};
 get dragging():boolean{return false;}
 }`);
 const {manifest}=await generateCem({sourceRoot:root,sources:['src/element.ts']});
 const declaration=manifest.modules[0].declarations.find((d:any)=>d.name==='Test');
 assert.deepEqual(declaration.attributes.find((a:any)=>a.name==='dragging'),{name:'dragging',fieldName:'dragging',type:{text:'boolean'},description:'Read-only drag state.'});
 assert.equal(declaration.members.find((m:any)=>m.name==='dragging').readonly,true);
}));

test('catalog tag assertions reject absent and incorrect HTMLElementTagNameMap entries',()=>fixture(async root=>{
 const file=join(root,'src/element.ts');
 const source='/** @tag en-test */ export class Test extends HTMLElement {uniqueMember=1;}';
 await writeFile(file,source);await assert.rejects(()=>readEventContracts(root,['src/element.ts'],true),/en-test/);
 await writeFile(file,source+`\ndeclare global {interface HTMLElementTagNameMap {'en-test':HTMLElement;}}`);
 await assert.rejects(()=>readEventContracts(root,['src/element.ts'],true),/false/);
 await writeFile(file,source+`\ndeclare global {interface HTMLElementTagNameMap {'en-test':Test;}}`);
 await readEventContracts(root,['src/element.ts'],true);
}));

test('release CLI automatically uses matching graphs and rejects one-sided or stale evidence',()=>fixture(async root=>{
 const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const exec=promisify(execFile);
 const source=new URL('../../packages/elements/',import.meta.url);
 for(const side of ['before','after']){await mkdir(join(root,side));for(const file of ['custom-elements.json','public-types.json','public-api.json'])await writeFile(join(root,side,file),await readFile(new URL(file,source)));}
 const args=[new URL('../releases/cli.ts',import.meta.url).pathname,'diff',join(root,'before/custom-elements.json'),join(root,'after/custom-elements.json')];
 const {stdout}=await exec(process.execPath,args,{maxBuffer:10_000_000});const diff=JSON.parse(stdout);
 assert.equal(diff.graphCoverage,'public-contract-graph');assert.deepEqual(diff.facts,[]);
 await rm(join(root,'after/public-api.json'));await assert.rejects(()=>exec(process.execPath,args),/both release sides/);
 const graph=JSON.parse(await readFile(new URL('public-api.json',source),'utf8'));graph.typeDigest='stale';
 await writeFile(join(root,'after/public-api.json'),JSON.stringify(graph));await assert.rejects(()=>exec(process.execPath,args),/do not match/);
}));

test('direct public dispatch cannot introduce an undeclared event family',()=>fixture(async root=>{
 await writeFile(join(root,'src/element.ts'),`declare function dispatchChange(target:EventTarget,value:unknown):void;
 /** @tag en-test */ export class Test extends EventTarget {run(){dispatchChange(this,{previous:1,proposed:2});}}`);
 await assert.rejects(()=>readEventContracts(root,['src/element.ts']),/Unclassified emitted event/);
}));

test('description content publishes one inherited attribute/property, slot and Part contract',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../../packages/elements/custom-elements.json',import.meta.url),'utf8'));
 const tags=['en-text-field','en-textarea','en-rich-text-editor','en-token-editor','en-range-slider','en-checkbox-group','en-toggle-group','en-multiselect','en-selection-collection','en-dialog','en-drawer','en-sheet','en-media-viewer','en-command-palette','en-validation-summary'];
 for(const tag of tags){
  const declaration=manifest.modules.flatMap((m:any)=>m.declarations??[]).find((d:any)=>d.tagName===tag);
  assert.ok(declaration,tag);
  for(const section of ['attributes','slots','cssParts'])assert.ok(declaration[section]?.some((entry:any)=>entry.name==='description'),`${tag} ${section}`);
  assert.equal(declaration.members.find((entry:any)=>entry.name==='description')?.type?.text,'string',tag);
 }
});
