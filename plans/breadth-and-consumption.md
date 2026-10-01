# Content, menus, framework consumption and stable pagination

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

This pass implements the four follow-ups authorized after the pagination review:
content/layout breadth, menu capabilities, framework consumption and documentation.
The user also requested the proposed stable pagination layout. These are bounded
slices of the existing inventory, not additions to the overall scope denominator.

## Content and layout

Complete the existing native list, file and empty-state recipes. Native `ul`, `ol`
and `dl` retain their semantics; interactive children remain ordinary links and
controls. A list is not implicitly a listbox or keyboard grid. Ordered lists keep
visible numbering, including explicit starting position and reversed order.

File presentation accepts long authored names, metadata, missing-media fallback
and availability content. Selection and preview/open/download actions remain
distinct and application-owned. The recipe does not infer permissions, request
remote files or invent alternative text.

Empty, no-results and unavailable examples explain their different circumstances
and offer contextual actions. They are ordinary content, without an automatic
alert role, focus movement or announcement policy.

## Menu capabilities

Extend the existing direct, slotted item API with checkbox and radio commands.
The activated item emits one cancelable `en-change`; all staged group state is
coherent during handling, and cancellation must preserve authoritative consumer
writes. Ordinary command actions retain `en-action`.

Nested menus retain the external `for` relationship, including when a parent
menu item is the opener. Submenu opening supports explicit pointer,
touch or keyboard activation. The next review refinement adds mouse hover with
a protected diagonal transit corridor, preserving the open branch on pointer
departure until another ancestor item is entered. Touch presentation replaces
the parent panel with a localized Back action. Parent/child focus ownership, RTL arrows, Escape,
Tab exit, disabled items, dismissal and dynamic content require separate checks.

## Framework consumers

Build isolated representative React, Vue, Svelte and HTML consumers. Verify
ordinary framework property/event binding, dynamic child content and cancellation,
alongside an explicitly documented declarative-shadow-DOM SSR island boundary.
An opaque island proof must not be described as arbitrary framework-template SSR
support. Keep dependencies and tests isolated from the documentation application.

Record exact tested versions. Current and preceding framework major lines are a
compatibility matrix for this pass; any upstream end-of-life line must be marked
as such. Passing examples are not a complete framework-support certification.

## Stable pagination

Use a consistent seven-position numbered region for sufficiently large totals,
with equal-width number and ellipsis positions and tabular numerals. Keep
Previous/Next in stable regions and status separate from the full action row.
Use a compact initial CSS layout with direct page access rather than accidental
wrapping. Preserve focused controls when the range or available space changes.

Geometry overrides belong in the token registry and managed editor. Public page
ownership continues to use the existing one-based page and single cancelable
`en-change` contract. Compact numeric entry must reject invalid values rather
than silently navigate to an unintended page.

The desktop stable layout was positively reviewed. The next refinement moves
direct entry into an inline ellipsis action, avoiding an extra trailing section.
Previous/Next content is slotted with official directional icon fallbacks.
The old text attributes are removed; localized accessible labels remain
independent of arbitrary icon content. A middle container tier retains first,
current and last pages in five reserved positions before compact delivery.
Boundary duplicates are omitted without shifting the action buttons. SSR,
native focus across width changes and dynamic slot edits need browser coverage. Opening entry must not resize or displace the pagination row.

## Follow-up review surfaces

Content recipes will demonstrate explicit loading placeholders with `en-skeleton`
and a surrounding busy state. Skeletons are decorative; the application owns
status, timing and recovery. Keep loading, empty, unavailable and successful
content distinguishable, with meaningful actions and aligned demo controls.

The loading geometry refinement retains the populated recipe's actual card,
media, text, metadata and action regions. Opt-in placeholders cover individual
regions rather than duplicating the collection in a separate estimated grid.
Verify each region's position and dimensions across grid/list, themes and narrow
screens, as well as retained node identity and inaccessible busy actions. Known
refresh geometry and estimated initial-fetch dimensions remain distinct contracts.

Menu buttons consistently author the official chevron in their suffix slot so
the indicator is present in initial HTML. Mixed command and selection menus use
semantic separators to distinguish ordinary commands, independent toggles and
radio sets. A divider does not change the application's single-selection rules.

## Review and completion evidence

Each slice needs independent review links, examples with clean imports, browser
interaction checks and relevant SSR/hydration evidence. Content and menu additions
must appear in the sticker sheet, isolated examples, application workflows and
inspired-theme review. Generated element API metadata remains source-derived.

The independent Progress Report records exact source/build/publication evidence
and user review separately. Full content/layout, menu, framework and documentation
workstreams remain open beyond this pass. The virtual-table VoiceOver traversal
finding stays open for its recorded manual revisit triggers; this work does not
diagnose or close that issue.

## Viewport-responsive nested menus

Keep touch replacement panels, and extend that presentation to narrow mouse or
keyboard windows. Compare visual viewport width with two themed parent-menu
widths plus the shared menu gap, within the existing batched positioning pass.
Resize changes presentation without changing open intent, replacing child DOM,
or dispatching a state event. Preserve a focused child row; if expansion removes
Back, recover to the first available child command before removing the action.
Verify LTR/RTL, deep branches, Back/Escape return and touch on wider windows.

## Mixed-control toolbar follow-up

The next scoped implementation is tracked in [Mixed toolbar and API phase](mixed-toolbar-and-api.md). Known mixed controls use `keyboard-navigation="tab"` with labelled group semantics in SSR; automatic button-only groups retain roving focus and conservatively release that ownership when other interactive children arrive. The shared isolated example and Settings output controls exercise normal editing keys and application-owned restoration. This does not promise roving mixed widgets, overflow menus, or complete selection/navigation acceptance.

## Tree-view baseline and tooltip focus priority

[This phase](tooltip-focus-and-tree.md) adds the finite slot-authored tree with parent-owned single selection and expansion, independent keyboard focus, direct-child SSR preparation, dynamic content handling, and shared themed/Settings examples. It does not imply lazy loading, virtualized hierarchy, multi-selection or drag reordering. Tooltip groups now reserve focused help against new hover; already attended help retains its persistence. Manual assistive-technology review remains distinct from browser snapshots and keyboard checks.
