import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, rm, symlink, readdir,realpath} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {parseCemClassTags, resolveMeaningfulParsedTypeFromText} from '@wc-toolkit/cem-generator-utils';
import {extractConstructorOrigins} from './candidate-origin-extraction.ts';
import {constructorContractComposition, constructorFacets} from './candidate-constructor-composition.ts';

// Proposed controls only. No execution is allocated for this draft.
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
    const names = Object.keys(files).filter(name=>!name.startsWith('node_modules/') && name.endsWith('.ts'));
    const makeProgram = () => ts.createProgram(names.map(name => join(root, name)), {
      noEmit:true, strict:true, skipLibCheck:true, target:ts.ScriptTarget.ES2022,
      module:ts.ModuleKind.ESNext, moduleResolution:ts.ModuleResolutionKind.Bundler, types:[],
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
    await run({root, program, makeProgram, sources, roots, build, row, errors, compose, declaration});
  } finally {await rm(root, {recursive:true, force:true});}
}

const facetDocs = (label: string) => `/**
 * @attr {string} mode - ${label}
 * @fires {Event} changed - ${label}
 * @slot content - ${label}
 * @csspart panel - ${label}
 * @cssprop {string} --tone - ${label}
 * @cssState active - ${label}
 */`;
const facetName: Record<string, string> = {members:'value', attributes:'mode', events:'changed', slots:'content', cssParts:'panel', cssProperties:'--tone', cssStates:'active'};
const entry = (result: any, facet: string, name: string) => result.facets[facet].find((row: any) => row.metadata.name === name);

test('all seven facets compose base inner outer and final origins in order', async () => fixture({'main.ts': `
export type Ctor = new (...args:any[]) => object;
${facetDocs('base')} export class Base { /** Base value. */ value=1; }
export function Inner<T extends Ctor>(Parent:T) { return (\n${facetDocs('inner')}\nclass extends Parent { value=2; }); }
export function Outer<T extends Ctor>(Parent:T) { return (\n${facetDocs('outer')}\nclass extends Parent { value=3; }); }
${facetDocs('final')} export class Leaf extends Outer(Inner(Base)) { value=4; }
`}, f => {
  const composition=f.compose(), root=f.declaration('Leaf'), result=composition.compose(root);
  assert.deepEqual(result.steps.filter((s:any)=>s.origin).map((s:any)=>s.origin.reference.name),['Base','Inner','Outer','Leaf']);
  for(const facet of constructorFacets) {
    const bound=entry(result,facet,facetName[facet]);assert.ok(bound,facet);
    assert.equal(composition.provenanceOf(bound).origin.node,root);
    assert.equal(bound.metadata.inheritedFrom,undefined);
    if(facet!=='members') assert.equal(bound.metadata.description,'final');
  }
}));

test('intermediate class contracts override inner factories before an outer application', async () => fixture({'main.ts':base+`
export function Inner<T extends Ctor>(Parent:T) { return (\n/** @csspart panel - inner */\nclass extends Parent { value=1; }); }
/** @csspart panel - middle */
export class Middle extends Inner(Base) { value=2; }
export function Outer<T extends Ctor>(Parent:T) { return (\n/** @csspart panel - outer */\nclass extends Parent { value=3; }); }
export class Leaf extends Outer(Middle) {}
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf'));
  for(const [facet,name] of [['members','value'],['cssParts','panel']]) {
    const row=entry(r,facet,name);assert.equal(c.provenanceOf(row).origin.reference.name,'Outer');
    assert.deepEqual(row.metadata.inheritedFrom,{name:'Outer',module:'main.ts'});
  }
}));

test('repeated factory applications preserve the winning occurrence instead of only the shared AST',async()=>fixture({'main.ts':base+`
export function M<T extends Ctor>(Parent:T) { return (\n/** @csspart panel - repeated */\nclass extends Parent { copied!:InstanceType<T>; }); }
export class Leaf extends M(M(Base)) {}
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf')),applications=r.steps.filter((s:any)=>s.kind==='application');
  assert.equal(applications.length,2);assert.equal(applications[0].origin,applications[1].origin);
  for(const [facet,name] of [['members','copied'],['cssParts','panel']]) assert.equal(c.provenanceOf(entry(r,facet,name)).step,applications[1]);
  assert.ok(c.checker.getPropertyOfType(c.provenanceOf(entry(r,'members','copied')).semanticMember.type,'copied'));
}));

test('same-spelled factories in different modules retain canonical facet provenance',async()=>fixture({
  'a.ts':base+'export function M<T extends Ctor>(Parent:T){return (\n/** @csspart panel - a */\nclass extends Parent {});}',
  'b.ts':'import type {Ctor} from "./a.js"; export function M<T extends Ctor>(Parent:T){return (\n/** @csspart panel - b */\nclass extends Parent {});}',
  'main.ts':'import {Base,M as A} from "./a.js"; import {M as B} from "./b.js"; export class Leaf extends B(A(Base)) {}',
},f=>{const c=f.compose(),r=c.compose(f.declaration('Leaf'));assert.deepEqual(entry(r,'cssParts','panel').metadata.inheritedFrom,{name:'M',module:'b.ts'});assert.equal(c.provenanceOf(entry(r,'cssParts','panel')).origin.reference.module,'b.ts');}));

