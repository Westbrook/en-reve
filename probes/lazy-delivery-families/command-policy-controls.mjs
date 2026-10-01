import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

export const commandPolicyRevision = 'settings-public-loader-policy-v1';
export const commandPolicySource = 'apps/docs/src/workflow-pages/settings-entry.ts';
export const commandDeliveryPolicies = Object.freeze(['cold', 'same-code', 'prepared-0', 'prepared-50', 'prepared-200', 'unused']);
const loader = "const commands = createDefinitionLoader(customElements, {\n  'en-command-palette': () => import('@en-reve/elements/definitions/command-palette.js').then(module => module.commandPaletteDefinition),\n});";
const routeLoad = "void commands.load(['en-command-palette']).catch(() => { /* Explicit opening owns retry and error feedback. */ });";
const workflow = "await startWorkflowPage(createSettingsWorkflowApp(settingsScenarios.find(item => item.id === scenario)?.id ?? 'explore', options => commands.ensure(['en-command-palette'], options), async options => { await commands.load(['en-command-palette'], options); }));";
const sha = source => createHash('sha256').update(source).digest('hex');

// This is a bounded build-only overlay, never an import in the delivered product.
// Type annotations are intentional: the real docs TypeScript check also checks it.
const bridge = `
// BEGIN symmetric command delivery measurement instrumentation.
const __commandPolicyValue: unknown = Reflect.get(globalThis, '__enCommandPolicyConfig');
const __commandPolicyConfig = __commandPolicyValue as {revision?: unknown; deliveryPolicy?: unknown; recordOperations?: unknown} | undefined;
const __commandPolicyAllowed: readonly string[] = ${JSON.stringify(commandDeliveryPolicies)};
if (__commandPolicyValue !== undefined && (!__commandPolicyConfig || typeof __commandPolicyValue !== 'object' || __commandPolicyConfig.revision !== '${commandPolicyRevision}' || typeof __commandPolicyConfig.deliveryPolicy !== 'string' || !__commandPolicyAllowed.includes(__commandPolicyConfig.deliveryPolicy) || (__commandPolicyConfig.recordOperations !== undefined && typeof __commandPolicyConfig.recordOperations !== 'boolean') || (__commandPolicyConfig.recordOperations === false && __commandPolicyConfig.deliveryPolicy !== 'cold'))) throw new Error('Invalid command measurement policy');
const __commandPolicy = String(__commandPolicyConfig?.deliveryPolicy ?? 'cold');
const __commandRecordOperations = __commandPolicyConfig?.recordOperations !== false;
const __commandExpectedTags = ['en-command-palette', 'en-button', 'en-icon'] as const;
const __commandRegistrations = () => Object.fromEntries(__commandExpectedTags.map(tag => [tag, Boolean(customElements.get(tag))]));
const __commandFocus = (): Element | null => {let current = document.activeElement; while (current?.shadowRoot?.activeElement) current = current.shadowRoot.activeElement; return current;};
const __commandFocusDescription = (node: Element | null) => node ? {tag: node.localName, id: node.id, name: node.getAttribute('name')} : null;
type __CommandOperation = {id: number; kind: 'route-entry' | 'prepare' | 'ensure' | 'intent-load' | 'activation-ensure'; startedAt: number; completedAt: number | null; status: 'pending' | 'fulfilled' | 'rejected'; registrationBefore: Record<string, boolean>; registrationAfter: Record<string, boolean> | null; focusBefore: ReturnType<typeof __commandFocusDescription>; focusAfter: ReturnType<typeof __commandFocusDescription>; focusUnchanged: boolean | null; error: string | null};
const __commandOperations: __CommandOperation[] = [];
const __commandPending = new Set<Promise<void>>();
const __commandFocusReferences = new Map<number, WeakRef<Element> | null>();
function __commandObserve<T>(kind: __CommandOperation['kind'], invoke: () => Promise<T>): Promise<T> {
  if (!__commandRecordOperations) return invoke();
  let focus = __commandFocus();
  const item: __CommandOperation = {id: __commandOperations.length, kind, startedAt: 0, completedAt: null, status: 'pending', registrationBefore: __commandRegistrations(), registrationAfter: null, focusBefore: __commandFocusDescription(focus), focusAfter: null, focusUnchanged: null, error: null};
  __commandOperations.push(item);
  __commandFocusReferences.set(item.id, focus ? new WeakRef(focus) : null);
  let result: Promise<T>;
  item.startedAt = performance.now();
  try {result = invoke();} catch (error) {result = Promise.reject(error);}
  const complete = (status: 'fulfilled' | 'rejected', error?: unknown) => {item.completedAt = performance.now(); item.status = status; item.error = error === undefined ? null : String(error); item.registrationAfter = __commandRegistrations(); const after = __commandFocus(); item.focusAfter = __commandFocusDescription(after); item.focusUnchanged = focus === after; focus = null;};
  const task = result.then(() => complete('fulfilled'), error => complete('rejected', error)).finally(() => {__commandPending.delete(task);});
  __commandPending.add(task);
  return result;
}
const __commandPolicyBridge = Object.freeze({
  revision: '${commandPolicyRevision}',
  prepare: (options: {retry?: boolean} = {}) => __commandObserve('prepare', () => commands.load(['en-command-palette'], options)),
  ensure: (options: {retry?: boolean} = {}) => __commandObserve('ensure', () => commands.ensure(['en-command-palette'], options)),
  status: () => ({revision: '${commandPolicyRevision}', deliveryPolicy: __commandPolicy, recordOperations: __commandRecordOperations, registry: 'global', expectedTags: [...__commandExpectedTags], routeEntrySuppressed: !['cold', 'same-code'].includes(__commandPolicy), registrations: __commandRegistrations(), at: performance.now(), operations: __commandOperations.map(item => ({...item, focusUnchangedAtSnapshot: (__commandFocusReferences.get(item.id)?.deref() ?? null) === __commandFocus(), registrationBefore: {...item.registrationBefore}, registrationAfter: item.registrationAfter ? {...item.registrationAfter} : null}))}),
  settled: async () => {while (__commandPending.size) await Promise.all([...__commandPending]);},
});
Object.defineProperty(globalThis, '__enCommandPolicyTest', {value: __commandPolicyBridge, writable: false, configurable: false});
// END symmetric command delivery measurement instrumentation.
`;

