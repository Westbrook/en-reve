# Cross-root label / Reference Target qualification

This comparison investigates the remaining `platform-proofs` scope. It retains the
frozen upstream experiment alongside the production common-field bridge and SSR
serializer. No polyfill is implicitly installed and no private control getter is
published. Keep internal label attributes/slots for unsupported engines before
hydration; external labels are progressively connected by the common-field adapter.

## Reproduce

Use the repository's pinned runtime and installed matching Playwright engines.
Build the element dependencies first. `npm run test:probes` includes the original
platform tests, this browser configuration and the pinned-source/import tests.
For focused work, run these commands under the standard machine/checkout leases
with a fresh `EN_EXECUTION_OUTPUT` and `EN_TEST_PIPELINE_OUTPUT` destination:

```sh
tooling/test-pipeline/with-toolchain.sh node --test probes/reference-target/vendor.test.mjs
tooling/test-pipeline/with-toolchain.sh node node_modules/@playwright/test/cli.js test --config probes/reference-target/playwright.config.ts
```

The loopback fixture uses port 47853. It compares native controls, an ordinary
shadow host, a real form-associated `en-text-field`, and pre-existing declarative
shadow DOM. Its `forced` mode is a test-only fallback comparison, not a production
override. `automatic` retains the upstream package's native-routing policy.
The test fixture owns its private node access; no such getter is added to En Reve.

## Pinned source

