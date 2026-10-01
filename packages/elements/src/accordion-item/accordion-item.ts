import { accordionItemTemplate } from './template.js';
import { EnElement } from '../internal/en-element.js';
import type { PropertyValues } from 'lit';
import { createDisclosureModel } from '@en-reve/primitives/state/disclosure.js';
import { dispatchChange, type ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { selectionStyles } from '@en-reve/styles/selection.js';

/** @internal The group coordinates value without exposing private markup. */
export interface AccordionOwner {
  toggleItem(item: EnAccordionItem): void;
  requestItemOpen(item: EnAccordionItem, open: boolean, reason: string): ChangeOutcome;
}

/**
 * A disclosure section. Supply a concise label; the label slot accepts text and phrasing content.
 * Within en-accordion, the group's value controls open state.
 * @cssprop --en-accordion-pressed-scale - accordion held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-accordion-pressed-offset - accordion held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-accordion-press-duration - accordion held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-accordion-release-duration - accordion held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-accordion-pressed-shadow - accordion held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-accordion-pressed-background - accordion held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-accordion-pressed-color - accordion held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-accordion-item
 * @cssprop --en-button-focus-width - Immediate primary focus contour width.
 * @cssprop --en-button-focus-color - Immediate primary focus contour color.
 * @cssprop --en-button-focus-offset - Signed primary focus contour offset.
 * @cssprop --en-button-focus-halo-width - Supplemental outer focus halo width.
 * @cssprop --en-button-focus-halo-color - Supplemental focus halo color; alpha is supported.
 * @cssprop --en-duration-focus-enter - Supplemental halo and field-accent entry duration.
 * @cssprop --en-duration-focus-exit - Supplemental halo and field-accent exit duration.
 * @cssprop --en-ease-focus-enter - Supplemental focus entry timing function.
 * @cssprop --en-ease-focus-exit - Supplemental focus exit timing function.
 * @slot - Section content.
 * @slot label - Trigger content, replacing the label attribute. Do not include interactive descendants.
 * @slot heading - Legacy trigger slot, used when the label slot is empty.
 * @csspart base - The section wrapper.
 * @csspart heading - The section heading.
 * @csspart control - The native disclosure button.
 * @csspart indicator - The expansion indicator.
 * @csspart panel - The collapsible content wrapper.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<boolean>>} en-change - Cancelable tentative open boolean for standalone use. Grouped actions belong to en-accordion.
 */
export class EnAccordionItem extends EnElement {
  static override properties = {
    value: { type: String, reflect: true },
    label: { type: String },
    open: { type: Boolean, reflect: true, noAccessor: true },
    disabled: { type: Boolean, reflect: true },
    headingLevel: { type: Number, attribute: 'heading-level' },
  };
  static override styles = [foundationStyles, blockHostStyles, selectionStyles];
  declare value: string;
  declare label: string;
  declare disabled: boolean;
  declare headingLevel: number;
  private readonly model = createDisclosureModel(false);
  // An equal public assignment can still supersede an in-flight proposal.
  private authorRevision = 0;
  private presentedOpen = false;
  /** @internal Set only by the immediate accordion group. */
  private owner?: AccordionOwner;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.disabled = false;
    this.headingLevel = 3;
    new SignalController(this, () => this.model.view.get());
  }

  /** Whether section content is expanded. Author writes are silent. */
  get open(): boolean { return this.model.open.get(); }
  set open(value: boolean) {
    this.authorRevision += 1;
    const previous = this.presentedOpen;
    this.model.setOpen(Boolean(value));
    this.presentedOpen = this.open;
    this.requestUpdate('open', previous);
  }

  /** @internal */
  setOwner(owner?: AccordionOwner): void { this.owner = owner; }

  /** Focus the section's native trigger without revealing internal DOM. */
  override focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLButtonElement>('button')?.focus(options);
  }

  /** Request expansion; a grouped item delegates its single proposal to en-accordion. Disabled requests are canceled. */
  requestOpen(open: boolean): ChangeOutcome { return this.changeOpen(Boolean(open), 'api'); }

  private toggle(): void {
    if (this.disabled) return;
    if (this.owner) this.owner.toggleItem(this);
    else this.changeOpen(!this.open, 'toggle');
  }

  private changeOpen(open: boolean, reason: string): ChangeOutcome {
    if (this.disabled) return 'canceled';
    if (this.owner) return this.owner.requestItemOpen(this, open, reason);
    const parent = this.parentNode;
    return dispatchChange(this, {
      previous: this.open, proposed: open, reason,
      getRevision: () => this.authorRevision,
      canCommit: () => this.isConnected && this.parentNode === parent && !this.disabled && !this.owner,
      stage: next => { this.model.setOpen(next); },
      rollback: prior => { this.model.setOpen(prior); },
      commit: () => {
        const previous = this.presentedOpen;
        this.presentedOpen = this.open;
        this.requestUpdate('open', previous);
      },
    });
  }

  protected override updated(changed: PropertyValues): void {
    // A programmatic collapse must not leave keyboard focus hidden in its panel.
    if (changed.has('open') && !this.presentedOpen) {
      const panel = this.renderRoot.querySelector('#panel');
      const focused = this.ownerDocument.activeElement;
      if (focused && panel?.contains(focused)) this.focus();
      else if (focused && this.contains(focused) && focused.slot !== 'heading' && focused.slot !== 'label') this.focus();
    }
  }

  protected override render() {
    const headingLevel = Math.max(1, Math.min(6, Math.trunc(this.headingLevel) || 3));
    return accordionItemTemplate({ open: this.presentedOpen, disabled: this.disabled, label: this.label, headingLevel }, () => this.toggle());
  }
}

declare global { interface HTMLElementTagNameMap { 'en-accordion-item': EnAccordionItem; } }
