import {test} from 'node:test';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {generateCem as extractRaw, detectClassEvents} from '@wc-toolkit/cem-generator';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, mkdir, readFile, symlink, rm, realpath} from 'node:fs/promises';
import {join, dirname, sep} from 'node:path';
import {tmpdir} from 'node:os';
import {generateCandidateCem, verifyCandidateReceipt} from './generate-wc-toolkit.ts';
import {compilerIdentity, compilerResolution, assertGeneratorCompilerOwners, resolveCompilerPackage, ts} from './compiler-api.mjs';
import {candidatePolicy} from './candidate-policy.mjs';
import {completeCandidateModules} from './candidate-modules.ts';
import {candidateInheritancePatch, candidateSuperclass} from './candidate-inheritance.ts';

test('supplementation retains one export for an overloaded implementation and rejects missing targets', async () => fixture(async root => {
  const file=join(root,'functions.ts');
  await writeFile(file,`export function parse(value:string):string;
    export function parse(value:number):number;
    export function parse(value:string|number):string|number {return value;}`);
  const program=ts.createProgram([file],{noEmit:true}),source=program.getSourceFile(file)!;
  const manifest:any={schemaVersion:'2.1.0',modules:[]};
  completeCandidateModules(manifest,root,[source],program.getTypeChecker());
  assert.equal(manifest.modules[0].declarations.length,1);
  assert.deepEqual(manifest.modules[0].exports.map((entry:any)=>entry.name),['parse']);
  const missing:any={schemaVersion:'2.1.0',modules:[{kind:'javascript-module',path:'functions.ts',declarations:[],
    exports:[{kind:'custom-element-definition',name:'en-missing',declaration:{name:'Missing',module:'functions.ts'}}]}]};
  assert.throws(()=>completeCandidateModules(missing,root,[source],program.getTypeChecker()),/Unresolved candidate export target/);
}));

test('anonymous default functions fail explicitly before upstream declarations or exports can be lost', async () => fixture(async root => {
  for (const code of [
    'export default function () { return 1; }',
    'export default async function () { return 1; }',
    'export default function* () { yield 1; }',
  ]) {
    const source=ts.createSourceFile(join(root,'anonymous.ts'),code,ts.ScriptTarget.Latest,true);
    assert.equal(source.parseDiagnostics.length,0);
    const manifest:any={schemaVersion:'2.1.0',modules:[{kind:'javascript-module',path:'anonymous.ts',
      declarations:[{kind:'function',name:'default',parameters:[]}],
      exports:[{kind:'js',name:'default',declaration:{name:'default',module:'anonymous.ts'}}]}]};
    const retained=structuredClone(manifest);
    assert.throws(()=>completeCandidateModules(manifest,root,[source],{}),
      {message:'[CEM_UNSUPPORTED_ANONYMOUS_DEFAULT_FUNCTION] anonymous.ts: anonymous default functions require a qualified metadata adapter.'});
    assert.deepEqual(manifest,retained,'Unsupported defaults must fail before rewriting upstream metadata');
  }
}));

test('named default functions retain their authored declaration and default export edge', async () => fixture(async root => {
  const file=join(root,'named.ts');
  await writeFile(file,'export default function named(value:string):string { throw new Error("Must not execute"); }');
  const program=ts.createProgram([file],{noEmit:true}),source=program.getSourceFile(file)!;
  const manifest:any={schemaVersion:'2.1.0',modules:[]};
  completeCandidateModules(manifest,root,[source],program.getTypeChecker());
  assert.deepEqual(manifest.modules[0].declarations.map((entry:any)=>({kind:entry.kind,name:entry.name})),[{kind:'function',name:'named'}]);
  assert.deepEqual(manifest.modules[0].exports,[{kind:'js',name:'default',declaration:{name:'named',module:'named.ts'}}]);
}));

test('supplemented functions preserve inferred return contracts', async () => fixture(async root => {
  const file=join(root,'functions.ts');
  await writeFile(file,'export function count(){return 1;} export function label(): string {return "count";}');
  const program=ts.createProgram([file],{noEmit:true}),source=program.getSourceFile(file)!;
  const manifest:any={schemaVersion:'2.1.0',modules:[]};
  completeCandidateModules(manifest,root,[source],program.getTypeChecker());
  const declarations=manifest.modules[0].declarations;
  assert.equal(declarations.find((entry:any)=>entry.name==='count').return.type.text,'number');
  assert.equal(declarations.find((entry:any)=>entry.name==='label').return.type.text,'string');
}));

test('type-only declaration and specifier exports stay distinct from class value exports', async () => fixture(async root => {
  const classFile=join(root,'class.ts'),barrelFile=join(root,'barrel.ts');
  await writeFile(classFile,'export class SomeClass {}');
  await writeFile(barrelFile,`export type {SomeClass as DeclarationType} from './class.js';
    export {type SomeClass as SpecifierType, SomeClass as OrdinaryValue} from './class.js';`);
  const program=ts.createProgram([classFile,barrelFile],{noEmit:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
  const manifest:any={schemaVersion:'2.1.0',modules:[{kind:'javascript-module',path:'class.ts',declarations:[{kind:'class',name:'SomeClass'}],exports:[]}]};
  const topology=completeCandidateModules(manifest,root,[program.getSourceFile(classFile)!,program.getSourceFile(barrelFile)!],program.getTypeChecker());
  assert.deepEqual(topology.typeOnlyExports,[
    {module:'barrel.ts',name:'DeclarationType',target:'class.ts#SomeClass'},
    {module:'barrel.ts',name:'SpecifierType',target:'class.ts#SomeClass'},
  ]);
  const exports=manifest.modules.find((module:any)=>module.path==='barrel.ts').exports;
  assert.deepEqual(exports.map((entry:any)=>entry.name),['DeclarationType','OrdinaryValue','SpecifierType']);
  assert.ok(exports.every((entry:any)=>entry.declaration.name==='SomeClass' && entry.declaration.module==='class.ts'));
}));

async function barrelTopology(root: string, files: Record<string, string>, reverse = false) {
  for (const [name, text] of Object.entries(files)) await writeFile(join(root, name), text);
  const paths = Object.keys(files).map(name => join(root, name));
  const program = ts.createProgram(paths, {noEmit:true,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
  const sources = paths.map(file => program.getSourceFile(file)!);
  assert.equal(program.getSyntacticDiagnostics().length, 0);
  const manifest:any = {schemaVersion:'2.1.0',modules:[{kind:'javascript-module',path:'class.ts',declarations:[{kind:'class',name:'SomeClass'}],exports:[]}]};
  const topology = completeCandidateModules(manifest, root, reverse ? sources.reverse() : sources, program.getTypeChecker());
  const edges = manifest.modules.flatMap((module:any) => module.exports.map((entry:any) => {
    assert.deepEqual(entry.declaration, {name:'SomeClass',module:'class.ts'}, `${module.path}#${entry.name}`);
    return `${module.path}#${entry.name}`;
  })).sort();
  assert.ok(topology.typeOnlyExports.every(entry => entry.target === 'class.ts#SomeClass'));
  return {manifest, edges, types:topology.typeOnlyExports.map(entry => `${entry.module}#${entry.name}`).sort()};
}

test('type-only exports survive renamed and star barrel chains without downgrading a parallel class value export', async () => fixture(async root => {
  const files = {
    'class.ts':'export class SomeClass {}',
    'first.ts':`export type {SomeClass as DeclarationType} from './class.js';
      export {type SomeClass as SpecifierType, SomeClass as Live} from './class.js';`,
    'second.ts':`export {DeclarationType as RenamedType, SpecifierType, Live as RenamedValue} from './first.js';`,
    'star.ts':`export * from './second.js';`,
    'last.ts':`export {RenamedType as PublicType, SpecifierType as OtherType, RenamedValue as PublicValue} from './star.js';`,
  };
  const result = await barrelTopology(root, files);
  assert.deepEqual(result.types, [
    'first.ts#DeclarationType','first.ts#SpecifierType','last.ts#OtherType','last.ts#PublicType',
    'second.ts#RenamedType','second.ts#SpecifierType','star.ts#RenamedType','star.ts#SpecifierType',
  ]);
  assert.deepEqual(result.edges, [
    'class.ts#SomeClass','first.ts#DeclarationType','first.ts#Live','first.ts#SpecifierType',
    'last.ts#OtherType','last.ts#PublicType','last.ts#PublicValue',
    'second.ts#RenamedType','second.ts#RenamedValue','second.ts#SpecifierType',
    'star.ts#RenamedType','star.ts#RenamedValue','star.ts#SpecifierType',
  ]);
  assert.deepEqual(await barrelTopology(root, files, true), result, 'Classification cannot depend on the source enumeration order');
}));

test('type-only imports and type-only stars stay restricted through ordinary local and remote exports', async () => fixture(async root => {
  const result = await barrelTopology(root, {
    'class.ts':'export class SomeClass {}',
    'first.ts':`export {SomeClass} from './class.js';`,
    'types.ts':`export type * from './first.js';`,
    'star.ts':`export * from './types.js';`,
    'local.ts':`import type {SomeClass as ClauseType} from './first.js';
      import {type SomeClass as SpecifierType, SomeClass as Live} from './first.js';
      import {SomeClass as ViaStar} from './star.js';
      export {ClauseType, SpecifierType, ViaStar, Live};`,
    'last.ts':`export {ClauseType, SpecifierType, ViaStar, Live} from './local.js';`,
  });
  assert.deepEqual(result.types, [
    'last.ts#ClauseType','last.ts#SpecifierType','last.ts#ViaStar',
    'local.ts#ClauseType','local.ts#SpecifierType','local.ts#ViaStar',
    'star.ts#SomeClass','types.ts#SomeClass',
  ]);
  assert.deepEqual(result.edges, [
    'class.ts#SomeClass','first.ts#SomeClass',
    'last.ts#ClauseType','last.ts#Live','last.ts#SpecifierType','last.ts#ViaStar',
    'local.ts#ClauseType','local.ts#Live','local.ts#SpecifierType','local.ts#ViaStar',
    'star.ts#SomeClass','types.ts#SomeClass',
  ]);
}));

test('cyclic ordinary star barrels still reject duplicate exports instead of waiving validation', async () => fixture(async root => {
  await assert.rejects(() => barrelTopology(root, {
    'class.ts':'export class SomeClass {}',
    'first.ts':`export type {SomeClass as Restricted} from './class.js'; export {SomeClass as Live} from './class.js';`,
    'a.ts':`export * from './b.js';`,
    'b.ts':`export * from './a.js'; export * from './first.js';`,
    'last.ts':`export {Restricted, Live} from './a.js';`,
  }), /Duplicate source export b\.ts#/);
}));

test('plain superclass aliases resolve to the declaration in the referenced source module', async () => fixture(async root => {
  await writeFile(join(root,'base.ts'),'export class Base {value = 1;}');
  await writeFile(join(root,'child.ts'),"import {Base as Alias} from './base.js'; export class Child extends Alias {}");
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts'],lit:false});
  const child=manifest.modules.find((module:any)=>module.path==='child.ts').declarations.find((entry:any)=>entry.name==='Child');
  assert.deepEqual(child.superclass,{name:'Base',module:'base.ts'});
}));

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'en-wc-candidate-'));
  try {await run(root);} catch (error) {
    if (error && typeof error === "object" && "failures" in error) throw new Error(JSON.stringify(error.failures), {cause: error});
    throw error;
  } finally {await rm(root, {recursive: true, force: true});}
}
test('candidate generator owners resolve one effective TypeScript 6 API', () => {
  const identity = compilerIdentity(), paths = compilerResolution(), owners = assertGeneratorCompilerOwners();
  assert.match(ts.version, /^6\./);assert.equal(identity.effective.version, ts.version);
  assert.equal(identity.wrapper.name, '@typescript/typescript6');assert.equal(identity.effective.name, 'typescript');
  assert.ok(paths.wrapperEntry.includes('@typescript'));assert.ok(paths.effectiveEntry.includes('@typescript'));
  for (const owner of Object.values(owners)) assert.match(owner.distributionDigest!, /^sha256:[a-f0-9]{64}$/);
  const litRequire = createRequire(resolveCompilerPackage('@wc-toolkit/cem-generator-lit').entry);
  assert.equal(litRequire.resolve('@wc-toolkit/cem-generator'), resolveCompilerPackage('@wc-toolkit/cem-generator').entry);
  assert.deepEqual(Object.keys(owners).sort(), ['@wc-toolkit/cem-generator','@wc-toolkit/cem-generator-lit','@wc-toolkit/cem-generator-utils'].sort());
});
test('candidate source membership retains empty/barrel/function/variable modules without executing code', async () => fixture(async root => {
  await writeFile(join(root,'empty.ts'),'export {};');
  await writeFile(join(root,'types.ts'),'export interface Value {text:string}');
  await writeFile(join(root,'sample.ts'),`import type {Value} from './types.js';
    /** @tag en-candidate */ export class Candidate extends HTMLElement { get value(): string {return 'value';} }
    /** Authored helper. */ export function makeValue(text:string): Value {return {text};}
    export const version = 'sample';
    throw new Error('Component runtime must never execute during extraction');`);
  await writeFile(join(root,'barrel.ts'),"export {Candidate as PublicCandidate, makeValue} from './sample.js';");
  const options = {sourceRoot:root,sources:['sample.ts','empty.ts','barrel.ts']};
  const {manifest,receipt} = await generateCandidateCem(options);
  assert.deepEqual(manifest.modules.map((module:any)=>module.path).sort(), ['barrel.ts','empty.ts','sample.ts']);
  const sample = manifest.modules.find((module:any)=>module.path==='sample.ts');
  assert.deepEqual(sample.declarations.map((item:any)=>item.name).sort(), ['Candidate','makeValue','version']);
  assert.equal(manifest.modules.find((module:any)=>module.path==='barrel.ts').exports.find((item:any)=>item.name==='PublicCandidate').declaration.name,'Candidate');
  assert.equal(receipt.policy.conflictPolicy,'throw');assert.deepEqual(receipt.policy.validation,{invariants:'error',exportTypes:'error'});
  assert.equal((await verifyCandidateReceipt(manifest,receipt,options)).sourceFiles,3);
}));
test('candidate rejects empty, missing, invalid and symlink-escaping source inputs', async () => fixture(async root => {
  await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:[]}));
  await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['missing.ts']}));
  await writeFile(join(root,'broken.ts'),'export class {');
  await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['broken.ts']}),/invalid source/);
  const outside=await mkdtemp(join(tmpdir(),'en-wc-outside-'));
  try {await writeFile(join(outside,'outside.ts'),'export class Outside {}');await symlink(join(outside,'outside.ts'),join(root,'escape.ts'));
    await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['escape.ts']}),/inside sourceRoot/);
  }finally{await rm(outside,{recursive:true,force:true});}
}));
test('candidate receipts reject compiler/policy/source/output changes without rewriting the retained CEM', async () => fixture(async root => {
  await writeFile(join(root,'sample.ts'),'/** @tag en-proof */ export class Proof extends HTMLElement { value = 1; }');
  const options={sourceRoot:root,sources:['sample.ts']};const result=await generateCandidateCem(options);
  const file=join(root,'retained.json'),bytes=JSON.stringify(result.manifest);await writeFile(file,bytes);
  const changed=structuredClone(result.receipt);changed.compiler.effective.version='0.0.0';
  await assert.rejects(()=>verifyCandidateReceipt(result.manifest,changed,options),/identity changed/);
  const changedDistribution = structuredClone(result.receipt);
  changedDistribution.packages['@wc-toolkit/cem-generator'].distributionDigest = 'sha256:' + '0'.repeat(64);
  await assert.rejects(()=>verifyCandidateReceipt(result.manifest,changedDistribution,options),/identity changed/);
  await assert.rejects(()=>verifyCandidateReceipt({...result.manifest,readme:'changed'},result.receipt,options),/digest mismatch/);
  await assert.rejects(()=>verifyCandidateReceipt(result.manifest,{...result.receipt,policy:{...candidatePolicy,conflictPolicy:'last-wins'}},options),/identity changed/);
  await writeFile(join(root,'sample.ts'),'/** @tag en-proof */ export class Proof extends HTMLElement { value = 2; }');
  await assert.rejects(()=>verifyCandidateReceipt(result.manifest,result.receipt,options),/contents changed/);
  assert.equal(await readFile(file,'utf8'),bytes);
}));
test('candidate Lit source corrections keep internal attributes private and reject conflicting accessors', async () => fixture(async root => {
  // The fixture lives in the OS temp directory, so bind its bare import to the installed owner explicitly.
  const litDirectory=dirname(resolveCompilerPackage('lit').packagePath),baseFile=join(root,'base.ts');
  await mkdir(join(root,'node_modules'));
  await symlink(litDirectory,join(root,'node_modules','lit'),'dir');
  await writeFile(baseFile,`import {LitElement} from 'lit';
    export class LitBase extends LitElement {
      static properties = {secret:{state:true},local:{attribute:false}}; secret = true; local = '';
      get value(): string {return 'value';} set value(input:string) {}
    }`);
  await writeFile(join(root,'sample.ts'),`import {LitBase} from './base.js';
    /** @tag en-lit-candidate */ export class LitCandidate extends LitBase {}`);
  const resolution=ts.resolveModuleName('lit',baseFile,{module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler},ts.sys).resolvedModule;
  assert.ok(resolution,'The temporary fixture must resolve the installed Lit package');
  assert.ok((await realpath(resolution.resolvedFileName)).startsWith(litDirectory+sep));
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','sample.ts']});
  const base=manifest.modules.find((module:any)=>module.path==='base.ts').declarations.find((item:any)=>item.name==='LitBase');
  const declaration=manifest.modules.find((module:any)=>module.path==='sample.ts').declarations.find((item:any)=>item.name==='LitCandidate');
  assert.deepEqual(declaration.superclass,{name:'LitBase',module:'base.ts'});
  assert.equal(base.members.find((item:any)=>item.name==='value').type.text,'string');
  const inherited=declaration.members.find((item:any)=>item.name==='value');
  assert.equal(inherited.type.text,'string');
  assert.deepEqual(inherited.inheritedFrom,{name:'LitBase',module:'base.ts'});
  for(const item of [base,declaration]) assert.ok(!item.attributes?.some((attribute:any)=>['secret','local'].includes(attribute.name)));
  await writeFile(join(root,'sample.ts'),`export class Broken {get value():string{return '';} set value(input:number){}}`);
  await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['sample.ts']}),/getter\/setter type disagreement/);
}));
test('candidate relocation preserves manifest and receipt meaning for identical explicit inputs', async () => fixture(async root => {
  const results=[];
  for(const name of ['one','two']){const directory=join(root,name);await mkdir(directory);await writeFile(join(directory,'sample.ts'),'export class Sample {get value(): string {return "";}}');
    results.push(await generateCandidateCem({sourceRoot:directory,sources:['sample.ts']}));}
  assert.deepEqual(results[0],results[1]);
}));


