import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedAnnotationScope,assertCapturedAnnotationScope} from './captured-annotation-scope.ts';

const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,types:[]};
async function fixture(files:Record<string,string>,run:(f:any)=>unknown) {
  const root=await mkdtemp(join(tmpdir(),'cem-annotation-scope-'));
  try {
    for(const [name,text] of Object.entries(files)){const path=join(root,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);}
    const file=join(root,'main.ts'),capture=createCapturedCompilerProgram([file],options),program=capture.program,source=program.getSourceFile(file);
    const owner=source.statements.find((node:any)=>ts.isClassDeclaration(node)&&node.name?.text==='Leaf');
    const tags=owner?ts.getJSDocTags(owner):[];
    await run({root,file,capture,program,source,owner,tags,check:(tag=tags[0])=>checkCapturedAnnotationScope(program,owner,tag)});
  }finally{await rm(root,{recursive:true,force:true});}
}
const tagged=(text:string,prefix='')=>`${prefix}\n/** @fires {${text}} changed - source contract */\nexport class Leaf {}`;

test('annotation scope binds one exact original event tag and checked generic application',async()=>fixture({'main.ts':tagged('CustomEvent<PublicDetail>','export interface PublicDetail {value:string}')},f=>{
  const result=f.check();
  assert.equal(result.typeSemanticsChecked,true);assert.equal(result.lexicalNamesChecked,true);
  assert.equal(result.receipt.text,'CustomEvent<PublicDetail>');
  assert.equal(f.source.text.slice(result.receipt.typeStart,result.receipt.typeEnd),result.receipt.text);
  assert.deepEqual(result.receipt.references.map((row:any)=>row.name),['CustomEvent','PublicDetail']);
  assert.equal(result.assertOriginal(),true);assert.equal(assertCapturedAnnotationScope(result,f.program,f.owner,f.tags[0]),true);
  assert.equal(result.publicVisibilityChecked,false);assert.equal(result.occurrenceSemanticsQualified,false);assert.equal(result.annotationSemanticsQualified,false);
}));

test('annotation scope keeps aliases and every namespace prefix tied to original declarations',async()=>fixture({
  'main.ts':tagged('Renamed<Public.A>','import type {Box as Renamed} from "./types.js"; export type Existing=Renamed<string>; export namespace Public {export interface A {value:string}}'),
  'types.ts':'export interface Box<T>{value:T}',
},f=>{
  const result=f.check();assert.deepEqual(result.receipt.references.map((row:any)=>row.name),['Renamed','Public','Public.A']);
  assert.ok(result.receipt.references[0].declarations.every((row:any)=>row.file===join(f.root,'types.ts')));
  assert.equal(result.assertOriginal(),true);
}));

test('annotation scope preserves nested object types and braces inside quoted literal types',async()=>fixture({'main.ts':tagged('{text:"}"; nested:{open:"{";escaped:"a\\\"}b"}}')},f=>{
  const result=f.check();assert.equal(result.receipt.text,'{text:"}"; nested:{open:"{";escaped:"a\\\"}b"}}');assert.equal(result.receipt.references.length,0);
}));

test('annotation scope supports all four direct tag names without caller supplied type text',async()=>{
  for(const name of ['attr','attribute','event','fires'])await fixture({'main.ts':`/** @${name} {string} value */\nexport class Leaf {}`},f=>{
    const result=f.check();assert.equal(result.receipt.tagName,name);assert.equal(result.receipt.text,'string');
  });
});

test('annotation scope validates generic defaults and rejects invalid arity or constraints',async()=>{
  const prefix='export type Keys<T,U extends keyof T=keyof T>=U;';
  await fixture({'main.ts':tagged('Keys<{value:string}>',prefix)},f=>assert.equal(f.check().typeSemanticsChecked,true));
  for(const text of ['Keys','Keys<{value:string},"missing">','Keys<{value:string},"value",number>'])
    await fixture({'main.ts':tagged(text,prefix)},f=>assert.throws(()=>f.check(),/no compiler errors/));
});

test('annotation scope refuses generic class and factory occurrence owners',async()=>{
  await fixture({'main.ts':'export type T=string;\n/** @attr {T} value */\nexport class Leaf<T>{}'},f=>assert.throws(()=>f.check(),/nongeneric module-level class/));
  await fixture({'main.ts':'/** @attr {string} value */\nexport default class {}'},f=>{
    const owner=f.source.statements[0];assert.throws(()=>checkCapturedAnnotationScope(f.program,owner,ts.getJSDocTags(owner)[0]),/nongeneric module-level class/);
  });
  await fixture({'main.ts':'export function Factory<T>() {\n/** @attr {T} value */\nclass Nested {}\nreturn Nested;}'},f=>{
    const fn=f.source.statements[0],owner=fn.body.statements[0],tag=ts.getJSDocTags(owner)[0];
    assert.throws(()=>checkCapturedAnnotationScope(f.program,owner,tag),/nongeneric module-level class/);
  });
});

