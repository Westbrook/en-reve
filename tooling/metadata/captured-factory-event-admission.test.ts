import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,rm,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedEventCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryEventAdmission,assertCapturedFactoryEventAdmission} from './captured-factory-event-admission.ts';
const options={strict:true,noEmit:true,skipLibCheck:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,target:ts.ScriptTarget.ES2022,types:[],lib:['lib.es2022.d.ts','lib.dom.d.ts']};
const code=(tags:string,body:string,imports='')=>`${imports}
export type Constructor=new(...args:any[])=>EventTarget;export class Base extends EventTarget{};
export function M<T extends Constructor>(Parent:T){return (
/** ${tags} */
class extends Parent {${body}});}export class Leaf extends M(Base){}`;
async function fixture(sourceText:string,run:(f:any)=>unknown) {
 const root=await realpath(await mkdtemp(join(tmpdir(),'cem-factory-admission-')));
 try {
  const packageRoot=join(root,'node_modules/@en-reve/primitives');await mkdir(join(packageRoot,'dist/interactions'),{recursive:true});
  for(const name of ['events.js','events.d.ts','package.json']) {
   const text=await readFile(new URL('./fixtures/dispatch-helper-policy/'+name,import.meta.url),'utf8');
   await writeFile(join(packageRoot,name==='package.json'?name:'dist/interactions/'+name),text);
  }
  const path=join(root,'main.ts');await writeFile(path,sourceText);const capture=createCapturedEventCompilerProgram([path],options),program=capture.program,source=program.getSourceFile(path);
  assert.deepEqual(program.getSemanticDiagnostics().map((d:any)=>({code:d.code,text:ts.flattenDiagnosticMessageText(d.messageText,' ')})),[]);
  const callable=source.statements.find((node:any)=>ts.isFunctionDeclaration(node)&&node.name.text==='M');let owner:any;
  const visit=(node:any)=>{if(ts.isClassExpression(node)&&node.heritageClauses?.length)owner=node;ts.forEachChild(node,visit);};visit(callable);
  const check=()=>checkCapturedFactoryEventAdmission(program,callable,owner);await run({capture,program,source,callable,owner,check});
 }finally{await rm(root,{recursive:true,force:true});}
}
const tags='@fires {CustomEvent<{action:"choose";data:InstanceType<T>}>} en-action';
const helper='send(value:InstanceType<T>){Events.dispatchAction(this,{action:"choose",data:value});}';
const imports="import * as Events from '@en-reve/primitives/interactions/events.js';";

test('factory event admission joins namespace helper calls with captured runtime policy',async()=>fixture(code(tags,helper,imports),f=>{
 const result=f.check();assert.equal(result.receipt.helperImplementationBound,true);assert.equal(result.receipt.policy.packageName,'@en-reve/primitives');assert.equal(result.receipt.emissions.length,1);assert.equal(result.receipt.unclassifiedEmissions,0);
 const tag=ts.getJSDocTags(f.owner)[0];assert.equal(result.event(tag).receipt.checkedCalls.length,1);assert.equal(assertCapturedFactoryEventAdmission(result,f.program,f.callable,f.owner),true);
}));
test('factory event admission supports direct platform emissions without a helper import',async()=>fixture(code('@fires {CustomEvent<null>} changed','send(){this.dispatchEvent(new CustomEvent("changed"));}'),f=>{
 const result=f.check();assert.equal(result.receipt.policy,null);assert.equal(result.receipt.emissions.length,1);assert.equal(result.receipt.arbitraryFlowQualified,false);
}));
test('factory event admission refuses undocumented and differently documented emissions',async()=>{
 for(const docs of ['', '@fires {CustomEvent<null>} different'])await fixture(code(docs,'send(){this.dispatchEvent(new CustomEvent("changed"));}'),f=>assert.throws(f.check,/no complete supported source contract|Unclassified factory event/));
});
test('factory event admission refuses dispatch aliases even without an event annotation',async()=>fixture(code('','send(){const fire=this.dispatchEvent;return fire;}'),f=>assert.throws(f.check,/reference escapes/)));
test('factory event admission rejects same-name local helper impostors',async()=>fixture(code(tags,'send(value:InstanceType<T>){dispatchAction(this,{action:"choose",data:value});}','function dispatchAction(target:EventTarget,detail:object){}'),f=>assert.throws(f.check,/no captured implementation owner/)));
test('factory event admission covers captured notification helpers with literal names and exact detail',async()=>fixture(code('@fires {CustomEvent<{status:"loaded"}>} ready','send(){Events.dispatchNotification(this,"ready",{status:"loaded"});}',imports),f=>{
 const result=f.check();assert.equal(result.receipt.emissions[0].helper,'dispatchNotification');assert.equal(result.receipt.emissions[0].eventName,'ready');
}));
test('factory event admission requires a distinct checked contract for every emitted name',async()=>fixture(code('@fires {CustomEvent<null>} one\n * @fires {CustomEvent<null>} two','send(){this.dispatchEvent(new CustomEvent("one"));this.dispatchEvent(new CustomEvent("two"));}'),f=>{
 const result=f.check();assert.deepEqual(result.receipt.declaredEvents,['one','two']);assert.equal(result.receipt.emissions.length,2);
}));
test('factory event admission refuses duplicate tags and preserves zero-emission declarations',async()=>{
 await fixture(code('@fires {CustomEvent<null>} changed\n * @fires {CustomEvent<null>} changed',''),f=>assert.throws(f.check,/Duplicate original/));
 await fixture(code('',''),f=>{const result=f.check();assert.deepEqual(result.receipt.declaredEvents,[]);assert.deepEqual(result.receipt.emissions,[]);});
});
test('factory event admission refuses forged bindings before property access and invalidates source mutation',async()=>fixture(code(tags,helper,imports),f=>{
 const result=f.check();assert.throws(()=>assertCapturedFactoryEventAdmission({...result},f.program,f.callable,f.owner),/Unknown factory/);
 let reads=0;const forged=new Proxy({}, {get(){reads++;throw Error('forged getter');}});assert.throws(()=>checkCapturedFactoryEventAdmission(f.program,f.callable,forged),/exact original class/);assert.equal(reads,0);
 f.callable.name.escapedText='Changed';assert.throws(result.assertOriginal,/changed/);
}));


test('factory notification admission rejects mismatched detail and dynamic event names',async()=>{
 await fixture(code('@fires {CustomEvent<{status:"loaded"}>} ready','send(){Events.dispatchNotification(this,"ready",{status:"failed"});}',imports),f=>assert.throws(f.check,/disagrees/));
 await fixture(code('@fires {CustomEvent<{status:"loaded"}>} ready','send(name:string){Events.dispatchNotification(this,name,{status:"loaded"});}',imports),f=>assert.throws(f.check,/Dynamic dispatch/));
});
