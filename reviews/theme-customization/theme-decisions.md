# Theme decisions and cleanup sequence

**THEME-01–THEME-08 are published for review**, including the customization registry, CSS `@property` configuration, state refinements, scoped updates, authoring choices, composition repairs, the accepted CSS-source typography/surface recipes, and three divergent themes. THEME-07’s earlier retain-TypeScript recommendation is superseded by the accepted bounded CSS adoption; its optional before/after comparison remains local. Implementation, publication and user review are tracked separately. Existing API-06/API-07/API-10 in the [API decision register](/reviews/api-normalization.html?progress-report#decisions) cover related customization and tooling work; do not count overlapping findings as separate defects.

**Proposed priorities:** P1 (High) covers foundational contracts and demonstrated customization gaps; P2 (Medium) covers capability clarity and the required three-theme proof; P3 (Low) is the optional authoring pilot. These indicate recommended review and cleanup priority, not approval or a delivery schedule. Dependencies still apply: the three-theme proof follows cleanup, and the optional pilot must not block it.

**Status:** Partially published means a subset is on the review site while broader work remains. Published means the implementation is available on the review site; it does not mean user review or approval. Ready locally means implementation and local verification are complete, with a local preview available; it has not been published. Active means implementation or verification is underway. Not started means implementation has not begun; a proposal or planning discussion can still exist. Status is updated with each implementation and publication handoff. Last reconciled September 19, 2026; the findings below retain their original audit context.

Use the **Priority** column heading to switch between highest-first and lowest-first order. Proposal IDs open their full recommendations below; primary evidence IDs open the related findings.

| ID | Priority | Status | Proposal | Preferred direction | Alternatives to weigh | Primary evidence |
| --- | --- | --- | --- | --- | --- | --- |
| [THEME-01](#THEME-01) | P1 · High | Published | One public customization contract | Maintain one registry of hooks, consumers, reset rules and authoring metadata; derive or verify the related tooling. | Continue separate inventories with manual checks. | [COVER-01](#COVER-01), [COVER-02](#COVER-02), [HIER-05](#HIER-05) |
| [THEME-02](#THEME-02) | P1 · High | Published | Family membership and fallback precedence | Make component refinements fall back through family, shared and semantic defaults, with an explicit migration. | Keep broad properties as authoritative pins and apply that contract consistently. | [HIER-01](#HIER-01), [HIER-02](#HIER-02), [HIER-06](#HIER-06) |
| [THEME-03](#THEME-03) | P1 · High | Published | States refine base paint | Provide explicit family state refinements while preserving distinct action, field, selection and focus semantics. | Retain existing base-pin behavior and require Parts for additional state styling. | [HIER-03](#HIER-03), [COVER-05](#COVER-05) |
| [THEME-04](#THEME-04) | P1 · High | Published | Explicit scope and recomputation | Repair theme boundaries and host selectors; define optional-hook resets and dependency-aware emission separately from exact partial updates. | Require a full theme for every semantic change. | [SCOPE-01](#SCOPE-01), [SCOPE-02](#SCOPE-02), [SCOPE-03](#SCOPE-03) |
| [THEME-05](#THEME-05) | P2 · Medium | Published | Compiler capability and editor choices | Clarify typed tokens, managed choices and CSS/Parts as distinct surfaces; expand useful capabilities intentionally. | Force every valid CSS customization through the finite editor. | [HIER-04](#HIER-04), [COVER-06](#COVER-06), [COVER-07](#COVER-07) |
| [THEME-06](#THEME-06) | P1 · High | Published | Customization through composition | Fix dead hooks and adoption gaps; carry supported variables and Parts through composite components. | Require consumers to customize every nested child manually. | [COVER-03](#COVER-03), [COVER-04](#COVER-04), [SCOPE-06](#SCOPE-06) |
| [THEME-07](#THEME-07) | P3 · Low | Published | CSS source authoring | Author tested typography/surface recipes in CSS while preserving portable CSS and Lit consumption. | Adopt bounded CSS authoring per user preference; broader migration stays outside this pass. | [FUNC-01](#FUNC-01), [FUNC-04](#FUNC-04), [FUNC-06](#FUNC-06) |
| [THEME-08](#THEME-08) | P2 · Medium | Published | Three-theme proof and documentation | Build three divergent themes on shared fixtures after cleanup; verify scoped customization and document remaining limits. | Add palette variants alone, which would not meet the expressive-range goal. | [COVER-08](#COVER-08), [Readiness matrix](theme-readiness.md) |

## Follow-up implementation — September 19, 2026

The follow-up review confirmed delivery of THEME-01–08 and identified the bounded work below. The user has authorized implementation, commits to main and incremental publication. Existing theme acceptance remains unchanged; optional capabilities are not included in this pass.

| Follow-up | Owner | Status | Planned result |
| --- | --- | --- | --- |
| Public customization contract | API-06 / API-10 | Verified; included in this publication | Color-slider forwards its exact-value label; picker brightness and time-field input hooks are documented. Fifteen new browser cases verify conditional, replaced and forwarded Parts in three engines. |
| Theme regression execution | API-10 | Verified; included in this publication | `npm run test:theme` builds and runs the focused matrix. Reduced motion runs independently on Chromium, Firefox and WebKit. The proof suite starts its own server. |
| Historical finding reconciliation | Theme audit / API-07 | Published | Give each original finding a current disposition. API-07's cited theme repairs are implemented or deliberately retained; do not schedule duplicate broad repairs. |
| Reflow and text enlargement | API-10 tooling | Automated regression coverage | Playwright checks 200%/400% equivalent reflow and 200% relative-text enlargement across three themes, two appearances and three engines, each in LTR/RTL. Native browser zoom is a targeted diagnostic. |
| Native platform validation | Theme accessibility | Pending manual evidence | Record physical-device, screen-reader and native high-contrast results. Emulated touch and axe are separate evidence. |
| Next-release migration | Release coordination | Migration record prepared; apply at release | [Unreleased migration record](/reviews/theme-customization/theme-next-release.md?progress-report) covers precedence, newly connected paint and label Part reach. Package versions remain unchanged. |

**Resolved follow-up:** color-slider now forwards editor-label to its exact-value field label, combining the setting name and qualifier. Its subclass metadata describes that distinction from the ordinary slider qualifier. Existing localized naming and error forwarding are preserved. Picker brightness and time-field input-hook metadata are complete for the identified gaps. A reusable rendered reachability helper follows actual Part boundaries; its focused fixture coverage is not a claim to cover every component state.

**Verification — September 19:** full workspace build; 193 Node tests; 271 browser scenarios (33 cascade, 30 state, 69 composition, 73 documentation and 66 scope checks); property-registration probes in all three engines; and customization freshness all passed. Two documentation emulation skips remain: Firefox touch and WebKit forced colors. Reduced motion passes independently in all three engines. Registry coverage is 553 contracts with 16 reviewed annotation exceptions and zero failures.

**Additional verification — September 19:** all 54 new reflow/text-enlargement cases passed in Chromium, Firefox and WebKit with no failures or skips. These are additional to the earlier 271-scenario run; no component styling change was needed.

**Reflow clarification:** routine zoom-related checks belong in Playwright. The additional matrix reduces a 1280px layout to 640px and 320px and separately doubles relative text, asserting measured text scaling, no page overflow, control/dialog bounds, retained edits, selection and keyboard/focus return. Native browser UI zoom is only a targeted diagnostic when a specific issue warrants it; the previous Chrome access denial is not a remaining reflow blocker.

**Still pending:** the [native validation record](/reviews/theme-customization/theme-native-validation.md?progress-report) tracks physical devices, screen-reader output and native high contrast. Automated checks and user acceptance of THEME-08 do not close these distinct rows.

**Optional future scope:** typed Display-P3 themes, input-specific geometry, family elevation, more CSS-authored families and a portal/theme controller remain demand-driven proposals. The accepted THEME-07 and THEME-08 slices are complete.

[Detailed follow-up assessment](/reviews/theme-customization/theme-followup-review-2026-09-18.md?progress-report) · [Regression command and coverage](/reviews/theme-customization/theme-regression.md?progress-report) · [Verification receipt](/reviews/theme-customization/theme-followup-verification.json). Original findings below retain their audited revision and now state the current disposition.

## THEME-01 — One public customization contract

**Implementation review:** [Try the customization contract examples](/theme-customization.html?progress-report). The shared registry now supplies reset classification, source consumers and fallback references, managed-editor linkage and registration policy. The generated contract inventory and source coverage report distinguish supported hooks from known unresolved findings.

**CSS registration:** default CSS registers public contracts using `syntax: "*"`, `inherits: true` and no initial value, preserving inherited token streams and optional fallback chains. `emitPropertyRegistrations()` and `createPropertyRegistrationPlan()` expose compatible or explicitly typed policies, name selection, per-property definitions and exclusions. Typed initials are stable canonical defaults or explicit application definitions, not whichever local theme was emitted last. Optional hooks remain compatible unless a consumer deliberately chooses a different contract. This is document-level configuration; registrations cannot be scoped to individual themes.

**Validation boundary:** typed registrations can change invalid-value handling, initial resets, relative-length computation and `light-dark()` inheritance. The implementation includes cross-browser checks and a live before/after validation-summary example. Existing unrelated dead/misspelled hooks remain visible reviewed findings for their implementation decisions; the registry does not relabel them as working consumers.

**Recommend:** maintain one source-backed registry of supported semantic tokens, family/component hooks and mechanical inputs. Each entry should declare its type, fallback, consumers, state semantics, reset policy, size behavior, managed-editor support and any corresponding Part. Generate or verify reset lists, CEM annotations, theme-editor descriptors and documentation from it.

**Why:** the typed graph, reset registry, style family list, CSS consumers and element annotations are currently separate inventories. A registered CSS-only hook is not necessarily a managed token; an unregistered real hook can leak through a full child theme. A documented hook may also have no effective consumer.

**Alternative:** continue hand-maintained lists plus spot checks. This costs less initially but leaves the same late-component drift mechanism in place.

**Compatibility:** adding reset coverage can change a previously leaking nested theme. Classify geometry/data inputs explicitly before adding them; scroll positions, split ratios and measured offsets must not be reset as visual themes. Do not expose every private `--en-*` value merely because a scanner finds it.

**Evidence:** CSS-01/CSS-10 in the previous audit; coverage and scoping reports in this addendum.

## THEME-02 — Family membership and fallback precedence

**Implemented for review following separate authorization:** narrower family values now refine shared defaults; shared radius reaches ordinary buttons, and segmented frame geometry stays local. The [membership and migration guide](/reviews/theme-customization/theme-02-cascade-migration.md) lists affected components, preserved distinctions and migration examples. The original decision rationale follows for traceability.

**Recommend as the target contract:** instance/component refinements fall back to family defaults, then shared group defaults, semantic roles and generated literals. Publish a membership table for controls, buttons, inputs, options, surfaces and overlays. Treat specialized targets such as icon buttons, range thumbs and calendar cells explicitly.

This is a fallback rule, not a claim that ordinary selector specificity chooses between differently named variables. Scope still selects the value of each individual variable.

**Original compatibility decision (now approved):** shared control padding/paint and shared card surface pins intentionally outrank some narrower hooks. Reversing them is a compatibility change. Prefer a clearly versioned migration to the target contract if we want broad values to behave as defaults. If preserving the current contract, describe those shared properties as authoritative pins, document how to clear one locally, and implement that model consistently. Do not quietly reverse one family while leaving others unchanged.

**Geometry decision:** preserve target floors and alignment, but review whether a segmented-control inset should enlarge unrelated text controls. Prefer local family geometry with an explicit opt-in aligned control group where that shared envelope is wanted; the approved implementation now uses local segmented geometry.

**Evidence:** hierarchy report and existing CSS-03/CSS-06/CSS-07. The final choice should be made once for the whole relevant feature, not independently in each component.

## THEME-03 — States refine base paint

**Implementation:** [Review additive button state refinements](/theme-states.html?progress-report). Six optional rest/hover/pressed background and foreground hooks preserve broad-pin and variant compatibility. [State membership and compatibility contract](/reviews/theme-customization/theme-03-state-paint.md) documents independent field, selection, surface and focus semantics. Built on the integrated THEME-01/02 registry and fallback contract.

**Recommend:** provide explicit state refinements for comparable families. A base paint choice should have documented hover/pressed/selected behavior; state-specific values should be able to refine it. Adopt a small, shared precedence vocabulary where states overlap, while retaining semantic differences between actions, editable fields, selections and surfaces.

Prefer family defaults derived from semantic roles over a single universal hover color. For example, an action on a filled surface and an option on a neutral popup do not necessarily need the same foreground/background combination. Focus is an independent visibility contract, not another hover fill.

**Alternative:** retain broad background pins with their existing state/variant coverage and require Parts for additional state styling. This is possible today for some controls, but inconsistent with option states and less useful for whole-system themes.

**Compatibility:** new hooks can be additive; changing the behavior of existing broad pins is observable. Decide a compatibility path before changing them. Keep hover capability gating, forced-color adaptations, disabled semantics and reduced-motion behavior.

**Evidence:** hierarchy and coverage reports; CSS-07 and CSS-09 from the earlier audit.

## THEME-04 — Explicit scope and recomputation semantics

**Implementation:** [Scope, reset and graph-patch guide](/reviews/theme-customization/theme-04-scopes.md?progress-report) includes runnable examples. Explicit shadow-host targets repair appearance branches; optional-hook clears restore component fallbacks; dependency-aware plans preview affected outputs while preserving inherited pins. Existing exact partial selections and paired appearance ownership remain unchanged. Combined registry and scope checks pass across Chromium, Firefox and WebKit.

**Recommend:** retain full-rebase versus partial-inheritance as distinct operations. Repair missing resets and host-target selector behavior, and specify what returning an optional hook to its unpinned state means. Add a clearly named dependency-aware emission workflow for consumers who want a semantic concept change to update its dependents.

Keep today's explicit partial token selection predictable. Do not silently turn it into a dependency closure: doing so could overwrite inherited pins that an application intentionally preserved. A proposed dependency-aware API should show its affected token set before emission and distinguish dependencies needed for evaluation from dependent outputs that need redeclaration.

Document three facts with runnable examples: aliases resolve at the declaration boundary; some recipes emit computed literals; top-layer presentation alone does not relocate a DOM node. An application that actually portals/reparents content owns the destination theme boundary.

**Alternative:** require full themes for every semantic change. This avoids an additional emission workflow, but is too blunt for the requested region and feature-group customization.

**Compatibility:** selector generation corrections and reset repairs fulfill intended boundaries; unpinned partial behavior and a new dependency mode need explicit tests and migration notes.

**Evidence:** scoping report, including browser probes; existing CSS-01/CSS-02.

## THEME-05 — Separate compiler capability from editor choices

**Published for review:** [Try the authoring routes](/theme-authoring.html?progress-report). Twelve connected control/surface hooks now have optional typed tokens and managed choices without changing default rendering. The live example compares CSS and managed geometry, and exports/reopens code-authored fonts and layered shadows. The editor distinguishes unpinned authoring defaults from rendered fallback values. See the [authoring guide](/reviews/theme-customization/theme-05-authoring.md). Display-P3 schema expansion and new composition/state hooks remain separate decisions.

**Recommend:** describe three supported surfaces independently: typed token authoring, finite managed-editor choices and ordinary CSS/Parts. Promote repeatedly useful family hooks into managed tokens, but do not claim the editor exposes every valid theme value. Preserve a code-authored route for richer typography and multi-layer shadows where the compiler already supports them.

Display-P3 is a separate decision: the color controls can work with it, but that does not make the theme token schema wide-gamut. A future typed color-space expansion needs coordinated schema, serialization, recipes, diagnostics, migration and fallback policy. Until then, document which raw CSS color hooks can accept it without promising typed round-trip support.

**Alternative:** force all CSS customization into the finite token editor. This would reduce expressive range and make native CSS features unnecessarily dependent on editor releases.

**Compatibility:** broaden typed capabilities intentionally; do not weaken validation simply to accept arbitrary CSS strings in typed color or dimension tokens. Gradients, responsive expressions and complex material treatments may be better supported through ordinary CSS and Parts than by inventing a token for every declaration.

**Evidence:** coverage and hierarchy reports; token types and managed descriptors.

## THEME-06 — Carry the contract through composition

**Published for review:** repaired inherited hooks and additive Parts are implemented and verified across Chromium, Firefox and WebKit. Review the [live composition fixture](/theme-composition.html?progress-report) and [contract/migration notes](/reviews/theme-customization/theme-06-composition.md).

**Recommend:** finish the early/late component parity work and forward supported child customization across composites. Use Parts for structural exceptions and detailed native surfaces; use inherited variables for coherent family themes. Document host-layout Parts separately from native control/input Parts.

Fix dead/misspelled hooks, missing semantic fallbacks and omitted field/size adoption before adding large new vocabularies. These are direct obstacles to reusing knowledge gained elsewhere in the library.

**Alternative:** ask consumers to theme every nested child manually. This is fragile when shadow boundaries hide those children and duplicates knowledge of the implementation.

**Compatibility:** favor additive Part aliases and explicit state hooks. Preserve legitimately different content ownership and specialized control geometry. Do not rename every `content`, `body`, `actions` or `footer` solely for spelling consistency.

**Evidence:** coverage report; CSS-02–CSS-09 and API-06/API-07 in the earlier audit.

## THEME-07 — Pilot reusable authoring, keep runtime CSS portable

**CSS adoption accepted and published:** [Local before/after comparison](http://127.0.0.1:47917/?progress-report) · [Adoption and verification](/reviews/theme-customization/theme-07-css-authoring.md?progress-report). The user prefers CSS source authoring when consumption is equivalent, superseding the earlier retain-TypeScript recommendation. Typography and surface recipes now have CSS sources and a self-contained package build. Existing CSS and Lit entry points, default/size references, overrides, SSR and hydration are retained. The combined normalized CSS is identical before/after (18,752 bytes; 2,704 gzipped). Broad conversion of other families is outside this pass.

**Decision:** use the bounded internal function/mixin syntax for these recipes. The compiler preserves declaration order and rejects unsupported semantics. Consumers receive ordinary CSS and generated Lit adapters; no external Reve checkout or runtime transform is needed. Customization inventory reads authored CSS directly. [Historical pilot](/reviews/theme-customization/theme-07-authoring-pilot.md?progress-report) remains evidence, not the current adoption decision.

**Compatibility:** functions compiled into declarations cannot later be replaced dynamically as functions by an application. Consumers still customize the resulting variables and Parts. Scoped definitions, cascade layers, conditional rules, type checking and module/package boundaries need explicit handling or rejection before any shared public authoring package.

**Evidence:** functions assessment and its exact-source probes.

## THEME-08 — Three-theme proof and documentation

**Accepted and published:** [Compare the three themes](/theme-proof.html?progress-report). Editorial, Precision and Studio share one editable workspace in both appearances, with family/concept/instance scopes, nested regions and portable CSS/draft export. Built on the verified THEME-06 composition contract. Local verification: 46 browser cases passed, two explicit emulation skips, seven compiler/transfer cases, and all 72 theme/appearance/density/size combinations per engine. [Guide and remaining limits](/reviews/theme-customization/theme-08-proof.md). The user accepted the implementation and authorized its merge; the three-theme workspace is now published for review.

**Recommend:** after cleanup, create three visually divergent themes against the same component and application fixtures. Measure variety in typography, geometry, rhythm, surface treatment and interaction states, with local family overrides and nested boundaries included. Record unsupported requirements instead of hiding them in per-demo fixes.

**Alternative:** add three palettes using the current preset recipe. That would exercise color values but would not satisfy the user's goal of substantially different application delivery.

**Compatibility:** keep the existing presets and existing accessibility behavior. The new themes should not require component forks or new markup for identical application tasks. Theme art direction and its user review are subsequent checkpoints.

**Evidence:** [readiness matrix](theme-readiness.md) and the current preset definitions.

## Proposed implementation batches after decisions

| Batch | Outcome | Dependencies |
| --- | --- | --- |
| A. Repair established contracts | Accurate hook inventory, reset coverage, host-theme selectors, working documented hooks, missing fallback/Part/size coverage. | Agree classifications and intended existing behavior; reproduce focused concerns. |
| B. Normalize theme relationships | Family membership, shared/family precedence, state refinement, optional-hook reset and dependency-aware partial emission. | THEME-02–THEME-04 decisions and migration policy. |
| C. Improve authoring and documentation tooling | Registry-driven docs/checks, editor/compiler coverage map, optional bounded functions/mixins pilot. | A/B contract stable; no blanket dependency on the pilot. |
| D. Prove expressive range | Three divergent themes, scoped demonstrations, interaction/accessibility checks and reusable documentation examples. | Readiness criteria met; visual directions agreed. |

This sequence remains a planning guide. THEME-01 has a dedicated implementation review above; progress on other decisions is tracked separately rather than implied by this sequence.
