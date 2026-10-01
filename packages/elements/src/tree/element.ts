import { html, nothing } from 'lit';
import { buttonStyles } from '@en-reve/styles/buttons.js';
import { EnElement } from '../internal/en-element.js';
import { createValueModel } from '@en-reve/primitives/state/value.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { dispatchChange, type ChangeEvent, type LoadStateChangeEvent } from '@en-reve/primitives/interactions/events.js';
import { treeSnapshot, recoverTreeSnapshot, TREE_SNAPSHOT_ATTRIBUTE, type TreeSnapshot, type TreeDataItem, type NormalizedTreeDataItem, type TreeSelectionSnapshot, treeDataKey, normalizeTreeData, recoverTreeData, TREE_DATA_ATTRIBUTE } from '@en-reve/primitives/interactions/tree.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { treeStyles, treeItemStyles, treeDataStyles } from '@en-reve/styles/tree.js';
import { TreeInteractionController } from './interaction-controller.js';
import { treeTemplate } from './template.js';
import { TreeDataController } from './data-controller.js';
import { TreeLazyController } from './lazy-controller.js';
import { TreeMoveController } from './move-controller.js';
import { type TreeLoadChildren, type TreeBranchState, type TreeMovePosition, type TreeMove } from '@en-reve/primitives/interactions/tree-operations.js';
import { treeDataTemplate } from './data-template.js';
import type { ScrollToKeyOptions } from '@en-reve/primitives/interactions/virtual-collection.js';

export type { TreeLoadChildren, TreeLoadContext, TreeBranchState, TreeMove, TreeMovePosition } from '@en-reve/primitives/interactions/tree-operations.js';
export type { TreeSnapshot, TreeSelectionSnapshot, TreeDataItem, NormalizedTreeDataItem } from '@en-reve/primitives/interactions/tree.js';

export type TreeChangeEvent = ChangeEvent<TreeSelectionSnapshot, 'selection' | 'expansion'>;
export type TreeLoadStateChangeEvent = LoadStateChangeEvent<TreeBranchState & { readonly key: string }>;
export type TreeReorderEvent = CustomEvent<TreeMove>;
export interface TreeEventMap {
  'en-change': TreeChangeEvent;
  'en-load-state-change': TreeLoadStateChangeEvent;
  /** @deprecated Use en-load-state-change. */ 'en-load': TreeLoadStateChangeEvent;
  'en-reorder': TreeReorderEvent;
}

/**
 * A finite vertical hierarchy with parent-owned single or multiple selection and expanded keys.
 * Focus is independent of selection. Enter/Space or a row click select; chevrons
 * and logical left/right arrows expand. Unknown author keys remain available for later children.
 * @tagname en-tree
 * @slot - Direct en-tree-item roots, with unique nonempty values across the tree.
 * @csspart base - The named tree and empty-tree focus target.
 * @csspart viewport - Data-mode scrollport; windowing is opt-in.
 * @csspart item - Data-mode semantic tree item and keyboard focus target.
 * @csspart option - Data-mode visual row.
 * @csspart indicator - Data-mode branch disclosure indicator.
 * @csspart label - Data-mode plain-text item label.
 * @csspart group - Data-mode native child group.
 * @cssprop --en-tree-viewport-size - Virtual data viewport fallback block size when the host is unsized; defaults to 24rem. A sized host takes precedence.
 * @csspart branch-controls - Retry action and polite lazy-loading announcements.
 * @csspart branch-loading - Noninteractive indented loading placeholder beneath its parent.
 * @csspart branch-status - Empty and retry guidance within a data row.
 * @csspart drag-handle - Pointer/touch reorder grip.
 * @csspart drop-indicator - Single straight insertion line at the destination sibling gap.
 * @csspart drag-preview - Floating pointer preview with item count and destination.
 * @csspart move-controls - Equivalent keyboard/touch destination controls.
 * @csspart move-status - Polite operation announcements.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/tree-operations.js').TreeMove>} en-reorder - Cancelable structural proposal before mutation; author hierarchy writes supersede the default move.
 * @fires {TreeLoadStateChangeEvent} en-load-state-change - Noncancelable branch loading, loaded, empty, error or canceled-to-idle status.
 * @fires {TreeLoadStateChangeEvent} en-load - Deprecated status notification alias; subscribe to one status name.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<TreeSelectionSnapshot, 'selection' | 'expansion'>>} en-change - One synchronous cancelable tentative snapshot {selectedKey, selectedKeys, expandedKeys}, with legacy value/values/expanded aliases; cancellation restores still-owned state while author writes and accepted nested changes win.
 */
