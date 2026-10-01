# Theme refresh: API capability audit

Audited September 20, 2026 UTC for the five inspired-theme refresh and three new creative themes. This is implementation evidence and proposed API work, not an accepted API redesign. The source-theme research and final visual results belong to the companion refresh report.

The theme engine is substantially more expressive than the five original preset files suggest. The largest immediate constraint is the route from code-authored themes into the site's managed presets and portable review downloads. Improve that route before adding another general-purpose theme abstraction. Several distinctive treatments also need a maintained CSS/Parts companion; calling that companion a compiler limitation would be misleading.

## Scope and evidence

Read the current token schema, resolver, recipes, managed editor, optional-hook registry, pair/scoping code, style consumers, candidate generator, site preset loader, review bundle, and completed THEME-01–08 records. Replayed all ten starting inspired branches with the installed built token package: each completed with zero compiler diagnostics. This does **not** establish rendered accessibility or fidelity; the compiler currently checks only six declared color pairs.

The following starting-state observations were made before the concurrent refresh edits:

| Preset | Starting light/dark edit count | Current capabilities already exercised | Underused capability worth checking against the source |
| --- | --- | --- | --- |
| Spectrum 2 | 86 / 88 | Independent appearances; option states; pill action geometry; source status/toast paint; popup motion | Source font stacks, complete typography roles, independent elevation, field paint and family focus refinements |
| Fluent | 94 / 100 | Independent appearances; option states; source typography sizes; field bottom focus accent and timing; toast geometry | Actual font stack and weights, layered elevation, precise neutral/action relationships, independent focus families |
| Astryx | 100 / 101 | Independent appearances; pill buttons/rounded fields; alpha option states; status/toast roles; popup motion | Actual font stack, role-specific heading metrics, layered elevation, source-derived family refinements |
| shadcn Rhea / Neutral | 98 / 99 | Independent appearances; field paint; input/button focus halos; option states; geometry; toast roles | Font identity, layered popover/dialog elevation, precise field/action state composites |
| Holotable | 87 / 87 | Independent dark reference/light adaptation; field/action padding; source identity/focus; toast/editor-token roles | Typography identity and heading scale, surfaces/elevation, independently verified states; do not describe the invented light branch as source fidelity |

All five initially retained baseline font families. Four retained both baseline shadow roles; shadcn only aliased dialog elevation to the overlay role. Their rationales' repeated “system fonts” and “one-layer elevation” describe the old authoring choice, not a current inability of the token engine.

Files: [`source.ts`](../packages/tokens/src/source.ts), [`admin.ts`](../packages/tokens/src/admin.ts), [`value.ts`](../packages/tokens/src/value.ts), [`definitions.json`](../tooling/theme-candidates/definitions.json), and canonical inputs in [`inspired/`](../tooling/theme-candidates/inspired/).

## Delivered after this audit

The refresh implements the trusted per-appearance baseline route identified below. Canonical definitions now feed the selector, managed draft, candidate generator and same-build reopen path. All eight pairs preserve their source fonts, exact values and layered shadows through managed edit/undo and byte-identical export/reopen/export; baseline substitution remains rejected. This resolves the immediate integration restriction. A separately versioned authored-theme artifact and the proposed CSS companion remain release-design recommendations.

