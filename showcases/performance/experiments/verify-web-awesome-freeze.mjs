import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { root, showcases, json, sha } from '../src/config.mjs';
import { files } from '../src/prepare.mjs';
const before = JSON.parse(await readFile(resolve(root, 'reports/web-awesome/inventory-before-addition.json')));
const inventoryBytes = await readFile(resolve(root, '.cache/inventory.json'));
const inventory = JSON.parse(inventoryBytes);
assert.equal(inventory.requiresFunctionalQualification, false);
assert.deepEqual(inventory.pendingSystems || [], []);
assert.equal(inventory.systems.length, before.systems.length + 1);
let preservedAssetChecks = 0;
for (const prior of before.systems) {
  const current = inventory.systems.find(system => system.id === prior.id);
  assert.deepEqual(current, prior, 'A frozen control inventory entry changed: ' + prior.id);
  for (const asset of prior.assets) {
    assert.equal(sha(await readFile(resolve(root, '.cache/snapshots', prior.id, asset.path))), asset.sha256);
    preservedAssetChecks++;
  }
}
const added = inventory.systems.find(system => system.id === 'web-awesome');
assert.ok(added);
const directory = resolve(root, '.cache/snapshots/web-awesome');
assert.deepEqual((await files(directory)).map(path => relative(directory, path)).sort(), added.assets.map(asset => asset.path).sort());
for (const asset of added.assets) assert.equal(sha(await readFile(resolve(directory, asset.path))), asset.sha256);
for (const [path, expected] of Object.entries(added.sourceHashes)) assert.equal(sha(await readFile(resolve(showcases, path))), expected, 'New showcase source changed after freeze: ' + path);
const qualification = [];
for (const suffix of ['', '-firefox', '-webkit']) {
  const file = `reports/functional-web-awesome${suffix}.json`;
  const receipt = JSON.parse(await readFile(resolve(root, file)));
  assert.equal(receipt.passed, true);
  assert.equal(receipt.fingerprints['web-awesome'], added.fingerprint);
  assert.equal(receipt.suites.flatMap(suite => suite.results).flatMap(result => result.checks).length, 23);
  qualification.push({ file, engine: receipt.engine, checks: 23, sha256: sha(json(receipt)) });
}
const calibration = JSON.parse(await readFile(resolve(root, 'reports/web-awesome/dialog-calibration.json')));
assert.equal(calibration.collectorSha256, sha(await readFile(resolve(root, 'src/collector.js'))));
assert.equal(calibration.results.length, 2);
assert.ok(calibration.results.every(result => result.status === 'passed'));
await writeFile(resolve(root, 'reports/web-awesome/inventory.json'), inventoryBytes, { flag: 'wx' });
const receipt = { at: new Date().toISOString(), passed: true, preservedSystems: before.systems.map(system => system.id), preservedAssetChecks, newSystem: { id: added.id, fingerprint: added.fingerprint, assets: added.assets.length, sourceFiles: Object.keys(added.sourceHashes).length }, inventorySha256: sha(inventoryBytes), qualification, dialogCalibration: 'reports/web-awesome/dialog-calibration.json' };
await writeFile(resolve(root, 'reports/web-awesome/freeze-verification.json'), json(receipt), { flag: 'wx' });
console.log(json(receipt));
