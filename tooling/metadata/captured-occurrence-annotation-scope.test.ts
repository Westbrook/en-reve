import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedOccurrenceAnnotationScope,assertCapturedOccurrenceAnnotationScope,checkCapturedNestedAnnotationScope} from './captured-annotation-scope.ts';

const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,
  moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es2022.d.ts']};
const prefix='export type Constructor=new (...args:any[])=>{}; export interface Envelope<T>{detail:T}; export class Base {value="base";}';
const factory=(text:string,parameters='T extends Constructor')=>`export function M<${parameters}>(Parent:T){return (\n/** @fires {${text}} changed */\nclass extends Parent {});}`;
async function fixture(code:string,run:(value:any)=>unknown,extra:Record<string,string>={}) {
  const root=await mkdtemp(join(tmpdir(),'cem-occurrence-scope-'));
  try {
    const files={'main.ts':code,...extra};
    for(const [name,text] of Object.entries(files)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
    const capture=createCapturedCompilerProgram(Object.keys(files).map(name=>join(root,name)),options),program=capture.program;
    const source=program.getSourceFile(join(root,'main.ts')),leaf=source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');
    let owner:any;for(const file of program.getSourceFiles())if(!file.isDeclarationFile){const visit=(node:any)=>{if((ts.isClassExpression(node)||ts.isClassDeclaration(node))&&ts.getJSDocTags(node).some((tag:any)=>tag.tagName.text==='fires'))owner=node;ts.forEachChild(node,visit);};visit(file);}
    const tag=ts.getJSDocTags(owner).find((tag:any)=>tag.tagName.text==='fires');
    await run({root,capture,program,source,leaf,owner,tag,check:(step=1)=>checkCapturedOccurrenceAnnotationScope(program,leaf,step,tag)});
  }finally{await rm(root,{recursive:true,force:true});}
}

test('occurrence annotation binds the factory type parameter to one checked original call',async()=>fixture(
  prefix+factory('Envelope<InstanceType<T>>')+'export class Leaf extends M(Base){}',f=>{
    const result=f.check();assert.equal(result.lexicalFactoryCallSemanticsChecked,true);
    assert.equal(result.receipt.scope,'factory-call-tag-lexical-correspondence');assert.deepEqual(result.receipt.occurrence.arguments,['typeof Base']);
    assert.equal(result.receipt.references.find((row:any)=>row.name==='T').binding,'copied-factory-binder');
    assert.equal(assertCapturedOccurrenceAnnotationScope(result,f.program,f.leaf,1,f.tag),true);
    assert.equal(result.occurrenceSemanticsQualified,false);assert.equal(result.publicVisibilityChecked,false);assert.equal(result.annotationSemanticsQualified,false);
    assert.throws(()=>checkCapturedNestedAnnotationScope(f.program,f.owner,f.tag),/no compiler errors|closed original symbol/);
  }));

test('occurrence annotation maps the original constructor value parameter in type queries',async()=>fixture(
  prefix+factory('Envelope<typeof Parent>')+'export class Leaf extends M(Base){}',f=>{
    const result=f.check(),reference=result.receipt.references.find((row:any)=>row.name==='Parent');
    assert.equal(reference.binding,'copied-factory-binder');assert.equal(result.assertOriginal(),true);
  }));

test('occurrence annotation binds explicit and defaulted secondary generic arguments',async()=>{
  for(const [suffix,expected] of [['M(Base)','"default"'],['M<typeof Base,number>(Base)','number']])await fixture(
    prefix+factory('Envelope<E>','T extends Constructor,E="default"')+`export class Leaf extends ${suffix}{}`,f=>{
      const result=f.check();assert.deepEqual(result.receipt.occurrence.arguments,['typeof Base',expected]);
      assert.equal(result.receipt.references.find((row:any)=>row.name==='E').binding,'copied-factory-binder');
    });
});

test('occurrence certificates distinguish repeated applications sharing the same authored tag',async()=>fixture(
  prefix+factory('Envelope<InstanceType<T>>')+'const Inner=M(Base); export class Leaf extends M(Inner){}',f=>{
    const first=f.check(1),second=f.check(2);
    assert.deepEqual(first.receipt.occurrence.arguments,['typeof Base']);assert.deepEqual(second.receipt.occurrence.arguments,['typeof Inner']);
    assert.notDeepEqual(first.receipt.occurrence.application,second.receipt.occurrence.application);
    assert.equal(first.receipt.occurrence.contexts.length,1);assert.equal(second.receipt.occurrence.contexts.length,0);
    assert.throws(()=>assertCapturedOccurrenceAnnotationScope(first,f.program,f.leaf,2,f.tag),/Unknown occurrence/);
    assert.throws(()=>assertCapturedOccurrenceAnnotationScope({...second},f.program,f.leaf,2,f.tag),/Unknown occurrence/);
  }));

test('occurrence annotation never substitutes a same-spelled module type for the factory binder',async()=>fixture(
  prefix+'export type T=string;'+factory('Envelope<T>')+'export class Leaf extends M(Base){}',f=>{
    const result=f.check(),reference=result.receipt.references.find((row:any)=>row.name==='T');
    assert.equal(reference.binding,'copied-factory-binder');assert.equal(reference.declarations[0].kind,ts.SyntaxKind.TypeParameter);
  }));

test('occurrence annotation retains imported namespace symbols alongside factory type parameters',async()=>fixture(
  'import type * as Types from "./types.js";'+prefix+factory('Envelope<Types.Payload<InstanceType<T>>>')+'export class Leaf extends M(Base){}',f=>{
    const result=f.check(),reference=result.receipt.references.find((row:any)=>row.name==='Types.Payload');
    assert.equal(reference.declarations[0].file,join(f.root,'types.ts'));assert.equal(result.assertOriginal(),true);
  },{'types.ts':'export interface Payload<T>{value:T}'}));

test('occurrence annotation refuses generic consuming class contexts until separately adapted',async()=>{
  for(const tail of ['export class Leaf<V> extends M(Base){}','export class Mid<V> extends M(Base){} export class Leaf extends Mid<string>{}'])
    await fixture(prefix+factory('Envelope<T>')+tail,f=>assert.throws(()=>f.check(),/Generic consuming class contexts/));
});

test('occurrence annotation checks the authored generic expression under its copied constraints',async()=>fixture(
  prefix+factory('Envelope<T["absent"]>')+'export class Leaf extends M(Base){}',f=>assert.throws(()=>f.check(),/no compiler errors/)));

test('occurrence annotation does not claim public visibility for a closed hidden type',async()=>fixture(
  prefix+'interface Hidden {secret:string}'+factory('Envelope<Hidden>')+'export class Leaf extends M(Base){}',f=>{
    const result=f.check();assert.equal(result.publicVisibilityChecked,false);assert.equal(result.annotationSemanticsQualified,false);
  }));

test('occurrence annotation rejects unowned roots tags indices and changed original structure',async()=>fixture(
  prefix+factory('Envelope<T>')+'export class Leaf extends M(Base){}',f=>{
    let reads=0;const forged=new Proxy({}, {get(){reads++;throw new Error('caller getter');}});
    assert.throws(()=>checkCapturedOccurrenceAnnotationScope(f.program,forged,1,f.tag),/exact selected root/);
    assert.throws(()=>checkCapturedOccurrenceAnnotationScope(f.program,f.leaf,1,forged),/directly attached original JSDoc tag/);assert.equal(reads,0);
    for(const step of [-1,0,2,1.5,999])assert.throws(()=>f.check(step),/exact application index/);
    const result=f.check();f.tag.comment='{Envelope<string>} changed';assert.throws(()=>result.assertOriginal(),/parsed structure changed|authored tag binding changed/);
  }));

test('occurrence annotation refuses a same-spelled constructor from a different module',async()=>fixture(
  'import {M} from "./factory.js"; export class Base {value="base";} export class Leaf extends M(Base){}',f=>{
    assert.throws(()=>f.check(),/exact replay identity/);
  },{'factory.ts':prefix+factory('Envelope<T>')}));


test('occurrence annotation retains distinct steps for directly nested applications',async()=>fixture(
  prefix+factory('Envelope<InstanceType<T>>')+'export class Leaf extends M(M(Base)){}',f=>{
    const first=f.check(1),second=f.check(2);
    assert.equal(first.receipt.occurrence.step,1);assert.equal(second.receipt.occurrence.step,2);
    assert.equal(second.receipt.occurrence.arguments[0].includes('infer __CemOccurrenceReturn'),true);
    assert.notDeepEqual(first.receipt.occurrence.application,second.receipt.occurrence.application);
    assert.equal(assertCapturedOccurrenceAnnotationScope(second,f.program,f.leaf,2,f.tag),true);
  }));


test('occurrence annotation retains captured source selection when the public root-name accessor changes',async()=>fixture(
  'import {M} from "./factory.js"; export class Base {value="base";} export class Leaf extends M(Base){}',f=>{
    const capture=createCapturedCompilerProgram([join(f.root,'main.ts')],options),program=capture.program;
    const source=program.getSourceFile(join(f.root,'main.ts')),leaf=source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');
    const factorySource=program.getSourceFile(join(f.root,'factory.ts'));let owner:any;
    const visit=(node:any)=>{if(ts.isClassExpression(node))owner=node;ts.forEachChild(node,visit);};visit(factorySource);
    const tag=ts.getJSDocTags(owner)[0],check=()=>checkCapturedOccurrenceAnnotationScope(program,leaf,1,tag);
    assert.throws(check,/Implementation must be selected source/);
    program.getRootFileNames=()=>[join(f.root,'main.ts'),join(f.root,'factory.ts')];
    assert.throws(check,/Implementation must be selected source/);
  },{'factory.ts':prefix+factory('Envelope<T>')}));
