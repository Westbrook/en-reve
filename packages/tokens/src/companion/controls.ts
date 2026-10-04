import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';
import { sourceSizedRoles, sourceSizedValue } from './astryx.js';

/** Finite control surfaces. Every shadow selector below addresses a documented Part. */
export const controlTargets = {
  'form-field': ['en-text-field', 'en-search-input', 'en-textarea', 'en-number-field', 'en-combobox', 'en-select', 'en-checkbox', 'en-radio', 'en-switch'],
  'text-control': ['en-text-field', 'en-search-input', 'en-textarea', 'en-number-field', 'en-combobox', 'en-select'],
  textarea: ['en-textarea', '.en-textarea'],
  'number-field': ['en-number-field'],
  combobox: ['en-combobox'],
  'native-select': ['en-select'],
  checkbox: ['en-checkbox'],
  radio: ['en-radio'],
  switch: ['en-switch'],
  rating: ['en-rating', '.en-rating'],
} as const;

/** The native button variant is a public selector, and its state paint must
 * match the variant/class specificity of the delivered button stylesheet. */
function controlSurface(selector: string): string {
  return nativeSurface(selector.replace(
    /:where\((\.en-button)(\[data-variant="(?:primary|secondary|ghost|danger)"\])\)/g,
    ':where($1)$2',
  ));
}

