# Actual Safari and Firefox product checks

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
inventories are unchanged. The source receipt binds the current runner; older
three-scenario receipts retain their original hashes and counts.

The first two runs failed the new accessibility query because it started at the
document boundary. A role-only diagnostic also found no shadow-tree textboxes or
tree items. [BiDi `startNodes`](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/browsingContext/locateNodes)
now supplies the exact component shadow root; the same names/roles then pass on
both releases. No component naming change or assertion removal was needed.
The failed receipts remain local and summarized in the new source receipt.
