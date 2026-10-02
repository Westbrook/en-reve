import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cohorts} from '../../probes/framework-consumption/cohorts.mjs';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const json = async path => JSON.parse(await read(path));
const ledger = await json('plans/support-coverage.json');

test('support ledger covers every promised environment without equating inventory with acceptance', () => {
  assert.equal(ledger.schemaVersion, 1);
  assert.match(ledger.observedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(ledger.sourceCommit, /^[a-f0-9]{40}$/);
  const ids = new Set(ledger.conditions.map(c => c.id));
  assert.equal(ids.size, ledger.conditions.length);
  for (const id of ['packed-html', 'packed-frameworks', 'packed-ssr', 'browser-current',
    'browser-previous', 'framework-release-lines', 'phone-android', 'phone-ios',
    'tablet-android', 'tablet-ios', 'laptop-small', 'laptop-large', 'desktop-displays',
    'connectivity', 'assistive-technology', 'input-methods', 'cross-root-semantics']) {
    assert(ids.has(id), `Missing support condition: ${id}`);
  }
  for (const condition of ledger.conditions) {
    assert(['partial', 'not-run', 'qualified', 'unsupported'].includes(condition.status));
    if (condition.status !== 'qualified') {
      assert(condition.gap.trim(), condition.id);
      assert(condition.nextAction.trim(), condition.id);
    } else {
      assert.equal(condition.gap, '', `Qualified condition retains a gap: ${condition.id}`);
      assert(condition.evidence.length, condition.id);
    }
    if (condition.status === 'not-run') assert.deepEqual(condition.evidence, []);
  }
  assert.equal(ledger.qualification,
    ledger.conditions.every(c => c.status === 'qualified') ? 'qualified' : 'incomplete');
  for (const product of ledger.installedProducts) {
    assert.equal(product.observation, 'installed-only');
    assert.equal(product.qualification, 'not-run');
    assert(product.version && product.build);
  }
  for (const cache of ledger.cachedChromium) assert.equal(cache.qualifiedAsPreviousProduct, false);
});

test('support evidence references resolve and immutable receipts retain their exact bytes', async () => {
  const evidence = new Map(ledger.evidence.map(e => [e.id, e]));
  assert.equal(evidence.size, ledger.evidence.length);
  for (const item of evidence.values()) {
    assert(!item.path.startsWith('/') && !item.path.split('/').includes('..'));
    const source = await read(item.path);
    assert(item.scope.trim());
    if (['automated-engine','automated-product-and-engine'].includes(item.kind)) {
      assert.match(item.sha256, /^[a-f0-9]{64}$/);
      assert.equal(createHash('sha256').update(source).digest('hex'), item.sha256, item.id);
    } else {
      assert.equal(item.kind, 'source-summary');
      assert.match(item.sourceCommit, /^[a-f0-9]{40}$/);
    }
  }
  for (const condition of ledger.conditions) {
    for (const id of condition.evidence) {
      assert(evidence.has(id), `${condition.id}: unknown evidence ${id}`);
      if (condition.status === 'qualified' && ['physical', 'manual', 'product'].includes(condition.delivery)) {
        // A source-summary or engine-only receipt cannot independently certify
        // a new full physical/product/manual condition.
        assert.fail(`${condition.id}: add a scoped actual-product/manual receipt format before promotion`);
      }
    }
  }
});

test('cohort pins and locks stay separate from historical fixture results', async () => {
  for (const cohort of ledger.frameworkCohorts) {
    const manifest = await json(cohort.manifest);
    const lock = await json(cohort.manifest.replace('package.json', 'package-lock.json'));
    assert.deepEqual(cohort.pinnedDependencies, manifest.dependencies, `Refresh ledger for ${cohort.id}`);
    for (const [name, version] of Object.entries(cohort.pinnedDependencies)) {
      assert.equal(lock.packages[`node_modules/${name}`].version, version, `${cohort.id}/${name}`);
    }
    if (cohort.historicalReceipt) {
      const receipt = ledger.evidence.find(e => e.id === cohort.historicalReceipt);
      const result = await json(receipt.path);
      assert.deepEqual(cohort.historicalDependencies, result.consumers[cohort.id]);
      assert.equal(cohort.sameVersionsAsHistoricalReceipt,
        JSON.stringify(cohort.pinnedDependencies) === JSON.stringify(cohort.historicalDependencies));
    } else assert.equal(cohort.classification, 'preceding-minor');
    if (cohort.packedQualification === 'passed') {
      const packedEvidence = ledger.evidence.find(e => e.id === cohort.packedReceipt);
      assert(packedEvidence, `Missing packed receipt for ${cohort.id}`);
      const packed = await json(packedEvidence.path);
      assert.equal(packed.status, 'passed');
      assert.equal(packed.stats.unexpected, 0);
      assert.equal(packed.stats.flaky, 0);
      assert.equal(packed.stats.skipped, 0);
      assert(packed.stats.expected > 0);
      assert.equal(packed.consumers[cohort.id].types, 'passed');
      assert.deepEqual(packed.consumers[cohort.id].versions, cohort.pinnedDependencies);
    } else assert.equal(cohort.packedQualification, 'not-run');
  }
  assert.equal(ledger.frameworkCohorts.find(c => c.id === 'vue2').classification, 'historical-eol-compatibility');
});

test('packed framework receipt remains bound to its fixture and cohort source inputs', async () => {
  const current = ledger.conditions.find(c => c.id === 'packed-frameworks').evidence[0];
  const evidence = ledger.evidence.find(e => e.id === current);
  const receipt = await json(evidence.path);
  for (const [path, digest] of Object.entries(receipt.sources)) {
    assert.equal(createHash('sha256').update(await read('probes/framework-consumption/'+path)).digest('hex'), digest,
      `Requalify the packed fixture after changing ${path}`);
  }
  for (const [path, digest] of Object.entries(receipt.toolingSources ?? {}))
    assert.equal(createHash('sha256').update(await read(path)).digest('hex'), digest, path);
  assert.deepEqual(Object.keys(receipt.consumers).sort(), cohorts.map(c => c.id).sort());
  assert.equal(receipt.packages.length, 5);
  for (const consumer of Object.values(receipt.consumers)) {
    assert.equal(consumer.types, 'passed');
    assert.match(consumer.lockSHA256, /^[a-f0-9]{64}$/);
    assert.equal(Object.keys(consumer.installedLibraryPackages).length, 5);
  }
});

test('product qualification retains exact distributions and bounded acceptance', async () => {
 for (const evidence of ledger.evidence.filter(e => e.kind === 'automated-product-and-engine')) {
  const receipt = await json(evidence.path);
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.stats.expected, Object.keys(receipt.consumers).length * 6 * 5);
  for (const key of ['unexpected','flaky','skipped']) assert.equal(receipt.stats[key], 0);
  assert.equal(receipt.runtimeDistributionUnchangedAfterRun, true);
  assert.equal(receipt.products.length, 2);
  for (const product of receipt.products) {
    assert.equal(product.passed, Object.keys(receipt.consumers).length * 6);
    assert.equal(product.headless, true);
    assert.equal(product.protocolVersion, receipt.browsers[product.project]);
    assert(product.version && product.bundleBuild && product.platformVersionSource);
    assert(product.distributionInventoryEntries > 100);
    assert.match(product.distributionInventorySHA256, /^[a-f0-9]{64}$/);
  }
  assert.equal(ledger.conditions.find(c => c.id === 'browser-current').status, 'partial');
  assert.equal(ledger.conditions.find(c => c.id === 'browser-previous').status, 'not-run');
 }
});

