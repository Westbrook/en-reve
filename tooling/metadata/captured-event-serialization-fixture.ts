import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedEventCompilerProgram} from './captured-compiler-program.ts';
import {extractConstructorOrigins} from './candidate-origin-extraction.ts';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';

export const code=`export type Ctor=new(...args:any[])=>object;export class Base {id=1;}
export function M<T extends Ctor>(Parent:T){return (
/** @fires {CustomEvent<{value:InstanceType<T>}>} changed */
class extends Parent{});}export class Leaf extends M(Base){}`;
const options={strict:true,noEmit:true,skipLibCheck:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,target:ts.ScriptTarget.ES2022,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']};
export async function fixture(files:Record<string,string>,run:(f:any)=>unknown) {
 const root=await mkdtemp(join(tmpdir(),'cem-event-serialization-'));
 try {
  for(const [name,text]of Object.entries(files)){await mkdir(dirname(join(root,name)),{recursive:true});await writeFile(join(root,name),text);}
  const capture=createCapturedEventCompilerProgram(Object.keys(files).map(name=>join(root,name)),options),program=capture.program;
  assert.deepEqual(program.getSemanticDiagnostics().map((d:any)=>({code:d.code,text:ts.flattenDiagnosticMessageText(d.messageText,' ')})),[]);
  const sources=Object.keys(files).map(name=>program.getSourceFile(join(root,name))),roots=sources.flatMap(source=>source.statements.filter(ts.isClassDeclaration));
  const extract=()=>extractConstructorOrigins(program,sources,root,roots,false,undefined,capture),serialize=()=>serializeConstructorComposition(program,sources,roots,extract());
  await run({root,capture,program,sources,roots,extract,serialize});
 }finally{await rm(root,{recursive:true,force:true});}
}
export const row=(result:any,name:string,module='main.ts')=>result.manifest.modules.find((entry:any)=>entry.path===module).declarations.find((entry:any)=>entry.name===name);