export function commandPolicyOverlay(source) {
  assert.equal(typeof source, 'string');
  for (const [label, token] of [['loader', loader], ['route preparation', routeLoad], ['workflow public callbacks', workflow]]) assert.equal(source.split(token).length, 2, 'Command policy overlay requires exactly one accepted ' + label + ' preimage');
  assert(!source.includes('__enCommandPolicy'), 'Command policy overlay is already present');
  const replacement = "if (['cold', 'same-code'].includes(__commandPolicy)) {\n  void __commandObserve('route-entry', () => commands.load(['en-command-palette'])).catch(() => { /* Explicit opening owns retry and error feedback. */ });\n}";
  const observedWorkflow = workflow.replace("options => commands.ensure(['en-command-palette'], options)", "options => __commandObserve('activation-ensure', () => commands.ensure(['en-command-palette'], options))").replace("await commands.load(['en-command-palette'], options)", "await __commandObserve('intent-load', () => commands.load(['en-command-palette'], options))");
  const executed = source.replace(loader, loader + '\n' + bridge).replace(routeLoad, replacement).replace(workflow, observedWorkflow);
  return {source: executed, path: commandPolicySource, kind: 'symmetric-command-public-loader-test-bridge', revision: commandPolicyRevision, originalSha256: sha(source), executedSha256: sha(executed), defaultPolicy: 'cold', policies: [...commandDeliveryPolicies], routeEntrySuppressedPolicies: ['prepared-0', 'prepared-50', 'prepared-200', 'unused'], claims: 'All arms contain the same instrumentation. Cold retains route-entry load. The existing production activation/intent callbacks call the same public operations and return each original promise; symmetric observers record actual method durations. Controlled preparation policies suppress only route-entry speculative load; they are authored test policies, not uninstrumented production measurements.', replacements: [{before: loader, after: loader + '\n' + bridge}, {before: routeLoad, after: replacement}, {before: workflow, after: observedWorkflow}]};
}

