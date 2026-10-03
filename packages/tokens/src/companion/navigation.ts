import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Finite public anatomy. Recipe data supplies token IDs, never selectors. */
export const navigationTargets = {
  tabs: ['en-tabs'],
  'tab-list': ['.en-tab-list'],
  tab: ['en-tab', '.en-tab'],
  'vertical-tab': ['en-tabs[orientation="vertical"] > en-tab', '.en-tab-list[aria-orientation="vertical"] > .en-tab', '.en-tab-list[data-orientation="vertical"] > .en-tab'],
  'tab-panel': ['en-tab-panel', '.en-tab-panel'],
  'vertical-tab-panel': ['en-tabs[orientation="vertical"] > en-tab-panel'],
  'accordion-item': ['en-accordion-item'],
  'accordion-trigger': ['.en-accordion-trigger'],
  'accordion-panel': ['.en-accordion-panel'],
  breadcrumbs: ['en-breadcrumbs'],
  'breadcrumb-link': ['en-breadcrumbs > a', 'en-breadcrumbs > span', '.en-breadcrumbs .en-navigation-link', '.en-breadcrumbs__label'],
  'menu-item': ['en-menu-item', '.en-menu-item'],
  listbox: ['en-multiselect'],
  'native-listbox': ['.en-listbox'],
  'native-option': ['.en-listbox > .en-option'],
  tree: ['en-tree', 'en-tree-item'],
} as const;

/** Complex native contexts retain zero weight; only their public destination contributes. */
function nativeSelector(selector: string): string {
  if (selector.includes(':where(.en-tab-list[')) return `${selector}.en-tab`;
  if (selector.includes(':where(.en-breadcrumbs .en-navigation-link)')) return `${selector}.en-navigation-link`;
  if (selector.includes(':where(.en-listbox > .en-option)')) return `${selector}.en-option`;
  return nativeSurface(selector);
}

/** Direct native geometry/paint matches the public recipe class without weighting hook defaults. */
function nativeBlock(ctx: CompanionPresentationContext, suffix: string, css: string): string {
  return css ? ctx.style(ctx.selectors.map(selector => nativeSelector(selector) + suffix), css) : '';
}

/** First selector is a component host; later selectors are public native helpers. */
function hostAndNative(ctx: CompanionPresentationContext, part: string, css: string, state = ''): string {
  return ctx.style(ctx.selectors.map((selector, index) => `${index === 0 ? selector : nativeSelector(selector)}${state}${index === 0 ? `::part(${part})` : ''}`), css);
}
const textRoles = { fontSize: 'dimension', lineHeight: 'number', weight: 'fontWeight' } as const;
const optionRoles = {
  ...textRoles, radius: 'dimension', inlinePadding: 'dimension', blockPadding: 'dimension',
  disabledOpacity: 'number', selectedBackground: 'color', selectedColor: 'color',
} as const;

