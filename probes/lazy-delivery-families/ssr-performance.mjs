/** Actual Selection production SSR acquisition. Preparation, correctness and browser timing are separate. */
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { appendFileSync, createWriteStream } from 'node:fs';
import { appendFile, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withMachineOwner } from '../../tooling/testing/machine-owner.mjs';
import { withExecutionOwner } from '../../tooling/testing/execution-owner.mjs';
import { contained, digest, digestFile, inventory, inventoryFiles, json, verifySource, writeJSON } from '../lazy-delivery-performance/source-seal.mjs';
import { acceptedReferenceHead, assertSourceSubjects, runtimeInventory, runtimeExclusions } from './route-build-contract.mjs';

const here = fileURLToPath(import.meta.url), hostRoot = resolve(import.meta.dirname, '../..');
const designPath = 'plans/lazy-delivery/family-designs.json';
const armDefinitions = [
  { id: 'reference', subject: 'reference', policy: 'eager' },
  { id: 'candidate', subject: 'candidate', policy: 'on-demand' },
  { id: 'rollback', subject: 'candidate', policy: 'eager' },
];
export const ssrProtocol = Object.freeze({
  id: 'selection-production-ssr-fresh-process-v1', route: '/workflows/selection.html',
  exportName: 'renderWorkflows', args: ['selection'], actualRegistry: 'production-global',
  processPolicy: 'One fresh Node process, one unchanged production route call, then exit, for every arm in every matched block. No warmups, warm worker, forced GC, adaptive stopping, retries or replacement cells.',
  timedRegion: 'Await the actual compiled renderWorkflows(\'selection\') call, including instance construction, app.render(), renderToString(), returned markup/css/tags construction and disposeWorkflows() in finally.',
  startup: 'startupMs is the fresh Node process uptime at render entry, including harness/bootstrap, IPC dispatch wait, dependency resolution and shim/compiled entry import. importMs reports the shim/entry import subset. Parent workerBootMs and spawnToExitMs are additional diagnostics; spawn-to-exit includes output validation/persistence. Startup is never subtracted from renderMs.',
  exclusions: 'Build, dependency verification, process boot, shim/entry import, output parsing/hashing/writing and static HTML shell injection/style inlining/minification are outside renderMs. This is the production route render boundary, not whole docs build or HTTP response latency.',
  cachePolicy: 'Fresh JavaScript module/registry state each observation; OS page cache is neither flushed nor claimed cold. Seeded complete matched arm blocks limit order bias.',
  minimumSuccessfulSamplesPerArm: 30, p95MinimumSamples: 100, warmups: 0,
  timeoutMs: 60000, seed: 20260928,
  uncertainty: { method: 'Paired matched-block percentile bootstrap of difference in type-7 sample p75; common block indices in both arms', repetitions: 10000, confidence: .95, seed: 20260929, interpretation: 'Descriptive finite-sample uncertainty. Both point estimate and upper interval bound must satisfy both frozen regression ceilings; an interval crossing a ceiling does not qualify.' },
  comparisons: [
    { id: 'candidate-reference', before: 'reference', after: 'candidate', role: 'primary route SSR regression gate' },
    { id: 'rollback-reference', before: 'reference', after: 'rollback', role: 'eager rollback SSR regression gate' },
    { id: 'candidate-rollback', before: 'rollback', after: 'candidate', role: 'same-code construction comparison; reported separately', descriptive: true },
  ],
  failurePolicy: 'Retain every scheduled job, start, result, failure, timeout, abort, stdout/stderr and available rendered output. Missing, failed, aborted, duplicate or invalid cells prevent qualification; a new acquisition requires a new output directory.',
  scope: 'Server rendering only. No browser startup, hydration, interaction, retention, no-JS usability, scoped-registry or full family promotion claim.',
});

