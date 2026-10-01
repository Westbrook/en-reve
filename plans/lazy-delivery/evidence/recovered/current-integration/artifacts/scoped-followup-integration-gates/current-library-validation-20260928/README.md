# Current-library integration validation — 2026-09-28

This portable evidence records a fresh selected integration run at `c69ee6716672db6f6cb49735117079b840271b1c` / tree `16b6b72dfc43585877b7bc5e9c421681efa23b75`. All 16 required stages passed; no required stage was skipped. Actual host session 74269, initial chunk 819a86, final b00a25, exit 0, normal return 18:47:15.984919Z. Later evidence/documentation commits are not represented as tested product source.

Use the repository commands documented in [the integration plan](../../../plans/scoped-followup-integration-gates.md). The existing tools select dependency closures, preserve nonzero exits and required skips, serialize shared fixed-port harnesses, and record actual capability and source/build identity. These commands are locally runnable and CI-ready; no hosted service is configured.

## Review the outcomes

- [Fresh selected02 receipt](selected02/receipt.json), [byte-identical original](selected02/receipt.original.json), and [per-project audit/actual host closure](preparation/integration-core14-selected02-binding-20260928-01/selected02.actual-host-completion.json).
- [Failed selected01 original](selected01/receipt.original.json): 12 required stages passed, two failed and two dependent stages skipped; aggregate exit 1. It remains failed. The fresh run reran the entire 16-stage selection.
- [Two-path metadata reproduction](runs/integration-core14-reproduction-20260928-01/run/receipt.json): two clean paths, 20 successful commands, four seven-output maps with all 28 hashes matching the committed baseline. The raw receipt uses a paths schema; its 20 relative command logs are retained directly.
- [Seed receipt](runs/integration-core14-seed-20260928-01/receipt.json), [original generated-output delta](runs/integration-core14-seed-20260928-01/generated/tracked-delta.patch), and seven before/after pairs under that run's `generated` directory.
- [Tools qualification](../../test-pipeline-upgrade-2026-09-25/cem-final-qualification-20260928/README.md): separate accepted 640 full-matrix checks and 32 direct probes, retained earlier failures, and explicit whitespace-only source transfer. These are separate workloads, not a pooled 672-case campaign.

The fresh selection includes frozen seals, build, capability probe, virtual-collection unit checks, document scroll, packed scope preparation/scope, hydration preparation/hydration, diagnostics unit/diagnostics, public-consumer preparation/contracts, and date-fixture unit/original/fixture gates. Document-scroll passed 30 cases across Chromium/Firefox/WebKit at 1280px and 390px; scope passed 64 with 11 skips; hydration passed 44 with one skip; consumer contracts passed 38 with one skip. There were no unexpected or flaky cases. Eleven skipped cases require Firefox's unavailable native registry capability; two collection diagnostics are Chromium/CDP-only. These are case-level limits, not missing required stages.

Diagnostics' five nested steps passed on the exact selected source. Date fixtures passed eight child commands and 39 interaction plus 21 boundary checks with one matching build ID. Automated DOM/focus and emulated viewport results do not establish assistive-technology, physical-device, OS-picker, autofill, speech or real-IME behavior. Those reviews were not performed here; accepted unchanged manual reviews were not reopened.

## Source and capability attribution

Assembly commit `65d7e5a2842251eb0c7f30cba8937190499c04cb` contains the reviewed core14 source. Seed generation changed only `packages/elements/custom-elements.json.receipt.json`; the six public API/type/lazy/coverage outputs remained byte-identical. The generated receipt was committed at `20b1017f930593d4aac77f65a49105920c0dbecd` / tree `312e09c5a25d9c7a969044896fa3f4cf94f8df93`, the actual two-path reproduction source. The consumer fixture-only npm pack receipt adapter produced `c69ee6716672db6f6cb49735117079b840271b1c`; all 63 qualified source and seven generated hashes remained unchanged. Metadata reproduction was transferred on that narrow basis, not rerun or relabeled at c69ee. Ordinary-route metadata was exercised; constructor-composition/hybrid behavior is not claimed.

[Capabilities](selected02/capabilities/capabilities.json) retain requested versus actual mode. Chromium 153.0.8010.12 and WebKit 26.6 supported native registry/options import/dormancy; Firefox 155.0 used global fallback and did not support native dormant behavior. Requested `auto` is not itself evidence of native behavior. Runtime was Node 26.10.0/npm 12.1.0. Source/build hashes, package/browser versions, exact commands/configurations and load observations remain in the original receipts.

The selected paths use the pinned performance esbuild 0.28.2 installation. They do not use simple-statistics; installed 7.12.0 differs from locked 7.12.1, so this evidence does not claim an exact whole-performance dependency installation. No timing or retention campaign ran in this closeout, and no performance improvement is inferred. Existing performance acceptance still requires matched workloads/cache/preparation policies, at least 30 successful timing samples per affected configuration and separate repeated retention under unchanged budgets, with failures retained.

## Preserved failures and resource ownership

Assembly attempts retained a launcher arity failure, a worker initializer failure, and a whitespace-check failure before the reviewed whitespace-only continuation. Selected01 failed because a regular npm wrapper caused the packed identity guard to inventory mutable run output, and the consumer fixture assumed an array-shaped npm pack response. The successor uses a symlink to the pinned npm executable and the existing `singlePackOutput` parser. No identity assertion was weakened and no product failure was relabeled. Original rotated npm debug logs that no longer existed were not invented; the retained command logs and finding preserve the observed evidence.

Run/configuration directories are unique. The actual wrappers used the existing deadline-only supervisor and resource-owner composition, zero retries and separate canonical/subordinate execution ownership. [Final handback](runs/integration-core14-selected-20260928-02/resource-handback.json) records all four paths returned; [terminal](runs/integration-core14-selected-20260928-02-outer/terminal.json) records the child reaped and process group absent. Serial host locks do not imply a quiet desktop. Measured load observations are retained; no performance comparison is drawn.

## Portability and immutable history

[Copy manifest](copy-manifest.json) maps every copied source path to its repository-relative destination with byte count and SHA-256. [Checksums](checksums.json) seal every new bundle member except the checksum file itself. Verify from this directory with standard Python:

```sh
python3 - <<'PY'
import hashlib, json, pathlib
root = pathlib.Path('.')
for row in json.loads((root / 'checksums.json').read_text())['files']:
    data = (root / row['path']).read_bytes()
    assert len(data) == row['bytes']
    assert hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
print('All portable members match')
PY
```

Raw records remain byte-identical, including historical absolute paths and whitespace. The manifest resolves their original locations after relocation. Derived selected receipts retain artifact-relative links; `receipt.original.json` retains omitted temporary-input hashes. Temporary dependency trees, npm caches, checkout copies and `tmp` artifacts are excluded; their identity inventories remain. Raw provenance is portable for review, not a promise that historical absolute-path launchers rerun unchanged on another host. Use the repository CLI for new runs.

The source started from local main `412693efc6e5325ed23c1953d3ba135cc1390dbf`, which includes Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba`. Frozen baseline subtree remains `d93747d9d7a2fd74be5ebdfcb56f29f9d94cef80`. No remotes were configured, and no merge, publication, deployment, archive migration, automation or hosted CI provisioning was performed by this task. Root owns any later main landing; that verification is a separate handoff step.
