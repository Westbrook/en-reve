/** Runs in the browser realm through Playwright addInitScript; observes actual route owners. */
export function installFamilyProbe({family}) {
  if (!['media', 'combobox'].includes(family)) throw new Error('Unknown family adapter: ' + family);
  const selector = family === 'media' ? '#media > en-media-viewer#viewer' : '#selection en-combobox';
  const state = {family, ready: false, startup: null, action: null, errors: [], initialInput: null, retainedNodes: null};
  const decoded = new WeakSet(), decoding = new WeakSet();
  const host = () => document.querySelector(selector);
  const active = () => {let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node;};
  const composedInside = (container, node) => {for (let current = node; current;) {if (current === container || container.contains(current)) return true; current = current.getRootNode()?.host;} return false;};
  const census = roots => {
    const count = {nodes: 0, elements: 0, texts: 0, comments: 0, shadowRoots: 0, styles: 0};
    const visit = node => {count.nodes++; if (node.nodeType === 1) {count.elements++; if (node.localName === 'style') count.styles++;} else if (node.nodeType === 3) count.texts++; else if (node.nodeType === 8) count.comments++; else if (node.nodeType === 11 && node.host) count.shadowRoots++; if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    for (const root of roots) visit(root); return count;
  };
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
  function snapshot(element = host()) {
    const shadow = element.shadowRoot, generated = family === 'media' ? [...(shadow.querySelector('[part~=body]')?.childNodes ?? [])] : [...(shadow.querySelector('#listbox')?.childNodes ?? [])];
    const generatedCount = census(generated), resources = performance.getEntriesByType('resource').filter(entry => /\.m?js(?:\?|$)/.test(entry.name));
    const control = shadow.querySelector('#control'), form = element.form ?? element.closest('form');
    return {at: performance.now(), document: census([document]), component: census([element]), generated: generatedCount, generatedElements: generatedCount.elements, generatedSlides: shadow.querySelectorAll('[part~=body] en-carousel-slide').length, imageViewToolNodes: census(shadow.querySelector('[part~=body] .tools') ? [shadow.querySelector('[part~=body] .tools')] : []).nodes, actualRegistry: registry(element),
      resources: resources.map(entry => ({name: entry.name, origin: new URL(entry.name).origin, path: new URL(entry.name).pathname, encodedBodySize: entry.encodedBodySize, transferSize: entry.transferSize, protocol: entry.nextHopProtocol, startTime: entry.startTime, responseEnd: entry.responseEnd})),
      workload: {items: element.items?.length, disabledItems: element.items?.filter(item => item.disabled).length, value: element.value ?? null, activeKey: element.activeKey ?? null, contentRendering: element.contentRendering ?? 'eager', generatedRows: shadow.querySelectorAll('#listbox > [role=option]').length,
        generatedCarousels: shadow.querySelectorAll('[part~=body] en-carousel').length, generatedImages: shadow.querySelectorAll('[part~=body] figure img').length,
        inputValue: control?.value ?? null, inputSame: control ? control === state.initialInput?.deref() : null, formEntries: form ? [...new FormData(form)] : null}};
  }
  function visible(element) {
    if (!element || element.hidden || element.inert || !element.isConnected) return false;
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility === 'visible' && style.display !== 'none' && Number(style.opacity) > 0 && style.pointerEvents !== 'none';
  }
  function hitTestable(element) {
    if (!visible(element) || element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
    const r = element.getBoundingClientRect(), v = visualViewport, left = v?.offsetLeft ?? 0, top = v?.offsetTop ?? 0;
    const right = left + (v?.width ?? innerWidth), bottom = top + (v?.height ?? innerHeight);
    const x1 = Math.max(r.left, left), x2 = Math.min(r.right, right), y1 = Math.max(r.top, top), y2 = Math.min(r.bottom, bottom);
    if (x2 <= x1 || y2 <= y1) return false;
    const x = (x1 + x2) / 2, y = (y1 + y2) / 2;
    let hit = document.elementFromPoint(x, y);
    while (hit?.shadowRoot) {const nested = hit.shadowRoot.elementFromPoint(x, y); if (!nested || nested === hit) break; hit = nested;}
    return hit && composedInside(element, hit);
  }
  function mediaReady(element) {
    const shadow = element.shadowRoot, dialog = shadow?.querySelector('dialog'), carousel = shadow?.querySelector('en-carousel'), tools = shadow?.querySelector('.tools');
    const image = shadow?.querySelector('[data-current=true] img'), fit = tools?.querySelector('button'), range = tools?.querySelector('input[type=range]');
    const item = element.items?.find(item => item.key === element.activeKey), slides = [...(carousel?.querySelectorAll(':scope > en-carousel-slide') ?? [])];
    const currentIndex = element.items?.findIndex(item => item.key === element.activeKey), carouselRoot = carousel?.shadowRoot;
    const next = carouselRoot?.querySelector('[part~=next]'), currentPicker = carouselRoot?.querySelector('[part~=picker-current]'), otherPicker = carouselRoot?.querySelector('[part~=picker-button]:not([part~=picker-current])');
    if (!element.open || !dialog?.open || !dialog.matches(':modal') || dialog.inert || !visible(dialog) || !composedInside(dialog, active()) || !carousel?.shadowRoot?.querySelector('[part~=viewport][data-controls-ready]') || pending(element) || !image?.complete || !image.naturalWidth || !visible(image) || !hitTestable(fit) || !hitTestable(range)) return null;
    if (!item || element.activeKey !== 'dawn' || image.getAttribute('src') !== item.src || image.alt !== item.alt || slides.length !== 2 || carousel.index !== currentIndex || currentPicker?.dataset.index !== String(currentIndex) || next?.loading || !hitTestable(next) || !hitTestable(next.shadowRoot?.querySelector('button')) || !hitTestable(currentPicker) || !hitTestable(otherPicker)) return null;
    if (!decoded.has(image)) {
      if (!decoding.has(image)) {decoding.add(image); image.decode().then(() => decoded.add(image), error => state.errors.push('Image decode: ' + error));}
      return null;
    }
    const rect = dialog.getBoundingClientRect();
    return {rect: [rect.x, rect.y, rect.width, rect.height], activeKey: element.activeKey, focusTag: active()?.localName, imageDecoded: true, imageSourceMatches: true, carouselIndex: carousel.index, slides: slides.length, nextEnabled: true, pickerUsable: true, usableControls: true};
  }
  function comboReady(element, {activeRequested = false} = {}) {
    const shadow = element.shadowRoot, input = shadow?.querySelector('#control'), popup = shadow?.querySelector('[part~=popup]'), list = shadow?.querySelector('#listbox');
    if (!input || shadow.activeElement !== input || input.getAttribute('aria-expanded') !== 'true' || !visible(popup) || !visible(list) || popup.inert || pending(element)) return null;
    if (!popup.hasAttribute('data-fallback') && !popup.matches(':popover-open')) return null;
    const rows = [...list.querySelectorAll(':scope > [role=option]')]; if (rows.length !== 40) return null;
    const activeId = input.getAttribute('aria-activedescendant');
    const row = activeId ? shadow.getElementById(activeId) : rows.find(option => option.getAttribute('aria-disabled') !== 'true');
    if (activeRequested && !activeId || !row || row.getAttribute('role') !== 'option' || row.getAttribute('aria-disabled') === 'true' || row.dataset.value !== 'project-01' || !visible(row)) return null;
    if (element.value !== 'project-01' || input.value !== 'Studio North · Autumn campaign' || input !== state.initialInput?.deref() && element === host()) return null;
    const p = popup.getBoundingClientRect(), r = row.getBoundingClientRect(), i = input.getBoundingClientRect(), l = list.getBoundingClientRect();
    const viewport = visualViewport, left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0, right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    const x = (Math.max(r.left, l.left, left) + Math.min(r.right, l.right, right)) / 2, y = (Math.max(r.top, l.top, top) + Math.min(r.bottom, l.bottom, bottom)) / 2;
    if (Math.min(r.right, l.right, right) <= Math.max(r.left, l.left, left) || Math.min(r.bottom, l.bottom, bottom) <= Math.max(r.top, l.top, top)) return null;
    if (p.left < left - 2 || p.right > right + 2 || p.top < top - 2 || p.bottom > bottom + 2 || !(p.top >= i.bottom - 2 || p.bottom <= i.top + 2) || r.bottom <= l.top || r.top >= l.bottom) return null;
    const hit = shadow.elementFromPoint(x, y); if (!hit || !row.contains(hit)) return null;
    return {rect: [p.x, p.y, p.width, p.height], activeId: activeId || null, activeRequested, activeValue: row.dataset.value ?? null, rows: rows.length, inputFocused: true, positionUsable: true};
  }
  const readyFor = (element, options) => family === 'media' ? mediaReady(element) : comboReady(element, options);
  const sameRect = (a, b) => a && b && a.every((value, index) => Math.abs(value - b[index]) <= .5);
  function generatedNodes(element) {
    const nodes = [], container = element.shadowRoot.querySelector(family === 'media' ? '[part~=body]' : '#listbox');
    const visit = node => {nodes.push(node); if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);};
    for (const node of container?.childNodes ?? []) visit(node);
    return nodes;
  }
  function start(event) {
    const pendingAction = state.pendingAction; if (!pendingAction || pendingAction.started !== null) return;
    const element = host(), path = event.composedPath();
    const matched = family === 'media' ? event.type === 'click' && path.includes(document.querySelector('#media .preview-image')) : pendingAction.input === 'keyboard' ? event.type === 'keydown' && event.key === 'ArrowDown' && path.includes(element.shadowRoot.querySelector('#control')) : event.type === 'click' && path.includes(element.shadowRoot.querySelector('[part~=trigger]'));
    if (!matched) return;
    pendingAction.started = performance.now(); pendingAction.trusted = event.isTrusted;
    let previous;
    const watch = () => {
      if (state.pendingAction !== pendingAction) return;
      const ready = readyFor(element, {activeRequested: pendingAction.input === 'keyboard'});
      if (ready && sameRect(previous, ready.rect)) {
        const readyAt = performance.now();
        const nodes = generatedNodes(element), recreated = state.retainedNodes ? nodes.filter((node, index) => node !== state.retainedNodes[index]).length + Math.max(0, state.retainedNodes.length - nodes.length) : 0;
        state.retainedNodes ??= nodes;
        state.pendingAction = null; clearTimeout(pendingAction.timeout);
        pendingAction.resolve({started: pendingAction.started, readyAt, readyMs: readyAt - pendingAction.started, trusted: pendingAction.trusted, endpoint: ready, recreatedNodes: recreated, snapshot: snapshot(element)});
        return;
      }
      previous = ready?.rect; requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }
  document.addEventListener('click', start, {capture: true}); document.addEventListener('keydown', start, {capture: true});
  function arm(input) {
    if (state.pendingAction) throw new Error('An action is already pending');
    state.action = new Promise((resolve, reject) => {
      const pendingAction = state.pendingAction = {input, started: null, resolve, reject};
      pendingAction.timeout = setTimeout(() => {if (state.pendingAction === pendingAction) state.pendingAction = null; reject(new Error('Full usable endpoint timed out'));}, 20000);
    });
    state.action.catch(() => {});
  }
  async function waitReady(element, options = {}) {
    const began = performance.now(); let previous;
    while (performance.now() - began < 20000) {const ready = readyFor(element, options); if (ready && sameRect(previous, ready.rect)) return ready; previous = ready?.rect; await new Promise(resolve => requestAnimationFrame(resolve));}
    throw new Error('Lifecycle endpoint timed out');
  }
  async function settle(element) {for (let pass = 0; pass < 3; pass++) {const promises = []; const visit = node => {if (node.nodeType === 1 && node.hasAttribute('defer-hydration')) return; if (node.updateComplete) promises.push(node.updateComplete); if (node.shadowRoot) visit(node.shadowRoot); for (const child of node.childNodes) visit(child);}; visit(element); await Promise.all(promises); await new Promise(resolve => requestAnimationFrame(resolve));}}
  async function close(element = host()) {
    if (family === 'media') element.hide();
    else {const input = element.shadowRoot.querySelector('#control'); input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, composed: true, cancelable: true}));}
    await settle(element);
    if (family === 'media' ? element.open || element.shadowRoot.querySelector('dialog').open : element.shadowRoot.querySelector('#control').getAttribute('aria-expanded') !== 'false') throw new Error('Lifecycle close failed');
  }
  async function lifecycleCycle(kind) {
    const original = host(); let element = original;
    if (kind === 'disposed') {
      element = document.createElement(original.localName);
      for (const attribute of original.attributes) if (attribute.name !== 'id') element.setAttribute(attribute.name, attribute.value);
      element.contentRendering = original.contentRendering ?? 'eager'; element.items = original.items;
      if (family === 'media') element.activeKey = original.items[0].key;
      else {element.value = 'project-01'; element.label = 'Project'; element.name = 'project'; element.required = true;}
      original.parentNode.append(element); await settle(element);
      if (family === 'combobox') element.scrollIntoView({block: 'center'});
    }
    try {
      if (family === 'media') {const outcome = element.show(); if (!['committed', 'unchanged'].includes(outcome)) throw new Error('Lifecycle opening rejected');}
      else {element.shadowRoot.querySelector('#control').focus(); element.shadowRoot.querySelector('[part~=trigger]').click();}
      await waitReady(element); await close(element);
    } finally {if (kind === 'disposed') {element.remove(); element = null;}}
  }
  window.__enFamilyProbe = {state, snapshot, arm, get action() {return state.action;}, close, lifecycleCycle, isClosed() {const element = host(); return family === 'media' ? !element.open && !element.shadowRoot.querySelector('dialog').open : element.shadowRoot.querySelector('#control').getAttribute('aria-expanded') === 'false';}};
  const boot = () => {
    const element = host(), shadow = element?.shadowRoot;
    const owner = document.querySelector('en-workflows-app');
    const common = element?.hasUpdated && !element.isUpdatePending && shadow && document.readyState !== 'loading' && document.fonts?.status === 'loaded' && !owner?.hasAttribute('data-ssr') && !pending(element);
    const workload = family === 'media' ? element?.items?.length === 2 && element.activeKey === 'dawn' && !element.open && shadow?.querySelector('dialog')?.open === false && document.documentElement.dataset.enTheme === 'patterns' && document.querySelectorAll('#media .preview-image').length === 2 : element?.items?.length === 40 && element.value === 'project-01' && shadow?.querySelector('#control')?.getAttribute('aria-expanded') === 'false';
    const carousel = family === 'media' ? shadow?.querySelector('en-carousel') : null;
    const mediaSettled = family !== 'media' || ((!carousel || carousel.shadowRoot?.querySelector('[part~=viewport][data-controls-ready]')) && [...document.querySelectorAll('#media .preview-image img'), ...(shadow?.querySelectorAll('figure img') ?? [])].every(image => image.complete && image.naturalWidth > 0));
    if (!common || !workload || !mediaSettled) {requestAnimationFrame(boot); return;}
    state.initialInput = shadow.querySelector('#control') ? new WeakRef(shadow.querySelector('#control')) : null; state.ready = true; state.startupReadyMs = performance.now(); state.startup = snapshot(element);
  };
  requestAnimationFrame(boot);
}
