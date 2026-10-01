# Tree

`en-tree` is a finite vertical hierarchy for choosing one or several items while independently
opening branches. It is useful for a project outline or file selector. Ordinary
site navigation should continue to use native links and disclosure navigation.

```ts
import '@en-reve/elements/define/tree.js';

const tree = document.querySelector('en-tree')!;
tree.expanded = ['project'];
```

```html
<en-tree label="Project outline" value="cover">
  <en-tree-item value="project" label="Project">
    <en-tree-item slot="children" value="cover" label="Cover"></en-tree-item>
    <en-tree-item slot="children" value="notes">
      <span slot="label">Production <strong>notes</strong></span>
    </en-tree-item>
  </en-tree-item>
</en-tree>
```

Importing the definition entry registers both `en-tree` and `en-tree-item`.
Class-only entries remain free of registration effects. A separately registered
tree waits for its item classes; it does not claim undefined hosts as native
focus targets. Items outside an owning tree have no independent interaction.

## Label ownership

Data records use validated plain-text labels and have no `renderItem` or
`renderLabel` callback. Authored items may supply rich noninteractive text through
`label`, `prefix` and `suffix` slots; the tree owns hierarchy, item roles, selection,
focus and reordering. This is an intentional ownership boundary, not a missing
renderer. Keep links, buttons and editable controls outside item labels.

With `renderToString()` from `@en-reve/ssr`, authored and data reorderable trees
include their enabled drag handles on first paint and retain them through
hydration. Context providers do not replace the tree's SSR snapshot or its
validated parent/child membership.

## API-04 canonical names

Use `key` for record/child identity, `selectedKey` / `selectedKeys` for parent
selection, and `expandedKeys` for expansion. `selected-key` is the single-key
attribute. The older `value`, `values` and `expanded` names in the compatibility
examples below remain aliases. Event snapshots expose both sets of fields.
A `selectedKey` write replaces selection; in multiple mode its getter reads the
first selected key. Empty string clears single selection; empty arrays clear
multiple selection or expansion. Canonical attributes are inputs; legacy `value`
reflection is retained.

When both record fields are supplied, `key` wins, including validation of an
invalid canonical key. In markup, `key` and `selected-key` take precedence over
legacy attributes regardless of their order. Sequential property writes through
either vocabulary share one state and the last write wins. Normalized data records
expose immutable `key` and `value` with the same identity, including nested records.
Keys must be unique nonblank strings; surrounding whitespace is never trimmed.
Tree rendering remains `virtualize: boolean`; there is no tree pagination mode.

See [API-04 migration notes](../../../../plans/api-04-collections.md).

## Authoring and availability

Use direct default-slot items for roots and direct `slot="children"` items for
descendants. Every item must have an explicit, nonempty `value` unique across
the complete tree. Attribute labels or `slot="label"` content supply the name.
`prefix` and `suffix` content is decorative and excluded from the name. Labels
and decorations must not contain additional interactive controls. Applications
retain their original label and item nodes, listeners and state.

Structural wrappers and slot forwarding are unsupported. Invalid structure,
duplicate/missing keys, and known interactive label content display a visible
error and suspend tree interaction until repaired. Item `selected`, `expanded`
and `checked` attributes are invalid because the parent owns those states.
Do not author the reserved `data-en-tree-*` server metadata.

`hidden`, `inert` and `aria-hidden="true"` make an item and its entire subtree
unavailable. `hidden="until-found"` is unsupported. Disabled items remain
discoverable through arrows and typeahead, with `aria-disabled="true"`; user
actions cannot select them or change their expansion. Previously opened disabled
branches still permit navigation to their available children.

Branches are derived from available direct children or an explicit `branch` marker. A leaf has no
`aria-expanded`; unavailable children are never presented as loaded, focusable
rows. The tree observes item insertion/removal, reordering, slots, labels, keys
and availability. It does not observe network services or load children itself.

## State and the single change event

