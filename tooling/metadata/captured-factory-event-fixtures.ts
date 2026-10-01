import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryEventDispatch} from './captured-factory-event-dispatch.ts';
const helpers=`export declare function dispatchChange(target:EventTarget,payload:object,options?:object):void;
export declare function dispatchAction(target:EventTarget,payload:object,options?:object):void;
export declare function dispatchDraftInput(target:EventTarget,payload:object,options?:object):void;`;
const prefix=`import {dispatchAction,dispatchChange,dispatchDraftInput} from './helpers.js';import * as Events from './helpers.js';
export type Constructor=new(...args:any[])=>EventTarget;export class Base extends EventTarget{};export type T=number;`;
const factory=(type:string,body:string,local='')=>`${prefix}export function M<T extends Constructor>(Parent:T){${local}return (
/** @fires {${type}} en-action */
class extends Parent {${body}});}export class Leaf extends M(Base){}`;
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']};
async function fixture(code:string,run:(f:any)=>unknown) {
 const root=await mkdtemp(join(tmpdir(),'cem-factory-event-'));
 try {
  const path=join(root,'main.ts'),helperPath=join(root,'helpers.ts');await writeFile(path,code);await writeFile(helperPath,helpers);
  const capture=createCapturedCompilerProgram([path,helperPath],options),program=capture.program,source=program.getSourceFile(path),helperSource=program.getSourceFile(helperPath);
  const callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name?.text==='M'),leaf=source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');let owner:any;
  const find=(node:any)=>{if((ts.isClassExpression(node)||ts.isClassDeclaration(node))&&ts.getJSDocTags(node).length)owner=node;ts.forEachChild(node,find);};find(callable);
  const tag=ts.getJSDocTags(owner).find((tag:any)=>tag.tagName.text==='fires'),check=()=>checkCapturedFactoryEventDispatch(program,callable,owner,tag,helperSource);
  await run({capture,program,source,callable,leaf,owner,tag,helperSource,check});
 }finally{await rm(root,{recursive:true,force:true});}
}
const event='CustomEvent<{action:"choose";data:InstanceType<T>}>';
const valid='send(value:InstanceType<T>){Events.dispatchAction(this,{action:"choose",data:value});}';

export {factory,fixture,event,valid};
