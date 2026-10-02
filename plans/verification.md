# Verification, review, and performance plan

Status: implementation and focused verification are underway, grounded in all 24 accepted discovery answers. Package tests, selected browser workflows, candidate screenshots, SSR checks and a scoped performance diagnostic now exist. The full support matrix, manual acceptance of the four integrated reference workflows, manual AT coverage, adopted VRT baselines, operational affected-scope/cache pipeline and performance-budget program remain unverified. Existing maintainer cache/selector contract tests do not establish end-to-end evidence reuse. No numerical performance budgets have been accepted.

The canonical discovery record is located through `.progress-report/project.json`. This plan complements `plans/architecture.md`, `plans/accessibility.md`, and the token plan. Package names below follow the architecture proposal; they are not separate user decisions.

### Current evidence checkpoint

The located report workspace retains `evidence/control-typography/verification.json` and its accompanying `results.json`, token, control-regression and report-browser records. They identify source `0d0b4265701b9102d1530bee63330ce879de327d`, documentation HTML `0712fe49c62eaaf5da9ee53301c758ba48183deb62cb77e1d6037e0b1f90e60b`, and independent report UI `12136386896edeb21c11bd9fac3c034d4adabfc77f7cd92dcc9a122700195318`. These are historical evidence identities, not moving aliases for whatever is in the checkout next.

The aggregate records a workspace build, 32 token Node tests, 39 token browser checks, 27 control-sizing regressions, 432 typography configurations and six read-only report browser profiles. Chromium 153.0.8010.12, Firefox 155.0 and WebKit 26.6 are the tested installed desktop engines. Counts describe those scopes; they do not establish all-component, physical-touch, actual current-minus-one browser/framework, native picker or manual screen-reader coverage. Screenshots are reviewed candidates, not adopted VRT references; `userApproved` remains false in the checkpoint. The older timings in `plans/performance-review.md` retain their original `fecd44ee…` artifact identity.

## 1. What verification must establish

- A person can complete the four reference workflows: multi-step SSO-centric forms, design-tool settings panels, chat-triggered just-in-time interactions and project selection. Regular use, varying expertise, and collaboration remain the context.
- Developers can consume packed public ESM and type declarations from plain HTML/import maps, React, Vue, Svelte, and SSR integrations, without depending on workspace source aliases or private component markup.
- Components support application-owned public state and synchronous cancellation of tentative `en-change` transactions. JavaScript is required initially; application/page code owns JavaScript fallback and connectivity/offline policy.
- Official defaults and named themes meet applicable WCAG 2.2 AA requirements, with real browser and assistive-technology evidence for the complete workflows. Consuming teams remain responsible for their customizations.
- Local changes receive focused verification whose scope is explainable. Shared changes invalidate the consumers they affect; a small source diff is not proof of a small effect.
- Reviewers can examine old/new interactive components, CEM-informed changes, all-component theme sticker sheets, candidate documentation, and visual differences before adopted references change.
- The library's loading and runtime costs are measurable separately from application/server/network work and from developer tooling costs. Fewer bytes or faster tests cannot compensate for broken interaction.

Do not count source-text matches, generated HTML substring checks, or snapshots of interpolated strings as evidence of component behavior. Schema parsing, type checking, and import-graph analysis are useful structural checks; they do not replace browser use. Test observations concern public properties, dispatched events, submitted values, accessibility semantics, focus, visible state, and actual interaction outcomes.

## 2. Recommended tooling and boundaries

| Tool or surface | Responsibility | Boundary |
| --- | --- | --- |
| `@playwright/test` | Page-based component fixtures, integration journeys, screenshot comparisons, developer-consumer browser tests | Use normal served pages and public artifacts; do not make the experimental component-testing runner a prerequisite. |
| TypeScript compiler | Package checks, declarations, compilation of consumer examples, structured source/import analysis | Keep compiler work independent of browser fixtures and documentation generation. |
| Node's built-in test runner | Pure resolver, state-transition, serialization, dependency-selection, and cache-contract tests | Test real API invariants; native form/focus/DOM behavior belongs in browsers. |
| `@axe-core/playwright` | Automated accessibility rules at named, meaningful UI states | Findings supplement keyboard, screen-reader, and human evaluation; run the applicable checks in `plans/accessibility.md`. |
| Playwright HTML/JSON reporters and Trace Viewer | Local run navigation, failures, actions, screenshots, network evidence | Store evidence privately; retain failure evidence without exporting to a public report service. |
| Browser Performance APIs; Chrome DevTools for diagnosis | Loading, user interaction, rendering, long work, and cleanup investigations | Record API/browser support; Chromium-specific measurements are not cross-browser measurements. |
| `web-vitals`, only in reference-app measurement entry points | Optional application-level LCP/CLS/interaction observations | Never make telemetry or a metrics collector an automatic library runtime dependency. |
| Small private verification tools | Affected-scope selection, run manifests, cache lookup, artifact indexing, baseline review | Begin with ordinary files and a versioned manifest contract. Do not require a SaaS cache or review provider. |

