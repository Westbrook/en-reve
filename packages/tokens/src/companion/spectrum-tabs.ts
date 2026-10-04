import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** S2's regular static tabs over public anatomy. Shared moving-indicator and
 * overflow-picker behavior remain outside this presentation-only mapping. */
export const spectrumTabsTargets = {
  'spectrum-tabs': ['en-tabs', '.en-tab-list'],
  'spectrum-tab': ['en-tab', '.en-tab'],
  'spectrum-vertical-tab': ['en-tabs[orientation="vertical"] > en-tab', '.en-tab-list[aria-orientation="vertical"] > .en-tab', '.en-tab-list[data-orientation="vertical"] > .en-tab'],
} as const;

function tab(ctx: CompanionPresentationContext, css: string, state = '', pseudo = ''): string {
  if (!css) return '';
  return ctx.style(ctx.selectors.map((selector, index) => index === 0
    ? `${selector}${state}::part(base)${pseudo}`
    // Contexts stay zero-weight; match the public native held-state recipe.
    : `${selector.includes(':where(.en-tab-list[') ? `${selector}.en-tab` : nativeSurface(selector)}.en-tab${state}${pseudo}`), css);
}

const enabled = ':not([aria-disabled="true"]):not([disabled])';
function labelColor(ctx: CompanionPresentationContext, selected: boolean, interaction = false): string | undefined {
  const role = ctx.role(selected ? interaction ? 'selectedInteractionColor' : 'selectedColor' : interaction ? 'interactionColor' : 'restColor');
  if (!role) return undefined;
  const base = `var(--en-tab-color, ${role})`;
  return selected ? `var(--en-tab-selected-color, ${base})` : base;
}

export const spectrumTabsPresentations = {
  'spectrum-tabs': {
    'static-line': {
      roles: { horizontalGap: 'dimension', verticalGap: 'dimension', verticalInsetStart: 'dimension', verticalInsetEnd: 'dimension' },
      render(ctx) {
        const horizontal = [`${ctx.selectors[0]}:not([orientation="vertical"])::part(tab-list)`, `${nativeSurface(ctx.selectors[1])}:not([aria-orientation="vertical"]):not([data-orientation="vertical"])`];
        const vertical = [`${ctx.selectors[0]}[orientation="vertical"]::part(tab-list)`, `${nativeSurface(ctx.selectors[1])}:is([aria-orientation="vertical"], [data-orientation="vertical"])`];
        return ctx.style(horizontal, declarations({ gap: ctx.role('horizontalGap') }))
          + ctx.style(vertical, declarations({ gap: ctx.role('verticalGap'), 'margin-inline-start': ctx.role('verticalInsetStart'), 'margin-inline-end': ctx.role('verticalInsetEnd') }))
          // Retain the component's system-color treatment in forced colors.
          + authorPaint(ctx.style([...horizontal, ...vertical], 'border-block-end: 0; border-inline-end: 0;'));
      },
    },
  },
  'spectrum-tab': {
    'static-line': {
      roles: { indicatorSize: 'dimension', indicatorRadius: 'dimension', indicatorColor: 'color', minBlockSize: 'dimension', inlinePadding: 'dimension', blockPadding: 'dimension', restColor: 'color', interactionColor: 'color', selectedColor: 'color', selectedInteractionColor: 'color', disabledColor: 'color', disabledIndicatorColor: 'color' },
      render(ctx) {
        const minimum = ctx.role('minBlockSize');
        const geometry = tab(ctx, declarations({
          'min-block-size': minimum ? `max(var(--en-size-target-min), var(--en-control-min-size, ${minimum}))` : undefined,
          'padding-inline': ctx.role('inlinePadding') ? `var(--en-control-inline-padding, ${ctx.role('inlinePadding')})` : undefined,
          'padding-block': ctx.role('blockPadding'),
        })) + (minimum ? `@media (any-pointer: coarse) { ${tab(ctx, `min-block-size: max(var(--en-size-target-min), var(--en-size-target-touch), var(--en-control-min-size, ${minimum}));`)} }` : '');
        const paint: string[] = [
          tab(ctx, 'position: relative; border-block-end-width: 0; border-inline-end-width: 0; margin-block-end: 0; margin-inline-end: 0; background: var(--en-tab-background, transparent);'),
          tab(ctx, 'background: var(--en-tab-selected-background, var(--en-tab-background, transparent));', '[aria-selected="true"]'),
        ];
        for (const selected of [false, true]) {
          const state = `${enabled}${selected ? '[aria-selected="true"]' : ':not([aria-selected="true"])'}`;
          const background = selected ? 'var(--en-tab-selected-background, var(--en-tab-background, transparent))' : 'var(--en-tab-background, transparent)';
          const interaction = labelColor(ctx, selected, true);
          paint.push(tab(ctx, declarations({ background, color: labelColor(ctx, selected) }), state));
          // S2 uses focus-visible, not ancestor focus-within. Keep the immediate
          // component-owned contour/halo, and refine only the label foreground.
          paint.push(tab(ctx, declarations({ color: interaction }), `${state}:focus-visible`));
          paint.push(`@media (hover: hover) { ${tab(ctx, declarations({ background: `var(--en-tab-hover-background, ${background})`, color: interaction ? `var(--en-tab-hover-color, ${interaction})` : undefined }), `${state}:hover`)} }`);
          paint.push(tab(ctx, declarations({ background: `var(--en-tab-pressed-background, ${background})`, color: interaction ? `var(--en-tab-pressed-color, ${interaction})` : undefined }), `${state}:active`));
        }
        paint.push(tab(ctx, declarations({
          content: '""', position: 'absolute', 'pointer-events': 'none',
          'inset-inline': '0px', 'inset-block-start': 'auto', 'inset-block-end': '0px',
          'inline-size': 'auto', 'block-size': ctx.role('indicatorSize'),
          'border-radius': ctx.role('indicatorRadius'),
          background: ctx.role('indicatorColor') ? `var(--en-tab-indicator-color, ${ctx.role('indicatorColor')})` : undefined,
        }), '[aria-selected="true"]', '::after'));
        if (ctx.role('disabledColor')) {
          const disabled = ':is([aria-disabled="true"], [disabled])';
          const color = `var(--en-tab-color, ${ctx.role('disabledColor')})`;
          paint.push(tab(ctx, `color: ${color};`, disabled));
          paint.push(tab(ctx, `color: var(--en-tab-selected-color, ${color});`, `${disabled}[aria-selected="true"]`));
        }
        if (ctx.role('disabledIndicatorColor')) paint.push(tab(ctx, `background: var(--en-tab-indicator-color, ${ctx.role('disabledIndicatorColor')});`, ':is([aria-disabled="true"], [disabled])[aria-selected="true"]', '::after'));
        return geometry + authorPaint(paint.join('\n'));
      },
    },
  },
  'spectrum-vertical-tab': {
    'static-line': {
      roles: { indicatorSize: 'dimension', indicatorOffset: 'dimension' },
      render(ctx) {
        // Fill the public label surface and use S2's reserved leading gutter.
        // Logical placement mirrors in RTL; no navigation behavior changes.
        return authorPaint(tab(ctx, 'box-sizing: border-box; inline-size: 100%;')
          + tab(ctx, declarations({ 'inset-inline-start': ctx.role('indicatorOffset') ? `calc(-1 * ${ctx.role('indicatorOffset')})` : undefined, 'inset-inline-end': 'auto', 'inset-block': '0px', 'inline-size': ctx.role('indicatorSize'), 'block-size': 'auto' }), '[aria-selected="true"]', '::after'));
      },
    },
  },
} as const satisfies CompanionPresentationRegistry;