test('the actual ContextProvider source retains its external same-name superclass', async () => fixture(async root => {
  const contextDirectory=dirname(resolveCompilerPackage('@lit/context').packagePath);
  await mkdir(join(root,'node_modules/@lit'),{recursive:true});
  await symlink(contextDirectory,join(root,'node_modules/@lit/context'),'dir');
  await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'context-provider.ts'),await readFile(new URL('../../packages/elements/src/internal/context-provider.ts',import.meta.url)));
  const {manifest,receipt}=await generateCandidateCem({sourceRoot:root,sources:['context-provider.ts'],lit:false});
  const declaration=manifest.modules[0].declarations.find((item:any)=>item.name==='ContextProvider');
  assert.equal(declaration.superclass.name,'ContextProvider');
  assert.equal(declaration.superclass.package,'@lit/context');
  assert.match(declaration.superclass.module,/lib\/controllers\/context-provider\.d\.ts$/);
  assert.ok(!declaration.superclass.module.startsWith('/'));
  assert.ok(declaration.members.some((item:any)=>item.name==='hostConnected'));
  assert.ok(!declaration.members.some((item:any)=>item.name==='setValue'),'Opaque external members must not be invented');
  assert.ok(receipt.generator.sources['candidate-inheritance.ts']);
}));

test('selected same-name classes inherit by resolved module and retain child overrides', async () => fixture(async root => {
  await writeFile(join(root,'base.ts'),'export class Provider {fromBase = 1; shared = "base";}');
  await writeFile(join(root,'child.ts'),"import {Provider as Base} from './base.js'; export class Provider extends Base {shared = 'child';}");
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts'],lit:false});
  const child=manifest.modules.find((module:any)=>module.path==='child.ts').declarations.find((item:any)=>item.name==='Provider');
  assert.deepEqual(child.superclass,{name:'Provider',module:'base.ts'});
  assert.deepEqual(child.members.find((item:any)=>item.name==='fromBase').inheritedFrom,{name:'Provider',module:'base.ts'});
  assert.equal(child.members.filter((item:any)=>item.name==='shared').length,1);
  assert.equal(child.members.find((item:any)=>item.name==='shared').default,"'child'");
}));

const inheritanceManifest=(...entries:any[])=>({modules:entries.map(([path,declaration])=>({path,declarations:[declaration]}))});
test('external and unmatched qualified superclass references never capture a local same-name class',()=>{
  for(const superclass of [{name:'Provider',package:'external'}, {name:'Provider',module:'external.ts'}]){
    const manifest=inheritanceManifest(['local.ts',{name:'Provider',superclass,members:[{name:'own'}]}]);
    assert.deepEqual(candidateInheritancePatch(manifest),{replaceByDeclaration:{}});
  }
  const sameModuleOnly=inheritanceManifest(['other.ts',{name:'Base',members:[{name:'foreign'}]}],['local.ts',{name:'Child',superclass:{name:'Base'}}]);
  assert.deepEqual(candidateInheritancePatch(sameModuleOnly),{replaceByDeclaration:{}});
});

test('inheritance retains all collections, omissions, overrides and original ancestor provenance',()=>{
  const keys=['members','attributes','cssProperties','cssParts','cssStates','slots','events'];
  const grand:any={name:'Same'},base:any={name:'Same',superclass:{name:'Same',module:'grand.ts'}},child:any={name:'Child',superclass:{name:'Same',module:'base.ts'},omitInherited:{}};
  for(const key of keys){grand[key]=[{name:'ancestor'}];base[key]=[{name:'omit'},{name:'shared',description:'base'}];child[key]=[{name:'shared',description:'child'}];child.omitInherited[key]=[' omit '];}
  const manifest=inheritanceManifest(['grand.ts',grand],['base.ts',base],['child.ts',child]),before=structuredClone(manifest);
  const patch=candidateInheritancePatch(manifest).replaceByDeclaration['child.ts#Child'];
  for(const key of keys){assert.deepEqual(patch[key].map((item:any)=>item.name),['ancestor','shared']);assert.deepEqual(patch[key][0].inheritedFrom,{name:'Same',module:'grand.ts'});assert.equal(patch[key][1].description,'child');assert.equal(patch[key][1].inheritedFrom,undefined);}
  assert.deepEqual(manifest,before,'Planning inheritance must not mutate the input manifest');
});

test('declaration-identity inheritance rejects real direct and indirect cycles',()=>{
  assert.throws(()=>candidateInheritancePatch(inheritanceManifest(['a.ts',{name:'A',superclass:{name:'A',module:'a.ts'}}])),/Circular superclass reference.*a\.ts#A/);
  assert.throws(()=>candidateInheritancePatch(inheritanceManifest(['a.ts',{name:'A',superclass:{name:'B',module:'b.ts'}}],['b.ts',{name:'B',superclass:{name:'A',module:'a.ts'}}])),/Circular superclass reference.*a\.ts#A.*b\.ts#B.*a\.ts#A/);
});

test('inheritance rejects duplicate identities and missing declarations in selected modules',()=>{
  assert.throws(()=>candidateInheritancePatch({modules:[{path:'a.ts',declarations:[{name:'A'},{name:'A'}]}]}),/Duplicate inheritance declaration/);
  assert.throws(()=>candidateInheritancePatch(inheritanceManifest(['a.ts',{name:'A'}],['a.ts',{name:'B'}])),/Duplicate inheritance module/);
  assert.throws(()=>candidateInheritancePatch(inheritanceManifest(['a.ts',{name:'A',superclass:{name:'Missing',module:'b.ts'}}],['b.ts',{name:'B'}])),/Unresolved inheritance declaration/);
});


test('standard-library superclass identity follows the originating Program through the aliased compiler layout', async () => fixture(async root => {
  await writeFile(join(root,'target.ts'),'export class LocalTarget extends EventTarget {}');
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['target.ts'],lit:false});
  const declaration=manifest.modules.find((module:any)=>module.path==='target.ts').declarations.find((item:any)=>item.name==='LocalTarget');
  assert.deepEqual(declaration.superclass,{name:'EventTarget'},'A platform superclass is not owned by the TypeScript npm package');
}));

test('superclass resolution rejects an expression from another compiler Program', async () => fixture(async root => {
  const file=join(root,'target.ts');await writeFile(file,'export class LocalTarget extends EventTarget {}');
  const first=ts.createProgram([file],{noEmit:true}),second=ts.createProgram([file],{noEmit:true});
  const expression=first.getSourceFile(file)!.statements.find(ts.isClassDeclaration)!.heritageClauses![0].types[0].expression;
  assert.throws(()=>candidateSuperclass(expression,second,new Map(),()=>{throw new Error('Unexpected selected source');}),/different compiler Program/);
}));


