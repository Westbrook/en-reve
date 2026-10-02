# Native Firefox assertion comparison — 2 October 2026

This is a comparison against all 23 tests in `apps/docs/tests/workflows.spec.ts`
and all four in `selection.spec.ts`, including their shared readiness, isolation,
input and error helpers. The [source-bound map](assertion-map-20261002.json) retains
the original titles, direct `expect` sites, corresponding native case IDs and
explicit adaptations. Its extracted sites are a review index, not executed
assertion counts. Actual acquisitions are in the [receipt](verification-firefox-assertions-20261002.json).

## Corrections from the comparison

- Exact user-message paragraphs replace transcript substring checks. The unsafe
  HTML sentinel must be undefined, rather than merely falsy.
- Error headings, incoming regions, saving/cancel controls and native listboxes
  receive explicit visibility checks. Retained editors are compared with the
  uniquely named current native node. Named forms are checked directly.
- The pointer-selection journey now retains its full sequence: last option,
  disabled option, unresolved text and invalid submission, restored accepted
  value, second assignment and reset. A separate keyboard journey supplements it.
- Every native workflow link checks the visible scene, named navigation, current
  link and actual theme/density/direction controls. The last Selection document
  must discard its prior assignment. Narrow RTL uses actual direction controls
  and links rather than separately opening each scene with a query parameter.
- A browser `log.entryAdded` journal retains console errors and uncaught errors
  across document replacement. A negative-control page emits known console and
  JavaScript errors, verifies info is distinguishable, then navigates to a clean
  page and verifies the error records survive. It never runs in production.
- Early hydration checks exact visible account values and the sent user-message
  paragraph, initial accepted values, and the documented isolation/navigation.

The first expanded run exposed a harness race after a native link: readiness
could still observe the outgoing document. Waiting for the destination pathname
before readiness fixes the race without changing production or relaxing a check.

An intermediate first-paint run also timed out in `browsingContext.locateNodes`
while module responses were deliberately held. Early navigation is now observed
through its actual DOM label, current link and visibility; it is not reported as
computed accessibility evidence. After modules are released, native computed
names/roles must resolve to the retained input. The early chat message count uses
the actual shadow article label and must change from zero to one after sending,
so a non-reflected host attribute cannot make the assertion vacuous. Both failed
acquisitions remain in the receipt; neither establishes a component defect.

## Explicit non-equivalence and remaining evidence

| Boundary | Native evidence | Still not established |
| --- | --- | --- |
| Accessible descriptions | Same-root IDREFs, visible guidance/error text, native validity | Two SSO computed-description assertions and one Selection description; complete native AX and spoken output |
| Early labels | Direct native input targeting before upgrade; unique computed name/role and retained node after hydration | Original pre-upgrade role/name lookup is not reproduced by that direct targeting |
| Status roles | Exact authored/implicit roles, owner counts and native visibility | Full platform-computed status-role parity |
| Delayed typing | Shorter `Next idea` draft and backward selection2–7 established before completion, retained afterward | Literal parity with Playwright's longer fill/selection2–9 or physical IME timing |
| Keep/Use grouping | Both paths and their outcomes in one native fixture | Original independent fixture boundary remains in the Playwright suite |
| Rendering evidence | Real geometry, CSS, scoped axe scans and retained incomplete findings | Original screenshot attachments, accepted VRT references, manual contrast/visual acceptance |
| Browser subject | Isolated actual Firefox156.0.1 and157.0 on the recorded macOS, native BiDi input | Other OSes, Safari, physical devices, AT, IME and connectivity |

No original Playwright assertion was removed or weakened. The source comparison
is now explicit; the remaining items above stay unqualified. Case-count agreement
is not used as proof of semantic equivalence. Qualified existing production assets
and retained packed framework fixtures are identified by hash; this acquisition
is not a new library build, installation or type compilation.

The journal uses the documented [WebDriver BiDi log event](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Reference/BiDi/Modules/log/entryAdded).
It subscribes only to its own isolated browser context and retains minimal text,
level, type and realm metadata from local fixtures; it never attaches to a normal
user browser session. Replay follows the existing [native runner instructions](README.md).
