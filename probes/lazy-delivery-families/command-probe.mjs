/**
 * Browser-realm observer for the unchanged four-command settings workflow.
 * Serialize this function with Playwright addInitScript; it has no module closure.
 */
export function installCommandProbe({family = 'command', policy} = {}) {
  if (family !== 'command' || !['eager', 'on-demand'].includes(policy)) throw new Error('Explicit command family and authored arm policy required');
  const hostSelector = '#settings-command-palette';
  const triggerSelector = '#settings-command-trigger';
  const expectedCommands = [
    {action: 'settings.save', label: 'Save settings', disabled: false},
    {action: 'settings.restore-opacity', label: 'Restore saved opacity', disabled: false},
    {action: 'settings.cancel-save', label: 'Cancel save', disabled: true},
    {action: 'settings.review-incoming', label: 'Review incoming change', disabled: true},
  ];
  const state = {family: 'command', ready: false, startup: null, action: null, errors: [], initialInput: null, retainedNodes: null, lifecycleBootstrap: false, lifecycleCycles: 0, inputIdentityFailures: 0};
  const host = () => document.querySelector(hostSelector);
  const trigger = () => document.querySelector(triggerSelector);
  const active = () => {let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node;};
  const composedInside = (container, node) => {for (let current = node; current;) {if (current === container || container.contains(current)) return true; current = current.getRootNode()?.host;} return false;};
  function census(roots) {
    const count = {nodes: 0, elements: 0, texts: 0, comments: 0, shadowRoots: 0, styles: 0};
    const visit = node => {count.nodes++; if (node.nodeType === 1) {count.elements++; if (node.localName === 'style') count.styles++;} else if (node.nodeType === 3) count.texts++; else if (node.nodeType === 8) count.comments++; else if (node.nodeType === 11 && node.host) count.shadowRoots++; if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    for (const root of roots) visit(root); return count;
  }
  function pending(root) {
    let count = 0;
    const visit = node => {if (node.nodeType === 1 && node.hasAttribute('defer-hydration')) return; if (node.nodeType === 1 && node.localName.includes('-') && customElements.get(node.localName) && (!node.hasUpdated || node.isUpdatePending)) count++; if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    if (root) visit(root); return count;
  }
  function registration(element) {
    const ownerRegistry = element.customElementRegistry ?? element.getRootNode()?.customElementRegistry ?? element.ownerDocument.defaultView.customElements;
    const constructor = ownerRegistry.get(element.localName);
    const routeRegistry = ownerRegistry === element.ownerDocument.defaultView.customElements ? 'global' : 'scoped';
    return {actualRegistry: constructor ? routeRegistry : 'unregistered', routeRegistry, hostRegistered: Boolean(constructor), hostUpgraded: Boolean(constructor && element.constructor === constructor)};
  }
  function generatedRoots(element) {
    const shadow = element.shadowRoot;
    // The command wrapper/default slot are unconditional shell. Count only the
    // four generated subtrees, and count complete component/document separately.
    return shadow ? [...shadow.querySelectorAll('#en-command-search-label, [part~=focus-frame], #en-command-list, [part~=status]')] : [];
  }
  function generatedNodes(element) {
    const nodes = [];
    const visit = node => {nodes.push(node); if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    for (const root of generatedRoots(element)) visit(root); return nodes;
  }
  function observeIdentity(element) {
    const nodes = generatedNodes(element), input = element.shadowRoot?.querySelector('#en-command-search');
    let recreatedNodes = 0;
    if (state.retainedNodes) {
      recreatedNodes = nodes.filter((node, index) => node !== state.retainedNodes[index]?.deref()).length + Math.max(0, state.retainedNodes.length - nodes.length);
    } else state.retainedNodes = nodes.map(node => new WeakRef(node));
    if (input && !state.initialInput) state.initialInput = new WeakRef(input);
    const inputSame = Boolean(input && input === state.initialInput?.deref());
    if (!inputSame) state.inputIdentityFailures++;
    return {recreatedNodes, inputSame};
  }
  function catalogMatches(element) {
    const commands = element?.commands;
    return Array.isArray(commands) && commands.length === expectedCommands.length && commands.every((command, index) => {
      const expected = expectedCommands[index];
      return command.action === expected.action && command.label === expected.label && Boolean(command.disabled) === expected.disabled;
    });
  }
  function snapshot(element = host()) {
    const shadow = element?.shadowRoot, generated = census(element ? generatedRoots(element) : []), input = shadow?.querySelector('#en-command-search');
    const form = document.querySelector('#settings form[aria-label="Creative output settings"]');
    const resources = performance.getEntriesByType('resource').filter(entry => /\.m?js(?:\?|$)/.test(entry.name));
    return {at: performance.now(), document: census([document]), component: census(element ? [element] : []), generated, generatedElements: generated.elements,
      ...registration(element), lifecycleCycles: state.lifecycleCycles, lifecycleBootstrap: state.lifecycleBootstrap,
      resources: resources.map(entry => ({name: entry.name, origin: new URL(entry.name).origin, path: new URL(entry.name).pathname, encodedBodySize: entry.encodedBodySize, transferSize: entry.transferSize, protocol: entry.nextHopProtocol, startTime: entry.startTime, responseEnd: entry.responseEnd})),
      workload: {items: element.commands?.length ?? null, disabledItems: element.commands?.filter(command => command.disabled).length ?? null,
        commands: element.commands?.map(({action, label, disabled}) => ({action, label, disabled: Boolean(disabled)})) ?? null,
        catalogMatches: catalogMatches(element), hostRegistered: registration(element).hostRegistered, inputIdentityFailures: state.inputIdentityFailures, value: null, activeKey: null, contentRendering: element.contentRendering ?? element.getAttribute('content-rendering') ?? 'eager',
        generatedRows: shadow?.querySelectorAll('#en-command-list > [role=option]').length ?? 0,
        generatedComboboxes: shadow?.querySelectorAll('[role=combobox]').length ?? 0,
        generatedListboxes: shadow?.querySelectorAll('[role=listbox]').length ?? 0,
        generatedSearchStatuses: shadow?.querySelectorAll('[part~=status][role=status]').length ?? 0,
        inputValue: input?.value ?? null, inputSame: input && state.initialInput ? input === state.initialInput.deref() : null,
        formEntries: form ? [...new FormData(form)] : null,
        settingsCurrent: document.querySelector('[data-settings-current]')?.textContent?.trim() ?? null,
        loading: trigger()?.getAttribute('aria-busy') ?? null, status: document.querySelector('#settings-command-status')?.textContent ?? null}};
  }
  function visible(element) {
    if (!element?.isConnected || element.hidden || element.inert) return false;
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility === 'visible' && style.display !== 'none' && Number(style.opacity) > 0 && style.pointerEvents !== 'none';
  }
  function hitTestable(element, clipping) {
    if (!visible(element) || element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
    const rect = element.getBoundingClientRect(), bounds = clipping?.getBoundingClientRect(), viewport = visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0, right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    const x1 = Math.max(rect.left, bounds?.left ?? -Infinity, left), x2 = Math.min(rect.right, bounds?.right ?? Infinity, right);
    const y1 = Math.max(rect.top, bounds?.top ?? -Infinity, top), y2 = Math.min(rect.bottom, bounds?.bottom ?? Infinity, bottom);
    if (x2 <= x1 || y2 <= y1) return false;
    const x = (x1 + x2) / 2, y = (y1 + y2) / 2;
    let hit = document.elementFromPoint(x, y);
    while (hit?.shadowRoot) {const nested = hit.shadowRoot.elementFromPoint(x, y); if (!nested || nested === hit) break; hit = nested;}
    return Boolean(hit && composedInside(element, hit));
  }
  function readyFor(element) {
    const shadow = element?.shadowRoot, dialog = shadow?.querySelector('dialog[part~=surface]');
    const input = shadow?.querySelector('#en-command-search'), list = shadow?.querySelector('#en-command-list'), status = shadow?.querySelector('[part~=status]');
    const ownership = registration(element);
    if (!ownership.hostUpgraded || ownership.actualRegistry !== 'global' || !element.open || !dialog?.open || !dialog.matches(':modal') || dialog.inert || !visible(dialog) || pending(element) || !catalogMatches(element)) return null;
    if (active() !== input || !hitTestable(input) || input.disabled || input.readOnly || input.value !== '' || input.getAttribute('role') !== 'combobox' || input.getAttribute('aria-expanded') !== 'true' || input.getAttribute('aria-controls') !== list?.id || !visible(list)) return null;
    if (list.getAttribute('role') !== 'listbox' || list.getAttribute('aria-labelledby') !== 'en-command-search-label' || shadow.querySelector('#en-command-search-label')?.textContent?.trim() !== 'Find a settings command' || !status || status.getAttribute('role') !== 'status' || status.getAttribute('aria-live') !== 'polite' || status.textContent.trim()) return null;
    const rows = [...list.querySelectorAll(':scope > [role=option]')];
    if (rows.length !== 4 || !rows.every((row, index) => row.dataset.action === expectedCommands[index].action && row.querySelector('.en-command-label')?.textContent?.trim() === expectedCommands[index].label && row.getAttribute('aria-disabled') === String(expectedCommands[index].disabled) && visible(row))) return null;
    const activeId = input.getAttribute('aria-activedescendant'), candidate = activeId && shadow.getElementById(activeId);
    if (!candidate || candidate !== rows[0] || candidate.getAttribute('aria-selected') !== 'true' || !hitTestable(candidate, list) || rows.slice(1).some(row => row.getAttribute('aria-selected') !== 'false')) return null;
    const rect = dialog.getBoundingClientRect(), viewport = visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0, right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    if (rect.left < left - 2 || rect.right > right + 2 || rect.top < top - 2 || rect.bottom > bottom + 2) return null;
    if (element === host() && (trigger()?.getAttribute('aria-busy') !== 'false' || trigger()?.getAttribute('aria-expanded') !== 'true' || document.querySelector('#settings-command-status')?.textContent)) return null;
    return {rect: [rect.x, rect.y, rect.width, rect.height], actualRegistry: ownership.actualRegistry, hostRegistered: ownership.hostRegistered, hostUpgraded: ownership.hostUpgraded,
      nativeModal: true, modality: true, inputFocused: true, searchFocused: true, activeId, activeAction: candidate.dataset.action, rows: rows.length, disabledRows: 2, currentCatalog: true, ariaCorrect: true, ariaValid: true, positionUsable: true};
  }
  const sameRect = (a, b) => a && b && a.every((value, index) => Math.abs(value - b[index]) <= .5);
  function start(event) {
    const pendingAction = state.pendingAction;
    if (!pendingAction || pendingAction.started !== null || !event.composedPath().includes(trigger())) return;
    const matches = pendingAction.input === 'keyboard' ? event.type === 'keydown' && event.key === 'Enter' : event.type === 'click';
    if (!matches) return;
    pendingAction.started = performance.now(); pendingAction.trusted = event.isTrusted; pendingAction.eventType = event.type;
    pendingAction.deliveryStatus = globalThis.__enCommandPolicyTest?.status() ?? null;
    let previous;
    const watch = () => {
      if (state.pendingAction !== pendingAction) return;
      const element = host(), ready = readyFor(element);
      if (ready && sameRect(previous, ready.rect)) {
        const identity = observeIdentity(element), readyAt = performance.now();
        state.pendingAction = null; clearTimeout(pendingAction.timeout);
        pendingAction.resolve({started: pendingAction.started, readyAt, readyMs: readyAt - pendingAction.started, trusted: pendingAction.trusted, eventType: pendingAction.eventType,
          deliveryStatus: pendingAction.deliveryStatus, endpoint: ready, ...identity, snapshot: snapshot(element)});
        return;
      }
      previous = ready?.rect; requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }
  document.addEventListener('click', start, {capture: true}); document.addEventListener('keydown', start, {capture: true});
  function arm(input) {
    if (!['keyboard', 'pointer'].includes(input)) throw new Error('Unknown input policy');
    if (state.pendingAction) throw new Error('An action is already pending');
    state.action = new Promise((resolve, reject) => {
      const pendingAction = state.pendingAction = {input, started: null, resolve, reject};
      pendingAction.timeout = setTimeout(() => {if (state.pendingAction === pendingAction) state.pendingAction = null; reject(new Error('Command usable endpoint timed out'));}, 20000);
    });
    state.action.catch(() => {});
  }
  async function settle(element) {
    for (let pass = 0; pass < 3; pass++) {
      const promises = [];
      const visit = node => {if (node.nodeType === 1 && node.hasAttribute('defer-hydration')) return; if (node.updateComplete) promises.push(node.updateComplete); if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
      visit(element); await Promise.all(promises); await new Promise(resolve => requestAnimationFrame(resolve));
    }
  }
  async function waitReady(element) {
    const began = performance.now(); let previous;
    while (performance.now() - began < 20000) {const ready = readyFor(element); if (ready && sameRect(previous, ready.rect)) return ready; previous = ready?.rect; await new Promise(resolve => requestAnimationFrame(resolve));}
    throw new Error('Command lifecycle endpoint timed out');
  }
  function closed(element = host()) {
    const dialog = element?.shadowRoot?.querySelector('dialog'), input = element?.shadowRoot?.querySelector('#en-command-search');
    return Boolean(element && !element.open && !dialog?.open && (!input || input.getAttribute('aria-expanded') === 'false' && input.value === ''));
  }
  async function closedSettled() {
    const element = host(), focusBefore = active();
    if (!registration(element).hostUpgraded || !closed(element)) throw new Error('Closed settlement requires an upgraded closed palette');
    await settle(element);
    const began = performance.now(); let previous;
    while (performance.now() - began < 20000) {
      if (!closed(element) || active() !== focusBefore) throw new Error('Closed preparation opened or moved focus');
      const current = snapshot(element), rect = element.getBoundingClientRect();
      const signature = [current.document.nodes, current.component.nodes, current.generated.nodes, rect.x, rect.y, rect.width, rect.height];
      if (!pending(element) && sameRect(previous, signature)) return current;
      previous = signature; await new Promise(resolve => requestAnimationFrame(resolve));
    }
    throw new Error('Closed command preparation did not settle');
  }
  async function close(element = host()) {
    if (!registration(element).hostUpgraded) throw new Error('Cannot close an unupgraded command host');
    const outcome = element.hide(); if (!['committed', 'unchanged'].includes(outcome)) throw new Error('Command lifecycle close rejected');
    await settle(element); if (!closed(element)) throw new Error('Command lifecycle close/reset failed');
  }
  async function openOriginal() {
    const button = trigger()?.shadowRoot?.querySelector('button');
    if (!button) throw new Error('Missing real Search commands button');
    button.focus(); button.click(); await waitReady(host());
    const identity = observeIdentity(host());
    if (identity.recreatedNodes || !identity.inputSame) throw new Error('Retained command body or input identity changed');
  }
  async function lifecycleCycle(kind) {
    if (!['retained', 'disposed'].includes(kind)) throw new Error('Unknown command lifecycle');
    if (kind === 'retained') {
      await openOriginal(); await close();
      if (!observeIdentity(host()).inputSame) throw new Error('Command close replaced its native input');
    } else {
      // The real route intentionally leaves this tag unregistered. The first
      // disposed-host repetition admits it through its real native trigger;
      // this one-time original-host bootstrap is recorded, never hidden.
      if (!registration(host()).hostUpgraded) {await openOriginal(); await close(); state.lifecycleBootstrap = true;}
      const original = host(); let element = document.createElement(original.localName);
      // Do not clone id, for, defer-hydration, open or SSR markup. Properties and
      // policy are assigned before connection; the current catalog is exact.
      element.contentRendering = original.contentRendering ?? original.getAttribute('content-rendering') ?? 'eager';
      element.commands = original.commands; element.label = original.label; element.searchLabel = original.searchLabel;
      element.placeholder = original.placeholder; element.emptyText = original.emptyText; element.closeLabel = original.closeLabel;
      try {
        original.parentNode.append(element); await settle(element);
        const outcome = element.show(); if (!['committed', 'unchanged'].includes(outcome)) throw new Error('Command lifecycle opening rejected');
        await waitReady(element);
        const input = new WeakRef(element.shadowRoot.querySelector('#en-command-search'));
        await close(element);
        if (input.deref() !== element.shadowRoot.querySelector('#en-command-search')) {state.inputIdentityFailures++; throw new Error('Disposed command close replaced native input');}
      } finally {element.remove(); element = null;}
    }
    state.lifecycleCycles++;
  }
  window.__enFamilyProbe = {state, snapshot, arm, get action() {return state.action;}, close, isClosed: closed, closedSettled, lifecycleCycle};
  const boot = () => {
    const element = host(), owner = document.querySelector('en-workflows-app'), shadow = element?.shadowRoot, nativeTrigger = trigger()?.shadowRoot?.querySelector('button');
    // Never wait for or force palette registration here: its existing route
    // loader prepares code without registration, and its SSR shadow is useful.
    const hydrated = owner?.hasUpdated && !owner.isUpdatePending && !owner.hasAttribute('data-ssr') && !pending(owner);
    const workload = element && (element.contentRendering ?? element.getAttribute('content-rendering') ?? 'eager') === policy && catalogMatches(element) && !element.hasAttribute('open') && !element.open && shadow?.querySelector('dialog')?.open === false;
    if (!hydrated || !workload || !nativeTrigger || nativeTrigger.disabled || trigger().getAttribute('aria-busy') !== 'false' || document.readyState === 'loading' || document.fonts?.status !== 'loaded') {requestAnimationFrame(boot); return;}
    const input = shadow.querySelector('#en-command-search'); if (input) state.initialInput = new WeakRef(input);
    state.ready = true; state.startupReadyMs = performance.now(); state.startup = snapshot(element);
  };
  requestAnimationFrame(boot);
}
