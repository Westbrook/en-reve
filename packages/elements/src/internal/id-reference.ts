/** ID references resolve within one tree, including an enclosing closed shadow root. */
export type ReferenceRoot = Document | ShadowRoot;

export function referenceRoot(node: Node): ReferenceRoot | null {
  const root = node.getRootNode();
  return (root.nodeType === 9 || (root.nodeType === 11 && 'host' in root))
    && 'getElementById' in root ? root as ReferenceRoot : null;
}

export type Subscriber = (element: Element | null) => void;
const roots = new WeakMap<ReferenceRoot, RootReferences>();

/** One observer per subscribed tree; mutations use indexed ID lookups, never tree scans. */
class RootReferences {
  readonly subscribers = new Map<string, Set<Subscriber>>();
  readonly resolved = new Map<string, Element | null>();
  readonly observer: MutationObserver | undefined;

  constructor(readonly root: ReferenceRoot) {
    const document = root.nodeType === 9 ? root as Document : root.ownerDocument;
    const Observer = document?.defaultView?.MutationObserver;
    this.observer = Observer ? new Observer(records => {
      const changed = new Set<string>();
      for (const record of records) {
        if (record.type === 'childList') {
          if (![...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1)) continue;
          // Insertion, removal, or reordering may change which duplicate ID wins.
          for (const id of this.subscribers.keys()) changed.add(id);
          break;
        }
        if (record.oldValue) changed.add(record.oldValue);
        const id = (record.target as Element).id;
        if (id) changed.add(id);
      }
      for (const id of changed) this.notify(id);
    }) : undefined;
    this.observer?.observe(root, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['id'], attributeOldValue: true,
    });
  }

  notify(id: string): void {
    const subscribers = this.subscribers.get(id);
    if (!subscribers) return;
    const element = this.root.getElementById(id);
    if (this.resolved.has(id) && this.resolved.get(id) === element) return;
    this.resolved.set(id, element);
    for (const subscriber of [...subscribers]) {
      if (this.subscribers.get(id) === subscribers && subscribers.has(subscriber)) subscriber(element);
    }
  }

  subscribe(id: string, subscriber: Subscriber): () => void {
    let subscribers = this.subscribers.get(id);
    if (!subscribers) this.subscribers.set(id, subscribers = new Set());
    subscribers.add(subscriber);
    const current = this.root.getElementById(id);
    if (!this.resolved.has(id) || this.resolved.get(id) !== current) {
      // Reconcile existing subscribers too if the DOM changed before its observer batch.
      this.resolved.set(id, current);
      for (const candidate of [...subscribers]) {
        if (this.subscribers.get(id) === subscribers && subscribers.has(candidate)) candidate(current);
      }
    } else subscriber(current);
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      subscribers.delete(subscriber);
      if (!subscribers.size && this.subscribers.get(id) === subscribers) {
        this.subscribers.delete(id);
        this.resolved.delete(id);
      }
      if (!this.subscribers.size) {
        this.observer?.disconnect();
        if (roots.get(this.root) === this) roots.delete(this.root);
      }
    };
  }

}

/** Observe one literal ID. Empty IDs and detached fragments remain unresolved. */
export function observeIdReference(root: ReferenceRoot | null, id: string, subscriber: Subscriber): () => void {
  if (!root || !id) {
    subscriber(null);
    return () => {};
  }
  const document = root.nodeType === 9 ? root as Document : root.ownerDocument;
  if (!document?.defaultView?.MutationObserver) {
    subscriber(root.getElementById(id));
    return () => {};
  }
  let references = roots.get(root);
  if (!references) roots.set(root, references = new RootReferences(root));
  return references.subscribe(id, subscriber);
}