The unmodified label-adapter closure and separately receipted text-name adapter are vendored from
[Westbrook/reference-target-polyfill at 7d30ef45](https://github.com/Westbrook/reference-target-polyfill/tree/7d30ef45468001166ad0f6ae4fc89824b19b5887).
The MIT license and original SHA-256 receipt are retained in `vendor/`. The added `text-names.provenance.json` retains the same frozen revision without changing the original closure receipt. The package has no
runtime dependencies; no install scripts or framework examples are acquired.
Do not patch that frozen copy to manufacture a passing qualification. A reviewed
replacement revision needs a new provenance record and the same comparison.

## Findings (2026-10-01)

The tested engines are Chromium 153.0.8010.12, Firefox 155.0 and Playwright WebKit
26.6. These are pinned-engine observations, not Safari or screen-reader acceptance.

| Relationship | Native Chromium | Forced label fallback |
| --- | --- | --- |
| Ordinary shadow host: external label name and activation | Native relationship and focus verified | Reflected outward label list and focus verified in three engines; Chromium AX name verified |
| Isolated FACE baseline | Native forwarding gives the inner input external and internal labels in the fixture | Intentionally skipped by the upstream label adapter; the external label still does not name or focus the inner field |
| Pre-existing declarative root | Native Chromium AX name verified | Explicit late setup retains the input, draft and selection, supplies label references and activation |
| Label text edit | Covered through native label relationships | Reflected reference remains live; Chromium AX name changes |
| Replace the label node | Native behavior remains a separate path | **Known failure:** the inner naming reference is lost in all three engines; Chromium AX confirms the loss |
| Native API availability | Basic routing and nullable-target probes pass | Firefox/WebKit have no native surface in this tested configuration; this is why fallback and native proofs remain separate |

The initial upstream-only run records **24 passing cases, three expected failures and six
capability/protocol skips**. The two pinned-source/import checks and four test-view
checks pass. The original platform suite was not rerun in this slice.

The label replacement case is retained as an explicit expected failure. It is an
adoption blocker, not a supported feature or an automatic waiver. An unexpected
pass requires reviewing the new upstream/browser behavior. Passing the probe
command does not establish universal Reference Target support.

Source analysis points to `labels.js` ownership reconciliation: once a referenced
label disconnects, the browser filters it from the reflected element list. The
adapter then treats its existing binding as no longer owned; the residual empty
`aria-labelledby` attribute prevents it from assigning the replacement label.
The probe preserves the upstream implementation rather than replacing this with
flattened text or changing native form ownership.

Playwright's accessible-name matcher in this pinned version does not account for
the outward `ariaLabelledByElements` list used by the fallback. The initial run
reported empty names while Chromium's native AX tree contained the label. Tests
therefore verify actual IDL reference identity separately, and use CDP for
Chromium's computed name and mutation/removal behavior. Firefox/WebKit reference
assertions do not prove their native accessibility output or spoken speech.

## Component-owned FACE experiment

The combined run adds the owned-field cases and records **51 actual passes,
four expected failures and eight capability/protocol skips**, with no unexpected
failures. The four failures are the three retained upstream replacement cases
and the Firefox raw-label-list case below. Three pinned-source/pure-import checks
and four public-test-view checks pass. The original broad platform suite was not
rerun; these counts apply only to this Reference Target comparison.

`owned-field.js` subclasses the real text field without changing its editing or
form adapters. The original isolated controller remains in `owned-labels.js` as
comparison evidence; the fixture now exercises the production `FieldLabels`
controller inherited from `FormField`. It reflects actual external and internal
label elements, preserves author native naming, and uses native forwarding only
when the input's actual `labels` relationship confirms it. No flattened label-text
copy, synthetic editing event or public private-node getter is introduced.

The comparison covers replacement/removal/retargeting, wrapping and multiple
labels, the existing label slot, author naming, movement between roots, disabled
fieldsets, real typing, canceled semantic changes and form reset. A shared
Node/browser subclass also runs through the real En Reve SSR renderer and Lit
hydration. The existing native input, live draft, focus and selection survive;
the draft is accepted at its native editing boundary and reaches FormData.
Chromium CDP separately checks computed names across label replacement, slot
changes and SSR hydration. Other-engine relationship checks are not native AX or
screen-reader acceptance.

Two details are important for production adoption:

- Reflected ARIA references are filtered by eligible tree scope. Comparing a
  stale full list loses ownership after a label or host disconnects. The
  experiment compares surviving identities in the input's ancestor roots before
  clearing only its own references.
- Firefox 155 can leave a retargeted label in `ElementInternals.labels` after
  `label.control` changes. The bridge verifies `label.control === host` as well.
  A separate expected-failure case retains the raw browser discrepancy, so the
  workaround does not turn it into a native-support claim. Native `fill()` event
  sequences also differ by engine; reset is checked against the actual sequence,
  not an assumed one-event implementation.

### Production integration

The subsequent production run records **69 actual passes, four expected failures
and eight capability/protocol skips** (81 cases). Six focused SSR Node tests pass;
the existing common form suite records **116 passes and one skip**. These are
subset receipts, not full platform or manual accessibility acceptance. The subsequent
full SSR Node gate passes all 88 cases. The full SSR browser run passed 231 cases
and exposed three demo tests that assumed the original first-field position;
after targeting the named field explicitly, all nine description tests passed.
The new production external-label example passes in all three engines, and the
three pinned-source/import checks pass. Metadata freshness, type/API/customization
checks and the production documentation build pass. Retained receipts distinguish
the initial failures from the focused corrected run; no broad rerun is implied.

All nine `FormField` families use the shared bridge: text field, textarea, number,
date, search, time, select, combobox and color field. A single observer serves each
Document or ShadowRoot and disconnects with its last subscriber. Native routing
requires the actual input label relationships, because a forced upstream polyfill
can expose `referenceTarget` without providing native FACE forwarding. Fallback
activation respects disabled state, interactive label descendants and cancellation
through the end of event dispatch. Existing authored native ARIA names take
precedence; arbitrary host ARIA and descriptions are not forwarded by this bridge.

Pinned Lit ignores `shadowRootOptions.referenceTarget` during serialization. The
production per-renderer adapter carries each actual target to its declarative
root, escapes values, preserves Lit markers and keeps records request-local.
Scoped and inert-template materialization preserve target and delegates-focus
options. Node coverage includes nested renderers, select/textarea placeholder
transforms, concurrent renders, escaping and null targets. Browser journeys cover
ordinary, scoped and inert-template delivery in all three installed engines,
including draft/node/selection preservation, external focus and FormData.

### Native choice activation

Checkbox, switch and radio now share the production label controller. Native
forwarding reads actual outer labels from both the native input and FACE host;
the fallback focuses and activates the existing native input exactly once.
Grouped radio selection, synchronous cancellation, authoritative writes, disabled
fields, interactive label descendants and reset keep their existing ownership.
Wrapping-label activation ignores the browser's secondary click on the host.

Choice inputs retain their explicit internal name reference. The referenced
`label-text` is hidden from separate accessibility-tree navigation so wrapping
labels do not count its text twice. Chromium CDP checks the computed names for
both explicit and wrapping external labels; other-engine tests verify reference
identity, native input names and interaction. Actual screen-reader speech remains
manual acceptance. Ordinary, scoped and inert-template SSR include all three
choice families alongside the common-field cases.

The final choice integration run records **95 actual reference-browser passes,
four retained expected failures and twelve capability/protocol skips**. The
existing choice suite passes **61 cases with two skips**; all **88 SSR Node tests**,
**234 full SSR browser cases** and **six built-site example cases** pass. Metadata,
type/API/customization freshness and the production docs build also pass. Earlier
native-name and wrapping-duplication failures are retained in the local evidence,
with the passing correction run separately identified.

## Decision and remaining work

Keep FACE submission/reset/validation ownership and the documented internal-label
and light-DOM native-composition routes. The production bridge does not install or
silently patch the frozen upstream package. Its three label-replacement failures
and Firefox's raw stale FACE label list remain visible expected failures.

The broader isolated comparison below covers the planned nested, conditional,
description/error, active-descendant and hydration-order experiments. It does
not adopt generic host ARIA forwarding: that is a separate semantic-owner API,
explicitly outside Reference Target's purpose. Closed roots remain outside the
library contract. Real screen readers, rolling current-minus-one releases and
physical devices remain outstanding in the Progress Report.

## Additional ARIA relationship comparison (2026-10-02)

`aria-fixture.html` / `aria-relations.spec.ts` compare native routing and the
same frozen upstream package with its opt-in `textNames` adapter. The provider
receives a public host and returns fixture-owned plain text; it never scrapes the
private target. Its generated hidden text proxies are an approximation, **not**
the native description relationship and not a production En Reve adoption.
No new field attribute, reflected-role contract or installed polyfill is added.

| Relationship | Observed native Chromium 153 | Frozen forced fallback in three engines | Library consequence |
| --- | --- | --- | --- |
| Two nested label targets; changing/missing target | Actual native label name and focus route to the current input | Reflected label and single focus route follow target changes | Retain relationship-specific activation checks and owned FACE bridge |
| Identical IDs in separate enclosing shadow roots | Labels stay within their own root | Reflected labels stay within their own root | Do not replace scoped ID resolution with a document scan |
| Nested description, target replacement/removal/insertion | Native AX description updates, keeping draft, focus and caret | Provider text/proxy follows valid targets; target absence clears it | Existing library descriptions keep actual same/ancestor-tree nodes; no generic text scrape |
| Active-descendant target changes | Native AX resolves the private option and clears a missing target; DOM getter still exposes the public host | Unsupported: reference remains the public host rather than the private option | Keep the editor/combobox semantic owner and its option IDs in the supported same-root composition |
| Error-message target | **Known gap:** native AX omits the forwarded error relationship while the same-tree error baseline works | Unsupported: reference remains the public error host | Keep existing component-owned hint/error nodes and documented description/error relationships |
| DSD before explicit late fallback setup | Native description is separately observed in the initial capture | Explicit hydration preserves the parsed native input, draft and caret; disposal restores authored IDREF and removes proxies | This isolated parser/adapter test complements, but does not replace, the real En Reve SSR/hydration suite |

The native error case is an explicit expected failure after a passing same-tree
baseline. Unexpected success requires reviewing the pinned browser's changed
behavior. Capability/protocol skips are separate: Firefox 155 and WebKit 26.6
lack native Reference Target here; CDP native AX inspection is Chromium-only.
Their fallback IDL assertions do not establish native AX output or screen-reader
speech. The fixture is test-owned; accessing its private nodes does not introduce
a public library getter.

The [Reference Target proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/reference-target-explainer.md#supported-attributes)
intends these relationships to work, but availability of the basic property or
label forwarding does not prove all of them. The frozen fallback explicitly
excludes generic error, active-descendant and other cross-root ARIA forwarding.
Keep unsupported relations on the documented same-root semantic composition;
do not infer full parity from either an expected-failure suite or plain-text
approximation.

### Qualification receipt

The full maintained `npm run test:probes` gate passes at the
[October 2 receipt](verification-20261002.json): **114 actual reference-browser
passes, five expected failures and 22 capability/protocol skips**, plus
**20 original platform-browser passes and one capability skip** and **four
source-integrity/pure-import Node checks**. Expected failures and skips are not
successful relationship implementations. The fresh-output preflight collision
in run 02 and corrected full run 03 remain separately retained. No production
component code changed in this comparison; the previously qualified production
build is reused unchanged for the source publication.
