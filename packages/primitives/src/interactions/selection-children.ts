import type { ReactiveController, ReactiveControllerHost } from 'lit';

export const SELECTION_CHILDREN_ATTRIBUTE = 'data-en-selection-children';
export const SELECTION_SLOT_PREFIX = 'en-selection-';
export type SelectionChildKind = 'select' | 'segmented' | 'choice' | 'checkbox';
export interface SelectionChild {
  readonly key: string;
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled: boolean;
  readonly hidden: boolean;
}
export interface SelectionChildrenPlan {
  readonly version: 1;
  readonly kind: SelectionChildKind;
  readonly value: string;
  readonly items: readonly SelectionChild[];
}
export interface SelectionChildSource {
  readonly key: string;
  readonly tagName: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string;
  readonly descriptionAssigned?: boolean;
  readonly interactive?: boolean;
  readonly description?: string;
}
export interface SelectionChildrenView {
  readonly active: boolean;
  readonly items: readonly SelectionChild[];
  readonly error: string;
}

const tags = { select: 'en-select-option', segmented: 'en-segmented-item', choice: 'en-choice-option', checkbox: 'en-choice-option' } as const;
const whitespace = (value: string): string => value.replace(/[\t\n\f\r ]+/g, ' ').replace(/^ | $/g, '');

/** Generated projection names are disposable metadata, not authored identity. */
export function isGeneratedSelectionSlot(value: string): boolean {
  return /^en-selection-(?:ssr|client)-(?:0|[1-9]\d*)$/.test(value);
}

/** Shared browser/SSR descriptor normalization. No HTML or CSS is executed. */
export function normalizeSelectionChildren(kind: SelectionChildKind, sources: readonly SelectionChildSource[]): readonly SelectionChild[] {
  const projected = kind === 'segmented' || kind === 'checkbox';
  const values = new Set<string>();
  const keys = new Set<string>();
  return Object.freeze(sources.map(source => {
    const attrs = source.attributes;
    const has = (name: string): boolean => Object.prototype.hasOwnProperty.call(attrs, name);
    if (source.tagName !== tags[kind]) throw new TypeError(`Expected direct ${tags[kind]} children.`);
    if (!source.key || keys.has(source.key)) throw new TypeError('Repeated or missing selection child key.');
    keys.add(source.key);
    if (!has('value') || (projected && attrs.value === '')) throw new TypeError(`${tags[kind]} requires an explicit ${projected ? 'nonempty ' : ''}value.`);
    if (values.has(attrs.value)) throw new TypeError('Selection child values must be unique.');
    values.add(attrs.value);
    if (has('selected') || has('checked')) throw new TypeError('Selection children do not own selected or checked state; set the parent value instead.');
    if (has('slot') && !(projected && isGeneratedSelectionSlot(attrs.slot))) throw new TypeError('Selection child slot attributes are reserved for internal label projection.');
    if (attrs.hidden?.toLowerCase() === 'until-found') throw new TypeError('Selection children do not support hidden=until-found.');
    if (projected && (source.interactive || isSelectionLabelInteractive(source.tagName, attrs))) throw new TypeError('Projected choice labels must contain noninteractive content only.');
    if (projected && (has('inert') || attrs['aria-hidden']?.toLowerCase() === 'true')) throw new TypeError('Projected choice roots must not be inert or aria-hidden; use hidden to make a choice unavailable.');
    return Object.freeze({
      key: source.key, value: attrs.value,
      label: kind !== 'segmented' ? whitespace(source.text) || whitespace(attrs.label ?? '') : '',
      ...(kind === 'checkbox' ? {description: source.descriptionAssigned ? whitespace(source.description ?? '') : whitespace(source.description ?? '') || whitespace(attrs.description ?? '')} : {}),
      disabled: has('disabled'), hidden: has('hidden'),
    });
  }));
}

