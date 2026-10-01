import assert from 'node:assert/strict';
import { readFile, readdir, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { variantQualification } from '../../showcases/performance/src/variant-qualification.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
const digestPattern = /^[a-f0-9]{64}$/;
const stageId = 'adapter:stage-workspaces-and-reference-seed';
const systems = ['radix-react', 'fluent-react', 'spectrum-react', 'astryx-react', 'shadcn-react',
  'fluent-web-components', 'spectrum-web-components', 'en-reve', 'web-awesome'];
const currentTask = id => ['native:current-build', 'native:current-functional'].includes(id) || /^native:(sentinel|full):current:/.test(id);
const inside = (parent, child) => child === parent || child.startsWith(parent + sep);
const absolute = path => { assert(typeof path === 'string' && isAbsolute(path) && resolve(path) === path, 'Expected canonical absolute path'); return path; };
const childPath = (root, name) => {
  assert(typeof name === 'string' && name && !isAbsolute(name), 'Expected relative binding path');
  const path = resolve(root, name);
  assert(inside(root, path) && path !== root && !name.split(/[\\/]/).includes('..'), 'Binding escapes workspace');
  assert(!name.split(/[\\/]/).includes('key.pem'), 'Private TLS key bytes cannot be inspected');
  return path;
};
async function absent(path) {
  try { await lstat(path); return false; } catch (error) { if (error.code !== 'ENOENT') throw error; return true; }
}
async function filePin(path) { const bytes = await readFile(path); return { path, sha256: sha(bytes) }; }
async function verifyPins(root, entries) {
  assert(Array.isArray(entries) && entries.length, 'Finite file bindings required');
  const seen = new Set(), result = [];
  for (const entry of entries) {
    assert(digestPattern.test(entry.sha256) && !seen.has(entry.path), 'Invalid or duplicate file binding');
    seen.add(entry.path);
    const path = root ? childPath(root, entry.path) : absolute(entry.path);
    assert(!path.split(sep).includes('key.pem'), 'Private TLS key bytes cannot be inspected');
    if (root) {
      assert.equal(await realpath(path), path, 'Staged file redirects outside its own workspace');
      const info = await lstat(path);
      assert(info.isFile() && info.nlink === 1, 'Staged file must be an independent regular copy');
    }
    const actual = await filePin(path);
    assert.equal(actual.sha256, entry.sha256, `Bound file changed: ${path}`);
    result.push(actual);
  }
  return result;
}
async function regularFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    // Harness/source staging must not redirect identity reads through links.
    assert(!entry.isSymbolicLink(), `Harness link is not an admitted source file: ${path}`);
    if (entry.isDirectory()) result.push(...await regularFiles(path));
    else { assert(entry.isFile(), `Non-file harness entry: ${path}`); result.push(path); }
  }
  return result.sort();
}
async function harnessIdentity(workspace) {
  const lab = resolve(workspace, 'showcases/performance');
  const paths = [];
  for (const folder of ['src', 'scenarios', 'profiles', 'registry']) paths.push(...await regularFiles(resolve(lab, folder)));
  paths.push(resolve(lab, 'package-lock.json'));
  const entries = await Promise.all(paths.map(async path => [relative(lab, path), sha(await readFile(path))]));
  return { sha256: sha(json(entries)), files: entries };
}
async function inventory(workspace, expectedSystems) {
  const path = resolve(workspace, 'showcases/performance/.cache/inventory.json');
  const bytes = await readFile(path), data = JSON.parse(bytes);
  assert.deepEqual(data.systems.map(system => system.id).sort(), [...expectedSystems].sort(), 'Wrong prepared inventory width or systems');
  return { path, sha256: sha(bytes), data };
}

