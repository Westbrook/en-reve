import type { TokenType } from '../types.js';
import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Trusted compiler bridge to the system's absolute size selection. These
 * private flags belong to the stylesheet implementation, never imported recipe
 * data. Reading them at the public Part preserves reset and size=inherit. */
export function sourceSizedRoles(stem: string, type: TokenType = 'dimension'): Record<string, TokenType> {
  return Object.fromEntries(['Small', 'Medium', 'Large'].map(size => [`${stem}${size}`, type]));
}
export function sourceSizedValue(ctx: CompanionPresentationContext, stem: string): string | undefined {
  const medium = ctx.role(`${stem}Medium`);
  if (medium === undefined) return undefined;
  const small = ctx.role(`${stem}Small`) ?? medium;
  const large = ctx.role(`${stem}Large`) ?? medium;
  return `calc(${small} * var(--_en-size-small, 0) + ${medium} * var(--_en-size-medium, 1) + ${large} * var(--_en-size-large, 0))`;
}

function control(ctx: CompanionPresentationContext, suffix: string, css: string): string {
  if (!css) return '';
  return ctx.style(ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
    ? `${nativeSurface(selector)}${suffix}`
    : `${selector}::part(control)${suffix}`), css);
}
const enabled = ':enabled';
/** Host state covers the associated shadow label without traversing it. The
 * native branch uses the documented direct-child label recipe; its already
 * scoped input selector continues to exclude nested full-theme boundaries. */
