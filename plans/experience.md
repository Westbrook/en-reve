# Documentation, reference experiences, and review plan

Current status (October 2, 2026): public API documentation, live examples and the
initial four-audience handbook are implemented, with seven skills spanning component authoring, testing, documentation, consumption,
application building and theming and a digest-linked machine contract index. See the
[documentation delivery checkpoint](documentation-skills-2026-10-02.md) for exact
scope and verification. Bounded packed consumers, copied examples and reusable
layers have separate receipts in the [consumer audit](consumer-evidence-audit-2026-10-02.md).
Physical/manual acceptance remains open in the [support ledger](support-coverage.md).
Portable exact-build offline candidate review is implemented in
[the offline review tooling](../tooling/offline-review/README.md). Managed
submission/adoption infrastructure remains separate; no service, authority or
adoption transport is selected here. [Interactive old/new release review](../tooling/releases/REVIEW.md)
now supplies exact paired builds, authored scenario mappings and version-bound
feedback. Actual acceptance and missing release evidence remain explicit.

### Historical implementation checkpoint

The following status is retained as historical context, not the current inventory.

Status: the private SSR sticker sheet and independent component-based report are delivered; five deterministic reference experiences (sign-in, settings, chat, project selection and asset browsing) are implemented on independent SSR Workflows pages. The CEM-driven API reference, live isolated examples and local single/paired Theme Review are delivered with scoped receipts; broader manual QA remains open. Complete four-audience documentation, managed proposal/adoption, old/new version review and broader workflow acceptance remain unfinished. The earlier revision-121 audit and later implementation checkpoints remain distinct. This plan does not select a submission service, approvers or adoption transport. The command family, child-authored selection, live child mutation and shared post-hydration stylesheet adoption are implemented with separate scoped receipts. Current integrated inventory is 46 tags, 36 specimens and 31 isolated API examples. Scoped asset/content, popup motion and SSR action-style decomposition are implemented with focused checks; mobile/API, five-theme and ten themed-asset checks pass; final local review is ready on edd09329014f. Broader list/file/empty/asset coverage remains partial. Earlier counts and receipts retain their historical scope.

## 1. Intended result and scope

Someone should be able to find a pattern, understand its behavior, try it, and reuse what they learned elsewhere in the library. A developer should be able to reproduce the demonstrated behavior using supported public imports. A designer should be able to see the consequences of a proposed token change across the system. An agent should be able to obtain a versioned description and working examples without interpreting screenshots or scraping prose.

The initial experience serves creativity, productivity, and collaboration tools, accommodates different levels of expertise, and supports regular use. It includes:

- Private documentation for all four agreed audiences, built around the pattern inventory and public API contracts.
- Five reference experiences for integration tests and manual QA: multi-step SSO-centric forms, creative-tool settings, chat-triggered contextual controls, project selection and asset browsing. They are delivered consuming applications; full workflow acceptance remains distinct.
- Managed token administration with individual and coordinated editing, candidate review, an all-component sticker sheet, and documentation using the candidate values.
- Component changelogs informed by CEM changes, paired with interactive old/new review.
- Concise feedback attached to an exact scenario or candidate version, including Playwright visual-regression evidence.

Authentication, chat delivery, LLM generation, collaboration synchronization, offline policy, and application business rules remain application-layer concerns. Reference experiences exercise their effects through explicit fixture adapters. They do not turn these services into library features. JavaScript is required for initial library use; consuming applications own loading-failure and no-JavaScript fallbacks. The sticker sheet now renders real component content on the server and hydrates it; broader framework/SSR integrations remain an implementation and validation target.

Names for public elements use `en-*`; package names use `@en-reve`. Exact package boundaries and event names follow the architecture plan. Internal component markup stays private. Documentation teaches public composition, slots, tokens, CSS Parts, and supported reusable imports.

## Delivery at the audit checkpoint

At audit checkpoint revision 121, the report records 44 accumulated feedback items resolved and review `0.1.0-review.0712fe49c62e` delivered. Package versions remain `0.1.0`; review fingerprints identify changed content. Resolution of these review items does not complete the broader system or establish user acceptance of all remaining work.

| Available now | What remains separate |
| --- | --- |
| Private SSR sticker sheet with real `en-*` preview controls, three densities, scoped theme previews, and consistent shared size/type roles | Complete searchable documentation and human/machine contracts for the full pattern inventory |
| Native code disclosures showing the executed example source, literal-tab indentation, lazy Microlighter Lit-template highlighting, and local resets for interactive specimens | Broader workflow usability, environment and manual assistive-technology acceptance |
| Password text-field, compound number-field, editable-slider, external-trigger overlays, color-field/swatch, and keyboard choice demonstrations | SSO provider integration, a creative-editor application, chat/LLM services, and collaboration backends are not library features |
| Independent Progress Report using a bundled snapshot of library components/tokens | Complete token-candidate administration/adoption and interactive old/new component review |