export class EnTree extends EnElement<TreeEventMap> {
  static override properties = {
    selectedKey: { attribute: 'selected-key', noAccessor: true },
    selectedKeys: { attribute: false, noAccessor: true },
    expandedKeys: { attribute: false, noAccessor: true },
    value: { type: String, reflect: true, noAccessor: true },
    values: { attribute: false, noAccessor: true },
    multiple: { type: Boolean, reflect: true, noAccessor: true },
    expanded: { attribute: false, noAccessor: true },
    label: { type: String },
    items: { attribute: false, noAccessor: true },
    virtualize: { type: Boolean, reflect: true },
    reorderable: { type: Boolean, reflect: true },
    loadChildren: { attribute: false, noAccessor: true },
  };
  static override styles = [foundationStyles, blockHostStyles, treeStyles, treeItemStyles, treeDataStyles, buttonStyles];
  /** Accessible name of the hierarchy. */
  declare label: string;
  /** Window data-backed expanded rows; full rendering is the default. */
  declare virtualize: boolean;
  /** Enable drag handles and an equivalent Move interface. */
  declare reorderable: boolean;
  private loader?: TreeLoadChildren;
  private readonly lazy: TreeLazyController;
  private readonly moves: TreeMoveController;
  private dataItems: readonly NormalizedTreeDataItem[] | undefined;
  private itemsWritten = false;
  private readonly data: TreeDataController;
  private readonly model = createValueModel<TreeSnapshot>(treeSnapshot('', []));
  private presented = this.model.value.get();
  private revision = 0;
  private valueWritten = false;
  private expandedWritten = false;
  private multipleWritten = false;
  private multi = false;
  private recovered = false;
  private error = '';
  private empty = true;
  private readonly interaction: TreeInteractionController;

