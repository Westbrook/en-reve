import { LitElement, type PropertyValues, type PropertyDeclarations } from 'lit';
import { registryCreationScope } from '../element-scope.js';
import { elementRegistry, recordConnectionDocument, releaseConnectionDocument } from './element-registry.js';
import { StaticStylesController } from '@en-reve/primitives/interactions/static-styles.js';

// Versioned cooperation between separately evaluated EnElement copies. The key
// stores no DOM state; each provider reads only its own private root provenance.
const renderCreationContextProtocol = Symbol.for('@en-reve/elements/render-creation-context/v1');

/** The requested size scope; `inherit` uses the nearest containing size scope. */
export type ElementSize = 'inherit' | 'small' | 'medium' | 'large';

function normalizeSize(value: unknown): ElementSize {
  return value === 'inherit' || value === 'small' || value === 'large' ? value : 'medium';
}

export interface ElementEventListener<Host, Events> {
  <K extends keyof Events>(type: K, listener: ((this: Host, event: Events[K]) => void) | { handleEvent(event: Events[K]): void } | null, options?: boolean | AddEventListenerOptions): void;
  <K extends keyof HTMLElementEventMap>(type: K, listener: ((this: Host, event: HTMLElementEventMap[K]) => void) | { handleEvent(event: HTMLElementEventMap[K]): void } | null, options?: boolean | AddEventListenerOptions): void;
  (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
}
export interface ElementEventRemover<Host, Events> {
  <K extends keyof Events>(type: K, listener: ((this: Host, event: Events[K]) => void) | { handleEvent(event: Events[K]): void } | null, options?: boolean | EventListenerOptions): void;
  <K extends keyof HTMLElementEventMap>(type: K, listener: ((this: Host, event: HTMLElementEventMap[K]) => void) | { handleEvent(event: HTMLElementEventMap[K]): void } | null, options?: boolean | EventListenerOptions): void;
  (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void;
}

/**
 * Shared reactive base for En Rêve custom elements.
 *
 * Concrete size modes establish an absolute size scope through foundation styles.
 * Inherited size is resolved by CSS, so the getter reports the requested mode,
 * not a measured or computed size. This class performs no element registration.
 */
export class EnElement<Events extends { [K in keyof Events]: Event } = {}> extends LitElement {
  // Declaration-only specialization of the native methods: no wrapper or runtime narrowing.
  /** @internal Type-only specialization of the native listener method. */
  declare addEventListener: ElementEventListener<this, Events>;
  /** @internal Type-only specialization of the native listener method. */
  declare removeEventListener: ElementEventRemover<this, Events>;
  // undefined means automatic; null is an intentionally uninitialized registry.
  #renderRegistry: CustomElementRegistry | null | undefined;
  #attachedRoot?: ShadowRoot;
  // Native adoption can retain the old global on a shadow root. Keep proof for
  // this exact association without changing the root or retaining its document.
  #globalRenderRoot?: {root: Node; registry: CustomElementRegistry};

