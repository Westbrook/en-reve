# Fresh universal lazy-delivery campaign

This harness qualifies the new rollout against an exact accepted **current** reference. It never invokes the historical date `prepare.py`, modifies Phase 0–6 archives, or imports workspace library source into a measured consumer. Numeric gates and scope are frozen in [`plans/lazy-delivery/budgets.json`](../../plans/lazy-delivery/budgets.json) and [validation protocol](../../plans/lazy-delivery/validation.md). Editor qualification remains governed by its [separate stricter protocol](../../plans/lazy-delivery/editor.md).

The source implementation is not an execution receipt. A report is generated only from actual raw acquisition. Qualification samples, subset runs, incomplete runs and failed gates never become a promoted full-matrix result.

## Ownership and inputs

Root coordinates builds, correctness browsers and timed acquisition serially. The campaign acquires/borrows the existing machine, execution and browser leases; never delete a lease or terminate another owner. Select the private pinned runtime with `tooling/test-pipeline/with-toolchain.sh`. Provision pinned packages, engines and private OpenSSL through the repository's documented setup before acquisition. Every command recording and `EN_EXECUTION_OUTPUT` directory must be fresh. Do not run on a development server or concurrently with builds/correctness browsers.

`seal.mjs` captures explicit Git commit bytes or an explicitly declared candidate worktree. The current reference is accepted commit `806886d104febb0b3deb4aef2b3e4dad7947ae87`, including the independently qualified common button label-slot touch correction, verified by the owner before use. The kickoff reference `fba5ec19b58606cf1776df44862a38a3898f4c72` and its candidate acquisitions remain historical; preserve their exact subjects and never pool their results with the fresh reference. The candidate should be a clean accepted combined implementation commit with generated metadata already fresh. A dirty candidate is only an explicit exploratory overlay; it cannot qualify a merged commit. Source seals include complete Git commit/tree identity and the declared build-source closure, exact file/lock hashes, explicit inclusion/exclusion policy, and dirty status. Frozen historical evidence is not copied into build installations.

Preparation verifies both seals, exact matching locks and runtime pins, then independently installs and builds each captured source. It checks existing generated metadata without repairing it. Packed production packages are extracted into each standalone consumer; external dependencies come only from that arm's fresh exact-lock installation. The same exact-lock esbuild installation, minification, ESM splitting and es2022 target build both arms. Static emitted import closures, dynamic chunks, compressed sizes, compiler/runtime/native-binary identities and archive hashes are retained. Static startup bytes do not include dynamic imports before component readiness; actual browser startup receipts are authoritative for that cost. No standalone microbenchmark establishes Vite route benefit.

`app/variants.mjs` declares every arm and paired comparison. API selective/canonical/profile overhead is separate from the inert metadata bundle and existing date shell migration. Date policies include eager, construction-only, cold shell, prepared (250 ms measured lead), immediate pending preparation, unused and abandoned intent. Reference cold/prepared/immediate/unused/abandoned arms use a literal asynchronous shell import in `getDefinition()`, matching the candidate profile's dynamic shell boundary. Separate reference/candidate `date-shell-static` controls retain the direct static shell import with the cold policy and a matched migration comparison. Static entry bytes, declared shell bytes and actual shell-ready traffic remain distinct. The default 21 timed arms produce 6,300 timing observations and 210 retention contexts. Report JavaScript is built from packed `en-table` in its own untimed variant. Every variant uses the same static document and measurement adapter where applicable. Reference and candidate variant lists cannot be replaced selectively after timing.

## Serial execution example

Use owner-assigned fresh absolute directories; these names are examples, not reusable defaults. Wrap each outer command in `tooling/test-pipeline/record.py` when collecting accepted evidence. Source capture and build commands are separate from timing.

