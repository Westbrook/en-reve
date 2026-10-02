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
    if (['automated-engine','automated-product-and-engine','automated-native-product','automated-product-workflows'].includes(item.kind)) {
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
  assert.equal(receipt.stats.expected, Object.keys(receipt.consumers).length * 6 * (3 + receipt.products.length));
  for (const key of ['unexpected','flaky','skipped']) assert.equal(receipt.stats[key], 0);
  assert.equal(receipt.runtimeDistributionUnchangedAfterRun, true);
  assert(receipt.products.length > 0);
  assert.deepEqual(Object.keys(receipt.browsers).filter(name => !name.startsWith('product-')).sort(), ['chromium','firefox','webkit']);
  assert.equal(new Set(receipt.products.map(p => p.project)).size, receipt.products.length);
  assert.deepEqual(receipt.products.map(p => p.project).sort(), Object.keys(receipt.browsers).filter(name => name.startsWith('product-')).sort());
  for (const product of receipt.products) {
    assert.equal(product.passed, Object.keys(receipt.consumers).length * 6);
    assert.equal(product.headless, true);
    assert.equal(product.protocolVersion, receipt.browsers[product.project]);
    assert(product.version && product.bundleBuild && product.platformVersionSource);
    assert(product.distributionInventoryEntries > 100);
    assert.match(product.distributionInventorySHA256, /^[a-f0-9]{64}$/);
  }
  assert.equal(ledger.conditions.find(c => c.id === 'browser-current').status, 'partial');
  assert.equal(ledger.conditions.find(c => c.id === 'browser-previous').status, 'partial');
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

test('native product receipt preserves input scope and unresolved Safari attempts', async () => {
 const evidence=ledger.evidence.find(e=>e.id==='native-products-20261002');
 const receipt=await json(evidence.path);
 assert.match(receipt.runnerSHA256,/^[a-f0-9]{64}$/); // Historical runner identity remains immutable.
 assert.equal(receipt.status,'passed');
 assert.deepEqual(receipt.stats,{passed:30,failed:0,planned:30});
 assert.equal(receipt.selectedProducts,'firefox');
 assert.equal(receipt.products.length,1);
 assert.equal(receipt.products[0].name,'Firefox');
 assert.equal(receipt.products[0].capabilities.browserVersion,receipt.products[0].version);
 assert.equal(receipt.products[0].unchanged,true);
 for(const cohort of cohorts)assert.equal(receipt.cases.filter(c=>c.cohort===cohort.id&&c.status==='passed').length,3);
 assert.equal(receipt.safariAttempts.length,4);
 for(const attempt of receipt.safariAttempts){assert.equal(attempt.status,'failed');assert.equal(attempt.stats.passed,0);}
 assert.equal(receipt.safariAttempts.at(-1).case.diagnostic.visibility,'hidden');
 assert.equal(ledger.conditions.find(c=>c.id==='browser-current').status,'partial');
 assert.match(receipt.artifactPolicy,/no new installation/);
});

test('actual product workflows retain exact sources, distribution identity and explicit skips', async () => {
 for(const evidence of ledger.evidence.filter(e=>e.kind==='automated-product-workflows')) {
 const receipt=await json(evidence.path);
 assert.equal(receipt.status,'passed');
 assert.equal(receipt.stats.expected,26 * receipt.products.length);
 assert.equal(receipt.stats.skipped,receipt.products.length);
 for(const key of ['unexpected','flaky'])assert.equal(receipt.stats[key],0);
 assert.equal(receipt.workers,1);assert.equal(receipt.retries,0);
 assert(receipt.products.length > 0);
 assert.equal(new Set(receipt.products.map(p=>p.project)).size,receipt.products.length);
 for(const product of receipt.products){assert.equal(product.passed,26);assert.equal(product.skipped,1);assert(product.distributionInventoryEntries>100);assert.match(product.distributionInventorySHA256,/^[a-f0-9]{64}$/);}
 assert.equal(receipt.runtimeDistributionUnchangedAfterRun,true);
 assert.equal(receipt.sourceAndInputsUnchangedAfterRun,true);
 assert(receipt.distInventoryEntries>1000);
 for(const [path,digest] of Object.entries(receipt.sourceHashes))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
 assert.equal(receipt.cases.length,27 * receipt.products.length);
 assert(receipt.cases.filter(c=>c.status==='skipped').every(c=>c.titlePath.at(-1).startsWith('narrow portrait')));
 assert.equal(ledger.conditions.find(c=>c.id==='browser-current').status,'partial');
 }
});


test('historical three-scenario runner retains both Firefox release lines', async () => {
 const evidence=ledger.evidence.find(e=>e.id==='firefox-lines-20261002');
 const receipt=await json(evidence.path);
 assert.equal(receipt.runnerSHA256,'f04831d2e475a990b27c130481f5c84ce9afa7f324be7b388d93eac2a52d6f49');
 assert.equal(receipt.status,'passed');
 assert.deepEqual(receipt.stats,{passed:60,failed:0,planned:60});
 assert.equal(receipt.acquisition.checksumMatched,true);
 assert.equal(receipt.acquisition.archiveSHA512,receipt.acquisition.publishedSHA512);
 assert(receipt.acquisition.signatureVerification.every(command=>command.exitCode===0));
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]) {
  const run=receipt.runs[label];assert.equal(run.status,'passed');
  assert.deepEqual(run.stats,{passed:30,failed:0,planned:30});
  assert.equal(run.products.length,1);const product=run.products[0];
  assert.equal(product.version,version);assert.equal(product.capabilities.browserVersion,version);
  assert.equal(product.unchanged,true);assert.equal(product.headless,true);
  for(const cohort of cohorts)assert.equal(run.cases.filter(c=>c.cohort===cohort.id&&c.status==='passed').length,3);
 }
 assert.equal(receipt.runs.preceding.preparationSHA256,receipt.runs.current.preparationSHA256);
 assert.equal(ledger.conditions.find(c=>c.id==='browser-previous').status,'partial');
});


