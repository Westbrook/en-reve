import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, rm, symlink, readdir,realpath} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {extractConstructorOrigins} from './candidate-origin-extraction.ts';
import {completeCandidateModules} from './candidate-modules.ts';

// Proposed controls only. No execution is allocated for this draft.
const base = `export type Ctor = new (...args: any[]) => object;
export class Base { base = true; }
`;
const factory = `export function M<T extends Ctor>(Parent: T) { return class Mixed extends Parent { value = 1; }; }
export class Leaf extends M(Base) { own = true; }`;
async function fixture(files: Record<string, string>, run: (f: any) => unknown) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cem-origin-wiring-')));
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
    await run({root, program, makeProgram, sources, roots, build, row, errors});
  } finally {await rm(root, {recursive:true, force:true});}
}

test('real own extraction binds returned implementation and preserves ordinary functions', async () => fixture({
  'main.ts': base + factory + '\nexport function ordinary(value: number) { return value + 1; }',
}, f => {
  const result = f.build(), mixin = f.row(result, 'M');
  assert.equal(mixin.kind, 'mixin'); assert.equal(f.row(result, 'ordinary').kind, 'function');
  assert.deepEqual(mixin.members.map((member: any) => member.name), ['value']);
  assert.deepEqual(f.row(result, 'Leaf').members.map((member: any) => member.name), ['own']);
  assert.equal(result.bindings.provenanceUnits(mixin).implementation.name.text, 'Mixed');
  assert.deepEqual(f.errors(result), []);
}));

test('same-named top-level and returned classes remain separate through extraction', async () => fixture({
  'main.ts': base + 'export class Mixed { outside = true; }\n' + factory,
}, f => {
  const result = f.build();
  assert.deepEqual(f.row(result, 'Mixed').members.map((m: any) => m.name), ['outside']);
  assert.deepEqual(f.row(result, 'M').members.map((m: any) => m.name), ['value']);
  assert.deepEqual(f.errors(result), []);
}));

test('anonymous arrow and function-expression factories keep variable identity', async () => {
  for (const body of ['<T extends Ctor>(Parent: T) => class extends Parent { value = 1; }',
    'function<T extends Ctor>(Parent: T) { return class extends Parent { value = 1; }; }']) await fixture({
      'main.ts': base + `export const M = ${body}; export class Leaf extends M(Base) {}`,
    }, f => {
      const result = f.build(), row = f.row(result, 'M');
      assert.equal(row.kind, 'mixin'); assert.equal(row.exportName, 'M');
      assert.ok(result.bindings.provenanceUnits(row).callable);
      assert.deepEqual(f.errors(result), []);
    });
});

test('named, renamed and star barrel edges preserve canonical factory ownership', async () => fixture({
  'factory.ts': base + 'export function M<T extends Ctor>(Parent: T) { return class extends Parent { value = 1; }; }',
  'barrel.ts': "export {M as Renamed, Base} from './factory.js'; export type {Ctor} from './factory.js';",
  'main.ts': "import * as ns from './barrel.js'; export * from './barrel.js'; export class Leaf extends ns.Renamed(ns.Base) {}",
}, f => {
  const result = f.build();
  const exports = result.internal.modules.find((m: any) => m.path === 'main.ts').exports;
  assert.deepEqual(exports.find((e: any) => e.name === 'Renamed').declaration, {name:'M', module:'factory.ts'});
  assert.ok(result.topology.typeOnlyExports.some((e: any) => e.module === 'main.ts' && e.name === 'Ctor'));
  assert.deepEqual(f.errors(result), []);
}));

test('same factory name in separate modules produces separate bound mixins', async () => fixture({
  'a.ts': base + 'export function M<T extends Ctor>(Parent: T) { return class extends Parent { a = 1; }; }',
  'b.ts': base + 'export function M<T extends Ctor>(Parent: T) { return class extends Parent { b = 1; }; }',
  'main.ts': "import {M as A, Base} from './a.js'; import {M as B} from './b.js'; export class Leaf extends B(A(Base)) {}",
}, f => {
  const result = f.build();
  assert.deepEqual(f.row(result,'M','a.ts').members.map((m:any)=>m.name), ['a']);
  assert.deepEqual(f.row(result,'M','b.ts').members.map((m:any)=>m.name), ['b']);
  assert.deepEqual(f.errors(result), []);
}));