test('generator distribution identity detects a changed non-entry validator module', async () => fixture(async root => {
  const directory=join(root,'node_modules/@wc-toolkit/cem-generator');await mkdir(join(directory,'dist'),{recursive:true});
  await writeFile(join(directory,'package.json'),JSON.stringify({name:'@wc-toolkit/cem-generator',version:'0.1.10-en-cem.test',main:'dist/index.js'}));
  await writeFile(join(directory,'dist/index.js'),'module.exports = {};');
  await writeFile(join(directory,'dist/validation.js'),'module.exports = 1;');
  const from=createRequire(join(root,'entry.cjs'));
  const before=resolveCompilerPackage('@wc-toolkit/cem-generator',from).identity;
  await writeFile(join(directory,'dist/validation.js'),'module.exports = 2;');
  const after=resolveCompilerPackage('@wc-toolkit/cem-generator',from).identity;
  assert.equal(before.packageDigest,after.packageDigest);assert.equal(before.entryDigest,after.entryDigest);
  assert.notEqual(before.distributionDigest,after.distributionDigest);
}));

test('actual Lit extraction excludes hidden state and internal contracts before strict validation', async () => fixture(async root => {
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  for (const properties of ['static properties = {secret:{state:true},local:{attribute:false},coordination:{type:String}};',
    'static get properties(){return {secret:{state:true},local:{attribute:false},coordination:{type:String}};}']) {
    await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';
      type Hidden=string;
      export class Base extends LitElement {
        ${properties}
        private secret!:Hidden; private local!:Hidden;
        /** @internal */
        coordination!:Hidden;
      }`);
    await writeFile(join(root,'child.ts'),"import {Base} from './base.js'; export class Child extends Base {}");
    await writeFile(join(root,'public.ts'),"import {Base} from './base.js'; export class PublicChild extends Base {static properties={coordination:{type:String}}; override coordination!:string;}");
    const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts','public.ts']}).catch((error:any)=>{throw new Error(JSON.stringify(error.failures ?? String(error)),{cause:error});});
    for (const module of manifest.modules) for (const declaration of module.declarations ?? []) {
      const excluded=declaration.name==='PublicChild'?['secret','local']:['secret','local','coordination'];
      assert(!declaration.attributes?.some((attribute:any)=>excluded.includes(attribute.fieldName)));
      if(declaration.name==='PublicChild') assert(declaration.attributes?.some((attribute:any)=>attribute.fieldName==='coordination'));
      const coordination=declaration.members?.find((member:any)=>member.name==='coordination');
      if (coordination) assert.equal(coordination.privacy,declaration.name==='PublicChild'?'public':'private');
    }
  }
}));
test('actual Lit extraction validates public attribute types behind private fields', async () => fixture(async root => {
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  for (const exported of [false,true]) {
    await writeFile(join(root,'sample.ts'),`import {LitElement} from 'lit';
      ${exported?'export ':''}type Hidden=string;
      export class Example extends LitElement {static properties={value:{type:String}}; private value!:Hidden;}`);
    const options={sourceRoot:root,sources:['sample.ts']};
    if (!exported) await assert.rejects(()=>generateCandidateCem(options),(error:any)=>error.failures?.some((failure:any)=>failure.rule==='manifest.exportTypes' && failure.severity==='error' && failure.message.includes('unexported type "Hidden"')));
    else {const {manifest}=await generateCandidateCem(options);assert(manifest.modules[0].declarations.find((item:any)=>item.name==='Example').attributes.some((item:any)=>item.fieldName==='value'));}
  }
}));


test('package export supplementation preserves workspace public paths and terminal ownership', async () => fixture(async root => {
  await mkdir(join(root,'node_modules/@en-reve'),{recursive:true});
  await symlink(await realpath(new URL('../../packages/primitives',import.meta.url)),join(root,'node_modules/@en-reve/primitives'),'dir');
  await writeFile(join(root,'surface.ts'),`export type {ChartDatum as Datum} from '@en-reve/primitives/templates/chart.js';
    export {barChart as renderer} from '@en-reve/primitives/templates/chart.js';`);
  await writeFile(join(root,'barrel.ts'),`export * from './surface.js';`);
  const {manifest,receipt}=await generateCandidateCem({sourceRoot:root,sources:['surface.ts','barrel.ts'],lit:false});
  for (const module of manifest.modules) {
    assert.deepEqual(module.exports.map((entry:any)=>entry.declaration),[
      {name:'ChartDatum',package:'@en-reve/primitives',module:'templates/chart.js'},
      {name:'barChart',package:'@en-reve/primitives',module:'templates/chart.js'},
    ]);
  }
  assert.equal(receipt.topology.externalExports.length,4);
  assert.ok(receipt.topology.externalExports.every((entry:any)=>entry.origin.package==='@en-reve/primitives' && entry.origin.module==='dist/templates/chart.d.ts'));
  assert.deepEqual(receipt.topology.typeOnlyExports.map((entry:any)=>entry.name),['Datum','Datum']);
}));

test('package class aliases retain type-only identity and the public package surface', async () => fixture(async root => {
  await mkdir(join(root,'node_modules'),{recursive:true});
  await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'surface.ts'),`import {LitElement as Local} from 'lit';
    export {Local as Runtime}; export type {LitElement as TypeOnly} from 'lit';`);
  const {manifest,receipt}=await generateCandidateCem({sourceRoot:root,sources:['surface.ts'],lit:false});
  assert.deepEqual(manifest.modules[0].exports.map((entry:any)=>entry.declaration),[
    {name:'LitElement',package:'lit'}, {name:'LitElement',package:'lit'},
  ]);
  assert.deepEqual(receipt.topology.typeOnlyExports.map((entry:any)=>entry.name),['TypeOnly']);
  assert.ok(receipt.topology.externalExports.every((entry:any)=>entry.origin.package==='lit-element'));
}));

test('unselected project type exports cannot use the type-only exemption', async () => fixture(async root => {
  const main=join(root,'main.ts'),hidden=join(root,'hidden.ts');
  await writeFile(main,`export type {Hidden} from './hidden.js';`);await writeFile(hidden,'export interface Hidden {text:string}');
  const program=ts.createProgram([main,hidden],{module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
  assert.throws(()=>completeCandidateModules({modules:[]},root,[program.getSourceFile(main)],program.getTypeChecker(),program),/Unselected candidate export target/);
}));

test('export supplementation rejects mismatched Programs and foreign selected sources before mutation', async () => fixture(async root => {
  const file=join(root,'main.ts');await writeFile(file,'export const value=1');
  const first=ts.createProgram([file],{}),second=ts.createProgram([file],{}),manifest={modules:[]};
  assert.throws(()=>completeCandidateModules(manifest,root,[first.getSourceFile(file)],first.getTypeChecker(),second),/originating compiler Program/);
  assert.throws(()=>completeCandidateModules(manifest,root,[second.getSourceFile(file)],first.getTypeChecker(),first),/originating compiler Program/);
  assert.deepEqual(manifest,{modules:[]});
}));


test('external aliases use the publicly exported name rather than a private declaration name', async () => fixture(async root => {
  await mkdir(join(root,'node_modules/example-package'),{recursive:true});
  await writeFile(join(root,'node_modules/example-package/package.json'),JSON.stringify({name:'example-package',types:'index.d.ts'}));
  await writeFile(join(root,'node_modules/example-package/index.d.ts'),'declare class Implementation {value:string}; export {Implementation as Public};');
  const main=join(root,'main.ts');await writeFile(main,`export type {Public as Local} from 'example-package';`);
  const program=ts.createProgram([main],{module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler}),manifest:any={modules:[]};
  const topology=completeCandidateModules(manifest,root,[program.getSourceFile(main)],program.getTypeChecker(),program);
  assert.deepEqual(manifest.modules[0].exports[0].declaration,{name:'Public',package:'example-package'});
  assert.deepEqual(topology.externalExports[0].origin,{name:'Implementation',package:'example-package',module:'index.d.ts'});
}));

test('external exports reject nameless and mismatched package ownership', async () => fixture(async root => {
  const directory=join(root,'node_modules/example-package');await mkdir(directory,{recursive:true});
  await writeFile(join(directory,'index.d.ts'),'export interface Value {text:string}');
  const main=join(root,'main.ts');await writeFile(main,`export type {Value} from 'example-package';`);
  for (const metadata of [{types:'index.d.ts'},{name:'different-package',types:'index.d.ts'}]) {
    await writeFile(join(directory,'package.json'),JSON.stringify(metadata));
    const program=ts.createProgram([main],{module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
    assert.throws(()=>completeCandidateModules({modules:[]},root,[program.getSourceFile(main)],program.getTypeChecker(),program),/package has no name|ambiguous package ownership/);
  }
}));


test('named runtime exports take precedence over overlapping type-only stars in either order', async () => fixture(async root => {
  for (const reverse of [false,true]) {
    await writeFile(join(root,'class.ts'),'export class Example {} export interface Options {value:string}');
    const rows=["export {Example, type Options} from './class.js';", "export type * from './class.js';"];
    await writeFile(join(root,'barrel.ts'),(reverse?rows.reverse():rows).join('\n'));
    const {manifest,receipt}=await generateCandidateCem({sourceRoot:root,sources:['class.ts','barrel.ts'],lit:false});
    assert.deepEqual(manifest.modules.find((m:any)=>m.path==='barrel.ts').exports.map((e:any)=>e.name),['Example','Options']);
    assert.deepEqual(receipt.topology.typeOnlyExports.filter((e:any)=>e.module==='barrel.ts').map((e:any)=>e.name),['Options']);
  }
}));

test('explicit type-only export suppresses a same-name runtime star', async () => fixture(async root => {
  const result=await barrelTopology(root,{'class.ts':'export class SomeClass {}','barrel.ts':"export * from './class.js'; export type {SomeClass} from './class.js';"});
  assert.deepEqual(result.types,['barrel.ts#SomeClass']);
  assert.deepEqual(result.edges,['barrel.ts#SomeClass','class.ts#SomeClass']);
}));

test('conflicting star exports still fail closed', async () => fixture(async root => {
  await writeFile(join(root,'a.ts'),'export class Example {}');await writeFile(join(root,'b.ts'),'export class Example {}');
  await writeFile(join(root,'barrel.ts'),"export * from './a.js'; export * from './b.js';");
  await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['a.ts','b.ts','barrel.ts'],lit:false}),/Duplicate source export barrel\.ts#Example/);
}));

test('Lit static converter metadata preserves authored types, optional unions and initializers',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'sample.ts'),`import {LitElement} from 'lit';
    /** @tag en-type-retention */ export class Sample extends LitElement {
      static properties={items:{attribute:false},label:{},href:{type:String},value:{type:Number},secret:{state:true}};
      items:readonly string[]=[];label:string='Actions';href:string|undefined=undefined;value:number|undefined=undefined;secret='hidden';
    }`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declaration=manifest.modules[0].declarations.find((item:any)=>item.name==='Sample');
  for(const [name,text] of [['items','readonly string[]'],['label','string'],['href','string|undefined'],['value','number|undefined']]){
    const member=declaration.members.find((item:any)=>item.name===name);
    assert.equal(member.type.text.replaceAll(' ',''),text.replaceAll(' ',''),name);assert.equal(member.privacy,'public');
  }
  assert.equal(declaration.members.find((item:any)=>item.name==='items').default,'[]');
  assert.equal(declaration.attributes.find((item:any)=>item.name==='label').type.text,'string');
  assert.ok(!declaration.attributes.some((item:any)=>['items','secret'].includes(item.name)));
}));

test('Lit property decorators retain readonly and initializer defaults while suppressing attributes',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'sample.ts'),`import {LitElement} from 'lit';import {property,state} from 'lit/decorators.js';
    /** @tag en-decorator-retention */ export class Sample extends LitElement {
      @property() readonly label:string='Actions';
      /** @attribute hidden */ @property({attribute:false}) hidden:string='secret';
      @state() stateValue:string='internal';
    }`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declaration=manifest.modules[0].declarations.find((item:any)=>item.name==='Sample');
  const member=declaration.members.find((item:any)=>item.name==='label');
  assert.equal(member.readonly,true);assert.equal(member.default,"'Actions'");assert.equal(member.type.text,'string');
  assert.equal(declaration.attributes.find((item:any)=>item.name==='label').default,"'Actions'");
  assert.ok(!declaration.attributes.some((item:any)=>['hidden','stateValue'].includes(item.name)));
}));

test('Lit inherited attribute origins remain on the declaring ancestor',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit'; export class Base extends LitElement {static properties={label:{}};label='base';}`);
  await writeFile(join(root,'middle.ts'),`import {Base} from './base.js';export class Middle extends Base {}`);
  await writeFile(join(root,'leaf.ts'),`import {Middle} from './middle.js';/** @tag en-origin-retention */ export class Leaf extends Middle {}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','middle.ts','leaf.ts']});
  for(const path of ['middle.ts','leaf.ts']){
    const declaration=manifest.modules.find((item:any)=>item.path===path).declarations[0];
    for(const collection of ['members','attributes']){
      const member=declaration[collection].find((item:any)=>item.name==='label');
      assert.deepEqual(member.inheritedFrom,{name:'Base',module:'base.ts'});assert.equal(member.type.text,'string');
    }
  }
}));

test('Lit subclass converter-only metadata cannot narrow an inherited property',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';export class Base extends LitElement {static properties={value:{}};value:number|undefined=undefined;}`);
  await writeFile(join(root,'child.ts'),`import {Base} from './base.js';/** @tag en-inherited-converter */ export class Child extends Base {static properties={value:{type:Number}};}`);
  await writeFile(join(root,'leaf.ts'),`import {Child} from './child.js';/** @tag en-leaf-converter */ export class Leaf extends Child {}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts','leaf.ts']});
  for(const path of ['child.ts','leaf.ts']) {
    const child=manifest.modules.find((item:any)=>item.path===path).declarations[0];
    for(const collection of ['members','attributes']){
      const value=child[collection].find((item:any)=>item.name==='value');
      assert.equal(value.type.text.replaceAll(' ',''),'number|undefined');
      assert.deepEqual(value.inheritedFrom,{name:'Base',module:'base.ts'});
    }
  }
}));

test('Lit concrete overrides clear both member and attribute base origins',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';export class Base extends LitElement {static properties={value:{}};value:number|undefined=undefined;}`);
  await writeFile(join(root,'child.ts'),`import {Base} from './base.js';/** @tag en-concrete-override */ export class Child extends Base {static properties={value:{type:Number}};override value:number=1;}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts']});
  const child=manifest.modules.find((item:any)=>item.path==='child.ts').declarations[0];
  for(const collection of ['members','attributes']){
    const value=child[collection].find((item:any)=>item.name==='value');
    assert.equal(value.type.text,'number');assert.equal(value.default,'1');
    assert.equal(value.inheritedFrom,undefined);
  }
}));

test('Lit constructor assignments supersede initializers while explicit default docs remain authoritative',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'sample.ts'),`import {LitElement} from 'lit';/** @tag en-constructor-default */ export class Sample extends LitElement {
    static properties={value:{},documented:{}};value:number=1;
    /** @default 4 */ documented:number=1;
    constructor(){super();this.value=2;this.documented=3;}
  }`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declaration=manifest.modules[0].declarations.find((item:any)=>item.name==='Sample');
  for(const collection of ['members','attributes']){
    assert.equal(declaration[collection].find((item:any)=>item.name==='value').default,'2');
    assert.equal(declaration[collection].find((item:any)=>item.name==='documented').default,'4');
  }
}));

test('constructor assignments update inherited Lit defaults without repeating static metadata',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';export class Base extends LitElement {static properties={label:{},multiple:{type:Boolean}};label='';multiple=true;}`);
  await writeFile(join(root,'child.ts'),`import {Base} from './base.js';/** @tag en-constructor-child */ export class Child extends Base {constructor(){super();this.label='Commands';this.multiple=false;}}`);
  await writeFile(join(root,'leaf.ts'),`import {Child} from './child.js';/** @tag en-constructor-leaf */ export class Leaf extends Child {constructor(){super();this.label='Leaf';}}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts','leaf.ts']});
  for(const [path,label] of [['child.ts',"'Commands'"],['leaf.ts',"'Leaf'"]]){
    const declaration=manifest.modules.find((item:any)=>item.path===path).declarations[0];
    for(const collection of ['members','attributes']){
      assert.equal(declaration[collection].find((item:any)=>item.name==='label').default,label);
      assert.equal(declaration[collection].find((item:any)=>item.name==='multiple').default,'false');
    }
  }
}));

test('declare-only Lit type refinements retain inherited initialization and concrete fields replace it',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';export class Base extends LitElement {static properties={items:{attribute:false},label:{}};items:readonly string[]=[];label='base';}`);
  await writeFile(join(root,'child.ts'),`import {Base} from './base.js';/** @tag en-declare-child */ export class Child extends Base {declare items:readonly ('a'|'b')[];override label='child';}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts']});
  const child=manifest.modules.find((item:any)=>item.path==='child.ts').declarations[0];
  const items=child.members.find((item:any)=>item.name==='items');
  assert.equal(items.default,'[]');assert.equal(items.type.text.replaceAll(' ',''),"readonly('a'|'b')[]");
  assert.equal(child.members.find((item:any)=>item.name==='label').default,"'child'");
  assert.equal(child.attributes.find((item:any)=>item.name==='label').default,"'child'");
  assert.ok(!child.attributes.some((item:any)=>item.name==='items'));
}));

test('Lit member documentation survives unannotated overrides and reaches attribute deprecation',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';export class Base extends LitElement {
    static properties={value:{}};
    /** Accepted value.\n     * @deprecated Use key.\n     */
    get value():string{return '';}set value(input:string){}
  }`);
  await writeFile(join(root,'child.ts'),`import {Base} from './base.js';/** @tag en-doc-child */ export class Child extends Base {override get value():string{return 'child';}override set value(input:string){}}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts']});
  for(const path of ['base.ts','child.ts']){
    const declaration=manifest.modules.find((item:any)=>item.path===path).declarations[0];
    for(const collection of ['members','attributes']){
      const value=declaration[collection].find((item:any)=>item.name==='value');
      assert.equal(value.description,'Accepted value.');assert.equal(value.deprecated,'Use key.');
      if(path==='child.ts')assert.equal(value.inheritedFrom,undefined);
    }
  }
}));

test('direct Lit superclass references retain bound package ownership',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'sample.ts'),`import {LitElement} from 'lit';/** @tag en-owned-superclass */ export class Sample extends LitElement {}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const reference=manifest.modules[0].declarations.find((item:any)=>item.name==='Sample').superclass;
  assert.equal(reference.name,'LitElement');assert.equal(reference.package,'lit-element');assert.equal(reference.module,'development/lit-element.d.ts');
  const declarationSource=await readFile(join(dirname(resolveCompilerPackage('lit-element').packagePath),reference.module),'utf8');
  assert.match(declarationSource,/export declare class LitElement\s+extends/);
}));

test('direct callable initializers retain structured parameters and returns while aliases remain variables',async()=>fixture(async root=>{
  const file=join(root,'functions.ts');await writeFile(file,`export const arrow=(value:string)=>value.length;
    export const empty=():void=>{};
    export const shaped=function(value?:string, fallback='value',...rest:number[]):string{return value??fallback;};
    export const alias=arrow;const factory=()=>arrow;export const made=factory();
    export const annotated:(value:string)=>string|undefined=(value:string):string=>value;`);
  const program=ts.createProgram([file],{strict:true,noEmit:true}),source=program.getSourceFile(file)!;
  const manifest:any={schemaVersion:'2.1.0',modules:[]};completeCandidateModules(manifest,root,[source],program.getTypeChecker(),program);
  const byName=new Map(manifest.modules[0].declarations.map((item:any)=>[item.name,item])) as Map<string,any>;
  assert.equal(byName.get('arrow').kind,'function');assert.equal(byName.get('arrow').return.type.text,'number');
  assert.deepEqual(byName.get('arrow').parameters,[{name:'value',type:{text:'string'}}]);
  assert.equal(byName.get('empty').return.type.text,'void');assert.deepEqual(byName.get('empty').parameters,[]);
  assert.equal(byName.get('shaped').kind,'function');assert.equal(byName.get('shaped').return.type.text,'string');
  assert.equal(byName.get('shaped').parameters[0].optional,true);assert.equal(byName.get('shaped').parameters[1].default,"'value'");assert.equal(byName.get('shaped').parameters[2].rest,true);
  for(const name of ['alias','made','annotated'])assert.equal(byName.get(name).kind,'variable');
  assert.equal(byName.get('annotated').type.text,'(value:string)=>string|undefined');
}));

test('actual conditional and replacement-renderer omissions exclude only inherited CSS parts',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  const parts=['field','option','option-content','options','tags'];
  const mapping:Record<string,string[]>={'checkbox-group.ts':['tags'],'multiselect.ts':['option-content'],'toggle-group.ts':['option-content','tags'],'selection-collection.ts':parts};
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';\n/**\n${parts.map(name=>' * @csspart '+name).join('\n')}\n */\nexport class Base extends LitElement {}`);
  let index=0;const files=['base.ts'];
  for(const [file,omitted] of Object.entries(mapping)){
    const actual=await readFile(new URL('../../packages/elements/src/'+file,import.meta.url),'utf8');
    assert.deepEqual([...actual.matchAll(/@omit-csspart\s+(\S+)/g)].map(match=>match[1]).sort(),[...omitted].sort());
    const name='Child'+index++,path=name+'.ts';files.push(path);
    await writeFile(join(root,path),`import {Base} from './base.js';\n/**\n${omitted.map(part=>' * @omit-csspart '+part).join('\n')}\n */\nexport class ${name} extends Base {}`);
  }
  await writeFile(join(root,'own.ts'),`import {Base} from './base.js';\n/**\n * @omit-csspart tags\n * @csspart tags - Own rendered part.\n */\nexport class Own extends Base {}`);files.push('own.ts');
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:files});index=0;
  for(const omitted of Object.values(mapping)){
    const path='Child'+(index++)+'.ts';
    const module=manifest.modules.find((item:any)=>item.path===path);assert.ok(module,path);
    const actual=module.declarations[0].cssParts??[];
    assert.deepEqual(actual.map((item:any)=>item.name).sort(),parts.filter(part=>!omitted.includes(part)).sort());
  }
  const own=manifest.modules.find((item:any)=>item.path==='own.ts').declarations[0].cssParts.find((item:any)=>item.name==='tags');
  assert.equal(own.description,'Own rendered part.');assert.equal(own.inheritedFrom,undefined);
}));


