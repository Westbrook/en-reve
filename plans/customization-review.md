# Four-theme customization review

## Status and purpose

This synthesis records seven specialist reviews of the original candidates, the bounded improvements now implemented, and four revised candidates. The integration record below supplies focused verification. The score table remains the assessment of the original candidates; passing tests does not imply higher fidelity scores or human acceptance.

The named specialists are **simulated analytical lenses inspired by their published work**, not the actual people, their opinions, or their endorsements. The review evaluates how the current en-reve customization surface expresses four particular references; it does not rank the original design systems.

## Reviewed scope and evidence

The targets were Spectrum 1 light, Fluent UI React v9 `webLightTheme`, Astryx's branded site light skin, and the shadcn/ui homepage neutral demo. Astryx's Neutral component preview and shadcn's generic documentation scaffold are different references. These are light-mode candidate snapshots, mostly compact, for Site44 build `sha256:ddb36dc2a702763f6da449f99f617c60068e9a0c80b587d54c772d345bb2c35c`.

The reviews combine the [common brief](../artifacts/theme-candidates/customization-review/reviews/BRIEF.md), retained official-source mappings, candidate JSON, source inspection and four actual preview screenshots. [Spectrum/Fluent artifacts](../artifacts/theme-candidates/2026-09-09/README.md) and [Astryx/shadcn artifacts](../artifacts/theme-candidates/2026-09-09-additional/README.md) retain the source details and browser receipts. Some official pages were inaccessible or returned JavaScript shells, so their detailed reference values rely on the retained mappings, as each review discloses.

The screenshots show a field-area crop within the candidate preview. The surrounding editor and baseline deliberately retain their original appearance. There is no synchronized reference-versus-candidate pixel comparison. States, focus, elevation, motion and responsive resemblance are substantially source-based; confidence is generally medium or lower for those categories.

Existing receipts cover Chromium 153 reopening the actual JSON, rendering 29 specimen cases per candidate, native field editing, baseline isolation and re-export. They do not establish all workflows under all themes, cross-runtime import portability, full responsive fidelity, manual assistive-technology use, physical-device coverage, current-minus-one browsers, or the framework matrix. These limits describe the original review. New focused evidence is recorded separately below.

## Subjective scores

Each review assigns 0–2 points to **palette/materials, geometry/density, typography, states/focus, and coherent/responsive customization**, totaling 0–10. The brief describes 4–6 as partial resemblance and 7–8 as recognizable with notable gaps. These are fidelity judgments, not accessibility or performance grades. Accessibility-preserving differences are discussed separately from avoidable customization gaps.

| Analytical lens | Spectrum 1 | Fluent v9 | Astryx site | shadcn homepage |
| --- | ---: | ---: | ---: | ---: |
| [Dieter Rams-inspired](../artifacts/theme-candidates/customization-review/reviews/dieter-rams.md) | 6.00 | 6.50 | 6.50 | 6.00 |
| [Golden Krishna-inspired](../artifacts/theme-candidates/customization-review/reviews/golden-krishna.md) | 6.30 | 6.60 | 6.30 | 6.10 |
| [Brad Frost-inspired](../artifacts/theme-candidates/customization-review/reviews/brad-frost.md) | 6.00 | 6.30 | 6.00 | 6.20 |
| [Jina Anne-inspired](../artifacts/theme-candidates/customization-review/reviews/jina-anne.md) | 6.50 | 6.60 | 6.90 | 6.50 |
| [Tammy Everts-inspired](../artifacts/theme-candidates/customization-review/reviews/tammy-everts.md) | 7.00 | 6.50 | 6.50 | 6.75 |
| [Westbrook Johnson-inspired](../artifacts/theme-candidates/customization-review/reviews/westbrook-johnson.md) | 6.00 | 6.50 | 6.00 | 6.00 |
| [Léonie Watson-inspired](../artifacts/theme-candidates/customization-review/reviews/leonie-watson.md) | 7.10 | 6.80 | 7.20 | 6.70 |
| **Arithmetic mean** | **6.41** | **6.54** | **6.49** | **6.32** |
| Review range | 6.00–7.10 | 6.30–6.80 | 6.00–7.20 | 6.00–6.75 |

