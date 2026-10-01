/** Output-only adapter for the frozen actual-docs build. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {mkdir, readFile, readdir, readlink, realpath, lstat, symlink, writeFile} from 'node:fs/promises';
import {basename, dirname, isAbsolute, relative, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const args = new Map(process.argv.slice(2).map(value => {const at = value.indexOf('='); return [value.slice(0, at), value.slice(at + 1)];}));
assert(args.size === 2 && args.has('--prepared') && args.has('--out') && process.argv.length === 4,
  'Usage: node probes/lazy-delivery-color/prepare-inputs.mjs --prepared=/absolute/frozen-docs --out=/absolute/fresh-color-inputs');
assert(isAbsolute(args.get('--prepared')) && isAbsolute(args.get('--out')), 'Use absolute paths.');
assert(!process.env.NODE_OPTIONS && !process.env.NODE_PATH, 'Unset Node module overrides.');
const prepared = await realpath(args.get('--prepared'));
const out = resolve(await realpath(dirname(args.get('--out'))), basename(args.get('--out')));
const within = (base, path) => {const local = relative(base, path); return local === '' || local !== '..' && !local.startsWith('..' + sep) && !isAbsolute(local);};
assert(!within(prepared, out) && !within(out, prepared), 'Output and prepared input roots must be disjoint.');
function local(base, name) {
  assert(typeof name === 'string' && name && !isAbsolute(name), 'Expected a relative path.');
  const path = resolve(base, name);
  assert(within(base, path) && path !== base && relative(base, path).split(sep).join('/') === name, 'Unsafe or noncanonical path: ' + name);
  return path;
}
const inputs = new Map(), linkInputs = [], inputTrees = [];
async function bytes(path, expected) {
  path = resolve(path); const value = await readFile(path), hash = sha(value);
  if (arguments.length > 1) {assert(/^[a-f0-9]{64}$/.test(expected), 'Missing mandatory frozen fingerprint: ' + path); assert.equal(hash, expected, 'Input hash mismatch: ' + path);}
  const prior = inputs.get(path); if (prior) assert.equal(prior.sha256, hash, 'Input changed during extraction: ' + path);
  inputs.set(path, {path, bytes: value.length, sha256: hash}); return value;
}
const json = async (path, ...expected) => JSON.parse(await bytes(path, ...expected));
async function files(root, prefix = '', excluded = [], allowLinks = false) {
  const result = [];
  for (const item of await readdir(root, {withFileTypes: true})) {
    const name = prefix + item.name;
    if (excluded.some(path => name === path || name.startsWith(path + '/'))) continue;
    if (item.isDirectory()) result.push(...await files(resolve(root, item.name), name + '/', excluded, allowLinks));
    else {assert(item.isFile() || allowLinks && item.isSymbolicLink(), 'Expected regular files, not links: ' + name); result.push(name);}
  }
  return result.sort();
}
async function verifyInventory(root, inventory, exact = false, excluded = []) {
  assert(Array.isArray(inventory) && inventory.length, 'Missing file inventory.');
  assert.equal(new Set(inventory.map(item => item.path)).size, inventory.length, 'Duplicate inventory paths.');
  if (exact) {
    const names = inventory.map(item => item.path).sort(), allowLinks = inventory.some(item => item.type === 'symlink');
    assert.deepEqual(await files(root, '', excluded, allowLinks), names, 'Inventory file set differs.');
    inputTrees.push({root, names, excluded, allowLinks});
  }
  for (const item of inventory) {
    assert(/^[a-f0-9]{64}$/.test(item.sha256), 'Missing file SHA-256.');
    const path = local(root, item.path);
    if (item.type === 'symlink') {
      assert.equal(await readlink(path), item.target); assert.equal(sha(item.target), item.sha256);
      assert(within(root, await realpath(path)), 'Input link escapes its root.');
      linkInputs.push({path, target: item.target, realpath: await realpath(path)});
    } else {
      assert((await lstat(path)).isFile(), 'Expected a regular input file: ' + path);
      const value = await bytes(path, item.sha256);
      if (item.bytes !== undefined) assert.equal(value.length, item.bytes, 'Input byte size mismatch.');
      if (item.gzipBytes !== undefined) assert.equal(gzipSync(value, {level: 6}).length, item.gzipBytes, 'Frozen gzip-6 size mismatch.');
    }
  }
}
const manifestPath = resolve(prepared, 'manifest.json');
const manifest = await json(manifestPath);
const {manifestSha256, ...manifestPayload} = manifest;
assert.equal(manifest.kind, 'en-reve-lazy-delivery-actual-docs-build');
assert.equal(manifest.status, 'complete'); assert.equal(sha(manifestPayload), manifestSha256, 'Build manifest self-seal mismatch.');
assert.equal(process.version, manifest.runtime.node.version);
await bytes(process.execPath, manifest.runtime.node.sha256);
await bytes(fileURLToPath(import.meta.url));
assert.equal(manifest.sources.reference.git.head, 'fba5ec19b58606cf1776df44862a38a3898f4c72');
assert.equal(manifest.sources.reference.rootLockSha256, manifest.sources.candidate.rootLockSha256);
assert.equal(manifest.sources.reference.performanceLockSha256, manifest.sources.candidate.performanceLockSha256);
const route = '/api-examples/composable-chat.html';
const optionalNames = ['color-picker', 'swatch', 'tab', 'tab-panel', 'tabs'];
const optionalSpecs = optionalNames.map(name => '@en-reve/elements/definitions/' + name + '.js');
const results = {}, wrappers = [], parserRecords = [];
let gatePlan;
// Bootstrap only the existing lease helpers from their exact immutable candidate source.
// The command recorder does not own resources; all heavy reads/parser work stays inside both leases.
const workspace = await realpath(process.cwd()), bootstrapSource = manifest.sources.candidate;
const bootstrapSnapshot = await realpath(bootstrapSource.snapshot);
const immutableRoots = [prepared, ...await Promise.all(['reference', 'candidate'].map(name => realpath(manifest.sources[name].snapshot)))];
const disjointInputs = path => immutableRoots.every(root => !within(root, path) && !within(path, root));
assert(disjointInputs(workspace) && disjointInputs(out), 'Checkout and output must be disjoint from all immutable inputs.');
async function prospectiveRealpath(path) {
  try {return await realpath(path);} catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = dirname(path); assert.notEqual(parent, path);
    return resolve(await prospectiveRealpath(parent), basename(path));
  }
}
const executionLeaseTarget = await prospectiveRealpath(resolve(workspace, 'node_modules/.cache/test-execution-owner.json'));
assert(disjointInputs(executionLeaseTarget), 'Execution lease would write through a link into immutable inputs.');
const bootstrapSeal = await json(resolve(bootstrapSnapshot, 'source-seal.json'));
const {sealSha256: bootstrapSha, ...bootstrapPayload} = bootstrapSeal;
assert.equal(sha(bootstrapPayload), bootstrapSha); assert.equal(bootstrapSha, bootstrapSource.sealSha256);
assert.equal(sha(bootstrapSeal.files), bootstrapSource.sourceSha256);
const leasePaths = ['tooling/testing/machine-owner.mjs', 'tooling/testing/execution-owner.mjs'];
for (const path of leasePaths) await bytes(resolve(bootstrapSnapshot, 'source', path), bootstrapSeal.files.find(item => item.path === path)?.sha256);
const {withMachineOwner, machineOwnerPath} = await import(pathToFileURL(resolve(bootstrapSnapshot, 'source', leasePaths[0])));
const {withExecutionOwner} = await import(pathToFileURL(resolve(bootstrapSnapshot, 'source', leasePaths[1])));
assert(disjointInputs(await prospectiveRealpath(machineOwnerPath())), 'Machine lease would write into immutable inputs.');
await withMachineOwner(machine => withExecutionOwner(workspace, async execution => {

for (const armName of ['reference', 'candidate']) {
  const arm = manifest.arms.find(item => item.id === armName);
  assert(arm && arm.subject === armName && arm.root === armName, 'Missing distinct matched arm.');
  const receiptPath = local(prepared, arm.receipt), receiptBytes = await bytes(receiptPath, arm.receiptSha256), receipt = JSON.parse(receiptBytes);
  const source = manifest.sources[armName]; assert.equal(source.git.dirty, false); assert(!source.git.status);
  assert.equal(receipt.sourceSha256, source.sourceSha256); assert.equal(receipt.sealSha256, source.sealSha256);
  const snapshot = await realpath(source.snapshot);
  assert(!within(snapshot, out) && !within(out, snapshot), 'Output overlaps sealed source.');
  const seal = await json(resolve(snapshot, 'source-seal.json'));
  const {sealSha256, ...sealPayload} = seal;
  assert.equal(sha(sealPayload), sealSha256); assert.equal(sealSha256, source.sealSha256);
  assert.equal(sha(seal.files), source.sourceSha256); assert.deepEqual(seal.git, source.git);
  await verifyInventory(resolve(snapshot, 'source'), seal.files, true);
  for (const [field, path] of [['rootLockSha256', 'package-lock.json'], ['performanceLockSha256', 'showcases/performance/package-lock.json']]) {
    assert.equal(source[field], seal[field], 'Declared source lock differs from seal.');
    await bytes(resolve(snapshot, 'source', path), seal[field]);
  }
  if (armName === 'candidate') {
    const path = resolve(snapshot, 'source/plans/lazy-delivery/color-popup.md');
    const value = await bytes(path);
    assert(value.toString().includes('at least 4,096 gzip bytes AND at least 10%'), 'Frozen color byte gate changed; source review required.');
    gatePlan = {path, sha256: sha(value), minimumMatchedStartupGzipSavingBytes: 4096, minimumMatchedStartupGzipSavingFraction: .10};
  }
  const armRoot = local(prepared, arm.root), site = await realpath(resolve(armRoot, 'site'));
  assert(within(prepared, site), 'Prepared site escapes build root.');
  assert(Array.isArray(receipt.assets) && receipt.assets.every(item => Number.isSafeInteger(item.bytes) && item.bytes >= 0 && Number.isSafeInteger(item.gzipBytes) && item.gzipBytes >= 0), 'Assets require finite nonnegative raw and gzip-6 sizes.');
  await verifyInventory(site, receipt.assets, true);
  const graph = await json(local(armRoot, receipt.graphs.client.path), receipt.graphs.client.sha256);
  assert.equal(graph.schemaVersion, 1); assert.equal(graph.phase, 'client'); assert.deepEqual(graph.externals, []);
  const modules = new Map(graph.modules.map(item => [item.id, item]));
  const chunks = new Map(graph.chunks.map(item => [item.fileName, item]));
  assert.equal(modules.size, graph.modules.length); assert.equal(chunks.size, graph.chunks.length);
  for (const module of modules.values()) {
    assert(within(prepared, await realpath(module.path)), 'Graph source outside retained prepared root.');
    await bytes(module.path, module.sha256);
  }
  for (const chunk of chunks.values()) {
    local(site, chunk.fileName); assert(chunk.fileName.endsWith('.js'));
    assert(receipt.assets.some(item => item.path === chunk.fileName), 'Graph chunk absent from inventory.');
  }
  const packages = await json(local(prepared, receipt.packagesReceipt), receipt.packagesReceiptSha256);
  assert.equal(packages.subject, armName);
  assert.equal(packages.sourceSha256, source.sourceSha256); assert.equal(packages.sealSha256, source.sealSha256);
  for (const pkg of packages.packages) {
    const archive = await bytes(local(prepared, pkg.path), pkg.sha256);
    assert.equal('sha512-' + createHash('sha512').update(archive).digest('base64'), pkg.integrity);
  }
  const runtime = await json(local(prepared, receipt.ssr.runtimeReceipt), receipt.ssr.runtimeReceiptSha256);
  assert.equal(runtime.exactLockSha256, source.rootLockSha256); assert.equal(sha(runtime.files), runtime.sha256);
  assert.equal(runtime.installedLockSha256, packages.installation.installedLockSha256);
  const runtimeRoot = await realpath(local(prepared, runtime.root));
  assert(within(prepared, runtimeRoot));
  assert.deepEqual(runtime.exclusions, ['.cache', '.bin', '.vite', '.vite-temp', '@en-reve/docs'], 'Unknown runtime exclusions.');
  await verifyInventory(runtimeRoot, runtime.files, true, runtime.exclusions);
  await bytes(resolve(runtimeRoot, '.package-lock.json'), runtime.installedLockSha256);
  const armModules = await realpath(resolve(armRoot, 'node_modules')); assert.equal(armModules, runtimeRoot);
  linkInputs.push({path: resolve(armRoot, 'node_modules'), realpath: armModules});
  // Import the existing exact prepared parser installation only after binding its full recorded tree.
  const parse5Path = local(runtimeRoot, 'parse5/dist/index.js');
  const tsPath = local(runtimeRoot, '@typescript/typescript6/lib/typescript.js');
  const {parse} = await import(pathToFileURL(parse5Path));
  const tsModule = await import(pathToFileURL(tsPath)), ts = tsModule.default ?? tsModule;
  const parse5Package = await json(local(runtimeRoot, 'parse5/package.json'));
  const tsPackage = await json(local(runtimeRoot, '@typescript/typescript6/package.json'));
  const tsBackingPackage = await json(local(runtimeRoot, '@typescript/old/package.json'));
  parserRecords.push({arm: armName, runtimeReceipt: receipt.ssr.runtimeReceipt, runtimeReceiptSha256: receipt.ssr.runtimeReceiptSha256,
    runtimeRoot, runtimeTreeSha256: runtime.sha256, parse5: {entry: parse5Path, version: parse5Package.version},
    typescript: {entry: tsPath, declaredVersion: tsPackage.version, executingVersion: ts.version, backingVersion: tsBackingPackage.version}});
  function one(values, label) {assert.equal(values.length, 1, 'Expected one ' + label + ', found ' + values.length); return values[0];}
  function docsModule(suffix) {return one(graph.modules.filter(item => item.ownership === 'docs-source' && item.path.endsWith('/apps/docs/' + suffix)), suffix);}
  const main = docsModule('src/api-example/main.ts'), registry = docsModule('src/generated/api-example-definitions.js');
  const sourceDisplay = docsModule('src/generated/composable-chat-source.js');
  const elementsPackage = one(packages.packages.filter(item => item.name === '@en-reve/elements'), 'elements package');
  const elementsRoot = local(runtimeRoot, '@en-reve/elements');
  await verifyInventory(elementsRoot, elementsPackage.files, true);
  const elementsManifest = await json(resolve(elementsRoot, 'package.json'));
  function dependency(importer, spec, dynamic = true) {
    let target;
    if (spec.startsWith('@en-reve/elements/')) {
      const subpath = './' + spec.slice('@en-reve/elements/'.length), pattern = './*.js';
      // This is the package's frozen declared export, not an emitted filename convention.
      const mapping = elementsManifest.exports[pattern]; assert.equal(mapping?.import, './dist/*.js');
      assert(subpath.endsWith('.js')); target = resolve(elementsRoot, mapping.import.replace('*', subpath.slice(2, -3)));
    } else {
      assert(spec.startsWith('.'), 'Unexpected selected import: ' + spec);
      const path = resolve(dirname(importer.path), spec);
      target = one(graph.modules.filter(item => item.path === path || item.path === path.replace(/\.js$/, '.ts')), 'relative import ' + spec).path;
    }
    const item = one(graph.modules.filter(item => item.path === target), 'resolved source ' + spec);
    assert((dynamic ? importer.dynamicImports : importer.imports).includes(item.id), 'Graph lacks declared source import edge: ' + spec);
    return {importer: importer.id, specifier: spec, moduleId: item.id, sourcePath: item.path, sourceSha256: item.sha256};
  }
  function emitted(binding) {
    const facades = graph.chunks.filter(chunk => chunk.facadeModuleId === binding.moduleId);
    const matches = facades.length ? facades : graph.chunks.filter(chunk => chunk.moduleIds.includes(binding.moduleId));
    const names = [...new Set(matches.map(chunk => chunk.fileName))].sort();
    assert.equal(names.length, 1, 'Source root has missing/ambiguous emitted ownership: ' + binding.specifier);
    return {...binding, emitted: names[0]};
  }
  function closure(roots) {
    const found = new Set();
    function visit(name) {if (found.has(name)) return; const chunk = chunks.get(name); assert(chunk, 'Missing emitted static edge: ' + name); found.add(name); chunk.imports.forEach(visit);}
    roots.forEach(visit); return [...found].sort();
  }
  function ast(module) {const text = (awaitedSources.get(module.id)).toString(); const tree = ts.createSourceFile(module.path, text, ts.ScriptTarget.Latest, true, module.path.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS); assert(!tree.parseDiagnostics.length, 'Source parse failed.'); return tree;}
  const awaitedSources = new Map();
  for (const module of [main, registry, sourceDisplay]) awaitedSources.set(module.id, await bytes(module.path, module.sha256));
  function nodes(tree, predicate) {const values = []; function visit(node) {if (predicate(node)) values.push(node); ts.forEachChild(node, visit);} visit(tree); return values;}
  function imports(tree) {return nodes(tree, node => ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword).map(node => {assert.equal(node.arguments.length, 1); assert(ts.isStringLiteral(node.arguments[0]), 'Computed import is unsupported.'); return node.arguments[0].text;});}
  const registryTree = ast(registry);
  const declaration = one(nodes(registryTree, node => ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'exampleDefinitions'), 'exampleDefinitions declaration');
  assert(ts.isObjectLiteralExpression(declaration.initializer));
  const property = one(declaration.initializer.properties.filter(node => ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name) && node.name.text === 'composable-chat'), 'selected registry property');
  assert(ts.isArrowFunction(property.initializer));
  const selectedImports = imports(property.initializer); assert(selectedImports.length);
  const selected = selectedImports.map(spec => emitted(dependency(registry, spec)));
  const mainTree = ast(main), mainImports = imports(mainTree);
  const sourceSpec = '../generated/composable-chat-source.js';
  assert.equal(mainImports.filter(spec => spec === sourceSpec).length, 1);
  const sourceBinding = emitted(dependency(main, sourceSpec)); assert.equal(sourceBinding.moduleId, sourceDisplay.id);
  // Fail closed if the reviewed direct startup import forms acquire a new kind.
  assert(mainImports.every(spec => /^\.\.\/generated\/[a-z-]+-source\.js$/.test(spec) || ['@en-reve/elements/define/button.js', '@en-reve/elements/define/select.js'].includes(spec)), 'Unreviewed main dynamic import.');
  const htmlBytes = await bytes(resolve(site, route.slice(1))), document = parse(htmlBytes.toString());
  const htmlRoots = new Set(); let standalone = false;
  function visitHTML(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(item => [item.name, item.value]));
    function add(value) {const url = new URL(value, 'https://fixture.invalid' + route); assert.equal(url.origin, 'https://fixture.invalid'); assert(!url.search && !url.hash); htmlRoots.add(decodeURIComponent(url.pathname).slice(1));}
    if ((attrs.class ?? '').split(/\s+/).includes('api-standalone-tools')) standalone = true;
    if (node.tagName === 'script' && (!attrs.type || ['module', 'text/javascript', 'application/javascript'].includes(attrs.type))) {
      if (attrs.src) add(attrs.src); else assert(!(node.childNodes ?? []).some(child => child.value?.trim()), 'Inline executable needs explicit source mapping.');
    }
    if (node.tagName === 'link' && attrs.href && ((attrs.rel ?? '').split(/\s+/).includes('modulepreload') || (attrs.rel ?? '').split(/\s+/).includes('preload') && attrs.as === 'script')) add(attrs.href);
    for (const child of node.childNodes ?? []) visitHTML(child);
  }
  visitHTML(document); assert(htmlRoots.size && standalone, 'Expected actual standalone production route.');
  const review = ['button', 'select'].map(name => {
    const spec = '@en-reve/elements/define/' + name + '.js'; assert.equal(mainImports.filter(item => item === spec).length, 1);
    return emitted(dependency(main, spec));
  });
  const startup = closure([...htmlRoots, ...selected.map(item => item.emitted), sourceBinding.emitted, ...review.map(item => item.emitted)]);
  const mainChunks = graph.chunks.filter(chunk => chunk.moduleIds.includes(main.id) || chunk.facadeModuleId === main.id);
  assert(mainChunks.length && mainChunks.every(chunk => startup.includes(chunk.fileName)), 'Actual main absent from startup closure.');
  const shared = ['dist/color-picker/color.js', 'dist/color-picker/color-value.js'].map(suffix => {
    const module = one(graph.modules.filter(item => item.path === resolve(elementsRoot, suffix)), 'eager color utility ' + suffix);
    const chunk = emitted({moduleId: module.id, specifier: suffix, sourcePath: module.path, sourceSha256: module.sha256});
    assert(startup.includes(chunk.emitted), 'Shared parsing/serialization/paint utility became optional: ' + suffix); return chunk;
  });
  let optional = [];
  if (armName === 'candidate') {
    const helper = docsModule('src/composable-chat-color-delivery.ts'), ownership = docsModule('src/composable-chat-color-ownership.mjs');
    awaitedSources.set(helper.id, await bytes(helper.path, helper.sha256));
    awaitedSources.set(ownership.id, await bytes(ownership.path, ownership.sha256));
    assert.deepEqual(imports(ast(helper)).sort(), [...optionalSpecs].sort(), 'Candidate literal definition roots changed.');
    const owner = one(nodes(ast(ownership), node => ts.isPropertyAssignment(node) && node.name.getText() === 'optionalTags'), 'optionalTags ownership');
    assert(ts.isCallExpression(owner.initializer) && owner.initializer.expression.getText() === 'Object.freeze');
    const tags = owner.initializer.arguments[0]; assert(ts.isArrayLiteralExpression(tags));
    assert(tags.elements.every(item => ts.isStringLiteral(item)));
    assert.deepEqual(tags.elements.map(item => item.text).sort(), optionalNames.map(name => 'en-' + name).sort());
    optional = optionalSpecs.map(spec => emitted(dependency(helper, spec)));
  } else {
    for (const name of optionalNames) assert(selectedImports.includes('@en-reve/elements/define/' + name + '.js'), 'Reference no longer registers eager optional controls.');
  }
  const optionalClosure = closure(optional.map(item => item.emitted));
  const optionalUnique = optionalClosure.filter(name => !startup.includes(name));
  results[armName] = {source: {git: source.git, sourceSha256: source.sourceSha256, sealSha256: source.sealSha256},
    receipt: {path: receiptPath, sha256: sha(receiptBytes)}, graph: {path: local(armRoot, receipt.graphs.client.path), sha256: receipt.graphs.client.sha256},
    html: {path: resolve(site, route.slice(1)), sha256: sha(htmlBytes)}, htmlRoots: [...htmlRoots].sort(), selected, sourceDisplay: sourceBinding, review,
    sharedEagerColorUtilities: shared, startup, optionalRoots: optional, optionalClosure, optionalShared: optionalClosure.filter(name => startup.includes(name)), optionalUnique,
    startupAssets: startup.map(path => receipt.assets.find(item => item.path === path)), optionalAssets: optionalUnique.map(path => receipt.assets.find(item => item.path === path))};
  wrappers.push({armName, site, receiptBytes, assets: receipt.assets});
}
const totals = assets => ({files: assets.length, rawBytes: assets.reduce((sum, item) => sum + item.bytes, 0), gzipBytes: assets.reduce((sum, item) => sum + item.gzipBytes, 0)});
const referenceStartup = totals(results.reference.startupAssets), candidateStartup = totals(results.candidate.startupAssets);
const uniqueOptional = totals(results.candidate.optionalAssets);
const matchedSavingBytes = referenceStartup.gzipBytes - candidateStartup.gzipBytes;
assert(referenceStartup.gzipBytes > 0, 'Empty actual startup denominator.');
const matchedSavingFraction = matchedSavingBytes / referenceStartup.gzipBytes;
const staticByteGatePass = matchedSavingBytes >= gatePlan.minimumMatchedStartupGzipSavingBytes && matchedSavingFraction >= gatePlan.minimumMatchedStartupGzipSavingFraction;
const optionalRootsAlreadyInStartup = results.candidate.optionalRoots.filter(item => results.candidate.startup.includes(item.emitted));
const eligibility = {gatePlan, referenceStartup, candidateStartup, uniqueOptional, matchedSavingBytes, matchedSavingFraction, staticByteGatePass,
  optionalRootsAlreadyInStartup, coldProbeApplicable: results.candidate.optionalUnique.length > 0 && optionalRootsAlreadyInStartup.length === 0,
  nextStep: !staticByteGatePass ? 'Stop this candidate on the necessary static byte gate; preserve complete attribution. No cold acquisition.'
    : !results.candidate.optionalUnique.length || optionalRootsAlreadyInStartup.length ? 'Cold mechanism is inapplicable: optional definitions already reached startup or no unique optional code remains. Preserve attribution; no cold acquisition.'
    : 'Static necessary gate passes; observed startup traffic and matched cold acquisition remain required.',
  limitation: 'Matched emitted per-file gzip-6 totals include all selected startup overhead. They are not observed requests, transfer bytes, production compression or achieved wire savings.'};
// Cross-arm comparison is by frozen source identity, never by unrelated emitted hashed names.
const referenceSourcePaths = new Set(results.reference.selected.map(item => item.specifier));
assert(optionalNames.every(name => referenceSourcePaths.has('@en-reve/elements/define/' + name + '.js')));
for (const binding of inputs.values()) assert.equal(sha(await readFile(binding.path)), binding.sha256, 'Input changed before output: ' + binding.path);
for (const item of linkInputs) {assert.equal(await realpath(item.path), item.realpath, 'Input link changed.'); if (item.target) assert.equal(await readlink(item.path), item.target);}
for (const item of inputTrees) assert.deepEqual(await files(item.root, '', item.excluded, item.allowLinks), item.names, 'Input file set changed.');
await mkdir(out, {recursive: false});
const outputs = [];
async function output(name, value) {const data = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value, null, 2) + '\n'); await writeFile(local(out, name), data, {flag: 'wx'}); outputs.push({path: name, bytes: data.length, sha256: sha(data)});}
for (const wrapper of wrappers) {
  await mkdir(resolve(out, wrapper.armName));
  await output(wrapper.armName + '/receipt.json', wrapper.receiptBytes);
  await output(wrapper.armName + '/assets.json', wrapper.assets);
  await symlink(wrapper.site, resolve(out, wrapper.armName, 'site'), 'dir');
  outputs.push({path: wrapper.armName + '/site', type: 'symlink', target: wrapper.site, sha256: sha(wrapper.site)});
}
await output('optional-assets.json', results.candidate.optionalUnique);
for (const binding of inputs.values()) assert.equal(sha(await readFile(binding.path)), binding.sha256, 'Input changed while writing wrappers: ' + binding.path);
for (const item of linkInputs) {assert.equal(await realpath(item.path), item.realpath); if (item.target) assert.equal(await readlink(item.path), item.target);}
for (const item of inputTrees) assert.deepEqual(await files(item.root, '', item.excluded, item.allowLinks), item.names, 'Input file set changed during output.');
for (const item of outputs) {
  if (item.type === 'symlink') assert.equal(await readlink(local(out, item.path)), item.target);
  else assert.equal(sha(await readFile(local(out, item.path))), item.sha256, 'Output readback mismatch.');
}
const producer = {schemaVersion: 1, kind: 'en-reve-color-cold-assets', status: 'complete', created: new Date().toISOString(), prepared, route,
  method: 'Source-owned five pure definition roots mapped by actual bundled module IDs into emitted static chunk closures; subtract the complete candidate selected-route startup closure. Reference eager closure is derived independently. Shared color utilities must remain in each startup closure. Source-display strings are never interpreted as executable dependencies.',
  claim: 'Static attribution and probe input adaptation only. No observed code-cold state, traffic saving, timing result or qualification.',
  reviewedStartupPolicy: 'Actual HTML script/modulepreload + main static graph + selected generated registry property + composable-chat source display + standalone review button/select. Theme interaction and unopened source-highlighting dynamic branches are not startup; all other dynamic branches remain outside this selected route.',
  runtime: {node: {path: process.execPath, version: process.version, versions: process.versions}, parsers: parserRecords},
  leases: {workspace, machine, execution, helpers: leasePaths.map(path => resolve(bootstrapSnapshot, 'source', path))},
  inputsUnchanged: true, outputsReadbackVerified: true,
  inputs: [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path)), inputLinks: linkInputs, arms: results, eligibility, outputs};
producer.producerSha256 = sha(producer); await output('producer.json', producer);
await output('producer.sha256.json', {path: 'producer.json', sha256: outputs.find(item => item.path === 'producer.json').sha256});
console.log(JSON.stringify({out, optionalAssets: results.candidate.optionalUnique.length, producer: resolve(out, 'producer.json'),
  staticByteGatePass, coldProbeApplicable: eligibility.coldProbeApplicable, nextStep: eligibility.nextStep}));
}));
