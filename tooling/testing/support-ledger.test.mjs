import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

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
    if (item.kind === 'automated-engine') {
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
    const receipt = ledger.evidence.find(e => e.id === cohort.historicalReceipt);
    const result = await json(receipt.path);
    assert.deepEqual(cohort.historicalDependencies, result.consumers[cohort.id]);
    assert.equal(cohort.sameVersionsAsHistoricalReceipt,
      JSON.stringify(cohort.pinnedDependencies) === JSON.stringify(cohort.historicalDependencies));
    assert.equal(cohort.packedQualification, 'not-run', 'A new packed receipt is required before promotion');
  }
  assert.equal(ledger.frameworkCohorts.find(c => c.id === 'vue2').classification, 'historical-eol-compatibility');
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
