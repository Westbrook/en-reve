import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, rm, symlink, readdir,realpath} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {extractConstructorOrigins} from './candidate-origin-extraction.ts';
import {constructorContractComposition, constructorFacets} from './candidate-constructor-composition.ts';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';
import {snapshotCem,diffCem} from '../releases/cem-diff.ts';
import {readConstructorComposition,constructorCompositionKey} from './constructor-composition-contract.ts';

// Serialization preparation only; no execution is allocated for this separate draft.
const base = `export type Ctor = new (...args: any[]) => object;
export class Base { base = true; }
`;
const factory = `export function M<T extends Ctor>(Parent: T) { return class Mixed extends Parent { value = 1; }; }
export class Leaf extends M(Base) { own = true; }`;
async function fixture(files: Record<string, string>, run: (f: any) => unknown) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cem-facet-composition-')));
  try {
    const dependencies=resolve(import.meta.dirname, '../../node_modules');
    await mkdir(join(root,'node_modules'));
    for (const name of await readdir(dependencies)) {
      assert.equal(Object.keys(files).some(file=>file.startsWith('node_modules/'+name+'/')),false,'Fixture cannot overwrite a staged dependency');
      await symlink(join(dependencies,name),join(root,'node_modules',name));
    }
    for (const [file, text] of Object.entries(files)) {await mkdir(dirname(join(root, file)), {recursive:true}); await writeFile(join(root, file), text);}
    const names = Object.keys(files).filter(name=>!name.startsWith('node_modules/') && /\.tsx?$/.test(name));
    const makeProgram = () => ts.createProgram(names.map(name => join(root, name)), {
      noEmit:true, strict:true, skipLibCheck:true, target:ts.ScriptTarget.ES2022,
      module:ts.ModuleKind.ESNext, moduleResolution:ts.ModuleResolutionKind.Bundler, types:[],
      ...(names.some(name=>name.endsWith('.tsx'))?{jsx:ts.JsxEmit.Preserve}:{}),
    });
    const program = makeProgram();
    const sources = names.map(name => program.getSourceFile(join(root, name))!);
    const roots = sources.flatMap(source => source.statements.filter(ts.isClassDeclaration));
    const build = (lit = false) => {
      const diagnostics = sources.flatMap(source => [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)])
        .filter(item => item.category === ts.DiagnosticCategory.Error);
      assert.deepEqual(diagnostics.map(item => ({code:item.code, text:ts.flattenDiagnosticMessageText(item.messageText,'\n')})), [], 'Fixture must reach the adapter with valid checked source');
      return extractConstructorOrigins(program, sources, root, roots, lit);
    };
    const row = (result: any, name: string, module = 'main.ts') => result.internal.modules.find((item: any) => item.path === module)?.declarations.find((item: any) => item.name === name);
    const errors = (result: any) => {try {result.validate(); return [];} catch(error: any) {if (!error.failures) throw error; return error.failures.map((item: any) => item.message);}};
    const compose = (lit = false) => constructorContractComposition(program, sources, build(lit));
    const declaration = (name: string, file = 'main.ts') => sources.find(source => source.fileName === join(root, file))!.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === name);
    const serialize=(lit=false)=>serializeConstructorComposition(program,sources,roots,build(lit));
    await run({root, program, makeProgram, sources, roots, build, row, errors, compose, declaration, serialize});
  } finally {await rm(root, {recursive:true, force:true});}
}

const outputRow=(result:any,name:string,module='main.ts')=>result.manifest.modules.find((row:any)=>row.path===module).declarations.find((row:any)=>row.name===name);
const member=(row:any,name:string)=>row.members.find((item:any)=>item.name===name);