test('inherited facet documentation fills only absent child facts and respects omissions',()=>{
  const keys=['members','attributes','cssProperties','cssParts','cssStates','slots','events'];
  const base:any={name:'Base'},child:any={name:'Child',superclass:{name:'Base',module:'base.ts'},omitInherited:{}};
  for(const key of keys){
    base[key]=[{name:'shared',kind:'field',description:'Base docs',summary:'Base summary',deprecated:'Use replacement',type:{text:'string'},default:'base'},
      {name:'empty',description:'Base docs'}, {name:'omitted',description:'Do not inherit'}];
    child[key]=[{name:'shared',kind:'field',type:{text:'number'},default:'child'}, {name:'empty',description:''}, {name:'omitted'}];child.omitInherited[key]=['omitted'];
  }
  const manifest=inheritanceManifest(['base.ts',base],['child.ts',child]),before=structuredClone(manifest);
  const patch=candidateInheritancePatch(manifest).replaceByDeclaration['child.ts#Child'];
  for(const key of keys){
    const item=patch[key][0];assert.equal(item.description,'Base docs');assert.equal(item.summary,'Base summary');assert.equal(item.deprecated,'Use replacement');
    assert.deepEqual(item.type,{text:'number'});assert.equal(item.default,'child');assert.equal(item.inheritedFrom,undefined);
    assert.equal(patch[key][1].description,'');assert.equal(patch[key][2].description,undefined);
  }
  assert.deepEqual(manifest,before);
});

test('actual Lit child attributes and rediscovered default slot retain base documentation',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement,html} from 'lit';
    /** @attr {string} aria-expanded - Expanded state forwarded to the button.
     * @slot - Dialog body content.
     */
    export class Base extends LitElement {
      static properties={expanded:{attribute:'aria-expanded'}};expanded:string|null=null;
      render(){return html\`<slot></slot>\`;}
    }`);
  await writeFile(join(root,'child.ts'),`import {html} from 'lit';import {Base} from './base.js';
    /** @tag en-child */ export class Child extends Base {render(){return html\`<section><slot></slot></section>\`;}}`);
  const result=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts'],lit:true});
  const child=result.manifest.modules.find((module:any)=>module.path==='child.ts').declarations.find((item:any)=>item.name==='Child');
  assert.equal(child.attributes.find((item:any)=>item.name==='aria-expanded').description,'Expanded state forwarded to the button.');
  assert.equal(child.slots.find((item:any)=>item.name==='').description,'Dialog body content.');
}));


