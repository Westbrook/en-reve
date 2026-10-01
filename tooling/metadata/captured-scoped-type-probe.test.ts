import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';
const options={strict:true,noEmit:true,skipLibCheck:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
 target:ts.ScriptTarget.ES2022,types:[],lib:['lib.es2022.d.ts']};
const prefix='export type Constructor=new(...args:any[])=>{};export interface Envelope<T>{detail:T};export class Base{};';
const factory=(extra='')=>`export function M<T extends Constructor>(Parent:T){${extra}return class extends Parent {value!:T;};}export class Leaf extends M(Base){}`;
async function fixture(code:string,run:(f:any)=>unknown) {
 const root=await mkdtemp(join(tmpdir(),'cem-scoped-probe-'));
 try {
  const path=join(root,'main.ts');await writeFile(path,code);const capture=createCapturedCompilerProgram([path],options),program=capture.program,source=program.getSourceFile(path);
  let callable:any;for(const node of source.statements){if(ts.isFunctionDeclaration(node)&&node.name?.text==='M')callable=node;
   if(ts.isVariableStatement(node))for(const entry of node.declarationList.declarations)if(entry.name.text==='M')callable=entry.initializer;}
  await run({root,path,capture,program,source,callable,probe:(text:string)=>capture.replayScopedTypeProbe(callable,text)});
 }finally{await rm(root,{recursive:true,force:true});}
}

test('scoped probe binds factory type and constructor value queries in the original lexical body',async()=>fixture(prefix+factory(),f=>{
 for(const text of ['Envelope<T>','Envelope<typeof Parent>']) {
  const probe=f.probe(text),checker=probe.program.getTypeChecker(),name=probe.typeNode.typeArguments[0];
  const overlay=checker.getSymbolAtLocation(ts.isTypeQueryNode(name)?name.exprName:name.typeName);
  const original=f.program.getTypeChecker().getSymbolAtLocation(text.includes('typeof')?f.callable.parameters[0].name:f.callable.typeParameters[0].name);
  assert.equal(probe.mapOriginalSymbol(overlay)===original,true);assert.equal(probe.mapOriginalNode(probe.callable)===f.callable,true);
  assert.equal(probe.assertUnchanged(),true);assert.equal(probe.annotationSemanticsQualified,false);
 }
}));

test('scoped probe keeps generic payload expressions and annotation detail in one checker binder',async()=>fixture(
 prefix+`export function M<T extends Constructor>(Parent:T){return class extends Parent {send(value:T,wrong:number){return value;}};}export class Leaf extends M(Base){}`,
 f=>{const probe=f.probe('Envelope<T>'),checker=probe.program.getTypeChecker(),type=checker.getTypeFromTypeNode(probe.typeNode);
  const expected=checker.getTypeOfSymbolAtLocation(type.getProperty('detail'),probe.typeNode);let method:any;
  const visit=(node:any)=>{if(ts.isMethodDeclaration(node)&&node.name.text==='send')method=node;ts.forEachChild(node,visit);};visit(probe.callable);
  assert.equal(checker.getTypeAtLocation(method.parameters[0])===expected,true);
  assert.equal(checker.isTypeAssignableTo(checker.getTypeAtLocation(method.parameters[1]),expected),false);
}));

test('scoped probe preserves returned class private brands and consuming signatures without adding runtime members',async()=>fixture(
 prefix+`export function M<T extends Constructor>(Parent:T){return class Named extends Parent {#secret=1;get value(){return this.#secret;}};}export class Leaf extends M(Base){}`,
 f=>{const probe=f.probe('Envelope<InstanceType<T>>'),checker=probe.program.getTypeChecker();
  const prior=f.source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Leaf');
  const leaf=probe.program.getSourceFile(f.path).statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Leaf');
  assert.deepEqual(checker.getTypeAtLocation(leaf).getProperties().map((symbol:any)=>symbol.declarations?.[0]?.name?.getText()??symbol.name).sort(),f.program.getTypeChecker().getTypeAtLocation(prior).getProperties().map((symbol:any)=>symbol.declarations?.[0]?.name?.getText()??symbol.name).sort());
  const call=leaf.heritageClauses[0].types[0].expression;
  assert.equal(probe.mapOriginalNode(checker.getResolvedSignature(call).getDeclaration())===f.callable,true);
}));

