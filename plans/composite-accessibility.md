# Composite accessibility follow-ups

This follow-up starts from main `66386af7daac295cb2e178236d45289a9ebced4f`,
including the newer rich-editor and scrolling work. Implementation lives in an
isolated checkout; the original working tree and unrelated feedback are preserved.
The description attribute/property, `slot="description"` and `::part(description)`
remain unchanged.

| Focused control | Description and error ownership |
| --- | --- |
| Color-slider native range | Existing visible outer description; existing range error behavior. |
| Color-slider nested native exact input | Actual outer description element plus local field guidance/error elements, using the same element-reference technique as en-button. |
| Range-slider two thumbs and two native exact inputs | Shared description followed by application error when present; invalid state clears with the error. |
| Single-date native input | Field guidance/error plus existing non-Gregorian native-edit instruction. |
| Single-date calendar trigger | Calendar action; field guidance is not duplicated. |
| Range-date native trigger | Field guidance/error via existing en-button forwarding, re-resolved after parent rendering; invalid state also appears in SSR. |
| Range-date native endpoint inputs | Visible edit instruction followed by current range rejection; no repeated outer field description. |
| Modal and calendar controls | Retain their own modal summary, navigation and calendar instructions. |

## Implementation details

The color input references real elements in its own and ancestor shadow roots.
It does not clone help text, move authored links, or observe text to manufacture
an alternative description. A narrowly scoped observer reconciles local field
error insertion/removal and native ARIA changes; its lifetime follows the nested
editor and composite connection. Empty/hidden assignment still suppresses the
fallback; removing assignment restores the latest string. Slot text updates
change the same referenced target.

Range-slider continues using the existing field error convention: `aria-describedby`
includes the error and `aria-invalid` identifies invalid controls. The error has
a stable ID while present. A guarded value binding prevents help/error-only
renders from overwriting native uncommitted drafts; accepted value changes,
authoritative writes (including equal values), interaction constraints and
explicit editing completion retain reconciliation behavior.

Date-range endpoints are slotted into the modal but remain in the date-picker's
shadow tree, so ordinary same-root ID references are appropriate. The trigger's
old reference to the single-date-only edit instruction is removed in range mode.
The current range rejection remains the existing status region; no additional
live announcement is added. Application errors and endpoint draft errors retain
their existing validation lifecycles. `en-button` forwards the standard
`aria-invalid` attribute through its existing native-template ARIA mechanism.
Generated CEM, API/type snapshots and customization receipts are refreshed.

## Browser and SSR limits

Element-reference reflection (`ariaDescribedByElements`) requires a supporting
browser and JavaScript. It cannot be serialized as a cross-shadow IDREF in initial
SSR HTML. Before hydration, and without the API, guidance remains visible but the
color exact input and date-range native trigger lack the outer help association.
Same-root range, field and endpoint relationships are present in SSR, as is the
range trigger's scalar invalid state. No misleading cross-root ID or text mirror
is used as a fallback.

Focused tests use real DSD, hydration and actual native controls, including nested
shadow roots. They cover slot/string precedence, empty/hidden content, removal,
restoration, text changes, errors and required-validation recovery, reconnect,
editor removal/recreation, focus and node identity, native uncommitted drafts,
accepted values, synthetic composition, form submission, reset and cancelable
range application. Chromium's native accessibility tree checks the nested color
input description; all three engines verify native element-reference identities.
Playwright's synthesized accessible-description helper alone cannot establish a
cross-root property relationship.

Actual screen-reader announcement/order/help-link acceptance and real IME
composition remain pending. Synthetic composition events, native reference
properties and accessibility-tree output are automated evidence, not manual
acceptance. No physical-device or current-minus-one browser qualification is claimed.

## Verification and publication receipts

Compact checks, source hashes and limitations are recorded in
`artifacts/composite-accessibility/verification.json`. Raw logs and traces remain
local. The publication uses the existing owner-private documentation site and the
established source snapshot excluding only `showcases/performance/baselines/`.
Local main and its benchmark archives remain intact. Publication identifiers are
persisted in the independent Progress Report and local publication receipt.

Final automated results: 180 distinct browser cases passed across Chromium,
Firefox and WebKit; 69 tooling and 71 SSR Node tests passed. Full workspace build,
final production documentation build and generated contract freshness checks passed.
No final failures, flaky cases or skips. See the compact receipt for exact suites
and installed engine versions.
