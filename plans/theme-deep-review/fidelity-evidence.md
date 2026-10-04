# Inspired component fidelity verification

Prepared October 3, 2026 for the six included pairs: Spectrum, Fluent, Astryx,
shadcn Rhea/Neutral, Radix Themes and Web Awesome. Chakra UI and Holotable are
excluded. The test file is
`apps/docs/tests/inspired-component-fidelity.spec.ts`.

## Evidence state

This is a browser verification specification, **not a passing browser receipt**.
The latest authoring-qualified source is `b7a2edd91a043c7ebaf379f6d3f1a37ea928ec23`.
[Metadata run 05](/private/tmp/en-inspired-metadata-before-20261003-05/provenance.json)
passed CEM, public types, public API, lazy delivery and customization freshness
before generation. [Authoring run 04](/private/tmp/en-inspired-authoring-20261003-04/execution.json)
passed all 84 selected outcomes for complete `tokens`, `semantic-types`,
`primitives` and `extended-node`: 351 Node assertions (229 + 85 + 37), zero failures,
skips or cancellations, package/docs builds and both semantic scopes. Core 471
and docs 55 retained diagnostics have no added/resolved entries; this is not a
zero-diagnostic claim. Source identity remained unchanged.

The complete [theme-refresh run 01 owner](/private/tmp/en-inspired-theme-refresh-20261003-01/command/receipt.json)
completed on that frozen candidate: 160 passed, 3 supported skips and 14 failed,
with source, build and runtime identities unchanged. Twelve failures were
Spectrum/Web Awesome scalar raster checks; retained pixels show the correct
diameter with antialiased rims. The corrected classifier measures the contiguous
painted extent while independently requiring source center, both rims and bounded
edge blends. Original dimension and color tolerances remain unchanged.

One Chromium Radix assertion omitted the final `none` image layer from its
opaque fallback's color-only background layer. The correction retains the actual
reduced-transparency/no-blur predicate and exact backing, foreground and blur
checks. A WebKit Web Awesome light panel instead exhausted its 120-second case
budget: 231 completed actions consumed 115.5 seconds, with the last evaluation
starting at 119.854 seconds. No value assertion failed; the same-run dark case
passed in 6.8 seconds. Its underlying slowdown remains unexplained. No timeout or
product change is inferred; the complete owner must pass again.

Visual review also found ordinary words split in the narrow Fluent showcase
poster. That authored composition now uses the theme's medium heading role;
the page keeps its display role and both still enlarge at 200% text. The existing
reflow case now checks intact words at desktop size and bounded text at narrow
sizes. The pinned three-engine matrix and broader regression owners remain
required against the corrected candidate. Full-library qualification and
manual/user acceptance remain separate.

The named-container emitter was committed in `eb0efd6f`; shared stylesheet-order
and ownership corrections followed in `e227e5e5`. Subsequent committed fixes
preserve independent source paint/geometry expectations while respecting native
label, radio and editing contracts. `b7a2edd9` keeps the Rhea 24px dialog cap in a
finite presentation role, retaining managed radius choices and public overrides.
These are current source facts, not unintegrated proposals or browser passes.

Historical receipts remain intact: the metadata refresh at `a1f23afb` passed its
[five postchecks](/private/tmp/en-inspired-metadata-after-20261003-03/command/receipt.json),
and [Authoring run 01](/private/tmp/en-inspired-authoring-20261003-01/execution.json)
passed its 65 selected owners. [Authoring run 02](/private/tmp/en-inspired-authoring-20261003-02/execution.json)
at `eb0efd6f` passed 65 owners and 283 Node assertions (198 + 85). Those snapshots
establish their original selected coverage, not current rendered fidelity.
Earlier failed/interrupted browser observations retain their exact source and
limits. None substitutes for the pending current-candidate browser matrix.

## Independent expectations

The test never reads our candidate definitions or resolved source tokens to
construct fidelity expectations. Its literal constants come from the source
audits below. A resolved **default En Reve** theme is used only as the intervening
full boundary in A → B → A isolation checks; that test proves delivery isolation,
not source likeness.