test('annotation scope requires the same original Program owner and directly attached tag',async()=>fixture({'main.ts':tagged('string')+'\n/** @attr {number} value */\nexport class Other {}'},f=>{
  const other=f.source.statements.find((node:any)=>node.name?.text==='Other'),otherTag=ts.getJSDocTags(other)[0];
  assert.throws(()=>f.check(otherTag),/directly attached original JSDoc tag/);
  assert.throws(()=>f.check({...f.tags[0]}),/directly attached original JSDoc tag/);
  assert.throws(()=>checkCapturedAnnotationScope(f.program,{...f.owner},f.tags[0]),/exact nongeneric module-level class/);
  const foreign=createCapturedCompilerProgram([f.file],options);
  assert.throws(()=>checkCapturedAnnotationScope(foreign.program,f.owner,f.tags[0]),/exact nongeneric module-level class/);
  const result=f.check();assert.throws(()=>assertCapturedAnnotationScope({...result},f.program,f.owner,f.tags[0]),/Unknown annotation scope/);
  assert.throws(()=>result.assertOriginal(f.program,other,otherTag),/exact original binding/);
}));

test('annotation scope refuses forged owners and tags without reading their properties',async()=>fixture({'main.ts':tagged('string')},f=>{
  let accesses=0;
  const forged=new Proxy({}, {get(){accesses++;throw new Error('Caller property must not run');}});
  assert.throws(()=>checkCapturedAnnotationScope(f.program,forged,f.tags[0]),/exact nongeneric module-level class/);
  assert.throws(()=>f.check(forged),/directly attached original JSDoc tag/);
  assert.equal(accesses,0);
}));

test('annotation scope distinguishes type symbols from value queries',async()=>{
  await fixture({'main.ts':tagged('typeof value','export const value={label:"ok"};')},f=>assert.equal(f.check().receipt.references[0].name,'value'));
  for(const [prefix,text] of [['export const onlyValue=1;','onlyValue'],['export type OnlyType=string;','typeof OnlyType']])
    await fixture({'main.ts':tagged(text,prefix)},f=>assert.throws(()=>f.check(),/no compiler errors/));
});

test('annotation scope refuses local binders computed names and import type escape hatches',async()=>{
  for(const text of ['{[K in "x"]:string}','string extends infer U ? U : never','<T>(value:T)=>T','{fn(value:string):string}',
    '{get value():string}','{set value(v:string)}','{[key:string]:number}','import("./types.js").Public'])
    await fixture({'main.ts':tagged(text,'import type {Public} from "./types.js"; export type Existing=Public;'),'types.ts':'export interface Public {value:string}'},f=>
      assert.throws(()=>f.check(),/separate lexical or occurrence adapter/));
  await fixture({'main.ts':tagged('{[key]:string}','export const key:unique symbol=Symbol("key");')},f=>assert.throws(()=>f.check(),/separate lexical or occurrence adapter/));
  await fixture({'main.ts':tagged('this')},f=>assert.throws(()=>f.check(),/separate lexical or occurrence adapter/));
});

test('annotation scope refuses unsupported source-range forms and missing contract names',async()=>{
  for(const raw of ['/** @fires {`value`} changed */','/** @fires {string\n * |number} changed */','/** @fires {string} */','/** @fires Event changed */'])
    await fixture({'main.ts':raw+'\nexport class Leaf {}'},f=>assert.throws(()=>f.check(),/source-range adapter|authored contract name|leading braced type/));
});

test('annotation scope rejects semantic or declaration injection in the exact tag text',async()=>fixture({'main.ts':tagged('string; export type Injected=number')},f=>{
  assert.throws(()=>f.check(),/exactly one type expression/);
}));

test('annotation scope does not mistake valid hidden or erased types for public visibility',async()=>{
  for(const text of ['Hidden','Erase<Hidden>','Defaulted'])await fixture({'main.ts':tagged(text,'interface Hidden {secret:string}; export type Erase<T>=string; export interface Defaulted<T=Hidden>{value:T}')},f=>{
    const result=f.check();assert.equal(result.lexicalNamesChecked,true);assert.equal(result.publicVisibilityChecked,false);assert.equal(result.annotationSemanticsQualified,false);
  });
});

test('annotation scope revalidates original JSDoc and source mutation on use',async()=>{
  await fixture({'main.ts':tagged('string')},f=>{const result=f.check();f.tags[0].comment='{number} changed';assert.throws(()=>result.assertOriginal(),/parsed structure changed|authored tag binding changed/);});
  await fixture({'main.ts':tagged('string')},f=>{const result=f.check();f.source.text=f.source.text.replace('string','number');assert.throws(()=>result.assertOriginal(),/source identity changed|authored tag binding changed/);});
});

test('annotation scope keeps frozen validation distinct from changed live source files',async()=>fixture({'main.ts':tagged('string')},async f=>{
  const result=f.check();await writeFile(f.file,tagged('number'));
  assert.equal(result.assertOriginal(),true);assert.throws(()=>f.capture.revalidate(),/Captured compiler query changed/);
}));
