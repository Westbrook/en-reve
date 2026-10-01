# Scoped registry diagnostics follow-up

## Scope and decision

Deliver a small optional development observer and fixture, not a package API or product feature. No production source, export map, family pilot, shared loader or activation API changed. The existing public contracts suffice, so the coordination condition for shared API edits was not triggered; no messages were sent to other tasks or externally. Public-consumer and family-pilot contracts remain unchanged. Do not adopt any historical `scope.preload`, `scope.ready` or `scope.dispose` sketches.

Worktree: `/private/tmp/design-system-registry-diagnostics`, branch `codex/scoped-followup-registry-diagnostics`.

- Latest local main at task start: `66386af7daac295cb2e178236d45289a9ebced4f`.
- Base tree: `6f0cd79db801f483dd40b51885742580c951b8a0`.
- Verified ancestor: Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba`.
- Original dirty checkout and immutable Phase 0–6 plans, archives and evidence are untouched.
- No merge, publication, deployment, remote change or external message.

## Completed plan and API choices

1. Read personal rules, progress-report skill/contract, original locator, canonical handoff/open feedback, current SCOPED-REGISTRIES.md, element-scope/lazy-loader/activation exports, registration helper, capability/registration/ownership and loader/activation tests. Thirty unrelated unresolved report feedback items remain open. The report locator was used only to find the existing canonical report; no duplicate was created.
2. Add `probes/registry-diagnostics/diagnostics.ts` and an independent local fixture. Accept explicit scope, requested mode, roots, instances, declared tags, controller. Observe explicit synchronous/asynchronous operations without patching or wrapping manifests (manifest identity still governs core deduplication). Use existing `elementScopeCapabilities(scope.document)` to disclose behavior-qualified paths.
3. Validate bounded state, actual native/fallback behavior, owner documents, intentional nulls, definition conflicts, lifecycle, disabled import closure, optional overhead and released references. Present sortable `en-table` evidence with direction notes. Persist focused review and handoff in the canonical report using its shared `flock` and atomic replacement; preserve other tasks' state and user checkpoints.

Scope methods remain `register/createElement/attachShadow/initialize/get/whenDefined/upgrade`; loader methods are `load/ensure`; activation is a separate controller with state/error/load/activate/cancel/dispose. `observe`, `observeSync`, `snapshot`, `dispose` belong only to this development observer. It is not a generalized debugger or a registry inventory.

Snapshot milestones deliberately differ:

| Observation | Meaning / limit |
| --- | --- |
| Requested mode | Developer-supplied original intent: auto/global/explicit. |
| Actual mode and capability | Scope mode, native qualification, import path and optional dormant support from owner realm. |
| Root association | Scope/owner-global/other-registry/intentional-null/unavailable; current owner document and connection. No traversal. |
| Declared tags | Explicit bounded names, deduplicated; only these names are queried. Dependencies must be explicitly named. |
| Module fulfilled | The supplied operation resolved; no registration implied. |
| Definition available | Chosen registry currently returns a constructor. No upgrade/readiness guarantee. |
| Instance matches | Explicit supplied instance matches the scope constructor. Not proof of successful constructor execution or rendering. |
| Activation / readiness | Public controller state plus explicitly observed ready callback. Internal phases are unknown unless instrumented at an application boundary. |
| Failure / cancellation | Latest operation stage, bounded fixed guidance; original error propagated unchanged to caller. No serialized cause/message/stack. |

Ownership mismatch guidance directs developers to verify owner document, initial creation path and explicit roots. No global retry, rollback, unloading or live-tree rebinding is proposed. Unknowns remain unknown. No new core hook was needed.

## Conformance and build evidence

`artifacts/scoped-followup-registry-diagnostics/` contains build graphs, exact source hashes, browser outputs, raw samples, screenshots, limitations and rejected attempts. Node `24.16.0`, TypeScript `7.0.2`, esbuild `0.28.2`, Playwright `1.63.0`; library packages `0.1.0`, Lit `3.3.3`. Browser binaries: Chromium `153.0.8010.12`, Firefox `155.0`, WebKit `26.6`. Automated WebKit is not retail Safari qualification.

141 conformance assertions pass (48 Chromium, 45 Firefox, 48 WebKit): ordinary light DOM, shadow roots, load-only vs definition, duplicate/idempotent and conflicting constructors, alias preflight, explicit mode, actual global fallback, owning iframe realm, ownership mismatches, native dormant null roots and explicit null shadows, controller readiness/error/cancellation/disposal, input bounds, error privacy and concurrent completion ordering. Native-only null checks are explicitly unavailable in Firefox, not simulated passes. Existing historical tests that patch globals were read but not copied; new checks patch no DOM/customElements globals.

Strict TypeScript checks pass. Matched disabled entry built from exact git base sources is byte-identical to candidate (19,061 bytes). Its graph has no diagnostic module. Production package sources match base, and there is no package export for the probe. The development UI and comparison have their own bundles; `en-table` is loaded only for the comparison. This is source-bundled fixture qualification, not a new packed-package release campaign.

The original browser sandbox and unavailable-server attempts, initial type narrowing error, missing generated-input build, base path-comment mismatch, and URL assertion failure remain as raw logs. They were corrected and rerun, not treated as product failures or discarded. See `verification.json` for final receipts.

## Measurement boundaries

Production runtime did not change, so the conditional 30-successful-sample production campaign is not applicable. Existing Phase 0–6 budgets are unchanged and not reused for unrelated microbenchmarks. No historical workload subtraction or promotion claim.

Final fixture acquisition has 12 samples per engine × requested mode × enabled/disabled arm (144 samples). Cold setup measures a new realm's scope/capability/root/observer construction after JS import. Warm cost measures 500 awaited no-op module operations with optional observation plus snapshot after one warm-up. This isolates instrumentation; it does not measure network import latency, component activation or usable rendering. Explicit global mode incurs a diagnostic capability probe that ordinary explicit global construction skips. Native auto and forced-global paths remain separate from Firefox actual fallback. Both timing columns prefer lower values; positive enabled-minus-disabled delta is added cost. Coarse browser timers can report zero; this is not evidence of zero cost. No statistical significance or field performance claim.

An exploratory acquisition overlapped browser review checks; it is archived separately. The final acquisition runs without this task's other browser checks. The machine is shared and unrelated process activity is uncontrolled. Exact final asset hashes and timestamps accompany raw rows.

Separate Chromium retention: five runs per requested mode × enabled/disabled arm, 50 roots/scopes/controllers per run (20 runs). Application controller disposal and root removal precede observer disposal; disposed observers deliberately stay strongly held. GC occurs in separate protocol jobs before WeakRef reads. Zero surviving roots, scopes, controllers and diagnostic handles were observed. This is a bounded reference-retention check, not a heap-budget, module-unloading or cross-engine GC guarantee.

## Privacy, lifetime and interactions

Maximum 16 roots, 64 explicit instances, 128 declared tags (96 characters each) and four latest milestone slots. Weak references only; scalar snapshots; no subscriptions, timers, history growth, registry enumeration, page discovery, global patches, form reads, arbitrary error payloads or external telemetry. Disposal clears handles and milestone state. A late operation cannot repopulate a disposed observer. Caller-owned promises/closures may retain caller data while pending; diagnostics cannot cancel imports or release application-owned references.

The only changed interactions are local development controls and sortable evidence. Automated tests verify keyboard activation/focus retention, readiness success/failure/cancel/retry, disposal, sorting/aria-sort, narrow-screen horizontal containment and trusted report links in three engines. Screenshots were inspected. No actual assistive-technology speech, physical device/touch, IME, native picker, autofill or history/BFCache review was performed. Accepted manual Phase 0–6 review remains closed because product behavior is unchanged.

## Handoff

Review `http://127.0.0.1:4287/?progress-report` and its comparison. The report remains the existing independent `http://127.0.0.1:4177`; reads never mark content reviewed. The new review card is awaiting the user's review, not accepted. Restart with `node probes/registry-diagnostics/server.mjs` in this worktree; commands and API recipe are in `probes/registry-diagnostics/README.md`. Focused commits contain only this probe, plan and new artifact directory. No shared API integration is required.
