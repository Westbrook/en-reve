import { ChildUpgrades } from '../internal/child-upgrades.js';
import { accordionTemplate } from './template.js';
import { EnElement } from '../internal/en-element.js';
import type { PropertyValues } from 'lit';
import { createSelectionModel } from '@en-reve/primitives/state/selection.js';
import { dispatchChange, type ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { selectionStyles } from '@en-reve/styles/selection.js';
import type { EnAccordionItem, AccordionOwner } from '../accordion-item/accordion-item.js';

/**
 * Groups disclosure sections with a shared value and cancelable tentative changes.
 * Items must have unique nonempty value keys. Unrecognized keys remain available for later items.
 * @tagname en-accordion
 * @slot - en-accordion-item children, each with a unique value.
 * @csspart base - Group wrapper.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<readonly string[]>>} en-change - Cancelable tentative array of open item keys; cancellation restores the prior value unless superseded by an author write.
 */
export class EnAccordion extends EnElement implements AccordionOwner {
  static override properties = {
    value: { attribute: false, noAccessor: true },
    multiple: { type: Boolean, reflect: true },
  };
  static override styles = [foundationStyles, blockHostStyles, selectionStyles];
  declare multiple: boolean;
  private readonly model = createSelectionModel<string>([], { multiple: true });
  // An equal public assignment can still supersede an in-flight proposal.
  private authorRevision = 0;
  private presentedValue: readonly string[] = [];
  private items: EnAccordionItem[] = [];
  private observer?: MutationObserver;
  private readonly upgrades = new ChildUpgrades(this, () => this.readItems());

  constructor() {
    super();
    this.multiple = false;
    new SignalController(this, () => this.model.view.get());
  }

  /** Open item keys. Set as a property; author updates do not emit change events. */
  get value(): readonly string[] { return this.model.selected.get(); }
  set value(value: readonly string[]) {
    this.authorRevision += 1;
    const previous = this.presentedValue;
    const next = Array.isArray(value) ? value.filter((key) => typeof key === 'string') : [];
    this.model.setSelected(next);
    this.presentedValue = this.value;
    this.requestUpdate('value', previous);
  }

  override disconnectedCallback(): void {
    this.observer?.disconnect();
    for (const item of this.items) item.setOwner(undefined);
    super.disconnectedCallback();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    for (const item of this.items) item.setOwner(this);
    this.observer = new MutationObserver(() => this.readItems());
    this.observer.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['value', 'slot'] });
  }

  /** @internal A contained item routes its action through the public group. */
  toggleItem(item: EnAccordionItem): void { this.requestItemOpen(item, !this.value.includes(item.value), 'toggle'); }

  /** @internal One group-owned proposal for a contained item's public request. */
  requestItemOpen(item: EnAccordionItem, open: boolean, reason = 'api'): ChangeOutcome {
    if (!this.items.includes(item) || item.disabled || !item.value) return 'canceled';
    const key = item.value, multiple = this.multiple;
    const previous = this.value;
    if (previous.includes(key) === open) return 'unchanged';
    const proposed = Object.freeze(!open
      ? previous.filter(value => value !== key)
      : this.multiple ? [...previous, key] : [key]);
    return dispatchChange(this, {
      previous, proposed, reason,
      getRevision: () => this.authorRevision,
      canCommit: () => this.isConnected && !item.disabled && item.value === key && this.multiple === multiple &&
        !!this.renderRoot.querySelector<HTMLSlotElement>('slot')?.assignedElements({ flatten: true }).includes(item),
      stage: next => { this.model.setSelected(next); },
      rollback: prior => { this.model.setSelected(prior); },
      commit: () => {
        const prior = this.presentedValue;
        this.presentedValue = this.value;
        this.requestUpdate('value', prior);
        this.syncItems();
      },
    });
  }

  private readItems(): void {
    for (const item of this.items) item.setOwner(undefined);
    const slot = this.renderRoot.querySelector('slot');
    const assigned = slot?.assignedElements({ flatten: true }) ?? [];
    this.upgrades.watch(assigned);
    this.items = assigned.filter((item): item is EnAccordionItem => item.localName === 'en-accordion-item' && item.matches(':defined') && typeof (item as EnAccordionItem).setOwner === 'function' && 'open' in item);
    for (const item of this.items) item.setOwner(this);
    this.syncItems();
  }

  private syncItems(): void {
    for (const item of this.items) item.open = this.presentedValue.includes(item.value);
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('value') || changed.has('multiple')) this.syncItems();
  }

  protected override render() {
    return accordionTemplate(() => this.readItems());
  }
}

declare global { interface HTMLElementTagNameMap { 'en-accordion': EnAccordion; } }
