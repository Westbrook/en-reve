import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyDeliveryInventory} from './verify-delivery-inventory.ts';

const SOURCE = 'source line\nsecond line\n';
const SHA256 = createHash('sha256').update(SOURCE).digest('hex');
const BASELINE = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const EVIDENCE_PATH = 'packages/elements/src/test.ts';

function evidence() {
  return {path:EVIDENCE_PATH, startLine:1, endLine:2, sha256:SHA256};
}

function definition(tagName = 'en-test') {
  return {tagName, className:'TestElement', source:`src/definitions/${tagName.slice(3)}.ts`, dependencies:[]};
}

// A complete source-qualified assessment, with all evidence injected so these
// tests neither inspect the checkout nor depend on baseline Git objects.
function inventory(): any {
  return {
    schemaVersion:1,
    status:'source-qualified',
    source:{commit:BASELINE, tree:TREE, catalogSha256:SHA256, manifestSha256:SHA256,
      graphReaderSha256:SHA256, derivation:'Canonical source definition graph.'},
    compatibility:{ids:'Stable IDs and versions.', defaults:'Eager by default.', costs:'Separate delivery axes.'},
    evidenceLimits:['Source anchors establish ownership, without a new performance claim.'],
    components:[{
      tag:'en-test',
      componentDelivery:{disposition:'implemented', entry:'@en-reve/elements/definitions/test.js',
        loader:'Canonical tag loader.', registration:'Explicit dependencies-first registration.', evidence:[evidence()]},
      publicEntries:{class:'@en-reve/elements/test.js', definition:'@en-reve/elements/definitions/test.js',
        define:'@en-reve/elements/define/test.js'},
      canonicalDependencies:[],
      features:[{
        id:'en-reve/en-test/optional-tool', version:1, disposition:'already-conditional',
        support:'existing-conditional', deferredCosts:[], owner:'component', consumer:'Named specimen consumer.',
        trigger:'Existing explicit action.', fallback:'Essential content remains available.',
        prerequisites:[], semanticDependencies:[], synchronousConstraints:['Cancelable changes remain synchronous.'],
        ssr:'Matching initial server/client snapshot.', retention:'Existing instance lifetime retained.',
        reopeningTrigger:'Reopen for a measured independently useful boundary.',
        rationale:'Existing branch avoids constructing the inactive tool.', qualification:'source-verified',
        deliveryAxes:{componentLoading:'Canonical tag loading.', registration:'Explicit registration.',
          construction:'Existing conditional branch.', optionalCode:'No new internal code split.',
          hydration:'Separately owned hydration.', data:'Existing data ownership.', virtualization:'No new virtualization.'},
        evidence:[evidence()],
      }],
    }],
  };
}

const readEvidence = async (_path: string, _revision: string) => SOURCE;
const verify = (value: any, options: any = {}, definitions: any[] = [definition()]) =>
  verifyDeliveryInventory(value, definitions, {readEvidence, ...options});
const feature = (value: any) => value.components[0].features[0];

function implemented(value = inventory()) {
  Object.assign(feature(value), {disposition:'implemented', support:'supported', deferredCosts:['construction']});
  return value;
}

test('complete source-qualified inventory passes final validation without invented performance acceptance', async () => {
  const value = inventory();
  const before = structuredClone(value);
  await verify(value, {requireFinal:true});
  assert.deepEqual(value, before, 'validation must preserve the declared provenance and limits');
});

test('catalog growth fails until every new canonical tag has an assessment', async () => {
  await assert.rejects(verify(inventory(), {}, [definition(), definition('en-new')]), /tag|catalog|coverage|missing/i);
});

test('inventory rejects an extra noncanonical tag and duplicate component rows', async () => {
  const extra = inventory();
  extra.components.push({...structuredClone(extra.components[0]), tag:'en-stale'});
  await assert.rejects(verify(extra), /tag|catalog|coverage|unexpected/i);
  const duplicate = inventory();
  duplicate.components.push(structuredClone(duplicate.components[0]));
  await assert.rejects(verify(duplicate), /duplicate|unique|tag/i);
});

