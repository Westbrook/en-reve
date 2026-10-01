import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

/** Author-controlled, noninteractive phrasing content; strings are escaped by Lit. */
export type NavigationLabel = TemplateResult | string;
export type NavigationCurrent = 'page' | 'location';

export interface NavigationItem {
	readonly href: string;
	readonly label: NavigationLabel;
	/** The application identifies the current page or location; URLs are never inferred. */
	readonly current?: NavigationCurrent;
	readonly target?: string;
	/** Explicit relationships; an omitted or empty rel defaults to noopener for _blank. */
	readonly rel?: string;
}

export interface SectionNavigationOptions {
	/** Accessible name of this navigation landmark. */
	readonly label: string;
	readonly items: readonly NavigationItem[];
	/** Opt into sticky presentation; false leaves positioning to the containing application. */
	readonly sticky?: boolean;
}

export interface BreadcrumbItem extends Omit<NavigationItem, 'href'> {
	/** Omit href to render plain text, commonly for the current page. */
	readonly href?: string;
}

export interface BreadcrumbOptions {
	readonly label: string;
	/** Ancestor-to-current document order, including in RTL. */
	readonly items: readonly BreadcrumbItem[];
}

export interface SkipLinkOptions {
	/** A native destination, ordinarily a fragment ID in the consuming document. */
	readonly href: string;
	readonly label: NavigationLabel;
}

function linkTemplate(item: NavigationItem): TemplateResult {
	const rel = item.rel?.trim() || (item.target?.toLowerCase() === '_blank' ? 'noopener' : undefined);
	return html`
		<a
			part="link"
			class="en-navigation-link"
			href=${item.href}
			aria-current=${ifDefined(item.current)}
			target=${ifDefined(item.target)}
			rel=${ifDefined(rel)}
		><span part="label">${item.label}</span></a>
	`;
}

/** Pure native page/section navigation: no routing, link interception or selection state. */
export function sectionNavigationTemplate({ label, items, sticky = false }: SectionNavigationOptions): TemplateResult {
	return html`
		<nav part="base" class=${sticky ? 'en-section-nav en-section-nav--sticky' : 'en-section-nav'} aria-label=${label}>
			${items.map(item => linkTemplate(item))}
		</nav>
	`;
}

/** Native breadcrumb landmark with an ordered, consumer-supplied path. */
export function breadcrumbTemplate({ label, items }: BreadcrumbOptions): TemplateResult {
	return html`
		<nav part="base" class="en-breadcrumbs" aria-label=${label}>
			<ol part="list" class="en-breadcrumbs__list" role="list">
				${items.map((item, index) => html`
					<li part="item" class="en-breadcrumbs__item">
						${index ? html`<span part="separator" class="en-breadcrumbs__separator" aria-hidden="true">/</span>` : nothing}
						${item.href === undefined
							? html`<span part="label" class="en-breadcrumbs__label" aria-current=${ifDefined(item.current)}>${item.label}</span>`
							: linkTemplate({ ...item, href: item.href })}
					</li>
				`)}
			</ol>
		</nav>
	`;
}

/** Native bypass link; its application owns the destination and focus context. */
export function skipLinkTemplate({ href, label }: SkipLinkOptions): TemplateResult {
	return html`<a class="en-skip-link" href=${href}>${label}</a>`;
}