test('actual token-editor relay retains the model document and reason payload during extraction',()=>{
  const file=fileURLToPath(new URL('../../packages/elements/src/token-editor/element.ts',import.meta.url));
  const program=ts.createProgram([file],{strict:true,skipLibCheck:true,noEmit:true,target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
  const source=program.getSourceFile(file)!,checker=program.getTypeChecker();assert(source);
  const node=source.statements.find((entry:any)=>ts.isClassDeclaration(entry)&&entry.name?.text==='EnTokenEditor')!;assert(node);
  const events=detectClassEvents(node,{filePath:file,sourceText:source.text,sourceFile:source,checker,typeParsing:'public'});
  assert(events);const event=events.find((entry:any)=>entry.name==='en-change');assert(event?.detail);
  assert.match(event.detail,/DocumentValue/);assert.doesNotMatch(event.detail,/\bany\b/);
  const details:any[]=[];
  function visit(current:any){
    if(ts.isNewExpression(current)&&ts.isIdentifier(current.expression)&&current.expression.text==='CustomEvent'&&
      current.arguments?.[0]&&ts.isStringLiteral(current.arguments[0])&&current.arguments[0].text==='en-change'){
      const options=current.arguments[1];assert(ts.isObjectLiteralExpression(options));
      const detail=options.properties.find((item:any)=>ts.isPropertyAssignment(item)&&item.name.getText(source)==='detail');assert(detail);details.push(detail.initializer);
    }
    ts.forEachChild(current,visit);
  }
  visit(node);assert.equal(details.length,1);
  const detailType=checker.getTypeAtLocation(details[0]);
  for(const key of ['previous','proposed']){
    const property=detailType.getProperty(key);assert(property);
    assert.equal(checker.typeToString(checker.getTypeOfSymbolAtLocation(property,details[0]),details[0]),'DocumentValue');
  }
  const reason=detailType.getProperty('reason');assert(reason);
  const reasonType=checker.getTypeOfSymbolAtLocation(reason,details[0]);assert(reasonType.isUnion());
  assert.deepEqual(reasonType.types.map((type:any)=>type.value).sort(),['edit','redo','undo']);
});

test('inherited attribute annotations follow field ownership and preserve later authored overrides',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';
    /** @attr {string} aria-expanded - Base contract. */
    export class Base extends LitElement {static properties={expanded:{attribute:'aria-expanded'}};expanded:string|null=null;}`);
  await writeFile(join(root,'child.ts'),`import {Base} from './base.js';
    /** @tag en-child */export class Child extends Base {constructor(){super();this.expanded='open';}}`);
  await writeFile(join(root,'documented.ts'),`import {Child} from './child.js';
    /** @tag en-documented
     * @attr {'open'|'closed'} aria-expanded - Narrower documented contract.
     */export class Documented extends Child {}`);
  await writeFile(join(root,'leaf.ts'),`import {Documented} from './documented.js';
    /** @tag en-leaf */export class Leaf extends Documented {}`);
  await writeFile(join(root,'concrete.ts'),`import {Base} from './base.js';
    /** @tag en-concrete */export class Concrete extends Base {override expanded:'active'|null=null;}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','child.ts','documented.ts','leaf.ts','concrete.ts']});
  const declaration=(path:string)=>manifest.modules.find((module:any)=>module.path===path).declarations[0];
  const attr=(path:string)=>declaration(path).attributes.find((item:any)=>item.name==='aria-expanded');
  for(const name of ['child','documented','leaf','concrete'])assert.equal(declaration(name+'.ts').tagName,'en-'+name);
  assert.equal(attr('concrete.ts').type.text.replaceAll(' ',''),"'active'|null");assert.equal(attr('concrete.ts').inheritedFrom,undefined);
  assert.equal(attr('child.ts').type.text,'string');assert.equal(attr('child.ts').default,"'open'");
  assert.deepEqual(attr('child.ts').inheritedFrom,{name:'Base',module:'base.ts'});
  assert.equal(attr('documented.ts').type.text.replaceAll(' ',''),"'open'|'closed'");assert.equal(attr('documented.ts').inheritedFrom,undefined);
  assert.equal(attr('leaf.ts').type.text.replaceAll(' ',''),"'open'|'closed'");
  assert.deepEqual(attr('leaf.ts').inheritedFrom,{name:'Documented',module:'documented.ts'});
  assert.equal(declaration('leaf.ts').members.find((item:any)=>item.name==='expanded').type.text.replaceAll(' ',''),'string|null');
}));


async function publicGraphInputs() {
  const {digestJson} = await import('../evidence/identity.ts');
  const {publicEntryPolicy} = await import('./public-policy.ts');
  const packageName = '@fixture/elements';
  const definitions = [{tagName:'en-test',className:'Child',classSource:'src/child.ts',source:'src/definitions/test.ts',dependencies:[]}];
  const manifest:any = {schemaVersion:'2.1.0',modules:[
    {kind:'javascript-module',path:'src/deep/base.ts',declarations:[{kind:'class',name:'Base'}]},
    {kind:'javascript-module',path:'src/child.ts',declarations:[{kind:'class',name:'Child',tagName:'en-test',members:[
      {kind:'field',name:'visible',privacy:'public'},{kind:'field',name:'hidden',privacy:'private'},{kind:'method',name:'protectedMethod',privacy:'protected'},
    ],events:[{name:'en-change',type:{text:"import('../events.js').BaseEvent"},inheritedFrom:{name:'Base',module:'src/deep/base.ts'}},
      {name:'en-input',type:{text:'CustomEvent<boolean>'}},{name:'en-private',privacy:'private'}]}]},
  ]};
  const receipt = {manifestDigest:digestJson(manifest),catalogDigest:digestJson(definitions.map(({tagName,className})=>({tagName,className}))),eventContracts:[
    {name:'en-change',source:'src/deep/base.ts',className:'Base',type:'CustomEvent<string>',detail:'string'},
    {name:'en-change',source:'src/child.ts',className:'Child',type:'CustomEvent<number>',detail:'number'},
    {name:'en-input',source:'src/child.ts',className:'Child',type:'CustomEvent<boolean>',detail:'boolean'},
  ]};
  const types:any = {schemaVersion:1,packageName,generator:{version:1,typescript:'fixture',digest:'fixture'},gaps:[],
    entrypoints:Object.fromEntries([...publicEntryPolicy.additionalEntries,'./test.js','./define/test.js','./definitions/test.js'].map(path=>[packageName+(path==='.'?'':path.slice(1)),'src/child.ts'])),
    exports:{[packageName+'/test.js#Child']:'src/child.ts#Child'},exportKinds:{},dependencies:{},externalReferences:[],
    declarations:{'src/child.ts#Child':{name:'Child',source:'src/child.ts',kind:'class',declaration:'export class Child {}',references:[]}}};
  return {manifest,receipt,types,definitions};
}

test('public graph preserves declaring event scope against a conflicting child scope',async()=>{
  const {assemblePublicGraph} = await import('./public-graph.ts');
  const {digestJson} = await import('../evidence/identity.ts');
  const input = await publicGraphInputs(), before = structuredClone(input);
  const graph = await assemblePublicGraph(input.manifest,input.receipt,input.types,input.definitions);
  const component = graph.components[0]!;
  assert.deepEqual(component.members.map((item:any)=>item.name),['visible']);
  assert.equal(component.events.length,2);
  assert.equal(component.events[0].type,'CustomEvent<string>');
  assert.equal(component.events[0].detail,'string');
  assert.deepEqual(component.events[0].inheritedFrom,{name:'Base',module:'src/deep/base.ts'});
  assert.equal(component.events[1].detail,'boolean');
  assert.equal(graph.manifestDigest,digestJson(input.manifest));assert.equal(graph.typeDigest,digestJson(input.types));
  assert.deepEqual(input,before);
});

test('public graph rejects incomplete and mismatched evidence before release review',async()=>{
  const {assemblePublicGraph} = await import('./public-graph.ts');
  const cases:Array<[(input:any)=>void,RegExp]> = [
    [input=>{input.manifest.modules[1].declarations[0].members.push({kind:'field',name:'changed'});},/CEM does not match/],
    [input=>{input.definitions[0].tagName='en-other';},/catalog does not match/],
    [input=>{input.types.gaps=['Missing contract'];},/complete type snapshot/],
    [input=>{delete input.types.gaps;},/complete type snapshot/],
    [input=>{input.types.schemaVersion=2;},/complete type snapshot/],
    [input=>{delete input.types.entrypoints['@fixture/elements/context.js'];},/Supported entrypoint/],
    [input=>{delete input.types.declarations['src/child.ts#Child'];},/No public class type/],
    [input=>{input.receipt.eventContracts=[];},/Unclassified or untyped public event/],
  ];
  for (const [change,expected] of cases) {
    const input = await publicGraphInputs();change(input);
    await assert.rejects(()=>assemblePublicGraph(input.manifest,input.receipt,input.types,input.definitions),expected);
  }
});

test('shared public graph assembly reconstructs retained contract content without claiming freshness',async()=>{
  const {assemblePublicGraph} = await import('./public-graph.ts');
  const root = new URL('../../packages/elements/',import.meta.url);
  const [manifest,receipt,types,retained] = await Promise.all(['custom-elements.json','custom-elements.json.receipt.json','public-types.json','public-api.json'].map(async file=>JSON.parse(await readFile(new URL(file,root),'utf8'))));
  const definitions:any[] = retained.components.map((item:any)=>({tagName:item.tagName,className:item.className,classSource:item.source,source:item.definition,dependencies:[]}));
  for (let index=0;index<definitions.length;index++) definitions[index].dependencies=retained.components[index].dependencies.map((tag:string)=>definitions.find(item=>item.tagName===tag));
  const actual = await assemblePublicGraph(manifest,receipt,types,definitions);
  // The changed assembler source has its own digest; every contract field stays exact.
  assert.match(actual.generatorDigest,/^sha256:[a-f0-9]{64}:sha256:[a-f0-9]{64}$/);
  assert.deepEqual({...actual,generatorDigest:retained.generatorDigest},retained);
});

test('candidate public bundle refuses retained-package paths, symlink aliases and reused outputs',async()=>fixture(async root=>{
  const {writeCandidatePublicArtifacts} = await import('./generate-candidate-public.ts');
  const packageRoot=join(root,'package');await mkdir(packageRoot);
  const alias=join(root,'alias');await symlink(packageRoot,alias);
  await assert.rejects(()=>writeCandidatePublicArtifacts(join(packageRoot,'candidate'),packageRoot),/outside the elements package/);
  await assert.rejects(()=>writeCandidatePublicArtifacts(join(alias,'candidate'),packageRoot),/outside the elements package/);
  const output=join(root,'existing');await mkdir(output);await writeFile(join(output,'receipt.txt'),'preserve');
  await assert.rejects(()=>writeCandidatePublicArtifacts(output,packageRoot),{code:'EEXIST'});
  assert.equal(await readFile(join(output,'receipt.txt'),'utf8'),'preserve');
}));


test('authored part omissions remain consistent through Lit and vanilla CEM, release, graph and docs consumers',async()=>{
 for (const lit of [true,false]) for (const own of [false,true]) await fixture(async root=>{
  await mkdir(join(root,'src/deep'),{recursive:true});await mkdir(join(root,'node_modules'));
  await symlink(dirname(resolveCompilerPackage('lit').packagePath),join(root,'node_modules/lit'),'dir');
  await writeFile(join(root,'src/deep/base.ts'),`${lit ? "import {LitElement} from 'lit';" : ''}\n/**\n * @csspart keep\n * @csspart tags\n */\nexport class Base extends ${lit ? 'LitElement' : 'HTMLElement'} {}`);
  await writeFile(join(root,'src/child.ts'),`import {Base} from './deep/base.js';\n/**\n * @tag en-test\n * @${own ? 'omit-part' : 'omit-csspart'} tags\n${own ? ' * @csspart tags - Child contract.\n' : ''} */\nexport class Child extends Base {}`);
  const {manifest,receipt}=await generateCandidateCem({sourceRoot:root,sources:['src/deep/base.ts','src/child.ts'],lit});
  const child=manifest.modules.find((m:any)=>m.path==='src/child.ts').declarations.find((d:any)=>d.name==='Child');
  const expected=own ? ['keep','tags'] : ['keep'];
  assert.deepEqual(child['x-en-reve-omitted-css-parts'],['tags']);assert.deepEqual(child.cssParts.map((p:any)=>p.name).sort(),expected);
  if(own) assert.equal(child.cssParts.find((p:any)=>p.name==='tags').description,'Child contract.');
  const {snapshotCem}=await import('../releases/cem-diff.ts');
  const snapshot=snapshotCem(manifest);assert.equal(snapshot.elements.get('en-test')!.surfaces.has('css-part:tags'),own);assert.ok(snapshot.elements.get('en-test')!.surfaces.has('css-part:keep'));
  const {assemblePublicGraph}=await import('./public-graph.ts');
  const {normalizeAPIReference}=await import('../../apps/docs/src/api-reference/model.ts');
  const input=await publicGraphInputs();
  const graph=await assemblePublicGraph(manifest,{...receipt,catalogDigest:input.receipt.catalogDigest,eventContracts:[]},input.types,input.definitions);
  assert.deepEqual(graph.components[0]!.parts.map((p:any)=>p.name).sort(),expected);
  const component=graph.components[0]!;
  const docs=normalizeAPIReference({manifest,manifestDigest:graph.manifestDigest,packageName:input.types.packageName,packageVersion:'fixture',entries:[{tagName:component.tagName,className:component.className,classImport:component.classImport,definitionImport:component.definitionImport,example:null}]});
  assert.deepEqual(docs.components[0]!.sections.cssParts.map(p=>p.name).sort(),expected);
});
});


