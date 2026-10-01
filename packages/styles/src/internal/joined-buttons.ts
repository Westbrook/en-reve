import {css} from 'lit';
/** Joined geometry is shared by native actions and custom-element controls. */
export const joinedButtonStyles = css`
.en-button-group { display:flex; gap:var(--en-space-2); flex-wrap:wrap; }
.en-button-group[data-orientation="vertical"] { flex-direction:column; align-items:stretch; }
:is(.en-button-group:not([data-joined="false"]), :host([joined]) .en-choice-group) { display:flex; gap:0; flex-wrap:nowrap; isolation:isolate; }
:is(.en-button-group:not([data-joined="false"]), :host([joined]) .en-choice-group) > :not([hidden]) { position:relative; }
:is(.en-button-group:not([data-joined="false"]), :host([joined]) .en-choice-group) > :is([pressed="true"], [aria-pressed="true"]) { z-index:1; }
@media (hover: hover) {
:is(.en-button-group:not([data-joined="false"]), :host([joined]) .en-choice-group) > :hover { z-index:2; }
}
:is(.en-button-group:not([data-joined="false"]), :host([joined]) .en-choice-group) > :is(:focus-within,:active) { z-index:3; }
:is(.en-button-group:not([data-joined="false"]):not([data-orientation="vertical"]), :host([joined]:not([orientation="vertical"])) .en-choice-group) > :not([hidden]):not(:nth-child(1 of :not([hidden]))) { margin-inline-start:calc(0px - var(--en-border-width)); }
:is(.en-button-group:not([data-joined="false"]):not([data-orientation="vertical"]), :host([joined]:not([orientation="vertical"])) .en-choice-group) > .en-button:not([hidden]):not(:nth-child(1 of :not([hidden]))) { border-start-start-radius:0;border-end-start-radius:0; }
:is(.en-button-group:not([data-joined="false"]):not([data-orientation="vertical"]), :host([joined]:not([orientation="vertical"])) .en-choice-group) > .en-button:not([hidden]):not(:nth-last-child(1 of :not([hidden]))) { border-start-end-radius:0;border-end-end-radius:0; }
:is(.en-button-group:not([data-joined="false"]):not([data-orientation="vertical"]), :host([joined]:not([orientation="vertical"])) .en-choice-group) > :is(en-button,en-toggle-button):not([hidden]):not(:nth-child(1 of :not([hidden])))::part(control) { border-start-start-radius:0;border-end-start-radius:0; }
:is(.en-button-group:not([data-joined="false"]):not([data-orientation="vertical"]), :host([joined]:not([orientation="vertical"])) .en-choice-group) > :is(en-button,en-toggle-button):not([hidden]):not(:nth-last-child(1 of :not([hidden])))::part(control) { border-start-end-radius:0;border-end-end-radius:0; }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > :not([hidden]) { margin-inline-start:0; }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > :not([hidden]):not(:nth-child(1 of :not([hidden]))) { margin-block-start:calc(0px - var(--en-border-width)); }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > .en-button { border-radius:var(--en-button-radius,var(--en-control-radius,var(--en-radius-control))); }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > .en-button:not([hidden]):not(:nth-child(1 of :not([hidden]))) { border-start-start-radius:0;border-start-end-radius:0; }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > .en-button:not([hidden]):not(:nth-last-child(1 of :not([hidden]))) { border-end-start-radius:0;border-end-end-radius:0; }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > :is(en-button,en-toggle-button)::part(control) { inline-size:100%; border-radius:var(--en-button-radius,var(--en-control-radius,var(--en-radius-control))); }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > :is(en-button,en-toggle-button):not([hidden]):not(:nth-child(1 of :not([hidden])))::part(control) { border-start-start-radius:0;border-start-end-radius:0; }
:is(.en-button-group[data-orientation="vertical"]:not([data-joined="false"]), :host([joined][orientation="vertical"]) .en-choice-group) > :is(en-button,en-toggle-button):not([hidden]):not(:nth-last-child(1 of :not([hidden])))::part(control) { border-end-start-radius:0;border-end-end-radius:0; }
`;