test('source-bound projection converts all seven facets once and preserves checked ordinary declarations',async()=>fixture({'main.ts':`
/**
 * @attr {string} mode - mode docs
 * @fires {Event} changed - event docs
 * @slot - slot docs
 * @csspart panel - part docs
 * @cssprop {string} --tone - css docs
 * @cssState active - state docs
 */
export class Leaf { value=1; echo(value:number):number{return value;} }
export function ordinary(value:number):number{return value;}
export const label='plain';
`},f=>{
  const result=f.serialize(),leaf=outputRow(result,'Leaf');
  for(const facet of constructorFacets)assert.ok(leaf[facet]?.length,facet);
  assert.deepEqual(member(leaf,'value').type,{text:'number'});
  assert.deepEqual(member(leaf,'echo').parameters[0].type,{text:'number'});
  assert.deepEqual(member(leaf,'echo').return.type,{text:'number'});
  assert.deepEqual(leaf.attributes[0].type,{text:'string'});assert.deepEqual(leaf.events[0].type,{text:'Event'});
  assert.equal(leaf.slots[0].name,'');assert.equal(result.manifest.modules[0].source,'main.ts');
  const original=f.build();for(const name of ['ordinary','label'])assert.deepEqual(outputRow(result,name),f.row(original,name));
  assert.equal(result.validate().constructorFacets,result.proofs.facets.length);
}));

test('actual Lit terminal package ownership survives without invented external metadata',async()=>fixture({'main.ts':`
import {LitElement} from 'lit'; export class Leaf extends LitElement {static properties={value:{type:String}};value='ok';}
`},f=>{
  const row=outputRow(f.serialize(true),'Leaf');assert.equal(row.superclass.name,'LitElement');assert.equal(row.superclass.package,'lit-element');assert.ok(row.superclass.module.endsWith('.d.ts'));
  assert.deepEqual(member(row,'value').type,{text:'string'});assert.equal(row.members.some((item:any)=>item.name==='renderRoot'),false);
}));

test('platform terminal references retain the actual global base identity',async()=>fixture({'main.ts':'export class Leaf extends HTMLElement {own=1;}'},f=>{
  const row=outputRow(f.serialize(),'Leaf');assert.deepEqual(row.superclass,{name:'HTMLElement'});assert.deepEqual(row.members.map((item:any)=>item.name),['own']);
}));

test('factory exports parameters aliases and type-only edges retain their checked topology',async()=>fixture({
 'factory.ts':base+`export function M<T extends Ctor>(Parent:T){return class extends Parent {value=1;};}`,
 'barrel.ts':`export {M as Renamed,Base} from './factory.js'; export type {Ctor} from './factory.js';`,
 'main.ts':`import {Renamed,Base} from './barrel.js'; export class Leaf extends Renamed(Base) {}`,
},f=>{
  const result=f.serialize(),extracted=f.build();for(const module of result.manifest.modules)assert.deepEqual(module.exports,extracted.internal.modules.find((row:any)=>row.path===module.path).exports);
  const factory=outputRow(result,'M','factory.ts');assert.equal(factory.kind,'mixin');assert.equal(factory.customElement,false);assert.deepEqual(factory.parameters[0].type,{text:'T'});
  assert.equal(factory['x-en-type-parameters'][0].name,'T');assert.ok(result.proofs.topology.typeOnlyExports.length);
}));

test('lineage lists only applications above the nearest named base while portable steps retain the full chain',async()=>fixture({'main.ts':base+`
export function Inner<T extends Ctor>(Parent:T){return class extends Parent {inner=1;};}
export class Middle extends Inner(Base) {}
export function Outer<T extends Ctor>(Parent:T){return class extends Parent {outer=1;};}
export class Leaf extends Outer(Middle) {}
`},f=>{
  const row=outputRow(f.serialize(),'Leaf');assert.deepEqual(row.superclass,{name:'Middle',module:'main.ts'});assert.deepEqual(row.mixins,[{name:'Outer',module:'main.ts'}]);
  assert.equal(row['x-en-constructor-composition'].steps.filter((step:any)=>step.kind==='application').length,2);
}));

test('repeated factory applications remain ordered in lineage and source occurrence proofs',async()=>fixture({'main.ts':base+`
export function M<T extends Ctor>(Parent:T){return class extends Parent {value=1;};} export class Leaf extends M(M(Base)) {}
`},f=>{
  const result=f.serialize(),row=outputRow(result,'Leaf');assert.deepEqual(row.mixins,[{name:'M',module:'main.ts'},{name:'M',module:'main.ts'}]);
  const steps=row['x-en-constructor-composition'].steps.filter((step:any)=>step.kind==='application');assert.notDeepEqual(steps[0].application,steps[1].application);
  assert.equal(result.proofs.facets.find((item:any)=>item.declaration==='Leaf'&&item.facet==='members'&&item.key==='[false,"value"]').step,steps[1].index);
}));