function randomGenerator(seed) { let state = seed >>> 0; return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; }; }
export function ssrJobs(n, seed = ssrProtocol.seed) {
  assert(Number.isSafeInteger(n) && n > 0); assert(Number.isSafeInteger(seed));
  const random = randomGenerator(seed), jobs = [];
  for (let block = 0; block < n; block++) {
    const arms = [...armDefinitions];
    for (let index = arms.length - 1; index > 0; index--) { const other = Math.floor(random() * (index + 1)); [arms[index], arms[other]] = [arms[other], arms[index]]; }
    for (const arm of arms) jobs.push({ id: `block-${String(block).padStart(4, '0')}-${arm.id}`, block, arm: arm.id, policy: arm.policy, route: ssrProtocol.route, registry: ssrProtocol.actualRegistry });
  }
  return jobs;
}
function quantile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), index = (sorted.length - 1) * fraction, lower = Math.floor(index);
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower);
}
function distribution(values) {
  return { n: values.length, median: quantile(values, .5), p75: quantile(values, .75), min: quantile(values, 0), max: quantile(values, 1), p25: quantile(values, .25), p95: values.length >= ssrProtocol.p95MinimumSamples ? quantile(values, .95) : null };
}
function pairedUncertainty(before, after) {
  const random = randomGenerator(ssrProtocol.uncertainty.seed), milliseconds = [], percentages = [];
  for (let repetition = 0; repetition < ssrProtocol.uncertainty.repetitions; repetition++) {
    const left = [], right = [];
    for (let index = 0; index < before.length; index++) { const selected = Math.floor(random() * before.length); left.push(before[selected]); right.push(after[selected]); }
    const base = quantile(left, .75), change = quantile(right, .75) - base;
    milliseconds.push(change); if (base > 0) percentages.push(change / base * 100);
  }
  return { ...ssrProtocol.uncertainty, differenceMs: [quantile(milliseconds, .025), quantile(milliseconds, .975)], differencePercent: percentages.length === ssrProtocol.uncertainty.repetitions ? [quantile(percentages, .025), quantile(percentages, .975)] : null };
}
/** Every scheduled row is required; no successful-only cell substitution. */
export function summarizeSSR(rows, jobs, { gates, qualification = false, integrityVerified = false } = {}) {
  const expected = new Map(jobs.map(job => [job.id, job])), seen = new Set(), invalidRows = [];
  for (const row of rows) {
    if (!expected.has(row.job?.id) || seen.has(row.job?.id) || digest(row.job) !== digest(expected.get(row.job?.id)) || row.status !== 'succeeded' || !['renderMs', 'startupMs', 'importMs', 'workerBootMs', 'spawnToExitMs'].every(key => Number.isFinite(row.metrics?.[key]) && row.metrics[key] >= 0)) invalidRows.push(row.job?.id ?? 'unknown');
    seen.add(row.job?.id);
  }
  const missing = jobs.filter(job => !seen.has(job.id)).map(job => job.id);
  const groups = Object.fromEntries(armDefinitions.map(arm => [arm.id, rows.filter(row => row.job?.arm === arm.id && row.status === 'succeeded').sort((a, b) => a.job.block - b.job.block)]));
  const summaries = Object.fromEntries(Object.entries(groups).map(([arm, values]) => [arm, Object.fromEntries(['renderMs', 'startupMs', 'importMs', 'workerBootMs', 'spawnToExitMs'].map(metric => [metric, distribution(values.map(row => row.metrics?.[metric]).filter(Number.isFinite))]))]));
  const complete = !invalidRows.length && !missing.length && rows.length === jobs.length;
  const sufficient = Object.values(groups).every(values => values.length >= ssrProtocol.minimumSuccessfulSamplesPerArm);
  const comparisons = ssrProtocol.comparisons.map(comparison => {
    const before = groups[comparison.before], after = groups[comparison.after];
    const paired = complete && before.length && before.length === after.length && before.every((row, index) => row.job.block === after[index].job.block);
    if (!paired) return { ...comparison, status: 'incomplete', passed: false, pairedBlocks: 0 };
    const left = before.map(row => row.metrics.renderMs), right = after.map(row => row.metrics.renderMs);
    const base = quantile(left, .75), p75 = quantile(right, .75), differenceMs = p75 - base, differencePercent = base > 0 ? differenceMs / base * 100 : null;
    const uncertainty = pairedUncertainty(left, right);
    const ceilings = { milliseconds: gates.maximumSSRRenderP75RegressionMs, percent: gates.maximumSSRRenderP75RegressionPercent };
    const pointPassed = differencePercent !== null && differenceMs <= ceilings.milliseconds && differencePercent <= ceilings.percent;
    const uncertaintyPassed = uncertainty.differencePercent !== null && uncertainty.differenceMs[1] <= ceilings.milliseconds && uncertainty.differencePercent[1] <= ceilings.percent;
    return { ...comparison, status: sufficient ? 'measured' : 'insufficient-samples', pairedBlocks: before.length, beforeP75Ms: base, afterP75Ms: p75, differenceMs, differencePercent, uncertainty, ceilings, pointPassed, uncertaintyPassed, passed: !qualification && sufficient && integrityVerified && pointPassed && uncertaintyPassed };
  });
  return { schemaVersion: 1, kind: 'selection-production-ssr-summary', scope: ssrProtocol.scope, qualification, scheduled: jobs.length, terminal: rows.length, invalidRows, missing, integrityVerified, complete, sufficient, summaries, comparisons, passed: !qualification && complete && sufficient && integrityVerified && comparisons.filter(item => !item.descriptive).every(item => item.passed), betterSign: 'Lower renderMs, startup/import time, and signed candidate-minus-comparator differences are better. Negative change is an improvement. Startup is reported separately and has no substitute route-render gate.' };
}