The means are arithmetic summaries of the seven recorded totals, rounded to two decimals. Every total equals its five category scores in the companion JSON. The reviewers share evidence and exchange critique; these are not independent measurements, confidence intervals, or a meaningful close-ranking contest. The category explanations and confidence statements in the linked reviews carry more information than the small differences between means.

The recurring differences are coherent across the four references:

- **Spectrum:** recognizable neutrals and compact fields; independently pill-shaped actions and exact typography are missing.
- **Fluent:** credible colors and compact geometry; field underline/focus anatomy, typography roles and layered materials need more than global scalar edits.
- **Astryx:** distinctive warm surfaces and rounded containers; separate action shape, font metrics and backdrop-dependent overlays remain approximate.
- **shadcn:** recognizable neutral direction; ineffective managed field fill, exact corners/leading and narrow-viewport typography are consequential gaps.

## Selected bounded implementation scope

These five changes reuse existing layers and preserve the current interaction model. No version bump or reference-brand switch is part of this scope. Default appearance should remain stable, but adding tokens or changing artifact canonicalization can change generated bytes and build identities. Preserve the original Site44 files and receipts; regenerate candidates deliberately for the changed build.

### 1. Canonical numeric results and strict reopening

Define one documented precision policy for validated derived numeric results and their artifact/diagnostic representation. Preserve authored literals, pins and source provenance. Keep strict schema, base, compiler and artifact verification; do not make import permissive or indiscriminately round arbitrary hashes.

The retained [portability investigation](../artifacts/theme-candidates/2026-09-09/compiler-portability.json) isolates insignificant derived floating-point differences in `changes.json` despite matching source, CSS and dependency artifacts. CSS-only rounding cannot solve that. Integration canonicalizes validated recipe results to 12 significant digits before downstream evaluation and includes that policy in source identity. Authored literals/pins retain precision. Diagnostics classify the raw ratio before normalizing their recorded measurement; arbitrary recipes exactly at floating-point decision boundaries can still diverge. The tested threshold fixture remains a failure even when its displayed ratio rounds to 4.5; no permissive importer or universal numerical guarantee was introduced.

Required evidence: Node/Chromium/Firefox/WebKit export–reopen compatibility in every direction, further edit/re-export, authored precision retention, material tamper rejection, threshold-adjacent diagnostics and unchanged intended computed styles.

### 2. Connect existing field and card paint roles

Wire `component.input.background` and `component.input.color` through the actual field paint paths, and `component.card.background` through the card surface. Preserve explicit legacy overrides before the managed role fallback: `--en-control-background` before `--en-input-background`, and `--en-surface-background` before `--en-card-background`; apply the equivalent foreground precedence where a role already exists. Do not invent a card foreground role in this fix.

Cover intended field families, including the compound number field's outer frame. Buttons, choice controls and unrelated surfaces must retain their own roles. Required evidence: pin/restore/undo/export/reopen, actual painted nodes, root and nested scopes, explicit author override precedence, default equivalence, and invalid/disabled/focus/forced-color states. Verify text and focus against the resulting fill rather than assuming a successful token edit implies an accessible result.

### 3. Expose the existing button-radius override to managed editing

Add `component.button.radius` with `{radius.control}` as its default relationship and bounded compatible dimension choices, including `{radius.pill}`. Reuse the existing `--en-button-radius` style hook. No shape property, new markup or component runtime is needed.

An unpinned optional component override must continue to fall through to the existing **sized** control-radius fallback. Explicitly pinning a public radius alias consumes that public value; it must not be described as automatically deriving a different value for every size. Full theme rebases must clear inherited optional overrides unless deliberately pinned.

Required evidence: pill actions beside independently rectangular fields, no-attribute medium, small/large/explicit inherit, nested rebase and local overrides, Restore/Undo, long and icon labels, complete focus contours and coarse-pointer target bounds.

### 4. Extend a few bounded geometry choices

Add the agreed exact radius choices equivalent to 6, 10 and 18 CSS px at a 16px root; a 16px-equivalent base icon/artwork choice; exact 20/14 leading; and the `space.5` rhythm step. The new spacing step follows the existing rhythm, giving 20px at the default 4px step. Keep existing defaults and choices; managed menus remain anchored to the authoritative base rather than expanding repeatedly from each edit.

