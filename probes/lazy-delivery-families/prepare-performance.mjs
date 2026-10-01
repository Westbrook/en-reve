/** Build the unchanged production docs consumers from two sealed, exact-lock sources. */
import { execFile } from 'node:child_process';
import { access, cp, lstat, mkdir, readFile, readdir, readlink, realpath, symlink, unlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { arch, platform, release } from 'node:os';
import { basename, delimiter, dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { withMachineOwner } from '../../tooling/testing/machine-owner.mjs';
import { withExecutionOwner } from '../../tooling/testing/execution-owner.mjs';
import { singlePackOutput } from '../../tooling/test-pipeline/npm-pack.mjs';
import { contained, copyInventory, digest, digestFile, inventory, inventoryFiles, json, selectedSourcePath, verifySource, writeJSON } from '../lazy-delivery-performance/source-seal.mjs';
import { acceptedReferenceHead, assertSourceSubjects, applyRoutePolicies, routeEntryAssets, routeSubjects, runtimeExclusions, runtimeInventory } from './route-build-contract.mjs';
import { applyCommandPolicyBridge } from './command-policy-controls.mjs';
import { applyColorPolicyBridge, colorControlBuildPolicy } from '../lazy-delivery-color/color-policy-controls.mjs';

// C1's remaining construction candidates failed their frozen necessary gates.
// Keep the historical builder/parser contracts intact; fresh acquisition is closed.
throw new Error('Fresh family preparation is retired: no route-construction candidates remain after the C1 combobox and command rejection. See probes/lazy-delivery-families/performance-protocol.md. Shared API/date Stage B remains separate.');

const execute = promisify(execFile), hostRoot = resolve(import.meta.dirname, '../..');
const names = ['tokens', 'styles', 'primitives', 'elements', 'ssr'];
const armDefinitions = [
  { id: 'reference', subject: 'reference', policy: 'eager' },
  { id: 'candidate', subject: 'candidate', policy: 'on-demand' },
  { id: 'rollback', subject: 'candidate', policy: 'eager' },
];

await withMachineOwner(() => withExecutionOwner(hostRoot, async () => {
  if (process.env.NODE_OPTIONS || process.env.NODE_PATH || process.env.ESBUILD_BINARY_PATH) throw new Error('Unset Node/bundler overrides before freezing matched production evidence');
  const options = new Map(process.argv.slice(2).map(arg => { const at = arg.indexOf('='); return at < 0 ? [arg, true] : [arg.slice(0, at), arg.slice(at + 1)]; }));
  if ([...options.keys()].some(key => !['--reference', '--candidate', '--out', '--toolchain', '--color-controls'].includes(key)) || !['--reference', '--candidate', '--out'].every(key => typeof options.get(key) === 'string') || options.has('--color-controls') && options.get('--color-controls') !== true) throw new Error('Usage: node prepare-performance.mjs --reference=/sealed-reference --candidate=/sealed-candidate --out=/new-output [--toolchain=/private/bin] [--color-controls]');
  const colorControls = options.get('--color-controls') === true;
  const requestedOut = resolve(options.get('--out')), out = resolve(await realpath(dirname(requestedOut)), basename(requestedOut));
  const subjects = { reference: await verifySource(options.get('--reference'), { reference: true }), candidate: await verifySource(options.get('--candidate'), { reference: true }) };
  assertSourceSubjects(subjects);
  for (const subject of Object.values(subjects)) if (contained(subject.snapshot, out)) throw new Error('Build output must be outside immutable source snapshots');
  for (const path of ['.node-version', '.nvmrc', '.python-version']) if (await digestFile(resolve(subjects.reference.source, path)) !== await digestFile(resolve(subjects.candidate.source, path))) throw new Error('Matched subjects have different runtime pins: ' + path);
  const harnessDirectory = 'probes/lazy-delivery-families';
  const harnessFiles = ['prepare-performance.mjs', 'packed-vite-build.mjs', 'route-build-contract.mjs', 'build-entry.mjs', 'command-policy-controls.mjs'];
  for (const path of [...harnessFiles.map(file => harnessDirectory + '/' + file), 'probes/lazy-delivery-color/color-policy-controls.mjs', 'probes/lazy-delivery-performance/source-seal.mjs', 'tooling/testing/machine-owner.mjs', 'tooling/testing/execution-owner.mjs', 'tooling/test-pipeline/npm-pack.mjs']) {
    if (await digestFile(resolve(hostRoot, path)) !== await digestFile(resolve(subjects.candidate.source, path))) throw new Error('Executing build harness differs from sealed candidate: ' + path);
  }
  const supportPaths = [
    'probes/lazy-delivery-performance/source-seal.mjs', 'probes/scoped-hydration/production/server.mjs',
    'showcases/performance/src/lock.mjs', 'showcases/performance/src/config.mjs',
    'showcases/performance/registry/systems.json', 'showcases/performance/profiles/profiles.json',
    'tooling/testing/machine-owner.mjs', 'tooling/testing/execution-owner.mjs', 'tooling/testing/runtime-identity.mjs',
    'tooling/evidence/setup.mjs', 'tooling/evidence/identity.ts', 'tooling/test-pipeline/npm-pack.mjs',
    'apps/docs/tests/static-server.mjs',
    'plans/lazy-delivery/family-designs.json', 'plans/lazy-delivery/editor.md', 'plans/lazy-delivery/budgets.json', 'plans/lazy-delivery/validation.md', 'plans/lazy-delivery/pagination.md', 'plans/lazy-delivery/color-popup.md',
    'package-lock.json', 'showcases/performance/package-lock.json',
  ];
  async function harnessIdentity() {
    const files = await inventoryFiles(subjects.candidate.source, supportPaths);
    for (const directory of [harnessDirectory, 'probes/lazy-delivery-editor', 'probes/lazy-delivery-color']) files.push(...(await inventory(resolve(subjects.candidate.source, directory))).map(file => ({ ...file, path: directory + '/' + file.path })));
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }
  const harness = await harnessIdentity();
  const budgets = await Promise.all(['plans/lazy-delivery/family-designs.json', 'plans/lazy-delivery/editor.md', 'plans/lazy-delivery/budgets.json', 'plans/lazy-delivery/validation.md', 'plans/lazy-delivery/pagination.md', 'plans/lazy-delivery/color-popup.md'].map(async path => ({ path, sha256: await digestFile(resolve(subjects.candidate.source, path)) })));
  // Preserve the exact omitted history list, bound to the same full Git tree as the source seal.
  const sourceReceipts = {};
  for (const [subjectName, subject] of Object.entries(subjects)) {
    const tree = (await execute('git', ['rev-parse', subject.seal.git.head + '^{tree}'], { cwd: hostRoot })).stdout.trim();
    if (tree !== subject.seal.git.tree) throw new Error('Cannot bind source omissions to the sealed Git tree: ' + subjectName);
    const paths = (await execute('git', ['ls-tree', '-r', '--name-only', '-z', subject.seal.git.head], { cwd: hostRoot, maxBuffer: 32 * 1024 * 1024 })).stdout.split('\0').filter(Boolean);
    const excludedPaths = paths.filter(path => !selectedSourcePath(path)).sort();
    if (digest(excludedPaths) !== subject.seal.selection.excludedPathsSha256) throw new Error('Source seal omission list does not match its complete Git tree');
    sourceReceipts[subjectName] = { snapshot: subject.snapshot, ...subject.seal, selection: { ...subject.seal.selection, excludedPaths } };
  }
  const toolchain = resolve(options.get('--toolchain') ?? resolve(hostRoot, '.toolchains/bin'));
  const node = await realpath(resolve(toolchain, 'node')), npm = await realpath(resolve(toolchain, 'npm')), npmRoot = dirname(dirname(npm));
  if (node !== await realpath(process.execPath)) throw new Error('Invoke the builder through the selected private Node runtime');
  if (process.version !== 'v' + (await readFile(resolve(subjects.candidate.source, '.node-version'), 'utf8')).trim()) throw new Error('Selected Node does not match the exact current runtime pin');
  const npmPackage = await json(resolve(npmRoot, 'package.json'));
  if ('npm@' + npmPackage.version !== (await json(resolve(subjects.candidate.source, 'package.json'))).packageManager) throw new Error('Selected npm does not match the package manager pin');
  let tar;
  for (const path of (process.env.PATH ?? '').split(delimiter)) {
    try { await access(resolve(path, 'tar'), constants.X_OK); tar = await realpath(resolve(path, 'tar')); break; }
    catch (error) { if (!['ENOENT', 'EACCES'].includes(error.code)) throw error; }
  }
  if (!tar) throw new Error('Archive extractor unavailable');
  async function runtimeIdentity() {
    const files = await inventory(npmRoot);
    return { node: { path: node, version: process.version, sha256: await digestFile(node), versions: process.versions }, npm: { path: npm, version: npmPackage.version, files, sha256: digest(files) }, tar: { path: tar, sha256: await digestFile(tar) }, platform: platform(), arch: arch(), release: release() };
  }
  const runtime = await runtimeIdentity();
  await mkdir(out, { recursive: false });
  await mkdir(resolve(out, 'logs')); await mkdir(resolve(out, 'npm-cache')); await mkdir(resolve(out, '_subjects'));
  await writeFile(resolve(out, 'npm-user-config'), ''); await writeFile(resolve(out, 'npm-global-config'), '');
  const environment = { ...process.env }, owners = new Set(['EN_TEST_EXECUTION_OWNER', 'EN_TEST_MACHINE_LOCK', 'EN_TEST_MACHINE_OWNER', 'EN_GATE_MACHINE_LOCK', 'EN_GATE_MACHINE_OWNER', 'EN_GATE_BROWSER_LOCK', 'EN_GATE_BROWSER_OWNER']);
  for (const key of Object.keys(environment)) if (/^npm_/i.test(key) || key.startsWith('EN_') && !owners.has(key) || ['NODE_OPTIONS', 'NODE_PATH', 'NODE_ENV', 'PWD', 'OLDPWD', 'INIT_CWD'].includes(key)) delete environment[key];
  Object.assign(environment, { PATH: [toolchain, dirname(node), process.env.PATH ?? ''].join(delimiter), TZ: 'UTC', LANG: 'C', LC_ALL: 'C', EN_SETUP_CACHE: 'off', npm_config_cache: resolve(out, 'npm-cache'), npm_config_userconfig: resolve(out, 'npm-user-config'), npm_config_globalconfig: resolve(out, 'npm-global-config'), npm_config_audit: 'false', npm_config_fund: 'false' });
  const commands = [], manifest = {
    schemaVersion: 1, kind: 'en-reve-lazy-delivery-actual-docs-build', status: 'building', created: new Date().toISOString(), acceptedReferenceHead, sources: sourceReceipts, arms: [],
    harness: { files: harness, sha256: digest(harness), builderFiles: harnessFiles, routeSubjects }, budgets, runtime,
    build: { colorControls: colorControlBuildPolicy(colorControls), method: 'Existing apps/docs/scripts/build-ssr.mjs with symmetric packed-resolution/graph instrumentation and a receipted command public-loader control bridge; complete production Vite client, SSR, document finalization and docs preparation. Optional --color-controls adds separately receipted main.ts access bridges to every arm for construction attribution and separate same-code control retention only.', gzipLevel: 6, registry: 'production-global', environmentSha256: digest(Object.fromEntries(Object.entries(environment).filter(([key]) => !owners.has(key)).sort(([a], [b]) => a.localeCompare(b)))) },
    policy: 'Two clean exact Git source subjects. Candidate and eager rollback share identical production archives. Declared authored policy tags select construction before SSR/client rendering; no query-time construction mutation or enlarged data. Every arm has the same receipted command loader bridge; cold preserves original route preparation, while supplemental preparation controls are explicitly instrumented policies. Color defaults to untouched production source; the separate --color-controls build is explicitly ineligible for production color benefit/startup/cold/prepared/unused/retention claims; separate same-code control retention remains applicable.',
  };
  await writeJSON(resolve(out, 'manifest.json'), manifest);
  async function command(label, executable, args, cwd) {
    const start = performance.now(), started = new Date().toISOString(); let result, failure;
    try { result = await execute(executable, args, { cwd, env: environment, maxBuffer: 64 * 1024 * 1024 }); } catch (error) { result = error; failure = error; }
    await writeFile(resolve(out, 'logs', label + '.stdout.log'), result.stdout ?? ''); await writeFile(resolve(out, 'logs', label + '.stderr.log'), result.stderr ?? '');
    commands.push({ label, executable, args, cwd: relative(out, cwd), started, completed: new Date().toISOString(), elapsedMs: performance.now() - start, exitCode: failure ? failure.code ?? 1 : 0, signal: result.signal ?? null });
    await writeJSON(resolve(out, 'commands.json'), commands);
    if (failure) throw new Error(label + ' failed; retain logs and use a fresh output for the next attempt', { cause: failure });
    return result.stdout;
  }
  const npmRun = (label, args, cwd) => command(label, node, [npm, ...args], cwd);
  async function verifyAuthored(root, files, overlays = []) {
    const expected = new Map(overlays.map(item => [item.path, item.executedSha256]));
    const actual = await inventoryFiles(root, files.map(file => file.path));
    for (let index = 0; index < files.length; index++) {
      const file = files[index], current = actual[index];
      if (expected.has(file.path) ? current.sha256 !== expected.get(file.path) : digest(file) !== digest(current)) throw new Error('Authored source mutated outside the declared overlay: ' + file.path);
    }
  }
  async function installIdentity(stage) {
    const lock = await json(resolve(stage, 'node_modules/.package-lock.json')), packages = [];
    for (const [path, entry] of Object.entries(lock.packages ?? {})) {
      if (!path || entry.link) continue;
      const file = resolve(stage, path, 'package.json'), pkg = await json(file);
      if (entry.version && pkg.version !== entry.version) throw new Error('Installed package version differs from lock: ' + path);
      packages.push({ path, name: pkg.name, version: pkg.version, integrity: entry.integrity ?? null, manifestSha256: await digestFile(file) });
    }
    return { installedLockSha256: await digestFile(resolve(stage, 'node_modules/.package-lock.json')), packages };
  }
  // Only source metadata needs workspace-relative declaration identities. Runtime
  // imports retain the arm/root packed installation and the existing graph guard.
  async function metadataPackageIdentity(packageRoot) {
    const files = [];
    async function visit(path) {
      const absolute = resolve(packageRoot, path), info = await lstat(absolute);
      const entry = { path, mode: info.mode & 0o777 };
      if (info.isDirectory()) {
        files.push({ ...entry, type: 'directory' });
        for (const name of (await readdir(absolute)).sort()) await visit(path + '/' + name);
      } else if (info.isFile()) files.push({ ...entry, type: 'file', bytes: info.size, sha256: await digestFile(absolute) });
      else throw new Error('Metadata declaration context requires ordinary package files: ' + absolute);
    }
    await visit('package.json'); await visit('dist');
    return files;
  }
  async function metadataResolutionIdentity(sourceRoot, production) {
    const directory = resolve(sourceRoot, 'packages/elements/node_modules'), scope = resolve(directory, '@en-reve');
    const link = resolve(scope, 'primitives'), workspacePackage = resolve(sourceRoot, 'packages/primitives');
    if (JSON.stringify((await readdir(directory)).sort()) !== JSON.stringify(['@en-reve']) || JSON.stringify((await readdir(scope)).sort()) !== JSON.stringify(['primitives'])) throw new Error('Unexpected source metadata resolution entry');
    const target = relative(scope, workspacePackage), resolved = await realpath(link);
    if (!(await lstat(link)).isSymbolicLink() || await readlink(link) !== target || resolved !== workspacePackage || resolved.includes('/node_modules/')) throw new Error('Metadata declaration link does not resolve to the arm workspace package');
    const roots = { qualifiedWorkspace: resolve(production.stage, 'packages/primitives'), packed: resolve(production.packedRoot, 'primitives'), armWorkspace: workspacePackage };
    const inputs = {};
    for (const [kind, packageRoot] of Object.entries(roots)) inputs[kind] = { root: relative(out, packageRoot), files: await metadataPackageIdentity(packageRoot) };
    if (digest(inputs.qualifiedWorkspace.files) !== digest(inputs.packed.files) || digest(inputs.armWorkspace.files) !== digest(inputs.packed.files)) throw new Error('Metadata workspace package differs from the qualified packed package (paths, bytes or modes)');
    return {
      schemaVersion: 1, kind: 'source-metadata-workspace-declarations', package: '@en-reve/primitives',
      scope: relative(out, directory), link: { path: relative(out, link), target, resolved: relative(out, resolved) },
      directoryModes: { nodeModules: (await lstat(directory)).mode & 0o777, scope: (await lstat(scope)).mode & 0o777 },
      packagesReceipt: production.receipt, packagesReceiptSha256: production.receiptSha256, inputs,
      policy: 'Unmodified source metadata checks use the original sibling declaration identity over byte- and mode-identical package.json/dist. Docs/root Node imports and all bundled runtime modules must still resolve to packed archives; no metadata normalization or precomputed API substitution.',
    };
  }
  const prepared = {}, armGraphs = {};
  async function preparePackedEntry(subjectName, id, specifier, directory, { family, kind, registration = false } = {}) {
    const production = prepared[subjectName], sourceRoot = production.stage, inputRoot = resolve(sourceRoot, '.performance-entry-inputs');
    const helperRoot = resolve(sourceRoot, '.performance-entry-harness');
    await mkdir(inputRoot, { recursive: true }); await mkdir(helperRoot, { recursive: true }); await mkdir(directory);
    for (const file of ['build-entry.mjs', 'packed-vite-build.mjs']) await cp(resolve(subjects.candidate.source, harnessDirectory, file), resolve(helperRoot, file));
    const entrySource = registration ? `import ${JSON.stringify(specifier)};\n` : `export * from ${JSON.stringify(specifier)};\n`;
    const entry = resolve(inputRoot, id + '.mjs'); await writeFile(entry, entrySource);
    const context = { sourceRoot, packedRoot: production.packedRoot, dependencyRoot: production.dependencyRoot, entry, outDir: resolve(directory, 'site'), evidenceDirectory: resolve(directory, 'graphs') };
    await writeJSON(resolve(directory, 'build-context.json'), context);
    await command(`${subjectName}-entry-${id}`, node, [resolve(helperRoot, 'build-entry.mjs'), resolve(directory, 'build-context.json')], sourceRoot);
    const graph = await json(resolve(directory, 'graphs/client-graph.json')), entries = graph.chunks.filter(chunk => chunk.isEntry);
    if (entries.length !== 1) throw new Error('Selective entry build must emit exactly one public entry: ' + id);
    const closure = new Set();
    function visit(path) {
      if (closure.has(path)) return;
      const chunk = graph.chunks.find(chunk => chunk.fileName === path); if (!chunk) throw new Error('Selective entry has a missing static chunk: ' + path);
      closure.add(path); for (const dependency of chunk.imports) visit(dependency);
    }
    visit(entries[0].fileName);
    const assets = [];
    for (const file of await inventory(resolve(directory, 'site'))) {
      const bytes = await readFile(resolve(directory, 'site', file.path));
      assets.push({ path: file.path, bytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 6 }).length, sha256: digest(bytes) });
    }
    const assetMap = new Map(assets.map(asset => [asset.path, asset]));
    for (const path of closure) if (!assetMap.has(path)) throw new Error('Selective entry graph was captured before final output: ' + path);
    const entryReceipt = { path: entries[0].fileName, assets: [...closure].sort(), gzipBytes: [...closure].reduce((sum, path) => sum + assetMap.get(path).gzipBytes, 0), requests: closure.size };
    const receipt = {
      schemaVersion: 1, subject: subjectName, family, kind, specifier, root: relative(out, directory),
      sourceSha256: subjects[subjectName].seal.sourceSha256, sealSha256: subjects[subjectName].seal.sealSha256, packagesReceipt: production.receipt, packagesReceiptSha256: production.receiptSha256,
      entrySource: { path: relative(out, entry), sha256: digest(entrySource) }, entry: entryReceipt, assets,
      graph: { path: 'graphs/client-graph.json', sha256: await digestFile(resolve(directory, 'graphs/client-graph.json')) },
      recipe: { bundler: 'Pinned exact-lock Vite production library mode', target: 'es2022', format: 'es', minify: true, literalTransform: 'Same production Lit template transform over packed inputs', gzipLevel: 6, externalDependencies: false },
      claim: registration ? 'Report table registration only; excluded from every measured production route.' : 'Deterministic packed selective-entry bytes, separate from real-route adoption, transfer and interaction evidence; no optional-code savings claim.',
    };
    await writeJSON(resolve(directory, 'receipt.json'), receipt);
    return { root: relative(out, directory), receipt: relative(out, resolve(directory, 'receipt.json')), receiptSha256: await digestFile(resolve(directory, 'receipt.json')), specifier, entry: entryReceipt, assets };
  }
  try {
    for (const [subjectName, subject] of Object.entries(subjects)) {
      const base = resolve(out, '_subjects', subjectName), stage = resolve(base, 'source'), packed = resolve(base, 'packed');
      await mkdir(base); await copyInventory(subject.source, stage, subject.seal.files); await mkdir(packed);
      await npmRun(subjectName + '-install', ['ci', '--no-audit', '--no-fund'], stage);
      await npmRun(subjectName + '-check-lazy', ['run', 'check:lazy'], stage);
      for (const name of names) await npmRun(`${subjectName}-build-${name}`, ['run', 'build', '--workspace', '@en-reve/' + name], stage);
      for (const [label, script] of [['cem', 'generate-elements.ts'], ['types', 'prepared-types.ts'], ['api', 'public-graph.ts']]) await command(`${subjectName}-check-${label}`, node, ['tooling/metadata/' + script, '--check'], stage);
      await npmRun(subjectName + '-check-customization', ['run', 'check:customization'], stage);
      await verifyAuthored(stage, subject.seal.files);
      const installation = await installIdentity(stage), packages = [];
      for (const name of names) {
        const stdout = await npmRun(`${subjectName}-pack-${name}`, ['pack', '--ignore-scripts', '--json', '--workspace', '@en-reve/' + name, '--pack-destination', packed], stage);
        const archive = singlePackOutput(stdout, '@en-reve/' + name), bytes = await readFile(resolve(packed, archive.filename));
        if (archive.integrity !== 'sha512-' + createHash('sha512').update(bytes).digest('base64') || archive.shasum !== createHash('sha1').update(bytes).digest('hex')) throw new Error('Production archive integrity mismatch: ' + name);
        const destination = resolve(stage, 'node_modules/@en-reve', name);
        if (!(await lstat(destination)).isSymbolicLink()) throw new Error('Fresh install did not create the expected isolated workspace link: ' + name);
        await unlink(destination); await mkdir(destination);
        await command(`${subjectName}-extract-${name}`, tar, ['-xzf', resolve(packed, archive.filename), '-C', destination, '--strip-components=1'], stage);
        const files = await inventory(destination);
        packages.push({ name: archive.name, version: archive.version, path: relative(out, resolve(packed, archive.filename)), sha256: digest(bytes), integrity: archive.integrity, files, filesSha256: digest(files) });
      }
      const compilerNative = (await command(subjectName + '-compiler-path', node, ['--input-type=module', '-e', "import getExePath from './node_modules/typescript/lib/getExePath.js'; console.log(getExePath())"], stage)).trim();
      const compiler = { version: (await command(subjectName + '-compiler-version', node, ['node_modules/typescript/bin/tsc', '--version'], stage)).trim(), native: relative(stage, compilerNative), nativeSha256: await digestFile(compilerNative), entrySha256: await digestFile(resolve(stage, 'node_modules/typescript/bin/tsc')) };
      const receipt = { schemaVersion: 1, subject: subjectName, sourceSha256: subject.seal.sourceSha256, sealSha256: subject.seal.sealSha256, packages, installation, compiler };
      await writeJSON(resolve(base, 'packages.json'), receipt);
      const runtimeFiles = await runtimeInventory(resolve(stage, 'node_modules'));
      const runtimeTree = { schemaVersion: 1, root: relative(out, resolve(stage, 'node_modules')), files: runtimeFiles, sha256: digest(runtimeFiles), exactLockSha256: subject.seal.rootLockSha256, installedLockSha256: installation.installedLockSha256, exclusions: runtimeExclusions };
      await writeJSON(resolve(base, 'runtime-tree.json'), runtimeTree);
      prepared[subjectName] = { stage, packedRoot: resolve(stage, 'node_modules/@en-reve'), dependencyRoot: resolve(stage, 'node_modules'), receipt: relative(out, resolve(base, 'packages.json')), receiptSha256: await digestFile(resolve(base, 'packages.json')), packages, runtimeTree, runtimeReceipt: relative(out, resolve(base, 'runtime-tree.json')), runtimeReceiptSha256: await digestFile(resolve(base, 'runtime-tree.json')) };
    }
    manifest.selectiveEntries = {};
    for (const subjectName of Object.keys(subjects)) {
      manifest.selectiveEntries[subjectName] = {};
      const directory = resolve(out, '_subjects', subjectName, 'entry-analysis'); await mkdir(directory);
      for (const { id: family, tag } of routeSubjects) {
        const name = tag.slice('en-'.length);
        manifest.selectiveEntries[subjectName][family] = {};
        for (const [kind, specifier] of [['class', `@en-reve/elements/${name}.js`], ['definition', `@en-reve/elements/definitions/${name}.js`]]) {
          manifest.selectiveEntries[subjectName][family][kind] = await preparePackedEntry(subjectName, `${family}-${kind}`, specifier, resolve(directory, `${family}-${kind}`), { family, kind });
        }
      }
    }
    for (const arm of armDefinitions) {
      const subject = subjects[arm.subject], production = prepared[arm.subject];
      const root = resolve(out, arm.id), sourceRoot = resolve(production.stage, 'performance-docs-arms', arm.id), evidenceDirectory = resolve(sourceRoot, '.performance-build');
      await mkdir(root); await mkdir(dirname(sourceRoot), { recursive: true }); await copyInventory(subject.source, sourceRoot, subject.seal.files);
      await symlink(relative(sourceRoot, production.dependencyRoot), resolve(sourceRoot, 'node_modules'), 'dir');
      // Existing docs generators read these explicit built-package paths. Mirror archive bytes, never rebuild a second library.
      for (const name of names) await cp(resolve(production.packedRoot, name, 'dist'), resolve(sourceRoot, 'packages', name, 'dist'), { recursive: true, errorOnExist: true, force: false });
      // The source-only elements checker follows this nested link; docs consumers
      // and packed packages still resolve through the unchanged root node_modules.
      const metadataScope = resolve(sourceRoot, 'packages/elements/node_modules/@en-reve');
      await mkdir(dirname(metadataScope)); await mkdir(metadataScope);
      await symlink(relative(metadataScope, resolve(sourceRoot, 'packages/primitives')), resolve(metadataScope, 'primitives'), 'dir');
      const metadataResolution = await metadataResolutionIdentity(sourceRoot, production);
      await writeJSON(resolve(root, 'metadata-resolution.json'), metadataResolution);
      const overlays = await applyRoutePolicies(sourceRoot, arm.policy, { reference: arm.id === 'reference' });
      overlays.push(await applyCommandPolicyBridge(sourceRoot));
      if (colorControls) overlays.push(await applyColorPolicyBridge(sourceRoot, {subject: arm.subject}));
      const overlayDirectory = resolve(root, 'overlays'); await mkdir(overlayDirectory);
      for (const item of overlays) {
        await mkdir(dirname(resolve(overlayDirectory, 'original', item.path)), { recursive: true }); await mkdir(dirname(resolve(overlayDirectory, 'executed', item.path)), { recursive: true });
        await cp(resolve(subject.source, item.path), resolve(overlayDirectory, 'original', item.path)); await cp(resolve(sourceRoot, item.path), resolve(overlayDirectory, 'executed', item.path));
      }
      const helperRoot = resolve(sourceRoot, '.performance-harness'); await mkdir(helperRoot);
      await cp(resolve(subjects.candidate.source, harnessDirectory, 'packed-vite-build.mjs'), resolve(helperRoot, 'packed-vite-build.mjs'));
      const context = { sourceRoot, packedRoot: production.packedRoot, dependencyRoot: production.dependencyRoot, evidenceDirectory };
      async function adapt(path, replacements) {
        const original = await readFile(resolve(sourceRoot, path), 'utf8'); let executed = original;
        for (const [before, after] of replacements) {
          if (executed.split(before).length !== 2) throw new Error('Production build adapter preimage changed: ' + path + ': ' + before);
          executed = executed.replace(before, after);
        }
        await writeFile(resolve(sourceRoot, path), executed);
        await mkdir(dirname(resolve(overlayDirectory, 'original', path)), { recursive: true }); await mkdir(dirname(resolve(overlayDirectory, 'executed', path)), { recursive: true });
        await writeFile(resolve(overlayDirectory, 'original', path), original); await writeFile(resolve(overlayDirectory, 'executed', path), executed);
        overlays.push({ kind: 'symmetric-production-build-adapter', path, originalSha256: digest(original), executedSha256: digest(executed), replacements: replacements.map(([before, after]) => ({ before, after })) });
      }
      await adapt('apps/docs/scripts/build-ssr.mjs', [
        ["import { build } from 'vite';", `import { build as originalViteBuild } from 'vite';\nimport { packedBuild } from '../../../.performance-harness/packed-vite-build.mjs';\nconst build = options => packedBuild(originalViteBuild, options, ${JSON.stringify(context)});`],
        ["resolve(workspaceRoot, 'packages')", JSON.stringify(production.packedRoot)],
        ["const serverOutput = resolve(workspaceRoot, 'node_modules/.cache/en-reve-docs-ssr');", "const serverOutput = resolve(workspaceRoot, '.performance-ssr');"],
      ]);
      await adapt('apps/docs/vite.config.ts', [["new URL('../../packages/', import.meta.url)", `new URL(${JSON.stringify(pathToFileURL(production.packedRoot + '/').href)})`]]);
      await writeJSON(resolve(root, 'overlays.json'), overlays);
      const nodeEntries = Object.fromEntries(names.map(name => ['@en-reve/' + name, '@en-reve/' + name + (name === 'primitives' ? '/interactions/registration.js' : '')]));
      async function resolvePackedPackages(label, cwd) {
        const packages = JSON.parse(await command(label, node, ['--input-type=module', '-e', `console.log(JSON.stringify(Object.fromEntries(Object.entries(${JSON.stringify(nodeEntries)}).map(([name,entry])=>[name,import.meta.resolve(entry)]))))`], cwd));
        for (const [name, url] of Object.entries(packages)) if (!contained(resolve(production.packedRoot, name.slice('@en-reve/'.length)), await realpath(fileURLToPath(url)))) throw new Error('Docs Node import resolves outside its packed package: ' + name);
        return packages;
      }
      const resolvedPackages = await resolvePackedPackages(arm.id + '-node-package-roots', sourceRoot);
      const resolvedDocsPackages = await resolvePackedPackages(arm.id + '-docs-node-package-roots', resolve(sourceRoot, 'apps/docs'));
      await command(arm.id + '-docs-preparation', node, ['apps/docs/scripts/prepare-docs.mjs'], sourceRoot);
      await command(arm.id + '-docs-types', node, [resolve(production.dependencyRoot, 'typescript/bin/tsc'), '--noEmit', '-p', 'apps/docs/tsconfig.json'], sourceRoot);
      await command(arm.id + '-production-docs', node, ['apps/docs/scripts/build-ssr.mjs'], sourceRoot);
      await verifyAuthored(sourceRoot, subject.seal.files, overlays);
      if (digest(await metadataResolutionIdentity(sourceRoot, production)) !== digest(metadataResolution)) throw new Error('Metadata declaration context changed during docs preparation/build');
      await cp(resolve(sourceRoot, 'dist'), resolve(root, 'site'), { recursive: true, errorOnExist: true, force: false });
      await cp(resolve(sourceRoot, '.performance-ssr'), resolve(root, 'ssr'), { recursive: true, errorOnExist: true, force: false });
      await writeJSON(resolve(root, 'ssr/package.json'), { type: 'module', private: true });
      await symlink(relative(root, production.dependencyRoot), resolve(root, 'node_modules'), 'dir');
      await cp(evidenceDirectory, resolve(root, 'graphs'), { recursive: true });
      const clientGraph = await json(resolve(root, 'graphs/client-graph.json')), serverGraph = await json(resolve(root, 'graphs/server-graph.json'));
      const normalizeModule = id => id.replaceAll(production.packedRoot, '@en-reve').replaceAll(production.dependencyRoot, 'node_modules').replaceAll(sourceRoot, '<docs>');
      const packageGraph = graph => graph.modules.filter(module => module.ownership === 'packed-library').map(module => ({ path: relative(production.packedRoot, module.path), sha256: module.sha256, imports: module.imports.map(normalizeModule).sort(), dynamicImports: module.dynamicImports.map(normalizeModule).sort() })).sort((a, b) => a.path.localeCompare(b.path));
      armGraphs[arm.id] = { client: packageGraph(clientGraph), server: packageGraph(serverGraph) };
      const assets = [];
      for (const file of await inventory(resolve(root, 'site'))) { const bytes = await readFile(resolve(root, 'site', file.path)); assets.push({ path: file.path, bytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 6 }).length, sha256: digest(bytes) }); }
      const assetMap = new Map(assets.map(asset => [asset.path, asset]));
      const ssrAssets = (await inventory(resolve(root, 'ssr'))).map(file => ({ path: `${arm.id}/ssr/${file.path}`, bytes: file.bytes, sha256: file.sha256 }));
      const { parse } = await import(pathToFileURL(resolve(production.dependencyRoot, 'parse5/dist/index.js')));
      const routes = {};
      for (const descriptor of routeSubjects) {
        const html = await readFile(resolve(root, 'site', descriptor.route.slice(1)), 'utf8');
        const entry = routeEntryAssets(html, descriptor.route, clientGraph, parse);
        for (const path of entry.assets) if (!assetMap.has(path)) throw new Error('Route graph references an absent asset: ' + path);
        routes[descriptor.route] = {
          subject: descriptor.id, workload: descriptor.workload, population: descriptor.population,
          html: assetMap.get(descriptor.route.slice(1)), entry: { ...entry, gzipBytes: entry.assets.reduce((sum, path) => sum + assetMap.get(path).gzipBytes, 0), requests: entry.assets.length },
          ssr: descriptor.ssr.supported ? { ...descriptor.ssr, entry: `${arm.id}/ssr/render-entry.mjs`, outputRoot: `${arm.id}/ssr`, receipt: `${arm.id}/receipt.json`, timing: 'Retained production endpoint only; preparation is not a timing acquisition or qualification.' } : descriptor.ssr,
        };
      }
      const receipt = {
        schemaVersion: 1, ...arm, root: arm.id, registry: 'production-global', colorControls: manifest.build.colorControls, routeSubjects: routeSubjects.map(subject => subject.id), routes, assets,
        sourceSha256: subject.seal.sourceSha256, sealSha256: subject.seal.sealSha256, packagesReceipt: production.receipt, packagesReceiptSha256: production.receiptSha256,
        packages: production.packages.map(({ name, version, path, sha256, integrity }) => ({ name, version, path, sha256, integrity })),
        selectiveEntries: manifest.selectiveEntries[arm.subject],
        nodePackageRoots: resolvedPackages, docsNodePackageRoots: resolvedDocsPackages, overlays: 'overlays.json', overlaysSha256: await digestFile(resolve(root, 'overlays.json')),
        metadataResolution: 'metadata-resolution.json', metadataResolutionSha256: await digestFile(resolve(root, 'metadata-resolution.json')),
        ssr: { entry: `${arm.id}/ssr/render-entry.mjs`, exportName: 'renderWorkflows', args: ['selection'], outputRoot: `${arm.id}/ssr`, sourceSealSha256: subject.seal.sealSha256, sourceSha256: subject.seal.sourceSha256, runtimeLockSha256: subject.seal.rootLockSha256, runtimeReceipt: production.runtimeReceipt, runtimeReceiptSha256: production.runtimeReceiptSha256, assets: ssrAssets, policy: 'Exact production renderer and sibling chunks; isolated exact-lock external dependencies resolve through the retained arm node_modules link. Import/bootstrap and render timing are separate.' },
        graphs: { client: { path: 'graphs/client-graph.json', sha256: await digestFile(resolve(root, 'graphs/client-graph.json')) }, server: { path: 'graphs/server-graph.json', sha256: await digestFile(resolve(root, 'graphs/server-graph.json')) } },
        packedGraph: armGraphs[arm.id], assetPolicy: 'Whole existing Vite docs output, including existing SSR finalization. Entry bytes are parsed HTML plus static emitted JavaScript dependencies only; settled dynamic traffic remains a separate browser measurement.',
      };
      await writeJSON(resolve(root, 'receipt.json'), receipt);
      manifest.arms.push({ ...arm, root: arm.id, routeSubjects: routeSubjects.map(subject => subject.id), receipt: `${arm.id}/receipt.json`, receiptSha256: await digestFile(resolve(root, 'receipt.json')) });
    }
    if (digest(armGraphs.candidate) !== digest(armGraphs.rollback)) throw new Error('Construction policy changed the candidate/rollback packed module graph');
    const reportAssets = await preparePackedEntry('candidate', 'report-table', '@en-reve/elements/define/table.js', resolve(out, 'candidate/report-assets'), { family: 'report', kind: 'registration', registration: true });
    manifest.reportAssets = { ...reportAssets, entry: reportAssets.entry.path, entryClosure: reportAssets.entry };
    manifest.rollback = { identicalProductionArchives: true, identicalPackedModuleGraphs: true, candidates: ['candidate', 'rollback'], changes: 'Authored content-rendering values at the declared combobox and command targets in two existing route templates. Same canonical imports and registration graph.' };
    for (const [name, subject] of Object.entries(subjects)) {
      await verifySource(subject.snapshot, { reference: true }); await verifyAuthored(prepared[name].stage, subject.seal.files);
      if (digest(await runtimeInventory(prepared[name].dependencyRoot)) !== prepared[name].runtimeTree.sha256) throw new Error('Installed runtime bytes changed during production docs builds: ' + name);
    }
    if (digest(await runtimeIdentity()) !== digest(runtime)) throw new Error('Private runtime changed during matched docs preparation');
    if (digest(await harnessIdentity()) !== digest(harness)) throw new Error('Frozen harness changed during preparation');
    manifest.status = 'complete'; manifest.completed = new Date().toISOString(); manifest.commandsSha256 = await digestFile(resolve(out, 'commands.json')); manifest.manifestSha256 = digest(manifest);
    await writeJSON(resolve(out, 'manifest.json'), manifest);
    console.log(JSON.stringify({ out, arms: manifest.arms.map(arm => arm.id), routes: routeSubjects.map(subject => subject.route), manifestSha256: manifest.manifestSha256 }));
  } catch (error) {
    manifest.status = 'failed'; manifest.failed = new Date().toISOString(); manifest.error = String(error.stack ?? error); await writeJSON(resolve(out, 'manifest.json'), manifest); throw error;
  }
}));
