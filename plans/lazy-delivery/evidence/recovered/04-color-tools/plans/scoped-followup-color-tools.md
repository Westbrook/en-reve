# Color tools: boundary audit

## Base and scope

Base: latest local `main` at `66386af7daac295cb2e178236d45289a9ebced4f`.
`git merge-base --is-ancestor 220d2dd3 main` passed before creating the isolated
`codex/scoped-followup-color-tools` worktree. Original dirty checkout is untouched.
Frozen Phase 0–6 sources and evidence are read-only inputs, not comparison arms.

Audit first; select at most one worthwhile boundary or reject additional runtime
policy. No merge, publication or deployment. Canonical report is the existing
independent report at port 4177; this task owns only its color follow-up records.

## Predeclared decision gates (before measurements)

1. Useful immediate editing, accepted state, names and validation must remain.
   Native color-field showPicker must run synchronously in trusted activation.
2. A proposed unused state must occur in an actual caller. Usage probability is
   unknown without telemetry; source examples establish intent, not frequency.
   A permanently non-plane picker is not evidence that an immediate-plane editor
   would benefit from making its core controls asynchronous.
3. Minimum useful saving: 4,096 gzip bytes **or** 50 live nodes per unused instance,
   after keeping equivalent accessible editing. Recheck net saving including loader,
   status, controls and state-transfer costs. A graph subtraction without a working
   fallback is an upper bound, not a shipping candidate.
4. Any promoted runtime policy must retain all existing eager behavior and receive
   >=30 successful timing samples in every affected configuration, plus five
   separate 100-cycle retention runs. Matched parent/candidate workloads only.
   Absolute AND relative added-cost limits: startup <=10 ms and <=10%; first use
   <=50 ms and <=25%; repeat <=8 ms and <=10%; total used gzip growth <=2,048 bytes;
   post-cycle-100 minus cycle-10 DOM/listener growth zero, incremental heap <=262,144
   bytes. Reject or revise without relaxing these limits. Cold/warm, native/global
   and emulated touch remain separate. No timing improvement claim from an audit.
5. Reject a boundary that requires splitting accepted/draft/hue state across new
   controllers merely to postpone a few decorative nodes. No new editor lifecycle.

## Audit method

Read adoption and Phase 6 plans/results, current SCOPED-REGISTRIES.md, field/picker
READMEs, actual definitions and render paths, native trigger controller, and editor
session contracts/callers. Produce exact-base npm packs, a minified production
consumer for each family, module closure receipts and rendered node counts.

One diagnostic subtracts only colorPlaneDefinition from the extracted picker
package. It is intentionally NOT a valid general picker replacement: plane=true
would lack its required definition. It estimates maximum marginal code savings
for a permanently non-plane workload, with no wrapper/loading overhead. Compare
its DOM with the identical no-plane parent workload. Do not promote or install it.

Static/gzip and DOM diagnostics need no invented timing distributions. If no
boundary survives these gates, failed chunks, retry/cancellation, retention and
changed-interaction manual qualification are not newly applicable: record them
as unperformed, not passed. Existing accepted manual review remains intact.

## Ownership

Shared API/docs owner notified: task `Audit public consumer contract`. This task
will not edit SCOPED-REGISTRIES.md or shared loader/activation APIs. No active
editor task appeared in the task inventory at audit start. Both editor examples
and editor-session contracts remain unchanged; a future editor boundary belongs
with its owner. Open native picker/placement review feedback remains open.

## Results

Completed packed and DOM audit; final decision and limitations follow. Evidence lives in
`artifacts/scoped-followup-color-tools/`.

## Decision: keep current boundaries; reject a new runtime policy

The audit does not justify a production pilot for these callers. No library,
editor example, public API, loading policy or default was changed. The diagnostic
is deliberately confined to extracted npm-package metadata and is not promoted.

The final production application bundles (Vite 8.2.2, ES2022, minified, gzip 9)
contain the same scope/fixture overhead. Each uses freshly built, exact-base
packed tokens/styles/primitives/elements; `build.json` lists all input module
hashes, tarball hashes, emitted hashes and sizes. The graph subtraction removes
exactly `definitions/color-plane.js`, `color-plane.js` and `color-picker/hsv.js`.
The shared sliders, fields, color model, styles and formatting remain.

| Priority / opportunity | Measured unused cost | Actual callers and disposition |
| --- | --- | --- |
| 1. Plane graph in a permanently non-plane picker | 7,111 raw / 1,569 gzip bytes; zero plane nodes already | Chat custom picker and basic picker do not request plane. Upper bound falls below 4,096 bytes and 50 nodes; adding delivery/status policy would reduce net benefit further. Reject new shell entry here. |
| 2. Standalone wheel | 9,662 raw / 2,927 gzip marginal bytes alongside picker; 44 nodes when constructed | Already absent from picker imports. The wheel/plane demo displays it immediately. Keep the existing independent entry; do not add a library-specific activation lifecycle. |
| 3. Pointer plane surface within active HSV editing | 2 elements/nodes; no independent module | Whole standalone plane has 255 nodes in the tested P3/alpha setup, but most implement named sliders/exact fields. Removing all 255 would remove useful editing. Splitting only pointer surface misses node gate and requires new state boundaries. Reject. |
| 4. Native color-field popup | No library-owned popup DOM or custom plane/wheel module | Native request stays synchronous. Field has 23 nodes including native input/label/help structure. No valid custom-popup deferral boundary. Keep. |

