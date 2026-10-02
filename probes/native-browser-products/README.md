# Actual Safari and Firefox product checks

Latest Safari status: [input and focus diagnosis](safari-input-boundary.md).
Four consumer cases pass; qualification remains incomplete. Safari-specific
visible focus rules are preserved and assessed separately from native input delivery.

Playwright remains the default test runner. Its patched Firefox and WebKit builds
are different subjects from installed Firefox and Safari products. This narrow
macOS probe uses Apple's bundled Safari WebDriver and Firefox's supported direct
WebDriver BiDi connection where Playwright cannot drive those products faithfully.
It installs no driver, changes no browser permissions, and never attaches to an
existing user browser session. Safari must already allow remote automation.

## Run

First acquire the packed consumer fixture through the normal framework pathway
in `probes/framework-consumption/README.md`. Retain its `preparation.json`, package
archives, per-consumer installations and `site` directory. Then select `firefox`,
`safari`, or `both` (the default):

```sh
EN_EXECUTION_OUTPUT=/absolute/new/native-product-run \
EN_FRAMEWORK_OUT=/absolute/retained/framework-fixture \
  tooling/test-pipeline/with-toolchain.sh node probes/native-browser-products/run.mjs firefox
```

The output directory must not exist. The runner takes the normal machine and
checkout leases, checks every retained consumer asset against its preparation
hash, and serves only those files on an ephemeral loopback port. This is an
explicit reuse of qualified packed artifacts, **not a fresh installation or type
compilation**. It uses the shared cohort list, including the preceding minor and
retained previous-major/EOL subjects. Framework/version provenance comes from the
retained preparation, not the current date alone.

Firefox defaults to the installed `/Applications/Firefox.app`. Set
`EN_FIREFOX_APP=/absolute/isolated/Firefox.app` to qualify another distribution
without changing the installed browser. The runner checks its bundle identifier,
resolves the executable inside that bundle, and compares reported/browser app
versions. Acquire official archives and verify their checksums and code signatures
before running them; this runner does not download or install browsers.
Firefox launches headlessly, with
`--no-remote`, an exclusive fresh profile in the output directory, and a loopback
BiDi endpoint. Safari uses `/usr/bin/safaridriver` and its separate automation
window; it has no headless mode here. Sessions, driver processes and server belong
to this run and are closed afterward. Keep the output, profiles and logs local.
The runner never enables Safari automation or changes normal profiles.

## Exact coverage

Six scenarios now run for each of ten consumers:

1. Parsed server-rendered checkbox/select hosts, shadow root and native control
   identity survive both hydration owners; native pointer activation works.
2. A tentative change accepts, rolls back when canceled, and yields to an
   authoritative property write. The exact event records and keyboard activation
   are checked.
3. Framework object/string updates stay properties and remain silent; actual
   keyboard input edits the native field. Unmount/remount preserves framework
   state (including checked state), removes the detached tree listener, and accepts
   Enter on the remounted tree. The disposal-only event is deliberately synthetic.
4. The adjacent framework-owned checkbox reflects authoritative updates, native
   pointer/Space actions and accepted/canceled/superseding interactions.
5. Adding/removing authored select options retains the native select node. Native
   End/Enter keyboard input changes both native and element values.
6. Tree object updates remain silent; pointer activation updates framework state.
   Firefox also checks computed textbox/tree names and roles through BiDi queries
   started inside the corresponding shadow root.

DOM scripting reads state, retains identity references, sets focus and selects
input text. Pointer and key actions use the standard remote input protocols;
there is no scripted `.click()` or synthetic keyboard event. These are a bounded
suite. The six-case grouping differs from Playwright: this runner checks DOM
description text but not its computed accessible description. Firefox computed
names/roles do not establish a complete accessibility snapshot, spoken output,
IME, physical-device coverage or full reference workflows. Safari has no such
locator implementation here and is still unqualified.

## October 2 result

[Verification](verification-20261002.json) records **30 passes in actual
Firefox157.0**, build15726.9.24, on macOS26.6.1 (25G76), arm64. The full Firefox
application distribution hash was unchanged before and after. The retained packed
assets are the exact October2 release-line acquisition; no new type checks are
claimed in this run.

Safari27.0 WebDriver session creation succeeded. Two timed-out attempts were
followed by two diagnostic attempts; none qualified a component scenario. The
page reported `visibilityState: hidden`, client rendering had occurred, no script
errors were captured, and the fixture's animation-frame readiness marker never
settled. Explicit WebDriver window selection/sizing did not change that result.
Hidden-page frame suspension is a plausible explanation, not a proven component
or browser defect. The readiness assertion was retained. Revisit Safari with a
visible automation window and retain the original failures. Safari identity covers
the app and driver bytes plus exact OS build; it does not hash every system WebKit
framework. This distinction stays explicit in the receipt.

