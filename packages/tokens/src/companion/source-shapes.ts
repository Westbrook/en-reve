import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';
import { sourceSizedRoles, sourceSizedValue } from './astryx.js';

/** Reusable finite anatomy, independent of a brand or upstream component engine.
 * Targets name documented public hosts/helpers; recipe data supplies token IDs. */
export const sourceShapeTargets = {
  'filled-radio': ['en-radio', '.en-radio'],
  'enclosed-tabs': ['en-tabs', '.en-tab-list'],
  'enclosed-tab': ['en-tab', '.en-tab'],
  'enclosed-tab-panel': ['en-tab-panel', '.en-tab-panel'],
  'inset-card': ['en-card', '.en-card'],
  'themed-code': ['code.en-code', 'pre.en-code'],
  'compact-keycap': ['kbd.en-keycap'],
  'enclosed-accordion': ['en-accordion', '.en-accordion'],
  'enclosed-accordion-item': ['en-accordion-item', '.en-accordion-item'],
  'padded-dialog': ['en-dialog', '.en-dialog'],
  'padded-popover': ['en-popover', '.en-popover'],
} as const;

function surface(ctx: CompanionPresentationContext, part: string, css: string, state = '', pseudo = ''): string {
  if (!css) return '';
  return ctx.style(ctx.selectors.map((selector, index) => index === 0
    ? `${selector}${state}::part(${part})${pseudo}`
    : `${nativeSurface(selector)}${state}${pseudo}`), css);
}

/** Native input state is on the exposed input, not its custom-element host. */
function radio(ctx: CompanionPresentationContext, css: string, state = ''): string {
  if (!css) return '';
  return ctx.style(ctx.selectors.map((selector, index) => index === 0
    ? `${selector}::part(control)${state}`
    : `${nativeSurface(selector)}${state}`), css);
}

function verticalList(ctx: CompanionPresentationContext, css: string): string {
  if (!css) return '';
  return ctx.style([
    `${ctx.selectors[0]}[orientation="vertical"]::part(tab-list)`,
    `${nativeSurface(ctx.selectors[1])}:is([aria-orientation="vertical"], [data-orientation="vertical"])`,
  ], css);
}

/** Match the documented native tab recipe's held-state specificity. */
function tabSurface(ctx: CompanionPresentationContext, css: string, state = ''): string {
  if (!css) return '';
  return ctx.style([
    `${ctx.selectors[0]}${state}::part(base)`,
    `${nativeSurface(ctx.selectors[1])}.en-tab${state}`,
  ], css);
}

const textRoles = { fontSize: 'dimension', lineHeight: 'number', weight: 'fontWeight' } as const;

function accordionTrigger(ctx: CompanionPresentationContext, css: string, state = ''): string {
  if (!css) return '';
  const item = nativeSurface(ctx.selectors[1]);
  const trigger = `.en-accordion-trigger.en-accordion-trigger:not([data-en-theme])${state}`;
  return ctx.style([
    `${ctx.selectors[0]}::part(control)${state}`,
    `${item} > ${trigger}`,
    `${item} > :is(h1, h2, h3, h4, h5, h6, [role="heading"]):not([data-en-theme]) > ${trigger}`,
  ], css);
}