  constructor() {
    super();
    this.label = '';
    this.virtualize = false; this.reorderable = false;
    new SignalController(this, () => this.model.view.get());
    this.interaction = new TreeInteractionController(this, {
      enabled: () => this.items === undefined,
      snapshot: () => this.model.value.get(),
      presented: () => this.presented,
      propose: (next, reason, valid) => this.propose(next, reason, valid),
      status: (error, empty) => {
        if (this.error === error && this.empty === empty) return;
        this.error = error; this.empty = empty; this.requestUpdate();
      },
      focusEmpty: () => this.renderRoot.querySelector<HTMLElement>('[role="tree"]')?.focus(),
    });
    this.data = new TreeDataController(this, {
      items: () => this.items, virtualize: () => this.virtualize,
      snapshot: () => this.model.value.get(), presented: () => this.presented,
      propose: (next, reason, valid) => this.propose(next, reason, valid),
    });
    this.lazy = new TreeLazyController(this, {
      items: () => this.items, expanded: () => this.expanded, visible: key => this.data.byKey.has(key), loader: () => this.loadChildren,
      commit: (key, children) => {
        const replace = (rows: readonly TreeDataItem[]): readonly TreeDataItem[] => rows.map(item => treeDataKey(item) === key
          ? { ...item, lazy: false, branch: true, children } : { ...item, children: replace(item.children ?? []) });
        this.dataItems = normalizeTreeData(replace(this.items ?? []));
        this.data.refresh(); this.requestUpdate();
      },
    });
    this.moves = new TreeMoveController(this, key => this.focusKey(key));
  }
  /** Application-owned async data loader. Replacing it aborts outstanding requests. */
  get loadChildren(): TreeLoadChildren | undefined { return this.loader; }
  set loadChildren(loader: TreeLoadChildren | undefined) {
    if (loader !== undefined && typeof loader !== 'function') throw new TypeError('loadChildren must be a function.');
    if (loader === this.loader) return;
    this.lazy?.reset(); this.loader = loader; this.requestUpdate();
  }
  /** Immutable status for a known branch; no network or error policy is built in. */
  getBranchState(key: string): TreeBranchState { return this.lazy.state(key); }
  /** Load/retry/refresh an expanded visible data branch. Invalid or pending requests return false. */
  loadBranch(key: string): Promise<boolean> { return this.lazy.load(key); }
  /** Propose a structural move. Cancellation or authoritative application edits win. */
  moveItems(keys: readonly string[], target: string, position: TreeMovePosition): boolean { return this.moves.move(keys, target, position); }
  /** Open the accessible destination/position controls for the supplied keys or current selection. */
  openMove(keys: readonly string[] = this.values): void { this.moves.open(keys); }
  private async focusKey(key: string): Promise<void> {
    if (this.items !== undefined) await this.data.focusKey(key);
    else {
      await this.updateComplete;
      this.interaction.refresh();
      const items = Array.from(this.querySelectorAll('en-tree-item')).filter(item => item.closest('en-tree') === this);
      // A move can expand a new parent: its child slot must be visible before focusing.
      await Promise.all(items.map(item => item.updateComplete));
      if (this.isConnected && this.items === undefined) items.find(item => item.value === key && item.closest('en-tree') === this)?.focus();
    }
  }
  /** Complete immutable hierarchy. Undefined uses slotted items; an array selects data mode. */
  get items(): readonly NormalizedTreeDataItem[] | undefined { return this.dataItems; }
  set items(value: readonly TreeDataItem[] | undefined) {
    const next = value === undefined ? undefined : normalizeTreeData(value);
    const previous = this.dataItems;
    // Data is a commit constraint, not an authoritative selection/expansion
    // write. Its identity invalidates a pending proposal through canCommit;
    // advancing the state revision here would strand that tentative snapshot.
    this.lazy?.reset(); this.itemsWritten = true; this.dataItems = next;
    this.data?.refresh();
    this.requestUpdate('items', previous);
    this.interaction?.invalidate();
  }
  /** Reveal an expanded-visible data key without changing selection, expansion or focus. */
  scrollToKey(key: string, options: ScrollToKeyOptions = {}): boolean {
    return this.items !== undefined && this.data.scrollToKey(key, options);
  }
  /** Selected key; in multiple mode reads the first selection and writes replace it. */
  get selectedKey(): string { return this.value; }
  set selectedKey(key: string) { this.value = key; }
  /** Immutable selected keys; in single mode only the first key is retained. */
  get selectedKeys(): readonly string[] { return this.values; }
  set selectedKeys(keys: readonly string[]) { this.values = keys; }
  /** Expanded branch identities, independent of selection. */
  get expandedKeys(): readonly string[] { return this.expanded; }
  set expandedKeys(keys: readonly string[]) { this.expanded = keys; }
  /** @internal Preserve canonical attribute precedence during upgrade and SSR. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === 'value' && this.hasAttribute('selected-key')) return;
    super.attributeChangedCallback(name, old, value);
  }
  /** @deprecated Use selectedKey. Selected key (first key in multiple mode). Assigning replaces selection; empty clears it. Explicit author writes are silent. */
  get value(): string { return this.model.value.get().value; }
  set value(value: string) {
    this.valueWritten = true;
    this.authorWrite(treeSnapshot(value, this.expanded, this.multiple ? (value ? [value] : []) : undefined), 'value');
  }
  /** Enable independent multiple selection. Switching off retains the first selected key. */
  get multiple(): boolean { return this.multi; }
  set multiple(value: boolean) {
    this.multipleWritten = true;
    const previous = this.multi; this.multi = Boolean(value);
    this.authorWrite(treeSnapshot(this.value, this.expanded, this.multi ? this.values : undefined), 'values');
    this.requestUpdate('multiple', previous);
  }
  /** @deprecated Use selectedKeys. Immutable selected keys. In single mode only the first key is retained. Unknown keys survive toggles and collapse; plain click and Shift ranges replace selection. */
  get values(): readonly string[] { return this.model.value.get().values ?? Object.freeze(this.value ? [this.value] : []); }
  set values(value: readonly string[]) {
    const next = treeSnapshot('', this.expanded, value);
    this.valueWritten = true;
    this.authorWrite(this.multiple ? next : treeSnapshot(next.value, next.expanded), 'values');
  }
  /** @deprecated Use expandedKeys. Expanded branch keys. Set as a property; no JSON attribute or child state mirrors. */
  get expanded(): readonly string[] { return this.model.value.get().expanded; }
  set expanded(value: readonly string[]) {
    const next = treeSnapshot(this.value, value, this.multiple ? this.values : undefined);
    this.expandedWritten = true;
    this.authorWrite(next, 'expanded');
  }
  private authorWrite(next: TreeSnapshot, property: 'value' | 'values' | 'expanded'): void {
    const previous = property === 'value' ? this.presented.value : this.presented.expanded;
    this.revision++;
    this.model.set(next);
    this.presented = this.model.value.get();
    this.requestUpdate(property, previous);
    this.requestUpdate('value');
    this.interaction?.invalidate();
    this.data?.refresh();
  }
  override connectedCallback(): void {
    if (!this.recovered) {
      const baseline = recoverTreeSnapshot(this);
      if (baseline) {
        if (!this.multipleWritten && baseline.values !== undefined) this.multi = true;
        this.model.set(treeSnapshot(this.valueWritten ? this.value : baseline.value, this.expandedWritten ? this.expanded : baseline.expanded,
          this.multiple ? (this.valueWritten ? this.values : baseline.values ?? (baseline.value ? [baseline.value] : [])) : undefined));
        this.presented = this.model.value.get();
      }
      if (!this.itemsWritten) {
        const items = recoverTreeData(this);
        if (items !== undefined) this.items = items;
      }
      this.recovered = true;
    }
    super.connectedCallback();
  }
  /** Focus the current visible entry, or the empty hierarchy. */
  override focus(options?: FocusOptions): void {
    if (this.items !== undefined) {
      if (!this.data.focusCurrent(options)) this.renderRoot.querySelector<HTMLElement>('[role="tree"]')?.focus(options);
      return;
    }
    this.interaction.refresh();
    // The interaction owner retains private focus targets; focus() asks its
    // current entry directly instead of making consumers inspect item shadows.
    if (!this.interaction.focusCurrent(options)) this.renderRoot.querySelector<HTMLElement>('[role="tree"]')?.focus(options);
  }
  private propose(next: TreeSnapshot, reason: 'selection' | 'expansion', valid: () => boolean): void {
    const current = this.model.value.get();
    const previous = treeSnapshot(current.value, current.expanded, current.values);
    dispatchChange(this, {
      previous, proposed: treeSnapshot(next.value, next.expanded, next.values), reason, getRevision: () => this.revision,
      stage: proposed => { this.model.set(proposed); },
      rollback: prior => { this.model.set(prior); },
      canCommit: valid,
      commit: () => {
        const prior = this.presented;
        this.presented = this.model.value.get();
        this.requestUpdate('value', prior.value);
        this.requestUpdate('expanded', prior.expanded);
        this.interaction.refresh();
        this.data.refresh();
      },
    });
  }
  private branchControls() {
    if (!this.loadChildren || this.items === undefined) return nothing;
    const key = this.data.current, state = this.getBranchState(key), item = this.data.byKey.get(key)?.item;
    return html`<div class="en-tree-branch-controls" part="branch-controls">
      ${state.status === 'error' ? html`<button type="button" class="en-button" @click=${() => { void this.loadBranch(key); void this.focusKey(key); }}>Retry ${item?.label}</button>` : nothing}
      <p role="status" aria-atomic="true">${this.lazy.message}</p>
    </div>`;
  }
  protected override firstUpdated(): void { this.removeAttribute(TREE_SNAPSHOT_ATTRIBUTE); this.removeAttribute(TREE_DATA_ATTRIBUTE); }
  protected override render() {
    if (this.items !== undefined) {
      this.data.refresh();
      return html`${treeDataTemplate({ multiple: this.multiple, label: this.label, error: this.data.error, virtualize: this.virtualize,
        current: this.data.current, rows: this.data.rows, byKey: this.data.byKey, model: this.data.model, reorderable: this.reorderable, branchState: key => this.getBranchState(key) })}${this.branchControls()}${this.moves.render()}`;
    }
    return html`${treeTemplate({ multiple: this.multiple, label: this.label, error: this.error, empty: this.empty, slotChanged: this.interaction.invalidate })}${this.branchControls()}${this.moves.render()}`;
  }
}

declare global { interface HTMLElementTagNameMap { 'en-tree': EnTree; } }