  // Install the internal protocol without declaring a public/protected member.
  // A different module copy invokes this function with its containing root's host;
  // this closure retains the provider's private brand, not the consumer's brand.
  static {
    Object.defineProperty(this.prototype, renderCreationContextProtocol, {
      enumerable: false, configurable: false, writable: false,
      value: function(this: EnElement, root: ShadowRoot, document: Document, registry: CustomElementRegistry): CustomElementRegistry | undefined {
        if (!(#globalRenderRoot in this)) return undefined;
        const proof = this.#globalRenderRoot;
        if (!proof || proof.root !== root || proof.registry !== registry ||
          Object.getOwnPropertyDescriptor(this, 'renderRoot')?.value !== root ||
          root.host !== this || this.ownerDocument !== document || root.ownerDocument !== document ||
          root.customElementRegistry !== registry) return undefined;
        return document.defaultView?.customElements;
      },
    });
  }

  #containingRenderCreationRegistry(): CustomElementRegistry | undefined {
    const document = this.ownerDocument;
    const global = document?.defaultView?.customElements;
    const registry = this.customElementRegistry;
    if (!global || registry === undefined || registry === null || registry === global) return undefined;
    const root = this.getRootNode() as ShadowRoot;
    const host = root.host;
    if (!host || root.ownerDocument !== document || host.ownerDocument !== document ||
      root.customElementRegistry !== registry || Object.getOwnPropertyDescriptor(host, 'renderRoot')?.value !== root) return undefined;
    for (let owner: object | null = host; owner; owner = Object.getPrototypeOf(owner)) {
      const descriptor = Object.getOwnPropertyDescriptor(owner, renderCreationContextProtocol);
      if (!descriptor) continue;
      // Stop at the nearest descriptor. Accessors and nonfunctions mask support;
      // reading support must not invoke an arbitrary getter or skip an override.
      if (!('value' in descriptor) || typeof descriptor.value !== 'function') return undefined;
      const creationRegistry: unknown = Reflect.apply(descriptor.value, host, [root, document, registry]);
      const requested = this.getRenderRegistry();
      const currentGlobal = document.defaultView?.customElements;
      // A cooperative query is read-only. Never continue with the pre-call
      // selection after a callback changes ownership, explicit intent, or roots.
      if (requested !== undefined || (this.constructor as typeof EnElement).shadowRootOptions.customElementRegistry !== undefined ||
        this.shadowRoot || this.#attachedRoot || this.renderRoot || this.ownerDocument !== document ||
        this.getRootNode() !== root || this.customElementRegistry !== registry || root.host !== host ||
        root.ownerDocument !== document || host.ownerDocument !== document || root.customElementRegistry !== registry ||
        Object.getOwnPropertyDescriptor(host, 'renderRoot')?.value !== root || currentGlobal !== global) {
        throw new Error('The render context changed while resolving its containing root registry.');
      }
      return creationRegistry === currentGlobal ? currentGlobal : undefined;
    }
    return undefined;
  }

  #creationRegistry(root: Node, registry: CustomElementRegistry | null, oldDocument?: Document): CustomElementRegistry | null {
    const global = this.ownerDocument.defaultView?.customElements;
    const prior = this.#globalRenderRoot;
    if (registry !== null && (registry === global || registry === oldDocument?.defaultView?.customElements ||
      (prior?.root === root && prior.registry === registry))) {
      this.#globalRenderRoot = {root, registry};
      return global ?? registry;
    }
    this.#globalRenderRoot = undefined;
    return registry;
  }

  /** @internal Registry for new render descendants and their optional definitions; available after root creation. */
  protected getRenderCreationRegistry(): CustomElementRegistry | null | undefined {
    const root = this.renderRoot as ShadowRoot | undefined;
    if (!root) return undefined;
    const registry = 'customElementRegistry' in root ? root.customElementRegistry : elementRegistry(this);
    return registry === undefined ? undefined : this.#creationRegistry(root, registry);
  }

  /** Override only to request an explicit render registry. Register its dependencies first. */
  protected getRenderRegistry(): CustomElementRegistry | null | undefined {
    return (this.constructor as typeof EnElement).shadowRootOptions.customElementRegistry;
  }

