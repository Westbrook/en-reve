/** Browser-realm adapter for the unchanged dedicated pagination example. */
export function installPaginationProbe({family = 'pagination', policy} = {}) {
  if (family !== 'pagination' || !['eager', 'on-demand'].includes(policy)) throw new Error('Pagination requires its exact family and prepared arm policy');
  const specs = [
    {id: 'api-pagination', selector: '#api-pagination', eligible: true, page: 1, pageCount: 12},
    {id: 'api-pagination-intermediate', selector: '#api-pagination-intermediate', eligible: true, page: 6, pageCount: 40},
    {id: 'api-pagination-mobile', selector: '#api-pagination-mobile', eligible: true, page: 6, pageCount: 40},
    {id: 'pagination-start', selector: 'en-pagination.pagination-start', eligible: true, page: 6, pageCount: 40},
    {id: 'pagination-distributed', selector: 'en-pagination.pagination-distributed', eligible: true, page: 6, pageCount: 40},
    {id: 'api-pagination-slotted', selector: '#api-pagination-slotted', eligible: false, page: 6, pageCount: 40},
    {id: 'pagination-text-slotted', selector: 'en-pagination[label="Text slot example pages"]', eligible: true, page: 6, pageCount: 40},
    {id: 'api-pagination-unknown', selector: '#api-pagination-unknown', eligible: false, page: 1, pageCount: 0},
  ];
  const state = {family, policy, ready: false, startupReadyMs: null, startup: null, action: null, errors: [], pendingAction: null, retainedNodes: null, initialInput: null, initialPanel: null, lastInvoker: null, completedActions: 0};
  const inputRefs = new Map(); // Only WeakRefs: diagnostics must not retain detached native fields.
  const host = () => document.querySelector('#api-pagination');
  const records = () => [...document.querySelectorAll('ol[aria-label="Project studies"] > li')].map(node => node.textContent);
  const recordsMatch = () => JSON.stringify(records()) === JSON.stringify(['Project study 01', 'Project study 02', 'Project study 03']);
  const panelFor = element => element?.shadowRoot?.querySelector('[part~=direct][popover]');
  const inputFor = element => element?.shadowRoot?.querySelector('[part~=page-input]');
  const bodyFor = element => element?.shadowRoot?.querySelector('[part~=jump]');
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
    visit(root); return count;
  }
  function registry(element) {
    const actual = element.customElementRegistry ?? element.shadowRoot?.customElementRegistry;
    if (actual) return actual === element.ownerDocument.defaultView.customElements ? 'global' : 'scoped';
    return element.ownerDocument.defaultView.customElements.get(element.localName) === element.constructor ? 'global' : 'unknown';
  }
  function rememberInput(element, id) {
    const input = inputFor(element); if (input && !inputRefs.has(id)) inputRefs.set(id, new WeakRef(input));
    if (id === 'api-pagination' && input && !state.initialInput) state.initialInput = new WeakRef(input);
  }
  function snapshot(element = host()) {
    const generated = census(bodyFor(element) ? [bodyFor(element)] : []), routeBodies = [], pagers = specs.map(spec => {
      const item = document.querySelector(spec.selector); if (!item?.shadowRoot) throw new Error('Missing exact pagination specimen: ' + spec.id);
      const body = bodyFor(item), input = inputFor(item), component = census([item]), generated = census(body ? [body] : []), previous = inputRefs.get(spec.id);
      if (body) routeBodies.push(body);
      return {id: spec.id, eligible: spec.eligible, knownTotal: spec.pageCount > 0, contentRendering: item.contentRendering ?? 'eager', componentNodes: component.nodes, componentElements: component.elements, generatedNodes: generated.nodes, generatedElements: generated.elements, inputPresent: Boolean(input), inputSame: previous ? input === previous.deref() : null, page: item.page, pageCount: item.pageCount, shellPresent: Boolean(panelFor(item)), open: Boolean(panelFor(item)?.matches(':popover-open')), registry: registry(item)};
    });
    const input = inputFor(element), resources = performance.getEntriesByType('resource').filter(entry => /\.m?js(?:\?|$)/.test(entry.name));
    return {at: performance.now(), document: census([document]), component: census([element]), generated, generatedElements: generated.elements, routeGenerated: census(routeBodies), actualRegistry: registry(element),
      resources: resources.map(entry => ({name: entry.name, origin: new URL(entry.name).origin, path: new URL(entry.name).pathname, encodedBodySize: entry.encodedBodySize, transferSize: entry.transferSize, protocol: entry.nextHopProtocol, startTime: entry.startTime, responseEnd: entry.responseEnd})),
      workload: {items: 7, totalHosts: document.querySelectorAll('en-pagination').length, eligibleHosts: 6, pagers, chooserElements: pagers.reduce((sum, item) => sum + item.generatedElements, 0), inputIdentityFailures: pagers.filter(item => item.inputSame === false).length, page: element.page, pageCount: element.pageCount, contentRendering: element.contentRendering ?? 'eager', inputValue: input?.value ?? null, inputSame: state.initialInput ? input === state.initialInput.deref() : null, shellSame: state.initialPanel ? panelFor(element) === state.initialPanel.deref() : null, records: records(), openDetails: document.querySelectorAll('details[open]').length}};
  }
  function visible(element) {
    if (!element?.isConnected || element.hidden || element.inert) return false;
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility === 'visible' && style.display !== 'none' && Number(style.opacity) > 0 && style.pointerEvents !== 'none';
  }
  function hitTestable(element) {
    if (!visible(element) || element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
    const r = element.getBoundingClientRect(), viewport = visualViewport, left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0, right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    const x1 = Math.max(r.left, left), x2 = Math.min(r.right, right), y1 = Math.max(r.top, top), y2 = Math.min(r.bottom, bottom); if (x2 <= x1 || y2 <= y1) return false;
    const x = (x1 + x2) / 2, y = (y1 + y2) / 2; let hit = document.elementFromPoint(x, y);
    while (hit?.shadowRoot) {const nested = hit.shadowRoot.elementFromPoint(x, y); if (!nested || nested === hit) break; hit = nested;}
    return Boolean(hit && composedInside(element, hit));
  }
  function invokerFor(element) {
    const controls = [...(element.shadowRoot?.querySelectorAll('button[part~=direct-summary][popovertarget]') ?? [])].filter(visible);
    if (controls.length !== 1 || controls[0].disabled) throw new Error('Expected exactly one enabled, visible native page chooser invoker');
    return controls[0];
  }
  function readyFor(element, expectedDraft) {
    const panel = panelFor(element), input = inputFor(element), body = bodyFor(element), shadow = element.shadowRoot;
    if (!recordsMatch() || element.page !== 1 || element.pageCount !== 12 || !panel?.matches(':popover-open') || !visible(panel) || panel.inert || !body || pending(element) || !input || active() !== input || input.disabled || input.readOnly || input.type !== 'number' || input.inputMode !== 'numeric' || !input.required || input.min !== '1' || input.max !== String(element.pageCount) || input.step !== '1' || !input.validity.valid || input.value !== expectedDraft || !hitTestable(input)) return null;
    const go = shadow.querySelector('[part~=go]'), cancel = shadow.querySelector('[part~=cancel]'), invoker = invokerFor(element);
    const label = shadow.querySelector('label[for="' + input.id + '"]');
    if (!hitTestable(go) || !hitTestable(cancel) || census([body]).elements !== 5 || label?.textContent?.trim() !== 'Page number' || ![...(input.labels ?? [])].includes(label) || go.textContent.trim() !== 'Go to page' || cancel.textContent.trim() !== 'Cancel') return null;
    const r = panel.getBoundingClientRect(), anchor = invoker.getBoundingClientRect(), viewport = visualViewport, left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0, right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    if (r.left < left - 2 || r.right > right + 2 || r.top < top - 2 || r.bottom > bottom + 2 || !(r.top >= anchor.bottom - 2 || r.bottom <= anchor.top + 2)) return null;
    return {rect: [r.x, r.y, r.width, r.height], inputFocused: true, inputEnabled: true, inputValid: true, inputValue: input.value, bodyElements: 5, positionUsable: true, nativePopoverOpen: true, page: element.page, pageCount: element.pageCount};
  }
  const sameRect = (a, b) => a && b && a.every((value, index) => Math.abs(value - b[index]) <= .5);
  function generatedNodes(element) {
    const nodes = [], body = bodyFor(element), visit = node => {nodes.push(node); if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    if (body) visit(body); return nodes;
  }
  function retainOriginal(element) {
    const nodes = generatedNodes(element), previous = state.retainedNodes;
    const recreated = previous ? nodes.filter((node, index) => node !== previous[index]?.deref()).length + Math.max(0, previous.length - nodes.length) : 0;
    state.retainedNodes ??= nodes.map(node => new WeakRef(node)); rememberInput(element, 'api-pagination'); return recreated;
  }
  function finish(action, error, result) {
    if (state.pendingAction !== action) return;
    state.pendingAction = null; clearTimeout(action.timeout); action.abort.abort(); action.activationEvent = null; action.clickEvent = null;
    if (error) {state.errors.push(String(error)); action.reject(error);} else action.resolve(result);
  }
  function start(event) {
    const action = state.pendingAction; if (!action) return;
    const element = host(), invoker = action.invoker.deref(); if (!invoker || !event.composedPath().includes(invoker)) return;
    if (event.type === 'click') {action.clicks++; action.untrustedClick ||= !event.isTrusted; action.clickEvent = event;}
    const matches = action.input === 'keyboard' ? event.type === 'keydown' && event.key === 'Enter' : event.type === 'click';
    if (!matches || action.started !== null) return;
    action.activationEvent = event;
    action.started = performance.now(); action.trusted = event.isTrusted; state.lastInvoker = new WeakRef(invoker);
    let previous;
    const watch = () => {
      if (state.pendingAction !== action) return;
      // RAF runs after full trusted dispatch; capture-listener microtasks can run
      // before later target/bubble listeners and cannot prove uncanceled default.
      action.clickPrevented = action.clickEvent?.defaultPrevented === true;
      action.keydownPrevented = action.input === 'keyboard' && action.activationEvent?.defaultPrevented === true;
      const panel = panelFor(element), ready = readyFor(element, action.expectedDraft);
      if (panel?.matches(':popover-open') && visible(panel) && action.firstPresentation === null) {
        action.firstPresentation = {at: performance.now(), ready: Boolean(ready)};
        if (!ready) {finish(action, new Error('First visible native chooser presentation was incomplete, unfocused, invalid or unusably positioned')); return;}
      }
      if (ready && sameRect(previous, ready.rect)) {
        if (panel !== action.panel.deref() || panel !== state.initialPanel?.deref() || action.beforeOpen !== 1 || action.clicks !== 1 || action.clickPrevented || action.untrustedClick || action.keydownPrevented || !action.firstPresentation?.ready) {finish(action, new Error('Native chooser shell/default action/opening count changed')); return;}
        const readyAt = performance.now(), recreatedNodes = retainOriginal(element); state.completedActions++;
        finish(action, null, {started: action.started, readyAt, readyMs: readyAt - action.started, trusted: action.trusted, endpoint: {...ready, firstPresentation: action.firstPresentation, openingEvents: action.beforeOpen, nativeClicks: action.clicks, nativeClickTrusted: !action.untrustedClick, defaultPrevented: action.clickPrevented, keydownDefaultPrevented: action.keydownPrevented, shellSame: true}, recreatedNodes, snapshot: snapshot(element)}); return;
      }
      previous = ready?.rect; requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }
  document.addEventListener('click', start, {capture: true}); document.addEventListener('keydown', start, {capture: true});
  function arm(input) {
    if (!['keyboard', 'pointer'].includes(input) || state.pendingAction || state.completedActions >= 2) throw new Error('Invalid or overlapping pagination action');
    const element = host(), panel = panelFor(element), invoker = invokerFor(element), expectedDraft = state.completedActions === 0 ? '1' : '9';
    if (!panel || panel.matches(':popover-open')) throw new Error('Native chooser must start closed');
    if (inputFor(element) && inputFor(element).value !== expectedDraft || state.completedActions && inputFor(element) !== state.initialInput?.deref()) throw new Error('Native chooser lost the independently declared draft or input before opening');
    state.action = new Promise((resolve, reject) => {
      const abort = new AbortController(), action = state.pendingAction = {input, resolve, reject, abort, invoker: new WeakRef(invoker), panel: new WeakRef(panel), expectedDraft, started: null, trusted: false, firstPresentation: null, beforeOpen: 0, clicks: 0, clickPrevented: false, untrustedClick: false, keydownPrevented: false, activationEvent: null, clickEvent: null};
      panel.addEventListener('beforetoggle', event => {if (event.newState === 'open') action.beforeOpen++;}, {signal: abort.signal});
      action.timeout = setTimeout(() => finish(action, new Error('Full native page chooser endpoint timed out')), 20000);
    });
    state.action.catch(() => {});
  }
  async function settle(element) {
    for (let pass = 0; pass < 3; pass++) {const promises = [], visit = node => {if (node.nodeType === 1 && node.hasAttribute('defer-hydration')) return; if (node.updateComplete) promises.push(node.updateComplete); if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);}; visit(element); await Promise.all(promises); await new Promise(resolve => requestAnimationFrame(resolve));}
  }
  function isClosed(element = host(), invoker = state.lastInvoker?.deref()) {
    const panel = panelFor(element), timedDraft = element !== host() || state.completedActions === 0 || inputFor(element)?.value === '9' && inputFor(element) === state.initialInput?.deref();
    return Boolean(panel && !panel.matches(':popover-open') && (!invoker || active() === invoker) && timedDraft);
  }
  async function close(element = host(), invoker = state.lastInvoker?.deref()) {
    const input = inputFor(element); if (!input || !panelFor(element)?.matches(':popover-open')) throw new Error('Cannot close an unopened chooser');
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, composed: true, cancelable: true}));
    await settle(element); if (!isClosed(element, invoker)) throw new Error('Chooser did not close and restore its native invoker focus');
  }
  async function waitReady(element, expectedDraft) {
    let previous; const started = performance.now();
    while (performance.now() - started < 20000) {
      const ready = readyFor(element, expectedDraft);
      if (panelFor(element)?.matches(':popover-open') && visible(panelFor(element)) && !ready) throw new Error('Lifecycle chooser first presentation incomplete');
      if (ready && sameRect(previous, ready.rect)) return ready;
      previous = ready?.rect; await new Promise(resolve => requestAnimationFrame(resolve));
    }
    throw new Error('Lifecycle chooser endpoint timed out');
  }
  async function lifecycleCycle(kind) {
    if (!['retained', 'disposed'].includes(kind)) throw new Error('Unknown pagination lifecycle');
    const original = host(); let element = original;
    if (kind === 'disposed') {
      element = document.createElement('en-pagination');
      for (const attribute of original.attributes) if (attribute.name !== 'id') element.setAttribute(attribute.name, attribute.value);
      for (const name of ['contentRendering', 'page', 'pageCount', 'hasNext', 'disabled', 'label', 'previousLabel', 'nextLabel', 'pageLabel', 'statusLabel', 'unknownStatusLabel', 'directLabel', 'pageNumberLabel', 'goLabel', 'cancelLabel']) element[name] = original[name] ?? (name === 'contentRendering' ? 'eager' : undefined);
      for (const child of original.childNodes) element.append(child.cloneNode(true));
      original.after(element); await settle(element);
    }
    try {
      element.scrollIntoView({block: 'center'}); await new Promise(resolve => requestAnimationFrame(resolve));
      const invoker = invokerFor(element), panel = panelFor(element), expectedDraft = kind === 'retained' && state.retainedNodes ? '9' : '1', abort = new AbortController(); let opens = 0;
      panel.addEventListener('beforetoggle', event => {if (event.newState === 'open') opens++;}, {signal: abort.signal});
      try {
        invoker.focus(); invoker.click(); await waitReady(element, expectedDraft);
        if (opens !== 1 || panel !== panelFor(element)) throw new Error('Lifecycle changed native opening ownership or shell');
        if (kind === 'retained' && retainOriginal(element) !== 0) throw new Error('Retained chooser body nodes were recreated');
        const input = inputFor(element), inputRef = new WeakRef(input); input.value = '9'; input.dispatchEvent(new Event('input', {bubbles: true, composed: true}));
        await close(element, invoker);
        if (inputFor(element) !== inputRef.deref() || inputFor(element).value !== '9' || element.page !== 1 || element.pageCount !== 12) throw new Error('Lifecycle lost native input, draft or fixed page workload');
      } finally {abort.abort();}
    } finally {if (kind === 'disposed') {element.remove(); element = null;}}
  }
  window.__enFamilyProbe = {state, snapshot, arm, get action() {return state.action;}, close, isClosed, lifecycleCycle};
  const boot = () => {
    try {
      const owner = document.querySelector('en-api-example-app'), elements = specs.map(spec => document.querySelector(spec.selector));
      if (!document.documentElement.hasAttribute('data-example-standalone') || !owner || !owner.hasUpdated || owner.isUpdatePending || pending(owner) || owner.hasAttribute('data-ssr') || document.readyState === 'loading' || document.fonts?.status !== 'loaded' || elements.some(element => !element?.shadowRoot || !element.hasUpdated || element.isUpdatePending || pending(element))) {requestAnimationFrame(boot); return;}
      if (specs.some(spec => document.querySelectorAll(spec.selector).length !== 1)) throw new Error('Dedicated pagination specimen selectors are not unique');
      if (document.querySelectorAll('en-pagination').length !== specs.length) throw new Error('Dedicated pagination host count changed');
      for (let index = 0; index < specs.length; index++) {
        const spec = specs[index], element = elements[index], body = bodyFor(element), input = inputFor(element), panel = panelFor(element), expectedPolicy = spec.eligible ? policy : 'eager';
        if (element.page !== spec.page || element.pageCount !== spec.pageCount || element.disabled || (element.contentRendering ?? 'eager') !== expectedPolicy || registry(element) !== 'global') throw new Error('Pagination workload/policy/registry changed: ' + spec.id);
        if (Boolean(panel) !== Boolean(spec.pageCount) || panel?.matches(':popover-open')) throw new Error('Pagination native closed shell changed: ' + spec.id);
        const expectedBody = Boolean(spec.pageCount && expectedPolicy === 'eager');
        if (Boolean(body) !== expectedBody || Boolean(input) !== expectedBody || body && census([body]).elements !== 5) throw new Error('Initial chooser body does not match exact arm policy: ' + spec.id);
        rememberInput(element, spec.id);
      }
      if (!recordsMatch() || document.querySelectorAll('details[open]').length) throw new Error('Actual pagination route records/disclosure workload changed');
      state.initialPanel = new WeakRef(panelFor(host())); state.ready = true; state.startupReadyMs = performance.now(); state.startup = snapshot();
    } catch (error) {state.errors.push(String(error)); throw error;}
  };
  requestAnimationFrame(boot);
}
