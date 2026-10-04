import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Delivered public Parts and matching native feedback compositions. */
export const feedbackTargets = {
  badge: ['en-badge', '.en-badge'],
  avatar: ['en-avatar', '.en-avatar'],
  alert: ['en-alert', '.en-alert'],
  // Standalone tag Parts are public; its shared .en-tag binding is not a documented native helper.
  tag: ['en-tag'],
  toast: ['en-toast', '.en-toast'],
  'progress-bar': ['en-progress-bar', 'progress.en-progress', '.en-progress-track'],
  spinner: ['en-spinner', '.en-spinner'],
  skeleton: ['en-skeleton', '.en-skeleton'],
  code: ['code.en-code'],
  keycap: ['kbd.en-keycap'],
  'progress-steps': ['en-progress-steps'],
  presence: ['en-presence'],
  'activity-feed': ['en-activity-feed'],
  'activity-item': ['en-activity-item'],
} as const;

/** Native selectors address only the matching composition's immediate child. */
function part(ctx: CompanionPresentationContext, name: string, css: string, nativeChild = '', state = ''): string {
  if (!css) return '';
  const selectors = ctx.selectors.map((selector, index) => index === 0
    ? `${selector}::part(${name})${state}`
    : `${nativeSurface(selector)}${nativeChild ? ` > ${nativeChild}:not([data-en-theme])` : ''}${state}`);
  return ctx.style(selectors, css);
}

function statusPart(ctx: CompanionPresentationContext, variant: string, css: string): string {
  if (!css) return '';
  return ctx.style(ctx.selectors.map((selector, index) => index === 0
    ? `${selector}[variant="${variant}"]::part(base)`
    : `${nativeSurface(selector)}[data-variant="${variant}"]`), css);
}

/** Code and keycap are finite native-only public helper targets. */
function nativeBlock(ctx: CompanionPresentationContext, css: string): string {
  return css ? ctx.style(ctx.selectors.map(nativeSurface), css) : '';
}