function part(ctx: CompanionPresentationContext, name: string, css: string, state = ''): string {
  if (!css) return '';
  // Native recipes address their own surface; custom hosts expose a public Part.
  return ctx.selectors.map(selector => ctx.style([/:where\(\.en-/.test(selector)
    ? `${controlSurface(selector)}${state}`
    : `${selector}::part(${name})${state}`], css)).join('\n');
}
/** The documented native rating recipe owns these light-DOM children. Custom
 * elements continue to use Parts, never the equivalent shadow ancestry. */
function ratingPart(ctx: CompanionPresentationContext, name: 'star-options' | 'star-option' | 'star' | 'star-filled', css: string, disabled = false): string {
  if (!css) return '';
  const children = {
    'star-options': ' > .en-rating-values:not([data-en-theme])',
    'star-option': ' > .en-rating-values:not([data-en-theme]) > .en-rating-item:not([data-en-theme])',
    star: ' > .en-rating-values:not([data-en-theme]) > .en-rating-item:not([data-en-theme]) > .en-rating-star:not([data-en-theme])',
    'star-filled': ' > .en-rating-values:not([data-en-theme]) > .en-rating-item:not([data-en-theme]) > .en-rating-star:not([data-en-theme])[data-filled]',
  };
  return ctx.selectors.map(selector => ctx.style([/:where\(\.en-/.test(selector)
    ? `${nativeSurface(selector)}${disabled ? `:has(${children['star-option']} > .en-rating-input:not([data-en-theme]):disabled)` : ''}${children[name]}`
    : `${selector}${disabled ? ':is([disabled], :disabled)' : ''}::part(${name})`], css)).join('\n');
}
function sized(ctx: CompanionPresentationContext, name: string, property: string, role: string): string {
  return (['small', 'medium', 'large'] as const).map(size => {
    const value = ctx.role(`${role}-${size}`);
    return value === undefined ? '' : ctx.selectors.map(selector => ctx.style([/:where\(\.en-/.test(selector)
      ? `${controlSurface(selector)}[data-size="${size}"]`
      : `${selector}[size="${size}"]::part(${name})`], `${property}: ${value};`)).join('\n');
  }).join('\n');
}
function sizedHook(ctx: CompanionPresentationContext, property: string, role: string): string {
  return (['small', 'medium', 'large'] as const).map(size => {
    const value = ctx.role(`${role}-${size}`);
    return value === undefined ? '' : ctx.selectors.map(selector => ctx.style([
      `${selector}:where([${/:where\(\.en-/.test(selector) ? 'data-size' : 'size'}="${size}"])`], `${property}: ${value};`)).join('\n');
  }).join('\n');
}
function disabledLabel(ctx: CompanionPresentationContext, name = 'label'): string {
  return ctx.role('disabled-opacity') === undefined ? '' : ctx.block(`:disabled::part(${name})`, `opacity: ${ctx.role('disabled-opacity')};`);
}
const disabledRole = { 'disabled-opacity': 'number' } as const;
const lineHeightRoles = { 'line-height-small': 'number', 'line-height-medium': 'number', 'line-height-large': 'number' } as const;
const choiceRoles = {
  ...disabledRole, gap: 'dimension', 'gap-small': 'dimension', 'gap-medium': 'dimension', 'gap-large': 'dimension', 'label-line-height': 'number',
  background: 'color', border: 'color', 'selected-background': 'color',
  'selected-color': 'color',
} as const;
function choice(ctx: CompanionPresentationContext, radio: boolean): string {
  const selected = radio ? ':checked' : ':is(:checked, :indeterminate)';
  const geometry = part(ctx, 'label', declarations({gap: ctx.role('gap')}))
    + sized(ctx, 'label', 'gap', 'gap')
    + part(ctx, 'label-text', declarations({'line-height': ctx.role('label-line-height')}));
  const paint = part(ctx, 'control', declarations({background: ctx.role('background'), 'border-color': ctx.role('border')}))
    + part(ctx, 'control', declarations({background: ctx.role('selected-background'), 'border-color': ctx.role('selected-background')}), selected)
    + part(ctx, 'control', declarations({opacity: ctx.role('disabled-opacity')}), ':disabled')
    + disabledLabel(ctx, 'label-text')
    + part(ctx, 'control', radio
      ? declarations({background: ctx.role('selected-color')})
      : declarations({'border-color': ctx.role('selected-color')}), `${selected}::before`);
  // Preserve the existing native dot, including its checked-state visibility.
  return geometry + (radio ? part(ctx, 'control', 'inline-size: 40%; block-size: 40%;', ':checked::before') : '') + authorPaint(paint);
}

export const controlPresentations = {
  link: {
    plain: {
      roles: { color: 'color', 'underline-color': 'color', radius: 'dimension', gap: 'dimension', 'underline-offset': 'dimension' },
      render(ctx) {
        const geometry = declarations({display: 'inline-flex', 'align-items': 'center', 'max-inline-size': '100%', gap: ctx.role('gap'), 'border-radius': ctx.role('radius'), 'text-decoration-line': 'none', 'text-decoration-style': 'solid', 'text-decoration-thickness': 'auto', 'text-underline-offset': ctx.role('underline-offset')});
        const paint = declarations({color: ctx.role('color'), 'text-decoration-color': ctx.role('underline-color')});
        const links = ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
          ? `${controlSurface(selector)}:not([aria-disabled="true"])`
          : `${selector}::part(control)`);
        return part(ctx, 'control', geometry)
          + links.map(selector => ctx.style([`${selector}:active`], 'text-decoration-thickness: auto;')).join('\n')
          + `@media (hover: hover) { ${links.map(selector => ctx.style([`${selector}:hover`], 'text-decoration-line: underline;')).join('\n')} }`
          + authorPaint(links.map(selector => ctx.style([selector], paint)).join('\n'));
      },
    },
  },
  button: {
    compact: {
      roles: {
        ...disabledRole, ...lineHeightRoles, background: 'color', color: 'color', border: 'color',
        'inline-padding-small': 'dimension', 'inline-padding-medium': 'dimension', 'inline-padding-large': 'dimension',
        'gap-small': 'dimension', 'gap-medium': 'dimension', 'gap-large': 'dimension',
        duration: 'duration', 'focus-color': 'color',
      },
      render(ctx) {
        const focus = ctx.role('focus-color');
        const disabledPaint = declarations({background: ctx.role('background'), color: ctx.role('color'), 'border-color': ctx.role('border'), opacity: ctx.role('disabled-opacity')});
        return sizedHook(ctx, '--en-button-inline-padding', 'inline-padding')
          + sizedHook(ctx, '--en-font-ui-line-height', 'line-height')
          + sized(ctx, 'control', 'gap', 'gap')
          + part(ctx, 'control', declarations({'transition-duration': ctx.role('duration')}))
          + authorPaint(part(ctx, 'control', declarations({'outline-color': focus === undefined ? undefined : `var(--en-button-focus-color, ${focus})`}), ':focus-visible'))
          + authorPaint(part(ctx, 'control', disabledPaint, ':disabled')
            + ctx.selectors.filter(selector => !/:where\(\.en-/.test(selector)).map(selector => ctx.style([`${selector}[aria-disabled="true"]::part(control)`], disabledPaint)).join('\n')
            + ctx.selectors.filter(selector => /:where\(\.en-/.test(selector)).map(selector => ctx.style([`${controlSurface(selector)}[aria-disabled="true"]`], disabledPaint)).join('\n'));
      },
    },
  },
  'form-field': {
    compact: {
      roles: {...disabledRole, 'helper-size': 'dimension', 'helper-line-height': 'number', 'helper-weight': 'fontWeight', 'error-size': 'dimension', 'error-line-height': 'number', 'error-weight': 'fontWeight'},
      render(ctx) {
        return part(ctx, 'description', declarations({'font-size': ctx.role('helper-size'), 'line-height': ctx.role('helper-line-height'), 'font-weight': ctx.role('helper-weight')}))
          + part(ctx, 'error', declarations({'font-size': ctx.role('error-size'), 'line-height': ctx.role('error-line-height'), 'font-weight': ctx.role('error-weight')}))
          + authorPaint(ctx.selectors.filter(selector => !/:where\(en-(checkbox|radio|switch)\)/.test(selector))
            .map(selector => ctx.style([`${selector}:disabled::part(label)`], declarations({opacity: ctx.role('disabled-opacity')}))).join('\n'));
      },
    },
  },
  'text-control': {
    outline: {
      roles: {...disabledRole, ...lineHeightRoles, background: 'color', color: 'color', border: 'color', 'inline-padding-small': 'dimension', 'inline-padding-medium': 'dimension', 'inline-padding-large': 'dimension'},
      render(ctx) {
        return sizedHook(ctx, '--en-input-inline-padding', 'inline-padding')
          + sizedHook(ctx, '--en-font-input-line-height', 'line-height')
          + authorPaint(part(ctx, 'control', declarations({background: ctx.role('background'), color: ctx.role('color'), 'border-color': ctx.role('border'), opacity: ctx.role('disabled-opacity')}), ':disabled'));
      },
    },
  },
  textarea: {
    compact: {
      roles: {'block-padding': 'dimension', 'block-padding-em': 'number', 'block-padding-small': 'dimension', 'block-padding-medium': 'dimension', 'block-padding-large': 'dimension'},
      render(ctx) {
        // A finite relative role follows the editor's actual font size without
        // expanding the public DTCG dimension grammar beyond px/rem.
        const relativePadding = ctx.role('block-padding-em');
        const padding = relativePadding === undefined ? ctx.role('block-padding') : `${relativePadding}em`;
        return part(ctx, 'control', declarations({'padding-block': padding, 'scroll-padding-block-end': padding}))
          + sized(ctx, 'control', 'padding-block', 'block-padding');
      },
    },
  },
  'number-field': {
    subtle: {
      roles: {...disabledRole, background: 'color', color: 'color', 'hover-background': 'color', 'pressed-background': 'color'},
      render(ctx) {
        return part(ctx, 'control', 'font-variant-numeric: proportional-nums;')
          + authorPaint(['decrement', 'increment'].map(name =>
          part(ctx, name, declarations({background: ctx.role('background'), color: ctx.role('color')}))
          + `@media (hover: hover) { ${part(ctx, name, declarations({background: ctx.role('hover-background')}), ':enabled:hover')} }`
          + part(ctx, name, declarations({background: ctx.role('pressed-background')}), ':enabled:active')
          + part(ctx, name, declarations({opacity: ctx.role('disabled-opacity')}), ':disabled')).join('\n'));
      },
    },
  },
  combobox: {
    compact: {
      roles: { 'indicator-size': 'dimension', 'input-end-padding': 'dimension', 'input-end-padding-small': 'dimension', 'input-end-padding-medium': 'dimension', 'input-end-padding-large': 'dimension', 'large-minimum': 'dimension', 'trigger-background': 'color', 'trigger-color': 'color', 'disabled-opacity': 'number' },
      render(ctx) {
        const padding = (coarse = false) => ['', 'small', 'medium', 'large'].map(size => {
          const value = ctx.role(size ? `input-end-padding-${size}` : 'input-end-padding');
          if (!value) return '';
          // The inherited branch retains the native recipe's selected-size reserve.
          const suffix = `${size ? `[size="${size}"]` : ':not([size="inherit"])'}::part(control)`;
          const growth = 'calc(1em * var(--en-font-input-line-height) + 2 * var(--en-space-control-block) + 2 * var(--en-border-width))';
          const target = coarse ? ', calc(var(--en-size-target-touch) + 2 * var(--en-space-1) + 2 * var(--en-border-width))' : '';
          return ctx.block(suffix, `padding-inline-end: max(${value}, ${growth}${target});`);
        }).join('\n');
        return padding() + `@media (any-pointer: coarse) { ${padding(true)} }`
          + ctx.block(':where([size="large"])', declarations({'--en-control-min-size': ctx.role('large-minimum')}))
          + part(ctx, 'option-indicator', declarations({'inline-size': ctx.role('indicator-size'), 'block-size': ctx.role('indicator-size')}))
          + authorPaint(part(ctx, 'popup', 'border-width: 0;')
            + part(ctx, 'trigger', declarations({background: ctx.role('trigger-background'), color: ctx.role('trigger-color')}))
            + part(ctx, 'trigger', declarations({opacity: ctx.role('disabled-opacity')}), ':disabled')
            + part(ctx, 'option-disabled', declarations({opacity: ctx.role('disabled-opacity')})));
      },
    },
  },
  'native-select': {
    compact: {
      roles: {'end-padding': 'dimension', 'indicator-size': 'dimension', 'indicator-inset': 'dimension', 'indicator-color': 'color'},
      render(ctx) {
        return part(ctx, 'control', declarations({'padding-inline-end': ctx.role('end-padding')}))
          + ctx.block('::part(control)::picker-icon', declarations({'inline-size': ctx.role('indicator-size'), 'block-size': ctx.role('indicator-size')}))
          + ctx.block('::part(focus-frame)::before', declarations({'inline-size': ctx.role('indicator-size'), 'block-size': ctx.role('indicator-size'), 'inset-inline-end': ctx.role('indicator-inset')}))
          + authorPaint(ctx.block('::part(control)::picker-icon', declarations({color: ctx.role('indicator-color')}))
            + ctx.block('::part(focus-frame)::before', declarations({color: ctx.role('indicator-color')})));
      },
    },
  },
  checkbox: {solid: {roles: choiceRoles, render: ctx => choice(ctx, false)}},
  radio: {solid: {roles: choiceRoles, render: ctx => choice(ctx, true)}},
  switch: {
    solid: {
      roles: {...choiceRoles, 'thumb-background': 'color', 'thumb-shadow': 'shadow'},
      render(ctx) {
        return part(ctx, 'label', declarations({gap: ctx.role('gap')}))
          + sized(ctx, 'label', 'gap', 'gap')
          + part(ctx, 'label-text', declarations({'line-height': ctx.role('label-line-height')}))
          // A transparent existing border preserves the established RTL inset arithmetic.
          + authorPaint(part(ctx, 'control', declarations({background: ctx.role('background'), 'border-color': ctx.role('border')}))
            + part(ctx, 'control', declarations({background: ctx.role('selected-background'), 'border-color': ctx.role('border')}), ':checked')
            + part(ctx, 'control', declarations({background: ctx.role('thumb-background'), 'box-shadow': ctx.role('thumb-shadow')}), '::before')
            + part(ctx, 'control', declarations({background: ctx.role('selected-color')}), ':checked::before')
            + part(ctx, 'control', declarations({opacity: ctx.role('disabled-opacity')}), ':disabled')
            + disabledLabel(ctx, 'label-text'));
      },
    },
  },
  'segmented-control': {
    enclosed: {
      roles: {...disabledRole, radius: 'dimension', 'inline-padding': 'dimension', background: 'color', color: 'color', shadow: 'shadow', 'selected-background': 'color', 'selected-shadow': 'shadow', weight: 'fontWeight'},
      render(ctx) {
        return part(ctx, 'options', declarations({padding: '0', gap: '0', 'border-radius': ctx.role('radius')}))
          + part(ctx, 'option', declarations({'min-block-size': 'inherit', 'padding-block': 'var(--en-space-control-block)', 'padding-inline': ctx.role('inline-padding'), 'border-radius': ctx.role('radius'), 'font-weight': ctx.role('weight')}))
          + authorPaint(part(ctx, 'options', 'border-width: 0;') + part(ctx, 'option', 'border-width: 0;')
            + part(ctx, 'options', declarations({background: ctx.role('background'), 'box-shadow': ctx.role('shadow')}))
            + part(ctx, 'option', declarations({background: 'transparent', color: ctx.role('color')}))
            + part(ctx, 'option-enabled', 'background: transparent;', ':hover')
            + part(ctx, 'option-enabled', 'background: transparent;', ':active')
            + part(ctx, 'option-selected', declarations({background: ctx.role('selected-background'), color: ctx.role('color'), 'box-shadow': ctx.role('selected-shadow'), 'font-weight': ctx.role('weight')}))
            + part(ctx, 'option-disabled', declarations({opacity: ctx.role('disabled-opacity')})));
      },
    },
  },
  rating: {
    compact: {
      roles: {
        'filled-color': 'color', 'empty-color': 'color', 'disabled-filled-color': 'color', 'disabled-opacity': 'number',
        'pressed-background': 'color', 'pressed-scale': 'number', 'pressed-offset': 'dimension', 'pressed-shadow': 'shadow',
        ...sourceSizedRoles('glyphSize'), ...sourceSizedRoles('glyphInlineSize'), ...sourceSizedRoles('glyphBlockSize'),
        ...sourceSizedRoles('gap'), ...sourceSizedRoles('padding'), ...sourceSizedRoles('targetSize'),
      },
      render(ctx) {
        const size = (name: string) => sourceSizedValue(ctx, name);
        const target = size('targetSize');
        const side = target ? `max(var(--en-size-target-min), ${target})` : 'auto';
        const glyphInline = size('glyphInlineSize');
        const glyphBlock = size('glyphBlockSize');
        return ratingPart(ctx, 'star-options', `gap: ${size('gap') ?? '0'};`)
          // Source symbol cells may be smaller than interactive radio targets.
          // Keep positive targets square and retain both pointer target floors.
          + ratingPart(ctx, 'star-option', `box-sizing: border-box; inline-size: ${side}; block-size: ${side}; min-inline-size: var(--en-size-target-min); min-block-size: var(--en-size-target-min); padding: ${size('padding') ?? '0'};`)
          + ratingPart(ctx, 'star', declarations({
            'font-size': size('glyphSize'), 'line-height': size('glyphSize') ? '1' : undefined,
            'inline-size': glyphInline, 'block-size': glyphBlock,
            display: glyphInline || glyphBlock ? 'inline-flex' : undefined,
            'align-items': glyphInline || glyphBlock ? 'center' : undefined,
            'justify-content': glyphInline || glyphBlock ? 'center' : undefined,
          }))
          + ratingPart(ctx, 'star-option', declarations({
            '--_en-source-rating-pressed-scale': ctx.role('pressed-scale'),
            '--_en-source-rating-pressed-offset': ctx.role('pressed-offset'),
          }))
          + `@media (any-pointer: coarse) { ${ratingPart(ctx, 'star-option', 'min-inline-size: var(--en-size-target-touch); min-block-size: var(--en-size-target-touch);')} }`
          // Public semantic paint inputs retain the internal filled/disabled state ownership.
          + authorPaint(ratingPart(ctx, 'star-option', declarations({
            'border-width': '0', '--_en-source-rating-pressed-background': ctx.role('pressed-background'), '--_en-source-rating-pressed-shadow': ctx.role('pressed-shadow'),
          })) + ratingPart(ctx, 'star', declarations({'--en-color-action-text': ctx.role('filled-color'), '--en-color-text-muted': ctx.role('empty-color')}))
          // The semantic Part follows the actual score in CSR and SSR. Refine
          // the existing disabled ink input without replacing native state.
          + ratingPart(ctx, 'star-filled', declarations({ '--en-color-text-muted': ctx.role('disabled-filled-color') }), true)
          + ratingPart(ctx, 'star-options', declarations({ opacity: ctx.role('disabled-opacity') }), true));
      },
    },
  },
} as const satisfies CompanionPresentationRegistry;
