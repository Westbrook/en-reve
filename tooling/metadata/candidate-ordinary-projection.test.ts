import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, rm, symlink, readdir,realpath} from 'node:fs/promises';
import {dirname, join, resolve, relative} from 'node:path';
import {tmpdir} from 'node:os';
import {ts} from './compiler-api.mjs';
import {constructorCohort} from './candidate-constructor-cohort.ts';
import {bindOrdinaryProjection, assertOrdinaryProjection} from './candidate-ordinary-projection.ts';
import {extractConstructorOrigins} from './candidate-origin-extraction.ts';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';

const mixed = `export type Ctor = new (...args: any[]) => object;
export class Base { base = true; }
export function M<T extends Ctor>(Parent: T) { return class Mixed extends Parent { value = 1; }; }
export class Leaf extends M(Base) { own = true; }
`;
async function fixture(files: Record<string, string>, run: (f: any) => unknown) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cem-ordinary-projection-')));
  try {
    const dependencies = resolve(import.meta.dirname, '../../node_modules');
    await mkdir(join(root, 'node_modules'));
    for (const name of await readdir(dependencies)) await symlink(join(dependencies, name), join(root, 'node_modules', name));
    for (const [name, text] of Object.entries(files)) {await mkdir(dirname(join(root, name)), {recursive: true}); await writeFile(join(root, name), text);}
    const names = Object.keys(files).map(name => join(root, name));
    const makeProgram = () => ts.createProgram(names, {strict: true, noEmit: true, skipLibCheck: true, types: [],
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler});
    const program = makeProgram(); program.getTypeChecker();
    const sources = names.map(name => program.getSourceFile(name)!);
    const diagnostics = sources.flatMap(source => [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)])
      .filter(row => row.category === ts.DiagnosticCategory.Error);
    assert.deepEqual(diagnostics.map(row => ({code: row.code, text: ts.flattenDiagnosticMessageText(row.messageText, '\n')})), [], 'Fixture reaches the seam with valid selected source');
    const path = (source: any) => relative(root, source.fileName).replaceAll('\\', '/');
    const cohort = constructorCohort(program, sources, path);
    const node = (name: string, file = 'main.ts') => sources.find(source => path(source) === file)!.statements.find((item: any) => ts.isClassDeclaration(item) && item.name?.text === name);
    // These are explicitly caller-owned seam fixtures, not extraction certificates.
    const entries = cohort.ordinary.map(node => ({node, module: path(node.getSourceFile()), declaration: {kind: 'class', name: node.name!.text}}));
    const definitions: any[] = [];
    const row = (name: string, file = 'main.ts') => entries.find(entry => entry.node === node(name, file))!.declaration as any;
    const tag = (name: string, value: string, file = 'main.ts') => {
      Object.assign(row(name, file), {tagName: value, customElement: true});
      definitions.push({node: node(name, file), source: node(name, file).getSourceFile(), edge: {
        kind: 'custom-element-definition', name: value, declaration: {module: file, name}}});
    };
    const bind = () => bindOrdinaryProjection(program, sources, root, cohort, entries, definitions);
    const extract = () => extractConstructorOrigins(program, sources, root, [...cohort.roots], false, bind());
    const serialize = () => serializeConstructorComposition(program, sources, [...cohort.roots], extract());
    await run({root, program, sources, path, cohort, entries, definitions, node, row, tag, bind, extract, serialize, makeProgram});
  } finally {await rm(root, {recursive: true, force: true});}
}
const outputRow = (result: any, name: string, module = 'main.ts') => result.manifest.modules.find((row: any) => row.path === module).declarations.find((row: any) => row.name === name);
const definitionsFor = (result: any, module: string) => result.manifest.modules.find((row: any) => row.path === module).exports.filter((row: any) => row.kind === 'custom-element-definition');

