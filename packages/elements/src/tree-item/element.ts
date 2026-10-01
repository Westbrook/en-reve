import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { treeItemStyles } from '@en-reve/styles/tree.js';
import { emptyTreeItemPresentation, recoverTreeItemPresentation, registerTreeItemPresentation,
  TREE_PRESENTATION_ATTRIBUTE, type TreeItemPresentation } from '@en-reve/primitives/interactions/tree.js';
import { treeItemTemplate } from './template.js';
import type { PropertyValues } from 'lit';

/** @internal Parent ownership never exposes another element's shadow nodes. */
export interface TreeItemOwner { invalidate(): void; }

/**
 * A finite hierarchy item owned by en-tree. Selection and expansion belong to the parent.
 * Label and decorative slots must contain noninteractive content.
 * @tagname en-tree-item
 * @slot label - Noninteractive item label, replacing the label attribute.
 * @slot prefix - Decorative leading content, excluded from the accessible name.
 * @slot suffix - Decorative trailing content, excluded from the accessible name.
 * @slot children - Direct en-tree-item descendants; no forwarding or structural wrappers.
 * @csspart base - The focusable treeitem and its contained child group.
 * @csspart option - The painted label row; focus and selection remain distinct.
 * @csspart label - Item label container.
 * @csspart indicator - Decorative expansion pointer target; hidden on leaves.
 * @csspart drag-handle - Optional pointer/touch grip when the owning tree is reorderable.
 * @csspart group - Descendant group.
 * @cssprop --en-space-4 - Indentation of each nested child group.
 * @cssprop --en-option-radius - Item row radius.
 * @cssprop --en-option-background - Shared row background override.
 * @cssprop --en-option-color - Shared row foreground override.
 * @cssprop --en-option-inline-padding - Row inline padding.
 * @cssprop --en-option-block-padding - Row block padding.
 * @cssprop --en-option-selected-background - Selected row background.
 * @cssprop --en-option-selected-color - Selected row foreground.
 * @cssprop --en-option-focus-width - Immediate focused row contour width.
 * @cssprop --en-option-focus-color - Immediate focused row contour color.
 * @cssprop --en-option-focus-offset - Signed focused row contour offset.
 * @cssprop --en-option-focus-halo-width - Supplemental focused row halo width.
 * @cssprop --en-option-focus-halo-color - Supplemental focused row halo color.
 */
export class EnTreeItem extends EnElement {
  static override properties = {
    key: { type: String, noAccessor: true },
    value: { type: String, reflect: true },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
    branch: { type: Boolean, reflect: true },
  };
  static override styles = [foundationStyles, blockHostStyles, treeItemStyles];
  /** Unique nonblank identity within the owning tree; key wins over value in authored markup. */
  get key(): string { return this.value; }
  set key(key: string) { this.value = key; }
  /** @internal Preserve canonical attribute precedence during upgrade and SSR. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === 'value' && this.hasAttribute('key')) return;
    super.attributeChangedCallback(name, old, value);
  }
  /** @deprecated Use key. Unique nonblank key within the entire owning tree. */
  declare value: string;
  /** Plain label fallback, replaced by the label slot. */
  declare label: string;
  /** Discoverable by arrows, but cannot be selected or expanded by user action. */
  declare disabled: boolean;
  /** Keep an empty authored folder expandable; application owns loading its child nodes. */
  declare branch: boolean;
  private reorderable = false;
  /** @internal */
  setTreeReorderable(value: boolean): void { if (value !== this.reorderable) { this.reorderable = value; this.requestUpdate(); } }
  private presentation = emptyTreeItemPresentation;
  private pendingPresentation?: TreeItemPresentation;
  private owner?: TreeItemOwner;
  private baseline = false;
  private initialized = false;

  constructor() {
    super();
    this.value = ''; this.label = ''; this.disabled = false; this.branch = false;
    registerTreeItemPresentation(this, presentation => { this.presentation = presentation; this.reorderable = Boolean(presentation.reorderable); });
  }