Sources: [Apple Safari WebDriver setup](https://developer.apple.com/documentation/safari-developer-tools/macos-enabling-webdriver),
[Mozilla direct BiDi connection](https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection),
[standard input actions](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/input/performActions).

## Current and preceding Firefox

[October2 release-line verification](verification-firefox-lines-20261002.json)
records **60 passes**:30 each on Firefox157.0 and isolated156.0.1, using the same
three scenarios and ten packed consumers. Both full app inventories stayed
unchanged. The preceding distribution came from Mozilla's official mac/en-US
archive, matched its published SHA512 and passed macOS deep/strict code-signature
verification. The initial sandbox signature check failed to resolve authority;
verification with normal macOS trust access passed for the mounted source and
isolated copy. No signing, quarantine or browser security setting was changed.
The mounted image was detached; download, fresh test profiles and raw evidence
remain local. The installed Firefox was not downgraded.

The earlier157-only receipt remains historical at its original runner hash.
This newer receipt binds the distribution-selection runner to both tested lines.
Safari's unresolved visibility diagnostics remain separate; this subset does not
qualify preceding Chrome/Edge/Safari, other OSes or physical/manual acceptance.

## Expanded Firefox consumer checkpoint

[Expanded October 2 receipt](verification-firefox-expanded-20261002.json) records
60 passes per release, 120 total, using the six scenarios above. Both distribution
inventories are unchanged. That historical receipt binds its runner before transport extraction; older
three-scenario receipts retain their original hashes and counts.

The first two runs failed the new accessibility query because it started at the
document boundary. A role-only diagnostic also found no shadow-tree textboxes or
tree items. [BiDi `startNodes`](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/browsingContext/locateNodes)
now supplies the exact component shadow root; the same names/roles then pass on
both releases. No component naming change or assertion removal was needed.
The failed receipts remain local and summarized in the new source receipt.

## Production workflow subset

Run the selected production journeys against the already qualified `dist` build:

```sh
EN_EXECUTION_OUTPUT=/absolute/new/firefox-workflow-run \
EN_FIREFOX_APP=/absolute/isolated/Firefox.app \
  tooling/test-pipeline/with-toolchain.sh node probes/native-browser-products/workflows.mjs
```

The runner takes the normal machine/checkout leases, starts its own loopback
server and fresh Firefox profile per case, and checks full browser, workflow
source and production asset identities before/after. It never changes an installed
browser or user profile. Native key/pointer actions edit and activate controls;
DOM calls inspect values, form data, identity and validity. The shared transport's
accessible locator explicitly traverses each shadow root, including a supplied
root host's own shadow tree. Native option-label typeahead plus Tab commits select
choices; exact values are asserted. Native popup arrow behavior remains a separate
manual check, consistent with the existing [native-select parity findings](../../packages/elements/src/forms-private/README.md).

[Workflow verification](verification-firefox-workflows-20261002.json) records
11 selected SSO/settings/chat/selection journeys per release (22 total), plus
120 consumer passes after extracting the shared transport. Five failed acquisition
attempts remain summarized in the receipt with their original diagnostics.
The receipt binds both runners and the shared helper. It preserves the original
[Playwright workflow](../../apps/docs/tests/workflows.spec.ts) and
[selection](../../apps/docs/tests/selection.spec.ts) suites as the full contracts.
This subset does not claim all of their assertions: remaining branches,
hydration interception/pre-module edits, no-JS, responsive/history cases,
computed descriptions/full AX, axe, speech, physical devices and IME remain open.

## Expanded recovery and navigation checkpoint

[Recovery verification](verification-firefox-recovery-20261002.json) expands the
same workflow command to20 journeys per release (40 total), retaining the original
11. Added coverage includes invalid drafts and error-link focus without geometry
shift, settings restore/reset, failed chat snapshot and apply retry, unsupported
action payloads, late permission/target changes, disconnect/reconnect cleanup,
disabled project choices/reset, portrait/landscape RTL scrolling/popup bounds and
native navigation across all six documents with preview/query context preserved.

The shared transport and consumer runner did not change; the prior120-consumer
qualification is reused by hash, not reported as a fresh run. Each workflow uses a
fresh profile and native input. Character key actions are batched to preserve the
existing delayed-response fixture timing. The full original Playwright assertions
remain authoritative; hydration/no-JS, computed descriptions/full AX, axe and
remaining history/accessibility/manual/physical requirements remain outstanding.

The final retry check retains the composer node before Retry and enters a short
native draft. It explicitly proves that the draft and backward selection exist
while the reply is still pending, then checks the same node, focus, value and
selection after delivery. An intermediate strengthened run failed that timing
precondition on current Firefox because locating and typing a longer draft used
up the600ms fixture delay; it is retained in the receipt. The final test changes
neither the fixture delay nor the product behavior.

## Firefox first paint and hydration

The [first-paint receipt](verification-firefox-first-paint-20261002.json) records
170 passes across actual Firefox156.0.1 and157.0: five first-paint/hydration cases,
60 consumer cases and20 workflow cases per release. Browser and source/asset
inventories remain unchanged. Existing production and consumer builds are reused.

Run `first-paint.mjs` with the same `EN_EXECUTION_OUTPUT` and `EN_FIREFOX_APP`
configuration as the workflow runner. Each case uses a fresh isolated profile.
The no-JavaScript case disables page scripting only in that profile, checks inline
and external script canaries, and verifies all six direct and legacy SSR routes
(12 documents). Four hydration cases hold module responses, type into the original
native account/chat/project/numeric inputs, then release unchanged modules and
assert draft, node identity, focus and selection retention. Invalid numeric and
unaccepted project drafts do not silently change accepted form data.

Firefox accessibility locators stall while module responses are held. The harness
therefore uses known native DOM targets for early input and requires browser-computed
name/role lookup to return the same node after hydration. The separate no-JS case
also checks computed names. This is not computed accessibility evidence during
module loading, full AX or spoken-output evidence. Typing is native; selection-range
setup is explicit DOM configuration. Failed/aborted acquisition attempts remain
recorded with their scope and exact cleanup receipts; none are relabeled passes.

The changed shared transport is freshly requalified against all120 consumer and40
workflow cases. Earlier receipts retain historical source hashes. Remaining history,
computed descriptions/full AX, original OS/device and manual AT/IME requirements
remain open; these cases do not establish complete original Playwright parity.

## Native Firefox accessibility and narrow layouts

The [accessibility receipt](verification-firefox-accessibility-20261002.json)
records44 passes:22 workflow journeys on each actual Firefox release. Eight scoped
axe4.13.0 scans per release use the original WCAG2A/AA,2.1AA and2.2AA tags and
scene/theme-controls inclusion: SSO/settings/chat before and after validation or
preview, plus the open project popup in portrait/landscape RTL. All have zero
violations; full local scan results retain incomplete findings separately. Native
checks additionally verify the settings trigger forwards popup/expanded state to
its actual button, opens the named menu, and restores focus on Escape. Project
input/trigger ID references resolve to the same visible listbox in their shadow
root, whose browser-computed name is also checked. These targeted checks explain
the ARIA review items without claiming full native AX or speech acceptance. Axe
cannot determine some backgrounds under slotted labels or scrolled/clipped text;
those contrast findings remain explicitly unverified.

Status-region checks cover authored or implicit DOM roles, exact owner counts,
native `checkVisibility()` and the empty atomic settings announcement. They do
not claim a full platform accessibility tree or screen-reader output. Both narrow
orientations also preserve native account, numeric and chat editing without page
horizontal overflow. This supplements the original Chromium-only narrow test;
physical phone/tablet coverage remains separate.

The shared transport and consumer/first-paint runners are unchanged. Their prior
120-consumer/10-first-paint qualification is retained by hash, not reported as a
fresh run. Original history/legacy-query assertions, computed descriptions/full
AX, other OSes and physical/manual AT/IME requirements remain outstanding.

## Native Firefox history and legacy navigation

The [history receipt](verification-firefox-history-20261002.json) records176 fresh
passes after adding the standard BiDi `browsingContext.traverseHistory` command:
46 workflow,10 first-paint/hydration and120 consumer cases across Firefox156.0.1
and157.0. The history journey follows the original Playwright contract: native
appearance/density/direction controls; query-preserving native links; unchanged
source disclosure through workflow reset; Back/Forward with destination readiness;
fresh-link fixture reset; legacy hash redirects; and unknown query normalization.
Eight context checkpoints per release retain exact observed URLs.

History restoration may use BFCache; no fresh-state assertion is imposed on Back
or Forward. Only a fresh native link must recreate the local fixture. The protocol
command queues real browser session-history traversal; it does not replace DOM
or simulate routing. The runner waits for the destination URL and hydrated scene.
[Protocol contract](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/browsingContext/traverseHistory).

The changed shared transport is requalified across all three native runners.
Existing assets and packed fixtures are hash-verified and reused. Repetitive
native-select traces remain in full local receipts; source summaries bind those
receipts by hash. Prior scans' incomplete contrast findings and remaining exact
assertion parity (including all authored-child readiness, descriptions/errors),
full native AX/speech and original OS/device/manual requirements remain open.

## Native Firefox readiness and validation relationships

The [readiness receipt](verification-firefox-readiness-20261002.json) records56
fresh passes across actual Firefox156.0.1 and157.0:46 workflow and10 first-paint
cases. Both runners share the original authored-child readiness contract. Each
custom child must have the correct registration/instance and finish its first
update; only the exact dormant settings command palette remains unregistered.
This is checked after fresh navigation, reconnect, history restoration and module
release. The disabled-script and held-module states deliberately do not require
hydration. Full per-child diagnostics remain in each readiness checkpoint.

SSO now checks1px/2px/1px valid/invalid/corrected borders without geometry changes,
error-link focus, invalid email/pattern states and same-root description/error
references. The valid field retains only its guidance reference. The slider's
visible validation error must be the actual node referenced by its editor.
These checks establish DOM relationships and native editing/focus behavior;
they do not establish native computed accessible descriptions or spoken output.

The shared browser transport and consumer runner are unchanged by hash, so the
prior120 consumer passes are reused explicitly rather than counted as fresh.
Existing production assets are unchanged. Remaining settings/chat focus and
pending-state branches, native AX, incomplete visual contrast findings and
original OS/device/manual requirements stay open.

## Native Firefox pending-state and focus qualification

The [interaction receipt](verification-firefox-interactions-20261002.json) records
46 fresh workflow passes on Firefox156.0.1 and157.0. Settings save/cancel checks
now cover the saved/dirty status and returned button focus. Explicit incoming
opacity acceptance preserves SVG, landscape and transparent-background choices.
Chat verifies pending-card identity across another reply, rejection of invalid
Apply, source/adjustment focus, deduplicated held requests, a newer native draft
established before delayed Apply completes, and working controls after Reset.
The short native draft avoids remote typing latency consuming the600ms fixture
delay; its before-completion value/revision is asserted rather than assumed.

Primary workflow navigation name/current link, reset-button name and isolated
source disclosure are checked after navigation/history/reconnect. SSO captured
values and selection accepted IDs, disabled choices and form validity have
additional explicit assertions. These are behavioral checks against unchanged
production assets. They do not claim full native AX, speech or literal parity
with every Playwright assertion. The original no-JS HTTP/redirect/header-link
checks, screenshots and computed descriptions retain their separate boundaries.

Two failed harness attempts are retained: raw versus whitespace-normalized text,
and a caption scoped to the wrong card. Both were corrected to the original
Playwright contract without changing production code or weakening the pending
card identity check. The unchanged transport/first-paint/consumer evidence is
reused by hash:10 first-paint and120 consumer passes are not fresh run counts.
Packed HTML/SSR breadth and original product/OS/device/manual obligations remain.

## Native Firefox no-JS document responses

The [document response receipt](verification-firefox-documents-20261002.json)
records **178 fresh passes** across actual Firefox156.0.1 and157.0:12 first-paint/
network-control cases,46 production workflow cases and120 packed consumer cases.
Both product distributions and source/build inputs retain matching before/after
identities. Requalifying all three runners covers the shared transport change;
these counts are fresh acquisitions, not transferred historical passes.

The transport optionally subscribes to standard
[`network.responseCompleted`](https://www.w3.org/TR/webdriver-bidi/#event-network-responseCompleted)
events for its own browser context. Checks match the document's navigation ID and
final URL, recording HTTP status and redirect count without headers, cookies or
response bodies. An actual404 control and an actual302→200 redirect control
establish that the journal distinguishes failure and redirects. Each release then
verifies the homepage and all12 direct/legacy workflow URLs return200 without a
redirect, with scripting disabled and the documentation-header Workflows link
present. Visible isolated scenes, named native navigation and the original
primary-workflow reset/source controls are checked. Four early-draft hydration
journeys still retain input identity, focus/selection and accepted form state.

These checks serve unchanged qualified production assets through an owned local
server; they are not cloud-edge routing or deployment HTTP certification. Native
full AX/computed descriptions, speech, incomplete contrast findings, remaining
exact assertion differences and the original product/OS/device/manual scope remain.

## Source comparison of the original workflow contracts

The [assertion comparison](assertion-comparison.md) maps all27 original workflow
and selection cases and their shared helpers. The [new receipt](verification-firefox-assertions-20261002.json)
records180 fresh checks on actual Firefox156.0.1/157.0:24 workflow,6 first-paint
and60 retained packed-consumer cases per release. Exact messages, visibility,
selection sequencing and native link readiness are strengthened. An opt-in BiDi
error journal survives document navigation; negative controls verify it records
console and uncaught errors. Production assets remain unchanged.

The map records adaptations and outstanding computed-description, early-label,
status-role, visual and physical/manual boundaries. It is not an assertion-count
proof of equivalence. Failed and superseded acquisitions remain recorded; prior
receipts retain their original source bytes under `qualification-sources/e29ffc7c`.