/** Detect native interactive label content without looking into another component's shadow. */
export function isSelectionLabelInteractive(tag: string, attributes: Readonly<Record<string, string>>): boolean {
  const has = (name: string): boolean => Object.prototype.hasOwnProperty.call(attributes, name);
  return ['button', 'input', 'select', 'textarea', 'summary', 'iframe', 'embed', 'object', 'en-button', 'en-checkbox', 'en-switch', 'en-select', 'en-text-field', 'en-toggle-button'].includes(tag)
    || ['button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox', 'slider', 'spinbutton'].includes(attributes.role ?? '')
    || ((tag === 'a' || tag === 'area') && has('href'))
    || ((tag === 'audio' || tag === 'video') && has('controls'))
    || has('tabindex') || (has('contenteditable') && attributes.contenteditable !== 'false');
}

type Host = HTMLElement & ReactiveControllerHost;
const controllers = new WeakMap<object, SelectionChildrenController>();
// Ownership belongs to the node, not its copied slot string. A previous parent
// must not erase an assignment already claimed by the receiving parent.
const projectionOwners = new WeakMap<Element, SelectionChildrenController>();

/** Internal SSR preparation seam. Consumers never author plans or slot assignments. */
export function prepareSelectionChildren(host: object, plan: SelectionChildrenPlan): void {
  const controller = controllers.get(host);
  if (!controller) throw new TypeError('The element has no selection child controller.');
  controller.prepare(plan);
}