test('generic field winners use each consuming class instance',async()=>fixture({'main.ts':base+`
export class Generic<T> { value!:T; }
export function M<T extends Ctor>(Parent:T){return class extends Parent {};}
export class Strings extends M(Generic)<string> {}
export class Numbers extends M(Generic)<number> {}
`},f=>{
  const c=f.compose();
  for(const [name,type] of [['Strings','string'],['Numbers','number']]) {
    const row=entry(c.compose(f.declaration(name)),'members','value');
    assert.equal(c.checker.typeToString(c.provenanceOf(row).semanticMember.type),type);
    assert.equal(row.metadata.type,'T','Authored template is not relabelled as instantiated CEM');
  }
}));

test('generic method sidecars preserve instantiated parameter and return signatures',async()=>fixture({'main.ts':base+`
export class Generic<T> { echo(value:T):T {return value;} }
export function M<T extends Ctor>(Parent:T){return class extends Parent {};}
export class Leaf extends M(Generic)<string> {}
`},f=>{
  const c=f.compose(),root=f.declaration('Leaf'),row=entry(c.compose(root),'members','echo');
  const signatures=c.checker.getSignaturesOfType(c.provenanceOf(row).semanticMember.type,ts.SignatureKind.Call);
  assert.equal(signatures.length,1);assert.equal(c.checker.typeToString(c.checker.getReturnTypeOfSignature(signatures[0])),'string');
  assert.equal(c.checker.typeToString(c.checker.getTypeOfSymbolAtLocation(signatures[0].parameters[0],root)),'string');
}));

test('static and instance properties with the same name occupy separate composition slots',async()=>fixture({'main.ts':`
export type Ctor = new (...args:any[])=>object;
export class Base { static value='static'; }
export function M<T extends Ctor>(Parent:T){return class extends Parent { value=1; };}
export class Leaf extends M(Base) {}
`},f=>{
  const c=f.compose(),rows=c.compose(f.declaration('Leaf')).facets.members.filter((r:any)=>r.metadata.name==='value');assert.equal(rows.length,2);
  assert.equal(c.checker.typeToString(c.provenanceOf(rows.find((r:any)=>r.metadata.static)).semanticMember.type),'string');
  assert.equal(c.checker.typeToString(c.provenanceOf(rows.find((r:any)=>!r.metadata.static)).semanticMember.type),'number');
}));

test('authored omissions suppress inherited rows without preventing a later child reintroduction',async()=>fixture({'main.ts':base+`
/** @csspart panel - base */
export class WithPart extends Base {}
export function Hide<T extends Ctor>(Parent:T){return (\n/** @omit-csspart panel */\nclass extends Parent {});}
export class Hidden extends Hide(WithPart) {}
/** @csspart panel - restored */
export class Restored extends Hidden {}
`},f=>{
  const c=f.compose();assert.equal(entry(c.compose(f.declaration('Hidden')),'cssParts','panel'),undefined);
  const r=c.compose(f.declaration('Restored')),row=entry(r,'cssParts','panel');assert.equal(row.metadata.description,'restored');assert.equal(row.metadata.inheritedFrom,undefined);
  assert.ok(r.exclusions.some((x:any)=>x.facet==='cssParts'&&x.reason==='authored-omission'));
  assert.deepEqual(r.omissions.filter((x:any)=>x.facet==='cssParts').map((x:any)=>x.names),[['panel']]);
}));

test('own reintroduction at an omission step does not inherit erased documentation',async()=>fixture({'main.ts':base+`
/** @csspart panel - inherited description */
export class WithPart extends Base {}
/**
 * @omit-csspart panel
 * @csspart panel
 */
export class Leaf extends WithPart {}
`},f=>{const c=f.compose(),row=entry(c.compose(f.declaration('Leaf')),'cssParts','panel');assert.equal(row.metadata.description,undefined);assert.equal(row.metadata.inheritedFrom,undefined);}));

test('discovered child facets inherit only absent documentation from their nearest predecessor',async()=>fixture({'main.ts':base+`
/** @csspart panel - documented */
export class WithPart extends Base {}
/** @csspart panel */
export class Leaf extends WithPart {}
`},f=>{const c=f.compose(),row=entry(c.compose(f.declaration('Leaf')),'cssParts','panel');assert.equal(row.metadata.description,'documented');assert.equal(c.provenanceOf(row).origin.node,f.declaration('Leaf'));}));

test('internal and ignore member overrides cannot resurrect an inherited public field or attribute',async()=>{
  for(const tag of ['internal','ignore']) await fixture({'main.ts':base+`
export class Public extends Base {
/** @attribute value */
value=1;
}
export function Hide<T extends Ctor>(Parent:T){return class extends Parent {
/** @${tag} */
value=2;
};}
export class Leaf extends Hide(Public) {}
`},f=>{
    const c=f.compose(),r=c.compose(f.declaration('Leaf'));assert.equal(entry(r,'members','value'),undefined);assert.equal(entry(r,'attributes','value'),undefined);
    assert.ok(r.exclusions.some((x:any)=>x.reason==='internal-member'));
  });
});

test('state and attribute false policies remove inherited field links without changing field source identity',async()=>{
  for(const policy of ['state:true','attribute:false']) await fixture({'main.ts':`import {LitElement} from 'lit'; export type Ctor=new (...args:any[])=>Public;
export class Public extends LitElement {
/** @attribute value */
value=1;
}
export function Hide<T extends Ctor>(Parent:T){return class extends Parent {static properties={value:{${policy}}};};}
export class Leaf extends Hide(Public) {}
`},f=>{
    const c=f.compose(true),r=c.compose(f.declaration('Leaf')),row=entry(r,'members','value');assert.ok(row);assert.equal(row.metadata.attribute,undefined);assert.equal(row.metadata.reflects,undefined);
    assert.equal(entry(r,'attributes','value'),undefined);assert.equal(c.provenanceOf(row).origin.reference.name,'Public');
    assert.equal(c.provenanceOf(row).policies.at(-1).by.origin.reference.name,'Hide');
  });
});

