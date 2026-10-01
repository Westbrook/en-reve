# Component and pattern gap closure

Implementation plan · September 20, 2026

## Scope and delivery

Close the component and pattern gaps identified in the five-library comparison, including the broader follow-on patterns summarized in the discussion. Preserve native semantics, existing theme roles, silent authoritative property writes, cancelable tentative user changes, form reset and SSR/hydration. Publish runnable examples and explicit capability boundaries; a styled placeholder does not close a behavioral gap.

Existing unrelated rich-text documentation and validation-summary edits are outside this work. The concurrent performance project and its report history are preserved.

## Sequence and acceptance

| Phase | Work package | Delivery and acceptance |
| --- | --- | --- |
| 1 | Persistent toggles and toggle groups | Native pressed semantics; single/multiple selection; empty selection policy; disabled and mixed state; keyboard and toolbar participation; cancel/author-write precedence. |
| 1 | Tags and multivalue picking | Stable keys, removable tags, independent search query, keyboard focus recovery, repeated form values, reset, required/read-only/disabled states. |
| 1 | Checkbox groups and choice cards | Aggregate form/validation owner and native whole-card choice recipe; no interactive descendants inside choice labels. |
| 1 | Context-menu invocation | Existing menu engine with target identity, pointer/keyboard anchoring, long-press cancellation, fallback action access and focus return. |
| 1 | Confirmation semantics | Existing dialog's actual surface supports alert-dialog semantics, a description and intentional initial focus; composable pending/error content. |
| 1 | Adorned and joined fields | Prefix/suffix and help action anatomy, coherent field boundary, separate focusable actions, accessible labeling. |
| 2 | Interval slider | Ordered endpoints, two named thumbs, step/collision rules, keyboard/RTL, exact-value alternatives, form/reset and cancellation. |
| 2 | Rich previews | Supplemental hover content with pointer transit and dismissal; explicit keyboard/touch access; essential content remains reachable. |
| 2 | Selection collections and measured overflow | Keyed finite selection with action boundaries; width-driven overflow keeps focused items reachable; bulk action composition. |
| 2 | Static and measured feedback | Non-announcing callouts, native meter recipe and determinate circular progress with semantic values. |
| 2 | Menubars and navigation flyouts | Coordinated menu keyboard ownership; website navigation remains links/disclosures; responsive shell recipe. |
| 2 | Sheet gestures | Snap points, pointer/scroll arbitration, cancellation, keyboard alternatives and native dialog focus lifecycle. |
| 3 | OTP input | One real input/value; one-time-code autofill, paste, leading zeros and accessible validation; decorative slots only. |
| 3 | Query builder | Structured serializable clauses with edit/remove, validation and draft/commit/cancel; filtering remains application-owned. |
| 3 | Media viewer | Dialog/carousel composition with bounded zoom/pan, keyboard alternatives, gallery identity and focus recovery. |
| 3 | Chart integration | Renderer-neutral theme/data contract, a working chart adapter, legend and text/table alternatives. |
| 3 | Streaming transcript | Stable keyed content and opt-in follow-latest; preserve reader position and expose return-to-latest. |
| 3 | Multistep questionnaire | Previous/next/skip, retained answers, validation, progress and focus to question/errors; persistence/submission remain application-owned. |
| 3 | Native content and layout recipes | Code/keycaps/time/separators, joined buttons, choice tiles, attachments and responsive app/form layouts. |
| 4 | Integration and evidence | Registration/export/metadata, documentation and comparison specimen; browser, transaction, form, accessibility, theme and SSR checks; commit and publication. |

## Design rules

- Reuse existing menu, dialog, positioning, focus, form and transaction foundations. Extend their public contracts where appropriate.
- Separate persistent selection from temporary press feedback. New surfaces inherit the theme families implemented in the preceding work.
- Prefer native input semantics and progressive form behavior. New collection owners expose stable values, not DOM references or private state.
- Keep remote data, transport, storage and destructive operations with applications.
- Treat cancellation, same-value author writes, disabled changes during dispatch, removal and focus recovery as part of the contract.
- Maintain per-package completion and evidence in the independent progress report. Unfinished packages remain visible in scope.

## Verification

Use focused model/transaction tests plus browser tests on real components. Exercise pointer and keyboard activation, forms/reset, author-write precedence, dynamic children, disabled/read-only states, RTL, reduced motion and forced colors where applicable. Verify registration and SSR through the established metadata/build pipeline. The comparison specimen must demonstrate working behavior under the existing theme selector. Browser automation does not establish physical-device or assistive-technology acceptance.

## Status

All planned component and recipe packages are implemented. The catalogue now contains 96 custom elements, including 19 additions. Delivered behavior, application boundaries and verification are recorded in [the implementation report](component-gap-implementation.md); publication and user review state remain in the independent project progress report.
