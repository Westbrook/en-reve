import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram,capturedCompilerProgram} from './captured-compiler-program.ts';

const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[]};
async function fixture(files:Record<string,string>,run:(f:any)=>unknown) {
  const root=await realpath(await mkdtemp(join(tmpdir(),'cem-captured-host-')));
  try {
    const write=async(name:string,text:string)=>{const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);};
    for(const [name,text] of Object.entries(files))await write(name,text);
    const roots=[join(root,'main.ts')];
    await run({root,roots,write,create:()=>createCapturedCompilerProgram(roots,options)});
  } finally {await rm(root,{recursive:true,force:true});}
}

test('captured baseline replays fresh checked sources and keeps original identity authoritative',async()=>fixture({'main.ts':'export interface Public {value:number} export const value:Public={value:1};'},f=>{
  const capture=f.create(),replay=capture.replayBaseline();
  assert.equal(capturedCompilerProgram(capture.program),capture);assert.equal(capture.revalidate(),true);
  assert.notEqual(replay.program,capture.program);assert.equal(replay.closureDigest,capture.closureDigest);
  assert.equal(replay.annotationSemanticsQualified,false);
  const source=capture.program.getSourceFile(f.roots[0]),replayed=replay.program.getSourceFile(f.roots[0]);
  assert.notEqual(source,replayed);assert.equal(source.text,replayed.text);
  assert.ok(capture.receipt.queries.length);assert.ok(Object.isFrozen(capture.receipt.sources));
}));

test('identical foreign Programs cannot adopt a captured-host capability',async()=>fixture({'main.ts':'export const value=1;'},f=>{
  const capture=f.create(),foreign=ts.createProgram(f.roots,options);
  assert.throws(()=>capturedCompilerProgram(foreign),/no original captured-host/);
  assert.throws(()=>capture.assertOriginal(foreign),/exact original Program/);
}));

test('frozen replay retains original source bytes while live revalidation rejects edits',async()=>fixture({'main.ts':'export const value=1;'},async f=>{
  const capture=f.create();await f.write('main.ts','export const value=2;');
  assert.throws(()=>capture.revalidate(),/query changed/);
  assert.equal(capture.replayBaseline().program.getSourceFile(f.roots[0]).text,'export const value=1;');
}));

test('negative module lookups detect a new higher-priority source without changing frozen replay',async()=>fixture({'main.ts':'import {value} from "./choice.js"; export const publicValue=value;','choice.d.ts':'export declare const value:number;'},async f=>{
  const capture=f.create();assert.ok(capture.program.getSourceFile(join(f.root,'choice.d.ts')));
  await f.write('choice.ts','export const value="changed";');assert.throws(()=>capture.revalidate(),/query changed/);
  const replay=capture.replayBaseline();assert.ok(replay.program.getSourceFile(join(f.root,'choice.d.ts')));assert.equal(replay.program.getSourceFile(join(f.root,'choice.ts')),undefined);
}));

test('package export metadata changes invalidate captured resolution inputs',async()=>fixture({
  'main.ts':'import {value} from "example"; export const publicValue=value;',
  'node_modules/example/package.json':'{"name":"example","version":"1.0.0","exports":{"types":"./index.d.ts","default":"./index.js"}}',
  'node_modules/example/index.d.ts':'export declare const value:number;',
},async f=>{
  const capture=f.create();await f.write('node_modules/example/package.json','{"name":"example","version":"1.0.0","exports":{"types":"./other.d.ts","default":"./index.js"}}');
  assert.throws(()=>capture.revalidate(),/query changed/);assert.ok(capture.replayBaseline().program.getSourceFile(join(f.root,'node_modules/example/index.d.ts')));
}));

test('baseline replay has no live TypeScript filesystem or environment fallback',async()=>fixture({'main.ts':'export const value=1;'},f=>{
  const capture=f.create(),methods=['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath','getEnvironmentVariable','getCurrentDirectory','getExecutingFilePath'];
  const originals=new Map(methods.map(name=>[name,ts.sys[name]]));
  try {
    for(const name of methods)ts.sys[name]=()=>{throw new Error('Unexpected live TypeScript host call: '+name);};
    assert.equal(capture.replayBaseline().program.getSourceFile(f.roots[0]).text,'export const value=1;');
  } finally {for(const [name,implementation] of originals)ts.sys[name]=implementation;}
}));

test('unchecked incremental emitting and nonserializable options reject before Program admission',async()=>fixture({'main.ts':'export const value=1;'},f=>{
  for(const change of [{noCheck:true},{noEmit:false},{strict:false},{incremental:true},{composite:true},{configFilePath:'tsconfig.json'},{callback:()=>{}}]) {
    assert.throws(()=>createCapturedCompilerProgram(f.roots,{...options,...change}),/Captured|serializable/);
  }
  assert.throws(()=>createCapturedCompilerProgram(['relative.ts'],options),/absolute roots/);
}));