test('isolated Edge provenance covers exact current and preceding distributions', async () => {
 const evidence=ledger.evidence.find(e=>e.id==='edge-framework-lines-20261002');
 const receipt=await json(evidence.path);
 assert.deepEqual(receipt.products.map(p=>p.version).sort(),['153.0.4234.48','154.0.4258.53']);
 assert.notEqual(receipt.products[0].distributionInventorySHA256,receipt.products[1].distributionInventorySHA256);
 assert.equal(receipt.acquisition.products.length,2);
 for(const product of receipt.acquisition.products) {
  assert.equal(product.archiveSHA256,product.publishedSHA256);
  assert.equal(product.channel,'Stable');
  assert(product.signatureChecks.every(check=>check.exitCode===0));
  assert(receipt.products.some(p=>p.version===product.version&&p.distributionPath===product.distributionPath));
 }
 for(const [path,digest] of Object.entries(receipt.sources))assert.equal(createHash('sha256').update(await read('probes/framework-consumption/'+path)).digest('hex'),digest,path);
 for(const [path,digest] of Object.entries(receipt.toolingSources))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
 const workflow=await json('apps/docs/tests/verification-edge-lines-20261002.json');
 assert.equal(workflow.acquisitionReceiptSHA256,evidence.sha256);
 assert.equal(ledger.conditions.find(c=>c.id==='browser-previous').status,'partial');
});


test('isolated Chrome stable receipt preserves signed retail provenance and exact source identity', async () => {
 const evidence=ledger.evidence.find(e=>e.id==='chrome-stable-framework-20261002');
 const receipt=await json(evidence.path);
 assert.equal(receipt.products.length,1);
 const product=receipt.products[0];
 assert.equal(product.product,'Google Chrome');
 assert.equal(product.version,'154.0.8037.98');
 assert.equal(receipt.acquisition.version,product.version);
 assert.equal(receipt.acquisition.distributionPath,product.distributionPath);
 assert.equal(new URL(receipt.acquisition.archiveURL).hostname,'dl.google.com');
 assert.equal(receipt.acquisition.publishedChecksum,null);
 assert.match(receipt.acquisition.archiveSHA256,/^[a-f0-9]{64}$/);
 assert(receipt.acquisition.archiveBytes>100000000);
 const checks=receipt.acquisition.signatureChecks;
 assert(checks.every(c=>c.exitCode===0));
 assert(checks.some(c=>c.command.includes('--verify')&&c.command.includes('--deep')&&c.command.includes('--strict')));
 assert(checks.some(c=>c.stderr.includes('TeamIdentifier=EQHXZ8M8AV')));
 for(const [path,digest] of Object.entries(receipt.sources))assert.equal(createHash('sha256').update(await read('probes/framework-consumption/'+path)).digest('hex'),digest,path);
 for(const [path,digest] of Object.entries(receipt.toolingSources))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
 const workflow=await json('apps/docs/tests/verification-chrome-stable-20261002.json');
 assert.equal(workflow.acquisitionReceiptSHA256,evidence.sha256);
 assert.equal(ledger.conditions.find(c=>c.id==='browser-current').status,'partial');
});


test('historical expanded native Firefox coverage retains all consumer cohorts', async () => {
 const evidence=ledger.evidence.find(e=>e.id==='firefox-expanded-20261002');
 const receipt=await json(evidence.path);
 assert.equal(receipt.runnerSHA256,'a1d4f6b90b597e4411d4ed65695f5f53c9e8c36f41189c9a3692bd899b25b6f9');
 assert.equal(receipt.acquisitionReceiptSHA256,createHash('sha256').update(await read(receipt.acquisitionReceipt)).digest('hex'));
 assert.deepEqual(receipt.stats,{passed:120,failed:0,planned:120});
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]) {
  const run=receipt.runs[label];assert.equal(run.status,'passed');
  assert.deepEqual(run.stats,{passed:60,failed:0,planned:60});
  const product=run.products[0];assert.equal(run.products.length,1);
  assert.equal(product.version,version);assert.equal(product.capabilities.browserVersion,version);
  assert.equal(product.unchanged,true);assert.match(product.accessibilityQueryScope,/BiDi/);
  for(const cohort of cohorts){const cases=run.cases.filter(c=>c.cohort===cohort.id);assert.equal(cases.length,6);assert(cases.every(c=>c.status==='passed'));assert.equal(new Set(cases.map(c=>c.scenario)).size,6);}
 }
 assert.equal(receipt.runs.preceding.preparationSHA256,receipt.runs.current.preparationSHA256);
 assert.equal(receipt.initialAttempts.length,2);
 for(const attempt of receipt.initialAttempts){assert.deepEqual(attempt.stats,{passed:2,failed:1,planned:60});assert.equal(attempt.failedCase.status,'failed');}
});


test('historical native Firefox workflow receipt retains its qualified runner and unchanged shared inputs', async () => {
 const receipt=await json(ledger.evidence.find(e=>e.id==='firefox-workflows-20261002').path);
 for(const [path,digest] of Object.entries(receipt.inputs))assert.equal(path==='probes/native-browser-products/workflows.mjs'?'e621c97b1c11774535a8e8a89362bb33a5967247ffbd28800712965c05c6e909':(path==='probes/native-browser-products/firefox.mjs'?'b6c377e1bda9955aabd7eb4a8b26efbcc3df0588c4bdb516898296a5b0d42325':createHash('sha256').update(await read(path)).digest('hex')),digest,path);
 assert.equal(receipt.acquisitionReceiptSHA256,createHash('sha256').update(await read(receipt.acquisitionReceipt)).digest('hex'));
 assert.deepEqual(receipt.stats,{passed:22,failed:0,planned:22});
 const expected=['sso-success','sso-retry','sso-cancel','sso-reset','settings-snapshot','settings-retry','settings-incoming','chat-safe-preview','chat-stale','chat-cancel','selection-assignment'];
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const run=receipt.runs[label];assert.equal(run.status,'passed');assert.equal(run.product.version,version);
  assert.equal(run.identityBefore,run.identityAfter);assert.deepEqual(run.stats,{passed:11,failed:0,planned:11});
  assert.deepEqual(run.cases.map(c=>c.id),expected);assert(run.cases.every(c=>c.status==='passed'&&c.capabilities.browserVersion===version));
 }
 assert.equal(receipt.initialAttempts.length,5);assert(receipt.initialAttempts.every(a=>a.stats.failed===1&&a.failedCase.status==='failed'));
 for(const scope of [/Hydration/,/No-JavaScript/,/descriptions/,/workflow/,/physical devices/])assert(receipt.remaining.some(item=>scope.test(item)));assert.match(receipt.nativeSelectPolicy,/typeahead/);
});

test('extracted native Firefox transport requalifies the unchanged six-scenario consumer contract',async()=>{
 const receipt=await json(ledger.evidence.find(e=>e.id==='firefox-workflows-20261002').path);
 assert.deepEqual(receipt.consumerStats,{passed:120,failed:0,planned:120});
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const run=receipt.consumerTransportRequalification[label];assert.equal(run.status,'passed');
  assert.deepEqual(run.stats,{passed:60,failed:0,planned:60});assert.equal(run.products[0].version,version);assert.equal(run.products[0].unchanged,true);
  for(const cohort of cohorts){const cases=run.cases.filter(c=>c.cohort===cohort.id);assert.equal(cases.length,6);assert(cases.every(c=>c.status==='passed'));assert.equal(new Set(cases.map(c=>c.scenario)).size,6);}
 }
});


