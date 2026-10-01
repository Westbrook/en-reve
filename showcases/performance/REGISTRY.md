# Scoped registry workflow laboratory

This lane exercises the actual docs settings, sign-in and chat controllers/templates. It prepares the adoption phases in [the plan](../../plans/scoped-custom-element-registries.md); the scoped adapter is experimental fixture code, not a change to the shipped element base class. The chat demo now exposes a side-effect-free definition; its existing docs entrypoint retains global registration.

## Run

Use the root workspace installation, the performance project's pinned dependencies and Node 26.10.0 Current (or the additional Node 24.21.0 LTS validation line). Install the selected Playwright browsers first. Every command builds current tokens/styles/primitives/elements/SSR before measurement, bundles the real workflows, and archives the generated HTML, browser assets, source hashes, source copies, harness and raw samples under a unique `runs/<id>/` directory. Runs are serial and use the same browser lock as the existing showcase harness. Keep complete run directories as CI artifacts; `runs/` is Git-ignored.

```sh
# Functional qualification: real actions, independent islands, SSR and disposal.
node showcases/performance/src/cli.mjs registry --scenarios activation,containment,ssr,lifecycle --workflows settings,sso,chat --checkpoints 0,1 --id registry-qualification

# Scaling: compare registry ownership at increasing workflow counts.
node showcases/performance/src/cli.mjs registry --scenarios scaling --workflows settings --policies shared,group,instance,element --counts 1,4,16 --group-size 4 --id registry-scaling

# Actual light-DOM ownership, independent of the outer shadow fixture.
node showcases/performance/src/cli.mjs registry --scenarios scaling --root-kind light --counts 1 --id registry-light-dom

# Native support and automatic global fallback. Unsupported native cases stay explicit.
node showcases/performance/src/cli.mjs registry --scenarios activation,containment,ssr --workflows sso --modes auto,scoped --browsers chromium,webkit,firefox --id registry-platforms

# Retention diagnostics: separate from primary timing, collection and samples.
node showcases/performance/src/cli.mjs registry --scenarios lifecycle --workflows settings --policies shared,instance --checkpoints 0,10,50,100 --id registry-retention

# Future phase timing campaign, after qualification on the reference host.
node showcases/performance/src/cli.mjs registry --scenarios activation,scaling --workflows settings --policies shared,instance --counts 1,4,16 --profiles desktop,mobile --caches cold,warm --samples 30 --id registry-phase-reference
```

Negative controls verify that the harness rejects accidental global registration, upgrades escaping an island, and duplicate SSR controls even when originals survive:

```sh
node showcases/performance/tests/registry-browser.mjs showcases/performance/runs/registry-qualification/fixture
```

