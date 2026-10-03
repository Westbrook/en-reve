import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Public component boundaries only; authored native tables are documented content. */
export const collectionsTargets = {
  calendar: ['en-calendar'],
  'date-picker': ['en-date-picker'],
  table: ['en-table', '.en-table-native'],
  'data-table': ['en-data-table'],
  carousel: ['en-carousel'],
} as const;

function rule(context: CompanionPresentationContext, suffix: string, values: Readonly<Record<string, string | undefined>>) {
  const css = declarations(values);
  return css ? context.block(suffix, css) : '';
}

const calendarRoles = {
  'day-weight': 'fontWeight', 'heading-weight': 'fontWeight',
  'weekday-size': 'dimension', 'weekday-line-height': 'number', 'weekday-weight': 'fontWeight',
  'weekday-padding': 'dimension', 'header-gap': 'dimension', 'row-gap': 'dimension',
  'hover-background': 'color', 'hover-color': 'color', 'hover-opacity': 'number',
  'selected-background': 'color', 'selected-color': 'color',
  'range-background': 'color', 'range-color': 'color',
  'endpoint-background': 'color', 'endpoint-color': 'color', 'day-radius': 'dimension',
  'today-color': 'color', 'today-weight': 'fontWeight',
  'today-underline-thickness': 'dimension', 'today-underline-offset': 'dimension',
} as const;

function calendar(context: CompanionPresentationContext, picker: boolean) {
  const { role: r } = context;
  const part = (name: string) => `::part(${picker ? 'calendar-' : ''}${name})`;
  const host = picker ? '::part(calendar)' : '';
  const geometry = [
    rule(context, host, { '--en-calendar-day-radius': r('day-radius'), '--en-font-label-strong-weight': r('heading-weight') }),
    rule(context, part('day'), { 'font-weight': r('day-weight') }),
    rule(context, part('selected'), { 'font-weight': r('day-weight') }),
  ];
  if (!picker) geometry.push(
    rule(context, '::part(heading)', { 'font-weight': r('heading-weight') }),
    rule(context, '::part(header)', { 'margin-block-end': r('header-gap') }),
    rule(context, '::part(weekday)', { 'font-size': r('weekday-size'), 'line-height': r('weekday-line-height'), 'font-weight': r('weekday-weight'), 'padding-block': r('weekday-padding') }),
    context.block('::part(weekday)', 'text-transform: uppercase;'),
    rule(context, '::part(grid)', { 'border-spacing': r('row-gap') ? `0 ${r('row-gap')}` : undefined }),
    rule(context, '::part(today)', { 'font-weight': r('today-weight'), 'text-underline-offset': r('today-underline-offset'), 'text-decoration-thickness': r('today-underline-thickness') }),
    context.block('::part(today)', 'text-decoration-line: underline;'),
  );
  const paint = [
    // Internal state selectors keep unavailable dates inert. Direct :hover paint
    // on a Part could otherwise bypass the component's aria-disabled guard.
    rule(context, host, { '--en-option-hover-background': r('hover-background'), '--en-option-hover-color': r('hover-color'), '--en-calendar-hover-opacity': r('hover-opacity'), '--en-calendar-range-background': r('range-background') }),
    !picker ? rule(context, '::part(today)', { '--en-option-rest-color': r('today-color'), 'border-color': r('today-color') ? 'transparent' : undefined }) : '',
    // State inputs preserve optionPaint's disabled-first precedence, including
    // aria-disabled dates that remain keyboard discoverable. No direct selected
    // background/color declaration bypasses that precedence.
    rule(context, part('selected'), {
      '--en-option-selected-background': r('selected-background'), '--en-option-selected-color': r('selected-color'),
      '--en-option-hover-background': r('selected-background'), '--en-option-hover-color': r('selected-color'),
      '--en-option-pressed-background': r('selected-background'), '--en-option-pressed-color': r('selected-color'),
    }),
    rule(context, part('in-range'), { '--en-option-selected-color': r('range-color') }),
    // Range painting retains its specialized opacity-based disabled treatment;
    // its inert band supplies the interior fill, and endpoint hooks supply caps.
    rule(context, part('range-start'), { '--en-calendar-range-endpoint-background': r('endpoint-background'), '--en-option-selected-color': r('endpoint-color'), 'border-color': r('endpoint-background') }),
    rule(context, part('range-end'), { '--en-calendar-range-endpoint-background': r('endpoint-background'), '--en-option-selected-color': r('endpoint-color'), 'border-color': r('endpoint-background') }),
  ].filter(Boolean).join('\n');
  // Directional caps use logical corners and retain the component's continuous
  // week-row bands. Same-day ranges keep both caps.
  if (r('day-radius')) geometry.push(
    context.block(part('range-start'), `border-start-start-radius: ${r('day-radius')}; border-end-start-radius: ${r('day-radius')}; border-start-end-radius: 0; border-end-end-radius: 0;`),
    context.block(part('range-end'), `border-start-start-radius: 0; border-end-start-radius: 0; border-start-end-radius: ${r('day-radius')}; border-end-end-radius: ${r('day-radius')};`),
    context.block(`::part(${picker ? 'calendar-range-start calendar-range-end' : 'range-start range-end'})`, `border-radius: ${r('day-radius')};`),
  );
  return [...geometry, authorPaint(paint)].filter(Boolean).join('\n');
}