```sh
tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-performance/seal.mjs \
  --source="$PWD" --ref=806886d104febb0b3deb4aef2b3e4dad7947ae87 --out=/absolute/new/reference

tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-performance/seal.mjs \
  --source="$PWD" --ref=EXACT_CANDIDATE_COMMIT --out=/absolute/new/candidate

tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-performance/prepare.mjs \
  --reference=/absolute/new/reference --candidate=/absolute/new/candidate --out=/absolute/new/prepared

EN_EXECUTION_OUTPUT=/absolute/new/qualification tooling/test-pipeline/with-toolchain.sh \
  node probes/lazy-delivery-performance/campaign.mjs --prepared=/absolute/new/prepared --qualification

EN_EXECUTION_OUTPUT=/absolute/new/timing tooling/test-pipeline/with-toolchain.sh \
  node probes/lazy-delivery-performance/campaign.mjs --prepared=/absolute/new/prepared \
  --n=30 --retention=5 --contention="Active desktop; owner-recorded observation"

tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-performance/analyze.py --run=/absolute/new/timing
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-performance/report.py --run=/absolute/new/timing
tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-performance/verify-report.mjs --run=/absolute/new/timing
```

`--variants=reference/api-selective,candidate/api-profile`, `--configs=chromium:desktop:keyboard`, and `--modes=global` select explicitly labeled subsets; they do not satisfy the full Stage B matrix. `--qualification` permits small n and zero retention solely to prove harness operation. Thirty timing observations in every configuration are required for promoted Stage B comparisons; editor p95 gates require its distinct 100-sample campaign. No warm/cold pooling or retries that replace unfavorable cells exists. Any failure aborts acquisition and remains in `samples.jsonl` alongside the started attempt and incomplete summary.

The cold primary matrix uses Chromium/Firefox/WebKit desktop keyboard, constrained Chromium keyboard and emulated 390×844 touch, global/scoped requests with actual mode in each record. A fresh browser process/context starts each observation. Prepared lead and full ready path are recorded rather than assumed. Preparation starts from the focused native trigger on both arms, including the emulated-touch fixture. Preparation-only checks preserve actual registry constructor identities and the deep active-element chain, with no calendar construction or opening. The first activation records whether preparation is pending; constrained immediate arms must prove it is. Abandoned intent retains its 500 ms snapshot, then awaits actual preparation completion and verifies stable authored focus and inert UI; completed traffic supplies abandoned-byte gates. Server certificate generation, all HTML gzip prewarming and startup happen before sample clocks. Preflight and final source, Playwright-package and browser-distribution hashing remain inside the campaign's ownership leases, including failure verification.

Retention is separate: five fresh Chromium contexts per arm and mode, 100 mount/open/close/settle/remove cycles, double collection at 0/10/50/100 after 300 ms settling. The report preserves each 10→100 node/listener/heap delta. Intentional module/registry residency is not a leak-free claim. The generic Stage B runner does not implement editor bookmark/link-draft/manual qualification and cannot claim it.

`report.html` uses the packed `en-table`, sortable native column buttons and row filters. Every delta column has a better-sign note directly below its table; retention is separate. Raw attempts, exact manifests, package receipts, asset hashes, missing comparisons and failed/uncertain checks remain linked. Only the established Progress Report can carry user review state.

Current reports require analyzer-bound manifest, raw samples and summary hashes,
along with the acquisition-bound prepared manifest and exact report assets.
Missing or mismatched bindings stop presentation before output is written;
presentation-time hashes cannot certify the original acquisition. Existing report
outputs are never overwritten. Preserve frozen historical analyses and reports;
use a new current analysis/report artifact when a current binding is required.

## Harness checks (owner executes serially)

```sh
tooling/test-pipeline/with-toolchain.sh node --test probes/lazy-delivery-performance/source-seal.test.mjs probes/lazy-delivery-performance/campaign-integrity.test.mjs probes/lazy-delivery-performance/variants.test.mjs probes/lazy-delivery-performance/date-fixture.test.mjs
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-performance/analyze.test.py
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-performance/report.test.py
```

These synthetic tests establish source-seal/provenance, variant topology, controlled preparation-state, analysis and exact report-provenance invariants, not delivery performance. Browser ownership, private runtime correctness, complete packed graphs and the actual report must still be qualified by the executing owner. This source-only implementation has no automatic inherited functional, performance or manual acceptance.