Use [review-session.md](./review-session.md) as the current cross-plan index. At the recorded revision-121 checkpoint, the complete login/settings/chat reference applications were unbuilt. They are now independent consuming modules and review pages. The initial combined page recorded 58 passing production-browser executions and separate eight-case async-core evidence; subsequent page-specific receipts retain their own artifact identities. Manual review and the broader support matrix remain distinct.

## 2. One documentation system, four useful entry paths

Do not put a persona-selection screen in front of content. Start with pattern discovery and direct access to the five reference workflows. On each pattern page, make the relevant sections independently linkable so an application can send its users directly to usage help and a developer can send a colleague directly to an event contract.

| Audience | Next useful action | Required content | Demonstration of usefulness |
| --- | --- | --- | --- |
| Application users | Understand and operate a pattern | Purpose; recognizable controls; pointer, touch, and keyboard use as applicable; state and feedback; recovery; relevant preferences and limitations | A reviewer can complete a task or resolve uncertainty using the usage section without reading implementation details |
| Developers | Import, compose, control, and customize a pattern | Runnable examples and complete public API documentation; state ownership; cancellation; slots; styling; reusable modules; framework and SSR recipes; integration responsibilities | A reviewer can reproduce and adapt an example through public APIs, then apply the same conventions to another pattern |
| Designers | Find existing parts and understand system-wide effects | Pattern vocabulary; compositions; token relationships and scopes; density and responsive behavior; default/derived/overridden values; supported customization surfaces | A reviewer can identify reusable parts and trace a candidate adjustment from its source rule to affected components and workflows |
| LLMs and agents | Retrieve an accurate versioned contract and working example | Whole CEM, package/export metadata, per-pattern authored behavior records, typed examples, dependency information, and current limitations | An integration can obtain the public contract and reproduce an example without relying on private markup or undocumented helpers |

### Proposed information architecture

- **Patterns:** task-oriented browsing with aliases and search; each entry identifies whether it is a custom element, a native recipe, or a composition. Preserve full inventory coverage without implying a separate custom element for every pattern.
- **Workflows:** the five runnable experiences, their source examples, and a small QA view for selecting reproducible conditions.
- **Design language:** tokens, relationships, component anatomy as an explanatory concept, composition, density, typography, nested surfaces, and customization scopes. Explanations of anatomy must not turn private DOM into a consumer contract.
- **Develop:** imports, registration, shared layers, application-owned interactions, form integration, events, localization, framework recipes, SSR, and tested import-map consumption.
- **Customize:** managed token editing and concrete previews, with access to the full token reference.
- **Changes:** component change history and linked old/new interaction reviews.

Proposed page paths are implementation details, not a new public URL commitment. Use stable pattern identifiers and section anchors; preserve useful deep links during subsequent navigation work.

Wide layouts may use navigation, main content, and a local outline. On small screens, retain the same labels and page identity while navigation moves into an accessible disclosure or drawer and the local outline becomes part of the document. Keep runnable examples and their explanations available without horizontal page scrolling. Code listings may scroll within their own region. Search is an aid, not the only way to discover a pattern.

## 3. Pattern records and executable examples

Use one versioned content record per inventory entry, with links to public source modules, CEM declarations when present, examples, relevant tokens, associated workflows, and validation evidence. Do not generate prose-only placeholder pages and label them implemented.

Every implemented pattern page supplies:

1. A short explanation of the task it supports and when a simpler existing pattern is sufficient.
2. A working default example and the minimum code needed to consume it through supported exports.
3. A human-readable contract covering attributes, properties, events, slots, CSS custom properties, CSS Parts, and supported shared imports as applicable. Record types, defaults, meaningful states, required relationships, and ownership.
4. Behavior documentation that explains actions, state transitions, focus, feedback, validation, asynchronous work, and cancellation where those concepts apply. A display-only pattern does not acquire artificial actions or events.
5. Customization examples for root, nested, region, and per-component use where applicable, including how independent overrides interact with coordinated rules.
6. A concise accessibility and internationalization section explaining intended behavior, consumer obligations, known limitations, and the environment/version of actual evidence.
7. Related patterns and complete workflows that demonstrate learning transfer.
8. Version-specific change notes and direct links to review examples when behavior or presentation changes.

Generate API facts from the same public declarations used for the CEM wherever supported. Author the behavioral explanation and examples alongside their owning pattern. CEM output does not replace explanations of user intent, async ownership, styling consequences, or accessibility behavior. A recipe has a composition contract rather than a fabricated component manifest entry.

Example source should be both executable and available to copy. Consume package exports instead of relative internal paths. Keep example setup explicit, including registration, theme setup, import maps, and framework adapter requirements. Demonstrate framework current-minus-one and SSR support according to the verified integration matrix; do not mark a combination supported because its static example exists.

The current programmatic delivery includes the generated whole CEM, its receipt, authored contracts and executable example assets. This satisfies the requested machine-access path without requiring an MCP server and a CLI at the same time. Add another interface only when a concrete retrieval or integration task demonstrates the need. The machine contract must expose maturity and limitations as clearly as the human documentation.

