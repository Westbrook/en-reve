# Scoped registry benchmark preparation

The project now has an executable preparation lane for the scoped-registry adoption phases. It reuses the actual settings, sign-in and chat workflow controllers and templates, with a fixture-only native-registry adapter and a genuine global fallback.

Run it through `node showcases/performance/src/cli.mjs registry`. See [commands and methodology](../showcases/performance/REGISTRY.md), [the adoption plan](scoped-custom-element-registries.md), and [verification receipts](../artifacts/scoped-registry-benchmark/verification.json).

## Delivered

- Registry scaling across shared, grouped, per-workflow and per-element shadow-root ownership, with instance/registry/definition/constructor/DOM counts.
- Upgrade containment for connected, explicitly null-associated islands. Activating and using one island leaves its siblings dormant. Global fallback defers DOM instantiation.
- Lifecycle mount/use/dispose cycles with post-GC heap and DOM/listener checkpoints, stale-update detection and explicit retained-definition costs.
- Separate cold activation and prepared activation milestones, including chunk loading, definition, association, render readiness and semantic action completion.
- SSR fixtures with null-registry declarative shadow roots, focus and native-control preservation, duplicate detection, successful post-hydration actions and a separate JavaScript-disabled check.
- Explicit unsupported states, seeded serial matrices, immutable run IDs, source/build/harness receipts, retained failures and separate timing/retention lanes.
- Negative controls that deliberately pollute the global registry, escape an island boundary and duplicate an SSR input; all three must fail qualification.

The chat demo class now has a side-effect-free definition module. The existing docs wrapper still owns global registration, and the workflow page imports that wrapper explicitly. Source generation reads the full definition, includes its usage, and retains the documented standalone composed-editor route.

## Qualification

| Campaign | Passed | Unsupported | Failed |
| --- | ---: | ---: | ---: |
| Real workflows: activation, containment, SSR, disposal; global and native Chromium | 24 | 0 | 0 |
| Registry scaling: four ownership policies, one/four settings workflows | 10 | 0 | 0 |
| One-workflow light DOM: global and native | 2 | 0 | 0 |
| WebKit native/auto and Firefox auto/explicit-native | 9 | 3 | 0 |
| Settings retention: global/shared, native/shared, native/instance; 0/10/50/100 cycles | 3 | 0 | 0 |

Firefox's explicit-native cases are unsupported because the required native capability is absent; automatic global fallback passes. These are pinned installed test-engine observations, not a shipping-browser compatibility guarantee. Normal docs regression checks and unit/type/build results are recorded in the verification receipt.

The SSR assertion records original and resulting controls, allowing separately reported removal of marked slot fallbacks and virtual rows inside closed disclosures. The chat activity-history virtualizer legitimately removes three such initially hidden row actions. Primary native inputs and focus remain intact. Negative tests verify that preserving originals while adding duplicates still fails.

Failed fixture-development attempts remain available in `showcases/performance/runs/`; final campaign summaries, manifests and samples are copied into `artifacts/scoped-registry-benchmark/qualified-campaigns/`. The run directories also retain the exact generated HTML, bundles and source copies.

## Retention observations

In the one-run settings diagnostic, DOM nodes/listeners stabilize from cycle 10 through 100: global/shared has 2,060 nodes and 150 listeners; both native policies have 2,083 nodes and 150 listeners. No live workflow records or updates after disposal remain. JS heap still increases by approximately 0.8–0.9 MB between cycles 10 and 100 in all three cases. This does not establish either a leak or a leak-free implementation; repeat on a quiet host and inspect retaining paths if the slope persists. Cumulative registry/definition counters are not live-registry counts.

## Next phase gate

Before production adoption, preserve this eager/global reference, qualify the first production adapter against the same workflows, then collect at least 30 accepted timing samples per cell on a reference host. Compare both the fixed initial reference and previous phase, keeping browser/profile/cache/protocol identities compatible. Confirm material regressions independently.

The eager catalog currently imports the complete library. This lane makes no component-chunk savings claim, does not promote an automatic release baseline, and does not alter the shipped element base class. Per-component chunks, activation failure/retry, teardown during pending loads, richer pre-hydration form/draft/selection/composition state, movement between roots, physical devices and assistive-technology review remain later-phase work. The existing docs pre-hydration draft regression tests are retained as a separate correctness guard.
