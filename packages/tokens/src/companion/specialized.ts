import { authorPaint, declarations, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Component hosts and their documented Parts; no shadow ancestry is a contract. */
export const specializedTargets = {
  'color-picker': ['en-color-picker'],
  'color-plane': ['en-color-plane'],
  'color-slider': ['en-color-slider'],
  swatch: ['en-swatch'],
  'file-upload': ['en-file-upload'],
  'date-input': ['en-date-input'],
  'time-field': ['en-time-field'],
  'color-field': ['en-color-field'],
  'otp-field': ['en-otp-field'],
  'token-editor': ['en-token-editor'],
  'rich-text-editor': ['en-rich-text-editor'],
  splitter: ['en-splitter'],
  'split-view': ['en-split-view'],
} as const;

function rule(ctx: CompanionPresentationContext, suffix: string, values: Readonly<Record<string, string | undefined>>) {
  const css = declarations(values);
  return css ? ctx.block(suffix, css) : '';
}
const join = (rules: readonly string[]) => rules.filter(Boolean).join('\n');
const textRoles = { 'font-size': 'dimension', 'line-height': 'number', 'font-weight': 'fontWeight' } as const;
const fieldRoles = {
  ...textRoles, 'label-size': 'dimension', 'label-weight': 'fontWeight', 'helper-size': 'dimension',
  'helper-line-height': 'number', 'helper-weight': 'fontWeight', 'error-weight': 'fontWeight',
  'field-gap': 'dimension', 'disabled-opacity': 'number',
  'input-padding-small': 'dimension', 'input-padding-medium': 'dimension', 'input-padding-large': 'dimension',
} as const;

function field(ctx: CompanionPresentationContext, nativeControl = true) {
  const r = ctx.role;
  return join([
    rule(ctx, '', { '--en-field-gap': r('field-gap') }),
    // Sized input typography already resolves small/medium/large/inherit inside
    // the component. Avoid replacing it with one absolute exterior font size.
    nativeControl ? rule(ctx, '::part(control)', { 'font-weight': r('font-weight') }) : '',
    // The component evaluates this public hook on its control. Zero-specificity
    // defaults retain an author's local property override, including on a Part.
    ...(nativeControl ? ['small', 'medium', 'large'].map(size => rule(ctx, size === 'medium' ? ':where(:not([size]), [size="medium"])' : `:where([size="${size}"])`, { '--en-input-inline-padding': r(`input-padding-${size}`) })) : []),
    rule(ctx, '::part(label)', { 'font-size': r('label-size'), 'font-weight': r('label-weight') }),
    ...['description', 'error', 'format-hint'].map(part => rule(ctx, `::part(${part})`, { 'font-size': r('helper-size'), 'line-height': r('helper-line-height'), 'font-weight': r(part === 'error' ? 'error-weight' : 'helper-weight') })),
    // Native :disabled also covers the containing disabled fieldset case.
    nativeControl ? authorPaint(rule(ctx, '::part(control):disabled', { opacity: r('disabled-opacity') })) : '',
    authorPaint(rule(ctx, ':is([disabled], :disabled)::part(label)', { opacity: r('disabled-opacity') })),
  ]);
}

const colorRoles = {
  'plane-height': 'dimension', 'plane-radius': 'dimension', 'thumb-size': 'dimension',
  'track-size': 'dimension', 'track-radius': 'dimension', 'checker-size': 'dimension',
  'checker-light': 'color', 'checker-dark': 'color',
} as const;
function colorGeometry(ctx: CompanionPresentationContext) {
  const r = ctx.role;
  return join([
    rule(ctx, '', {
      '--en-color-plane-block-size': r('plane-height'), '--en-color-plane-radius': r('plane-radius'),
      '--en-color-plane-thumb-size': r('thumb-size'), '--en-color-slider-thumb-size': r('thumb-size'),
      '--en-color-slider-track-size': r('track-size'), '--en-color-slider-radius': r('track-radius'),
      '--en-color-slider-checker-size': r('checker-size'),
    }),
    authorPaint(rule(ctx, '', { '--en-color-slider-checker-light': r('checker-light'), '--en-color-slider-checker-dark': r('checker-dark') })),
  ]);
}

const editorRoles = {
  ...fieldRoles, 'padding-inline': 'dimension', 'padding-block': 'dimension',
  'token-size': 'dimension', 'token-radius': 'dimension', 'token-padding-inline': 'dimension',
  'token-padding-block': 'dimension', 'token-gap': 'dimension', 'token-font-size': 'dimension',
  'token-line-height': 'number', 'token-background': 'color', 'token-color': 'color',
  'token-hover-background': 'color', 'token-pressed-background': 'color',
} as const;
function editor(ctx: CompanionPresentationContext) {
  const r = ctx.role;
  return join([
    field(ctx),
    rule(ctx, '', {
      '--en-input-inline-padding': r('padding-inline'), '--en-editor-token-radius': r('token-radius'),
      '--en-editor-token-min-size': r('token-size'), '--en-editor-token-inline-padding': r('token-padding-inline'),
      '--en-editor-token-block-padding': r('token-padding-block'), '--en-editor-token-gap': r('token-gap'),
    }),
    rule(ctx, '::part(control)', { 'padding-block': r('padding-block'), 'font-size': r('font-size'), 'line-height': r('line-height') }),
    rule(ctx, '::part(token)', { 'font-size': r('token-font-size'), 'line-height': r('token-line-height') }),
    authorPaint(rule(ctx, '', {
      '--en-editor-token-background': r('token-background'), '--en-editor-token-color': r('token-color'),
      '--en-editor-token-border-color': r('token-background'), '--en-editor-token-hover-background': r('token-hover-background'),
      '--en-editor-token-pressed-background': r('token-pressed-background'),
    })),
    authorPaint(rule(ctx, '[disabled]::part(control)', { opacity: r('disabled-opacity') })),
  ]);
}

const splitterRoles = {
  'handle-size': 'dimension', 'handle-length': 'dimension', 'handle-radius': 'dimension',
  'border-width': 'dimension', 'border-color': 'color', 'handle-background': 'color',
  'focus-background': 'color', 'active-background': 'color', 'shadow': 'shadow',
} as const;
function splitter(ctx: CompanionPresentationContext, facade: boolean) {
  const r = ctx.role;
  const grip = facade ? '::part(separator)::after' : '::part(grip)';
  const host = facade ? '::part(separator)' : '::part(base)';
  // A split view exposes the separator host, without forwarding its private grip.
  // Its decorative pseudo-element is inside that same documented Part boundary.
  const horizontal = facade ? '[orientation="vertical"]' : '[orientation="horizontal"]';
  const long = r('handle-length'), short = r('handle-size');
  const geometry = [
    ctx.block(host, 'position: relative;'),
    ctx.block(grip, `pointer-events: none; box-sizing: border-box; ${facade ? 'content: ""; position: absolute; inset-inline-start: 50%; inset-block-start: 50%; translate: -50% -50%;' : 'position: relative; z-index: 1;'}`),
    rule(ctx, grip, { 'inline-size': short, 'block-size': long, 'border-radius': r('handle-radius'), 'border-width': r('border-width'), 'border-style': 'solid' }),
    rule(ctx, horizontal + grip, { 'inline-size': long, 'block-size': short }),
    ctx.block('[disabled]' + grip, 'visibility: hidden;'),
  ];
  if (facade) geometry.push(ctx.block(':dir(rtl)' + grip, 'translate: 50% -50%;'));
  // Reproduce the separator line independently of the compact visual handle.
  // No target dimensions, grid tracks, keyboard/RTL logic or focus ring change.
  if (!facade) geometry.push(ctx.block('::part(base)::before', 'content: ""; position: absolute; inset-block: 0; inset-inline-start: 50%; inline-size: var(--en-border-width); pointer-events: none;'),
    ctx.block(horizontal + '::part(base)::before', 'inset-inline: 0; inset-block-start: 50%; inset-block-end: auto; inline-size: auto; block-size: var(--en-border-width);'));
  const paint = [
    rule(ctx, grip, { background: r('handle-background'), 'border-color': r('border-color'), 'box-shadow': r('shadow') }),
    rule(ctx, facade ? '::part(separator):focus-visible::after' : ':focus-visible::part(grip)', { background: r('focus-background') }),
    rule(ctx, facade ? ':not([disabled])::part(separator):active::after' : ':not([disabled]):active::part(grip)', { background: r('active-background') }),
    !facade ? rule(ctx, '::part(base)::before', { background: r('border-color') }) : '',
  ];
  return join([...geometry, authorPaint(join(paint)), `@media (forced-colors: active) { ${ctx.block(grip, 'background: Canvas; border-color: ButtonText; box-shadow: none;')} ${!facade ? ctx.block('::part(base)::before', 'background: ButtonText;') : ''} }`]);
}

export const specializedPresentations = {
  'date-input': { 'compact-field': { roles: fieldRoles, render: field } },
  'time-field': { 'compact-field': { roles: fieldRoles, render: field } },
  'color-field': { 'compact-field': { roles: fieldRoles, render: field } },
  'otp-field': {
    'continuous-pin': {
      roles: { ...fieldRoles, 'font-family': 'fontFamily' },
      render: ctx => join([field(ctx), rule(ctx, '::part(control)', { 'font-family': ctx.role('font-family') })]),
    },
  },
  'token-editor': { 'compact-tokens': { roles: editorRoles, render: editor } },
  'rich-text-editor': { 'compact-tokens': { roles: editorRoles, render: editor } },
  'color-plane': {
    'compact-channels': {
      roles: { ...colorRoles, 'gap': 'dimension', 'helper-size': 'dimension', 'helper-line-height': 'number' },
      render: ctx => join([
        colorGeometry(ctx), rule(ctx, '', { '--en-color-picker-gap': ctx.role('gap') }),
        rule(ctx, '::part(axes)', { 'font-size': ctx.role('helper-size'), 'line-height': ctx.role('helper-line-height') }),
      ]),
    },
  },
  'color-slider': { 'compact-channels': { roles: colorRoles, render: colorGeometry } },
  'color-picker': {
    'compact-panel': {
      roles: {
        ...colorRoles, ...textRoles, 'inline-size': 'dimension', 'gap': 'dimension', 'padding': 'dimension',
        'radius': 'dimension', 'preview-size': 'dimension', 'preview-radius': 'dimension', 'summary-gap': 'dimension',
        'helper-size': 'dimension', 'helper-line-height': 'number', 'background': 'color', 'color': 'color', 'shadow': 'shadow',
      },
      render(ctx) {
        const r = ctx.role;
        return join([
          colorGeometry(ctx),
          rule(ctx, '', { '--en-color-picker-inline-size': r('inline-size'), '--en-color-picker-gap': r('gap'), '--en-color-picker-preview-size': r('preview-size'), '--en-color-picker-preview-radius': r('preview-radius') }),
          rule(ctx, '::part(base)', { 'box-sizing': 'border-box', padding: r('padding'), 'border-radius': r('radius'), 'font-size': r('font-size'), 'line-height': r('line-height'), 'font-weight': r('font-weight') }),
          rule(ctx, '::part(summary)', { gap: r('summary-gap') }),
          rule(ctx, '::part(formats)', { gap: r('summary-gap') }),
          rule(ctx, '::part(channels)', { gap: r('summary-gap') }),
          rule(ctx, '::part(channel)', { '--en-font-label-strong-size': r('helper-size'), '--en-font-label-strong-weight': '500' }),
          ...['space', 'gamut-message', 'validation-message', 'plane-axes'].map(part => rule(ctx, `::part(${part})`, { 'font-size': r('helper-size'), 'line-height': r('helper-line-height') })),
          // Keep the accepted dynamic swatch, plane and track colors untouched.
          authorPaint(rule(ctx, '::part(base)', { background: r('background'), color: r('color'), 'box-shadow': r('shadow') })),
        ]);
      },
    },
  },
  swatch: {
    'compact-sample': {
      roles: { size: 'dimension', radius: 'dimension', shadow: 'shadow' },
      render(ctx) {
        const r = ctx.role;
        return join([
          rule(ctx, '', { '--en-swatch-size': r('size') }),
          ctx.block('::part(sample)', 'display: grid; place-items: center; padding: 0;'),
          rule(ctx, '::part(color)', { position: 'static', 'inline-size': r('size') ? 'var(--en-swatch-size)' : undefined, 'block-size': r('size') ? 'var(--en-swatch-size)' : undefined, 'border-radius': r('radius') }),
          authorPaint(ctx.block('::part(sample)', 'background: transparent; border-color: transparent;') + rule(ctx, '::part(color)', { 'box-shadow': r('shadow') })),
        ]);
      },
    },
  },
  'file-upload': {
    'stacked-dropzone': {
      roles: {
        ...fieldRoles, 'min-height': 'dimension', radius: 'dimension', 'border-width': 'dimension', 'padding-inline': 'dimension', 'padding-block': 'dimension',
        gap: 'dimension', 'list-gap': 'dimension', 'file-padding': 'dimension', 'file-radius': 'dimension', 'file-gap': 'dimension', 'file-weight': 'fontWeight',
        background: 'color', 'hover-background': 'color', 'border-color': 'color', 'file-background': 'color', 'file-border-color': 'color',
      },
      render(ctx) {
        const r = ctx.role;
        return join([
          field(ctx, false),
          rule(ctx, '', { '--en-control-radius': r('radius'), '--en-input-inline-padding': r('padding-inline') }),
          ctx.block('::part(dropzone)', 'flex-direction: column; text-align: center;'),
          rule(ctx, '::part(dropzone)', { 'min-block-size': r('min-height'), 'border-width': r('border-width'), 'padding-block': r('padding-block'), gap: r('gap') }),
          rule(ctx, '::part(list)', { gap: r('list-gap') }),
          rule(ctx, '::part(file)', { padding: r('file-padding'), 'border-radius': r('file-radius'), gap: r('file-gap'), 'border-width': '1px', 'border-style': 'solid', 'font-size': r('font-size'), 'line-height': r('line-height') }),
          rule(ctx, '::part(file-name)', { 'font-weight': r('file-weight') }),
          rule(ctx, '::part(remove-button)', { 'align-self': 'flex-start' }),
          authorPaint(rule(ctx, ':is([disabled], :disabled)::part(dropzone)', { opacity: r('disabled-opacity') })),
          // State paint remains owned by file-upload; changing the public defaults
          // cannot mask its dragging, invalid, disabled or forced-colors selectors.
          authorPaint(join([
            rule(ctx, '', { '--en-input-background': r('background'), '--en-control-border-color': r('border-color') }),
            rule(ctx, '::part(file)', { background: r('file-background'), 'border-color': r('file-border-color') }),
            `@media (hover: hover) { ${rule(ctx, ':where(:not([disabled]):not(:disabled):not([dragging]):hover)', { '--en-input-background': r('hover-background') })} }`,
          ])),
        ]);
      },
    },
  },
  splitter: { 'capsule-handle': { roles: splitterRoles, render: ctx => splitter(ctx, false) } },
  'split-view': { 'capsule-handle': { roles: splitterRoles, render: ctx => splitter(ctx, true) } },
} satisfies CompanionPresentationRegistry;
