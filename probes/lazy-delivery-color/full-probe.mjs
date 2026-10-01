/**
 * Actual composable-chat browser observer and Playwright adapter.
 * Source draft: NOT EXECUTED. No app imports, registry changes or prototype hooks.
 * The execution owner must install this before navigation on every fresh context.
 */
export const route = '/api-examples/composable-chat.html';
export const probeVersion = 'color-full-probe-v1';

// This function is serialized by Playwright and has no module-closure dependency.
export function installColorFullObserver({recordOperations = true} = {}) {
  if (typeof recordOperations !== 'boolean') throw new Error('recordOperations must be boolean.');
  if (window.__enColorFullProbe) throw new Error('Color full probe already installed in this document.');
  const optionalTags = ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'];
  const state = {version: 'color-full-probe-v1', recordOperations, startup: {state: 'running', start: 0}, action: null,
    preparation: null, operationSequence: 0, lifecycleCycles: 0, failure: null};
  // These weak references identify only the unchanged, connected route editor.
  // No picker, session, action node array or event object is stored in state.
  let initialIdentity, preparationFocus, focusCheckpoint;
  let focusCheckpointSequence = 0;
  const frame = () => new Promise(requestAnimationFrame);
  const twoFrames = () => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
  const visible = node => !!node && node.isConnected && node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0 && node.checkVisibility({visibilityProperty: true});
  const demo = () => document.querySelector('en-composable-chat-demo');
  const editor = () => demo()?.shadowRoot?.querySelector('en-token-editor');
  const textbox = () => editor()?.shadowRoot?.querySelector('[role="textbox"][aria-label="Structured message"]');
  const colors = () => [...demo()?.shadowRoot?.querySelectorAll('en-button') ?? []].find(node => node.textContent.trim() === 'Colors');
  const active = () => {let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node;};
  const fail = error => ({error: String(error), stack: error?.stack ?? null});
  const resources = () => recordOperations ? performance.getEntriesByType('resource').map(entry => entry.toJSON()) : null;
  function owner() {
    const element = editor(), root = element?.shadowRoot, view = element?.ownerDocument?.defaultView;
    const nativeAssociationAvailable = !!root && 'customElementRegistry' in root;
    const registry = nativeAssociationAvailable ? root.customElementRegistry : undefined;
    const actualRegistry = !nativeAssociationAvailable ? 'unavailable' : registry === null ? 'null' : registry === undefined ? 'undefined'
      : registry === view?.customElements ? 'global' : 'scoped';
    // Fallback is explicit evidence for browsers without the native root API; it
    // is not labeled a native association, and null/undefined never falls back.
    const definitionRegistry = nativeAssociationAvailable ? registry : view?.customElements;
    return {actualRegistry, nativeAssociationAvailable,
      definitionRegistrySource: nativeAssociationAvailable ? 'native-root-association' : 'document-global-api-unavailable',
      documentGlobalMatchesWindow: !!view && view.customElements === window.customElements,
      registryIdentityMatchesStartup: initialIdentity ? (initialIdentity.registry ? registry === initialIdentity.registry.deref() : actualRegistry === initialIdentity.registryKind) : null,
      editorOwnedByCurrentDocument: !!element && element.ownerDocument === document,
      definedTags: optionalTags.filter(tag => !!definitionRegistry?.get(tag)),
      editorConstructorMatchesRegistry: !!definitionRegistry?.get('en-token-editor') && element.constructor === definitionRegistry.get('en-token-editor')};
  }
  function draft() {
    const element = editor();
    return {value: element?.value ?? null, draftValue: element?.draftValue ?? null,
      documentJSON: element ? JSON.stringify(element.document) : null, revision: element?.revision ?? null,
      selection: element?.selection ? {...element.selection} : null};
  }
  function census(root) {
    const count = {nodes: 0, elements: 0, shadowRoots: 0};
    const visit = node => {if (!node) return; count.nodes++; if (node.nodeType === 1) count.elements++;
      if (node.nodeType === 11 && node.host) count.shadowRoots++;
      if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    visit(root); return count;
  }
  function nodesUnder(root) {
    const nodes = [];
    const visit = node => {if (!node) return; if (node.nodeType === 1) nodes.push(node);
      if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    visit(root); return nodes;
  }
  async function settleRouteUpdates() {
    // Locals die at the end of this call; no per-cycle nodes survive in state.
    const nodes = nodesUnder(document.querySelector('en-api-example-app'));
    await Promise.all(nodes.map(node => node.updateComplete).filter(Boolean));
  }
  function identity() {
    const element = editor();
    return {editorSame: !!element && element === initialIdentity?.editor.deref(),
      rootSame: !!element?.shadowRoot && element.shadowRoot === initialIdentity?.root.deref(),
      textboxSame: !!textbox() && textbox() === initialIdentity?.textbox.deref()};
  }
  function snapshotNow() {
    const element = editor(), root = element?.shadowRoot, focus = active(), popup = root?.querySelector('[part="popup"]');
    return {at: performance.now(), ...owner(), ...draft(), ...identity(), mode: demo()?.colorMode ?? null,
      popupOpen: !!popup?.matches(':popover-open'), optionalConstructed: !!root?.querySelector(optionalTags.join(',')),
      sessionElements: root?.querySelectorAll('[data-color-session]').length ?? 0,
      document: census(document), component: census(element),
      focus: focus ? {tag: focus.localName, id: focus.id, label: focus.getAttribute('aria-label'), role: focus.getAttribute('role')} : null,
      resources: resources(), lifecycleCycles: state.lifecycleCycles,
      preparationFocusUnchanged: preparationFocus ? active() === preparationFocus.deref() : null,
      instrumentation: {recordOperations, retainedOperationRecords: Number(!!state.action) + Number(!!state.preparation),
        operationHistoryLength: 0, fixedDocumentListeners: 3, stableEditorWeakReferences: initialIdentity ? 3 : 0,
        nativeRegistryWeakReferences: initialIdentity?.registry ? 1 : 0, preparationFocusWeakReferences: preparationFocus ? 1 : 0, focusCheckpointWeakReferences: focusCheckpoint ? 1 : 0}};
  }
  function assertDraftPreserved(expected) {
    const current = draft(), same = identity();
    for (const key of ['value', 'draftValue', 'documentJSON', 'revision']) {
      if (current[key] !== expected[key]) throw new Error('Colors session changed initial editor ' + key + '.');
    }
    if (!same.editorSame || !same.rootSame || !same.textboxSame) throw new Error('Colors session replaced the route editor/root/textbox.');
    return current;
  }
  function essentialControls() {
    const app = document.querySelector('en-api-example-app'), host = demo(), element = editor(), input = textbox();
    const composer = host?.shadowRoot?.querySelector('en-chat-composer');
    const modeHost = host?.shadowRoot?.querySelector('en-select[label="Color entry"]');
    const mode = modeHost?.shadowRoot?.querySelector('select');
    const buttons = ['References', 'Tools', 'Colors'].map(label => [...host?.shadowRoot?.querySelectorAll('en-button') ?? []]
      .find(node => node.textContent.trim() === label)?.shadowRoot?.querySelector('button'));
    const triggers = [...host?.shadowRoot?.querySelectorAll('en-editor-trigger') ?? []];
    const popup = element?.shadowRoot?.querySelector('[part="popup"]');
    const updated = nodesUnder(app).filter(node => node.localName.includes('-') && 'updateComplete' in node);
    const complete = !!app?.isConnected && !app.hasAttribute('data-ssr') && document.documentElement.hasAttribute('data-example-standalone')
      && app.hasUpdated && host?.hasUpdated && element?.hasUpdated && composer?.hasUpdated
      && host.isConnected && element.isConnected && composer.isConnected
      && composer.value === element.value
      && composer.shadowRoot?.querySelector('slot[name="editor"]')?.assignedElements({flatten: true}).includes(element)
      && updated.every(node => node.hasUpdated && !node.isUpdatePending)
      && host.colorMode === 'picker' && visible(mode) && !mode.disabled && mode.value === 'picker'
      && visible(input) && input.isContentEditable && input.getAttribute('aria-disabled') === 'false'
      && input.getAttribute('aria-readonly') === 'false' && !element.disabled && !element.readOnly
      && buttons.every(button => visible(button) && !button.disabled)
      && triggers.length === 3 && triggers.every(trigger => trigger.getAttribute('for') === 'structured-draft')
      && JSON.stringify(triggers.map(trigger => trigger.extension?.id).sort()) === JSON.stringify(['colors', 'references', 'tools'])
      && !!host.shadowRoot.querySelector('input[data-native-color][type="color"]')
      && !!popup && !popup.matches(':popover-open') && !element.shadowRoot.querySelector(optionalTags.join(','));
    return {complete, input};
  }
  // FROZEN_CONTROLS_START: body copied byte-for-byte (except indentation) from
  // candidate.mjs controls(). The owner/predicate is shared with the cold cell.
  const controls = editor => {
    const dialog = editor.shadowRoot.querySelector('[part="popup"]');
    const picker = dialog?.querySelector('en-color-picker');
    const hex = picker?.shadowRoot?.querySelector('#hex')?.shadowRoot?.querySelector('input');
    const sliders = [...picker?.shadowRoot?.querySelectorAll('en-color-slider') ?? []];
    const ranges = sliders.map(slider => slider.shadowRoot?.querySelector('input[type="range"]'));
    const exactFields = sliders.map(slider => slider.shadowRoot?.querySelector('#exact-field'));
    const exactInputs = exactFields.map(field => field?.shadowRoot?.querySelector('input'));
    const formatHost = picker?.shadowRoot?.querySelector('en-select[part="format"]');
    const format = formatHost?.shadowRoot?.querySelector('select');
    const alphaHost = picker?.shadowRoot?.querySelector('en-switch[part="alpha-toggle"]');
    const alpha = alphaHost?.shadowRoot?.querySelector('input');
    const tabs = dialog?.querySelector('en-tabs');
    const tabHosts = [...tabs?.querySelectorAll('en-tab') ?? []];
    const panels = [...tabs?.querySelectorAll('en-tab-panel') ?? []];
    const swatches = [...tabs?.querySelectorAll('en-swatch') ?? []];
    const actions = [...dialog?.querySelector('[part="color-actions"]')?.querySelectorAll('en-button') ?? []];
    const buttons = actions.map(host => host.shadowRoot?.querySelector('button'));
    const complete = dialog?.matches(':popover-open') && visible(picker) && picker.value === '#5577cc'
      && visible(hex) && !hex.disabled && !hex.readOnly && hex.value === '#5577cc'
      && visible(format) && !format.disabled && format.value === 'hex' && JSON.stringify([...format.options].filter(option => !option.disabled && !option.hidden).map(option => option.value)) === JSON.stringify(['hex', 'rgb', 'hsl'])
      && visible(alpha) && !alpha.disabled && !alpha.checked && alpha.getAttribute('role') === 'switch'
      && ranges.length === 3 && ranges.every((range, index) => visible(range) && !range.disabled && Number(range.value) === [85, 119, 204][index])
      && exactInputs.every((input, index) => visible(input) && !input.disabled && !input.readOnly && input.value === String([85, 119, 204][index]))
      && tabs.value === 'picker' && tabHosts.length === 2 && tabHosts.every((tab, index) => visible(tab) && !tab.disabled && tab.getAttribute('role') === 'tab'
        && tab.getAttribute('aria-selected') === String(index === 0) && tab.getAttribute('aria-disabled') === 'false' && tab.tabIndex === (index === 0 ? 0 : -1))
      && panels.length === 2 && panels.every((panel, index) => panel.matches(':defined') && panel.getAttribute('role') === 'tabpanel' && panel.hidden === (index === 1)
        && panel.getAttribute('aria-labelledby') === tabHosts[index].id && tabHosts[index].getAttribute('aria-controls') === panel.id)
      && swatches.length > 0 && swatches.every(swatch => swatch.matches(':defined') && !!swatch.shadowRoot)
      && buttons.length === 2 && buttons.every(native => visible(native) && !native.disabled)
      && picker.checkValidity();
    return {complete, dialog, picker, hex, sliders, tabs, actions, exactFields, formatHost, alphaHost, tabHosts, panels, swatches};
  };
  // FROZEN_CONTROLS_END
  function optionalOwnershipAfterReady() {
    const element = editor(), root = element?.shadowRoot, view = element?.ownerDocument?.defaultView;
    const nativeAssociationAvailable = !!root && 'customElementRegistry' in root;
    const registry = nativeAssociationAvailable ? root.customElementRegistry : view?.customElements;
    const original = identity(), ownerObservation = owner();
    const registryUsable = !!registry && typeof registry.get === 'function';
    // Native null/undefined remain unavailable owners. Only browsers lacking the
    // native root API use an explicitly labeled current-document definition
    // lookup; that lookup never counts as native affiliation qualification.
    const classify = value => value === null ? 'null' : value === undefined ? 'undefined'
      : value === view?.customElements ? 'global' : 'scoped';
    const affiliation = node => {
      const available = !!node && 'customElementRegistry' in node;
      const observed = available ? node.customElementRegistry : undefined;
      return {available, actualRegistry: available ? classify(observed) : 'unavailable',
        matchesOwner: available ? registryUsable && observed === registry : null};
    };
    const tagCounts = Object.fromEntries(optionalTags.map(tag => [tag, 0]));
    // Traverse open nested roots as well as authored light children. The array
    // is local to this synchronous check; no DOM node enters the receipt.
    const popup = root?.querySelector('[part="popup"]');
    const entries = nodesUnder(popup).filter(node => node.localName.startsWith('en-')).map((node, index) => {
      const ownRoot = node.shadowRoot, container = node.getRootNode();
      const hostAssociation = affiliation(node), containerAssociation = affiliation(container), renderRootAssociation = affiliation(ownRoot);
      const row = {index, tag: node.localName, declaredOptionalRoot: optionalTags.includes(node.localName),
        connected: node.isConnected, ownerDocumentMatches: node.ownerDocument === document,
        constructorMatchesDefinitionRegistry: registryUsable && !!registry.get(node.localName) && node.constructor === registry.get(node.localName),
        renderRootPresent: !!ownRoot, renderRootIsNativeShadow: !!ownRoot && typeof view?.ShadowRoot === 'function' && ownRoot instanceof view.ShadowRoot,
        renderRootIsLitRoot: !!ownRoot && ownRoot === node.renderRoot, renderRootHostMatches: ownRoot?.host === node,
        renderRootDocumentMatches: ownRoot?.ownerDocument === document, containerDocumentMatches: container.ownerDocument === document,
        hostAssociation, containerAssociation, renderRootAssociation};
      row.valid = row.connected && row.ownerDocumentMatches && row.constructorMatchesDefinitionRegistry
        && row.renderRootPresent && row.renderRootIsNativeShadow && row.renderRootIsLitRoot && row.renderRootHostMatches
        && row.renderRootDocumentMatches && row.containerDocumentMatches
        && [hostAssociation, containerAssociation, renderRootAssociation].every(item => !item.available || item.matchesOwner === true)
        && (!nativeAssociationAvailable || renderRootAssociation.available);
      if (row.declaredOptionalRoot) tagCounts[node.localName]++; return row;
    });
    const valid = registryUsable && original.editorSame && original.rootSame && original.textboxSame
      && ownerObservation.editorOwnedByCurrentDocument && ownerObservation.editorConstructorMatchesRegistry
      && ownerObservation.registryIdentityMatchesStartup === true
      && !!popup?.isConnected && popup.getRootNode() === root
      && optionalTags.every(tag => tagCounts[tag] > 0) && entries.every(row => row.valid);
    return {phase: 'after-frozen-ready-endpoint', checkedAt: performance.now(), valid,
      actualRegistry: ownerObservation.actualRegistry, definitionRegistrySource: ownerObservation.definitionRegistrySource,
      nativeAssociationAvailable, nativeAssociationQualification: nativeAssociationAvailable ? (valid ? 'verified' : 'failed') : 'unsupported',
      retainedEditorIdentity: original, registryIdentityMatchesStartup: ownerObservation.registryIdentityMatchesStartup,
      scope: 'All en-* custom hosts under the actual popup, recursively including open render roots.',
      checkedElementCount: entries.length, tagCounts, entries, limitations: nativeAssociationAvailable ? [] : ['Native root registry affiliation is unavailable; exact constructors were checked against the current owner document registry only.']};
  }
  async function observeAction(operation) {
    try {
      let found;
      do {
        if (performance.now() - operation.start > 5000) throw new Error('Picker full-readiness deadline exceeded.');
        await frame(); found = controls(editor());
      } while (!found.complete);
      // The same nested update set and frame opportunities as frozen candidate.
      const nodes = [found.picker, found.tabs, found.formatHost, found.alphaHost, ...found.exactFields, ...found.sliders,
        ...found.actions, ...found.tabHosts, ...found.panels, ...found.swatches, found.picker.shadowRoot.querySelector('#hex')];
      await Promise.all(nodes.map(node => node.updateComplete));
      await twoFrames(); found = controls(editor());
      if (!found.complete) throw new Error('Picker lost readiness during frame opportunities.');
      if (state.action !== operation) throw new Error('Action was superseded before full readiness.');
      const end = performance.now();
      Object.assign(operation, {state: 'ready', end, durationMs: end - operation.start,
        readyMs: end - operation.start, activationDurationMs: end - operation.clickStart, pickerValue: found.picker.value, hexValue: found.hex.value,
        sliderCount: found.sliders.length, popupRect: found.dialog.getBoundingClientRect().toJSON(),
        actionResources: recordOperations ? performance.getEntriesByType('resource')
          .filter(entry => entry.startTime >= operation.start && entry.startTime <= end).map(entry => entry.toJSON()) : null,
        registryAfter: owner(), draftPreserved: assertDraftPreserved(state.startup.draft)});
      if (JSON.stringify(operation.registryBefore) !== JSON.stringify(operation.registryAfter)) {
        // Defining optional tags is expected; ownership itself must not move.
        for (const key of ['actualRegistry', 'nativeAssociationAvailable', 'definitionRegistrySource', 'documentGlobalMatchesWindow', 'editorOwnedByCurrentDocument', 'editorConstructorMatchesRegistry', 'registryIdentityMatchesStartup']) {
          if (operation.registryBefore[key] !== operation.registryAfter[key]) throw new Error('Native editor ownership changed during Colors action: ' + key);
        }
      }
      operation.optionalOwnership = optionalOwnershipAfterReady();
      if (!operation.optionalOwnership.valid) throw new Error('Constructed optional color elements failed exact constructor/document/native-owner qualification.');
      operation.snapshot = snapshotNow();
    } catch (error) {Object.assign(operation, {state: 'error', ...fail(error)});}
  }
  function matchesColorsEvent(event) {
    const button = colors();
    return !!button && event.composedPath().includes(button);
  }
  function onKeydown(event) {
    const operation = state.action;
    if (!operation || operation.state !== 'armed' || operation.input !== 'keyboard' || event.key !== 'Enter' || !matchesColorsEvent(event)) return;
    operation.keydown = {at: performance.now(), eventTimeStamp: event.timeStamp, trusted: event.isTrusted,
      key: event.key, repeat: event.repeat, defaultPreventedAtCapture: event.defaultPrevented};
    if (!event.isTrusted || event.repeat) Object.assign(operation, {state: 'error', error: 'Colors Enter must be trusted and non-repeating.'});
  }
  function onPointerdown(event) {
    const operation = state.action;
    if (!operation || operation.state !== 'armed' || operation.input !== 'pointer' || !matchesColorsEvent(event)) return;
    operation.pointerdown = {at: performance.now(), eventTimeStamp: event.timeStamp, trusted: event.isTrusted,
      pointerType: event.pointerType ?? null, button: event.button, isPrimary: event.isPrimary};
  }
  function onClick(event) {
    const operation = state.action;
    if (!operation || operation.state !== 'armed' || !matchesColorsEvent(event)) return;
    const clickStart = performance.now();
    if (!event.isTrusted || (operation.input === 'keyboard' && !operation.keydown?.trusted)) {
      Object.assign(operation, {state: 'error', error: 'Colors activation lacks the declared trusted input.'}); return;
    }
    const pointerType = event.pointerType ?? null;
    if (operation.input === 'pointer' && (!operation.pointerdown?.trusted || !operation.pointerdown.isPrimary
      || operation.pointerdown.button !== 0 || operation.pointerdown.pointerType !== (operation.touch ? 'touch' : 'mouse'))) {
      Object.assign(operation, {state: 'error', error: 'Declared pointer action lacks its trusted primary mouse/touch pointerdown.'}); return;
    }
    Object.assign(operation, {state: 'running', start: operation.input === 'keyboard' ? operation.keydown.at : clickStart,
      clickStart, eventTimeStamp: event.timeStamp, trusted: event.isTrusted, pointerType, detail: event.detail,
      defaultPreventedAtCapture: event.defaultPrevented, clock: operation.input === 'keyboard' ? 'trusted-enter-keydown-to-ready' : 'trusted-colors-click-to-ready'});
    void observeAction(operation);
  }
  document.addEventListener('pointerdown', onPointerdown, true);
  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('click', onClick, true);
  async function observeStartup() {
    try {
      let found;
      do {
        if (performance.now() > 45000) throw new Error('Essential composable-chat readiness deadline exceeded.');
        await frame(); found = essentialControls();
      } while (!found.complete);
      await settleRouteUpdates(); await twoFrames(); found = essentialControls();
      if (!found.complete) throw new Error('Essential route lost readiness during frame opportunities.');
      const element = editor();
      const rawRegistry = 'customElementRegistry' in element.shadowRoot ? element.shadowRoot.customElementRegistry : undefined;
      initialIdentity = {editor: new WeakRef(element), root: new WeakRef(element.shadowRoot), textbox: new WeakRef(found.input),
        registry: rawRegistry && typeof rawRegistry === 'object' ? new WeakRef(rawRegistry) : null, registryKind: owner().actualRegistry};
      const end = performance.now();
      state.startup = {state: 'ready', start: 0, end, durationMs: end, readyMs: end, clock: 'navigation-time-origin-to-essential-ready',
        beforeInputSetup: true, draft: draft(), snapshot: snapshotNow()};
    } catch (error) {state.startup = {...state.startup, state: 'error', ...fail(error)};}
  }
  function requireReady() {
    if (state.startup.state !== 'ready') throw new Error('Wait for untouched essential route readiness first.');
    assertDraftPreserved(state.startup.draft);
    const ownership = owner();
    for (const key of ['registryIdentityMatchesStartup', 'editorOwnedByCurrentDocument', 'editorConstructorMatchesRegistry']) {
      if (ownership[key] !== true) throw new Error('Actual route editor ownership is not qualified: ' + key);
    }
  }
  function arm({input, touch}) {
    requireReady();
    if (!['pointer', 'keyboard'].includes(input) || typeof touch !== 'boolean' || (input === 'keyboard' && touch)) throw new Error('Invalid action input/touch pair.');
    if (['armed', 'running'].includes(state.action?.state)) throw new Error('Previous action is still active.');
    const root = editor().shadowRoot;
    if (root.querySelector('[part="popup"]')?.matches(':popover-open') || root.querySelector(optionalTags.join(','))) throw new Error('Colors must start from a fully disposed closed session.');
    state.action = {id: ++state.operationSequence, state: 'armed', armedAt: performance.now(), input, touch, registryBefore: owner()};
    return {...state.action};
  }
  function prepareNow() {
    requireReady();
    if (state.preparation?.state === 'running') throw new Error('Preparation already running.');
    const host = demo();
    if (typeof host.prepareColorControls !== 'function') throw new Error('Actual route has no public prepareColorControls(); reference waiting is a separate runner policy.');
    preparationFocus = active() ? new WeakRef(active()) : null;
    const operation = {id: ++state.operationSequence, state: 'running', status: 'pending', applicable: true, start: performance.now()};
    state.preparation = operation;
    // Do not await here or invent a loader. Retain only a scalar status record.
    try {
      Promise.resolve(host.prepareColorControls()).then(() => {
        const end = performance.now();
        Object.assign(operation, {state: 'ready', status: 'completed', end, durationMs: end - operation.start,
          focusUnchangedAtCompletion: preparationFocus ? active() === preparationFocus.deref() : null});
      }, error => Object.assign(operation, {state: 'error', status: 'error', end: performance.now(), ...fail(error)}));
    } catch (error) {Object.assign(operation, {state: 'error', status: 'error', end: performance.now(), ...fail(error)});}
    return {...operation};
  }
  async function finishClose() {
    await settleRouteUpdates(); await twoFrames();
    const current = snapshotNow();
    if (current.popupOpen || current.optionalConstructed || current.sessionElements !== 0) throw new Error('Cancel left optional color session DOM connected.');
    requireReady();
    if (active() !== textbox()) throw new Error('Cancel failed to restore the original Structured message textbox focus.');
    return {...current, focusRestored: true};
  }
  function markFocusNow() {
    const node = active();
    if (!node) throw new Error('Cannot mark an absent active element.');
    focusCheckpoint = {id: ++focusCheckpointSequence, node: new WeakRef(node)};
    return {id: focusCheckpoint.id, at: performance.now(), focus: {tag: node.localName, id: node.id, label: node.getAttribute('aria-label')}};
  }
  function assertMarkedFocusNow(id) {
    if (!Number.isSafeInteger(id) || id < 1 || focusCheckpoint?.id !== id) throw new Error('Focus checkpoint was absent or superseded.');
    const expected = focusCheckpoint.node.deref(), unchanged = !!expected && active() === expected;
    if (!unchanged) throw new Error('Preparation moved focus away from the exact marked active element.');
    return {id, at: performance.now(), unchanged: true};
  }
  Object.defineProperty(window, '__enColorFullProbe', {value: Object.freeze({state, snapshot: snapshotNow, arm, prepare: prepareNow,
    markFocus: markFocusNow, assertMarkedFocus: assertMarkedFocusNow,
    finishClose, finishCycle: () => {state.lifecycleCycles++; return state.lifecycleCycles;}}), configurable: false});
  void observeStartup();
}

export async function installFullProbe(context, {recordOperations = true} = {}) {
  await context.addInitScript(installColorFullObserver, {recordOperations});
}
export async function waitRouteReady(page) {
  await page.waitForFunction(() => ['ready', 'error'].includes(window.__enColorFullProbe?.state.startup.state), null, {timeout: 47000});
  const result = await page.evaluate(() => window.__enColorFullProbe.state.startup);
  if (result.state !== 'ready') throw new Error(result.error ?? 'Essential route not ready.');
  return result;
}
export async function snapshot(page) {return page.evaluate(() => window.__enColorFullProbe.snapshot());}
export async function prepare(page) {return page.evaluate(() => window.__enColorFullProbe.prepare());}
export async function awaitPreparation(page) {
  const before = await page.evaluate(() => window.__enColorFullProbe.state.preparation);
  if (!before) throw new Error('No preparation operation was started.');
  await page.waitForFunction(id => {
    const operation = window.__enColorFullProbe.state.preparation;
    return operation?.id !== id || ['ready', 'error'].includes(operation.state);
  }, before.id, {timeout: 45000});
  const result = await page.evaluate(() => window.__enColorFullProbe.state.preparation);
  if (result?.id !== before.id || result.state !== 'ready') throw new Error(result?.error ?? 'Preparation did not complete for its original operation.');
  return result;
}
export async function setupAction(page, {input = 'pointer', touch = false} = {}) {
  if (!['pointer', 'keyboard'].includes(input) || typeof touch !== 'boolean' || (input === 'keyboard' && touch)) throw new Error('Invalid action input/touch pair.');
  await waitRouteReady(page);
  const target = page.getByRole('button', {name: 'Colors', exact: true});
  // Setup is deliberately after immutable essential-startup capture and outside
  // the action clock. No trial click, Reset, value write, fake event or opening.
  await target.scrollIntoViewIfNeeded();
  if (input === 'keyboard') await target.focus();
  return {input, touch, snapshot: await snapshot(page)};
}
export async function action(page, {input = 'pointer', touch = false, preparedTarget = false} = {}) {
  if (typeof preparedTarget !== 'boolean') throw new Error('preparedTarget must be boolean.');
  if (!preparedTarget) await setupAction(page, {input, touch});
  const target = page.getByRole('button', {name: 'Colors', exact: true});
  const operation = await page.evaluate(options => window.__enColorFullProbe.arm(options), {input, touch});
  if (input === 'keyboard') await target.press('Enter');
  else if (touch) await target.tap();
  else await target.click();
  await page.waitForFunction(id => {
    const current = window.__enColorFullProbe.state.action;
    return current?.id !== id || ['ready', 'error'].includes(current.state);
  }, operation.id, {timeout: 6500});
  const result = await page.evaluate(() => window.__enColorFullProbe.state.action);
  if (result?.id !== operation.id || result.state !== 'ready' || !result.trusted) throw new Error(result?.error ?? 'Colors did not reach trusted full readiness.');
  return result;
}
export async function close(page) {
  const dialog = page.getByRole('dialog', {name: 'Color picker', exact: true});
  await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
  await dialog.waitFor({state: 'hidden'});
  return page.evaluate(() => window.__enColorFullProbe.finishClose());
}
export async function verifyUsability(page) {
  // These native edits are correctness checks AFTER the timed readiness sample.
  const dialog = page.getByRole('dialog', {name: 'Color picker', exact: true});
  const hex = dialog.getByRole('textbox', {name: 'Hex color', exact: true});
  await hex.fill('#abcdef'); await hex.press('Enter');
  await page.waitForFunction(() => {
    const host = document.querySelector('en-composable-chat-demo');
    const picker = host?.shadowRoot?.querySelector('en-token-editor')?.shadowRoot?.querySelector('en-color-picker');
    return picker?.value === '#abcdef' && picker.checkValidity();
  });
  const closed = await close(page);
  return {editingVerifiedAfterMeasurement: true, editedColor: '#abcdef', cancelPreservedDraft: true, closed};
}
export async function retentionCycle(page) {
  const before = await page.evaluate(() => ({recordOperations: window.__enColorFullProbe.state.recordOperations,
    cycles: window.__enColorFullProbe.state.lifecycleCycles}));
  if (before.recordOperations !== false) throw new Error('Retention requires installFullProbe(context, {recordOperations:false}) before navigation.');
  const opened = await action(page, {input: 'pointer', touch: false});
  await verifyUsability(page);
  const cycle = await page.evaluate(() => window.__enColorFullProbe.finishCycle());
  return {cycle, completed: true, input: opened.input, trusted: opened.trusted,
    policy: 'Same actual route host; new real Colors session, native Hex edit/Enter, Cancel, detached optional session DOM.'};
}

/** Untimed construction-equivalent control; only the separately receipted shim owns registration. */
export async function ensureSameCode(page) {
  await waitRouteReady(page);
  return page.evaluate(async () => {
    const probe = window.__enColorFullProbe, bridge = window.__enColorPolicyTest;
    if (bridge?.revision !== 'composable-chat-native-registry-control-v1'
      || typeof bridge.ensure !== 'function' || typeof bridge.status !== 'function') throw new Error('Exact color registration-control bridge is absent.');
    const element = document.querySelector('en-composable-chat-demo')?.shadowRoot?.querySelector('en-token-editor');
    if (!element) throw new Error('Actual route editor is absent.');
    const acceptedDocument = element.document, popup = element.shadowRoot?.querySelector('[part="popup"]');
    const before = probe.snapshot(), bridgeBefore = bridge.status(element);
    if (before.popupOpen || before.optionalConstructed || before.sessionElements) throw new Error('Same-code registration requires an unused actual editor.');
    const start = performance.now(), receipt = await bridge.ensure(element), end = performance.now();
    const after = probe.snapshot(), bridgeAfter = bridge.status(element);
    const controlIdentity = {acceptedDocumentSame: element.document === acceptedDocument,
      popupSame: !!popup && element.shadowRoot?.querySelector('[part="popup"]') === popup,
      optionalSessionAbsentBeforeAndAfter: !before.popupOpen && !before.optionalConstructed && !before.sessionElements
        && !after.popupOpen && !after.optionalConstructed && !after.sessionElements};
    for (const key of ['value', 'draftValue', 'documentJSON', 'revision', 'actualRegistry', 'nativeAssociationAvailable', 'definitionRegistrySource']) {
      if (before[key] !== after[key]) throw new Error('Registration-control changed editor ' + key + '.');
    }
    if (!controlIdentity.acceptedDocumentSame || !controlIdentity.popupSame || !controlIdentity.optionalSessionAbsentBeforeAndAfter
      || !after.editorSame || !after.rootSame || !after.textboxSame || !after.registryIdentityMatchesStartup
      || after.popupOpen || after.optionalConstructed || after.sessionElements || after.definedTags.length !== 5
      || !receipt.ownershipUnchanged || !receipt.nodesUnchanged || !receipt.focusUnchanged) throw new Error('Registration-control did not preserve route ownership, draft, construction and focus.');
    return {start, end, durationMs: end - start, before, after, bridgeBefore, bridgeAfter, controlIdentity, receipt};
  });
}

/** Exact bounded focus checkpoint for preparation abandonment; never restores focus. */
export async function markFocus(page) {return page.evaluate(() => window.__enColorFullProbe.markFocus());}
export async function assertMarkedFocus(page, checkpointId) {
  return page.evaluate(id => window.__enColorFullProbe.assertMarkedFocus(id), checkpointId);
}