test('expanded Firefox workflow evidence covers recovery, disposal, RTL and document navigation',async()=>{
 const receipt=await json(ledger.evidence.find(e=>e.id==='firefox-recovery-20261002').path);
 for(const [path,digest] of Object.entries(receipt.inputs))assert.equal((path==='probes/native-browser-products/firefox.mjs'?'b6c377e1bda9955aabd7eb4a8b26efbcc3df0588c4bdb516898296a5b0d42325':(path==='probes/native-browser-products/workflows.mjs'?'829bbc75dc02af47bb60ccf493f5902f01847a20a85e9d2031b53adc9a578141':createHash('sha256').update(await read(path)).digest('hex'))),digest,path);
 assert.equal(receipt.previousReceiptSHA256,createHash('sha256').update(await read(receipt.previousReceipt)).digest('hex'));
 const previous=await json(receipt.previousReceipt);
 for(const path of ['probes/native-browser-products/firefox.mjs','probes/native-browser-products/run.mjs'])assert.equal(receipt.inputs[path],previous.inputs[path]);
 assert.deepEqual(receipt.stats,{passed:40,failed:0,planned:40});
 assert.deepEqual(receipt.initialAttempt.preceding.stats,{passed:20,failed:0,planned:20});assert.deepEqual(receipt.initialAttempt.current.stats,{passed:10,failed:1,planned:20});
 const added=['sso-validation','settings-invalid-reset','chat-retry','chat-invalid-proposals','chat-permission-target','workflow-reconnect','selection-options-reset','selection-rtl','workflow-navigation'];
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const run=receipt.runs[label];assert.equal(run.status,'passed');assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);
  assert.deepEqual(run.stats,{passed:20,failed:0,planned:20});assert.equal(run.cases.find(c=>c.id==='chat-retry').draftEstablishedBeforeReply,true);assert.deepEqual(run.cases.map(c=>c.id),[...previous.runs[label].cases.map(c=>c.id),...added]);assert(run.cases.every(c=>c.status==='passed'&&c.capabilities.browserVersion===version));
 }
 for(const scope of [/Hydration/,/No-JavaScript/,/descriptions/,/Playwright/,/physical devices/])assert(receipt.remaining.some(item=>scope.test(item)));
});


test('Firefox first paint binds current sources and isolated no-JS/hydration evidence',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-first-paint-20261002').path);
 for(const [path,digest] of Object.entries(r.inputs))assert.equal((path==='probes/native-browser-products/workflows.mjs'?'829bbc75dc02af47bb60ccf493f5902f01847a20a85e9d2031b53adc9a578141':(path==='probes/native-browser-products/firefox.mjs'?'dc5a2b5dc86b328b50d6c64e0e213a450d89240c112f362f397e539a9a989c7d':(path==='probes/native-browser-products/first-paint.mjs'?'570516b20c32195987cec9abe43aa69800ac92d4b6b27da42544fb7a53a8530a':createHash('sha256').update(await read(path)).digest('hex')))),digest,path);
 assert.equal(r.previousReceiptSHA256,createHash('sha256').update(await read(r.previousReceipt)).digest('hex'));
 assert.deepEqual(r.stats,{passed:170,failed:0,planned:170});assert.equal(r.attempts.length,4);
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const run=r.runs['first-paint'][label];assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);assert.deepEqual(run.stats,{passed:5,failed:0,planned:5});
  assert(run.cases.every(c=>c.status==='passed'&&c.capabilities.browserVersion===version));
  const nojs=run.cases[0];assert.equal(nojs.javaScriptEnabled,false);assert.deepEqual(nojs.scriptCanary,{inline:null,external:null});assert.equal(nojs.documents.length,12);assert(nojs.documents.every(d=>d.isolated&&d.unhydrated));assert.equal(new Set(nojs.documents.map(d=>d.path)).size,12);
  for(const c of run.cases.slice(1)){assert.equal(c.javaScriptEnabled,true);assert.deepEqual(c.scriptCanary,{inline:'ran',external:'ran'});assert(c.heldModulePaths.length>0);assert(c.earlyTargets.length>0);assert.equal(c.hydratedNamesAndIdentityVerified,true);}
 }
});

test('Firefox changed transport requalifies all consumer and workflow cases',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-first-paint-20261002').path);
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const consumer=r.runs.consumers[label];assert.equal(consumer.status,'passed');assert.deepEqual(consumer.stats,{passed:60,failed:0,planned:60});assert.equal(consumer.products[0].version,version);assert.equal(consumer.products[0].unchanged,true);
  for(const cohort of cohorts){const cases=consumer.cases.filter(c=>c.cohort===cohort.id);assert.equal(cases.length,6);assert(cases.every(c=>c.status==='passed'));}
  const run=r.runs.workflows[label];assert.equal(run.status,'passed');assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);assert.deepEqual(run.stats,{passed:20,failed:0,planned:20});assert(run.cases.every(c=>c.status==='passed'));assert.equal(run.cases.find(c=>c.id==='chat-retry').draftEstablishedBeforeReply,true);
 }
});


