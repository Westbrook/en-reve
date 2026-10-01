import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { diffCem, snapshotCem } from './cem-diff.ts';
import { createRelease, nextVersion, parseVersion } from './release.ts';
import type { ChangeLevel, } from './cem-diff.ts';
import type { ReleaseInput } from './release.ts';
import { digestJson } from '../evidence/identity.ts';

const exec = promisify(execFile);
const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url);
const before = JSON.parse(await readFile(fixture('sample-before.cem.json'), 'utf8'));
const after = JSON.parse(await readFile(fixture('sample-after.cem.json'), 'utf8'));
const input: ReleaseInput = JSON.parse(await readFile(fixture('sample-changes.json'), 'utf8'));
const clone = <T>(value: T): T => structuredClone(value);

test('per-element CEM facts identify property and attribute additions without conflating schema and release versions', () => {
  const diff = diffCem(before, after);
  assert.equal(diff.beforeSchemaVersion, '1.0.0');
  assert.deepEqual(diff.facts.map(fact => [fact.element, fact.surface, fact.name, fact.operation, fact.suggestedLevel]), [
    ['en-sample-control', 'attribute', 'disabled', 'added', 'feature'],
    ['en-sample-control', 'property', 'disabled', 'added', 'feature'],
  ]);
  assert.equal(diff.reviewRequired, false);
  assert.equal(createRelease(input, before, after).proposedVersion, '0.1.1');
});

test('public removals and unknown type changes are distinguished', () => {
  const changed = clone(before);
  const declaration = changed.modules[0].declarations[0];
  declaration.attributes = [];
  declaration.members[0].type.text = 'number';
  const diff = diffCem(before, changed);
  assert.equal(diff.facts.find(fact => fact.surface === 'attribute')!.suggestedLevel, 'removal');
  const typeChange = diff.facts.find(fact => fact.surface === 'property')!;
  assert.equal(typeChange.suggestedLevel, null);
  assert.equal(typeChange.reviewRequired, true);
  assert.equal(diff.reviewRequired, true);
});

test('metadata-only prose changes are classified without source text scanning', () => {
  const changed = clone(before);
  changed.modules[0].declarations[0].cssParts[0].description = 'The interactive visual region';
  const facts = diffCem(before, changed).facts;
  assert.equal(facts.length, 1);
  assert.equal(facts[0]!.suggestedLevel, 'fix');
  assert.equal(facts[0]!.reviewRequired, false);
});

test('private members stay private; array ordering does not imply an API change', () => {
  const old = clone(after);
  old.modules[0].declarations[0].members.push({ kind: 'field', name: 'internal', privacy: 'private', type: { text: 'number' } });
  old.modules[0].exports.push({ kind: 'js', name: 'SampleControl', declaration: { name: 'SampleControl', module: 'sample-control.js' } });
  const changed = clone(old);
  changed.modules[0].declarations[0].members[2].type.text = 'boolean';
  changed.modules[0].declarations[0].members.reverse();
  assert.deepEqual(diffCem(old, changed).facts, []);
});

test('local inheritance is traversed and inherited public changes reach the component', () => {
  const old = clone(before);
  old.modules[0].declarations.unshift({ kind: 'class', name: 'Base', members: [{ kind: 'field', name: 'disabled', type: { text: 'boolean' } }] });
  old.modules[0].declarations[1].superclass = { name: 'Base', module: 'sample-control.js' };
  const changed = clone(old);
  changed.modules[0].declarations[0].members = [];
  const fact = diffCem(old, changed).facts[0]!;
  assert.equal(fact.element, 'en-sample-control');
  assert.equal(fact.name, 'disabled');
  assert.equal(fact.operation, 'removed');
});

test('external bases, unknown schemas and unresolved definitions remain visible gaps', () => {
  const changed = clone(before);
  changed.schemaVersion = '2.0.0';
  changed.modules[0].declarations[0].superclass = { name: 'UnresolvedBase', package: 'unresolved-package' };
  changed.modules[0].exports.push({ kind: 'custom-element-definition', name: 'en-missing', declaration: { name: 'Absent' } });
  const diff = diffCem(before, changed);
  assert.equal(diff.reviewRequired, true);
  assert.equal(diff.gaps.length, 3);
  assert.throws(() => snapshotCem({ schemaVersion: '1.0.0' }));
});

test('duplicate/conflicting declarations cannot silently overwrite public API', () => {
  const changed = clone(before);
  changed.modules[0].declarations.push(clone(changed.modules[0].declarations[0]));
  assert.throws(() => snapshotCem(changed));
});