/** Shared acquisition/analyzer guard: a different or partially prepared cohort cannot be substituted. */
export function parseSSRPreparation(bytes, { expectedSha256 } = {}) {
  if (expectedSha256 !== undefined) assert.equal(digest(bytes), expectedSha256, 'Prepared manifest bytes changed');
  const preparation = JSON.parse(bytes);
  assert.equal(preparation.kind, 'en-reve-lazy-delivery-actual-docs-build'); assert.equal(preparation.status, 'complete');
  const { manifestSha256, ...payload } = preparation; assert.equal(digest(payload), manifestSha256, 'Prepared manifest seal mismatch');
  assert.deepEqual(preparation.arms.map(({ id, subject, policy }) => ({ id, subject, policy })), armDefinitions);
  assert.equal(preparation.sources.reference.rootLockSha256, preparation.sources.candidate.rootLockSha256, 'Matched preparation dependency locks differ');
  return preparation;
}

/** Full inventory equality includes names, bytes, hashes, file kind and executable mode. */
export function assertSSRArtifacts(expected, actual, label) {
  assert(Array.isArray(expected) && Array.isArray(actual), 'Artifact inventories are required');
  assert.equal(digest(actual), digest(expected), 'Retained attempt artifacts changed: ' + label);
}

function inside(root, name) { assert(typeof name === 'string' && name.length && !name.startsWith('/')); const path = resolve(root, name); assert(contained(root, path), 'Receipt path escapes prepared root: ' + name); return path; }
function collect(node, predicate, result = []) { if (predicate(node)) result.push(node); for (const child of node.childNodes ?? []) collect(child, predicate, result); if (node.content) collect(node.content, predicate, result); return result; }
const attribute = (node, name) => node?.attrs?.find(item => item.name === name)?.value;

