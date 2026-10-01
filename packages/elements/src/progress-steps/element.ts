import { FormChildrenController, FORM_SLOT_PREFIX, normalizeProgressItems } from '@en-reve/primitives/interactions/form-children.js';
import { html, nothing, css, type PropertyValues } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { buttonStyles } from '@en-reve/styles/buttons.js';
import { formNavigationStyles } from '@en-reve/styles/form-navigation.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';

export interface ProgressStep {
	readonly value: string;
	readonly label: string;
	readonly status?: 'pending' | 'complete' | 'error';
	readonly disabled?: boolean;
}
/**
 * Ordered workflow navigation. Validation, completion and panel ownership stay with the app.
 * @tagname en-progress-steps
 * @slot - Direct en-progress-step descriptors; children take precedence over items.
 * @csspart error - Invalid child-authoring feedback.
 * @slot step-{value} - Optional noninteractive label content for an item, falling back to its label.
 * @slot summary - Optional noninteractive compact summary; fallback uses localized summaryLabel and current item label.
 * @csspart disclosure - Native compact disclosure container for the shared step list.
 * @csspart disclosure-control - Compact disclosure control.
 * @csspart base - Labelled native navigation.
 * @csspart list - Responsive ordered step list.
 * @csspart item - One list item.
 * @csspart control - Native step button, or static surface in read-only mode.
 * @csspart number - One-based step number.
 * @csspart label - Step label.
 * @csspart status - Textual current/completion/error state.
 * @cssprop --en-progress-steps-gap - Space between steps; falls back to shared action spacing.
 * @cssprop --en-button-radius - Shared button shape.
 * @cssprop --en-button-background - Shared step button fill.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<string>} en-change - Tentative current value is exposed during dispatch. Cancel to restore it; explicit author writes win.
 */