test('internal event policy is applied at its consuming occurrence without inventing event ownership',async()=>fixture({'main.ts':base+`
/** @fires {Event} changed - inherited event */
export class Public extends Base {}
export function Hide<T extends Ctor>(Parent:T){return (\n/** @internalEvent changed */\nclass extends Parent {});}
export class Leaf extends Hide(Public) {}
`},f=>{
  const c=f.compose(),row=entry(c.compose(f.declaration('Leaf')),'events','changed');assert.equal(row.metadata.privacy,'private');assert.equal(c.provenanceOf(row).origin.reference.name,'Public');assert.equal(c.provenanceOf(row).policies[0].by.origin.reference.name,'Hide');
}));

test('linked attributes retain the consuming semantic field and independently authored narrow type',async()=>fixture({'main.ts':base+`
/** @attr {string} value */
export class Public extends Base {
/** @attribute value */
get value():string|null{return null;}
}
export function M<T extends Ctor>(Parent:T){return class extends Parent {};}
export class Leaf extends M(Public) {}
`},f=>{
  const c=f.compose(),row=entry(c.compose(f.declaration('Leaf')),'attributes','value');assert.equal(row.metadata.type,'string');
  assert.equal(c.checker.typeToString(c.provenanceOf(row).semanticMember.type),'string | null');
}));

test('default slots remain valid empty names and ordinary functions are never facet origins',async()=>fixture({'main.ts':base+`
/** @slot - default content */
export class Leaf extends Base {}
export function ordinary(){return 1;}
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf'));assert.equal(entry(r,'slots','').metadata.description,'default content');assert.equal(r.steps.some((s:any)=>s.origin?.reference.name==='ordinary'),false);
}));

test('opaque external terminal ancestry is preserved without fabricating external metadata',async()=>fixture({'main.ts':`
export class Leaf extends HTMLElement { own=1; }
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf'));assert.equal(r.steps[0].kind,'terminal');assert.deepEqual(r.facets.members.map((x:any)=>x.metadata.name),['own']);
}));

test('private identifiers retain source-bound templates without a false public symbol lookup',async()=>fixture({'main.ts':base+`
export class Leaf extends Base { #secret=1; reveal(){return this.#secret;} }
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf')),row=entry(r,'members','#secret');assert.equal(row.metadata.privacy,'private');assert.equal(c.provenanceOf(row).origin.node,f.declaration('Leaf'));assert.equal(c.provenanceOf(row).semanticMember,undefined);
}));

test('strict own validation still rejects hidden event payloads even when a later row would override them',async()=>fixture({'main.ts':base+`
interface Hidden { secret:string; }
export function M<T extends Ctor>(Parent:T){return (\n/** @fires {CustomEvent<Hidden>} changed */\nclass extends Parent {});}
/** @fires {Event} changed */
export class Leaf extends M(Base) {}
`},f=>{assert.throws(()=>f.compose(),(error:any)=>error.failures?.some((x:any)=>x.message.includes('unexported type "Hidden"')));}));

test('wrong Programs cloned facet records and post-extraction mutation fail their identity boundaries',async()=>fixture({'main.ts':base+factory},f=>{
  const extracted=f.build();assert.throws(()=>constructorContractComposition(f.makeProgram(),f.sources,extracted),/exact Program/);
  const c=constructorContractComposition(f.program,f.sources,extracted),r=c.compose(f.declaration('Leaf')),row=entry(r,'members','value');
  assert.throws(()=>c.provenanceOf(structuredClone(row)),/exact composition provenance/);
  assert.throws(()=>{row.metadata.name='changed';},TypeError);
  f.row(extracted,'M').members[0].name='changed';assert.throws(()=>c.compose(f.declaration('Leaf')),/changed before validation/);
}));

test('composition never evaluates authored static blocks or factory bodies',async()=>fixture({'main.ts':base+`
export function M<T extends Ctor>(Parent:T){return class extends Parent { static {throw new Error('Do not evaluate');} value=1; };}
export class Leaf extends M(Base) { static {throw new Error('Do not evaluate');} }
`},f=>{const c=f.compose();assert.ok(entry(c.compose(f.declaration('Leaf')),'members','value'));}));


test('quoted reactive keys retain inherited suppression and computed policies fail explicitly',async()=>{
  const prefix=`import {LitElement} from 'lit'; export type Ctor=new (...args:any[])=>Public; export class Public extends LitElement {
/** @attribute value */
value=1;
}
`;
  await fixture({'main.ts':prefix+`export function M<T extends Ctor>(Parent:T){return class extends Parent {static properties={'value':{'attribute':false}};};} export class Leaf extends M(Public) {}`},f=>{
    const c=f.compose(true);assert.equal(entry(c.compose(f.declaration('Leaf')),'attributes','value'),undefined);
  });
  await fixture({'main.ts':prefix+`const name='value'; export function M<T extends Ctor>(Parent:T){return class extends Parent {static properties={[name]:{attribute:false}};};} export class Leaf extends M(Public) {}`},f=>{
    assert.throws(()=>f.compose(true),/Dynamic reactive policies/);
  });
});


test('constructor assignment defaults supplement the declaring member instead of changing semantic ownership',async()=>fixture({'main.ts':base+`
export class Public extends Base {
/** @attribute value */
value=1;
}
export class Leaf extends Public { constructor(){super();this.value=2;} }
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf')),row=entry(r,'members','value'),proof=c.provenanceOf(row);
  assert.equal(row.metadata.default,'2');assert.equal(row.metadata.attribute,'value');
  assert.equal(entry(r,'attributes','value').metadata.default,'2');
  assert.equal(c.provenanceOf(entry(r,'attributes','value')).contributions[0].assignment,proof.contributions[0].assignment);
  assert.equal(proof.origin.reference.name,'Public');assert.equal(proof.semanticMember.origin,proof.origin);
  assert.equal(proof.contributions.length,1);assert.equal(proof.contributions[0].by.origin.reference.name,'Leaf');
  assert.ok(ts.isBinaryExpression(proof.contributions[0].assignment));
}));