The parent `value` is a string property/attribute. Empty means no selection;
there is no automatic selection fallback. `expanded` is a property-only readonly
array of branch keys; it has no JSON attribute. Explicit property assignments
are authoritative, silent, and preserve unknown keys for later items. Collapsing
a branch does not clear the selection or its descendants' expanded keys.

A user selection or expansion dispatches one synchronous, cancelable,
bubbling/composed `en-change` from `en-tree`. Its immutable detail is:

```ts
{
  previous: { value: string, expanded: readonly string[] },
  proposed: { value: string, expanded: readonly string[] },
  reason: 'selection' | 'expansion'
}
```

During dispatch, the public properties expose the tentative snapshot. Calling
`preventDefault()` synchronously restores the still-owned prior state. Any
explicit `value` or `expanded` write, including an equal-value write, and any accepted nested
transaction supersedes the earlier transaction. Mutable structure, keys and
availability are revalidated before acceptance. Replacing `items` during a
pending proposal invalidates that proposal and restores its previous state; it
does not itself supersede state ownership. A separate explicit `value` or
`expanded` write still takes precedence. No second committed event is
emitted. A consumer that needs the settled state can read the parent properties
in a queued microtask after dispatch completes.

```ts
import type { TreeChangeEvent } from '@en-reve/elements/tree.js';
function onTreeChange(event: TreeChangeEvent): void {
  if (event.target !== tree) return;
  if (event.detail.reason === 'selection' && event.detail.proposed.value === 'locked') {
    event.preventDefault();
  }
  queueMicrotask(() => renderDetails(tree.value));
}
tree.addEventListener('en-change', onTreeChange);
```

The component performs no routing, remote command, form submission, or details
panel rendering. Those effects belong to the application after acceptance.

## Focus and keyboard

There is one item in the page Tab sequence. Entering the tree initially uses its
visible selected item, or its first available item. Arrow navigation and
typeahead move focus without selecting; Enter, Space, or a label-row click select.
The chevron changes expansion only. Rejected selection retains focus on the
attempted row. Focus and selection have separate visual treatment.

- Up/Down visit visible items in depth-first order, without wrapping.
- Home/End visit the first/last visible item.
- Logical forward opens a closed branch or visits its first child.
- Logical backward closes an open branch or visits its parent.
- Right is forward in LTR; Left is forward in RTL.
- Typed text searches visible labels; repeated letters cycle matching items.
- Tab and Shift+Tab leave the tree normally. IME composition and browser/application
  Ctrl/Meta/Alt shortcuts are not intercepted, except Control/Command+A in multiple mode.

Explicit external selection does not steal focus. When focus is outside the
tree, an external value update prepares the visible selected item as the next
entry. Collapsing a focused descendant's branch recovers focus to the closest
visible ancestor. Removing an item recovers to a remaining neighbor, or the
empty tree's programmatic focus target. Recovery is limited to focus the tree
still owns; it does not pull focus back from another field. `tree.focus()` and
`item.focus()` delegate to their private semantic targets.

## SSR and hydration

Use registered elements with `@en-reve/ssr` `renderToString` or `renderRequest`.
Set the parent properties in the server template, for example
`.expanded=${['project']}` in Lit. The buffered tree adapter derives the finite
hierarchy from the complete authored light DOM and prepares canonical item
templates with selection, expansion, levels, sibling positions/counts and one
initial item Tab stop. It retains the original light DOM and hydration markers.

Internal snapshot metadata preserves the property-only expanded state for a
standalone DSD consumer. Each item latches its server presentation through its
first hydration render, then reconciles current children and authoritative
application writes. Delayed or reversed element upgrade is supported without
replacing label/item nodes. There is no complete custom keyboard operation
before JavaScript and no library-owned loading/failure fallback.

The semantic treeitem contains its group. Naming references remain inside each
item's shadow root; no cross-shadow `aria-owns`, active-descendant bridge or
Reference Target feature is required. Real browser/assistive-technology
acceptance remains distinct from parsed markup and automated browser evidence.

## Styling and scope