export class EnProgressSteps extends EnElement {
	static override properties = { value: { noAccessor: true }, items: { attribute: false }, label: {}, disabled: { type: Boolean }, readOnly: { type: Boolean, attribute: 'readonly' }, currentLabel: { attribute: 'current-label' }, completeLabel: { attribute: 'complete-label' }, errorLabel: { attribute: 'error-label' }, pendingLabel: { attribute: 'pending-label' }, summaryLabel: { attribute: 'summary-label' }, completedLabel: { attribute: 'completed-label' } };
	static override styles = [foundationStyles, blockHostStyles, buttonStyles, formNavigationStyles, css`:host { container: en-steps / inline-size; }`];
	private readonly childSteps = new FormChildrenController(this, 'steps');
	private currentValue = '';
	private revision = 0;
	private resizeObserver?: ResizeObserver;
	private wasCompact = false;
	/** Compact count pattern. {current} and {total} are replaced with step counts. */
	declare summaryLabel: string;
	/** Compact summary when every step is complete. {total} is replaced with the count. */
	declare completedLabel: string;
	private recovery?: { element: HTMLButtonElement; index: number };
	/** Unique nonblank string values and localized labels. Invalid arrays render the error part without a partial list. Replace the array to update; completion is never inferred. */
	declare items: readonly ProgressStep[];
	/** Accessible navigation name. */
	declare label: string;
	/** Disable all navigation while retaining current state. */
	declare disabled: boolean;
	/** Render an ordered status display without interactive buttons. */
	declare readOnly: boolean;
	/** Localized current-step text. */
	declare currentLabel: string;
	/** Localized completed-step text. */
	declare completeLabel: string;
	/** Localized error-step text. */
	declare errorLabel: string;
	/** Localized pending-step text. */
	declare pendingLabel: string;
	/** Current step key. Unknown/removed keys show no current step; application writes are silent. */
	get value(): string { return this.currentValue; }
	set value(value: string) { ++this.revision; this.setValue(String(value ?? '')); }
	private setValue(value: string) { const old = this.currentValue; this.currentValue = value; this.requestUpdate('value', old); }
	constructor() { super(); this.items = []; this.label = 'Progress'; this.disabled = false; this.readOnly = false; this.currentLabel = 'Current'; this.completeLabel = 'Complete'; this.errorLabel = 'Needs attention'; this.pendingLabel = 'Not completed'; this.summaryLabel = 'Step {current} of {total}'; this.completedLabel = 'All {total} steps complete'; }
	private dataError = '';
	private get steps(): readonly (ProgressStep & {key?: string})[] {
		this.dataError = '';
		if (this.childSteps.view.active) return this.childSteps.view.items.filter(item => !item.hidden);
		try { return normalizeProgressItems(this.items); }
		catch (error) { this.dataError = error instanceof Error ? error.message : 'Invalid progress items.'; return []; }
	}
	private allowed(value: string) { const children = this.childSteps.current(); let items: readonly ProgressStep[]; try { items = children.active ? children.items.filter(item => !item.hidden) : normalizeProgressItems(this.items); } catch { return false; } return !children.error && !this.disabled && !this.readOnly && items.some(item => item.value === value && !item.disabled); }
	private choose(value: string) {
		if (!this.allowed(value)) return;
		const outcome = dispatchChange(this, { previous: this.value, proposed: value, reason: 'activate', getRevision: () => this.revision,
			stage: next => this.setValue(next), rollback: previous => this.setValue(previous), canCommit: next => this.allowed(next) });
		if (outcome !== 'canceled') this.closeDisclosure();
	}
	private get compact(): boolean {
		const disclosure = this.renderRoot.querySelector('details');
		return Boolean(disclosure && this.ownerDocument.defaultView?.getComputedStyle(disclosure).display !== 'none');
	}
	private closeDisclosure() {
		const details = this.renderRoot.querySelector('details');
		if (!details || !this.compact) return;
		const focusedInside = Boolean(this.shadowRoot?.activeElement && this.renderRoot.querySelector('nav')?.contains(this.shadowRoot.activeElement));
		details.open = false;
		if (focusedInside) details.querySelector('summary')?.focus({ preventScroll: true });
	}
	private recoverResponsiveFocus = (event: FocusEvent) => {
		if (event.relatedTarget) return;
		const target = event.target as HTMLElement;
		const compact = this.compact;
		// Chromium may blur a newly hidden control before ResizeObserver runs.
		if (target.localName === 'button' && compact && !this.wasCompact) {
			const details = this.renderRoot.querySelector('details');
			if (details) details.open = true;
			target.focus({ preventScroll: true });
		} else if (target.localName === 'summary' && !compact) {
			(this.renderRoot.querySelector<HTMLElement>('button[aria-current="step"]:not(:disabled), button:not(:disabled)') ?? this.renderRoot.querySelector<HTMLElement>('nav'))?.focus({ preventScroll: true });
		}
	};
	private observeSize() {
		this.resizeObserver?.disconnect();
		this.wasCompact = this.compact;
		const Observer = this.ownerDocument.defaultView?.ResizeObserver;
		if (!Observer) return;
		this.resizeObserver = new Observer(() => {
			const active = this.shadowRoot?.activeElement;
			this.wasCompact = this.compact;
			const details = this.renderRoot.querySelector('details');
			if (!active || !details) return;
			// Never hide the focused control when the container changes layout.
			if (this.compact && active.localName === 'button') details.open = true;
			else if (!this.compact && active.localName === 'summary')
				(this.renderRoot.querySelector<HTMLElement>('button[aria-current="step"]:not(:disabled), button:not(:disabled)') ?? this.renderRoot.querySelector<HTMLElement>('nav'))?.focus({ preventScroll: true });
		});
		this.resizeObserver.observe(this);
	}
	override connectedCallback() { super.connectedCallback(); if (this.hasUpdated) this.observeSize(); }
	override disconnectedCallback() { this.resizeObserver?.disconnect(); super.disconnectedCallback(); }
	protected override firstUpdated() { this.observeSize(); }
	protected override willUpdate(changed: PropertyValues) {
		super.willUpdate(changed);
		const active = this.shadowRoot?.activeElement as HTMLButtonElement | null;
		if (active?.localName === 'button') this.recovery = { element: active, index: [...this.renderRoot.querySelectorAll('button')].indexOf(active) };
	}
	protected override updated() {
		const recovery = this.recovery; this.recovery = undefined;
		if (!recovery || (recovery.element.isConnected && !recovery.element.disabled)) return;
		if (this.shadowRoot?.activeElement && this.shadowRoot.activeElement !== recovery.element) return;
		const controls = [...this.renderRoot.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
		(controls[Math.min(recovery.index, controls.length - 1)] ?? this.renderRoot.querySelector<HTMLElement>('nav'))?.focus({ preventScroll: true });
	}
	protected override render() {
		const steps = this.steps;
		const current = steps.findIndex(item => item.value === this.value);
		const allComplete = steps.length > 0 && steps.every(item => item.status === 'complete');
		const count = (allComplete ? this.completedLabel : this.summaryLabel).replaceAll('{current}', current < 0 ? '–' : String(current + 1)).replaceAll('{total}', String(steps.length));
		return html`<nav @focusout=${this.recoverResponsiveFocus} part="base" tabindex="-1" aria-label=${this.label} @keydown=${(event: KeyboardEvent) => { if (event.key === 'Escape' && this.compact) { event.preventDefault(); this.closeDisclosure(); } }}><details class="en-progress-disclosure" part="disclosure">
			<summary aria-controls="step-list" class="en-button en-progress-summary" part="disclosure-control" data-variant="secondary"><span><slot name="summary">${count}${!allComplete && current >= 0 ? html` · ${steps[current].label}` : nothing}</slot></span><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></summary>
		</details><ol id="step-list" class="en-progress-steps" part="list">${repeat(this.steps, item => item.key ?? item.value, (item, index) => {
			const current = item.value === this.value;
			const status = [current ? this.currentLabel : '', item.status === 'error' ? this.errorLabel : item.status === 'complete' ? this.completeLabel : current ? '' : this.pendingLabel].filter(Boolean).join(' · ');
			const content = html`<span part="number" class="en-progress-step__number" aria-hidden="true">${index + 1}</span><span class="en-progress-step__text"><span part="label"><slot name=${item.key ? `${FORM_SLOT_PREFIX}${item.key}` : `step-${item.value}`}>${item.label}</slot></span><span part="status" class="en-progress-step__status">${status}</span></span>`;
			return html`<li part="item">${this.readOnly ? html`<span class="en-progress-step en-progress-step--static" part="control" data-variant=${current ? 'primary' : 'secondary'} aria-current=${current ? 'step' : nothing} data-status=${item.status ?? 'pending'}>${content}</span>` : html`<button type="button" class="en-button en-progress-step" part="control" data-variant=${current ? 'primary' : 'secondary'} aria-current=${current ? 'step' : nothing} data-status=${item.status ?? 'pending'} ?disabled=${this.disabled || item.disabled} @click=${() => this.choose(item.value)}>${content}</button>`}</li>`;
		})}</ol>${(this.childSteps.view.error || this.dataError) ? html`<p part="error">${this.childSteps.view.error || this.dataError}</p>` : nothing}</nav>`;
	}
}
declare global { interface HTMLElementTagNameMap { 'en-progress-steps': EnProgressSteps; } }
