# Inspired theme validation selection — October 3, 2026

## Status and source binding

Most recent authoring-qualified candidate: `b7a2edd91a043c7ebaf379f6d3f1a37ea928ec23` in
`/private/tmp/en-reve-inspired-review-20261003`. This is a validation plan with
selected passing receipts; it is not a passing browser or full-library record.
Scope remains Spectrum, Fluent 2, Astryx, shadcn Rhea, Radix Themes and Web Awesome.
Chakra UI and Holotable recipes are excluded; shared owners keep their complete
selections.

[Metadata run 05](/private/tmp/en-inspired-metadata-before-20261003-05/provenance.json)
passed all five existing-artifact freshness checks before generation at this
commit. [Authoring run 04](/private/tmp/en-inspired-authoring-20261003-04/execution.json)
passed complete `tokens`, `semantic-types`, `primitives` and `extended-node`
pathways: 84 selected outcomes, 351 Node assertions (229 + 85 + 37), zero failures,
skips or cancellations, package/docs builds and both semantic scopes. Core 471
and docs 55 existing diagnostics remain with no additions/resolutions. This is
selected authoring coverage; `libraryComplete` remains false.

The complete [theme-refresh run 01 owner](/private/tmp/en-inspired-theme-refresh-20261003-01/command/receipt.json)
completed against this frozen source: 160 passed, 3 supported skips and 14 failed.
Twelve failures came from source-correct antialiased slider rims omitted by the
pixel classifier; one expected CSS material layer list lacked its final `none`;
one WebKit panel exhausted its whole-test budget without a failed value assertion.
The subsequent candidate corrects the two assertion defects, fixes the visually
reviewed poster composition and updates provenance. It does not alter timeouts.
Rendered fidelity, remaining browser owners, final union and full checkbox
qualification remain pending against those corrections.

### Historical selection notes

The original selection audit inspected `22439eda`; queued session 90929 was
canceled with SIGTERM and terminal cleanup before follow-up edits. No result is
attributed to that canceled run. The later fast run 03 at `98bed824` failed historical
support-ledger replay because ignored docs modules were absent. The committed
retention correction preserves exact historical bytes and original receipts,
without adding a docs build to `fast`. These events explain the plan's evolution
and are not current-candidate qualification. Earlier authoring/browser subsets
retain their original source identity and limits.

## Required preparation

1. Preserve metadata run 05's pre-generation freshness receipt. For any subsequent
   source change, check existing retained metadata before necessary regeneration;
   keep the API preflight before producers. Do not infer freshness from a rebuild.
2. Retain the committed visible-error Part contracts and complete lifecycle/SSR
   assertions. The advertised-Part fixture uses its adorned text-field state and
   retains every advertised Part; final browser results remain required.
3. Use fresh source/runtime identity and a non-existing evidence directory. Keep
   source frozen through each leased invocation. Existing servers, earlier
   checkout receipts or omitted producers do not count as current qualification.

## Bounded final selection

Run the complete named pathways together so canonical producers and assertion
owners execute once within the invocation:

```sh
EN_EXECUTION_OUTPUT=/absolute/new-inspired-final-run \
  tooling/test-pipeline/with-toolchain.sh npm run test:union -- \
  --pathways=fast,theme,api,semantic-types,lazy-delivery-regressions,primitives,extended-node
```

Do not add `--skip-build`, case-name filters or engine filters. The scheduler's
normal three-slot budget, lower owner limits, source identities and native facet
receipts remain authoritative. This is a complete selection of these named
pathways, not full-library `correctness` or a release attestation.