export const feedbackPresentations = {
  badge: {
    'badge-subtle': {
      roles: { 'minimum-size': 'dimension', 'inline-padding': 'dimension', gap: 'dimension', radius: 'dimension', background: 'color', color: 'color' },
      render(ctx) {
        // Finite typed roles may supply CSS-only hooks without broadening token-map admission.
        // Keep defaults on zero-specificity hosts; the component consumes its public hooks.
        return authorPaint(ctx.block('', declarations({
          '--en-badge-background': ctx.role('background'), '--en-badge-color': ctx.role('color'),
        }))) + part(ctx, 'base', declarations({
          'min-block-size': ctx.role('minimum-size'), 'padding-inline': ctx.role('inline-padding'),
          'padding-block': '0', gap: ctx.role('gap'), 'font-variant-numeric': 'tabular-nums',
          'border-radius': ctx.role('radius') ? `var(--en-badge-radius, ${ctx.role('radius')})` : undefined,
        })) + authorPaint(part(ctx, 'base', 'border: 0;'));
      },
    },
  },
  avatar: {
    'avatar-subtle': {
      roles: { background: 'color', color: 'color', radius: 'dimension', 'font-scale': 'number', 'diameter-font-scale': 'number', 'font-weight': 'fontWeight' },
      render(ctx) {
        // Match the size consumer used by the public avatar surface. This
        // library-owned bridge follows size=inherit and the local size hook;
        // imported recipes supply only a typed ratio, never private CSS names.
        const diameterScale = ctx.role('diameter-font-scale');
        const fontSize = diameterScale === undefined
          ? ctx.role('font-scale') ? `calc(1em * ${ctx.role('font-scale')})` : undefined
          : `calc(var(--en-avatar-size, var(--_en-sized-size-avatar, var(--en-size-avatar))) * ${diameterScale})`;
        return part(ctx, 'base', declarations({ 'border-radius': ctx.role('radius') ? `var(--en-avatar-radius, ${ctx.role('radius')})` : undefined }))
          + authorPaint(part(ctx, 'base', declarations({ background: ctx.role('background'), color: ctx.role('color') })))
          + part(ctx, 'fallback', declarations({
            'font-size': fontSize, 'font-weight': ctx.role('font-weight'),
            'line-height': '1', 'text-transform': 'uppercase',
          }), '.en-avatar__fallback');
      },
    },
  },
  alert: {
    'alert-subtle': {
      roles: {
        'info-background': 'color', 'info-color': 'color', 'success-background': 'color', 'success-color': 'color',
        'warning-background': 'color', 'warning-color': 'color', 'danger-background': 'color', 'danger-color': 'color',
        'font-weight': 'fontWeight', 'icon-size': 'dimension',
      },
      render(ctx) {
        const status = ['info', 'success', 'warning', 'danger'].map(variant => statusPart(ctx, variant,
          declarations({
            background: ctx.role(`${variant}-background`) ? `var(--en-alert-background, ${ctx.role(`${variant}-background`)})` : undefined,
            color: ctx.role(`${variant}-color`) ? `var(--en-alert-color, ${ctx.role(`${variant}-color`)})` : undefined,
            'border-color': 'var(--en-alert-border-color, transparent)',
          }))).join('\n');
        return authorPaint(part(ctx, 'base', declarations({
          'border-color': 'var(--en-alert-border-color, transparent)',
          background: ctx.role('info-background') ? `var(--en-alert-background, ${ctx.role('info-background')})` : undefined,
          color: ctx.role('info-color') ? `var(--en-alert-color, ${ctx.role('info-color')})` : undefined,
        })) + status + part(ctx, 'icon', 'color: inherit;', '.en-alert__icon'))
          + part(ctx, 'content', declarations({ 'font-weight': ctx.role('font-weight') }), '.en-alert__content')
          + part(ctx, 'icon', declarations({
            'inline-size': ctx.role('icon-size'), 'block-size': ctx.role('icon-size'),
          }), '.en-alert__icon');
      },
    },
  },
  tag: {
    'tag-surface': {
      roles: {
        background: 'color', color: 'color', shadow: 'shadow', radius: 'dimension',
        'font-size': 'dimension', 'line-height': 'number', 'inline-padding': 'dimension', gap: 'dimension', 'minimum-size': 'dimension',
      },
      render(ctx) {
        return part(ctx, 'base', declarations({
          'border-radius': ctx.role('radius'), 'font-size': ctx.role('font-size'), 'line-height': ctx.role('line-height'),
          'padding-inline': ctx.role('inline-padding'), gap: ctx.role('gap'), 'min-block-size': ctx.role('minimum-size'),
        })) + authorPaint(part(ctx, 'base', declarations({
          border: '0', background: ctx.role('background'), color: ctx.role('color'), 'box-shadow': ctx.role('shadow'),
        })) + part(ctx, 'remove', 'color: inherit;', '.en-button', ':not(:disabled)'));
      },
    },
  },
  toast: {
    'toast-accent-rail': {
      roles: {
        accentWidth: 'dimension', background: 'color', iconScale: 'number', gap: 'dimension',
        infoAccent: 'color', successAccent: 'color',
        warningAccent: 'color', dangerAccent: 'color',
      },
      render(ctx) {
        const width = ctx.role('accentWidth');
        const background = ctx.role('background');
        if (!width || !background) return '';
        const variants = ['info', 'success', 'warning', 'danger'];
        const rail = (color: string | undefined, variant?: string, rtl = false) => {
          if (!color) return '';
          const plate = `var(--en-toast-background, ${background})`;
          const paint = variant ? `var(--en-toast-${variant}-background, ${plate})` : plate;
          // The second layer accepts a color or gradient from the documented
          // paint hook. Its border-box plate remains behind the outer border;
          // only the first layer is clipped to the inner rounded padding box.
          return `background: linear-gradient(${color}, ${color}) ${rtl ? 'right' : 'left'} top / ${width} 100% no-repeat padding-box, ${paint};`;
        };
        // The first grid column reserves the rail even in an iconless native
        // composition. Its icon margin adds exactly the rail width to the
        // occupied auto column, leaving arbitrary public padding shorthands
        // and the close action's end inset intact. Inline-flex recipes retain
        // the same icon margin without consuming the grid declaration.
        const geometry = part(ctx, 'base', declarations({
          'grid-template-columns': `minmax(${width}, auto) minmax(0, 1fr) auto`,
          'column-gap': ctx.role('gap'),
        })) + part(ctx, 'icon', `margin-inline-start: ${width};`, '.en-toast__icon');
        const iconScale = ctx.role('iconScale');
        const iconSize = iconScale ? `calc(1em * ${iconScale})` : undefined;
        // EnIcon owns a sized foundation. Scope semantic size defaults to the
        // status icon Part only; its documented --en-icon-size override stays
        // first and the sibling close glyph receives none of these defaults.
        const icons = iconSize ? part(ctx, 'icon', declarations({
          '--en-size-icon': iconSize, '--en-size-icon-small': iconSize,
          '--en-size-icon-medium': iconSize, '--en-size-icon-large': iconSize,
        }), '.en-toast__icon') + ctx.style(ctx.selectors.slice(1).map(selector =>
          `${nativeSurface(selector)} > .en-toast__icon:not([data-en-theme]) > .en-icon:not([data-en-theme])`),
        `inline-size: var(--en-icon-size, ${iconSize}); block-size: var(--en-icon-size, ${iconSize});`) : '';
        // The native helper permits an omitted icon. Span the first two
        // tracks so its empty icon-column gap does not become extra inset;
        // the body remains display:contents and the close stays in column3.
        const iconless = ctx.style(ctx.selectors.slice(1).flatMap(selector => ['content', 'actions'].map(name =>
          `${nativeSurface(selector)}:not(:has(> .en-toast__icon)) > .en-toast__body:not([data-en-theme]) > .en-toast__${name}:not([data-en-theme])`)),
        `grid-column: 1 / 3; margin-inline-start: ${width};`);
        const paint = part(ctx, 'base', rail(ctx.role('infoAccent')))
          + variants.map(variant => statusPart(ctx, variant, rail(ctx.role(`${variant}Accent`), variant))).join('\n');
        const rtl = [undefined, ...variants].map(variant => ctx.style(ctx.selectors.map((selector, index) => index === 0
          ? `${selector}:dir(rtl)${variant ? `[variant="${variant}"]` : ''}::part(base)`
          : `${nativeSurface(selector)}:dir(rtl)${variant ? `[data-variant="${variant}"]` : ''}`),
        rail(ctx.role(`${variant ?? 'info'}Accent`), variant, true))).join('\n');
        // Keep public paint hooks, shadow and the core queued-stack pseudo-
        // elements. The source rail is decorative: system colors retain the
        // owning toast's original presentation, including its original grid.
        return authorPaint(geometry + icons + iconless + paint + rtl);
      },
    },
    'toast-notification': {
      roles: { 'end-padding': 'dimension', 'font-weight': 'fontWeight' },
      render(ctx) {
        // The close action keeps its own grid cell and protected target dimensions.
        return part(ctx, 'base', declarations({ 'align-items': 'start', 'padding-inline-end': ctx.role('end-padding') ? `var(--en-toast-padding, ${ctx.role('end-padding')})` : undefined }))
          + part(ctx, 'content', declarations({ 'font-weight': ctx.role('font-weight') }), '.en-toast__body:not([data-en-theme]) > .en-toast__content');
      },
    },
  },
  'progress-bar': {
    'progress-rounded': {
      roles: { radius: 'dimension', shadow: 'shadow', trackColor: 'color' },
      render(ctx) {
        return part(ctx, 'track', declarations({ 'border-radius': ctx.role('radius') }))
          // Set a private default only on matched controls, never a theme container.
          // The core native progress rail reads the public override first, including
          // its WebKit pseudo-element; forced colors retain their system paint.
          + authorPaint(ctx.block('', declarations({ '--_en-source-progress-track-color': ctx.role('trackColor') }))
            + part(ctx, 'track', declarations({ 'box-shadow': ctx.role('shadow') })));
      },
    },
  },
  spinner: {
    'spinner-open': {
      roles: {},
      render(ctx) {
        return authorPaint(part(ctx, 'base', 'border-color: currentColor; border-bottom-color: transparent; border-inline-start-color: transparent;'));
      },
    },
  },
  skeleton: {
    'skeleton-pulse': {
      roles: { background: 'color' },
      render(ctx) {
        return authorPaint(ctx.block('', declarations({ '--en-skeleton-color': ctx.role('background') })))
          + '@keyframes en-companion-skeleton-pulse { 50% { opacity: .5; } }\n'
          + `@media (prefers-reduced-motion: no-preference) and (forced-colors: none) { ${part(ctx, 'base', 'animation: en-companion-skeleton-pulse 1.2s cubic-bezier(.4,0,.6,1) infinite;')} }`;
      },
    },
  },
  'progress-steps': {
    'steps-indicators': {
      roles: { 'indicator-scale': 'number', 'control-gap': 'dimension', 'label-weight': 'fontWeight', gap: 'dimension' },
      render(ctx) {
        // State remains on the owning control; no selectors enter its private tree.
        const scale = ctx.role('indicator-scale');
        const size = scale ? `calc(1em * ${scale})` : undefined;
        return ctx.block('', declarations({ '--en-progress-steps-gap': ctx.role('gap') }))
          + part(ctx, 'control', declarations({ gap: ctx.role('control-gap') }))
          + part(ctx, 'number', declarations({
            display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
            'inline-size': size, 'block-size': size, 'border-radius': '50%',
            'border-width': '2px', 'border-style': 'solid',
          }))
          + part(ctx, 'label', declarations({ 'font-weight': ctx.role('label-weight') }));
      },
    },
  },
  presence: {
    'status-inline': {
      roles: { gap: 'dimension', 'indicator-scale': 'number' },
      render(ctx) {
        const scale = ctx.role('indicator-scale');
        const size = scale ? `calc(1em * ${scale})` : undefined;
        // Preserve semantic online/busy paint and the offline/away shape cues.
        return part(ctx, 'status', declarations({ 'font-size': '1em', gap: ctx.role('gap') }))
          + part(ctx, 'indicator', declarations({ 'inline-size': size, 'block-size': size }));
      },
    },
  },
  'activity-feed': {
    'timeline-feed': {
      roles: { 'label-weight': 'fontWeight' },
      render(ctx) {
        // Existing activity properties also reach data-mode generated items.
        return part(ctx, 'group-heading', declarations({ 'font-weight': ctx.role('label-weight') }))
          + part(ctx, 'group-context', declarations({ 'font-weight': ctx.role('label-weight') }));
      },
    },
  },
  'activity-item': {
    'timeline-entry': {
      roles: { 'header-gap': 'dimension', 'label-weight': 'fontWeight', 'body-weight': 'fontWeight', 'metadata-scale': 'number' },
      render(ctx) {
        const scale = ctx.role('metadata-scale');
        return part(ctx, 'header', declarations({ gap: ctx.role('header-gap') }))
          + part(ctx, 'author', declarations({ 'font-weight': ctx.role('label-weight') }))
          + part(ctx, 'content', declarations({ 'font-weight': ctx.role('body-weight') }))
          + part(ctx, 'time', declarations({
            'font-size': scale ? `calc(1em * ${scale})` : undefined,
          }));
      },
    },
  },
  code: {
    'code-subtle': {
      roles: { background: 'color', color: 'color', 'font-size': 'dimension', 'line-height': 'number', 'inline-padding': 'dimension', 'minimum-size': 'dimension' },
      render(ctx) {
        return nativeBlock(ctx, declarations({
          display: 'inline-flex', 'align-items': 'center', 'font-family': 'var(--en-font-code-family)',
          'font-size': ctx.role('font-size'), 'line-height': ctx.role('line-height'),
          'padding-block': '0', 'padding-inline': ctx.role('inline-padding'), 'min-block-size': ctx.role('minimum-size'),
        })) + authorPaint(nativeBlock(ctx, declarations({ background: ctx.role('background'), color: ctx.role('color') })));
      },
    },
  },
  keycap: {
    'keycap-raised': {
      roles: { background: 'color', color: 'color', 'border-color': 'color', 'font-size': 'dimension', 'line-height': 'number', 'font-weight': 'fontWeight', 'inline-padding': 'dimension', 'minimum-size': 'dimension' },
      render(ctx) {
        return nativeBlock(ctx, declarations({
          display: 'inline-flex', 'align-items': 'center', 'font-family': 'var(--en-font-code-family)',
          'font-size': ctx.role('font-size'), 'line-height': ctx.role('line-height'), 'font-weight': ctx.role('font-weight'),
          'padding-block': '0', 'padding-inline': ctx.role('inline-padding'), 'min-block-size': ctx.role('minimum-size'),
          'word-spacing': '-.5em', 'white-space': 'nowrap',
        })) + authorPaint(nativeBlock(ctx, declarations({
          background: ctx.role('background'), color: ctx.role('color'), 'border-color': ctx.role('border-color'),
          'border-width': '1px', 'border-block-end-width': '2px',
        })));
      },
    },
  },
} as const satisfies CompanionPresentationRegistry;
