import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, resolve} from 'node:path';
import test from 'node:test';
import {applyColorPolicyBridge, colorControlBuildPolicy, colorPolicyOverlay, colorPolicyPreimages, colorPolicyRevision, colorPolicySource} from './color-policy-controls.mjs';

const sourceRoot = resolve(import.meta.dirname, '../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = path => readFile(resolve(sourceRoot, path));

async function fixture(t, subject = 'candidate') {
  const root = await mkdtemp(resolve(tmpdir(), 'en-color-policy-provenance-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  for (const [path, expected] of Object.entries(colorPolicyPreimages)) {
    if (subject === 'reference' && path !== colorPolicySource) continue;
    const bytes = await sourceBytes(path);
    assert.equal(sha(bytes), expected, 'Test fixture must use the exact guarded authored source');
    await mkdir(dirname(resolve(root, path)), {recursive: true});
    await writeFile(resolve(root, path), bytes, {flag: 'wx'});
  }
  await mkdir(resolve(root, 'untouched-empty-directory'));
  await writeFile(resolve(root, 'untouched.txt'), 'Keep unrelated build-copy bytes.\n', {flag: 'wx'});
  return root;
}

/** Include directories so an early writer cannot hide new or removed empty paths. */
async function snapshot(root, prefix = '') {
  const result = [];
  for (const entry of (await readdir(root, {withFileTypes: true})).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) {result.push({path, type: 'directory'}); result.push(...await snapshot(resolve(root, entry.name), path + '/'));}
    else {assert(entry.isFile(), 'Unexpected fixture entry type'); const bytes = await readFile(resolve(root, entry.name)); result.push({path, type: 'file', bytes: bytes.length, sha256: sha(bytes)});}
  }
  return result;
}

for (const subject of ['reference', 'candidate']) {
  test(subject + ' overlay binds a reproducible receipt to exact main bytes and rejects source drift', async () => {
    const original = (await sourceBytes(colorPolicySource)).toString('utf8');
    const overlay = colorPolicyOverlay(original, {subject});
    assert.equal(overlay.originalSha256, colorPolicyPreimages[colorPolicySource]);
    assert.equal(overlay.executedSha256, sha(overlay.source));
    assert.notEqual(overlay.executedSha256, overlay.originalSha256);
    let reconstructed = original;
    for (const {before, after} of overlay.replacements) {
      assert.equal(reconstructed.split(before).length, 2, 'A receipt must identify one unambiguous original span');
      reconstructed = reconstructed.replace(before, after);
    }
    assert.equal(reconstructed, overlay.source, 'Preserved receipt must reconstruct the actual executed source');
    // The first mutation leaves every insertion anchor intact. Anchors alone must never authorize it.
    for (const changed of [original + '\n// changed source outside the control anchors\n', original.replace('const documentId = crypto.randomUUID();', 'const documentId = "different-document";'), original + original, overlay.source]) {
      assert.throws(() => colorPolicyOverlay(changed, {subject}), /exact preimage changed/);
    }
  });

  test(subject + ' build-copy write preserves every unrelated byte and binds all required guards', async t => {
    const root = await fixture(t, subject), before = await snapshot(root);
    const receipt = await applyColorPolicyBridge(root, {subject}), after = await snapshot(root);
    const executed = await readFile(resolve(root, colorPolicySource));
    assert.equal(sha(executed), receipt.executedSha256);
    assert.equal(receipt.originalSha256, colorPolicyPreimages[colorPolicySource]);
    assert.deepEqual(after.filter(item => item.path !== colorPolicySource), before.filter(item => item.path !== colorPolicySource));
    const expectedGuards = subject === 'reference' ? [colorPolicySource] : Object.keys(colorPolicyPreimages);
    assert.deepEqual(receipt.guardedInputs.map(item => item.path), expectedGuards);
    for (const guard of receipt.guardedInputs) {
      const original = before.find(item => item.path === guard.path);
      assert.equal(guard.sha256, original.sha256); assert.equal(guard.bytes, original.bytes);
    }
    const preserved = await snapshot(root);
    await assert.rejects(applyColorPolicyBridge(root, {subject}), /exact preimage changed/);
    assert.deepEqual(await snapshot(root), preserved, 'Applying twice must not rewrite or add any build-copy file');
  });
}

for (const path of Object.keys(colorPolicyPreimages)) {
  test('candidate refuses changed ' + path + ' before touching the build copy', async t => {
    const root = await fixture(t), target = resolve(root, path);
    const original = await readFile(target);
    // One-byte whitespace drift is still an identity change, even when syntax and anchors survive.
    await writeFile(target, Buffer.concat([original, Buffer.from(' ')]));
    const before = await snapshot(root);
    await assert.rejects(applyColorPolicyBridge(root, {subject: 'candidate'}), /exact (preimage|source input) changed/);
    assert.deepEqual(await snapshot(root), before, 'A failed provenance check must leave main, all sources and file inventory unchanged');
  });
}

test('candidate refuses an absent guarded helper before touching the build copy', async t => {
  const root = await fixture(t), helper = 'apps/docs/src/composable-chat-color-delivery.ts';
  await rm(resolve(root, helper));
  const before = await snapshot(root);
  await assert.rejects(applyColorPolicyBridge(root, {subject: 'candidate'}), {code: 'ENOENT'});
  assert.deepEqual(await snapshot(root), before);
});

test('unknown subjects and non-data or extra options never authorize a write', async t => {
  const root = await fixture(t), original = (await sourceBytes(colorPolicySource)).toString('utf8');
  const before = await snapshot(root);
  let getterCalls = 0;
  const accessor = Object.defineProperty({}, 'subject', {enumerable: true, get() {getterCalls++; return 'candidate';}});
  const options = [undefined, null, [], {}, {subject: 'rollback'}, {subject: 'Candidate'}, {subject: 'candidate', extra: true}, {subject: 'reference', prepare: true}, {[Symbol('hidden')]: true, subject: 'candidate'}, accessor];
  for (const value of options) {
    assert.throws(() => colorPolicyOverlay(original, value), /Color bridge/);
    await assert.rejects(applyColorPolicyBridge(root, value), /Color bridge/);
    assert.deepEqual(await snapshot(root), before);
  }
  assert.equal(getterCalls, 0, 'Reject an accessor option without evaluating it');
});

test('build policy defaults off and only an explicit boolean enables the separate controls', () => {
  assert.deepEqual(colorControlBuildPolicy(), colorControlBuildPolicy(false));
  const production = colorControlBuildPolicy(), controls = colorControlBuildPolicy(true);
  assert.equal(production.enabled, false); assert.equal(production.revision, null);
  assert.equal(controls.enabled, true); assert.equal(controls.revision, colorPolicyRevision);
  assert.notEqual(production.purpose, controls.purpose);
  assert(Object.isFrozen(production)); assert(Object.isFrozen(controls));
  for (const value of [null, 0, 1, 'false', 'true', [], {}]) assert.throws(() => colorControlBuildPolicy(value), /explicit boolean/);
});
