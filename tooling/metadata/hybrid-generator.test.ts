import test from 'node:test';
import {createHash} from 'node:crypto';
import {portableConstructorProofs} from './portable-constructor-proofs.ts';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm, symlink, readdir,realpath} from 'node:fs/promises';
import {join, dirname, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {generateCandidateCem, verifyCandidateReceipt, verifyCandidateComposition} from './generate-wc-toolkit.ts';
import {ts} from './compiler-api.mjs';
import {generateElements, verifyGeneratedElements} from './generate-elements.ts';
import {readConstructorComposition} from './constructor-composition-contract.ts';

const base = `export type Ctor = new (...args:any[]) => object;
export class Base {base=true;}
export function M<T extends Ctor>(Parent:T){return class Mixed extends Parent {mixed=2;};}
export class Leaf extends M(Base) {own=true;}
`;
async function fixture(files: Record<string,string>, run: (f: any) => unknown, lit = false) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cem-hybrid-generator-')));
  try {
    const dependencies = resolve(import.meta.dirname, '../../node_modules');
    await mkdir(join(root, 'node_modules'));
    for (const name of await readdir(dependencies)) await symlink(join(dependencies, name), join(root, 'node_modules', name));
    for (const [name, text] of Object.entries(files)) {await mkdir(dirname(join(root, name)), {recursive: true}); await writeFile(join(root, name), text);}
    const options = {sourceRoot: root, sources: Object.keys(files), lit};
    const generate = async () => {
      const program = ts.createProgram(options.sources.map(source => join(root, source)), {
        target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true, skipLibCheck: true, noEmit: true,
      });
      for (const path of options.sources) {
        const source = program.getSourceFile(join(root, path))!;
        const diagnostics = [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)];
        assert.deepEqual(diagnostics.map((item: any) => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [], path+' fixture must reach its intended producer check');
      }
      return generateCandidateCem(options);
    };
    await run({root, options, generate, write: (name: string, text: string) => writeFile(join(root, name), text)});
  } finally {await rm(root, {recursive: true, force: true});}
}
const row = (result: any, name: string, path = 'main.ts') => result.manifest.modules.find((module: any) => module.path === path).declarations.find((declaration: any) => declaration.name === name);
const definitions = (result: any, path = 'main.ts') => result.manifest.modules.find((module: any) => module.path === path).exports.filter((edge: any) => edge.kind === 'custom-element-definition');

const ordinary = `export class Ordinary<T=string> {
 value!:T;
 map<U>(value:U):U{return value;}
 echo(value:string):string; echo(value:number):number;
 echo(value:string|number):string|number{return value;}
}
`;
test('real producer preserves ordinary generic and overload metadata in mixed same-file input', async () => {
  let direct: any;
  await fixture({'main.ts': ordinary}, async f => {direct = row(await f.generate(), 'Ordinary');});
  await fixture({'main.ts': ordinary+base}, async f => {
    const result = await f.generate();
    assert.deepEqual(row(result, 'Ordinary'), direct);
    assert.equal(row(result, 'Base')['x-en-constructor-composition'], undefined);
    assert.equal(readConstructorComposition(row(result, 'Leaf'), 'main.ts')?.version, 2);
    assert.equal(row(result, 'M').kind, 'mixin');
    assert.ok(row(result, 'Leaf').members.some((member: any) => member.name === 'mixed'));
    assert.equal(result.receipt.constructorComposition.route, 'exact-declaration-hybrid');
    await verifyCandidateReceipt(result.manifest, result.receipt, f.options);
  });
});

test('separate same-name modules and a returned same-name class cannot overwrite an ordinary row', async () => fixture({
  'main.ts': base.replace('class Mixed extends Parent', 'class Ordinary extends Parent')+ordinary,
  'other.ts': 'export class Ordinary {different=true;}',
}, async f => {
  const result = await f.generate();
  assert.ok(row(result, 'Ordinary').members.some((member: any) => member.name === 'map'));
  assert.ok(row(result, 'Ordinary', 'other.ts').members.some((member: any) => member.name === 'different'));
  assert.deepEqual(row(result, 'M').members.map((member: any) => member.name), ['mixed']);
}));