// Inspect named mutable destinations and their ancestors only. Dependency package
// links and the separately admitted TLS key are not traversed or read here.
async function writablePath(path) {
  for (const part of [path, ...function* parents(value) { while (dirname(value) !== value) { value = dirname(value); yield value; } }(path)].reverse()) {
    let info;
    try { info = await lstat(part); } catch (error) { if (error.code === 'ENOENT') break; throw error; }
    assert(!info.isSymbolicLink(), `Mutable output path redirects through a link: ${part}`);
    if (part !== path) assert(info.isDirectory(), `Mutable output ancestor is not a directory: ${part}`);
  }
}
const mutableOutputs = [
  'node_modules', 'node_modules/.cache',
  ...['tokens', 'styles', 'primitives', 'elements'].map(name => `packages/${name}/dist`),
  ...[...systems, 'tools'].flatMap(name => [`showcases/${name}/node_modules`, `showcases/${name}/dist`]),
  ...['.cache', '.cache/archive', '.cache/encoded', '.cache/snapshots', '.cache/variants', '.cache/variants/current-en-reve',
    '.cache/qualification', '.cache/current-consumer', '.cache/current-consumer/shared', '.cache/current-consumer/tools',
    '.cache/current-consumer/en-reve', '.cache/inventory.json', '.cache/collector.js', 'reports', 'reports/en-reve-experiments.json', 'runs',
    ...systems.map(name => `.cache/snapshots/${name}`),
    ...['src', 'vendor', 'node_modules', 'dist', 'index.html', 'vite.config.js', '.npmrc', 'package.json', 'package-lock.json'].map(name => `.cache/current-consumer/en-reve/${name}`),
  ].map(name => 'showcases/performance/' + name),
];

/** Observe disposition after the existing owner helper settles, including failures. */
export async function workspaceOwnerDisposition(record) {
  try {
    const current = JSON.parse(await readFile(record.path, 'utf8'));
    const same = current.token === record.owner.token && current.pid === record.owner.pid;
    return { releaseStatus: same ? 'retained' : 'unknown', returned: same && record.borrowed,
      releaseObservation: same ? (record.borrowed ? 'caller owner remains after borrowed work returned' : 'owned record remains') : 'different owner record remains' };
  } catch (error) {
    if (error.code === 'ENOENT') return { releaseStatus: 'released', returned: true, releaseObservation: 'owner pathname absent after helper settled' };
    return { releaseStatus: 'unknown', returned: false, releaseObservation: String(error) };
  }
}