function switchInteraction(ctx: CompanionPresentationContext, state: ':hover' | ':focus-visible' | ':active' | ':hover:active', suffix: string, css: string, nativeClass: 'en-switch' | 'en-checkbox' = 'en-switch'): string {
  if (!css) return '';
  // Keyboard focus belongs to the actual input, never an unrelated focused
  // descendant or the label. Keep its native selector weight aligned with the
  // pointer branches so source order can resolve simultaneous input states.
  const nativeState = state === ':focus-visible'
    ? `:is(:focus-visible, .en-choice > .${nativeClass}:focus-visible)`
    : `:is(${state}, .en-choice${state} > .${nativeClass})`;
  return ctx.style(ctx.selectors.flatMap(selector => /:where\(\.en-/.test(selector)
    ? [`${nativeSurface(selector)}${enabled}${nativeState}${suffix}`]
    : [`${selector}::part(control)${enabled}${state}${suffix}`,
      ...(state === ':focus-visible' ? [] : [`${selector}${state}::part(control)${enabled}${suffix}`])]), css);
}
const statefulSwitchRoles = {
  ...sourceSizedRoles('inlineSize'), ...sourceSizedRoles('blockSize'),
  ...sourceSizedRoles('thumbSize'), ...sourceSizedRoles('checkedThumbSize'),
  ...sourceSizedRoles('inset'), ...sourceSizedRoles('checkedInset'),
  borderWidth: 'dimension', borderColor: 'color', checkedBorderColor: 'color',
  background: 'color', checkedBackground: 'color',
  thumbBackground: 'color', checkedThumbBackground: 'color',
  thumbShadow: 'shadow', checkedThumbShadow: 'shadow',
  hoverBackground: 'color', hoverCheckedBackground: 'color',
  hoverBorderColor: 'color', hoverCheckedBorderColor: 'color',
  hoverThumbBackground: 'color', hoverCheckedThumbBackground: 'color',
  focusBackground: 'color', focusCheckedBackground: 'color',
  focusBorderColor: 'color', focusCheckedBorderColor: 'color',
  focusThumbBackground: 'color', focusCheckedThumbBackground: 'color',
  pressedBackground: 'color', pressedCheckedBackground: 'color',
  pressedBorderColor: 'color', pressedCheckedBorderColor: 'color',
  pressedThumbBackground: 'color', pressedCheckedThumbBackground: 'color',
  hoverPressedBackground: 'color', hoverPressedCheckedBackground: 'color',
  disabledBackground: 'color', disabledBorderColor: 'color', disabledThumbBackground: 'color', disabledThumbShadow: 'shadow',
  disabledCheckedBackground: 'color', disabledCheckedBorderColor: 'color', disabledCheckedThumbBackground: 'color',
  disabledOpacity: 'number', duration: 'duration', ease: 'cubicBezier',
} as const;

/** New native targets are explicit documented recipes, never shadow ancestry. */
export const astryxTargets = {
  'stateful-switch': ['en-switch', '.en-switch'],
  'overlay-checkbox': ['en-checkbox', '.en-checkbox'],
  'inset-tab': ['en-tab', '.en-tab'],
  'inset-field': ['en-text-field', 'en-search-input', 'en-textarea', 'en-combobox', 'en-select', 'en-number-field', 'en-token-editor', '.en-input', '.en-textarea', '.en-select', '.en-number-group'],
  'raised-segments': ['en-segmented-control', '.en-segmented-control'],
  'dialog-surface': ['en-dialog', '.en-dialog'],
  'token-text': ['en-token-editor'],
} as const;

export const astryxPresentations = {
  'overlay-checkbox': {
    overlay: {
      roles: { background: 'color', borderColor: 'color', checkedBackground: 'color', hoverBackground: 'color', hoverBorderTint: 'color', hoverCheckedBackground: 'color', pressedOverlay: 'color', duration: 'duration', ease: 'cubicBezier' },
      render(ctx) {
        const selected = ':is(:checked, :indeterminate)';
        const interaction = (state: ':hover' | ':active' | ':hover:active', suffix: string, css: string) => switchInteraction(ctx, state, suffix, css, 'en-checkbox');
        const timing = `${ctx.role('duration') ?? 'var(--en-duration-fast)'} ${ctx.role('ease') ?? 'var(--en-ease-standard)'}`;
        const hoverBorder = ctx.role('borderColor') && ctx.role('hoverBorderTint')
          ? `color-mix(in srgb, ${ctx.role('borderColor')}, ${ctx.role('hoverBorderTint')} 20%)` : undefined;
        return control(ctx, '', `position: relative; transition: background-color ${timing}, border-color ${timing};`)
          + authorPaint(control(ctx, enabled, declarations({ background: ctx.role('background'), 'border-color': ctx.role('borderColor') }))
            + control(ctx, `${enabled}${selected}`, declarations({ background: ctx.role('checkedBackground'), 'border-color': ctx.role('checkedBackground') }))
            + `@media (hover: hover) { ${interaction(':hover', '', declarations({ background: ctx.role('hoverBackground'), 'border-color': hoverBorder }))}
              ${interaction(':hover', selected, declarations({ background: ctx.role('hoverCheckedBackground'), 'border-color': ctx.role('hoverCheckedBackground') }))} }`
            // Keep the current source perimeter beneath the pressed overlay;
            // native core otherwise replaces it with its generic active color.
            + interaction(':active', '', declarations({ 'border-color': ctx.role('borderColor') }))
            + interaction(':active', selected, declarations({ 'border-color': ctx.role('checkedBackground') }))
            + `@media (hover: hover) { ${interaction(':hover:active', '', declarations({ 'border-color': hoverBorder }))}
              ${interaction(':hover:active', selected, declarations({ 'border-color': ctx.role('hoverCheckedBackground') }))} }`
            // The source overlays the whole indicator, including its border
            // and check/dash. This decorative public-Part pseudo does the same.
            + control(ctx, `${enabled}::after`, 'content: ""; position: absolute; pointer-events: none; inset: calc(-1 * var(--en-border-width)); border-radius: inherit; background: transparent;')
            + interaction(':active', '::after', declarations({ background: ctx.role('pressedOverlay') })))
          + `@media (prefers-reduced-motion: reduce) { ${control(ctx, '', 'transition: none;')} }`;
      },
    },
  },
  'inset-tab': {
    line: {
      roles: { weight: 'fontWeight', selectedWeight: 'fontWeight', indicatorSize: 'dimension', indicatorInset: 'dimension', indicatorColor: 'color' },
      render(ctx) {
        const part = (state: string, suffix: string, css: string) => css ? ctx.style(ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
          ? `${nativeSurface(selector)}${state}${suffix}`
          : `${selector}${state}::part(base)${suffix}`), css) : '';
        const selected = '[aria-selected="true"]';
        return part('', '', declarations({ position: 'relative', 'font-weight': ctx.role('weight'), 'border-block-end-width': ctx.role('indicatorSize') }))
          + part(selected, '', declarations({ 'font-weight': ctx.role('selectedWeight') }))
          + authorPaint(part('', '', 'border-block-end-color: transparent;') + part(selected, '', 'border-block-end-color: transparent;')
            + part(selected, '::after', declarations({ content: '""', position: 'absolute', 'pointer-events': 'none', 'inset-inline': ctx.role('indicatorInset'), 'inset-block-end': '-1px', 'block-size': ctx.role('indicatorSize'), 'border-radius': 'var(--en-radius-pill)', background: ctx.role('indicatorColor') ? `var(--en-tab-indicator-color, ${ctx.role('indicatorColor')})` : undefined })));
      },
    },
  },
  'stateful-switch': {
    stateful: {
      roles: statefulSwitchRoles,
      render(ctx) {
        const size = (name: string) => sourceSizedValue(ctx, name);
        const localSize = (property: string, fallback: string | undefined) => fallback ? `var(${property}, ${fallback})` : undefined;
        const border = ctx.role('borderWidth') ?? 'var(--en-border-width)';
        // Public local overrides remain authoritative over source defaults.
        // A single explicit thumb size intentionally suppresses checked growth.
        const thumb = localSize('--en-switch-thumb-size', size('thumbSize'));
        const checkedThumb = localSize('--en-switch-thumb-size', size('checkedThumbSize') ?? size('thumbSize'));
        const inset = size('inset');
        const checkedInset = size('checkedInset') ?? inset;
        const timing = `${ctx.role('duration') ?? 'var(--en-duration-fast)'} ${ctx.role('ease') ?? 'var(--en-ease-standard)'}`;
        // Insets are measured from the track's outer edge. Absolute pseudo
        // positions use the padding box, so subtract its actual border width.
        // Logical positions mirror automatically; no transform sign guessing.
        const geometry = control(ctx, '', declarations({
          'inline-size': localSize('--en-switch-inline-size', size('inlineSize')),
          'block-size': localSize('--en-switch-block-size', size('blockSize')),
          '--_en-source-switch-border': border,
          'border-width': 'var(--_en-source-switch-border)',
        })) + control(ctx, '::before', declarations({
          '--_en-source-switch-thumb-inline': thumb,
          'inline-size': thumb ? 'var(--_en-source-switch-thumb-inline)' : undefined, 'block-size': thumb,
          'inset-block-start': thumb ? `calc((100% - ${thumb}) / 2)` : undefined,
          'inset-inline-start': inset ? `max(0px, calc(${inset} - var(--_en-source-switch-border)))` : undefined,
          transition: `inset-inline-start ${timing}, inset-block-start ${timing}, inline-size ${timing}, block-size ${timing}`,
        })) + control(ctx, ':checked::before', declarations({
          '--_en-source-switch-thumb-inline': checkedThumb,
          'block-size': checkedThumb,
          'inset-block-start': checkedThumb ? `calc((100% - ${checkedThumb}) / 2)` : undefined,
          'inset-inline-start': checkedThumb && checkedInset
            ? `calc(100% - var(--_en-source-switch-thumb-inline) - max(0px, calc(${checkedInset} - var(--_en-source-switch-border))))`
            : undefined,
        }));
        // The existing pressed-width hook stretches only the inline dimension.
        // Keep its track clamp, opt-out, and reduced-motion behavior while using
        // the correct source checked/off size as the unspecified-hook fallback.
        const pressedThumb = (value: string | undefined, outerInset: string | undefined) => declarations({
          '--_en-source-switch-thumb-inline': value && outerInset
            ? `clamp(0px, var(--en-switch-thumb-pressed-size, ${value}), calc(100% - 2 * max(0px, calc(${outerInset} - var(--_en-source-switch-border)))))`
            : undefined,
        });
        const pressedGeometry = switchInteraction(ctx, ':active', '::before', pressedThumb(thumb, inset))
          + switchInteraction(ctx, ':active', ':checked::before', pressedThumb(checkedThumb, checkedInset));
        const resetPressed = (context: CompanionPresentationContext) =>
          switchInteraction(context, ':active', '::before', declarations({ '--_en-source-switch-thumb-inline': thumb }))
          + switchInteraction(context, ':active', ':checked::before', declarations({ '--_en-source-switch-thumb-inline': checkedThumb }));
        const noPress = resetPressed({ ...ctx, selectors: ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
          ? `${selector}:is([data-press="none"], .en-choice[data-press="none"] > .en-switch)`
          : `${selector}[data-press="none"]`) });
        const offPaint = declarations({ background: ctx.role('background'), 'border-color': ctx.role('borderColor') });
        const onPaint = declarations({ background: ctx.role('checkedBackground'), 'border-color': ctx.role('checkedBorderColor') ?? ctx.role('borderColor') });
        const thumbPaint = declarations({ background: ctx.role('thumbBackground'), 'box-shadow': ctx.role('thumbShadow') });
        const checkedThumbPaint = declarations({ background: ctx.role('checkedThumbBackground') ?? ctx.role('thumbBackground'), 'box-shadow': ctx.role('checkedThumbShadow') ?? ctx.role('thumbShadow') });
        // Source paint never competes with disabled controls, including disabled
        // fieldsets and an explicitly ARIA-disabled public host/native input.
        const paintContext = { ...ctx, selectors: ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
          ? `${selector}:not([aria-disabled="true"])` : `${selector}:not(:disabled):not([aria-disabled="true"])`) };
        const interaction = (state: ':hover' | ':focus-visible' | ':active' | ':hover:active', suffix: string, css: string) =>
          switchInteraction(paintContext, state, suffix, css);
        const pressedBorder = (role: string) => ctx.role(role) === undefined ? undefined
          : `var(--en-switch-pressed-border-color, ${ctx.role(role)})`;
        const hasDisabledPaint = ['disabledOpacity', 'disabledBackground', 'disabledBorderColor', 'disabledThumbBackground', 'disabledThumbShadow', 'disabledCheckedBackground', 'disabledCheckedBorderColor', 'disabledCheckedThumbBackground'].some(role => ctx.role(role) !== undefined);
        const disabledTrack = declarations({ background: ctx.role('disabledBackground'), 'border-color': ctx.role('disabledBorderColor'), opacity: ctx.role('disabledOpacity') });
        const disabledCheckedTrack = declarations({ background: ctx.role('disabledCheckedBackground') ?? ctx.role('disabledBackground'), 'border-color': ctx.role('disabledCheckedBorderColor') ?? ctx.role('disabledBorderColor'), opacity: ctx.role('disabledOpacity') });
        const disabledThumb = declarations({ background: ctx.role('disabledThumbBackground'), 'box-shadow': ctx.role('disabledThumbShadow') });
        const disabledCheckedThumb = declarations({ background: ctx.role('disabledCheckedThumbBackground') ?? ctx.role('disabledThumbBackground'), 'box-shadow': ctx.role('disabledThumbShadow') });
        const disabled = (suffix: string, css: string) => css ? ctx.style(ctx.selectors.flatMap(selector => /:where\(\.en-/.test(selector)
          ? [`${nativeSurface(selector)}:is(:disabled, [aria-disabled="true"])${suffix}`,
            // ARIA disabling leaves the input natively enabled. Match the
            // shared held recipe's direct/label weight so it cannot repaint
            // this disabled source perimeter with its ordinary pressed hook.
            `${nativeSurface(selector)}[aria-disabled="true"]:enabled:is(:active, .en-choice:active > .en-switch)${suffix}`]
          : [`${selector}::part(control):disabled${suffix}`, `${selector}[aria-disabled="true"]::part(control)${suffix}`]), css) : '';
        const paint = control(paintContext, enabled, offPaint) + control(paintContext, `${enabled}:checked`, onPaint)
          + control(paintContext, `${enabled}::before`, thumbPaint) + control(paintContext, `${enabled}:checked::before`, checkedThumbPaint)
          + `@media (hover: hover) { ${interaction(':hover', '', declarations({ background: ctx.role('hoverBackground'), 'border-color': ctx.role('hoverBorderColor') }))}
            ${interaction(':hover', ':checked', declarations({ background: ctx.role('hoverCheckedBackground'), 'border-color': ctx.role('hoverCheckedBorderColor') }))}
            ${interaction(':hover', '::before', declarations({ background: ctx.role('hoverThumbBackground') }))}
            ${interaction(':hover', ':checked::before', declarations({ background: ctx.role('hoverCheckedThumbBackground') }))} }`
          + interaction(':focus-visible', '', declarations({ background: ctx.role('focusBackground'), 'border-color': ctx.role('focusBorderColor') }))
          + interaction(':focus-visible', ':checked', declarations({ background: ctx.role('focusCheckedBackground'), 'border-color': ctx.role('focusCheckedBorderColor') }))
          + interaction(':focus-visible', '::before', declarations({ background: ctx.role('focusThumbBackground') }))
          + interaction(':focus-visible', ':checked::before', declarations({ background: ctx.role('focusCheckedThumbBackground') }))
          + interaction(':active', '', declarations({ background: ctx.role('pressedBackground'), 'border-color': pressedBorder('pressedBorderColor') }))
          + interaction(':active', ':checked', declarations({ background: ctx.role('pressedCheckedBackground'), 'border-color': pressedBorder('pressedCheckedBorderColor') }))
          + interaction(':active', '::before', declarations({ background: ctx.role('pressedThumbBackground') }))
          + interaction(':active', ':checked::before', declarations({ background: ctx.role('pressedCheckedThumbBackground') }))
          + `@media (hover: hover) { ${interaction(':hover:active', '', declarations({ background: ctx.role('hoverPressedBackground') }))}
            ${interaction(':hover:active', ':checked', declarations({ background: ctx.role('hoverPressedCheckedBackground') }))} }`
          + (hasDisabledPaint ? disabled('', `${offPaint} ${disabledTrack}`)
            + disabled(':checked', `${onPaint} ${disabledCheckedTrack}`)
            + disabled('::before', `${thumbPaint} ${disabledThumb}`)
            + disabled(':checked::before', `${checkedThumbPaint} ${disabledCheckedThumb}`) : '')
          + (ctx.role('disabledOpacity') ? ctx.style(ctx.selectors.filter(selector => !/:where\(\.en-/.test(selector))
            .map(selector => `${selector}:disabled::part(label-text)`), `opacity: ${ctx.role('disabledOpacity')};`) : '');
        return geometry + pressedGeometry + noPress + authorPaint(paint)
          + `@media (forced-colors: active) { ${control(ctx, '', '--_en-source-switch-border: var(--en-border-width);')} }`
          + `@media (prefers-reduced-motion: reduce) { ${resetPressed(ctx)} ${control(ctx, '::before', 'transition: none;')} }`;
      },
    },
  },
  'inset-field': {
    inset: {
      roles: { hoverShadow: 'shadow', focusShadow: 'shadow' },
      render(ctx) {
        const field = (suffix: string, css: string) => css ? ctx.style(ctx.selectors.map(selector => {
          if (/:where\(\.en-/.test(selector)) return `${nativeSurface(selector)}${selector.includes('.en-number-group') ? ':not(:has(> .en-number-input:disabled)):not([data-invalid])' : ':not([aria-invalid="true"]):valid'}${suffix}`;
          // The token editor is not form-associated: :valid never matches its
          // host. Its reflected disabled state guards the public editing Part.
          if (selector.includes('en-token-editor')) return `${selector}:not([disabled]):not([aria-disabled="true"]):not([aria-invalid="true"])::part(control)${suffix}`;
          const part = selector.includes('en-number-field') ? 'focus-frame' : 'control';
          return `${selector}:not(:disabled):valid::part(${part})${suffix}`;
        }), css) : '';
        const hover = ctx.role('hoverShadow');
        const focus = ctx.role('focusShadow');
        // The primary outline remains component-owned and immediate. Compose
        // its optional public halo with the inset rather than erasing it.
        const halo = '0 0 0 var(--en-input-focus-halo-width, var(--en-focus-halo-width)) var(--en-input-focus-halo-color, var(--en-color-focus-halo))';
        const compoundFocus = focus ? ctx.style(ctx.selectors.filter(selector => selector.includes('en-number-field') || selector.includes('.en-number-group'))
          .map(selector => /:where\(\.en-/.test(selector)
            ? `${nativeSurface(selector)}:not(:has(> .en-number-input:disabled)):not([data-invalid]):focus-within`
            : `${selector}:not(:disabled):valid::part(focus-frame):focus-within`), `box-shadow: ${focus}, ${halo};`) : '';
        return authorPaint(
          `@media (hover: hover) { ${field(':not(:disabled):not(:focus-within):hover', declarations({ 'box-shadow': hover }))} }`
          + field(':focus-within', declarations({ 'box-shadow': focus }))
          + field(':focus-visible', declarations({ 'box-shadow': focus ? `${focus}, ${halo}` : undefined }))
          + compoundFocus,
        );
      },
    },
  },
  'raised-segments': {
    raised: {
      roles: {
        frameInset: 'dimension', radius: 'dimension', gap: 'dimension',
        background: 'color', color: 'color', hoverBackground: 'color', pressedBackground: 'color',
        selectedBackground: 'color', selectedColor: 'color', selectedShadow: 'shadow',
        selectedHoverBackground: 'color', selectedPressedBackground: 'color',
        weight: 'fontWeight', selectedWeight: 'fontWeight', disabledOpacity: 'number',
      },
      render(ctx) {
        const frame = (css: string) => css ? ctx.style(ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
          ? nativeSurface(selector) : `${selector}::part(options)`), css) : '';
        const option = (part: string, nativeSuffix: string, css: string, state = '') => css ? ctx.style(ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
          ? `${nativeSurface(selector)} > .en-segmented-item:not([data-en-theme])${nativeSuffix}${state}`
          : `${selector}::part(${part})${state}`), css) : '';
        const frameInset = `var(--en-segmented-control-frame-inset, ${ctx.role('frameInset') ?? 'var(--en-space-1)'})`;
        const radius = `var(--en-control-radius, ${ctx.role('radius') ?? 'var(--en-radius-control)'})`;
        const shadow = ctx.role('selectedShadow');
        return frame(declarations({ padding: frameInset, gap: ctx.role('gap'), 'border-radius': radius }))
          + option('option', '', declarations({ 'border-radius': `max(0px, calc(${radius} - ${frameInset}))`, 'font-weight': ctx.role('weight') }))
          + option('option-selected', '[data-selected]', declarations({ 'font-weight': ctx.role('selectedWeight') }))
          + authorPaint(frame(declarations({ 'border-color': 'transparent', background: ctx.role('background') }))
            + option('option-enabled', ':not([data-disabled])', declarations({ 'border-color': 'transparent', background: 'transparent', color: ctx.role('color') }))
            + `@media (hover: hover) { ${option('option-enabled', ':not([data-disabled])', declarations({ background: ctx.role('hoverBackground') }), ':hover')} }`
            + option('option-selected option-enabled', '[data-selected]:not([data-disabled])', declarations({ background: ctx.role('selectedBackground'), color: ctx.role('selectedColor'), 'box-shadow': shadow }))
            + `@media (hover: hover) { ${option('option-selected option-enabled', '[data-selected]:not([data-disabled])', declarations({ background: ctx.role('selectedHoverBackground') }), ':hover')} }`
            + option('option-enabled', ':not([data-disabled])', declarations({ background: ctx.role('pressedBackground') }), ':active')
            + option('option-selected option-enabled', '[data-selected]:not([data-disabled])', declarations({ background: ctx.role('selectedPressedBackground'), 'box-shadow': shadow }), ':active')
            + option('option-selected option-enabled', '[data-selected]:not([data-disabled])', declarations({ 'box-shadow': shadow ? `${shadow}, 0 0 0 var(--en-focus-halo-width) var(--en-color-focus-halo)` : undefined }), ':focus-within')
            + option('option-disabled', '[data-disabled]', declarations({ opacity: ctx.role('disabledOpacity') })));
      },
    },
  },
  'dialog-surface': {
    plain: {
      roles: { background: 'color', color: 'color', borderColor: 'color', borderWidth: 'dimension', fontSize: 'dimension', lineHeight: 'number', fontWeight: 'fontWeight', backdropBlur: 'dimension' },
      render(ctx) {
        const surface = (suffix: string, css: string) => css ? ctx.style(ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
          ? `${nativeSurface(selector)}${suffix}`
          : `${selector}::part(surface)${suffix}`), css) : '';
        return surface('', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('fontWeight') }))
          + authorPaint(ctx.block('', declarations({ '--en-overlay-background': ctx.role('background'), '--en-overlay-color': ctx.role('color'), '--en-overlay-border-color': ctx.role('borderColor') }))
            + surface('', declarations({ 'border-width': ctx.role('borderWidth') }))
            + surface('::backdrop', declarations({ 'backdrop-filter': ctx.role('backdropBlur') ? `blur(${ctx.role('backdropBlur')})` : undefined })));
      },
    },
  },
  'token-text': {
    supporting: {
      roles: { fontSize: 'dimension', lineHeight: 'number', weight: 'fontWeight' },
      render: ctx => ctx.block('::part(token)', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight') })),
    },
  },
} satisfies CompanionPresentationRegistry;
