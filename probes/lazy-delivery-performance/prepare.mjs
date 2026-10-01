/** Fresh matched package builds. Run only under the campaign owner's serial build lease. */
import { execFile } from 'node:child_process';
import { access, cp, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, delimiter, relative, resolve, sep } from 'node:path';
import { arch, platform, release } from 'node:os';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { singlePackOutput } from '../../tooling/test-pipeline/npm-pack.mjs';
import { withMachineOwner } from '../../tooling/testing/machine-owner.mjs';
import { withExecutionOwner } from '../../tooling/testing/execution-owner.mjs';
import { contained, copyInventory, digest, digestFile, inventory, inventoryFiles, json, verifySource, writeJSON } from './source-seal.mjs';

const execute = promisify(execFile), hostRoot = resolve(import.meta.dirname, '../..');
const packageNames = ['tokens', 'styles', 'primitives', 'elements', 'ssr'];
await withMachineOwner(() => withExecutionOwner(hostRoot, async () => {
if (process.env.ESBUILD_BINARY_PATH || process.env.NODE_OPTIONS || process.env.NODE_PATH) throw new Error('Unset ESBUILD_BINARY_PATH, NODE_OPTIONS and NODE_PATH before freezing production evidence');
const options = new Map(process.argv.slice(2).map(arg => { const at = arg.indexOf('='); return at < 0 ? [arg, true] : [arg.slice(0, at), arg.slice(at + 1)]; }));
if ([...options.keys()].some(key => !['--reference', '--candidate', '--out', '--toolchain'].includes(key)) || !['--reference', '--candidate', '--out'].every(key => typeof options.get(key) === 'string')) {
  throw new Error('Usage: node prepare.mjs --reference=/sealed-reference --candidate=/sealed-candidate --out=/fresh-output [--toolchain=/private/bin]');
}
const out = resolve(options.get('--out'));
const subjects = {
  reference: await verifySource(options.get('--reference'), { reference: true }),
  candidate: await verifySource(options.get('--candidate')),
};
for (const subject of Object.values(subjects)) if (contained(subject.snapshot, out)) throw new Error('Build output must be outside sealed snapshots');
if (subjects.reference.seal.rootLockSha256 !== subjects.candidate.seal.rootLockSha256 || subjects.reference.seal.performanceLockSha256 !== subjects.candidate.seal.performanceLockSha256) {
  throw new Error('Matched campaign requires identical exact root and harness locks; qualify a dependency/toolchain change separately');
}
for (const path of ['.node-version', '.nvmrc', '.python-version']) {
  if (digest(await readFile(resolve(subjects.reference.source, path))) !== digest(await readFile(resolve(subjects.candidate.source, path)))) throw new Error('Matched runtime pin changed: ' + path);
}
const candidateSource = subjects.candidate.source;
const harnessPath = 'probes/lazy-delivery-performance';
for (const path of [`${harnessPath}/prepare.mjs`, `${harnessPath}/source-seal.mjs`, 'tooling/test-pipeline/npm-pack.mjs', 'tooling/testing/machine-owner.mjs', 'tooling/testing/execution-owner.mjs']) {
  if (digest(await readFile(resolve(hostRoot, path))) !== digest(await readFile(resolve(candidateSource, path)))) throw new Error('Executing harness differs from the sealed candidate: ' + path);
}
const harnessSources = await inventory(resolve(candidateSource, harnessPath));
const fixtureSources = await inventory(resolve(candidateSource, harnessPath, 'app'));
const budgetsPath = 'plans/lazy-delivery/budgets.json';
const budgets = { path: budgetsPath, sha256: digest(await readFile(resolve(candidateSource, budgetsPath))) };
const toolchain = resolve(options.get('--toolchain') ?? resolve(hostRoot, '.toolchains/bin'));
const node = await realpath(resolve(toolchain, process.platform === 'win32' ? 'node.exe' : 'node'));
if (node !== await realpath(process.execPath)) throw new Error('Run this freezer with the selected private Node runtime');
const npm = await realpath(resolve(toolchain, process.platform === 'win32' ? 'npm.cmd' : 'npm'));
const expectedNode = (await readFile(resolve(candidateSource, '.node-version'), 'utf8')).trim();
if (process.version !== 'v' + expectedNode) throw new Error('Performance requires the current runtime pin: ' + expectedNode);
const expectedNpm = (await json(resolve(candidateSource, 'package.json'))).packageManager.replace(/^npm@/, '');
const npmRoot = dirname(dirname(npm));
const npmPackage = await json(resolve(npmRoot, 'package.json'));
if (npmPackage.name !== 'npm' || npmPackage.version !== expectedNpm) throw new Error('Selected npm differs from the exact packageManager pin');
async function findExecutable(name) {
  for (const directory of (process.env.PATH ?? '').split(delimiter)) {
    const path = resolve(directory, name);
    try { await access(path, constants.X_OK); return await realpath(path); }
    catch (error) { if (!['ENOENT', 'EACCES'].includes(error.code)) throw error; }
  }
  throw new Error('Required executable unavailable: ' + name);
}
const tar = await findExecutable('tar');
async function runtimeIdentity() {
  const npmFiles = await inventory(npmRoot);
  return {
    node: { path: node, version: process.version, sha256: await digestFile(node), versions: process.versions },
    npm: { path: npm, version: npmPackage.version, files: npmFiles, sha256: digest(npmFiles) },
    tar: { path: tar, sha256: await digestFile(tar) },
    platform: platform(), arch: arch(), osRelease: release(),
  };
}
const runtime = await runtimeIdentity();
await mkdir(out, { recursive: false }); // No resume, overwrite, or selective replacement of failed subjects.
await mkdir(resolve(out, 'logs'));
await mkdir(resolve(out, 'npm-cache'));
await writeFile(resolve(out, 'npm-user-config'), '');
await writeFile(resolve(out, 'npm-global-config'), '');
const environment = { ...process.env };
const ownershipVariables = new Set(['EN_TEST_EXECUTION_OWNER', 'EN_TEST_MACHINE_LOCK', 'EN_TEST_MACHINE_OWNER', 'EN_GATE_MACHINE_LOCK', 'EN_GATE_MACHINE_OWNER', 'EN_GATE_BROWSER_LOCK', 'EN_GATE_BROWSER_OWNER']);
for (const name of Object.keys(environment)) {
  if (/^npm_/i.test(name) || (name.startsWith('EN_') && !ownershipVariables.has(name)) || ['NODE_OPTIONS', 'NODE_PATH', 'INIT_CWD', 'PWD', 'OLDPWD', 'NODE_ENV'].includes(name)) delete environment[name];
}
Object.assign(environment, {
  PATH: [toolchain, dirname(node), process.env.PATH ?? ''].join(delimiter),
  TZ: 'UTC', LANG: 'C', LC_ALL: 'C', EN_SETUP_CACHE: 'off',
  npm_config_cache: resolve(out, 'npm-cache'), npm_config_userconfig: resolve(out, 'npm-user-config'), npm_config_globalconfig: resolve(out, 'npm-global-config'),
  npm_config_audit: 'false', npm_config_fund: 'false',
});
const commands = [];
async function command(label, executable, args, cwd, extra = {}) {
  const started = new Date().toISOString(), start = performance.now();
  let result, failure;
  try { result = await execute(executable, args, { cwd, env: { ...environment, ...extra }, maxBuffer: 64 * 1024 * 1024 }); }
  catch (error) { result = error; failure = error; }
  await writeFile(resolve(out, 'logs', label + '.stdout.log'), result.stdout ?? '');
  await writeFile(resolve(out, 'logs', label + '.stderr.log'), result.stderr ?? '');
  const receipt = { label, executable, args, cwd: relative(out, cwd), started, finished: new Date().toISOString(), elapsedMs: performance.now() - start, exitCode: failure ? failure.code ?? 1 : 0, signal: result.signal ?? null };
  commands.push(receipt); await writeJSON(resolve(out, 'commands.json'), commands);
  if (failure) throw new Error(`${label} failed; inspect logs/${label}.stderr.log`, { cause: failure });
  return result.stdout;
}
const npmRun = (label, args, cwd) => command(label, node, [npm, ...args], cwd);
const manifest = {
  schemaVersion: 1, kind: 'en-reve-lazy-delivery-matched-build', status: 'building', created: new Date().toISOString(),
  sources: Object.fromEntries(Object.entries(subjects).map(([name, subject]) => [name, { snapshot: subject.snapshot, ...subject.seal }])),
  runtime, harness: { files: harnessSources, sha256: digest(harnessSources), fixtures: fixtureSources, fixtureSha256: digest(fixtureSources) }, budgets,
  build: { bundle: true, splitting: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true, gzipLevel: 6, environmentSha256: digest(Object.fromEntries(Object.entries(environment).filter(([key]) => !ownershipVariables.has(key)).sort(([left], [right]) => left.localeCompare(right)))) },
  variants: [], comparisons: [],
  policy: 'Fresh isolated exact-lock installs; packed production packages; one frozen harness/build configuration; no retired cache or historical compatibility overlays. Timing and retention are separate subsequent acquisitions.',
};
await writeJSON(resolve(out, 'manifest.json'), manifest);

async function installedIdentity(root) {
  const lock = await json(resolve(root, 'node_modules/.package-lock.json')), packages = [];
  for (const [path, entry] of Object.entries(lock.packages ?? {})) {
    if (!path || entry.link) continue;
    const file = resolve(root, path, 'package.json');
    const bytes = await readFile(file), pkg = JSON.parse(bytes);
    if (entry.version && pkg.version !== entry.version) throw new Error('Installed package differs from exact lock: ' + path);
    packages.push({ path, name: pkg.name, version: pkg.version, integrity: entry.integrity ?? null, resolved: entry.resolved ?? null, manifestSha256: digest(bytes) });
  }
  return { installedLockSha256: digest(await readFile(resolve(root, 'node_modules/.package-lock.json'))), packages };
}
async function unchangedAuthoredSource(root, expected) {
  const actual = await inventoryFiles(root, expected.map(file => file.path));
  if (digest(actual) !== digest(expected)) {
    const changed = expected.filter((file, index) => digest(file) !== digest(actual[index])).map(file => file.path);
    throw new Error('Install/build changed sealed source or regenerated stale tracked artifacts: ' + changed.join(', '));
  }
}
function publicVariant(variant) {
  return Object.fromEntries(Object.entries(variant).filter(([key]) => key !== 'selected' && key !== 'define'));
}

try {
  const harnessInstall = resolve(out, 'harness');
  await mkdir(harnessInstall);
  for (const name of ['package.json', 'package-lock.json']) await cp(resolve(candidateSource, 'showcases/performance', name), resolve(harnessInstall, name));
  await npmRun('harness-install', ['ci', '--no-audit', '--no-fund'], harnessInstall);
  const buildModule = resolve(harnessInstall, 'node_modules/esbuild/lib/main.js');
  const { build } = await import(pathToFileURL(buildModule));
  const esbuildFiles = await inventory(resolve(harnessInstall, 'node_modules/esbuild'));
  const harnessDependencies = await installedIdentity(harnessInstall);
  const nativeEsbuild = harnessDependencies.packages.filter(pkg => pkg.name.startsWith('@esbuild/'));
  if (nativeEsbuild.length !== 1) throw new Error('Expected one locally installed esbuild native platform package');
  const nativeFiles = await inventory(resolve(harnessInstall, nativeEsbuild[0].path));
  manifest.harness.installation = { ...harnessDependencies, esbuild: { files: esbuildFiles, sha256: digest(esbuildFiles), nativeFiles, nativeSha256: digest(nativeFiles) } };
  const { variants, comparisons = [] } = await import(pathToFileURL(resolve(candidateSource, harnessPath, 'app/variants.mjs')));
  if (!Array.isArray(variants) || !variants.length || new Set(variants.map(value => value.id)).size !== variants.length) throw new Error('Fixture variants must have unique identities');
  manifest.comparisons = comparisons;

  for (const [subjectName, subject] of Object.entries(subjects)) {
    const stage = resolve(out, subjectName, 'source'), pack = resolve(out, subjectName, 'packed');
    await mkdir(resolve(out, subjectName));
    await copyInventory(subject.source, stage, subject.seal.files);
    await npmRun(subjectName + '-install', ['ci', '--no-audit', '--no-fund'], stage);
    await npmRun(subjectName + '-check-lazy', ['run', 'check:lazy'], stage);
    for (const name of packageNames) await npmRun(`${subjectName}-build-${name}`, ['run', 'build', '--workspace', '@en-reve/' + name], stage);
    // Verify existing committed metadata before any regeneration. The freezer never repairs its inputs.
    for (const [label, path] of [['cem', 'generate-elements.ts'], ['types', 'prepared-types.ts'], ['api', 'public-graph.ts']]) {
      await command(`${subjectName}-check-${label}`, node, ['tooling/metadata/' + path, '--check'], stage);
    }
    await npmRun(subjectName + '-check-customization', ['run', 'check:customization'], stage);
    await unchangedAuthoredSource(stage, subject.seal.files);
    const dependencies = await installedIdentity(stage);
    const compilerRoot = resolve(stage, 'node_modules/typescript');
    const compilerEntry = resolve(compilerRoot, 'bin/tsc');
    const compilerNative = (await command(subjectName + '-compiler-path', node, ['--input-type=module', '-e', "import getExePath from './node_modules/typescript/lib/getExePath.js'; console.log(getExePath())"], stage)).trim();
    const compilerVersion = (await command(subjectName + '-compiler-version', node, [compilerEntry, '--version'], stage)).trim();
    const compiler = { version: compilerVersion, entry: relative(stage, compilerEntry), entrySha256: digest(await readFile(compilerEntry)), native: relative(stage, compilerNative), nativeSha256: digest(await readFile(compilerNative)), manifestSha256: digest(await readFile(resolve(compilerRoot, 'package.json'))) };
    await mkdir(pack);
    // External dependencies resolve through the arm's exact-lock install, never the live checkout.
    // Placing the consumer below source makes ordinary Node resolution reproduce that closure.
    const packedConsumer = resolve(stage, 'performance-consumer');
    await mkdir(resolve(packedConsumer, 'node_modules/@en-reve'), { recursive: true });
    await writeJSON(resolve(packedConsumer, 'package.json'), { name: 'en-reve-packed-performance-consumer', private: true, type: 'module' });
    const packages = [];
    for (const name of packageNames) {
      const stdout = await npmRun(`${subjectName}-pack-${name}`, ['pack', '--ignore-scripts', '--json', '--workspace', '@en-reve/' + name, '--pack-destination', pack], stage);
      const archive = singlePackOutput(stdout, '@en-reve/' + name), bytes = await readFile(resolve(pack, archive.filename));
      if (archive.integrity !== 'sha512-' + createHash('sha512').update(bytes).digest('base64') || archive.shasum !== createHash('sha1').update(bytes).digest('hex')) throw new Error('Packed archive integrity mismatch: ' + name);
      const destination = resolve(packedConsumer, 'node_modules/@en-reve', name); await mkdir(destination);
      await command(`${subjectName}-extract-${name}`, tar, ['-xzf', resolve(pack, archive.filename), '-C', destination, '--strip-components=1'], stage);
      const contents = await inventory(destination);
      packages.push({ name: archive.name, version: archive.version, filename: archive.filename, path: `${subjectName}/packed/${archive.filename}`, integrity: archive.integrity, shasum: archive.shasum, sha256: digest(bytes), files: contents, filesSha256: digest(contents) });
    }
    const subjectReceipt = { schemaVersion: 1, subject: subjectName, sourceSha256: subject.seal.sourceSha256, sealSha256: subject.seal.sealSha256, git: subject.seal.git, dependencies, compiler, packages };
    await writeJSON(resolve(out, subjectName, 'packages.json'), subjectReceipt);
    const packagesReceiptSha256 = digest(await readFile(resolve(out, subjectName, 'packages.json')));
    for (const variant of variants.filter(value => value.subject === subjectName)) {
      if (!/^[a-z0-9-]+$/.test(variant.fixture) || variant.id !== subjectName + '/' + variant.fixture || !/^[a-z0-9-]+\.mjs$/.test(variant.entry)) throw new Error('Unsafe or inconsistent fixture identity');
      const fixtureRoot = resolve(packedConsumer, variant.fixture), root = `${subjectName}/${variant.fixture}`, site = resolve(out, root, 'site');
      await cp(resolve(candidateSource, harnessPath, 'app'), fixtureRoot, { recursive: true, errorOnExist: true, force: false });
      await writeFile(resolve(fixtureRoot, 'selected.mjs'), variant.selected);
      await mkdir(site, { recursive: true });
      const result = await build({
        absWorkingDir: fixtureRoot, entryPoints: { boot: resolve(fixtureRoot, variant.entry) }, outdir: site,
        bundle: true, splitting: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true,
        metafile: true, chunkNames: 'assets/[name]-[hash]', assetNames: 'assets/[name]-[hash]',
        define: { __POLICY__: JSON.stringify(variant.policy), __FAMILY__: JSON.stringify(variant.family), ...variant.define },
      });
      const html = (await readFile(resolve(fixtureRoot, 'index.html'), 'utf8')).replaceAll('__ENTRY__', './boot.js');
      await writeFile(resolve(site, 'index.html'), html);
      await writeJSON(resolve(out, root, 'metafile.json'), result.metafile);
      const inputs = Object.keys(result.metafile.inputs).map(path => resolve(fixtureRoot, path));
      const packageInputs = inputs.filter(path => path.includes(sep + '@en-reve' + sep));
      if (!packageInputs.length || packageInputs.some(path => !contained(resolve(packedConsumer, 'node_modules/@en-reve'), path))) throw new Error('Fixture resolved library inputs outside packed production archives: ' + variant.id);
      for (const input of inputs) {
        const actual = await realpath(input);
        const fixtureInput = contained(fixtureRoot, actual);
        const packedInput = contained(resolve(packedConsumer, 'node_modules/@en-reve'), actual);
        const externalInput = contained(resolve(stage, 'node_modules'), actual) && !contained(resolve(stage, 'node_modules/@en-reve'), actual);
        if (!fixtureInput && !packedInput && !externalInput) throw new Error(`Fixture borrowed an input outside frozen fixture/packed/exact-lock roots: ${variant.id}: ${actual}`);
      }
      const outputs = new Map(Object.entries(result.metafile.outputs).map(([path, output]) => [resolve(fixtureRoot, path), output]));
      const entry = resolve(site, 'boot.js'), startup = new Set();
      function visit(file, seen = startup) {
        if (seen.has(file)) return;
        const output = outputs.get(file); if (!output) throw new Error('Missing emitted static dependency: ' + file);
        seen.add(file);
        for (const item of output.imports) if (!item.external && item.kind !== 'dynamic-import') visit(resolve(fixtureRoot, item.path), seen);
        if (output.cssBundle) visit(resolve(fixtureRoot, output.cssBundle), seen);
      }
      visit(entry);
      const declaredShell = new Set(startup);
      if (variant.family === 'date' && !['eager', 'construction'].includes(variant.policy)) {
        const shellEntries = [...outputs].filter(([, output]) => Object.keys(output.inputs).some(path => /\/elements\/dist\/date-picker-shell\.js$/.test(path.replaceAll('\\', '/'))));
        if (!shellEntries.length) throw new Error('Date shell entry is absent from the emitted graph: ' + variant.id);
        for (const [file] of shellEntries) visit(file, declaredShell);
      }
      const assets = [];
      for (const file of await inventory(site)) {
        const bytes = await readFile(resolve(site, file.path));
        assets.push({ path: file.path, bytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 6 }).length, sha256: digest(bytes), startup: startup.has(resolve(site, file.path)), declaredShell: declaredShell.has(resolve(site, file.path)) });
      }
      const startupInputs = [...new Set([...startup].flatMap(path => Object.keys(outputs.get(path).inputs)))];
      const declaredShellInputs = [...new Set([...declaredShell].flatMap(path => Object.keys(outputs.get(path).inputs)))];
      if (variant.family === 'date') {
        const includesCalendar = declaredShellInputs.some(path => /\/elements\/dist\/calendar\//.test(path.replaceAll('\\', '/')));
        if (['eager', 'construction'].includes(variant.policy) !== includesCalendar) throw new Error('Date eager/shell startup graph violated: ' + variant.id);
      }
      const receipt = {
        schemaVersion: 1, ...publicVariant(variant), root, entry: 'site/index.html',
        sourceSha256: subject.seal.sourceSha256, packagesReceipt: `${subjectName}/packages.json`, packagesReceiptSha256,
        packages: packages.map(({ name, version, path, sha256, integrity }) => ({ name, version, path, sha256, integrity })),
        fixtureSha256: digest(fixtureSources), selectedSha256: digest(variant.selected), metafileSha256: digest(await readFile(resolve(out, root, 'metafile.json'))),
        assets, startupFiles: assets.filter(file => file.startup).map(file => file.path), startupInputs,
        startupBytes: assets.filter(file => file.startup).reduce((sum, file) => sum + file.bytes, 0),
        startupGzipBytes: assets.filter(file => file.startup).reduce((sum, file) => sum + file.gzipBytes, 0),
        declaredShellFiles: assets.filter(file => file.declaredShell).map(file => file.path), declaredShellInputs,
        declaredShellBytes: assets.filter(file => file.declaredShell).reduce((sum, file) => sum + file.bytes, 0),
        declaredShellGzipBytes: assets.filter(file => file.declaredShell).reduce((sum, file) => sum + file.gzipBytes, 0),
        emittedBytes: assets.reduce((sum, file) => sum + file.bytes, 0), emittedGzipBytes: assets.reduce((sum, file) => sum + file.gzipBytes, 0),
        sizePolicy: 'Startup is the static JavaScript/CSS import closure of boot.js, excluding HTML and dynamic imports. Declared shell additionally includes the date shell and its static dependencies when loaded dynamically during boot; actual startup traffic remains a browser measurement. Gzip is level 6 per asset. Emitted includes index.html and all optional assets.',
      };
      await writeJSON(resolve(out, root, 'receipt.json'), receipt);
      manifest.variants.push({ ...publicVariant(variant), root, entry: 'site/index.html', receipt: `${root}/receipt.json`, receiptSha256: digest(await readFile(resolve(out, root, 'receipt.json'))) });
    }
    await unchangedAuthoredSource(stage, subject.seal.files);
  }
  if (manifest.variants.length !== variants.length) throw new Error('Not every predeclared variant was built');
  for (const comparison of comparisons) if (![comparison.reference, comparison.candidate].every(id => manifest.variants.some(variant => variant.id === id))) throw new Error('Comparison refers to a missing variant');
  for (const [name, subject] of Object.entries(subjects)) await verifySource(subject.snapshot, { reference: name === 'reference' });
  if (digest(await runtimeIdentity()) !== digest(runtime)) throw new Error('Private runtime changed during paired preparation');
  if (digest(await inventory(resolve(candidateSource, harnessPath))) !== digest(harnessSources)) throw new Error('Frozen harness changed during preparation');
  manifest.status = 'complete'; manifest.completed = new Date().toISOString();
  manifest.commandsSha256 = digest(await readFile(resolve(out, 'commands.json')));
  manifest.manifestSha256 = digest(manifest);
  await writeJSON(resolve(out, 'manifest.json'), manifest);
  console.log(JSON.stringify({ out, variants: manifest.variants.length, manifestSha256: manifest.manifestSha256 }));
} catch (error) {
  manifest.status = 'failed'; manifest.failed = new Date().toISOString(); manifest.error = String(error.stack ?? error);
  await writeJSON(resolve(out, 'manifest.json'), manifest);
  throw error;
}
}));
