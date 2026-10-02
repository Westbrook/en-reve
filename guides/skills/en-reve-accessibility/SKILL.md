---
name: en-reve-accessibility
description: Investigate and test En Reve accessibility, including semantic ownership, keyboard/focus behavior, labels, responsive preferences and assistive-technology evidence. Use for accessibility work; do not equate automated snapshots or axe results with manual conformance.
---

# Test En Reve accessibility

## Responsibility

Own: Semantic ownership, keyboard/focus, accessibility preferences and automated/manual evidence.

General state-machine and transport tests belong to en-reve-test; component implementation and theme fixes retain their own owners. Accessibility findings do not authorize changes to platform settings or acceptance scope.

Load another skill only when that separate responsibility is needed for the user's
request. References provide contracts; they are not an instruction to execute
another entire workflow.


Read `plans/accessibility.md`, `plans/accessibility-review.md`, the affected
component's contract and `plans/support-coverage.md`. The baseline is applicable
WCAG 2.2 AA criteria plus complete-process review, not an assertion that a library
or isolated element is conformant. Preserve prior user observations and their
exact browser/version/scenario boundaries.

## Define the semantic owner and task

Identify the native element or host exposing role, name, state and value. Inspect
for duplicate interactive roles/tab stops, repeated labels, invalid table/list
structure and broken relationships across shadow roots. Use supported label,
description and error surfaces. Interactive help must remain reachable without
activating a noninteractive label. A host attribute is not proof that the inner
control has the same accessible name or error relationship.

Exercise keyboard entry, arrow behavior, Home/End where documented, activation,
Escape/cancellation, disabled behavior and exit. Text editing and IME shortcuts
must remain native. Test focus return after closure, removal and virtualization,
as well as selection versus focus. Distinguish DOM activeElement, visible focus,
`:focus-visible`, document focus and trusted event delivery. Safari may follow
different visible-focus/Tab rules; do not change its settings or force Chrome
behavior merely to make a test agree.

## Build layered evidence

1. Use the existing Playwright fixture through the supported runner; follow
   `en-reve-test` and the pipeline guide for resource ownership and fresh output.
2. Capture/assert the relevant accessible roles/names/states and order in default,
   expanded, error, selected and scrolled states. For virtual collections include
   ordinary scroll, programmatic scroll-to and Tab order with retained offscreen
   focus. Check content is not simultaneously duplicated or falsely counted.
3. Run the pinned axe version at meaningful states using applicable WCAG
   2.0/2.1/2.2 A/AA tags. An audit of a collapsed shell does not cover open menus,
   dialogs or validation errors. Preserve unsupported-rule and fixture limits.
4. Where the native Chrome AX boundary matters, use the maintained CDP fixture
   and retain its native tree evidence. CDP is Chromium-only; Playwright ARIA
   snapshots and native platform accessibility trees are different evidence.
5. Verify narrow reflow/zoom, text expansion, RTL, reduced motion, forced colors,
   contrast and target geometry where relevant. A simulated viewport does not
   establish physical touch, device zoom, display scaling or mobile AT behavior.

For manual review, provide a short reproducible task, expected outcome and exact
version/fixture. Record user-reported speech, navigation, IME/autofill and recovery
without inventing observations. Do not mark a manual item accepted because the
user opened it or a screenshot looks right. A stable cross-engine tree does not
prove a VoiceOver bug; retain unresolved native/AT behavior as a known issue with
reproduction, impact, available workaround and next evidence needed.

## Correct and document proportionately

Prefer a coherent native semantic structure and shared interaction fix. Do not
hide focusable content, insert redundant live announcements, add arbitrary focus
delays or change platform preferences to conceal a failure. Theme and application
composition can affect contrast, naming, reading order and targets; identify the
actual owner before changing the component. Keep each finding separate from its
hypothesis and from the remediation result.

Report automated findings, manual observations and untested coverage separately.
Update owning docs and the support ledger when evidence changes; never silently
rewrite historical receipts. Source code fixes and documentation can proceed
while physical/manual acceptance remains pending.
