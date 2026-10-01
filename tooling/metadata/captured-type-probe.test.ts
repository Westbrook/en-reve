import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';

const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[]};
async function fixture(files:Record<string,string>,run:(f:any)=>unknown,change:any={}) {
  const root=await mkdtemp(join(tmpdir(),'cem-type-probe-'));
  try {
    for(const [name,text] of Object.entries(files)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
    const file=join(root,'main.ts'),capture=createCapturedCompilerProgram([file],{...options,...change});
    await run({root,file,capture,source:capture.program.getSourceFile(file),probe:(text:string)=>capture.replayTypeProbe(capture.program.getSourceFile(file),text)});
  } finally {await rm(root,{recursive:true,force:true});}
}
const publicDetail='export interface PublicDetail {value:string}';

test('module probe checks a real CustomEvent instantiation without mutating original source',async()=>fixture({'main.ts':publicDetail},async f=>{
  const probe=f.probe('CustomEvent<PublicDetail>'),checker=probe.program.getTypeChecker(),type=checker.getTypeFromTypeNode(probe.typeNode);
  const detail=checker.getTypeOfSymbolAtLocation(type.getProperty('detail'),probe.typeNode);
  assert.equal(detail.symbol.name,'PublicDetail');assert.equal(probe.mapOriginalSymbol(detail.symbol),f.capture.program.getTypeChecker().getSymbolAtLocation(f.source.statements[0].name));
  assert.equal(probe.typeSemanticsChecked,true);assert.equal(probe.annotationSemanticsQualified,false);
  assert.notEqual(probe.program,f.capture.program);assert.equal(await readFile(f.file,'utf8'),publicDetail);assert.equal(f.source.text,publicDetail);
  assert.equal(probe.receipt.insertionOffset,publicDetail.length);assert.equal(probe.assertUnchanged(),true);assert.equal(f.capture.revalidate(),true);
}));

test('module probe validates dependent generic constraints and materializes valid defaults',async()=>fixture({'main.ts':'export type Keys<T,U extends keyof T=keyof T> = U;'},f=>{
  const explicit=f.probe('Keys<{value:string},"value">'),implicit=f.probe('Keys<{value:string}>');
  for(const probe of [explicit,implicit])assert.equal(probe.program.getTypeChecker().typeToString(probe.program.getTypeChecker().getTypeFromTypeNode(probe.typeNode)),'"value"');
  assert.throws(()=>f.probe('Keys<{value:string},"missing">'),/no compiler errors.*2344/s);
}));

test('module probe rejects too few too many and nongeneric type arguments',async()=>fixture({'main.ts':'export type Box<T>={value:T}; export interface Plain {value:string}'},f=>{
  assert.throws(()=>f.probe('Box'),/no compiler errors.*2314/s);
  assert.throws(()=>f.probe('Box<string,number>'),/no compiler errors.*2314/s);
  assert.throws(()=>f.probe('Plain<string>'),/no compiler errors.*2315/s);
}));

test('module probe rejects invalid indexed access after every free name resolves',async()=>fixture({'main.ts':publicDetail},f=>{
  assert.throws(()=>f.probe('PublicDetail["missing"]'),/no compiler errors.*2339/s);
}));

test('module probe maps captured imported aliases and their original target declarations',async()=>fixture({
  'main.ts':'import type {Box as Renamed} from "./types.js"; export type Existing=Renamed<string>;',
  'types.ts':'export interface Box<T> {value:T}',
},f=>{
  const probe=f.probe('Renamed<number>'),checker=probe.program.getTypeChecker();
  const alias=checker.getSymbolAtLocation(probe.typeNode.typeName),original=probe.mapOriginalSymbol(alias),originalChecker=f.capture.program.getTypeChecker();
  assert.equal(original,originalChecker.getSymbolAtLocation(f.source.statements[0].importClause.namedBindings.elements[0].name));
  assert.equal(probe.mapOriginalSymbol(checker.getAliasedSymbol(alias)),originalChecker.getAliasedSymbol(original));
  const type=checker.getTypeFromTypeNode(probe.typeNode);assert.equal(checker.typeToString(checker.getTypeOfSymbolAtLocation(type.getProperty('value'),probe.typeNode)),'number');
}));

test('module probe maps complete merged namespace declaration sets',async()=>fixture({'main.ts':
  'export namespace Public { export interface A {a:string} } export namespace Public { export interface B {b:number} }'},f=>{
  const probe=f.probe('Public.A & Public.B'),checker=probe.program.getTypeChecker(),symbol=checker.getSymbolAtLocation(probe.typeNode.types[0].typeName.left);
  assert.equal(symbol.declarations.length,2);const mapped=probe.mapOriginalSymbol(symbol);assert.equal(mapped.declarations.length,2);
  assert.equal(mapped,f.capture.program.getTypeChecker().getSymbolAtLocation(f.source.statements[0].name));
}));

test('module probe refuses a new dependency outside its recorded host closure',async()=>fixture({'main.ts':publicDetail,'new.ts':'export interface Extra {value:number}'},f=>{
  assert.throws(()=>f.probe('import("./new.js").Extra'),/Unrecorded compiler host query/);
}));

test('module probe performs frozen replay with no live TypeScript host fallback',async()=>fixture({'main.ts':publicDetail},f=>{
  const methods=['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath','getEnvironmentVariable','getCurrentDirectory','getExecutingFilePath'];
  const originals=new Map(methods.map(name=>[name,ts.sys[name]]));
  try{for(const name of methods)ts.sys[name]=()=>{throw new Error('Unexpected live host call: '+name);};assert.equal(f.probe('PublicDetail').typeSemanticsChecked,true);}
  finally{for(const [name,value] of originals)ts.sys[name]=value;}
}));

test('module probe refuses syntax injection and generated proof-name references',async()=>fixture({'main.ts':publicDetail},f=>{
  for(const text of ['number; export const injected=1','number; type Extra=string','number /*','__cem_probe_forged','number /* @ts-ignore */'])assert.throws(()=>f.probe(text),/one type expression|name collides|suppression/);
}));

test('module probe refuses checking suppression even when baseline has no diagnostics',async()=>fixture({'main.ts':'// @ts-ignore\nexport const value:number="wrong";'},f=>{
  assert.throws(()=>f.probe('number'),/checking suppression/);
}));

test('module probe refuses unused-check options without changing the original options',async()=>fixture({'main.ts':publicDetail},f=>{
  assert.throws(()=>f.probe('PublicDetail'),/unused-check/);assert.equal(f.capture.program.getCompilerOptions().noUnusedLocals,true);
},{noUnusedLocals:true}));

test('module probe refuses foreign source objects with byte-identical contents',async()=>fixture({'main.ts':publicDetail},f=>{
  const foreign=ts.createSourceFile(f.file,publicDetail,ts.ScriptTarget.ES2022,true);
  assert.throws(()=>f.capture.replayTypeProbe(foreign,'PublicDetail'),/exact original TS module/);
}));

test('module probe refuses declaration files and global scripts',async()=>fixture({'main.ts':
  '/// <reference path="./global.d.ts" />\ninterface Local {value:string}',
  'global.d.ts':'interface Global {value:number}',
},f=>{
  assert.throws(()=>f.probe('Local'),/exact original TS module/);
  assert.throws(()=>f.capture.replayTypeProbe(f.capture.program.getSourceFile(join(f.root,'global.d.ts')),'Global'),/exact original TS module/);
}));

test('module probe preserves ASI and a trailing line comment at the insertion boundary',async()=>fixture({'main.ts':'export const value=1 // trailing line comment'},f=>{
  const probe=f.probe('typeof value');assert.equal(probe.program.getSourceFile(f.file).text.slice(0,f.source.text.length),f.source.text);
  assert.equal(probe.program.getTypeChecker().typeToString(probe.program.getTypeChecker().getTypeFromTypeNode(probe.typeNode)),'1');
}));

test('module probe cannot map synthetic nodes or structural symbol lookalikes as originals',async()=>fixture({'main.ts':publicDetail},f=>{
  const probe=f.probe('PublicDetail'),checker=probe.program.getTypeChecker(),symbol=checker.getSymbolAtLocation(probe.typeNode.typeName);
  assert.throws(()=>probe.mapOriginalNode(probe.typeNode.parent),/Synthetic probe/);
  assert.throws(()=>probe.mapOriginalNode(f.source.statements[0]),/exact overlay node/);
  assert.throws(()=>probe.mapOriginalSymbol({declarations:symbol.declarations,flags:symbol.flags}),/exact overlay symbol/);
}));

test('module probe detects source and parsed-node mutation after semantic checking',async()=>fixture({'main.ts':publicDetail},f=>{
  const probe=f.probe('PublicDetail'),node=probe.typeNode,prior=node.typeName.escapedText;node.typeName.escapedText='Changed';
  assert.throws(()=>probe.assertUnchanged(),/parsed structure changed/);node.typeName.escapedText=prior;probe.assertUnchanged();
  probe.program.getSourceFile(f.file).text+='\n';assert.throws(()=>probe.assertUnchanged(),/Program changed/);
}));

test('module probe keeps private type visibility outside its semantic-validity claim',async()=>fixture({'main.ts':'interface Hidden {value:string} export type Erase<T>=number;'},f=>{
  const probe=f.probe('Erase<Hidden>');assert.equal(probe.program.getTypeChecker().typeToString(probe.program.getTypeChecker().getTypeFromTypeNode(probe.typeNode)),'number');
  assert.equal(probe.annotationSemanticsQualified,false);const argument=probe.typeNode.typeArguments[0],symbol=probe.program.getTypeChecker().getSymbolAtLocation(argument.typeName);
  assert.equal(probe.mapOriginalSymbol(symbol),f.capture.program.getTypeChecker().getSymbolAtLocation(f.source.statements[0].name));
}));

test('module probe keeps original lexical and constructor occurrence admission separate',async()=>fixture({'main.ts':'export type T=number; export class Leaf<T> {value?:T}'},f=>{
  const probe=f.probe('T'),checker=probe.program.getTypeChecker();assert.equal(checker.typeToString(checker.getTypeFromTypeNode(probe.typeNode)),'number');
  assert.equal(probe.annotationSemanticsQualified,false);assert.throws(()=>f.probe('this'),/no compiler errors/);
}));

test('module probe binds its exact checker and SourceFile lookup identities',async()=>fixture({'main.ts':publicDetail},f=>{
  const probe=f.probe('PublicDetail'),program=probe.program,checker=program.getTypeChecker,lookup=program.getSourceFile;
  program.getTypeChecker=()=>f.capture.program.getTypeChecker();assert.throws(()=>probe.assertUnchanged(),/checker or source identity/);
  program.getTypeChecker=checker;probe.assertUnchanged();
  program.getSourceFile=(name:string)=>name===f.file?f.source:lookup(name);assert.throws(()=>probe.mapOriginalNode(probe.typeNode.parent),/checker or source identity/);
  program.getSourceFile=lookup;probe.assertUnchanged();
}));
