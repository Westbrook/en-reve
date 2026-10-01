import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedAnnotationScope,checkCapturedNestedAnnotationScope,assertCapturedAnnotationScope,assertCapturedNestedAnnotationScope} from './captured-annotation-scope.ts';
const options={strict:true,skipLibCheck:true,noEmit:true,target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[]};
async function fixture(files:Record<string,string>,run:(f:any)=>unknown) {
  const root=await realpath(await mkdtemp(join(tmpdir(),'cem-nested-event-scope-')));
  try {
    for(const [name,text]of Object.entries(files)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
    const capture=createCapturedCompilerProgram(Object.keys(files).map(name=>join(root,name)),options),program=capture.program,source=program.getSourceFile(join(root,'main.ts'));
    for(const name of Object.keys(files)){const selected=program.getSourceFile(join(root,name))!;assert.deepEqual([...program.getSyntacticDiagnostics(selected),...program.getSemanticDiagnostics(selected)].map((d:any)=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[],name+' fixture must reach the intended scope check');}
    const owners:any[]=[];function visit(node:any){if((ts.isClassDeclaration(node)||ts.isClassExpression(node))&&node.parent!==source&&ts.getJSDocTags(node).some((tag:any)=>tag.tagName.text==='fires'))owners.push(node);ts.forEachChild(node,visit);}visit(source);
    const owner=owners[0],tag=owner&&ts.getJSDocTags(owner).find((tag:any)=>tag.tagName.text==='fires');
    await run({root,capture,program,source,owners,owner,tag,check:()=>checkCapturedNestedAnnotationScope(program,owner,tag)});
  }finally{await rm(root,{recursive:true,force:true});}
}
const prefix='export type Ctor=new(...args:any[])=>object; export interface Payload {value:string;}';
const returned=(type='CustomEvent<Payload>')=>prefix+`export function M<T extends Ctor>(Parent:T){return (
/** @fires {${type}} changed - contract */
class extends Parent {});}`;

test('closed event scope binds an anonymous returned class without claiming occurrence semantics',()=>fixture({'main.ts':returned()},f=>{
  assert.ok(ts.isClassExpression(f.owner));const result=f.check();assert.equal(result.receipt.scope,'closed-nested-tag-lexical-correspondence');
  assert.equal(result.receipt.text,'CustomEvent<Payload>');assert.deepEqual(result.receipt.references.map((entry:any)=>entry.name),['CustomEvent','Payload']);
  assert.equal(assertCapturedNestedAnnotationScope(result,f.program,f.owner,f.tag),true);assert.equal(result.occurrenceSemanticsQualified,false);assert.equal(result.publicVisibilityChecked,false);assert.equal(result.annotationSemanticsQualified,false);
  assert.throws(()=>checkCapturedAnnotationScope(f.program,f.owner,f.tag),/nongeneric module-level class/);
  assert.throws(()=>assertCapturedAnnotationScope(result,f.program,f.owner,f.tag),/Unknown annotation scope certificate/);
}));

test('closed event scope retains imported namespace type identity in a named returned declaration',()=>fixture({
  'types.ts':'export interface Payload {value:string;}',
  'main.ts':`import type * as Types from './types.js'; export type Ctor=new(...args:any[])=>object; export function M<T extends Ctor>(Parent:T){
/** @fires {CustomEvent<Types.Payload>} changed */
class Returned extends Parent {} return Returned;}`,
},f=>{
  const result=f.check();assert.ok(ts.isClassDeclaration(f.owner));assert.deepEqual(result.receipt.references.map((entry:any)=>entry.name),['CustomEvent','Types','Types.Payload']);
  assert.ok(result.receipt.references.at(-1).declarations.every((entry:any)=>entry.file===join(f.root,'types.ts')));
}));

for(const type of ['CustomEvent<T>','CustomEvent<InstanceType<T>>','CustomEvent<typeof Parent>'])test('factory-local event type remains unqualified: '+type,()=>fixture({'main.ts':returned(type)},f=>{
  assert.throws(f.check,/no compiler errors|closed original symbol|different module and authored lexical bindings/);
}));

test('same-name module type cannot mask the factory type parameter',()=>fixture({'main.ts':'export type T=string;'+returned('CustomEvent<T>')},f=>{
  assert.throws(f.check,/closed original symbol|different module and authored lexical bindings/);
}));

test('closed lexical scope does not grant public visibility to a hidden event detail',()=>fixture({'main.ts':returned().replace('export interface Payload','interface Payload')},f=>{
  const result=f.check();assert.equal(result.typeSemanticsChecked,true);assert.equal(result.publicVisibilityChecked,false);
}));

test('nested certificate rejects unrelated tags, clones and foreign original Programs',()=>fixture({'main.ts':returned()+returned().replaceAll('Payload','SecondPayload').replaceAll('Ctor','SecondCtor').replace('function M<','function N<')},f=>{
  assert.equal(f.owners.length,2);const result=f.check(),second=f.owners[1],tag=ts.getJSDocTags(second)[0];
  assert.throws(()=>checkCapturedNestedAnnotationScope(f.program,f.owner,tag),/exact directly attached/);
  assert.throws(()=>assertCapturedNestedAnnotationScope({...result},f.program,f.owner,f.tag),/Unknown nested/);
  assert.throws(()=>assertCapturedNestedAnnotationScope(result,f.program,second,tag),/Unknown nested/);
  const other=createCapturedCompilerProgram([join(f.root,'main.ts')],options);
  assert.throws(()=>assertCapturedNestedAnnotationScope(result,other.program,f.owner,f.tag),/Unknown nested/);
}));

test('nested scope admission does not read methods on an unowned class lookalike',()=>fixture({'main.ts':returned()},f=>{
  let reads=0;const fake={get getSourceFile(){reads++;throw new Error('must not read');},get typeParameters(){reads++;throw new Error('must not read');}};
  assert.throws(()=>checkCapturedNestedAnnotationScope(f.program,fake,f.tag),/exact nongeneric nested class/);assert.equal(reads,0);
}));