test('type-only mixin re-export retains its edge classification', async () => fixture({
  'factory.ts': base + factory,
  'main.ts': "export type {M as OnlyType} from './factory.js';",
}, f => {
  const result=f.build();
  assert.ok(result.topology.typeOnlyExports.some((e:any)=>e.module==='main.ts' && e.name==='OnlyType' && e.target==='factory.ts#M'));
  assert.deepEqual(f.errors(result), []);
}));

test('a copied mixin row cannot satisfy exact export supplementation', async () => fixture({'main.ts':base+factory}, f => {
  const result=f.build(), copy=structuredClone(result.internal);
  assert.throws(()=>completeCandidateModules(copy,f.root,f.sources,f.program.getTypeChecker(),f.program,result.bindings), /Unbound or changed/);
}));

test('foreign Program and changed extracted rows fail before provenance validation', async () => fixture({'main.ts':base+factory}, f => {
  const result=f.build();
  assert.throws(()=>result.bindings.assertProgram(f.makeProgram(),f.sources),/exact Program/);
  f.row(result,'M').members.push({name:'invented',kind:'field'});
  assert.throws(()=>result.validate(),/changed before validation/);
}));

test('hidden returned-member types remain errors despite constructor identity handling', async () => fixture({
  'main.ts':base+'interface Hidden { secret: string; } export function M<T extends Ctor>(Parent:T) { return class Mixed extends Parent { payload!:Hidden; }; } export class Leaf extends M(Base) {}',
}, f => {
  const result=f.build();assert.ok(f.errors(result).some((text:string)=>text.includes('unexported type "Hidden"')));
}));

test('hidden factory constraints remain strict export-type errors', async () => fixture({
  'main.ts':base.replace('export type Ctor','type Ctor')+factory,
}, f => {assert.ok(f.errors(f.build()).some((text:string)=>text.includes('unexported type "Ctor"')));}));

test('hidden nested callback payloads cannot hide behind an exported alias', async () => fixture({
  'main.ts':base+'interface Hidden { secret: string; } export interface Options { handler(value: Hidden): void; } export function M<T extends Ctor>(Parent:T) { return class extends Parent { options!:Options; }; } export class Leaf extends M(Base) {}',
}, f => {assert.ok(f.errors(f.build()).some((text:string)=>text.includes('unexported type "Hidden"')));}));

test('returned-class typed event docs are checked in their actual source scope', async () => fixture({
  'main.ts':base+'interface Hidden { secret: string; } export function M<T extends Ctor>(Parent:T) { return (\n/** @fires {CustomEvent<Hidden>} changed */\nclass extends Parent {}); } export class Leaf extends M(Base) {}',
}, f => {
  const result=f.build(), owned=result.bindings.provenanceUnits(f.row(result,'M')).implementation;
  assert.ok(ts.getJSDocTags(owned).some((tag:any)=>tag.tagName.text==='fires'));
  assert.ok(f.row(result,'M').events.some((e:any)=>e.name==='changed'));
  assert.ok(f.errors(result).some((text:string)=>text.includes('unexported type "Hidden"')));
}));

test('internal member policy is applied before strict own-row validation', async () => fixture({
  'main.ts':base+'interface Hidden { secret: string; } export function M<T extends Ctor>(Parent:T) { return class extends Parent {\n/** @internal */\npayload!:Hidden; }; } export class Leaf extends M(Base) {}',
}, f => {
  const result=f.build(), owned=result.bindings.provenanceUnits(f.row(result,'M')).implementation;
  assert.ok(ts.getJSDocTags(owned.members.find((member:any)=>member.name?.text==='payload')).some((tag:any)=>tag.tagName.text==='internal'));
  assert.equal(f.row(result,'M').members.some((m:any)=>m.name==='payload'),false);
  assert.deepEqual(f.errors(result),[]);
}));

test('accessor types and reactive exclusions use the returned class source', async () => fixture({
  'main.ts':base+'export function M<T extends Ctor>(Parent:T) { return class extends Parent { static properties = {value:{attribute:false}}; get value():number { return 1; } set value(value:number) {} }; } export class Leaf extends M(Base) {}',
}, f => {
  const result=f.build(), mixin=f.row(result,'M');
  assert.equal(mixin.members.find((m:any)=>m.name==='value').type,'number');
  assert.equal(mixin.attributes.some((a:any)=>a.fieldName==='value'),false);
  assert.deepEqual(f.errors(result),[]);
}));