test('Lit option supplements preserve inherited type readonly default and declaration provenance',async()=>fixture({'main.ts':`
import {LitElement} from 'lit'; export type Ctor=new (...args:any[])=>Public;
export class Public extends LitElement { static properties={value:{type:Object}}; readonly value:string|null='initial'; }
export function Configure<T extends Ctor>(Parent:T){return class extends Parent {static properties={value:{type:String,attribute:'renamed'}};};}
export class Leaf extends Configure(Public) {}
`},f=>{
  const c=f.compose(true),r=c.compose(f.declaration('Leaf')),row=entry(r,'members','value'),proof=c.provenanceOf(row);
  assert.equal(row.metadata.type,'string|null');assert.equal(row.metadata.readonly,true);assert.equal(row.metadata.default,"'initial'");
  assert.equal(c.checker.typeToString(proof.semanticMember.type,proof.root,ts.TypeFormatFlags.NoTruncation),'string | null');
  assert.equal(row.metadata.attribute,'renamed');assert.equal(proof.origin.reference.name,'Public');
  assert.equal(proof.contributions[0].by.origin.reference.name,'Configure');
  assert.equal(entry(r,'attributes','value'),undefined);
  const attribute=entry(r,'attributes','renamed');assert.equal(attribute.metadata.type,'string|null');assert.equal(attribute.metadata.default,"'initial'");
  assert.equal(c.provenanceOf(attribute).origin.reference.name,'Public');assert.equal(c.provenanceOf(attribute).contributions[0].by.origin.reference.name,'Configure');
}));

test('ordinary same-named static properties data does not confer Lit policy ownership',async()=>fixture({'main.ts':base+`
export class Public extends Base {
/** @attribute value */
value=1;
}
export function M<T extends Ctor>(Parent:T){return class extends Parent {static properties={value:{attribute:false}};};}
export class Leaf extends M(Public) {}
`},f=>{
  const c=f.compose(true),r=c.compose(f.declaration('Leaf'));assert.ok(entry(r,'attributes','value'));assert.equal(entry(r,'members','value').metadata.attribute,'value');
  assert.ok(entry(r,'members','properties'));
}));

test('same-spelled private fields in distinct classes and repeated factories retain separate lexical brands',async()=>{
  await fixture({'main.ts':base+`export class A extends Base {#secret=1;} export class Leaf extends A {#secret=2;}`},f=>{
    const c=f.compose(),rows=c.compose(f.declaration('Leaf')).facets.members.filter((r:any)=>r.metadata.name==='#secret');assert.equal(rows.length,2);
    assert.notEqual(rows[0].key,rows[1].key);assert.notEqual(c.provenanceOf(rows[0]).origin,c.provenanceOf(rows[1]).origin);
  });
  await fixture({'main.ts':base+`export function M<T extends Ctor>(Parent:T){return class extends Parent {#secret=1;};} export class Leaf extends M(M(Base)) {}`},f=>{
    const c=f.compose(),rows=c.compose(f.declaration('Leaf')).facets.members.filter((r:any)=>r.metadata.name==='#secret');assert.equal(rows.length,2);
    assert.notEqual(rows[0].key,rows[1].key);assert.equal(c.provenanceOf(rows[0]).origin,c.provenanceOf(rows[1]).origin);assert.notEqual(c.provenanceOf(rows[0]).step,c.provenanceOf(rows[1]).step);
  });
});


test('reactive replacement resets inherited alias and reflection while retaining the field contract',async()=>{
  for(const settings of ["type:String", "type:String,'reflect':false", "type:String,'attribute':'EXPLICIT','reflect':true"]) await fixture({'main.ts':`
import {LitElement} from 'lit'; export type Ctor=new (...args:any[])=>Public;
export class Public extends LitElement {
  static properties={camelValue:{type:Object,attribute:'old-alias',reflect:true}};
  /** Field documentation. */ readonly camelValue:string|null='initial';
}
export function Configure<T extends Ctor>(Parent:T){return class extends Parent {static properties={'camelValue':{${settings}}};};}
export class Leaf extends Configure(Public) {}
`},f=>{
    const c=f.compose(true),r=c.compose(f.declaration('Leaf')),member=entry(r,'members','camelValue');
    const explicit=settings.includes('EXPLICIT'),name=explicit?'EXPLICIT':'camelvalue';
    assert.equal(member.metadata.attribute,name);assert.equal(member.metadata.reflects,explicit?true:undefined);
    assert.equal(entry(r,'attributes','old-alias'),undefined);assert.equal(entry(r,'attributes','camelValue'),undefined);
    const attr=entry(r,'attributes',name);assert.equal(attr.metadata.type,'string|null');assert.equal(attr.metadata.default,"'initial'");assert.equal(attr.metadata.description,'Field documentation.');
    const proof=c.provenanceOf(attr);assert.equal(c.checker.typeToString(proof.semanticMember.type,proof.root,ts.TypeFormatFlags.NoTruncation),'string | null');
    assert.equal(c.provenanceOf(attr).origin.reference.name,'Public');assert.equal(c.provenanceOf(attr).semanticMember.origin,c.provenanceOf(member).origin);
  });
});

