/** A scoped enhancement for native same-document fragment links. */
export interface AnchorNavigationOptions {
  /** Contains the navigation and its light-DOM fragment targets. */
  root: HTMLElement;
  /** The actual navigation whose border-box height offsets fragment targets. */
  navigation: HTMLElement;
}

export interface AnchorNavigation {
  /** Follow the current fragment after initial rendering, unless the user took over. */
  followInitialAnchor(): void;
  /** Remeasure and maintain an active fragment; does not restart interrupted following. */
  refresh(): void;
  /** Release listeners, observation, scheduled work and still-owned inline properties. */
  disconnect(): void;
}

/**
 * Preserve native URLs, history, focus and activation. CSS owns scroll-margin and
 * offsets. No document globals are read at import; an SSR document without a
 * browsing context returns an inert attachment. Attach anew after disconnect or
 * replacing the navigation element.
 */
export function attachAnchorNavigation({ root, navigation }: AnchorNavigationOptions): AnchorNavigation {
  const document = root.ownerDocument;
  const view = document?.defaultView;
  if (!view) return { followInitialAnchor() {}, refresh() {}, disconnect() {} };
  if (navigation.ownerDocument !== document || !root.contains(navigation)) {
    throw new TypeError('Anchor navigation must belong to its supplied root.');
  }

  const abort = new view.AbortController();
  const signal = abort.signal;
  const heightProperty = '--en-navigation-height';
  const positionProperty = '--en-navigation-position';
  const properties = [heightProperty, positionProperty].map((name) => ({
    name,
    value: root.style.getPropertyValue(name),
    priority: root.style.getPropertyPriority(name),
    written: undefined as string | undefined,
  }));
  let disconnected = false;
  let initialAllowed = true;
  let generation = 0;
  let active: { href: string; target: HTMLElement } | undefined;
  let pending: { href: string; target: HTMLElement; event: MouseEvent; generation: number } | undefined;
  const blockedHrefs = new Set<string>();
  let measureFrame = 0;
  let activationFrame = 0;
  let alignmentFrame = 0;
  let forceAlignment = false;
  let lastHeight: string | undefined;

  const connected = () => !disconnected && root.isConnected && navigation.isConnected;
  const currentURL = () => new URL(view.location.href);
  const targetFor = (url: URL): HTMLElement | undefined => {
    if (!url.hash) return;
    let id: string;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    return target instanceof view.HTMLElement && root.contains(target) ? target : undefined;
  };
  const cancelAlignment = () => {
    view.cancelAnimationFrame(alignmentFrame);
    alignmentFrame = 0;
  };
  const clearActive = () => {
    active = undefined;
    cancelAlignment();
  };
  const writeProperty = (index: number, value: string) => {
    const property = properties[index]!;
    if (property.written === value) return;
    property.written = value;
    if (root.style.getPropertyValue(property.name) !== value || root.style.getPropertyPriority(property.name)) {
      // Explicitly clear an existing priority before taking temporary ownership.
      // The original value and priority remain in the restoration snapshot.
      if (root.style.getPropertyPriority(property.name)) root.style.removeProperty(property.name);
      root.style.setProperty(property.name, value);
    }
  };
  const align = () => {
    cancelAlignment();
    if (!active || !connected()) return;
    const expected = active;
    const expectedGeneration = generation;
    // Native activation and layout settle before correction. The second callback
    // must also check cancellation: input can arrive between either frame.
    alignmentFrame = view.requestAnimationFrame(() => {
      alignmentFrame = view.requestAnimationFrame(() => {
        alignmentFrame = 0;
        if (!connected() || generation !== expectedGeneration || active !== expected) return;
        const url = currentURL();
        if (url.href !== expected.href || targetFor(url) !== expected.target) {
          clearActive();
          return;
        }
        expected.target.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    });
  };
  const measure = (alignUnchanged = false) => {
    forceAlignment ||= alignUnchanged;
    if (disconnected || measureFrame) return;
    measureFrame = view.requestAnimationFrame(() => {
      measureFrame = 0;
      const requestedAlignment = forceAlignment;
      forceAlignment = false;
      if (!connected()) return;
      const height = navigation.getBoundingClientRect().height;
      if (!Number.isFinite(height)) return;
      const value = `${Math.max(0, height)}px`;
      const changed = value !== lastHeight;
      lastHeight = value;
      writeProperty(0, value);
      // Static navigation is usable before measurement/JS; enabling sticky does
      // not remove it from normal flow or require estimating wrapped height.
      writeProperty(1, 'sticky');
      if (changed || requestedAlignment) align();
    });
  };
  const activate = (url: URL) => {
    clearActive();
    const target = targetFor(url);
    if (!target || !connected()) return;
    active = { href: url.href, target };
    measure(true);
  };
  const interrupt = () => {
    if (disconnected) return;
    initialAllowed = false;
    generation++;
    // A hashchange may already be queued, or a click's native default may not
    // have run yet. Neither may restart following after this user input.
    if (pending) blockedHrefs.add(pending.href);
    blockedHrefs.add(view.location.href);
    pending = undefined;
    view.cancelAnimationFrame(activationFrame);
    activationFrame = 0;
    clearActive();
  };
  const linkFor = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const path = event.composedPath();
    const rootIndex = path.indexOf(root);
    const linkIndex = path.findIndex((node) => node instanceof view.HTMLAnchorElement);
    // Native anchors inside an open shadow root precede their host and the
    // consuming root. Do not accept an enclosing anchor outside that root.
    if (linkIndex < 0 || rootIndex < 0 || linkIndex >= rootIndex) return;
    const link = path[linkIndex] as HTMLAnchorElement;
    if (!link.hasAttribute('href') || link.hasAttribute('download')) return;
    const target = link.getAttribute('target') ?? document.querySelector('base[target]')?.getAttribute('target') ?? '';
    if (target && target.toLowerCase() !== '_self') return;
    const url = new URL(link.href, document.baseURI);
    const current = currentURL();
    if (url.origin !== current.origin || url.pathname !== current.pathname || url.search !== current.search) return;
    const destination = targetFor(url);
    return destination ? { href: url.href, target: destination } : undefined;
  };

  root.addEventListener('click', (event) => {
    const destination = linkFor(event);
    if (!destination || !connected()) return;
    clearActive();
    initialAllowed = false;
    const activation = { ...destination, event, generation: ++generation };
    pending = activation;
    blockedHrefs.clear();
    view.cancelAnimationFrame(activationFrame);
    // A microtask can precede ancestor listeners. Check cancellation and the
    // actual native URL in a frame after event propagation and default action.
    activationFrame = view.requestAnimationFrame(() => {
      activationFrame = 0;
      if (pending !== activation || generation !== activation.generation || !connected()) return;
      pending = undefined;
      if (event.defaultPrevented || currentURL().href !== activation.href) return;
      activate(currentURL());
    });
  }, { signal });
  view.addEventListener('hashchange', () => {
    const url = currentURL();
    if (!targetFor(url)) { clearActive(); return; }
    if (blockedHrefs.has(url.href)) return;
    blockedHrefs.clear();
    if (pending?.href === url.href && (pending.event.defaultPrevented || pending.generation !== generation)) return;
    initialAllowed = false;
    activate(url);
  }, { signal });
  view.addEventListener('resize', () => measure(true), { signal });
  for (const event of ['pointerdown', 'touchstart', 'wheel'] as const) {
    view.addEventListener(event, interrupt, { signal, passive: true });
  }
  view.addEventListener('keydown', (event) => {
    // Enter activation subsequently rearms through its ordinary click/hashchange.
    // Tab and editing keys release following even when focus stays in the target.
    if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'].includes(event.key)) interrupt();
  }, { signal });
  view.addEventListener('focusin', (event) => {
    const path = event.composedPath();
    const within = (target: HTMLElement) => path.some((node) => node instanceof view.Node && target.contains(node));
    if (pending && within(pending.target)) return;
    const currentTarget = targetFor(currentURL());
    if (currentTarget && active?.href !== view.location.href && within(currentTarget)) return;
    if (active && !within(active.target)) interrupt();
  }, { signal });
  const observer = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => measure()) : undefined;
  observer?.observe(navigation);
  measure();

  return {
    followInitialAnchor() {
      if (disconnected) return;
      const url = currentURL();
      if (!targetFor(url)) { clearActive(); return; }
      if (initialAllowed) activate(url);
      else if (active?.href === url.href) measure(true);
    },
    refresh() {
      if (disconnected) return;
      const url = currentURL();
      if (active && (active.href !== url.href || targetFor(url) !== active.target)) clearActive();
      measure(Boolean(active));
    },
    disconnect() {
      if (disconnected) return;
      disconnected = true;
      abort.abort();
      observer?.disconnect();
      clearActive();
      pending = undefined;
      view.cancelAnimationFrame(activationFrame);
      view.cancelAnimationFrame(measureFrame);
      for (const property of properties) {
        if (property.written === undefined || root.style.getPropertyValue(property.name) !== property.written || root.style.getPropertyPriority(property.name)) continue;
        if (property.value) root.style.setProperty(property.name, property.value, property.priority);
        else root.style.removeProperty(property.name);
      }
    },
  };
}
