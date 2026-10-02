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
 for(const [path,digest] of Object.entries(r.inputs))assert.equal((path==='probes/native-browser-products/workflows.mjs'?'829bbc75dc02af47bb60ccf493f5902f01847a20a85e9d2031b53adc9a578141':(path==='probes/native-browser-products/firefox.mjs'?'dc5a2b5dc86b328b50d6c64e0e213a450d89240c112f362f397e539a9a989c7d':createHash('sha256').update(await read(path)).digest('hex'))),digest,path);
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
 for(const [path,digest] of Object.entries(r.inputs))assert.equal((path==='probes/native-browser-products/firefox.mjs'?'dc5a2b5dc86b328b50d6c64e0e213a450d89240c112f362f397e539a9a989c7d':path==='probes/native-browser-products/workflows.mjs'?'c99c59ca0dadbb8773d5d6f8c875b4b220223386259dd46ce60fc2e7b3a7c8ee':createHash('sha256').update(await read(path)).digest('hex')),digest,path);
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
 for(const [path,digest] of Object.entries(r.inputs))assert.equal(createHash('sha256').update(await read(path)).digest('hex'),digest,path);
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
