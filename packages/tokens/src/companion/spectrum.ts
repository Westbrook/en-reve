import { sourceSizedRoles, sourceSizedValue } from './astryx.js';
import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';

/** Source-specific presentation over public hosts, native recipes and Parts.
 * Selected-size algebra is compiler-owned; recipes supply typed values only.
 */
export const spectrumTargets = {
  'spectrum-control': [
    'en-button', '.en-button', 'en-toggle-button',
    'en-text-field', 'en-search-input', 'en-textarea', 'en-number-field', 'en-combobox', 'en-select',
    'en-checkbox', 'en-radio', 'en-switch',
    '.en-input', '.en-textarea', '.en-select', '.en-choice',
  ],
  'sized-choice': ['en-checkbox', 'en-radio', '.en-checkbox', '.en-radio'],
  'spectrum-field': ['en-text-field', 'en-search-input', 'en-textarea', 'en-number-field', 'en-combobox', 'en-select', '.en-input', '.en-textarea', '.en-select', '.en-number-group'],
  'spectrum-checkbox': ['en-checkbox', '.en-checkbox'],
} as const;

function surfaces(ctx: CompanionPresentationContext, css: string, state = '', enabledPaint = false): string {
  if (!css) return '';
  return ctx.selectors.map(selector => ctx.style([/:where\(\.en-/.test(selector)
    ? `${nativeSurface(selector)}${state}`
    : `${selector}${enabledPaint ? ':not(:disabled):not([aria-disabled="true"])' : ''}::part(control)${state}`], css)).join('\n');
}

type CheckboxInteraction = ':hover' | ':focus-visible' | ':active';

function checkboxPaint(ctx: CompanionPresentationContext, css: string, state = '', invalid = false, interaction?: CheckboxInteraction, disabled = false): string {
  if (!css) return '';
  return ctx.selectors.map(selector => {
    if (/:where\(\.en-/.test(selector)) {
      const control = nativeSurface(selector);
      // ARIA-disabled is a presentation contract; native disabled additionally
      // covers disabled fieldsets. Match the documented label/group recipes so
      // their more specific hover/held paint cannot override source states.
      const gate = disabled ? ':is(:disabled, :enabled[aria-disabled="true"])' : ':enabled:not([aria-disabled="true"])';
      const target = `${control}${gate}${invalid ? ':is([aria-invalid="true"], :user-invalid)' : ''}${state}`;
      const selectors = interaction && interaction !== ':focus-visible'
        ? [`${target}:is(${interaction}, .en-choice${interaction} > .en-checkbox)`]
        : [`${target}${interaction ?? ''}`];
      if (interaction === ':hover') selectors.push(`.en-choice-group .en-choice:hover:not(:active) > ${target}`);
      return ctx.style(selectors, css);
    }
    const part = `::part(${invalid ? 'control-invalid' : 'control'})`;
    const hosts = disabled
      ? [`${selector}${part}:disabled${state}`, `${selector}[aria-disabled="true"]${part}${state}`]
      : [`${selector}:not(:disabled):not([aria-disabled="true"])${part}:enabled${state}`];
    const selectors = hosts.map(target => `${target}${interaction ?? ''}`);
    // The host also responds when its associated label text, rather than the
    // small native square, is hovered or held. Focus-visible stays input-owned.
    if (interaction && interaction !== ':focus-visible') {
      selectors.push(...hosts.map(target => target.replace('::part(', `${interaction}::part(`)));
    }
    return ctx.style(selectors, css);
  }).join('\n');
}

export const spectrumPresentations = {
  'spectrum-control': {
    'source-size': {
      roles: sourceSizedRoles('lineHeight', 'number'),
      render(ctx) {
        const lineHeight = sourceSizedValue(ctx, 'lineHeight');
        // Resolve on each actual host. These hooks feed the established field
        // envelope as well as text, so label/control alignment stays coordinated.
        // Explicit size=inherit uses the same existing flags as core styles.
        return ctx.block('', declarations({
          '--en-font-ui-line-height': lineHeight,
          '--en-font-input-line-height': lineHeight,
        }));
      },
    },
  },
  'sized-choice': {
    'source-size': {
      roles: { ...sourceSizedRoles('size'), borderWidth: 'dimension' },
      render(ctx) {
        const size = sourceSizedValue(ctx, 'size');
        // Only the visual native input changes; its containing label retains the
        // established ordinary/coarse target dimensions and click behavior.
        return surfaces(ctx, declarations({
          'inline-size': size ? `var(--en-choice-size, ${size})` : undefined,
          'block-size': size ? `var(--en-choice-size, ${size})` : undefined,
          'border-width': ctx.role('borderWidth'),
        }));
      },
    },
  },
  'spectrum-field': {
    'neutral-focus': {
      roles: { focusBorderColor: 'color', invalidBorderColor: 'color' },
      render(ctx) {
        const paint = declarations({ 'border-color': ctx.role('focusBorderColor') });
        const invalidPaint = declarations({ 'border-color': ctx.role('invalidBorderColor') ? `var(--en-input-invalid-border-color, ${ctx.role('invalidBorderColor')})` : undefined });
        if (!paint) return '';
        return authorPaint(ctx.selectors.map(selector => {
          if (/:where\(\.en-/.test(selector)) {
            const native = nativeSurface(selector);
            if (/\.en-number-group\b/.test(selector)) {
              return ctx.style([`${native}:not([data-invalid]):not([aria-invalid="true"]):not([aria-disabled="true"]):has(> .en-number-input:enabled:not([aria-disabled="true"]):not([aria-invalid="true"]):not(:user-invalid)):focus-within`], paint);
            }
            return ctx.style([`${native}:enabled:not([aria-disabled="true"]):not([aria-invalid="true"]):not(:user-invalid):focus`], paint);
          }
          const host = `${selector}:not(:disabled):not([aria-disabled="true"])`;
          if (/\ben-number-field\b/.test(selector)) {
            // The grouped stepper owns the perimeter, not its transparent editor.
            return ctx.style([`${host}:focus-within::part(stepper)`], paint)
              + '\n' + ctx.style([`${host}:focus-within::part(stepper-invalid)`], invalidPaint);
          }
          // A reported invalid native draft can precede host-visible feedback.
          // Keep that error paint without making this rule more specific than
          // the visible-invalid Part rule that follows.
          const control = ctx.style([`${host}::part(control):enabled:where(:not(:user-invalid)):focus`], paint)
            + '\n' + ctx.style([`${host}::part(control-invalid):enabled:focus`], invalidPaint);
          // The explicit Part follows visible feedback, never pristine constraint
          // validity. Adorned text fields own their border on the wrapper.
          return /\ben-text-field\b/.test(selector)
            ? control + '\n' + ctx.style([`${host}[adorned]:focus-within::part(focus-frame)`], paint)
              + '\n' + ctx.style([`${host}[adorned]:focus-within::part(focus-frame-invalid)`], invalidPaint)
            : control;
        }).join('\n'));
      },
    },
  },
  'spectrum-checkbox': {
    'neutral-selected': {
      roles: {
        ...sourceSizedRoles('radius'),
        background: 'color', borderColor: 'color',
        selectedBackground: 'color', selectedColor: 'color',
        invalidBorderColor: 'color', invalidBackground: 'color', invalidSelectedColor: 'color',
        interactiveBorderColor: 'color', interactiveSelectedBackground: 'color',
        invalidInteractiveBorderColor: 'color', invalidInteractiveBackground: 'color',
        disabledBackground: 'color', disabledBorderColor: 'color',
        disabledSelectedBackground: 'color', disabledSelectedColor: 'color',
      },
      render(ctx) {
        const unchecked = ':not(:checked):not(:indeterminate)';
        const selected = ':is(:checked, :indeterminate)';
        const interactive = (state: CheckboxInteraction, invalid: boolean) => {
          const border = ctx.role(invalid ? 'invalidInteractiveBorderColor' : 'interactiveBorderColor');
          const fill = ctx.role(invalid ? 'invalidInteractiveBackground' : 'interactiveSelectedBackground');
          const pressed = (color: string | undefined) => color && state === ':active'
            ? `var(--en-checkbox-pressed-border-color, ${color})` : color;
          // Optional roles remain additive: old recipes emit no new states.
          return checkboxPaint(ctx, declarations({ background: border ? ctx.role('background') : undefined, 'border-color': pressed(border) }), unchecked, invalid, state)
            + checkboxPaint(ctx, declarations({ background: fill, 'border-color': pressed(fill) }), selected, invalid, state);
        };
        const disabled = (state?: CheckboxInteraction) => checkboxPaint(ctx, declarations({ background: ctx.role('disabledBackground'), 'border-color': ctx.role('disabledBorderColor') }), unchecked, false, state, true)
          + checkboxPaint(ctx, declarations({ background: ctx.role('disabledSelectedBackground'), 'border-color': ctx.role('disabledSelectedBackground') }), selected, false, state, true);
        const hover = (css: string) => css ? `@media (hover: hover) {${css}}` : '';
        const interactions = (invalid: boolean) => hover(interactive(':hover', invalid))
          + interactive(':focus-visible', invalid) + interactive(':active', invalid);
        return surfaces(ctx, declarations({ 'border-radius': sourceSizedValue(ctx, 'radius') }))
          + authorPaint(
            checkboxPaint(ctx, declarations({ background: ctx.role('background'), 'border-color': ctx.role('borderColor') }))
            // Matching fill/border paints the source's transparent selected rim
            // equivalently while retaining the protected native box geometry.
            + checkboxPaint(ctx, declarations({ background: ctx.role('selectedBackground'), 'border-color': ctx.role('selectedBackground') }), selected)
            + checkboxPaint(ctx, declarations({ 'border-color': ctx.role('selectedColor') }), `${selected}::before`)
            + checkboxPaint(ctx, declarations({ 'border-color': ctx.role('invalidBorderColor') }), '', true)
            + checkboxPaint(ctx, declarations({ background: ctx.role('invalidBackground'), 'border-color': ctx.role('invalidBackground') }), selected, true)
            + checkboxPaint(ctx, declarations({ 'border-color': ctx.role('invalidSelectedColor') }), `${selected}::before`, true)
            + interactions(false) + interactions(true)
            + disabled() + hover(disabled(':hover'))
            + disabled(':focus-visible') + disabled(':active')
            + checkboxPaint(ctx, declarations({ 'border-color': ctx.role('disabledSelectedColor') }), `${selected}::before`, false, undefined, true),
          );
      },
    },
  },
} as const satisfies CompanionPresentationRegistry;