test('Lit is selected through the installed declaration and proved consuming chain', async () => fixture({
  'main.ts':"import {LitElement as Framework} from 'lit'; export type Ctor=new (...args:any[])=>Framework; export class Base extends Framework {} export function M<T extends Ctor>(Parent:T) { return class extends Parent { static properties={value:{type:Number},localState:{state:true}}; value=1; localState=2; }; } export class Leaf extends M(Base) {}",
}, f => {
  const result=f.build(true), mixin=f.row(result,'M');
  assert.ok(mixin.attributes.some((a:any)=>a.fieldName==='value'));
  assert.equal(mixin.attributes.some((a:any)=>a.fieldName==='localState'),false);
  assert.deepEqual(f.errors(result),[]);
}));

test('a local class named LitElement does not grant framework ownership', async () => fixture({
  'main.ts':base+'export class LitElement {} export function M<T extends Ctor>(Parent:T) { return class extends Parent { static properties={value:{type:Number}}; value=1; }; } export class Leaf extends M(LitElement) {}',
}, f => {
  const result=f.build(true);assert.equal(f.row(result,'M').attributes.some((a:any)=>a.fieldName==='value'),false);
  assert.deepEqual(f.errors(result),[]);
}));

test('mixed Lit and native factory applications fail until contextual extraction exists', async () => fixture({
  'main.ts':"import {LitElement} from 'lit'; "+base+"export class LitBase extends LitElement {} export function M<T extends Ctor>(Parent:T) { return class extends Parent { value=1; }; } export class LitLeaf extends M(LitBase) {} export class NativeLeaf extends M(Base) {}",
}, f => {assert.throws(()=>f.build(true),/mixed Lit and native consumers/);}));

test('static and instance name collisions fail instead of dropping a member', async () => fixture({
  'main.ts':base+'export function M<T extends Ctor>(Parent:T) { return class extends Parent { static value=1; value=2; }; } export class Leaf extends M(Base) {}',
}, f => {assert.throws(()=>f.build(),/distinct static\/instance names/);}));

test('authored modules and factory bodies are never executed during extraction', async () => fixture({
  'main.ts':'throw new Error("authored module must not run");\n'+base+factory,
}, f => {const result=f.build();assert.deepEqual(f.errors(result),[]);}));

test('unsupported namespace export syntax keeps its explicit rejection', async () => fixture({
  'factory.ts':base+factory, 'main.ts':"export * as factories from './factory.js';",
}, f => {assert.throws(()=>f.build(),/Unqualified namespace export/);}));


test('authored narrower accessor attributes preserve their independent type contract', async () => fixture({
  'main.ts':base+'export function M<T extends Ctor>(Parent:T) { return (\n/** @attr {string} label */\nclass extends Parent {\n/** @attribute label */\nget label():string|null { return null; } }); } export class Leaf extends M(Base) {}',
}, f => {
  const result=f.build(), mixin=f.row(result,'M');
  const owned=result.bindings.provenanceUnits(mixin).implementation;
  assert.ok(ts.getJSDocTags(owned).some((tag:any)=>tag.tagName.text==='attr'));
  assert.ok(ts.getJSDocTags(owned.members.find((member:any)=>member.name?.text==='label')).some((tag:any)=>tag.tagName.text==='attribute'));
  assert.equal(mixin.members.find((m:any)=>m.name==='label').type,'string | null');
  assert.equal(mixin.attributes.find((a:any)=>a.name==='label').type,'string');
  assert.deepEqual(f.errors(result),[]);
}));

test('exported constructor and factory aliases keep ordinary value provenance checks', async () => fixture({
  'main.ts':base+factory+'\nexport const FactoryAlias=M; export const ConstructorAlias=Base;',
}, f => {
  const result=f.build();
  assert.equal(f.row(result,'FactoryAlias').kind,'variable');assert.equal(f.row(result,'ConstructorAlias').kind,'variable');
  assert.deepEqual(f.errors(result),[]);
}));

test('supplemented ordinary functions still reject hidden parameter types', async () => fixture({
  'main.ts':base+factory+'\ninterface Hidden {value:string} export function ordinary(value:Hidden) {return value;}',
}, f => {assert.ok(f.errors(f.build()).some((text:string)=>text.includes('unexported type "Hidden"')));}));


