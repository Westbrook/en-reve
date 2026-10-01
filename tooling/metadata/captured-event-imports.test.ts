import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedEventCompilerProgram,createCapturedConstructorCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics,checkCapturedAnnotationScope,capturedModuleAnnotationSemantics} from './captured-annotation-scope.ts';
import {projectCapturedFactoryEventType} from './captured-event-type-projection.ts';
const options={strict:true,noEmit:true,skipLibCheck:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,target:ts.ScriptTarget.ES2022,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']};
const factory=(type:string,imports='')=>`${imports}
export type Ctor=new(...args:any[])=>object;export class Base {value=1;}
export function M<T extends Ctor>(Parent:T){return (
/** @fires {${type}} changed */
class extends Parent{});}export class Leaf extends M(Base){}`;
async function fixture(files:Record<string,string>,run:(f:any)=>unknown) {
 const root=await realpath(await mkdtemp(join(tmpdir(),'cem-event-imports-')));
 try {
  for(const [name,text]of Object.entries(files)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
  const roots=Object.keys(files).filter(name=>!name.startsWith('node_modules/')).map(name=>join(root,name));
  const capture=createCapturedEventCompilerProgram(roots,options),program=capture.program;
  assert.deepEqual(program.getSemanticDiagnostics().map((d:any)=>({code:d.code,text:ts.flattenDiagnosticMessageText(d.messageText,' ')})),[]);
  const source=program.getSourceFile(join(root,'main.ts')),callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name.text==='M');let owner:any;
  if(callable){const visit=(node:any)=>{if(ts.isClassExpression(node)&&ts.getJSDocTags(node).length)owner=node;ts.forEachChild(node,visit);};visit(callable);}
  else owner=source.statements.find(ts.isClassDeclaration);
  const tag=ts.getJSDocTags(owner).find((node:any)=>node.tagName.text==='fires');
  await run({root,roots,capture,program,source,callable,owner,tag,check:()=>checkCapturedFactoryAnnotationScope(program,callable,owner,tag)});
 }finally{await rm(root,{recursive:true,force:true});}
}
const localFiles={'types.ts':'export interface Detail {value:string}', 'main.ts':factory('CustomEvent<import("./types.js").Detail>')};

test('captured event import retains an exact selected original module symbol',async()=>fixture(localFiles,f=>{
 const proof=f.check(),semantic=capturedFactoryAnnotationSemantics(proof,f.program,f.callable,f.owner,f.tag);
 assert.ok(proof.receipt.references.some((row:any)=>row.binding==='captured-import'));assert.equal(semantic.type.getProperty('detail').name,'detail');
 const original=f.program.getTypeChecker().getSymbolAtLocation(f.program.getSourceFile(join(f.root,'types.ts')).statements[0].name);
 assert.equal(f.capture.annotationImportSymbol('./types.js','Detail',f.source)===original,true);assert.ok(f.capture.receipt.eventAnnotationImports.length);
}));
test('captured module annotation imports use the same closed identity checks',async()=>fixture({'types.ts':'export type Detail={value:number};','main.ts':'/** @fires {CustomEvent<import("./types.js").Detail>} changed */\nexport class Base {}'},f=>{
 const proof=checkCapturedAnnotationScope(f.program,f.owner,f.tag),semantic=capturedModuleAnnotationSemantics(proof,f.program,f.owner,f.tag);assert.equal(semantic.type.getProperty('detail').name,'detail');
 assert.throws(()=>capturedModuleAnnotationSemantics({...proof},f.program,f.owner,f.tag),/Unknown annotation/);
}));
test('captured event import binds a loaded public package without substituting a local homonym',async()=>fixture({
 'node_modules/public-types/package.json':'{"name":"public-types","version":"1.0.0","type":"module","exports":{".":{"types":"./index.d.ts","default":"./index.js"}}}',
 'node_modules/public-types/index.d.ts':'export type Notice<T>=CustomEvent<{data:T}>;',
 'node_modules/public-types/index.js':'export {};',
 'main.ts':factory('import("public-types").Notice<InstanceType<T>>','import type {Notice as Loaded} from "public-types";export type Notice<T>=CustomEvent<number>;')
},f=>{
 const own=projectCapturedFactoryEventType(f.program,f.callable,f.owner,f.tag);assert.match(own.receipt.type,/import\("public-types"\)\.Notice/);assert.ok(own.receipt.references.some((row:any)=>row.kind==='captured-import'));
}));
test('captured event import records relocation edges only when output resolves to the same module and export',async()=>fixture({
 'types.ts':'export interface Detail {value:string}',
 'main.ts':factory('CustomEvent<import("./types.js").Detail>'),
 'nested/consumer.ts':'import {M,Base} from "../main.js";export class Consumer extends M(Base){}'
},f=>{
 f.check();const symbol=f.capture.annotationImportSymbol('./types.js','Detail',f.source),output=f.program.getSourceFile(join(f.root,'nested/consumer.ts'));
 assert.equal(f.capture.annotationImportReference(symbol,output),'import("../types.js").Detail');
}));
test('captured event import refuses a private unexported target',async()=>fixture({'types.ts':'type Detail=string;export {};','main.ts':factory('CustomEvent<import("./types.js").Detail>')},f=>{
 const message=`Captured original/replay Program must have no compiler errors: 2694: Namespace '"${join(f.root,'types')}"' has no exported member 'Detail'.`;
 assert.throws(f.check,{name:'Error',message});
}));
test('constructor-only capture retains the old import-type refusal boundary',async()=>fixture(localFiles,f=>{
 const capture=createCapturedConstructorCompilerProgram(f.roots,options),source=capture.program.getSourceFile(join(f.root,'main.ts')),callable=source.statements.find(ts.isFunctionDeclaration);let owner:any;
 const visit=(node:any)=>{if(ts.isClassExpression(node)&&ts.getJSDocTags(node).length)owner=node;ts.forEachChild(node,visit);};visit(callable);
 assert.equal(capture.annotationImportSymbol,undefined);assert.throws(()=>checkCapturedFactoryAnnotationScope(capture.program,callable,owner,ts.getJSDocTags(owner)[0]),/separate lexical/);
}));
test('captured event import rejects forged scopes before reading their properties and original AST changes',async()=>fixture(localFiles,f=>{
 const proof=f.check();let reads=0;const fake=new Proxy({}, {get(){reads++;throw Error('fake getter');}});
 assert.throws(()=>f.capture.annotationImportSymbol('./types.js','Detail',fake),/exact selected scope/);assert.equal(reads,0);
 f.tag.tagName.escapedText='event';assert.throws(proof.assertOriginal,/changed/);
}));
test('captured event import cannot fabricate an original symbol for an unloaded package declaration',async()=>fixture({
 'node_modules/public-types/package.json':'{"name":"public-types","version":"1.0.0","type":"module","types":"./index.d.ts"}',
 'node_modules/public-types/index.d.ts':'export type Detail=string;',
 'main.ts':factory('CustomEvent<import("public-types").Detail>')
},f=>{
 assert.equal(f.program.getSourceFile(join(f.root,'node_modules/public-types/index.d.ts')),undefined);assert.throws(f.check,/captured|uncaptured|original|query/i);
}));

test('printed event import rejects ambiguous loaded source stems before considering captured edges',async()=>fixture({
 'types.ts':'export interface Detail {value:string}',
 'types.d.ts':'export interface Detail {other:number}',
 'main.ts':factory('CustomEvent<import("./types.js").Detail>')
},f=>{
 assert.ok(f.program.getSourceFile(join(f.root,'types.ts')));assert.ok(f.program.getSourceFile(join(f.root,'types.d.ts')));
 const symbol=f.capture.annotationImportSymbol('./types.js','Detail',f.source);assert.equal(f.capture.annotationImportReference(symbol,f.source),'import("./types.js").Detail');
 assert.throws(()=>f.capture.eventPrintedImportReference(join(f.root,'types'),'Detail',f.source),/unique original source module/);
}));

test('appended event probe reverse node mapping requires exact owned identities and mutation guards',async()=>fixture(localFiles,f=>{
 const probe=f.capture.replayTypeProbe(f.source,'CustomEvent<string>'),node=probe.mapReplayNode(f.callable);
 assert.equal(probe.mapOriginalNode(node)===f.callable,true);assert.equal(probe.mapReplayNode(f.source)===probe.program.getSourceFile(f.source.fileName),true);
 let reads=0;const fake=new Proxy({}, {get(){reads++;throw Error('fake getter');}});assert.throws(()=>probe.mapReplayNode(fake),/exact original node/);assert.equal(reads,0);
 node.name.escapedText='Changed';assert.throws(()=>probe.mapReplayNode(f.callable),/changed/);
}));


test('appended event probe maps exact anonymous class symbols without admitting lookalikes or synthetic declarations',async()=>fixture(localFiles,f=>{
 const probe=f.capture.replayTypeProbe(f.source,'CustomEvent<string>'),replay=probe.mapReplayNode(f.owner),checker=probe.program.getTypeChecker(),original=f.program.getTypeChecker();
 const keyword=(node:any)=>node.getChildren(node.getSourceFile()).find((child:any)=>child.kind===ts.SyntaxKind.ClassKeyword&&child.parent===node);
 assert.equal(f.owner.name===undefined,true);assert.equal(replay.name===undefined,true);
 assert.equal(original.getSymbolAtLocation(f.owner)===undefined,true,'precondition: anonymous declaration is not its public symbol location');assert.equal(checker.getSymbolAtLocation(replay)===undefined,true);
 const originalSymbol=original.getSymbolAtLocation(keyword(f.owner)),replaySymbol=checker.getSymbolAtLocation(keyword(replay));
 assert.ok(originalSymbol);assert.ok(replaySymbol);assert.equal(originalSymbol.declarations.length,1);assert.equal(originalSymbol.declarations[0]===f.owner,true);assert.equal(replaySymbol.declarations.length,1);assert.equal(replaySymbol.declarations[0]===replay,true);
 assert.equal(probe.mapOriginalSymbol(replaySymbol)===originalSymbol,true);assert.equal(probe.mapOriginalSymbols([replaySymbol,replaySymbol]).every((symbol:any)=>symbol===originalSymbol),true);
 assert.throws(()=>probe.mapOriginalSymbol({...replaySymbol}),/exact overlay symbol/);
 assert.throws(()=>probe.mapOriginalSymbol(originalSymbol),/exact overlay node/);
 const synthetic=checker.getSymbolAtLocation(probe.typeNode.parent.name);assert.throws(()=>probe.mapOriginalSymbol(synthetic),/Synthetic probe declarations/);
 const callable=probe.mapReplayNode(f.callable);callable.name.escapedText='Changed';assert.throws(()=>probe.mapOriginalSymbol(replaySymbol),/changed/);
}));
