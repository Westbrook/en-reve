import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedEventVisibility,assertCapturedEventVisibility} from './captured-event-visibility.ts';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';
import {mkdtemp,mkdir,writeFile,readFile,rm,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {factory,fixture as rawFixture,event,valid} from './captured-factory-event-fixtures.ts';

const semanticPrecondition=(program:any)=>assert.deepEqual(program.getSemanticDiagnostics().map((diagnostic:any)=>({code:diagnostic.code,text:ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')})),[]);
const fixture=(code:string,run:(f:any)=>unknown)=>rawFixture(code,f=>{semanticPrecondition(f.program);return run(f);});

test('event visibility preserves hidden class and interface ancestry before structural flattening',async()=>{
 for(const declaration of ['class HiddenBase {value="x";} export class Public extends HiddenBase {}',
  'interface HiddenBase {value:string;} export interface Public extends HiddenBase {}']) {
  const code=factory('CustomEvent<Public>',valid).replace('export type Constructor',declaration+';export type Constructor');
  await fixture(code,f=>assert.throws(()=>checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag),/unexported type or value: HiddenBase/));
 }
 const code=factory('CustomEvent<Public>',valid).replace('export type Constructor','export class PublicBase {value="x";} export class Public extends PublicBase {};export type Constructor');
 await fixture(code,f=>{const result=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag);assert.ok(result.receipt.references.some((entry:any)=>entry.name==='PublicBase'));});
});


test('event visibility checks hidden types exposed by inferred and explicit public predicates',async()=>{
 for(const annotation of ['',': value is Hidden']) {
  const code=factory('CustomEvent<Detail>',valid).replace('export type Constructor',`class Hidden {value="hidden";}export class Detail {check(value:unknown)${annotation}{return value instanceof Hidden;}};export type Constructor`);
  await fixture(code,f=>{
   const checker=f.program.getTypeChecker(),detail=f.source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Detail');
   const signature=checker.getSignatureFromDeclaration(detail.members[0]),predicate=checker.getTypePredicateOfSignature(signature);
   assert.equal(predicate?.kind,ts.TypePredicateKind.Identifier);assert.equal(predicate?.type.getSymbol()?.name,'Hidden');
   assert.throws(()=>checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag),/unexported type or value: Hidden/);
  });
 }
});

test('event visibility preserves exported nominal classes while excluding hidden implementation slots',async()=>{
 const code=factory('CustomEvent<Detail>',valid).replace('export type Constructor','type Hidden=string;export class Detail {private slot!:Hidden;protected inherited!:Hidden;#brand!:Hidden;\n/** @internal */\ninternal!:Hidden;public value="shown";};export type Constructor');
 await fixture(code,f=>{const declaration=f.source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Detail'),slot=declaration.members.find((node:any)=>node.name?.text==='internal');assert.equal(ts.getJSDocTags(slot).some((tag:any)=>tag.tagName.text==='internal'),true);const result=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag);assert.ok(result.receipt.references.some((entry:any)=>entry.name==='Detail'));assert.equal(result.receipt.references.some((entry:any)=>entry.name==='Hidden'),false);});
});


test('event visibility keeps public external named aliases and classes opaque',async()=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'cem-event-visibility-external-')));
 try {
  const packageRoot=join(root,'node_modules/@cem/external');await mkdir(packageRoot,{recursive:true});
  await writeFile(join(packageRoot,'package.json'),JSON.stringify({name:'@cem/external',version:'1.0.0',types:'./index.d.ts'}));
  await writeFile(join(packageRoot,'index.d.ts'),'type Internal=string;export type Detail={value:Internal};declare class HiddenBase {value:Internal};export declare class ClassDetail extends HiddenBase {}');
  const path=join(root,'main.ts');await writeFile(path,`import {ClassDetail} from '@cem/external';import type {Detail} from '@cem/external';export class Public extends ClassDetail{};export type Constructor=new(...args:any[])=>object;export class Base{};
export function M<T extends Constructor>(Parent:T){return (
/** @fires {CustomEvent<Detail|Public>} changed */
class extends Parent{});}export class Leaf extends M(Base){}`);
  const capture=createCapturedCompilerProgram([path],{strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']}),program=capture.program;semanticPrecondition(program);
  const source=program.getSourceFile(path),external=program.getSourceFile(join(packageRoot,'index.d.ts'));assert.equal(program.isSourceFileFromExternalLibrary(external),true);
  const callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node));let owner:any;const visit=(node:any)=>{if(ts.isClassExpression(node))owner=node;ts.forEachChild(node,visit);};visit(callable);
  const result=checkCapturedEventVisibility(program,callable,owner,ts.getJSDocTags(owner)[0]);assert.ok(result.receipt.references.some((entry:any)=>entry.name==='ClassDetail'));
  const code=await readFile(path,'utf8');await writeFile(path,code.replace('export class Public extends ClassDetail{}','type LocalHidden=string;export class Public extends ClassDetail{override value:LocalHidden="own"}'));
  const next=createCapturedCompilerProgram([path],program.getCompilerOptions()).program;semanticPrecondition(next);const nextSource=next.getSourceFile(path),nextCallable=nextSource.statements.find((node:any)=>ts.isFunctionDeclaration(node));let nextOwner:any;const find=(node:any)=>{if(ts.isClassExpression(node))nextOwner=node;ts.forEachChild(node,find);};find(nextCallable);
  assert.throws(()=>checkCapturedEventVisibility(next,nextCallable,nextOwner,ts.getJSDocTags(nextOwner)[0]),/unexported type or value: LocalHidden/);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('event visibility derives nested returned-class ownership from the exact selected graph',async()=>{
 for(const inner of ['N','M']) {
  const code=factory(event,valid).replace('export function M','export function N<T extends Constructor>(Parent:T){return class extends Parent {extra=1;}}export function M').replace('extends M(Base)',`extends M(${inner}(Base))`);
  await fixture(code,f=>{const result=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag,f.leaf,3);assert.equal(result.receipt.step,3);assert.equal(result.assertOriginal(),true);});
 }
});


test('event visibility uses exact selected ownership for imported local named bodies',async()=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'cem-event-selected-')));
 try {
  const path=join(root,'main.ts'),detailPath=join(root,'detail.ts');let code=factory('CustomEvent<Detail>','');code=code.slice(code.indexOf('export type Constructor'));
  await writeFile(path,`import type {Detail} from './detail.js';${code}`);await writeFile(detailPath,'type Hidden=string;export interface Detail {value:Hidden}');
  for(const selected of [false,true]) {
   const capture=createCapturedCompilerProgram(selected?[path,detailPath]:[path],{strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']}),program=capture.program;semanticPrecondition(program);
   assert.equal(program.isSourceFileFromExternalLibrary(program.getSourceFile(detailPath)),false);assert.equal(capture.receipt.roots.includes(detailPath),selected);
   const source=program.getSourceFile(path),callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node));let owner:any;const visit=(node:any)=>{if(ts.isClassExpression(node))owner=node;ts.forEachChild(node,visit);};visit(callable);
   const check=()=>checkCapturedEventVisibility(program,callable,owner,ts.getJSDocTags(owner)[0]);
   if(selected)assert.throws(check,/unexported type or value: Hidden/);else assert.equal(check().assertOriginal(),true);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});


test('event visibility own parameter authority refuses defaulted constructor binders',async()=>{
 const code=factory('CustomEvent<{constructor:typeof Parent}>',valid).replace('(Parent:T)','(Parent:T=undefined!)');
 await fixture(code,f=>assert.throws(()=>checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag),/constructor parameter requires exact typed required binding/));
});