test('native Firefox accessibility coverage retains exact axe scope and separate manual limits',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-accessibility-20261002').path);
 for(const [path,digest] of Object.entries(r.inputs))assert.equal((path==='probes/native-browser-products/firefox.mjs'?'dc5a2b5dc86b328b50d6c64e0e213a450d89240c112f362f397e539a9a989c7d':path==='probes/native-browser-products/workflows.mjs'?'c99c59ca0dadbb8773d5d6f8c875b4b220223386259dd46ce60fc2e7b3a7c8ee':(path==='probes/native-browser-products/first-paint.mjs'?'570516b20c32195987cec9abe43aa69800ac92d4b6b27da42544fb7a53a8530a':createHash('sha256').update(await read(path)).digest('hex'))),digest,path);
 for(const [path,digest] of Object.entries(r.axe.sources))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
 assert.equal(r.previousReceiptSHA256,createHash('sha256').update(await read(r.previousReceipt)).digest('hex'));
 assert.deepEqual(r.stats,{passed:44,failed:0,planned:44});assert.deepEqual(r.axe.tags,['wcag2a','wcag2aa','wcag21aa','wcag22aa']);
 const previous=await json(r.previousReceipt);for(const path of ['probes/native-browser-products/firefox.mjs','probes/native-browser-products/run.mjs','probes/native-browser-products/first-paint.mjs'])assert.equal(r.inputs[path],previous.inputs[path]);
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const run=r.runs[label];assert.equal(run.status,'passed');assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);assert.deepEqual(run.stats,{passed:22,failed:0,planned:22});assert(run.cases.every(c=>c.status==='passed'&&c.capabilities.browserVersion===version));
  const scans=run.cases.flatMap(c=>c.accessibilityScans??[]);assert.equal(scans.length,8);for(const scan of scans){assert.deepEqual(scan.violations,[]);assert.equal(scan.version,r.axe.version);assert.match(scan.sha256,/^[a-f0-9]{64}$/);assert(scan.passes>0);}
  assert.equal(run.cases.find(c=>c.id==='workflow-accessibility').statusOwners.length,3);assert.equal(run.cases.find(c=>c.id==='workflow-accessibility').nativeMenuTriggerVerified,true);const relationships=run.cases.find(c=>c.id==='selection-rtl').popupRelationships;assert.equal(relationships.length,2);assert(relationships.every(r=>r.browserComputedListboxName==='Project'&&r.controls.every(c=>c.sameRoot&&c.visible&&c.expanded==='true')));
  const viewports=run.cases.find(c=>c.id==='workflow-narrow-rtl').viewports;assert.equal(viewports.length,6);assert(viewports.every(v=>v.direction==='rtl'&&v.scrollWidth<=v.width+1));
 }
 assert(r.remaining.some(x=>/speech/.test(x)));assert(r.remaining.some(x=>/history/.test(x)));assert(r.remaining.some(x=>/physical/.test(x)));
});


test('Firefox history receipt binds native traversal and all preview-context branches',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-history-20261002').path);
 for(const [path,digest] of Object.entries(r.inputs))assert.equal((path==='probes/native-browser-products/first-paint.mjs'?'570516b20c32195987cec9abe43aa69800ac92d4b6b27da42544fb7a53a8530a':path==='probes/native-browser-products/workflows.mjs'?'7a089e8e368c0dc6ef300150e5c9635ba5788ab7079db874cbea8247ce3eaff8':(path==='probes/native-browser-products/firefox.mjs'?'164508153317d02107d9671da9b65ed2a608c19bab5dbae0f07af5f56ca8d917':path==='probes/native-browser-products/first-paint.mjs'?'5854ebdd9a185bb44af6ceee4b83897adf1063bf558eae98d66b59dbf30e6ea1':createHash('sha256').update(await read(path)).digest('hex'))),digest,path);
 assert.equal(r.previousReceiptSHA256,createHash('sha256').update(await read(r.previousReceipt)).digest('hex'));assert.equal(r.historyProtocol,'browsingContext.traverseHistory');assert.deepEqual(r.stats,{passed:176,failed:0,planned:176});
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const run=r.runs.workflows[label];assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);assert.deepEqual(run.stats,{passed:23,failed:0,planned:23});assert(run.cases.every(c=>c.status==='passed'&&c.capabilities.browserVersion===version));
  const h=run.cases.find(c=>c.id==='workflow-history');assert.equal(h.protocol,r.historyProtocol);assert(h.freshLinkResetsFixture&&h.unknownQueryNormalized);assert.deepEqual(h.historyCheckpoints.map(c=>c.label),['fresh-settings','reset-keeps-code-and-context','fresh-chat','history-back','history-forward','fresh-sign-in','legacy-settings','legacy-chat']);
  for(const c of h.historyCheckpoints){const u=new URL(c.url);assert(u.searchParams.has('progress-report'));assert.equal(u.searchParams.get('theme'),'dark');assert.equal(u.searchParams.get('direction'),'rtl');assert.equal(u.pathname,c.path);}
 }
});

test('Firefox history transport freshly requalifies first-paint and all consumer cohorts',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-history-20261002').path);
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const fp=r.runs['first-paint'][label];assert.equal(fp.product.version,version);assert.equal(fp.identityBefore,fp.identityAfter);assert.deepEqual(fp.stats,{passed:5,failed:0,planned:5});assert(fp.cases.every(c=>c.status==='passed'));assert.equal(fp.cases[0].documents.length,12);assert(fp.cases.slice(1).every(c=>c.hydratedNamesAndIdentityVerified));
  const consumer=r.runs.consumers[label];assert.deepEqual(consumer.stats,{passed:60,failed:0,planned:60});assert.equal(consumer.products[0].version,version);assert.equal(consumer.products[0].unchanged,true);for(const cohort of cohorts){const cases=consumer.cases.filter(c=>c.cohort===cohort.id);assert.equal(cases.length,6);assert(cases.every(c=>c.status==='passed'));}
 }
 assert(r.remaining.some(x=>/description/.test(x)));assert(r.remaining.some(x=>/physical/.test(x)));assert(r.remaining.some(x=>/contrast/.test(x)));
});


test('Firefox readiness receipt binds authored registration and validation relationships',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-readiness-20261002').path);
 for(const [path,digest] of Object.entries(r.inputs))assert.equal((path==='probes/native-browser-products/workflows.mjs'?'0cbe9c0170813492259646d4ca8fd2a1e5bb040819d97591f49ef5bd2e16d1d3':(path==='probes/native-browser-products/firefox.mjs'?'164508153317d02107d9671da9b65ed2a608c19bab5dbae0f07af5f56ca8d917':path==='probes/native-browser-products/first-paint.mjs'?'5854ebdd9a185bb44af6ceee4b83897adf1063bf558eae98d66b59dbf30e6ea1':createHash('sha256').update(await read(path)).digest('hex'))),digest,path);
 assert.equal(r.previousReceiptSHA256,createHash('sha256').update(await read(r.previousReceipt)).digest('hex'));assert.deepEqual(r.stats,{passed:56,failed:0,planned:56});
 const prior=await json(r.previousReceipt);assert.equal(r.consumerEvidenceReuse.passes,120);for(const p of ['probes/native-browser-products/firefox.mjs','probes/native-browser-products/run.mjs'])assert.equal(r.inputs[p],prior.inputs[p]);
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  for(const [lane,count] of [['workflows',23],['first-paint',5]]){
   const run=r.runs[lane][label];assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);assert.deepEqual(run.stats,{passed:count,failed:0,planned:count});
   for(const c of run.cases){assert.equal(c.status,'passed');if(c.id==='no-js-documents'){assert.equal(c.javaScriptEnabled,false);assert.equal(c.documents.length,12);assert(!c.readinessCheckpoints);continue;}
    assert(c.readinessCheckpoints.length);for(const s of c.readinessCheckpoints){assert(s.ready&&s.children.length&&s.children.every(c=>c.ready));assert.equal(s.dormantCount,s.scene==='settings'?1:0);const dormant=s.children.filter(c=>c.dormant);assert.equal(dormant.length,s.dormantCount);for(const d of dormant){assert.equal(d.tag,'en-command-palette');assert.equal(d.id,'settings-command-palette');}}
   }
  }
  const cases=r.runs.workflows[label].cases,description=cases.find(c=>c.id==='sso-validation').descriptionRelationships;
  assert.match(description.scope,/not native/);assert.equal(description.invalid.invalid,'true');assert.equal(description.invalid.targets.length,2);assert(description.invalid.targets.every(t=>t.resolved));assert.equal(description.invalid.targets[1].text,description.invalid.nativeMessage);assert.equal(description.valid.valid,true);assert.deepEqual(description.valid.targets,[description.invalid.targets[0]]);
  const error=cases.find(c=>c.id==='settings-invalid-reset').errorRelationship;assert(error.referenced&&error.visible&&error.text.length);
 }
 assert(r.remaining.some(x=>/computed/.test(x)));assert(r.remaining.some(x=>/manual/.test(x)));
});


