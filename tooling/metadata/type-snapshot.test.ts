import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateTypeSnapshot, writeTypeSnapshot, verifyTypeSnapshot } from './type-snapshot.ts';
import { diffCem } from '../releases/cem-diff.ts';
import { diffPublicApi, publicTypeContract, validateTypeSnapshot } from '../releases/type-diff.ts';
import { createRelease } from '../releases/release.ts';
import { digestJson } from '../evidence/identity.ts';

const exec = promisify(execFile);
const cem = { schemaVersion: '1.0.0', modules: [{ path: 'src/index.ts', exports: [{ kind: 'js', name: 'DateRange', declaration: { name: 'DateRange', module: './barrel.js' } }] }] };
async function fixture(t: any) {
  const root = await mkdtemp(join(tmpdir(), 'api-types-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/internal'), { recursive: true });
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: '@test/elements', type: 'module', exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' }, './*.js': { types: './dist/*.d.ts', import: './dist/*.js' }, './internal/hidden.js': null } }));
  await writeFile(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, skipLibCheck: true, rootDir: 'src', outDir: 'dist' }, include: ['src/**/*.ts'] }));
  await writeFile(join(root, 'src/index.ts'), "export type { DateRange, Alias, ColorFormat, Node, MapValue } from './barrel.js';\nexport { answer, Control } from './types.js';");
  await writeFile(join(root, 'src/barrel.ts'), "export type { DateRange, DateRange as Alias, ColorFormat, Node, MapValue } from './types.js';");
  await writeFile(join(root, 'src/internal/hidden.ts'), 'export interface Hidden { secret: string }');
  await writeFile(join(root, 'src/types.ts'), source());
  return root;
}
function source(end = 'string', body = 'return 42') { return `
interface Range<T extends string | Date = string> { readonly start: T; readonly end: ${end}; }
export type DateRange = Range<string>;
export type ColorFormat = 'hex' | 'rgb' | 'hsl';
export interface Node { next?: Node; value: DateRange; }
export type MapValue<T extends Record<string, unknown>> = { readonly [K in keyof T]?: T[K] };
export function answer(): number { ${body}; }
export class Control { private implementation = 1; get value() { return ''; } set value(value: string) {} }
`; }

test('source declarations follow barrels, aliases, generics, mapped and recursive types without runtime execution', async t => {
  const root = await fixture(t), snapshot = await generateTypeSnapshot(root);
  validateTypeSnapshot(snapshot);
  assert.deepEqual(snapshot.gaps, []);
  assert.equal(snapshot.exports['@test/elements#Alias'], snapshot.exports['@test/elements#DateRange']);
  assert.match(snapshot.declarations['src/types.ts#Range']!.declaration, /readonly end: string/);
  assert.match(snapshot.declarations['src/types.ts#Range']!.declaration, /T extends string \| Date = string/);
  assert.match(snapshot.declarations['src/types.ts#MapValue']!.declaration, /readonly \[K in keyof T\]\?: T\[K\]/);
  assert.match(snapshot.declarations['src/types.ts#Control']!.declaration, /get value\(\): string/);
  assert.doesNotMatch(snapshot.declarations['src/types.ts#Control']!.declaration, /implementation/);
  assert.ok(publicTypeContract(snapshot, '@test/elements#Node'));
  assert.equal(snapshot.entrypoints['@test/elements/internal/hidden.js'], undefined);
  assert.ok(snapshot.externalReferences.some(ref => ref.endsWith('#Date')));
});

test('a reachable field change is visible with an unchanged CEM and requires a release classification', async t => {
  const root = await fixture(t), before = await generateTypeSnapshot(root);
  await writeFile(join(root, 'src/types.ts'), source('Date'));
  const after = await generateTypeSnapshot(root);
  assert.deepEqual(diffCem(cem, cem).facts, []);
  const types = { before, after }, diff = diffPublicApi(cem, cem, types);
  const fact = diff.facts.find(f => f.name === '@test/elements#DateRange')!;
  assert.equal(fact.surface, 'type'); assert.equal(fact.reviewRequired, true); assert.equal(fact.suggestedLevel, null);
  assert.match(JSON.stringify(fact.before), /readonly end: string/); assert.match(JSON.stringify(fact.after), /readonly end: Date/);
  assert.ok(diff.facts.some(f => f.name === '@test/elements#Alias'));
  const input = { schemaVersion: 1 as const, packageTrain: ['@test/elements'], baseVersion: '0.1.0', baseArtifacts: { types: digestJson(before) }, candidateArtifacts: { types: digestJson(after) }, changes: [] };
  assert.equal(createRelease(input, cem, cem, types).classificationComplete, false);
  const classified = createRelease({ ...input, changes: [{ id: 'range-change', components: ['$package'], level: 'breaking', summary: 'Change range end type.', rationale: 'Synthetic compatibility check.', migration: 'Supply a Date.', cemFactIds: diff.facts.map(f => f.id), evidence: [{ kind: 'other', label: 'Type diff', href: './diff.json', status: 'available', digest: digestJson(diff) }] }] }, cem, cem, types);
  assert.equal(classified.classificationComplete, true); assert.equal(classified.proposedVersion, '0.2.0');
});