| Pair | Source authority | Checked source signatures |
| --- | --- | --- |
| Spectrum | React S2 1.7.1, `4dd44e0f400636a87a9ad4390903e78c5ae6113c`; [audit](spectrum.md) separates design data from React | Inputs and action text S 12/16, M 14/18, L 16/20; 2px fields; choices 14/16/18; source switch track/checked thumb geometry, radio 4px empty center; normal selected-tab weight; 10px card |
| Fluent | Pinned WC source `babf26015958505fc6fc0216724f2f61244f829c` plus recorded website flavor; [audit](fluent.md) | 14/20 input, 12/16 helper, 400 labels, 16px checkbox with 8px mixed square/radius 2; 40×20 switch/thumb 14; independent neutral field edge states; dialog 20/28/600 title, 24px inline inset/max 600; 22px **website** card |
| Astryx | Core source 0.6.4, `d2daa25689f6e7552df17b10194eec4ad34f7575`, branded website skin; [audit and manifest](astryx.md) | 14/20 input, 12/20 helper; 24px M choice; 40×24 switch/thumb 16→20; 16px card; inverse tooltip 14/20/radius 16/padding 4×8; filled destructive states with explicit dark contrast adaptation |
| shadcn | Rhea/Neutral stylesheet `a87a63b2ca25143d26c8bd0903e4e9bc77b3f824`, current Base wrapper observation; [audit](shadcn.md) | 14/20 input; 16px choice, 32×20 switch/thumb 16; radio inverse dot 8px light/10px dark; 24px card/gap 20; rail radius 18/inset 3, trigger 14/20/500; inverse tooltip 12/16/radius 14/padding 6×12; native keycap radius 10 (both corners scale with root text) |
| Radix | Themes 3.3.0 `1faff10ac26ae17f09944d418c6949b93fc6b566`, indigo/auto-slate and medium radius; [audit](radix.md) | 14/20 input, 16px choice, 35×20 switch/thumb 18; 8px flat card; 20/26/700 dialog title, 24px inline inset/max 600; inverse tooltip 14/20/radius 4/padding 4×8; separate A3/A4/A5 soft states and readable held-tab ink |
| Web Awesome | Installed `@awesome.me/webawesome@3.13.0`, Default theme/Default palette/blue brand; [audit](shared-and-additional.md) | 16/19.2 input, 20px checkbox, 35×20 switch/thumb 12; 12px card. These are the pinned fixture values, not a silent adoption of current 3.14 docs. |

The later presentation refinements extend those same cases, without multiplying
the engine matrix:

- The pinned Rhea/Neutral radius context gives tooltip .875rem and keycap .625rem. The source correction replaces the earlier 12px/8px assumptions; literal browser checks require custom/native tooltip 14→28px and native keycap 10→20px at 100→200% root text, plus exact source rem spacing/minimums, actual boxes large enough to retain those corners, and local radius/padding override restoration. Native/custom cards keep the source's absolute 24px cap at both root sizes while inherited/local `--en-surface-radius` overrides remain authoritative. Ordinary custom/native dialogs also check source fill widths (448px at 1440/640px viewports, 568px at 600px, 358px at 390px), inherited/local maximum overrides and responsive/drawer exclusions. Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json); these expectations do not establish a passing browser result.
- Shadcn switches have a source **2px** track border; small is 24×16px with a 12px
  thumb, medium/large 32×20px with a 16px thumb. The source checkbox border is 1px;
  the switch's 2px border must not be generalized to checkboxes. Native/custom
  tests cover inverse off/on thumb paint, selected rim paint and local public
  width/height/thumb overrides. The enclosed accordion checks its 18px frame,
  1px border, 14/20/500 trigger, 16px padding, 24px gap, 16px indicator and source
  half-opacity muted open fill. Native `<details>` and authored heading/button
  disclosures both exercise their actual state.
- Fluent's native `.en-field`, `.en-choice` and `.en-choice-content` immediate
  labels use 400; helpers/errors use 12/16/400. An immediate helper carrying its
  own full-theme boundary retains its previous type, while input weight and
  semantic error color remain separate.
- Spectrum's pristine empty required field has native invalidity before any
  feedback is shown. It retains the source neutral focused frame until
  `reportValidity()` or an explicit application error exposes `control-invalid`.
  Tests cover reveal, valid editing, explicit error and clearing, retaining the
  value and focus. This protects visible validation presentation without
  redefining native constraint validity.
- Astryx hover/held paint reaches the associated label text as well as the
  switch track. Independent expectations calculate the pinned source's
  premultiplied sRGB 5% off/15% on hover mix, then its 25/255 held overlay. Native
  and custom checks cover both selection states and retain disabled opacity .5
  with no hover/held recoloring. Held screenshots are taken before pointer
  release, matching their JSON measurements.