async function worker() {
  assert(process.send, 'SSR workers require the owning campaign IPC channel');
  process.send({ type: 'booted', pid: process.pid });
  const request = await new Promise(resolve => process.once('message', resolve));
  try {
    const { entry, output, policy, runtimeRoot } = request;
    const require = createRequire(entry), shim = await realpath(require.resolve('@lit-labs/ssr/lib/install-global-dom-shim.js'));
    assert(contained(runtimeRoot, shim), 'SSR shim resolves outside frozen runtime');
    const importBegan = performance.now();
    await import(pathToFileURL(shim).href);
    const production = await import(pathToFileURL(entry).href);
    const importMs = performance.now() - importBegan;
    assert.equal(typeof production.renderWorkflows, 'function');
    const renderBegan = performance.now();
    const startupMs = renderBegan;
    const result = await production.renderWorkflows('selection');
    const renderMs = performance.now() - renderBegan;
    // Keep hashing, parsing, serialization and disk writes outside the production render timer.
    assert.equal(typeof result.markup, 'string'); assert.equal(typeof result.css, 'string'); assert(Array.isArray(result.tags));
    await writeFile(resolve(output, 'markup.html'), result.markup, { flag: 'wx' });
    await writeFile(resolve(output, 'theme.css'), result.css, { flag: 'wx' });
    await writeFile(resolve(output, 'tags.json'), JSON.stringify(result.tags, null, 2) + '\n', { flag: 'wx' });
    const parseEntry = await realpath(require.resolve('parse5')); assert(contained(runtimeRoot, parseEntry), 'Output parser resolves outside frozen runtime');
    const { parseFragment } = await import(pathToFileURL(parseEntry).href), document = parseFragment(result.markup);
    const workflows = collect(document, node => attribute(node, 'data-workflow') === 'selection'); assert.equal(workflows.length, 1, 'Expected the real Selection workflow');
    const fields = collect(workflows[0], node => node.tagName === 'en-combobox' && attribute(node, 'name') === 'project'); assert.equal(fields.length, 1);
    const field = fields[0], renderedPolicy = attribute(field, 'content-rendering') ?? 'eager'; assert.equal(renderedPolicy, policy, 'SSR/client authored policy mismatch');
    const inputs = collect(field, node => node.tagName === 'input' && attribute(node, 'id') === 'control'), lists = collect(field, node => attribute(node, 'id') === 'listbox');
    assert.equal(inputs.length, 1, 'Persistent native editor missing'); assert.equal(lists.length, 1, 'Persistent options shell missing'); assert.equal(attribute(inputs[0], 'aria-expanded'), 'false');
    assert.equal(attribute(inputs[0], 'value'), 'Studio North · Autumn campaign', 'Initial accepted native editor text changed');
    const options = collect(lists[0], node => attribute(node, 'role') === 'option'); assert.equal(options.length, policy === 'eager' ? 40 : 0, 'Original 40-project workload or construction policy changed');
    if (policy === 'eager') { assert.equal(options.filter(node => attribute(node, 'aria-disabled') === 'true').length, 3); assert.equal(attribute(options.find(node => attribute(node, 'aria-selected') === 'true'), 'data-value'), 'project-01'); }
    assert(result.tags.includes('en-combobox'));
    const outputs = await inventory(output);
    process.send({ type: 'result', status: 'succeeded', metrics: { startupMs, importMs, renderMs }, output: { files: outputs, sha256: digest(outputs), markupBytes: Buffer.byteLength(result.markup), cssBytes: Buffer.byteLength(result.css), tags: result.tags, policy: renderedPolicy, optionRows: options.length, nativeInputValue: attribute(inputs[0], 'value') ?? '' } }, () => process.disconnect());
  } catch (error) {
    process.exitCode = 1;
    process.send({ type: 'result', status: 'failed', error: String(error.stack ?? error) }, () => process.disconnect());
  }
}