export async function applyCommandPolicyBridge(root) {
  const path = resolve(root, commandPolicySource), original = await readFile(path, 'utf8'), overlay = commandPolicyOverlay(original);
  await writeFile(path, overlay.source);
  const {source, ...receipt} = overlay;
  return receipt;
}

/** Install before navigation. It is serialized by Playwright and has no closure. */
export function installCommandPolicyConfig({deliveryPolicy, recordOperations = true}) {
  const allowed = ['cold', 'same-code', 'prepared-0', 'prepared-50', 'prepared-200', 'unused'];
  if (!allowed.includes(deliveryPolicy)) throw new Error('Unknown command delivery policy');
  if (typeof recordOperations !== 'boolean' || !recordOperations && deliveryPolicy !== 'cold') throw new Error('Operation recording may only be disabled for cold retention');
  Object.defineProperty(globalThis, '__enCommandPolicyConfig', {value: Object.freeze({revision: 'settings-public-loader-policy-v1', deliveryPolicy, recordOperations}), configurable: false, writable: false});
}

export function commandPolicyDescriptor(deliveryPolicy) {
  assert(commandDeliveryPolicies.includes(deliveryPolicy), 'Unknown command delivery policy');
  return {deliveryPolicy, requestedLeadMs: deliveryPolicy.startsWith('prepared-') ? Number(deliveryPolicy.slice('prepared-'.length)) : null, routeEntrySuppressed: !['cold', 'same-code'].includes(deliveryPolicy), constructionOnly: deliveryPolicy === 'same-code', unused: deliveryPolicy === 'unused', activationRequired: deliveryPolicy !== 'unused'};
}

/** Call after preserving the untouched initial startup snapshot, before target focus/hover. */
export async function beginCommandPolicy(page, deliveryPolicy) {
  const descriptor = commandPolicyDescriptor(deliveryPolicy);
  return page.evaluate(async descriptor => {
    const bridge = globalThis.__enCommandPolicyTest, probe = globalThis.__enFamilyProbe;
    if (!bridge || bridge.revision !== 'settings-public-loader-policy-v1' || bridge.status().recordOperations !== true || bridge.status().deliveryPolicy !== descriptor.deliveryPolicy) throw new Error('Command policy bridge identity mismatch');
    if (!probe?.state.ready || !probe.isClosed()) throw new Error('Command policy control requires a settled closed initial route');
    const before = probe.snapshot(), beforeStatus = bridge.status();
    if (before.hostRegistered || before.hostUpgraded) throw new Error('Command route unexpectedly registered before explicit control');
    const bounded = task => new Promise((resolve, reject) => {const timer = setTimeout(() => reject(new Error('Command policy setup deadline exceeded: ' + JSON.stringify(bridge.status()))), 20000); Promise.resolve(task).then(value => {clearTimeout(timer); resolve(value);}, error => {clearTimeout(timer); reject(error);});});
    if (descriptor.constructionOnly) {
      await bounded(bridge.ensure());
      if (typeof probe.closedSettled !== 'function') throw new Error('Same-code control requires the closed-settled observer');
      await bounded(probe.closedSettled());
      if (!probe.isClosed()) throw new Error('Explicit registration opened the command surface');
      const after = probe.snapshot(), operation = bridge.status().operations.findLast(item => item.kind === 'ensure');
      if (!after.hostRegistered || !after.hostUpgraded || operation?.status !== 'fulfilled' || !operation.focusUnchanged) throw new Error('Same-code registration invariants failed');
      return {descriptor, before, beforeClosed: true, beforeStatus, after, afterClosed: true, status: bridge.status(), preparationStartedAt: null, operationId: operation.id};
    }
    if (descriptor.routeEntrySuppressed) {
      if (beforeStatus.operations.some(item => item.kind === 'route-entry')) throw new Error('Controlled preparation leaked route-entry load');
      // Deliberately do not await: the trusted action can occur during preparation.
      // Rejection remains in the operation receipt and is checked at settlement.
      void bridge.prepare().catch(() => {});
      const operation = bridge.status().operations.findLast(item => item.kind === 'prepare');
      if (!operation) throw new Error('Preparation did not start');
      return {descriptor, before, beforeClosed: true, beforeStatus, after: probe.snapshot(), afterClosed: probe.isClosed(), status: bridge.status(), preparationStartedAt: operation.startedAt, operationId: operation.id};
    }
    return {descriptor, before, beforeClosed: true, beforeStatus, after: probe.snapshot(), afterClosed: probe.isClosed(), status: bridge.status(), preparationStartedAt: null, operationId: null};
  }, descriptor);
}

