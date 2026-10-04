import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Default outlined disclosure anatomy. The native helpers are documented
 * recipes; authored content, disclosure state and focus remain consumer-owned. */
export const webAwesomeDetailsTargets = {
  'source-details': ['en-accordion-item', '.en-accordion-item', 'details.en-recipe-disclosure'],
} as const;

const roles = {
  borderWidth: 'dimension', radius: 'dimension', padding: 'dimension', gap: 'dimension',
  fontSize: 'dimension', lineHeight: 'number', weight: 'fontWeight',
  background: 'color', borderColor: 'color', color: 'color', indicatorColor: 'color',
  disabledOpacity: 'number', indicatorInlineSize: 'dimension', indicatorBlockSize: 'dimension',
  indicatorMarkSize: 'dimension', indicatorStroke: 'dimension', indicatorDuration: 'duration',
  indicatorEase: 'cubicBezier',
} as const;

const heading = ':is(h1, h2, h3, h4, h5, h6, [role="heading"]):not([data-en-theme])';
const enabled = ':not(:disabled):not([aria-disabled="true"])';

function surfaces(ctx: CompanionPresentationContext) {
  const custom = ctx.selectors[0];
  const item = nativeSurface(ctx.selectors[1]);
  // A helper carrying both classes uses the accordion's explicit panel owner.
  const recipe = `${nativeSurface(ctx.selectors[2])}:not(.en-accordion-item)`;
  const nativeTriggers = [
    `${item} > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])`,
    `${item} > ${heading} > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])`,
    `${recipe} > summary:first-of-type:not([data-en-theme])`,
  ];
  const trigger = (css: string, state = '') => ctx.style([
    `${custom}::part(control)${state}`, ...nativeTriggers.map(selector => selector + state),
  ], css);
  const openItem = `${item}:is([open], :has(> .en-accordion-trigger[aria-expanded="true"], > ${heading} > .en-accordion-trigger[aria-expanded="true"]))`;
  const openTriggers = [
    `${custom}[open]::part(control)`,
    `${openItem} > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])`,
    `${openItem} > ${heading} > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])`,
    `${recipe}[open] > summary:first-of-type:not([data-en-theme])`,
  ];
  const disabledItem = `${item}:is([aria-disabled="true"], :has(> .en-accordion-trigger:is(:disabled, [aria-disabled="true"]), > ${heading} > .en-accordion-trigger:is(:disabled, [aria-disabled="true"])))`;
  const disabledRecipe = `${recipe}:is([aria-disabled="true"], :has(> summary:first-of-type[aria-disabled="true"]))`;
  const disabledTriggers = [
    `${custom}[disabled]::part(control)`,
    `${disabledItem} > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])`,
    `${disabledItem} > ${heading} > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])`,
    `${disabledRecipe} > summary:first-of-type:not([data-en-theme])`,
    ...nativeTriggers.map(selector => `${selector}:is(:disabled, [aria-disabled="true"])`),
  ];
  const enabledTrigger = (css: string, state: string) => ctx.style([
    `${custom}:not([disabled])::part(control)${enabled}${state}`,
    `${item}:not([aria-disabled="true"]) > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])${enabled}${state}`,
    `${item}:not([aria-disabled="true"]) > ${heading} > .en-accordion-trigger.en-accordion-trigger:not([data-en-theme])${enabled}${state}`,
    `${recipe}:not([aria-disabled="true"]) > summary:first-of-type:not([data-en-theme])${enabled}${state}`,
  ], css);
  return { custom, item, recipe, nativeTriggers, openTriggers, trigger,
    enabledTrigger, disabledTriggers,
    bases: [`${custom}::part(base)`, item, recipe],
    disabledBases: [`${custom}[disabled]::part(base)`, disabledItem, disabledRecipe],
  };
}

