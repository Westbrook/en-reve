/** Build-only access to the existing color profile; never imported by product source. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

export const colorPolicyRevision = 'composable-chat-native-registry-control-v1';
export const colorPolicySource = 'apps/docs/src/api-example/main.ts';
export const colorPolicyPreimages = Object.freeze({
  [colorPolicySource]: '5d35e78b03c15e0e440b8b249cc98eb2ae1b60de93b26e84df5875820ce8f554',
  'apps/docs/src/composable-chat-color-delivery.ts': 'b65d1b2f79a4512bd413393837f2b0ad4c5ff4e784666140c4c6244656abe990',
  'apps/docs/src/composable-chat-color-ownership.mjs': '402992fe740eb375f68c05aa2352d5bb69d60de63d787ffed2ce4357ad9c15e3',
});
const sha = source => createHash('sha256').update(source).digest('hex');
const importsAnchor = "import { API_EXAMPLE_VERSION } from './protocol.js';";
const activationAnchor = '\tapp.activate();';
const candidateImports = "\nimport {composableChatColorProfile as __colorControlProfile} from '../composable-chat-color-delivery.js';\nimport {createDefinitionLoader as __colorControlLoader} from '@en-reve/elements/lazy-loader.js';";

/** Only an explicit boolean opts a separate preparation into the control bridge. */
export function colorControlBuildPolicy(enabled = false) {
  assert.equal(typeof enabled, 'boolean', 'Color control build flag must be an explicit boolean');
  return Object.freeze({enabled, revision: enabled ? colorPolicyRevision : null,
    purpose: enabled ? 'Separate color preloaded-and-registered construction attribution and same-code control retention only; not production startup, byte benefit, cold, prepared, unused or production retention evidence.' : 'No color bridge: original production color startup and activation sources.'});
}

function colorPolicySubject(options) {
  assert(options && typeof options === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(options)) && Object.getOwnPropertySymbols(options).length === 0, 'Color bridge options must be a plain data object');
  const descriptors = Object.getOwnPropertyDescriptors(options);
  assert.deepEqual(Object.keys(descriptors), ['subject'], 'Color bridge requires only the explicit subject option');
  assert('value' in descriptors.subject, 'Color bridge subject must be a data option');
  const subject = descriptors.subject.value;
  assert(['reference', 'candidate'].includes(subject), 'Color bridge requires an explicit sealed source subject');
  return subject;
}

