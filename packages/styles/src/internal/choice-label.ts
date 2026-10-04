import { css, type CSSResult } from 'lit';
import { token as t, override as o } from './values.js';

const input = css`input:is(.en-checkbox, .en-radio, .en-switch)`;
const enabledInput = css`${input}:enabled:not([aria-disabled='true'])`;
const choice = css`.en-choice:has(> ${input})`;
const enabledChoice = css`.en-choice:has(> ${enabledInput})`;
const disabledChoice = css`.en-choice:has(> ${input}:is(:disabled, [aria-disabled='true']))`;

/** Only the documented native label text receives paint, never its description. */
function labels(selector: CSSResult, prefix = css``): CSSResult {
  return css`${prefix}:where(${selector}) > .en-label,
    ${prefix}:where(${selector}) > :where(.en-choice-content) > .en-label`;
}

const rest = o('--en-choice-label-color', t('--en-color-text'));

/** The native input owns focus and effective disabling inside and outside shadow DOM. */
export const choiceLabelStyles = css`
  @media (forced-colors: none) {
    ${labels(choice)} { color: ${rest}; }
    @media (hover: hover) {
      ${labels(css`${enabledChoice}:hover`)} { color: ${o('--en-choice-label-hover-color', rest)}; }
    }
    ${labels(css`.en-choice:has(> ${enabledInput}:focus-visible)`)} { color: ${o('--en-choice-label-focus-color', rest)}; }
    ${labels(css`${enabledChoice}:is(:active, :has(> ${enabledInput}:active))`)} { color: ${o('--en-choice-label-pressed-color', rest)}; }
    /* Equal selector weight makes disabled > pressed > focus-visible > hover > rest.
       Native :disabled also observes fieldsets and the radio group's owned input. */
    ${labels(disabledChoice)},
    ${labels(choice, css`:host([aria-disabled='true']) `)} { color: ${o('--en-choice-label-disabled-color', rest)}; }
  }
`;