/** Capture immediately before arming the trusted input; never manufactures readiness. */
export async function commandPreActivation(page, control) {
  return page.evaluate(control => {
    const bridge = globalThis.__enCommandPolicyTest, probe = globalThis.__enFamilyProbe;
    const snapshot = probe.snapshot(), status = bridge.status(), operation = status.operations.find(item => item.id === control.operationId);
    if (!probe.isClosed()) throw new Error('Preparation opened the command surface');
    if (!control.descriptor.constructionOnly && (snapshot.hostRegistered || snapshot.hostUpgraded)) throw new Error('Load-only policy registered the command surface before activation');
    if (control.descriptor.routeEntrySuppressed && snapshot.generated.nodes !== control.before.generated.nodes) throw new Error('Load-only preparation changed the generated command body');
    if (operation?.status === 'rejected') throw new Error('Command preparation failed: ' + operation.error);
    if (operation && !operation.focusUnchangedAtSnapshot) throw new Error('Command preparation changed focus before activation');
    if (control.descriptor.routeEntrySuppressed && JSON.stringify(status.registrations) !== JSON.stringify(control.beforeStatus.registrations)) throw new Error('Load-only preparation changed registry definitions');
    return {at: performance.now(), snapshot, closed: probe.isClosed(), focusUnchanged: operation ? operation.focusUnchangedAtSnapshot : null, status, preparationPending: operation?.status === 'pending', preparationCompletedAt: operation?.completedAt ?? null};
  }, control);
}

/** Wait for real completion, including unused policies. Do not replace this with a timeout. */
export async function finishCommandPolicy(page, control, {activated = false} = {}) {
  return page.evaluate(async ({control, activated}) => {
    const bridge = globalThis.__enCommandPolicyTest, probe = globalThis.__enFamilyProbe;
    let timer;
    try {await Promise.race([bridge.settled(), new Promise((_, reject) => {timer = setTimeout(() => reject(new Error('Command preparation completion deadline exceeded: ' + JSON.stringify(bridge.status()))), 20000);})]);} finally {clearTimeout(timer);}
    const snapshot = probe.snapshot(), status = bridge.status(), operation = status.operations.find(item => item.id === control.operationId);
    if (status.operations.some(item => item.status !== 'fulfilled')) throw new Error('Command preparation did not complete successfully');
    if (!activated && !control.descriptor.constructionOnly) {
      if (!probe.isClosed() || snapshot.hostRegistered || snapshot.hostUpgraded) throw new Error('Unused preparation registered or opened the command surface');
      if (snapshot.generated.nodes !== control.before.generated.nodes) throw new Error('Unused preparation changed generated content');
      if (operation && !operation.focusUnchanged) throw new Error('Unused preparation changed focus');
      if (JSON.stringify(status.registrations) !== JSON.stringify(control.beforeStatus.registrations)) throw new Error('Unused preparation changed registry definitions');
    }
    return {at: performance.now(), snapshot, closed: probe.isClosed(), status, preparationCompletedAt: operation?.completedAt ?? null, preparationDurationMs: operation ? operation.completedAt - operation.startedAt : null, focusChangeDuringActivationIsDescriptive: activated};
  }, {control, activated});
}