export const webAwesomeDetailsPresentations = {
  'source-details': {
    outlined: {
      roles,
      render(ctx) {
        const s = surfaces(ctx);
        const padding = ctx.role('padding');
        const inline = padding ? `var(--en-control-inline-padding, ${padding})` : undefined;
        const radius = ctx.role('radius'), border = ctx.role('borderWidth');
        const innerRadius = radius && border ? `max(0px, calc(${radius} - ${border}))` : undefined;
        const type = declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight') });
        const recipeSummary = `${s.recipe} > summary:first-of-type:not([data-en-theme])`;
        const mark = ctx.role('indicatorMarkSize'), stroke = ctx.role('indicatorStroke');
        const iconInline = ctx.role('indicatorInlineSize'), iconBlock = ctx.role('indicatorBlockSize');
        const duration = ctx.role('indicatorDuration');
        const iconTransition = duration ? `rotate ${duration} ${ctx.role('indicatorEase') ?? 'ease'}` : undefined;
        const customIcon = `${s.custom}::part(indicator)`;
        const marks = [`${customIcon}::before`, ...s.nativeTriggers.map(selector => `${selector}::after`)];
        const openMarks = [`${s.custom}[open]::part(indicator)::before`, ...s.openTriggers.slice(1).map(selector => `${selector}::after`)];
        const outline = ctx.style(s.bases, declarations({
          'border-width': border, 'border-style': border ? 'solid' : undefined,
          'border-radius': radius, overflow: 'visible', 'min-inline-size': '0', 'overflow-anchor': 'none',
        }) + ` ${type}`);
        const header = s.trigger(declarations({
          display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
          'inline-size': '100%', 'box-sizing': 'border-box',
          'min-inline-size': 'var(--en-size-target-min, 24px)',
          'min-block-size': 'max(var(--en-control-min-size, var(--en-size-control-min, 2.5rem)), var(--en-size-target-min, 24px))',
          'padding-inline': inline, 'padding-block': padding, gap: ctx.role('gap'),
          'border-radius': innerRadius, border: '0', 'text-align': 'start',
          'overflow-wrap': 'break-word', 'text-decoration': 'none', 'list-style': 'none',
        }) + ` ${type}`);
        const parts = [
          outline,
          ctx.style([`${s.custom}::part(heading)`, `${s.item} > ${heading}`], 'margin: 0;'),
          // The explicit panel recipe owns all content padding; group borders,
          // first/last-child exceptions and source body animation are absent.
          ctx.style([s.item], 'padding: 0;'),
          header,
          ctx.style(s.openTriggers, 'border-end-start-radius: 0; border-end-end-radius: 0;'),
          ctx.style([`${s.custom}::part(panel)`, `${s.item} > .en-accordion-panel:not([data-en-theme])`], declarations({
            'padding-block': padding, 'padding-inline': inline,
          })),
          // Real summary activation/closed-content hiding stays browser-owned.
          ctx.style(s.nativeTriggers.map(selector => `${selector}::marker`), 'content: "";'),
          ctx.style(s.nativeTriggers.map(selector => `${selector}::-webkit-details-marker`), 'display: none;'),
        ];
        if (padding && inline) {
          parts.push(
            // Fallback reserves one shared inset around arbitrary text/elements;
            // it never rewrites their margins, display, order or visibility.
            ctx.style([s.recipe], `padding-block: ${padding}; padding-inline: ${inline};`),
            ctx.style([recipeSummary], `inline-size: auto; margin-block: calc(0px - ${padding}); margin-inline: calc(0px - ${inline});`),
            ctx.style([`${s.recipe}[open] > summary:first-of-type:not([data-en-theme])`], `margin-block-end: ${padding};`),
            // The native content pseudo supplies the source padding barrier for
            // first/last authored margins, plain text and empty open content.
            // Open-only padding prevents a closed residual content box. No
            // content-visibility/display override competes with the browser.
            `@supports selector(details::details-content) { ${ctx.style([s.recipe], 'padding: 0;')}
              ${ctx.style([recipeSummary, `${s.recipe}[open] > summary:first-of-type:not([data-en-theme])`], 'margin: 0;')}
              ${ctx.style([`${s.recipe}[open]::details-content`], `box-sizing: border-box; padding-block: ${padding}; padding-inline: ${inline};`)} }`,
          );
        }
        if (mark && stroke && iconInline && iconBlock) {
          parts.push(
            ctx.style([customIcon], `display: inline-flex; align-items: center; justify-content: center; flex: none; font-size: 0; inline-size: ${iconInline}; block-size: ${iconBlock};`),
            ctx.style(marks, declarations({
              content: '""', display: 'block', 'box-sizing': 'content-box', 'flex': 'none',
              'inline-size': mark, 'block-size': mark,
              'border-inline-end': `${stroke} solid currentColor`, 'border-block-end': `${stroke} solid currentColor`,
              rotate: '-45deg', transition: iconTransition,
            })),
            ctx.style(s.nativeTriggers.map(selector => `${selector}::after`), `margin-inline: max(0px, calc((${iconInline} - ${mark} - ${stroke}) / 2)); margin-block: max(0px, calc((${iconBlock} - ${mark} - ${stroke}) / 2));`),
            // Physical rotation is paired with logical borders in RTL. The
            // closed chevron points inline-end and the open chevron points down.
            ctx.style([`${s.custom}:dir(rtl)::part(indicator)::before`, ...s.nativeTriggers.map(selector => `${selector}:dir(rtl)::after`)], 'rotate: 45deg;'),
            ctx.style(openMarks, 'rotate: 45deg;'),
            ctx.style([`${s.custom}[open]:dir(rtl)::part(indicator)::before`, ...s.openTriggers.slice(1).map(selector => `${selector}:dir(rtl)::after`)], 'rotate: -45deg;'),
            `@media (prefers-reduced-motion: reduce) { ${ctx.style(marks, 'transition: none;')} }`,
          );
        }
        parts.push(authorPaint([
          ctx.style(s.bases, declarations({ background: ctx.role('background'), color: ctx.role('color'), 'border-color': ctx.role('borderColor'), 'box-shadow': 'none' })),
          s.trigger(declarations({ background: 'transparent', color: ctx.role('color') })),
          `@media (hover: hover) { ${s.enabledTrigger('background: transparent; text-decoration: none;', ':hover')} }`,
          // The source has no held paint. Existing public pressed overrides keep
          // precedence; core motion and focus/halo ownership are not replaced.
          s.enabledTrigger(`background: var(--en-accordion-pressed-background, transparent); color: var(--en-accordion-pressed-color, ${ctx.role('color') ?? 'inherit'});`, ':active'),
          ctx.style([customIcon, ...s.nativeTriggers.map(selector => `${selector}::after`)], declarations({ color: ctx.role('indicatorColor') })),
          ctx.style(s.disabledBases, declarations({ opacity: ctx.role('disabledOpacity'), cursor: 'not-allowed' })),
          ctx.style(s.disabledTriggers, declarations({ opacity: '1', color: ctx.role('color'), cursor: 'not-allowed' })),
        ].join('\n')));
        parts.push(`@media (any-pointer: coarse) { ${s.trigger('min-inline-size: max(var(--en-size-target-min, 24px), var(--en-size-target-touch, 2.75rem)); min-block-size: max(var(--en-control-min-size, var(--en-size-control-min, 2.5rem)), var(--en-size-target-min, 24px), var(--en-size-target-touch, 2.75rem));')} }`);
        parts.push(`@media (forced-colors: active) { ${ctx.style(s.bases, 'background: Canvas; color: CanvasText; border-color: CanvasText;')}
          ${ctx.style([customIcon, ...s.nativeTriggers.map(selector => `${selector}::after`)], 'color: CanvasText;')}
          ${ctx.style(s.disabledBases, 'color: GrayText; border-color: GrayText;')}
          ${ctx.style(s.disabledTriggers, 'color: GrayText;')} }`);
        return parts.join('\n');
      },
    },
  },
} as const satisfies CompanionPresentationRegistry;