test('converter-only same-name supplements retain authored narrow types and allow explicit child contracts',async()=>{
  for(const childDoc of ['', '/** @attr {"child"} value - child documentation */']) await fixture({'main.ts':`
import {LitElement} from 'lit'; export type Ctor=new (...args:any[])=>Public;
/** @attr {string} value - authored narrow contract */
export class Public extends LitElement { static properties={value:{type:Object}}; readonly value:string|null='initial'; }
export function Configure<T extends Ctor>(Parent:T){return (
${childDoc}
class extends Parent {static properties={value:{type:String}};});}
export class Leaf extends Configure(Public) {}
`},f=>{
    const c=f.compose(true),r=c.compose(f.declaration('Leaf')),attr=entry(r,'attributes','value');
    assert.equal(attr.metadata.type,childDoc?'"child"':'string');assert.equal(attr.metadata.default,"'initial'");
    assert.equal(attr.metadata.description,childDoc?'child documentation':'authored narrow contract');
    assert.equal(c.checker.typeToString(c.provenanceOf(attr).semanticMember.type),'string | null');
    assert.equal(c.provenanceOf(attr).origin.reference.name,childDoc?'Configure':'Public');
  });
});

test('dynamic reactive policies reject precisely before extracting any misleading own rows',async()=>{
  for(const declaration of [
    "static properties={value:{reflect:Boolean(1)}};",
    "static properties={value:{attribute:String('value')}};",
    "static properties={value:{state:Boolean(1)}};",
    "static properties={value:{...{reflect:true}}};",
    "static get properties(){if(Boolean(1)) return {value:{type:String}};return {value:{type:String}};}",
  ]) await fixture({'main.ts':`
import {LitElement} from 'lit'; export type Ctor=new (...args:any[])=>Public;
export class Public extends LitElement {value='initial';}
export function Configure<T extends Ctor>(Parent:T){return class extends Parent {${declaration}};}
export class Leaf extends Configure(Public) {}
`},f=>assert.throws(()=>f.compose(true),/Dynamic reactive policies require an occurrence adapter/));
});

test('one unconditional reactive getter uses lowercase defaults and explicit quoted aliases',async()=>fixture({'main.ts':`
import {LitElement} from 'lit';
export class Leaf extends LitElement {
static get properties(){return {'camelValue':{'type':String},otherValue:{'attribute':'EXACT','reflect':true}};}
camelValue:string|null=null; otherValue='ok';
}
`},f=>{
  const c=f.compose(true),r=c.compose(f.declaration('Leaf'));
  const attribute=entry(r,'attributes','camelvalue'),proof=c.provenanceOf(attribute);
  assert.equal(attribute.metadata.type,'string|null');assert.equal(entry(r,'attributes','camelValue'),undefined);
  assert.equal(c.checker.typeToString(proof.semanticMember.type,proof.root,ts.TypeFormatFlags.NoTruncation),'string | null');
  assert.equal(entry(r,'members','otherValue').metadata.attribute,'EXACT');assert.equal(entry(r,'members','otherValue').metadata.reflects,true);
  assert.ok(entry(r,'attributes','EXACT'));assert.equal(entry(r,'attributes','otherValue'),undefined);
}));


test('declare-only defaults preserve inherited initialization without changing child type ownership',async()=>{
  for(const declaration of ['declare value:string;', "value='child';", 'value:string=undefined!;']) await fixture({'main.ts':base+`
export class Public extends Base { value:string|null='initial'; }
export class Leaf extends Public {${declaration}}
`},f=>{
    const c=f.compose(),row=entry(c.compose(f.declaration('Leaf')),'members','value'),proof=c.provenanceOf(row);
    assert.equal(row.metadata.type,'string');assert.equal(proof.origin.reference.name,'Leaf');assert.equal(proof.semanticMember.origin,proof.origin);
    assert.equal(row.metadata.default,declaration.startsWith('declare')?"'initial'":declaration.includes('child')?"'child'":'undefined!');
    assert.equal(proof.contributions.some((item:any)=>item.kind==='declare-only-default'),declaration.startsWith('declare'));
  });
});

test('new authored attribute types replace the inherited parsed representation as one contract',async()=>fixture({'main.ts':`
import {LitElement} from 'lit'; export type Ctor=new (...args:any[])=>Public;
export type Choices='base-one'|'base-two';
/** @attr {Choices} value */
export class Public extends LitElement {static properties={value:{type:String}};value:string|null='base-one';}
export function Configure<T extends Ctor>(Parent:T){return (
/** @attr {"child"} value */
class extends Parent {static properties={value:{type:String}};});}
export class Leaf extends Configure(Public) {}
`},f=>{
  const extracted=f.build(true),base=f.row(extracted,'Public').attributes.find((row:any)=>row.name==='value');
  const own=f.row(extracted,'Configure').attributes.find((row:any)=>row.name==='value');
  assert.ok(base.parsedType,'Precondition: inherited contract has an expanded alias');
  const c=constructorContractComposition(f.program,f.sources,extracted),row=entry(c.compose(f.declaration('Leaf')),'attributes','value');
  assert.equal(row.metadata.type,'"child"');assert.equal(row.metadata.parsedType,own.parsedType);assert.notEqual(row.metadata.parsedType,base.parsedType);
}));