test('accepted version policy applies maximum change severity across the train', () => {
  const cases: Array<[string, ChangeLevel[], string, string]> = [
    ['0.3.4', ['fix'], '0.3.5', 'initial-y'],
    ['0.3.4', ['feature', 'fix'], '0.3.5', 'initial-y'],
    ['0.3.4', ['deprecation'], '0.4.0', 'initial-x'],
    ['0.3.4', ['breaking'], '0.4.0', 'initial-x'],
    ['0.3.4', ['removal'], '0.4.0', 'initial-x'],
    ['1.3.4', ['fix'], '1.3.5', 'patch'],
    ['1.3.4', ['feature'], '1.4.0', 'minor'],
    ['1.3.4', ['deprecation'], '1.4.0', 'minor'],
    ['1.3.4', ['removal', 'fix'], '2.0.0', 'major'],
    ['1.3.4', ['breaking'], '2.0.0', 'major'],
    ['1.3.4', [], '1.3.4', 'none'],
  ];
  for (const [base, levels, version, bump] of cases) assert.deepEqual(nextVersion(base, levels), { version, bump });
  assert.deepEqual(nextVersion('0.9.0', [], true), { version: '1.0.0', bump: 'stabilize' });
  assert.throws(() => nextVersion('1.0.0', [], true));
  for (const value of ['01.2.3', '1.2', '1.2.3-beta', '1.2.-1']) assert.throws(() => parseVersion(value));
});

test('authored behavior changes version components even when the CEM is unchanged', () => {
  const changeInput = clone(input);
  changeInput.sample = false;
  changeInput.changes[0]!.level = 'fix';
  changeInput.changes[0]!.summary = 'Preserve focus after an application-controlled value update.';
  const draft = createRelease(changeInput, before, before);
  assert.equal(draft.proposedVersion, '0.1.1');
  assert.equal(draft.components.length, 1);
  assert.equal(draft.components[0]!.releasedIn, null);
  assert.equal(draft.published, false);
  assert.equal(draft.adopted, false);
  assert.equal(draft.issues[0]!.code, 'missing-evidence');
});

test('unknown type compatibility requires an explicit fact classification', () => {
  const changed = clone(before);
  changed.modules[0].declarations[0].members[0].type.text = 'string | number';
  const fact = diffCem(before, changed).facts[0]!;
  const changeInput = clone(input);
  let draft = createRelease(changeInput, before, changed);
  assert.equal(draft.classificationComplete, false);
  assert.equal(draft.issues.some(issue => issue.code === 'unclassified-fact'), true);
  changeInput.changes[0]!.cemFactIds = [fact.id];
  draft = createRelease(changeInput, before, changed);
  assert.equal(draft.classificationComplete, true);
  assert.equal(draft.status, 'needs-review'); // Synthetic/missing evidence still needs review.
});

test('authored fix cannot downgrade a detected public removal', () => {
  const changed = clone(before);
  changed.modules[0].declarations[0].cssParts = [];
  const fact = diffCem(before, changed).facts[0]!;
  const changeInput = clone(input);
  changeInput.changes[0]!.level = 'fix';
  changeInput.changes[0]!.cemFactIds = [fact.id];
  const draft = createRelease(changeInput, before, changed);
  assert.equal(draft.proposedVersion, '0.2.0');
  assert.equal(draft.classificationComplete, false);
  assert.equal(draft.issues.some(issue => issue.code === 'understated-change'), true);
});

test('exact evidence and history remain tied to the draft and never imply release approval', () => {
  const changeInput = clone(input);
  changeInput.sample = false;
  changeInput.componentHistory = { 'en-sample-control': { introducedIn: '0.1.0', lastChangedIn: '0.1.0', releasedIn: '0.1.0' } };
  changeInput.changes[0]!.evidence[0] = { kind: 'behavior', label: 'Synthetic test packet', href: './evidence/run.json', digest: digestJson({ fixture: true }), status: 'available' };
  const draft = createRelease(changeInput, before, after);
  assert.equal(draft.status, 'ready-for-review');
  assert.equal(draft.components[0]!.introducedIn, '0.1.0');
  assert.equal(draft.components[0]!.releasedIn, null);
  assert.equal(draft.published, false);
  assert.equal(draft.adopted, false);
});

test('CLI writes an isolated review packet and refuses to overwrite it', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'en-release-test-'));
  try {
    const output = join(temporary, 'packet');
    const args = [new URL('./cli.ts', import.meta.url).pathname, 'draft', fixture('sample-changes.json').pathname,
      fixture('sample-before.cem.json').pathname, fixture('sample-after.cem.json').pathname, output, '--cem-only'];
    const result = await exec(process.execPath, args);
    assert.equal(JSON.parse(result.stdout).proposedVersion, '0.1.1');
    const packet = JSON.parse(await readFile(join(output, 'release.json'), 'utf8'));
    assert.equal(packet.schemaVersion, 1);
    assert.equal(packet.sample, true);
    assert.equal(packet.cem.afterSchemaVersion, '1.0.0');
    assert.equal((await stat(join(output, 'CHANGELOG.md'))).size > 0, true);
    await assert.rejects(() => exec(process.execPath, args));
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