test('cross-module authored aliases bind their original exported symbol despite a consuming name collision',async()=>fixture({
 'base.ts':`export type Payload=string;
/** @attr {Payload} mode */
export class Base {}`,
 'main.ts':`import {Base} from './base.js'; export type Payload=number; export class Leaf extends Base {}`,
},f=>{
  const result=f.serialize(),row=outputRow(result,'Leaf');assert.equal(row.attributes[0].type.text,'import("./base.js").Payload');
  assert.deepEqual(row.attributes[0].inheritedFrom,{name:'Base',module:'base.ts'});
}));

test('renamed inherited authored attribute types stay independent of a wider linked field',async()=>fixture({'main.ts':`
import {LitElement} from 'lit'; export type Ctor=new(...args:any[])=>Public;
/** @attr {string} value - narrow */
export class Public extends LitElement {static properties={value:{type:Object}};value:string|null='initial';}
export function Configure<T extends Ctor>(Parent:T){return class extends Parent {static properties={value:{type:String,attribute:'renamed'}};};}
export class Leaf extends Configure(Public) {}
`},f=>{
  const result=f.serialize(true),leaf=outputRow(result,'Leaf'),attr=leaf.attributes.find((row:any)=>row.name==='renamed');
  assert.deepEqual(attr.type,{text:'string'});assert.deepEqual(member(leaf,'value').type,{text:'string | null'});assert.equal(attr.default,"'initial'");
  const proof=result.proofs.facets.find((row:any)=>row.declaration==='Leaf'&&row.facet==='attributes'&&row.key==='renamed');assert.equal(proof.attributeTypeContract.kind,'authored');assert.equal(proof.attributeTypeContract.name,'value');
}));

test('generated attribute and field types use the actual consuming generic instance',async()=>fixture({'main.ts':base+`
export class Generic<T> {
/** @attribute value */
value!:T;
}
export function M<T extends Ctor>(Parent:T){return class extends Parent {};}
export class Leaf extends M(Generic)<string> {}
`},f=>{
  const row=outputRow(f.serialize(),'Leaf');assert.deepEqual(member(row,'value').type,{text:'string'});assert.deepEqual(row.attributes[0].type,{text:'string'});
}));

test('dependent authored generic attributes reject before returning a serialized manifest',async()=>fixture({'main.ts':`
/** @attr {T} mode */
export class Generic<T> {}
export class Leaf extends Generic<string> {}
`},f=>assert.throws(()=>f.serialize(),/Authored generic contract requires occurrence binding/)));

test('internal event privacy and policy survive projection',async()=>fixture({'main.ts':base+`
/** @fires {Event} changed */
export class Public extends Base {}
/** @internalEvent changed */
export class Leaf extends Public {}
`},f=>{
  const result=f.serialize(),row=outputRow(result,'Leaf');assert.equal(row.events[0].privacy,'private');assert.deepEqual(row.events[0].type,{text:'Event'});
  assert.equal(result.proofs.facets.find((item:any)=>item.declaration==='Leaf'&&item.facet==='events').policies[0].kind,'internal-event');
}));

test('omission history survives without resurrecting excluded facets',async()=>fixture({'main.ts':base+`
/** @csspart panel - visible */
export class Public extends Base {}
/** @omit-csspart panel */
export class Leaf extends Public {}
`},f=>{
  const row=outputRow(f.serialize(),'Leaf');assert.equal(row.cssParts,undefined);assert.deepEqual(row['x-en-constructor-composition'].omissions.map((item:any)=>({facet:item.facet,names:item.names})),[{facet:'cssParts',names:['panel']}]);
}));

