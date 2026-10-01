# Scoped registry consumer contract follow-up

Base: `66386af7daac295cb2e178236d45289a9ebced4f`, latest local `main` at task start.
Verified `git merge-base --is-ancestor 220d2dd3 main` succeeded; the full Phase 6 seal
is `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba`. Worktree:
`/Users/westbrook/.codex/worktrees/scoped-consumer-contracts/design-system`, branch
`codex/scoped-consumer-contracts`. The original dirty checkout is preserved.

## Scope and ownership

Own current `packages/elements/SCOPED-REGISTRIES.md` and the related SSR guidance.
Maintain executable consumer recipes in `probes/consumer-contracts` and isolated
receipts in `artifacts/scoped-followup-consumer-contracts`. Do not change component
runtime, public API declarations, Phase 0–6 snapshots, archives or prior results.
The color-family task confirmed central docs/loader/activation ownership stays here;
its candidate decisions do not become accepted APIs in these recipes. Family tasks
retain their implementations and family-specific documentation.

The original ignored `.progress-report/project.json` was used only as the locator.
Canonical handoff/open feedback were read from the existing independent report at
`http://127.0.0.1:4177`. This task appends its own iteration and
`handoff.scopedConsumerContracts` under `data/.project.lock`, preserving other
iterations, review checkpoints and unresolved feedback. No duplicate report or
external publication is authorized. Review is distinct from implementation completion.

## Audit and execution plan

1. Audit exports and real types against the central guide, SSR README, adoption
   plan, Phase 0–6 plans/boundaries, packed registry/lazy/activation tests and the
   production-registry / scoped-hydration production protocols. Weight 2.
2. Correct stale current guidance and provide compiled public recipes for ownership,
   creation, loading, readiness, cancellation, SSR ordering and rollback. Weight 3.
3. Build, check metadata/types and add focused production packed cases for gaps.
   Record exact tested engines, skipped native-only cells and every raw failure.
   Weight 3.
4. Deliver source/evidence commits and canonical handoff without merging. Weight 1.

## Findings and coverage boundary

| Contract | Existing coverage retained | Focused addition |
| --- | --- | --- |
| Scope creation and actual owner fallback | Phase 1 behavior probe / context cases | Packed ordinary and shadow Lit creation plus a separate iframe whose native constructor is unavailable |
| Authored children / moves / conflicts | Phase 2 late-owner and notify matrix | Direct-node authored child move preserves association; no global lookup fill-in; complete conflict preflight |
| Shared versus independent activation | Phase 4 controller matrix | Native group-wide upgrades, independent registry version, shared null islands and explicit nested initialization |
| Side-effect-free selective definitions | Phase 3 packed lazy suite | Production startup static closure plus observed requests; load registers nothing; toast hard dependency preserved; unrelated families absent |
| Readiness and lifetime | Existing cancellation and disconnection suites | `whenDefined` resolves while explicit readiness is blocked; cancel/retry retains materialized nodes; disposal rejects pending work |
| SSR bootstrap and edited input | Phase 5 hydration and manual evidence | Same packed module rendered in isolated workers then production-hydrated through public client API; original input, value, selection, focus, form entry and reset default |
| Renderer claims | Framework consumption / Phase 2 | Only documented Lit creationScope and direct Node append; no implicit framework adapter promise |

First graph qualification rejected a `lit` barrel import because it evaluated
LitElement in startup. The maintained standalone recipe uses `lit-html`; this is
an example correction, not a library runtime fix. Preserve the initial failure log.

The first browser attempt used the historical temporary browser path, whose
version directories existed but lacked executable files. Preserve that failed
attempt; use the actual installed default browser cache for qualification.

## Acceptance and comparability

No library runtime fix is promoted. Full builds, strict packed public declarations,
metadata/API/lazy/type checks and focused relevant browser cases are required.
No 30-sample campaign is needed for this docs/tests-only change; no latency,
retention, throughput, leak, byte-savings or cross-phase performance claim is made.
Production graph checks prove dependency boundaries, not a performance improvement.

Any future promoted runtime change requires matched exact-parent/candidate evidence
with at least 30 successful timing samples per affected configuration, separate
repeated retention, unchanged applicable budgets, all raw failures and separate
native/fallback/cache regimes. Historical comparability keys remain fixed. Any new
performance presentation needs sortable en-table comparisons and sign notes.

Exact tested versions and final outcomes belong in the verification receipt. Primary
platform statements were checked on 2026-09-24 against HTML, Lit API docs, Chrome's
scoped-registry announcement and WebKit's Safari 26.4 feature notes, linked from
the current central guide. Vendor availability does not replace library behavior
qualification; automated WebKit does not certify retail Safari.

Automated checks cover DOM identity, focus, selection and semantic controls. Actual
assistive-technology speech, physical devices, real IME, autofill and history/BFCache
were not newly reviewed here. Accepted Phase 5/6 manual behavior is unchanged and
is not reopened. The new optional-details demonstration has no manual AT acceptance.

## Review checkpoint

Inspect the central guide's ownership/readiness table, selective imports and SSR
bootstrap recipe alongside the focused test receipt. Confirm that native-only
isolation, fallback limits, rollback and manual-review limits remain explicit.
No approval to merge, publish, deploy or adopt a family task's API is inferred.

## Verified outcome

- Full workspace build passed (tokens/styles/primitives/elements, metadata, SSR,
  production Vite documentation and 53 isolated API examples).
- CEM freshness, public types, public API graph, literal lazy manifest and
  customization checks passed; generated tracked metadata is unchanged.
- Strict packed recipe/public-type checks and minified static graph assertions
  passed; five package integrities and all emitted JS hashes are recorded.
- Final isolated-output qualification: **38 browser passes, one native-only
  Firefox skip**, no retries/flaky cases. Chromium 153.0.8010.12 and automated
  WebKit 26.6 use native automatic scopes; Firefox 155.0 uses owner-document global
  fallback. Explicit global cases run on all three engines.
- Nine existing loader/request-isolated SSR Node tests passed. Preparation also
  verified concurrent packed SSR request data isolation and an untouched caller
  registry.
- No library runtime or frozen archive/snapshot changes. No new performance results.

Final evidence is `artifacts/scoped-followup-consumer-contracts/qualification/`;
its successful run also verifies the integration task's absolute
`EN_CONSUMER_CONTRACTS_OUT` override. Root-level browser receipts are earlier
qualification revisions. Missing-executable and WebKit pointer-focus failures,
including raw logs/traces, remain distinguishable from the final keyboard case.
The reporter originally placed JSON relative to its config; that path was corrected.
Earlier failing run logs/traces are retained, but their overwritten JSON summaries
are not represented as recovered artifacts.

The optional-details example cancels intent on a persisted page suspension and
only disposes on terminal pagehide. The hydration example retains its owner during
a persisted suspension. Synthetic persisted-pagehide tests verify this branch;
actual BFCache/navigation restoration remains unperformed coverage.

Integration-gates owns orchestration and resource serialization. The additive
consumer harness uses port 4257 and writes no Phase 0–6 output. Color-family audit
reported retaining its existing boundaries; no proposed family API was adopted.
The remaining work is source/evidence commit handoff and user review, not new runtime
implementation or manual requalification of accepted historical behavior.