test('constructor writes preserve independently authored attribute defaults',async()=>fixture({'main.ts':base+`
/** @attr {number} [value=7] */
export class Public extends Base {
/** @attribute value */
value=1;
}
export class Leaf extends Public {constructor(){super();this.value=2;}}
`},f=>{
  const extracted=f.build(),own=f.row(extracted,'Public').attributes;
  assert.deepEqual(own.map((row:any)=>({name:row.name,fieldName:row.fieldName,default:row.default})),[{name:'value',fieldName:'value',default:'7'}],'Extraction must bind the authored default to the actual field');
  const c=constructorContractComposition(f.program,f.sources,extracted),r=c.compose(f.declaration('Leaf'));
  assert.equal(entry(r,'members','value').metadata.default,'2');
  const attribute=entry(r,'attributes','value');assert.equal(attribute.metadata.default,'7');
  assert.equal(c.provenanceOf(attribute).origin.node,f.declaration('Public'));
  const proof=c.provenanceOf(attribute),fieldProof=c.provenanceOf(entry(r,'members','value'));
  assert.equal(proof.attributeDefaultContract.kind,'authored');assert.equal(proof.attributeDefaultContract.origin.node,f.declaration('Public'));
  assert.equal(proof.attributeDefaultContract.name,'value');assert.equal(proof.attributeDefaultContract.default,'7');
  assert.equal(proof.semanticMember.origin,fieldProof.semanticMember.origin);assert.equal(proof.semanticMember.step,fieldProof.semanticMember.step);
  assert.equal(fieldProof.contributions.at(-1).assignment.right.getText(),'2');
  assert.equal(proof.contributions.some((item:any)=>item.assignment),false,'Field assignment must not be claimed as an independent authored attribute default');
}));


test('authored attribute defaults retain quoted delimiters nested brackets and optional names',()=>{
  const source=ts.createSourceFile('defaults.ts',`/**
   * @attr {string} [label="a] b"] - quoted delimiter
   * @attribute {number[]} [values=[1, 2]] - nested brackets
   * @attr {string} [optional] - no default
   */ export class Example {}`,ts.ScriptTarget.Latest,true);
  assert.deepEqual(parseCemClassTags(source.statements[0]).attributes,[
    {name:'label',type:'string',default:'"a] b"',description:'quoted delimiter'},
    {name:'values',type:'number[]',default:'[1, 2]',description:'nested brackets'},
    {name:'optional',type:'string',default:undefined,description:'no default'},
  ]);
});

test('malformed authored bracket defaults reject instead of becoming attribute names',()=>{
  for(const text of ['[value=7','[value=]','[=7]','[bad name=7]','[value="unterminated]','[value=7]suffix']) {
    const source=ts.createSourceFile('invalid.ts','/** @attr {number} '+text+' */ export class Example {}',ts.ScriptTarget.Latest,true);
    assert.throws(()=>parseCemClassTags(source.statements[0]),/Malformed authored attribute default/,text);
  }
});

test('Lit authored defaults survive inherited constructor assignments and explicit alias remapping',async()=>fixture({'main.ts':`
import {LitElement} from 'lit';
/** @attr {number} [original=7] */
export class Public extends LitElement {static properties={value:{type:Number,attribute:'original'}};value=1;}
export class Assigned extends Public {constructor(){super();this.value=2;}}
export class Renamed extends Assigned {static properties={value:{type:Number,attribute:'renamed'}};}
export class Leaf extends Renamed {constructor(){super();this.value=3;}}
`},f=>{
  const extracted=f.build(true),own=f.row(extracted,'Public').attributes;
  assert.deepEqual(own.map((row:any)=>({name:row.name,fieldName:row.fieldName,default:row.default})),[{name:'original',fieldName:'value',default:'7'}]);
  const c=constructorContractComposition(f.program,f.sources,extracted),r=c.compose(f.declaration('Leaf'));
  assert.equal(entry(r,'members','value').metadata.default,'3');
  assert.equal(entry(r,'attributes','original'),undefined);
  const attribute=entry(r,'attributes','renamed');assert.equal(attribute.metadata.default,'7');assert.equal(c.provenanceOf(attribute).origin.node,f.declaration('Public'));
}));

test('child authored attribute defaults override inherited defaults independently of field assignment',async()=>fixture({'main.ts':base+`
/** @attr {number} [value=7] */
export class Public extends Base {
/** @attribute value */
value=1;
}
/** @attr {number} [value=9] */
export class Override extends Public {constructor(){super();this.value=2;}}
export class Leaf extends Override {constructor(){super();this.value=3;}}
`},f=>{
  const extracted=f.build();assert.equal(f.row(extracted,'Override').attributes.find((row:any)=>row.name==='value').default,'9');
  const c=constructorContractComposition(f.program,f.sources,extracted),r=c.compose(f.declaration('Leaf'));
  assert.equal(entry(r,'members','value').metadata.default,'3');
  const attribute=entry(r,'attributes','value');assert.equal(attribute.metadata.default,'9');assert.equal(attribute.metadata.fieldName,'value');
  const proof=c.provenanceOf(attribute);assert.equal(proof.origin.node,f.declaration('Override'));
  assert.equal(proof.attributeTypeContract.origin.node,f.declaration('Override'));assert.equal(proof.semanticMember.origin.node,f.declaration('Public'));
}));