test('runtime-only edits do not change the declaration snapshot; freshness rejects type and policy drift', async t => {
  const root = await fixture(t), before = await writeTypeSnapshot(root);
  await writeFile(join(root, 'src/types.ts'), source('string', 'return 43'));
  const unchanged = await verifyTypeSnapshot(root);
  assert.deepEqual(diffPublicApi(cem, cem, { before, after: unchanged.snapshot }).facts, []);
  const tampered = structuredClone(before); tampered.generator.digest = 'sha256:old-policy';
  await writeFile(join(root, 'public-types.json'), JSON.stringify(tampered));
  await assert.rejects(verifyTypeSnapshot(root), /Stale/);
  await writeTypeSnapshot(root);
  await writeFile(join(root, 'src/types.ts'), source('Date'));
  await assert.rejects(verifyTypeSnapshot(root), /Stale/);
});

test('unresolved local exports and invalid syntax fail closed', async t => {
  const root = await fixture(t);
  await writeFile(join(root, 'src/index.ts'), "export type { Lost } from './missing.js';");
  assert.ok((await generateTypeSnapshot(root)).gaps.some(gap => /Lost|missing/.test(gap)));
  await assert.rejects(writeTypeSnapshot(root), /unresolved/);
  await writeFile(join(root, 'src/index.ts'), 'export interface Broken {');
  await assert.rejects(generateTypeSnapshot(root));
});

test('malformed snapshots and cross-package comparisons are rejected', async t => {
  const root = await fixture(t), before = await generateTypeSnapshot(root);
  const broken = structuredClone(before); broken.exports['@test/elements#DateRange'] = 'absent';
  assert.throws(() => diffPublicApi(cem, cem, { before, after: broken }), /Unresolved/);
  assert.throws(() => diffPublicApi(cem, cem, { before, after: { ...before, packageName: 'other' } }), /different packages/);
});

test('CLI requires type evidence by default and emits type facts for explicit before/after snapshots', async t => {
  const root = await fixture(t), before = await generateTypeSnapshot(root);
  await writeFile(join(root, 'src/types.ts'), source('Date'));
  const after = await generateTypeSnapshot(root);
  await Promise.all([writeFile(join(root, 'before.json'), JSON.stringify(before)), writeFile(join(root, 'after.json'), JSON.stringify(after)), writeFile(join(root, 'cem.json'), JSON.stringify(cem))]);
  const cli = new URL('../releases/cli.ts', import.meta.url).pathname;
  const args = [cli, 'diff', join(root, 'cem.json'), join(root, 'cem.json')];
  await assert.rejects(exec(process.execPath, args), /public-types/);
  const result = await exec(process.execPath, [...args, '--types', join(root, 'before.json'), join(root, 'after.json')]);
  assert.ok(JSON.parse(result.stdout).facts.some((f: any) => f.name === '@test/elements#DateRange'));
  const limited = await exec(process.execPath, [...args, '--cem-only']);
  assert.equal(JSON.parse(limited.stdout).typeCoverage, 'not-supplied');
});


test('changing a value export to type-only is a public API change through a barrel', async t => {
  const root = await fixture(t), before = await generateTypeSnapshot(root);
  await writeFile(join(root, 'src/index.ts'), "export type { Control } from './barrel.js';");
  await writeFile(join(root, 'src/barrel.ts'), "export type { Control } from './types.js';");
  const after = await generateTypeSnapshot(root);
  assert.equal(before.exportKinds['@test/elements#Control'], 'value');
  assert.equal(after.exportKinds['@test/elements#Control'], 'type');
  assert.equal(diffPublicApi(cem, cem, { before, after }).facts.find(f => f.name === '@test/elements#Control')?.operation, 'changed');
});
