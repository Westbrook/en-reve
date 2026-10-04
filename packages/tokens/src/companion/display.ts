import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Only documented element Parts and native helpers appear in this registry. */
export const displayTargets = {
  card: ['en-card', '.en-card'],
  dialog: ['en-dialog', '.en-dialog'],
  drawer: ['en-drawer', '.en-drawer'],
  popover: ['en-popover', '.en-popover'],
  'hover-card': ['en-hover-card'],
  tooltip: ['en-tooltip', '.en-tooltip'],
  menu: ['en-menu', '.en-menu'],
} as const;

/** A native helper's direct authored region may itself start a full theme. */
function region(ctx: CompanionPresentationContext, part: string, native: string, css: string): string {
  if (!css) return '';
  const selectors = [`${ctx.selectors[0]}::part(${part})`];
  if (ctx.selectors[1]) selectors.push(`${nativeSurface(ctx.selectors[1])}${native}`);
  return ctx.style(selectors, css);
}
const types = { fontSize: 'dimension', lineHeight: 'number', fontWeight: 'fontWeight' } as const;
const paintRoles = { background: 'color', color: 'color', borderColor: 'color', borderWidth: 'dimension', shadow: 'shadow' } as const;
const motionRoles = { enterDuration: 'duration', exitDuration: 'duration', enterEase: 'cubicBezier', exitEase: 'cubicBezier' } as const;
const modalRoles = {
  ...types, ...paintRoles, ...motionRoles,
  inlineSize: 'dimension', sectionInlinePadding: 'dimension', headerControlPaddingEm: 'number',
  headerBlockStartPadding: 'dimension', headerBlockEndPadding: 'dimension', headerGap: 'dimension',
  bodyBlockStartPadding: 'dimension', bodyBlockEndPadding: 'dimension',
  footerBlockStartPadding: 'dimension', footerBlockEndPadding: 'dimension', footerGap: 'dimension',
  titleFontSize: 'dimension', titleFontSizeMultiplier: 'number', titleLineHeight: 'number', titleFontWeight: 'fontWeight',
  descriptionColor: 'color', surfaceScale: 'number', surfaceOffset: 'dimension',
} as const;
const popupRoles = { ...types, ...paintRoles, ...motionRoles, inlineSize: 'dimension', maxInlineSize: 'dimension', radius: 'dimension', padding: 'dimension', titleFontSize: 'dimension', titleLineHeight: 'number', titleFontWeight: 'fontWeight' } as const;
const inset = (value: string | undefined, hook = '--en-overlay-padding') => value === undefined ? undefined : `var(${hook}, ${value})`;
// Public focus inputs preserve the owned scrollport's clearance when a consumer
// enlarges a contour beyond the source section inset. No private style is read.
const focusExtents = [undefined, 'button', 'input', 'option', 'overlay'].flatMap(family => {
  const width = family ? `var(--en-${family}-focus-width, var(--en-focus-width))` : 'var(--en-focus-width)';
  const fallbackOffset = family === 'option' ? `calc(0px - ${width})` : 'var(--en-focus-offset)';
  const offset = family ? `var(--en-${family}-focus-offset, ${fallbackOffset})` : fallbackOffset;
  const halo = family ? `var(--en-${family}-focus-halo-width, var(--en-focus-halo-width))` : 'var(--en-focus-halo-width)';
  return [`calc(${width} + ${offset})`, halo];
}).join(', ');
const bodySourceInset = (value: string) => `max(0px, ${value}, ${focusExtents})`;
const bodyInset = (value: string | undefined) => value === undefined ? undefined : inset(bodySourceInset(value));
// Public padding accepts the full CSS shorthand. Source arithmetic belongs only
// in its fallback, never around a consumer's potentially multi-value input.
const sectionPadding = (top: string | undefined, inline: string | undefined, bottom: string | undefined, body = false) => {
  if (top === undefined && inline === undefined && bottom === undefined) return undefined;
  const source = (value: string | undefined) => body ? bodySourceInset(value ?? '0px') : value ?? '0px';
  return inset(`${source(top)} ${source(inline)} ${source(bottom)} ${source(inline)}`);
};
function text(ctx: CompanionPresentationContext): string {
  return declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('fontWeight') });
}
function motion(ctx: CompanionPresentationContext, family: 'dialog' | 'popup'): string {
  return ctx.block('', declarations({
    [`--en-${family}-enter-duration`]: ctx.role('enterDuration'),
    [`--en-${family}-exit-duration`]: ctx.role('exitDuration'),
    [`--en-${family}-enter-ease`]: ctx.role('enterEase'),
    [`--en-${family}-exit-ease`]: ctx.role('exitEase'),
    '--en-motion-surface-scale': ctx.role('surfaceScale'),
    '--en-motion-surface-offset': ctx.role('surfaceOffset'),
  }));
}
function overlayPaint(ctx: CompanionPresentationContext, family: 'dialog' | 'popup'): string {
  const shadowName = family === 'dialog' ? '--en-shadow-dialog' : '--en-shadow-overlay';
  const shadow = ctx.role('shadow');
  // Public hooks keep arrows and focus-shadow composition tied to the same paint.
  return authorPaint(ctx.block('', declarations({
    '--en-overlay-background': ctx.role('background'), '--en-overlay-color': ctx.role('color'),
    '--en-overlay-border-color': ctx.role('borderColor'),
    // An alias to the same semantic role already inherits correctly; redeclaring
    // it here would create a CSS self-reference and erase the elevation.
    [shadowName]: shadow === `var(${shadowName})` ? undefined : shadow,
  })) + region(ctx, 'surface', '', declarations({ 'border-width': ctx.role('borderWidth') })));
}
function modal(ctx: CompanionPresentationContext, drawer: boolean): string {
  const sectionInline = ctx.role('sectionInlinePadding');
  const compensation = ctx.role('headerControlPaddingEm');
  const headerInset = (value: string | undefined) => value === undefined ? undefined
    : compensation === undefined ? value : `max(0px, calc(${value} - ${compensation} * 1em))`;
  const headerTop = headerInset(ctx.role('headerBlockStartPadding'));
  const headerBottom = ctx.role('headerBlockEndPadding');
  const headerEnd = headerInset(sectionInline);
  const headerPadding = (rtl = false) => headerTop === undefined && sectionInline === undefined && headerBottom === undefined ? undefined
    : inset(`${headerTop ?? '0px'} ${(rtl ? sectionInline : headerEnd) ?? '0px'} ${headerBottom ?? '0px'} ${(rtl ? headerEnd : sectionInline) ?? '0px'}`);
  const titleSize = ctx.role('titleFontSize'), titleMultiplier = ctx.role('titleFontSizeMultiplier');
  const titleFontSize = titleSize === undefined ? undefined : titleMultiplier === undefined ? titleSize
    : `round(calc(${titleSize} * max(0, ${titleMultiplier})), 1px)`;
  const width = ctx.role('inlineSize'), gutter = ctx.role('viewportGutter') ?? 'var(--en-space-8)';
  const centered = [`${ctx.selectors[0]}:not([presentation="responsive"])::part(surface)`,
    ...(ctx.selectors[1] ? [`${nativeSurface(ctx.selectors[1])}:where(dialog):not(:where(.en-drawer))`] : [])];
  return [
    // Drawers retain their owned full-viewport geometry. Centered dialogs read
    // source defaults at the surface so inherited author maxima remain effective.
    drawer ? ctx.block('', declarations({ '--en-overlay-max-inline-size': width }))
      : region(ctx, 'surface', '', declarations({ '--_en-source-overlay-max-inline-size': width })),
    motion(ctx, 'dialog'), overlayPaint(ctx, 'dialog'),
    region(ctx, 'surface', '', `padding: 0; gap: 0; ${text(ctx)}`),
    // Responsive dialogs keep the owned centered-token/square-drawer corners.
    !drawer && ctx.role('radius') ? ctx.style([`${ctx.selectors[0]}:not([presentation="responsive"])::part(surface)`, ...(ctx.selectors[1] ? [`${nativeSurface(ctx.selectors[1])}:is(dialog)`] : [])], `border-radius: var(--en-overlay-radius, ${ctx.role('radius')});`) : '',
    // Native modal gap is declared by dialog.en-dialog/dialog.en-drawer.
    ctx.selectors[1] ? ctx.style([`${nativeSurface(ctx.selectors[1])}:is(dialog)`], 'gap: 0;') : '',
    !drawer && width ? ctx.style(centered, `inline-size: min(var(--en-overlay-max-inline-size, ${width}), calc(100% - ${gutter})); max-inline-size: min(var(--en-overlay-max-inline-size, ${width}), calc(100% - ${gutter}));`) : '',
    !drawer && ctx.role('viewportGutter') ? ctx.style(centered, `max-block-size: var(--en-overlay-max-block-size, calc(100dvh - ${gutter}));`) : '',
    region(ctx, 'header', ' > .en-overlay-header:not([data-en-theme])', declarations({
      padding: headerPadding(), gap: ctx.role('headerGap'),
    })),
    // CSS padding is physical; only the asymmetric source fallback follows RTL.
    // An authored one-to-four-value shorthand retains its ordinary CSS meaning.
    compensation === undefined ? '' : ctx.style([`${ctx.selectors[0]}:dir(rtl)::part(header)`,
      ...(ctx.selectors[1] ? [`${nativeSurface(ctx.selectors[1])} > .en-overlay-header:not([data-en-theme]):dir(rtl)`] : [])], declarations({ padding: headerPadding(true) })),
    region(ctx, 'heading', ' > .en-overlay-header:not([data-en-theme]) > .en-heading-small:not([data-en-theme])', declarations({
      'font-size': titleFontSize, 'line-height': ctx.role('titleLineHeight'), 'font-weight': ctx.role('titleFontWeight'),
    })),
    // Section padding supplies contour room; keep the owned dynamic scroll-padding
    // and overflow rules, but remove the old compensating negative margin.
    region(ctx, 'body', ' > .en-overlay-body:not([data-en-theme])', `margin: 0; ${drawer ? 'flex: 1; ' : ''}${declarations({
      padding: sectionPadding(ctx.role('bodyBlockStartPadding'), sectionInline, ctx.role('bodyBlockEndPadding'), true),
    })}`),
    region(ctx, 'footer', ' > .en-overlay-footer:not([data-en-theme])', declarations({
      padding: sectionPadding(ctx.role('footerBlockStartPadding'), sectionInline, ctx.role('footerBlockEndPadding')), gap: ctx.role('footerGap'),
    })),
    // A section without authored actions must not retain a padded blank footer.
    // The predicate inspects authored slots and native regions, never shadow ancestry.
    ctx.style([`${ctx.selectors[0]}:not(:has(> [slot="footer"]))::part(footer)`,
      ...(ctx.selectors[1] ? [`${nativeSurface(ctx.selectors[1])} > .en-overlay-footer:not([data-en-theme]):empty`] : [])], 'display: none;'),
    // Source inline inset adds no height for an empty fallback. Keep close in normal
    // header flow so its protected target cannot cover a long or zoomed title.
    ctx.block('::part(description)', `display: block; ${declarations({ padding: sectionInline === undefined ? undefined : inset(`0px ${sectionInline}`) })}`),
    authorPaint(ctx.block('::part(description)', declarations({ color: ctx.role('descriptionColor') }))),
  ].join('\n');
}
function popup(ctx: CompanionPresentationContext, maxOnly = false): string {
  const width = ctx.role('inlineSize'), maximum = ctx.role('maxInlineSize'), padding = inset(ctx.role('padding'));
  return [
    motion(ctx, 'popup'), overlayPaint(ctx, 'popup'),
    ctx.block('', declarations({ '--en-overlay-max-inline-size': width })),
    region(ctx, 'surface', '', `padding: 0; gap: 0; ${text(ctx)} ${declarations({
      'inline-size': width && !maxOnly ? 'min(var(--en-overlay-max-inline-size), calc(100dvw - 1rem))' : undefined,
      // A source maximum keeps intrinsic popup sizing; the public hook can
      // replace it without a locally assigned default masking inherited input.
      'max-inline-size': maximum ? `min(var(--en-overlay-max-inline-size, ${maximum}), calc(100% - var(--en-space-8)))` : undefined,
      'border-radius': ctx.role('radius') ? `var(--en-overlay-radius, ${ctx.role('radius')})` : undefined,
    })}`),
    // The public content wrapper exists with and without an arrow.
    ctx.block('::part(content)', 'display: flex; flex-direction: column; gap: 0; padding: 0;'),
    region(ctx, 'heading', ' > .en-heading-small:not([data-en-theme])', declarations({ 'padding-inline': padding, 'padding-block-start': padding, 'font-size': ctx.role('titleFontSize'), 'line-height': ctx.role('titleLineHeight'), 'font-weight': ctx.role('titleFontWeight') })),
    region(ctx, 'body', ' > .en-overlay-body:not([data-en-theme])', `margin: 0; ${declarations({ padding: bodyInset(ctx.role('padding')) })}`),
    region(ctx, 'close', ' > .en-overlay-close:not([data-en-theme])', `align-self: flex-end; ${declarations({ 'margin-inline': padding, 'margin-block-end': padding })}`),
  ].join('\n');
}