function validateCommandReceipt(status, descriptor, completion, label) {
  assert.equal(status?.revision, commandPolicyRevision, label + ': bridge revision mismatch');
  assert.equal(status?.deliveryPolicy, descriptor.deliveryPolicy, label + ': delivery policy mismatch');
  assert.equal(status?.recordOperations, true, label + ': operation recording required');
  assert.equal(status?.routeEntrySuppressed, descriptor.routeEntrySuppressed, label + ': route-entry policy mismatch');
  assert(Number.isFinite(status.at), label + ': missing observation timestamp');
  assert.equal(status.registry, 'global', label + ': registry owner changed');
  assert.deepEqual(status.expectedTags, ['en-command-palette', 'en-button', 'en-icon'], label + ': expected definitions changed');
  assert.deepEqual(Object.keys(status.registrations ?? {}).sort(), [...status.expectedTags].sort(), label + ': incomplete registry observation');
  assert(Object.values(status.registrations).every(value => typeof value === 'boolean'), label + ': invalid registry observation');
  assert(Array.isArray(status.operations), label + ': missing operations');
  const ids = new Set();
  for (const operation of status.operations) {
    assert(Number.isInteger(operation.id) && operation.id >= 0 && !ids.has(operation.id), label + ': invalid or duplicate operation identity'); ids.add(operation.id);
    assert(['route-entry', 'prepare', 'ensure', 'intent-load', 'activation-ensure'].includes(operation.kind), label + ': unsupported operation kind');
    assert(Number.isFinite(operation.startedAt) && operation.startedAt <= status.at, label + ': operation starts after observation');
    assert(['pending', 'fulfilled', 'rejected'].includes(operation.status), label + ': invalid operation status');
    if (operation.status === 'pending') assert.equal(operation.completedAt, null, label + ': pending operation has a completion timestamp');
    else assert(Number.isFinite(operation.completedAt) && operation.completedAt >= operation.startedAt && operation.completedAt <= status.at, label + ': invalid completion chronology');
    if (completion) {
      const final = completion.operations.find(item => item.id === operation.id);
      assert(final && final.kind === operation.kind && final.startedAt === operation.startedAt, label + ': operation identity changed');
      if (operation.status === 'pending') assert(final.completedAt >= status.at, label + ': pending operation had already completed');
      else assert(final.status === operation.status && final.completedAt === operation.completedAt, label + ': completion identity changed');
    }
  }
}