test('ordinary tagged exports and conditional third-argument registrations retain exact producer edges', async () => {
  const source = `/** @tag x-ordinary */
export class Ordinary extends HTMLElement {}
if(!customElements.get('x-ordinary'))customElements.define('x-ordinary',Ordinary,{extends:'div'});
else customElements.define('x-ordinary',Ordinary,{extends:'div'});
`;
  let direct: any;
  await fixture({'main.ts': source}, async f => {direct = definitions(await f.generate());});
  await fixture({'main.ts': source+base}, async f => assert.deepEqual(definitions(await f.generate()), direct));
});

test('ordinary imported registrations retain the original module export set', async () => {
  const source = '/** @tag x-ordinary */\nexport class Ordinary extends HTMLElement {}';
  const registration = "import {Ordinary} from './main.js'; if(!customElements.get('x-ordinary'))customElements.define('x-ordinary',Ordinary);";
  let direct: any;
  await fixture({'main.ts': source, 'register.ts': registration}, async f => {direct = await f.generate();});
  await fixture({'main.ts': source+base, 'register.ts': registration}, async f => {
    const result = await f.generate();
    assert.deepEqual(definitions(result), definitions(direct));
    assert.deepEqual(definitions(result, 'register.ts'), definitions(direct, 'register.ts'));
  });
});

for (const variant of ['const', 'import', 'namespace']) test('ordinary '+variant+' registration aliases cannot hide a collision with a callable registration', async () => {
  const main = base.replace('export class Base {', 'export class Base extends HTMLElement {')+'\nexport class Ordinary extends HTMLElement {}\n';
  const files: Record<string,string> = variant === 'const' ? {'main.ts': main+"const Alias=Ordinary; customElements.define('x-collision',Alias); customElements.define('x-collision',Leaf);"} : {
    'main.ts': main,
    'registration.ts': variant === 'import'
      ? "import {Ordinary as Alias,Leaf} from './main.js'; customElements.define('x-collision',Leaf);customElements.define('x-collision',Alias);"
      : "import * as Subject from './main.js'; customElements.define('x-collision',Subject.Ordinary);customElements.define('x-collision',Subject.Leaf);",
  };
  await fixture(files, async f => assert.rejects(f.generate, /Duplicate registry definition/));
});

test('a callable registry remains strict in a mixed module', async () => fixture({'main.ts': base.replace('export class Base {', 'export class Base extends HTMLElement {')+"if(!customElements.get('x-leaf'))customElements.define('x-leaf',Leaf);"},
  async f => assert.rejects(f.generate, /unconditional module-level/)));

test('mixed module ordinary hidden public types still fail merged strict validation', async () => fixture({'main.ts': base+'\ninterface Hidden {secret:string;}\nexport function ordinary(value:Hidden):Hidden{return value;}'},
  async f => assert.rejects(f.generate, (error: any) => error.failures?.some((failure: any) => /Hidden/.test(failure.message)))));

test('mixed inherited hidden source annotations cannot be erased by safe final fields', async () => fixture({'main.ts': base.replace('export class Base {base=true;}', 'type Hidden=number; export class Base {base=true; mixed!:Hidden;}')},
  async f => assert.rejects(f.generate, (error: any) => error.failures?.some((failure: any) => /Hidden/.test(failure.message)))));

test('unsupported callable shapes reject instead of falling back to ordinary generation', async () => fixture({'main.ts': base.replace('(Parent:T)', '(Parent:T, count:number)').replace('M(Base)', 'M(Base, 2)')},
  async f => assert.rejects(f.generate, /CEM_UNSUPPORTED_MIXIN/)));

test('ordinary Lit classes remain identical when a native callable cohort shares their file', async () => {
  const source = `import {LitElement,html} from 'lit';
/** @tag x-ordinary */
export class Ordinary extends LitElement {
 static properties={label:{type:String},localState:{state:true}};
 label='ready'; localState='internal';
 render(){return html\`<span part="label">\${this.label}</span>\`;}
}
`;
  let direct: any;
  await fixture({'main.ts': source}, async f => {direct = row(await f.generate(), 'Ordinary');}, true);
  await fixture({'main.ts': source+base}, async f => assert.deepEqual(row(await f.generate(), 'Ordinary'), direct), true);
});