  override attachShadow(options: ShadowRootInit): ShadowRoot {
    if (this.#renderRegistry !== undefined && 'customElementRegistry' in options && options.customElementRegistry !== this.#renderRegistry) {
      throw new Error('Conflicting explicit shadow registry options.');
    }
    return this.#attachedRoot = super.attachShadow(this.#renderRegistry === undefined ? options : {...options, customElementRegistry: this.#renderRegistry});
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    const requested = this.getRenderRegistry();
    const existing = this.shadowRoot;
    const actual = existing && 'customElementRegistry' in existing ? existing.customElementRegistry : undefined;
    if (existing && requested !== undefined && requested !== (actual === undefined ? this.ownerDocument?.defaultView?.customElements : actual)) {
      throw new Error('The explicitly requested render registry conflicts with the existing shadow root.');
    }
    let registry = existing && actual !== undefined ? actual : requested !== undefined ? requested : elementRegistry(this);
    if (requested === undefined && !existing && !this.#attachedRoot && !this.renderRoot &&
      (this.constructor as typeof EnElement).shadowRootOptions.customElementRegistry === undefined) {
      registry = this.#containingRenderCreationRegistry() ?? registry;
    }
    if (registry !== undefined && this.ownerDocument?.defaultView) {
      this.renderOptions.creationScope = registryCreationScope(this.ownerDocument, existing ? this.#creationRegistry(existing, registry) : registry);
      // Do not create the root before super: Lit hydration detects existing DSD here.
      this.#renderRegistry = registry;
    }
    try {
      return super.createRenderRoot();
    } catch (error) {
      // Lit's cached CSSResults contain sheets constructed in its source document.
      // A source-realm class can create new descendants after adoption, but those
      // sheets cannot be shared with the destination. Retain CSS text as a local
      // fallback only for this known style-adoption failure; never retry registry
      // or component failures through another construction path.
      const root = this.shadowRoot ?? this.#attachedRoot;
      const view = this.ownerDocument.defaultView;
      const styles = (this.constructor as typeof EnElement).elementStyles;
      if ((error as Error).name !== 'NotAllowedError' || !root || !view ||
        view.HTMLElement.prototype.isPrototypeOf(this) || !styles.every(style => 'cssText' in style)) throw error;
      const fallback = this.ownerDocument.createElement('style');
      fallback.textContent = styles.map(style => 'cssText' in style ? style.cssText : '').join('');
      const nonce = (globalThis as typeof globalThis & {litNonce?: string}).litNonce;
      if (nonce) fallback.nonce = nonce;
      root.append(fallback);
      this.renderOptions.renderBefore ??= root.firstChild;
      return root;
    }
  }

  protected override update(changed: PropertyValues): void {
    // Explicit initialization can happen after createRenderRoot (for example DSD).
    // Subsequent imports must use the now-associated root, not the dormant bridge.
    if (this.#renderRegistry === null && (this.renderRoot as ShadowRoot | undefined)?.customElementRegistry) {
      this.#renderRegistry = (this.renderRoot as ShadowRoot).customElementRegistry;
      this.renderOptions.creationScope = registryCreationScope(this.ownerDocument, this.#creationRegistry(this.renderRoot, this.#renderRegistry));
    }
    super.update(changed);
  }

  override connectedCallback(): void {
    recordConnectionDocument(this);
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    releaseConnectionDocument(this);
  }

  adoptedCallback(oldDocument?: Document, _newDocument?: Document): void {
    // Scoped/null associations stay literal. Proven global roots use the current
    // document for future imports, even if the native root still exposes the old
    // global. Include a root attached before the host's first connection.
    const root = (this.renderRoot as ShadowRoot | undefined) ?? this.shadowRoot ?? this.#attachedRoot;
    if (root) {
      const registry = 'customElementRegistry' in root ? root.customElementRegistry : elementRegistry(this);
      if (registry !== undefined) {
        const creationRegistry = this.#creationRegistry(root, registry, oldDocument);
        this.#renderRegistry = registry;
        if (this.ownerDocument.defaultView) {
          this.renderOptions.creationScope = registryCreationScope(this.ownerDocument, creationRegistry);
        }
      }
    }
  }

  private readonly staticStyles = new StaticStylesController(this);
  static override properties: PropertyDeclarations = {
    size: {
      reflect: true,
      useDefault: true,
      noAccessor: true,
      converter: {
        fromAttribute: normalizeSize,
        toAttribute: normalizeSize,
      },
    },
  };

  // The accessor default is recorded by Lit's first update without reflection.
  #size: ElementSize = 'medium';

  /**
   * Requested size scope: inherit, small, medium, or large.
   * Defaults to medium without adding an attribute. Explicit property writes
   * reflect; removing the attribute or supplying an invalid value restores
   * medium. Inheritance is an explicit opt-in. Its effective size is resolved
   * by CSS and is deliberately not returned by this property.
   * @default "medium"
   */
  get size(): ElementSize {
    return this.#size;
  }

  set size(value: ElementSize) {
    const previous = this.#size;
    const next = normalizeSize(value);
    this.#size = next;
    // Also reflect an explicit same-value write after an absent/invalid attribute.
    // Attribute-originated updates remain protected by Lit's reflection guard.
    const options = this.getAttribute('size') !== next
      ? Object.assign(Object.create((this.constructor as typeof EnElement).getPropertyOptions('size')), { hasChanged: () => true })
      : undefined;
    this.requestUpdate('size', previous, options);
  }

}
