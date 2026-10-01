import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram,createCapturedConstructorCompilerProgram,createCapturedEventCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedAuthorizedFactoryEventDispatch,assertCapturedAuthorizedFactoryEventDispatch} from './captured-authorized-factory-event-dispatch.ts';
const options={strict:true,noEmit:true,skipLibCheck:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,target:ts.ScriptTarget.ES2022,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']};
const code=`import {dispatchAction} from '@en-reve/primitives/interactions/events.js';
export type Constructor=new(...args:any[])=>EventTarget;export class Base extends EventTarget{};
export function M<T extends Constructor>(Parent:T){return (
/** @fires {CustomEvent<{action:"choose";data:InstanceType<T>}>} en-action */
class extends Parent {send(value:InstanceType<T>){dispatchAction(this,{action:"choose",data:value});}});}export class Leaf extends M(Base){}`;
async function fixture(run:(f:any)=>unknown,change:(files:any)=>void=()=>{}) {
 const root=await mkdtemp(join(tmpdir(),'cem-helper-policy-'));
 try {
  const files:any={};for(const name of ['events.js','events.d.ts','package.json'])files[name]=await readFile(new URL('./fixtures/dispatch-helper-policy/'+name,import.meta.url),'utf8');change(files);
  const packageRoot=join(root,'node_modules/@en-reve/primitives');await mkdir(join(packageRoot,'dist/interactions'),{recursive:true});
  for(const name of ['events.js','events.d.ts'])await writeFile(join(packageRoot,'dist/interactions',name),files[name]);await writeFile(join(packageRoot,'package.json'),files['package.json']);
  const path=join(root,'main.ts');await writeFile(path,code);
  const create=(overrides={})=>createCapturedEventCompilerProgram([path],{...options,...overrides});
  await run({root,path,packageRoot,files,create});
 }finally{await rm(root,{recursive:true,force:true});}
}
function bindings(capture:any,path:string) {
 const program=capture.program,source=program.getSourceFile(path),callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name.text==='M');
 let owner:any;const visit=(node:any)=>{if(ts.isClassExpression(node)&&ts.getJSDocTags(node).length)owner=node;ts.forEachChild(node,visit);};visit(callable);
 const tag=ts.getJSDocTags(owner).find((node:any)=>node.tagName.text==='fires'),helper=program.getSourceFiles().find((node:any)=>node.fileName.endsWith('/dist/interactions/events.d.ts'));
 return{program,source,callable,owner,tag,helper,check:()=>checkCapturedAuthorizedFactoryEventDispatch(program,callable,owner,tag,helper)};
}

test('factory helper policy binds the exact package declaration and reviewed runtime implementation',async()=>fixture(f=>{
 const capture=f.create(),b=bindings(capture,f.path),policy=capture.dispatchHelperPolicy(b.helper);
 assert.equal(policy.packageName,'@en-reve/primitives');assert.equal(policy.helpers.length,3);assert.equal(capture.receipt.dispatchHelperPolicy.edges.length,1);
 const result=b.check();assert.equal(result.receipt.helperPackagePolicyBound,true);assert.equal(result.receipt.dispatch.checkedCalls.length,1);assert.equal(result.receipt.publicVisibilityChecked,false);
 assert.equal(assertCapturedAuthorizedFactoryEventDispatch(result,b.program,b.callable,b.owner,b.tag,b.helper),true);
 assert.throws(()=>assertCapturedAuthorizedFactoryEventDispatch({...result},b.program,b.callable,b.owner,b.tag,b.helper),/Unknown implementation-bound/);
}));

test('factory helper policy rejects changed runtime behavior and declaration copies',async()=>{
 for(const name of ['events.js','events.d.ts'])await fixture(f=>assert.throws(f.create,/runtime or declaration policy changed/),files=>{files[name]+='\n// altered artifact\n';});
});

