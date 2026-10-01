# Theme customization follow-up review

Reviewed September 18, 2026 against main `18d48a459dc801316ac881de26a2a04322c4ed05`, the published theme decision register, and the canonical project feedback. This preserves the original review. On September 19 the user authorized the bounded follow-up implementation, commits to main and incremental publication; current execution status is in the [decision register](https://en-reve-docs.reve-ai-0869.chatgpt.site/reviews/theme-customization?progress-report#theme-decisions).

**Conclusion:** the agreed THEME-01–08 implementation is delivered. Further work should be a bounded contract/metadata cleanup, validation improvements, and documentation reconciliation, owned by the existing API-06/API-07/API-10 tracks where applicable. A new foundational theme redesign is not supported by this review.

## Execution update — September 19, 2026

The user-authorized follow-up repairs are verified: color-slider label forwarding, picker/time-field metadata, rendered Parts reachability and independent reduced-motion coverage. `npm run test:theme` provides the aggregate runner. Full build, 193 Node tests, 271 browser scenarios and three-engine registration probes passed; two emulation skips remain. The [current register](https://en-reve-docs.reve-ai-0869.chatgpt.site/reviews/theme-customization?progress-report#theme-decisions) records publication and remaining manual work. The recommendations and original verification below are retained historical review evidence.

## What the recent changes resolved

**Validation clarification — September 19:** the historical recommendation below
for routine manual browser zoom is superseded. Playwright now covers 200%/400%
equivalent reflow and 200% relative-text enlargement across three themes, both
appearances and three engines, in LTR/RTL. Native browser UI zoom is a targeted
diagnostic; screen-reader output, physical devices and native high contrast remain
separate evidence. See the current register and verification receipt for results.

| Decision | Current implementation and disposition |
| --- | --- |
| THEME-01 | One customization registry drives reset classification, property-registration policy, managed metadata and source checks. The current check passes with 553 contracts and 16 reviewed annotation exceptions, not the original dead-hook findings. |
| THEME-02 | Family refinements precede shared defaults; ordinary buttons receive shared radius; segmented geometry stays local. The compatibility change has a migration guide. |
| THEME-03 | Six additive button rest/hover/pressed paint hooks are connected. Fields, options, focus and surfaces retain their separate semantics. |
| THEME-04 | Shadow-host appearance selectors, optional-hook clearing and dependency-aware patches are implemented. Exact partial selection remains a distinct operation. |
| THEME-05 | Twelve useful control/surface hooks have optional typed authoring and managed choices. Richer fonts/shadows retain the code route. |
| THEME-06 | Toolbar hooks, editor sizing/typography, option adoption, color target floors and scoped Part forwarding are repaired. Calendar range geometry remains intentionally specialized. |
| THEME-07 | The accepted CSS-source typography/surface recipes supersede the earlier retain-TypeScript pilot recommendation. Portable CSS, Lit and SSR consumption remain supported. |
| THEME-08 | Editorial, Precision and Studio provide three substantially different visual languages, both appearances, transfer examples and nested scope fixtures. This slice has recorded user acceptance. |

All eight are published. Publication, implementation completion and user review remain separate. The canonical report records acceptance of THEME-07 adoption and THEME-08; this review does not establish additional acceptance or resolve the user's open feedback.

Sources: [published register](https://en-reve-docs.reve-ai-0869.chatgpt.site/reviews/theme-customization?progress-report#theme-decisions), [decision source](https://en-reve-docs.reve-ai-0869.chatgpt.site/reviews/theme-customization/theme-decisions.md), [current coverage](https://en-reve-docs.reve-ai-0869.chatgpt.site/reviews/theme-customization/coverage.md), [composition contract](https://en-reve-docs.reve-ai-0869.chatgpt.site/reviews/theme-customization/theme-06-composition.md).

## Recommended work to plan

### 1. P2 — Finish the remaining public customization contract cleanup

**Owner:** API-06/API-10; one coordinated item, not duplicated under three findings.

- `en-color-slider` still advertises inherited `editor-label`, but replaces the slider editor branch and forwards only `control:editor,error:error`. Therefore `en-color-slider::part(editor-label)` cannot reach the promised surface. This is the remaining label half of FORMS-05/CSS-08/T9; THEME-06 fixed the error half. Prefer preserving the promise through an appropriate exposed label surface, or explicitly documenting a narrower subclass contract and correcting metadata. Do not blindly alias surfaces with different semantics.
- Complete small discoverability omissions in the same pass: the picker forwards `brightness` without listing it in its public Parts metadata, and time-field's per-component CSS annotations omit its working input-family hooks.
- Add rendered Parts reachability checks for conditional templates, subclass replacements and multi-level `exportparts`. The current registry checks lexical consumers and co-declared Parts, so its passing result does not prove this contract.

Evidence: `packages/elements/src/slider/index.ts:21`, `slider/template.ts:42–49`, `color-slider.ts:87–103`, `packages/elements/custom-elements.json:13479–13485`; `color-picker/element.ts:225`; `time-field/element.ts:18–19,137`; `packages/styles/src/controls.ts:33–36`; `tooling/customization/cem.mjs:20–27`. The API docs consume CEM through `apps/docs/src/api-reference/model.ts:85–88`.

Read-only SSR rendering confirms an editable slider has one `editor-label` Part, while the editable color slider has zero and exposes `control:editor,error:error` from its nested editor. This is a styling/metadata mismatch; label text and accessible naming are still supplied. No broader accessibility failure is inferred.

**Completion evidence:** direct external Part styling reaches the documented conditional surface, generated metadata matches actual reach, and existing error forwarding and accessible names remain intact.

### 2. P2 — Strengthen and complete theme verification

**Owner:** API-10 tooling plus the existing theme/accessibility validation work.

- Split reduced-motion verification from forced-colors verification. `apps/docs/tests/theme-proof.spec.ts:89–95` currently skips their combined case on WebKit because forced-colors emulation is unavailable; this also skips the independently testable reduced-motion/focus assertion.
- Provide a documented aggregate theme regression command or release check covering registry freshness, cascade, state paint, scopes, composition, authoring and proof. Those focused suites exist, but are currently reached through separate commands. This recommendation does not claim they were never run or that external CI is absent.
- Complete the explicitly remaining native-platform, screen-reader and actual browser-zoom checks in `theme-08-proof.md:64–69`. The automated 390px/root-text-enlargement check is useful but does not replace those checks. Keep Firefox touch and WebKit forced-colors emulation limits explicit.

**Completion evidence:** reduced motion runs in all three engines; forced-color limitations do not suppress independent checks; retained manual evidence states device/browser/assistive technology and version; the regression command is reproducible from a clean build.

### 3. P2 — Reconcile the audit with the delivered implementation

**Owner:** audit documentation and progress-report maintenance.

The decision table is current, but surrounding original audit sections still describe host-selector defects, unconnected hooks, the authoring pilot and three-theme proof as future work. They identify the original audited revision, but their present-tense findings can still be mistaken for a current backlog. The published overview and readiness section visibly exhibit this problem.

Add a compact finding-by-finding disposition: fixed with implementation/test links, intentionally retained, or still proposed with an owning API item. Preserve the original evidence behind a clear historical label. In particular, update `tooling/customization/README.md:27–35`, which still says the unsupported names and toolbar transfer are retained exceptions after their removal. Reconcile API-07's remaining scope before scheduling another blanket theme/sizing pass: this review found its cited theme repairs either implemented or deliberately specialized.

The 16 current annotation exceptions should not be presented as 16 runtime defects: most are CSS-only recipes without a corresponding custom element, with explicit reasons; the tab paint entries retain their own annotation disposition.

**Completion evidence:** someone reading any original finding can tell whether it is currently actionable and which existing task owns it. Preserve earlier user feedback and review checkpoints. Many open focus/motion and component notes already say implemented/awaiting recheck; they require review disposition rather than duplicated implementation.

### 4. P2 at the next package release — Carry compatibility notes forward

**Owner:** release coordination, triggered when a package release is prepared.

Include THEME-02's broad-pin precedence change and THEME-06's newly connected inherited input/option/typography pins in the breaking-change migration notes. Existing themes can render differently precisely because formerly disconnected hooks now work. See `theme-02-cascade-migration.md:3–9` and `theme-06-composition.md:13`.

Package version `0.1.0` is intentionally retained for the current private review iteration. No immediate version bump or package publication is recommended by this review.

## Optional capability backlog, only when a consumer needs it

- Typed Display-P3 across schema, serialization, recipes, diagnostics and fallbacks. Existing raw-CSS/color-control support is not typed theme round-trip support.
- Input-only radius/border or family elevation hooks, when repeated use justifies promotion beyond existing shared hooks and Parts.
- More CSS-authored families or a public authoring package. The accepted internal typography/surface migration is complete; a broader dialect needs explicit scoping and semantics.
- A live ancestor-aware scoped-theme controller or framework portal bridge. Current patches use a known effective base; actual reparenting uses destination theme boundaries.

These are new capabilities, not unfinished THEME-05/07/08 deliverables. Preserve the documented native select fallback, application font loading/content styling responsibilities, and specialized calendar/color anatomy.

## Verification and limits

- Inspected the live published register through the in-app browser and compared source/commit history through `18d48a4`.
- `node tooling/customization/verify.mjs --check`: **passed**, 553 contracts, 16 reviewed findings, zero failures.
- `node --test tooling/customization/customization.test.mjs packages/tokens/test/theme-patch.test.mjs`: **15 passed**.
- `node --test tooling/css-authoring/compiler.test.mjs tooling/theme-proof/themes.test.mjs packages/tokens/test/authoring.test.mjs`: **57 passed**, including CSS output parity and watch recovery.
- Read-only SSR probe reproduced the missing color-slider Part in existing built output; current source agrees.
- There are no tracked changes to the token package, style package or theme-proof implementation/tests between theme publication `0404b49` and reviewed HEAD. Later element/API changes were inspected for the concrete metadata findings above.
- This assessment did not rerun the complete browser matrix, perform a new native-device/screen-reader review, change product code, or publish updates. Node checks and the SSR probe used existing built package outputs. Prior browser counts in the implementation guides are retained historical evidence, not new executions.

Suggested next implementation slice: the remaining color-slider/metadata contract fixes plus Parts reachability coverage, then the narrowly scoped verification and documentation cleanup. Keep the optional capability backlog outside that slice.
