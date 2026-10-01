import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {join, dirname, relative} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {constructorCohort} from './candidate-constructor-cohort.ts';
import {rejectCallableHeritage} from './candidate-heritage.ts';

async function fixture(files: Record<string,string>, run: (value: any) => unknown) {
  const root=await mkdtemp(join(tmpdir(),'cem-constructor-cohort-'));
  try {
    for(const [file,text] of Object.entries(files)) {
      await mkdir(dirname(join(root,file)),{recursive:true});await writeFile(join(root,file),text);
    }
    const names=Object.keys(files).map(file=>join(root,file));
    const makeProgram=()=>ts.createProgram(names,{noEmit:true,strict:true,skipLibCheck:true,types:[],target:ts.ScriptTarget.ES2022,
      module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
    const program=makeProgram();program.getTypeChecker();
    const sources=names.map(name=>program.getSourceFile(name)!);
    const path=(source:any)=>relative(root,source.fileName).split('\\').join('/');
    const assertChecked=()=>assert.deepEqual(sources.flatMap(source=>[...program.getSyntacticDiagnostics(source),...program.getSemanticDiagnostics(source)])
      .filter(item=>item.category===ts.DiagnosticCategory.Error).map(item=>({code:item.code,text:ts.flattenDiagnosticMessageText(item.messageText,'\n')})),[],'Control reaches routing with valid source');
    await run({program,sources,path,makeProgram,assertChecked,select:()=>constructorCohort(program,sources,path)});
  } finally {await rm(root,{recursive:true,force:true});}
}
const factory=`export type Ctor=new(...args:any[])=>object;
export class Base {base=1;}
export function M<T extends Ctor>(Parent:T){return class extends Parent {mixed=2;};}
`;
const names=(nodes:any[])=>nodes.map(node=>node.name.text);

test('ordinary generic and overload declarations do not enter experimental composition',async()=>fixture({'main.ts':`
export class Ordinary<T=string> {
  value!:T;
  map<U>(value:U):U{return value;}
  echo(value:string):string; echo(value:number):number;
  echo(value:string|number):string|number{return value;}
}
export class Child extends Ordinary<number>{}
`},f=>{
  f.assertChecked();const result=f.select();assert.deepEqual(names(result.ordinary),['Ordinary','Child']);
  assert.deepEqual(result.roots,[]);assert.deepEqual(result.support,[]);assert.equal(result.index,undefined);
}));

test('mixed modules route callable descendants while retaining ordinary publication roots',async()=>fixture({'main.ts':factory+`
export class Ordinary {identity<T>(value:T):T{return value;}}
export class Leaf extends M(Base){}
export class Child extends Leaf{}
export class Sibling extends Base{}
`},f=>{
  const result=f.select();assert.deepEqual(names(result.roots),['Leaf','Child']);
  assert.deepEqual(names(result.ordinary),['Base','Ordinary','Sibling']);
  assert.deepEqual(new Set(names(result.support)),new Set(['Base','Leaf','Child']));
  assert.deepEqual(names(result.factories),['M']);assert.deepEqual(result.sources,f.sources);
}));

test('renamed factory and constructor aliases remain in the callable cohort',async()=>fixture({
  'base.ts':factory,
  'barrel.ts':'export {Base,M as Decorate} from "./base.js";',
  'main.ts':'import {Base,Decorate} from "./barrel.js"; const Mixed=Decorate(Base); export class Leaf extends Mixed{}; export class Child extends Leaf{};',
},f=>{
  const result=f.select();assert.deepEqual(names(result.roots),['Leaf','Child']);assert.deepEqual(names(result.factories),['M']);
  assert.equal(result.factories[0].getSourceFile(),f.sources[0]);
}));

test('routing unknown callable forms still requires successful constructor graph proof',async()=>fixture({'main.ts':factory+`
export function Unknown<T extends Ctor>(Parent:T,flag:boolean){if(flag)return class extends Parent{};return class extends Parent{};}
export class Leaf extends Unknown(Base,true){}
`},f=>{f.assertChecked();assert.throws(f.select,/CEM_UNSUPPORTED_MIXIN.*Mixin application needs one explicit constructor argument/);}));

test('same-named ordinary and mixin classes in separate modules keep separate ownership',async()=>fixture({
  'ordinary.ts':'export class Leaf {identity<T>(value:T):T{return value;}}',
  'mixed.ts':factory+'export class Leaf extends M(Base){}',
},f=>{
  const result=f.select();assert.equal(result.roots.length,1);assert.equal(result.roots[0].getSourceFile(),f.sources[1]);
  assert.equal(result.ordinary.find((node:any)=>node.name.text==='Leaf').getSourceFile(),f.sources[0]);
}));

test('cohort and selective ordinary guard refuse foreign copied duplicate or nested selections',async()=>fixture({'main.ts':factory+'export class Leaf extends M(Base){}'},f=>{
  const foreign=f.makeProgram();assert.throws(()=>constructorCohort(foreign,f.sources,f.path),/exact unique Program/);
  assert.throws(()=>constructorCohort(f.program,[...f.sources,f.sources[0]],f.path),/exact unique Program/);
  const root=f.sources[0].statements.find((node:any)=>ts.isClassDeclaration(node));
  assert.throws(()=>rejectCallableHeritage(f.program,f.sources,f.path,[{...root}]),/exact unique top-level/);
  assert.throws(()=>rejectCallableHeritage(f.program,f.sources,f.path,[root,root]),/exact unique top-level/);
  let nested:any;function visit(node:any){if(ts.isClassExpression(node))nested=node;ts.forEachChild(node,visit);}visit(f.sources[0]);
  assert.throws(()=>rejectCallableHeritage(f.program,f.sources,f.path,[nested]),/exact unique top-level/);
}));

test('cohort planning never evaluates factory or static initializer code',async()=>fixture({'main.ts':factory+`
export class Leaf extends M(Base){static{throw new Error('authored code executed');}}
`},f=>{const result=f.select();assert.deepEqual(names(result.roots),['Leaf']);assert.equal(result.qualified,false);}));

test('the default heritage guard continues rejecting callables until integration is qualified',async()=>fixture({'main.ts':factory+'export class Leaf extends M(Base){}'},f=>{
  assert.throws(()=>rejectCallableHeritage(f.program,f.sources,f.path),/CEM_UNSUPPORTED_CALLABLE_HERITAGE/);
  const base=f.sources[0].statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name.text==='Base');
  assert.doesNotThrow(()=>rejectCallableHeritage(f.program,f.sources,f.path,[base]));
}));


test('source callback failures propagate by identity even with the guard message prefix',async()=>fixture({'main.ts':'export class Base{};export class Child extends Base{}'},f=>{
  const failure=new Error('[CEM_UNSUPPORTED_CALLABLE_HERITAGE] counterfeit refusal');let calls=0;
  const path=(source:any)=>{if(++calls===1)throw failure;return f.path(source);};
  assert.throws(()=>constructorCohort(f.program,f.sources,path),(error:any)=>error===failure);
  assert.equal(calls,1,'Graph cannot consume a later successful callback result after an unrelated failure');
}));