Playwright projects can separate browser/fixture configurations, and contexts provide fresh storage/state for independent tests. Pin runner and browser revisions for reproducible evidence. [Playwright projects](https://playwright.dev/docs/test-projects), [test isolation](https://playwright.dev/docs/browser-contexts)

Proposed layout: package-local pure tests and browser scenarios; shared scenario metadata under private verification tooling; independent consumer fixture projects; private run directories for evidence. Share small public-API interaction helpers, not a single framework-specific test application. Documentation, token administration, review UI, and the independent Progress Report have their own tests and imports.

## 3. Scenario and artifact contracts

Give every scenario a stable ID and an explicit record containing:

- Owning package, public entries, pattern family, supported behavior, and relevant accepted requirement IDs.
- Required components, token/theme references, locale catalogs, fonts/assets, feature paths, and external fixture dependencies.
- Initial application state, deterministic inputs, user steps, observable completion/error outcomes, and reset operation.
- Applicable engines, actual-browser requirements, display/input profiles, locales/directions/preferences, and named screenshot states.
- Whether it supplies behavior, accessibility, visual, consumer-integration, or performance evidence; one kind never silently substitutes for another.

The test harness owns fixture-specific readiness signals and deterministic simulated services. Component production code should not gain test-only public attributes or timing APIs. Wait for observable readiness, such as the intended control being usable and data/state matching the scenario. Do not use arbitrary sleeps as correctness checks.

Each run produces a versioned manifest recording source revision plus content identity for uncommitted changes; package tarball hashes; dependency lock and import-map identity; test/scenario versions; selected tests and selection reasons; exact environment/configuration; start/end; and per-check outcomes. Distinguish `passed`, `failed`, `not-run`, `unsupported`, and `reused` results. Preserve the originating run when evidence is reused. Never label a test as executed because an equivalent result was cached.

Before browser use, freeze or identify the served output and record HTML plus loaded JS/CSS/font/locale identities, not just the source commit or a local `dist` filename. Compare the actual response identity with the intended artifact and check inputs/output again after the run. A concurrent rebuild, stale server, missing script digest or changed fixture prevents a fresh exact-candidate claim. Preserve partial/failed attempts separately; a later fix does not relabel older screenshots or timings. If a retained ad-hoc run lacks a complete manifest, state the missing provenance rather than inferring it retrospectively.

## 4. Focused selection and transitive invalidation

Use the proposed package graph as a starting point, then resolve changed public and internal module dependencies, token aliases/derivations, generated artifacts, and fixture declarations. Build graph data using compiler/module-resolution APIs and structured manifests, not regular expressions over imports. Capture actual loaded modules in native-ESM fixtures to detect graph mistakes; execution of one branch does not prove that unexecuted dynamic imports have no dependencies.

| Changed surface | First checks | Required consumer expansion |
| --- | --- | --- |
| `@en-reve/tokens` data, aliases, derivations, resolver | Parse/type/cycle/error cases; deterministic derivation and override behavior | All transitively affected styles/components and contrast/state pairs; theme scopes; all-component candidate sticker sheet and candidate documentation. |
| `@en-reve/styles` and shared CSS | Public style recipe fixtures; inheritance/precedence, nested roots, parts/custom-property behavior | Owning elements/patterns, themes, preferences, and layouts that consume the changed recipe; VRT and relevant accessibility checks. |
| `@en-reve/primitives/state/*` | Actual transition/cleanup/cancellation invariants | Each owning component family plus application-owned consumption and integrated journeys that use those state transitions. |
| `@en-reve/primitives/templates/*` | Public template consumption in a real browser | Owning components and alternate documented consumers; accessible names, slots, events, focus/form behavior, SSR where applicable. |
| `@en-reve/primitives/interactions/*` | Browser pointer/keyboard/composition interactions | Every affected family, cancellation/focus/selection tests, applicable RTL behavior, relevant complete workflows and AT review. |
| `@en-reve/elements` component entry | Component public-contract and selected-state tests | Its composed recipes, packed consumer fixture coverage, owning reference workflows; dependency graph/import-cost check. |
| `@en-reve/elements/define/*` | Registration and repeated-import behavior | HTML import-map and supported framework/SSR consumers; verify unrelated elements are not registered/loaded. |
| `@en-reve/patterns` | Complete recipe/journey behavior | Candidate documentation demonstrations and relevant locale/display/AT variants. |
| `@en-reve/ssr` or platform/polyfill integration | Server execution plus delivered HTML in browsers and client adoption | Every affected component family; no duplicate markup, lost input, wrong focus, or instance/request state leakage. |
| Locale catalog or formatting behavior | Catalog execution and rendered message scenarios | All users of changed keys or locale behavior, text expansion, input/composition, direction, and relevant workflow states. |
| Private docs/admin/review/MCP-or-CLI tooling | That surface's actual user/developer process | Its imported public dependencies and generated contracts; no automatic runtime-library suite when outputs/imports are demonstrably unaffected. |
| Compiler, dependency lock, runner/browser, generator, shared fixture, graph/cache logic | Affected package checks and artifact regeneration | Invalidate corresponding generated/run evidence; use wider integration coverage when shared semantics or graph accuracy can change. |

Selection procedure:

1. Compute changed inputs from content identities, not only filenames or commit messages. Include generated outputs, configuration, dependency versions, and fixture data.
2. Take reverse dependency closure through internal and public modules, explicit dynamic edges, token aliases/derived values, style recipes, and affected scenario metadata.
3. Add cross-cutting checks for altered public contracts, scope/inheritance, events, form participation, focus, locale/direction, platform features, or SSR.
4. Print the resulting scope and why each test is included. Unknown edges, missing metadata, or inability to prove isolation expand the run; they cannot create a cached pass.
5. Reuse eligible evidence by exact input contract. Execute missing/invalidated tests. Record uncovered requirements as `not-run` with a concrete next action.

For example, changing one accent source can affect derived hover/focus/selection colors across every theme consumer even when their JavaScript is unchanged. A private documentation-copy change may need only that rendered page and its interaction/navigation checks. A roving-focus helper change reaches all using families, even if their CEM entries are identical.

For shared control typography/rhythm, keep a small independently served family fixture and a separate production-sheet integration smoke. Existing starting points are `packages/elements/src/internal/tests/control-rhythm.spec.ts`, `packages/tokens/test/browser/`, and `tooling/typography/`; they are not substitutes for packed consumers. Compare native/button, text, search, number, date, select, color and segmented controls through public parts and actual editing/activation. Check single-line alignment, number-step hit targets, multiline growth, disabled-item keyboard traversal, frame activation, absent-size equals medium, explicit inherited sizing, scoped overrides and the shared minimum override. Icon-only controls retain their distinct geometry contract.

The completed typography matrix varies three densities, six rhythm values (0.125, 0.1875, 0.25, 0.3125, 0.375 and 0.5 rem), four size states (absent/small/medium/large), and fine/coarse profiles: 144 configurations per engine. Promote this as a lightweight metrics matrix when those shared inputs change; do not repeat every full interaction for every cell. Pair it with representative 0.25/0.5-rem workflows, 390px RTL, enlarged text/spacing, native date entry, selected/unselected labels, and theme-boundary/independent-input/output-pin checks. Full theme declarations rederive aliases; raw descendant primitive overrides do not automatically rebase inherited aliases. Assertions must test that documented boundary, not invent a stronger one.

## 5. Execution lanes

These are event-triggered workflows, not a recurring schedule or an authorization to run background jobs.

| Trigger | Execution scope | Reviewable output |
| --- | --- | --- |
| Local focused edit | Owning type/pure checks; relevant browser scenario/state | Fast actionable failure and selected-scope receipt. |
| Change ready for review | Affected closure across applicable engines; relevant accessibility, VRT, public API and consumer checks | Candidate evidence packet with reasons, old/new demo, CEM/change record, unresolved findings. |
| Token/theme proposal | Affected behavioral/visual/accessibility checks plus complete sticker sheet and candidate docs | All components visible in the proposal; indicate fresh versus reusable evidence rather than hiding unchanged components. |
| Shared architecture/platform/tooling change | Wider families/consumers and four integrated workflow smokes | Cross-system evidence and explicit gaps; rerun invalidated checks rather than repeatedly rerunning unrelated ones. |
| Coordinated release candidate | Assemble complete applicable coverage; freshly run packed-artifact consumer/SSR and four workflow integration checks; reuse only eligible unaffected focused evidence | Versioned release-evidence index and reviewed visual references. |
| Browser/framework support window changes | Resolve new exact version ledger, rerun affected compatibility/integration checks, generate separately reviewed visual references | Updated support evidence; retained historical results. |

Retries diagnose intermittent failures; they do not erase the first failure. Record flaky outcomes separately, keep trace evidence, and assign a follow-up. Do not silence a required test through indefinite quarantine. A changed test, runner, or environment invalidates evidence as appropriate.

Before calling a changed surface complete, relevant functional/accessibility failures must be resolved or accurately left open; intended visual/API changes need the applicable review decision. Broader production-stability criteria will be established from actual evidence, not inferred from the initial emphasis on breadth.

Stop after the selected checks pass unless a new change, unexpected failure, unknown dependency, shared registration/platform effect or integration mismatch justifies escalation. Diagnose a failure in the smallest real browser/native comparison first, then rerun the affected case and its causal consumers. Do not repeatedly run the entire catalog to compensate for an unexplained failure, relax assertions to match accidental output, or turn a known platform reproduction into a blanket skip. Record intended scope expansions and their reason.

### Promote review probes into durable coverage

The optional-slot SSR audit now includes dynamic forwarding in
`packages/ssr/tests/browser/optional-slots.spec.ts`: content added before or after
hydration, reassignment across differently named wrapper/component slots, removal,
fallback restoration, node identity and focus retention. This exposed a receiving
slot listener bug in `en-card`; card and alert listeners now read the receiving
slot rather than the forwarded event target. All 24 focused cases pass across
Chromium, Firefox and WebKit, including existing first-paint layout and hydration
checks. This closes that browser regression gap; it does not establish manual
screen-reader announcement behavior or arbitrary consumer projection semantics.

Move reusable scenario logic from `/private/tmp` or retained report evidence into its owning package/tooling fixture, removing machine-specific imports, ports and output paths. Keep original evidence immutable in the report; promotion itself supplies no new pass. Start with the control typography matrix/native comparisons, selective composite-element registration, and overlay/reset/editing workflows already exercised during review. Reuse one small metrics/fixture helper where it preserves public contracts; keep module loading, geometry, interaction, audit, visual capture and timing as separately selectable checks.

The independent Progress Report consumes a bundled library snapshot under its own `.ui/versions/<fingerprint>`, outside the application checkout. Record that snapshot, library source and report fixture identities separately from documentation. Verify the last good snapshot still serves without the application server or a successful new library build; a failed report build must leave the current snapshot usable. Run feedback, revision-conflict and persistence mutations only on isolated copies of report data. Live canonical-report smokes stay read-only. Current read-only typography/report checks do not refresh earlier unchanged persistence-workflow evidence. Keep the report server/UI tests and data outside the library's normal runtime dependency graph.

## 6. The four shared reference workflows

These independently runnable, resettable application fixtures use public packages on separate build-time SSR pages: `workflows.html`, `workflows/settings.html`, `workflows/chat.html` and `workflows/selection.html`. Each page creates and renders one workflow with its own source/reset controls. Test direct entry, ordinary browser history, legacy hash forwarding and report-flag preservation, in addition to the individual tasks. The same scenario identities support automation, human review, documentation, and performance measurement; their runners remain separate. Simulated identity/collaboration/chat services make outcomes reproducible without real accounts, messages, backend services, or generated code.

| Reference workflow | Real process to exercise | Critical evidence |
| --- | --- | --- |
| Multi-step SSO-centric form | Choose a provider, move through required steps, submit via keyboard/pointer, encounter validation/service rejection, correct the issue, cancel/retry, finish | Labels/instructions and error associations; focus progression/recovery; native form submission/reset/disabled behavior where applicable; application-controlled values; no duplicate completion; meaningful status. Simulated provider results test the UI, not real SSO security or service integration. |
| Design-tool settings panel | Select an object, inspect grouped settings, expand optional detail, edit using direct entry and other offered controls, accept/reject changes, receive an external state update | Clear committed/proposed state, preserved editing/selection/composition, predictable keyboard navigation, no spurious action echoes, nested themes/overrides, readable density at small/large sizes. Use supported mixed/multi-selection features when implemented; do not invent them solely for tests. |
| Chat-triggered just-in-time controls | Receive deterministic messages/control suggestions, discover/open a control, apply or cancel an action, receive an intervening collaborator update, continue the conversation | Incoming content does not steal focus; user can find newly offered actions; application rejection leaves state coherent; status/announcements avoid overload; scrolling/selection continuity. This is a fixture for component integration, not a multiplayer or LLM backend commitment. |

| Project selection | Search the supplied project catalog, inspect loading/error/empty states, select a project, submit the accepted ID, scroll/edit in the mobile review scene and recover from a suspended result list | Query remains separate from the accepted ID; no implicit selection; native form receipts and validity agree; focus/draft survive viewport changes; the stable no-room status follows a 700 ms quiet period and safe composition completion while preserving the existing position/draft/accepted state. The follow-up receipt verifies that behavior separately from earlier positioning results. |

The modules are organized under `apps/docs/src/workflows/{sso,settings,chat,selection}` with separate domain data/validation, template, style and factory boundaries; SSO and settings isolate their service adapters. The shared docs-only request lane/scheduler has 8 passing Node cases; the initial combined-page suite passed 58 browser executions covering task completion, recovery and hydration. The maintained suite now exercises independent pages, including per-page SSR and navigation; artifact-specific counts belong in its receipts. The earlier narrow scenario ran only in Chromium; later mobile/selection checks retain their own engine/profile receipts. See the [runner and scope](../apps/docs/tests/README.md); exact artifact receipts live in the independent report. Keep real auth/chat/model services outside the fixture and attachment scenarios, locale review, current-minus-one, physical-input/AT and performance coverage explicit. [Shared contract](../apps/docs/src/workflows/shared/README.md).

Firefox 155 reported a focus warning when the settings form aggregated an invalid editable slider directly. The recipe now calls the first field’s existing public `reportValidity()` before form aggregation. Browser evidence verifies exact-editor focus, retained draft/accepted FormData, blocked invalid saves and focus-free passive validity queries. This is a bounded workflow mitigation, not proof of general native form-aggregation parity.

For each: exercise the main path, one correction/rejection path, cancellation where relevant, repeated use and an external application update. Application writes must not report a new user action. Inspect coherent tentative public property/Signals/FormData during `en-change`, cancel synchronously and verify owned rollback after dispatch or the authoritative superseding write. There is no second committed event. Cancellation may retain activation focus; it does not universally restore prior focus. Native editing drafts may differ from accepted state, and tests preserve IME, selection, undo and paste rather than demand keystroke rollback. Presentational elements do not acquire artificial cancelable events.

The adopted migration requires new causal checks, not relabeled historical passes:

- During dispatch, proposed properties, Signal reads and FormData agree; owned cancellation restores the captured state together.
- Explicit equal/different author writes and accepted nested changes supersede outer rollback. Canceling an inner change alone preserves the outer transaction’s ability to roll back.
- Each real transition emits one cancelable `en-change`; equal transitions and author setters are silent, and the removed mode/request event are absent from supported API and examples.
- Revalidation after listeners can reject invalid proposals; destructive group, focus, draft and native overlay effects wait for settlement. Unexpected already-completed native close/hide reconciles silently.
- Native editing identity/composition/drafts survive cancellation. Native form reset uses its default baseline and outer-form cancellation; restoration and automatic initialization defaults are silent, including disabled/read-only cases. Preserve existing hydration native-edit adoption and listener ordering.
- Deferred consumers cancel before awaiting and ignore stale completions after subsequent actions, reset or disposal. Component rollback does not retract consumer side effects.

Use role/name/label and public API observations rather than shadow markup selectors. Add targeted native-platform contract assertions through DOM APIs when user-facing interactions alone cannot observe a necessary result, such as a submitted `FormData` value. Compare behavior across the family conventions so learning transfer is verifiable.

The historical shared-correction checkpoint at `5bd6459efff35c2aa8ea8dca3cc7ef4316292d9d` passed 42 structure cases in the three tested engines. It verified same-value author-write supersession during the former request phase, normal subsequent acceptance and the then-current controlled mode in accordion, accordion item, tabs, split view and splitter, plus maintained vertical LTR/RTL keyboard/pointer cases. Retain that receipt’s source identity and useful scenarios; it does not verify tentative `en-change` staging, rollback or the new lifecycle contract. [Tests](../packages/elements/src/accordion/tests/structures.spec.ts).

## 7. Developer and delivery integration

Prepare fresh consumer fixtures that install locally packed package artifacts, with their own dependency resolution and no workspace source aliases. Their outputs must demonstrate:

1. **Plain HTML/native ESM:** Serve published JavaScript through the documented, pinned import map; import one element and two related/unrelated elements; interact with them; inspect requested module URLs and actual registration. Every transitive bare import resolves. Selective imports must not load/register the full pattern inventory or duplicate intended shared dependencies.
2. **React, Vue, Svelte:** Compile a small consumer against each resolved current/previous support-line version. Render elements, supply object/boolean/string properties according to the documented bindings, slot content, observe custom events, cancel a tentative `en-change`, verify settled state, supply an authoritative property update, unmount/remount, and complete a reference interaction. Confirm public TypeScript declarations from the tarball. Add wrappers only where required by demonstrated integration behavior.
3. **SSR:** Execute a public component/pattern through the selected server integration; serve its actual response to a browser; inspect visible content and shadow styling before loading the client entry; then load client code and exercise behavior. Test immediate and delayed upgrade/adoption, inputs changed before upgrade when the supported contract permits them, repeated requests with distinct state, and hydration failures. Static first render and interactive readiness are separate results; this does not impose library-owned no-JS fallback support.
4. **Reusable layers:** Use each supported public style/state/template/interaction entry in a documented alternate composition and verify its promised contract. These tests supplement the owning element's browser tests.
5. **Documentation/machine access:** Execute generated examples as consumer fixtures; parse CEM against its schema and compare it with actual exposed contracts. For whichever programmatic interface is selected, perform discovery, retrieve an element's API, produce a small consumer from that information, and run it. A valid CEM alone is not proof the described API works.

The [October 2 consumer evidence audit](consumer-evidence-audit-2026-10-02.md)
maps these requirements to their actual fixture boundaries. Native ESM,
framework, selected SSR and the later metadata-driven small-consumer receipts
are distinct from the still-open reusable-layer and isolated generated-example
qualifications.

An all-catalog entry can mask missing child registration. The new packed native-ESM fixture imports only `define/split-view.js` and operates its nested splitter with keyboard/pointer on both axes. It also verifies class/catalog imports have no registration side effects, compatible registration is idempotent, parent/child conflicts fail before partial registration, and selecting the split-view catalog descriptor includes only its closure. Fifteen cases passed across the three current tested engines at the shared-correction checkpoint. The October 2 extension adds related split-view/splitter and unrelated split-view/checkbox imports: 21 native-ESM cases pass with exact request/import-map/served-asset evidence. The selected packed SSR integration adds held-client first paint, immediate adoption and actual hydration-module failure in both delivery modes; its 53 consumer cases pass with one native-registry capability skip. See the [dated receipt](../probes/consumer-contracts/verification-20261002.json). Preserve this isolated fixture for future changes; extend it to other composites instead of manually importing missing children. [Consumer contract and evidence format](../tooling/registration/README.md).

For SSR, distinguish scripts held and later released in one page from scripts suppressed in a separate context. Both can inspect real declarative shadow DOM, native text/control geometry and styling before application code, but neither alone certifies a JavaScript-disabled environment, early-input preservation or all hydration behavior. Record which resources were intercepted and confirm the application was not upgraded. Compare retained node/state where claiming adoption continuity, then perform usable keyboard/pointer/editing interactions. Native OS picker UI remains separate from setting a native input value through automation.

Capability-adoption experiments cover cross-shadow labels/descriptions/errors, form association and reset/submission, Reference Target, scoped registries, overlay theme inheritance, and proposed CSS function/mixin delivery. For an adopted capability, test the actual native path and any explicitly supported compatibility/polyfill path, including nested roots and multiple instances. Feature detection or a polyfill loading successfully is not sufficient evidence. Keep ordinary SSR distinct from scoped-registry rendering/hydration. Record unsupported browser/AT combinations and resolve consequences through the platform/accessibility plans before promising support.

Compare equivalent native-module and optionally optimized application delivery using the same scenario/data/environment. No-bundler consumption is a supported path; bundling is an application optimization choice. An import map does not by itself prefetch the graph, remove unused code, or guarantee good performance. [Native module delivery tradeoffs](https://v8.dev/features/modules#trade-offs-of-bundling-vs-shipping-unbundled-modules)

## 8. Environment, language, and accessibility matrix

Accepted coverage is broader than a single automated Cartesian product. Maintain a versioned support ledger mapping each promised condition to scenario evidence, engine versus actual product, exact versions, physical versus emulated device, and gaps. Proposed representative profiles must be labeled as proposals until selected and measured.

The [October 2 support ledger](support-coverage.md) now records this mapping and
the [machine-readable conditions](support-coverage.json). Qualification remains
incomplete: actual current/preceding browser-product breadth and broader
physical/manual checks remain distinct outstanding work. The October2 rolling
framework window is now qualified: current/preceding minor lines plus retained
major/EOL cohorts,300 browser passes and10 packed declaration compilations.
The October2 packed framework pass closes the fixed-cohort structural-consumption
gap with126 browser passes and seven independent type compilations. Historical
framework pins and current manifests differ; original receipts are not rewritten.

| Coverage obligation | Repeatable automation | Actual-environment evidence |
| --- | --- | --- |
| Android and iOS phones, portrait/landscape | Touch-oriented narrow/wide layouts, orientation transitions, viewport/scale settings | Named physical Android/iOS devices; browser, virtual keyboard, text editing, touch, zoom and AT behavior. |
| Android and iOS tablets, portrait/landscape | Tablet layouts and resizing, touch and external-keyboard scenarios | Named tablets and available input modes; orientation while a task is active. |
| Small/large laptops, landscape | Separate representative layouts, pointer/keyboard workflows | Named laptop/browser settings; display scaling and user preferences. |
| Large desktop displays, portrait/landscape, multiple monitors | Large/narrow-tall layouts and viewport changes | Move/resize ordinary browser windows across displays, record resolution/scaling; retain task/focus/selection. No synchronized multi-window app or cross-display placement architecture is implied. |
| Constrained smartphone connectivity through 4G and wired | Explicit repeatable network profiles; cold and warm delivery runs | Available real devices/connections with measured conditions. A label such as “4G” is insufficient to reproduce throughput, latency, or reliability. |
| Rolling current-minus-one browsers/frameworks | Pin supported automation projects and independent framework fixtures | Exact current and preceding support-line products/versions with date, using available isolated machines/VMs/manual paths; missing access stays visible. |

Resolve the exact meaning of each product's release line in the support ledger rather than assuming all products share one cadence. Playwright's bundled Chromium, Firefox, and WebKit are useful engine evidence, not proof of all named browser/OS versions. In particular, Playwright does not drive branded Safari or Firefox, and its WebKit may precede Safari releases. Keep actual Safari/iOS and other required product checks explicit. Lower-priority embedded webviews get capability notes, not unearned support claims. [Playwright browser coverage](https://playwright.dev/docs/browsers)

Initial translation catalog coverage: `pt-BR`, `zh-Hans`, `zh-Hant`, `cs`, `da`, `nl`, `en`, `fi`, `fr`, `de`, `it`, `ja`, `ko`, `nb`, `pl`, `ru`, `es`, `sv`, `tr`. Chinese scripts do not pick a country; Norwegian is Bokmål. RTL support does not add an unrequested translated-language catalog.

Run catalog/schema completeness checks for all 19 catalogs, then actually render each relevant message and representative control/state in every catalog. Cover long content, script/font coverage, truncation/wrapping, lang metadata, input editing, and accessible names. Use real mixed-direction test text with correct language metadata for RTL behavior and text isolation; test directional interactions per pattern, not by blindly reversing every key. Region-sensitive formatting uses an explicitly selected fixture locale distinct from translation catalog identity.

Use representative stress combinations for deeper journeys: text expansion, Turkish casing/search where relevant, CJK entry/composition, Cyrillic, both Chinese scripts, and RTL/mixed direction. Track which catalog received deep versus render-smoke evidence; do not present pairwise automation as all-combination coverage. A catalog/formatting change expands to its actual affected controls and flows.

Apply `plans/accessibility.md` for exact WCAG applicability and AT scenarios. The verification architecture must retain keyboard-only use, zoom/reflow, reduced motion, forced colors/contrast and other supported web preferences, screen-reader interactions, and manual workflow feedback. Record actual browser/OS/AT versions separately from engine projects. Run axe at named meaningful states, including errors and expanded controls, rather than at every render. Include the pinned axe version's applicable WCAG 2.0/2.1/2.2 A/AA rule tags; do not copy a documentation example limited to 2.1 and label it 2.2 coverage. Record unsupported rules as gaps. Automated audits cannot detect every accessibility problem. Manual readiness labels in the accessibility plan remain distinct from individual run outcomes. [Playwright accessibility guidance](https://playwright.dev/docs/accessibility-testing)

Lazy rendering, virtualization, loading strategies, and animation changes must preserve keyboard reachability, focused editing, reading/search semantics, and the documented announcement behavior. A faster result that breaks those contracts is a failed optimization.

Retain scoped native reproductions from this review:

- **WebKit fixed-host rem:** WebKit 26.6 did not update native `2rem` shadow text after the root font changed from 16px to 32px under a fixed 37px host font; light DOM updated. Keep the failed expectation/native comparison and exact artifact. This is not evidence of a browser-zoom failure. Retest newer WebKit and real Safari text-preference/zoom use before considering a library workaround.
- **Firefox select leading:** a plain native select reports computed `line-height: normal` even with explicit numeric leading. Check declared input leading, actual computed size/family, rendered block space and text containment; do not fabricate a numeric computed line height or relax unrelated controls.
- **Firefox emulated slotted touch:** a desktop Firefox 155 touch-emulation Reset failure also reproduced on a bare native shadow button with a slot; keyboard worked. Keep physical Firefox Android use and newer-engine retesting open. It is not a demonstrated physical-mobile failure.
- **Report screenshots:** the retained WebKit report screenshot was unavailable because screenshot preparation injected a style blocked by the unchanged report CSP. Preserve passing behavior checks and the missing visual result separately; do not weaken production CSP or label the visual result passed.

The earlier rating-label defect was found through actual accessible-name inspection despite zero axe findings. Keep explicit name/description, keyboard/focus and user-workflow checks alongside automated rules; an empty axe result is not full accessibility evidence.

## 9. Visual regression and baseline review

Use component-state captures for precise diffs and reference-workflow captures for assembled cohesion. Theme/token submissions also retain the full all-component sticker sheet and a documentation preview consuming the exact candidate artifacts. Avoid one enormous screenshot as the only evidence: index it by component, state, theme, locale/direction, preference, and display profile.

Readiness must include the intended application state, completed relevant component updates, resolved fonts/assets, and expected layout. Playwright screenshot assertions wait for two consecutive matching images, but that does not prove the intended content finished loading. Keep browser/OS/fonts/hardware mode/configuration consistent with the baseline. Store separate baselines for distinct environments. [Visual comparison requirements](https://playwright.dev/docs/test-snapshots)

Capture focus-visible, hover/active where relevant, open/closed, selected, disabled, busy, invalid, empty, populated, and long-content states according to the component's actual contract. Do not invent states for presentational elements. Include theme scopes at page root, arbitrary child root, a single component, and a focused application region; test sibling isolation and nested override behavior.

Treat screenshot-only masking, styles, animation control, and caret handling as declared inputs. They must not hide the part under review. Screenshot assertions disable animations by default; verify motion/transition usability separately and measure performance with normal intended runtime behavior. [Screenshot assertion options](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1)

Maintain distinct states:

| State | Meaning |
| --- | --- |
| Captured candidate | Reproducible image/demo linked to exact candidate artifacts; no review implied. |
| Compared | Expected/actual/diff generated under a recorded comparison configuration. |
| Review requested | Specific changes and relevant behavior/API context are available for inspection. |
| Reviewed disposition | Reviewer decision and feedback recorded for this exact candidate/baseline pair; unresolved findings remain visible. |
| Adopted baseline | An explicitly accepted reference for future comparisons, linked to the reviewed decision. |
| Superseded | Historical evidence retained; newer content requires its own relevant review. |

Baseline generation or `--update-snapshots` is not an approval. Never auto-promote all failing screenshots. New or intentionally changed screenshots need an explicit reviewed disposition under the eventual configured authority. Do not choose reviewer identities or a submission/storage service here. Thresholds and masks must be justified with observed renderer noise and sensitivity to meaningful changes; changing them creates a new comparison configuration and reviewable effect, not an automatic pass.

Old/new interactive demos use the accepted scoped-registry design. Verify nested components, constructors, definitions, style/state isolation, and action handling with both revisions loaded. Browser/Lit/SSR compatibility is a mandatory spike; unsupported results must be exposed and resolved, not silently replaced by a global-registry comparison. This review surface does not promise unrestricted production multiversion support.

## 10. Cache correctness

Keep separate cache layers, all optional accelerators with a valid uncached path:

| Cached object | Identity must include |
| --- | --- |
| Build/declaration/generated artifact | All source/dependency/configuration inputs, tool versions, relevant environment, generation command, output hashes. |
| Browser behavior/audit evidence | Artifact dependency closure, fixture/service data, test code, project configuration, browser/OS/device setup, preferences, locale/direction, and other relevant input identities. |
| Rendered screenshot | Those rendering inputs plus resolved theme/token overrides, fonts/assets, viewport/scale, readiness/capture options, animation/masking styles. |
| Comparison result | Candidate image identity, reviewed baseline image identity, comparison implementation/version and settings. |
| Review decision | Exact candidate, baseline, scope, and evidence identities; never transferable to changed content by cache inference. |

Record actual resolved dependency URLs and content versions when a fixture consumes import maps. Do not use mutable URL names, timestamps, branch names, or package versions alone as complete identities. Any nondeterministic or untracked external input makes that result ineligible for evidence reuse until it is controlled or included.

Token invalidation traverses aliases, coordinated derivations, theme scopes, and using recipes/components, including contrast pairs and state tokens. Font changes invalidate dependent layout/capture evidence. Runner/browser upgrades invalidate their environment-specific evidence. A new baseline can reuse a still-valid captured image but must recompute its comparison; it cannot reuse the previous verdict.

Write cache entries atomically after successful completion and integrity checks; interrupted runs cannot become hits. Cache a pass only with its complete evidence and selection receipt. Show misses/hits and originating evidence in the report. Preserve unresolved failures/review findings across retries and cache operations. Private local files are a workable initial storage implementation; storage portability must not change these contracts.

Test the selector/cache tools themselves with semantic fixtures: a shared-token alias change selects all dependents; an internal helper change reaches external public consumers; an unrelated private docs change stays focused; browser/threshold/baseline changes invalidate only the appropriate layer; unknown edges expand; interrupted/corrupt entries never pass. Compare planned selection against an uncached broad run when introducing or changing graph/cache logic, and at integration boundaries where an unexplained mismatch appears.

## 11. Initial performance measurement plan

Start by recording baselines, not by inventing a “fast” score. Use reproducible fixture data and normal runtime behavior; screenshot animation suppression, trace overhead, and heavyweight audit instrumentation must not contaminate timed runs. Keep diagnostic traces separate from minimally instrumented timing runs and state which was captured.

| Dimension | Initial experiments and recorded outputs |
| --- | --- |
| Developer setup/build | Clean dependency setup, package type check/build, a one-component incremental edit, token generation, focused verification, docs generation, and broad verification. Record cold/warm cache status, wall time, tool versions and machine state separately. |
| Published footprint | Tarball contents; raw/compressed JS/CSS/locale/font assets for one element, a family, and each reference composition; actual native-ESM request/dependency graph; unintended registrations and duplicate dependency URLs. Raw request count is diagnostic, not a quality score. |
| Browser loading | Cold and warm navigation; critical dependency discovery; first useful content; custom-element upgrade and first usable interaction; required fonts/styles; SSR response rendering and client adoption separately. |
| Interaction | Typing/composition, opening/closing overlays, keyboard traversal, direct/continuous setting changes, external application updates, theme/scope changes, and chat-control arrival. Measure input-to-visible-response and completion behavior; annotate long work and layout/paint costs where the engine exposes them. |
| Repeated use | Mount/use/remove/reconnect cycles, repeated updates, listener/signal-subscription cleanup, retained objects and trend investigation. Do not turn garbage-collection timing into a deterministic assertion or compare incompatible heap tools as one metric. |
| Token/admin work | Pure token-resolution cost versus CSS payload and browser style/layout/update cost; full scoped theme graphs; nested scopes; changing coordinated controls; final-edit fidelity after preview batching. Preserve focus, selection, validation, and usable feedback. |
| Application outcomes | Reference-workflow completion, rejection/correction behavior, readable/stable layout, and optional application-level Web Vitals with environment/sample context. Synthetic fixtures do not establish production field experience. |

Procedure for the first implemented vertical slice:

1. Record a small representative device/network/display profile set within the accepted phone-to-desktop coverage. Select available named hardware and exact throttling values explicitly in a measurement manifest. Hardware availability, actual CPU/memory, workload sizes, and detailed network parameters remain unmeasured choices; no budget is implied by “4G.”
2. Establish deterministic nominal and stress fixture datasets: form steps/fields, settings groups/controls, and chat entries/control insertions. Choose numeric sizes from the actual composition, then record them. Stress data is an experiment, not a new supported product limit.
3. Capture minimally instrumented cold/warm runs and repeated interactions on the same reference/candidate setup. Use repeated samples to reveal variability; report distributions, sample count, machine conditions, absolute values, and deltas. Do not promote a noisy one-off win or hide a regression in an average.
4. Diagnose large costs with browser tools, using traces to connect a user action to JavaScript/style/layout/paint/network work. Compare equivalent delivery strategies, including native modules and optional bundling/preloading, without assuming one is inherently faster. [Chrome runtime analysis](https://developer.chrome.com/docs/devtools/performance)
5. Add behavior-preserving optimization experiments only where evidence identifies a cost. Repeat the affected correctness/accessibility checks alongside timing. Keep importing one component independent of the complete catalog.
6. Propose initial regression tolerances and user-experience budgets from observed variability, accepted environments, and complete workflows. Record proposed versus adopted budgets separately. Until then report measurements/regressions as findings rather than claiming a budget pass.

Application-level Web Vitals describe loading, responsiveness, and stability; the library can influence them but cannot guarantee them independently of the host. Lighthouse navigation alone does not measure INP. Do not describe synthetic interaction timing as real-user field INP, or unavailable metrics as zero. Production telemetry requires a separately configured application-owned collection decision. [Web Vitals](https://web.dev/articles/vitals)

## 12. Review packet and release classification

Proposed private run artifacts:

| Artifact | Purpose |
| --- | --- |
| `run.json` and `selection.json` | Inputs/environment/outcomes and why each check was selected, reused, skipped, or unavailable. |
| `artifacts.json` | Package, map, font/style/locale, fixture, candidate-preview, and generated-output content identities. |
| `results.json`, local HTML report, failure traces | Functional/audit findings with reproducible steps; original failure and retry history. |
| Visual index plus expected/actual/diff images | Navigate component/state/theme/locale/profile differences without losing the complete sticker sheet. |
| `performance.json` plus optional diagnostic trace | Samples, scenario/environment, cold/warm distinction, measurements and proposed/adopted budget identity. |
| `compatibility.json` and manual QA records | Exact browser/OS/framework/AT/device coverage and pending gaps. |
| CEM diff, authored change record, old/new demo links | Public API and behavioral/style/accessibility impact; component ledger independent of package version. |
| Review dispositions and baseline manifest | Exact content reviewed, unresolved feedback, adopted reference identity, and history. |

Human QA prompts should ask for attempted task, expected result, actual result, impact, and reproducible environment, with scenario/version prefilled. Record confidence and access limits without converting a review acknowledgment into conformance or adoption.

CEM changes support version classification, but token names/types/defaults/aliases, derived finite size outputs, CSS exports/recipes, theme/override boundaries and native interaction behavior need supplementary contract records. A CEM-only semver verdict cannot classify these surfaces. Include resolved token graphs/output fixtures, before/after public consumer behavior and an authored compatibility rationale; changed defaults or alias boundaries need review even when names remain present. Private-markup changes can also alter accessibility, public CSS behavior, focus, events, or performance. Include those authored change records even if CEM is unchanged. Apply the accepted initial `0.x.y` policy: `x` carries major/breaking changes and may include deprecations; `y` carries minor/patch work. After stability, use standard `x.y.z`, with minor deprecations and major removals. Do not add a time-based deprecation window or infer stability from passing one suite.

Keep previews, screenshots, traces, manifests, and review data private initially. Verify access controls for the documentation/review environment before treating it as the private review channel. No public upload or account/service setup is part of this plan.

## 13. Implementation order and unresolved execution inputs

1. Extend the established packed native-ESM fixture and its artifact/scenario/coverage records as new public entry graphs arrive. Add pure tests only for meaningful state/resolver invariants.
2. Extend the four maintained resettable reference applications as new component families arrive. Add the public-contract, tentative-state/rollback, keyboard/audit, and representative visual evidence for each new family, and complete manual workflow acceptance.
3. Add packed framework/SSR consumers and verify current-minus-one support with the actual version ledger. Spike scoped-registry old/new review and relevant cross-shadow accessibility paths early.
4. Create candidate sticker sheets/docs and explicit baseline review. Start uncached; introduce graph selection and caching with tool correctness tests and a comparison against broad execution.
5. Collect initial loading/runtime/developer-cycle measurements; use the evidence to propose budgets and improve the slowest workflow steps without lowering coverage.
6. Assemble a complete evidence index at release boundaries, preserving gaps and unresolved feedback. Complete all planned supported coverage over the breadth phase; an unimplemented pattern remains unverified.

Near-term work is to complete manual review and broader environment verification of the four implemented deterministic workflows, retain the now-passing selective-entry/reentrant-write/vertical cases, and connect their complete manifests to the evidence tools. Do not restart established fixtures or claim that synthetic graph/cache tests prove the real dependency graph.

Execution needs concrete hardware/AT access, exact support-line versions, fixture sizes/network profiles, initial baseline images, and configured review/adoption authority. These are visible setup tasks or reviewable proposals, not fabricated measurements and not reasons to abandon independent implementation work. No cache provider, reviewer identity, external service, deadline, paid resource, or recurring execution has been selected.

Peer-review resolutions: Brad's architecture perspective confirmed packed-artifact consumer tests and transitive internal/public dependency tracking; shared template/controller tests cannot replace owning-element browser behavior. Léonie's accessibility perspective confirmed named-state audits, separate real-AT evidence, and preservation of focused editing/reading semantics under performance optimization. Jina's token perspective confirmed measuring static CSS delivery and token/admin resolution separately, with aliases/derivations/scopes and font behavior included in invalidation.

For screenshot investigations, distinguish main-thread layout readiness from completed browser painting. The API-controls review observed an incomplete Chromium raster tile in captures immediately following scroll; settled captures after both native and programmatic scrolling rendered correctly. Preserve first-frame evidence and confirm settled paint before adding component workarounds. The demo editors use an ordinary named scroll region with room for focus outlines, while the disclosure heading and operation status stay outside it.

### Reusable-layer qualification — 2 October 2026

The first [packed alternate-composition batch](../probes/reusable-layers/README.md) passes 48 cases across three pinned engines. It qualifies named scenarios for 12 primitive modules and three Lit style families, with isolated tarballs and strict declarations. The exhaustive export inventory keeps remaining entries and CSS delivery pending; this is not completion of §7.4 or the platform/manual matrix.

The [native content/navigation batch](../probes/native-recipes/README.md) extends §7.4 with eight more public entries:78 packed cases across both style delivery modes and39 original-owner cases pass. Full entry-by-entry qualification remains open; these receipts do not replace platform/manual evidence.

The [packed collection batch](../probes/collection-recipes/README.md) extends §7.4 with seven table/virtual-collection entries using the existing authored applications and 81 browser scenarios. Thirty of 110 inventoried entries now have named scenario receipts; this does not qualify every operation in those entries. Portable table CSS, independently generated examples, remaining layers and the separate platform/manual matrix remain open.

The [copied-example pass](../apps/docs/tests/README.md#copied-examples-as-packed-consumers)
extends §7.5a: 48 displayed gallery modules and all 11 complete API copies compile
against packed declarations. Eight actual source consumers execute in each of
three pinned engines without the docs runtime; two scoped-color controls are
separate authored fixtures. A duplicate tooltip-copy prelude was fixed. Remaining
generated-example behavior coverage, public-layer entries and platform/manual
requirements are still open; compilation alone does not close those obligations.

The [complete API copy batch](../apps/docs/tests/README.md#complete-api-copy-journeys)
adds native consumer journeys for the remaining nine complete API modules. All
eleven now have named scenarios in each pinned engine: 17 copied consumers per
engine including six gallery modules, with 59 modules compiling. Six browser
tests, strict core/docs types and 123 tooling integrity checks pass. This is
bounded behavior qualification, not the whole owning test matrix. Forty-two
gallery copies still need independent runtime journeys; remaining §7.4 entries
and platform/manual/separate-owner requirements remain open.

The [gallery form/application batch](../apps/docs/tests/README.md#gallery-form-and-application-journeys)
extends independent runtime coverage to 27 of 48 gallery copies. Together with
all eleven complete API copies, 38 copied modules execute per pinned engine;
15 browser tests pass and all 59 displayed modules compile. Strict core/docs
types and 123 integrity checks pass. Twenty-one gallery IDs remain explicitly
pending in the tested inventory. Existing public-layer, native Firefox comparison,
platform/manual and separate-owner requirements remain unfinished.

The [standalone presentation batch](../apps/docs/tests/README.md#standalone-presentation-and-theme-copies)
adds nine gallery consumers and fixes missing copy-owned layout/theme delivery.
Thirty-six of 48 gallery copies now have named journeys; all eleven complete API
copies retain theirs.47 modules execute per engine and59 compile. The final33
browser cases include twelve original appearance regressions; three additional
density/identity cases pass. Fresh SSR build,
strict types,123 integrity and66 extended Node checks pass. Twelve gallery copies,
remaining §7.4 entries and the platform/manual/separate-owner requirements remain.

The [final displayed-gallery batch](../apps/docs/tests/README.md#remaining-gallery-navigation-and-content-copies)
completes the bounded copied-source inventory in §7.5a:48 gallery copies and11
complete API copies compile against packed declarations and execute native
consumer journeys in all three pinned engines.24 source tests pass; a fresh SSR
build, strict types and189 Node checks pass. Missing example-owned row layout and
hidden sorting-label styles are corrected. All actual stylesheet requests resolve
through public packed exports, without the docs runtime or stylesheet.

This closes the12 pending copies from the preceding checkpoint. It does not
replace owning matrices or close the80 remaining reusable public-layer entries,
native Firefox assertion comparison, physical/manual/Safari conditions or
separate-owner gates. Historical external CSS-authoring rerun remains retired.

The [packed projection batch](../probes/projection-recipes/README.md) qualifies
four further §7.4 entries in application-owned breadcrumb, default-slot navigation
and rich-label native-radio compositions.36 browser cases pass across three pinned
engines, with isolated public declarations and no delivered-element dependency.
The inventory now records34/110 entries with named scenarios;76 remain pending.
Client named/manual projection does not imply SSR/hydration or other descriptor
modes. The native Firefox assertion comparison and platform/manual/owner gates
remain open. The completed59-copy inventory is separate evidence.

The [packed form batch](../probes/form-recipes/README.md) adds six §7.4 entries:
form-child projection, file constraints, form-navigation and file-upload styles
in both module and portable CSS delivery.72 cases pass across three pinned
engines; isolated public declaration compilation also passes. Authored steps,
native validation links and native File/FormData transactions remain owned by the
consumer. Inventory coverage is40/110;70 entries remain pending. Synthetic drop
payloads do not qualify physical drag/drop, OS file choosers or manual AT. Existing
SSR, native Firefox comparison, platform and owner obligations remain distinct.

The [packed state batch](../probes/state-recipes/README.md) adds five §7.4 entries:
query, interval, collection-key and overflow helpers plus explicit registration.
48 three-engine cases and isolated public declarations pass. Actual lazy chunks,
pre-upgrade input retention, cached failures, native query/range interactions and
resize focus recovery are verified in application-owned consumers. Inventory is
45/110 with65 entries pending. Application evaluation/measurement/focus policy is
not attributed to the pure helpers. Physical/manual, SSR/scoped-registry and
remaining platform/owner requirements stay open.

### Native presentation consumers — 2026-10-02

See [presentation recipes](../probes/presentation-recipes/README.md) for the exact
14-entry scope,114 three-engine/dual-style cases,32 owning gallery regressions,
33 Node checks and fresh docs build. Explicit choice state now reconciles dirty
native checked properties without replacing nodes; omitted state remains native.
SSR true/false/omitted snapshots pass for checkboxes/radios. Public-entry progress
is59/110;51 remaining entries and the separate platform/manual/owner gates remain
open. The retired historical external CSS-authoring rerun remains retired, not passed.

### Native calendar consumers — 2026-10-02

[Calendar recipes](../probes/calendar-recipes/README.md) add three entries with120
three-engine/dual-style cases and39 Node checks. Native grid/date/range interaction,
FormData, bounds, step semantics, connected band geometry, localization, keyboard
focus and timezone behavior are exercised from packed public imports. Native
fractional-step differences and a WebKit CSS capability limit remain explicit.
62/110 entries are qualified for named scenarios;48 and platform/manual/owner
scope remain open. The historical CSS-authoring rerun stays retired, never passed.

### Native tree consumers — 2026-10-02

[Tree recipes](../probes/tree-recipes/README.md) add four public helper/style
entries with120 three-engine/dual-style cases and38 Node checks. Native hierarchy,
selection/focus, form data, move proposals and async load ownership are verified
from packed public imports.66/110 entries now have bounded receipts;44 remain.
This finite composition does not qualify owning-element virtualization, physical
touch, native AT, other OSs, retail Safari, full SSR/hydration or separate-owner
acceptance. Historical external CSS-authoring rerun remains retired, never passed.
