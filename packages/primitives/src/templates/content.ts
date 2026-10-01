import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

/** Trusted authored content; string and number values are escaped by Lit. */
export type Content = TemplateResult | string | number | null | undefined | typeof nothing;
export type CollectionLayout = 'grid' | 'list';
export type ContentListType = 'unordered' | 'ordered';
export type EmptyStateKind = 'empty' | 'no-results' | 'unavailable';

export interface ContentCollectionOptions<Item> {
	/** Accessible list name. A surrounding fieldset/legend names a selection group separately. */
	readonly label: string;
	readonly layout?: CollectionLayout;
	/** Native list semantics. Changing this replaces the list; layout changes retain its nodes. */
	readonly type?: ContentListType;
	/** Ordered-list numbering only; omitted start preserves the browser's reversed-list default. */
	readonly start?: number;
	readonly reversed?: boolean;
	readonly items: readonly Item[];
	/** Stable, unique, nonempty identity. Never derive it from the current index or visible label. */
	readonly key: (item: Item) => string;
	/** Content for one native li; native content and registered en-card are both supported. */
	readonly renderItem: (item: Item) => Content;
}

export interface ContentPlaceholderOptions {
	/** Prepare retained authored fields for an enclosing .en-content-loading[aria-busy="true"] region. */
	readonly placeholders?: boolean;
}

export interface FileCardOptions extends ContentPlaceholderOptions {
	/** Visible name; supply an appropriate native heading or associated selection label when needed. */
	readonly name: Content;
	readonly description?: Content;
	/** Authored image, icon or other preview; consumers own alternatives and loading/failure behavior. */
	readonly media?: Content;
	/** Authored replacement when media is absent, never an inferred image-load error. */
	readonly mediaFallback?: Content;
	/** Visible availability message; never implicitly disables consumer-owned actions. */
	readonly availability?: Content;
	readonly metadata?: Content;
	/** Selection control only. Keep actions outside its label. */
	readonly selection?: Content;
	readonly actions?: Content;
	/** Paint only: the consumer's actual control owns checked/selected semantics. */
	readonly selected?: boolean;
}

export interface MetadataItem {
	readonly label: Content;
	readonly value: Content;
}
export interface MetadataListOptions extends ContentPlaceholderOptions { readonly items: readonly MetadataItem[]; }
export interface EmptyStateOptions extends ContentPlaceholderOptions {
	/** Presentation context only. Copy, recovery policy and announcements remain authored. */
	readonly kind?: EmptyStateKind;
	readonly media?: Content;
	/** Supply an appropriate heading if this message introduces a section. */
	readonly title: Content;
	readonly description?: Content;
	/** Real contextual recovery/start actions; this recipe invents no callback or destination. */
	readonly actions?: Content;
}

const present = (content: Content): boolean => content !== undefined && content !== null && content !== nothing && content !== '';
const contentOrNothing = (content: Content): Content => present(content) ? content : nothing;

/** Retain authored flow content and cover its exact box during an enclosing busy region.
 * Register en-skeleton in the consuming application. This helper owns no loading/focus policy.
 * Text uses the inherited line rhythm; rectangle is suitable for media and actions.
 */
export function contentPlaceholderTemplate(content: Content, shape: 'text' | 'rectangle' = 'text'): TemplateResult {
	return html`<div class="en-content-placeholder" data-shape=${shape}>
		<div class="en-content-placeholder__content">${contentOrNothing(content)}</div>
		<en-skeleton class="en-content-placeholder__skeleton" shape="rectangle" aria-hidden="true"></en-skeleton>
	</div>`;
}
const placeholderContent = (content: Content, enabled: boolean, shape: 'text' | 'rectangle' = 'text'): Content => enabled ? contentPlaceholderTemplate(content, shape) : contentOrNothing(content);