test('generated and independently authored default contracts remain distinct in serialized output',async()=>{
 for(const doc of ['', '/** @attr {number} [value=7] */']) await fixture({'main.ts':base+`
${doc}
export class Public extends Base {
/** @attribute value */
value=1;
}
export class Leaf extends Public {constructor(){super();this.value=2;}}
`},f=>{
  const row=outputRow(f.serialize(),'Leaf');assert.equal(member(row,'value').default,'2');assert.equal(row.attributes[0].default,doc?'7':'2');
 });
});

test('duplicate private brands reject instead of silently collapsing flat member names',async()=>fixture({'main.ts':base+`
export class A extends Base {#secret=1;} export class Leaf extends A {#secret=2;}
`},f=>assert.throws(()=>f.serialize(),/Repeated private brands/)));

test('generic methods reject instead of dropping callable type parameters',async()=>fixture({'main.ts':`export class Leaf {identity<T>(value:T):T{return value;}}`},f=>assert.throws(()=>f.serialize(),/Overloaded or generic methods/)));

test('projection requires the original branded extraction and exact source root selection',async()=>fixture({'main.ts':base+factory},f=>{
 const extracted=f.build();assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,{...extracted}),/exact owned extraction inputs/);
 assert.throws(()=>serializeConstructorComposition(f.makeProgram(),f.sources,f.roots,extracted),/exact owned extraction inputs/);
 assert.throws(()=>serializeConstructorComposition(f.program,f.sources,[...f.roots].reverse(),extracted),/exact owned extraction inputs/);
}));

test('serialized output is immutable and its validation still checks the original extraction snapshot',async()=>fixture({'main.ts':base+factory},f=>{
 const extracted=f.build(),result=serializeConstructorComposition(f.program,f.sources,f.roots,extracted);
 assert.doesNotThrow(()=>JSON.stringify(result.proofs));assert.deepEqual(JSON.parse(JSON.stringify(result.manifest)),result.manifest);
 assert.throws(()=>{outputRow(result,'Leaf').name='changed';},TypeError);
 f.row(extracted,'Base').members[0].name='changed';assert.throws(()=>result.validate(),/changed before validation/);
}));

test('projection never evaluates static blocks or authored constructor bodies',async()=>fixture({'main.ts':`
export class Leaf {static{throw new Error('Do not run');} value=1;constructor(){throw new Error('Do not run');}}
`},f=>assert.deepEqual(member(outputRow(f.serialize(),'Leaf'),'value').type,{text:'number'})));


test('method parameter and return parsed representations remain paired with semantic CEM types',async()=>fixture({'main.ts':`
export type Choice='one'|'two';
export class Leaf {echo(value:Choice):Choice{return value;}}
`},f=>{
  const extracted=f.build(),own=f.row(extracted,'Leaf').members.find((row:any)=>row.name==='echo');
  assert.equal(typeof own.parameters[0].parsedType,'string');assert.equal(typeof own.return.parsedType,'string');
  const result=serializeConstructorComposition(f.program,f.sources,f.roots,extracted),row=member(outputRow(result,'Leaf'),'echo');
  assert.equal(typeof row.parameters[0].parsedType.text,'string');assert.equal(typeof row.return.parsedType.text,'string');
  assert.ok(row.parameters[0].parsedType.text.includes('one'));assert.ok(row.return.parsedType.text.includes('two'));
  assert.deepEqual(row.parameters[0].type,{text:'Choice'});assert.deepEqual(row.return.type,{text:'Choice'});
}));

test('method predicate and assertion returns retain their checked parameter contract',async()=>fixture({'main.ts':`
export interface Value {value:string;}
export class Leaf {
 isValue(input:unknown):input is Value{return typeof input==='object' && input!==null && 'value' in input;}
 assertValue(input:unknown):asserts input is Value{if(!this.isValue(input))throw new Error('value');}
 assertPresent(input:unknown):asserts input{if(!input)throw new Error('present');}
}
`},f=>{
 const row=outputRow(f.serialize(),'Leaf');
 assert.deepEqual(member(row,'isValue').return.type,{text:'input is Value'});
 assert.deepEqual(member(row,'assertValue').return.type,{text:'asserts input is Value'});
 assert.deepEqual(member(row,'assertPresent').return.type,{text:'asserts input'});
}));