Artwork size is separate from interactive target size. A typography option is not a universal accessibility minimum, and a reference's compact geometry does not justify a fixed height that clips text. Required evidence: role-level computed geometry, pin/alias/restore/export behavior, enlarged and spaced text, wrapping, RTL, compound controls and all size contexts.

### 5. Explain retained pins without changing them

Provide read-only related-pin disclosure and token jumps using the existing graph. Potential transitive consumers identify relevant pinned descendants; the active dependency closure distinguishes pins **still connected** to the selected input from pins **detached from that input**. Literal-versus-alias syntax alone cannot determine connection: an alias may follow another seed, and an explicit alias pin may still follow the selected seed.

Use existing per-token Restore and Undo. Do not silently unpin descendants, bulk-reset a theme, or synthesize a dark counterpart. Explain that appearance changes retain pins and that a light candidate does not supply a reviewed dark set. Preserve unfinished edits and focus according to the editor's explicit navigation policy.

Required evidence: edit seed → inspect connected/detached consumers → jump → Restore → Undo; literal and alias pins; unchanged values from merely opening help; keyboard operation; and light-only mode guidance. Dependency disclosure helps an author inspect state colors; it does not certify their contrast.

## Constructive challenges and resolutions

| Challenge | Resolution for this slice |
| --- | --- |
| Rams-inspired design critique: can action/field distinctions work with one managed button-radius override before adding variants? | Demonstrate the existing hook and default alias in mixed compositions, including reset and nested themes. Broader variant machinery stays outside this slice. |
| Krishna-inspired UX critique: can an author predict and recover retained descendants without searching 30–51 pins? | Show relevant connected and detached pins at the selected token, with jumps and existing Restore/Undo. Do not hide an automatic unpin policy behind convenience. |
| Johnson-inspired platform critique: will a root theme, child rebase and local override preserve the fallback instead of freezing or leaking it? | Retain optional-override clearing and explicit legacy precedence; require computed browser evidence across scopes. |
| Everts-inspired performance critique: can shape and material distinctions remain typed data and CSS? | Reuse existing field/card paint roles and the button-radius hook. No new runtime or shadow structure is needed for these changes. |
| Frost-inspired decomposition critique, answered by the Watson-inspired accessibility lens: can decorative insets differ while preserving shared geometry? | Protect actual content and target bounds, not identical decorative boxes. Try the narrow radius change first; compound buttons, wrapped segmented controls and focus contours need real bounds checks before an inset system. |
| Watson-inspired accessibility critique: will authors see every fixed foreground, focus and state relationship after changing fill or seed? | Related-pin help improves inspection, while real white/tinted/state contrast checks remain required. Missing semantic roles are a separate design decision. |

## Larger options for discussion

Options 1–3 remain discussion items. The user has selected the bounded first stage of option 4, detailed below. Further public contracts should build on that evidence.

1. **Paired appearance and state recipes.** Goal: edit coordinated light/dark and normal/hover/pressed/selected families while keeping intentional exceptions. Reviewed snapshots are straightforward but duplicate maintenance; recipes reduce repetition while adding context, versioning, pin-precedence and validation obligations. Choose the maintenance promise before adding a schema. No inferred dark palette or silent removal of fixed states.

2. **Bounded component material, state and border roles.** Goal: express recurring differences between field and choice boundaries, action strokes, surface elevation and translucent overlays. A small semantic vocabulary is reusable; mirroring every external variant creates a large coupled API. Shadow arrays already exist in the value model—the missing choices include managed presets/construction and meaningful role placement. Modal behavior, focus and positioning remain separate from material data.

3. **Responsive typography and optional assets.** Goal: support deliberate role metrics, narrow-viewport behavior and, where required, reference font families. System stacks avoid asset delivery and fallback work; optional fonts add loading, fallback-metric, locale, SSR, no-build and performance responsibilities. A finite metric contract is smaller than an arbitrary font-loading system. Do not introduce a universal font-size rule or implicit loader.

4. **Shared target geometry with bounded family paint.** Goal: preserve learnable alignment and operable targets while allowing fields, buttons and compound controls different decorative envelopes. Family insets may improve fidelity, but multiply interactions with size, density, focus and nested layout. Evaluate mixed rows, wrapped labels, errors, enlarged text, RTL and coarse input before adding new roles. Painted similarity must not shrink the hit area or impose fixed 32px controls.