Tree `base` is the hierarchy wrapper. Item Parts are `base` (semantic target),
`option` (painted row), `label`, `indicator`, and `group`. Customize supported
option paint/radius/padding/focus variables and the scoped `--en-space-4`
indentation token. Standard sizing, inherited direction, coarse target floors,
forced colors and reduced-motion focus treatment use the shared library styles.

This version supports single or multiple manual selection and finite authored or data-backed descendants.
Check propagation, lazy-loading protocols,
drag/drop, embedded row actions, routing and horizontal trees are outside this
implementation contract.


## Data-backed and virtualized hierarchies

Set the property-only `items` array to use the data API. Each `TreeDataItem` has
`value`, `label`, optional `disabled`, and optional recursive `children`. Values
must be unique nonempty strings throughout the complete hierarchy. Labels are
plain strings. The setter validates and freezes a schema-only snapshot; replace
the array when adding, removing, reordering, or relabeling records. Invalid data
throws before replacing accepted state. `items = undefined` returns to slot
mode; `items = []` is an explicitly empty data tree. Mixing data items with
light-DOM children displays an error. `virtualize` has no effect on slotted trees.

```ts
import '@en-reve/elements/define/tree.js';
import type { TreeDataItem } from '@en-reve/elements/tree.js';

const items: readonly TreeDataItem[] = [
  { value: 'assets', label: 'Assets', children: [
    { value: 'cover', label: 'Cover image' },
    { value: 'notes', label: 'Production notes' },
  ] },
];
const tree = document.querySelector('en-tree')!;
tree.items = items;
tree.expanded = ['assets'];
tree.virtualize = true;
tree.scrollToKey('notes', { behavior: 'smooth', block: 'center', inline: 'nearest' });
```

Data mode shares the existing `value`, `expanded`, cancelable `en-change`, and
keyboard contract. The full hierarchy remains authoritative when rows are not
mounted. Disabled rows are discoverable but cannot be selected or expanded by
user interaction. Replacing a selected record does not silently choose another;
selection and unknown expansion keys remain application state.

By default all expanded-visible data rows render. Opt into `virtualize` for a
bounded scrollport. An explicit host `block-size`, or a definite flex/grid
allocation, sizes the internal viewport automatically. `--en-tree-viewport-size`
supplies the fallback size (default `24rem`) when the host is unsized; a sized
host takes precedence. `::part(viewport)` supports further application layout
customization. For example, `en-tree[virtualize] { block-size: 30rem; }` needs no
internal part override. Full rendering remains content-sized. Shared
virtual-collection geometry measures each mounted row and its pending child placeholder, preserves key
anchors, and retains focused rows. The first server render contains 20 visible
rows plus the current entry and any ancestors required to preserve hierarchy.
The buffered SSR adapter retains the complete normalized data snapshot for
hydration; virtualization reduces mounted markup, not the data payload.

Each semantic parent contains its native `role="group"`. Windowed descendants
keep their mounted ancestor chain, explicit full-model level and sibling
position/count, and their own accessible name. Presentation-only gaps preserve
scroll extent and are hidden from accessibility. The ancestor chain is not
hidden merely because it is outside the viewport. No cross-shadow `aria-owns`
relationship is used.

`scrollToKey(key, options)` returns whether an expanded-visible data key can be
revealed. The options follow the shared `ScrollIntoViewOptions`-compatible
contract, including `behavior`, `block`, `inline`, and `container`. It never
changes expansion, selection, or focus. A collapsed descendant or unknown key
returns `false`; assign the necessary ancestor keys to `expanded` first.
Keyboard movement and typeahead search the complete expanded-visible model,
mounting their destination before moving focus. Tab remains one composite stop
and leaves the tree normally, including after scrolling far away from focus.

Data-mode Parts are `base`, `viewport`, `item` (semantic target), `option`
(painted row), `indicator`, `label`, and `group`. Avoid external block
margins or gaps on measured rows/groups; use option padding so virtual geometry
can account for the space. Retained focused rows and ancestor scaffolding can
increase the mounted count beyond the viewport window.