test('each canonical component requires at least one assessed feature', async () => {
  const value = inventory();
  value.components[0].features = [];
  await assert.rejects(verify(value), /feature|assessment|nonempty/i);
});

test('feature IDs are unique and feature versions are positive integers', async () => {
  const duplicate = inventory();
  duplicate.components[0].features.push(structuredClone(feature(duplicate)));
  await assert.rejects(verify(duplicate), /duplicate|unique|id/i);
  for (const version of [0, -1, 1.5, '1']) {
    const value = inventory();
    feature(value).version = version;
    await assert.rejects(verify(value), /version|identity/i);
  }
});

test('canonical dependency changes invalidate an inventory row even if tag coverage still matches', async () => {
  const value = inventory();
  value.components[0].canonicalDependencies = ['en-stale'];
  await assert.rejects(verify(value), /dependenc/i);
});

test('complete ownership and behavior assessments are mandatory', async () => {
  for (const field of ['owner', 'consumer', 'trigger', 'fallback', 'prerequisites', 'semanticDependencies',
    'synchronousConstraints', 'ssr', 'retention', 'reopeningTrigger', 'rationale', 'qualification']) {
    const value = inventory();
    delete feature(value)[field];
    await assert.rejects(verify(value), new RegExp(field.replace(/[A-Z]/g, letter => ` ?${letter.toLowerCase()}`), 'i'), `${field} cannot be omitted`);
  }
});

test('every delivery cost axis requires a classification', async () => {
  for (const axis of ['componentLoading', 'registration', 'construction', 'optionalCode', 'hydration', 'data', 'virtualization']) {
    const value = inventory();
    delete feature(value).deliveryAxes[axis];
    await assert.rejects(verify(value), /axis|axes/i, `${axis} cannot be omitted`);
  }
  const value = inventory();
  feature(value).deferredCosts = ['unspecified-work'];
  await assert.rejects(verify(value), /cost|axis|classified/i);
});

test('support and disposition must agree', async () => {
  const value = inventory();
  feature(value).support = 'supported';
  await assert.rejects(verify(value), /support|disposition/i);
});

test('component delivery and feature assessments both require evidence', async () => {
  const component = inventory();
  component.components[0].componentDelivery.evidence = [];
  await assert.rejects(verify(component), /evidence/i);
  const value = inventory();
  feature(value).evidence = [];
  await assert.rejects(verify(value), /evidence/i);
});

test('evidence is resolved at the declared baseline and shared blobs are read once per revision', async () => {
  const calls: Array<{path:string; revision:string}> = [];
  await verify(inventory(), {readEvidence:async (path: string, revision: string) => {
    calls.push({path, revision});
    return Buffer.from(SOURCE);
  }});
  assert.ok(calls.length > 0);
  assert.ok(calls.every(call => call.revision === BASELINE));
  assert.equal(calls.filter(call => call.path === EVIDENCE_PATH).length, 1);
  assert.equal(new Set(calls.map(call => `${call.revision}:${call.path}`)).size, calls.length);
});

test('declared source catalog, manifest and graph-reader hashes are verified', async () => {
  for (const field of ['catalogSha256', 'manifestSha256', 'graphReaderSha256']) {
    const value = inventory();
    value.source[field] = '0'.repeat(64);
    await assert.rejects(verify(value), /hash|sha256|digest/i, `${field} must match the baseline blob`);
  }
});

test('source commit and tree identities must be full commit hashes', async () => {
  for (const field of ['commit', 'tree']) {
    const value = inventory();
    value.source[field] = 'HEAD';
    await assert.rejects(verify(value), /commit|tree|revision|source/i);
  }
});

test('evidence SHA-256 is checked against the complete blob', async () => {
  const value = inventory();
  feature(value).evidence[0].sha256 = '0'.repeat(64);
  await assert.rejects(verify(value), /hash|sha256|digest/i);
});

