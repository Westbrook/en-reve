/** JSON-compatible data detached from an editor's live model. */
export type ChatEditorData = null | boolean | number | string | readonly ChatEditorData[] | { readonly [key: string]: ChatEditorData };

export interface ChatEditorSnapshot {
  readonly value: string;
  /** Optional application-defined, versioned structured document. */
  readonly content?: ChatEditorData;
}

/** Explicit opt-in for a custom editor slotted into en-chat-composer. */
export interface ChatEditorAdapter {
  readonly value: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly composing?: boolean;
  focus(options?: FocusOptions): void;
  reportValidity?(): boolean;
  /** Synchronous capture; must not select suggestions or mutate the draft. */
  getSnapshot(): ChatEditorSnapshot;
}

const adapters = new WeakMap<Element, ChatEditorAdapter>();

/** Register on the actual slotted editor host. Dispose on teardown. Latest registration wins. */
export function registerChatEditor(editor: Element, adapter: ChatEditorAdapter): () => void {
  adapters.set(editor, adapter);
  return () => { if (adapters.get(editor) === adapter) adapters.delete(editor); };
}

/** Resolve only explicitly registered editors. Ordinary value-bearing elements are not editors. */
export function getChatEditorAdapter(editor: Element): ChatEditorAdapter | undefined {
  return adapters.get(editor);
}

/** Copy and deeply freeze structured data; reject live objects, cycles and lossy JSON values. */
export function snapshotChatEditor(snapshot: ChatEditorSnapshot): ChatEditorSnapshot {
  if (typeof snapshot.value !== 'string') throw new TypeError('An editor snapshot requires a string value.');
  return Object.freeze(snapshot.content === undefined ? { value: snapshot.value } : { value: snapshot.value, content: snapshotEditorData(snapshot.content) });
}

/** Detach and deeply freeze JSON-bearing editor action data. Reject cycles, accessors and non-JSON values. */
export function snapshotEditorData(data: ChatEditorData): ChatEditorData {
  const ancestors = new Set<object>();
  const copy = (value: ChatEditorData): ChatEditorData => {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'object' || ancestors.has(value)) throw new TypeError('Editor content must be acyclic JSON-compatible data.');
    ancestors.add(value);
    try {
      if (Array.isArray(value)) return Object.freeze(Array.from(value, item => copy(item)));
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Editor content must contain plain records.');
      const result: Record<string, ChatEditorData> = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== 'string') throw new TypeError('Editor content cannot contain symbol keys.');
        const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
        if (!descriptor.enumerable || !('value' in descriptor)) throw new TypeError('Editor content must contain enumerable data properties.');
        Object.defineProperty(result, key, { value: copy(descriptor.value), enumerable: true });
      }
      return Object.freeze(result);
    } finally { ancestors.delete(value); }
  };
  return copy(data);
}
