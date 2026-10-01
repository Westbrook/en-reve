import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram,createCapturedConstructorCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedOccurrenceAnnotationScope} from './captured-annotation-scope.ts';

const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,
  moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es2022.d.ts']};
const factory=`export type Constructor=new (...args:any[])=>{};export interface Envelope<T>{detail:T}
export function M<T extends Constructor>(Parent:T){return (
/** @fires {Envelope<InstanceType<T>>} changed */
class extends Parent {});}`;
const files={'factory.ts':factory,'base.ts':'export class Base {value="actual";}','main.ts':`import {M} from './factory.js';import {Base} from './base.js';export class Leaf extends M(Base){}`};
async function fixture(input:Record<string,string>,run:(f:any)=>unknown,extraOptions:any={}) {
 const root=await mkdtemp(join(tmpdir(),'cem-constructor-imports-'));
 try {
  for(const [name,text]of Object.entries(input)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
  const roots=Object.keys(input).filter(name=>/\.[cm]?tsx?$/.test(name)).map(name=>join(root,name));
  const capture=createCapturedConstructorCompilerProgram(roots,{...options,...extraOptions}),program=capture.program;
  const main=program.getSourceFiles().find((source:any)=>source.fileName===join(root,Object.keys(input).find(name=>name.startsWith('main.'))!));
  const leaf=main.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');
  let tag:any;const factorySource=program.getSourceFiles().find((source:any)=>source.fileName.startsWith(join(root,'factory.')));
  const visit=(node:any)=>{if(ts.isClassExpression(node))tag=ts.getJSDocTags(node).find((value:any)=>value.tagName.text==='fires');ts.forEachChild(node,visit);};visit(factorySource);
  await run({root,roots,capture,program,leaf,tag,factorySource,check:(step=1)=>checkCapturedOccurrenceAnnotationScope(program,leaf,step,tag)});
 }finally{await rm(root,{recursive:true,force:true});}
}

test('constructor capture records exact cross-module import before closure and admits its occurrence',async(t)=>{
 for(const [index,input]of [files,{'base.ts':files['base.ts'],'factory.ts':factory,'main.ts':files['main.ts']}].entries())await fixture(input,f=>{
 const result=f.check();assert.deepEqual(result.receipt.occurrence.arguments,['typeof import("./base.js").Base']);
 assert.equal(result.assertOriginal(),true);assert.equal(result.publicVisibilityChecked,false);
 const edge=f.capture.receipt.constructorImports.find((edge:any)=>edge.specifier==='./base.js');
 assert.equal(edge.from,join(f.root,'factory.ts'));assert.equal(edge.target,join(f.root,'base.ts'));assert.deepEqual(edge.exports,['Base']);
 const imported=f.capture.replayTypeProbe(f.factorySource,'typeof import("./base.js").Base');
 const before=f.program.getSourceFiles().map((source:any)=>source.fileName),after=imported.program.getSourceFiles().map((source:any)=>source.fileName);
 if(index===0)assert.notDeepEqual(after,before);else assert.deepEqual(after,before);
 assert.deepEqual([...after].sort(),[...before].sort());
 assert.equal(imported.receipt.sourceOrderChanged,index===0);t.diagnostic('Checked source traversal reorder: '+JSON.stringify({before,after}));
 assert.equal(imported.assertUnchanged(),true);
 const callable=f.factorySource.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name.text==='M');
 const scopedImported=f.capture.replayScopedTypeProbe(callable,'Envelope<typeof import("./base.js").Base>');
 assert.equal(scopedImported.assertUnchanged(),true);
 const scoped=f.capture.replayScopedTypeProbe(callable,'Envelope<T>');
 const binder=scoped.program.getTypeChecker().getSymbolAtLocation(scoped.typeNode.typeArguments[0].typeName);
 assert.equal(scoped.mapOriginalSymbol(binder)===f.program.getTypeChecker().getSymbolAtLocation(callable.typeParameters[0].name),true);
 assert.equal(scoped.assertUnchanged(),true);assert.equal(result.assertOriginal(),true);
 assert.equal(f.capture.revalidate(),true);
 });
});