A smaller follow-up is explicit diagnostics for field text and placeholder colors against component-specific fills. The current semantic-pair diagnostics did not flag shadcn's placeholder after its fill became effective. Actual browser measurement found 4.24:1; the revised candidate uses a stronger muted-text pin. Extending diagnostic coverage needs a deliberate identity/coverage contract and tests; it should report findings rather than label an entire theme safe.

### Selected family-geometry stage

The follow-up discussion selected three optional dimension tokens: button inline
padding, input inline padding, and segmented-control frame inset. Existing defaults
and target floors remain. Family values fall back to the selected semantic size;
explicit component pins are absolute and legacy control-padding overrides retain
precedence. Frame inset is inside-border padding; inner corners and target bounds
use the same inset plus border width.

The shared height recipe retains its default reserve when the frame tightens and
grows when larger shared-scope insets require more target/content space. Local host
or Part overrides remain local. No sibling measurement, extra shadow markup,
interaction API, general paint/target separation or package-version change is
selected. Specialized icon-button, stepper and color-swatch padding remains intact.

Implementation includes managed editor choices, CSS/CEM documentation, a resettable
mixed-row sticker-sheet specimen with authored code, baseline comparisons and
focused browser checks. Regenerated candidates retain historical predecessors and
strict build/source identities. The dedicated specimen demonstrates the new hooks;
reference candidates only gain pins when retained reference evidence supports a
family distinction.
The retained shadcn homepage input/button distinction supports a `space.2-5`
rhythm step and an input-family pin: 10px fields beside 12px actions at the
default rhythm. This extends the observed native-input value to en-reve's shared
field family; the reference's other field variants were not independently
verified. The other three candidates retain their pin sets and all four leave
frame inset unpinned. No revised numerical fidelity score is inferred.

## Integrated checkpoint

The five bounded areas above are implemented. Field/card overrides now paint their intended families with existing instance overrides first. Managed button corners, exact scalar choices and rhythm step5 preserve defaults and target rules. Related-pin help uses active/potential graph closures, a theme/selection cache and stable keyed inspection controls. It never changes accepted values by itself. CEM annotations document the now-effective field/card CSS properties. No dependency, font asset or package-version change was introduced.

The exact documentation build is `sha256:f1c2bfeb21f26bd7a490ca0967cb62a66e43d146a371cb93c25766c8d515194c`. [Four revised candidates and mappings](../artifacts/theme-candidates/customization-review/README.md) preserve the original reference targets. Their [manifest](../artifacts/theme-candidates/customization-review/manifest.json) records each final source/file hash. Original Site44 files remain historical and require their original build. The new themes deliberately use references for shared spacing, typography and shape relationships while retaining explicit reference-specific state colors.

| Verification | Result and scope |
| --- | --- |
| [Token tests](../artifacts/theme-candidates/customization-review/token-tests.txt) |56 passing tests, including managed choices, pin/alias/restore/replay, authored precision and near-threshold diagnostics. |
| [Final compiler portability](../artifacts/theme-candidates/customization-review/portability-final/result.json) |16 author fixtures across Node/Chromium/Firefox/WebKit;64 exact cross-runtime replays,16 corruption rejections. |
| [Theme Review editor](../artifacts/theme-candidates/customization-review/editor-tests/playwright.json) |30 passing browser cases across three engines, including SSR/hydration, keyboard inspection focus, pin classifications, restore/undo/context and exact file reopening. |
| [Paint and adaptation](../artifacts/theme-candidates/customization-review/style-tests/summary.json) |24 unique passing browser scenarios across three engines. Covers actual field/card paint, full/partial scopes, instance priority, native input identity/drafts/form values,200% root text, long RTL labels, coarse targets, reduced motion and system-color/focus roles. Corrected fixture assumptions and superseded receipts remain recorded. |
| [Four revised candidates](../artifacts/theme-candidates/customization-review/verification.json) |12 passing actual import/preview/native-edit/re-export journeys: four themes×three engines,29 specimens each, zero runtime errors. Computed fills, radii, icons, leading and button foreground are checked. |
| [Visual inspection](../artifacts/theme-candidates/customization-review/post-implementation-visual-review.md) |Eight revised field/action screenshots show the intended shape/fill differences without a material coherence regression. This is a bounded visual judgment, not pixel-diff or new numerical scoring. |
| [Delivery comparison](../artifacts/theme-candidates/customization-review/delivery-performance.md) |No new compiler-reachability transition or mapped third-party package. Aggregate emitted JavaScript gzip grew860B; HTML gzip grew30,717B while Brotli grew344B. These are offline bytes, not latency. |

