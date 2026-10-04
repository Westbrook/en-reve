import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Source-default inline messages, using only public alert Parts/native helpers.
 * Announcement policy, authored content/icons and dismissal stay component-owned.
 * This is separate from alert-subtle so unselected recipes retain their anatomy. */
export const sourceAlertTargets = {
  'source-alert': ['en-alert', '.en-alert'],
} as const;

const roles = {
  paddingBlock: 'dimension', paddingInline: 'dimension', paddingEm: 'number',
  gap: 'dimension', radius: 'dimension', borderWidth: 'dimension', minHeight: 'dimension',
  fontSize: 'dimension', lineHeight: 'number', weight: 'fontWeight',
  iconSize: 'dimension', iconLineHeight: 'dimension', iconBlockOffset: 'dimension',
  iconFontScale: 'number', iconMarginEndEm: 'number',
  infoBackground: 'color', infoColor: 'color', infoBorderColor: 'color', infoIconColor: 'color',
  successBackground: 'color', successColor: 'color', successBorderColor: 'color', successIconColor: 'color',
  warningBackground: 'color', warningColor: 'color', warningBorderColor: 'color', warningIconColor: 'color',
  dangerBackground: 'color', dangerColor: 'color', dangerBorderColor: 'color', dangerIconColor: 'color',
} as const;

type Profile = 'outlined' | 'outlined-trailing' | 'plate' | 'callout';
type Status = 'info' | 'success' | 'warning' | 'danger';

function part(ctx: CompanionPresentationContext, name: string, css: string, status?: Status): string {
  if (!css) return '';
  const customState = status ? '[variant="' + status + '"]' : '';
  const nativeState = status ? '[data-variant="' + status + '"]' : '';
  const nativeChild = name === 'base' ? '' : ' > .en-alert__' + name + ':not([data-en-theme])';
  return ctx.style([
    ctx.selectors[0] + customState + '::part(' + name + ')',
    nativeSurface(ctx.selectors[1]) + nativeState + nativeChild,
  ], css);
}

function paint(ctx: CompanionPresentationContext, profile: Profile, status: Status, explicit = false): string {
  const background = ctx.role(status + 'Background');
  const color = ctx.role(status + 'Color');
  const boundary = ctx.role(status + 'BorderColor');
  const icon = ctx.role(status + 'IconColor');
  const selection = explicit ? status : undefined;
  return part(ctx, 'base', declarations({
    background: background ? 'var(--en-alert-background, ' + background + ')' : undefined,
    color: color ? 'var(--en-alert-color, ' + color + ')' : undefined,
    // Borderless source plates retain the documented boundary-color hook as
    // an optional inset ring without changing their default content geometry.
    'border-width': profile === 'plate' ? '0' : ctx.role('borderWidth'),
    'border-style': profile === 'plate' ? undefined : 'solid',
    'border-color': profile === 'plate' ? undefined : 'var(--en-alert-border-color, ' + (boundary ?? 'transparent') + ')',
    'box-shadow': profile === 'plate' ? 'inset 0 0 0 1px var(--en-alert-border-color, transparent)' : 'none',
  }), selection) + part(ctx, 'icon', declarations({ color: icon ?? 'inherit' }), selection);
}

function render(ctx: CompanionPresentationContext, profile: Profile): string {
  const relativePadding = ctx.role('paddingEm');
  const padding = relativePadding === undefined ? undefined : relativePadding + 'em';
  const iconScale = ctx.role('iconFontScale');
  const iconMargin = ctx.role('iconMarginEndEm');
  const body = part(ctx, 'base', declarations({
    'padding-block': padding ?? ctx.role('paddingBlock'),
    'padding-inline': padding ?? ctx.role('paddingInline'),
    gap: ctx.role('gap'), 'border-radius': ctx.role('radius'),
    'min-block-size': ctx.role('minHeight'),
    'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'),
    'align-items': profile === 'callout' ? 'stretch' : 'flex-start',
  }));
  const icon = part(ctx, 'icon', declarations({
    display: 'flex', 'align-items': 'center', 'justify-content': 'center',
    'inline-size': ctx.role('iconSize'),
    'block-size': ctx.role('iconLineHeight') ?? ctx.role('iconSize'),
    'margin-block-start': ctx.role('iconBlockOffset'),
    'font-size': iconScale === undefined ? ctx.role('iconSize') : 'calc(1em * ' + iconScale + ')',
    'margin-inline-end': iconMargin === undefined ? undefined : iconMargin + 'em',
    'align-self': profile === 'callout' ? 'stretch' : undefined,
  }));
  // Native helpers can be used outside an en-foundation region. Do not let the
  // display declaration above reveal a caller-hidden optional icon.
  const hiddenNativeIcon = ctx.style([
    nativeSurface(ctx.selectors[1]) + ' > .en-alert__icon[hidden]:not([data-en-theme])',
  ], 'display: none;');
  const order = profile === 'outlined-trailing'
    ? part(ctx, 'content', 'order: 0;') + part(ctx, 'icon', 'order: 1;') + part(ctx, 'close', 'order: 2;')
    : '';
  return body + icon + hiddenNativeIcon + order + authorPaint([
    paint(ctx, profile, 'info'),
    ...(['info', 'success', 'warning', 'danger'] as const).map(status => paint(ctx, profile, status, true)),
  ].join('\n'));
}

export const sourceAlertPresentations = {
  'source-alert': {
    outlined: { roles, render: (ctx: CompanionPresentationContext) => render(ctx, 'outlined') },
    'outlined-trailing': { roles, render: (ctx: CompanionPresentationContext) => render(ctx, 'outlined-trailing') },
    plate: { roles, render: (ctx: CompanionPresentationContext) => render(ctx, 'plate') },
    callout: { roles, render: (ctx: CompanionPresentationContext) => render(ctx, 'callout') },
  },
} as const satisfies CompanionPresentationRegistry;