test('ordinary generic and overload contracts survive alongside a callable root without composition markers', async () => fixture({'main.ts': mixed + `
export class Ordinary<T=string> {
 value!:T;
 map<U>(value:U):U{return value;}
 echo(value:string):string; echo(value:number):number;
 echo(value:string|number):string|number{return value;}
}
`}, f => {
  Object.assign(f.row('Base'), {members: [{kind: 'field', name: 'base', type: {text: 'boolean'}}]});
  Object.assign(f.row('Ordinary'), {members: [{kind: 'field', name: 'value', type: {text: 'T'}},
    {kind: 'method', name: 'map', parameters: [{name: 'value', type: {text: 'U'}}], return: {type: {text: 'U'}}},
    {kind: 'method', name: 'echo', parameters: [{name: 'value', type: {text: 'string | number'}}], return: {type: {text: 'string | number'}}}]});
  const result = f.serialize();
  assert.deepEqual(outputRow(result, 'Ordinary'), f.row('Ordinary'));
  assert.deepEqual(outputRow(result, 'Base'), f.row('Base'));
  assert.equal(outputRow(result, 'Base')['x-en-constructor-composition'], undefined);
  assert.equal(outputRow(result, 'Leaf')['x-en-constructor-composition'].version, 2);
  assert.equal(outputRow(result, 'M').kind, 'mixin');
  assert.equal(result.manifest.modules[0].declarations.filter((row: any) => row.name === 'M').length, 1);
  assert.ok(outputRow(result, 'Leaf').members.some((row: any) => row.name === 'base'));
  result.validate();
}));

for (const mode of ['toJSON', 'getter', 'undefined', 'symbol', 'prototype', 'sparse']) test('ordinary JSON admission rejects '+mode+' without running hooks', async () => fixture({'main.ts': mixed}, f => {
  let invoked = 0; const value = f.row('Base');
  if (mode === 'toJSON') value.toJSON = () => {invoked++; return {...value, 'x-en-constructor-composition': {version: 2}};};
  if (mode === 'getter') Object.defineProperty(value, 'members', {enumerable: true, get() {invoked++; return [];}});
  if (mode === 'undefined') value.members = undefined;
  if (mode === 'symbol') value[Symbol('hidden')] = true;
  if (mode === 'prototype') Object.setPrototypeOf(value, {members: []});
  if (mode === 'sparse') value.members = new Array(1);
  assert.throws(f.bind, /Ordinary projection (requires|rejects)/);
  assert.equal(invoked, 0);
}));

for (const mode of ['name', 'span', 'replacement', 'heritage']) test('ordinary binding refuses same-text AST '+mode+' mutation', async () => fixture({'main.ts': mixed+'\nexport class Other extends Base {}'}, f => {
  const packet = f.bind(), node = f.node('Other'), source = node.getSourceFile();
  if (mode === 'name') node.name.escapedText = 'Changed';
  if (mode === 'span') node.end--;
  if (mode === 'replacement') source.statements[source.statements.indexOf(node)] = {...node};
  if (mode === 'heritage') node.heritageClauses[0].types[0].expression.escapedText = 'Leaf';
  assert.throws(() => assertOrdinaryProjection(packet, f.program, f.sources, f.cohort.roots), /parsed structure changed|cohort changed/);
}));

test('ordinary projection requires exact complete class membership and original Program', async () => fixture({'main.ts': mixed}, f => {
  assert.throws(() => bindOrdinaryProjection(f.program, f.sources, f.root, f.cohort, []), /cover every ordinary/);
  assert.throws(() => bindOrdinaryProjection(f.program, f.sources, f.root, f.cohort, [{...f.entries[0], node: {...f.entries[0].node}}]), /unique selected class identity/);
  const packet = f.bind();
  assert.throws(() => assertOrdinaryProjection(packet, f.makeProgram(), f.sources, f.cohort.roots), /different extraction inputs/);
  assert.throws(() => assertOrdinaryProjection({...packet}, f.program, f.sources, f.cohort.roots), /different extraction inputs/);
}));

test('tagged ordinary declarations retain their completed definition export without a registry call', async () => fixture({'main.ts': mixed+'\n/** @tag x-ordinary */\nexport class Ordinary extends HTMLElement {}'}, f => {
  f.tag('Ordinary', 'x-ordinary'); const result = f.serialize();
  assert.deepEqual(definitionsFor(result, 'main.ts'), f.definitions.map((row: any) => row.edge));
}));

test('conditional repeated and third-argument ordinary registrations keep the completed edge set', async () => fixture({'main.ts': mixed+`
export class Ordinary extends HTMLElement {}
if (customElements.get('x-ordinary')) customElements.define('x-ordinary', Ordinary, {extends:'div'});
else customElements.define('x-ordinary', Ordinary, {extends:'div'});
`}, f => {
  f.tag('Ordinary', 'x-ordinary'); const result = f.serialize();
  assert.deepEqual(definitionsFor(result, 'main.ts'), f.definitions.map((row: any) => row.edge));
}));

