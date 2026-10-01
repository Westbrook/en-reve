# Hover capability policy

Decorative hover styling is enabled only by `@media (hover: hover)`. This is a
browser input-capability decision, not a viewport breakpoint or theme option.
The audit covers exported style families, their internal shared paint helpers,
custom-element navigation styles, customizable select options, forced-color
variants and documentation disclosure styling.

Keep `:active`, `:focus-visible`, selected/checked state, `aria-current`, expanded
state and the controller's keyboard-active candidate outside this gate. A
combined hover/focus or hover/current selector must be split; gating the entire
rule would hide feedback that keyboard and touch users still need.

Coarse target sizing independently uses `any-pointer: coarse`. Hybrid devices
follow the browser's reported primary hover capability for decorative CSS. This
may conservatively omit hover paint for a secondary mouse while touch remains
primary. Actual pointer-event behaviors remain independent: menus accept mouse
hover, and tooltips ignore touch pointer entry. Their click/focus/touch paths stay
available. Switching CSS capability should not require hydration or a reload.

Verification includes a CSSOM audit of all generated library CSS and documentation
styles, mouse-primary and touch-primary contexts in Chromium/Firefox/WebKit,
Chrome touch-event injection, persistent-state/focus/pressed checks, and existing
calendar/navigation/selection/nested-menu regressions. Native browser hover and
pressed timing is not overridden by the library. Real iPad/Android/laptop hybrid
input switching remains part of device review; emulation is not device acceptance.