export const navigationPresentations = {
  tabs: {
    line: {
      roles: { gap: 'dimension' },
      render: ctx => ctx.block('::part(tab-list)', declarations({ gap: ctx.role('gap') })),
    },
  },
  'tab-list': {
    line: {
      roles: { gap: 'dimension' },
      render: ctx => nativeBlock(ctx, '', declarations({ gap: ctx.role('gap') })),
    },
  },
  tab: {
    line: {
      roles: { ...textRoles, minInlineSize: 'dimension', inlinePadding: 'dimension', blockPadding: 'dimension', indicatorWidth: 'dimension', restColor: 'color', selectedColor: 'color', indicatorColor: 'color', disabledOpacity: 'number' },
      render: ctx => [
        hostAndNative(ctx, 'base', declarations({
          'min-inline-size': ctx.role('minInlineSize') ? `max(var(--en-size-target-min), ${ctx.role('minInlineSize')})` : undefined,
          'padding-inline': ctx.role('inlinePadding'), 'padding-block': ctx.role('blockPadding'),
          'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'),
          'border-block-end-width': ctx.role('indicatorWidth'), 'margin-block-end': '-1px',
        })),
        ctx.role('minInlineSize') ? `@media (any-pointer: coarse) { ${hostAndNative(ctx, 'base', declarations({
          'min-inline-size': `max(var(--en-size-target-touch), ${ctx.role('minInlineSize')})`,
        }))} }` : '',
        authorPaint(hostAndNative(ctx, 'base', declarations({ background: 'transparent', color: ctx.role('restColor'), 'border-block-end-color': 'transparent' }))),
        authorPaint(hostAndNative(ctx, 'base', declarations({ color: ctx.role('selectedColor'), 'border-block-end-color': ctx.role('indicatorColor') }), '[aria-selected="true"]')),
        authorPaint(hostAndNative(ctx, 'base', declarations({ opacity: ctx.role('disabledOpacity') }), '[aria-disabled="true"]')),
      ].join('\n'),
    },
  },
  'vertical-tab': {
    line: {
      roles: { indicatorWidth: 'dimension', indicatorColor: 'color' },
      render: ctx => [
        hostAndNative(ctx, 'base', declarations({ 'border-block-end-width': '0px', 'border-inline-end-width': ctx.role('indicatorWidth'), 'border-inline-end-style': 'solid', 'margin-block-end': '0px', 'margin-inline-end': '-1px' })),
        authorPaint(hostAndNative(ctx, 'base', 'border-inline-end-color: transparent;')),
        authorPaint(hostAndNative(ctx, 'base', declarations({ 'border-inline-end-color': ctx.role('indicatorColor') }), '[aria-selected="true"]')),
      ].join('\n'),
    },
  },
  'tab-panel': {
    line: {
      roles: { padding: 'dimension' },
      render: ctx => hostAndNative(ctx, 'base', declarations({ 'padding-block-start': ctx.role('padding'), 'padding-block-end': '0px' })),
    },
  },
  'vertical-tab-panel': {
    line: {
      roles: { padding: 'dimension' },
      render: ctx => ctx.block('::part(base)', declarations({ 'padding-block': '0px', 'padding-inline-start': ctx.role('padding') })),
    },
  },
  'accordion-item': {
    outline: {
      roles: { ...textRoles, smallFontSize: 'dimension', largeFontSize: 'dimension', radius: 'dimension', gap: 'dimension', blockPadding: 'dimension', panelStart: 'dimension', panelEnd: 'dimension', indicatorSize: 'dimension', indicatorMarkSize: 'dimension', indicatorStroke: 'dimension', indicatorColor: 'color', duration: 'duration', disabledOpacity: 'number' },
      render: ctx => [
        // Public size roles preserve the host's ordinary size selection/inheritance.
        ctx.block('', declarations({ '--en-font-ui-size-small': ctx.role('smallFontSize'), '--en-font-ui-size-medium': ctx.role('fontSize'), '--en-font-ui-size-large': ctx.role('largeFontSize') })),
        ctx.block('::part(control)', declarations({ 'font-weight': ctx.role('weight'), 'line-height': ctx.role('lineHeight'), 'padding-inline': '0px', 'padding-block': ctx.role('blockPadding'), gap: ctx.role('gap'), 'border-radius': ctx.role('radius') })),
        ctx.block('::part(panel)', declarations({ 'padding-inline': '0px', 'padding-block-start': ctx.role('panelStart'), 'padding-block-end': ctx.role('panelEnd') })),
        ctx.block('::part(indicator)', declarations({ display: 'inline-grid', 'place-items': 'center', 'flex-shrink': '0', 'font-size': '0px', 'inline-size': ctx.role('indicatorSize'), 'block-size': ctx.role('indicatorSize'), transition: ctx.role('duration') ? `rotate ${ctx.role('duration')}` : undefined })),
        ctx.block('::part(indicator)::before', declarations({ content: '""', 'inline-size': ctx.role('indicatorMarkSize'), 'block-size': ctx.role('indicatorMarkSize'), 'border-inline-end': `${ctx.role('indicatorStroke') ?? '1px'} solid currentColor`, 'border-block-end': `${ctx.role('indicatorStroke') ?? '1px'} solid currentColor`, rotate: '45deg' })),
        ctx.block('[open]::part(indicator)', 'rotate: 180deg;'),
        authorPaint(ctx.block('::part(control)', 'background: transparent;')),
        authorPaint(ctx.block('::part(indicator)', declarations({ color: ctx.role('indicatorColor') }))),
        authorPaint(ctx.block('[disabled]::part(control)', declarations({ opacity: ctx.role('disabledOpacity') }))),
        `@media (prefers-reduced-motion: reduce) { ${ctx.block('::part(indicator)', 'transition: none;')} }`,
      ].join('\n'),
    },
  },
  'accordion-trigger': {
    outline: {
      roles: { ...textRoles, radius: 'dimension', gap: 'dimension', blockPadding: 'dimension', disabledOpacity: 'number' },
      render: ctx => [
        nativeBlock(ctx, '', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'), 'padding-inline': '0px', 'padding-block': ctx.role('blockPadding'), gap: ctx.role('gap'), 'border-radius': ctx.role('radius') })),
        authorPaint(nativeBlock(ctx, '', 'background: transparent;')),
        `@media (hover: hover) { ${authorPaint(nativeBlock(ctx, ':not(:disabled):not([aria-disabled="true"]):hover', 'background: transparent;'))} }`,
        authorPaint(nativeBlock(ctx, ':not(:disabled):not([aria-disabled="true"]):active', 'background: transparent;')),
        authorPaint(nativeBlock(ctx, ':is(:disabled, [aria-disabled="true"])', declarations({ opacity: ctx.role('disabledOpacity') }))),
      ].join('\n'),
    },
  },
  'accordion-panel': {
    outline: {
      roles: { panelStart: 'dimension', panelEnd: 'dimension' },
      render: ctx => nativeBlock(ctx, '', declarations({ 'padding-inline': '0px', 'padding-block-start': ctx.role('panelStart'), 'padding-block-end': ctx.role('panelEnd') })),
    },
  },
  breadcrumbs: {
    plain: {
      roles: { ...textRoles, gap: 'dimension', separatorSize: 'dimension', separatorMarkSize: 'dimension', separatorStroke: 'dimension', separatorColor: 'color', separatorOpacity: 'number' },
      render: ctx => [
        ctx.block('::part(base)', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight') })),
        ctx.block('::part(list)', declarations({ gap: ctx.role('gap') })),
        ctx.block('::part(item)', declarations({ gap: ctx.role('gap') })),
        ctx.block('::part(separator)', declarations({ display: 'inline-grid', 'place-items': 'center', 'font-size': '0px', 'inline-size': ctx.role('separatorSize'), 'block-size': ctx.role('separatorSize') })),
        ctx.block('::part(separator)::before', declarations({ content: '""', 'inline-size': ctx.role('separatorMarkSize'), 'block-size': ctx.role('separatorMarkSize'), 'border-inline-end': `${ctx.role('separatorStroke') ?? '1px'} solid currentColor`, 'border-block-end': `${ctx.role('separatorStroke') ?? '1px'} solid currentColor`, rotate: '-45deg' })),
        ctx.block(':dir(rtl)::part(separator)', 'rotate: 180deg;'),
        authorPaint(ctx.block('::part(separator)', declarations({ color: ctx.role('separatorColor'), opacity: ctx.role('separatorOpacity') }))),
      ].join('\n'),
    },
  },
  'breadcrumb-link': {
    plain: {
      roles: { ...textRoles, radius: 'dimension', restColor: 'color', currentColor: 'color' },
      render: ctx => [
        nativeBlock(ctx, '', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'), 'border-radius': ctx.role('radius'), 'text-decoration': 'none' })),
        authorPaint(nativeBlock(ctx, '', declarations({ color: ctx.role('restColor') }))),
        authorPaint(nativeBlock(ctx, '[aria-current]:not([aria-current="false"])', declarations({ color: ctx.role('currentColor'), 'font-weight': ctx.role('weight') }))),
        `@media (hover: hover) { ${authorPaint(nativeBlock(ctx, ':hover', declarations({ color: ctx.role('currentColor') })))} }`,
      ].join('\n'),
    },
  },
  'menu-item': {
    compact: {
      roles: { ...optionRoles, shortcutSize: 'dimension', shortcutLineHeight: 'number', shortcutOpacity: 'number', shortcutGap: 'dimension', shortcutTracking: 'number', choiceInset: 'dimension', choicePadding: 'dimension' },
      render: ctx => [
        hostAndNative(ctx, 'control', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'), 'border-radius': ctx.role('radius'), 'padding-inline': ctx.role('inlinePadding'), 'padding-block': ctx.role('blockPadding') })),
        // The shortcut is an explicitly public Part; native authored shortcut content is not guessed.
        ctx.style([`${ctx.selectors[0]}::part(shortcut)`], declarations({ display: 'inline-flex', 'margin-inline-start': 'auto', 'padding-inline-start': ctx.role('shortcutGap'), 'font-family': 'inherit', 'font-size': ctx.role('shortcutSize'), 'line-height': ctx.role('shortcutLineHeight'), 'letter-spacing': ctx.role('shortcutSize') && ctx.role('shortcutTracking') ? `calc(${ctx.role('shortcutSize')} * ${ctx.role('shortcutTracking')})` : undefined })),
        authorPaint(ctx.style([`${ctx.selectors[0]}::part(shortcut)`], declarations({ opacity: ctx.role('shortcutOpacity') }))),
        ctx.style([`${ctx.selectors[0]}:is([type="checkbox"], [type="radio"])::part(control)`], declarations({ 'padding-inline-start': ctx.role('choicePadding') })),
        ctx.style([`${ctx.selectors[0]}::part(checkmark)`], declarations({ position: 'absolute', 'inset-inline-start': ctx.role('choiceInset'), 'inset-block-start': '50%', translate: '0 -50%' })),
        authorPaint(ctx.style([`${ctx.selectors[0]}[disabled]::part(control)`, ...ctx.selectors.slice(1).map(selector => `${nativeSelector(selector)}[aria-disabled="true"]`)], declarations({ opacity: ctx.role('disabledOpacity') }))),
      ].join('\n'),
    },
  },
  listbox: {
    subtle: {
      roles: { ...optionRoles, surfaceRadius: 'dimension', surfacePadding: 'dimension', gap: 'dimension', maxBlockSize: 'dimension', surfaceBackground: 'color', surfaceBorder: 'color' },
      render: ctx => [
        ctx.block('::part(options)', declarations({ 'border-radius': ctx.role('surfaceRadius'), padding: ctx.role('surfacePadding'), gap: ctx.role('gap'), 'max-block-size': ctx.role('maxBlockSize') })),
        ctx.block('::part(option)', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'), 'border-radius': ctx.role('radius'), 'padding-inline': ctx.role('inlinePadding'), 'padding-block': ctx.role('blockPadding') })),
        // Multiselect's public native pattern layer consumes these semantic roles directly.
        authorPaint(ctx.block('', declarations({ '--en-color-selected': ctx.role('selectedBackground'), '--en-color-action-text': ctx.role('selectedColor') }))),
        authorPaint(ctx.block('::part(options)', declarations({ background: ctx.role('surfaceBackground'), 'border-color': ctx.role('surfaceBorder') }))),
        authorPaint(ctx.block('::part(option):disabled', declarations({ opacity: ctx.role('disabledOpacity') }))),
      ].join('\n'),
    },
  },
  'native-listbox': {
    subtle: {
      roles: { surfaceRadius: 'dimension', surfacePadding: 'dimension', gap: 'dimension', maxBlockSize: 'dimension', surfaceBackground: 'color', surfaceBorder: 'color' },
      render: ctx => [
        nativeBlock(ctx, '', declarations({ 'border-radius': ctx.role('surfaceRadius'), padding: ctx.role('surfacePadding'), gap: ctx.role('gap'), 'max-block-size': ctx.role('maxBlockSize'), 'border-width': '1px', 'border-style': 'solid', 'overflow-y': 'auto' })),
        authorPaint(nativeBlock(ctx, '', declarations({ background: ctx.role('surfaceBackground'), 'border-color': ctx.role('surfaceBorder') }))),
      ].join('\n'),
    },
  },
  'native-option': {
    subtle: {
      roles: optionRoles,
      render: ctx => [
        nativeBlock(ctx, '', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'), 'border-radius': ctx.role('radius'), 'padding-inline': ctx.role('inlinePadding'), 'padding-block': ctx.role('blockPadding') })),
        authorPaint(nativeBlock(ctx, '[aria-disabled="true"]', declarations({ opacity: ctx.role('disabledOpacity') }))),
      ].join('\n'),
    },
  },
  tree: {
    subtle: {
      roles: { indent: 'dimension', iconSize: 'dimension', smallIconSize: 'dimension', indicatorColor: 'color', selectedWeight: 'fontWeight', hoverBackground: 'color', disabledOpacity: 'number' },
      render: ctx => [
        ctx.block('', declarations({ '--en-size-icon-small': ctx.role('smallIconSize'), '--en-size-icon-medium': ctx.role('iconSize'), '--en-size-icon-large': ctx.role('iconSize'), '--en-option-selected-font-weight': ctx.role('selectedWeight') })),
        ctx.block('::part(group)', declarations({ 'padding-inline-start': ctx.role('indent') })),
        authorPaint(ctx.block('::part(indicator)', declarations({ color: ctx.role('indicatorColor') }))),
        authorPaint(ctx.block('::part(base):focus-visible', declarations({ '--en-option-rest-background': ctx.role('hoverBackground') }))),
        authorPaint(ctx.block('::part(item):focus-visible', declarations({ '--en-option-rest-background': ctx.role('hoverBackground') }))),
        authorPaint(ctx.block('[disabled]::part(option)', declarations({ opacity: ctx.role('disabledOpacity') }))),
      ].join('\n'),
    },
  },
} satisfies CompanionPresentationRegistry;