test('nested named and anonymous classes do not contribute outer events or template facets', async () => {
  for (const nested of ['class Decoy', 'class']) await fixture({
    'main.ts':base+`export function M<T extends Ctor>(Parent:T) { return class extends Parent { make() { const Other=${nested} extends EventTarget { fire() { this.dispatchEvent(new Event('decoy')); } template=\`<slot name="decoy"></slot><div part="decoy"></div>\`; }; return 1; } }; } export class Leaf extends M(Base) {}`,
  }, f => {
    const result=f.build(), mixin=f.row(result,'M');
    for (const key of ['events','slots','cssParts']) assert.equal((mixin[key]??[]).some((row:any)=>row.name==='decoy'),false);
    assert.deepEqual(f.errors(result),[]);
  });
});

test('nested Lit classes do not contribute outer template or referenced style metadata', async () => fixture({
  'main.ts':"import {LitElement, html, css} from 'lit'; export type Ctor=new (...args:any[])=>LitElement; export class Base extends LitElement {} const decoyStyles=css`:host{--decoy:1}`; export function M<T extends Ctor>(Parent:T) { return class extends Parent { make(){const Other=class extends LitElement {static styles=decoyStyles; render(){return html`<slot name=\"decoy\"></slot><div part=\"decoy\"></div>`;}};return 1;} }; } export class Leaf extends M(Base) {}",
}, f => {
  const result=f.build(true), mixin=f.row(result,'M');
  for(const key of ['slots','cssParts','cssProperties']) assert.equal((mixin[key]??[]).some((row:any)=>row.name==='decoy'||row.name==='--decoy'),false);
  assert.deepEqual(f.errors(result),[]);
}));

test('constructor parameter properties are extracted without requiring this assignments', async () => fixture({
  'main.ts':base+factory+'\nexport class Params extends Leaf {constructor(public readonly value=2, protected hidden=3){super();}}',
}, f => {
  const result=f.build(), params=f.row(result,'Params');
  assert.equal(params.members.find((m:any)=>m.name==='value').readonly,true);
  assert.equal(params.members.find((m:any)=>m.name==='hidden').privacy,'protected');
  assert.deepEqual(f.errors(result),[]);
}));

test('direct registration aliases bind the exact imported class and registration module', async () => fixture({
  'main.ts':'export class Leaf extends HTMLElement {}',
  'register.ts':"import {Leaf as Alias} from './main.js'; customElements.define('x-leaf', Alias);",
}, f => {
  const result=f.build();assert.equal(f.row(result,'Leaf').tagName,'x-leaf');
  assert.deepEqual(result.internal.modules.find((m:any)=>m.path==='register.ts').exports,
    [{kind:'custom-element-definition',name:'x-leaf',declaration:{name:'Leaf',module:'main.ts'}}]);
  assert.deepEqual(f.errors(result),[]);
}));

test('conditional standard registry calls fail instead of silently disappearing', async () => fixture({
  'main.ts':"export class Leaf extends HTMLElement {} if (Math.random()) customElements.define('x-leaf', Leaf);",
}, f => {assert.throws(()=>f.build(),/unconditional module-level call/);}));


test('same-named event variables in two factories resolve to their own symbols', async () => fixture({
  'main.ts':`export type Ctor=new (...args:any[])=>EventTarget; export class Base extends EventTarget {}
  export function A<T extends Ctor>(Parent:T) {return class extends Parent {fireA(){const name='one';this.dispatchEvent(new Event(name));}};}
  export function B<T extends Ctor>(Parent:T) {return class extends Parent {fireB(){const name='two';this.dispatchEvent(new Event(name));}};}
  export class Leaf extends B(A(Base)) {}`,
}, f => {
  const result=f.build();
  assert.deepEqual(f.row(result,'A').events.map((e:any)=>e.name),['one']);
  assert.deepEqual(f.row(result,'B').events.map((e:any)=>e.name),['two']);
  assert.deepEqual(f.errors(result),[]);
}));

test('same-spelled local Event constructor cannot claim platform event identity', async () => fixture({
  'platform.ts':'export const PlatformEvent=Event;',
  'main.ts':`import {PlatformEvent} from './platform.js'; export class Event extends PlatformEvent {}
  export type Ctor=new (...args:any[])=>EventTarget; export class Base extends EventTarget {}
  export function M<T extends Ctor>(Parent:T) {return class extends Parent {fire(){this.dispatchEvent(new Event('changed'));}};}
  export class Leaf extends M(Base) {}`,
}, f => {assert.throws(()=>f.build(),/owned platform Event/);}));


