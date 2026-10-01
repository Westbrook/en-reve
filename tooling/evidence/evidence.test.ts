import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { canonicalJson, digestJson, renderingIdentity, comparisonIdentity, reviewIdentity, validateIdentity } from './identity.ts';
import type { RenderingInputs } from './identity.ts';
import { selectAffected, coverageReceipt } from './graph.ts';
import type { DependencyGraph } from './graph.ts';
import { EvidenceCache } from './cache.ts';
import type { CompletedEvidence } from './cache.ts';

const digest = (label: string) => digestJson({ label });
const renderInputs = (): RenderingInputs => ({
  artifacts: { component: digest('component'), styles: digest('styles') },
  fixture: digest('fixture'), testCode: digest('test'), resolvedDependencies: { '/lit.js': digest('lit') },
  theme: digest('theme'), assets: { font: digest('font') },
  environment: { browser: 'sample-engine', revision: 'sample-r1', os: 'sample-os', renderer: 'software', tool: 'sample' },
  locale: 'en', direction: 'ltr', preferences: { reducedMotion: false },
  viewport: { width: 800, height: 600, scale: 1 }, readiness: { fixture: 'ready-v1' }, capture: { animations: 'disabled', masks: [] },
});
const graph: DependencyGraph = JSON.parse(await readFile(new URL('./fixtures/sample-selection.json', import.meta.url), 'utf8')).graph;

test('canonical content identities ignore object order and reject lossy inputs', () => {
  assert.equal(digestJson({ a: 1, b: [2, 3] }), digestJson({ b: [2, 3], a: 1 }));
  assert.notEqual(digestJson([1, 2]), digestJson([2, 1]));
  for (const input of [{ a: undefined }, { a: NaN }, new Date(), [undefined], new Array(2)]) assert.throws(() => canonicalJson(input));
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  assert.throws(() => digestJson(cyclic));
});

test('rendering, comparison and review identities invalidate independently', () => {
  const render = renderingIdentity(renderInputs());
  const inputs = renderInputs();
  inputs.environment = { browser: 'sample-engine', revision: 'sample-r2' };
  assert.notEqual(render.digest, renderingIdentity(inputs).digest);
  const comparisonInputs = { candidateImage: digest('candidate-image'), baselineImage: digest('baseline-image'), implementation: digest('pixel-comparator-v1'), settings: { threshold: 0.1 } };
  const compare = comparisonIdentity(comparisonInputs);
  const changedThreshold = comparisonIdentity({ ...comparisonInputs, settings: { threshold: 0.2 } });
  const changedBaseline = comparisonIdentity({ ...comparisonInputs, baselineImage: digest('baseline-v2') });
  assert.notEqual(compare.digest, changedThreshold.digest);
  assert.notEqual(compare.digest, changedBaseline.digest);
  assert.equal(render.digest, renderingIdentity(renderInputs()).digest);
  const reviewInputs = { candidate: render.digest, baseline: comparisonInputs.baselineImage, scope: { component: 'sample' }, evidence: [compare.digest] };
  assert.notEqual(reviewIdentity(reviewInputs).digest, reviewIdentity({ ...reviewInputs, evidence: [changedBaseline.digest] }).digest);
  assert.equal(reviewIdentity({ ...reviewInputs, evidence: [compare.digest, render.digest] }).digest,
    reviewIdentity({ ...reviewInputs, evidence: [render.digest, compare.digest] }).digest);
});

test('mutating hashed inputs cannot produce a valid identity or cache key', () => {
  const key = renderingIdentity(renderInputs());
  key.inputs = {};
  assert.throws(() => validateIdentity(key));
  const missing = renderInputs();
  delete (missing as Partial<RenderingInputs>).capture;
  assert.throws(() => renderingIdentity(missing));
  const forgedEmpty = { schemaVersion: 1 as const, kind: 'rendering' as const, inputs: {}, digest: digestJson({ schemaVersion: 1, kind: 'rendering', inputs: {} }) };
  assert.throws(() => validateIdentity(forgedEmpty));
});

test('token aliases and theme/style dependencies select every transitive component scenario', () => {
  const receipt = selectAffected(graph, ['token:accent']);
  assert.deepEqual(receipt.scenarios, ['scenario:sample-control']);
  assert.equal(receipt.affected.includes('token:accent-hover'), true);
  assert.equal(receipt.affected.includes('component:sample-control'), true);
  assert.equal(receipt.affected.includes('docs:private-copy'), false);
  assert.equal(receipt.mode, 'focused');
  assert.deepEqual(receipt.reasons['component:sample-control'], ['depends on style:control']);
});

test('an internal shared helper reaches its component consumers while isolated docs stay focused', () => {
  const withHelper = structuredClone(graph);
  withHelper.nodes.push({ id: 'module:internal-helper', kind: 'module', dependencies: [] });
  withHelper.nodes.find(node => node.kind === 'component')!.dependencies.push('module:internal-helper');
  assert.deepEqual(selectAffected(withHelper, ['module:internal-helper']).scenarios, ['scenario:sample-control']);
  assert.deepEqual(selectAffected(withHelper, ['docs:private-copy']).scenarios, ['scenario:docs-page']);
});

test('unknown or incomplete dependencies expand selection rather than inventing isolated passes', () => {
  const unknown = structuredClone(graph);
  unknown.nodes[0]!.dependencies.push('token:missing');
  const receipt = selectAffected(unknown, ['docs:private-copy']);
  assert.equal(receipt.mode, 'expanded');
  assert.deepEqual(receipt.scenarios, ['scenario:docs-page', 'scenario:sample-control']);
  assert.equal(receipt.gaps.length, 1);
  const incomplete = structuredClone(graph);
  incomplete.nodes[0]!.complete = false;
  assert.equal(selectAffected(incomplete, ['token:accent']).mode, 'expanded');
  assert.equal(selectAffected(graph, ['unknown-change']).mode, 'expanded');
});

