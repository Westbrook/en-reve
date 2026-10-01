import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {runInNewContext} from 'node:vm';
import {commandPolicyOverlay, commandPolicyRevision, commandPolicySource, commandDeliveryPolicies, commandPolicyDescriptor, installCommandPolicyConfig, summarizeCommandPolicy} from './command-policy-controls.mjs';

const fixture = "import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';\nconst commands = createDefinitionLoader(customElements, {\n  'en-command-palette': () => import('@en-reve/elements/definitions/command-palette.js').then(module => module.commandPaletteDefinition),\n});\n// Route-entry preparation is load-only and never delays workflow hydration.\nvoid commands.load(['en-command-palette']).catch(() => { /* Explicit opening owns retry and error feedback. */ });\nawait startWorkflowPage(createSettingsWorkflowApp(settingsScenarios.find(item => item.id === scenario)?.id ?? 'explore', options => commands.ensure(['en-command-palette'], options), async options => { await commands.load(['en-command-palette'], options); }));\n";

test('bounded bridge preserves production loader and activation callbacks and records exact symmetric changes', async () => {
  const result = commandPolicyOverlay(fixture);
  assert.equal(result.defaultPolicy, 'cold');
  assert.deepEqual(result.policies, commandDeliveryPolicies);
  assert.deepEqual(result.routeEntrySuppressedPolicies, ['prepared-0', 'prepared-50', 'prepared-200', 'unused']);
  assert(result.source.includes("if (['cold', 'same-code'].includes(__commandPolicy))"));
  assert(result.source.includes("options => __commandObserve('activation-ensure', () => commands.ensure(['en-command-palette'], options))"));
  assert(result.source.includes("await __commandObserve('intent-load', () => commands.load(['en-command-palette'], options))"));
  assert(result.source.includes('return result;'), 'Observer returns the original public operation promise');
  assert.equal(result.source.match(/createDefinitionLoader\(customElements/g).length, 1);
  assert(!result.source.includes('createDeliveryProfile'));
  let rebuilt = fixture;
  for (const {before, after} of result.replacements) rebuilt = rebuilt.replace(before, after);
  assert.equal(rebuilt, result.source);
  assert.notEqual(result.originalSha256, result.executedSha256);
  assert.equal(result.path, commandPolicySource);
  const actual = await readFile(new URL('../../' + commandPolicySource, import.meta.url), 'utf8');
  assert.doesNotThrow(() => commandPolicyOverlay(actual));
});

test('changed, duplicated and already instrumented preimages fail closed', () => {
  assert.throws(() => commandPolicyOverlay(fixture.replace('createDefinitionLoader(customElements', 'createDefinitionLoader(otherRegistry')), /loader preimage/);
  assert.throws(() => commandPolicyOverlay(fixture + fixture), /exactly one/);
  assert.throws(() => commandPolicyOverlay(fixture.replace("options => commands.ensure(['en-command-palette'], options)", 'options => differentEnsure(options)')), /workflow public callbacks/);
  assert.throws(() => commandPolicyOverlay(commandPolicyOverlay(fixture).source));
  assert.throws(() => commandPolicyOverlay(fixture.replace('void commands.load', 'void unrelated.load')), /route preparation/);
});

test('unused has no activation or lead and only same-code qualifies construction-only', () => {
  assert.equal(commandPolicyDescriptor('unused').activationRequired, false);
  assert.equal(commandPolicyDescriptor('unused').requestedLeadMs, null);
  assert.equal(commandPolicyDescriptor('same-code').constructionOnly, true);
  assert.equal(commandPolicyDescriptor('cold').routeEntrySuppressed, false);
  for (const lead of [0, 50, 200]) assert.equal(commandPolicyDescriptor('prepared-' + lead).requestedLeadMs, lead);
  assert.throws(() => commandPolicyDescriptor('prepared-10'), /Unknown/);
});

function receipts(policy) {
  const descriptor = commandPolicyDescriptor(policy), registration = {'en-command-palette': false, 'en-button': true, 'en-icon': true};
  const before = {hostRegistered: false, hostUpgraded: false, generated: {nodes: 0}}, after = descriptor.constructionOnly ? {...before, hostRegistered: true, hostUpgraded: true} : {...before};
  const activeAt = descriptor.requestedLeadMs === null ? 40 : 15 + descriptor.requestedLeadMs;
  const makeOperation = (id, kind, startedAt, completedAt) => ({id, kind, startedAt, completedAt, status: 'fulfilled', focusUnchanged: true, registrationBefore: registration, registrationAfter: registration});
  const load = makeOperation(0, descriptor.routeEntrySuppressed ? 'prepare' : 'route-entry', 10, descriptor.requestedLeadMs === null ? 20 : activeAt + 2);
  const ensure = makeOperation(1, descriptor.constructionOnly ? 'ensure' : 'activation-ensure', descriptor.constructionOnly ? 22 : activeAt + 1, descriptor.constructionOnly ? 25 : activeAt + 3);
  const statusAt = (at, operations) => ({registry: 'global', expectedTags: ['en-command-palette', 'en-button', 'en-icon'], revision: commandPolicyRevision, deliveryPolicy: policy, recordOperations: true, routeEntrySuppressed: descriptor.routeEntrySuppressed, registrations: registration, at, operations});
  const operations = descriptor.unused ? [load] : [load, ensure];
  const completedAt = descriptor.unused ? 21 : activeAt + 5;
  const status = statusAt(completedAt, operations);
  const earlyLoad = {...load, completedAt: null, status: 'pending'};
  const controlStatus = descriptor.constructionOnly ? statusAt(26, [load, ensure]) : descriptor.routeEntrySuppressed ? statusAt(11, [earlyLoad]) : statusAt(26, [load]);
  const control = {descriptor, before, beforeClosed: true, afterClosed: true, beforeStatus: statusAt(9, []), after, status: controlStatus, operationId: descriptor.constructionOnly ? 1 : descriptor.routeEntrySuppressed ? 0 : null, preparationStartedAt: descriptor.routeEntrySuppressed ? 10 : null};
  const completion = {snapshot: after, closed: true, status, preparationCompletedAt: descriptor.constructionOnly ? ensure.completedAt : descriptor.routeEntrySuppressed ? load.completedAt : null, preparationDurationMs: descriptor.constructionOnly ? ensure.completedAt - ensure.startedAt : descriptor.routeEntrySuppressed ? load.completedAt - load.startedAt : null};
  const eventOperations = descriptor.constructionOnly ? [load, ensure] : descriptor.routeEntrySuppressed ? [earlyLoad] : [load];
  const first = descriptor.activationRequired ? {trusted: true, started: activeAt, deliveryStatus: statusAt(activeAt, eventOperations)} : null;
  return {control, preActivation: descriptor.activationRequired ? {snapshot: after, closed: true, focusUnchanged: true, status: statusAt(activeAt - 1, eventOperations)} : null, completion, first};
}
function summarize(value) {return summarizeCommandPolicy(value.control, value.preActivation, value.completion, value.first);}

test('summary binds observed trusted-event preparation state and actual lead', () => {
  const value = receipts('prepared-50'), result = summarize(value);
  assert.equal(result.actualLeadMs, 55);
  assert.equal(result.preparationPendingAtActivation, true);
  assert.equal(result.actualRouteBenefitEligible, false);
  assert.equal(result.sameCodeReady, false);
  assert.equal(summarize(receipts('same-code')).sameCodeReady, true);
  assert.equal(summarize(receipts('cold')).actualRouteBenefitEligible, true);
  value.completion.status.operations[0].completedAt = 20;
  value.completion.preparationCompletedAt = 20; value.completion.preparationDurationMs = 10;
  value.first.deliveryStatus.operations = [{...value.completion.status.operations[0]}];
  value.preActivation.status.operations = [{...value.completion.status.operations[0]}];
  assert.equal(summarize(value).preparationPendingAtActivation, false, 'Completed preparation is never claimed in-flight');
});

test('missing completion, actual-event evidence, registration and requested lead never pass', () => {
  let value = receipts('prepared-200'); value.completion = null; assert.throws(() => summarize(value), /completion receipt/);
  value = receipts('prepared-200'); value.first.deliveryStatus = null; assert.throws(() => summarize(value), /actual activation event/);
  value = receipts('prepared-200'); value.first.started = 209; assert.throws(() => summarize(value));
  value = receipts('prepared-200'); value.completion.status.operations[0].status = 'pending'; value.completion.status.operations[0].completedAt = null; assert.throws(() => summarize(value), /Unsettled/);
  value = receipts('same-code'); value.control.after.hostUpgraded = false; assert.throws(() => summarize(value), /same-code/);
  value = receipts('prepared-50'); value.completion.status.operations = value.completion.status.operations.filter(item => item.kind !== 'activation-ensure'); assert.throws(() => summarize(value), /first public ensure/);
});

test('unused waits genuine completion and rejects focus, construction, registration or activation', () => {
  const result = summarize(receipts('unused'));
  assert.equal(result.activated, false); assert.equal(result.inputApplicability, 'not-applicable-no-activation'); assert.equal(result.actualLeadMs, null);
  for (const modify of [value => {value.completion.snapshot.hostRegistered = true;}, value => {value.completion.status.operations.find(item => item.id === value.control.operationId).focusUnchanged = false;}, value => {value.completion.snapshot = {...value.completion.snapshot, generated: {nodes: 1}};}, value => {value.first = {trusted: true};}, value => {value.completion.closed = false;}]) {
    const value = receipts('unused'); modify(value); assert.throws(() => summarize(value));
  }
});

test('operation logs can be disabled only for explicitly labeled cold retention', () => {
  const install = (config, context = {}) => {runInNewContext('(' + installCommandPolicyConfig.toString() + ')(' + JSON.stringify(config) + ')', context); return context.__enCommandPolicyConfig;};
  assert.equal(install({deliveryPolicy: 'cold'}).recordOperations, true);
  const retention = install({deliveryPolicy: 'cold', recordOperations: false});
  assert.equal(retention.recordOperations, false); assert(Object.isFrozen(retention));
  for (const deliveryPolicy of ['same-code', 'prepared-0', 'prepared-50', 'prepared-200', 'unused']) assert.throws(() => install({deliveryPolicy, recordOperations: false}), /only be disabled/);
  assert.throws(() => install({deliveryPolicy: 'cold', recordOperations: 'false'}), /only be disabled/);
  const source = commandPolicyOverlay(fixture).source;
  assert(source.indexOf('if (!__commandRecordOperations) return invoke();') < source.indexOf('let focus = __commandFocus()'));
  const value = receipts('same-code'); value.control.status.recordOperations = false; assert.throws(() => summarize(value), /recording/);
});

test('policy substitution, contradictory completion and pre-action ensure cannot qualify', () => {
  let value = receipts('prepared-50'); value.completion.status.deliveryPolicy = 'cold'; assert.throws(() => summarize(value), /policy mismatch/);
  value = receipts('prepared-50'); value.completion.status.operations[0].completedAt = 20; assert.throws(() => summarize(value), /already completed/);
  value = receipts('prepared-50'); value.completion.status.operations[1].startedAt = 12; assert.throws(() => summarize(value), /preceded the trusted action/);
  value = receipts('prepared-50'); value.completion.status.operations[0].kind = 'route-entry'; assert.throws(() => summarize(value), /identity changed/);
  value = receipts('unused'); value.completion.status.operations.push({...value.completion.status.operations[0]}); assert.throws(() => summarize(value), /duplicate/);
});

test('redundant preparation fields cannot substitute a different public operation time', () => {
  let value = receipts('prepared-50'); value.control.preparationStartedAt = -100; assert.throws(() => summarize(value), /Preparation start/);
  value = receipts('prepared-50'); value.completion.preparationCompletedAt = 500; assert.throws(() => summarize(value), /Preparation completion/);
  value = receipts('prepared-50'); value.completion.preparationDurationMs = 0; assert.throws(() => summarize(value), /Preparation duration/);
  value = receipts('same-code'); value.control.operationId = 0; assert.throws(() => summarize(value), /Control operation identity/);
});