test('constructor capture resolves a public export alias and never the factory module homonym',async()=>fixture({
 ...files,'base.ts':'class Actual {value="actual";} export {Actual as Public};','factory.ts':factory+'export class Base{value="decoy";}',
 'main.ts':`import {M} from './factory.js';import {Public as Base} from './base.js';export class Leaf extends M(Base){}`,
},f=>{const result=f.check();assert.deepEqual(result.receipt.occurrence.arguments,['typeof import("./base.js").Public']);}));

test('constructor import edge closure distinguishes changed source bytes and recorded negative lookup',async()=>fixture(files,async f=>{
 const result=f.check();await writeFile(join(f.root,'base.ts'),'export class Base {value=42;}');
 assert.throws(()=>f.capture.revalidate(),/Captured compiler query changed/);
 // Frozen replay stays source-owned; live changes are found by explicit revalidation.
 assert.equal(result.assertOriginal(),true);
}));

test('constructor capture refuses a higher-priority same-stem target instead of substituting an assignable type',async()=>{
 const input={...files,'base.tsx':'export class Base{value="target";}',
 'main.ts':`import {M} from './factory.js';import {Base} from './base.tsx';export class Leaf extends M(Base){}`};
 await assert.rejects(fixture(input,()=>{}, {allowImportingTsExtensions:true,jsx:ts.JsxEmit.Preserve}),/exact selected target/);
});

test('constructor capture retains failed lookup answers used by an accepted TSX edge',async()=>{
 const input={...files,'base.tsx':files['base.ts'],'main.ts':`import {M} from './factory.js';import {Base} from './base.tsx';export class Leaf extends M(Base){}`};delete input['base.ts'];
 await fixture(input,async f=>{
  const plain=createCapturedCompilerProgram(f.roots,{...options,jsx:ts.JsxEmit.Preserve,allowImportingTsExtensions:true});
  const prior=new Set(plain.receipt.queries.map((row:any)=>row.key));
  assert.equal(f.capture.receipt.queries.some((row:any)=>!prior.has(row.key)&&row.key.startsWith('fileExists:')&&row.key.includes(join(f.root,'base.ts')+'"')),true);
  assert.equal(f.check().assertOriginal(),true);await writeFile(join(f.root,'base.ts'),'export class Base {value="shadow";}');
  assert.throws(()=>f.capture.revalidate(),/Captured compiler query changed/);assert.equal(plain.revalidate(),true);
 },{jsx:ts.JsxEmit.Preserve,allowImportingTsExtensions:true});
});

test('constructor capture derives Bundler and Preserve modes from the actual import-type usage',async()=>{
 for(const module of [ts.ModuleKind.ESNext,ts.ModuleKind.Preserve])await fixture(files,f=>{
  const edge=f.capture.receipt.constructorImports.find((edge:any)=>edge.specifier==='./base.js');
  const probe=f.capture.replayTypeProbe(f.factorySource,'typeof import("./base.js").Base');
  const mode=probe.program.getModeForUsageLocation(probe.typeNode.getSourceFile(),probe.typeNode.argument.literal);
  assert.equal(edge.mode,mode);assert.equal(mode,ts.ModuleKind.ESNext);assert.equal(f.check().assertOriginal(),true);
 },{module});
});

test('constructor capture records mode-aware resolution and package metadata in ESM and CJS projects',async()=>{
 for(const type of ['module','commonjs'])await fixture({...files,'package.json':JSON.stringify({type})},async f=>{
  assert.equal(f.check().assertOriginal(),true);
  const edge=f.capture.receipt.constructorImports.find((edge:any)=>edge.specifier==='./base.js');
  assert.equal(edge.mode,type==='module'?ts.ModuleKind.ESNext:ts.ModuleKind.CommonJS);
  await rm(join(f.root,'package.json'));assert.throws(()=>f.capture.revalidate(),/Captured compiler query changed/);
 },{module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext});
});

