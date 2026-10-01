import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedEventCompilerProgram} from './captured-compiler-program.ts';
import {projectCapturedModuleEventType,assertCapturedModuleEventTypeProjection} from './captured-event-type-projection.ts';
import {checkCapturedModuleEventVisibility,assertCapturedModuleEventVisibility} from './captured-event-visibility.ts';
const options={strict:true,noEmit:true,skipLibCheck:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,target:ts.ScriptTarget.ES2022,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']};
const code=(type:string,extra='')=>`${extra}\n/** @fires {${type}} changed */\nexport class Base {id=1;}`;
async function fixture(files:Record<string,string>,run:(f:any)=>unknown,selected=Object.keys(files)) {
 const root=await realpath(await mkdtemp(join(tmpdir(),'cem-module-event-')));
 try {
  for(const [name,text]of Object.entries(files)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
  const capture=createCapturedEventCompilerProgram(selected.map(name=>join(root,name)),options),program=capture.program,source=program.getSourceFile(join(root,'main.ts'));
  assert.deepEqual(program.getSemanticDiagnostics().map((d:any)=>({code:d.code,text:ts.flattenDiagnosticMessageText(d.messageText,' ')})),[]);
  const owner=source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Base'),tag=ts.getJSDocTags(owner).find((node:any)=>node.tagName.text==='fires');
  await run({root,capture,program,source,owner,tag,project:()=>projectCapturedModuleEventType(program,owner,tag),visible:()=>checkCapturedModuleEventVisibility(program,owner,tag)});
 }finally{await rm(root,{recursive:true,force:true});}
}

test('captured module event projects typed details with an exact nongeneric owner',async()=>fixture({'main.ts':code('CustomEvent<{value:string}>')},f=>{
 const result=f.project(),visibility=f.visible();assert.equal(result.receipt.scope,'module-event-syntax');assert.equal(result.receipt.detail,'{ value: string; }');assert.equal(visibility.receipt.scope,'module-event-visibility');
 assert.equal(assertCapturedModuleEventTypeProjection(result,f.program,f.owner,f.tag),true);assert.equal(assertCapturedModuleEventVisibility(visibility,f.program,f.owner,f.tag),true);
}));
test('captured module event imports retain public original ownership and portable detail text',async()=>fixture({'types.ts':'export interface Detail {value:string}','main.ts':code('CustomEvent<import("./types.js").Detail>')},f=>{
 const probe=f.capture.replayTypeProbe(f.source,'CustomEvent<import("./types.js").Detail>'),checker=probe.program.getTypeChecker(),type=checker.getTypeFromTypeNode(probe.typeNode);
 const raw=checker.typeToString(checker.getTypeOfSymbolAtLocation(type.getProperty('detail'),probe.typeNode),probe.typeNode,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseFullyQualifiedType);
 assert.equal(raw,'import("./types.js").Detail');
 assert.equal(f.capture.eventPrintedImportReference(join(f.root,'types'),'Detail',f.source),'import("./types.js").Detail');
 const result=f.project();f.visible();assert.equal(result.receipt.detail,'import("./types.js").Detail');assert.equal(result.receipt.type,'CustomEvent<import("./types.js").Detail>');assert.doesNotMatch(result.receipt.detail,/import\(["']\//);
}));
test('captured module event relocates a base contract into an exact mixed consumer root',async()=>fixture({
 'types.ts':'export interface Detail {value:string}',
 'main.ts':code('CustomEvent<import("./types.js").Detail>')+'export function M<T extends new(...args:any[])=>object>(Parent:T){return class extends Parent{};}',
 'nested/consumer.ts':'import {M,Base} from "../main.js";export class Consumer extends M(Base){}',
 'unrelated.ts':'export class Unrelated {}'
},f=>{
 const output=f.program.getSourceFile(join(f.root,'nested/consumer.ts')),target=output.statements.find(ts.isClassDeclaration),symbol=f.capture.annotationImportSymbol('./types.js','Detail',f.source);
 assert.ok(symbol);assert.equal(f.capture.annotationImportReference(symbol,output),'import("../types.js").Detail');
 assert.equal(f.capture.annotationImportReference(symbol,f.program.getSourceFile(join(f.root,'unrelated.ts'))),undefined);
 assert.ok(f.capture.receipt.eventAnnotationImports.some((edge:any)=>edge.from===f.source.fileName&&edge.specifier==='./types.js'&&edge.name==='Detail'&&edge.output===output.fileName&&edge.outputSpecifier==='../types.js'&&edge.target===join(f.root,'types.ts')));
 const result=projectCapturedModuleEventType(f.program,f.owner,f.tag,target);
 assert.equal(result.receipt.type,'CustomEvent<import("../types.js").Detail>');assert.equal(result.receipt.detail,'import("../types.js").Detail');f.visible();
}));
test('captured module event visibility retains hidden aliases before semantic erasure',async()=>fixture({'main.ts':code('CustomEvent<Hidden>','type Hidden=string;')},f=>{
 f.project();assert.throws(f.visible,/unexported type/);
}));
test('captured module event rejects forged certificates roots and original AST mutation',async()=>fixture({'main.ts':code('CustomEvent<string>')},f=>{
 const result=f.project(),visibility=f.visible();assert.throws(()=>assertCapturedModuleEventTypeProjection({...result},f.program,f.owner,f.tag),/Unknown module/);
 assert.throws(()=>assertCapturedModuleEventVisibility({...visibility},f.program,f.owner,f.tag),/Unknown module/);
 let reads=0;const fake=new Proxy({}, {get(){reads++;throw Error('fake getter');}});assert.throws(()=>projectCapturedModuleEventType(f.program,f.owner,f.tag,fake),/exact nongeneric selected root/);assert.equal(reads,0);
 f.owner.name.escapedText='Changed';assert.throws(result.assertOriginal,/changed/);assert.throws(visibility.assertOriginal,/changed/);
}));
test('captured module event leaves generic consuming contexts explicitly unsupported',async()=>fixture({'main.ts':code('CustomEvent<string>').replace('class Base {','class Base<T> {')},f=>assert.throws(f.project,/nongeneric/)));

test('captured module event rejects loaded but unselected owners before reading caller properties',async()=>fixture({
 'loaded.ts':code('CustomEvent<string>'),
 'main.ts':'import {Base as Loaded} from "./loaded.js";'+code('CustomEvent<number>')+'export const value=Loaded;'
},f=>{
 const owner=f.program.getSourceFile(join(f.root,'loaded.ts')).statements.find(ts.isClassDeclaration),tag=ts.getJSDocTags(owner)[0];
 assert.throws(()=>projectCapturedModuleEventType(f.program,owner,tag,f.owner),/exact selected owner/);
 assert.throws(()=>checkCapturedModuleEventVisibility(f.program,owner,tag),/exact selected owner/);
 let reads=0;const fake=new Proxy({}, {get(){reads++;throw Error('fake getter');}});
 assert.throws(()=>projectCapturedModuleEventType(f.program,fake,tag,f.owner),/exact selected owner/);assert.throws(()=>checkCapturedModuleEventVisibility(f.program,fake,tag),/exact selected owner/);assert.equal(reads,0);
},['main.ts']));

test('captured module event projects typed platform unions and rejects a non-event branch',async()=>{
 await fixture({'main.ts':code('Notice','export type Notice=CustomEvent<string>|CustomEvent<number>;')},f=>{const result=f.project();assert.equal(result.receipt.type,'Notice');assert.match(result.receipt.detail,/string/);assert.match(result.receipt.detail,/number/);f.visible();});
 await fixture({'main.ts':code('CustomEvent<string>|Event')},f=>assert.throws(f.project,/platform CustomEvent detail/));
});