Virtualization is opt-in because screen-reader browsing and browser find operate
on mounted content. Offer full rendering for finite data when a user's reading
workflow benefits from it. Automated accessibility-tree checks establish markup
and ordering baselines, not proof of VoiceOver or other assistive-technology
behavior; manual review remains necessary. Lazy branch request coordination is described below; remote querying and
unbounded hierarchy protocols remain application concerns.

## Multiple selection

Add `multiple` before setting property-only `values`. The immutable array contains
selected keys; `value` is its first key (or empty). Writing `value` replaces the set.
Switching to single mode retains only the first key. Single-mode event payloads
remain `{value, expanded}`; multiple-mode snapshots additionally carry `values`.
All assignments are silent and authoritative, including equal writes during a
cancelable `en-change`. Mode writes also supersede pending transactions.

Plain click selects only the clicked row. Command/Ctrl+click toggles that row
without changing other selected keys. Enter and Space remain modifier-free keyboard
toggles. Shift+click, Shift+Space and Shift+Up/Down/Home/End replace the selection
with the inclusive range of enabled visible rows. The last ordinary selection is
the fixed range anchor, so extending, shortening or reversing a range does not
accumulate old items. For an initial or changed application selection, the last
available selected key becomes the anchor. Equal application echoes preserve the
current anchor. If no selected anchor is available, Shift+click selects only its
target and Shift+arrows start from the focused row. Canceled changes do not move
the anchor. Disclosure only changes expansion.

Control/Command+A selects all enabled visible rows, or deselects those rows when
all are already selected. Collapse, toggles and select-all retain hidden, disabled
and unknown selections; plain click and Shift ranges replace the entire set.
There is no implicit descendant selection or checkbox propagation. Disabled items
remain discoverable but cannot be selected by user interaction.

Both authored and data renderers use the same model; virtual range/all selection
uses the complete expanded-visible hierarchy, not just mounted rows. SSR emits
`aria-multiselectable="true"` and preserves property-only selected keys through
hydration. See the tree-data demo for both authored and virtual multiple selection.

## Lazy data branches

A data item with `lazy: true` is an expandable branch before any children exist.
Use `branch: true` for a loaded folder that should remain expandable when empty.
Provide a property-only `loadChildren({key, item, requestId, signal})` callback
returning an array of children or a promise for it. Expanding an available branch
starts one request; rendering a virtual window never starts duplicate requests.
The callback owns transport, authentication, caching and detailed error policy.

```ts
tree.items = [{ value: 'drafts', label: 'Drafts', lazy: true }];
tree.loadChildren = async ({ key, signal }) => app.fetchChildren(key, { signal });
tree.expanded = ['drafts'];
tree.addEventListener('en-load-state-change', event => console.log(event.detail));
// {key, status: 'idle'|'loading'|'loaded'|'empty'|'error', requestId}
await tree.loadBranch('drafts'); // retry or refresh an expanded, visible folder
```

`getBranchState(key)` returns the immutable state above without `key`; unknown
keys return idle/requestId 0. `loadBranch` resolves true only after a valid result
commits; pending/unavailable requests or failures resolve false. Rejections show
plain retry guidance rather than exposing service errors. The focused failed
branch offers a Retry button below the tree. Loading rows expose `aria-busy`;
state descriptions and a polite status region explain outcomes. The component
does not manufacture selectable skeleton children or guess an unloaded count.

Loaded children are validated against the entire tree before replacing that
branch; duplicate/invalid keys fail atomically. Concurrent branch results merge
into the latest hierarchy. Success clears `lazy`, retains `branch`, and preserves
selected and expanded keys. Empty results remain folders. Refreshing an expanded
loaded folder is explicit; current children remain visible until replacement.

Collapse (including an ancestor), disconnect, changing the loader, or an explicit
`items` assignment aborts pending work. Results from an ignored abort cannot
revive it. Reopening a canceled lazy folder starts a fresh request; failures wait
for retry. Persist a completed `tree.items` snapshot from `en-load-state-change` if your app
needs it. Avoid echoing the old `items` array on every selection event: an explicit
assignment is authoritative replacement and cancels pending loads.