test('scoped probe supports a direct block arrow with local type aliases and preserves original node topology',async()=>fixture(
 prefix+`export const M=<T extends Constructor>(Parent:T)=>{type Local=Envelope<T>;return class extends Parent {value!:T;};};export class Leaf extends M(Base){}`,
 f=>{const probe=f.probe('Local'),symbol=probe.program.getTypeChecker().getSymbolAtLocation(probe.typeNode.typeName);
  const original=f.callable.body.statements[0];assert.equal(probe.mapOriginalSymbol(symbol)===f.program.getTypeChecker().getSymbolAtLocation(original.name),true);
  assert.equal(probe.callable.body.statements.length,f.callable.body.statements.length+1);
}));

test('scoped probe refuses injection suppression and type errors without executing the factory',async()=>fixture(
 prefix+factory('throw new Error("Never execute factory");'),f=>{
  assert.equal(f.probe('Envelope<T>').assertUnchanged(),true);
  for(const text of ['Missing','T["absent"]','T; const run=1','T; /* @ts-ignore */ type Other=Missing'])assert.throws(()=>f.probe(text),/no compiler errors|exactly one/);
}));

test('scoped probe rejects unowned or non-module callables before caller properties',async()=>fixture(prefix+factory(),f=>{
 let reads=0;const forged=new Proxy({}, {get(){reads++;throw Error('caller getter');}});
 assert.throws(()=>f.capture.replayScopedTypeProbe(forged,'string'),/exact original block-bodied/);assert.equal(reads,0);
 const probe=f.probe('Envelope<T>');assert.throws(()=>probe.mapOriginalNode({...probe.callable}),/exact original overlay node/);
 assert.throws(()=>probe.mapOriginalNode(probe.typeNode),/exact original overlay node/);
}));

test('scoped probe detects original and overlay AST mutation after certification',async()=>{
 await fixture(prefix+factory(),f=>{const probe=f.probe('Envelope<T>');f.callable.name.escapedText='Changed';assert.throws(()=>probe.assertUnchanged(),/parsed structure changed/);});
 await fixture(prefix+factory(),f=>{const probe=f.probe('Envelope<T>');probe.typeNode.typeName.escapedText='Changed';assert.throws(()=>probe.assertUnchanged(),/parsed structure changed/);});
});

test('scoped probe freezes host answers and keeps separate live input revalidation',async()=>fixture(prefix+factory(),async f=>{
 const probe=f.probe('Envelope<T>');await writeFile(f.path,prefix+factory('const changed=true;'));
 assert.equal(probe.assertUnchanged(),true);assert.throws(()=>f.capture.revalidate(),/Captured compiler query changed/);
 assert.throws(()=>f.probe('import("./unseen.js").Hidden'),/Unrecorded compiler host query/);
}));

test('scoped reverse node mapping preserves exact ownership and every-call mutation guards',async()=>fixture(prefix+factory(),f=>{
 const probe=f.probe('Envelope<T>');assert.equal(probe.mapReplayNode(f.callable)===probe.callable,true);
 assert.equal(probe.mapOriginalNode(probe.mapReplayNode(f.callable.body))===f.callable.body,true);
 let reads=0;const foreign=new Proxy({}, {get(){reads++;throw Error('foreign getter');}});
 assert.throws(()=>probe.mapReplayNode(foreign),/exact original node/);assert.equal(reads,0);
 f.callable.name.escapedText='Changed';assert.throws(()=>probe.mapReplayNode(f.callable),/changed/);
}));

test('probe symbol batches preserve order duplicates array admission and post-operation mutation guards',async()=>{
 for(const kind of ['module','scoped'])await fixture(prefix+factory(),f=>{
  const probe=kind==='module'?f.capture.replayTypeProbe(f.source,'Envelope<number>'):f.probe('Envelope<T>');
  const symbol=probe.program.getTypeChecker().getSymbolAtLocation(probe.typeNode.typeName),original=f.program.getTypeChecker().getSymbolAtLocation(f.source.statements[1].name);
  const result=probe.mapOriginalSymbols([symbol,symbol]);assert.equal(result.length,2);assert.equal(result[0]===original,true);assert.equal(result[1]===original,true);assert.equal(Object.isFrozen(result),true);
  assert.throws(()=>probe.mapOriginalSymbols([{...symbol}]),/exact original|exact overlay/);
  let reads=0;const access:any[]=[];Object.defineProperty(access,'0',{enumerable:true,get(){reads++;throw Error('array getter');}});
  assert.throws(()=>probe.mapOriginalSymbols(access),/plain dense data array/);assert.equal(reads,0);
  assert.throws(()=>probe.mapOriginalSymbols(new Array(1)),/plain dense data array/);
  const declarations=symbol.declarations;
  Object.defineProperty(symbol,'declarations',{configurable:true,get(){f.callable.name.escapedText='Changed';return declarations;}});
  assert.throws(()=>probe.mapOriginalSymbols([symbol]),/changed/);
 });
});