test('this predicates and assertions retain their receiver contract',async()=>fixture({'main.ts':`
export class Leaf {
 value:unknown;
 isReady():this is this & {value:string}{return typeof this.value==='string';}
 assertReady():asserts this is this & {value:string}{if(!this.isReady())throw new Error('ready');}
}
`},async f=>{
 const root=f.declaration('Leaf'),checker=f.program.getTypeChecker(),extracted=f.build();
 const result=serializeConstructorComposition(f.program,f.sources,f.roots,extracted),row=outputRow(result,'Leaf');
 const rootSymbol=checker.getSymbolAtLocation(root.name);
 for(const [name,kind,prefix] of [['isReady',ts.TypePredicateKind.This,'this'],['assertReady',ts.TypePredicateKind.AssertsThis,'asserts this']] as const) {
  const semantic=extracted.index.effectiveMember(root,name),signatures=checker.getSignaturesOfType(semantic.type,ts.SignatureKind.Call);
  assert.equal(signatures.length,1);const predicate=checker.getTypePredicateOfSignature(signatures[0]);
  assert.equal(predicate.kind,kind);assert.ok(predicate.type.isIntersection());
  assert.ok(predicate.type.types.some((part:any)=>part.getSymbol()===rootSymbol),'Checked predicate target retains the exact consuming root symbol');
  const value=predicate.type.getProperty('value');assert.equal(checker.typeToString(checker.getTypeOfSymbolAtLocation(value,root)),'string');
  assert.equal(member(row,name).return.type.text.replace(/\s+/g,' '),prefix+' is Leaf & { value: string; }');
 }
 // Exercise only this tested Leaf/Child contract, not a general polymorphic-this rewrite claim.
 await fixture({'main.ts':`
export class Leaf {
 value:unknown;
 isReady():${member(row,'isReady').return.type.text}{return typeof this.value==='string';}
 assertReady():${member(row,'assertReady').return.type.text}{if(!this.isReady())throw new Error('ready');}
}
export class Child extends Leaf {childOnly=true;}
export function guarded(value:Child) {
 if(value.isReady()) {const text:string=value.value;const own:boolean=value.childOnly;const badGuard:number=value.value;return [text,own,badGuard];}
}
export function asserted(value:Child) {
 value.assertReady();const text:string=value.value;const own:boolean=value.childOnly;const badAssertion:number=value.value;return [text,own,badAssertion];
}
`},consumer=>{
  const diagnostics=consumer.program.getSemanticDiagnostics().filter((item:any)=>item.category===ts.DiagnosticCategory.Error);
  assert.deepEqual(diagnostics.map((item:any)=>({code:item.code,name:item.file.text.slice(item.start,item.start+item.length)})),[{code:2322,name:'badGuard'},{code:2322,name:'badAssertion'}]);
  assert.ok(diagnostics.every((item:any)=>ts.flattenDiagnosticMessageText(item.messageText,'\n').includes("Type 'string' is not assignable to type 'number'")),'Narrowing must be string, never any');
 });
}));

test('shadowed own mixin method generic binders reject even when a final override is nongeneric',async()=>fixture({'main.ts':base+`
export function M<T extends Ctor,U>(Parent:T){return class extends Parent {identity<U>(value:U):U{return value;}};}
export class Leaf extends M(Base) {identity(value:any):any{return value;}}
`},f=>assert.throws(()=>f.serialize(),/Overloaded or generic methods/)));

test('own mixin methods use parameter semantic types despite an outer typeof name collision',async()=>fixture({'main.ts':base+`
export const value=1;
export function M<T extends Ctor>(Parent:T){return class extends Parent {echo(value:string):typeof value{return value;}};}
export class Leaf extends M(Base) {}
`},f=>{
 const result=f.serialize();for(const name of ['M','Leaf']){
  const row=member(outputRow(result,name),'echo');assert.deepEqual(row.parameters[0].type,{text:'string'});assert.deepEqual(row.return.type,{text:'string'});
 }
}));