function bridge(subject) {
  // No loader/profile facsimile is inserted into the accepted reference.
  const registration = subject === 'candidate' ? `
      const profile = __colorControlProfile;
      const feature = profile.features.find(item => item.id === 'en-reve-docs/composable-chat-color/popup');
      if (profile.schemaVersion !== 1 || profile.id !== 'en-reve-docs/composable-chat-color' || profile.version !== '1' || feature?.version !== '1' || JSON.stringify(feature.definitionTags) !== JSON.stringify(__colorControlTags)) throw new Error('Color control profile identity changed');
      await __colorControlLoader(owner.registry, profile.loaders).ensure(feature.definitionTags);
` : `
      if (!__colorControlTags.every(tag => owner.registry.get(tag))) throw new Error('Reference color definitions are not already eager');
`;
  return `
// BEGIN receipted color registration control. No automatic load, preparation or opening.
if (caseId === 'composable-chat') {
  const __colorControlTags = ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'] as const;
  const __colorControlSubject = '${subject}' as const;
  function __colorControlOwner(editor: HTMLElement) {
    if (!editor || editor.localName !== 'en-token-editor' || !editor.isConnected || editor.ownerDocument !== document) throw new Error('Color control requires the actual connected route editor');
    const documentOwner = editor.ownerDocument;
    const demoRoot = editor.getRootNode();
    const root = (editor as HTMLElement & {renderRoot?: Node}).renderRoot;
    if (!(demoRoot instanceof ShadowRoot) || demoRoot.host.localName !== 'en-composable-chat-demo' || !demoRoot.host.isConnected || demoRoot.ownerDocument !== documentOwner || document.querySelector('en-composable-chat-demo') !== demoRoot.host || demoRoot.querySelector('en-token-editor') !== editor) throw new Error('Color control editor is outside the actual route demo');
    if (!(root instanceof ShadowRoot) || root.host !== editor || root.ownerDocument !== documentOwner || root !== editor.shadowRoot) throw new Error('Color control requires the editor native shadow render root');
    const nativeRegistryAPI = 'customElementRegistry' in root;
    const registry = nativeRegistryAPI ? (root as ShadowRoot & {customElementRegistry?: CustomElementRegistry | null}).customElementRegistry : documentOwner.defaultView?.customElements;
    if (!registry) throw new Error('Color control cannot replace a null or undefined root registry');
    const actualRegistryMode = nativeRegistryAPI ? registry === documentOwner.defaultView?.customElements ? 'global' : 'native-scoped' : 'unavailable';
    const definitionRegistrySource = nativeRegistryAPI ? 'native-root-association' : 'document-global-api-unavailable';
    return {editor, root, demoRoot, documentOwner, registry, nativeRegistryAPI, actualRegistryMode, definitionRegistrySource};
  }
  function __colorControlFocus() {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
  }
  function __colorControlSnapshot(owner: ReturnType<typeof __colorControlOwner>) {
    const editor = owner.editor as HTMLElement & {value?: unknown; draftValue?: unknown; document?: unknown; revision?: unknown; selection?: unknown; composing?: unknown};
    const value = editor.value, draftValue = editor.draftValue, documentJSON = JSON.stringify(editor.document), revision = editor.revision;
    const selectionJSON = JSON.stringify(editor.selection ?? null), composing = editor.composing;
    if (typeof value !== 'string' || typeof draftValue !== 'string' || typeof documentJSON !== 'string' || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0 || typeof selectionJSON !== 'string' || typeof composing !== 'boolean') throw new Error('Color control requires the public accepted document, native draft, selection and composition snapshot');
    const editorState = {value, draftValue, documentJSON, revision, selectionJSON, composing};
    const optionalConstructed = !!owner.root.querySelector(__colorControlTags.join(','));
    const popupOpen = !!owner.root.querySelector('[part~="popup"]')?.matches(':popover-open');
    const sessionPresent = popupOpen || !!owner.root.querySelector('[data-color-delivery], [part~="color-session"], [role="textbox"][aria-haspopup]');
    return {revision: '${colorPolicyRevision}', subject: __colorControlSubject, at: performance.now(), expectedTags: [...__colorControlTags], actualRegistryMode: owner.actualRegistryMode, nativeRegistryAPI: owner.nativeRegistryAPI, definitionRegistrySource: owner.definitionRegistrySource, connected: owner.editor.isConnected, registrations: Object.fromEntries(__colorControlTags.map(tag => [tag, !!owner.registry.get(tag)])), optionalConstructed, sessionPresent, popupOpen, editorState};
  }
  Object.defineProperty(globalThis, '__enColorPolicyTest', {configurable: false, writable: false, value: Object.freeze({
    revision: '${colorPolicyRevision}',
    status: (editor: HTMLElement) => __colorControlSnapshot(__colorControlOwner(editor)),
    ensure: async (editor: HTMLElement) => {
      const owner = __colorControlOwner(editor), before = __colorControlSnapshot(owner), focus = __colorControlFocus();
      if (before.optionalConstructed || before.sessionPresent) throw new Error('Color registration control requires the unopened editor');
      const acceptedDocument = (editor as HTMLElement & {document: unknown}).document;
      const nodes = [...owner.root.querySelectorAll('*')];
      const startedAt = performance.now();
${registration}
      const completedAt = performance.now(), current = __colorControlOwner(editor);
      const ownershipUnchanged = current.root === owner.root && current.demoRoot === owner.demoRoot && current.documentOwner === owner.documentOwner && current.registry === owner.registry;
      const after = __colorControlSnapshot(current), nextNodes = [...current.root.querySelectorAll('*')];
      const nodesUnchanged = nodes.length === nextNodes.length && nodes.every((node, index) => node === nextNodes[index]);
      const focusUnchanged = focus === __colorControlFocus();
      const stateUnchanged = JSON.stringify(before.editorState) === JSON.stringify(after.editorState);
      const documentIdentityUnchanged = acceptedDocument === (editor as HTMLElement & {document: unknown}).document;
      const receipt = {revision: '${colorPolicyRevision}', subject: __colorControlSubject, operation: '${subject === 'candidate' ? 'shared-profile-ensure' : 'assert-eager-registration'}', startedAt, completedAt, before, after, ownershipUnchanged, nodesUnchanged, focusUnchanged, stateUnchanged, documentIdentityUnchanged};
      if (!ownershipUnchanged || !nodesUnchanged || !focusUnchanged || !stateUnchanged || !documentIdentityUnchanged || after.optionalConstructed || after.sessionPresent || !Object.values(after.registrations).every(Boolean)) throw new Error('Color registration control changed ownership, construction, focus or editor state: ' + JSON.stringify(receipt));
      return receipt;
    },
  })});
}
// END receipted color registration control.
`;
}

