import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Source-specific material/typography that the generic surfaces cannot express.
 * Trusted CSS only; recipe values are typed token IDs. No state owner changes.
 * Reference: radix-ui/themes 3.3.0, commit 1faff10ac26ae17f09944d418c6949b93fc6b566.
 */
export const radixTargets = {
  'radix-material-card': ['en-card', '.en-card'],
  'radix-inline-code': ['code.en-code'],
  'radix-keycap': ['kbd.en-keycap'],
} as const;

function native(ctx: CompanionPresentationContext, css: string): string {
  return css ? ctx.style(ctx.selectors.map(nativeSurface), css) : '';
}

function card(ctx: CompanionPresentationContext, css: string): string {
  if (!css) return '';
  return ctx.style(ctx.selectors.map((selector, index) => index === 0 ? `${selector}::part(base)` : nativeSurface(selector)), css);
}

export const radixPresentations = {
  'radix-material-card': {
    translucent: {
      roles: { blur: 'dimension', background: 'color', opaqueBackground: 'color' },
      render(ctx) {
        const blur = ctx.role('blur');
        const background = (role: string) => {
          const fallback = ctx.role(role);
          return fallback === undefined ? undefined : `var(--en-card-background, var(--en-surface-background, ${fallback}))`;
        };
        const materialBackground = background('background');
        const paint = card(ctx, declarations({
          background: materialBackground,
          'backdrop-filter': blur ? `blur(clamp(0px, ${blur}, 64px))` : undefined,
          '-webkit-backdrop-filter': blur ? `blur(clamp(0px, ${blur}, 64px))` : undefined,
        }));
        const opaqueBackground = ctx.role('opaqueBackground');
        const foreground = materialBackground ?? 'var(--en-card-background, var(--en-surface-background, transparent))';
        const opaque = card(ctx, declarations({
          background: opaqueBackground === undefined ? undefined : `linear-gradient(${foreground}, ${foreground}), ${opaqueBackground}`,
          'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none',
        }));
        // A uniform top layer composites source/public alpha paint over the
        // opaque panel color. Opaque overrides remain exact, both public hooks
        // retain precedence, and native forced-color paint stays authoritative.
        return authorPaint(paint
          + `\n@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { ${opaque} }`
          + `\n@media (prefers-reduced-transparency: reduce) { ${opaque} }`)
          + `\n@media (forced-colors: active) { ${card(ctx, 'backdrop-filter: none; -webkit-backdrop-filter: none;')} }`;
      },
    },
  },
  'radix-inline-code': {
    soft: {
      roles: { background: 'color', color: 'color' },
      render(ctx) {
        return native(ctx, 'display: inline; font-family: var(--en-font-code-family); font-size: .9025em; font-style: normal; font-weight: inherit; line-height: 1.25; letter-spacing: -.007em; border-radius: calc(.5px + .2em); padding: .1em .25em; min-block-size: 0;')
          + authorPaint(native(ctx, declarations({ background: ctx.role('background'), color: ctx.role('color'), border: '0' })));
      },
    },
  },
  'radix-keycap': {
    classic: {
      roles: {
        background: 'color', color: 'color', bottomShade: 'color', highlight: 'color', topShade: 'color',
        bottomEdge: 'color', ring: 'color', drop: 'color', bottomEdgeScale: 'number', ringScale: 'number',
      },
      render(ctx) {
        const c = (role: string) => ctx.role(role) ?? 'transparent';
        const bottom = ctx.role('bottomEdgeScale') ?? '-.05';
        const ring = ctx.role('ringScale') ?? '.05';
        const shadow = [
          `inset 0 -.05em .5em ${c('bottomShade')}`, `inset 0 .05em ${c('highlight')}`,
          `inset 0 .25em .5em ${c('topShade')}`, `inset 0 calc(1em * clamp(-.1, ${bottom}, 0)) ${c('bottomEdge')}`,
          `0 0 0 calc(1em * clamp(0, ${ring}, .1)) ${c('ring')}`, `0 .08em .17em ${c('drop')}`,
        ].join(', ');
        return native(ctx, 'display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: var(--en-font-ui-family); font-size: .75em; font-weight: 400; font-style: normal; line-height: 1.7; vertical-align: text-top; white-space: nowrap; position: relative; top: -.03em; min-inline-size: 1.75em; min-block-size: 0; padding: 0 .5em .05em; word-spacing: -.1em; letter-spacing: inherit; border-radius: .35em;')
          + authorPaint(native(ctx, declarations({ background: ctx.role('background'), color: ctx.role('color'), 'box-shadow': shadow, border: '0' })));
      },
    },
  },
} as const satisfies CompanionPresentationRegistry;