test('callable receipt proof identity survives relocation with inherited imported types', async () => {
  const files = {
    'types.ts': 'export interface Payload {value:string;}\nexport function makePayload():Payload{return {value:"a"};}\nexport function isPayload(value:unknown):value is Payload{return typeof value === "object" && value !== null && "value" in value;}',
    'base.ts': "import {makePayload,isPayload} from './types.js';\n"+'export class Base {payload=makePayload(); isPayload(value:unknown){return isPayload(value);} authoredPath:"/authored/example/path"="/authored/example/path";}',
    'main.ts': "import {Base} from './base.js';\n"+base.replace('export class Base {base=true;}', ''),
  };
  const generated: any[] = [], roots: string[] = [];
  for (let index=0; index<2; index++) await fixture(files, async f => {
    const result = await f.generate(); generated.push(result); roots.push(f.root);
    assert.ok(result.localEvidence.constructorProofs.types.some((proof:any) => [proof.input,proof.emitted].some((text:string) => text.includes('import('))), 'actual producer must exercise cross-module imported type projection');
    const authored = result.receipt.constructorComposition.proofs.facets.filter((entry: any) => entry.metadata?.name === 'authoredPath');
    assert.ok(authored.length);
    for (const entry of authored) assert.equal(entry.metadata.type, '"/authored/example/path"');
    assert.equal(JSON.stringify(result.receipt.constructorComposition).includes(f.root), false);
    await verifyCandidateReceipt(result.manifest, result.receipt, f.options);
  });
  assert.notEqual(roots[0], roots[1]);
  assert.deepEqual(generated[0].manifest, generated[1].manifest);
  assert.deepEqual(generated[0].receipt.constructorComposition, generated[1].receipt.constructorComposition);
});

test('component and factory bodies never execute during mixed extraction', async () => fixture({'main.ts': base.replace('export class Leaf extends M(Base) {own=true;}', "export class Leaf extends M(Base) {own=true; static {throw new Error('must not execute');}}")+"throw new Error('must not import');"}, async f => {
  const result = await f.generate(); assert.equal(row(result, 'Leaf').name, 'Leaf');
}));

for (const method of [
  'isReady():this is this & {ready:true}{return true;}',
  'isString(value:unknown):value is string{return typeof value === "string";}',
  'assertReady():asserts this is this & {ready:true}{}',
  'assertString(value:unknown):asserts value is string{if(typeof value !== "string")throw new Error();}',
]) test('mixed producer preserves return contract '+method.split('(')[0], async () => fixture({
  'main.ts': base.replace('mixed=2;', 'mixed=2; '+method),
}, async f => {
  const result = await f.generate(), name = method.split('(')[0];
  const member = row(result,'Leaf').members.find((entry:any) => entry.name === name);
  const proof = result.receipt.constructorComposition.proofs.facets.find((entry:any) => entry.declaration === 'Leaf' && entry.metadata.name === name);
  const expectedAssert = name.startsWith('assert'), expectedThis = name.endsWith('Ready');
  for (const [text, receiver] of [[proof.metadata.return.type,'this'],[member.return.type.text,'Leaf']]) {
    const syntax = ts.createSourceFile('return.ts', 'declare function contract(value:unknown): '+text+';', ts.ScriptTarget.Latest, true);
    assert.equal(syntax.parseDiagnostics.length,0);
    const predicate = syntax.statements[0].type;
    assert.ok(ts.isTypePredicateNode(predicate));
    assert.equal(Boolean(predicate.assertsModifier),expectedAssert);
    assert.equal(predicate.parameterName.kind,expectedThis ? ts.SyntaxKind.ThisType : ts.SyntaxKind.Identifier);
    if (!expectedThis) {assert.equal(predicate.parameterName.text,'value');assert.equal(predicate.type.kind,ts.SyntaxKind.StringKeyword);}
    else {
      assert.ok(ts.isIntersectionTypeNode(predicate.type));assert.equal(predicate.type.types.length,2);
      assert.equal(predicate.type.types[0].getText(syntax),receiver);
      const refinement = predicate.type.types[1];assert.ok(ts.isTypeLiteralNode(refinement));assert.equal(refinement.members.length,1);
      const ready = refinement.members[0];assert.equal(ready.name.text,'ready');assert.equal(ready.questionToken,undefined);
      assert.ok(ts.isLiteralTypeNode(ready.type));assert.equal(ready.type.literal.kind,ts.SyntaxKind.TrueKeyword);
    }
  }
}));