export function colorPolicyOverlay(source, options = {}) {
  const subject = colorPolicySubject(options);
  assert.equal(typeof source, 'string');
  assert.equal(sha(source), colorPolicyPreimages[colorPolicySource], 'Color bridge main.ts exact preimage changed; source review required');
  for (const [label, token] of [['imports', importsAnchor], ['activation', activationAnchor]]) assert.equal(source.split(token).length, 2, 'Color bridge requires exactly one ' + label + ' anchor');
  assert(!source.includes('__colorControl') && !source.includes('__enColorPolicyTest'), 'Color bridge is already present');
  const replacements = [{before: activationAnchor, after: bridge(subject) + activationAnchor}];
  if (subject === 'candidate') replacements.unshift({before: importsAnchor, after: importsAnchor + candidateImports});
  let executed = source;
  for (const {before, after} of replacements) executed = executed.replace(before, after);
  return {source: executed, path: colorPolicySource, kind: 'color-native-registry-registration-control', revision: colorPolicyRevision, subject, originalSha256: sha(source), executedSha256: sha(executed), replacements,
    automaticPreparation: false, preparesThroughBridge: false, optionalConstruction: false,
    profile: subject === 'candidate' ? {schemaVersion: 1, id: 'en-reve-docs/composable-chat-color', version: '1', featureId: 'en-reve-docs/composable-chat-color/popup', featureVersion: '1'} : null,
    claim: 'Receipted build-only control. Candidate uses its exact existing profile and shared loader against the actual editor root registry. Reference asserts its existing eager registration. No preparation bridge, automatic load, session opening, construction shortcut, operation log, persistent DOM references, or replacement module cache. This is instrumented production output, not uninstrumented production.',
    startupAccounting: 'All emitted bridge bytes and any retained imports stay in each control route startup denominator; symmetric receipt treatment does not assert equal byte overhead. These separately prepared bridge-bearing assets support construction attribution and separate same-code control retention only; they cannot replace uninstrumented production static byte, route startup, cold, prepared, unused, or production retention evidence. Source-display modules remain the original complete authored specimens; the bridge is disclosed separately in executed-source overlays.'};
}

export async function applyColorPolicyBridge(root, options = {}) {
  const subject = colorPolicySubject(options);
  const path = resolve(root, colorPolicySource), source = await readFile(path, 'utf8');
  const overlay = colorPolicyOverlay(source, {subject}), guardedInputs = [];
  for (const [name, expected] of Object.entries(colorPolicyPreimages)) {
    if (subject === 'reference' && name !== colorPolicySource) continue;
    const bytes = await readFile(resolve(root, name));
    assert.equal(sha(bytes), expected, 'Color bridge exact source input changed: ' + name);
    guardedInputs.push({path: name, bytes: bytes.length, sha256: expected});
  }
  // A changing source is never silently accepted as the previously inspected preimage.
  for (const item of guardedInputs) assert.equal(sha(await readFile(resolve(root, item.path))), item.sha256, 'Color bridge input changed before writing: ' + item.path);
  await writeFile(path, overlay.source);
  assert.equal(sha(await readFile(path)), overlay.executedSha256, 'Color bridge executed source readback mismatch');
  const {source: _source, ...receipt} = overlay;
  return {...receipt, guardedInputs};
}
