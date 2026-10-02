# Support coverage ledger

Inventory snapshot: **2026-10-02**, audited against `dcb52a27`; packed framework
qualification added against the `fb201d1c` base plus the receipt's exact source hashes.
Full support qualification
remains **incomplete**. The versioned [ledger](support-coverage.json) maps the
requirements in [verification §§7–8](verification.md#7-developer-and-delivery-integration)
to exact inventories, scoped receipts, outstanding conditions and next actions.
It is an evidence index, not a new browser-support promise or a completed test run.

## What is established

- Pinned Playwright 1.63.0 uses Chromium153.0.8010.12, Firefox155.0 and WebKit26.6.
  The latest relationship probe retains114 actual passes, five expected failures
  and22 skips. Its [receipt](../probes/reference-target/verification-20261002.json)
  and [compatibility decisions](../probes/reference-target/README.md) define scope.
- [Packed public consumers](../probes/consumer-contracts/prepare.mjs) already
  exercise selective registration, public declarations, request isolation and
  scoped/global SSR. They are different fixtures from the framework cohort suite.
- Phase5's [final manual boundary](scoped-registry-phase-5.md#final-manual-review-boundary)
  records accepted real IME, autofill and history workflows. Phase6 records
  [targeted date/VoiceOver acceptance](scoped-registry-phase-6-results.md#qualification).
  These accepted results stay accepted within their original fixture boundaries;
  they do not certify every product version, physical device or input method.

## Inventory is not qualification

Read-only app inventory on macOS26.6.1 (25G76), arm64 found:

| Installed product | Version | New qualification in this audit |
| --- | --- | --- |
| Chrome | 154.0.8037.93 | Not run |
| Edge | 154.0.4258.48 | Not run |
| Firefox | 157.0 | Not run |
| Safari | 27.0, build21625.1.29.18.28 | Not run |
| Chrome Canary | 157.0.8082.0 | Separate preview subject; not run |
| Safari Technology Preview | 27.0, build21626.1.6.19.1 | Separate preview subject; not run |

The cache also contains Chrome-for-Testing148,151 and153. Those installations
are not evidence of a preceding *retail product* test. Do not launch an arbitrary
old cache with the current Playwright protocol and call it previous-release support.
Playwright's [browser contract](https://playwright.dev/docs/browsers) distinguishes
its patched Firefox/WebKit from branded products; Safari/iOS need their own checks.

Official dated sources and unresolved release identities are in `releaseObservations`
in the ledger. Firefox157/156 and Safari27/26 identify major-line candidates;
exact OS/build/patch selection remains an acquisition requirement. Edge's
[October1 release notes](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-relnote-stable-channel)
already list a newer patch than the installed app. The retrieved Chrome release
page was too old to resolve October's current line, so that identity stays unknown.
Nothing here changes users' installed browsers or this repository's pinned engines.

## Framework receipt reconciliation

| Cohort | Current source pin | September13 receipt | Remaining packed coverage |
| --- | --- | --- | --- |
| React19 | 19.3.0 | 19.3.0 | October2 packed pass |
| React18 | 18.3.1 | 18.3.1 | October2 packed pass |
| Vue3 | 3.5.43 | 3.5.42 | October2 packed pass on3.5.43 |
| Vue2 | 2.7.16 | 2.7.16 | October2 packed pass; EOL compatibility only |
| Svelte5 | 5.57.1 | 5.57.0 | October2 packed pass on5.57.1 |
| Svelte4 | 4.2.20 | 4.2.20 | October2 packed pass |

The original84-pass [framework receipt](../probes/framework-consumption/verification.json)
is preserved unchanged. It covers workspace distributions, boolean/event bindings,
slotted choices and an opaque library-owned SSR island. Its existence does not
establish current-source equivalence, object/string property integration,
unmount/remount or public declarations consumed from tarballs in each framework.
The maintained fixtures' newer pins are recorded separately, not retroactively
substituted into that receipt. [Vue2 is EOL](https://v2.vuejs.org/eol/); keep it as
legacy compatibility and resolve the intended rolling supported-line policy
before calling these cohorts current-minus-one support.

The separate [packed receipt](../probes/framework-consumption/verification-packed-20261002.json)
now closes the structural consumption gap:126 browser passes across seven fresh
tarball installations and three engines, plus seven independent public declaration
compilations. It includes object/string/boolean bindings, slots, transactions,
reference interactions and unmount/remount with explicit listener disposal. The
old receipt remains unchanged; neither result establishes retail-product or
physical/manual coverage.

## Remaining work, in order

1. **Actual release products:** resolve current/preceding versions on named OSes,
   then acquire isolated automated or manual receipts. Record binary identity,
   profile, scenario, result and date. Missing access is an open condition.
2. **Rolling framework lines:** resolve supported-line meaning per framework;
   extend the fixed compatibility cohorts if required. Legacy Vue2 acceptance
   is not a claim of upstream maintenance.
3. **Physical and manual matrix:** named Android/iOS phones/tablets in both
   orientations; small/large laptops; desktop display transitions; real observed
   connectivity; remaining speech, native-picker and IME workflows. Existing
   emulation, AX snapshots and accepted scoped manual results remain distinct.

Each condition has a stable ID, explicit gap and next action in the JSON ledger.
Completing this index does not reduce the remaining platform-acceptance scope.
The unavailable historical external CSS-authoring rerun was separately retired
by the user; it is not included in this outstanding matrix or reported as passed.

## Maintenance

Refresh the ledger when cohort pins or receipts change, and resolve official
release versions again before acquisition. Keep receipts immutable. For a new
qualification, add its original source/artifact identity and bounded scenario
coverage; never transfer a result solely because a version number matches.

`tooling/testing/support-ledger.test.mjs` checks receipt hashes, references,
current cohort manifests/locks, pin drift and honest incomplete-state accounting.
It runs in the maintained tooling/correctness graph. These checks validate the
ledger's consistency; they do not perform its pending browser or manual checks.

## Installed Chrome/Edge acquisition — October 2

The original inventory table above remains its historical observation. Chrome had
updated from154.0.8037.93 to154.0.8037.95 before this acquisition. The separate
[product receipt](../probes/framework-consumption/verification-products-20261002.json)
records42 packed-consumer cases each on installed Chrome154.0.8037.95 and
Edge154.0.4258.48, plus126 cases on the three pinned engines: **210 passed**, zero
failed/skipped/flaky. All seven fresh package installations/type checks passed.
Both products used isolated headless profiles on macOS26.6.1 (25G76), arm64.
Complete app-distribution hashes, including libraries, matched before and after.

`browser-current` is now **partial**. Other products, OSes/workflows, headed UI,
previous releases and physical/manual acceptance remain open. Edge's installed
patch is older than the official154.0.4258.53 October1 release; this result does not
claim that newer patch. Chrome's [official154 notes](https://developer.chrome.com/release-notes/154)
identify September22 stable, resolving the current major-line candidate that was
unknown in the earlier inventory. Exact latest/preceding patch targets still need
resolution at acquisition. Existing patched Firefox/WebKit results remain separate
from actual Firefox/Safari products.

The product run supersedes the earlier packed fixture as the current-source
qualification without altering its immutable126-pass receipt. The final run also
retains the original strict console check: an explicit fixture data favicon fixes
Chrome's observed favicon404. Early harness attempts remain in local evidence;
partial passes are not pooled into the final210-pass result.