export const displayPresentations = {
  card: {
    sectioned: {
      roles: { ...types, ...paintRoles, sectionInlinePadding: 'dimension', headerPadding: 'dimension', bodyPadding: 'dimension', footerPadding: 'dimension', headerGap: 'dimension', footerGap: 'dimension', titleFontSize: 'dimension', titleLineHeight: 'number', titleFontWeight: 'fontWeight' },
      render(ctx) {
        const inline = inset(ctx.role('sectionInlinePadding'), '--en-surface-padding');
        return [
          authorPaint(ctx.block('', declarations({ '--en-card-background': ctx.role('background'), '--en-surface-color': ctx.role('color'), '--en-surface-border-color': ctx.role('borderColor'), '--en-card-shadow': ctx.role('shadow') }))),
          region(ctx, 'base', '', `padding: 0; gap: 0; ${text(ctx)}`),
          authorPaint(region(ctx, 'base', '', declarations({ 'border-width': ctx.role('borderWidth') }))),
          region(ctx, 'header', ' > .en-card__header:not([data-en-theme])', `display: flex; flex-direction: column; ${declarations({ 'padding-inline': inline, 'padding-block-start': inset(ctx.role('headerPadding'), '--en-surface-padding'), gap: ctx.role('headerGap'), 'font-size': ctx.role('titleFontSize'), 'line-height': ctx.role('titleLineHeight'), 'font-weight': ctx.role('titleFontWeight') })}`),
          region(ctx, 'content', ' > .en-card__body:not([data-en-theme])', `display: flex; flex-direction: column; flex: 1; ${declarations({ 'padding-inline': inline, 'padding-block': inset(ctx.role('bodyPadding'), '--en-surface-padding') })}`),
          region(ctx, 'footer', ' > .en-card__footer:not([data-en-theme])', declarations({ 'padding-inline': inline, 'padding-block-end': inset(ctx.role('footerPadding'), '--en-surface-padding'), gap: ctx.role('footerGap') })),
        ].join('\n');
      },
    },
  },
  dialog: { sectioned: { roles: { ...modalRoles, radius: 'dimension', viewportGutter: 'dimension' }, render: ctx => modal(ctx, false) } },
  drawer: { sectioned: { roles: modalRoles, render: ctx => modal(ctx, true) } },
  popover: { sectioned: { roles: popupRoles, render: ctx => popup(ctx) } },
  'hover-card': { sectioned: { roles: popupRoles, render: ctx => popup(ctx, true) } },
  tooltip: {
    compact: {
      roles: { ...types, ...paintRoles, ...motionRoles, maxInlineSize: 'dimension', maxInlineCharacters: 'number', fontSizeDivisor: 'number', paddingInline: 'dimension', paddingBlock: 'dimension', paddingInlineEm: 'number', paddingBlockEm: 'number', radius: 'dimension' },
      render(ctx) {
        const emInset = (scale: string | undefined, dimension: string | undefined) =>
          scale === undefined ? dimension : `calc(max(0, ${scale}) * 1em)`;
        const paddingInline = emInset(ctx.role('paddingInlineEm'), ctx.role('paddingInline'));
        const paddingBlock = emInset(ctx.role('paddingBlockEm'), ctx.role('paddingBlock'));
        const padding = (ordinary: string) => declarations({ padding: paddingInline === undefined && paddingBlock === undefined ? undefined
          : inset(`${paddingBlock ?? ordinary} ${paddingInline ?? ordinary}`) });
        const nativePadding = padding('var(--en-space-2)');
        const fontSize = ctx.role('fontSize'), divisor = ctx.role('fontSizeDivisor');
        const tooltipText = declarations({
          'font-size': fontSize === undefined ? undefined : divisor === undefined ? fontSize : `round(calc(${fontSize} / max(0.01, ${divisor})), 1px)`,
          'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('fontWeight'),
        });
        const characters = ctx.role('maxInlineCharacters');
        const maximum = characters === undefined ? ctx.role('maxInlineSize') : `calc(max(1, ${characters}) * 1ch)`;
        const fallback = (hook: string, value: string | undefined) => value === undefined ? undefined : `var(${hook}, ${value})`;
        // Keep inherited and local public inputs authoritative. Tooltip surfaces
        // have no focus-shadow composition; the same fallbacks paint the arrow.
        const paint = declarations({
          background: fallback('--en-overlay-background', ctx.role('background')),
          color: fallback('--en-overlay-color', ctx.role('color')),
          'border-color': fallback('--en-overlay-border-color', ctx.role('borderColor')),
          'border-width': ctx.role('borderWidth'),
          'box-shadow': fallback('--en-shadow-overlay', ctx.role('shadow')),
        });
        const geometry = declarations({
          'border-radius': fallback('--en-overlay-radius', ctx.role('radius')),
          'max-inline-size': maximum === undefined ? undefined : `min(var(--en-overlay-max-inline-size, ${maximum}), calc(100% - var(--en-space-8)))`,
        });
        return [
          motion(ctx, 'popup'),
          authorPaint(ctx.block('', declarations({ '--en-shadow-overlay': ctx.role('shadow') === 'var(--en-shadow-overlay)' ? undefined : ctx.role('shadow') }))),
          authorPaint(region(ctx, 'surface', '', paint)),
          authorPaint(region(ctx, 'arrow', ' > .en-overlay-arrow:not([data-en-theme])', declarations({
            fill: fallback('--en-overlay-background', ctx.role('background')),
            stroke: fallback('--en-overlay-border-color', ctx.role('borderColor')),
            'stroke-width': ctx.role('borderWidth'),
          }))),
          region(ctx, 'surface', '', geometry),
          ctx.block('::part(surface)', `padding: 0; ${tooltipText}`),
          ctx.block('::part(content)', `display: block; ${padding('0px')}`),
          // A sparse recipe leaves omitted axes at the content wrapper's ordinary
          // inset: zero without an arrow, the core tooltip inset with one.
          paddingInline === undefined || paddingBlock === undefined ? ctx.block('[arrow]::part(content)', nativePadding) : '',
          ctx.selectors[1] ? [
            ctx.style([nativeSurface(ctx.selectors[1])], tooltipText),
            ctx.style([`${nativeSurface(ctx.selectors[1])}:not([data-arrow])`], nativePadding),
            ctx.style([`${nativeSurface(ctx.selectors[1])}[data-arrow]`], 'padding: 0;'),
            ctx.style([`${nativeSurface(ctx.selectors[1])}[data-arrow] > .en-overlay-content:not([data-en-theme])`], `display: block; ${nativePadding}`),
          ].join('\n') : '',
        ].join('\n');
      },
    },
  },
  menu: {
    'compact-surface': {
      roles: { ...types, ...paintRoles, ...motionRoles, padding: 'dimension', radius: 'dimension' },
      render(ctx) {
        return [
          motion(ctx, 'popup'),
          ctx.block('', declarations({ '--en-option-list-radius': ctx.role('radius'), '--en-option-list-padding': ctx.role('padding') })),
          authorPaint(ctx.block('', declarations({ '--en-option-list-background': ctx.role('background'), '--en-option-list-color': ctx.role('color'), '--en-option-list-border-color': ctx.role('borderColor'), '--en-option-list-shadow': ctx.role('shadow') })) + region(ctx, 'surface', '', declarations({ 'border-width': ctx.role('borderWidth') }))),
          // The core minimum includes controller-owned visual-viewport bounds.
          region(ctx, 'surface', '', `${text(ctx)} ${declarations({ 'scroll-padding': ctx.role('padding') ? 'var(--en-option-list-padding)' : undefined })}`),
        ].join('\n');
      },
    },
  },
} satisfies CompanionPresentationRegistry;