test('equivalent source relocations produce identical public manifests while proofs retain local identity',async()=>{
 const files={'main.ts':`import {LitElement} from 'lit'; export type Ctor=new(...args:any[])=>LitElement;
 export function M<T extends Ctor>(Parent:T){return class extends Parent {value='ok';};}
 export class Leaf extends M(LitElement) {}`};
 let first:any;
 await fixture(files,f=>{const result=f.serialize(true);first={manifest:JSON.stringify(result.manifest),proofs:JSON.stringify(result.proofs)};assert.equal(first.manifest.includes(f.root),false);});
 await fixture(files,f=>{const result=f.serialize(true);assert.equal(JSON.stringify(result.manifest),first.manifest);assert.notEqual(JSON.stringify(result.proofs),first.proofs);assert.equal(JSON.stringify(result.manifest).includes(f.root),false);});
});

test('emitted type proofs persist exact source symbols for renamed inherited aliases',async()=>fixture({
 'base.ts':`export type Payload=string;\n/** @attr {Payload} mode */\nexport class Base {}`,
 'main.ts':`import {Base} from './base.js'; export type Payload=number; export class Leaf extends Base {}`,
},f=>{
 const result=f.serialize(),facet=result.proofs.facets.find((row:any)=>row.declaration==='Leaf'&&row.facet==='attributes');
 assert.ok(facet.typeProofs.length);const proof=result.proofs.types[facet.typeProofs[0]];
 assert.equal(proof.input,'Payload');assert.equal(proof.emitted,'import("./base.js").Payload');
 assert.equal(proof.symbols[0].name,'Payload');assert.ok(proof.symbols[0].declarations[0].fileName.endsWith('/base.ts'));
 assert.doesNotThrow(()=>result.validate());
}));

test('computed authored contract keys reject before a same-name consuming symbol can replace them',async()=>fixture({
 'base.ts':`export const key:unique symbol=Symbol('base');\n/** @attr {{ [key]: string }} mode */\nexport class Base {}`,
 'main.ts':`import {Base} from './base.js'; export const key:unique symbol=Symbol('consumer'); export class Leaf extends Base {}`,
},f=>{
 const extracted=f.build();assert.ok(f.row(extracted,'Base','base.ts').attributes[0].type.includes('[key]'));
 assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,extracted),/Computed contract keys/);
}));

test('nested authored method parameter queries reject before resolving a module decoy',async()=>fixture({'main.ts':`
export const value=1;
/** @attr {{ fn(value: string): typeof value }} mode */
export class Leaf {}
`},f=>{
 const extracted=f.build();assert.ok(f.row(extracted,'Leaf').attributes[0].type.includes('typeof value'));
 assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,extracted),/Method-local type queries/);
}));

test('authored import resolution attributes reject before dropping their mode contract',async()=>fixture({
 'payload.ts':'export interface Payload {value:string;}',
 'main.ts':`/** @attr {import('./payload.js', { with: { 'resolution-mode': 'import' } }).Payload} mode */\nexport class Leaf {}`,
},f=>{
 const extracted=f.build();assert.ok(f.row(extracted,'Leaf').attributes[0].type.includes('resolution-mode'));
 assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,extracted),/Import type attributes/);
}));

test('inferred predicates cannot expose a non-exported type through a boolean signature',async()=>fixture({'main.ts':`
class Hidden {value='hidden';}
export class Leaf {isHidden(value:unknown){return value instanceof Hidden;}}
`},f=>{
 const checker=f.program.getTypeChecker(),method=f.declaration('Leaf').members.find((node:any)=>node.name?.text==='isHidden');
 const signature=checker.getSignatureFromDeclaration(method);assert.equal(checker.typeToString(checker.getReturnTypeOfSignature(signature)),'boolean');
 assert.equal(checker.typeToString(checker.getTypePredicateOfSignature(signature).type),'Hidden');
 assert.throws(()=>f.serialize(),(error:any)=>error.failures?.some((failure:any)=>failure.message.includes('unexported type "Hidden"')));
}));

test('inferred predicates preserve a public exported type without requiring an authored return',async()=>fixture({'main.ts':`
export class Value {value='public';}
export class Leaf {isValue(value:unknown){return value instanceof Value;}}
`},f=>{
 const row=member(outputRow(f.serialize(),'Leaf'),'isValue');assert.deepEqual(row.return.type,{text:'value is Value'});
}));

