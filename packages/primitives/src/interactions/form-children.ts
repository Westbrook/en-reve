import { isCollectionKey } from '../state/collection.js';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { isSelectionLabelInteractive } from './selection-children.js';

export const FORM_CHILDREN_ATTRIBUTE = 'data-en-form-children';
export const FORM_SLOT_PREFIX = 'en-form-child-';
export type FormChildKind = 'steps' | 'errors';
export interface FormChild {
  readonly key: string;
  readonly value: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly hidden: boolean;
  readonly status: 'pending' | 'complete' | 'error';
  readonly target: string;
}
export interface FormChildrenPlan {
  readonly version: 1;
  readonly kind: FormChildKind;
  readonly value: string;
  readonly items: readonly FormChild[];
}
export interface FormChildSource {
  readonly key: string;
  readonly tagName: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string;
  readonly interactive?: boolean;
}
export interface FormChildrenView {
  readonly active: boolean;
  readonly items: readonly FormChild[];
  readonly error: string;
}
const tags = { steps: 'en-progress-step', errors: 'a' } as const;
const whitespace = (value: string): string => value.replace(/[\t\n\f\r ]+/g, ' ').trim();
export function isGeneratedFormSlot(value: string): boolean { return /^en-form-child-(?:ssr|client)-(?:0|[1-9]\d*)$/.test(value); }
export function isFormLabelInteractive(tag: string, attributes: Readonly<Record<string, string>>): boolean {
  return isSelectionLabelInteractive(tag, attributes);
}
/** Browser and buffered SSR use the same direct-child contract. */
export function normalizeFormChildren(kind: FormChildKind, sources: readonly FormChildSource[]): readonly FormChild[] {
  const values = new Set<string>(); const keys = new Set<string>();
  return Object.freeze(sources.map(source => {
    const attrs = source.attributes;
    const has = (name: string): boolean => Object.prototype.hasOwnProperty.call(attrs, name);
    if (source.tagName !== tags[kind] || !source.key || keys.has(source.key)) throw new TypeError('Invalid form child identity.');
    keys.add(source.key);
    if (has('slot') && !isGeneratedFormSlot(attrs.slot)) throw new TypeError('Form child slot attributes are reserved for internal projection.');
    if (source.interactive || (kind === 'steps' && isFormLabelInteractive(source.tagName, attrs))) throw new TypeError('Form child labels must contain noninteractive content only.');
    if (has('inert') || attrs['aria-hidden'] === 'true' || attrs.hidden === 'until-found') throw new TypeError('Use hidden to exclude a form child; inert, aria-hidden and hidden=until-found are unsupported.');
    const value = kind === 'steps' ? attrs.value : source.key;
    validateProgressStep(value, attrs.status ?? 'pending', values);
    let target = '';
    if (kind === 'errors') {
      if (!attrs.href?.startsWith('#') || attrs.href.length < 2) throw new TypeError('Validation links require a same-document #field-id href.');
      try { target = decodeURIComponent(attrs.href.slice(1)); } catch { throw new TypeError('Validation link fragment must be URI encoded correctly.'); }
    }
    const status = attrs.status ?? 'pending';

    return Object.freeze({ key: source.key, value, label: whitespace(attrs.label ?? '') || whitespace(source.text), disabled: has('disabled'), hidden: has('hidden'), status: status as FormChild['status'], target });
  }));
}

/** Shared data/descriptor validity; identities are opaque and never trimmed. */
function validateProgressStep(value: unknown, status: unknown, seen: Set<string>): void {
  if (!isCollectionKey(value) || seen.has(value)) throw new TypeError('Progress steps require unique nonblank string values.');
  if (!['pending', 'complete', 'error'].includes(status as string)) throw new TypeError('Step status must be pending, complete or error.');
  seen.add(value);
}
export function normalizeProgressItems<T extends { readonly value: string; readonly status?: 'pending' | 'complete' | 'error' }>(items: readonly T[]): readonly T[] {
  if (!Array.isArray(items)) throw new TypeError('Progress items must be an array.');
  const seen = new Set<string>();
  return Object.freeze(items.map(item => {
    validateProgressStep(item?.value, item?.status ?? 'pending', seen);
    return Object.freeze({ ...item });
  }));
}

type Host = HTMLElement & ReactiveControllerHost;
const controllers = new WeakMap<object, FormChildrenController>();
// Ownership belongs to the node, not its copied slot string. A previous parent
// must not erase an assignment already claimed by the receiving parent.
const projectionOwners = new WeakMap<Element, FormChildrenController>();

/** Internal SSR preparation seam. Consumers never author plans or slot assignments. */
export function prepareFormChildren(host: object, plan: FormChildrenPlan): void {
  const controller = controllers.get(host);
  if (!controller) throw new TypeError('The element has no form child controller.');
  controller.prepare(plan);
}

/** Parent-owned choices; original rich label nodes are projected, never moved or cloned. */
export class FormChildrenController implements ReactiveController {
  readonly #host: Host;
  readonly #kind: FormChildKind;
  readonly #keys = new WeakMap<Element, string>();
  readonly #ownedSlots = new Map<Element, string>();
  #sequence = 0;
  #observer?: MutationObserver;
  #view: FormChildrenView = { active: false, items: [], error: '' };
  #initialSnapshot = false;
  #serverPrepared = false;
  #initialValue?: string;