test('candidate bundle comparisons retain every artifact and provenance field',async()=>fixture(async root=>{
  const {captureTypeDependencyQueries}=await import('./type-dependencies.ts');
  const {assertCurrentCandidateArtifacts,candidatePublicFiles}=await import('./verify-candidate-public.ts');
  const file=join(root,'contract.d.ts');await writeFile(file,'export interface Contract {value:string}');
  const {compiler}=await captureTypeDependencyQueries(async()=>ts.sys.readFile(file));
  const fresh:any={manifest:{source:'candidate'},receipt:{manifestDigest:'exact'},types:{generator:{digest:'exact'}},graph:{generatorDigest:'exact'},compiler,resolution:compilerResolution()};
  assert.doesNotThrow(()=>assertCurrentCandidateArtifacts(structuredClone(fresh),fresh));
  for(const key of Object.keys(candidatePublicFiles)){
    const changed=structuredClone(fresh);changed[key]={...changed[key],changed:'unaccepted'};
    assert.throws(()=>assertCurrentCandidateArtifacts(changed,fresh),/Candidate/);
    const missing=structuredClone(fresh);delete missing[key];
    assert.throws(()=>assertCurrentCandidateArtifacts(missing,fresh),/Candidate/);
  }
}));

test('candidate bundle verification rejects changed external bodies, failed lookups and incomplete query membership',async()=>fixture(async root=>{
  const {captureTypeDependencyQueries}=await import('./type-dependencies.ts');
  const {assertCurrentCandidateArtifacts}=await import('./verify-candidate-public.ts');
  const body=join(root,'external.d.ts'),missing=join(root,'not-yet-present.d.ts');
  await writeFile(body,'export interface External {value:string}');
  const {compiler}=await captureTypeDependencyQueries(async()=>{ts.sys.readFile(body);ts.sys.fileExists(missing);});
  const fresh:any={manifest:{},receipt:{},types:{},graph:{},compiler,resolution:compilerResolution()};
  assert.doesNotThrow(()=>assertCurrentCandidateArtifacts(structuredClone(fresh),fresh));
  const partial=structuredClone(fresh);delete partial.compiler.observations[Object.keys(partial.compiler.observations)[0]!];
  assert.throws(()=>assertCurrentCandidateArtifacts(partial,fresh),/compiler-queries/);
  await writeFile(missing,'export {};');
  assert.throws(()=>assertCurrentCandidateArtifacts(structuredClone(fresh),fresh),/dependency queries/);
  await rm(missing);await writeFile(body,'export interface External {value:number}');
  assert.throws(()=>assertCurrentCandidateArtifacts(structuredClone(fresh),fresh),/dependency queries/);
}));

test('candidate bundle loader rejects incomplete status and absent artifacts before regeneration',async()=>fixture(async root=>{
  const {verifyCandidatePublicArtifacts}=await import('./verify-candidate-public.ts');
  await writeFile(join(root,'status.json'),JSON.stringify({status:'running'}));
  await assert.rejects(()=>verifyCandidatePublicArtifacts(root),/incomplete/);
  await writeFile(join(root,'status.json'),JSON.stringify({status:'generated-unqualified',requiresBaselineComparison:true,components:96}));
  await assert.rejects(()=>verifyCandidatePublicArtifacts(root),{code:'ENOENT'});
}));

test('candidate consumers reject foreign workspaces, workspace outputs, symlink aliases and reused directories',async()=>fixture(async root=>{
  const {candidateWorkspaceRoot,candidateElementsRoot,assertCandidateElementsRoot,reserveCandidateConsumerOutput}=await import('./candidate-workspace.ts');
  const {generateCandidateAPIReference}=await import('../../apps/docs/scripts/generate-api-reference.mjs');
  const {createCandidateCoverageReport}=await import('../customization/verify.mjs');
  await assert.rejects(()=>generateCandidateAPIReference({workspaceRoot:root,bundleRoot:root,outputRoot:join(root,'docs')}),/implementation workspace/);
  await assert.rejects(()=>createCandidateCoverageReport({root,bundleRoot:root}),/implementation workspace/);
  await assert.rejects(()=>assertCandidateElementsRoot(root),/implementation elements package/);
  assert.equal(await assertCandidateElementsRoot(candidateElementsRoot),await realpath(candidateElementsRoot));
  await assert.rejects(()=>reserveCandidateConsumerOutput(join(candidateWorkspaceRoot,'candidate-consumer-output')),/outside the implementation workspace/);
  const alias=join(root,'workspace-alias');await symlink(candidateWorkspaceRoot,alias);
  await assert.rejects(()=>reserveCandidateConsumerOutput(join(alias,'candidate-consumer-output')),/outside the implementation workspace/);
  const output=join(root,'existing');await mkdir(output);await writeFile(join(output,'receipt.txt'),'preserve');
  await assert.rejects(()=>reserveCandidateConsumerOutput(output),{code:'EEXIST'});
  assert.equal(await readFile(join(output,'receipt.txt'),'utf8'),'preserve');
}));