test('platform event constructors retain identity through const and import aliases', async () => fixture({
  'platform.ts':'export const Evt=Event;',
  'main.ts':`import {Evt as Renamed} from './platform.js';
  export type Ctor=new (...args:any[])=>EventTarget; export class Base extends EventTarget {}
  export function M<T extends Ctor>(Parent:T) {return class extends Parent {fire(){this.dispatchEvent(new Renamed('changed'));}};}
  export class Leaf extends M(Base) {}`,
}, f => {
  const result=f.build();assert.equal(f.row(result,'M').events.find((e:any)=>e.name==='changed').type,'Event');
  assert.deepEqual(f.errors(result),[]);
}));


test('returned-class output attributes preserve an explicit read-only getter contract', async () => fixture({
  'main.ts':base+'export function M<T extends Ctor>(Parent:T) { return (\n/** @outputAttribute data-count count - Current count. */\nclass extends Parent { get count():number { return 1; } }); } export class Leaf extends M(Base) {}',
}, f => {
  const result=f.build(), mixin=f.row(result,'M');
  const member=mixin.members.find((m:any)=>m.name==='count');
  const owned=result.bindings.provenanceUnits(f.row(result,'M')).implementation;
  assert.ok(ts.getJSDocTags(owned).some((tag:any)=>tag.tagName.text==='outputAttribute'));
  assert.equal(member.attribute,'data-count');assert.equal(member.readonly,true);assert.equal(member.reflects,true);
  assert.equal(mixin.attributes.find((a:any)=>a.name==='data-count').fieldName,'count');
  assert.deepEqual(f.errors(result),[]);
}));

test('factory-level facet tags stay explicit pending callable facet composition', async () => fixture({
  'main.ts':base+'/** @fires {Event} changed */ export function M<T extends Ctor>(Parent:T) { return class extends Parent {}; } export class Leaf extends M(Base) {}',
}, f => {assert.throws(()=>f.build(),/Factory-level facet tags/);}));


test('optional constructor parameter properties retain undefined in field metadata', async () => fixture({
  'main.ts':base+factory+'\nexport class Params extends Leaf {constructor(public extra?:number){super();}}',
}, f => {
  const result=f.build();assert.equal(f.row(result,'Params').members.find((m:any)=>m.name==='extra').type,'number | undefined');
  assert.deepEqual(f.errors(result),[]);
}));

test('parameter-property authored defaults survive direct constructor assignments', async () => fixture({
  'main.ts':base+factory+'\nexport class Params extends Leaf {constructor(/** @default 7 */ public extra=3){super();this.extra=9;}}',
}, f => {
  const result=f.build();assert.equal(f.row(result,'Params').members.find((m:any)=>m.name==='extra').default,'7');
  assert.deepEqual(f.errors(result),[]);
}));

test('overloaded constructors use the body-bearing parameter-property implementation', async () => fixture({
  'main.ts':base+factory+'\nexport class Params extends Leaf {constructor(extra:number); constructor(public extra=3){super();}}',
}, f => {
  const result=f.build();assert.equal(f.row(result,'Params').members.find((m:any)=>m.name==='extra').type,'number');
  assert.deepEqual(f.errors(result),[]);
}));

test('dispatch on another target and local same-name methods do not become component events', async () => fixture({
  'main.ts':base+`export function M<T extends Ctor>(Parent:T) {return class extends Parent {dispatchEvent(event:Event){return true;} fire(){const other=new EventTarget();other.dispatchEvent(new Event('external'));this.dispatchEvent(new Event('decoy'));}};}
  export class Leaf extends M(Base) {}`,
}, f => {
  const result=f.build();assert.deepEqual(f.row(result,'M').events??[],[]);assert.deepEqual(f.errors(result),[]);
}));

test('mutable event names fail instead of retaining a stale initializer', async () => fixture({
  'main.ts':`export type Ctor=new (...args:any[])=>EventTarget; export class Base extends EventTarget {}
  export function M<T extends Ctor>(Parent:T) {return class extends Parent {fire(){let name='old';name='new';this.dispatchEvent(new Event(name));}};}
  export class Leaf extends M(Base) {}`,
}, f => {assert.throws(()=>f.build(),/stable literal or const/);}));