/** Parent-owned choices; original rich label nodes are projected, never moved or cloned. */
export class SelectionChildrenController implements ReactiveController {
  readonly #host: Host;
  readonly #kind: SelectionChildKind;
  get projectsContent(): boolean { return this.#kind === 'segmented' || this.#kind === 'checkbox'; }
  readonly #keys = new WeakMap<Element, string>();
  readonly #ownedSlots = new Map<Element, string>();
  #sequence = 0;
  #observer?: MutationObserver;
  #view: SelectionChildrenView = { active: false, items: [], error: '' };
  #initialSnapshot = false;
  #serverPrepared = false;
  #initialValue?: string;

  constructor(host: Host, kind: SelectionChildKind) {
    this.#host = host;
    this.#kind = kind;
    if (controllers.has(host)) throw new TypeError('Only one selection child controller can own a host.');
    controllers.set(host, this);
    host.addController(this);
  }
  get view(): SelectionChildrenView { return this.#view; }
  get initialValue(): string | undefined { return this.#initialValue; }

  prepare(plan: SelectionChildrenPlan): void {
    if (plan.version !== 1 || plan.kind !== this.#kind || typeof plan.value !== 'string' || !Array.isArray(plan.items)) throw new TypeError('Invalid selection child SSR snapshot.');
    const keys = new Set<string>();
    const values = new Set<string>();
    for (const item of plan.items) {
      if (!item || typeof item.key !== 'string' || !item.key || keys.has(item.key)
        || typeof item.value !== 'string' || values.has(item.value) || (this.projectsContent && !item.value)
        || typeof item.label !== 'string' || (item.description !== undefined && typeof item.description !== 'string') || typeof item.disabled !== 'boolean' || typeof item.hidden !== 'boolean') throw new TypeError('Invalid selection child SSR record.');
      keys.add(item.key); values.add(item.value);
    }
    this.#view = { active: plan.items.length > 0, items: plan.items.map(item => Object.freeze({ ...item })), error: '' };
    this.#initialSnapshot = true;
    this.#serverPrepared = true;
    this.#initialValue = plan.value;
    this.#host.requestUpdate();
  }

  hostConnected(): void {
    const serialized = this.#host.getAttribute(SELECTION_CHILDREN_ATTRIBUTE);
    if (serialized !== null && !this.#initialSnapshot) {
      this.prepare(JSON.parse(serialized) as SelectionChildrenPlan);
      this.#serverPrepared = false;
      const children = this.#children();
      this.#view.items.forEach(item => {
        const child = children.find(node => this.projectsContent
          ? node.getAttribute('slot') === `${SELECTION_SLOT_PREFIX}${item.key}` && node.getAttribute('value') === item.value
          : node.getAttribute('value') === item.value);
        if (!child) return;
        this.#keys.set(child, item.key);
        const slot = child.getAttribute('slot');
        if (this.projectsContent && slot === `${SELECTION_SLOT_PREFIX}${item.key}`) this.#claimSlot(child, slot);
      });
    }
    if (!this.#initialSnapshot) this.refresh();
    const Observer = this.#host.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      this.#observer ??= new Observer(() => this.refresh());
      this.#observer.observe(this.#host, { subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ['value', 'label', 'description', 'role', 'alt', 'aria-label', 'disabled', 'hidden', 'selected', 'checked', 'slot', 'tabindex', 'contenteditable', 'href', 'controls', 'inert', 'aria-hidden'] });
    }
  }
  hostUpdated(): void {
    if (this.#initialSnapshot) {
      this.#initialSnapshot = false;
      this.#host.removeAttribute(SELECTION_CHILDREN_ATTRIBUTE);
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
  current(): SelectionChildrenView {
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
          if (attributes.slot !== owned) throw new TypeError('Do not replace or remove an internally owned selection child slot.');
          delete attributes.slot;
        }
        // New/pasted or transferred nodes may carry a generated slot. Shared
        // normalization accepts only that finite syntax; the local key above
        // supplies identity, and refresh replaces the stale assignment.
        const interactive = this.projectsContent && [...child.querySelectorAll('*')].some(node =>
          isSelectionLabelInteractive(node.localName, Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]))));
        const content = this.#kind === 'checkbox' ? checkboxContent([...child.childNodes].map(selectionContentNode)) : undefined;
        return { key, tagName: child.localName, attributes, text: content?.label ?? child.textContent ?? '', description: content?.description, descriptionAssigned: content?.descriptionAssigned, interactive };
      });
      return { active: true, items: normalizeSelectionChildren(this.#kind, sources), error: '' };
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
    if (!next.error && this.projectsContent) children.forEach((child, index) => {
      const slot = `${SELECTION_SLOT_PREFIX}${next.items[index].key}`;
      this.#claimSlot(child, slot);
    });
    if (JSON.stringify(next) !== JSON.stringify(this.#view)) {
      this.#view = next;
      this.#host.requestUpdate();
    }
  }
}

export interface SelectionContentNode { readonly text?: string; readonly attributes?: Readonly<Record<string, string>>; readonly children?: readonly SelectionContentNode[]; }
/** Same light-DOM label/description split in browser and SSR; decoration stays silent. */
export function checkboxContent(nodes: readonly SelectionContentNode[]): {label: string; description: string; descriptionAssigned: boolean} {
  const text = (node: SelectionContentNode): string => {
    const a = node.attributes ?? {};
    if ('hidden' in a || 'inert' in a || a['aria-hidden'] === 'true') return '';
    return a['aria-label'] ?? a.alt ?? node.text ?? (node.children ?? []).map(text).join('');
  };
  for (const node of nodes) {
    if (node.attributes?.slot && node.attributes.slot !== 'description') throw new TypeError('Checkbox content supports the default label and description slot only.');
    const nestedSlot = (n: SelectionContentNode): boolean => !!n.attributes?.slot || (n.children ?? []).some(nestedSlot);
    if ((node.children ?? []).some(nestedSlot)) throw new TypeError('Place checkbox description slots directly inside en-choice-option.');
  }
  return {descriptionAssigned: nodes.some(n => n.attributes?.slot === 'description'), label: nodes.filter(n => n.attributes?.slot !== 'description').map(text).join(''), description: nodes.filter(n => n.attributes?.slot === 'description').map(text).join(' ')};
}
function selectionContentNode(node: Node): SelectionContentNode {
  return node.nodeType === 3 ? {text: node.textContent ?? ''} : node.nodeType === 1
    ? {attributes: Object.fromEntries([...(node as Element).attributes].map(a => [a.name,a.value])), children: [...node.childNodes].map(selectionContentNode)} : {};
}