const tableRoles = {
  'block-padding-small': 'dimension', 'block-padding-medium': 'dimension', 'block-padding-large': 'dimension',
  'inline-padding-small': 'dimension', 'inline-padding-medium': 'dimension', 'inline-padding-large': 'dimension',
  'caption-size': 'dimension', 'caption-line-height': 'number', 'caption-weight': 'fontWeight', 'footer-weight': 'fontWeight',
  background: 'color', 'header-background': 'color', 'border-color': 'color', 'hover-background': 'color',
} as const;

function table(context: CompanionPresentationContext, facade: boolean) {
  const { role: r } = context;
  const nativeTable = facade ? '::part(table)' : ' > table';
  const caption = facade ? '::part(caption)' : ' > table > caption';
  const surfaces = facade ? ['::part(table-surface)'] : [
    ':where(en-table)::part(base)',
    nativeSurface(':where(.en-table-native):not(:where(en-table))'),
  ];
  const geometry = [
    // Use public absolute size inputs, preserving selected-size and explicit
    // size="inherit" behavior; existing cell-padding hooks still take priority.
    rule(context, '', {
      '--en-space-rows-small': r('block-padding-small'), '--en-space-rows-medium': r('block-padding-medium'), '--en-space-rows-large': r('block-padding-large'),
      '--en-space-control-inline-small': r('inline-padding-small'), '--en-space-control-inline-medium': r('inline-padding-medium'), '--en-space-control-inline-large': r('inline-padding-large'),
    }),
    // Custom elements expose a surface Part. Match the native wrapper's one-class
    // recipe specificity; hook defaults and authored cell rules stay unchanged.
    ...surfaces.map(surface => context.block(surface, 'border-width: 0; border-radius: 0;')),
    context.block(nativeTable, 'font-variant-numeric: lining-nums tabular-nums;'),
    rule(context, caption, { 'font-size': r('caption-size'), 'line-height': r('caption-line-height'), 'font-weight': r('caption-weight') }),
  ];
  const paint = [rule(context, '', { '--en-table-background': r('background'), '--en-table-header-background': r('header-background'), '--en-table-border-color': r('border-color'), '--en-table-row-hover-background': r('hover-background') })];
  if (!facade) {
    // Native row/cell selectors are an explicit public table-helper contract.
    // The data facade's private cells are intentionally not selected here.
    const cells = ' > table > :is(thead, tbody, tfoot) > tr > :is(th, td)';
    geometry.push(context.block(cells, 'border-block-start-width: 0; border-block-end-width: var(--en-border-width); border-block-end-style: solid;'));
    paint.push(rule(context, cells, { 'border-block-end-color': r('border-color') }));
    geometry.push(rule(context, ' > table > tfoot', { 'font-weight': r('footer-weight') }));
  }
  return [...geometry, authorPaint(paint.filter(Boolean).join('\n'))].filter(Boolean).join('\n');
}

export const collectionsPresentations = {
  calendar: { 'solid-date-selection': { roles: calendarRoles, render: (context) => calendar(context, false) } },
  'date-picker': {
    'solid-date-selection': {
      roles: { ...calendarRoles, 'surface-radius': 'dimension', 'surface-padding': 'dimension' },
      render: (context) => [calendar(context, true), rule(context, '::part(surface)', { 'border-radius': context.role('surface-radius'), padding: context.role('surface-padding') })].filter(Boolean).join('\n'),
    },
  },
  table: { 'line-table': { roles: tableRoles, render: (context) => table(context, false) } },
  'data-table': { 'line-table': { roles: tableRoles, render: (context) => table(context, true) } },
  carousel: {
    'solid-position-selection': {
      roles: { 'layout-gap': 'dimension', 'picker-gap': 'dimension', 'selected-background': 'color', 'selected-color': 'color' },
      render: (context) => [
        rule(context, '::part(base)', { gap: context.role('layout-gap') }),
        rule(context, '::part(picker)', { gap: context.role('picker-gap') }),
        authorPaint(rule(context, '::part(picker-current)', { background: context.role('selected-background'), color: context.role('selected-color'), 'border-color': context.role('selected-background') })),
      ].filter(Boolean).join('\n'),
    },
  },
} as const satisfies CompanionPresentationRegistry;
