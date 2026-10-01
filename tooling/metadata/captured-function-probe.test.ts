import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';

const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,
  moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es2022.d.ts']};
const prefix='export type Constructor=new (...args:any[])=>{}; export interface Box<T>{value:T}; export class Base {value="base";}';
const factory='export function M<T extends Constructor>(Parent:T){return class extends Parent {};}' ;
async function fixture(code:string,run:(value:any)=>unknown,extra:Record<string,string>={}) {
  const root=await mkdtemp(join(tmpdir(),'cem-function-probe-'));
  try {
    for(const [name,text] of Object.entries({'main.ts':code,...extra})){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
    const file=join(root,'main.ts'),capture=createCapturedCompilerProgram([file],options),program=capture.program,source=program.getSourceFile(file);
    const callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name?.text==='M');
    await run({root,file,capture,program,source,callable,probe:(text:string,args:string[])=>capture.replayFunctionReturnProbe(callable,text,args)});
  }finally{await rm(root,{recursive:true,force:true});}
}
function calls(source:any){const found:any[]=[];const visit=(node:any)=>{if(ts.isCallExpression(node)&&node.expression.getText(source)==='M')found.push(node);ts.forEachChild(node,visit);};visit(source);return found;}
function instantiated(probe:any) {
  const checker=probe.program.getTypeChecker(),signatures=checker.getSignaturesOfType(checker.getTypeFromTypeNode(probe.functionProbe.signatureTypeNode),ts.SignatureKind.Call);
  assert.equal(signatures.length,1);assert.equal(signatures[0].getDeclaration()===probe.functionProbe.declaration,true,'Instantiated signature retains its private declaration');
  return {checker,signature:signatures[0],type:checker.getReturnTypeOfSignature(signatures[0])};
}
function assertArgumentIdentity(f:any,probe:any,callIndex=0) {
  const source=probe.program.getSourceFile(f.file),{checker}=instantiated(probe),signature=checker.getResolvedSignature(calls(source)[callIndex]);
  const actual=checker.getTypeArgumentsForResolvedSignature(signature)??[];
  const rendered=(probe.functionProbe.signatureTypeNode.typeArguments??[]).map((node:any)=>checker.getTypeFromTypeNode(node));
  assert.equal(actual.length,rendered.length);actual.forEach((type:any,index:number)=>assert.equal(rendered[index]===type,true,`Type argument ${index} must retain exact original-call identity`));
  return {checker,actual,signature};
}

test('function probe instantiates a private copied signature without executing module or factory code',async()=>fixture(
  prefix+factory+'export class Leaf extends M(Base){}; const executionTrap=(()=>{throw new Error("must never execute");})();',f=>{
    const probe=f.probe('Box<InstanceType<T>>',['typeof Base']),{checker,type}=instantiated(probe);
    assertArgumentIdentity(f,probe);assert.equal(checker.typeToString(type),'Box<Base>');
    assert.equal(probe.functionProbe.declaration.type.getText(),'Box<InstanceType<T>>');
    assert.equal(probe.program.getSourceFile(f.file).statements.length,f.source.statements.length+2);
    assert.equal(probe.assertUnchanged(),true);assert.equal(probe.annotationSemanticsQualified,false);
    assert.equal(probe.receipt.probeKind,'explicit-function-return');
    const originalExports=f.program.getTypeChecker().getExportsOfModule(f.program.getTypeChecker().getSymbolAtLocation(f.source)).map((s:any)=>s.name);
    const overlay=probe.program.getSourceFile(f.file),exports=checker.getExportsOfModule(checker.getSymbolAtLocation(overlay)).map((s:any)=>s.name);
    assert.deepEqual(exports,originalExports);
  }));

test('function probe accepts every resolved argument including a defaulted second parameter',async()=>fixture(
  prefix+'export function M<T extends Constructor,E="default">(Parent:T){return class extends Parent {};}; export class Leaf extends M(Base){}',f=>{
    const probe=f.probe('Box<E>',['typeof Base','"default"']);assertArgumentIdentity(f,probe);
    assert.equal(instantiated(probe).checker.typeToString(instantiated(probe).type),'Box<"default">');
    assert.throws(()=>f.probe('Box<E>',['typeof Base']),/every explicit checked type argument/);
  }));

test('function probe retains copied value-parameter scope for a nongeneric function',async()=>fixture(
  prefix+'export function M(Parent:typeof Base){return class extends Parent {};}; export class Leaf extends M(Base){}',f=>{
    const probe=f.probe('Box<typeof Parent>',[]);assertArgumentIdentity(f,probe);
    assert.equal(instantiated(probe).checker.typeToString(instantiated(probe).type),'Box<typeof Base>');
  }));