test('authored contract type references and typeof queries require their respective symbol meaning',async()=>{
 for(const [declaration,type] of [['export const onlyValue=1;','onlyValue'],['export type OnlyType=string;','typeof OnlyType']])await fixture({'main.ts':`${declaration}\n/** @attr {${type}} mode */\nexport class Leaf {}`},f=>{
  assert.throws(()=>f.serialize(),(error:any)=>error.failures?.some((failure:any)=>failure.message.includes('requested type/value meaning')));
 });
});

test('separate type and value shadowing preserves valid authored contract lookup',async()=>{
 for(const [outer,signature,parent,type,expected] of [
  ['export type Token=string;','T extends Ctor>(Token:T)','Token','Token','Token'],
  ['export const Token=1;','Token extends Ctor>(Parent:Token)','Parent','typeof Token','typeof Token'],
 ])await fixture({'main.ts':base+`${outer}\nexport function M<${signature}{return (\n/** @attr {${type}} mode */\nclass extends ${parent} {}); }\nexport class Leaf extends M(Base) {}`},f=>{
  const result=f.serialize();for(const name of ['M','Leaf'])assert.deepEqual(outputRow(result,name).attributes[0].type,{text:expected});
 });
});

test('authored import type and typeof import queries reject an export of the wrong meaning',async()=>{
 for(const type of ['import("./payload.js").onlyValue','typeof import("./payload.js").OnlyType'])await fixture({
  'payload.ts':'export const onlyValue=1; export type OnlyType=string;',
  'main.ts':`/** @attr {${type}} mode */\nexport class Leaf {}`,
 },f=>assert.throws(()=>f.serialize(),(error:any)=>error.failures?.some((failure:any)=>failure.message.includes('requested type/value meaning'))));
});

test('authored generic arity and constraints are never inferred from syntax and exported names alone',async()=>{
 for(const type of ['Box<number>','Box','Box<"ok">'])await fixture({'main.ts':`export interface Box<T extends string>{value:T;}\n/** @attr {${type}} mode */\nexport class Leaf {}`},f=>{
  const extracted=f.build();assert.equal(f.row(extracted,'Leaf').attributes[0].type,type);
  assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,extracted),/Authored generic contract requires checked lexical instantiation/);
 });
});