test('factory facet aliases and omission tags cannot silently disappear', async () => {
  for (const annotation of ['@part part-name','@cssState active','@prop {string} value','@tag x-mixin','@omit-csspart inherited']) await fixture({
    'main.ts':base+`/** ${annotation} */ export function M<T extends Ctor>(Parent:T) {return class extends Parent {}; } export class Leaf extends M(Base) {}`,
  }, f => {assert.throws(()=>f.build(),/Factory-level facet tags/);});
});

test('element-access standard registry definitions fail explicitly', async () => fixture({
  'main.ts':"export class Leaf extends HTMLElement {} customElements['define']('x-leaf', Leaf);",
}, f => {assert.throws(()=>f.build(),/Element-access registry definitions/);}));

test('augmented standard registry methods fail explicitly', async () => fixture({
  'main.ts':"export class Leaf extends HTMLElement {} customElements.define('x-leaf', Leaf);",
  'augmentation.d.ts':'export {}; declare global {interface CustomElementRegistry {define(name:string, ctor:CustomElementConstructor):void;}}',
}, f => {assert.throws(()=>f.build(),/Augmented registry definitions/);}));

test('same-spelled member decorators cannot create or hide reactive contracts', async () => {
  for (const name of ['property','state']) await fixture({
    'main.ts':base+`function ${name}(...args:any[]):any{} export function M<T extends Ctor>(Parent:T) {return class extends Parent {@${name} value=1;};} export class Leaf extends M(Base) {}`,
  }, f => {assert.throws(()=>f.build(),/decorators require/);});
});

test('native own templates exclude dynamic names and markup hidden in attributes', async () => fixture({
  'main.ts':base+`export function M<T extends Ctor>(Parent:T) {return class extends Parent {template(name:string){return \`<div title="<slot name='fake'></slot>"></div><slot name="\${name}"></slot><slot name="real"></slot>\`;}};} export class Leaf extends M(Base) {}`,
}, f => {
  const result=f.build();assert.deepEqual(f.row(result,'M').slots.map((slot:any)=>slot.name),['real']);assert.deepEqual(f.errors(result),[]);
}));


test('opaque external intersection heritage retains actual Lit ownership', async () => fixture({
  'node_modules/origin-external/package.json':JSON.stringify({name:'origin-external',version:'0.0.0',types:'index.d.ts'}),
  'node_modules/origin-external/index.d.ts':"import {LitElement} from 'lit'; declare const Combined: {new (...args:any[]):{extra:string}} & typeof LitElement; export declare class External extends Combined {}",
  'main.ts':"import {External} from 'origin-external'; export class Leaf extends External {static properties={value:{type:Number}}; value=1;}",
}, f => {
  const result=f.build(true);assert.ok(f.row(result,'Leaf').attributes.some((attribute:any)=>attribute.fieldName==='value'));
  assert.deepEqual(f.errors(result),[]);
}));


test('object methods with their own this are excluded while lexical arrows remain component events', async () => fixture({
  'main.ts':`export type Ctor=new (...args:any[])=>EventTarget; export class Base extends EventTarget {}
  export function M<T extends Ctor>(Parent:T) {return class extends Parent {fire(){const object={fire(this:EventTarget){this.dispatchEvent(new Event('decoy'));}};const arrow=()=>this.dispatchEvent(new Event('own'));arrow();}};}
  export class Leaf extends M(Base) {}`,
}, f => {
  const result=f.build();assert.deepEqual(f.row(result,'M').events.map((event:any)=>event.name),['own']);assert.deepEqual(f.errors(result),[]);
}));

test('actual ElementInternals state calls remain own facets without nested-class leakage', async () => fixture({
  'main.ts':`export type Ctor=new (...args:any[])=>HTMLElement; export class Base extends HTMLElement {}
  export function M<T extends Ctor>(Parent:T) {return class extends Parent {private internals=this.attachInternals();activate(){this.internals.states.add('active');const Other=class extends HTMLElement {private internals=this.attachInternals();activate(){this.internals.states.add('decoy');}};}};}
  export class Leaf extends M(Base) {}`,
}, f => {
  const result=f.build();assert.deepEqual(f.row(result,'M').cssStates.map((state:any)=>state.name),['active']);assert.deepEqual(f.errors(result),[]);
}));