The default is one exploratory sample per cell, settings, global/scoped, a shared registry, Chromium, desktop, cold cache. Modes are `global`, `scoped` (explicitly unsupported if capability checks fail), and `auto` (native when the fixture's required operations work, otherwise global). Global topology is always shared; there is no simulated per-instance global registry. Profiles requiring CDP are unsupported on other engines rather than mislabeled as throttled. Safari shipping releases and physical devices require separate qualification.

## Workloads and contracts

| Scenario | What it verifies and records |
| --- | --- |
| `activation` | A trusted button click starts dynamic imports, prepares a workflow, defines classes, associates DOM, renders, and reaches a frame opportunity. A real workflow action then succeeds. This is the cold first-use lane. |
| `scaling` | Activates all requested workflows. Records registry/definition/constructor/connect/disconnect counts, per-tag constructors, custom hosts, upgraded hosts and composed element counts. Shared, group, instance and per-element-shadow-root policies expose allocation costs. Cohort readiness includes automation round trips and is labeled an upper bound. |
| `containment` | Three connected islands begin dormant; activating and interacting with island 0 must leave 1 and 2 dormant, then activating 1 must leave 2 dormant. Native fixtures use explicit null association before `initialize()`. Global fallback delays DOM instantiation because global `define()` cannot isolate existing same-tag global nodes. |
| `lifecycle` | Repeatedly mounts, activates, performs a real action and disposes controllers and DOM. Checks no live workflow records or updates after disposal. Measures checkpoints after forced GC using Chromium heap/DOM/listener counters; other engines retain functional checks with unsupported memory fields. Timing collectors and retained milestone arrays are disabled/cleared. |
| `ssr` | Serves genuine library SSR with declarative shadow roots. Before activation, native controls/content must exist. Hydration must preserve authored control identity and focus without adding duplicate controls (removal of explicitly marked unused slot fallbacks and initially hidden virtual rows is recorded separately); a real action must work afterward. An additional JS-disabled context checks initial control visibility. |

Actions change and restore settings opacity, enter account data and advance sign-in, or send a chat draft and observe the message. These use accessible role/name selectors, so a missing or duplicated accessible control fails qualification. They are bounded smoke journeys, not the complete workflow accessibility suite.

Repeated workflows have separate outer shadow boundaries to isolate their authored IDs. `--root-kind light` supports one CSR workflow, exercising native per-element registry association without relying on an outer shadow root. SSR fixtures still cover nested declarative shadow roots. All four policies preserve the real components' own shadow roots.

## Milestones and receipts

Raw marks distinguish bootstrap, load request, runtime modules ready, workflow module ready, preparation, activation request, definitions ready, association, render completion, frame opportunity, trusted workflow input and semantic action completion. `request-to-ready` includes chunk loading only in `activation`; other scenarios intentionally prepare first. `module-load` measures the runtime import; the separately recorded workflow import and preparation marks complete the timeline. `whenDefined()` is never treated as rendered or usable readiness.

Reports contain distributions only for successful samples. Missing and unsupported values are null/explicit states, not zero. Errors retain a workflow snapshot; hung updates and scenarios have bounded timeouts. The manifest preserves seeded block order, exact browser versions in samples, profiles, source/asset fingerprints and SSR response byte identities. Feature-detected raw paint, LCP, layout shift, long task, long animation frame and Event Timing entries support diagnosis; these are bounded lab observations, not field INP or final page-lifetime Web Vitals. A frame opportunity is not evidence of compositor presentation.

Registry/definition counters are cumulative allocations, not live-object counts. Shared definitions intentionally remain loaded. Lifecycle slope suggests investigation; it does not prove a leak. Use heap snapshots/retaining paths in a separate diagnostic run when growth persists. No heap collection enters primary timing samples.

## Fixture boundaries

- The catalog is intentionally eager. Workflow modules are split, but importing the catalog still imports the library. These results establish adoption overhead and containment; they cannot demonstrate future component-level chunk savings.
- Instrumented subclasses count lifecycle events in both modes. Following Phase 1, library hosts use the production `EnElement` adapter; the non-library demo wrapper retains its fixture adapter. The frozen Phase 0 archive preserves the previous implementation. Production package publication and an uninstrumented overlap campaign remain separate gates.
- Lit hydration support loads before the dynamic runtime evaluates Lit. Creating a shadow root prematurely would make hydration support mistake fresh CSR for SSR.
- Dormant CSR templates use a fixture-local `creationScope.importNode` adapter that parses into an explicitly null-associated element. A plain inert document clone becomes globally associated on insertion. This adapter adds real preparation cost, measured by the activation lane, and is limited to these HTML workflow templates.
- SSR null-registry attributes are added only to known fixture-generated declarative shadow templates. `initialize()` is applied separately to existing nested shadow roots. This is not a production HTML rewriting strategy.
- No prototype patches, native API polyfill, automatic release baseline promotion, scheduled campaign or publishing is introduced.

## Between adoption phases

Run functional qualification first, then the same scaling cells and separate lifecycle checkpoints against both the fixed phase-zero reference and previous phase. Preserve counts, browser/build/harness identity and cache/profile conditions. For timing decisions collect at least 30 accepted samples per cell on a quiet reference machine; retain failures, require matching protocols and independently confirm a material regression. This lane intentionally has its own summary schema; the existing frozen-showcase `promote`/`check` commands do not accept it.

As adoption proceeds, extend this fixture rather than deleting the eager/global control: add component-level loading/failure recovery, visibility/intent activation, pending-action cancellation on teardown, pre-hydration draft/selection/composition and form-state preservation, route/overlay/portal movement, and real deployment SSR/cache behavior. None of those unmeasured journeys is covered by a passing smoke run.

## Frozen Phase 1 reference

The phase-zero capture plan is stored in `artifacts/scoped-registry-reference/campaign-plan.json` at the repository root. Its selected scope is the previously qualified desktop/cold matrix: 39 timing configurations with 30 samples each, plus three retention configurations with five independent repetitions at 0/10/50/100 cycles. Explicit native Firefox remains outside successful timing targets; its auto/global fallback is included.

The dedicated reference utility validates exact planned jobs, per-configuration sample counts, measurement presence, browser/source/harness consistency and complete retention checkpoints before freezing. It refuses to overwrite an existing reference. A completed reference includes complete run directories, exact HTML/assets/source receipts, workspace builds, dependency locks and a checksummed inventory with read-only data files.

```sh
# Run only after all lanes in the saved plan complete successfully.
node showcases/performance/src/registry-reference.mjs freeze artifacts/scoped-registry-reference/campaign-plan.json

# Verify the saved reference before using it in a Phase 1 comparison.
node showcases/performance/src/registry-reference.mjs verify showcases/performance/baselines/scoped-registry-phase-0-reference-v1
```

The [reference report](../../plans/scoped-registry-phase-0-reference.md) records final coverage, distributions, the external checksum seal and comparison limits. This baseline is separate from the frozen-showcase promotion schema.