test('cycles in dependency use graphs terminate without dropping consumers', () => {
  const cyclic = structuredClone(graph);
  cyclic.nodes[0]!.dependencies.push('token:accent-hover');
  assert.deepEqual(selectAffected(cyclic, ['token:accent']).scenarios, ['scenario:sample-control']);
});

test('missing, unsupported, executed, and reused evidence retain distinct outcomes', () => {
  const receipt = coverageReceipt(['browser', 'screen-reader', 'mobile', 'cached'], {
    browser: { status: 'passed', originatingRun: 'run-1', evidence: ['browser.json'] },
    'screen-reader': { status: 'unsupported', reason: 'No screen-reader environment is configured.', nextAction: 'Arrange a named browser/OS/AT run.' },
    cached: { status: 'reused', originatingRun: 'run-previous', evidence: ['cached.json'], cacheKey: digest('cache') },
  });
  assert.equal(receipt.complete, false);
  assert.equal(receipt.checks.mobile!.status, 'not-run');
  assert.equal(receipt.checks['screen-reader']!.status, 'unsupported');
  assert.equal(receipt.checks.cached!.status, 'reused');
  assert.throws(() => coverageReceipt(['browser'], { browser: { status: 'passed', originatingRun: '', evidence: [] } }));
});

async function completed(cache: EvidenceCache): Promise<CompletedEvidence> {
  const selectionReceipt = await cache.storeArtifact(JSON.stringify(selectAffected(graph, ['token:accent'])), { label: 'selection', mediaType: 'application/json' });
  const artifact = await cache.storeArtifact('synthetic image bytes, not a browser capture', { label: 'sample-capture', mediaType: 'application/octet-stream' });
  return { schemaVersion: 1, identity: renderingIdentity(renderInputs()), originatingRun: 'sample-run', selectionReceipt, artifacts: [artifact], outcome: 'passed', result: { sample: true } };
}

test('complete evidence is stored atomically, verified on lookup and tied to its originating run', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-evidence-test-'));
  try {
    const cache = new EvidenceCache(directory);
    const entry = await completed(cache);
    assert.equal((await cache.lookup(entry.identity)).status, 'miss');
    await cache.writeCompleted(entry);
    const hit = await cache.lookup(entry.identity);
    assert.equal(hit.status, 'hit');
    if (hit.status === 'hit') assert.equal(hit.evidence.originatingRun, 'sample-run');
    const files = await readdir(join(directory, 'entries'));
    assert.deepEqual(files, [`${entry.identity.digest.slice(7)}.json`]);
    const history = await readdir(join(directory, 'history', entry.identity.digest.slice(7)));
    assert.equal(history.length, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('corrupt, missing and interrupted artifacts cannot produce a cache hit', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-evidence-test-'));
  try {
    const cache = new EvidenceCache(directory);
    const entry = await completed(cache);
    await cache.writeCompleted(entry);
    await writeFile(join(directory, 'blobs', entry.artifacts[0]!.digest.slice(7)), 'corrupt');
    const corrupt = await cache.lookup(entry.identity);
    assert.equal(corrupt.status, 'miss');
    if (corrupt.status === 'miss') assert.equal(corrupt.reason, 'corrupt');
    await assert.rejects(() => cache.writeCompleted(entry));
    await rm(join(directory, 'entries', `${entry.identity.digest.slice(7)}.json`));
    await writeFile(join(directory, 'entries', `${entry.identity.digest.slice(7)}.json.interrupted.tmp`), '{}');
    const interrupted = await cache.lookup(entry.identity);
    assert.equal(interrupted.status, 'miss');
    if (interrupted.status === 'miss') assert.equal(interrupted.reason, 'absent');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('a failure remains evidence and review identities cannot be cached as approvals', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-evidence-test-'));
  try {
    const cache = new EvidenceCache(directory);
    const entry = await completed(cache);
    entry.outcome = 'failed';
    await cache.writeCompleted(entry);
    const failure = await cache.lookup(entry.identity);
    assert.equal(failure.status, 'miss');
    if (failure.status === 'miss') assert.equal(failure.reason, 'failed-evidence');
    entry.outcome = 'passed';
    entry.originatingRun = 'sample-retry';
    await cache.writeCompleted(entry);
    const retry = await cache.lookup(entry.identity);
    assert.equal(retry.status, 'miss');
    if (retry.status === 'miss') {
      assert.equal(retry.reason, 'failed-evidence');
      assert.deepEqual(retry.failedRuns, ['sample-run']);
    }
    entry.identity = reviewIdentity({ candidate: digest('candidate'), baseline: digest('baseline'), evidence: [digest('evidence')], scope: {} });
    await assert.rejects(() => cache.writeCompleted(entry));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('an expanded run with unknown dependencies can be recorded but is ineligible for reuse', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-evidence-test-'));
  try {
    const cache = new EvidenceCache(directory);
    const entry = await completed(cache);
    entry.selectionReceipt = await cache.storeArtifact(JSON.stringify(selectAffected(graph, ['unknown-module'])), { label: 'selection with gaps', mediaType: 'application/json' });
    await cache.writeCompleted(entry);
    const result = await cache.lookup(entry.identity);
    assert.equal(result.status, 'miss');
    if (result.status === 'miss') assert.equal(result.reason, 'incomplete-selection');
    entry.selectionReceipt = await cache.storeArtifact('{}', { label: 'incomplete selection', mediaType: 'application/json' });
    await assert.rejects(() => cache.writeCompleted(entry));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