test('CustomEvent shorthand, quoted detail keys and typed option spreads preserve the payload contract', async () => {
  for (const options of ['{detail}', "{'detail':detail}", '{...{detail}}']) await fixture({
    'main.ts':`export type Ctor=new (...args:any[])=>EventTarget; export class Base extends EventTarget {} export interface Payload {value:string;}
    export function M<T extends Ctor>(Parent:T) {return class extends Parent {fire(){const detail:Payload={value:'yes'};this.dispatchEvent(new CustomEvent('changed',${options}));}};}
    export class Leaf extends M(Base) {}`,
  }, f => {
    const result=f.build();assert.equal(f.row(result,'M').events.find((event:any)=>event.name==='changed').detail,'Payload');assert.deepEqual(f.errors(result),[]);
  });
});

test('inferred CustomEvent payloads still reject hidden types', async () => fixture({
  'main.ts':`export type Ctor=new (...args:any[])=>EventTarget; export class Base extends EventTarget {} interface Hidden {value:string;}
  export function M<T extends Ctor>(Parent:T) {return class extends Parent {fire(){const detail:Hidden={value:'yes'};this.dispatchEvent(new CustomEvent('changed',{detail}));}};}
  export class Leaf extends M(Base) {}`,
}, f => {assert.ok(f.errors(f.build()).some((text:string)=>text.includes('unexported type "Hidden"')));}));


test('quoted, numeric, computed and escaped own member names reject before accessor contracts can be bypassed', async () => {
  for (const member of [
    'get "value"(): string { return "read"; } set "value"(next: number) {}',
    '/** @internal */ "payload"!: Hidden;',
    'get ["value"](): string { return "read"; }',
    'get 0(): string { return "read"; }',
    String.raw`get v\u0061lue(): string { return "read"; } set v\u0061lue(next: number) {}`,
  ]) await fixture({
    'main.ts':base+'interface Hidden { secret: string; } export function M<T extends Ctor>(Parent:T) { return class extends Parent {'+member+'}; } export class Leaf extends M(Base) {}',
  }, f => {assert.throws(()=>f.build(),/Quoted, numeric, computed and escaped member names require a semantic property-key adapter/);});
  await fixture({
    'main.ts':base+'export function M<T extends Ctor>(Parent:T) { return /** @outputAttribute data-value value - Current value */ class extends Parent { get "value"(): string { return "read"; } }; } export class Leaf extends M(Base) {}',
  }, f => {assert.throws(()=>f.build(),/Quoted, numeric, computed and escaped member names require a semantic property-key adapter/);});
});


test('external native and opaque constructors cannot claim installed Lit ownership', async () => {
  await fixture({
    'node_modules/origin-external/package.json':JSON.stringify({name:'origin-external',version:'0.0.0',types:'index.d.ts'}),
    'node_modules/origin-external/index.d.ts':"import {LitElement} from 'lit'; export declare class External {} export interface External { new(): LitElement; }",
    'main.ts':"import {External} from 'origin-external'; export class Leaf extends External { static properties={value:{type:Number}}; value=1; }",
  }, f => {
    const result=f.build(true);
    assert.equal(f.row(result,'Leaf').attributes.some((attribute:any)=>attribute.fieldName==='value'),false);
    assert.deepEqual(f.errors(result),[]);
  });
  await fixture({
    'node_modules/origin-external/package.json':JSON.stringify({name:'origin-external',version:'0.0.0',types:'index.d.ts'}),
    'node_modules/origin-external/index.d.ts':'export declare class External { extra: string; }',
    'main.ts':"import {External} from 'origin-external'; export class Leaf extends External { static properties={value:{type:Number}}; value=1; }",
  }, f => {
    const result=f.build(true);
    assert.equal(f.row(result,'Leaf').attributes.some((attribute:any)=>attribute.fieldName==='value'),false);
    assert.deepEqual(f.errors(result),[]);
  });
  await fixture({
    'node_modules/origin-external/package.json':JSON.stringify({name:'origin-external',version:'0.0.0',types:'index.d.ts'}),
    'node_modules/origin-external/index.d.ts':'declare const OpaqueBase: new (...args:any[])=>any; export declare class External extends OpaqueBase {}',
    'main.ts':"import {External} from 'origin-external'; export class Leaf extends External { static properties={value:{type:Number}}; value=1; }",
  }, f => {assert.throws(()=>f.build(true),/Opaque external heritage cannot establish Lit ownership/);});
});
