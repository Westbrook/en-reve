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
      roles: { 'minimum-size': 'dimension', 'inline-padding': 'dimension', gap: 'dimension', background: 'color', color: 'color' },
      render(ctx) {
        // Finite typed roles may supply CSS-only hooks without broadening token-map admission.
        // Keep defaults on zero-specificity hosts; the component consumes its public hooks.
        return authorPaint(ctx.block('', declarations({
          '--en-badge-background': ctx.role('background'), '--en-badge-color': ctx.role('color'),
        }))) + part(ctx, 'base', declarations({
          'min-block-size': ctx.role('minimum-size'), 'padding-inline': ctx.role('inline-padding'),
          'padding-block': '0', gap: ctx.role('gap'), 'font-variant-numeric': 'tabular-nums',
        })) + authorPaint(part(ctx, 'base', 'border: 0;'));
      },
    },
  },
  avatar: {
    'avatar-subtle': {
      roles: { background: 'color', color: 'color', 'font-scale': 'number', 'font-weight': 'fontWeight' },
      render(ctx) {
        return authorPaint(part(ctx, 'base', declarations({ background: ctx.role('background'), color: ctx.role('color') })))
          + part(ctx, 'fallback', declarations({
            'font-size': ctx.role('font-scale') ? `calc(1em * ${ctx.role('font-scale')})` : undefined, 'font-weight': ctx.role('font-weight'),
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
      roles: { radius: 'dimension', shadow: 'shadow' },
      render(ctx) {
        return part(ctx, 'track', declarations({ 'border-radius': ctx.role('radius') }))
          + authorPaint(part(ctx, 'track', declarations({ 'box-shadow': ctx.role('shadow') })));
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