test('evidence line ranges are inclusive, positive, ordered and within the blob', async () => {
  for (const [startLine, endLine] of [[0, 1], [2, 1], [1, 20], [1.5, 2]]) {
    const value = inventory();
    Object.assign(feature(value).evidence[0], {startLine, endLine});
    await assert.rejects(verify(value), /line|range/i);
  }
});

test('unsafe evidence paths and moving revision names are rejected', async () => {
  for (const path of ['/tmp/source.ts', '../source.ts', 'packages/../../source.ts']) {
    const value = inventory();
    feature(value).evidence[0].path = path;
    await assert.rejects(verify(value), /path|relative|escape/i);
  }
  const value = inventory();
  feature(value).evidence[0].revision = 'HEAD';
  await assert.rejects(verify(value), /revision|commit/i);
});

test('missing baseline evidence blobs fail without falling back to working-tree bytes', async () => {
  const calls: string[] = [];
  await assert.rejects(verify(inventory(), {readEvidence:async (path: string, revision: string) => {
    calls.push(revision);
    if (path === EVIDENCE_PATH) throw new Error('Missing baseline Git blob');
    return SOURCE;
  }}), /missing baseline|evidence|blob/i);
  assert.ok(calls.every(revision => revision === BASELINE));
});

test('explicit working-tree evidence remains distinct from baseline evidence and preserves its provenance', async () => {
  const value = inventory();
  feature(value).evidence[0].revision = 'working-tree';
  const calls: Array<{path:string; revision:string}> = [];
  const result = await verify(value, {readEvidence:async (path: string, revision: string) => {
    calls.push({path, revision});
    return SOURCE;
  }});
  assert.equal(result.evidence.workingTreeAnchors, 1);
  assert.deepEqual(result.evidence.revisions, [BASELINE, 'working-tree'].sort());
  assert.equal(feature(value).evidence[0].revision, 'working-tree');
  assert.equal(value.components[0].componentDelivery.evidence[0].revision, undefined);
  assert.deepEqual(calls.filter(call => call.path === EVIDENCE_PATH).map(call => call.revision).sort(),
    [BASELINE, 'working-tree'].sort());
});

test('ordinary validation permits unfinished assessments while final validation refuses them without reclassification', async () => {
  for (const disposition of ['candidate', 'needs-design', 'unassessed']) {
    const value = inventory();
    Object.assign(feature(value), {disposition, support:'not-yet-supported'});
    await verify(value);
    await assert.rejects(verify(value, {requireFinal:true}), /unfinished|final|candidate|needs-design|unassessed/i);
    assert.equal(feature(value).disposition, disposition);
  }
});

test('implemented internal features require explicit qualified or inherited acceptance at final closeout', async () => {
  const value = implemented();
  await verify(value);
  await assert.rejects(verify(value, {requireFinal:true}), /acceptance/i);
});

test('qualified acceptance needs a basis, evidence and explicit limitations', async () => {
  for (const field of ['basis', 'evidence', 'limitations']) {
    const value = implemented();
    feature(value).acceptance = {status:'qualified', basis:'Named qualification campaign.', evidence:[evidence()], limitations:[]};
    delete feature(value).acceptance[field];
    await assert.rejects(verify(value, {requireFinal:true}), /acceptance|basis|evidence|limitations/i);
  }
});

test('inherited acceptance can close an implemented row while preserving its historical scope and limitations', async () => {
  const value = implemented();
  feature(value).acceptance = {
    status:'inherited',
    basis:'Preexisting accepted component behavior; no new route benefit is claimed.',
    evidence:[{...evidence(), revision:'c'.repeat(40)}],
    limitations:['Original workload only; this source audit adds no timing or manual acceptance evidence.'],
  };
  const before = structuredClone(feature(value).acceptance);
  const revisions: string[] = [];
  await verify(value, {requireFinal:true, readEvidence:async (_path: string, revision: string) => {
    revisions.push(revision);
    return SOURCE;
  }});
  assert.deepEqual(feature(value).acceptance, before);
  assert.ok(revisions.includes('c'.repeat(40)), 'inherited evidence must use its declared historical commit');
});