test('function probe preserves repeated original call occurrences and checks each argument independently',async()=>fixture(
  prefix+factory+'const Inner=M(Base); export class Leaf extends M(Inner){}',f=>{
    const inner=f.probe('Box<InstanceType<T>>',['typeof Base']),outer=f.probe('Box<InstanceType<T>>',['typeof Inner']);
    assertArgumentIdentity(f,inner,0);assertArgumentIdentity(f,outer,1);
    const source=outer.program.getSourceFile(f.file),{checker}=instantiated(outer),originalCalls=calls(source);
    assert.equal(originalCalls.length,2);assert.equal(originalCalls[0]!==originalCalls[1],true);
    assert.equal(checker.getResolvedSignature(originalCalls[0])!==checker.getResolvedSignature(originalCalls[1]),true);
    assert.equal(checker.getTypeArgumentsForResolvedSignature(checker.getResolvedSignature(originalCalls[0]))[0]!==checker.getTypeArgumentsForResolvedSignature(checker.getResolvedSignature(originalCalls[1]))[0],true);
  }));

test('function probe exposes identity mismatch even when a different constructor is mutually assignable',async()=>fixture(
  prefix+factory+'export class Other {value="base";} export class Leaf extends M(Base){}',f=>{
    const probe=f.probe('Box<T>',['typeof Other']),{checker}=instantiated(probe);
    const actual=checker.getTypeArgumentsForResolvedSignature(checker.getResolvedSignature(calls(probe.program.getSourceFile(f.file))[0]))[0];
    const rendered=checker.getTypeFromTypeNode(probe.functionProbe.signatureTypeNode.typeArguments[0]);
    assert.equal(checker.isTypeAssignableTo(actual,rendered),true);assert.equal(checker.isTypeAssignableTo(rendered,actual),true);
    assert.equal(actual!==rendered,true);assert.throws(()=>assertArgumentIdentity(f,probe),/Type argument 0 must retain exact original-call identity/);
  }));

test('function probe rejects constraints, declaration injection and suppression',async()=>fixture(prefix+factory,f=>{
  assert.throws(()=>f.probe('Box<T>',['number']),/no compiler errors/);
  assert.throws(()=>f.probe('Box<T>',['typeof Base; export type Injected=number']),/exactly one type expression/);
  assert.throws(()=>f.probe('Box<T>; export type Injected=number',['typeof Base']),/exactly one type expression/);
  assert.throws(()=>f.probe('Box<T>',['/* @ts-ignore */ typeof Base']),/refuses checking suppression/);
}));

test('function probe refuses unowned callable lookalikes before touching getters',async()=>fixture(prefix+factory,f=>{
  let reads=0;const forged=new Proxy({}, {get(){reads++;throw new Error('caller getter');}});
  assert.throws(()=>f.capture.replayFunctionReturnProbe(forged,'Box<T>',['typeof Base']),/exact original callable/);assert.equal(reads,0);
  assert.throws(()=>f.capture.replayFunctionReturnProbe({...f.callable},'Box<T>',['typeof Base']),/exact original callable/);
}));

test('function probe refuses new host queries and revalidates its private appended AST',async()=>fixture(prefix+factory,f=>{
  assert.throws(()=>f.probe('Box<T>',['typeof import("./unseen.js").Other']),/Unrecorded compiler host query/);
  const probe=f.probe('Box<T>',['typeof Base']);probe.functionProbe.declaration.type=probe.functionProbe.signatureTypeNode;
  assert.throws(()=>probe.assertUnchanged(),/parsed structure changed/);
},{'unseen.ts':'export class Other {}'}));


test('function probe rejects argument accessors overridden iteration and custom prototypes without invocation',async()=>fixture(prefix+factory,f=>{
  let reads=0;const trap=()=>{reads++;throw new Error('caller code');};
  const accessor=['typeof Base'];Object.defineProperty(accessor,'0',{enumerable:true,get:trap});
  const iterator=['typeof Base'];Object.defineProperty(iterator,Symbol.iterator,{value:trap});
  const some=['typeof Base'];Object.defineProperty(some,'some',{value:trap});
  const prototype=['typeof Base'];Object.setPrototypeOf(prototype,{[Symbol.iterator]:trap});
  for(const args of [accessor,iterator,some,prototype,new Array(1)])assert.throws(()=>f.probe('Box<T>',args),/plain dense data array/);
  assert.equal(reads,0);
}));