test('constructor references require exact selected source and original exported symbol identities',async()=>fixture(files,f=>{
 const base=f.program.getSourceFile(join(f.root,'base.ts')),symbol=f.program.getTypeChecker().getSymbolAtLocation(base.statements[0].name);
 const reference=f.capture.constructorImport(symbol,f.factorySource);assert.equal(reference,'import("./base.js").Base');
 assert.equal(f.capture.constructorImport({...symbol},f.factorySource),undefined);
 assert.throws(()=>f.capture.constructorImport(symbol,{...f.factorySource}),/exact selected source/);
 const plain=createCapturedCompilerProgram(f.roots,options);assert.equal(plain.receipt.constructorImports,undefined);assert.equal(plain.constructorImport,undefined);
 assert.notEqual(f.capture.closureDigest,plain.closureDigest);
}));

test('constructor capture retains root-scoped imported field and callable formatting queries before sealing',async()=>fixture({
 ...files,
 'types.ts':'export interface Payload {value:string;} export function makePayload():Payload{return {value:"a"};} export function isPayload(value:unknown):value is Payload{return typeof value === "object" && value !== null && "value" in value;}',
 'base.ts':`import {makePayload,isPayload} from './types.js';export class Base {
  payload=makePayload();
  accept(value:import('./types.js').Payload):import('./types.js').Payload{return value;}
  isPayload(value:unknown){return isPayload(value);}
  /** @internal */ hidden<T>(value:T):T{return value;}
 }`,
},async f=>{
 const render=(program:any)=>{
  const source=program.getSourceFile(join(f.root,'main.ts')),root=source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');
  const checker=program.getTypeChecker(),instance=checker.getTypeAtLocation(root);
  const member=(name:string)=>checker.getTypeOfSymbolAtLocation(checker.getPropertyOfType(instance,name),root);
  const signature=(name:string)=>checker.getSignaturesOfType(member(name),ts.SignatureKind.Call)[0];
  const accept=signature('accept'),predicate=checker.getTypePredicateOfSignature(signature('isPayload'));assert.ok(predicate?.type);
  const types=[member('payload'),checker.getTypeOfSymbolAtLocation(accept.parameters[0],root),checker.getReturnTypeOfSignature(accept),predicate.type];
  return types.map(type=>[false,true].map(expanded=>checker.typeToString(type,root,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseFullyQualifiedType|(expanded?ts.TypeFormatFlags.InTypeAlias:0))));
 };
 const digest=f.capture.closureDigest,sourceBytes=f.program.getSourceFiles().map((source:any)=>[source.fileName,source.text]);
 const original=render(f.program);assert.ok(original.every(([text]:string[])=>text.includes('import(')&&text.includes('Payload')));
 assert.ok(original.every(([,text]:string[])=>text.includes('Payload')||(text.includes('value')&&text.includes('string'))));
 const replay=f.capture.replayBaseline();assert.deepEqual(render(replay.program),original);
 assert.equal(f.capture.closureDigest,digest);assert.deepEqual(f.program.getSourceFiles().map((source:any)=>[source.fileName,source.text]),sourceBytes);
 assert.doesNotThrow(()=>f.capture.assertOriginal());assert.equal(f.capture.revalidate(),true);
 await writeFile(join(f.root,'package.json'),'{"name":"new-input"}');
 assert.throws(()=>f.capture.revalidate(),/Captured compiler query changed/);
 // Closed replay still consumes the recorded absence; live mutation is not
 // consulted by rendering and cannot silently update the captured identity.
 assert.deepEqual(render(f.capture.replayBaseline().program),original);assert.equal(f.capture.closureDigest,digest);
}));

