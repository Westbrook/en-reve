import test from 'node:test';
import assert from 'node:assert/strict';
import { selectSystems } from '../src/config.mjs';
import { additiveInventory, selectedInventory, archiveSnapshot } from '../src/prepare.mjs';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('selected panels keep registered order and reject unknown selectors', () => {
  const registered = [{ id: 'old' }, { id: 'control' }, { id: 'new' }];
  assert.deepEqual(selectSystems('new,control', registered), [registered[1], registered[2]]);
  assert.throws(() => selectSystems('old,typo', registered), /Unknown system/);
  assert.throws(() => selectSystems('old,', registered), /Unknown system/);
});

async function archiveFixture(t) {
 const root=await mkdtemp(join(tmpdir(),'en-archive-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const target=join(root,'snapshot'),archive=join(root,'archive','system-fingerprint');
 await mkdir(target);await writeFile(join(target,'asset.js'),'current snapshot');
 return {target,archive};
}
test('first snapshot archive retains its canonical historical path and metadata',async t=>{
 const {target,archive}=await archiveFixture(t);assert.equal(await archiveSnapshot(target,archive,{fingerprint:'same'},'upgrade'),archive);
 assert.equal(await readFile(join(archive,'asset.js'),'utf8'),'current snapshot');
 assert.equal(JSON.parse(await readFile(archive+'.json')).reason,'upgrade');
});
test('repeated fingerprint archives preserve both the existing archive and the new snapshot',async t=>{
 const {target,archive}=await archiveFixture(t);await mkdir(archive,{recursive:true});await writeFile(join(archive,'asset.js'),'retained history');await writeFile(archive+'.json','retained metadata');
 const saved=await archiveSnapshot(target,archive,{fingerprint:'same'},'upgrade');assert.notEqual(saved,archive);
 assert.equal(await readFile(join(archive,'asset.js'),'utf8'),'retained history');assert.equal(await readFile(archive+'.json','utf8'),'retained metadata');
 assert.equal(await readFile(join(saved,'asset.js'),'utf8'),'current snapshot');assert.equal(JSON.parse(await readFile(saved+'.json')).fingerprint,'same');
});
test('a retained metadata-only archive cannot be overwritten by preparation',async t=>{
 const {target,archive}=await archiveFixture(t);await mkdir(join(archive,'..'),{recursive:true});await writeFile(archive+'.json','retained metadata');
 const saved=await archiveSnapshot(target,archive,{fingerprint:'same'},'upgrade');assert.notEqual(saved,archive);
 assert.equal(await readFile(archive+'.json','utf8'),'retained metadata');assert.equal(await readFile(join(saved,'asset.js'),'utf8'),'current snapshot');
});

test('challenger addition preserves frozen entries and prior qualification while requiring its own checks', () => {
  const previous = {
    schema: 1,
    systems: [{ id: 'old', fingerprint: 'immutable', assets: [{ path: 'a.js', sha256: 'same' }] }],
    qualification: { status: 'passed', receipt: 'original.json' },
    requiresFunctionalQualification: false,
  };
  const before = JSON.stringify(previous);
  const entry = { id: 'new', fingerprint: 'challenger', assets: [] };
  const result = additiveInventory(previous, [entry], 'Add a comparison library');
  assert.equal(JSON.stringify(previous), before);
  assert.deepEqual(result.systems, [...previous.systems, entry]);
  assert.deepEqual(result.qualificationHistory, [previous.qualification]);
  assert.equal(result.requiresFunctionalQualification, true);
  assert.deepEqual(result.pendingSystems, ['new']);
  assert.throws(() => additiveInventory(previous, [{ id: 'old' }], 'Replace'), /cannot replace/);
});

test('adding a challenger never clears another pending qualification', () => {
  const previous = { systems: [{ id: 'pending' }], requiresFunctionalQualification: true, qualification: { status: 'pending' } };
  assert.deepEqual(additiveInventory(previous, [{ id: 'new' }], 'Add').pendingSystems, ['pending', 'new']);
});

test('selected candidate refresh preserves unselected frozen controls and their ordering', () => {
  const previous = { systems: [{ id: 'control', fingerprint: 'frozen' }, { id: 'new', fingerprint: 'first' }], requiresFunctionalQualification: false, qualification: { status: 'passed' } };
  const updated = selectedInventory(previous, [{ id: 'new', fingerprint: 'corrected' }], 'Fix initial tab content');
  assert.deepEqual(updated.systems, [previous.systems[0], { id: 'new', fingerprint: 'corrected' }]);
  assert.equal(previous.systems[1].fingerprint, 'first');
  assert.deepEqual(updated.pendingSystems, ['new']);
  assert.throws(() => selectedInventory(previous, [{ id: 'unregistered' }], 'Add'), /cannot add/);
});

test('additions and selected refresh retain receipt provenance without changing unselected evidence', () => {
  const originalReceipt = { path: 'original.json', sha256: 'original-hash' };
  const sources = [{ path: 'addition.json', sha256: 'addition-hash', systems: ['new'] }];
  const previous = { systems: [{ id: 'control', fingerprint: 'frozen', verificationReceipt: originalReceipt }], qualification: { status: 'passed' } };
  const entry = { id: 'new', fingerprint: 'new', verificationReceipt: { path: 'addition.json', sha256: 'addition-hash' } };
  const added = additiveInventory(previous, [entry], 'Add', sources);
  assert.deepEqual(added.qualification.sourceReceipts, sources);
  assert.deepEqual(added.systems[0], previous.systems[0]);
  const refreshed = selectedInventory(added, [{ ...entry, fingerprint: 'corrected' }], 'Correct', sources);
  assert.deepEqual(refreshed.qualification.sourceReceipts, sources);
  assert.deepEqual(refreshed.systems[0].verificationReceipt, originalReceipt);
  assert.deepEqual(refreshed.systems[1].verificationReceipt, entry.verificationReceipt);
  assert.deepEqual(added.systems[1].fingerprint, 'new');
});