  override connectedCallback(): void {
    const baseline = recoverTreeItemPresentation(this);
    if (baseline && !this.initialized) { this.presentation = baseline; this.reorderable = Boolean(baseline.reorderable); this.baseline = true; }
    super.connectedCallback();
    this.owner?.invalidate();
  }
  override disconnectedCallback(): void {
    const owner = this.owner;
    this.owner = undefined;
    this.applyPresentation(emptyTreeItemPresentation);
    super.disconnectedCallback();
    owner?.invalidate();
  }
  /** Focus the semantic treeitem without accessing private markup. */
  override focus(options?: FocusOptions): void { this.control()?.focus(options); }

  /** @internal */
  get treeReady(): boolean { return this.initialized; }
  /** @internal */
  setTreeOwner(owner?: TreeItemOwner): void {
    if (this.owner === owner) return;
    this.owner = owner;
    if (!owner) this.applyPresentation(emptyTreeItemPresentation);
  }
  /** @internal A previous tree cannot release an item already claimed by another. */
  releaseTreeOwner(owner: TreeItemOwner): void {
    if (this.owner === owner) this.setTreeOwner(undefined);
  }
  /** @internal */
  setTreePresentation(owner: TreeItemOwner, presentation: TreeItemPresentation): void {
    if (this.owner === owner) this.applyPresentation(presentation);
  }
  private applyPresentation(presentation: TreeItemPresentation): void {
    if (this.baseline) { this.pendingPresentation = presentation; return; }
    this.setTreeReorderable(Boolean(presentation.reorderable));
    if (Object.keys(presentation).every(key => Reflect.get(this.presentation, key) === Reflect.get(presentation, key))) return;
    this.presentation = presentation;
    // Tab stops must settle before native focus dispatches the next focusin.
    const control = this.control();
    if (control) control.tabIndex = presentation.tabStop;
    this.requestUpdate();
  }
  private control(): HTMLElement | null { return this.renderRoot?.querySelector<HTMLElement>('[role="treeitem"]') ?? null; }
  /** @internal */
  hasTreeFocus(): boolean { return this.control()?.matches(':focus') ?? false; }
  /** @internal */
  isTreeIndicator(event: Event): boolean {
    const indicator = this.renderRoot?.querySelector('[part="indicator"]');
    return Boolean(indicator && event.composedPath().includes(indicator));
  }
  /** @internal Only the row is an activation surface; group spacing is inert. */
  isTreeRowEvent(event: Event): boolean {
    const row = this.renderRoot?.querySelector('[part="option"]');
    return Boolean(row && event.composedPath().includes(row));
  }
  /** @internal Name lookup stays within this item's author-owned label nodes. */
  treeLabel(): string {
    const slot = this.renderRoot?.querySelector<HTMLSlotElement>('slot[name="label"]');
    const nodes = slot?.assignedNodes({ flatten: true }) ?? [];
    return (nodes.length ? nodes.map(node => node.textContent ?? '').join(' ') : this.label).replace(/\s+/gu, ' ').trim();
  }
  private readonly slotChanged = (): void => { this.owner?.invalidate(); };
  protected override firstUpdated(): void {
    this.initialized = true;
    this.baseline = false;
    this.removeAttribute(TREE_PRESENTATION_ATTRIBUTE);
    if (this.pendingPresentation) {
      const next = this.pendingPresentation;
      this.pendingPresentation = undefined;
      this.applyPresentation(next);
    }
    this.owner?.invalidate();
  }
  protected override updated(changed: PropertyValues): void {
    if (changed.has('value') || changed.has('label') || changed.has('disabled') || changed.has('branch')) this.owner?.invalidate();
  }
  protected override render() {
    return treeItemTemplate({ presentation: this.presentation, reorderable: this.reorderable, label: this.label, disabled: this.disabled, slotChanged: this.slotChanged });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-tree-item': EnTreeItem; } }