test('fresh extraction binds portable composition receipt presence and every proof field', async () => fixture({'main.ts':base}, async f => {
  const original = await f.generate(), fresh = await f.generate();
  assert.deepEqual(JSON.parse(JSON.stringify(original.receipt.constructorComposition)), original.receipt.constructorComposition);
  verifyCandidateComposition(original.receipt, fresh.receipt);
  const absent = structuredClone(original.receipt); delete absent.constructorComposition;
  assert.throws(() => verifyCandidateComposition(absent, fresh.receipt), /constructor composition proof changed/);
  assert.throws(() => verifyCandidateComposition(original.receipt, absent), /constructor composition proof changed/);
  for (const mutate of [
    (proof:any) => {proof.route='ordinary';},
    (proof:any) => {proof.proofs.facets[0].metadataSha256='0'.repeat(64);},
    (proof:any) => {proof.proofs.facets[0].origin.file.path='wrong.ts';},
  ]) {
    const altered = structuredClone(original.receipt); mutate(altered.constructorComposition);
    assert.throws(() => verifyCandidateComposition(altered, fresh.receipt), /constructor composition proof changed/);
  }
  verifyCandidateComposition(absent, absent);
}));

test('maintained retained check rejects inserted composition evidence on ordinary sources', async () => fixture({
  'src/main.ts': '/** @tag x-ordinary */ export class Ordinary extends HTMLElement {}',
  'src/catalog.ts': "import {Ordinary} from './main.js'; export const definitions=[{tagName:'x-ordinary',elementClass:Ordinary}] as const;",
}, async f => {
  const {manifest,receipt} = await generateElements(f.root,{checkTagTypes:false});
  assert.equal(Object.hasOwn(receipt,'constructorComposition'),false);
  await f.write('custom-elements.json',JSON.stringify(manifest));
  await f.write('custom-elements.json.receipt.json',JSON.stringify(receipt));
  await verifyGeneratedElements(f.root);
  const altered = {...receipt,constructorComposition:{version:1,route:'exact-declaration-hybrid',proofs:{}}};
  await f.write('custom-elements.json.receipt.json',JSON.stringify(altered));
  await assert.rejects(() => verifyGeneratedElements(f.root), /constructor composition proof changed/);
}));

test('portable projection normalizes actual compiler absolute imports without an enclosing declaration', async () => {
  const files = {'types.ts':'export interface Payload {value:string;}', 'main.ts':"import type {Payload} from './types.js'; export type Value = Payload;"};
  const results:any[] = [], roots:string[] = [];
  for (let index=0;index<2;index++) await fixture(files, async f => {
    const program = ts.createProgram(Object.keys(files).map(path => join(f.root,path)), {strict:true,skipLibCheck:true,noEmit:true,target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler});
    const sources = Object.keys(files).map(path => program.getSourceFile(join(f.root,path))!);
    const checker = program.getTypeChecker(), target = sources[0], scope = sources[1];
    for (const source of sources) assert.deepEqual([...program.getSyntacticDiagnostics(source),...program.getSemanticDiagnostics(source)],[]);
    const declaration = target.statements[0];assert.ok(ts.isInterfaceDeclaration(declaration));
    const text = checker.typeToString(checker.getTypeAtLocation(declaration.name), undefined, ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseFullyQualifiedType);
    assert.ok(text.includes('import("'+f.root+'/'), 'actual compiler absolute import precondition: '+text);
    const digest = (value:string) => createHash('sha256').update(value).digest('hex');
    const descriptor = {fileName:scope.fileName,sourceSha256:digest(scope.text),kind:scope.kind,start:0,end:scope.end};
    // This intentionally tests only the portable projection boundary. These
    // compiler-owned inputs are not an extraction/serialization certificate.
    const metadata = {name:'authoredPath',type:'"/authored/example/path"'};
    const raw = {types:[{input:text,emitted:text,source:descriptor,output:descriptor,symbols:[]}],facets:[{origin:descriptor,metadata,metadataSha256:digest(JSON.stringify(metadata))}]};
    const projected = portableConstructorProofs(program,sources,f.root,raw);
    const value = projected.types[0].input;
    assert.equal(value.representation,'source-owned-import-tokens');assert.equal(value.imports.length,1);
    assert.deepEqual(value.imports[0].target,{kind:'selected-source',path:'types.ts'});
    assert.equal(value.imports[0].sourceSha256,digest(target.text));
    assert.equal(projected.facets[0].metadata.type,metadata.type);
    assert.equal(JSON.stringify(projected).includes(f.root),false);
    assert.deepEqual(JSON.parse(JSON.stringify(projected)),projected);
    results.push(projected);roots.push(f.root);
  });
  assert.notEqual(roots[0],roots[1]);assert.deepEqual(results[0],results[1]);
});