test('checked semantic generic fields retain actual instantiated types',async()=>fixture({'main.ts':`
export interface Box<T extends string>{value:T;}
export class Leaf {value!:Box<'ok'>;}
`},f=>{
 const result=f.serialize(),value=member(outputRow(result,'Leaf'),'value');assert.match(value.type.text,/^Box<["']ok["']>$/);
 assert.ok(result.proofs.types.some((proof:any)=>proof.kind==='checked-semantic-rendering'&&proof.emitted===value.type.text));
}));

test('rewritten imports reject a same-stem source that would replace the original declaration symbol',async()=>fixture({
 'foo/package.json':JSON.stringify({name:'fixture-payload',type:'module',types:'index.tsx'}),
 'foo/index.tsx':`export interface Payload {source:'original-tsx';}`,
 'foo/index.ts':`export interface Payload {source:'source';}`,
 'base.ts':`import type {Payload} from './foo';\n/** @attr {Payload} mode */\nexport class Base {}`,
 'main.ts':`import {Base} from './base.js';export type Payload=number;export class Leaf extends Base {}`,
},f=>{
 const source=f.sources.find((item:any)=>item.fileName.endsWith('/base.ts')),checker=f.program.getTypeChecker();
 const imported=checker.getAliasedSymbol(checker.getSymbolAtLocation(source.statements[0].importClause.namedBindings.elements[0].name));
 assert.equal(imported.declarations[0].getSourceFile(),f.sources.find((item:any)=>item.fileName.endsWith('/foo/index.tsx')),'Fixture must bind the exact selected TSX source before serialization');
 const output=f.sources.find((item:any)=>item.fileName.endsWith('/main.ts'));
 const decoy=ts.resolveModuleName('./foo/index.js',output.fileName,f.program.getCompilerOptions(),ts.sys,undefined,undefined,output.impliedNodeFormat).resolvedModule;
 assert.equal(f.program.getSourceFile(decoy.resolvedFileName),f.sources.find((item:any)=>item.fileName.endsWith('/foo/index.ts')),'Precondition: emitted JS path resolves the distinct same-stem TS decoy');
 assert.notEqual(imported.declarations[0].getSourceFile(),f.program.getSourceFile(decoy.resolvedFileName));
 const extracted=f.build();assert.equal(f.row(extracted,'Base','base.ts').attributes[0].type,'Payload');
 assert.throws(()=>serializeConstructorComposition(f.program,f.sources,f.roots,extracted),/Emitted import does not resolve to the exact source symbol/);
}));

test('real mixin omission survives serialization and release inheritance reconstruction',async()=>fixture({'main.ts':base+`
/** @csspart panel - original */
export class Public extends Base {}
export function Hide<T extends Ctor>(Parent:T){return (\n/** @omit-csspart panel */\nclass extends Parent {});}
/** @tag en-leaf */
export class Leaf extends Hide(Public) {}
`},f=>{
 const result=f.serialize(),leaf=outputRow(result,'Leaf');assert.equal(leaf.tagName,'en-leaf');
 assert.equal(readConstructorComposition(leaf,'main.ts')!.version,2);
 assert.equal(outputRow(result,'Hide')[constructorCompositionKey],undefined,'Factory rows remain templates');
 assert.equal(snapshotCem(result.manifest).elements.get('en-leaf')!.surfaces.has('css-part:panel'),false);
}));

test('real internal member and event policies survive the complete release projection',async()=>fixture({'main.ts':base+`
/** @fires {Event} changed */
export class Public extends Base {value=1;}
/** @tag en-leaf
 * @internalEvent changed
 */
export class Leaf extends Public {
 /** @internal */
 value=2;
}
`},f=>{
 f.program.getTypeChecker(); // Bind parents before the first JSDoc query; an early query caches an empty result.
 const value=f.declaration('Leaf').members.find((node:any)=>node.name?.text==='value');
 assert.equal(value.parent,f.declaration('Leaf'));
 assert.ok(ts.getJSDocTags(value).some((tag:any)=>tag.tagName.text==='internal'),'Fixture must attach the member policy before extraction');
 const result=f.serialize(),leaf=outputRow(result,'Leaf');assert.equal(leaf.tagName,'en-leaf');
 assert.equal(leaf.events[0].privacy,'private');
 const surfaces=snapshotCem(result.manifest).elements.get('en-leaf')!.surfaces;
 assert.equal(surfaces.has('property:value'),false);assert.equal(surfaces.has('event:changed'),false);
}));

test('real later mixin reintroduction survives previous omission history',async()=>fixture({'main.ts':base+`
/** @csspart panel - original */
export class Public extends Base {}
export function Hide<T extends Ctor>(Parent:T){return (\n/** @omit-csspart panel */\nclass extends Parent {});}
export function Restore<T extends Ctor>(Parent:T){return (\n/** @csspart panel - restored */\nclass extends Parent {});}
/** @tag en-leaf */
export class Leaf extends Restore(Hide(Public)) {}
`},f=>{
 const result=f.serialize(),leaf=outputRow(result,'Leaf');assert.ok(leaf[constructorCompositionKey].omissions.length);
 assert.equal((snapshotCem(result.manifest).elements.get('en-leaf')!.surfaces.get('css-part:panel')!.value as any).description,'restored');
}));

test('real source-only position changes alter evidence without fabricating release API facts',async()=>{
 const source=base+`/** @tag en-leaf */\nexport class Leaf extends Base {value=1;}`;let before:any;
 await fixture({'main.ts':source},f=>{before=f.serialize().manifest;});
 await fixture({'main.ts':'// source position changed\n'+source},f=>{
  const result=diffCem(before,f.serialize().manifest);assert.deepEqual(result.facts,[]);assert.notEqual(result.beforeDigest,result.afterDigest);
 });
});
