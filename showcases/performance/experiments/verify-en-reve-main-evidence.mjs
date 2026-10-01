import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, sha, json } from '../src/config.mjs';

const read = async p => JSON.parse(await readFile(resolve(root, p)));
const prior = await read('reports/en-reve-main/prior-inventory.json');
const current = await read('reports/en-reve-main/inventory.json');
const receipt = { at: new Date().toISOString(), peerFixturesUnchanged: 0, peerAssetsChecked: 0, archivedEnReveAssetsChecked: 0, historicalAcquisitionFilesChecked: 0, currentAcquisitionInputsChecked: 0 };
for (const old of prior.systems) {
  const refreshed = current.systems.find(s => s.id === old.id);
  if (old.id !== 'en-reve') {
    assert.equal(refreshed.fingerprint, old.fingerprint);
    receipt.peerFixturesUnchanged++;
    for (const asset of old.assets) {
      assert.equal(sha(await readFile(resolve(root, '.cache/snapshots', old.id, asset.path))), asset.sha256);
      receipt.peerAssetsChecked++;
    }
  } else {
    assert.notEqual(refreshed.fingerprint, old.fingerprint);
    for (const asset of old.assets) {
      assert.equal(sha(await readFile(resolve(root, '.cache/archive', old.id + '-' + old.fingerprint, asset.path))), asset.sha256);
      receipt.archivedEnReveAssetsChecked++;
    }
    receipt.previousFingerprint = old.fingerprint; receipt.currentFingerprint = refreshed.fingerprint;
  }
}
for (const archive of ['reports/web-awesome/evidence/receipt.json', 'reports/spectrum-gen2/evidence/receipt.json']) {
const previousArchive = await read(archive);
for (const campaign of previousArchive.campaigns) for (const file of campaign.files) {
  assert.equal(sha(await readFile(resolve(root, file.source))), file.sourceSha256, file.source);
  receipt.historicalAcquisitionFilesChecked++;
}
}
const tables = await read('reports/en-reve-main/tables.json');
assert.equal(tables.status, 'complete');
for (const input of tables.inputs) {
  assert.equal(sha(await readFile(resolve(root, input.path))), input.sha256, input.path);
  receipt.currentAcquisitionInputsChecked++;
}
assert.equal(Object.values(tables.campaigns).reduce((n, c) => n + c.observed, 0), 306);
assert(Object.values(tables.campaigns).every(c => c.completed));
receipt.successfulSamples = Object.values(tables.campaigns).reduce((n, c) => n + c.successful, 0);
receipt.failedSamples = Object.values(tables.campaigns).reduce((n, c) => n + c.failed, 0);
receipt.passed = true;
await writeFile(resolve(root, 'reports/en-reve-main/preservation-verification.json'), json(receipt));
console.log(json(receipt));