/** Normalize receipts for analysis without substituting missing observations with success. */
export function summarizeCommandPolicy(control, preActivation, completion, first = null) {
  const descriptor = commandPolicyDescriptor(control?.descriptor?.deliveryPolicy);
  assert.equal(control.status?.revision, commandPolicyRevision, 'Missing command bridge revision');
  assert.equal(control.status?.recordOperations, true, 'Timing requires operation recording');
  assert.equal(completion?.status?.revision, commandPolicyRevision, 'Missing real preparation completion receipt');
  validateCommandReceipt(completion.status, descriptor, null, 'Completion');
  assert(completion.status.operations.every(item => item.status === 'fulfilled'), 'Unsettled or failed command preparation');
  validateCommandReceipt(control.beforeStatus, descriptor, completion.status, 'Before control');
  validateCommandReceipt(control.status, descriptor, completion.status, 'After control');
  assert(control.beforeStatus.at <= control.status.at && control.status.at <= completion.status.at, 'Control receipt chronology changed');
  const sameCodeReady = descriptor.constructionOnly && control.after?.hostRegistered === true && control.after?.hostUpgraded === true;
  assert.equal(control.beforeClosed, true, 'Missing initial closed observation');
  assert.equal(control.afterClosed, true, 'Policy control opened the command surface');
  if (descriptor.constructionOnly) assert(sameCodeReady, 'Missing same-code registration and upgrade observation');
  if (descriptor.activationRequired) {
    assert(first?.trusted === true && Number.isFinite(first.started), 'Missing trusted command activation');
    assert.equal(first.deliveryStatus?.revision, commandPolicyRevision, 'Missing delivery state at the actual activation event');
    assert.equal(first.deliveryStatus?.deliveryPolicy, descriptor.deliveryPolicy, 'Activation used a different command policy');
    validateCommandReceipt(first.deliveryStatus, descriptor, completion.status, 'Activation');
    assert(control.status.at <= first.started && first.started <= first.deliveryStatus.at && first.deliveryStatus.at <= completion.status.at, 'Activation chronology changed');
    assert(preActivation?.snapshot, 'Missing pre-activation invariants');
    assert.equal(preActivation.closed, true, 'Command opened before activation');
    if (control.operationId !== null) assert.equal(preActivation.focusUnchanged, true, 'Command preparation changed focus before activation');
    validateCommandReceipt(preActivation.status, descriptor, completion.status, 'Pre-activation');
    assert(control.status.at <= preActivation.status.at && preActivation.status.at <= first.started, 'Pre-activation chronology changed');
  } else assert.equal(first, null, 'Unused preparation must not include an action');
  const controlledOperation = completion.status.operations.find(item => item.id === control.operationId) ?? null;
  if (descriptor.constructionOnly || descriptor.routeEntrySuppressed) {
    assert(controlledOperation && controlledOperation.kind === (descriptor.constructionOnly ? 'ensure' : 'prepare'), 'Control operation identity does not match its policy');
    assert(control.status.operations.some(item => item.id === control.operationId), 'Control operation is absent from the control receipt');
  } else assert.equal(control.operationId, null, 'Cold control cannot substitute an explicit operation');
  assert.equal(control.preparationStartedAt, descriptor.routeEntrySuppressed ? controlledOperation.startedAt : null, 'Preparation start does not match the actual public operation');
  assert.equal(completion.preparationCompletedAt, controlledOperation?.completedAt ?? null, 'Preparation completion does not match the actual public operation');
  assert.equal(completion.preparationDurationMs, controlledOperation ? controlledOperation.completedAt - controlledOperation.startedAt : null, 'Preparation duration does not match the actual public operation');
  const operation = first?.deliveryStatus?.operations.find(item => item.id === control.operationId) ?? null;
  const actualLeadMs = descriptor.requestedLeadMs === null ? null : first.started - controlledOperation.startedAt;
  if (actualLeadMs !== null) assert(Number.isFinite(actualLeadMs) && actualLeadMs >= descriptor.requestedLeadMs, 'Trusted activation preceded its requested preparation lead');
  if (descriptor.routeEntrySuppressed) {
    assert(control.beforeStatus.routeEntrySuppressed && completion.status.routeEntrySuppressed, 'Prepared control did not suppress route-entry load');
    assert(!completion.status.operations.some(item => item.kind === 'route-entry'), 'Prepared control included route-entry load');
    assert.equal(control.before.hostRegistered, false, 'Controlled preparation started after registration');
    assert.equal(control.before.hostUpgraded, false, 'Controlled preparation started after upgrade');
    assert.equal(completion.status.operations.find(item => item.id === control.operationId)?.kind, 'prepare', 'Missing public load operation');
    if (descriptor.activationRequired) {
      assert(operation, 'Missing prepare operation state at trusted activation');
      assert.deepEqual(preActivation.status.registrations, control.beforeStatus.registrations, 'Load-only preparation changed definitions before activation');
      assert.equal(preActivation.snapshot.generated.nodes, control.before.generated.nodes, 'Load-only preparation changed content before activation');
    }
  }
  if (descriptor.unused) {
    const completedOperation = completion.status.operations.find(item => item.id === control.operationId);
    assert.equal(completion.closed, true, 'Unused preparation opened the command surface');
    assert.equal(completion.snapshot.hostRegistered, false, 'Unused preparation registered a host');
    assert.equal(completion.snapshot.hostUpgraded, false, 'Unused preparation upgraded a host');
    assert.equal(completion.snapshot.generated.nodes, control.before.generated.nodes, 'Unused preparation generated content');
    assert.equal(completedOperation?.focusUnchanged, true, 'Unused preparation changed focus');
    assert.deepEqual(completion.status.registrations, control.beforeStatus.registrations, 'Unused preparation changed definitions');
  }
  const operationDuration = item => item?.status === 'fulfilled' && Number.isFinite(item.startedAt) && Number.isFinite(item.completedAt) ? item.completedAt - item.startedAt : null;
  const loadOperation = completion.status.operations.find(item => item.kind === (descriptor.routeEntrySuppressed ? 'prepare' : 'route-entry'));
  const ensureOperation = completion.status.operations.find(item => item.kind === (descriptor.constructionOnly ? 'ensure' : 'activation-ensure'));
  const loadMs = operationDuration(loadOperation), ensureMs = operationDuration(ensureOperation);
  assert.equal(completion.status.operations.filter(item => item.kind === (descriptor.routeEntrySuppressed ? 'prepare' : 'route-entry')).length, 1, 'Ambiguous primary public load operation');
  assert(loadMs !== null && loadMs >= 0, 'Missing actual public load duration');
  if (descriptor.activationRequired) {
    assert(ensureMs !== null && ensureMs >= 0, 'Missing actual first public ensure duration');
    assert.equal(completion.status.operations.filter(item => item.kind === (descriptor.constructionOnly ? 'ensure' : 'activation-ensure')).length, 1, 'Ambiguous first public ensure operation');
    assert.equal(preActivation.snapshot.hostRegistered, descriptor.constructionOnly, 'Unexpected registration before activation');
    assert.equal(preActivation.snapshot.hostUpgraded, descriptor.constructionOnly, 'Unexpected upgrade before activation');
    if (descriptor.constructionOnly) assert(ensureOperation.completedAt <= control.status.at, 'Same-code ensure was not complete before control readiness');
    else assert(ensureOperation.startedAt >= first.started, 'Activation ensure preceded the trusted action');
  }
  else assert(!completion.status.operations.some(item => ['ensure', 'activation-ensure'].includes(item.kind)), 'Unused preparation unexpectedly ensured definitions');
  return {revision: commandPolicyRevision, ...descriptor, descriptor, sameCodeReady, loadMs, ensureMs, loadOperationId: loadOperation.id, ensureOperationId: ensureOperation?.id ?? null, actualLeadMs, activated: Boolean(first), preparationPendingAtActivation: operation ? operation.status === 'pending' : null,
    preparationCompletedAtActivation: operation?.completedAt ?? null, preparationCompletedAt: completion.preparationCompletedAt, preparationDurationMs: completion.preparationDurationMs,
    actualRouteBenefitEligible: descriptor.deliveryPolicy === 'cold', inputApplicability: descriptor.unused ? 'not-applicable-no-activation' : 'trusted-activation',
    invariantPhase: descriptor.unused ? 'actual-completion-without-activation' : 'before-activation-and-observed-during-activation',
    control, preActivation, completion, activationStatus: first?.deliveryStatus ?? null};
}