The subsequent [Fluent 2 website rework](theme-refresh-fluent2.md) replaces the generic React-default inspiration with the actual [Fluent 2 website](https://fluent2.microsoft.design/). Its [focused findings](theme-refresh-fluent2-api-findings.md) add consumed-role provenance, independent navigation/current and tab state recipes, and a careful distinction between editorial typography and product UI metrics. The site's CSS and elevation article disagree in places; source layers must remain explicit. Earlier Fluent field-bottom-stroke, toast and chip observations remain secondary React implementation evidence. They are not measured website styling. Typed multilayer/inset shadows, exact ratios and font stacks are already supported and should not be proposed as missing APIs.

## Capabilities already available

| Need | Current supported route | Correct usage |
| --- | --- | --- |
| Independent brand, filled actions, action text, links and on-color text | `palette.accent`, `palette.action`, `color.brand`, `color.action-text`, `color.link`, `color.on-brand`, `color.on-action` | Keep content-blue separate from filled-button blue when the reference does; do not use one accent for every purpose. |
| Separate light and dark designs | `createThemePair` / `emitThemePairCSS` | Author both branches explicitly with matching token IDs/types and density. Pairing does not invert a palette. |
| Font identity and hierarchy | Typed font stacks, weights 1–1000, px/rem size and unitless line height across body/UI/input/data/metadata/headings | Fonts can be supplied in trusted `ThemeOptions`; the app owns font loading. The finite editor menu is not the compiler's type limit. |
| Multi-layer, hard-edge and inset elevation | Structured shadow values or arrays, including color/alpha, offsets, blur, spread and inset | Already serializable typed data. Preserve popup/toast/dialog role distinctions; do not globally alias different roles merely because the editor's starting choices are small. |
| Shape, spacing and density | Rhythm-derived spacing, independent control/button/surface/option radii and padding, selected size outputs and target floors | Prefer a semantic input or family refinement to unrelated local pins. An explicit family padding is fixed, not automatically scaled. |
| Focus personality | Shared plus button/input/option/overlay contour, offset, halo and field accent; separate enter/exit timings | The immediate primary contour remains visible. A halo or animated underline supplements it. |
| Detailed option states | Rest, selected, active, hover, pressed and disabled paint plus selected weight | Existing state precedence is disabled → pressed → hover → active → selected → rest. Test selected-hover and keyboard-active compositions. |
| Detailed button states | Six public rest/hover/pressed background/foreground CSS hooks | These hooks exist today but are CSS-only in the default typed schema. Their values affect all variants in scope; broad pins can erase ghost/secondary/danger distinctions. |
| Surface and control hierarchy | Shared optional control/surface hooks; narrower button/input/card hooks; toast/status, editor-token and option-list families | Unpinned optional aliases emit `initial`, preserving point-of-use fallbacks. “Use the full API” does not mean pin every optional token. |
| Scope portability | Full resets, exact partials, dependency-aware patches, explicit clears, element/shadow-host targets, paired appearance selectors | Keep mechanical/application layout properties out of theme data. Portals need a theme boundary at their actual destination. |
| Gradients, compound corners and responsive CSS | Consumer-supported CSS custom properties and documented Parts | Maintain and export this CSS separately; typed JSON does not currently serialize it. |

Evidence: [`types.ts`](../packages/tokens/src/types.ts), [`README.md` typed/CSS contract](../packages/tokens/README.md#typed-code-managed-choices-and-css), [`button-rules.ts`](../packages/styles/src/internal/button-rules.ts), [`option-paint.ts`](../packages/styles/src/internal/option-paint.ts), [`focus-core.ts`](../packages/styles/src/internal/focus-core.ts), [`css.ts`](../packages/tokens/src/css.ts), and [`theme-pair.ts`](../packages/tokens/src/theme-pair.ts).

## Prioritized recommendations before the official API

### 1. Make the production theme recipe independent of a managed-edit transcript

**High priority; tooling/integration contract, not a new token type.**

The starting preset loader and candidate generator construct `createReviewDraft({})` and replay only `context`, `token`, and `restore` edits. The editor's font menu is seeded from existing baseline stacks, shadow menu from baseline shadows, weight menu from 400/500/600/700, and size menu from current role sizes. Consequently the site route cannot introduce Georgia/Segoe stacks, weight 800, a 48px heading, or a new layered shadow even though `resolveTheme({source,pins})` and `createReviewDraft(baseOptions)` support those values.

The package already exports/reopens trusted authored baselines. The docs wrapper originally additionally required empty authoritative bases on reopen. Simply changing preset initialization without changing its bundle validation leaves a portable-looking download that fails to reopen.

A read-only Node probe confirmed this distinction: a `Georgia, serif` UI baseline at weight 450 retained its exact source hash through token-level export/reopen, while the same baseline passed through the docs bundle failed same-build reopen with `stale-base`.

Define one trusted repository recipe with explicit shared schema, independently authored branch `ThemeOptions`, metadata/provenance and optional managed edits. Feed that same recipe into site selection, Theme Review and CSS/JSON generation. Validate imported typed source and regenerate CSS as today; do not execute CSS from an imported review envelope. Require exact roundtrip, subsequent edit/re-export, same-token-ID light/dark pairing and source-hash receipts. Keep exact-build review evidence separate from a versioned portable authored-theme artifact. Any implementation of this route during this refresh should be recorded as delivered rather than left as a new compiler proposal.

Evidence: [`presets.ts`](../apps/docs/src/showcase/presets.ts), [`prepare.mjs`](../tooling/theme-candidates/prepare.mjs), [`bundle.ts`](../apps/docs/src/theme-review/bundle.ts), [`review-draft.ts`](../packages/tokens/src/review-draft.ts), [`review-pair.ts`](../packages/tokens/src/review-pair.ts), [`admin.ts`](../packages/tokens/src/admin.ts).

### 2. Give state and variant recipes a portable, bounded composition story

**High priority; first document and package the existing hooks, then add only demonstrated missing roles.**

The six button state hooks are a good existing primitive. They are absent from default typed tokens, and they deliberately do not distinguish variants. A global explicit rest fill also fills ghost buttons. Current guidance scopes hooks with host variant selectors; that is valid CSS, but the typed review envelope cannot carry those rules.

Document a stable theme-level CSS companion format covering approved selectors and public Parts, its cascade placement, scope boundary, forced-colors/reduced-motion policy, and exported artifact identity. Prefer an explicit variant recipe mapping over multiplying every scalar into a huge cross-product. Consider promoting the six existing hooks into optional typed authoring when their role and usage are agreed; their existence should never be described as missing state styling.

Source-inspired field anatomy has a more concrete remaining gap: fields have their own background/color/inline padding/focus, but share control radius, border paint and border width. Source-specific field hover/invalid/underline treatment often requires repeated CSS Parts. Evaluate narrow input radius, border and state roles using actual text, select, combobox, number, date and editor compositions before freezing names.

Evidence: [`theme-03-state-paint.md`](theme-03-state-paint.md), [`customization-data.ts`](../packages/tokens/src/customization-data.ts), [`control-shared.ts`](../packages/styles/src/internal/control-shared.ts), [`controls.ts`](../packages/styles/src/controls.ts), [`theme-02-cascade-migration.md`](theme-02-cascade-migration.md).

### 3. Promote a small set of recurring material and typography needs

**Medium priority; evidence-led additions, with CSS as a supported route.**

Cards/panels expose surface paint, padding, border and radius, but no shared surface/card elevation hook. The accepted three-theme proof already adds elevation through `en-card::part(base)`. A bounded surface/card shadow role would remove repeated companion CSS while reusing the existing shadow value type. If action/field elevation becomes a recurring requirement, compose it with the existing focus helper's `baseShadow` support so decoration and focus halos coexist.

Typed typography has family/size/line-height/weight, but no tracking, font style, variable-font axes or fluid size expressions. Tracking and role-specific style are high-value for distinctive editorial/technical directions; variable axes, responsive expressions and assets can remain a documented CSS layer until use demonstrates a stable schema. Do not invent arbitrary CSS strings inside the existing `dimension` or `fontFamily` types.

Document actual role adoption: library labels and buttons generally use `font.label-strong.weight` over inherited UI metrics; the other label-strong metrics are available to application-owned compositions and are not a universal label-family override. This is an impact/discoverability issue unless an explicit adoption promise is made.

Evidence: [`surface.css`](../packages/styles/src/css/surface.css), [`theme-08-proof.md`](theme-08-proof.md#workaround-ledger), [`focus-core.ts`](../packages/styles/src/internal/focus-core.ts), [`source.ts`](../packages/tokens/src/source.ts), [`typography.css`](../packages/styles/src/css/typography.css), [`foundations.ts`](../packages/styles/src/foundations.ts).

### 4. Make validation follow the actual rendered state relationships

**High priority for release confidence; extend existing verification rather than replace it.**

`resolveTheme` currently diagnoses text/surface, muted/surface, on-brand/brand and on-action/action rest/hover/pressed. It does not claim to validate links, fields, secondary buttons, option state combinations, status badges, inverted toasts, focus against adjacent surfaces, or alpha compositing. A theme with zero diagnostics can still fail one of those relationships.

Add explicit relationship metadata for the known theme families and declare the compositing surface when alpha is used. Report unknown context as unknown. Reuse the existing rendered candidate verifier and theme matrix to cover both appearances, hover/pressed/selected/focus/disabled/invalid, nested resets, density/size, RTL, enlargement/reflow, forced colors and reduced motion. A release check should report which relationships and consumers it actually exercised. Keep native picker differences and manual platform/assistive-technology checks separate.

Evidence: [`theme.ts`](../packages/tokens/src/theme.ts), [`verify.mjs`](../tooling/theme-candidates/verify.mjs), [`regression.mjs`](../tooling/theme-proof/regression.mjs), [`theme-native-validation.md`](theme-native-validation.md).

### 5. Publish a concise stability and authoring contract

**High priority for the first official API; primarily documentation and metadata.**

Publish the supported hierarchy together: semantic tokens → family overrides → scoped CSS hooks → Parts. For each public hook show whether it is typed by default, CSS-only, optionally supplied by a typed source overlay, or intentionally preserved application/mechanical configuration. Display contextual fallback versus resolved authoring default, selected-size behavior, state/variant impact and verified consumers. The existing customization registry already contains most of this information; source evidence is not identical to rendered reachability.

Add an opt-in authoring warning for source-authored `component.*` outputs that do not match a registered connected hook. The resolver correctly permits custom token documents and only rejects reserved configuration/mechanical names; a misspelled new component token can therefore produce valid CSS with no consumer. Keep legitimate application-defined tokens possible and label them separately instead of treating every emitted custom property as a working library override.

Use the five references and three new creative themes as a retained release corpus. Track exact source versions, observed versus inferred values, deliberate accessibility/behavioral adaptations, code-authored assets, and companion CSS. Give all delivered themes a discoverable export path. Carry existing THEME-02 and THEME-06 compatibility notes into the release draft; a new preset does not require an immediate package-version bump.

Evidence: [`customization.ts`](../packages/tokens/src/customization.ts), [`theme-next-release.md`](theme-next-release.md), [`theme-followup-review-2026-09-18.md`](theme-followup-review-2026-09-18.md).

## Deliberate boundaries to retain

### Pressed-state follow-up: a release-priority gap

The [focused pressed-state audit](theme-refresh-pressed-states.md) distinguishes supported state paint from uncaptured press motion and default feedback. The six button paint hooks exist, but pressed scale, translation, elevation and border geometry have no connected first-class roles. Application CSS/Parts can express them today; a theme JSON export does not carry those rules. Existing modal/focus motion controls are not button press controls.

Default primary buttons have separate pressed fill. Secondary, ghost and danger reuse hover paint; option press slots fall through unless explicitly set. Many internal buttons and other interactive families therefore have no distinct down-state feedback. Persistent selected/checked/current states do not close this gap. The current eight theme recipes also leave the six optional button state slots unpinned to preserve variant context, so their semantic primary-action ramps do not establish complete variant coverage.

Elevate bounded, opt-in press presentation and default-feedback coverage to **P1** alongside portable variant recipes. Preserve Astryx's button-group exemption and Rhea's popup-trigger exemption; define stable hit/focus geometry, transform/shadow composition, press/release timing, reduced-motion alternatives and actual nested-consumer reachability. Add held pointer/Space and no-hover checks, rather than relying on click screenshots or unchanged hover paint as evidence. The report records source and rendered evidence separately; these remain proposals, with no runtime changes in this reporting follow-up.

### Existing boundaries

- Keep protected hit targets independent from decorative density; matching a tiny reference control is not a reason to shrink its usable target.
- Keep primary focus immediate and preserve reduced-motion/forced-color alternatives. Anchored popup geometry stays stable; existing motion deliberately limits travel and scale.
- Retain specialized calendar range anatomy and native select fallback behavior. Themes do not change keyboard, selection, dismissal or modality policies.
- Fonts/assets, arbitrary application markup and portal destinations remain application responsibilities, with clear consumption recipes.
- Display-P3, richer color spaces, gradients as typed data, fluid dimensions and generalized decorative geometry are optional capabilities. Typed P3 must include serialization, derivation, diagnostics and fallback semantics; existing raw CSS support is not that feature.

These recommendations concern expression and portability. They do not justify reopening already delivered theme-scoping, family-precedence, state-paint, Parts-reachability or reduced-motion repairs without new evidence.
