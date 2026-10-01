import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedConstructorCompilerProgram} from './captured-compiler-program.ts';
import {projectCapturedFactoryEventType,assertCapturedEventTypeProjection} from './captured-event-type-projection.ts';

const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']};
const factory=(type='CustomEvent<{value:InstanceType<T>}>')=>`export type Constructor=new(...args:any[])=>EventTarget;
export function M<T extends Constructor>(Parent:T){return (
/** @fires {${type}} changed */
class extends Parent{});}`;
const files={'factory.ts':factory(),'base.ts':'export class Base extends EventTarget {value="actual";}','main.ts':`import {M} from './factory.js';import {Base} from './base.js';export class Leaf extends M(Base){}`};
async function fixture(input:Record<string,string>,run:(f:any)=>unknown) {
 const root=await mkdtemp(join(tmpdir(),'cem-event-projection-'));
 try {
  for(const [name,text]of Object.entries(input)){await mkdir(dirname(join(root,name)),{recursive:true});await writeFile(join(root,name),text);}
  const capture=createCapturedConstructorCompilerProgram(Object.keys(input).map(name=>join(root,name)),options),program=capture.program;
  const source=program.getSourceFile(join(root,'factory.ts')),main=program.getSourceFile(join(root,'main.ts'));
  const callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name.text==='M');let owner:any;
  const visit=(node:any)=>{if(ts.isClassExpression(node)&&ts.getJSDocTags(node).length)owner=node;ts.forEachChild(node,visit);};visit(callable);
  const tag=ts.getJSDocTags(owner).find((node:any)=>node.tagName.text==='fires'),leaf=main.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Leaf');
  const own=()=>projectCapturedFactoryEventType(program,callable,owner,tag),project=(step=2)=>projectCapturedFactoryEventType(program,callable,owner,tag,leaf,step);
  await run({root,capture,program,source,main,callable,owner,tag,leaf,own,project});
 }finally{await rm(root,{recursive:true,force:true});}
}

test('event projection retains an original generic template and substitutes its exact occurrence',async()=>fixture(files,f=>{
 const own=f.own(),result=f.project();assert.equal(own.receipt.scope,'factory-own-template');assert.match(own.receipt.type,/InstanceType<T>/);assert.equal(own.receipt.detail,undefined);
 assert.match(result.receipt.type,/InstanceType<typeof Base>/);assert.equal(result.receipt.detail,'{ value: InstanceType<typeof Base>; }');
 const comparison=f.capture.replayTypeProbe(f.main,`[${result.receipt.detail},Base]`),checker=comparison.program.getTypeChecker();
 const tuple=checker.getTypeArguments(checker.getTypeFromTypeNode(comparison.typeNode)),value=checker.getTypeOfSymbolAtLocation(tuple[0].getProperty('value'),comparison.typeNode);
 assert.equal(tuple.length,2);assert.equal(value===tuple[1],true,'Projected detail value must be the exact same-replay Base type');comparison.assertUnchanged();assert.equal(result.receipt.scope,'factory-occurrence-syntax');
 assert.equal(result.receipt.publicVisibilityChecked,false);assert.equal(result.receipt.dispatchChecked,false);assert.equal(result.receipt.finalFacetBound,false);
 assert.equal(assertCapturedEventTypeProjection(result,f.program,f.callable,f.owner,f.tag,f.leaf,2),true);
 assert.throws(()=>assertCapturedEventTypeProjection(own,f.program,f.callable,f.owner,f.tag,f.leaf,2),/Unknown captured/);
}));

test('event projection records selected public annotation references and defeats a root module homonym',async()=>fixture({
 ...files,'factory.ts':`export interface Detail<T>{data:T};${factory('CustomEvent<Detail<InstanceType<T>>>')}`,
 'main.ts':files['main.ts']+'export interface Detail<T>{decoy:T;}',
},f=>{
 const result=f.project();assert.match(result.receipt.type,/import\("\.\/factory\.js"\)\.Detail<InstanceType<typeof Base>>/);
 assert.equal(f.capture.receipt.constructorImports.some((edge:any)=>edge.from===f.main.fileName&&edge.specifier==='./factory.js'&&edge.exports.includes('Detail')),true);
 assert.equal(result.assertOriginal(),true);
}));

