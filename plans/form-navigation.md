# Validation summary, progress steps and multi-step forms

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

Implement the next retained form phase after the reviewed hover/calendar work.
No package version changes or added pattern-count units.

- `en-validation-summary`: application-supplied same-root target/message records,
  heading/description slots, native error links, explicit summary focus and a
  cancelable focus command for cross-step/root orchestration. No form scanning.
- `en-progress-steps`: keyed items with separate current/completion/error/disabled
  states, rich noninteractive named label slots, native ordered navigation,
  single cancelable tentative `en-change`, silent author writes, read-only mode,
  shared button themes and responsive wrapping. No implicit validation or routing.
- Three-step project brief: details, date and review; retained edits, explicit
  error focus, back/revisit, controlled navigation veto, pending/save failure/retry,
  success and reset. This is an application recipe, not an opinionated wizard element.
- Same maintained source on the sticker sheet, API demo/source, inspired-theme
  controls and a separately addressable workflow. Generated CEM covers APIs.
- Verify SSR/no-JS structure and hydration, error target focus, transition veto
  and explicit author writes, dynamic items, narrow/RTL/forced colors, theme focus
  and error rendering, and save/reset lifecycle in Chromium/Firefox/WebKit.

Boundaries: application business validation and service simulation are explicit;
production server validation, real persistence and actual AT/device acceptance
remain consumer/manual review responsibilities. Both data and direct-child APIs preserve this ownership and hydration.

References: [WAI multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/)
and [GOV.UK error summaries](https://design-system.service.gov.uk/components/error-summary/).

Next retained element family: toast and notification region. Tree extensions,
chat/composer, presence/activity, carousel and rich text remain in the inventory.

## Mobile review follow-up

Replace narrow stacking with a container-responsive native disclosure, keeping a
single ordered list, SSR/no-JS access and keyboard focus across layout changes.
Use localized compact current/count and completion text; preserve desktop list.
Fix inline display overriding hidden on inactive/success workflow content.

## Child-authored flexibility follow-up

Implemented direct `en-progress-step` descriptors and native validation anchors
alongside `items`. Children take precedence; removing the last restores arrays.
Rich original nodes are projected into parent-owned semantics. Live insertion,
removal, reordering and metadata edits preserve current-value ownership and the
single cancelable `en-change`. Summary anchors retain native modified-click
behavior and delegate ordinary same-root focus through `en-action`.

The request-local buffered SSR adapter assigns internal slots and renders the
same initial list as hydration. Direct recognized children are the boundary;
forwarded whole lists and wrapped descriptors are intentionally unsupported.
Use explicit plain `label` for compact text when rich labels compose other shadow
content. Existing named label/heading/description/summary slots remain supported.

The shared workflow defaults to child authoring with an array comparison switch
under Review scenarios. API docs and maintained example source show both.
Verification: 51 Chromium/Firefox/WebKit checks and four SSR checks pass, covering
no-JS layout, early edits, mutations, focus recovery, veto, fallback and themes.
Manual review remains distinct from implementation verification.
