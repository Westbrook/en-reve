// Provenance regressions; all cases require strict validation and compiler-owned origins.
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import ts from '@typescript/typescript6';
import {validateGeneratedManifest, ManifestValidationError} from '@wc-toolkit/cem-generator';

const dependencies = realpathSync(fileURLToPath(new URL('../../node_modules', import.meta.url)));
function fixture(code, declarations = [], additional = {}, run = () => {}) {
  const root = mkdtempSync(join(tmpdir(), 'cem-provenance-'));
  try {
    const files = {'main.ts':code, ...additional};
    for (const [name, source] of Object.entries(files)) {
      assert(!name.startsWith('/') && !name.split('/').includes('..') && !name.startsWith('node_modules/'));
      mkdirSync(dirname(join(root,name)), {recursive:true}); writeFileSync(join(root,name),source);
    }
    // Reference only: no writes occur through this dependency symlink.
    symlinkSync(dependencies, join(root,'node_modules'), 'dir');
    const program = ts.createProgram(Object.keys(files).map(name => join(root,name)), {
      target:ts.ScriptTarget.ESNext, module:ts.ModuleKind.ESNext,
      moduleResolution:ts.ModuleResolutionKind.Bundler, strict:true,
      skipLibCheck:true, noEmit:true, lib:['lib.esnext.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],
    });
    const checker = program.getTypeChecker(), source = program.getSourceFile(join(root,'main.ts'));
    assert(source);
    const diagnostics = Object.keys(files).flatMap(name => {
      const file = program.getSourceFile(join(root,name));
      return [...program.getSyntacticDiagnostics(file), ...program.getSemanticDiagnostics(file)];
    });
    assert.equal(diagnostics.length,0,ts.formatDiagnostics(diagnostics,{
      getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n',
    }));
    const internal = {schemaVersion:'2.1.0',modules:[{path:'main.js',source:source.fileName,declarations}]};
    const manifest = {schemaVersion:'2.1.0',modules:[]};
    const validate = (options = {}) => validateGeneratedManifest(
      options.manifest ?? manifest, internal, options.checker ?? checker,
      options.sources ?? [source], {invariants:'error',exportTypes:'error'},
      options.program ?? program,
    );
    return run({validate,program,checker,source,root});
  } finally {rmSync(root,{recursive:true,force:true});}
}
const component = (members = [], extras = {}) => [{kind:'class',name:'Example',members:members.map(name=>typeof name==='string'?{name}:name),...extras}];
function rejectTypes(validate, names) {
  assert.throws(validate, error => {
    assert(error instanceof ManifestValidationError);
    assert(error.failures.every(f=>f.rule==='manifest.exportTypes' && f.severity==='error'));
    const text=error.failures.map(f=>f.message).join('\n');
    for (const name of names) assert(text.includes(`unexported type "${name}"`),text);
    return true;
  });
}
function pass(code,declarations=[],additional={}) { fixture(code,declarations,additional,({validate})=>assert.deepEqual(validate(),[])); }
function fail(code,declarations,names,additional={}) {fixture(code,declarations,additional,({validate})=>rejectTypes(validate,names));}

test('compiler-owned default libraries pass under the aliased TypeScript installation',()=>{
  fixture('export class Example { document!: Document; selection!: Selection; record!: Record<string, HTMLElement>; }',
    component(['document','selection','record']),{},({validate,program})=>{
      const libs=program.getSourceFiles().filter(source=>program.isSourceFileDefaultLibrary(source));
      assert(libs.length>0);
      assert(libs.some(source=>source.fileName.includes('/@typescript/old/')));
      assert.deepEqual(validate(),[]);
    });
});
for (const name of ['Event','Promise','Map']) test(`local ${name} primitive alias is not exempted by its spelling`,()=>{
  fail(`type ${name} = string; export class Example { value!: ${name}; }`,component(['value']),[name]);
});
test('local Record interface cannot borrow standard-library identity',()=>{
  fail('interface Record { id:string } export class Example { value!: Record; }',component(['value']),['Record']);
});
test('private, protected, ECMAScript private and @internal members do not expose local types',()=>{
  const members=component([{name:'a',privacy:'private'},{name:'b',privacy:'protected'},{name:'#c',privacy:'private'},'hidden','visible']);
  const inline='type Hidden={id:string}; export class Example { private a!:Hidden; protected b!:Hidden; #c!:Hidden; /** @internal */ hidden!:Hidden; public visible!:Document; }';
  fixture(inline,members,{},({validate,source})=>{
    const node=source.statements.find(ts.isClassDeclaration).members.find(member=>member.name?.getText()==='hidden');
    assert(!ts.getJSDocTags(node).some(tag=>tag.tagName.text==='internal'),'Inline trailing comment must not be treated as attached JSDoc');
    rejectTypes(validate,['Hidden']);
  });
  fixture(`type Hidden={id:string};
    export class Example {
      private a!:Hidden;
      protected b!:Hidden;
      #c!:Hidden;
      /** @internal */
      hidden!:Hidden;
      public visible!:Document;
    }`,members,{},({validate,source})=>{
      const node=source.statements.find(ts.isClassDeclaration).members.find(member=>member.name?.getText()==='hidden');
      assert(ts.getJSDocTags(node).some(tag=>tag.tagName.text==='internal'),'Fixture requires attached @internal JSDoc');
      assert.deepEqual(validate(),[]);
    });
});
test('public local reference remains an error beside private uses',()=>{
  fail('interface Hidden {id:string} export class Example { private a!:Hidden; visible!:Hidden; }',
    component([{name:'a',privacy:'private'},'visible']),['Hidden']);
});
test('renamed export list aliases resolve to the same symbol',()=>{
  pass('type Hidden={id:string}; export type {Hidden as Public}; export class Example { value!:Hidden; }',component(['value']));
});
test('an unrelated same-named re-export cannot satisfy declaration identity',()=>{
  fail('interface Hidden {local:string} export {Hidden} from "./other.js"; export class Example {value!:Hidden}',
    component(['value']),['Hidden'],{'other.ts':'export interface Hidden {unrelated:number}'});
});
test('actual ProseMirror export-list declarations and inferred Selection pass',()=>{
  pass(`import type {EditorState,SelectionBookmark,Command,Transaction} from 'prosemirror-state';
    import type {EditorView,DecorationSet} from 'prosemirror-view';
    export class Example {
      state!:EditorState; bookmark!:SelectionBookmark; command!:Command;
      transaction!:Transaction; view!:EditorView; decorations!:DecorationSet;
      selection(){return this.state.selection;}
    }`,component(['state','bookmark','command','transaction','view','decorations','selection']));
});
const hiddenSelectionDependency={'dependency.ts':'class Selection {private brand!:void; anchor=0;} export function createSelection(){return new Selection();}'};
test('inferred hidden Selection cannot resolve to the unrelated DOM Selection',()=>{
  fail('import {createSelection} from "./dependency.js"; export class Example {selection(){return createSelection();}}',
    component(['selection']),['Selection'],hiddenSelectionDependency);
});
test('inferred CustomEvent detail retains hidden Selection identity',()=>{
  fail('import {createSelection} from "./dependency.js"; export class Example extends EventTarget { fire(){this.dispatchEvent(new CustomEvent("selection-change",{detail:createSelection()}));}}',
    component(['fire'],{events:[{name:'selection-change',type:'CustomEvent',detail:'Selection'}]}),['Selection'],hiddenSelectionDependency);
});
test('exported function Subscriber is checked without any CEM class',()=>{
  fail('type Subscriber=(value:string)=>void; export function observeIdReference(subscriber:Subscriber):void {}',[],['Subscriber']);
});
test('exported arrow-variable Subscriber is checked before supplementation',()=>{
  fail('type Subscriber=(value:string)=>void; export const observeIdReference=(subscriber:Subscriber):void=>{};',[],['Subscriber']);
});
test('public constructor traverses exported options into callback aliases',()=>{
  fail(`type PopupPresentation='popup'|'inline'; type SuspensionReason='hidden'|'detached';
    export interface PositionOptions {presented(state:PopupPresentation,reason:SuspensionReason):void;}
    export class Example {constructor(private options:PositionOptions){}}`,component(),['PopupPresentation','SuspensionReason']);
});
test('SpaceState in a public callable method remains an error',()=>{
  fail('type SpaceState={width:number}; export class Example {update(state:SpaceState):void{}}',component(['update']),['SpaceState']);
});
test('PickerHost and PickerOptions in public constructor parameters remain errors',()=>{
  fail('interface PickerHost {host:HTMLElement}; interface PickerOptions {value:string}; export class Example {constructor(private host:PickerHost,private options:PickerOptions){}}',
    component(),['PickerHost','PickerOptions']);
});
test('private constructor parameters do not create a public callable contract',()=>{
  pass('interface Hidden {id:string}; export class Example {private constructor(value:Hidden){}}',component());
});
test('public setter annotations are validated independently of getter inference',()=>{
  fail('type Hidden=string; export class Example {get value():string{return "";} set value(input:Hidden){}}',component(['value']),['Hidden']);
});
test('public inherited member keeps the base declaration symbol',()=>{
  fail('interface Hidden {id:string}; export class Base {value!:Hidden}; export class Example extends Base {}',
    component([{name:'value',inheritedFrom:{name:'Base',module:'main.js'}}]),['Hidden']);
});
test('local exported aliases cannot conceal a primitive unexported alias',()=>{
  fail('type Hidden=string; export type Public=Hidden; export class Example {value!:Public}',component(['value']),['Hidden']);
});
test('call, construct and index signatures retain referenced local types',()=>{
  fail(`type CallHidden={call:string}; type ConstructHidden={construct:string}; type IndexHidden={index:string};
    export interface Callable {(input:CallHidden):void}
    export interface Factory {new(input:ConstructHidden):{ok:boolean}}
    export interface Dictionary {[key:string]:IndexHidden}
    export class Example {callable!:Callable; factory!:Factory; dictionary!:Dictionary}`,component(['callable','factory','dictionary']),['CallHidden','ConstructHidden','IndexHidden']);
});
test('authored import-type event resolves against actual declaring-module exports',()=>{
  pass('/** @fires {import("./events.js").PublicEvent} changed */ export class Example {}',
    component([],{events:[{name:'changed',type:'import("./events.js").PublicEvent'}]}),
    {'events.ts':'type HiddenName=CustomEvent<string>; export type {HiddenName as PublicEvent};'});
});
test('authored local event detail is not masked by CustomEvent library identity',()=>{
  const declarations=component([],{events:[{name:'changed',type:'CustomEvent',detail:'Hidden'}]});
  fixture('type Hidden={id:string}; /** @fires {CustomEvent<Hidden>} changed */ export class Example {}',declarations,{},({validate,source})=>{
    const node=source.statements.find(ts.isClassDeclaration);
    assert(!ts.getJSDocTags(node).some(tag=>tag.tagName.text==='fires'),'Inline trailing comment must not manufacture an event origin');
    assert.throws(validate,error=>error instanceof ManifestValidationError && error.failures.some(f=>f.message.includes('No verifiable authored or inferred event type')));
  });
  fixture(`type Hidden={id:string};
    /** @fires {CustomEvent<Hidden>} changed */
    export class Example {}`,declarations,{},({validate,source})=>{
      const node=source.statements.find(ts.isClassDeclaration);
      assert(ts.getJSDocTags(node).some(tag=>tag.tagName.text==='fires'),'Fixture requires attached @fires JSDoc');
      rejectTypes(validate,['Hidden']);
    });
});
test('unverifiable public member provenance fails closed',()=>{
  fixture('export class Example {}',component(['missing']),{},({validate})=>{
    assert.throws(validate,error=>error instanceof ManifestValidationError && error.failures.some(f=>f.message.includes('No source member origin')));
  });
});
test('Program/checker identity mismatch is rejected',()=>{
  fixture('export class Example {}',component(),{},({validate,root})=>{
    const foreign=ts.createProgram([join(root,'main.ts')],{});
    assert.throws(()=>validate({checker:foreign.getTypeChecker()}),/originating TypeScript Program/);
  });
});
test('unowned source is rejected even when its filename matches',()=>{
  fixture('export class Example {}',component(),{},({validate,source})=>{
    const foreign=ts.createSourceFile(source.fileName,source.text,ts.ScriptTarget.Latest,true);
    assert.throws(()=>validate({sources:[foreign]}),/outside its TypeScript Program/);
  });
});
test('manifest invariants still reject dangling exports',()=>{
  fixture('export class Example {}',component(),{},({validate})=>{
    const manifest={schemaVersion:'2.1.0',modules:[{kind:'javascript-module',path:'main.js',exports:[{kind:'js',name:'Missing',declaration:{module:'main.js',name:'Missing'}}]}]};
    assert.throws(()=>validate({manifest}),error=>error instanceof ManifestValidationError && error.failures.some(f=>f.rule==='manifest.invariants'));
  });
});

test('explicit exports make the six callable-reference cases valid',()=>{
  pass(`export type Subscriber=(value:Element|null)=>void;
    export function observeIdReference(subscriber:Subscriber):void{}
    export type PopupPresentation='pending'|'visible'|'suspended';
    export type SuspensionReason='no-room'|'offscreen'|'unmeasured';
    export type SpaceState='clear'|'pending'|'no-room';
    export interface PositionOptions {presented(state:PopupPresentation,reason?:SuspensionReason):void;}
    export interface SpaceFeedbackOptions {region():HTMLElement|null;}
    export type PickerHost=HTMLElement & {for:string};
    export interface PickerOptions {disabled():boolean;activate():void;}
    export class Example {
      constructor(private position:PositionOptions,private space:SpaceFeedbackOptions,host:PickerHost,picker:PickerOptions){}
      update(state:SpaceState):void{}
    }`,component(['update']));
});
test('attribute uses its owning source field type',()=>{
  fail('interface Hidden {id:string}; export class Example {value!:Hidden}',
    component([],{attributes:[{name:'value',fieldName:'value',type:'Hidden'}]}),['Hidden']);
});
test('typed attribute without a source field fails closed',()=>{
  fixture('export class Example {}',component([],{attributes:[{name:'value',type:'string'}]}),{},({validate})=>{
    assert.throws(validate,error=>error instanceof ManifestValidationError && error.failures.some(f=>f.message.includes('No source field origin')));
  });
});
test('inherited authored event uses the base class scope',()=>{
  pass('/** @fires {CustomEvent<string>} changed */ export class Base {}; export class Example extends Base {}',[
    {kind:'class',name:'Base',members:[]},
    ...component([],{events:[{name:'changed',inheritedFrom:{module:'main.js',name:'Base'}}]}),
  ]);
});

test('unexposed overload implementation types do not leak into callable validation',()=>{
  pass(`interface Hidden {id:string};
    export function convert(value:string):string;
    export function convert(value:string|Hidden):string|Hidden{return value;}
    export class Example {
      convert(value:string):string;
      convert(value:string|Hidden):string|Hidden{return value;}
    }`,component(['convert']));
});


test('public attribute validates its private backing field contract',()=>{
  const declarations=component([{name:'value',privacy:'private'}],{attributes:[{name:'value',fieldName:'value',type:'Hidden'}]});
  fail('type Hidden=string; export class Example {private value!:Hidden}',declarations,['Hidden']);
  pass('export type Hidden=string; export class Example {private value!:Hidden}',declarations);
  pass('type Hidden=string; export class Example {private value!:Hidden}',component([{name:'value',privacy:'private'}]));
});
test('authored public attribute binds local aliases even beside a private primitive field',()=>{
  const declarations=component([],{attributes:[{name:'value',fieldName:'value',type:'Hidden'}]});
  fail(`type Hidden=string;
    /** @attr {Hidden} value */
    export class Example {private value!:string}`,declarations,['Hidden']);
  pass(`export type Hidden=string;
    /** @attr {Hidden} value */
    export class Example {private value!:string}`,declarations);
});
test('authored attribute without a backing field requires a verifiable source contract',()=>{
  const declarations=component([],{attributes:[{name:'value',type:'Hidden'}]});
  fail(`type Hidden=string;
    /** @attribute {Hidden} value */
    export class Example {}`,declarations,['Hidden']);
  pass(`export type Hidden=string;
    /** @attribute {Hidden} value */
    export class Example {}`,declarations);
  pass('/** @attr {string} value */ export class Example {}',component([],{attributes:[{name:'value',type:'string'}]}));
});
test('exported function explicit this parameter retains its type contract',()=>{
  fail('interface Hidden {id:string}; export function use(this:Hidden):void{}',[],['Hidden']);
  pass('export interface Hidden {id:string}; export function use(this:Hidden):void{}');
  fail('type Hidden=string; export function use(this:Hidden):void{}',[],['Hidden']);
});
test('nested callback explicit this parameter retains its type contract',()=>{
  fail('interface Hidden {id:string}; export interface Options {callback(this:Hidden):void}; export const use=(options:Options):void=>{};',[],['Hidden']);
  pass('export interface Hidden {id:string}; export interface Options {callback(this:Hidden):void}; export const use=(options:Options):void=>{};');
});


test('exported namespace type identity follows the enclosing export chain',()=>{
  pass('export namespace Public {export namespace Nested {export class Value {text=""}}} export class Example {value!:Public.Nested.Value}',component(['value']));
});
test('an unexported enclosing namespace cannot expose its nested class',()=>{
  fail('namespace Private {export class Value {text=""}} export class Example {value!:Private.Value}',component(['value']),['Value']);
});
test('an exported namespace factory cannot conceal an unexported nested class',()=>{
  fail('export namespace Public {class Hidden {text=""} export function create(){return new Hidden}} export class Example {value=Public.create()}',component(['value']),['Hidden']);
});
test('actual Signal namespace exported Computed retains its identity',()=>{
  pass('import {Signal} from "signal-polyfill"; export function create(){return new Signal.Computed(()=>1)}');
});
test('inherited external class internals stay opaque while own hidden types remain errors',()=>{
  const dependency={'dependency.ts':'type PrivateProperties=Map<string,string>; export class Base {static properties:PrivateProperties=new Map()} class Hidden {text=""} export function create(){return new Hidden}'};
  pass('import {LitElement} from "lit"; export class Example extends LitElement {} export const definition={elementClass:Example}',component());
  fail('import {Base} from "./dependency.js"; export class Example extends Base {} export const definition={elementClass:Example}',component(),['PrivateProperties'],dependency);
  fail('import {Base,create} from "./dependency.js"; export class Example extends Base {value=create()} export const definition={elementClass:Example}',component(['value']),['Hidden'],dependency);
});
test('inherited external class boundary retains local heritage type argument checks',()=>{
  fail('import {Base} from "./dependency.js"; type Hidden={text:string}; export class Example extends Base<Hidden> {} export const definition={elementClass:Example}',component(),['Hidden'],{'dependency.ts':'export class Base<T> {value!:T}'});
});


test('direct class validation retains local heritage type arguments',()=>{
  fail('import {Base} from "./dependency.js"; type Hidden={text:string}; export class Example extends Base<Hidden> {}',component(),['Hidden'],{'dependency.ts':'export class Base<T> {value!:T}'});
});
test('selected local base members remain subject to strict hidden-type validation',()=>{
  fail('interface Hidden {text:string}; export class Base {value!:Hidden} export class Example extends Base {} export const definition={elementClass:Example}',component(),['Hidden']);
});


test('local base implicit generic defaults remain subject to strict validation',()=>{
  fail('type Hidden={text:string}; export class Base<T=Hidden> {value!:T} export class Example extends Base {}',component(),['Hidden']);
  fail('import {Base} from "./dependency.js"; export class Example extends Base {}',component(),['Hidden'],{'dependency.ts':'type Hidden={text:string}; export class Base<T=Hidden> {value!:T}'});
});


test('computed external base retains inferred hidden type arguments',()=>{
  fail('type Hidden={text:string}; function makeBase(){return Map<string,Hidden>}; export class Example extends makeBase() {}',component(),['Hidden']);
  fail('type Hidden={text:string}; const Alias=Map<string,Hidden>; export class Example extends Alias {}',component(),['Hidden']);
});


test('external ancestor provenance crosses local generic intermediate bases',()=>{
  pass('import {LitElement} from "lit"; export class Base<T={}> extends LitElement {}; export class Example extends Base<{}> {} export const definition={elementClass:Example}',component());
  fail('import {LitElement} from "lit"; interface Hidden {text:string}; export class Base<T={}> extends LitElement {value!:Hidden}; export class Example extends Base<{}> {} export const definition={elementClass:Example}',component(),['Hidden']);
});
