import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Optional Fluent anatomy over public Parts and documented native helpers.
 * Source: microsoft/fluentui babf26015958505fc6fc0216724f2f61244f829c,
 * packages/web-components/src/{checkbox,switch,dropdown}/*.styles.ts.
 * Event, validity, native editing and focus ownership remain in the component. */
export const fluentTargets = {
  'fluent-field': ['en-text-field', 'en-search-input', 'en-textarea', 'en-combobox', 'en-select', '.en-input', '.en-textarea', '.en-select'],
  'fluent-number-field': ['en-number-field', '.en-number-group'],
  'fluent-checkbox': ['en-checkbox', '.en-checkbox'],
  'fluent-switch': ['en-switch', '.en-switch'],
  // Public formStyles compositions include standalone choices and the optional
  // choice-content wrapper as well as the ordinary field group.
  'fluent-native-field': ['.en-field', '.en-choice', '.en-choice-content'],
} as const;

function surface(ctx: CompanionPresentationContext, part: string, css: string, state = ''): string {
  if (!css) return '';
  return ctx.style(ctx.selectors.map(selector => /:where\(\.en-/.test(selector)
    ? `${nativeSurface(selector)}${state}`
    : `${selector}::part(${part})${state}`), css);
}

const edgeRoles = {
  perimeter: 'color', 'perimeter-hover': 'color', bottom: 'color', 'bottom-hover': 'color',
} as const;

function edges(ctx: CompanionPresentationContext, compound = false): string {
  const part = compound ? 'stepper' : 'control';
  // Public hooks leave the owned invalid contour authoritative. Bottom paint
  // never changes border widths/padding or consumes the focus-frame ::after.
  const hooks = ctx.block('', declarations({
    '--en-input-border-color': ctx.role('perimeter'),
    '--en-input-hover-border-color': ctx.role('perimeter-hover'),
  }));
  const bottom = declarations({ 'border-block-end-color': ctx.role('bottom') ? `var(--en-input-bottom-border-color, ${ctx.role('bottom')})` : undefined });
  const hoverFallback = ctx.role('bottom-hover') ?? ctx.role('bottom');
  const hover = declarations({ 'border-block-end-color': hoverFallback ? `var(--en-input-hover-bottom-border-color, var(--en-input-bottom-border-color, ${hoverFallback}))` : undefined });
  const invalid = 'border-block-end-color: var(--en-input-invalid-border-color, var(--en-color-danger-text));';
  const rules = ctx.selectors.map(selector => {
    if (/:where\(\.en-/.test(selector)) {
      // Native recipes expose visible error state through authored attributes
      // and :user-invalid. Raw :invalid also matches pristine required fields.
      const native = nativeSurface(selector);
      const enabled = compound
        ? ':not([data-invalid]):not([aria-invalid="true"]):not([aria-disabled="true"]):has(> .en-number-input:enabled:not([aria-disabled="true"]):not([aria-invalid="true"]):not(:user-invalid))'
        : ':enabled:not([aria-disabled="true"]):not([aria-invalid="true"]):not(:user-invalid)';
      return ctx.style([`${native}${enabled}`], bottom)
        + `\n@media (hover: hover) { ${ctx.style([`${native}${enabled}:hover`], hover)} }`;
    }
    const host = `${selector}:not(:disabled):not([aria-disabled="true"])`;
    const enabled = compound ? '' : ':enabled';
    const frame = (name: string, state = enabled) => `${host}::part(${name})${state}`;
    const ordinary = frame(part), error = frame(`${part}-invalid`);
    // Additive invalid Parts mirror visible feedback, so untouched required
    // controls retain the source edge while reported errors keep danger paint.
    // Match hover specificity explicitly; a normal error rule alone would lose
    // to the ordinary hover rule on the same exported native surface.
    let css = ctx.style([ordinary], bottom) + '\n' + ctx.style([error], invalid) + '\n'
      + `@media (hover: hover) { ${ctx.style([`${ordinary}:hover`], hover)} ${ctx.style([`${error}:hover`], invalid)} }`;
    if (/\ben-text-field\b/.test(selector)) {
      const adorned = `${host}[adorned]`;
      css += '\n' + ctx.style([`${adorned}::part(focus-frame)`], bottom)
        + '\n' + ctx.style([`${adorned}::part(focus-frame-invalid)`], invalid) + '\n'
        + `@media (hover: hover) { ${ctx.style([`${adorned}::part(focus-frame):hover`], hover)} ${ctx.style([`${adorned}::part(focus-frame-invalid):hover`], invalid)} }`;
    }
    return css;
  }).join('\n');
  return authorPaint(hooks + rules);
}

const choiceRoles = {
  background: 'color', border: 'color', 'hover-border': 'color', 'pressed-border': 'color',
  'selected-background': 'color', 'selected-hover-background': 'color', 'selected-pressed-background': 'color',
  'selected-color': 'color', 'disabled-mark': 'color', 'disabled-background': 'color', 'disabled-border': 'color',
} as const;

function checkbox(ctx: CompanionPresentationContext): string {
  const paint = (state: string, values: Record<string, string | undefined>) => surface(ctx, 'control', declarations(values), state);
  const enabled = ':not(:disabled)';
  const checked = ':checked:not(:indeterminate)';
  const selected = ':is(:checked, :indeterminate)';
  const mark = ':indeterminate::before';
  const geometry = paint(mark, {
    content: "''", 'inline-size': ctx.role('mixed-size'), 'block-size': ctx.role('mixed-size'), border: '0',
    'border-radius': 'var(--en-radius-choice)', transform: 'none',
  });
  const base = paint(enabled, { background: ctx.role('background'), 'border-color': ctx.role('border') })
    + paint(`${enabled}${checked}`, { background: ctx.role('selected-background'), 'border-color': ctx.role('selected-background') })
    + paint(`${enabled}${checked}::before`, { 'border-color': ctx.role('selected-color') })
    + paint(`${enabled}:indeterminate`, { background: ctx.role('background'), 'border-color': ctx.role('selected-background') })
    + paint(`${enabled}${mark}`, { background: ctx.role('selected-background') })
    + paint(':disabled', { background: ctx.role('disabled-background'), 'border-color': ctx.role('disabled-border') })
    + paint(`:disabled${checked}::before`, { 'border-color': ctx.role('disabled-mark') })
    + paint(`:disabled${mark}`, { background: ctx.role('disabled-mark') });
  const hover = paint(`${enabled}:hover`, { 'border-color': ctx.role('hover-border') })
    + paint(`${enabled}${selected}:hover`, { 'border-color': ctx.role('selected-hover-background') })
    + paint(`${enabled}${checked}:hover`, { background: ctx.role('selected-hover-background') })
    + paint(`${enabled}:indeterminate:hover::before`, { background: ctx.role('selected-hover-background') });
  const held = paint(`${enabled}:active`, { 'border-color': ctx.role('pressed-border') })
    + paint(`${enabled}${selected}:active`, { 'border-color': ctx.role('selected-pressed-background') })
    + paint(`${enabled}${checked}:active`, { background: ctx.role('selected-pressed-background') })
    + paint(`${enabled}:indeterminate:active::before`, { background: ctx.role('selected-pressed-background') });
  // The mixed mark uses a background rather than the default dash border.
  // Keep it visible when author paint is suppressed in forced colors.
  const forced = paint(mark, { background: 'CanvasText', 'forced-color-adjust': 'none' })
    + paint(`:disabled${mark}`, { background: 'GrayText' });
  return geometry + authorPaint(base + `@media (hover: hover) { ${hover} }` + held)
    + `@media (forced-colors: active) { ${forced} }`;
}

function switchPaint(ctx: CompanionPresentationContext): string {
  const paint = (state: string, values: Record<string, string | undefined>) => surface(ctx, 'control', declarations(values), state);
  const enabled = ':not(:disabled)';
  const base = paint(enabled, { background: ctx.role('background'), 'border-color': ctx.role('border') })
    + paint(`${enabled}::before`, { background: ctx.role('thumb') })
    + paint(`${enabled}:checked`, { background: ctx.role('selected-background'), 'border-color': ctx.role('selected-background') })
    + paint(`${enabled}:checked::before`, { background: ctx.role('selected-color') })
    + paint(':disabled', { background: ctx.role('background'), 'border-color': ctx.role('disabled-border') })
    + paint(':disabled:checked', { background: ctx.role('disabled-background') })
    + paint(':disabled::before', { background: ctx.role('disabled-mark') });
  const hover = paint(`${enabled}:hover`, { 'border-color': ctx.role('hover-border') })
    + paint(`${enabled}:hover::before`, { background: ctx.role('thumb-hover') })
    + paint(`${enabled}:checked:hover`, { background: ctx.role('selected-hover-background'), 'border-color': ctx.role('selected-hover-background') })
    + paint(`${enabled}:checked:hover::before`, { background: ctx.role('selected-color') });
  const held = paint(`${enabled}:active`, { 'border-color': ctx.role('pressed-border') })
    + paint(`${enabled}:active::before`, { background: ctx.role('thumb-pressed') })
    + paint(`${enabled}:checked:active`, { background: ctx.role('selected-pressed-background'), 'border-color': ctx.role('selected-pressed-background') })
    + paint(`${enabled}:checked:active::before`, { background: ctx.role('selected-color') });
  return authorPaint(base + `@media (hover: hover) { ${hover} }` + held);
}

function nativeFieldText(ctx: CompanionPresentationContext): string {
  const children = (classes: readonly string[], css: string): string => {
    if (!css) return '';
    const selectors = ctx.selectors.flatMap(selector => classes.map(name =>
      `${nativeSurface(selector)} > .${name}:not([data-en-theme])`));
    return ctx.style(selectors, css);
  };
  // Limit typography to the documented immediate label/helper/error regions.
  // A nested full theme is excluded both at the group and at each region; no
  // inherited strong-label hook is changed on inputs, buttons or other content.
  return children(['en-label'], declarations({ 'font-weight': ctx.role('labelWeight') }))
    + children(['en-description', 'en-error'], declarations({
      'font-size': ctx.role('helperSize'), 'line-height': ctx.role('helperLineHeight'),
      'font-weight': ctx.role('helperWeight'),
    }));
}

export const fluentPresentations = {
  'fluent-field': { 'bottom-edge': { roles: edgeRoles, render: (ctx: CompanionPresentationContext) => edges(ctx) } },
  'fluent-number-field': { 'bottom-edge': { roles: edgeRoles, render: (ctx: CompanionPresentationContext) => edges(ctx, true) } },
  'fluent-checkbox': { 'mixed-square': { roles: { ...choiceRoles, 'mixed-size': 'dimension' }, render: checkbox } },
  'fluent-switch': {
    'stateful-track': {
      roles: { ...choiceRoles, thumb: 'color', 'thumb-hover': 'color', 'thumb-pressed': 'color' },
      render: switchPaint,
    },
  },
  'fluent-native-field': {
    'field-text': {
      roles: { labelWeight: 'fontWeight', helperSize: 'dimension', helperLineHeight: 'number', helperWeight: 'fontWeight' },
      render: nativeFieldText,
    },
  },
} satisfies CompanionPresentationRegistry;