test('inferred and parsed types resolve external/global collisions in the consuming source scope',async()=>fixture(async root=>{
  const external=join(root,'external.ts'),consumer=join(root,'consumer.ts');
  await writeFile(external,`export class Selection {readonly origin='external' as const;}
    export const createSelection=()=>new Selection();
    export const createBox=()=>({selection:createSelection()});
    export const createCallable=()=>Object.assign((value:Selection)=>value,{selected:createSelection()});`);
  const code=`import {createSelection,createBox,createCallable} from './external.js';
    export class Consumer {
      use(value=createSelection()) {}
      box(){return createBox();}
      callable(){return createCallable();}
      global(value:Selection){return value;}
    }`;
  await writeFile(consumer,code);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['external.ts','consumer.ts'],lit:false});
  const declaration=manifest.modules.find((m:any)=>m.path==='consumer.ts').declarations.find((d:any)=>d.name==='Consumer');
  const method=(name:string)=>declaration.members.find((m:any)=>m.kind==='method'&&m.name===name);
  const texts:any={Parameter:method('use').parameters[0].type.text,Box:method('box').return.type.text,
    Callable:method('callable').return.type.text,GlobalParameter:method('global').parameters[0].type.text,GlobalReturn:method('global').return.type.text};
  for(const [name,row] of [['Parameter',method('use').parameters[0]],['Box',method('box').return],['Callable',method('callable').return]] as const){
    if(row.parsedType?.text)texts[name+'Parsed']=row.parsedType.text;
  }
  assert.equal(texts.GlobalParameter,'Selection');assert.equal(texts.GlobalReturn,'Selection');
  for(const [name,text] of Object.entries(texts)) if(!name.startsWith('Global'))assert.match(String(text),/import\(.+\)\.Selection/,name);
  await writeFile(consumer,code+'\n'+Object.entries(texts).map(([name,text])=>`type Probe${name} = ${text};`).join('\n'));
  const program=ts.createProgram([external,consumer],{strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
  const checker=program.getTypeChecker(),source=program.getSourceFile(consumer)!;
  const diagnostics=[...program.getSyntacticDiagnostics(),...program.getSemanticDiagnostics()];assert.deepEqual(diagnostics.map((d:any)=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  const aliases=new Map(source.statements.filter(ts.isTypeAliasDeclaration).map((node:any)=>[node.name.text,checker.getTypeFromTypeNode(node.type)]));
  function assertSelection(type:any,isExternal:boolean){
    assert(type?.symbol,'A class/interface symbol must survive the round-trip');
    const declarations=type.symbol.declarations??[];
    assert(declarations.length);
    assert(declarations.every((node:any)=>isExternal ? node.getSourceFile().fileName===external : node.getSourceFile().fileName.endsWith('/lib.dom.d.ts')));
  }
  for(const [name,type] of aliases){
    if(name.startsWith('ProbeGlobal'))assertSelection(type,false);
    else if(name.startsWith('ProbeBox')){
      const property=type.getProperty('selection');assert(property);assertSelection(checker.getTypeOfSymbolAtLocation(property,source),true);
    }else if(name.startsWith('ProbeCallable')){
      const signatures=checker.getSignaturesOfType(type,ts.SignatureKind.Call);assert.equal(signatures.length,1);
      assertSelection(checker.getReturnTypeOfSignature(signatures[0]),true);
      assertSelection(checker.getTypeOfSymbolAtLocation(signatures[0].parameters[0],source),true);
      const property=type.getProperty('selected');assert(property);assertSelection(checker.getTypeOfSymbolAtLocation(property,source),true);
    }else assertSelection(type,true);
  }
}));


test('expanded repeated callables, constructors and conditional unions round-trip without changing assignability',async()=>fixture(async root=>{
  const {getParsedTypeTextFromType}=await import('@wc-toolkit/cem-generator-utils');
  const file=join(root,'precedence.ts');
  const code=`export const handler=(value:string):string|undefined|number=>value.length;
    declare const Construct: new (value:string)=>{value:string};
    type Calls={first:typeof handler;second:typeof handler|null;third:typeof handler|null};
    type Constructors={first:typeof Construct;second:typeof Construct|null};
    type Conditional<T>={value:null|(T extends string ? {text:T} : {count:T})};
    type Intersections={value:((()=>string)|{key:string})&{tag:number}};
    type Arrays={value:Array<(()=>string)|null>;nested:Array<()=>string|undefined|number>};`;
  await writeFile(file,code);
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ESNext};
  const program=ts.createProgram([file],options),source=program.getSourceFile(file)!,checker=program.getTypeChecker();
  const expansions=new Map<string,string>();
  for(const node of source.statements.filter(ts.isTypeAliasDeclaration)){
    const text=getParsedTypeTextFromType(checker.getTypeFromTypeNode(node.type),checker,node);
    assert(text,node.name.text);expansions.set(node.name.text,text);
  }
  assert.match(expansions.get('Calls')!,/second:.*null/);
  assert.match(expansions.get('Conditional')!,/extends/);
  const declarations=[...expansions].map(([name,text])=>`type Expanded${name}${name==='Conditional'?'<T>':''}=${text};`);
  const names=['Calls','Constructors','Intersections','Arrays','Conditional<string>','Conditional<number>'];
  declarations.push(...names.flatMap((name,index)=>[`declare const original${index}:${name};`,`declare const expanded${index}:Expanded${name};`]));
  declarations.push(`const called:string|number|undefined=expanded0.first('ok');
    const nullableCalled:string|number|undefined=expanded0.second?.('ok');
    const constructed:{value:string}=new expanded1.first('ok');`);
  await writeFile(file,code+'\n'+declarations.join('\n'));
  const roundTrip=ts.createProgram([file],options),roundSource=roundTrip.getSourceFile(file)!,roundChecker=roundTrip.getTypeChecker();
  assert.deepEqual([...roundTrip.getSyntacticDiagnostics(),...roundTrip.getSemanticDiagnostics()].map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  const variables=new Map<string,any>();
  for(const statement of roundSource.statements)if(ts.isVariableStatement(statement))for(const declaration of statement.declarationList.declarations)variables.set(declaration.name.getText(),roundChecker.getTypeAtLocation(declaration.name));
  for(const [index,name] of names.entries()){
    const original=variables.get(`original${index}`),expanded=variables.get(`expanded${index}`);
    assert(roundChecker.isTypeAssignableTo(original,expanded),`${name}: original to expanded`);
    assert(roundChecker.isTypeAssignableTo(expanded,original),`${name}: expanded to original`);
  }
  // Verify callable behavior whether the printer uses an inline signature or typeof.
  const rejected=["expanded0.second('x');","expanded0.first(42);","new expanded1.first(42);",
    "const excludesUndefined:string|number=expanded0.first('x');"];
  await writeFile(file,code+'\n'+declarations.join('\n')+'\n'+rejected.join('\n'));
  const negative=ts.createProgram([file],options);assert.equal(negative.getSyntacticDiagnostics().length,0);
  assert.deepEqual(negative.getSemanticDiagnostics().map(d=>d.code),[2721,2345,2345,2322]);
}));

test('text resolution and equivalence preserve nested unions, arrows, conditionals and escaped literals',async()=>fixture(async root=>{
  const {resolveParsedTypeFromText,areTypeTextsEquivalent}=await import('@wc-toolkit/cem-generator-utils');
  const file=join(root,'text.ts');await writeFile(file,'type Choice="a"|"b";');
  const program=ts.createProgram([file],{strict:true,noEmit:true}),source=program.getSourceFile(file)!,checker=program.getTypeChecker();
  const controls=['(() => string | undefined | number)','Array<() => string | undefined | number>',
    'T extends string ? string | undefined | number : boolean',String.raw`"a\\\\" | "b"`,String.raw`'a\\\'|b' | undefined`];
  for(const text of controls){
    const resolved=resolveParsedTypeFromText(text,source,checker)!;
    assert(areTypeTextsEquivalent(resolved,text),`${text} became ${resolved}`);
    assert.equal(ts.createSourceFile('probe.ts',`type Probe=${resolved};`,ts.ScriptTarget.Latest,true).parseDiagnostics.length,0);
  }
  assert.equal(areTypeTextsEquivalent('(A | B) & C','A | (B & C)'),false);
  assert.equal(areTypeTextsEquivalent('`a${string}  x`','`a${string} x`'),false);
  assert.equal(areTypeTextsEquivalent("'a   b'","'a b'"),false);
  assert(areTypeTextsEquivalent("'a b'",'"a b"'));
  assert.equal(areTypeTextsEquivalent('Array<() => string | undefined | number>','Array<() => string | number> | undefined'),false);
  assert.equal(areTypeTextsEquivalent('(() => string | undefined | number)','(() => string | number) | undefined'),false);
  assert.equal(areTypeTextsEquivalent('T extends string ? string | number : boolean','number | T extends string ? string : boolean'),false);
  assert(areTypeTextsEquivalent(resolveParsedTypeFromText('Choice | undefined',source,checker),"'a' | 'b' | undefined"));
}));


test('real CEM expanded types retain readonly tuple, property, mapped and named contracts',async()=>fixture(async root=>{
  const file=join(root,'readonly.ts');
  const code=`export type Interval=readonly [number,number];
    export type Color={readonly space:'srgb';readonly channels:readonly [number,number,number];readonly alpha:number};
    export type Frozen=Readonly<{value:number;optional?:string}>;
    export interface Bookmark {readonly revision:number;}
    export class Contracts {interval!:Interval;color!:Color;frozen!:Frozen;bookmark!:Bookmark;capture():Bookmark{return {revision:1};}}`;
  await writeFile(file,code);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['readonly.ts'],lit:false});
  const declaration=manifest.modules.find((m:any)=>m.path==='readonly.ts').declarations.find((d:any)=>d.name==='Contracts');
  const member=(name:string)=>declaration.members.find((m:any)=>m.name===name);
  assert.match(member('interval').parsedType.text,/readonly\s*\[/,'Expanded tuple must retain readonly');
  assert.match(member('color').parsedType.text,/readonly/,'Expanded object must retain readonly');
  const types:any={Interval:member('interval'),Color:member('color'),Frozen:member('frozen'),Bookmark:member('bookmark'),Capture:member('capture').return};
  const emitted=Object.entries(types).map(([name,row]:[string,any])=>`type Emitted${name}=${row.parsedType?.text??row.type.text};`).join('\n');
  const positive=`declare let interval:EmittedInterval;declare let color:EmittedColor;declare let frozen:EmittedFrozen;declare let bookmark:EmittedBookmark;declare let capture:EmittedCapture;
    const min:number=interval[0];const alpha:number=color.alpha;const value:number=frozen.value;const revision:number=bookmark.revision;const captured:number=capture.revision;`;
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ESNext};
  await writeFile(file,code+'\n'+emitted+'\n'+positive);
  let program=ts.createProgram([file],options);
  assert.deepEqual([...program.getSyntacticDiagnostics(),...program.getSemanticDiagnostics()].map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  const mutations=['interval[0]=1;','color.alpha=1;','color.channels[0]=1;','frozen.value=1;','bookmark.revision=1;','capture.revision=1;'];
  await writeFile(file,code+'\n'+emitted+'\n'+positive+'\n'+mutations.join('\n'));
  program=ts.createProgram([file],options);assert.equal(program.getSyntacticDiagnostics().length,0);
  const diagnostics=program.getSemanticDiagnostics();assert.equal(diagnostics.length,mutations.length);
  assert(diagnostics.every(d=>d.code===2540),'Every prohibited write must retain the readonly diagnostic');
}));

test('structural expansion retains optional rest tuples, instantiated generics, methods and property names',async()=>fixture(async root=>{
  const {getParsedTypeTextFromType}=await import('@wc-toolkit/cem-generator-utils');
  const file=join(root,'structural.ts');
  const code=`declare const token:unique symbol;
    type Tuple=readonly [first:string,second?:number,...rest:boolean[]];
    type Box<T>={readonly value:T;pair:readonly [T,T]};type Concrete=Box<string>;
    type Methods={run(value:string|number):void;optional?(value:string|number):void};
    type Fields={run:(value:string|number)=>void};
    type Names={readonly 'not-an-identifier':string;readonly [token]:number;literal:"a'b";large:1n};`;
  await writeFile(file,code);const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ESNext};
  const program=ts.createProgram([file],options),source=program.getSourceFile(file)!,checker=program.getTypeChecker();
  const names=['Tuple','Concrete','Methods','Fields','Names'];const expanded:string[]=[];
  for(const name of names){
    const node=source.statements.find((n:any)=>ts.isTypeAliasDeclaration(n)&&n.name.text===name) as any;assert(node);
    const text=getParsedTypeTextFromType(checker.getTypeFromTypeNode(node.type),checker,node);assert(text);
    expanded.push(`type Expanded${name}=${text};declare const original${name}:${name};declare const expanded${name}:Expanded${name};`);
  }
  const positive=`const tuple1:ExpandedTuple=['first'];const tuple2:ExpandedTuple=['first',2,true,false];
    const concrete:ExpandedConcrete={value:'ok',pair:['a','b']};
    const methods:ExpandedMethods={run(value:string){},optional(value:string){}};
    const keys:ExpandedNames={'not-an-identifier':'ok',[token]:1,literal:"a'b",large:1n};`;
  await writeFile(file,code+'\n'+expanded.join('\n')+'\n'+positive);
  const round=ts.createProgram([file],options),roundSource=round.getSourceFile(file)!,roundChecker=round.getTypeChecker();
  assert.deepEqual([...round.getSyntacticDiagnostics(),...round.getSemanticDiagnostics()].map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  const variables=new Map<string,any>();for(const statement of roundSource.statements)if(ts.isVariableStatement(statement))for(const node of statement.declarationList.declarations)variables.set(node.name.getText(),roundChecker.getTypeAtLocation(node.name));
  for(const name of names){const a=variables.get('original'+name),b=variables.get('expanded'+name);assert(roundChecker.isTypeAssignableTo(a,b),name);assert(roundChecker.isTypeAssignableTo(b,a),name);}
  await writeFile(file,code+'\n'+expanded.join('\n')+'\n'+positive+`\nconst rejected:ExpandedFields={run(value:string){}};`);
  const negative=ts.createProgram([file],options);assert.equal(negative.getSyntacticDiagnostics().length,0);
  const diagnostics=negative.getSemanticDiagnostics();assert.equal(diagnostics.length,1);assert.equal(diagnostics[0]!.code,2322,'Function property must retain contravariance while methods retain bivariance');
}));


test('type normalization preserves literal contents and newline-sensitive grammar',async()=>{
  const {normalizeTypeText,areTypeTextsEquivalent,resolveParsedTypeFromText}=await import('@wc-toolkit/cem-generator-utils');
  const quote=String.fromCharCode(96);
  const texts=["'a  b'",quote+'prefix  $'+'{string}  suffix'+quote,"{first:'x  y'; // comment\n second:true}",'{first:string\n second:number}','| "a" | "b"'];
  for(const text of texts){
    const normalized=normalizeTypeText(text);
    assert(areTypeTextsEquivalent(normalized,text),text+' became '+normalized);
    assert.equal(ts.createSourceFile('type.ts','type T='+normalized+';',ts.ScriptTarget.Latest,true).parseDiagnostics.length,0);
  }
  const source=ts.createSourceFile('empty.ts','',ts.ScriptTarget.Latest,true);
  for(const text of ['true','false','true | undefined','false | undefined','true | null','false | null']){
    assert(areTypeTextsEquivalent(resolveParsedTypeFromText(text,source,{}),text),text);
  }
});

test('real CEM retains literal values and newline-separated members in emitted contracts',async()=>fixture(async root=>{
  const file=join(root,'literals.ts'),quote=String.fromCharCode(96);
  const code=[
    'export class LiteralContracts {',
    "spaced!: 'a  b';",
    'template!: '+quote+'prefix  $'+'{string}  suffix'+quote+';',
    'onlyTrue?: true;',
    'onlyFalse?: false;',
    "commented!: {first:'x  y'; // comment",
    'second:true};',
    'separated!: {first:string',
    'second:number};',
    "echo(value:'a  b'):'a  b' {return value;}",
    '}'
  ].join('\n');
  await writeFile(file,code);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['literals.ts'],lit:false});
  const declaration=manifest.modules.find((m:any)=>m.path==='literals.ts').declarations.find((d:any)=>d.name==='LiteralContracts');
  const member=(name:string)=>declaration.members.find((m:any)=>m.name===name);
  const rows:any={Spaced:member('spaced'),Template:member('template'),True:member('onlyTrue'),False:member('onlyFalse'),Commented:member('commented'),Separated:member('separated'),Parameter:member('echo').parameters[0],Return:member('echo').return};
  const originals:any={Spaced:"LiteralContracts['spaced']",Template:"LiteralContracts['template']",True:"LiteralContracts['onlyTrue']",False:"LiteralContracts['onlyFalse']",Commented:"LiteralContracts['commented']",Separated:"LiteralContracts['separated']",Parameter:"Parameters<LiteralContracts['echo']>[0]",Return:"ReturnType<LiteralContracts['echo']>"};
  const aliases:string[]=[],names:string[]=[];
  for(const [name,row] of Object.entries(rows) as [string,any][]){
    for(const [suffix,text] of [['Primary',row.type.text],...(row.parsedType?[['Parsed',row.parsedType.text]]:[])]){
      const key=name+suffix;names.push(key);
      aliases.push('type Emitted'+key+'='+text+';declare const original'+key+':'+originals[name]+';declare const emitted'+key+':Emitted'+key+';');
    }
    aliases.push('type Effective'+name+'='+(row.parsedType?.text??row.type.text)+';');
  }
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ESNext};
  await writeFile(file,code+'\n'+aliases.join('\n'));
  const program=ts.createProgram([file],options),source=program.getSourceFile(file)!,checker=program.getTypeChecker();
  assert.deepEqual([...program.getSyntacticDiagnostics(),...program.getSemanticDiagnostics()].map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[]);
  const variables=new Map<string,any>();for(const statement of source.statements)if(ts.isVariableStatement(statement))for(const node of statement.declarationList.declarations)variables.set(node.name.getText(),checker.getTypeAtLocation(node.name));
  for(const name of names){const a=variables.get('original'+name),b=variables.get('emitted'+name);assert(checker.isTypeAssignableTo(a,b),name);assert(checker.isTypeAssignableTo(b,a),name);}
  const rejected=["const badTrue:EffectiveTrue=false;","const badFalse:EffectiveFalse=true;","const badSpace:EffectiveSpaced='a b';","const badTemplate:EffectiveTemplate='prefix x suffix';"];
  await writeFile(file,code+'\n'+aliases.join('\n')+'\n'+rejected.join('\n'));
  const negative=ts.createProgram([file],options);assert.equal(negative.getSyntacticDiagnostics().length,0);
  assert.deepEqual(negative.getSemanticDiagnostics().map(d=>d.code),[2322,2322,2322,2322]);
}));

