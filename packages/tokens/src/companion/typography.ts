import { authorPaint, declarations, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Opt-in native helpers and semantic descendants documented by the style layer. */
export const typographyTargets = {
  quote: ['.en-recipe-quote'],
  prose: ['.en-prose'],
  'description-list': ['.en-recipe-description-list'],
} as const;

const quoteRoles = { inlinePadding: 'dimension', borderWidth: 'dimension', borderColor: 'color', gap: 'dimension' } as const;
function quote(ctx: CompanionPresentationContext, suffix: string): string {
  return [
    ctx.block(suffix, declarations({
      display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-start', 'text-align': 'start',
      'margin-inline': '0', 'padding-inline': ctx.role('inlinePadding'), gap: ctx.role('gap'),
      'border-inline-start-style': 'solid', 'border-inline-start-width': ctx.role('borderWidth'),
    })),
    // Existing prose paragraph margins would otherwise add to the source gap.
    ctx.block(`${suffix} > :where(p, ul, ol, dl, blockquote)`, 'margin-block: 0;'),
    authorPaint(ctx.block(suffix, declarations({ 'border-inline-start-color': ctx.role('borderColor') }))),
  ].join('\n');
}

export const typographyPresentations = {
  quote: {
    subtle: {
      roles: quoteRoles,
      // Match the documented helper's class specificity. Full-theme scoping
      // selects the recipe without adding an ID or defeating inline overrides.
      render: ctx => quote(ctx, '.en-recipe-quote'),
    },
  },
  prose: {
    content: {
      roles: { ...quoteRoles, markerColor: 'color' },
      render: ctx => [
        quote(ctx, '.en-prose :where(blockquote)'),
        authorPaint(ctx.block('.en-prose :where(ul, ol) > li::marker', declarations({ color: ctx.role('markerColor') }))),
      ].join('\n'),
    },
  },
  'description-list': {
    subtle: {
      roles: { fontSize: 'dimension', lineHeight: 'number', labelWeight: 'fontWeight', labelColor: 'color', labelGap: 'dimension', itemGap: 'dimension' },
      render: ctx => [
        ctx.block('.en-recipe-description-list', declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'row-gap': ctx.role('labelGap') })),
        ctx.block('.en-recipe-description-list > dt', declarations({ 'font-weight': ctx.role('labelWeight') })),
        // The public native recipe has flat dt/dd pairs, so their existing grid
        // spacing represents the source's item wrapper and pair spacing.
        ctx.block('.en-recipe-description-list > dd', declarations({ 'margin-block-end': ctx.role('itemGap') && ctx.role('labelGap') ? `max(0px, calc(${ctx.role('itemGap')} - ${ctx.role('labelGap')}))` : undefined })),
        ctx.block('.en-recipe-description-list > dd:last-child', 'margin-block-end: 0;'),
        authorPaint(ctx.block('.en-recipe-description-list > dt', declarations({ color: ctx.role('labelColor') }))),
      ].join('\n'),
    },
  },
} satisfies CompanionPresentationRegistry;