Authored trees retain rich DOM ownership: `branch` on `en-tree-item` marks an empty
folder; observe the parent's accepted expansion and append your own child nodes.
The data loader does not convert plain records into authored/slotted content.
Server rendering preserves `lazy`/`branch` and expansion but never runs a loader;
requests begin after browser initialization when a callback is available.

## Moving items

Opt in with `reorderable`. Drag only the row's grip, leaving normal touch scrolling
and row selection available. The top/bottom quarter of a target row means
before/after; its center means inside. An insertion indicator shows a valid target.
Escape, pointer cancellation, or release without a valid destination cancels.
A virtual viewport scrolls near its edges during dragging. Pointer targets must
be mounted; the equivalent Move interface can address all known items.

Select items and activate **Move selected items**, or press **Alt+M** on a focused
row. Choose a destination and Before/After/Inside folder, then Move items or Cancel
move. Native select controls support keyboard, touch and screen-reader operation.
The interface is outside `role=tree`, so row labels contain no nested tab stops.

```ts
tree.reorderable = true;
tree.openMove(['cover', 'poster']);
tree.moveItems(['cover', 'poster'], 'archive', 'inside');
tree.addEventListener('en-reorder', event => {
  // Immutable {keys, target, position, previous, proposed} data snapshots.
  // This event precedes mutation (unlike tentative selection en-change).
  if (!canMove(event.detail)) event.preventDefault();
});
```

`moveItems` returns true for an accepted structural commit. The synchronous,
bubbling/composed `en-reorder` event is cancelable. Assigning `items` during the
event, replacing authored nodes, or changing authored hierarchy supersedes the
default commit. Async persistence belongs to the app: synchronously veto if
server approval is required, then apply your authoritative hierarchy when ready.
Selection's `en-change` contract remains unchanged. Programmatic moves also
require `reorderable` and a connected, available tree.

Moves preserve selected keys, the source preorder, and rich authored label nodes.
Selecting a parent and descendant moves the parent once. Destination ancestors
are expanded and the first moved root receives focus; completion is announced.
Cycles, unknown keys, no-ops, disabled sources/ancestors/destinations and insertion
inside an unloaded folder are rejected. Load a folder before moving inside it;
before/after an unloaded sibling is allowed. Moves cancel pending data loads,
as with any authoritative structural edit. This slice does not infer permissions
or remote children and does not implement cross-tree transfers.

Style `::part(drag-handle)`, `::part(move-controls)`, `::part(move-status)`,
`::part(branch-status)` and `::part(branch-controls)` along with existing row parts.
Authored drag grips are on `en-tree-item::part(drag-handle)`.
Physical touch and assistive-technology review remains separate from automated
pointer, keyboard and accessibility-tree checks.

Reorderable trees support mouse dragging from the row or grip; touch uses the grip so row swipes still scroll. Disclosure and interactive label content retain their own behavior. The floating `drag-preview` Part names the dragged item (or count) and drop destination. Folder centers accept inside drops, folder edges accept before/after, and file upper/lower halves accept before/after. A completed or canceled drag never changes selection through a trailing click. No move controls appear by default. Alt+M or openMove(keys) opens the alternative Move controls on demand.

While an expanded branch loads, `branch-loading` presents an indented child placeholder. It is not a selectable tree item or a drop target and is hidden from the accessibility tree; the parent retains `aria-busy` and its description, and the existing live status announces loading. The placeholder is included in virtual row measurements and disappears on completion, failure or collapse.

The `drop-indicator` Part is a straight line at the destination sibling gap. Equivalent after-previous and before-next targets share its position and a “Between … and …” label, excluding moving items from the neighbor names. Start/end gaps have explicit labels. Expanded subtrees keep their extent; the line follows sibling depth. Inside-folder drops retain a separate outline. Programmatic before/after/inside API values are unchanged.

`en-load-state-change` is a noncancelable status notification, not a transport request.
The deprecated `en-load` alias remains available; subscribe to one name. A listener
that cancels/replaces a branch during the new status event suppresses an obsolete
legacy notification. `loadBranch()` resolves completion; `loadChildren` owns transport.
