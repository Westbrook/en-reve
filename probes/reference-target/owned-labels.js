/** Isolated component-owned experiment, not a production Reference Target polyfill.
 * The component supplies its own semantic node; no private node getter is public.
 */
export class OwnedLabels {
  constructor(host, control) {
    this.host = host;
    this.control = control;
    this.listeners = new Map();
    this.binding = null;
    this.generation = 0;
    host.addController(this);
  }

  hostConnected() {
    this.connected = true;
    this.generation++;
  }

  hostUpdated() {
    if (!this.connected) return;
    const root = this.host.getRootNode();
    if (this.root !== root) {
      this.observer?.disconnect();
      this.root = root;
      this.observer = new this.host.ownerDocument.defaultView.MutationObserver(() => this.sync());
      // Qualification only. A production controller must share root subscriptions
      // rather than installing one document observer per field.
      this.observer.observe(root, { subtree: true, childList: true, attributes: true,
        attributeFilter: ['for', 'id', 'aria-label', 'aria-labelledby'] });
      this.observer.observe(this.host.shadowRoot, { subtree: true, childList: true,
        attributes: true, attributeFilter: ['aria-label', 'aria-labelledby'] });
    }
    this.sync();
  }

  owns() {
    if (!this.binding) return false;
    const { input, applied } = this.binding;
    // Reflected lists filter references outside the input's shadow-including
    // ancestor roots, including after disconnection. Compare surviving identities.
    const scopes = new Set();
    for (let root = input.getRootNode(); root; root = root.host?.getRootNode()) scopes.add(root);
    const expected = applied.filter(label => scopes.has(label.getRootNode()));
    const actual = Array.from(input.ariaLabelledByElements ?? []);
    return input.getAttribute('aria-labelledby') === '' &&
      actual.length === expected.length && actual.every((label, i) => label === expected[i]);
  }

  release() {
    if (this.owns()) {
      this.binding.input.ariaLabelledByElements = null;
      this.binding.input.removeAttribute('aria-labelledby');
    }
    this.binding = null;
  }

  sync() {
    if (!this.connected || !this.host.isConnected) return;
    const input = this.control();
    const native = this.host.shadowRoot.referenceTarget === 'control';
    // Firefox can retain a retargeted label in ElementInternals.labels. Its
    // label.control has already changed, so reject that stale relationship.
    const external = native ? [] : Array.from(this.host.labels ?? []).filter(label => label.control === this.host);
    for (const [label, listener] of this.listeners) {
      if (!external.includes(label)) {
        label.removeEventListener('click', listener);
        this.listeners.delete(label);
      }
    }
    for (const label of external) {
      if (this.listeners.has(label)) continue;
      const listener = event => {
        const path = event.composedPath();
        // Native label activation excludes interactive descendants. Do not turn
        // links, authored buttons or editable label content into field activators.
        const interactive = path.slice(0, path.indexOf(label)).some(node =>
          node.nodeType === 1 && node.matches('a[href],button,input,select,textarea,summary,[contenteditable]:not([contenteditable="false"])'));
        if (interactive) return;
        // Observe cancellation after ancestor listeners and native FACE activation.
        // Do not synthesize a click/input/change or cancel the browser's action.
        const generation = this.generation;
        // A task boundary, not a microtask: browser-dispatched listener callbacks
        // can run microtask checkpoints before later bubbling listeners cancel.
        this.host.ownerDocument.defaultView.setTimeout(() => {
          const current = this.control();
          if (generation !== this.generation || event.defaultPrevented || !this.connected || !this.host.isConnected ||
              label.control !== this.host || current?.disabled) return;
          current?.focus();
        });
      };
      label.addEventListener('click', listener);
      this.listeners.set(label, listener);
    }
    if (this.binding && (this.binding.input !== input || !this.owns())) this.release();
    if (native || !input || !external.length || input.hasAttribute('aria-label')) {
      this.release();
      return;
    }
    if (!this.binding && input.hasAttribute('aria-labelledby')) return;
    if (!('ariaLabelledByElements' in input)) return;
    const names = [...new Set([...external, ...Array.from(input.labels ?? [])])];
    const current = Array.from(input.ariaLabelledByElements ?? []);
    if (names.length !== current.length || names.some((label, i) => label !== current[i])) {
      input.ariaLabelledByElements = names;
    }
    this.binding = { input, applied: names };
  }

  hostDisconnected() {
    this.connected = false;
    this.generation++;
    this.observer?.disconnect();
    this.root = null;
    for (const [label, listener] of this.listeners) label.removeEventListener('click', listener);
    this.listeners.clear();
    this.release();
  }
}
