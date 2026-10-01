# Theme regression checks

Run `npm run test:theme` from an installed checkout with the Playwright Chromium,
Firefox and WebKit engines available. This builds the workspace, checks registry
freshness, runs token/metadata/CSS-authoring/transfer tests, then verifies property
registration, scopes, fallback precedence, state paint, composition/Parts and the
authoring/composition/three-theme documentation fixtures. Servers start and stop
with their suites; no separately running docs preview is required.

Set `PLAYWRIGHT_BROWSERS_PATH` when using an existing external engine cache.
Set `EN_THEME_TEST_OUTPUT_DIR` for retained evidence; the default is
`node_modules/.cache/theme-regression`. Each stage has a log and the runner writes
`results.json`, stopping at the first failure. Browser JSON and traces remain in
the matching stage folder. Set `EN_WORKFLOW_TEST_PORT` if the default 4596 is busy.
Do not run multiple instances against the same fixture ports/output directory.

After a successful workspace build for the exact current source, use
`npm run test:theme -- --skip-build` to avoid repeating that build. Evidence labels
that mode caller-supplied; it does not claim to have verified build freshness.

Rendered reachability uses `tooling/customization/browser-parts.ts` on explicit
fixture states. It follows each actual `exportparts` boundary and checks CEM
promises, plus real external CSS effects and a deliberately broken boundary.
Conditional/subclass fixtures cover slider and color-slider; picker checks cover
multiple forwarding boundaries and plane-only brightness. The helper is reusable,
but this focused matrix is not a claim to enumerate every Part in every component.

Reduced motion runs independently in all three engines. WebKit forced-colors and
Firefox touch limitations remain explicit in the proof's exception data.

Routine zoom-related regression coverage belongs in Playwright. Starting from
1280×1024, the proof resizes to 640×512 and 320×256 CSS pixels (200% and 400%
equivalent layout widths). A separate case doubles the root font size at desktop
width and checks that the input's computed text size really doubles. All three
themes, both appearances and all three engines exercise LTR/RTL, page overflow,
control/dialog bounds, retained edits, selection, keyboard focus and dialog focus
return. These 54 cases are included in `npm run test:theme`.

This follows the [WCAG reflow criterion](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
at 320 CSS pixels. Relative-text enlargement is distinct from native browser UI
zoom or a browser's text-only setting; `deviceScaleFactor` only changes pixel
density. Native zoom is an optional diagnostic for browser-specific behavior, not
an outstanding routine gate. Screen-reader output, physical-device usability and
native high contrast remain in the [manual validation record](../../plans/theme-native-validation.md).
