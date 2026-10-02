# Application-owned tree consumers

The public `interactions/tree.js` and `interactions/tree-operations.js` entries
of `@en-reve/primitives` provide pure hierarchy, selection and move helpers.
They do not install a widget, attach handlers, fetch children or persist changes.
The [packed native consumer](../../../probes/tree-recipes/recipes.ts) composes
these helpers with native DOM and either the Lit or portable CSS tree styles,
without importing the elements package.

## Identity and selection

Normalize a complete hierarchy before accepting a replacement. `normalizeTreeData`
copies schema fields, freezes the result, rejects duplicate/blank keys and invalid
labels, and prefers canonical `key` over the legacy `value` alias. Keys are opaque;
do not reconstruct them from labels. Render labels as text, never trusted HTML.

`treeSnapshot` preserves unknown selection/expanded keys intentionally. A later
load may make them available. `deriveTreeDataRows` derives expanded preorder,
parent identity, subtree ends, levels, sibling positions and sibling counts from
the full hierarchy. It does not own DOM focus. `treeSelectedKeys` reads single or
multiple selection consistently; `treeSelection` receives the application's
available keys and range anchor. In multiple mode, replace clears other keys,
toggle changes one key, range replaces selection with an inclusive available
range, and all toggles the available set while preserving unavailable selections.

The example supplies enabled, visible keys, excludes disabled ancestors and keeps
the anchor separate from focus. Plain clicks replace; the platform modifier
toggles; Shift replaces an exact range and can shrink it. Space toggles without
selection following every arrow press. Collapsed selections remain in form data.
Applications choosing another selection policy must implement it explicitly.
Private SSR presentation attributes/adapters and the internally described anchor
class are not required by this consumer contract.

## Native semantics and focus

The application creates a labelled `tree`, nested `group` elements, and named
`treeitem` rows with derived `aria-level`, `aria-posinset`, `aria-setsize`,
`aria-selected` and branch-only `aria-expanded`. One row is a Tab entry. Disabled
rows remain discoverable; activation is guarded separately. Arrow keys move
focus, Home/End navigate preorder, and inline arrows expand/collapse or move to
children/parent, with RTL directions reversed. The application restores focus
when a subtree disappears. A separate status announces loading and results;
decorative loading placeholders appear as children and are hidden from the tree.
Retry buttons are outside the tree's structural group.

The example is finite and fully mounted. These scenarios do not qualify tree
virtualization, screen-reader speech or every DOM mutation/focus recovery path.
The existing owning-element virtualization contract remains separate.

## Reordering and loading

`treeIndex` identifies parents. `treeMoveTargets` supplies allowed destinations
without allocating a proposed hierarchy for each one; it can include no-ops.
`proposeTreeMove` rejects no-ops, disabled ancestry, cycles, missing targets and
insertion inside unresolved lazy branches. Selected ancestors subsume their
descendants and source preorder determines moved-root order. The proposal holds
previous and normalized proposed hierarchies; accepting it is the caller's job.

The example offers native desktop drag/drop plus Alt+Up/Down sibling moves. It
dispatches an application-specific cancelable `before-tree-move` before assignment.
That event is an example policy, not a library `en-*` event contract. A consumer
with persistence or authorization can veto, stage or validate before accepting.
Pointer/touch dragging, autoscroll, virtual destination measurement and undo are
additional application responsibilities, not provided by the pure helpers.

`TreeLoadChildren`, `TreeLoadContext`, `TreeBranchState` and `idleTreeBranch` define
shared types/default state; they do not implement a loading controller. The
example owns an AbortController and increasing request identity per load, ignores
late results after collapse/replacement, normalizes the complete proposed tree
before commit, and exposes retry after rejection or invalid returned identities.
An empty result becomes a loaded empty branch. Aborting only signals cancellation;
the stale-result guard still applies when a provider ignores the signal.

## Styles and scoping

Adopt `treeStyles`, `treeItemStyles` and `treeDataStyles` with foundation styles in
an application-owned rendering root, or use the combined portable `tree.css`.
The nested contract is `.en-tree` → `.en-tree-item[role=treeitem]` →
`.en-tree-option`, followed by a sibling `.en-tree-group`. `.en-tree-label`,
`.en-tree-indicator` and `.en-tree-drag` style row content. `.en-tree-data` removes
group spacing from measured data rows. The stylesheet includes host selectors;
do not treat it as a global reset for unrelated DOM.

Use documented `--en-option-*` family pins for row radius, padding and list gap.
Local overrides inherit through only their rendering scope. Selection paint and
focus outlines do not add layout height; option text prevents selection while
Shift-selecting. Styling supplies no ARIA, disabled guard or keyboard behavior.
Native consumer classes are the published stylesheet contract; they do not expose
an owning custom element's internal classes for application overrides.

## Qualification boundaries

The three pinned engines exercise each scenario with both style deliveries,
strict packed declarations, actual native activation/keyboard/form data and real
desktop drag events. Modifier-click uses Playwright's platform mapping: on this
macOS run it is Command, because Chromium treats Control-click as context-menu
activation. Control+A is separately exercised for the example's keyboard handler;
this does not establish Windows pointer behavior. Physical touch/IME, native AT
speech, retail Safari, other OSs, full SSR/hydration and separate-owner acceptance
remain separate obligations.