async function acquisition() {
  return withMachineOwner(machineLease => withExecutionOwner(hostRoot, async executionLease => {
  assert(!process.env.NODE_OPTIONS && !process.env.NODE_PATH && !process.env.ESBUILD_BINARY_PATH && process.execArgv.length === 0, 'Unset runtime/loader overrides and invoke with the selected unmodified Node runtime');
  const options = new Map(process.argv.slice(2).map(argument => { const at = argument.indexOf('='); return at < 0 ? [argument, true] : [argument.slice(0, at), argument.slice(at + 1)]; }));
  assert([...options.keys()].every(key => ['--prepared', '--out', '--n', '--seed', '--qualification', '--contention'].includes(key)), 'Unknown SSR acquisition option');
  assert(typeof options.get('--prepared') === 'string' && typeof (options.get('--out') ?? process.env.EN_EXECUTION_OUTPUT) === 'string', 'Usage: node ssr-performance.mjs --prepared=/frozen-docs --out=/fresh-output [--n=30] [--seed=20260928] [--qualification] [--contention=observation]');
  const prepared = await realpath(resolve(options.get('--prepared'))), requestedOutput = resolve(options.get('--out') ?? process.env.EN_EXECUTION_OUTPUT), qualification = options.has('--qualification');
  const output = resolve(await realpath(dirname(requestedOutput)), basename(requestedOutput));
  assert(!contained(prepared, output), 'Acquisition output must be outside immutable prepared builds');
  const n = Number(options.get('--n') ?? (qualification ? 1 : ssrProtocol.minimumSuccessfulSamplesPerArm)), seed = Number(options.get('--seed') ?? ssrProtocol.seed);
  assert(Number.isSafeInteger(n) && n >= (qualification ? 1 : ssrProtocol.minimumSuccessfulSamplesPerArm)); assert(Number.isSafeInteger(seed));
  const jobs = ssrJobs(n, seed), preparationBytes = await readFile(resolve(prepared, 'manifest.json')), preparation = parseSSRPreparation(preparationBytes);
  const designBytes = await readFile(resolve(hostRoot, designPath)), designs = JSON.parse(designBytes), gates = designs.designs['selection-design'].proposedPromotionGates.realRouteBenefit;
  assert.equal(designs.budgetDecision.status, 'frozen-before-runtime-edits-and-measurements');
  assert.equal(digest(designBytes), preparation.budgets.find(item => item.path === designPath)?.sha256, 'Budgets differ from the prepared candidate');
  assert.equal(gates.maximumSSRRenderP75RegressionMs, 5); assert.equal(gates.maximumSSRRenderP75RegressionPercent, 5);
  const arms = new Map(), runtimeReceipts = new Map();
  for (const arm of preparation.arms) {
    const receiptBytes = await readFile(inside(prepared, arm.receipt)); assert.equal(digest(receiptBytes), arm.receiptSha256);
    const receipt = JSON.parse(receiptBytes), ssr = receipt.ssr; assert(ssr, 'Prepared arm omitted its actual compiled SSR runtime');
    assert.equal(ssr.exportName, ssrProtocol.exportName); assert.deepEqual(ssr.args, ssrProtocol.args);
    assert.equal(receipt.policy, arm.policy); assert.equal(receipt.registry, ssrProtocol.actualRegistry);
    assert.equal(ssr.sourceSealSha256, preparation.sources[arm.subject].sealSha256); assert.equal(ssr.sourceSha256, preparation.sources[arm.subject].sourceSha256);
    assert.equal(ssr.runtimeLockSha256, preparation.sources[arm.subject].rootLockSha256);
    assert.equal(receipt.routes[ssrProtocol.route].workload, 'combobox40projects');
    const runtimeBytes = await readFile(inside(prepared, ssr.runtimeReceipt)); assert.equal(digest(runtimeBytes), ssr.runtimeReceiptSha256);
    const runtime = JSON.parse(runtimeBytes); assert.equal(digest(runtime.files), runtime.sha256); assert(runtime.root);
    assert.equal(runtime.exactLockSha256, ssr.runtimeLockSha256); assert.deepEqual(runtime.exclusions, runtimeExclusions);
    runtimeReceipts.set(ssr.runtimeReceipt, { bytes: runtimeBytes, value: runtime });
    arms.set(arm.id, { ...arm, receiptPath: arm.receipt, receipt, receiptBytes, entry: inside(prepared, ssr.entry), runtimeRoot: await realpath(inside(prepared, runtime.root)) });
  }
  const supportPaths = ['probes/lazy-delivery-performance/source-seal.mjs', 'tooling/testing/machine-owner.mjs', 'tooling/testing/execution-owner.mjs'];
  const support = await Promise.all(supportPaths.map(async path => ({ path, sha256: await digestFile(resolve(hostRoot, path)) })));
  const nodeIdentity = { path: await realpath(process.execPath), sha256: await digestFile(process.execPath), version: process.version, versions: process.versions };
  assert.equal(preparation.build?.colorControls?.enabled, false, 'Separate color construction controls cannot supply production SSR evidence');
  const candidateSource = resolve(preparation.sources.candidate.snapshot, 'source');
  async function verify() {
    parseSSRPreparation(await readFile(resolve(prepared, 'manifest.json')), { expectedSha256: digest(preparationBytes) });
    assert.equal(await digestFile(resolve(hostRoot, designPath)), digest(designBytes));
    assert.equal(digest(preparation.harness.files), preparation.harness.sha256);
    assert.equal(digest(await inventoryFiles(hostRoot, preparation.harness.files.map(file => file.path))), preparation.harness.sha256, 'Executed harness/support differs from the prepared candidate');
    for (const directory of ['probes/lazy-delivery-families', 'probes/lazy-delivery-editor', 'probes/lazy-delivery-color']) {
      const actual = (await inventory(resolve(hostRoot, directory))).map(file => ({ ...file, path: directory + '/' + file.path })).sort((a, b) => a.path.localeCompare(b.path));
      assert.equal(digest(actual), digest(preparation.harness.files.filter(file => file.path.startsWith(directory + '/'))), 'Harness directory contents changed: ' + directory);
    }
    assert.equal(await digestFile(here), preparation.harness.files.find(file => file.path === 'probes/lazy-delivery-families/ssr-performance.mjs')?.sha256, 'SSR harness was not frozen in preparation');
    for (const item of support) { assert.equal(await digestFile(resolve(hostRoot, item.path)), item.sha256); assert.equal(await digestFile(resolve(candidateSource, item.path)), item.sha256, 'Support differs from frozen candidate'); }
    const verifiedSubjects = {};
    for (const [name, source] of Object.entries(preparation.sources)) { const verified = await verifySource(source.snapshot, { reference: true }); assert.equal(verified.seal.sealSha256, source.sealSha256, name + ' source seal changed'); verifiedSubjects[name] = verified; }
    assert.equal(preparation.acceptedReferenceHead, acceptedReferenceHead, 'Prepared reference is retired or undeclared');
    assertSourceSubjects(verifiedSubjects);
    assert.equal(digest({ path: await realpath(process.execPath), sha256: await digestFile(process.execPath), version: process.version, versions: process.versions }), digest(nodeIdentity));
    assert.equal(nodeIdentity.sha256, preparation.runtime.node.sha256); assert.equal(nodeIdentity.version, preparation.runtime.node.version); assert.equal(nodeIdentity.path, preparation.runtime.node.path);
    for (const [name, runtime] of runtimeReceipts) {
      assert.equal(await digestFile(inside(prepared, name)), digest(runtime.bytes));
      const root = inside(prepared, runtime.value.root), files = await runtimeInventory(root);
      assert.equal(digest(files), runtime.value.sha256, 'Installed SSR runtime changed');
      assert.equal(await digestFile(resolve(root, '.package-lock.json')), runtime.value.installedLockSha256);
    }
    for (const arm of arms.values()) {
      const { receipt, receiptBytes } = arm, root = inside(prepared, arm.root);
      assert.equal(await digestFile(inside(prepared, arm.receiptPath)), digest(receiptBytes));
      const client = await inventory(resolve(root, 'site')); assert.equal(client.length, receipt.assets.length);
      for (const asset of receipt.assets) { const file = client.find(file => file.path === asset.path); assert(file && file.sha256 === asset.sha256 && file.bytes === asset.bytes, 'Client asset changed: ' + asset.path); }
      const ssrFiles = await inventory(inside(prepared, receipt.ssr.outputRoot)); assert.equal(ssrFiles.length, receipt.ssr.assets.length);
      for (const asset of receipt.ssr.assets) { const path = inside(prepared, asset.path); assert(contained(inside(prepared, receipt.ssr.outputRoot), path)); assert.equal(await digestFile(path), asset.sha256); }
      assert(receipt.ssr.assets.some(asset => inside(prepared, asset.path) === arm.entry));
      for (const archive of receipt.packages) assert.equal(await digestFile(inside(prepared, archive.path)), archive.sha256);
      assert.equal(await digestFile(inside(prepared, receipt.packagesReceipt)), receipt.packagesReceiptSha256);
      assert.equal(await digestFile(inside(root, receipt.overlays)), receipt.overlaysSha256);
      for (const graph of Object.values(receipt.graphs)) assert.equal(await digestFile(inside(root, graph.path)), graph.sha256);
      assert.equal(await realpath(resolve(root, 'node_modules')), arm.runtimeRoot, 'SSR external module owner changed');
    }
  }
    await mkdir(output, { recursive: false }); await mkdir(resolve(output, 'attempts'));
    const manifest = { schemaVersion: 1, kind: 'selection-production-ssr-acquisition', status: 'verifying', started: new Date().toISOString(), n, seed, qualification, jobs, protocol: ssrProtocol, gates, preparation: { path: prepared, sha256: digest(preparationBytes), identity: preparation }, budgets: { path: designPath, sha256: digest(designBytes) }, harness: preparation.harness, support, runtime: nodeIdentity, environment: { timezone: 'UTC', locale: 'C', contention: options.get('--contention') ?? 'Active desktop allowed; no additional operator observation supplied', platform: os.platform(), release: os.release(), arch: os.arch(), cpu: os.cpus()[0]?.model, logicalCPUs: os.cpus().length, loadAverageBefore: os.loadavg() }, leases: { machine: machineLease, execution: executionLease } };
    await writeJSON(resolve(output, 'manifest.json'), manifest);
    const rows = [], raw = resolve(output, 'samples.jsonl'); let active = null, activeChild = null, aborted = false, verifiedBefore = false, integrityVerified = false, failure;
    await writeFile(raw, '', { flag: 'wx' });
    const signal = name => { aborted = true; appendFileSync(raw, JSON.stringify({ event: 'abort', at: new Date().toISOString(), signal: name, job: active }) + '\n'); activeChild?.kill('SIGTERM'); };
    const onINT = () => signal('SIGINT'), onTERM = () => signal('SIGTERM'); process.on('SIGINT', onINT); process.on('SIGTERM', onTERM);
    try {
      await verify(); verifiedBefore = true; manifest.status = 'running'; manifest.verifiedBefore = new Date().toISOString(); await writeJSON(resolve(output, 'manifest.json'), manifest);
      for (const job of jobs) {
        if (aborted) throw new Error('Acquisition aborted; unstarted scheduled jobs remain missing');
        active = job; const arm = arms.get(job.arm), attempt = resolve(output, 'attempts', job.id); await mkdir(attempt); await mkdir(resolve(attempt, 'rendered'));
        await appendFile(raw, JSON.stringify({ event: 'started', at: new Date().toISOString(), job }) + '\n');
        let message, workerBootMs, timeout = false, spawnError = null;
        const stdout = createWriteStream(resolve(attempt, 'stdout.log'), { flags: 'wx' }), stderr = createWriteStream(resolve(attempt, 'stderr.log'), { flags: 'wx' });
        const flushed = Promise.all([stdout, stderr].map(stream => new Promise(resolve => { stream.once('close', resolve); stream.once('error', error => { spawnError = String(error.stack ?? error); resolve(); }); })));
        const environment = { ...process.env, TZ: 'UTC', LANG: 'C', LC_ALL: 'C' }; delete environment.NODE_ENV;
        const started = performance.now();
        const child = activeChild = fork(here, ['--worker'], { cwd: dirname(arm.entry), execPath: process.execPath, execArgv: [], env: environment, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
        child.stdout.pipe(stdout); child.stderr.pipe(stderr);
        let killTimer;
        const timer = setTimeout(() => { timeout = true; child.kill('SIGTERM'); killTimer = setTimeout(() => child.kill('SIGKILL'), 2000); }, ssrProtocol.timeoutMs);
        child.on('message', received => {
          if (received?.type === 'booted' && workerBootMs === undefined) { workerBootMs = performance.now() - started; child.send({ entry: arm.entry, runtimeRoot: arm.runtimeRoot, policy: arm.policy, output: resolve(attempt, 'rendered') }); }
          else if (received?.type === 'result') { if (message) spawnError = 'Duplicate worker result'; else message = received; }
        });
        child.on('error', error => { spawnError = String(error.stack ?? error); });
        const exit = await new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
        const spawnToExitMs = performance.now() - started;
        clearTimeout(timer); clearTimeout(killTimer); activeChild = null;
        await flushed;
        const row = { event: 'terminal', at: new Date().toISOString(), job, status: aborted ? 'aborted' : timeout ? 'timeout' : exit.code === 0 && message?.status === 'succeeded' && !spawnError ? 'succeeded' : 'failed', exit, error: spawnError ?? message?.error ?? (timeout ? 'Fresh worker deadline exceeded' : null), metrics: { ...message?.metrics, workerBootMs, spawnToExitMs }, output: message?.output ?? null, artifacts: relative(output, attempt), artifactsInventory: await inventory(attempt) };
        rows.push(row); await appendFile(raw, JSON.stringify(row) + '\n'); active = null;
      }
    } catch (error) { failure = error; }
    finally {
      try {
        await verify();
        for (const row of rows) assertSSRArtifacts(row.artifactsInventory, await inventory(inside(output, row.artifacts)), row.job.id);
        const events = (await readFile(raw, 'utf8')).split('\n').filter(Boolean).map(line => JSON.parse(line));
        assert.equal(digest(events.filter(event => event.event === 'terminal')), digest(rows), 'Raw terminal evidence changed');
        integrityVerified = verifiedBefore; manifest.verifiedAfter = new Date().toISOString();
      } catch (error) { failure = failure ? new AggregateError([failure, error], 'Acquisition and final integrity verification failed') : error; }
      if (aborted && !failure) failure = new Error('Acquisition received an abort, including during final verification');
      process.off('SIGINT', onINT); process.off('SIGTERM', onTERM);
      const summary = summarizeSSR(rows, jobs, { gates, qualification, integrityVerified: integrityVerified && !failure && !aborted }); await writeJSON(resolve(output, 'summary.json'), summary);
      manifest.status = failure || !summary.complete || !integrityVerified ? 'failed' : qualification ? 'qualification-only' : summary.passed ? 'passed' : 'gate-failed';
      manifest.completed = new Date().toISOString(); manifest.environment.loadAverageAfter = os.loadavg(); manifest.summarySha256 = await digestFile(resolve(output, 'summary.json')); manifest.error = failure ? String(failure.stack ?? failure) : null;
      manifest.rawSha256 = await digestFile(raw);
      manifest.manifestSha256 = digest(manifest);
      await writeJSON(resolve(output, 'manifest.json'), manifest);
    }
    if (failure) throw failure;
    const summary = await json(resolve(output, 'summary.json'));
    assert(summary.complete && integrityVerified, 'Incomplete/failed SSR campaign retained; use a new output for the next attempt');
    if (!qualification) assert(summary.passed, 'Frozen SSR point/uncertainty regression gates failed; retain the entire acquisition');
    console.log(JSON.stringify({ output, status: manifest.status, samples: rows.length, summary: resolve(output, 'summary.json') }));
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2] === '--worker') await worker(); else await acquisition();
}
