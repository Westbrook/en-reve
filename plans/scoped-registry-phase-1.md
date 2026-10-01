# Phase 1 — eager native registry adoption

Implementation and verification are complete in the working tree. The full candidate and contemporaneous performance comparison are saved. This does not start the lazy-loading, complete factory audit or production scoped SSR phases.

## What changed

- `packages/elements/src/element-scope.ts` supplies a public `createElementScope({document, registry})` owner with registration, imperative creation, a Lit creation scope, shadow attachment, registry lookup/wait, initialization and detached upgrades. Automatic mode qualifies native behavior per realm and falls back to the owner's global registry; explicit incompatible registries fail.
- The capability check uses temporary scoped definitions. It tests ordinary-element and shadow association, parsing/upgrades, deep/shallow import options and the initialized-document alternative. It separately qualifies the optional dormant template parser. No module-level DOM access or permanent global probe definitions is introduced.
- `EnElement` carries actual ownership through nested shadow roots and Lit template imports. Existing roots remain authoritative in automatic mode, including global SSR roots. Explicit `getRenderRegistry()` and Lit `shadowRootOptions` are honored or diagnosed as conflicting. Deliberately null roots remain dormant, then switch their import context after explicit initialization. Closed roots are supported.
- Lit still creates the render root itself, sets render markers and adopts styles. `StaticStylesController` and hydration installation are unchanged. Registration delegates to the existing dependency-first preflight graph; parent readiness is not inferred from `whenDefined()`.
- New public exports, generated API/type metadata, browser fixtures, typed consumption examples and `packages/elements/SCOPED-REGISTRIES.md` describe eager consumption in ordinary and shadow trees.

## Deliberate Phase 1 choices

Existing `define/*` consumers and global hosts keep global internals. New explicit scopes select native operation wherever their construction path qualifies. Giving global hosts private render registries would split their current registration graph, so this optional optimization is not enabled. Explicit owners share a weakly cached import bridge; the base class never allocates a registry per instance and has no inherited class-definition cache to mix subclass versions.

A scope requires an explicit browser document. Imports are server-safe; detached/server documents without a window cannot silently borrow an unrelated global window. For future injected server ownership, use a separate contract rather than guessing a realm.

The production base supports a null root without turning it global. The internal dormant creation bridge is limited to inert HTML template fragments. There is no public lazy loader or activation scheduler yet. Global fallback still requires inert templates or delayed creation for independent activation.

## Verification

- New browser suite: 24 passed across Chromium/WebKit native and Firefox global fallback; six native-only Firefox cases explicitly skipped.
- Existing SSR suite: 78 browser checks, including native drafts, focus/selection, control identity, slots and style/minification behavior.
- SSR unit suite: 66 passed; benchmark unit suite: 23 passed.
- Elements and production docs builds, strict consumer/fixture type checks, server imports without a DOM, generated metadata and API verification.
- Real-workflow production-adapter qualification: 12 configurations passed, including per-element registry policy and scoped SSR fixtures.

Evidence lives in `artifacts/scoped-registry-phase-1/`. The [timing and retention comparison](http://127.0.0.1:4177/artifacts/scoped-registry-phase-1-performance-5d443e4378e3) records 1,170 successful timing samples, 15 retention runs and 240 contemporaneous overlap samples. The frozen reference passed its full checksum verification before and after replay. The first partial capture is retained separately as incomplete: a final compatibility review added explicit Lit shadow-root options and closed-root coverage before the campaign restarted.

## Benchmark transition

The benchmark retains its lifecycle counters and activation/containment/SSR fixture machinery. Actual library hosts now delegate shadow creation and Lit imports to the production adapter; the non-library demo wrapper retains its fixture adapter. Per-element policy requests a registry through the production base hook. The outer dormant workflow parser and SSR null-root preparation remain fixture-only.

The frozen Phase 0 reference is unchanged. Candidate runs preserve all 39 reference configuration keys, 30 timing samples per key and five separate repetitions of three retention keys. The runner's methodology label now states which adapter is being measured. Source/asset and harness hashes are retained. Registry counters describe the fixture policy allocations; temporary behavior-probe registries are not included in those allocation counters, but their execution cost is measured.

A separate contemporaneous overlap replays immutable reference/candidate CSR client bundles in randomized paired blocks with the same scenario/collector. Historical sessions use independent uncertainty estimates rather than pairing arbitrary block numbers. No performance improvement is required for this phase, and no pure browser-registry cost or field-performance claim is made.

## Repeatable checks

Run `npm run test:scoped-registries` for the build, typed consumption and three-engine registry checks. Existing SSR tests use `npm test -w @en-reve/ssr` and `npm run test:browser -w @en-reve/ssr`. Candidate protocol and comparison scripts are archived in `artifacts/scoped-registry-phase-1/`; run IDs are exclusive and must not be overwritten.

## Measured outcome

All 16 reported contemporaneous overlap intervals include zero difference. Scoped cold request-to-ready medians were 77.54 ms for the reference and 77.59 ms for the candidate. Historical cells include small positive shifts, including single-instance per-element scaling; these remain exploratory signals, not a universal improvement claim. Scoped retention adds five constant DOM nodes after warm-up, with flat node/listener counts through cycle 100. The existing roughly 0.77–0.87 MB post-warm-up heap growth remains visible in both versions and keeps retention diagnostics relevant.

## Next phase

Audit imperative factories and returned elements, starting with `toast-region.notify()`, then composite ownership, delayed authored children, framework creation, portals and document moves. Existing synchronous API contracts stay synchronous. Lazy module manifests, coordinated activation and production scoped SSR remain later phases as specified in the adoption plan.