The browser checks are focused installed desktop-engine evidence. They do not establish the full current-minus-one/framework/physical-device/manual-AT matrix or full theme conformance. Short segmented options retain a24px inline floor with44px block sizing; do not infer a universal44×44 target guarantee. Forced-colors tests verify the user-agent palette and focus/selection roles; recorded composite contrast is not graded as an authored theme. All four candidates remain light-only system-font interpretations. Full offline review, automated pixel comparisons, adoption and the larger options above remain unfinished and unselected.

### Family-geometry verification checkpoint

The three optional hooks, finite spacing choices (including rhythm step2.5), and
resettable Family geometry specimen are implemented. Defaults matched the prior
build in27 representative cases per build across Chromium153, Firefox155 and
WebKit26.6. Early native input identity, draft, selection and focus survived SSR
hydration. Additional checks passed:60 token tests;39 size/rhythm/family browser
checks;6 editor and native copied-example journeys;6 paint/scope checks;18
independent interaction phases;4 actual specimen profiles; and12 fresh candidate
reopen/edit/export journeys with36 measured placeholder contrast pairs.

The final measured build is
`sha256:9f94cf5e0f4309b415dbc6a527c7cc1346254c68a77a4148373e73ddab4e7be0`.
[Candidate files and evidence](../artifacts/theme-candidates/family-geometry/README.md)
retain strict identities and preserve the previous checkpoint separately.
These installed-engine checks do not establish manual AT, physical-device,
current-minus-one or framework-matrix coverage, and do not change the original
fidelity scores.

Delivery remains a tradeoff: all emitted JS grows768 gzip bytes, standalone CSS74,
and five HTML pages75,219 combined. An offline removal experiment attributes36,320
gzip bytes to the new specimen in its current document context; compression is
contextual, so this is not a universal marginal cost. The three unchanged workflow
pages add10,380 gzip bytes. There is no new runtime dependency, emitted font or
compiler reachability in public component entry roots. Measurements are offline
sizes, not latency or CPU claims. An unimplemented expression-factoring probe saved
9,439 gzip bytes across all pages but added39 Brotli bytes; it did not resolve the
larger repeated-SSR-style delivery issue. Preserve this as a focused future
optimization with matching server/client stylesheet and hydration checks, rather
than changing SSR architecture in this geometry slice.

## Menu and selection follow-up

The [menu customization review](menu-customization-review.md) maps all four
reference systems to independent option-list geometry and state paint. It adds
bounded managed hooks for the delivered native select and combobox, while keeping
rich collections, action menus, trigger variants and material presets visible as
separate work. Spectrum comparison files now target Spectrum 2 rather than the
older Spectrum 1 basis; actual file/build evidence lives with each review bundle.

## Paired inspired themes — 2026-09-10

The paired-appearance portion now has an explicit implementation: two independently
authored managed drafts, a strict pair envelope, combined CSS and a Theme Review
workspace with independent editing/preview appearance. Density is shared and atomic;
other geometry may differ per appearance. General multi-axis/state-recipe authoring
remains a later design question. The generator in `tooling/theme-candidates` owns
versioned light/dark inputs for Spectrum 2, Fluent, Astryx and shadcn/ui.

Color joins use `light-dark()` only where both branches are reference-free colors.
Alias graphs, optional masks and non-colors retain ordinary conditional rules and
a full fallback. Full theme boundaries select Auto/Light/Dark explicitly. No palette
is inferred by inversion. Dark adaptations include independent action-text/link
roles and stronger focus/error values where our component surfaces require them.

Render receipts remain coverage, not visual approval or manual accessibility results.
Each candidate is still an interpretation of its source system; native picker styling,
fonts, non-text state contrast and physical-device/AT coverage retain their stated
limits. No package-version bump or official-theme adoption occurs in this iteration.