test('event projection substitutes the exact factory value parameter type',async()=>fixture({
 ...files,'factory.ts':factory('CustomEvent<{constructor:typeof Parent}>'),
},f=>{assert.match(f.own().receipt.type,/constructor: typeof Parent/);const result=f.project();assert.match(result.receipt.type,/constructor: typeof Base/);assert.equal(result.assertOriginal(),true);}));

test('event projection rejects an unexported cross-module free annotation alias',async()=>fixture({
 ...files,'factory.ts':`interface Hidden<T>{value:T};${factory('CustomEvent<Hidden<InstanceType<T>>>')}`,
},f=>{assert.throws(f.project,/exact captured public import edge/);assert.match(f.own().receipt.type,/Hidden<InstanceType<T>>/);}));

test('event projection certificates bind exact program owner tag root and application',async()=>fixture(files,f=>{
 const result=f.project();assert.throws(()=>assertCapturedEventTypeProjection({...result},f.program,f.callable,f.owner,f.tag,f.leaf,2),/Unknown captured/);
 assert.throws(()=>assertCapturedEventTypeProjection(result,f.program,f.callable,f.owner,f.tag,f.leaf,1),/Unknown captured/);
 assert.throws(()=>projectCapturedFactoryEventType(f.program,f.callable,{get parent(){throw Error('unowned getter ran');}},f.tag,f.leaf,2),/exact original factory owner/);
 assert.throws(()=>projectCapturedFactoryEventType({get getTypeChecker(){throw Error('unowned getter ran');}},f.callable,f.owner,f.tag),/captured/i);
}));

test('event projection refuses conditional substitution that would erase distributive semantics',async()=>fixture({
 'factory.ts':`export type Constructor=new(...args:any[])=>EventTarget;export function M<B extends Constructor,T>(Parent:B){return (
 /** @fires {CustomEvent<T extends string ? {text:T} : {other:T}>} changed */
 class extends Parent{});}`,
 'base.ts':files['base.ts'],'main.ts':`import {M} from './factory.js';import {Base} from './base.js';export class Leaf extends M<typeof Base,string|number>(Base){}`,
},f=>{assert.throws(f.project,/distributive-type adapter/);}));

test('event projection permits generic aliases that retain their own distributive binders',async()=>fixture({
 'factory.ts':`export type Constructor=new(...args:any[])=>EventTarget;export type Detail<T>=T extends string?{text:T}:{other:T};export function M<B extends Constructor,T>(Parent:B){return (
 /** @fires {CustomEvent<Detail<T>>} changed */
 class extends Parent{});}`,
 'base.ts':files['base.ts'],'main.ts':`import {M} from './factory.js';import {Base} from './base.js';export class Leaf extends M<typeof Base,string|number>(Base){}`,
},f=>{const result=f.project();assert.match(result.receipt.type,/import\("\.\/factory\.js"\)\.Detail<string \| number>/);assert.match(result.receipt.detail,/text: string/);assert.match(result.receipt.detail,/other: number/);}));

test('event projection detects original AST mutation after certification',async()=>fixture(files,f=>{
 const result=f.project();f.tag.tagName.escapedText='event';assert.throws(result.assertOriginal,/changed/);
}));


test('event projection preserves substituted string literals and captured import literal spelling',async()=>fixture({
 'factory.ts':`export type Constructor=new(...args:any[])=>EventTarget;export interface Detail<T>{value:T};export function M<B extends Constructor,T>(Parent:B){return (
 /** @fires {CustomEvent<Detail<T>>} changed */
 class extends Parent{});}`,
 'base.ts':files['base.ts'],'main.ts':`import {M} from './factory.js';import {Base} from './base.js';export class Leaf extends M<typeof Base,"literal-payload">(Base){}`,
},f=>{
 const result=f.project();assert.match(result.receipt.type,/import\("\.\/factory\.js"\)\.Detail<"literal-payload">/);
 const parsed=ts.createSourceFile('roundtrip.ts','type Check='+result.receipt.type,ts.ScriptTarget.Latest,true),node=parsed.statements[0].type.typeArguments[0];
 assert.equal(node.argument.literal.text,'./factory.js');assert.equal(node.typeArguments[0].literal.text,'literal-payload');
}));