test('factory helper policy rejects competing package export branches',async()=>fixture(f=>assert.throws(f.create,/package export policy changed/),files=>{
 const pkg=JSON.parse(files['package.json']);pkg.exports['./interactions/events.js']={types:'./dist/interactions/events.d.ts',default:'./dist/interactions/events.js'};files['package.json']=JSON.stringify(pkg);
}));

test('factory helper authority rejects caller source lookalikes and ordinary uncaptured policy',async()=>fixture(f=>{
 const capture=f.create(),b=bindings(capture,f.path);let reads=0;const foreign=new Proxy({}, {get(){reads++;throw Error('foreign getter');}});
 assert.throws(()=>capture.dispatchHelperPolicy(foreign),/exact helper source/);assert.equal(reads,0);
 for(const create of [createCapturedCompilerProgram,createCapturedConstructorCompilerProgram]) {
  const ordinary=create([f.path],options),other=bindings(ordinary,f.path);assert.throws(other.check,/requires captured helper implementation policy/);
 }
}));

test('factory helper policy freezes replay artifacts and detects live package or runtime changes',async()=>fixture(async f=>{
 const capture=f.create(),b=bindings(capture,f.path),prior=capture.dispatchHelperPolicy(b.helper);await writeFile(join(f.packageRoot,'dist/interactions/events.js'),f.files['events.js']+'\n// changed live\n');
 assert.throws(()=>capture.revalidate(),/Captured compiler query changed/);assert.deepEqual(capture.dispatchHelperPolicy(b.helper),prior);
 // Frozen identity is not a claim that live inputs remain current; the final
 // generator must explicitly revalidate its captured inputs before publication.
 assert.equal(capture.receipt.dispatchHelperPolicy.policies[0].runtimeSha256,prior.runtimeSha256);
}));


test('event capture refuses TypeScript paths shadowing a different runtime package',async()=>fixture(async f=>{
 const shadow=join(f.root,'shadow/node_modules/@en-reve/primitives');await mkdir(join(shadow,'dist/interactions'),{recursive:true});
 for(const name of ['events.js','events.d.ts'])await writeFile(join(shadow,'dist/interactions',name),f.files[name]);await writeFile(join(shadow,'package.json'),f.files['package.json']);
 await writeFile(join(f.packageRoot,'dist/interactions/events.js'),'export function dispatchAction(){}');
 const overrides={paths:{'@en-reve/primitives/interactions/events.js':[join(shadow,'dist/interactions/events.d.ts')]}};
 assert.throws(()=>f.create(overrides),/runtime resolution options require a separate adapter/);
}));

test('event capture refuses nested CommonJS scopes and escaped runtime artifact symlinks',async()=>{
 await fixture(async f=>{await writeFile(join(f.packageRoot,'dist/package.json'),' {"type":"commonjs"} ');assert.throws(f.create,/nested runtime package scope/);});
 await fixture(async f=>{
  const runtime=join(f.packageRoot,'dist/interactions/events.js'),outside=join(f.root,'outside.js');await writeFile(outside,f.files['events.js']);await rm(runtime);await symlink(outside,runtime);
  assert.throws(f.create,/artifact physical owner changed/);
 });
});

test('constructor-only capture does not impose event helper implementation policy',async()=>fixture(f=>{
 const capture=createCapturedConstructorCompilerProgram([f.path],options);assert.equal(capture.dispatchHelperPolicy,undefined);
 assert.equal(capture.receipt.dispatchHelperPolicy,undefined);capture.revalidate();
},files=>{files['events.js']+='\n// event implementation changed\n';}));


test('event capture refuses nearer runtime package directories without package metadata',async()=>fixture(async f=>{
 const nested=join(f.root,'nested'),shadow=join(nested,'node_modules/@en-reve/primitives/interactions');await mkdir(shadow,{recursive:true});
 await writeFile(join(shadow,'events.js'),'export function dispatchAction(){}');const path=join(nested,'main.ts');await writeFile(path,code);
 assert.throws(()=>createCapturedEventCompilerProgram([path],options),/nearer runtime package has no authorized package policy|exact package declaration owner/);
}));
