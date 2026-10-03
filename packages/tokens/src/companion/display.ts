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
  inlineSize: 'dimension', sectionInlinePadding: 'dimension',
  headerBlockStartPadding: 'dimension', headerBlockEndPadding: 'dimension', headerGap: 'dimension',
  bodyBlockStartPadding: 'dimension', bodyBlockEndPadding: 'dimension',
  footerBlockStartPadding: 'dimension', footerBlockEndPadding: 'dimension', footerGap: 'dimension',
  titleFontSize: 'dimension', titleLineHeight: 'number', titleFontWeight: 'fontWeight',
  descriptionColor: 'color', surfaceScale: 'number', surfaceOffset: 'dimension',
} as const;
const popupRoles = { ...types, ...paintRoles, ...motionRoles, inlineSize: 'dimension', padding: 'dimension', titleFontSize: 'dimension', titleLineHeight: 'number', titleFontWeight: 'fontWeight' } as const;
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
const bodyInset = (value: string | undefined) => value === undefined ? undefined : `max(0px, ${inset(value)}, ${focusExtents})`;
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
  const sectionInline = inset(ctx.role('sectionInlinePadding'));
  return [
    ctx.block('', declarations({ '--en-overlay-max-inline-size': ctx.role('inlineSize') })),
    motion(ctx, 'dialog'), overlayPaint(ctx, 'dialog'),
    region(ctx, 'surface', '', `padding: 0; gap: 0; ${text(ctx)}`),
    // Native modal gap is declared by dialog.en-dialog/dialog.en-drawer.
    ctx.selectors[1] ? ctx.style([`${nativeSurface(ctx.selectors[1])}:is(dialog)`], 'gap: 0;') : '',
    !drawer && ctx.role('inlineSize') ? ctx.style([`${ctx.selectors[0]}:not([presentation="responsive"])::part(surface)`, ...(ctx.selectors[1] ? [nativeSurface(ctx.selectors[1])] : [])], 'inline-size: min(var(--en-overlay-max-inline-size), calc(100% - var(--en-space-8)));') : '',
    region(ctx, 'header', ' > .en-overlay-header:not([data-en-theme])', declarations({
      'padding-inline': sectionInline, 'padding-block-start': inset(ctx.role('headerBlockStartPadding')),
      'padding-block-end': inset(ctx.role('headerBlockEndPadding')), gap: ctx.role('headerGap'),
    })),
    region(ctx, 'heading', ' > .en-overlay-header:not([data-en-theme]) > .en-heading-small:not([data-en-theme])', declarations({
      'font-size': ctx.role('titleFontSize'), 'line-height': ctx.role('titleLineHeight'), 'font-weight': ctx.role('titleFontWeight'),
    })),
    // Section padding supplies contour room; keep the owned dynamic scroll-padding
    // and overflow rules, but remove the old compensating negative margin.
    region(ctx, 'body', ' > .en-overlay-body:not([data-en-theme])', `margin: 0; ${drawer ? 'flex: 1; ' : ''}${declarations({
      'padding-inline': bodyInset(ctx.role('sectionInlinePadding')), 'padding-block-start': bodyInset(ctx.role('bodyBlockStartPadding')), 'padding-block-end': bodyInset(ctx.role('bodyBlockEndPadding')),
    })}`),
    region(ctx, 'footer', ' > .en-overlay-footer:not([data-en-theme])', declarations({
      'padding-inline': sectionInline, 'padding-block-start': inset(ctx.role('footerBlockStartPadding')),
      'padding-block-end': inset(ctx.role('footerBlockEndPadding')), gap: ctx.role('footerGap'),
    })),
    // Inline inset adds no height for an empty fallback. Keep close in normal
    // header flow so its protected target cannot cover a long or zoomed title.
    ctx.block('::part(description)', `display: block; ${declarations({ 'padding-inline': sectionInline })}`),
    authorPaint(ctx.block('::part(description)', declarations({ color: ctx.role('descriptionColor') }))),
  ].join('\n');
}
function popup(ctx: CompanionPresentationContext, maxOnly = false): string {
  const width = ctx.role('inlineSize'), padding = inset(ctx.role('padding'));
  return [
    motion(ctx, 'popup'), overlayPaint(ctx, 'popup'),
    ctx.block('', declarations({ '--en-overlay-max-inline-size': width })),
    region(ctx, 'surface', '', `padding: 0; gap: 0; ${text(ctx)} ${declarations({ 'inline-size': width && !maxOnly ? 'min(var(--en-overlay-max-inline-size), calc(100dvw - 1rem))' : undefined })}`),
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
  dialog: { sectioned: { roles: modalRoles, render: ctx => modal(ctx, false) } },
  drawer: { sectioned: { roles: modalRoles, render: ctx => modal(ctx, true) } },
  popover: { sectioned: { roles: popupRoles, render: ctx => popup(ctx) } },
  'hover-card': { sectioned: { roles: popupRoles, render: ctx => popup(ctx, true) } },
  tooltip: {
    compact: {
      roles: { ...types, ...paintRoles, ...motionRoles, maxInlineSize: 'dimension', paddingInline: 'dimension', paddingBlock: 'dimension', radius: 'dimension' },
      render(ctx) {
        const padding = declarations({ 'padding-inline': inset(ctx.role('paddingInline')), 'padding-block': inset(ctx.role('paddingBlock')) });
        return [
          motion(ctx, 'popup'), overlayPaint(ctx, 'popup'),
          ctx.block('', declarations({ '--en-overlay-radius': ctx.role('radius'), '--en-overlay-max-inline-size': ctx.role('maxInlineSize') })),
          ctx.block('::part(surface)', `padding: 0; ${text(ctx)}`),
          ctx.block('::part(content)', `display: block; ${padding}`),
          ctx.selectors[1] ? ctx.style([nativeSurface(ctx.selectors[1])], `${text(ctx)} ${padding}`) : '',
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