/** A native content list, never an ARIA grid/listbox; changing layout retains keyed li nodes. */
export function contentCollectionTemplate<Item>({ label, layout = 'grid', type = 'unordered', start, reversed = false, items, key, renderItem }: ContentCollectionOptions<Item>): TemplateResult {
	if (type !== 'unordered' && type !== 'ordered') throw new TypeError('Content list type must be unordered or ordered.');
	if (start !== undefined && !Number.isSafeInteger(start)) throw new TypeError('Ordered list start must be a safe integer.');
	if (layout !== 'grid' && layout !== 'list') throw new TypeError('Collection layout must be grid or list.');
	const seen = new Set<string>();
	const entries = items.map(item => {
		const identity = key(item);
		if (typeof identity !== 'string' || !identity || seen.has(identity)) throw new TypeError('Collection keys must be unique nonempty strings.');
		seen.add(identity);
		return { item, identity };
	});
	const children = repeat(entries, entry => entry.identity, entry => html`<li class="en-content-collection__item">${contentOrNothing(renderItem(entry.item))}</li>`);
	if (type === 'ordered') return html`<ol class="en-content-collection" data-layout=${layout} aria-label=${label} start=${start ?? nothing} ?reversed=${reversed}>
		${children}
	</ol>`;
	return html`<ul class="en-content-collection" data-layout=${layout} aria-label=${label} role="list">
		${children}
	</ul>`;
}

/** Native content surface. It adds no link, button, selection behavior or heading hierarchy. */
export function fileCardTemplate({ name, description, media, mediaFallback, availability, metadata, selection, actions, selected = false, placeholders = false }: FileCardOptions): TemplateResult {
	const preview = present(media) ? media : mediaFallback;
	return html`<div class="en-card en-file-card" data-selected=${selected ? '' : nothing}>
		${present(preview) ? html`<div class="en-file-card__media">${placeholderContent(preview, placeholders, 'rectangle')}</div>` : nothing}
		<div class="en-file-card__body">
			${present(selection) ? html`<div class="en-file-card__selection">${placeholderContent(selection, placeholders, 'rectangle')}</div>` : nothing}
			<div class="en-file-card__content">
				<div class="en-file-card__name">${placeholderContent(name, placeholders)}</div>
				${present(description) ? html`<div class="en-file-card__description">${placeholderContent(description, placeholders)}</div>` : nothing}
				${present(availability) ? html`<div class="en-file-card__availability">${placeholderContent(availability, placeholders)}</div>` : nothing}
				${present(metadata) ? html`<div class="en-file-card__metadata">${metadata}</div>` : nothing}
			</div>
		</div>
		${present(actions) ? html`<div class="en-file-card__actions">${placeholderContent(actions, placeholders, 'rectangle')}</div>` : nothing}
	</div>`;
}

/** Definition-list metadata. Labels, values, number/date formatting and links remain authored. */
export function metadataListTemplate({ items, placeholders = false }: MetadataListOptions): TemplateResult {
	return html`<dl class="en-content-metadata">
		${items.map(item => html`<div class="en-content-metadata__item"><dt>${placeholderContent(item.label, placeholders)}</dt><dd>${placeholderContent(item.value, placeholders)}</dd></div>`)}
	</dl>`;
}

/** Ordinary in-flow content: no alert/live role, focus movement, inferred status or automatic action. */
export function emptyStateTemplate({ title, description, actions, media, kind = 'empty', placeholders = false }: EmptyStateOptions): TemplateResult {
	if (!['empty', 'no-results', 'unavailable'].includes(kind)) throw new TypeError('Empty state kind must be empty, no-results or unavailable.');
	return html`<div class="en-content-empty" data-kind=${kind}>
		${present(media) ? html`<div class="en-content-empty__media">${placeholderContent(media, placeholders, 'rectangle')}</div>` : nothing}
		<div class="en-content-empty__title">${placeholderContent(title, placeholders)}</div>
		${present(description) ? html`<div class="en-content-empty__description">${placeholderContent(description, placeholders)}</div>` : nothing}
		${present(actions) ? html`<div class="en-content-empty__actions">${placeholderContent(actions, placeholders, 'rectangle')}</div>` : nothing}
	</div>`;
}
