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

## Latest bounded product evidence

| Product on macOS26.6.1 arm64 | Consumer checks | Production workflow checks | Remaining scope |
| --- | --- | --- | --- |
| Chrome154.0.8037.98 |60 passes |26 passes,1 existing skip |Preceding retail line; other OS/manual coverage |
| Edge154.0.4258.53 and153.0.4234.48 |60 passes each |26 passes and1 existing skip each |Other OSes, physical/manual coverage |
| Firefox157.0 and156.0.1 |60 native-input passes each, computed names/roles |Not yet qualified |Production workflows, descriptions/full AX, other OS/manual coverage |
| Safari27.0 |No qualified component case |Not yet qualified |Hidden automation document; awaiting visible desktop clarification |

These are scoped receipts, not complete support claims. See the dated acquisitions
below; historical counts are not silently transferred to current source.

## Initial inventory, retained as history

Before the acquisitions below, read-only app inventory on macOS26.6.1 (25G76), arm64 found:

| Installed product | Version | Qualification at initial inventory |
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
2. **Rolling framework lines:** qualified for the October2 window below. Refresh
   exact pins when the support window changes; retain previous-major/EOL cohorts.
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


## Framework release-line qualification — October 2

The [resolved policy](../probes/framework-consumption/release-lines.json) uses current
and immediately preceding stable minors within the current major, while retaining
all previous-major compatibility subjects. Exact pairs are React19.3.0/19.2.8,
Vue3.5.43/3.4.38 and Svelte5.57.1/5.56.10. React18.3.1, Vue2.7.16 and Svelte4.2.20
remain in the matrix; Vue2 is historical EOL compatibility, not maintained support.

The [new immutable receipt](../probes/framework-consumption/verification-release-lines-20261002.json)
records300 browser passes and10 independent packed declaration compilations.
It includes all six contracts per cohort, three pinned engines and installed
Chrome/Edge with unchanged distribution identities. The React19.2 adapter needed
a stable opaque HTML prop to preserve hydrated host nodes; the original failing
run is retained, and the unchanged identity assertion passes in the final full run.
`framework-release-lines` is now **qualified** for these exact pins and contracts.
This closes a framework condition, not the broader product/device/manual matrix.

## Actual Firefox and Safari acquisition — October 2

The [native-product probe](../probes/native-browser-products/README.md) adds **30
passes on installed Firefox157.0** through WebDriver BiDi: three native-input
scenarios across ten existing packed consumers. It reuses the exact hash-verified
release-line artifacts and does not claim another package installation/type run.
The complete Firefox app distribution stayed unchanged. This differs from the
six-case Playwright consumer suite and from its patched Firefox155 engine.

Safari27 WebDriver session creation works, but its automation document stayed
hidden and did not settle the fixture's animation-frame readiness marker, even
after window selection/sizing. No Safari component case is qualified. Original
timeouts/diagnostics remain in the new receipt; visible-window retesting is the
next step. There is no screen-reader, physical-device, previous-product or full
workflow acceptance implied by these outcomes. `browser-current` remains partial.

## Actual Chrome/Edge production journeys — October 2

[Production workflow qualification](../apps/docs/tests/verification-products-20261002.json)
adds52 passes on the same installed Chrome/Edge versions: SSO, settings, chat and
project selection, including early SSR editing, native submission, recovery,
cancel/repeated actions, external updates, accessibility scans and page history.
The optional product manifest is shared with the framework suite; default engine
coverage is unchanged. Two pre-existing Chromium-only viewport cases stay skipped.
Full app distributions and source/build inventories matched before and after.

A further Safari attempt brought the application forward before its owned
WebDriver session. The document still reported hidden and never reached the
animation-frame readiness marker. No Safari component case passed; desktop
lock/sleep state has been requested from the user. No assertion was bypassed.