The required library-owned message scope is the 19 accepted catalogs, including Norwegian Bokmål, with independent RTL support; track actual catalog and linguistic-review completion separately. Reference cases exercise text expansion, mixed-direction content, labels, and appropriate locale metadata. RTL does not add an unrequested translated catalog. Do not label all documentation prose translated merely because component messages are available in those catalogs.

### Consumer-example conventions at this checkpoint

- **Code:** use native `<details><summary>` for each specimen's code, not an accordion component. Source comes from the same authored module that renders the example, preserving literal tabs, imports, bindings, and event handlers. Microlighter 2.1.0 loads on disclosure with the isolated local Lit TypeScript grammar for `html`/`svg`; source remains escaped text, not executed markup. Plain code remains readable without highlighting. The grammar is documentation tooling, with its limitations documented in `tooling/highlighting/README.md`.
- **Reset:** interactive specimens restore their declared initial state by replacing only the specimen content. Reset and code-disclosure controls remain outside that replacement; the user's open code, global preview settings, and neighboring specimens stay intact. Application-owned async fixtures cancel or ignore stale completions. A specimen reset is distinct from the four independently delivered reference applications.
- **External relationships:** popovers and tooltips use a literal `for` ID to a supported native button or `en-button` in the same Document/ShadowRoot, with no trigger slot. The button remains in application layout. `en-color-field` also accepts a supported external button/swatch through `for`; its labeled native field remains usable. IDs do not search through unrelated shadow roots. Dynamic binding, cleanup, accessible relationships, and focus recovery belong in the documented contract.
- **Names:** supported named label slots contain noninteractive phrasing and fall back to `label`; the real semantic control or surface receives its name. A trigger's action label, a popover/dialog title, and a field label are distinct responsibilities. Tooltip text is supplemental, not a replacement for an accessible trigger name or persistent essential help.
- **Choice:** appearance is a single-entry radio-style segmented group. Explicit option labels, selected state, ordinary arrow selection, and cancellation remain coherent; pointer activation within the options frame chooses the nearest option without creating another Tab stop. A disabled nearest option stays inert. Switches retain stable on/off labels.
- **Precision:** the password specimen demonstrates masked text with appropriate input metadata. The editable slider exposes two named native controls, range and exact-value editor, for one accepted numeric value and one form entry. Text drafts, completion, rejection, and accepted values remain distinct. These focused examples retain their own evidence; the separate sign-in and creative-settings workflows exercise consuming application tasks.
- **Navigation:** `en-navigation` now takes authored default-slotted native `<a>` children; its host keeps `label`, `sticky`, inherited `size` and only the `base` Part. Consumers own rich inline content, URLs, `aria-current`, `target`, `rel` and listeners, and style their native links. The element `.items` and item-type exports are removed; the pure `sectionNavigationTemplate` data recipe remains. Ordinary named default-slot CSR/DSD uses the existing Lit renderer without a mapping adapter. `en-breadcrumbs` separately takes direct native anchors/spans and owns private list/separator structure with `base`, `list`, `item` and `separator` Parts. Its verified automatic buffered SSR projection, reserved slot/plan metadata and unsupported `hidden="until-found"` contract remain unchanged. The pure `breadcrumbTemplate` recipe and native skip links remain available. Optional anchor alignment owns neither routing, focus nor history. The navigation migration passed its own scoped component and built-documentation checks; completed breadcrumb/earlier recipe receipts retain their original scope. Supported prior versions and manual AT acceptance remain open. [Navigation contracts](../packages/primitives/docs/navigation.md).
- **Layout:** top/bottom splitting uses `en-split-view orientation="vertical"` with a definite block size. Maintained LTR/RTL structure tests now cover vertical keyboard bounds and pointer-axis/release behavior; packed consumers operate both orientations. The prior both-axis probe remains attached to its original artifact. [Shared-correction checkpoint](./review-session.md#earlier-shared-audit-findings).
- **Visual continuity:** three densities change spacing independently of font size. Medium is the absent-attribute API/CSS default; inheritance is explicit. Comparable UI/input/strong-label metrics coordinate while retaining role overrides. Small control text stays at its readable base rather than shrinking automatically; medium shares that base, while geometry can differ. Rhythm, enlarged text, and text spacing must be checked as interacting dimensions.

The split-view selective-entry and same-value author-write findings are now corrected and verified in the scoped structure/packed-consumer checks. Catalog-wide demos still do not establish another component's selective registration or universal supersession behavior. [Platform contract](./platform.md).

## 4. Shared contract for reference experiences

Each reference experience is a small consuming application assembled from public library surfaces. Its fixture adapter owns application state, delays, failures and simulated external updates. Shared helpers remain documentation-application utilities, not new library services. The shared core's eight Node cases and the separate production-browser journeys have distinct evidence scopes.

Provide a separate, compact QA control area with:

- A named scenario, exact library/example version, and repeatable reset.
- A way to select the relevant outcome, such as immediate completion, a delayed response, rejection, or an externally supplied state change.
- Access to the source, task prompt, and feedback for that scenario.
- A clear disclosure that application responses are simulated. The fixture must never suggest that it authenticated a real account, contacted another user, or called an LLM.

Keep fixtures deterministic enough to reproduce an issue. Scenario controls should not compete with the next action inside the reference experience. Resetting a fixture resets its example state deliberately; changing a preview theme should not silently discard the task in progress. Cross-session persistence is not implied by preserving state within a running flow.

The user has adopted removal of `controlled` and `en-request-change`; reference consumers implement the [single cancelable `en-change` contract](./architecture.md#cancelable-state-changes-and-application-authority). During this event the public property, Signals and FormData already hold tentative proposed state. Synchronous cancellation rolls back only still-owned staging; explicit application writes, including equality, and accepted nested transactions win. No second committed event is emitted. Keep native editing drafts, settled application values and pending/results visibly distinct. Async consumers cancel before awaiting, guard stale completions and write accepted properties silently. Native form reset follows its baseline unless the application cancels the outer form reset event; restoration is authoritative and silent. Preserve documented hydration native-edit adoption. Pending, success and error feedback reflect real fixture/application outcomes, never merely a dispatched or canceled change. A rejected or stale result leaves a clear way to continue. The [current checkpoint](./review-session.md#current-event-api-migration-checkpoint) records completed component/core/SSR checks and the separately recorded completed documentation checks; retained workflow receipts keep their original scope.

Document intentional focus transitions when opening a modal, advancing a form step, or removing the currently focused control. Background or remote updates must not unexpectedly take focus. If an update removes the focused content, use a predictable surviving target and enough context to explain the transition. Focus stability does not mean prohibiting useful, deliberate movement.

Do not force generic action ceremony onto every keystroke. Validate continuous editing, composition input, discrete commands, and final commitment using their appropriate semantics. All input methods should reach the same supported outcomes without requiring an inaccessible shortcut or pointer gesture.

### Current implementation slice

The documentation provides independent static SSR pages: `workflows.html` for sign-in, `workflows/settings.html` for settings, `workflows/chat.html` for chat, `workflows/selection.html` for project selection and `workflows/assets.html` for asset browsing. Settings also has five focused scenario documents with direct review links. They share navigation, theme controls and the Progress Report return flag. Each entry imports and creates only its own workflow; fresh page loads begin with a local scenario, while browser history may restore a prior document. Validated theme, density and reading-direction values travel in navigation query parameters so review context survives a page change. Static SSR starts with default preview values, then applies those query values after hydration; no task or session storage is added. Existing `workflows#settings`/`#chat` links forward to the corresponding page while preserving the query. Independent `sso`, `settings`, `chat`, `selection` and `assets` modules under `apps/docs/src/workflows` separate domain data/validation, templates, styles and application coordination; SSO and settings also isolate their service adapters. Factories accept a render-update callback and expose render/reset/dispose; initial reads/templates must stay SSR-safe. Appearance changes must retain each active task. Scenario/timing/outcome/reset controls and manual task prompts sit outside the simulated application flow. [Shared factory and service contract](../apps/docs/src/workflows/shared/README.md).

| Implemented reference experience | Bounded task and recovery |
| --- | --- |
| SSO-style sign-in | Fictional account/workspace, provider choice, simulated pending/denied/expired/success result, validation, Back, Cancel and Retry with retained values. |
| Creative settings | Opacity with exact editing, format/layout/background settings, live local artwork, separate saved snapshot, save recovery and a staged incoming change resolved explicitly. |
| Contextual chat | Scripted conversation, retained multiline draft, send recovery and one authored contextual cover-opacity adjustment with stale-target protection. |
| Project selection | Finite project search/selection, validation and submission, with long-document and contained-scroll review surfaces. |
| Asset browsing | Native keyed list content, app-owned single radio selection and explicit hidden-selection recovery; broader file/list/empty/asset coverage remains partial. |

All service outcomes are local and deterministic. No real authentication, chat/model service, collaboration backend or output-file generation is supplied. Attachment UI is omitted from this slice, so the inventory attachment scenario remains unexercised. The initial combined-page run passed 58 executions across Chromium 153, Firefox 155 and WebKit 26.6, including pre-hydration input identity and actual submission. The maintained suite now targets independent pages; exact run counts and artifacts live in the report. Narrow-profile combinations are intentionally scoped in the runner; full 19-catalog linguistic review, current-minus-one environments, physical-device/input/AT acceptance and performance work remain open. Those initial workflow receipts predate the single-event migration. Later event, selection and documentation receipts verify their own affected consumers; do not relabel the initial run as current verification. Package versions remain unchanged.

## 5. Three initial task compositions

### A. Multi-step SSO-centric forms

**Reviewer task:** move through a sign-in-style sequence, handle a recoverable problem, and reach the fixture's completion state.

Proposed fixture content includes an account identifier, a choice or handoff relevant to SSO, a return/continuation state, and completion. Use fictional identities and provider labels. Do not connect an identity provider or request real credentials. The sequence demonstrates library form and interaction capabilities, not a production authentication design.

Observable operations:

- Understand the current step and next action from visible instructions and accessible names.
- Fill fields using normal editing, paste, and available browser assistance; navigate by keyboard and touch.
- Submit invalid data, find the explanation, reach the relevant field, correct it, and continue.
- Move back or cancel a step without an unexplained loss of information already entered within the flow.
- Encounter delayed or rejected continuation, understand the current state, and retry or choose another supported path.
- Reach a clear result without duplicate advancement from repeated activation.

Evaluate focus after deliberate step changes, error-summary relationships, field help, busy/result feedback, and responsive placement of progress and primary actions. Test the actual composition rather than a list of isolated field assertions. Browser assistance and assistive-technology evidence must be recorded as observed, not inferred from an attribute check. Record native autofill and password-manager limitations encountered in the fixture; successful simulated completion is not evidence of actual identity-provider integration.

### B. Creative-tool settings

**Reviewer task:** begin with useful defaults, adjust an ordinary property, make a more nuanced change, and return from an unwanted result using the available controls.

The sample edits a small, local creative artifact. It does not build an editor product or collaborative document backend. Use task groups with recognizable names. Additional detail may be disclosed where it is useful, but do not impose beginner/expert modes or hide a currently active non-default value without an indication.

Observable operations:

- Find a property by the language of the task rather than by token or implementation vocabulary.
- Use the default result without being forced through a customization sequence.
- Reach fine control and understand its effect, current value, and scope.
- Preview or commit a change according to a clearly documented interaction; do not make the sample's save policy appear to be a universal library policy.
- Recover using the sample's available reset/revert affordance, understanding which property or group it affects.
- Handle an app-supplied update during editing without unexplained focus movement or silent replacement of the user's work.

A simulated concurrent update exercises application authority, synchronous cancellation and truthful feedback. The chosen fixture conflict policy must be explicit in the developer example; it is not a library synchronization algorithm. Keep the relationship between a control and its visual result clear on narrow screens, at zoom, and with an on-screen keyboard.

### C. Chat-triggered contextual controls

**Reviewer task:** encounter a newly introduced concept, find its relevant controls, make a change, and resume the conversation or composition task.

Use a local scripted conversation. New controls are compositions of supported, authored building blocks associated with a message or contextual object. This does not require runtime code generation, a generic schema-rendering engine, an LLM API, or a chat service.

Observable operations:

- Understand why a capability is present, what object or concept it affects, and the currently available action.
- Discover and operate it through touch and keyboard without relying on hover or an automatic focus jump.
- Keep the conversation draft and reading position meaningful when a new control appears.
- Understand delayed, rejected, completed, or no-longer-applicable states in the selected fixture.
- Return from contextual controls to the prior task without an unexplained navigation or loss of draft.
- Apply a familiar value, action, validation, or feedback pattern learned in settings or forms.

Controls should stay associated with the relevant context. A narrow-screen arrangement may disclose details, but must preserve an obvious route to the capability. The composer must not cover task content at zoom or when a virtual keyboard is shown. Announcements should communicate useful changes without narrating every streamed update or interrupting typing.

## 6. Manual QA and meaningful automation

Provide short task prompts without prescribing every click. Let the reviewer reveal discoverability problems. Record the environment once per review session, then attach feedback to the exact example, scenario, package/token versions, and viewport or device context.

The basic feedback record is **task/action → expected result → observed result → impact**. Add an optional capture. Testers do not need to diagnose a WCAG criterion or complete a long compliance form.

Suggested prompts:

- Was the next action clear, and could you tell what changed?
- Could you find and operate the controls using your usual interaction method?
- Where did you hesitate, repeat work, or lose your place?
- Could you choose the amount of control you needed and recover from an unwanted result?
- Did learning one interaction help you use another?
- For developers, where did assembly or customization require guesswork, a workaround, or access to internals?

Manual QA will occur, but staffing and completed coverage must not be invented. Start assistive-technology work with screen readers and platform preferences as agreed, retaining visibility into decisions that may limit other technologies. Target WCAG 2.2 AA and the agreed rolling current-minus-one support policy. Separate a known failure, an untested combination, and a successful observation.

Coverage includes the accepted Android/iOS phone and tablet orientations, small and large landscape laptops, large portrait/landscape desktop displays, multiple-monitor usage, and 4G through wired conditions. Follow the accessibility and performance plans for representative combinations and measured workloads. A resized desktop viewport is not evidence that a physical device or screen reader was tested.

Playwright exercises the same supported public surfaces as a consumer: operate controls, complete tasks, observe meaningful results, and verify recovery and state ownership. Add focused component contract tests where appropriate. Do not substitute regex checks of prose, source-string matching, or snapshots of serialized markup for usable behavior. Visual regression is complementary evidence; it cannot establish keyboard operation, understandable content, or assistive-technology success.

For learning transfer, have a reviewer or integration exercise perform the same concept in two different compositions without separate component-specific instructions. Record where shared vocabulary, state ownership, and styling conventions hold and where exceptions require explanation.

## 7. Managed token administration

The admin's primary task is to prepare an understandable change for review. Code remains the source of truth. Library defaults and named themes are library-owned; consuming teams review their customizations. Constrained controls improve guidance but do not guarantee a sound or accessible result.

Proposed flow, within one working surface where possible:

1. **Find a rule or system control.** Browse by intent, search a token, or follow a component's relevant-token link. Identify the current theme scope and whether a value comes from a source/coordinated input, a derived role, or an explicit pinned override in the code-owned DTCG graph.
2. **Edit with managed controls.** Use type-appropriate allowed options, references, or bounded inputs defined by the token model. Coordinated controls may derive accents, rhythm, or other related values while preserving access to individual customization. Code remains the route beyond the managed option space.
3. **Understand the effect.** Show the candidate value, its provenance, affected values, and explicit pins. A coordinated edit changes unpinned descendants and leaves pinned values intact. **Restore derived** removes a pin and reveals the current derived value; it does not restore an outdated snapshot. The token plan owns exact derivation and precedence rules.
4. **Try the candidate.** Preview a focused component, a relevant workflow, and representative theme scopes without leaving the draft behind.
5. **Prepare review.** Produce a versioned candidate with an explicit base and diff, linked all-component sticker sheet, full candidate documentation, validation results, and known gaps.
6. **Submit and adopt through a configured process.** Begin with a proposed downloadable immutable candidate bundle: base/candidate source hashes, source patch or full tokens, compiled CSS, and dependency/evidence manifests. This makes the result reviewable without selecting a remote service. Submission transport, storage, roles, and adoption authority are a separate concrete workflow proposal. Until configured and approved, a draft or exported candidate must not be labeled submitted or adopted.

All token values are discoverable. Managed editing coverage must be defined for each token type; the admin must not silently exclude tokens that do not fit an early color/spacing interface. State clearly when a value is derived and how a granular override changes its relationship to a coordinated control.

A wide layout may show token navigation, editing, and preview together. On a phone, explicit Edit and Preview views may share the same draft, selected token, scope, and current example state. Keep a useful affected-value/status summary beside editing so every adjustment does not require a screen switch. Returning from Preview restores the editing context. Reset/revert actions identify their scope and effect before activation.

Show draft status in plain language. Unsaved editing, a prepared candidate, feedback received, reviewed content, accepted change, and adopted code are distinct states. Review acknowledgement is not adoption or publication. Editing an already reviewed candidate creates a new reviewable version while retaining prior feedback against its original version.

## 8. Candidate sticker sheet, documentation, and visual evidence

Every token/theme candidate gets both the complete inventory review surface and documentation consuming the same candidate values. A focused affected-component view helps review, but does not replace the requested full sheet. Include default, interactive, validation, dense, nested, responsive, and other relevant states according to each pattern's authored case list.

The complete sheet may be divided into accessible sections for performance and navigation. Display the planned/rendered case count and any failures so omitted cases cannot look like full coverage. Cases loaded on demand must be explicitly exercised for full-sheet automation. Do not substitute static pictures for the ability to operate a relevant example.

Candidate documentation includes its own navigation, typography, forms, and example compositions under the proposed theme, exposing effects beyond isolated components. Demonstrate page-root, nested-root, region, and individual overrides without allowing one case's CSS, state, or registry to contaminate another. Candidate previews must not silently change the accepted documentation theme.

Review entry points show the base/candidate identity, what changed, affected patterns, validation summary, unresolved feedback, and direct links to a useful comparison. Keep machine receipts and detailed logs available through disclosure rather than making them the main task.

Playwright visual evidence links expected, actual, and difference captures to the exact case and candidate. Record comparison environment and cache identity under the performance plan. Cache hits are valid evidence only for matching rendering/comparison inputs; token dependency changes invalidate affected cases. Review or adoption changes do not silently promote visual baselines. Missing evidence is shown as missing, not passed.

The review must distinguish mechanical differences, intentional design changes, unexpected regressions, and unassessed consequences. Screenshots alone do not approve a theme. Official theme checks and consuming-team responsibility follow the accepted ownership policy.

Implementation checkpoint (2026-10-03): [generated source impact mapping](impact-mapping-2026-10-03.md)
now describes all 96 components, 59 authored sheet specimens and six workflows.
Unknown dependencies expand conservatively; broad computed-style checks qualify
three representative runtime overrides. The full sheet has been reconciled with
the authored catalogue. Candidate-facing affected views now bind the graph to the exact build and show
both paired appearances; all 59 gallery and 11 complete API copies have independent
packed-consumer journeys. Version-bound visual captures and their verified reader
remain open in [the delivery plan](candidate-visual-evidence-2026-10-03.md).

## 9. CEM-informed changelogs and interactive old/new review

Each component change page links a human explanation to machine-detected API differences and any behavioral, style, or accessibility changes that the manifest cannot express. Explain the trigger and resulting behavior, affected public surfaces, consumer action if needed, and the actual evidence available.

Pair the changelog with independently operable old and new examples using version-specific modules and scoped custom-element registries, subject to the platform integration verification in the platform plan. Each pane owns its interaction state. A shared scenario selector can reset both to equivalent starting conditions without mirroring every action or masking divergent behavior.

Label the versions and focusable regions clearly. On a small screen, stack or switch between labeled versions while preserving task state and making the compared version unmistakable. Static diffs remain useful supplementary evidence; they must not be presented as fulfillment of the required interactive coexistence review if scoped-registry support is blocked.

Provide a direct way to review the documented change, an unchanged reference behavior, and the related workflow when affected. Token/theme changes also link to their full sheet and candidate docs. Evidence is attached to an immutable candidate identity; changes require new evidence or a documented valid cache result.

Apply the accepted release policy accurately:

- Before stability, use `0.x.y`: increment `x` for major/breaking changes and releases that may contain deprecations; increment `y` for minor/patch changes.
- Move to `1.0.0` when the agreed stable-readiness evidence is met.
- After stability, deprecations belong in minor releases and removals in major releases.
- Do not add an invented minimum deprecation duration. CEM schema versions, component/package versions, and candidate IDs are separate concepts.

CEM comparison informs release classification; it does not independently decide whether a behavioral or styling change is breaking. A reviewer should be able to see the reason for classification and reproduce the relevant change. Package coupling, actual maintainer ownership, and submission/adoption mechanics follow their respective concrete proposals.

## 10. Delivery boundaries and independent progress reporting

Documentation and packages remain private. The current sticker sheet is delivered through the existing private Sites configuration; future publication or a new access configuration still requires its own verification. This plan does not publish anything or select future public distribution. MIT licensing does not change the access policy.

Keep documentation content, examples, fixture adapters, generated API artifacts, visual cases, and review UI separable enough for focused changes and validation. Reuse the same example definitions in documentation, integration tests, and candidate review; do not create a second hidden implementation to make tests pass. Derive affected checks from these real dependencies, retaining full cross-system checks for changes that warrant them.

The independent progress report remains outside the documentation application and its production bundle. It now consumes a bundled snapshot of library tokens and `en-button`, `en-textarea`, `en-search-input`, `en-progress-bar`, `en-badge`, `en-card`, and `en-accordion-item`. Its own server, persisted state, versioned bundle receipt, and last usable snapshot remain independent of the docs server and live checkout. Native headings, links, tables, and the burndown SVG retain their document semantics. Using library components does not merge the report into the application runtime. Links from that report to an app/example carry the `?progress-report` presence flag, preserving other query parameters and fragments. Only that Developer UI view exposes a small accessible return link to the trusted project report; ordinary documentation navigation does not include it. The flag is not permission to administer tokens, submit proposals, or adopt changes.

## 11. Implementation order and completion evidence

The bounded Fluent selected-radio contrast role, quiet persistent combobox
no-room feedback and API example element controls are implemented with scoped
verification. At that checkpoint, controls provided 249 scalar/enum descriptors
for 39 authored targets across 26 example documents: public writes stay silent, readback
reflects settled state, and Reset restores the authored specimen while preserving
appearance/density. Original source remains exact, and unsupported composition-owned
or rich properties have explicit reasons. The [follow-up receipt](../artifacts/review-followups-controls/verification.json)
records the exact build and checks; it does not establish complete documentation
or manual acceptance. The following dated authorization supersedes the earlier
proposed, unstarted menu-and-toolbar slice; that earlier receipt does not verify
its new command behavior.

### Authorized command family — 2026-09-10

Source and documentation integration are implemented for `dropdown-menu`,
`button-group` and `command-palette`: `en-menu`, `en-menu-item`, `en-toolbar` and
`en-command-palette`. The same command patterns appear in the
operable sticker-sheet composition, exact source disclosure/Reset, isolated API
demo and creative-settings workflow. That command-family source snapshot includes 44 tags,
32 specimens and 27 isolated API example documents. The four inspired light/dark
pairs consume the existing shared styling hooks; no new theme token, pattern ID,
delivery kind or package version is introduced.

The [command-family receipt](../artifacts/command-family/verification.json) records
the exact source/build, scoped verification and publication identity. These
checks do not establish user acceptance or broader environment support. The
[menu](../packages/elements/src/menu/README.md), [menu item](../packages/elements/src/menu-item/README.md),
[toolbar](../packages/elements/src/toolbar/README.md) and [palette](../packages/elements/src/command-palette/README.md)
guides describe the integrated public contracts.

The first menu is slot-first and one level deep, with external same-tree `for`
triggering and discoverable, arrow-focusable disabled items that cannot activate.
The button-only toolbar skips disabled/loading buttons and owns a single Tab
entry plus axis/RTL-aware arrows and Home/End; ordinary button groups retain
native Tab behavior. The palette uses a finite data catalog with unique action
IDs, text labels, optional keywords, disabled state and display-only shortcut
hints. Its modal dialog and native editable combobox/listbox keep same-shadow
relationships; query and active candidate are not a selected value or form state.
Provide a visible Search commands affordance. Registering optional application
shortcuts does not belong to the component catalog.

Use the existing single synchronous cancelable `en-action` for stateless command
intent and the established cancelable `en-change` only for menu/palette boolean
open state. A menu item's action bubbles naturally without parent redispatch;
toolbar children keep native click handling. Neither action dispatch nor its
cancellation proves completion. The shared settings executor rechecks eligibility
for Save, Restore opacity, Cancel save and Review incoming, reports real fixture
pending/results and respects canceled action/closure. Sequence destination focus
after the actual close/update boundary. Shared option paint and focus mechanics
do not erase the distinct menu, toolbar, dialog and combobox semantics.

Verification must operate those public compositions and their recovery paths,
including late cancellation, equal author writes, stale/disabled command rejection,
focus return, IME, keyboard/touch/RTL, changing slots/catalogs/triggers, native form
non-submission, selective imports, SSR/hydration identity and narrow/themed bounds.
Theme changes must retain the current task. Earlier receipts stay historical;
manual AT, physical-device acceptance and installed-versus-supported engine scope
remain explicit. Follow the [canonical command-family checkpoint](./review-session.md#authorized-command-family-implementation--2026-09-10)
for superseding status and the new receipt when verified.

Submenus, checkable/radio menu modes, richer result renderers, remote/virtualized
search, automatic overflow and toolbar controls with competing arrow behavior
remain later work. No separate `en-button-group` is required merely for layout.

The remaining order favors broad, consistent contracts while exposing integration problems early. Preserve the delivered sticker sheet, library/report examples, and their evidence while extending them. The table describes completion criteria for the broader work, not a claim that each package is untouched or complete. It does not defer the requested inventory to an unspecified future release.

| Work package | Concrete output | Evidence before marking it complete |
| --- | --- | --- |
| Content and example contract | Pattern records aligned with the full inventory, API-generation boundary, authored behavior schema, stable identifiers, runnable-example format | Representative custom element, native recipe, and composition can use the format without false API fields or private imports |
| Documentation foundation and breadth | Private documentation shell, searchable/browsable inventory, linked public API and behavior pages, machine-readable artifacts | Each implemented inventory entry has accurate content and a runnable example; placeholders and unverified support are visibly distinct |
| Integrated journeys | Four public-API consuming applications with deterministic scenario adapters and task prompts | Reviewers and browser tests can complete, interrupt, recover, and reset the agreed tasks; application simulation is disclosed |
| State authority and responsive evidence | Cross-pattern editing/action/commit examples and agreed screen/input conditions | No generic event protocol hides differences in real editing; focus, state, results, and next actions remain understandable in representative contexts |
| Token administration and candidate review | Managed edits, coordinated/individual value explanations, exact candidate diff, full sheet, and candidate docs | A reviewer traces a change through its effects; all planned cases are accounted for; candidates remain separate from adopted code |
| Version review | CEM-informed change pages, independent old/new interaction, linked workflow and visual evidence | The actual compared versions can be operated without cross-contamination; the documented change is reproducible |
| Manual review and improvement | Concise feedback records, visible gaps, resolved findings with new evidence, improvements to example/tooling workflow | Findings link to affected versions and observable outcomes; reviewed, accepted, and completed states remain distinct |

Runtime contracts, token algorithms, scoped-registry delivery, accessibility combinations, and visual-cache mechanics follow the specialist plans. The integrated experiences provide the place to verify that those decisions work together.

## 12. Peer critique and remaining proposals

Dieter's responsive layout proposal is incorporated here: recognizable navigation, retained editing context, explicit narrow-screen preview access, and a concise effect summary. It must be tested for discoverability, not justified solely by fitting three panes onto a smaller display. Settings complexity follows tasks rather than imposed expertise modes. Chat controls retain context and avoid unsolicited focus changes.

Brad's decomposition and API work is evaluated through these complete tasks. Consistent public conventions should teach the next pattern, while preserving meaningful differences between input, selection, action, and commitment. Silent application assignments do not excuse silent user-facing consequences. Shared seams remain architecture decisions; the reference workflows do not imply new backend products or a universal dynamic renderer.

Léonie's review distinguishes deliberate focus transitions from unsolicited background movement, and actual application outcomes from canceled/deferred intent. Jina's review supplies the source/derived/pinned model, Restore derived behavior, and a local immutable candidate bundle as the initial review-transport proposal.

No unresolved product assumption prevents this implementation plan. The following remain explicit proposals before their dependent operations: submission/persistence transport, named review/adoption roles, package release coupling and the initial private package distribution mechanism. Managed token controls, the current documentation/workflow routes and exact-build local candidate transport are implemented; that does not settle remote submission or package distribution. Preparing and reviewing local artifacts can proceed independently. A submission or adoption flow must not claim to work until its chosen transport and authority are configured and verified.

Audit checkpoint: `.progress-report/project.json` points to the separate report. Revision 121 records all 44 accumulated feedback items resolved and no unresolved feedback at that checkpoint, with focused browser, SSR, typography, and report evidence. That historical planning synchronization changed no runtime code and ran no browser tests. That evidence does not establish full workflow, physical-device, screen-reader, or conformance completion. Keep that audit’s unfinished work distinct from later implementation checkpoints; the implemented event migration has its own scoped verification checkpoint, and complete documentation/admin/version review and manual workflow acceptance remain open. Use the current cross-plan index and canonical handoff for subsequent status.
