// Regression tests for the repository-owned generator patches.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import ts from '@typescript/typescript6';
import {detectClassMembers,discoverFrameworkApis,parseCssMetadata} from '@wc-toolkit/cem-generator';

function extract(code, inspect) {
  const directory=mkdtempSync(join(tmpdir(),'cem-extraction-repro-'));
  try {
    const path=join(directory,'source.ts');writeFileSync(path,code);
    const program=ts.createProgram([path],{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,strict:true,skipLibCheck:true,noEmit:true});
    const source=program.getSourceFile(path),checker=program.getTypeChecker();
    const diagnostics=[...program.getSyntacticDiagnostics(source),...program.getSemanticDiagnostics(source)];
    assert.equal(diagnostics.length,0,ts.formatDiagnostics(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>directory,getNewLine:()=> '\n'}));
    const node=source.statements.find(ts.isClassDeclaration);assert(node);
    inspect?.(node);
    return detectClassMembers(node,{filePath:path,sourceText:code,sourceFile:source,checker,typeParsing:'public'});
  } finally {rmSync(directory,{recursive:true,force:true});}
}

test('unannotated method return text describes its return value',()=>{
  const member=extract('export class Example { value(){ return true; } }').find(member=>member.name==='value');
  assert(member?.return);
  assert.equal(member.return.type,'boolean','A method return must not serialize the callable type () => boolean');
});

test('parsed callable object retains call, construct and index contracts',()=>{
  const member=extract(`type Contract={label:string;(input:number):boolean;new(input:string):Date;[key:symbol]:number};
    export class Example {contract!:Contract;}`).find(member=>member.name==='contract');
  assert.equal(member.type,'Contract');
  assert.equal(typeof member.parsedType,'string');
  assert.doesNotMatch(member.parsedType,/^\s*(any|unknown)\s*$/);
  // Reparse the emitted contract and exercise it through TypeScript. Formatting
  // differences are acceptable; losing a callable or index contract is not.
  extract(`type RoundTrip=${member.parsedType};
    function use(value:RoundTrip){
      const label:string=value.label;
      const called:boolean=value(1);
      const constructed:Date=new value('input');
      const indexed:number=value[Symbol()];
    }
    export class Example {}`);
});


test('callback arrays preserve contracts with optional parsed expansion',()=>{
  const member=extract('type Callback=(value:string)=>number; export class Example {callbacks!:Callback[]}').find(member=>member.name==='callbacks');
  assert.equal(member.type,'Callback[]');
  // The library Array boundary may intentionally retain the authored alias.
  // Both representations must preserve the actual array/callable contract.
  const text=member.parsedType ?? member.type;
  extract(`type Callback=(value:string)=>number; type Expanded=${text};
    const callbacks:Expanded=[(value:string)=>value.length];
    const result:number=callbacks[0]('text');
    const reverse:Array<(value:string)=>number>=callbacks;
    export class Example {}`);
});
test('expanded optional callbacks preserve union precedence',()=>{
  const member=extract('type Callback=(value:string)=>number; export class Example {callback!:Callback|undefined}').find(member=>member.name==='callback');
  assert.equal(typeof member.parsedType,'string');
  extract(`type Expanded=${member.parsedType};
    const empty:Expanded=undefined;
    function use(callback:Expanded){if(callback){const result:number=callback('text');}}
    const value:Expanded=(text:string)=>text.length;
    const reverse:((text:string)=>number)|undefined=value;
    export class Example {}`);
});

test('getter-only fields are readonly while setter pairs and writable fields remain mutable',()=>{
  const members=extract(`export class Example {
    readonly fixed=1; ordinary=2;
    get computed():number{return 3;}
    get value():number{return 4;} set value(input:number){}
    set reverse(input:number){} get reverse():number{return 5;}
  }`);
  for(const name of ['fixed','computed']) assert.equal(members.find(member=>member.name===name).readonly,true,name);
  for(const name of ['ordinary','value','reverse']) assert.equal(members.find(member=>member.name===name).readonly,undefined,name);
  assert.ok(members.every(member=>member.privacy==='public'));
});

test('accessor getter default and deprecation survive either setter order',()=>{
  for(const setterFirst of [false,true]){
    const getter='/** @default medium\n * @deprecated Use replacement.\n */ get size():string{return "medium";}';
    const setter='set size(input:string){}';
    const ordered=setterFirst ? [setter,getter] : [getter,setter];
    const member=extract(`export class Example {\n${ordered.join('\n')}\n}`,node=>{
      const getterNode=node.members.find(ts.isGetAccessorDeclaration);
      assert.deepEqual(ts.getJSDocTags(getterNode).map(tag=>[tag.tagName.text,tag.comment]),
        [['default','medium'],['deprecated','Use replacement.']], 'Fixture docs must attach to the getter before extraction');
    }).find(member=>member.name==='size');
    assert.equal(member.default,'medium',`setterFirst=${setterFirst}`);assert.equal(member.deprecated,'Use replacement.');
    assert.equal(member.type,'string');assert.equal(member.readonly,undefined);
  }
});