test('constructor capture records private-only imported returns and predicates in final-root and factory scopes',async()=>fixture({
 ...files,
 'types.ts':'export interface Payload {value:string;} export function makePayload():Payload{return {value:"a"};} export function isPayload(value:unknown):value is Payload{return typeof value === "object" && value !== null && "value" in value;}',
 'base.ts':'export class Base {}',
 'factory.ts':`import {makePayload,isPayload} from './types.js';`+factory.replace('class extends Parent {}',`class extends Parent {
  #make(){return makePayload();}
  #is(value:unknown){return isPayload(value);}
 }`),
},f=>{
 const render=(program:any)=>{
  const checker=program.getTypeChecker(),source=program.getSourceFile(join(f.root,'factory.ts'));
  const callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name?.text==='M');
  const main=program.getSourceFile(join(f.root,'main.ts')),root=main.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');
  const methods:any[]=[];const visit=(node:any)=>{if(ts.isMethodDeclaration(node)&&ts.isPrivateIdentifier(node.name))methods.push(node);ts.forEachChild(node,visit);};visit(callable);
  assert.equal(methods.length,2);assert.ok(methods.every(node=>node.parent.members.every((member:any)=>ts.isMethodDeclaration(member)&&ts.isPrivateIdentifier(member.name))));
  return [root,callable].map(scope=>methods.map(node=>{
   const signature=checker.getSignaturesOfType(checker.getTypeAtLocation(node),ts.SignatureKind.Call)[0];
   const predicate=checker.getTypePredicateOfSignature(signature);if(node.name.text==='#is')assert.ok(predicate?.type);
   const type=predicate?.type??checker.getReturnTypeOfSignature(signature);
   return [false,true].map(expanded=>checker.typeToString(type,scope,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseFullyQualifiedType|(expanded?ts.TypeFormatFlags.InTypeAlias:0)));
  }));
 };
 const original=render(f.program);assert.ok(original.flat().every(([text]:string[])=>text.includes('import(')&&text.includes('Payload')));
 assert.deepEqual(render(f.capture.replayBaseline().program),original);assert.equal(f.capture.revalidate(),true);
}));

test('constructor capture records public factory-only imported returns in its distinct output directory',async()=>{
 const root=await mkdtemp(join(tmpdir(),'cem-factory-method-imports-'));
 try {
  const input={
   'types.ts':'export interface Payload {value:string;} export function makePayload():Payload{return {value:"a"};} export function isPayload(value:unknown):value is Payload{return typeof value === "object" && value !== null && "value" in value;}',
   'base.ts':'export class Base {}',
   'factory/factory.ts':`import {makePayload,isPayload} from '../types.js';`+factory.replace('class extends Parent {}',`class extends Parent {
    make(){return makePayload();}
    isPayload(value:unknown){return isPayload(value);}
   }`),
   'consumer/main.ts':`import {M} from '../factory/factory.js';import {Base} from '../base.js';export class Leaf extends M(Base){}`,
  };
  for(const [name,text]of Object.entries(input)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
  const capture=createCapturedConstructorCompilerProgram(Object.keys(input).map(name=>join(root,name)),options);
  const render=(program:any)=>{
   const checker=program.getTypeChecker(),source=program.getSourceFile(join(root,'factory/factory.ts'));
   const callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name?.text==='M');
   const main=program.getSourceFile(join(root,'consumer/main.ts')),leaf=main.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');
   assert.notEqual(dirname(callable.getSourceFile().fileName),dirname(leaf.getSourceFile().fileName));
   const methods:any[]=[];const visit=(node:any)=>{if(ts.isMethodDeclaration(node))methods.push(node);ts.forEachChild(node,visit);};visit(callable);
   assert.equal(methods.length,2);assert.ok(methods.every(node=>ts.isIdentifier(node.name)&&node.parent.members.every((member:any)=>ts.isMethodDeclaration(member)&&ts.isIdentifier(member.name))));
   return methods.map(node=>{
    const signature=checker.getSignaturesOfType(checker.getTypeAtLocation(node),ts.SignatureKind.Call)[0];
    const predicate=checker.getTypePredicateOfSignature(signature);if(node.name.text==='isPayload')assert.ok(predicate?.type);
    const type=predicate?.type??checker.getReturnTypeOfSignature(signature);
    return [false,true].map(expanded=>checker.typeToString(type,callable,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseFullyQualifiedType|(expanded?ts.TypeFormatFlags.InTypeAlias:0)));
   });
  };
  const original=render(capture.program);assert.ok(original.every(([text]:string[])=>text.includes('import(')&&text.includes('Payload')));
  assert.deepEqual(render(capture.replayBaseline().program),original);assert.equal(capture.revalidate(),true);
 }finally{await rm(root,{recursive:true,force:true});}
});