test('rolling framework lines qualify current and preceding minors while retaining major compatibility', async () => {
  const policy = await json(ledger.frameworkReleasePolicy);
  assert.match(policy.resolvedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(policy.families.length, 3);
  const condition = ledger.conditions.find(c => c.id === 'framework-release-lines');
  assert.equal(condition.status, 'qualified');
  const evidence = ledger.evidence.find(e => e.id === condition.evidence[0]);
  const receipt = await json(evidence.path);
  assert.deepEqual(receipt.releaseLines, policy);
  for (const family of policy.families) {
    const current = family.current.line.split('.').map(Number);
    const previous = family.previous.line.split('.').map(Number);
    assert.equal(previous[0], current[0]);
    assert.equal(previous[1], current[1] - 1);
    for (const [role, line] of [['current-minor',family.current],['preceding-minor',family.previous]]) {
      const cohort = cohorts.find(c => c.id === line.cohort);
      assert.equal(cohort.family, family.family);
      assert.equal(cohort.classification, role);
      assert.equal(receipt.consumers[line.cohort].versions[family.family], line.version);
      assert(line.version.startsWith(line.line+'.'));
      assert(!line.version.includes('-'), 'Prereleases are separate subjects');
      assert.equal(receipt.consumers[line.cohort].types, 'passed');
    }
    for (const id of family.retained) assert(receipt.consumers[id], 'Do not drop previous-major coverage');
  }
  assert.equal(cohorts.find(c => c.id === 'vue2').classification, 'historical-eol-compatibility');
});

test('engine manifest and configured Playwright version agree with the support inventory', async () => {
  const pkg = await json('package.json');
  assert.equal(ledger.enginePins.playwright, pkg.devDependencies['@playwright/test']);
  const manifest = await json('node_modules/playwright-core/browsers.json');
  for (const pin of ledger.enginePins.engines) {
    const actual = manifest.browsers.find(b => b.name === pin.name);
    assert(actual, pin.name);
    for (const key of ['revision', 'browserVersion']) assert.equal(pin[key], actual[key], pin.name);
  }
});
