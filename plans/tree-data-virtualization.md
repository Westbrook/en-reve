# Data-backed and virtual trees

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

The user approved the finite slotted Tree View and then requested a data API for
large virtualized hierarchies. This activates an existing selection-pattern
follow-up; it does not replace the approved slot-authoring contract or add a
second tree pattern to the inventory.

## API and state

Add optional property-only `items`, a readonly hierarchy of records with stable
`value`, plain `label`, optional `disabled`, and optional `children`. Undefined
keeps the slotted mode; an empty array is an explicitly empty data tree. Reject
mixing authored tree children and data rather than silently choosing one source.
Assign a new array to replace records. Validate keys across the complete model,
including collapsed descendants.

Keep parent `value`, `expanded`, and the single synchronous cancelable
`en-change` contract. Selection and focus remain independent. The complete model
owns branches and sibling positions even when their DOM nodes are not mounted.
This pass does not introduce remote loading, multi-selection or reordering.

`virtualize` opts into windowing. `scrollToKey(key, options)` uses the existing
scroll-into-view options contract and returns false for unknown or collapsed
items; applications expand ancestors explicitly. Scrolling does not change
selection or steal focus.

## Rendering and interaction

Derive a depth-first list of expanded-visible nodes and reuse the existing
VirtualCollection model and controller. Preserve nested treeitem/group semantics
with the mounted rows' ancestor chain retained. Measure each painted row without
including its descendants. A narrow optional measured-row resolver extends the
shared controller; existing list/table adapters retain their behavior.

Windowed items carry explicit levels and sibling positions/counts from the full
model. The [WAI-ARIA tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
requires hierarchy relationships as well as those attributes when the full set
is not mounted. Avoid cross-root ownership references and a second hidden tree.

Arrow keys, Home/End and typeahead traverse the whole expanded-visible model,
mounting destinations as needed. Keep the focused row mounted when scrolling
away. Tab leaves the composite. Collapsing or deleting a focused descendant
recovers to an available ancestor or neighbor only while the tree owns focus.

## Initial delivery and review

Render a deterministic initial window on the server. Preserve normalized
schema-limited data for standalone hydration; never serialize arbitrary render
callbacks or application payloads. Document that DOM windowing reduces mounted
elements but does not reduce the data model or its serialized response size.
Preserve authoritative consumer writes made before hydration.

Keep the existing slotted demo. Add an isolated large-tree demo with full/virtual
comparison, dynamic data replacement, scrolling controls and a usable code
sample. Exercise it through the sticker sheet, API reference and existing theme
controls. Publish a focused review card.

Verify pure model derivation and invalid data; SSR/hydration identity; keyboard,
focus, cancellation, mutation and scroll behavior; and accessibility snapshots in
Chromium, Firefox and WebKit. Include narrow touch layouts and RTL. Recheck the
existing list/table virtualization after the controller extension. Actual screen
reader traversal across windows remains a separate manual review, including the
previously recorded VoiceOver concern. Passing snapshots do not prove that
virtual-cursor behavior is correct.