All dimensions above assume a 16px root before the separate 200% text-growth
scenario. Control *visual* boxes are checked separately from En Reve's protected
labeled targets. Switch travel includes the track border when comparing outer
insets, verifies vertical centering, and repeats checked/unchecked in LTR and RTL.
Spectrum additionally checks small/large and explicit `size="inherit"` versus the
default medium contract. Native classes consume unmodified public portable CSS
exports; custom examples consume the actual hydrated production components.

The Web Awesome source values were independently read from the retained isolated
installation, whose package metadata reports 3.13.0. `dist/styles/themes/default.css`
SHA-256 is `e19fff39b8c90f37d39e76535313e6da23f02cf2ca3b0e67407e17022fa6da50`.
Distributed files identify upstream paths: checkbox `chunk.YB6263IP.js`, switch
`chunk.DWWFIQKG.js`, input `chunk.3ZKPD2O5.js`, card `chunk.ATI2KDM5.js`.
Source body/card/textarea leading 1.6 and input/checkbox leading 1.2 are distinct;
the suite does not incorrectly claim every Web Awesome label/action has 19.2px
leading. Custom and native textareas now assert default 16/25.6px typography and
7.2px block/scroll inset in both appearances. Inherited-size assertions explicitly
describe En Reve's 16/16/18px input-type adaptation (the small input size preserves
its base text floor), with source .45em insets following
the actual local font; the pinned source's 14/16/20px sizes are not claimed.
Web Awesome single-line input typography uses the literal source font size and leading on an
independent plain input to account for the browser's native text-entry minimum
line box. Firefox reports a 20px used value for the WA 16px/19.2px declaration;
[Mozilla's explanation](https://bugzilla.mozilla.org/show_bug.cgi?id=1860167#c3)
identifies the HTML rendering requirement to retain at least normal leading.
The delivered `--en-font-input-line-height` role is independently asserted against
the literal source ratio (leading/font), so a wrong below-normal source value
cannot pass merely because the engine applies the same native minimum. The used
value comparison does not change the source declaration or introduce a general
numeric tolerance. Other themes retain their existing literal leading assertions;
multiline textarea assertions remain strict.
Public-Part/native font overrides retain that scaling. Local line-height and
inline-padding overrides, complete nested-theme exclusion and actual 200% text
(32/51.2px with 14.4px inset) accompany multiline editing and three-row fit checks.
Tooltip and dialog mapping remains separately recorded work. These are authored
assertions until the coordinator's owning browser gate runs.

The final Web Awesome refinement adds native and custom avatar, rating and
disclosure checks inside the existing light/dark panel cases. Avatar initials
use the source diameter ratio .4, line-height 1, uppercase and weight 400 with
the appearance-specific source plate/ink. The local 42/48/60px size adaptation
therefore gives 16.8/19.2/24px text. An 80px public size override gives 32px text;
at 200% root text the default frame/text grow together to 96/38.4px. Public radius
overrides, bounded initials and accessible names are retained.

Ratings assert source 14/16/20px glyph sizes, 17.5/20/25px icon-canvas widths,
1.75/2/2.5px gaps/insets and protected 24/24/30px square targets. Filled stars
retain source gold `#ef9d00` when disabled while the complete positive-star row
fades to .5; empty ink remains appearance-specific. Actual integer radio
selection, the additive `star-filled` Part and the separate clear choice track
the accepted score. Native fixtures explicitly synchronize the documented
`data-filled` state. Disabled hover/hold preserves the score and paint; public
glyph and inherited press overrides win. RTL and 200% root text preserve the
clear action and target wrapping. This does not claim arbitrary em scaling of
the mapped glyph sizes, the source SVG silhouette, fractional ratings, hover
preview, or source-gold contrast equivalence. See [rating audit](web-awesome-rating.md).

Outlined disclosures assert each item's 1px border, 12px radius, 16px insets,
16/25.6px regular heading and source plate/border/text/indicator palette. The
custom Parts, native heading/button helper and plain `details.en-recipe-disclosure`
consume public selection and recipes exports. Opening preserves arbitrary text
and nested browser-owned disclosure state; supported `::details-content` and
fallback paths both retain the public inline inset. Disabled custom/button
controls remain closed with one .5 enclosure fade. Native ARIA-disabled recipe
paint is checked separately from interaction semantics. Source rem geometry
doubles at 200% root text, while RTL chevrons use the documented local border
asset adaptation. These checks do not claim the upstream Font Awesome shape or
body animation. The additions received static peer review only; their browser
results belong to the coordinator's subsequent frozen run.

Rhea dialog/popover additions distinguish 24px dialog inset/gap and 16px popover
inset/gap. The default dialog heading is 16/16/500; popover heading 16/24/500.
Custom and native public compositions exercise those metrics, local padding and
radius overrides, empty-footer removal, property-only accessible descriptions,
supported 8px backdrop blur and arrow-content ownership of the sole popup inset.
The compact RTL dialog is also checked at 200% text for 32/32px headings, 48px
padding, square responsive corners and no title/close overlap. Native helpers use
the exported overlay/typography CSS and browser showModal/showPopover APIs.
The source's absolute close placement and exact header/description grouping
remain disclosed composition adaptations; these tests do not assert DOM parity.

All six source slider mappings are exercised in the existing light/dark controls
cases. Native and custom single sliders use actual rendered pixels for track
thickness, visible thumb diameter, rail and accepted fill: cross-engine native
pseudo-element computed styles are not comparable. An explicit diagnostic
backdrop makes source alpha compositing and white/dark thumb plates observable.
The native stationary half-value fixture authors the documented
`--en-slider-value-percent: 50%`; initialization/input/reset/author synchronization
belongs to the focused slider owning suite. Source interval track/range/thumb
Parts get the same size and paint assertions while retaining 44px thumb targets.

| Source profile | Small/medium/large track | Small/medium/large visible thumb |
| --- | --- | --- |
| Spectrum S2 thin | 4/4/4px | 18/20/22px |
| Fluent scalar, website rose palette | 2/4/4px | 16/20/20px |
| Astryx fixed profile | 4/4/4px | 20/20/20px |
| shadcn Base Rhea | 4/4/4px | 16/16/16px |
| Radix Themes surface | 6/8/10px | 13/16/19px |
| Web Awesome 3.13.0 Default | 7/8/10px | 19.6/22.4/28px |

Fluent large repeats medium; Astryx/Rhea repeat their one visual profile.
Radix thumb diameters exclude outer rings. Fractional raster edges use bounded
pixel tolerances, not exact screenshot baselines. Source audit documents retain
the palette, shadow, disabled-state and interval-composition adaptations; this
geometry matrix does not erase those limits or establish a browser pass.

## Matrix and emitted artifacts

The original matrix has 32 cases per configured engine: two per pair/appearance
(24), one delivery-boundary/default-alias case per pair (6), one narrow RTL/enlarged
text/reduced-motion case across all six, and one forced-color case across all
six. The default-profile follow-up adds ten authored cases: two
appearances each for Astryx Tokenizer, Astryx destructive focus/card inset,
Spectrum regular tabs, Spectrum choice states and Web Awesome toast anatomy.
This gives 42 cases per engine by static source inspection. Qualification evidence
is recorded in [verification-20261003.json](verification-20261003.json); case counts alone do not
establish discovery or execution results. Source glyph artwork,
animation choreography, unsupported variants and complete-family equivalence
are not inferred from these representative cases.

Each worker downloads each pair through the actual **Download CSS** action. The
same bytes are used throughout its tests. Attachments contain the SHA-256 of
those bytes, source references, browser version, consumed public native exports,
computed measurements and focused PNGs. Font attachments disclose the CSS
family and loaded FontFaceSet entries; they do not establish which proprietary
or system fallback supplied every glyph.

Source-bearing checks cover custom and native choices/switches, field editing,
cards, dialog focus return, inverse tooltips/Escape, selected tabs and held action
states. Radix's held tab and Astryx's adapted held destructive button additionally
compute ordinary-text contrast from actual sRGB background layers, including
alpha compositing through shadow hosts. The fixture uses solid backgrounds;
that helper is not a general image-background contrast analyzer.

Shared delivery checks compare omitted appearance with explicit Auto under both
system preferences, remove/reapply the appearance attribute, verify same-name
nesting and A → B → A, and preserve the intervening complete B theme when the
ancestor changes appearance. The actual persistent toggle receives the ordinary
secondary companion, remains operable, and honors canceled transactions. Omitted
native variant equals explicit primary. These comparisons prove alias/default
delivery and isolation; literal source assertions remain in the component cases.

At `eb0efd6f`, every presenter emits leaf rules through `ctx.style`. Named
container style queries select the nearest full theme boundary, and direct rules
cover a custom element or native helper that is itself the matching boundary.
This replaces the `@scope`/Part path implicated in WebKit rule loss and Firefox
boundary leakage. [The source-capture manifest](shared-emitter-reconciliation.json)
records donor source hashes, the adopted emitter scope and diagnostic JSON
identities. Its unqualified reference status and synthetic probe observations
remain distinct from local authoring-02 and pending production browser evidence;
no Chakra recipe, donor generated output or donor qualification was adopted.

Each full `[data-en-theme]` boundary reserves `--en-theme-companion` in
`container-name`. Application `container-name` or `container` shorthand
declarations must explicitly compose it, for example
`container-name: app-panel --en-theme-companion`; the generated default does not
automatically merge application names. Replacing the reserved name can select an
outer boundary and defeat isolation. The emitter requires custom-property
container style queries but introduces no `container-type` or size containment.
Current browser qualification must exercise exported CSS, boundary-root subjects,
repeated and mixed nested themes, appearance changes and application container
composition under this [public contract](../../packages/tokens/README.md#component-presentation-companions).

Every included pair/appearance also exercises the actual persistent toggle in
selected and mixed states. It retains a visual selection cue, ordinary-text
contrast at rest/hover/hold, its semantic state through a canceled interaction,
and invariant paint during both native-disabled and ARIA-disabled hover/hold.
ARIA-disabled controls remain focusable. Contrast is measured over an authored
theme canvas using the exported CSS; disabled text contrast is not represented
as a required ordinary-text WCAG threshold.

## Public invalid-Part lifecycle owners

The additive validation Parts also have focused owning-suite assertions, beyond
the Spectrum themed field example. The forms suite's `invalid-parts.spec.ts`
parameterizes text-field, search-input, textarea, number-field, select and adorned
text-field. The existing choice and combobox specs cover checkbox, standalone
radio, switch and combobox. These ten cases per engine exercise pristine required
invalidity without visible Parts, application errors, `reportValidity()` feedback,
valid recovery and reset. Number `stepper-invalid` and adorned
`focus-frame-invalid` appear and disappear with `control-invalid`; permanent Part
tokens remain. Native node identity, focus, accepted state and canceled editing
drafts/carets are retained where applicable.

A dedicated SSR route, shared server/client template and two browser cases cover
the same families before registration and through hydration. Initial application
error Parts and pristine required negative cases remain distinct. Hydration and
silent error clearing preserve the original native controls and frame containers.
These cases use the existing forms, choice, combobox and SSR configurations and
their three pinned engines; no standalone runner or alternate browser fixture is
introduced. They are authored coverage, not passing evidence until the
coordinator runs the owning gates.

## Limits and review

Geometry may grow to protect targets or content. Fluent uses website identity
with WC field/switch/dialog anatomy. Astryx dark destructive paint is a stated
contrast adaptation. Rhea's natural card/choice composition is not an assertion
of every Base UI DOM detail. Radix material/blur and source variant breadth remain
separately documented. A browser pass would establish only the assertions in
this matrix, not perfect source parity, manual assistive-technology coverage,
physical touch-device results, or user-reviewed visual acceptance. Only the user
can mark the report's review checkpoints reviewed.

## Inherited invalid-Part coverage

The existing visible-feedback lifecycle owners additionally exercise normal and
adorned OTP fields, preserving the inherited `control-invalid` and
`focus-frame-invalid` contracts through application feedback, reported validity,
accepted edits, canceled native drafts, selection and reset. Six-digit values
retain leading zeros. The CSR forms owner contains eight parameterized cases per
engine; SSR retains two browser cases over twelve control/composition families.
The API reachability fixture also opens the inherited adorned OTP perimeter.
These additions are authored and await the final owning executions.

## Inline alert/callout refinement

The existing light/dark panel cases now include all six default source alert
profiles and their mapped info/success/warning/danger palettes. Independent
constants verify native/custom geometry, body and icon paint, public overrides,
optional-icon removal, dismissal cancellation and authoritative writes. Nested
full-theme isolation, RTL and 200% text growth remain explicit. The existing
forced-color case also verifies system paint and recovery of a visible contour
for source plates. The case count remains 32 per engine. See
[source-alert.md](source-alert.md) for source units, vocabulary and composition
adaptations. Their compiler assertions passed in authoring-01 at `a1f23afb` and
again after emitter migration in authoring-02 at `eb0efd6f`; their current-candidate
browser assertions await the final coordinated qualification.