test('generated linked attribute defaults continue following repeated constructor assignments',async()=>fixture({'main.ts':base+`
export class Public extends Base {
/** @attribute value */
value=1;
}
export class Assigned extends Public {constructor(){super();this.value=2;}}
export class Leaf extends Assigned {constructor(){super();this.value=3;}}
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf'));
  assert.equal(entry(r,'members','value').metadata.default,'3');assert.equal(entry(r,'attributes','value').metadata.default,'3');
  assert.equal(c.provenanceOf(entry(r,'attributes','value')).origin.node,f.declaration('Public'));
}));


test('bracket-default attributes cannot hide a private authored type behind a public backing field',async()=>fixture({'main.ts':base+`
type Hidden=number;
/** @attr {Hidden} [value=7] */
export class Public extends Base {
/** @attribute value */
value=1;
}
export class Leaf extends Public {constructor(){super();this.value=2;}}
`},f=>{
  const extracted=f.build(),own=f.row(extracted,'Public');
  assert.equal(own.members.find((row:any)=>row.name==='value').type,'number');
  assert.equal(own.attributes.find((row:any)=>row.name==='value').type,'Hidden');
  assert.match(f.errors(extracted).join('\n'),/Hidden/);
  assert.throws(()=>constructorContractComposition(f.program,f.sources,extracted),/export|Hidden|validation/i);
}));

test('bracket-default attributes preserve valid public authored type provenance',async()=>fixture({'main.ts':base+`
export type PublicValue=number;
/** @attr {PublicValue} [value=7] */
export class Public extends Base {
/** @attribute value */
value=1;
}
export class Leaf extends Public {constructor(){super();this.value=2;}}
`},f=>{
  const extracted=f.build();assert.deepEqual(f.errors(extracted),[]);
  const c=constructorContractComposition(f.program,f.sources,extracted),attribute=entry(c.compose(f.declaration('Leaf')),'attributes','value');
  assert.equal(attribute.metadata.type,'PublicValue');assert.equal(attribute.metadata.default,'7');
  assert.equal(c.provenanceOf(attribute).attributeTypeContract.origin.node,f.declaration('Public'));
}));


test('docs-only child attribute overrides retain the exact inherited field association',async()=>fixture({'main.ts':base+`
export type PublicValue=number;
/** @attr {number} [value=7] */
export class Public extends Base {
/** @attribute value */
value=1;
}
/** @attr {PublicValue} [value=9] */
export class Override extends Public {}
export class Leaf extends Override {}
`},f=>{
  const extracted=f.build();assert.equal(f.row(extracted,'Override').attributes.find((row:any)=>row.name==='value').fieldName,undefined,'Precondition: own documentation has no generated field link');
  const c=constructorContractComposition(f.program,f.sources,extracted),attribute=entry(c.compose(f.declaration('Leaf')),'attributes','value'),proof=c.provenanceOf(attribute);
  assert.equal(attribute.metadata.fieldName,'value');assert.equal(attribute.metadata.default,'9');assert.equal(attribute.metadata.type,'PublicValue');
  assert.equal(proof.origin.node,f.declaration('Override'));assert.equal(proof.attributeTypeContract.origin.node,f.declaration('Override'));
  assert.equal(proof.semanticMember.origin.node,f.declaration('Public'));assert.equal(proof.semanticMember.declarations[0],f.declaration('Public').members[0]);
}));


test('description-only attribute overrides retain authored type and default through later assignments',async()=>fixture({'main.ts':base+`
export type Narrow='narrow';
/** @attr {Narrow} [value='narrow'] - base docs */
export class Public extends Base {
/** @attribute value */
value:string='initial';
}
/** @attr value - child docs */
export class Described extends Public {}
export class Leaf extends Described {constructor(){super();this.value='assigned';}}
`},f=>{
  const extracted=f.build(),baseAttribute=f.row(extracted,'Public').attributes.find((row:any)=>row.name==='value');
  const own=f.row(extracted,'Described').attributes.find((row:any)=>row.name==='value');
  assert.equal(own.type,undefined);assert.equal(own.default,undefined);assert.equal(own.fieldName,undefined);
  const c=constructorContractComposition(f.program,f.sources,extracted),r=c.compose(f.declaration('Leaf')),attribute=entry(r,'attributes','value'),proof=c.provenanceOf(attribute);
  assert.equal(entry(r,'members','value').metadata.default,"'assigned'");
  assert.equal(attribute.metadata.description,'child docs');assert.equal(attribute.metadata.fieldName,'value');
  assert.equal(attribute.metadata.type,'Narrow');assert.equal(attribute.metadata.parsedType,baseAttribute.parsedType);assert.equal(attribute.metadata.default,"'narrow'");
  assert.equal(proof.attributeTypeContract.origin.node,f.declaration('Public'));assert.equal(proof.attributeDefaultContract.origin.node,f.declaration('Public'));assert.equal(proof.semanticMember.origin.node,f.declaration('Public'));
}));

test('type-only attribute overrides retain the independently authored inherited default',async()=>fixture({'main.ts':base+`
export type Narrow='narrow';
/** @attr {string} [value='narrow'] */
export class Public extends Base {
/** @attribute value */
value:string='initial';
}
/** @attr {Narrow} value */
export class Retyped extends Public {}
export class Leaf extends Retyped {constructor(){super();this.value='assigned';}}
`},f=>{
  const c=f.compose(),r=c.compose(f.declaration('Leaf')),attribute=entry(r,'attributes','value'),proof=c.provenanceOf(attribute);
  assert.equal(attribute.metadata.type,'Narrow');assert.equal(attribute.metadata.default,"'narrow'");assert.equal(attribute.metadata.fieldName,'value');
  assert.equal(proof.attributeTypeContract.origin.node,f.declaration('Retyped'));assert.equal(proof.attributeDefaultContract.origin.node,f.declaration('Public'));
}));


for(const mode of ['omit','state','attribute-false']) test('independent authored attribute rows survive '+mode+' without inherited field links',async()=>fixture({'main.ts':`
import {LitElement} from 'lit';
/** @attr {number} [value=7] */
export class Public extends LitElement {static properties={value:{type:Number}};value=1;}
/**
 * ${mode==='omit'?'@omit-attr value':''}
 * @attr {number} [value=9]
 */
export class Independent extends Public {${mode==='omit'?'':'static properties={value:{type:Number,'+(mode==='state'?'state:true':'attribute:false')+'}};'}}
export class Leaf extends Independent {}
`},f=>{
    const extracted=f.build(true),own=f.row(extracted,'Independent').attributes.find((row:any)=>row.name==='value');
    assert.ok(own,mode+': explicit own attribute contract survives normalization');assert.equal(own.fieldName,undefined);
    const c=constructorContractComposition(f.program,f.sources,extracted),r=c.compose(f.declaration('Leaf')),attribute=entry(r,'attributes','value');
    assert.ok(attribute,mode+': independently authored row survives composition');const proof=c.provenanceOf(attribute);
    assert.equal(attribute.metadata.default,'9');assert.equal(attribute.metadata.fieldName,undefined);assert.equal(proof.semanticMember,undefined);
    assert.equal(proof.attributeTypeContract.origin.node,f.declaration('Independent'));assert.equal(proof.attributeDefaultContract.origin.node,f.declaration('Independent'));
    assert.equal(proof.contributions.some((item:any)=>item.kind==='inherited-attribute-link'),false);
  }));


test('suppressed generated links cannot lend type default or docs to untyped authored attributes',async()=>fixture({'main.ts':`
import {LitElement} from 'lit';
/** @attr {number} [value=7] - inherited docs */
export class Public extends LitElement {static properties={value:{type:Number}};value=1;}
/** @attr value - independent docs */
export class Independent extends Public {static properties={value:{type:Number,state:true}};}
export class Leaf extends Independent {}
`},f=>{
  const extracted=f.build(true),own=f.row(extracted,'Independent').attributes.find((row:any)=>row.name==='value');
  assert.ok(own);assert.equal(own.fieldName,undefined);assert.equal(own.type,undefined);assert.equal(own.parsedType,undefined);assert.equal(own.default,undefined);assert.equal(own.description,'independent docs');
  const c=constructorContractComposition(f.program,f.sources,extracted),attribute=entry(c.compose(f.declaration('Leaf')),'attributes','value');
  assert.deepEqual(Object.fromEntries(Object.entries(attribute.metadata).filter(([,value])=>value!==undefined)),{name:'value',description:'independent docs',inheritedFrom:{name:'Independent',module:'main.ts'}});
  assert.equal(c.provenanceOf(attribute).semanticMember,undefined);
}));

test('independent authored attributes on suppressed fields still reject hidden types',async()=>fixture({'main.ts':`
import {LitElement} from 'lit';
type Hidden=number;
export class Public extends LitElement {static properties={value:{type:Number}};value=1;}
/** @attr {Hidden} [value=9] */
export class Independent extends Public {static properties={value:{type:Number,state:true}};}
export class Leaf extends Independent {}
`},f=>{
  const extracted=f.build(true),own=f.row(extracted,'Independent').attributes.find((row:any)=>row.name==='value');
  assert.ok(own);assert.equal(own.fieldName,undefined);assert.equal(own.type,'Hidden');assert.equal(own.default,'9');
  assert.match(f.errors(extracted).join('\n'),/Hidden/);assert.throws(()=>constructorContractComposition(f.program,f.sources,extracted),/export|Hidden|validation/i);
}));


test('independent suppressed attributes parse their own authored type instead of the field alias',async()=>{
  for(const type of ['number','PublicNumbers']) await fixture({'main.ts':`
import {LitElement} from 'lit';
export type Wide='left'|'right';
export type PublicNumbers=1|2;
/** @attr {${type}} [value=9] */
export class Public extends LitElement {static properties={value:{type:String,state:true}};value:Wide='left';}
export class Leaf extends Public {}
`},f=>{
    const extracted=f.build(true),own=f.row(extracted,'Public'),member=own.members.find((row:any)=>row.name==='value'),attribute=own.attributes.find((row:any)=>row.name==='value');
    assert.match(member.parsedType,/left/,'Precondition: suppressed field has an expanded alias');
    const expected=resolveMeaningfulParsedTypeFromText(type,f.sources[0],f.program.getTypeChecker());
    if(type==='number')assert.equal(expected,undefined);else assert.match(expected,/1.*2/);
    assert.equal(attribute.type,type);assert.equal(attribute.parsedType,expected);assert.equal(attribute.fieldName,undefined);assert.equal(attribute.default,'9');
    const c=constructorContractComposition(f.program,f.sources,extracted),composed=entry(c.compose(f.declaration('Leaf')),'attributes','value');
    assert.equal(composed.metadata.type,type);assert.equal(composed.metadata.parsedType,expected);assert.equal(composed.metadata.fieldName,undefined);assert.equal(c.provenanceOf(composed).semanticMember,undefined);
  });
});