test('an imported ordinary registration does not invent a second module definition edge', async () => fixture({
  'main.ts': mixed+'\n/** @tag x-ordinary */\nexport class Ordinary extends HTMLElement {}',
  'register.ts': "import {Ordinary} from './main.js'; if(!customElements.get('x-ordinary'))customElements.define('x-ordinary',Ordinary);",
}, f => {
  f.tag('Ordinary', 'x-ordinary'); const result = f.serialize();
  assert.equal(definitionsFor(result, 'main.ts').length, 1);
  assert.deepEqual(definitionsFor(result, 'register.ts'), []);
}));

test('callable registration cannot collide with a projected tag that has no registry call', async () => fixture({'main.ts': mixed.replace('export class Base {','export class Base extends HTMLElement {')+`
/** @tag x-collision */
export class Ordinary extends HTMLElement {}
customElements.define('x-collision', Leaf);
`}, f => {
  f.tag('Ordinary', 'x-collision');
  assert.throws(f.extract, /Duplicate registry/);
}));

test('callable registration remains strict after ordinary routing', async () => fixture({'main.ts': mixed.replace('export class Base {','export class Base extends HTMLElement {')+`
if(!customElements.get('x-leaf'))customElements.define('x-leaf',Leaf);
`}, f => {
  assert.throws(f.extract, /unconditional module-level/);
}));

test('ordinary tag definitions cannot be dropped retargeted or marked as composed', async () => fixture({'main.ts': mixed+'\nexport class Ordinary {}'}, f => {
  Object.assign(f.row('Ordinary'), {tagName: 'x-ordinary', customElement: true});
  assert.throws(f.bind, /no completed producer definition edge/);
  f.tag('Ordinary', 'x-ordinary'); f.definitions[0].edge.declaration.name = 'Base';
  assert.throws(f.bind, /exact projected class target/);
  f.definitions[0].edge.declaration.name = 'Ordinary'; f.row('Base')['x-en-constructor-composition'] = {};
  assert.throws(f.bind, /ordinary class contract/);
}));

test('ordinary public function hidden types remain subject to merged source validation', async () => fixture({'main.ts': mixed+`
interface Hidden {secret:string;}
export function ordinary(value:Hidden):Hidden{return value;}
`}, f => {
  assert.throws(f.serialize, (error: any) => error.failures?.some((row: any) => /Hidden/.test(row.message)));
}));

test('completed ordinary support attributes still validate hidden linked fields in the final view', async () => fixture({'main.ts': mixed.replace('export class Base { base = true; }', `
interface Hidden {secret:string;}
export class Base {base=true; private secret!:Hidden;}
`)}, f => {
  f.row('Base').attributes = [{name: 'secret', fieldName: 'secret', type: {text: 'Hidden'}}];
  const extraction = f.extract();
  assert.doesNotThrow(() => extraction.validate(), 'The own private field is safe before the completed ordinary support row is exposed');
  assert.throws(() => serializeConstructorComposition(f.program, f.sources, [...f.cohort.roots], extraction),
    (error: any) => error.failures?.some((row: any) => /Hidden/.test(row.message)), 'Final projected attribute cannot expose the private hidden type');
}));

test('a safe completed ordinary projection and final override cannot mask a hidden own annotation', async () => fixture({'main.ts': mixed.replace('export class Base { base = true; }', `
type Hidden = number;
export class Base {base=true; value!:Hidden;}
`)}, f => {
  f.row('Base').members = [{kind: 'field', name: 'value', type: {text: 'number'}}];
  const extraction = f.extract();
  assert.throws(() => extraction.validate(), (error: any) => error.failures?.some((row: any) => /Hidden/.test(row.message)),
    'Own source validation retains the hidden alias despite its safe semantic number type');
  assert.throws(() => serializeConstructorComposition(f.program, f.sources, [...f.cohort.roots], extraction),
    (error: any) => error.failures?.some((row: any) => /Hidden/.test(row.message)), 'Projection cannot waive own source validation');
}));
