import { FormChildrenController, FORM_SLOT_PREFIX } from '@en-reve/primitives/interactions/form-children.js';
import { html, nothing, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { formNavigationStyles } from '@en-reve/styles/form-navigation.js';
import { dispatchAction } from '@en-reve/primitives/interactions/events.js';

export interface ValidationIssue {
	readonly target: string;
	readonly message: string;
}
/**
 * Application-owned errors with native links and explicit focus. Does not validate or submit forms.
 * @tagname en-validation-summary
 * @slot - Direct native anchors with same-document fragment hrefs; children take precedence over items.
 * @csspart error - Invalid child-authoring feedback.
 * @slot heading - Visible heading, falling back to heading attribute.
 * @csspart description - Slot-owned guidance; inherited text styling, with layout owned by its content.
 * @slot description - Guidance before the error list; assigned content overrides the description attribute/property.
 * @csspart base - Focusable, named summary region.
 * @csspart heading - Summary heading.
 * @csspart list - Error list.
 * @csspart item - Individual issue.
 * @csspart link - Error's field link.
 * @cssprop --en-validation-summary-padding - Summary padding; falls back to panel spacing.
 * @cssprop --en-validation-summary-radius - Summary corners; falls back to panel radius.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<'focus', ValidationIssue>>} en-action - Cancelable focus command with action=focus and data={target,message}. Cancel when the app must reveal a different panel or resolve a target across roots.
 */
export class EnValidationSummary extends EnElement {
	static override properties = { items: { attribute: false }, heading: {useDefault:true}, description: {useDefault:true} };
	static override styles = [foundationStyles, formNavigationStyles, css`:host { display: contents; }`];
	/** Ordered errors using same-root field IDs and the same wording as field errors. Replace the array to update. */
	declare items: readonly ValidationIssue[];
	private readonly childErrors = new FormChildrenController(this, 'errors');
	private focusedLink?: { element: HTMLAnchorElement; index: number };
	private rememberFocus = (event: FocusEvent) => {
		const link = event.composedPath().find(node => (node as Element).localName === 'a') as HTMLAnchorElement | undefined;
		this.focusedLink = link?.parentElement === this ? { element: link, index: this.links.indexOf(link) } : undefined;
	};
	private get links(): HTMLAnchorElement[] { return [...this.querySelectorAll<HTMLAnchorElement>(':scope > a:not([hidden])')]; }
	override connectedCallback() { super.connectedCallback(); this.addEventListener('focusin', this.rememberFocus); }
	override disconnectedCallback() { this.removeEventListener('focusin', this.rememberFocus); this.focusedLink = undefined; super.disconnectedCallback(); }
	protected override updated() {
		const previous = this.focusedLink;
		if (!previous || (previous.element.parentElement === this && !previous.element.hidden)) return;
		this.focusedLink = undefined;
		const root = this.getRootNode() as Document | ShadowRoot;
		const active = root.activeElement;
		// An application may already have focused the corrected field. Only
		// recover when removing the link left focus on the document or host.
		if (active && active !== this && active !== this.ownerDocument.body) return;
		const links = this.links;
		const next = links[Math.min(previous.index, links.length - 1)];
		if (next?.assignedSlot) next.focus({ preventScroll: true });
		else this.focus({ preventScroll: true });
	}
	/** Visible heading fallback; supply localized wording. */
	declare heading: string;
	/** Plain-text guidance fallback; assigned description slot content takes precedence. */
	declare description: string;
	constructor() { super(); this.items = []; this.heading = 'There is a problem'; this.description = ''; }
	/** Move focus to the summary after failed validation and updateComplete. Never called automatically. */
	override focus(options?: FocusOptions): void { this.renderRoot.querySelector<HTMLElement>('[part="base"]')?.focus(options); }
	private activate(event: MouseEvent, item: ValidationIssue) {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
		if (!dispatchAction(this, { action: 'focus', data: item }, { cancelable: true })) { event.preventDefault(); return; }
		const root = this.getRootNode() as Document | ShadowRoot;
		const target = root.getElementById?.(item.target) as HTMLElement | null;
		if (!target || target.closest('[hidden], [inert]')) return;
		event.preventDefault(); target.focus();
	}
	private activateChild(event: MouseEvent, key: string) {
		const item = this.childErrors.current().items.find(item => item.key === key && !item.hidden);
		const link = event.composedPath().find(node => (node as Element).localName === 'a') as HTMLAnchorElement | undefined;
		if (!item || !link || link.parentElement !== this || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
		this.activate(event, {target:item.target, message:item.label});
	}
	protected override render() {
		const children = this.childErrors.view;
		const items = children.items.filter(item => !item.hidden);
		if (!(children.active ? items.length || children.error : this.items.length)) return nothing;
		return html`<section class="en-validation-summary" part="base" tabindex="-1" aria-labelledby="summary-heading">
			<h2 class="en-validation-summary__title" id="summary-heading" part="heading"><slot name="heading">${this.heading}</slot></h2>
			<slot name="description" part="description">${this.description || nothing}</slot>
			<ul class="en-validation-summary__list" part="list">${children.active ? repeat(items, item => item.key, item => html`<li part="item"><slot name=${`${FORM_SLOT_PREFIX}${item.key}`} @click=${(event: MouseEvent) => this.activateChild(event, item.key)}></slot></li>`) : repeat(this.items, (item, index) => `${item.target}-${index}`, item => html`<li part="item"><a part="link" href=${`#${encodeURIComponent(item.target)}`} @click=${(event: MouseEvent) => this.activate(event, item)}>${item.message}</a></li>`)}</ul>${children.error ? html`<p part="error">${children.error}</p>` : nothing}
		</section>`;
	}
}
declare global { interface HTMLElementTagNameMap { 'en-validation-summary': EnValidationSummary; } }