/** Preserve native modal specificity and public author-owned child boundaries. */
function overlayPart(ctx: CompanionPresentationContext, part: string, native: string, css: string, modal = false): string {
  if (!css) return '';
  return ctx.style([
    `${ctx.selectors[0]}::part(${part})`,
    `${nativeSurface(ctx.selectors[1])}${modal ? ':is(dialog)' : ''}${native}`,
  ], css);
}
const overlayTextRoles = { ...textRoles, padding: 'dimension', gap: 'dimension', titleFontSize: 'dimension', titleLineHeight: 'number', titleWeight: 'fontWeight' } as const;
function sourceOverlayText(ctx: CompanionPresentationContext): string {
  return declarations({ 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight') });
}
function sourceOverlayTitle(ctx: CompanionPresentationContext): string {
  return declarations({ 'font-size': ctx.role('titleFontSize'), 'line-height': ctx.role('titleLineHeight'), 'font-weight': ctx.role('titleWeight') });
}

export const sourceShapePresentations = {
  'filled-radio': {
    filled: {
      roles: {
        borderWidth: 'dimension', dotSize: 'dimension', gap: 'dimension', labelLineHeight: 'number',
        background: 'color', border: 'color', selectedBackground: 'color', selectedDotColor: 'color',
        hoverBorder: 'color', focusBorder: 'color', pressedBorder: 'color',
        selectedHoverBackground: 'color', selectedFocusBackground: 'color', selectedPressedBackground: 'color',
        invalidBorder: 'color', invalidHoverBorder: 'color', invalidFocusBorder: 'color', invalidPressedBorder: 'color',
        invalidSelectedBackground: 'color', invalidSelectedHoverBackground: 'color', invalidSelectedFocusBackground: 'color', invalidSelectedPressedBackground: 'color',
        disabledBackground: 'color', disabledSelectedBackground: 'color', disabledBorder: 'color', disabledDotColor: 'color', disabledOpacity: 'number',
      },
      render(ctx) {
        const background = ctx.role('selectedBackground');
        const selected = background === undefined ? undefined : `var(--en-radio-selected-color, ${background})`;
        const selectedPaint = (value: string | undefined) => value === undefined ? undefined : `var(--en-radio-selected-color, ${value})`;
        const pressedPaint = (value: string | undefined) => value === undefined ? undefined : `var(--en-radio-pressed-border-color, ${value})`;
        const statePaint = (css: string, checked: boolean, invalid: boolean, state = ''): string => {
          if (!css) return '';
          const choice = checked ? ':checked' : ':not(:checked)';
          const hostState = state === 'hover' || state === 'active' ? `:${state}` : '';
          const inputState = state === 'focus-visible' ? ':focus-visible' : '';
          // The host includes its label and whitespace. :enabled on the actual
          // Part also excludes fieldset/group disabling that is absent on host.
          const host = `${ctx.selectors[0]}:not(:disabled):not([aria-disabled="true"])`;
          const control = `::part(${invalid ? 'control-invalid' : 'control'}):enabled${choice}`;
          const hosts = [`${host}${hostState}${control}${inputState}`];
          if (hostState) hosts.push(`${host}${control}${hostState}`);
          // Match the held native recipe's label path and specificity. Focus
          // uses an equivalent label path so its later rule wins over hover.
          // Invalid states repeat these selectors below: ordinary paint remains
          // available when error roles are omitted in other filled themes.
          const nativeState = state === 'hover' || state === 'active'
            ? `:is(:${state}, .en-choice:${state} > .en-radio)`
            : state === 'focus-visible' ? ':is(:focus-visible, .en-choice > .en-radio:focus-visible)' : '';
          const validity = invalid ? ':is([aria-invalid="true"], :user-invalid)' : '';
          const native = `${nativeSurface(ctx.selectors[1])}:enabled:not([aria-disabled="true"])${validity}${choice}${nativeState}`;
          return ctx.style([...hosts, native], css);
        };
        const disabledPaint = (css: string, state = ''): string => {
          if (!css) return '';
          const native = nativeSurface(ctx.selectors[1]);
          return ctx.style([
            `${ctx.selectors[0]}::part(control):disabled${state}`,
            `${ctx.selectors[0]}[aria-disabled="true"]::part(control)${state}`,
            `${native}:is(:disabled, [aria-disabled="true"])${state}`,
            // ARIA alone does not suppress :active. Match the native held
            // recipe so disabled paint also wins on the label's held target.
            `${native}[aria-disabled="true"]:not(:disabled):is(:active, .en-choice:active > .en-radio)${state}`,
          ], css);
        };
        const interactions = (invalid = false): string => {
          const prefix = invalid ? 'invalid' : '';
          const borderRest = invalid ? ctx.role('invalidBorder') : undefined;
          const selectedRest = invalid ? ctx.role('invalidSelectedBackground') : undefined;
          return [
            ...(invalid ? [
              statePaint(declarations({ 'border-color': borderRest }), false, true),
              statePaint(declarations({ background: selectedPaint(selectedRest), 'border-color': selectedPaint(selectedRest ?? borderRest) }), true, true),
            ] : []),
            ...([['Hover', 'hover'], ['Focus', 'focus-visible'], ['Pressed', 'active']] as const).map(([role, state]) => {
              const border = ctx.role(`${prefix}${invalid ? role : role[0].toLowerCase() + role.slice(1)}Border`) ?? borderRest;
              const fill = ctx.role(`${invalid ? 'invalidSelected' : 'selected'}${role}Background`) ?? selectedRest;
              const selectedFill = selectedPaint(fill);
              const selectedBorder = selectedFill ?? (invalid ? selectedPaint(border) : undefined);
              const css = statePaint(declarations({ 'border-color': state === 'active' ? pressedPaint(border) : border }), false, invalid, state)
                + '\n' + statePaint(declarations({ background: selectedFill, 'border-color': state === 'active' ? pressedPaint(selectedBorder) : selectedBorder }), true, invalid, state);
              return css.trim() && state === 'hover' ? `@media (hover: hover) { ${css} }` : css;
            }),
          ].join('\n');
        };
        return [
          // Retain native layout, label target floors, checked visibility and size inheritance.
          radio(ctx, declarations({ 'border-width': ctx.role('borderWidth') })),
          radio(ctx, declarations({ 'inline-size': ctx.role('dotSize'), 'block-size': ctx.role('dotSize') }), ':checked::before'),
          ctx.style([`${ctx.selectors[0]}::part(label)`], declarations({ gap: ctx.role('gap') })),
          ctx.style([`${ctx.selectors[0]}::part(label-text)`], declarations({ 'line-height': ctx.role('labelLineHeight') })),
          authorPaint([
            radio(ctx, declarations({ background: ctx.role('background'), 'border-color': ctx.role('border') })),
            radio(ctx, declarations({ background: selected, 'border-color': selected }), ':checked'),
            radio(ctx, declarations({ background: ctx.role('selectedDotColor') }), ':checked::before'),
            interactions(),
            interactions(true),
            disabledPaint(declarations({ background: ctx.role('disabledBackground'), 'border-color': ctx.role('disabledBorder'), opacity: ctx.role('disabledOpacity') })),
            disabledPaint(declarations({ background: ctx.role('disabledSelectedBackground') }), ':checked'),
            disabledPaint(declarations({ background: ctx.role('disabledDotColor') }), ':checked::before'),
            ctx.style([`${ctx.selectors[0]}:is(:disabled, [aria-disabled="true"])::part(label-text)`], declarations({ opacity: ctx.role('disabledOpacity') })),
            // Group disabling reaches the private native input without setting
            // disabled on the public radio host. The group is a public owner.
            ctx.style([`${ctx.selectors[0].replace(':where(en-radio)', ':where(en-radio-group:is(:disabled, [disabled]) en-radio)')}::part(label-text)`], declarations({ opacity: ctx.role('disabledOpacity') })),
          ].join('\n')),
        ].join('\n');
      },
    },
  },
  'enclosed-tabs': {
    enclosed: {
      roles: { radius: 'dimension', padding: 'dimension', verticalPadding: 'dimension', gap: 'dimension', contentGap: 'dimension', background: 'color', color: 'color' },
      render(ctx) {
        const geometry = declarations({
          display: 'flex', 'inline-size': 'fit-content', 'max-inline-size': '100%',
          'align-items': 'center', 'justify-content': 'center', 'flex-wrap': 'wrap',
          padding: ctx.role('padding'), gap: ctx.role('gap'), 'border-radius': ctx.role('radius'), border: '0',
        });
        return [
          ctx.style([`${ctx.selectors[0]}::part(base)`], `display: flex; flex-direction: column; ${declarations({ gap: ctx.role('contentGap') })}`),
          ctx.style([`${ctx.selectors[0]}[orientation="vertical"]::part(base)`], 'flex-direction: row; align-items: flex-start;'),
          ctx.style([`${ctx.selectors[0]}::part(panels)`], 'flex: 1; min-inline-size: 0;'),
          surface(ctx, 'tab-list', geometry),
          // Override the native vertical recipe's inline edge at its own specificity.
          verticalList(ctx, declarations({ 'flex-direction': 'column', 'align-items': 'stretch', 'flex-wrap': 'nowrap', border: '0', padding: ctx.role('verticalPadding') })),
          authorPaint(surface(ctx, 'tab-list', declarations({ background: ctx.role('background'), color: ctx.role('color') }))),
          // A system-color rail remains visible without source background paint.
          `@media (forced-colors: active) { ${surface(ctx, 'tab-list', 'border: 1px solid ButtonText;')} ${verticalList(ctx, 'border: 1px solid ButtonText;')} }`,
        ].join('\n');
      },
    },
  },
  'enclosed-tab': {
    enclosed: {
      roles: {
        ...textRoles, radius: 'dimension', inlinePadding: 'dimension', blockPadding: 'dimension', minimumSize: 'dimension',
        background: 'color', color: 'color', hoverBackground: 'color', hoverColor: 'color',
        selectedBackground: 'color', selectedColor: 'color', selectedShadow: 'shadow', disabledOpacity: 'number',
      },
      render(ctx) {
        const minimum = ctx.role('minimumSize') ?? 'var(--en-size-control-min)';
        const minimumBlock = `max(var(--en-size-target-min), var(--en-control-min-size, ${minimum}))`;
        const radius = ctx.role('radius') ? `var(--en-control-radius, ${ctx.role('radius')})` : undefined;
        const inlinePadding = ctx.role('inlinePadding') ? `var(--en-control-inline-padding, ${ctx.role('inlinePadding')})` : undefined;
        const geometry = declarations({
          flex: '1', 'inline-size': '100%', 'border-width': '0', 'border-radius': radius,
          'padding-inline': inlinePadding, 'padding-block': ctx.role('blockPadding'),
          'min-block-size': minimumBlock,
          'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight'),
        });
        const enabled = ':not([aria-disabled="true"]):not([disabled])';
        return [
          ctx.style([ctx.selectors[0]], `flex: 1; ${declarations({ 'border-radius': radius })}`),
          tabSurface(ctx, geometry),
          `@media (any-pointer: coarse) { ${tabSurface(ctx, `min-inline-size: max(var(--en-size-target-min), var(--en-size-target-touch)); min-block-size: max(${minimumBlock}, var(--en-size-target-touch));`)} }`,
          authorPaint([
            // Use existing state hooks so explicit local overrides keep precedence.
            tabSurface(ctx, declarations({
              background: ctx.role('background') ? `var(--en-tab-background, ${ctx.role('background')})` : undefined,
              color: ctx.role('color') ? `var(--en-tab-color, ${ctx.role('color')})` : undefined,
            })),
            `@media (hover: hover) { ${tabSurface(ctx, declarations({
              background: ctx.role('hoverBackground') ? `var(--en-tab-hover-background, ${ctx.role('hoverBackground')})` : undefined,
              color: ctx.role('hoverColor') ? `var(--en-tab-hover-color, ${ctx.role('hoverColor')})` : undefined,
            }), `${enabled}:where(:not([aria-selected="true"])):hover`)} }`,
            tabSurface(ctx, declarations({
              background: ctx.role('selectedBackground') ? `var(--en-tab-selected-background, ${ctx.role('selectedBackground')})` : undefined,
              color: ctx.role('selectedColor') ? `var(--en-tab-selected-color, ${ctx.role('selectedColor')})` : undefined,
              'box-shadow': ctx.role('selectedShadow'), 'font-weight': ctx.role('weight'),
            }), '[aria-selected="true"]'),
            tabSurface(ctx, declarations({
              background: `var(--en-tab-pressed-background, var(--en-tab-background, ${ctx.role('background') ?? 'transparent'}))`,
              color: `var(--en-tab-pressed-color, var(--en-tab-color, ${ctx.role('color') ?? 'inherit'}))`,
            }), `${enabled}:active`),
            tabSurface(ctx, declarations({
              background: `var(--en-tab-pressed-background, var(--en-tab-selected-background, ${ctx.role('selectedBackground') ?? 'transparent'}))`,
              color: `var(--en-tab-pressed-color, var(--en-tab-selected-color, ${ctx.role('selectedColor') ?? 'inherit'}))`,
            }), `${enabled}[aria-selected="true"]:active`),
            tabSurface(ctx, declarations({ opacity: ctx.role('disabledOpacity') }), ':is([aria-disabled="true"], [disabled])'),
          ].join('\n')),
        ].join('\n');
      },
    },
  },
  'enclosed-tab-panel': {
    flush: {
      roles: {},
      render: ctx => surface(ctx, 'base', 'padding-block: 0;'),
    },
  },
  'inset-card': {
    inset: {
      roles: { gap: 'dimension', maxRadius: 'dimension', ...sourceSizedRoles('gap'), paddingInset: 'dimension', titleFontSize: 'dimension', titleLineHeight: 'number', titleWeight: 'fontWeight', headerGap: 'dimension' },
      render(ctx) {
        // The code-owned bridge follows core absolute sizing, including inherit;
        // recipe authors supply typed lengths rather than private selectors.
        const inset = ctx.role('paddingInset');
        const header = declarations({ gap: ctx.role('headerGap'), 'font-size': ctx.role('titleFontSize'), 'line-height': ctx.role('titleLineHeight'), 'font-weight': ctx.role('titleWeight') });
        // Core card borders use this same public token. Explicit surface
        // padding keeps its existing meaning and wins over the source default.
        const padding = inset === undefined ? undefined : `var(--en-surface-padding, max(0px, calc(${inset} - var(--en-border-width))))`;
        return surface(ctx, 'base', declarations({
          gap: sourceSizedValue(ctx, 'gap') ?? ctx.role('gap'),
          padding,
          'border-radius': ctx.role('maxRadius')
            ? `var(--en-surface-radius, min(var(--_en-sized-radius-container, var(--en-radius-container, 1rem)), ${ctx.role('maxRadius')}))`
            : undefined,
        }))
          + ctx.style([
            `${ctx.selectors[0]}::part(header)`,
            `${nativeSurface(ctx.selectors[1])} > .en-card__header:not([data-en-theme])`,
          ], header ? `display: flex; flex-direction: column; ${header}` : '');
      },
    },
  },
  'themed-code': {
    typeface: {
      roles: { family: 'fontFamily' },
      render: ctx => ctx.style(ctx.selectors.map(nativeSurface), declarations({ 'font-family': ctx.role('family') ? `var(--en-font-code-family, ${ctx.role('family')})` : undefined })),
    },
  },
  'compact-keycap': {
    compact: {
      roles: { ...textRoles, family: 'fontFamily', radius: 'dimension', minimumSize: 'dimension', inlinePadding: 'dimension', background: 'color', color: 'color' },
      render(ctx) {
        const selectors = ctx.selectors.map(nativeSurface);
        return ctx.style(selectors, declarations({ display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'min-inline-size': ctx.role('minimumSize'), 'min-block-size': ctx.role('minimumSize'), 'padding-block': '0', 'padding-inline': ctx.role('inlinePadding'), 'border-radius': ctx.role('radius'), 'font-family': ctx.role('family'), 'font-size': ctx.role('fontSize'), 'line-height': ctx.role('lineHeight'), 'font-weight': ctx.role('weight') }))
          + authorPaint(ctx.style(selectors, declarations({ border: '0', background: ctx.role('background'), color: ctx.role('color') })));
      },
    },
  },
  'enclosed-accordion': {
    enclosed: {
      roles: { radius: 'dimension', borderWidth: 'dimension', borderColor: 'color' },
      render: ctx => surface(ctx, 'base', declarations({
        'border-radius': ctx.role('radius'), 'border-width': ctx.role('borderWidth'), 'border-style': 'solid',
        // Keep the component's outward keyboard contour visible. Item corners
        // supply the clipped silhouette without clipping focus or authored text.
        overflow: 'visible',
      })) + authorPaint(surface(ctx, 'base', declarations({ 'border-color': ctx.role('borderColor') })))
        + `@media (forced-colors: active) { ${surface(ctx, 'base', 'border-color: CanvasText;')} }`,
    },
  },
  'enclosed-accordion-item': {
    enclosed: {
      roles: { inlinePadding: 'dimension', blockPadding: 'dimension', radius: 'dimension', borderWidth: 'dimension', borderColor: 'color', openBackground: 'color', disabledOpacity: 'number' },
      render(ctx) {
        const inset = ctx.role('inlinePadding');
        const radius = ctx.role('radius');
        const item = nativeSurface(ctx.selectors[1]);
        const open = [
          `${ctx.selectors[0]}[open]::part(base)`,
          `${item}:is([open], :has(> .en-accordion-trigger[aria-expanded="true"], > :is(h1, h2, h3, h4, h5, h6, [role="heading"]) > .en-accordion-trigger[aria-expanded="true"]))`,
        ];
        return [
          surface(ctx, 'base', declarations({ 'border-block-end-width': ctx.role('borderWidth'), 'border-block-end-style': 'solid' })),
          surface(ctx, 'base', 'border-block-end-width: 0;', ':last-child'),
          surface(ctx, 'base', declarations({ 'border-start-start-radius': radius, 'border-start-end-radius': radius }), ':first-child'),
          surface(ctx, 'base', declarations({ 'border-end-start-radius': radius, 'border-end-end-radius': radius }), ':last-child'),
          accordionTrigger(ctx, declarations({ 'padding-inline': inset, 'padding-block': ctx.role('blockPadding') })),
          ctx.style([
            `${ctx.selectors[0]}::part(panel)`,
            `${item} > .en-accordion-panel:not([data-en-theme])`,
          ], declarations({ 'padding-inline': inset, 'padding-block-start': '0px', 'padding-block-end': ctx.role('blockPadding') })),
          authorPaint([
            surface(ctx, 'base', declarations({ 'border-color': ctx.role('borderColor') })),
            ctx.style(open, declarations({ background: ctx.role('openBackground') })),
            accordionTrigger(ctx, 'background: transparent;'),
            `@media (hover: hover) { ${accordionTrigger(ctx, 'background: transparent; text-decoration: underline;', ':not(:disabled):not([aria-disabled="true"]):hover')} }`,
            accordionTrigger(ctx, 'background: var(--en-accordion-pressed-background, transparent); color: var(--en-accordion-pressed-color, inherit);', ':not(:disabled):not([aria-disabled="true"]):active'),
            accordionTrigger(ctx, declarations({ opacity: ctx.role('disabledOpacity') }), ':is(:disabled, [aria-disabled="true"])'),
          ].join('\n')),
        ].join('\n');
      },
    },
  },
  'padded-dialog': {
    padded: {
      roles: { ...overlayTextRoles, footerGap: 'dimension', descriptionColor: 'color', backdropBlur: 'dimension', maxRadius: 'dimension', fillInlineSize: 'dimension', fillBreakpoint: 'dimension' },
      render(ctx) {
        const native = nativeSurface(ctx.selectors[1]);
        const ordinary = [
          `${ctx.selectors[0]}:not([presentation="responsive"])::part(surface)`,
          `${native}:where(dialog):not(:where(.en-drawer))`,
        ];
        const fill = ctx.role('fillInlineSize'), breakpoint = ctx.role('fillBreakpoint');
        const maximum = (fallback: string) => `max-inline-size: min(var(--en-overlay-max-inline-size, ${fallback}), calc(100% - var(--en-space-8, 2rem)));`;
        return [
          // Opt into a filled ordinary dialog. The optional source breakpoint
          // uses resolved dimension literals, never var() inside a media query.
          // Preserve the public maximum and the core viewport clearance.
          fill ? ctx.style(ordinary, `inline-size: 100%; ${maximum(breakpoint ? '100%' : fill)}`) : '',
          fill && breakpoint ? `@media (width >= ${breakpoint}) { ${ctx.style(ordinary, maximum(fill))} }` : '',
          // Cap the core's selected semantic radius without assigning a public
          // override. Responsive queries are application-configurable, so leave
          // the entire responsive opt-in and native drawer geometry core-owned.
          ctx.role('maxRadius') ? ctx.style(ordinary, `border-radius: var(--en-overlay-radius, min(var(--_en-sized-radius-dialog, var(--en-radius-dialog)), ${ctx.role('maxRadius')}));`) : '',
          // Keep the core scrollport, responsive placement and focus composition.
          // Only the outer padding owns the inset; body clearance is unchanged.
          overlayPart(ctx, 'surface', '', sourceOverlayText(ctx) + declarations({
            padding: ctx.role('padding') ? `var(--en-overlay-padding, ${ctx.role('padding')})` : undefined,
            gap: ctx.role('gap'),
          }), true),
          overlayPart(ctx, 'heading', ' > .en-overlay-header:not([data-en-theme]) > .en-heading-small:not([data-en-theme])', sourceOverlayTitle(ctx)),
          overlayPart(ctx, 'footer', ' > .en-overlay-footer:not([data-en-theme])', declarations({ gap: ctx.role('footerGap') })),
          // Authored footer content is the public composition boundary. Forwarded
          // slots count as content, so this does not hide their eventual children.
          ctx.style([
            `${ctx.selectors[0]}:not(:has(> [slot="footer"]))::part(footer)`,
            `${native} > .en-overlay-footer:not([data-en-theme]):empty`,
          ], 'display: none;'),
          authorPaint(overlayPart(ctx, 'description', ' > .en-overlay-description:not([data-en-theme])', declarations({ color: ctx.role('descriptionColor') }))),
          ctx.role('backdropBlur') ? authorPaint(`@supports (backdrop-filter: blur(1px)) { ${ctx.style([
            `${ctx.selectors[0]}::part(surface)::backdrop`,
            `${native}:is(dialog)::backdrop`,
          ], `backdrop-filter: blur(${ctx.role('backdropBlur')});`)} }`) : '',
        ].join('\n');
      },
    },
  },
  'padded-popover': {
    padded: {
      roles: { ...overlayTextRoles, radius: 'dimension' },
      render(ctx) {
        const host = ctx.selectors[0], native = nativeSurface(ctx.selectors[1]);
        const padding = ctx.role('padding') ? `padding: var(--en-overlay-padding, ${ctx.role('padding')});` : '';
        return [
          overlayPart(ctx, 'surface', '', sourceOverlayText(ctx) + declarations({
            'row-gap': ctx.role('gap'), 'border-radius': ctx.role('radius') ? `var(--en-overlay-radius, ${ctx.role('radius')})` : undefined,
          })),
          // The core owns the content wrapper in both variants. Keep one inset:
          // plain surfaces own it; arrow content owns it inside the outer plate.
          padding ? ctx.style([`${host}:not([arrow])::part(surface)`, `${native}:not([data-arrow])`], padding) : '',
          padding ? ctx.style([`${host}[arrow]::part(content)`, `${native}[data-arrow] > .en-overlay-content:not([data-en-theme])`], padding) : '',
          overlayPart(ctx, 'heading', ' > .en-heading-small:not([data-en-theme])', sourceOverlayTitle(ctx)),
          ctx.style([`${native}[data-arrow] > .en-overlay-content:not([data-en-theme]) > .en-heading-small:not([data-en-theme])`], sourceOverlayTitle(ctx)),
        ].join('\n');
      },
    },
  },
} satisfies CompanionPresentationRegistry;
