import { css, unsafeCSS } from 'lit';
import { defaultCSSValue } from '@en-reve/tokens/defaults.js';
import { surfaceStyles } from './surfaces.js';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';

// Container thresholds are compiled from tokens because queries cannot read
// custom properties. Row geometry itself remains locally themeable.
const listActionsWidth = unsafeCSS(defaultCSSValue('--en-layout-panel-preferred'));
const listMetadataWidth = unsafeCSS(defaultCSSValue('--en-layout-form-max'));

/** Native layout/content recipes. Surface paint is the same shared card recipe used by en-card. */
export const contentStyles = css`
	${surfaceStyles}
	${sizedStyles(css`
		/* Each placeholder uses the real authored field as its intrinsic sizing content.
		   The busy region stays in flow; card/list chrome never disappears. */
		.en-content-loading { min-inline-size: 0; }
		.en-content-placeholder { position: relative; min-inline-size: 0; }
		.en-content-placeholder[data-shape='text'] { inline-size: fit-content; max-inline-size: 100%; }
		.en-content-placeholder__content { min-inline-size: 0; }
		.en-content-placeholder__skeleton { display: none; pointer-events: none; font: inherit; }
		.en-content-loading[aria-busy='true'] .en-content-placeholder__content { visibility: hidden; }
		.en-content-loading[aria-busy='true'] .en-content-placeholder__skeleton {
			display: block; position: absolute; inset: 0; inline-size: 100%; block-size: 100%;
			--en-skeleton-size: 100%;
			--en-skeleton-color: ${t('--en-color-line')};
		}
		.en-content-placeholder__skeleton::part(base) { box-sizing: border-box; block-size: 100%; }
		.en-content-placeholder[data-shape='text'] > .en-content-placeholder__skeleton {
			/* The bars follow wrapping and the field's inherited line-height, including metadata. */
			mask-image: repeating-linear-gradient(to bottom, transparent 0, transparent .2lh, #000 .2lh, #000 .8lh, transparent .8lh, transparent 1lh);
		}
		.en-file-card__media > .en-content-placeholder { align-self: stretch; justify-self: stretch; display: grid; place-items: center; }
		.en-file-card__media > .en-content-placeholder > .en-content-placeholder__content { display: grid; place-items: center; inline-size: 100%; }
		.en-file-card__media:has(> .en-content-placeholder) { position: relative; }
		.en-file-card__media:has(> .en-content-placeholder) > .en-content-placeholder { position: static; }
		.en-file-card__media > .en-content-placeholder > .en-content-placeholder__skeleton,
		.en-content-collection[data-layout='list'] .en-file-card__media > .en-content-placeholder > .en-content-placeholder__skeleton { inset: 0; border-radius: inherit; }
		.en-file-card__media .en-content-placeholder__skeleton::part(base) { border-radius: inherit; }
		.en-file-card__actions > .en-content-placeholder, .en-content-empty__actions > .en-content-placeholder { max-inline-size: 100%; }
		.en-file-card__actions > .en-content-placeholder > .en-content-placeholder__content,
		.en-content-empty__actions > .en-content-placeholder > .en-content-placeholder__content { display: flex; flex-wrap: wrap; align-items: center; gap: ${t('--en-space-actions')}; }
		.en-file-card__name .en-content-placeholder__content > :where(h1,h2,h3,h4,h5,h6),
		.en-content-empty__title .en-content-placeholder__content > :where(h1,h2,h3,h4,h5,h6) { margin: 0; }
		.en-file-card__media .en-content-placeholder__content > :where(img,svg,video),
		.en-content-empty__media .en-content-placeholder__content > :where(img,svg,video) { display: block; max-inline-size: 100%; block-size: auto; }
		.en-content-collection {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: ${o('--en-grid-gap', t('--en-space-4'))};
			min-inline-size: 0;
			margin: 0;
			padding: 0;
			list-style: none;
		}
		.en-content-collection[data-layout='grid'] {
			grid-template-columns: repeat(auto-fill, minmax(min(100%, ${o('--en-grid-item-min', t('--en-layout-panel-preferred'))}), 1fr));
		}
		ol.en-content-collection { list-style: decimal; padding-inline-start: ${t('--en-space-6')}; }
		ol.en-content-collection > .en-content-collection__item { display: list-item; }
		.en-content-collection__item::marker { font-variant-numeric: tabular-nums; color: ${t('--en-color-text-muted')}; }
		.en-content-collection__item { display: grid; min-inline-size: 0; align-content: stretch; }
		.en-content-collection__item > * { min-inline-size: 0; }
		.en-content-collection__item > en-card::part(base) { box-sizing: border-box; block-size: 100%; }
		.en-content-collection__item[hidden]:not([hidden="until-found" i]) { display: none !important; }
		.en-file-card { min-inline-size: 0; gap: ${t('--en-space-3')}; }
		.en-file-card[data-selected] {
			border-color: ${t('--en-color-action')};
			box-shadow: inset 0 0 0 ${t('--en-border-width')} ${t('--en-color-action')};
		}
		.en-file-card__body { display: flex; align-items: flex-start; gap: ${t('--en-space-3')}; min-inline-size: 0; }
		.en-file-card__selection { flex: none; }
		.en-file-card__content { flex: 1; display: grid; gap: ${t('--en-space-2')}; min-inline-size: 0; }
		.en-file-card__name { overflow-wrap: anywhere; font-weight: ${t('--en-font-label-strong-weight')}; }
		.en-file-card__name > :where(h1, h2, h3, h4, h5, h6), .en-content-empty__title > :where(h1, h2, h3, h4, h5, h6) { margin: 0; }
		.en-file-card__description, .en-file-card__availability, .en-content-empty__description {
			color: ${t('--en-color-text-muted')};
			font-size: ${t('--en-font-body-size')};
			line-height: ${t('--en-font-body-line-height')};
			overflow-wrap: anywhere;
		}
		.en-file-card__media {
			display: grid;
			place-items: center;
			box-sizing: border-box;
			min-inline-size: 0;
			min-block-size: calc(3 * ${t('--en-size-control-min')});
			padding: ${t('--en-space-3')};
			border: ${t('--en-border-width')} solid ${t('--en-color-line')};
			border-radius: ${o('--en-media-radius', css`max(0px, ${o('--en-surface-radius', t('--en-radius-container'))} - ${o('--en-surface-padding', t('--en-space-panel'))} - ${t('--en-border-width')})`)};
			background: ${t('--en-color-surface-subtle')};
			color: ${t('--en-color-text')};
			overflow-wrap: anywhere;
		}
		.en-content-collection[data-layout='list'] { container: en-content-list / inline-size; }
		.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			align-items: start;
			gap: ${o('--en-file-list-gap', t('--en-space-3'))};
			padding: ${o('--en-file-list-padding', t('--en-space-3'))};
		}
		.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__media {
			inline-size: min(100%, ${o('--en-file-list-media-size', css`calc(2 * ${t('--en-size-control-min')})`)});
			aspect-ratio: 1;
			min-block-size: 0;
			padding: ${t('--en-space-2')};
			border-radius: ${o('--en-media-radius', css`max(0px, ${o('--en-surface-radius', t('--en-radius-container'))} - ${o('--en-file-list-padding', t('--en-space-3'))} - ${t('--en-border-width')})`)};
		}
		.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__actions {
			grid-column: -2 / -1;
			margin-block-start: 0;
		}
		/* Keep the thumbnail compact when enlarged text needs the whole row.
		   This rem-based threshold grows with the reader's text size. */
		@container en-content-list (inline-size >= calc(${listActionsWidth} * 4 / 5)) {
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card:has(> .en-file-card__media) {
				grid-template-columns: minmax(0, ${o('--en-file-list-media-size', css`calc(2 * ${t('--en-size-control-min')})`)}) minmax(0, 1fr);
			}
		}
		@container en-content-list (inline-size >= calc(2 * ${listActionsWidth})) {
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card {
				grid-template-columns: minmax(0, 1fr) auto;
				align-items: center;
			}
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card:has(> .en-file-card__media) {
				grid-template-columns: minmax(0, ${o('--en-file-list-media-size', css`calc(2 * ${t('--en-size-control-min')})`)}) minmax(0, 1fr) auto;
			}
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__actions {
				grid-row: 1;
				justify-self: end;
			}
		}
		@container en-content-list (inline-size >= calc(2 * ${listMetadataWidth})) {
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__body > .en-file-card__content:has(> .en-file-card__metadata) {
				grid-template-columns: minmax(0, 1fr) minmax(0, max-content);
				column-gap: ${o('--en-file-list-metadata-gap', t('--en-space-5'))};
				align-items: center;
			}
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__body > .en-file-card__content > .en-file-card__name,
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__body > .en-file-card__content > .en-file-card__description,
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__body > .en-file-card__content > .en-file-card__availability { grid-column: 1; }
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__body > .en-file-card__content > .en-file-card__metadata { grid-column: 2; grid-row: 1 / span 2; }
			.en-content-collection[data-layout='list'] > .en-content-collection__item > .en-file-card > .en-file-card__body > .en-file-card__content:has(> .en-file-card__description):has(> .en-file-card__availability) > .en-file-card__metadata { grid-row: 1 / span 3; }
		}
		.en-file-card__media > :where(img, svg, video) { display: block; max-inline-size: 100%; block-size: auto; }
		.en-file-card__actions, .en-content-empty__actions {
			display: flex; flex-wrap: wrap; align-items: center; gap: ${t('--en-space-actions')}; min-inline-size: 0;
		}
		.en-file-card__actions { margin-block-start: auto; }
		.en-content-metadata { display: grid; gap: ${t('--en-space-2')}; margin: 0; min-inline-size: 0; }
		.en-content-metadata__item { display: flex; flex-wrap: wrap; gap: ${t('--en-space-1')} ${t('--en-space-3')}; min-inline-size: 0; }
		.en-content-metadata dt { font-weight: ${t('--en-font-label-strong-weight')}; }
		.en-content-metadata dd { margin: 0; overflow-wrap: anywhere; }
		.en-content-metadata dt, .en-content-metadata dd { min-inline-size: 0; overflow-wrap: anywhere; font-size: ${t('--en-font-metadata-size')}; line-height: ${t('--en-font-metadata-line-height')}; }
		.en-content-empty { display: grid; gap: ${t('--en-space-3')}; min-inline-size: 0; padding: ${o('--en-surface-padding', t('--en-space-panel'))}; }
		.en-content-empty__media { min-inline-size: 0; overflow-wrap: anywhere; }
		.en-content-empty__media > :where(img, svg, video) { display: block; max-inline-size: 100%; block-size: auto; }
		.en-content-empty__title { overflow-wrap: anywhere; font-weight: ${t('--en-font-label-strong-weight')}; }
		@media (forced-colors: active) {
			.en-file-card[data-selected] { border-color: Highlight; box-shadow: none; }
			.en-file-card__media { background: Canvas; color: CanvasText; border-color: CanvasText; }
			.en-file-card__description, .en-file-card__availability, .en-content-empty__description { color: CanvasText; }
		}
	`)}
`;