test('constructor defaults retain own declarations and inherited assignments without executing bodies',()=>{
  const members=extract(`export class Example extends Error {
    readonly stage:string;value=1;
    /** @default 4 */
    documented=1;
    /** @internal */
    hidden='internal';
    conditional:number|undefined;
    constructor(stage:string){super();this.name='CustomError';this.stage=stage;this.value=2;this.documented=3;this.hidden='changed';if(stage)this.conditional=9;}
  }`);
  assert.equal(members.find(member=>member.name==='name').default,"'CustomError'");
  assert.equal(members.find(member=>member.name==='name').type,'string');
  assert.equal(members.find(member=>member.name==='stage').default,'stage');
  assert.equal(members.find(member=>member.name==='stage').readonly,true);
  assert.equal(members.find(member=>member.name==='value').default,'2');
  assert.equal(members.find(member=>member.name==='documented').default,'4');
  assert.equal(members.find(member=>member.name==='conditional').default,undefined);
  assert.ok(!members.some(member=>member.name==='hidden'));
});

test('slot discovery distinguishes static names from unresolved template and JSX names',()=>{
  const cases=[
    ['const view=html`<slot></slot><slot name=""></slot>`',['']],
    ['const view=html`<slot data-name="wrong"></slot>`',['']],
    ['const view=html`<slot title=" name=\'fake\'"></slot>`',['']],
    ['const view=html`<slot title=">" name="label"></slot>`',['label']],
    ['const view=html`<slot class=${value}></slot>`',['']],
    ['const view=html`<slot name=${values.find(value => value.length > 2)}></slot>`',[]],
    ['const view=html`<div title="<slot name=\'fake\'>"></div><!-- <slot name="comment"> -->`',[]],
    ['const view=html`<slot name="label"></slot><slot name=footer></slot>`',['footer','label']],
    ['const view=html`<slot name=${name}></slot><slot name="${name}"></slot><slot ${attributes}></slot>`',[]],
    ['const view=<><slot/><slot name=""/><slot name="label"/><slot name={"footer"}/></>',['','footer','label']],
    ['const view=<><slot name={name}/><slot name/><slot {...attributes}/></>',[]],
  ];
  for(const [code,names] of cases){
    const source=ts.createSourceFile('sample.tsx',code,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
    assert.equal(source.parseDiagnostics.length,0);
    assert.deepEqual((discoverFrameworkApis(source,source).slots??[]).map(slot=>slot.name).sort(),names,code);
  }
});


test('template markup normalization never enters direct or referenced CSS metadata',()=>{
  const directory=mkdtempSync(join(tmpdir(),'cem-css-template-repro-'));
  try {
    const code='export const shared=`:host { /* Dynamic gap */ --gap: "${gap}"; /* Stable gap */ --fixed: 4px; }\n'+
      '/* Registered gap */ @property --registered { syntax: "<length>"; inherits: false; initial-value: "${gap}"; }`;';
    const sharedPath=join(directory,'shared.ts'),rootPath=join(directory,'root.ts');
    writeFileSync(sharedPath,'const gap="8px";\n'+code);
    writeFileSync(rootPath,'import {shared} from "./shared"; export class Example {static styles=[shared];}');
    const program=ts.createProgram([rootPath],{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,strict:true,noEmit:true});
    const sharedSource=program.getSourceFile(sharedPath),rootSource=program.getSourceFile(rootPath);
    assert(sharedSource);assert(rootSource);
    assert.equal(program.getSyntacticDiagnostics().length,0);
    assert.equal(program.getSemanticDiagnostics().length,0);
    let template;
    const visit=node=>{if(ts.isTemplateExpression(node))template=node;ts.forEachChild(node,visit);};
    visit(sharedSource);assert(template);
    const expected=parseCssMetadata(template.getText(sharedSource));
    assert.equal(expected.find(property=>property.name==='--gap').default,'"${gap}"');
    assert.equal(expected.find(property=>property.name==='--fixed').default,'4px');
    assert.equal(expected.find(property=>property.name==='--registered').default,'"${gap}"');
    const direct=discoverFrameworkApis(sharedSource,sharedSource,program.getTypeChecker());
    const referenced=discoverFrameworkApis(rootSource.statements.find(ts.isClassDeclaration),rootSource,program.getTypeChecker());
    for(const result of [direct,referenced]){
      assert.deepEqual(result.cssProperties,expected);
      assert.doesNotMatch(JSON.stringify(result),/\\u0000/);
    }
    const markup=ts.createSourceFile('view.ts','const view=html`<span part="stable ${dynamic}"></span><slot name=${name}></slot>`',ts.ScriptTarget.ESNext,true);
    const apis=discoverFrameworkApis(markup,markup);
    assert.deepEqual(apis.cssParts.map(part=>part.name),['stable']);
    assert.equal(apis.slots,undefined);
  } finally {rmSync(directory,{recursive:true,force:true});}
});


test('optional fields retain undefined across privacy, aliases and callable types',()=>{
  const members=extract(`type Alias=string;type Already=number|undefined;
    export class Example {
      #hidden?:number;protected protectedValue?:string;visible?:Alias;
      callback?:(value:string)=>number;already?:Already;explicit?:string|undefined;
      literal?:'undefined';required!:number;optionalAny?:any;optionalUnknown?:unknown;
    }`);
  const types=new Map(members.map(member=>[member.name,member.type]));
  for(const name of ['#hidden','protectedValue','visible','callback','literal']){
    assert.match(types.get(name),/\| undefined$/);assert.doesNotMatch(types.get(name),/\bany\b/);
  }
  assert.equal(types.get('visible'),'Alias | undefined');
  assert.equal(types.get('already'),'Already');assert.equal(types.get('explicit'),'string|undefined');
  assert.equal(types.get('required'),'number');assert.equal(types.get('optionalAny'),'any');assert.equal(types.get('optionalUnknown'),'unknown');
  extract(`type Callback=${types.get('callback')};const missing:Callback=undefined;
    const present:Callback=(value:string)=>value.length;const result:number=present('test');export class Example {}`);
});