/** Opt-in routing only. The ordinary single-workspace graph remains unchanged. */
export function nativeWorkspaceRouting(config, selection, { controllerRoot, id }) {
  controllerRoot = resolve(controllerRoot);
  assert.equal(config.schemaVersion, 1, 'Unsupported native workspace contract');
  assert.deepEqual([...selection.requested].sort(), ['native-full', 'native-sentinel'], 'Workspace routing requires exactly both native regression pathways');
  assert(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id), 'Unsafe invocation ID');
  const roots = { native: absolute(config.workspaces.native), current: absolute(config.workspaces.current) };
  for (const a of Object.values(roots)) {
    assert(!inside(absolute(controllerRoot), a) && !inside(a, controllerRoot), 'Fresh workspaces must be separate from the controller checkout');
    for (const b of Object.values(roots)) if (a !== b) assert(!inside(a, b), 'Workspace roots overlap');
  }
  assert.notEqual(roots.native, roots.current, 'Native and current workspaces must be distinct');
  assert(digestPattern.test(config.harnessSha256), 'Expected accepted harness identity');
  assert(digestPattern.test(config.reference.fingerprint) && digestPattern.test(config.reference.inventorySha256), 'Expected accepted reference bindings');
  assert(Array.isArray(config.reference.files) && config.reference.files.length, 'Reference snapshot/encoding file bindings required');
  assert(Array.isArray(config.sourceFiles) && config.sourceFiles.length, 'Selected repository source bindings required');
  for (const required of ['package.json', 'showcases/performance/experiments/build-current.mjs', 'tooling/testing/preflight-anchors.mjs', 'tooling/test-pipeline/npm-pack.mjs',
    ...['tokens', 'styles', 'primitives', 'elements'].map(name => `packages/${name}/package.json`)]) {
    assert(config.sourceFiles.some(file => file.path === required), `Missing valid repository-layout source binding: ${required}`);
  }
  const stage = config.stage;
  absolute(stage.cwd);
  assert(Array.isArray(stage.command) && stage.command.length >= 2 && stage.command.every(arg => typeof arg === 'string' && arg && !arg.includes('$')), 'Concrete stage argv required');
  for (const executable of stage.command.slice(0, 2)) assert(stage.inputPins.some(pin => pin.path === absolute(executable)), 'Stage executable and entrypoint must be pinned');
  const preflights = selection.plan.filter(task => task.preflight);
  assert.deepEqual(preflights.map(task => task.id), ['native:sentinel:anchor-preflight', 'native:full:anchor-preflight'], 'Original preflight selection/order changed');
  const route = (task, role) => ({ ...task, cwd: roots[role], workspaceRole: role,
    command: task.command.map((arg, index) => index > 0 && arg.startsWith(controllerRoot + sep) ? resolve(roots[role], relative(controllerRoot, arg)) : arg) });
  const four = [...preflights.map(task => route(task, 'native')), ...preflights.map(task => ({ ...route(task, 'current'), id: task.id + ':current-lab' }))]
    .map(task => ({ ...task, dependencies: [stageId] }));
  const plan = [
    { id: stageId, command: stage.command, cwd: stage.cwd, dependencies: [], kind: 'producer', resource: 'bounded-preparation', workspaceRole: 'stage' },
    ...four,
    ...selection.plan.filter(task => !task.preflight).map(task => ({ ...route(task, currentTask(task.id) ? 'current' : 'native'), dependencies: [...new Set([...task.dependencies, ...four.map(item => item.id)])] })),
  ];
  const routed = { ...selection, plan, pathwayTasks: Object.fromEntries(selection.requested.map(name => [name,
    [...new Set([stageId, ...four.map(task => task.id), ...selection.pathwayTasks[name]])]])) };
  const completed = [], evidence = { workspaces: roots, sourceBefore: null, sourceAfter: null, candidate: null, functional: null };
  const currentLab = resolve(roots.current, 'showcases/performance');
  const functionalPath = resolve(currentLab, 'reports', `functional-${id}-current-functional-current-en-reve.json`);
  for (const task of plan.filter(task => task.workspaceRole === 'current' && task.command[2] === 'run')) {
    const offset = task.command.indexOf('--functional-receipt');
    assert(offset >= 0 && task.command[offset + 1]?.replaceAll('$ID', id) === functionalPath, 'Capture must consume its exact unique functional producer receipt');
  }
  let candidatePin, functionalPin, activeTask, nativePin;

  async function verifyWritableOutputs(task) {
    if (task.workspaceRole === 'stage') {
      for (const workspace of Object.values(roots)) await writablePath(workspace);
      return;
    }
    for (const name of mutableOutputs) await writablePath(resolve(task.cwd, name));
    if (task.workspaceRole === 'current') await writablePath(functionalPath);
    const runOffset = task.command.indexOf('--id');
    if (runOffset >= 0) await writablePath(resolve(task.cwd, 'showcases/performance/runs', task.command[runOffset + 1].replaceAll('$ID', id)));
  }

  async function nativeBinding() {
    const current = await inventory(roots.native, systems), nativeLab = resolve(roots.native, 'showcases/performance');
    assert.equal(current.data.requiresFunctionalQualification, false, 'Native functional qualification remains pending');
    const files = [], encoded = new Set();
    for (const system of current.data.systems) {
      assert(Array.isArray(system.assets) && system.assets.length, 'Qualified native asset list is empty');
      for (const asset of system.assets) {
      const name = `.cache/snapshots/${system.id}/${asset.path}`;
      const [bound] = await verifyPins(nativeLab, [{ path: name, sha256: asset.sha256 }]);
      files.push(bound);
      if (!asset.path.endsWith('.map')) for (const suffix of ['gz', 'br']) encoded.add(`.cache/encoded/${asset.sha256}.${suffix}`);
      }
    }
    for (const name of [...encoded].sort()) {
      const path = childPath(nativeLab, name);
      await writablePath(path);
      files.push(await filePin(path));
    }
    return { path: current.path, sha256: current.sha256, files };
  }

  async function verifySources() {
    const result = {};
    for (const [role, workspace] of Object.entries(roots)) {
      assert.equal(await realpath(workspace), workspace, 'Workspace root redirected');
      // node_modules/.cache must belong to this workspace, never a shared dependency tree.
      for (const name of ['node_modules', 'node_modules/.cache']) {
        const path = resolve(workspace, name);
        if (!await absent(path)) assert.equal(await realpath(path), path, 'Checkout ownership path redirected through shared dependencies');
      }
      const source = await verifyPins(workspace, config.sourceFiles);
      const harness = await harnessIdentity(workspace);
      assert.equal(harness.sha256, config.harnessSha256, `${role}: harness identity changed`);
      assert.deepEqual((await readJSON(resolve(workspace, 'showcases/performance/registry/systems.json'))).map(item => item.id), systems, 'Accepted nine-system registry changed');
      result[role] = { source, harness };
    }
    return result;
  }
  async function verifyReference() {
    const value = await inventory(roots.current, ['en-reve']);
    assert.equal(value.sha256, config.reference.inventorySha256, 'Accepted reference inventory changed');
    assert.equal(value.data.systems[0].fingerprint, config.reference.fingerprint, 'Reference fixture changed');
    assert.equal(value.data.requiresFunctionalQualification, false, 'Reference is not qualified');
    const files = await verifyPins(currentLab, config.reference.files);
    for (const asset of value.data.systems[0].assets) {
      assert(config.reference.files.some(file => file.path === '.cache/snapshots/en-reve/' + asset.path && file.sha256 === asset.sha256), 'Reference asset missing from finite transfer bindings');
    }
    return { path: value.path, sha256: value.sha256, files };
  }
  async function verifyCandidate() {
    const path = resolve(currentLab, 'reports/en-reve-experiments.json');
    const bytes = await readFile(path), entries = JSON.parse(bytes).filter(item => item.id === 'current-en-reve');
    assert.equal(entries.length, 1, 'Expected one fresh current variant');
    const variant = entries[0];
    assert.equal(variant.cohort, 'current-library-native', 'Wrong candidate cohort');
    assert.equal(sha(json(variant.assets.map(asset => [asset.path, asset.sha256]))), variant.fingerprint, 'Candidate asset fingerprint mismatch');
    await verifyPins(resolve(currentLab, '.cache/variants/current-en-reve'), variant.assets);
    assert.deepEqual(variant.packages.map(pkg => pkg.name).sort(), ['@en-reve/elements', '@en-reve/primitives', '@en-reve/styles', '@en-reve/tokens'], 'Current package provenance missing');
    await verifyPins(resolve(currentLab, '.cache/current-consumer/en-reve/vendor'), variant.packages.map(pkg => ({ path: pkg.filename, sha256: pkg.sha256 })));
    assert.equal((await filePin(resolve(currentLab, '.cache/current-consumer/en-reve/package-lock.json'))).sha256, variant.lockfileSha256, 'Candidate installed lock changed');
    return { variant, binding: { path, sha256: sha(bytes), fingerprint: variant.fingerprint, lockfileSha256: variant.lockfileSha256, packages: variant.packages } };
  }
  return {
    selection: routed, evidence, functionalPath, verifyWritableOutputs,
    async before(task) {
      assert.equal(activeTask, undefined, 'Parallel native task dispatch is forbidden');
      assert.equal(task.id, plan[completed.length]?.id, 'Native tasks must execute once in original serial order');
      for (const dependency of task.dependencies) assert(completed.includes(dependency), `Required producer/preflight has not passed: ${dependency}`);
      activeTask = task.id;
      await verifyWritableOutputs(task);
      if (task.id === stageId) {
        for (const workspace of Object.values(roots)) assert(await absent(workspace), 'Staging requires fresh nonexistent workspaces');
        await verifyPins(null, stage.inputPins);
        return;
      }
      if (task.id === 'native:current-build') {
        await verifySources();
        assert(await absent(resolve(currentLab, 'reports/en-reve-experiments.json')), 'Stage must not transfer an old candidate');
      }
      if (task.id === 'native:current-functional') {
        assert(await absent(functionalPath), 'Fresh functional receipt already exists');
        const candidate = await verifyCandidate();
        assert.deepEqual(candidate.binding, candidatePin, 'Candidate changed before functional qualification');
      }
      if (task.freshAcquisition && task.command[2] === 'run') {
        await verifySources();
        if (task.workspaceRole === 'native') {
          assert(nativePin, 'Qualified native producer binding is missing');
          assert.deepEqual(await nativeBinding(), nativePin, 'Qualified native inventory or served/encoded assets changed');
        }
        else {
          await verifyReference();
          assert(candidatePin && functionalPin, 'Fresh candidate and functional producers must pass before capture');
          const candidate = await verifyCandidate();
          assert.deepEqual(candidate.binding, candidatePin, 'Candidate changed after its producer');
          const receipt = await variantQualification({ root: currentLab, variant: candidate.variant, functionalReceipt: functionalPath });
          assert.deepEqual(receipt.source, functionalPin, 'Fresh variant receipt changed after qualification');
        }
      }
    },
    async after(task) {
      assert.equal(activeTask, task.id, 'Successful task lacks its matching pre-entry');
      assert.equal(task.id, plan[completed.length]?.id, 'Unexpected or duplicate successful task');
      if (task.id === stageId) {
        evidence.sourceBefore = await verifySources();
        for (const [workspaceRole, cwd] of Object.entries(roots)) await verifyWritableOutputs({ workspaceRole, cwd, command: [] });
        evidence.reference = await verifyReference();
        assert(await absent(functionalPath), 'Stage must not copy an old functional receipt');
      }
      if (task.id === 'native:prepare') await inventory(roots.native, systems);
      if (task.id === 'native:functional') {
        nativePin = await nativeBinding();
        evidence.nativeQualified = nativePin;
      }
      if (task.id === 'native:current-build') {
        await verifySources();
        candidatePin = (await verifyCandidate()).binding;
        evidence.candidate = candidatePin;
      }
      if (task.id === 'native:current-functional') {
        const candidate = await verifyCandidate();
        assert.deepEqual(candidate.binding, candidatePin, 'Candidate changed during qualification');
        const receipt = await variantQualification({ root: currentLab, variant: candidate.variant, functionalReceipt: functionalPath });
        functionalPin = receipt.source; evidence.functional = functionalPin;
      }
      completed.push(task.id);
      activeTask = undefined;
    },
    async finish() {
      assert.equal(completed.length, plan.length, 'Native graph is incomplete');
      evidence.sourceAfter = await verifySources();
      await verifyReference();
      assert.deepEqual(await nativeBinding(), nativePin, 'Qualified native inventory or served/encoded assets changed before final disposition');
      const candidate = await verifyCandidate();
      assert.deepEqual(candidate.binding, candidatePin, 'Candidate changed before final disposition');
      const receipt = await variantQualification({ root: currentLab, variant: candidate.variant, functionalReceipt: functionalPath });
      assert.deepEqual(receipt.source, functionalPin, 'Functional receipt changed before final disposition');
      return evidence;
    },
  };
}
