# THEME-03 — State paint refinements

Implementation builds on THEME-01/02 foundation `cc80d6f`. [Try the live button comparison](/theme-states.html?progress-report).

## Contract and compatibility

Six additive CSS-only hooks customize an enabled action button's `rest`, `hover` or `pressed` state: `--en-button-{state}-background` and `--en-button-{state}-color`. They work on native `.en-button`, the standalone button stylesheet, aggregate controls, and `en-button::part(control)`, including icon-only buttons. The background grammar accepts ordinary CSS backgrounds; foreground accepts colors. These hooks are registered/reset through the THEME-01 registry, but are not automatically exposed as managed editor tokens.

For each property independently, the current explicit state refinement wins, followed by the existing broad button paint and contextual variant fallback. Explicit pressed refinements win while hover and pressed overlap. Each state is independent: omitting a hover or pressed hook preserves that state's old fallback rather than carrying a rest-only refinement into it. Unsetting a hook with `initial` restores its fallback under compatible registration.

Existing `--en-button-background` and `--en-button-color` retain their meaning. Unmodified themes keep existing defaults, including secondary/danger defaults and ghost transparency at rest. An explicit rest-background may intentionally fill a ghost button. No automatic tint is derived from an authored base color, and no per-variant namespace is added; scope the six hooks with the host's variant selector for variant-specific refinements.

```css
.campaign-actions {
  --en-button-background: #705098;
  --en-button-color: white;
  --en-button-hover-background: #583675;
  --en-button-hover-color: white;
  --en-button-pressed-background: #3f2458;
  --en-button-pressed-color: white;
}
.campaign-actions en-button[variant="danger"] {
  --en-button-hover-background: #7b2536;
}
```

Disabled and `aria-disabled` actions keep their existing disabled treatment; loading buttons use native disabled behavior. Hover remains gated on hover capability. Native `:active` determines pressed paint, including keyboard activation where the browser exposes it. The implementation does not synthesize keyboard state or change activation events. Focus contours remain independent and visible over the selected paint. Existing forced-color and reduced-motion adaptations retain precedence. Choose foreground/background pairs with sufficient contrast.

## Family membership and state vocabulary

| Family/concept | Membership and customization | Overlap and boundary |
| --- | --- | --- |
| Action | Native `.en-button` and button components, all four variants and icon-only mode; six new state refinements over broad action paint. Links retain link-specific states. | Disabled treatment wins. For enabled buttons, explicit pressed > hover > rest selection; missing refinements use existing variant fallbacks. No selected/toggle meaning is inferred for ordinary buttons. |
| Editable field | Text, search, date/time, textarea, select, number, color and file inputs use documented input/shared base roles from THEME-02. | Keep validation, disabled and focus treatments distinct. A hover fill is not required to represent editability; no button state hook applies. |
| Selection | Consumers of shared `optionPaint`: option rows, menus, segmented choices and other documented option consumers. Existing rest/selected/active/hover/pressed/disabled hooks remain available. | Existing slots resolve disabled > pressed > hover > active > selected > rest, with lower states retained where a higher slot is unset. Active option navigation is different from pointer/keyboard pressing. Focus is independent. |
| Surface | Panels/cards and overlays use their documented surface/family base hooks. | A container does not acquire hover, pressed or selected paint merely because it is a surface. Interactive descendants own their states. |
| Focus | Shared semantic focus roles and button/input/option/overlay family refinements. | Visibility is independent of fill; do not replace focus with hover paint. Forced colors retain system contrast. |
| Metadata/status | Muted text, badges, alerts and toast have distinct semantic/family contracts. | This change adds no universal muted/disabled/status fill or synthetic status state. Use existing roles, scoped hooks or Parts. |

Calendar days remain specialized date-selection surfaces with range bands, opacity and a partial option-hook contract. Calendar/editor adoption gaps already tracked by THEME-06 remain there; this change does not claim they consume the entire option state vocabulary. New disabled/status semantic token sets remain candidates for the later three-theme proof, not implicit additions here.

## Theme boundaries and integration

THEME-01 registers these optional hooks with `syntax: "*"`, `inherits: true`, and no initial value. Full themes reset them; partial themes preserve unspecified hooks. Typed registrations with initials are explicit application choices that change fallback semantics. Each internal state slot is recomputed on the actual button to prevent a parent's interaction state leaking to a child.

THEME-02 button padding/radius refinements and neutral-input defaults remain intact. Action paint remains independent of `--en-control-background`. The implementation does not introduce new geometry or alter segmented-control alignment.

The regression suite is `packages/styles/tests/state-paint`; run its Playwright config after package builds. It exercises pointer states and overlap across variants, native/leaf/aggregate parity, compatibility pins, foreground/background independence, disabled/loading activation, native keyboard behavior and focus, touch, forced colors, reduced motion, Parts, full/partial boundaries, and compatible registrations. Run THEME-02's `theme-cascade` and existing `action-leaves` suites with it before integration. `npm run metadata` verifies source consumers, CEM linkage and registry coverage.