| Obligation | Owning pathway/configuration |
| --- | --- |
| Token authoring/compiler, companion roles, theme cascade, paint/composition, source fidelity and exported CSS | `theme`, including every token test and `apps/docs/tests/theme-refresh.config.ts` |
| Interval slider track, overlap/interaction and code/keycap font consumers | Full `packages/elements/src/patterns/tests/playwright.config.ts`, now included in `theme` and already in `lazy-delivery-regressions` |
| Single slider public fill/thumb hooks, native value synchronization and input behavior | Full `packages/elements/src/slider/tests/playwright.config.ts`, now included in `theme`; all three owning engines remain selected |
| Specialized ColorSlider ring/geometry, gradient, keyboard, forms and exact-value editing | Full `apps/docs/tests/theme-composition.config.ts`, now included in `theme`; complete `color-picker.spec.ts` and all nine related suites retain the configuration's existing engine/product policy |
| Rating source geometry, selected-star Part, shape and input behavior | Full `packages/elements/src/rating/tests/playwright.config.ts`, now included in `theme`; Chromium, Firefox and WebKit each retain pointer and touch projects |
| Disclosure presentation, structural layout and keyboard focus | Full `packages/elements/src/accordion/tests/playwright.config.ts`, now included in `theme`; both structures and tab-focus suites retain all three engines |
| Pure range value projection and native presentation synchronization contracts | Full `primitives` Node pathway, including `packages/primitives/tests/range-presentation.test.mjs` and primitive consumer types |
| Public Parts, contracts, events and synchronous transactions | `api`; `probes/api-contracts/playwright.config.ts`, `api-events`, `api-transactions` |
| Native text/search/textarea/number/select forms and visible validation | `lazy-delivery-regressions`: full `packages/elements/src/forms-private/tests/playwright.config.ts` |
| Combobox validity, editing, catalog and mobile feedback | `lazy-delivery-regressions`: complete desktop and mobile combobox configurations |
| Public form facade, defaults, reset and application error semantics | `lazy-delivery-regressions`: `probes/api-forms/playwright.config.ts` and metadata tests |
| Initial DSD, serialized form controls, pre-hydration editing and hydration preservation | `lazy-delivery-regressions`: complete SSR Node pathway and `packages/ssr/playwright.config.ts`, with owned minification preparation |
| Retained CEM/types/lazy/customization freshness and consumer declarations | `lazy-delivery-regressions` checks/producers and consumer types, plus `api` freshness preflight |
| Authored test/config/tooling and docs semantic types | Both phases of `semantic-types` |
| Shared document-theme ownership/order and other established Node consumers | Complete `extended-node`, including `apps/docs/tests/document-theme-ownership.test.ts` |
| Pathway, public-view, union scheduler and integration-group coverage assertions | Complete `fast`, including `tooling/testing/{pathways,public-views,comprehensive}.test.mjs` and `tooling/integration-gates/runner.test.mjs` |

The delivery regression pathway contains additional established registry,
hydration, packed-consumer and integration owners. Keep that supported pathway
intact; do not derive an undocumented passing subset from its individual tests.
The final selection includes `fast` explicitly: the other six pathways do not
transitively select the assertions that protect the expanded theme-owner graph.
Union run 08 was interrupted while waiting for the machine lease, before creating
an output directory or executing assertions, so the expanded selection uses a
fresh run rather than treating that queued attempt as evidence.
The complete `primitives` pathway is included for the new pure range helper;
the existing delivery regression selection includes all direct SSR Node tests,
including `packages/ssr/tests/slider-presentation.test.mjs`, and the full SSR
browser owner.
The complete `extended-node` pathway is required for shared document-theme
ownership/order. Optional `metadata-consumer` evidence does not substitute for
the owners listed above.

## Complete focused theme-review file

After a matching build, also run the documented complete focused file:

```sh
EN_EXECUTION_OUTPUT=/absolute/new-inspired-theme-review-run \
  tooling/test-pipeline/with-toolchain.sh npm run test:workflows -w @en-reve/docs -- theme-review.spec.ts
```

The command is documented in `apps/docs/tests/README.md`. Retain all configured
engines and every case in that file; record it as complete focused-file coverage
and subset evidence for the broader docs-workflows catalogue. The existing
`theme` pathway already selects the complete theme-refresh and theme-composition
owners. Use the official ownership/recorder and exclusive browser workflow.

## Additional complete choice owner

The current graph exposes the original checkbox/switch/radio choice suite only
through full `correctness`; it has no standalone public view or integration stage.
Its supported focused invocation is documented in
[`packages/elements/src/checkbox/README.md`](../../packages/elements/src/checkbox/README.md):

```sh
tooling/test-pipeline/with-toolchain.sh node node_modules/@playwright/test/cli.js \
  test --config packages/elements/src/checkbox/playwright.config.mjs
```

Run that entire configuration after the union using a fresh
`EN_TEST_PIPELINE_OUTPUT` and the repository's `exclusiveBrowserWork` helper in
`showcases/performance/src/lock.mjs`. The helper composes the official machine,
checkout and browser leases; do not run concurrently with another gate or bypass
an owner. Retain the exact command, source/build identity, native JSON/facet
reports and terminal status using the normal recorder. Chromium, Firefox and
WebKit remain selected by the owning configuration without filters. This verifies
choice transactions, fieldset disabling/reset, radio navigation and forced-color
behavior, together with the added visible-error lifecycle coverage.

## Durable selection correction

`tooling/testing/pathways.mjs` now includes the full slider, rating, accordion and
patterns owners plus the existing docs theme-composition owner in `theme`, so
both `test:theme` and union `--pathways=theme` retain the consumer regressions.
The explicit integration `theme` group includes the complete `theme-slider`,
`theme-rating`, `theme-accordion`, `theme-docs-composition` and existing `patterns` stages. Focused
graph/public-view/integration assertions ensure these selections
do not silently reduce to only the newly added file or one engine.

## Acceptance record still required

Record the final commit, exact commands, runtime identities, receipt paths,
executed engine/facet counts, explicit supported skips and any retained failures
in the review handoff after execution. Automated checks do not establish manual
assistive-technology coverage, proprietary font availability or user visual
acceptance. The current authoring/freshness receipts above were executed by the coordinator;
this selection audit itself ran no tests. Browser and final-union status must be
filled from terminal receipts, preserving the source identity of each result.
