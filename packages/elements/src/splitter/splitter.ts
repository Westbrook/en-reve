import { splitterTemplate } from './template.js';
import { getSplitterOwner } from './owner.js';
import { css } from 'lit';
import { EnElement } from '../internal/en-element.js';
import type { PropertyValues } from 'lit';
import { createValueModel } from '@en-reve/primitives/state/value.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { layoutStyles } from '@en-reve/styles/surfaces.js';

interface DragSession {
  pointerId: number;
  start: number;
  value: number;
  extent: number;
  reverse: boolean;
}

/**
 * A focusable resize separator. value/min/max use percentages of the primary pane.
 * Arrow keys change value by step; Shift uses ten steps; Home/End reach bounds.
 * Dragging begins only on this handle. The handle's parent defines the resize extent.
 * @tagname en-splitter
 * @csspart base - Resize handle surface.
 * @csspart grip - Visible grip.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<number>>} en-change - Cancelable tentative size percentage; cancellation restores the previous size unless superseded.
 */
export class EnSplitter extends EnElement {
  static override properties = {
    value: { type: Number, reflect: true, noAccessor: true },
    min: { type: Number }, max: { type: Number }, step: { type: Number },
    orientation: { type: String, reflect: true },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };
  static override styles = [foundationStyles, blockHostStyles, layoutStyles, css`
    :host { display: block; touch-action: none; user-select: none; min-inline-size: 0; min-block-size: 0; }
    :host([orientation="vertical"]) { cursor: col-resize; }
    :host([orientation="horizontal"]) { cursor: row-resize; }
    :host([disabled]) { cursor: default; touch-action: auto; }
    .en-split-separator { inline-size: 100%; block-size: 100%; }
  `];
  declare min: number;
  declare max: number;
  declare step: number;
  declare orientation: 'horizontal' | 'vertical';
  declare label: string;
  declare disabled: boolean;
  private readonly model = createValueModel(50);
  // An equal public assignment can still supersede an in-flight proposal.
  private authorRevision = 0;
  private presentedValue = 50;
  private drag?: DragSession;

  constructor() {
    super();
    this.min = 10;
    this.max = 90;
    this.step = 1;
    this.orientation = 'vertical';
    this.label = 'Resize panels';
    this.disabled = false;
    new SignalController(this, () => this.model.view.get());
  }

  get value(): number { return this.model.value.get(); }
  set value(value: number) {
    this.authorRevision += 1;
    const previous = this.presentedValue;
    const next = this.clamp(Number(value));
    this.model.set(next);
    this.presentedValue = this.value;
    this.requestUpdate('value', previous);
  }

  private get bounds(): { min: number; max: number } {
    const min = Math.max(0, Math.min(100, Number.isFinite(this.min) ? this.min : 10));
    const max = Math.max(min, Math.min(100, Number.isFinite(this.max) ? this.max : 90));
    return { min, max };
  }

  private clamp(value: number): number {
    const { min, max } = this.bounds;
    return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 50));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('pointerdown', this.onPointerDown);
    this.addEventListener('pointermove', this.onPointerMove);
    this.addEventListener('pointerup', this.onPointerEnd);
    this.addEventListener('pointercancel', this.onPointerEnd);
    this.addEventListener('lostpointercapture', this.onLostCapture);
  }

  override disconnectedCallback(): void {
    this.endDrag();
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('pointerdown', this.onPointerDown);
    this.removeEventListener('pointermove', this.onPointerMove);
    this.removeEventListener('pointerup', this.onPointerEnd);
    this.removeEventListener('pointercancel', this.onPointerEnd);
    this.removeEventListener('lostpointercapture', this.onLostCapture);
    super.disconnectedCallback();
  }

  private propose(value: number, reason: 'keyboard' | 'pointer'): void {
    const proposed = this.clamp(value);
    if (proposed === this.value) return;
    const owner = getSplitterOwner(this);
    if (owner) {
      owner(proposed, reason);
      return;
    }
    dispatchChange(this, {
      previous: this.value, proposed, reason,
      getRevision: () => this.authorRevision,
      stage: next => { this.model.set(next); },
      rollback: prior => { this.model.set(prior); },
      canCommit: next => !this.disabled && next === this.clamp(next),
      commit: () => {
        const previous = this.presentedValue;
        this.presentedValue = this.value;
        this.requestUpdate('value', previous);
        this.syncSemantics();
      },
    });
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const { min, max } = this.bounds;
    const step = (Number.isFinite(this.step) && this.step > 0 ? this.step : 1) * (event.shiftKey ? 10 : 1);
    const rtl = this.orientation === 'vertical' && this.ownerDocument.defaultView?.getComputedStyle(this).direction === 'rtl';
    let next: number;
    if (event.key === 'Home') next = min;
    else if (event.key === 'End') next = max;
    else if (this.orientation === 'vertical' && event.key === 'ArrowRight') next = this.value + (rtl ? -step : step);
    else if (this.orientation === 'vertical' && event.key === 'ArrowLeft') next = this.value + (rtl ? step : -step);
    else if (this.orientation === 'horizontal' && event.key === 'ArrowDown') next = this.value + step;
    else if (this.orientation === 'horizontal' && event.key === 'ArrowUp') next = this.value - step;
    else return;
    event.preventDefault();
    this.propose(next, 'keyboard');
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.disabled || this.drag || !event.isPrimary || event.button !== 0 || event.defaultPrevented) return;
    const container = this.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const handle = this.getBoundingClientRect();
    const vertical = this.orientation !== 'horizontal';
    const extent = vertical ? rect.width - handle.width : rect.height - handle.height;
    if (extent <= 0) return;
    this.drag = {
      pointerId: event.pointerId,
      start: vertical ? event.clientX : event.clientY,
      value: this.value,
      extent,
      reverse: Boolean(vertical && this.ownerDocument.defaultView?.getComputedStyle(this).direction === 'rtl'),
    };
    this.setPointerCapture(event.pointerId);
    this.focus({ preventScroll: true });
    event.preventDefault();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId || this.disabled) return;
    const position = this.orientation !== 'horizontal' ? event.clientX : event.clientY;
    const delta = ((position - drag.start) / drag.extent) * 100 * (drag.reverse ? -1 : 1);
    this.propose(drag.value + delta, 'pointer');
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    if (this.drag?.pointerId === event.pointerId) this.endDrag();
  };

  private readonly onLostCapture = (event: PointerEvent): void => {
    if (this.drag?.pointerId === event.pointerId) this.drag = undefined;
  };

  private endDrag(): void {
    const pointerId = this.drag?.pointerId;
    this.drag = undefined;
    if (pointerId !== undefined && this.hasPointerCapture(pointerId)) this.releasePointerCapture(pointerId);
  }

  private syncSemantics(): void {
    const { min, max } = this.bounds;
    this.setAttribute('role', 'separator');
    this.setAttribute('aria-orientation', this.orientation);
    this.setAttribute('aria-label', this.label);
    this.setAttribute('aria-valuemin', String(min));
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(Math.round(this.presentedValue * 100) / 100));
    this.setAttribute('aria-disabled', String(this.disabled));
    this.tabIndex = this.disabled ? -1 : 0;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('min') || changed.has('max')) this.value = this.value;
  }

  protected override updated(changed: PropertyValues): void {
    if ((changed.has('disabled') && this.disabled) || changed.has('orientation')) this.endDrag();
    this.syncSemantics();
  }

  protected override render() {
    return splitterTemplate(this.orientation);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-splitter': EnSplitter; } }
