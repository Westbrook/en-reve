# Independent pressed-state families

September 20, 2026 · implementation follow-up to [the coverage audit](button-like-press-audit.md)

The expansion adds 96 typed theme roles and CSS hooks. Pressed feedback now has independent contracts for segmented choices, accordion triggers, tabs, ratings, combobox toggles, navigation, editable token chips, options, calendar dates, checkboxes, radios, switches, select triggers and number steppers. Slider and color-plane thumbs have separate motion controls; switches support bounded thumb elongation.

## Review locally

- [Astryx: whole-button press](http://127.0.0.1:4480/showcase?theme=astryx-inspired&appearance=light&progress-report)
- [shadcn: whole-button press](http://127.0.0.1:4480/showcase?theme=shadcn-inspired&appearance=light&progress-report)
- [Vellum](http://127.0.0.1:4480/showcase?theme=vellum&appearance=light&progress-report), [Signal](http://127.0.0.1:4480/showcase?theme=signal&appearance=light&progress-report), [Kinetic](http://127.0.0.1:4480/showcase?theme=kinetic&appearance=light&progress-report)

Port 4480 had been serving a stale compiled styles package even though the source included the previous correction. Rebuilding the full workspace dependency chain restored the correction. The existing Create/Preview regressions passed on this exact port in Chromium, Firefox and WebKit. Astryx scales both surfaces; shadcn moves Preview down while intentionally leaving the declarative popup trigger Create stationary, matching the researched source exception. Text and icons have no separate transforms.

## Authoring contract

Each discrete family supports `component.<family>.pressed-scale`, `pressed-offset`, `press-duration`, `release-duration` and `pressed-shadow`. CSS names use the corresponding `--en-<family>-…` form. Relevant surfaces also expose independent pressed background, foreground and border paint; existing option, tab, navigation and token hooks remain compatible.

```css
en-segmented-control {
  --en-segmented-pressed-background: #dce8ff;
  --en-segmented-pressed-color: #102344;
  --en-segmented-pressed-scale: .98;
  --en-segmented-pressed-offset: 0px;
  --en-segmented-press-duration: 100ms;
  --en-segmented-release-duration: 140ms;
}
```

The entire parent-owned `option` label transforms, including its fill and border. The descriptor child and `option-label` content are not independently transformed. `.items` and authored `en-segmented-item` children use the same recipe.

Discrete motion clamps scale to .9–1, offset to ±2px and timing to 0–200ms. Geometry is opt-in per family and remains independent of button settings. Number steppers retain button fallback compatibility when unpinned, but all nine presets explicitly choose stable joined-field geometry. `data-press="none"` on the owning custom-element host suppresses motion while retaining pressed paint. Reduced motion suppresses movement and transitions. Native activation continues to own `:active`; no synthetic ARIA state or activation delay was introduced.

`component.switch.thumb-pressed-size` controls held thumb width, bounded inside the track, including checked-side alignment. `component.slider-thumb.pressed-scale` and `component.color-plane-thumb.pressed-scale` permit .9–1.25 with separate bounded press/release durations. Only the visual thumb changes; the range track and color-plane coordinate rectangle stay fixed. Native range-thumb exposure varies by browser.

Calendar range mode retains its specialized paint and stationary range geometry. Calendar single-date motion uses the calendar family independently of option rows. Reorderable tree rows suppress option motion. Read-only tokens never gain a pressed affordance.

Choice feedback also follows native activation of its wrapping label, so pressing a checkbox/radio/switch label receives the same feedback as pressing its input. The switch thumb is decorative and does not intercept pointer events.

Pressed shadow and focus decoration compose through separate internal values. Disabled guards, forced-color paint, selection indicators, checked marks and existing keyboard behavior remain in their original components. Selected/checked/current/open states are not treated as persistent presses.

## Theme integration

All nine theme pairs explicitly map these families. The six inspired themes preserve existing tab/navigation paint, reuse their source-informed neutral option paint for new families, and keep newly exposed selector geometry stationary, rather than claiming unresearched source motion. Their ordinary button recipes retain the previously researched motion and exceptions.

- **Vellum:** inset paper-pressure shadows and restrained downward travel on independent accordion/chip surfaces.
- **Signal:** immediate pressed feedback and crisp inset boundaries, with stationary geometry.
- **Kinetic:** compression on independent accordion/rating/chip targets, switch-thumb elongation, and gentle enlargement of drag thumbs. Joined selectors and rows stay aligned.

[The mapping record](../tooling/theme-candidates/press-family-mapping.json) labels these as adaptations or original design decisions. It does not relabel them as measured upstream values.

The source registry, managed editor descriptors, reset/export behavior, consumer-discovery metadata and element CSS-property documentation were updated together. Editable-token hooks are documented on both token and rich-text editors. Existing composed button consumers remain covered by the shared button implementation.

## Verification

Verification receipts are maintained in `artifacts/button-like-expansion/`. The suite checks native recipes and real shadow components, whole-surface geometry, child/sibling isolation, selected/disabled combinations, local overrides, keyboard activation/focus, reduced motion, forced colors, stationary drag coordinates, switch-thumb alignment, theme exports and the actual local Create/Preview buttons. Final counts and publication state are recorded in the receipt and independent progress report.

Browser automation is not a substitute for physical-device and assistive-technology acceptance. Firefox's native held-Space `:active` behavior can differ from Chromium; activation and focus remain required regardless of the browser's transient pseudo-class timing.

Firefox also drops transient `:active` on the first pointer press of a checkbox when focus transfers from a radio. This reproduces with plain native inputs, with and without shadow roots, without this library. The switch still toggles normally; a subsequent held press receives feedback. Family geometry tests focus native choice inputs before measuring their held state to isolate the CSS contract. This browser limitation remains visible rather than being replaced by a synthetic pressed state.