Mozilla's official archive index resolves the preceding Firefox line to156.0.1.
The [isolated Firefox receipt](../probes/native-browser-products/verification-firefox-lines-20261002.json)
now records30 native-input passes on156.0.1 and30 on installed157.0 using the same
runner. The official archive checksum and macOS signature checks passed, and
both complete app distributions stayed unchanged. Previous-product coverage is
partial: preceding Chrome/Edge/Safari, other OSes and broader workflows remain
open. Physical-device inventory is still pending.

## Isolated current and preceding Edge acquisition

The [framework receipt](../probes/framework-consumption/verification-edge-lines-20261002.json)
records300 passes:120 on isolated Edge153.0.4234.48 and154.0.4258.53 plus180 on
the three pinned engines, with ten fresh packed installations/declaration checks.
The [production receipt](../apps/docs/tests/verification-edge-lines-20261002.json)
adds52 passes and two existing Chromium-only profile skips across those Edge
releases. The Microsoft enterprise catalog supplied exact Stable packages; their
published SHA256, trusted installer signatures and extracted app signatures were
verified. Only payloads were extracted; no installer scripts ran. User browsers,
profiles and updater settings were untouched. Full distribution inventories were
unchanged across each acquisition.

Chrome acquisition remains separate. Google's official VersionHistory now lists
154.0.8037.98 at100% in its recorded Mac ARM64 stable group. Its highest listed153
patch,153.0.8010.55, was a0.5% control rollout. The preceding broad-release
reference is153.0.8010.53, the latest153 patch recorded at100% and pinnable. Google documents [Chrome for Testing](https://www.chromium.org/getting-involved/download-chromium/)
as a versioned automation distribution and [managed rollback](https://support.google.com/chrome/a/answer/7591084?hl=en)
as an administrator operation. No retail archive was acquired, no updater policy
was changed, and a cached testing build is not relabeled as retail coverage.
Safari and the pending physical/manual questions remain open.

## Isolated current Chrome stable acquisition

The [framework receipt](../probes/framework-consumption/verification-chrome-stable-20261002.json)
records 240 passes: 60 on isolated Chrome 154.0.8037.98 and 180 on the three
pinned engines. Ten fresh packed installations and declaration compilations
passed. The [workflow receipt](../apps/docs/tests/verification-chrome-stable-20261002.json)
adds 26 passes with one existing Chromium-only viewport skip. Full app
inventories and production workflow inputs stayed unchanged across execution.

The official stable DMG was mounted read-only and copied to a temporary test
location. Google code-signature verification passed. Its SHA256 records local
archive identity; no published checksum comparison is claimed. Installed
browsers, user profiles, updater policies and security settings were unchanged.
The earlier 154.0.8037.95 receipts remain historical exact-version evidence.

VersionHistory identifies 153.0.8010.53 as the preceding broad stable reference
(100% and pinnable), whereas 153.0.8010.55 was a 0.5% control rollout. Prior retail
Chrome still requires an isolated compatible distribution/environment. Safari,
other OSes, physical devices and remaining actual speech/IME coverage stay open.

## Expanded native Firefox consumers

The [expanded receipt](../probes/native-browser-products/verification-firefox-expanded-20261002.json)
records 120 passes: six native-input scenarios across ten retained packed consumers
on each Firefox release (157.0 and 156.0.1). It adds framework-owned checkbox
cancellation/state, authored select-choice updates with real keyboard input,
pointer/keyboard tree activation and retained state after remount. Firefox's BiDi
accessibility locator checks browser-computed field/tree names and roles using
explicit component shadow-root start nodes.

Two initial attempts queried from the document and found no shadow-tree matches;
they remain failed harness attempts. The qualified runner uses the protocol's
explicit start-node API; component code and assertions were not relaxed. The
slotted description's DOM text is checked, but computed descriptions and full
accessibility trees/speech are not claimed. Both full app distributions were
unchanged. Existing packed artifacts were hash-verified and reused; there was no
fresh installation/type compilation. Production workflows, Safari and the original
OS/physical/manual obligations remain outstanding.