test('Firefox interaction evidence binds pending states, focus and exact isolation names',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-interactions-20261002').path);
 for(const [path,digest] of Object.entries(r.inputs))assert.equal((path==='probes/native-browser-products/firefox.mjs'?'164508153317d02107d9671da9b65ed2a608c19bab5dbae0f07af5f56ca8d917':path==='probes/native-browser-products/first-paint.mjs'?'5854ebdd9a185bb44af6ceee4b83897adf1063bf558eae98d66b59dbf30e6ea1':createHash('sha256').update(await read(path)).digest('hex')),digest,path);
 assert.equal(r.previousReceiptSHA256,createHash('sha256').update(await read(r.previousReceipt)).digest('hex'));assert.deepEqual(r.stats,{passed:46,failed:0,planned:46});
 const prior=await json(r.previousReceipt);for(const [p,digest] of Object.entries(r.inputs))if(!p.endsWith('/workflows.mjs'))assert.equal(digest,prior.inputs[p]);assert.equal(r.unchangedEvidenceReuse.firstPaint.passes,10);assert.equal(r.unchangedEvidenceReuse.consumers.passes,120);
 const flags={'settings-snapshot':'cancelFocusAndDirtyStateVerified','settings-incoming':'unrelatedChoicesPreserved','chat-safe-preview':'pendingCardAndInvalidApplyVerified','chat-stale':'draftEstablishedBeforeApply','chat-cancel':'postResetEditingAndCancelFocusVerified'};
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  const run=r.runs[label];assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);assert.deepEqual(run.stats,{passed:23,failed:0,planned:23});assert(run.cases.every(c=>c.status==='passed'));
  for(const [id,flag] of Object.entries(flags))assert.equal(run.cases.find(c=>c.id===id)[flag],true);
  for(const c of run.cases)for(const s of c.readinessCheckpoints)if(['sso','settings','chat'].includes(s.scene)){const i=s.isolation;assert(i.title&&i.label&&i.sceneVisible);assert.equal(i.primaryScenes,1);assert.equal(i.links,6);for(const key of ['current','tools','disclosures','source'])assert.equal(i[key],1);}
 }
 assert.equal(r.attempts.length,2);for(const a of r.attempts){assert.equal(a.stats.failed,1);assert.equal(a.case,'chat-safe-preview');assert(a.disposition);}
 assert(r.remaining.some(x=>/computed/.test(x)));assert(r.remaining.some(x=>/HTTP/.test(x)));assert(r.remaining.some(x=>/packed/.test(x)));
});

test('packed delivery qualification binds native module graphs and real SSR failure coverage', async () => {
 const evidence=ledger.evidence.find(e=>e.id==='packed-delivery-20261002'),receipt=await json(evidence.path);
 // This receipt predates the additive metadata-consumer pathway. Keep the
 // actual qualified orchestration sources, not a claim that it ran newer code.
 for(const [path,digest] of Object.entries(receipt.sourceInputs)) {
  const historical = ['tooling/testing/comprehensive.mjs','tooling/testing/comprehensive.test.mjs'].includes(path)
   ? 'probes/consumer-contracts/qualification-sources/20261002/'+path.split('/').at(-1)+'.txt' : path;
  assert.equal(createHash('sha256').update(await read(historical)).digest('hex'),digest,path);
 }
 assert.equal(receipt.status,'passed');assert.deepEqual(receipt.stats,{nativeESMPassed:21,consumerPassed:53,consumerSkipped:1,unexpected:0,flaky:0,pathwayContractPassed:13});
 for(const id of ['packed-html','packed-ssr']){const c=ledger.conditions.find(c=>c.id===id);assert.equal(c.status,'qualified');assert.equal(c.evidence[0],evidence.id);assert.match(c.qualificationBoundary,/selected packed SSR/);}
 const native=receipt.nativeESM;
 assert.equal(createHash('sha256').update(JSON.stringify({imports:native.importMap.imports})).digest('hex'),native.importMap.sha256);
 assert.equal(native.results.length,21);
 for(const engine of ['chromium','firefox','webkit']){
  const cases=native.results.filter(c=>c.engine===engine);assert.equal(cases.length,7);assert(cases.every(c=>c.status==='passed'&&c.errors.length===0));
  for(const scenario of ['related-pair','unrelated-pair']){
   const c=cases.find(c=>c.scenario===scenario),modules=c.requests.filter(url=>url.endsWith('.js'));
   assert.equal(new Set(modules).size,modules.length);assert(!modules.some(url=>/\/elements\/dist\/(catalog|index)\.js$/.test(url)));
   assert.deepEqual([...c.registeredTags].sort(),['en-splitter','en-button','en-split-view',...(scenario==='unrelated-pair'?['en-checkbox']:[])].sort());
   for(const url of modules)assert.match(native.servedAssets[url].sha256,/^[a-f0-9]{64}$/);
  }
  for(const delivery of ['shadow','global'])for(const fragment of ['immediate packed hydration','failed hydration module','packed SSR preserves dirty','server native input is usable']){
   const c=receipt.consumer.cases.find(c=>c.project===engine&&c.name.startsWith(delivery+': ')&&c.name.includes(fragment));assert.equal(c?.status,'passed',`${engine}/${delivery}/${fragment}`);
  }
 }
 const requests=receipt.consumer.ssr.requestIsolation;assert.equal(requests.callerRegistryUntouched,true);assert.equal(requests.distinctHTML,true);assert.equal(new Set(requests.htmlSHA256).size,2);
 assert.equal(receipt.consumer.cases.length,54);const skips=receipt.consumer.cases.filter(c=>c.status==='skipped');assert.equal(skips.length,1);assert.equal(skips[0].project,'firefox');assert.match(skips[0].name,/native only/);
 assert.match(receipt.limitations.join(' '),/ElementInternals/);
});

