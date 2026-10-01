import { pressStyles } from './internal/press.js';
import { pressRecipes } from './internal/press-recipes.js';
import { fieldBorderWidth, fieldInvalidWidth, fieldRadius } from './internal/field-presentation.js';
import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { nativeSurfaceMotion } from './internal/surface-motion.js';
import { sizedStyles } from './internal/sizing.js';
import { optionPaint } from './internal/option-paint.js';
import { focusVisibleStylesFor, focusStylesFor, focusExtent } from './internal/focus.js';
import { token as t, override as o } from './internal/values.js';

const optionListRadius = o('--en-option-list-radius', o('--en-overlay-radius', t('--en-radius-container')));
const optionListPadding = css`max(${o('--en-option-list-padding', o('--en-overlay-padding', t('--en-space-1')))}, ${focusExtent({family:'option',inset:true})})`;

const inputPadding = o('--en-input-inline-padding', o('--en-control-inline-padding', t('--en-space-control-inline')));

/** Editable selection geometry. Native input styling comes from controlStyles. */
export const comboboxStyles = sizedStyles(css`
	.en-combobox {
		--_en-combobox-trigger-size: ${controlTargetSize()};
		position: relative;
		min-inline-size: 0;
	}
	.en-combobox-input {
		padding-inline-end: calc(${inputPadding} + var(--_en-combobox-trigger-size));
	}
	.en-combobox-anchor { position: relative; min-inline-size: 0; }
	.en-combobox-input:is([aria-invalid='true'], :user-invalid) {
		padding-inline-end: max(0px, calc(${inputPadding} + var(--_en-combobox-trigger-size) + ${fieldBorderWidth} - ${fieldInvalidWidth}));
	}
	/* A query is unfinished selection, not an announced error. Keep native
	   submission validity while aligning its paint with explicit field feedback. */
	.en-combobox-input:user-invalid:not([aria-invalid='true']) {
		border-color: ${o('--en-control-border-color', t('--en-color-boundary'))};
		border-width: ${fieldBorderWidth};
		padding-block: ${t('--en-space-control-block')};
		padding-inline: ${inputPadding};
		padding-inline-end: calc(${inputPadding} + var(--_en-combobox-trigger-size));
	}
	.en-combobox-trigger {
		position: absolute;
		inset-block: ${fieldBorderWidth};
		inset-inline-end: ${fieldBorderWidth};
		display: grid;
		place-items: center;
		inline-size: var(--_en-combobox-trigger-size);
		padding: 0;
		border: 0;
		border-radius: max(0px, ${fieldRadius} - ${t('--en-border-width')});
		background: transparent;
		color: ${t('--en-color-text-muted')};
		cursor: pointer;
	}
	@media (hover: hover) { .en-combobox-trigger:not(:disabled):hover { color: ${t('--en-color-text')}; background: ${t('--en-color-selected')}; } }
	.en-combobox-trigger:not(:disabled):active { color: ${t('--en-color-text')}; background: ${t('--en-color-accent-subtle')}; }
	.en-combobox-trigger:disabled { cursor: default; }
	.en-combobox-trigger svg, .en-combobox-check { inline-size: ${t('--en-size-icon')}; block-size: ${t('--en-size-icon')}; flex: none; }
	${focusStylesFor(css`.en-combobox-trigger`,{family:'button',inset:true,halo:false})}
	.en-combobox-popup {
		position: fixed;
		visibility: var(--_en-combobox-visibility, hidden);
		inset: auto;
		left: var(--_en-combobox-x, 0px);
		top: var(--_en-combobox-y, 0px);
		inline-size: var(--_en-combobox-width, auto);
		margin: 0;
		box-sizing: border-box;
		min-inline-size: 0;
		max-inline-size: calc(100vw - ${t('--en-space-4')});
		max-block-size: min(var(--_en-combobox-max-height, 100dvh), ${o('--en-option-list-max-block-size', o('--en-overlay-max-block-size', css`min(${t('--en-layout-panel-preferred')}, calc(100dvh - ${t('--en-space-8')}))`))});
		row-gap: ${t('--en-space-1')};
		padding: ${optionListPadding};
		border: ${t('--en-border-width')} solid ${o('--en-option-list-border-color', o('--en-overlay-border-color', t('--en-color-boundary')))};
		border-radius: ${optionListRadius};
		background: ${o('--en-option-list-background', o('--en-overlay-background', t('--en-color-surface-raised')))};
		color: ${o('--en-option-list-color', o('--en-overlay-color', t('--en-color-text')))};
		box-shadow: ${o('--en-option-list-shadow', t('--en-shadow-overlay'))};
		font: ${t('--en-font-input-weight')} ${t('--en-font-input-size')}/${t('--en-font-input-line-height')} ${t('--en-font-input-family')}; font-style: ${t('--en-font-input-style')}; letter-spacing: ${t('--en-font-input-tracking')};
		text-align: start;
		overflow: auto;
		overscroll-behavior: contain;
	}
  .en-combobox-popup[hidden], .en-combobox-popup[popover]:not(:popover-open) { display: none; }
  ${nativeSurfaceMotion(css`.en-combobox-popup[popover]`, css`.en-combobox-popup:popover-open`, css`.en-combobox-popup[popover]:not(:popover-open)`, 'fade')}
	.en-combobox-popup[data-fallback] { visibility: visible; position: static; inline-size: 100%; }
	.en-combobox-listbox { margin: 0; padding: 0; list-style: none; }
	/* Adjacent spacing leaves native list flow and popup display ownership intact. */
	.en-combobox-option + .en-combobox-option { margin-block-start: ${o('--en-option-list-gap', css`0px`)}; }
	.en-combobox-option {
		position: relative;
		display: flex;
		align-items: center;
		gap: ${t('--en-space-icon-label')};
		box-sizing: border-box;
		min-inline-size: 0;
		min-block-size: ${controlTargetSize()};
		padding: ${o('--en-option-block-padding', t('--en-space-control-block'))} ${o('--en-option-inline-padding', inputPadding)};
		border-radius: ${o('--en-option-radius', css`max(0px, ${optionListRadius} - ${optionListPadding} - ${t('--en-border-width')})`)};
		overflow-wrap: anywhere;
		cursor: pointer;
	}
	${optionPaint({
		base: css`.en-combobox-option`,
		selected: css`.en-combobox-option[aria-selected='true']`,
		hover: css`.en-combobox-option:not([aria-disabled='true']):hover`,
		active: css`.en-combobox-option:not([aria-disabled='true'])[data-active]`,
		pressed: css`.en-combobox-option:not([aria-disabled='true']):active`,
		disabled: css`.en-combobox-option[aria-disabled='true']`,
		restBackground: css`transparent`, restColor: o('--en-option-list-color', o('--en-overlay-color', t('--en-color-text'))),
		selectedColor: o('--en-option-list-color', o('--en-overlay-color', t('--en-color-text'))), hoverBackground: t('--en-color-surface-subtle'),
	})}
	.en-combobox-option[data-active] { z-index: 1; }
	${focusVisibleStylesFor(css`.en-combobox-option[data-active]`,{family:'option',inset:true,restSelector:css`.en-combobox-option`})}
	.en-combobox-check { margin-inline-start: auto; visibility: hidden; }
	.en-combobox-option[aria-selected='true'] .en-combobox-check { visibility: inherit; }
	.en-combobox-option[aria-disabled='true'] { cursor: default; }
	.en-combobox-status { margin: 0; padding: ${t('--en-space-control-block')} ${inputPadding}; color: ${t('--en-color-text-muted')}; overflow-wrap: anywhere; }
	.en-combobox-status:empty { display: none; }
	/* An always-present, empty live region has no initial footprint. Once used,
	   retain its measured minimum through this open session to avoid layout loops. */
	.en-field > .en-combobox-space-status:not(:first-child) { margin: 0; }
	.en-combobox-space-status {
		min-block-size: var(--_en-combobox-space-reserve, 0px);
		padding: 0; font-size: ${t('--en-font-ui-size')}; line-height: ${t('--en-font-body-line-height')};
		color: ${t('--en-color-text-muted')}; overflow-wrap: anywhere;
	}
	.en-combobox-space-status:not(:empty) { padding-block-start: var(--_en-field-gap); }
	@media (any-pointer: coarse) {
		.en-combobox { --_en-combobox-trigger-size: ${controlTargetSize(true)}; }
		.en-combobox-option { min-block-size: ${controlTargetSize(true)}; }
	}
	@media (forced-colors: active) {
		.en-combobox-popup { color: CanvasText; background: Canvas; border-color: CanvasText; box-shadow: none; }
		.en-combobox-trigger { color: ButtonText; }
		.en-combobox-option { color: CanvasText; background: Canvas; }
		.en-combobox-option[aria-selected='true'] { color: HighlightText; background: Highlight; }
		.en-combobox-option[data-active] { outline-color: Highlight; }
		.en-combobox-option[aria-selected='true'][data-active] { outline-color: HighlightText; }
		.en-combobox-option[aria-disabled='true'], .en-combobox-trigger:disabled { color: GrayText; }
		.en-combobox-status, .en-combobox-space-status { color: CanvasText; }
	}
  ${pressStyles(css`.en-combobox-trigger`, css`.en-combobox-trigger:not(:disabled):not([data-press='none']):active`, pressRecipes['combobox-trigger'])}
`);