Lower bytes/nodes is better only for equivalent behavior. Above marginal byte
values use matched bundles; standalone family totals are an inventory, not
replacement deltas. No Phase 0–6 values are subtracted. The final one-byte gzip
difference from the initial diagnostic follows the corrected boolean P3 fixture
flag; all final arms were rebuilt together and the declared budgets are unchanged.

### Structure and transaction rationale

`definitions/color-picker.ts` hard-imports `colorPlaneDefinition`. The picker
class itself has only a type import of `EnColorPlane`, but the supported definition
and eager `define/color-picker.js` entry bring in the full required graph. Its
render branch creates no `en-color-plane` when `plane=false`; the packed diagnostic
and current parent render identical 350-node controls in Chromium/WebKit and
349 in Firefox. The wheel is absent from that closure.

`apps/docs/src/editor-color-extension.ts` sets `plane` in both editor backends.
`color-spaces-demo.ts` starts with plane enabled; `color-wheel-demo` renders the
standalone composition immediately. The chat custom-color tab uses the ordinary
picker, while native-first/typeahead native handoff calls showPicker synchronously.
These are observed source intent, not measured frequency. No telemetry justifies
an invented percentage of unused sessions.

The plane owns remembered HSV hue/saturation, preview versus accepted state,
pointer capture/cancellation and equivalent channels. The picker owns accepted
literal color, precision, validation and authoritative-write revision guards.
Reconstructing the plane from a black/gray CSS value cannot recover its remembered
hue. Switching from RGB/HSL fallback into newly constructed HSV controls would
require explicit transfer of state/drafts/validation/focus and would change the
interaction being qualified. Delaying the whole editor color session is a larger
application-owned boundary outside this task. `EditorPickerSession.signal`,
`commit`, `cancel` and synchronous `openPicker` retain existing ownership; Apply
still commits one editor transaction, Cancel preserves the draft. No session API
or pending transaction was added.

The existing scope, literal definition-loader and explicit activation APIs could
support a future independently requested standalone tool. They cannot turn a
hard imported/rendered plane into an optional dependency just by delaying
registration. `load` prepares code; `ensure` registers; activation's application
`ready(root, signal)` establishes readiness. They do not unload code, undo native
registration or replay canceled intent. No additional policy is warranted here.

### Verification and retained finding

The packed audit completed 42 cases across Chromium 153.0.8010.12, Firefox 155.0
and WebKit 26.6, explicit global and auto. Auto is actual native in Chromium/WebKit
and actual global fallback in Firefox, reported separately. Functional checks
cover side-effect-free imports, matching parent/diagnostic controls and names,
P3 serialization, two instances, DOM focus reachability, native request invocation
inside a trusted activation and field form-value veto. Hosts and custom-element
descendants retain the owner registry; native scopes do not register a plane in
the global registry. Nine existing color-model/HSV/SSR tests pass, including
precision, remembered hue and named standalone-wheel SSR output.

A broader **all-node** registry association invariant failed in all seven WebKit
auto/native cases: native INPUT nodes report the global registry while custom
hosts and owned shadow roots retain the scope. The raw failure and subsequent
complete observations remain in the archive. This is a baseline observation,
not a new regression, accepted exception or passing all-descendant assertion.
The consumer-contract owner was notified and requested no shared runtime change.
No claim about the platform cause is made. The original narrower 42-case audit
passed before this additional assertion exposed the finding.

### Unused/used and unperformed coverage

| Requested dimension | What this audit establishes |
| --- | --- |
| Unused plane visit | Full hard graph fetched by the matched eager fixture; no plane constructed. Maximum removable graph 1,569 gzip bytes; identical immediate editing nodes. |
| Used plane/wheel visit | Existing eager tools rendered and P3 state/focus inspected; counts in `dom.json`. No deferred candidate or readiness benefit. |
| Preparation lead / traffic | No preparation policy selected. Emitted gzip totals only, not measured wire traffic. No speculative-load claim. |
| Cold / warm / first / repeat readiness | Not measured; no runtime policy survived the gate. Cache regimes are not pooled and no latency values are invented. |
| Real failed optional chunks / retries / cancellation / retention | Not newly exercised because no asynchronous boundary is implemented. Harness/environment failures and the ownership finding are recorded separately. |
| Pointer/touch/keyboard transactions | Existing source/contracts reviewed; DOM focus and trusted pointer activation checked. No new full gesture suite, emulated-touch acceptance, physical touch, IME or AT speech review. |
| Forms / SSR / hydration | Field form veto and current wheel SSR tested. No new hydration/input-lifecycle change or hydration campaign; no no-JS form submission claim. |
| Manual acceptance | Native picker display/dismissal/focus return, wide-gamut appearance and actual assistive technology remain unperformed. Earlier acceptance is neither reopened nor extended. Open native-color feedback remains open. |

The >=30 timing samples/configuration and separate repeated retention gates apply
to promoted runtime changes. There are none. Running distributions for the broken
graph-subtraction diagnostic would not make it a valid performance candidate.

### Evidence and continuation

Sortable `en-table` results: `http://127.0.0.1:4279/?progress-report`.
Restart: `python3 -m http.server 4279 --bind 127.0.0.1 --directory artifacts/scoped-followup-color-tools/site`
from this isolated worktree. All columns sort; better-direction notes explain
which comparisons are meaningful. The report return link uses the existing
canonical report URL and is absent without the query flag.

Reproduction and files: `artifacts/scoped-followup-color-tools/README.md`.
Reconsider only with a concrete caller that keeps an independently useful tool
unused, sufficient measured marginal cost after equivalent editing is preserved,
and explicit ownership coordination. Any such future runtime change must meet
the unchanged qualification gates and receive its own manual review for changed
interactions. This task recommends no integration of a new runtime boundary.