  constructor(host: Host, kind: FormChildKind) {
    this.#host = host;
    this.#kind = kind;
    if (controllers.has(host)) throw new TypeError('Only one form child controller can own a host.');
    controllers.set(host, this);
    host.addController(this);
  }
  get view(): FormChildrenView { return this.#view; }
  get initialValue(): string | undefined { return this.#initialValue; }

  prepare(plan: FormChildrenPlan): void {
    if (plan.version !== 1 || plan.kind !== this.#kind || typeof plan.value !== 'string' || !Array.isArray(plan.items)) throw new TypeError('Invalid form child SSR snapshot.');
    const keys = new Set<string>();
    const values = new Set<string>();
    for (const item of plan.items) {
      if (!item || typeof item.key !== 'string' || !item.key || keys.has(item.key)
        || !isCollectionKey(item.value) || values.has(item.value)
        || typeof item.label !== 'string' || typeof item.disabled !== 'boolean' || typeof item.hidden !== 'boolean'
        || typeof item.target !== 'string' || !['pending', 'complete', 'error'].includes(item.status)) throw new TypeError('Invalid form child SSR record.');
      keys.add(item.key); values.add(item.value);
    }
    this.#view = { active: plan.items.length > 0, items: plan.items.map(item => Object.freeze({ ...item })), error: '' };
    this.#initialSnapshot = true;
    this.#serverPrepared = true;
    this.#initialValue = plan.value;
    this.#host.requestUpdate();
  }

  hostConnected(): void {
    const serialized = this.#host.getAttribute(FORM_CHILDREN_ATTRIBUTE);
    if (serialized !== null && !this.#initialSnapshot) {
      this.prepare(JSON.parse(serialized) as FormChildrenPlan);
      this.#serverPrepared = false;
      const children = this.#children();
      this.#view.items.forEach(item => {
        const child = children.find(node => node.getAttribute('slot') === `${FORM_SLOT_PREFIX}${item.key}`);
        if (!child) return;
        this.#keys.set(child, item.key);
        const slot = child.getAttribute('slot');
        if (slot === `${FORM_SLOT_PREFIX}${item.key}`) this.#claimSlot(child, slot);
      });
    }
    if (!this.#initialSnapshot) this.refresh();
    const Observer = this.#host.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      this.#observer ??= new Observer(() => this.refresh());
      this.#observer.observe(this.#host, { subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ['value', 'label', 'status', 'disabled', 'hidden', 'selected', 'checked', 'slot', 'tabindex', 'contenteditable', 'href', 'controls', 'inert', 'aria-hidden'] });
    }
  }
  hostUpdated(): void {
    if (this.#initialSnapshot) {
      this.#initialSnapshot = false;
      this.#host.removeAttribute(FORM_CHILDREN_ATTRIBUTE);
    }
    this.refresh();
  }
  hostDisconnected(): void {
    this.#observer?.disconnect();
    for (const [child, slot] of this.#ownedSlots) this.#releaseSlot(child, slot);
  }

  #claimSlot(child: Element, slot: string): void {
    projectionOwners.set(child, this);
    this.#ownedSlots.set(child, slot);
    if (child.getAttribute('slot') !== slot) child.setAttribute('slot', slot);
  }

  #releaseSlot(child: Element, slot: string): void {
    if (projectionOwners.get(child) === this) {
      if (child.getAttribute('slot') === slot) child.removeAttribute('slot');
      projectionOwners.delete(child);
    }
    this.#ownedSlots.delete(child);
  }

  #children(): Element[] { return [...(this.#host.children ?? [])].filter(child => child.localName === tags[this.#kind]); }

  /** Fresh synchronous catalog for transaction guards, without changing the hydration template. */
  current(): FormChildrenView {
    if (this.#serverPrepared) return this.#view;
    const children = this.#children();
    if (!children.length) return { active: false, items: [], error: '' };
    try {
      const sources = children.map(child => {
        let key = this.#keys.get(child);
        if (!key) { key = `client-${++this.#sequence}`; this.#keys.set(child, key); }
        const attributes = Object.fromEntries([...child.attributes].map(attr => [attr.name, attr.value]));
        const owned = this.#ownedSlots.get(child);
        if (owned !== undefined && projectionOwners.get(child) === this) {
          if (attributes.slot !== owned) throw new TypeError('Do not replace or remove an internally owned form child slot.');
          delete attributes.slot;
        }
        // New/pasted or transferred nodes may carry a generated slot. Shared
        // normalization accepts only that finite syntax; the local key above
        // supplies identity, and refresh replaces the stale assignment.
        const interactive = [...child.querySelectorAll('*')].some(node =>
          isFormLabelInteractive(node.localName, Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]))));
        return { key, tagName: child.localName, attributes, text: child.textContent ?? '', interactive };
      });
      return { active: true, items: normalizeFormChildren(this.#kind, sources), error: '' };
    } catch (error) {
      return { active: true, items: [], error: error instanceof Error ? error.message : String(error) };
    }
  }

  refresh(): void {
    if (this.#initialSnapshot) return;
    const next = this.current();
    const children = this.#children();
    for (const [child, slot] of this.#ownedSlots) if (!children.includes(child)) {
      this.#releaseSlot(child, slot);
    }
    if (!next.error) children.forEach((child, index) => {
      const slot = `${FORM_SLOT_PREFIX}${next.items[index].key}`;
      this.#claimSlot(child, slot);
    });
    if (JSON.stringify(next) !== JSON.stringify(this.#view)) {
      this.#view = next;
      this.#host.requestUpdate();
    }
  }
}
