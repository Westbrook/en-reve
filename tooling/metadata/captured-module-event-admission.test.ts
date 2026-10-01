import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedEventCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedModuleEventAdmission,assertCapturedModuleEventAdmission,assertCapturedFactoryEventAdmission} from './captured-factory-event-admission.ts';
const code=(type:string,body:string)=>`/** @fires {${type}} changed */\nexport class Owner extends EventTarget{${body}}`;
async function fixture(text:string,run:(f:any)=>unknown){
 const root=await realpath(await mkdtemp(join(tmpdir(),'cem-module-admission-')));
 try{const file=join(root,'main.ts');await writeFile(file,text);const capture=createCapturedEventCompilerProgram([file],{strict:true,noEmit:true,skipLibCheck:true,types:[],target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,lib:['lib.es2022.d.ts','lib.dom.d.ts']}),program=capture.program,owner=program.getSourceFile(file).statements.find(ts.isClassDeclaration);
 assert.deepEqual(program.getSemanticDiagnostics().map((d:any)=>({code:d.code,text:ts.flattenDiagnosticMessageText(d.messageText,' ')})),[]);await run({program,owner,check:()=>checkCapturedModuleEventAdmission(program,owner)});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('module admission checks compatible direct detail in its annotation replay checker',async()=>fixture(code('CustomEvent<string|number>','send(){this.dispatchEvent(new CustomEvent("changed",{detail:1}));}'),f=>{
 const result=f.check();assert.equal(result.receipt.scope,'supported-owned-module-emissions');assert.equal(result.receipt.emissions.length,1);assert.equal(assertCapturedModuleEventAdmission(result,f.program,f.owner),true);
}));
test('module admission rejects mismatched direct details and nested unchecked payloads',async()=>{
 await fixture(code('CustomEvent<string>','send(){this.dispatchEvent(new CustomEvent("changed",{detail:1}));}'),f=>assert.throws(f.check,/disagrees/));
 await fixture(code('CustomEvent<{value:string}>','send(value:any){this.dispatchEvent(new CustomEvent("changed",{detail:{value}}));}'),f=>assert.throws(f.check,/any or unknown/));
});
test('module admission rejects undocumented emissions including zero-tag owners',async()=>{
 const source=code('CustomEvent<number>','send(){this.dispatchEvent(new CustomEvent("other",{detail:1}));}');
 await fixture(source,f=>assert.throws(f.check,/Unclassified/));await fixture(source.replace('/** @fires {CustomEvent<number>} changed */',''),f=>assert.throws(f.check,/complete supported/));
});
test('module admission rejects dispatch alias escapes',async()=>fixture(code('CustomEvent<number>','send(){const dispatch=this.dispatchEvent;void dispatch;}'),f=>assert.throws(f.check,/escapes|aliases/)));
test('module admission guards private mode identity and original source mutation',async()=>fixture(code('CustomEvent<number>','send(){this.dispatchEvent(new CustomEvent("changed",{detail:1}));}'),f=>{
 const result=f.check();assert.throws(()=>assertCapturedModuleEventAdmission({...result},f.program,f.owner),/Unknown/);assert.throws(()=>assertCapturedFactoryEventAdmission(result,f.program,undefined,f.owner),/Unknown/);
 f.owner.name.escapedText='Changed';assert.throws(result.assertOriginal,/changed/);
}));