test('compiler diagnostics prevent capture from certifying erroneous original source',async()=>fixture({'main.ts':'export const value:number="wrong";'},f=>{
  assert.throws(()=>f.create(),/no compiler errors/);
}));

test('portable capture receipts retain digests without exposing source bytes',async()=>fixture({'main.ts':'export const value="SOURCE_CONTENT_SENTINEL";'},f=>{
  const capture=f.create(),receipt=JSON.stringify(capture.receipt);
  assert.equal(receipt.includes('SOURCE_CONTENT_SENTINEL'),false);assert.ok(capture.receipt.queries.every((row:any)=>/^[0-9a-f]{64}$/.test(row.sha256)));
}));

test('in-memory original source mutation invalidates exact captured identity',async()=>fixture({'main.ts':'export const value=1;'},f=>{
  const capture=f.create(),source=capture.program.getSourceFile(f.roots[0]);source.text+='\n';
  assert.throws(()=>capture.assertOriginal(),/source identity changed/);
}));


test('case-insensitive canonicalization retains pinned TypeScript Unicode behavior',async()=>fixture({'main.ts':'export const value=1;'},f=>{
  const original=ts.sys.useCaseSensitiveFileNames;ts.sys.useCaseSensitiveFileNames=false;
  try {
    const expected=ts.createCompilerHost(options,true).getCanonicalFileName,capture=f.create();
    for(const name of ['FILE.ts','İıß/FILE.ts','nested/ÜFILE.ts'])assert.equal(capture.canonicalFileName(name),expected(name));
  } finally {ts.sys.useCaseSensitiveFileNames=original;}
}));

test('a query changed after its sole capture read is rejected by the admission sweep',async()=>fixture({'main.ts':'export const value=1;'},f=>{
  const original=ts.sys.readFile;let changed=false;
  ts.sys.readFile=(file:string,...args:any[])=>{
    const text=original(file,...args);
    if(file===f.roots[0]&&!changed){changed=true;writeFileSync(file,'export const value=2;');}
    return text;
  };
  try {assert.throws(()=>f.create(),/input changed|query changed/);assert.equal(changed,true);}
  finally {ts.sys.readFile=original;}
}));

test('accessor and symbol options reject without invoking authored getters',async()=>fixture({'main.ts':'export const value=1;'},f=>{
  let calls=0;const accessor={...options};Object.defineProperty(accessor,'noCheck',{enumerable:true,get(){calls++;return false;}});
  assert.throws(()=>createCapturedCompilerProgram(f.roots,accessor),/serializable data/);assert.equal(calls,0);
  const symbol={...options,[Symbol('option')]:true};assert.throws(()=>createCapturedCompilerProgram(f.roots,symbol),/serializable data/);
}));

test('same-text parsed names types and statement order cannot change captured identity',async()=>fixture({'main.ts':'export const value:number=1; export const another=2;'},f=>{
  const capture=f.create(),source=capture.program.getSourceFile(f.roots[0]),declaration=source.statements[0].declarationList.declarations[0];
  const name=declaration.name.escapedText;declaration.name.escapedText='changed';assert.throws(()=>capture.assertOriginal(),/parsed structure changed/);declaration.name.escapedText=name;
  const kind=declaration.type.kind;declaration.type.kind=ts.SyntaxKind.StringKeyword;assert.throws(()=>capture.assertOriginal(),/parsed structure changed/);declaration.type.kind=kind;
  source.statements.reverse();assert.throws(()=>capture.assertOriginal(),/parsed structure changed/);source.statements.reverse();capture.assertOriginal();
}));


test('public checker JSX cache filling does not look like an authored syntax mutation',async()=>fixture({'main.ts':`/** @jsx localFactory */
export function localFactory(){return null;} export const value=1;`},f=>{
  const capture=f.create(),checker=capture.program.getTypeChecker(),source=capture.program.getSourceFile(f.roots[0]);
  checker.getJsxIntrinsicTagNamesAt(source);capture.assertOriginal();
}));

test('public reference directives and NodeArray syntax metadata stay bound to capture',async()=>fixture({
  'main.ts':`/// <reference path="./types.d.ts" />
export const value=1;`,
  'types.d.ts':'interface AmbientExample {value:number}',
},f=>{
  const capture=f.create(),source=capture.program.getSourceFile(f.roots[0]),reference=source.referencedFiles[0];
  const name=reference.fileName;reference.fileName='./other.d.ts';assert.throws(()=>capture.assertOriginal(),/parsed structure changed/);reference.fileName=name;
  const trailing=source.statements.hasTrailingComma;source.statements.hasTrailingComma=!trailing;assert.throws(()=>capture.assertOriginal(),/parsed structure changed/);source.statements.hasTrailingComma=trailing;
  const flags=source.statements[0].flags;source.statements[0].flags^=ts.NodeFlags.GlobalAugmentation;assert.throws(()=>capture.assertOriginal(),/parsed structure changed/);source.statements[0].flags=flags;capture.assertOriginal();
}));