test('registered Lit aliases, namespace imports and generic local bases preserve native and reactive contracts', async () => fixture(async root => {
  await symlink(fileURLToPath(new URL('../../node_modules',import.meta.url)),join(root,'node_modules'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit'; export class Base<T> extends LitElement {item?:T;}`);
  await writeFile(join(root,'sample.ts'),`import {LitElement, LitElement as ActualLit} from 'lit'; import * as lit from 'lit';
    import {Base} from './base.js';
    export class Direct extends LitElement {static properties={value:{type:String,reflect:true}};value='direct';static get observedAttributes(){return ['native-only','value'];}}
    export class Renamed extends ActualLit {static properties={value:{type:String,reflect:true}};value='renamed';static observedAttributes=['native-property'];}
    export class Namespaced extends lit.LitElement {static properties={value:{type:String,reflect:true}};value='namespaced';}
    export class Generic extends Base<string> {static properties={value:{type:String,reflect:true}};value='generic';}
    export class Native extends HTMLElement {static observedAttributes=['ordinary'];nativeValue='native';helper():void {class Probe extends HTMLElement {}void Probe;}}
    function helper():void {class RequestEvent extends Event {}void RequestEvent;}
    customElements.define('en-direct',Direct);customElements.define('en-renamed',Renamed);customElements.define('en-namespaced',Namespaced);customElements.define('en-generic',Generic);customElements.define('en-native',Native);
    throw new Error('Metadata must not execute component source');`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['base.ts','sample.ts']});
  const module=manifest.modules.find((entry:any)=>entry.path==='sample.ts');
  assert.deepEqual(module.declarations.filter((entry:any)=>entry.kind==='class').map((entry:any)=>entry.name).sort(),['Direct','Generic','Namespaced','Native','Renamed']);
  for(const name of ['Direct','Renamed','Namespaced','Generic']) {
    const declaration=module.declarations.find((entry:any)=>entry.name===name);assert(declaration);
    assert.equal(declaration.tagName,'en-'+name.toLowerCase());
    const field=declaration.members.find((entry:any)=>entry.name==='value');assert.equal(field.attribute,'value');assert.equal(field.reflects,true);assert.equal(field.type.text,'string');
    assert.equal(declaration.attributes.find((entry:any)=>entry.name==='value').fieldName,'value');
    assert(!declaration.members.some((entry:any)=>entry.name==='properties'));
    assert(!declaration.members.some((entry:any)=>entry.inheritedFrom?.package==='lit-element'));
  }
  const direct=module.declarations.find((entry:any)=>entry.name==='Direct'),renamed=module.declarations.find((entry:any)=>entry.name==='Renamed'),namespaced=module.declarations.find((entry:any)=>entry.name==='Namespaced');
  assert.deepEqual(renamed.superclass,direct.superclass);assert.deepEqual(namespaced.superclass,direct.superclass);assert.equal(direct.superclass.package,'lit-element');
  assert(direct.attributes.some((entry:any)=>entry.name==='native-only'));assert(renamed.attributes.some((entry:any)=>entry.name==='native-property'));
  const native=module.declarations.find((entry:any)=>entry.name==='Native');assert.equal(native.tagName,'en-native');assert(native.attributes.some((entry:any)=>entry.name==='ordinary'));assert(native.members.some((entry:any)=>entry.name==='nativeValue'));
}));

test('a local LitElement homonym never receives semantic Lit ownership', async () => fixture(async root => {
  await symlink(fileURLToPath(new URL('../../node_modules',import.meta.url)),join(root,'node_modules'),'dir');
  await writeFile(join(root,'sample.ts'),`import {LitElement as ActualLit} from 'lit';
    export class LitElement extends HTMLElement {}
    export class Homonym extends LitElement {static properties={value:{reflect:true}};value='local';}
    export class Real extends ActualLit {static properties={value:{reflect:true}};value='real';}
    customElements.define('en-homonym',Homonym);customElements.define('en-real',Real);`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declarations=manifest.modules[0].declarations,homonym=declarations.find((entry:any)=>entry.name==='Homonym'),real=declarations.find((entry:any)=>entry.name==='Real');
  assert.equal(homonym.members.find((entry:any)=>entry.name==='value').attribute,undefined);
  assert(homonym.members.some((entry:any)=>entry.name==='properties'));
  assert.equal(real.members.find((entry:any)=>entry.name==='value').attribute,'value');
}));

test('Lit/native supplementation preserves native facts and rejects contradictory contracts', async () => {
  const {supplementLitWithVanilla}=await import('./candidate-lit-ownership.ts');
  const lit={name:'Sample',module:'sample.ts',attributes:[{name:'value',fieldName:'value',type:'string',reflects:false}],members:[{name:'value',kind:'field',type:'string',attribute:'value'}]};
  const native={name:'Sample',module:'sample.ts',attributes:[{name:'native',description:''},{name:'value',type:'string'}],members:[{name:'value',kind:'field',type:'string'}]};
  const result=supplementLitWithVanilla(lit,native,'sample.ts#Sample');
  assert.deepEqual(result.attributes,[{name:'value',fieldName:'value',type:'string',reflects:false},{name:'native',description:''}]);
  assert.equal(lit.attributes.length,1);assert.equal(native.attributes.length,2);
  for(const field of ['type','description','fieldName','default']) {
    assert.throws(()=>supplementLitWithVanilla({...lit,attributes:[{name:'value',[field]:'first'}]},{...native,attributes:[{name:'value',[field]:'second'}]},'Sample'),/Lit\/native contract conflict/);
  }
  assert.throws(()=>supplementLitWithVanilla(lit,{...native,members:[{name:'lost',kind:'field',type:'string'}]},'Sample'),/Unrepresented native member/);
  assert.throws(()=>supplementLitWithVanilla({...lit,summary:'first'},{...native,summary:'second'},'Sample'),/Lit\/native contract conflict/);
});

test('explicit vanilla routing preserves default builtins and strict custom detector conflicts', async () => fixture(async root => {
  await writeFile(join(root,'sample.ts'),`export class Native extends HTMLElement {value='native';} customElements.define('en-native',Native);`);
  const tsConfigPath=join(root,'tsconfig.json');await writeFile(tsConfigPath,JSON.stringify({files:['sample.ts'],compilerOptions:{target:'ESNext',module:'ESNext',noEmit:true}}));
  const options={tsConfigPath,include:[join(root,'sample.ts')],inheritance:false as const,conflictPolicy:'throw' as const};
  const ordinary=extractRaw(options);assert.equal(ordinary.modules[0].declarations[0].tagName,'en-native');
  assert.deepEqual(extractRaw({...options,builtinVanilla:true}),ordinary);
  assert.equal(extractRaw({...options,builtinVanilla:false}).modules.length,0);
  const plugins=[{name:'first',onFile:()=>({Native:{name:'Native',summary:'first'}})},{name:'second',onFile:()=>({Native:{name:'Native',summary:'second'}})}];
  for(const builtinVanilla of [true,false]) assert.throws(()=>extractRaw({...options,builtinVanilla,plugins}),/Detector conflict/);
}));

test('direct lit-element consumption retains reactive metadata without an incidental lit import', async () => fixture(async root => {
  await symlink(fileURLToPath(new URL('../../node_modules',import.meta.url)),join(root,'node_modules'),'dir');
  await writeFile(join(root,'sample.ts'),`import {LitElement} from 'lit-element';
    export class Direct extends LitElement {static properties={value:{type:String,reflect:true}};value='direct';}
    customElements.define('en-direct',Direct);`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declaration=manifest.modules[0].declarations.find((entry:any)=>entry.name==='Direct');
  const field=declaration.members.find((entry:any)=>entry.name==='value');assert.equal(field.attribute,'value');assert.equal(field.reflects,true);assert.equal(declaration.superclass.package,'lit-element');
}));

test('registered Lit templates exclude dynamic and quoted or commented fake slots and Parts', async () => fixture(async root => {
  await symlink(fileURLToPath(new URL('../../node_modules',import.meta.url)),join(root,'node_modules'),'dir');
  await writeFile(join(root,'sample.ts'),`import {LitElement,html,css} from 'lit';
    export class Sample extends LitElement {
      static get styles(){return css\`:host { /* Tone */ --tone: red; }\`;}
      label='dynamic';
      render(){return html\`<slot name=\${this.label}></slot><div part="\${this.label}"></div>
        <div title="<slot name='fake-slot'>" data-text="<div part='fake-part'>"></div>
        <!-- <slot name="comment-slot"></slot><div part="comment-part"></div> -->
        <slot name="real-slot"></slot><div part="real-part"></div>\`;}
    }
    customElements.define('en-sample',Sample);`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declaration=manifest.modules[0].declarations.find((entry:any)=>entry.name==='Sample');
  assert.deepEqual(declaration.slots.map((entry:any)=>entry.name),['real-slot']);
  assert.deepEqual(declaration.cssParts.map((entry:any)=>entry.name),['real-part']);
  assert(declaration.cssProperties.some((entry:any)=>entry.name==='--tone'));
}));

test('a nested same-name class cannot overwrite a registered Lit declaration', async () => fixture(async root => {
  await symlink(fileURLToPath(new URL('../../node_modules',import.meta.url)),join(root,'node_modules'),'dir');
  for (const base of ['LitElement','HTMLElement']) {
    await writeFile(join(root,'sample.ts'),`import {LitElement} from 'lit';
      export class Sample extends ${base} {value='real';}
      function helper():void {class Sample extends HTMLElement {value='nested';}void Sample;}
      customElements.define('en-sample',Sample);`);
    await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['sample.ts']}),/Ambiguous (Lit\/)?native class name/);
  }
}));

test('unselected callable implementations and asserted constructor aliases reject before extraction', async () => fixture(async root => {
  await symlink(fileURLToPath(new URL('../../node_modules',import.meta.url)),join(root,'node_modules'),'dir');
  await writeFile(join(root,'base.ts'),`import {LitElement} from 'lit';
    export function mix<T extends new (...args:any[])=>LitElement>(Base:T) {return class extends Base {static properties={mixed:{reflect:true}};mixed='value';};}
    export const Mixed=mix(LitElement);
    export class LocalBase extends mix(LitElement) {}
    throw new Error('Factory source must not execute');`);
  const cases=[
    {imports:"import {LitElement} from 'lit';import {mix} from './base.js';",base:'mix(LitElement)'},
    {imports:"import {LitElement} from 'lit';import {mix} from './base.js';",base:'(mix(LitElement) as typeof LitElement)'},
    {imports:"import {LitElement} from 'lit';import {mix} from './base.js';const Local=mix(LitElement);",base:'Local'},
    {imports:"import {Mixed as Renamed} from './base.js';",base:'Renamed'},
    {imports:"import * as bases from './base.js';",base:'bases.Mixed'},
    {imports:"import {LitElement} from 'lit';import {mix} from './base.js';const HTMLElement=mix(LitElement);",base:'HTMLElement'},
    {imports:"import {LocalBase} from './base.js';",base:'LocalBase'},
  ];
  for(const entry of cases) for(const registered of [false,true]) for(const lit of [true,false]) {
    await writeFile(join(root,'sample.ts'),entry.imports+`export class Sample extends ${entry.base} {own='value';}`+(registered?"customElements.define('en-sample',Sample);":''));
    const reason = entry.base === 'LocalBase' ? /Unselected local superclass cannot be treated as an opaque dependency/ : entry.base.includes(' as ') ? /Asserted constructor expressions need a qualified contract/ : /Implementation must be selected source, not a declaration-only dependency/;
    await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['sample.ts'],lit}), (error:any) => {
      assert.match(error.message, /^\[CEM_UNSUPPORTED_MIXIN\]/); assert.match(error.message, reason); return true;
    });
  }
}));

test('augmented platform constructor interfaces retain their actual default-library values', async () => fixture(async root => {
  await writeFile(join(root,'sample.ts'),`export {};
    declare global {interface HTMLElement {readonly customFlag?:boolean;} interface Error {readonly customFlag?:boolean;}}
    export class Native extends HTMLElement {value=1;}
    export class Failure extends Error {code='sample';}
    customElements.define('en-native',Native);`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declarations=manifest.modules[0].declarations;assert.deepEqual(declarations.map((entry:any)=>entry.name).sort(),['Failure','Native']);
  assert.equal(declarations.find((entry:any)=>entry.name==='Native').tagName,'en-native');
  assert.deepEqual(declarations.find((entry:any)=>entry.name==='Failure').superclass,{name:'Error'});
}));

test('named external classes keep private constructor composition opaque while direct unknown constructor aliases reject', async () => fixture(async root => {
  await mkdir(join(root,'node_modules/fixture-composed'),{recursive:true});
  await writeFile(join(root,'node_modules/fixture-composed/package.json'),JSON.stringify({name:'fixture-composed',version:'1.0.0',types:'./index.d.ts'}));
  await writeFile(join(root,'node_modules/fixture-composed/index.d.ts'),`export declare const Composed:new()=>HTMLElement & {dependency:string};export declare class ExternalBase extends Composed {}`);
  await writeFile(join(root,'sample.ts'),`import {ExternalBase} from 'fixture-composed';export class Sample extends ExternalBase {own=1;}`);
  const {manifest}=await generateCandidateCem({sourceRoot:root,sources:['sample.ts']});
  const declaration=manifest.modules[0].declarations.find((entry:any)=>entry.name==='Sample');
  assert.deepEqual(declaration.superclass,{name:'ExternalBase',package:'fixture-composed',module:'index.d.ts'});
  assert.equal(declaration.members.find((entry:any)=>entry.name==='own').type.text,'number');
  await writeFile(join(root,'sample.ts'),`import {Composed} from 'fixture-composed';export class Sample extends Composed {own=1;}customElements.define('en-sample',Sample);`);
  await assert.rejects(()=>generateCandidateCem({sourceRoot:root,sources:['sample.ts']}),/\[CEM_UNSUPPORTED_MIXIN\].*Implementation must be selected source, not a declaration-only dependency/);
}));