test('metadata discovery qualification binds generated packed source, types and real interactions',async()=>{
 const evidence=ledger.evidence.find(e=>e.id==='metadata-consumer-20261002'),r=await json(evidence.path);
 assert.equal(createHash('sha256').update(await read(evidence.path)).digest('hex'),evidence.sha256);
 for(const [path,digest] of Object.entries(r.sourceInputs)) {
  const retained=['tooling/testing/comprehensive.mjs','tooling/testing/comprehensive.test.mjs'].includes(path)
   ?'tooling/metadata/verification/qualification-sources/7801a8da/'+path.split('/').at(-1)+'.txt':path;
  assert.equal(createHash('sha256').update(await read(retained)).digest('hex'),digest,path);
 }
 assert.equal(r.status,'passed');assert.equal(r.consumer.status,'passed');assert.equal(r.consumer.types.status,'passed');
 assert.deepEqual(r.stats,{browserPassed:9,generationControlsPassed:11,pathwayControlsPassed:14,unexpected:0});
 for(const [name,bytes] of Object.entries(r.generatedSource))assert.equal(createHash('sha256').update(bytes).digest('hex'),r.consumer.generated[name==='source'?'sourceSHA256':'htmlSHA256']);
 assert.equal(r.consumer.discovery.selected.tagName,'en-checkbox');assert.deepEqual(r.consumer.discovery.results.map(x=>x.tagName),['en-checkbox','en-radio','en-switch']);
 assert.deepEqual(r.consumer.types.negativeDiagnostics,['TS2322','TS2339']);
 assert(r.consumer.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert.equal(r.consumer.cases.length,9);
 for(const engine of ['chromium','firefox','webkit']) {
  const rows=r.consumer.cases.filter(c=>c.engine===engine);assert.equal(rows.length,3);assert(rows.every(c=>c.status==='passed'&&c.errors.length===0));
  const transaction=rows.find(c=>c.scenario==='transaction-and-form');assert.equal(transaction.final.checked,true);assert.equal(transaction.final.data,'accepted');assert.equal(transaction.final.observations.length,3);
  assert.deepEqual(transaction.final.observations[1],{previous:false,proposed:true,checked:true,data:'accepted',bubbles:true,composed:true,cancelable:true});
  assert.deepEqual(rows.find(c=>c.scenario==='silent-authority-and-reset').final.observations,[]);
 }
 const condition=ledger.conditions.find(c=>c.id==='packed-api-discovery');assert.equal(condition.status,'qualified');assert(condition.evidence.includes(evidence.id));assert.match(condition.qualificationBoundary,/selected checkbox/);
 assert.match(r.limitations.join(' '),/generated examples/);
});


test('native Firefox document evidence detects response failures and requalifies shared transport',async()=>{
 const r=await json(ledger.evidence.find(e=>e.id==='firefox-documents-20261002').path);
 for(const [path,digest] of Object.entries(r.inputs))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
 assert.equal(r.previousReceiptSHA256,createHash('sha256').update(await read(r.previousReceipt)).digest('hex'));assert.deepEqual(r.stats,{passed:178,failed:0,planned:178});assert.equal(r.networkProtocol,'network.responseCompleted');
 for(const [label,version] of [['preceding','156.0.1'],['current','157.0']]){
  for(const [lane,count] of [['first-paint',6],['workflows',23],['consumers',60]]){
   const run=r.runs[lane][label];assert.equal(run.status,'passed');assert.deepEqual(run.stats,{passed:count,failed:0,planned:count});assert(run.cases.every(c=>c.status==='passed'));
   if(lane==='consumers'){assert.equal(run.products[0].version,version);assert.equal(run.products[0].unchanged,true);}else{assert.equal(run.product.version,version);assert.equal(run.identityBefore,run.identityAfter);}
  }
  const run=r.runs['first-paint'][label],control=run.cases.find(c=>c.id==='network-controls'),documents=run.cases.find(c=>c.id==='no-js-documents');
  assert.equal(control.responseControls.missing.status,404);assert.equal(control.responseControls.missing.redirectCount,0);assert.equal(control.responseControls.redirected.status,200);assert.equal(control.responseControls.redirected.redirectCount,1);assert.equal(control.responseControls.redirected.finalPath,'/__probe__/script-state.html');
  assert.equal(documents.home.status,200);assert.equal(documents.home.redirectCount,0);assert.deepEqual(documents.home.headerLink,{name:'Workflows',href:'/workflows'});assert.deepEqual(documents.scriptCanary,{inline:null,external:null});
  assert.equal(documents.documents.length,12);assert.equal(new Set(documents.documents.map(d=>d.path)).size,12);
  for(const document of documents.documents){assert(document.isolated&&document.visible&&document.unhydrated);assert.equal(document.response.status,200);assert.equal(document.response.redirectCount,0);assert.equal(document.response.requestedPath,document.path);assert.equal(document.response.finalPath,document.path);assert(document.response.navigation&&document.response.request);assert.deepEqual(document.headerLink,{name:'Workflows',href:'/workflows'});if(['sso','settings','chat'].includes(document.id)){assert.match(document.resetName,/^Reset /);assert.match(document.templateSource,/ template source$/);}}
  assert(run.cases.filter(c=>c.id.endsWith('-hydration')).every(c=>c.hydratedNamesAndIdentityVerified));
 }
});

test('packed reusable-layer receipt preserves alternate-composition bounds and unresolved exports',async()=>{
 const r=await json('probes/reusable-layers/verification-20261002.json'),inventory=await json('probes/reusable-layers/inventory.json');
 assert.equal(r.status,'passed');assert.equal(r.stats.expected,48);assert.equal(r.stats.unexpected,0);assert.equal(r.stats.skipped,0);
 assert.equal(r.nodeControls.passed,17);assert.equal(r.packed.types.status,'passed');
 for(const [path,digest] of Object.entries(r.sourceInputs)) {
  const retained=['tooling/testing/comprehensive.mjs','tooling/testing/comprehensive.test.mjs','tooling/testing/browser-ports.mjs'].includes(path)
   ?'probes/reusable-layers/qualification-sources/9d2138dc/'+path.split('/').at(-1)+'.txt':path;
  assert.equal(createHash('sha256').update(await read(retained)).digest('hex'),digest,path);
 }
 for(const engine of ['chromium','firefox','webkit'])for(const [composition,count] of [['core',12],['recipes',4]]){
  const cases=r.cases.filter(c=>c.project===engine+'-'+composition);assert.equal(cases.length,count);assert(cases.every(c=>c.status==='passed'));
 }
 assert.deepEqual(r.packed.packages.map(p=>p.name).sort(),['@en-reve/primitives','@en-reve/styles','@en-reve/tokens']);
 assert(r.packed.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert(r.packed.inputs.every(path=>!path.includes('/@en-reve/elements/')&&!/\/packages\/[^/]+\/src\//.test(path)));
 const qualified=inventory.entries.filter(e=>e.receipt==='probes/reusable-layers/verification-20261002.json');assert.equal(qualified.length,15);
 assert.equal(qualified.filter(e=>e.entry.startsWith('@en-reve/primitives/')).length,12);
 assert(qualified.every(e=>e.delivery==='module')); // This first batch did not execute portable CSS.
 assert.match(r.limitations.join(' '),/Generated examples remain/);
});

test('native recipe qualification binds both style deliveries, real SSR and original fixture owners',async()=>{
 const r=await json('probes/native-recipes/verification-20261002.json'),inventory=await json('probes/reusable-layers/inventory.json');
 assert.equal(r.status,'passed');assert.equal(r.nodeControls.passed,18);assert.equal(r.packed.types.status,'passed');
 for(const [path,digest] of Object.entries(r.sourceInputs)){
  const archived=["tooling/testing/comprehensive.mjs", "tooling/testing/comprehensive.test.mjs", "tooling/testing/browser-ports.mjs", "probes/reusable-layers/inventory.json", "probes/reusable-layers/inventory.test.mjs"].includes(path)?'probes/native-recipes/qualification-sources/3f2990e6/'+path.split('/').at(-1)+'.txt':path;
  assert.equal(createHash('sha256').update(await read(archived)).digest('hex'),digest,path);
 }
 for(const [name,count] of [['packed',78],['content-owner',18],['navigation-owner',21]]){
  const report=r.reports[name];assert.equal(report.stats.expected,count);assert.equal(report.stats.unexpected,0);assert.equal(report.stats.skipped,0);assert(report.cases.every(c=>c.status==='passed'));
 }
 for(const engine of ['chromium','firefox','webkit'])for(const delivery of ['lit','css'])for(const [family,count] of [['content',6],['navigation',7]])assert.equal(r.reports.packed.cases.filter(c=>c.project===`${engine}-${family}-${delivery}`).length,count);
 assert(r.packed.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert(!r.packed.entryInputs.navigation.some(path=>path.includes('/@en-reve/elements/')));
 assert.deepEqual(r.packed.inputs.filter(path=>path.includes('/elements/dist/define/')).map(path=>path.split('/').at(-1)),['skeleton.js']);
 assert.equal(Object.keys(r.packed.pages).length,16);
 assert.deepEqual(Object.keys(r.packed.portableCSS).sort(),['@en-reve/styles/content.css','@en-reve/styles/foundations.css','@en-reve/styles/navigation.css']);
 const qualified=inventory.entries.filter(e=>e.receipt==='probes/native-recipes/verification-20261002.json');assert.equal(qualified.length,8);assert.equal(qualified.filter(e=>e.delivery==='css').length,3);
 assert.match(r.limitations.join(' '),/generated examples remain pending/);
});

test('packed collection qualification binds maintained assertions, native SSR and bounded public-layer scope',async()=>{
 const r=await json('probes/collection-recipes/verification-20261002.json'),inventory=await json('probes/reusable-layers/inventory.json');
 assert.equal(r.status,'passed');assert.equal(r.report.passed,81);assert.equal(r.report.workers,1);assert.equal(r.packed.types.status,'passed');
 for(const [path,digest] of Object.entries(r.sourceInputs)){const retained=["tooling/testing/comprehensive.mjs", "tooling/testing/comprehensive.test.mjs", "tooling/testing/browser-ports.mjs", "probes/reusable-layers/inventory.json", "probes/reusable-layers/inventory.test.mjs"].includes(path)?'probes/collection-recipes/qualification-sources/f186cb6f/'+path.split('/').at(-1)+'.txt':path;assert.equal(createHash('sha256').update(await read(retained)).digest('hex'),digest,path);}
 assert(r.report.cases.every(c=>c.status==='passed'&&c.retry===0));
 assert.equal(r.originalOwner.status,'passed');assert.equal(r.originalOwner.passed,51);assert(r.originalOwner.cases.every(c=>c.status==='passed'));
 assert.equal(Object.values(r.originalOwner.sourceHashes)[0],r.sourceInputs['apps/docs/tests/virtual-collection.spec.ts']);
 for(const engine of ['chromium','firefox','webkit']){
  assert.equal(r.report.cases.filter(c=>c.project===`${engine}-table`).length,17);
  for(const width of [1280,390])assert.equal(r.report.cases.filter(c=>c.project===`${engine}-document-${width}`).length,5);
 }
 assert(r.packed.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert(!r.packed.entryInputs.document.some(path=>path.includes('/@en-reve/elements/')));
 assert.deepEqual(r.packed.definitions,['button.js','checkbox.js','icon.js','pagination.js','select.js','table.js','text-field.js']);
 assert.deepEqual(Object.keys(r.packed.pages).sort(),['document.html','table.html']);
 const qualified=inventory.entries.filter(e=>e.receipt==='probes/collection-recipes/verification-20261002.json');assert.equal(qualified.length,7);
 assert(qualified.every(e=>e.delivery==='module'));
 assert.match(r.limitations.join(' '),/Generated examples remain pending/);assert.match(r.limitations.join(' '),/VoiceOver reading-cursor issue remains open/);
});

test('packed projection receipt binds four named entries to native alternate compositions',async()=>{
 const r=await json('probes/projection-recipes/verification-20261002.json'),inventory=await json('probes/reusable-layers/inventory.json');
 assert.equal(r.status,'passed');assert.equal(r.stats.expected,36);assert.equal(r.stats.unexpected,0);assert.equal(r.stats.skipped,0);assert.equal(r.stats.flaky,0);
 for(const [path,digest] of Object.entries(r.sourceInputs)){const retained=['tooling/testing/comprehensive.mjs','tooling/testing/comprehensive.test.mjs','tooling/testing/browser-ports.mjs','probes/reusable-layers/inventory.json','probes/reusable-layers/inventory.test.mjs'].includes(path)?'probes/projection-recipes/qualification-sources/661aac85/'+path.split('/').at(-1)+'.txt':path;assert.equal(createHash('sha256').update(await read(retained)).digest('hex'),digest,path);}
 for(const engine of ['chromium','firefox','webkit'])assert.equal(r.cases.filter(c=>c.project===engine&&c.status==='passed'&&c.retry===0).length,12);
 assert.equal(r.packed.types.status,'passed');assert(r.packed.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert(!r.packed.inputs.some(path=>path.includes('/@en-reve/elements/')||/\/packages\/[^/]+\/src\//.test(path)));
 const qualified=inventory.entries.filter(row=>row.receipt==='probes/projection-recipes/verification-20261002.json');assert.equal(qualified.length,4);assert(qualified.every(row=>row.delivery==='module'));
 assert.match(r.limitations.join(' '),/SSR and hydration are not implied/);assert.match(r.limitations.join(' '),/other76/);
});

test('packed form receipt binds six public entries to native form transactions and both style deliveries',async()=>{
 const r=await json('probes/form-recipes/verification-20261002.json'),inventory=await json('probes/reusable-layers/inventory.json');
 assert.equal(r.status,'passed');assert.equal(r.stats.expected,72);for(const key of ['unexpected','skipped','flaky'])assert.equal(r.stats[key],0);
 for(const [path,digest] of Object.entries(r.sourceInputs)){const retained=['tooling/testing/comprehensive.mjs','tooling/testing/comprehensive.test.mjs','tooling/testing/browser-ports.mjs','probes/reusable-layers/inventory.json','probes/reusable-layers/inventory.test.mjs'].includes(path)?'probes/form-recipes/qualification-sources/9a84dceb/'+path.split('/').at(-1)+'.txt':path;assert.equal(createHash('sha256').update(await read(retained)).digest('hex'),digest,path);}
 for(const engine of ['chromium','firefox','webkit'])assert.equal(r.cases.filter(c=>c.project===engine&&c.status==='passed'&&c.retry===0).length,24);
 assert.equal(r.packed.types.status,'passed');assert(r.packed.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert(!r.packed.inputs.some(path=>path.includes('/@en-reve/elements/')||/\/packages\/[^/]+\/src\//.test(path)));
 assert.deepEqual(Object.keys(r.packed.portableCSS).sort(),['@en-reve/styles/file-upload.css','@en-reve/styles/form-navigation.css']);
 const rows=inventory.entries.filter(row=>row.receipt==='probes/form-recipes/verification-20261002.json');assert.equal(rows.length,6);assert.equal(rows.filter(row=>row.delivery==='css').length,2);
 assert.match(r.limitations.join(' '),/SSR and hydration are not implied/);assert.match(r.limitations.join(' '),/drop payloads are synthetic/);assert.match(r.limitations.join(' '),/other70/);
});

test('packed state receipt binds native application journeys and real lazy chunks to five public entries',async()=>{
 const r=await json('probes/state-recipes/verification-20261002.json'),inventory=await json('probes/reusable-layers/inventory.json');
 assert.equal(r.status,'passed');assert.equal(r.stats.expected,48);for(const key of ['unexpected','skipped','flaky'])assert.equal(r.stats[key],0);
 for(const [path,digest] of Object.entries(r.sourceInputs)){const retained=['tooling/testing/comprehensive.mjs','tooling/testing/comprehensive.test.mjs','tooling/testing/browser-ports.mjs','probes/reusable-layers/inventory.json','probes/reusable-layers/inventory.test.mjs'].includes(path)?'probes/state-recipes/qualification-sources/8c3fe212/'+path.split('/').at(-1)+'.txt':path;assert.equal(createHash('sha256').update(await read(retained)).digest('hex'),digest,path);}
 for(const engine of ['chromium','firefox','webkit'])assert.equal(r.cases.filter(c=>c.project===engine&&c.status==='passed'&&c.retry===0).length,16);
 assert.equal(r.packed.types.status,'passed');assert(r.packed.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert(!r.packed.inputs.some(path=>path.includes('/@en-reve/elements/')||/\/packages\/[^/]+\/src\//.test(path)));assert(Object.keys(r.packed.assets).some(path=>/^lazy-panel-.*\.js$/.test(path)));
 const rows=inventory.entries.filter(row=>row.receipt==='probes/state-recipes/verification-20261002.json');assert.equal(rows.length,5);assert(rows.every(row=>row.delivery==='module'));
 assert.match(r.limitations.join(' '),/SSR and hydration are not implied/);assert.match(r.limitations.join(' '),/consumer-owned/);assert.match(r.limitations.join(' '),/other65/);
});

test('presentation receipt binds native patterns, both style forms and choice SSR regression evidence',async()=>{
 const r=await json('probes/presentation-recipes/verification-20261002.json'),inventory=await json('probes/reusable-layers/inventory.json');
 assert.equal(r.status,'passed');assert.equal(r.nodeControls.passed,33);
 for(const [path,digest] of Object.entries(r.sourceInputs))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
 for(const [name,count] of [['packed',114],['gallery',32]]){assert.equal(r.reports[name].stats.expected,count);for(const key of ['unexpected','skipped','flaky'])assert.equal(r.reports[name].stats[key],0);assert(r.reports[name].cases.every(c=>c.status==='passed'&&c.retry===0));}
 for(const engine of ['chromium','firefox','webkit'])assert.equal(r.reports.packed.cases.filter(c=>c.project===engine).length,38);
 assert.equal(r.packed.types.status,'passed');assert(r.packed.types.packedDeclarations.every(path=>path.startsWith('node_modules/@en-reve/')));
 assert(!r.packed.inputs.some(path=>path.includes('/@en-reve/elements/')||/\/packages\/[^/]+\/src\//.test(path)));
 assert.equal(Object.keys(r.packed.portableCSS).length,8);
 const rows=inventory.entries.filter(row=>row.receipt==='probes/presentation-recipes/verification-20261002.json');assert.equal(rows.length,14);assert.equal(rows.filter(row=>row.delivery==='css').length,7);
 const build=await json('apps/docs/tests/verification-presentation-recipes-20261002.json');assert.equal(build.status,'passed');assert.equal(build.productionBuild.SSRBuild,'passed');assert.equal(build.productionBuild.run,r.run);
 for(const [path,digest] of Object.entries({...build.inputs,...build.generatedModules}))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
 assert.match(r.limitations.join(' '),/full hydration/);assert.match(r.limitations.join(' '),/other51/);
});
